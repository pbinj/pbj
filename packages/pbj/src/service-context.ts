import { ContextI } from "./context-types.js";
import { CKey, RegistryType, Returns, ServiceInitI } from "./types.js";
import { PBinJAsyncError, PBinJError } from "./errors.js";
import { serviceSymbol } from "./symbols.js";
import { hasA, isFn, isPrimitive } from "@pbinj/pbj-guards";
import { asString, isPBinJKey } from "./pbjKey.js";
import { ServiceDescriptor } from "./service-descriptor.js";
import { Logger } from "./logger.js";
import { keyOf } from "./util.js";
import { newProxy } from "./newProxy.js";

interface ErrorMsg {
  message: string;
}

export class ServiceContext<TRegistry extends RegistryType, T> {
  static #dependencies = new Set<CKey>();
  private _proxy?: Returns<T>;
  private error: ErrorMsg | undefined;
  private onDestroy?: () => void;

  constructor(
    private context: ContextI<TRegistry>,
    public description: ServiceDescriptor<TRegistry, T>,
    private logger = new Logger(),
  ) {
    this.onDestroy = description.onChange.subscribe(() => {
      this.invalidate();
    });
  }
  get dependencies() {
    return this.description.dependencies;
  }
  get key() {
    return keyOf(this.description[serviceSymbol]);
  }

  /**
   * Invokes the service and returns the value.  This is where the main resolution happens.
   *
   * @returns
   */
  invoke = (): T => {
    if (this.description.interceptors?.length) {
      const invoke = this.description.interceptors?.reduceRight(
        (next: () => Returns<T>, interceptor) => {
          return () => interceptor.call(this, next);
        },
        () => this._invoke(),
      );
      return invoke.call(this);
    }

    return this._invoke();
  };
  _invoked = false;
  _instance?: Returns<T>;
  initializer?: ServiceInitI;

  set invoked(v: boolean) {
    this._invoked = v;
    this.description.invalid = !v;
  }
  get invoked() {
    return this._invoked;
  }
  get initialized() {
    return this.invoked ? (this.initializer?.initialized ?? true) : false;
  }

  public invalidate() {

    this.invoked = false;
    this._instance = undefined;
    this.initializer?.invalidate();
    if (hasA(this.context, "invalidate", isFn)) {
      this.context.invalidate(this.key, this);
    }
  }
  get invalid() {
    return this.description.invalid;
  }
  set invalid(v: boolean) {
    this.description.invalid = v;
  }
  private _promise?: Promise<T> & { resolved?: boolean };
  _invoke = (): Returns<T> => {
    if (this._promise) {
      throw new PBinJAsyncError(this.description[serviceSymbol], this._promise);
    }
    if (!this.description.invokable) {
      this.description.invalid = false;
      return this.description.service as Returns<T>;
    }
    if (!this.invalid && this.invoked && this.description.cacheable) {
      return this._instance as Returns<T>;
    }
    if (!isFn(this.description.service)) {
      this.logger.error(`service '{service}' is not a function`, {
        service: asString(this.description.service as any),
      });
      throw new PBinJError(
        `service '${String(this.description.service)}' is not a function and is not configured as a value, to configure as a value set invokable to false on the service description`,
      );
    }
    let resp;
    const args = this.description.args.map((v) => {
      if (isPBinJKey(v)) {
        //If we don't return a proxy, it could cause a circular dependency.
        // It would be nice if pbj was smart enough to know when it could and couldn't return a proxy,
        // but that's a bit of a reach.
        return this.context.pbj(v);
      }
      return v;
    });
    if (this.description.factory) {
      const val = this.description.service(...args);
      this.addDependency(...ServiceContext.#dependencies);
      if (val instanceof Promise) {
        this._promise = val;
        this.logger.debug("waiting for promise");
        this._promise.then((v) => {
          this.logger.debug("resolved promise");
          this._promise = undefined;
          this.invalid = false;
          this.invoked = true;
          this._instance = v as any;
        });
        throw new PBinJAsyncError(this.description[serviceSymbol], val);
      }
      resp = val;
    } else {
      try {
        resp = new (this.description.service as any)(...args);
        if (
          this.description.initializer &&
          hasA(resp, this.description.initializer, isFn)
        ) {
          resp[this.description.initializer]();
        }

        if (this.error) {
          this.error = undefined;
          this.logger.info("service has recovered");
        }
      } catch (e) {
        const obj = { message: String(e) };
        this.logger.error("error invoking service {message}", obj);
        this.invalidate();
        this.error = obj;
        throw e;
      }
    }

    this.addDependency(...ServiceContext.#dependencies);
    this.invoked = true;
    this.description.primitive = isPrimitive(resp);
    if (resp == null && !this.description.optional) {
      throw new PBinJError(
        `service '${String(this.description[serviceSymbol])}' is not optional and returned null`,
      );
    }
    if (this.description.cacheable) {
      this._instance = resp;
    }

    return resp;
  };
  addDependency(...keys: CKey[]) {
    if (keys.length) {
      const set = (this.description.dependencies ??= new Set<CKey>());
      keys.forEach((v) => set.add(v));
    }
    return this;
  }
  get proxy(): Returns<T> {
    const key = keyOf(this.description[serviceSymbol]);
    ServiceContext.#dependencies.add(key);
    return (this._proxy ??= newProxy(this));
  }
  toJSON() {
    return {
      ...this.description.toJSON(),
      dependencies: Array.from(this.dependencies ?? [], asString as any),
      error: this.error,
      invoked: this.invoked,
      invalid: this.invalid,
      primitive: this.description.primitive,
      instance: this._instance,
    };
  }
}

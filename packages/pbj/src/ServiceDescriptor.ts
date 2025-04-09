import { keyOf } from "./util.js";
import { has, isConstructor, isFn, isPrimitive } from "@pbinj/pbj-guards";
import { newProxy } from "./newProxy.js";
import type { Registry } from "./registry.js";
import { proxyKey, serviceSymbol } from "./symbols.js";
import { PBinJError } from "./errors.js";
import type {
  Args,
  CKey,
  Constructor,
  Fn,
  OfA,
  PBinJKey,
  PBinJKeyType,
  RegistryType,
  Returns,
  ServiceDescriptorI,
  ValueOf,
} from "./types.js";
import { asString } from "./pbjKey.js";
import { PBinJAsyncError } from "./errors.js";
import { Logger } from "./logger.js";

const EMPTY = [] as const;

/**
 * Class to handle initialization of services
 */
class ServiceInit<T> {
  constructor(
    private key: keyof T & string,
    private scope: T,
    public initialized = false
  ) {}

  /**
   * Invoke the initialization method on the service
   */
  invoke() {
    if (!this.key || this.initialized) {
      return;
    }

    if (typeof this.scope[this.key] !== 'function') {
      throw new PBinJError(`Initialization method '${String(this.key)}' is not a function`);
    }

    try {
      // Call the initialization method
      const result = (this.scope[this.key] as unknown as Function).call(this.scope);
      this.initialized = true;
      return result;
    } catch (e) {
      throw new PBinJError(`Error initializing service: ${String(e)}`);
    }
  }
}

export class ServiceDescriptor<
  TRegistry extends RegistryType,
  T extends Constructor | Fn | unknown,
    V extends ValueOf<TRegistry, T> = ValueOf<TRegistry, T>,
> implements ServiceDescriptorI<TRegistry, T>
{
  static #dependencies = new Set<CKey>();

  static value<
    T extends keyof TRegistry & symbol,
    TRegistry extends RegistryType = Registry,
  >(key: T, service: TRegistry[T]) {
    return new ServiceDescriptor(key, service, EMPTY as any, false, false);
  }

  static singleton<T extends Constructor | Fn>(service: T, ...args: Args<T>) {
    return new ServiceDescriptor(service, service, args, true);
  }

  static factory<T extends Constructor | Fn>(service: T, ...args: Args<T>) {
    return new ServiceDescriptor(service, service, args, false);
  }

  //  public readonly [serviceSymbol]: PBinJKey<TRegistry>;
  dependencies?: Set<CKey>;
  private _instance?: Returns<T>;
  public invoked = false;
  private _cacheable = true;
  private _service?: OfA<T>;
  private _args: Args<T> = [] as any;
  private _proxy?: Returns<T>;
  private _factory = false;
  private _isListOf = false;
  private interceptors?: InterceptFn<Returns<T>>[];
  public initialize?: keyof V & string;
  public primitive?: boolean;
  public invalid = false;
  public optional = true;
  public error?: { message: string };

  public tags: PBinJKeyType<T>[] = [];
  private _name: string | undefined;
  private _init?: ServiceInit<V>;
  [serviceSymbol]: PBinJKey<TRegistry>;
  constructor(
    key: PBinJKey<TRegistry>,
    service: T | undefined = undefined,
    args: Args<T> = [] as any,
    cacheable = true,
    public invokable = true,
    public description?: string,
    private onChange?: () => void,
    private logger = new Logger(),
  ) {
    this[serviceSymbol] = key;
    this.args = args as Args<T>;
    this._cacheable = cacheable;
    if (!invokable) {
      //So if something is not invokable, it should never be invoked. Which is important.
      this.invoked = false;
    }
    this.service = service;
  }

  get name() {
    return this._name ?? asString(this[serviceSymbol]);
  }

  set name(name: string | undefined) {
    this.logger.debug("renamed service {from}->{to}", {
      to: name,
      from: this._name,
    });
    this._name = name;
  }

  get proxy(): Returns<T> {
    const key = keyOf(this[serviceSymbol]);
    ServiceDescriptor.#dependencies.add(key);
    return (this._proxy ??= newProxy(key, this));
  }

  set cacheable(_cacheable: boolean) {
    if (this._cacheable === _cacheable) {
      return;
    }
    this.logger.debug("changed cacheable {from} -> {to}", {
      to: _cacheable,
      from: this._cacheable,
    });
    this.invalidate();
    this._cacheable = _cacheable;
  }

  get cacheable() {
    return this._cacheable;
  }

  set service(_service: OfA<T> | undefined) {
    if (this._service === _service) {
      return;
    }
    if (this.invoked) {
      this.invalid = true;
    }
    this.invalidate();
    this.invokable = isFn(_service);
    this._service = _service;
    this._factory = this.invokable && !isConstructor(_service as Fn<T>);
    this.logger.debug("changed service");
  }

  get service() {
    return this._service as OfA<T>;
  }

  get args() {
    return this._args!;
  }

  set args(newArgs: Args<T>) {
    /**
     * If the args are the same, we don't need to invalidate.  Also
     * if the value hasn't been invoked, we don't need to invalidate.
     */
    //if (newArgs === this._args || (this._args?.length === newArgs.length &&
    // this._args.every((v, i) => v === newArgs[i] && !isPBinJ(v)))) {
    // return;
    //}
    if (this.invoked) {
      this.invalid = true;
    }
    this.invalidate();
    newArgs.forEach((arg) => {
      if (has(arg, proxyKey)) {
        this.addDependency(arg[proxyKey] as CKey);
      }
    });
    this._args = newArgs;
  }
  /**
   * Set the args to be used with the service.   These can be other pbinj's, or any other value.
   * @param args
   * @returns
   */
  withArgs(...args: Args<T>) {
    this.args = args;
    this.invalidate();
    return this;
  }
  /**
   * Change the service implementation.
   * @param service
   * @returns
   */
  withService(service: T) {
    this.service = service;
    this.invalidate();
    return this;
  }
  /**
   * You can turn off response caching by setting this to false.
   * This is useful for things that can not be cached.   Any pbj depending on a non-cacheable,
   * will be not cached.
   *
   * @param cacheable
   * @returns
   */
  withCacheable(cacheable?: boolean) {
    this.cacheable = cacheable ?? !this.cacheable;
    this.invalidate();
    return this;
  }
  withInvokable(invokable?: boolean) {
    this.invokable = invokable ?? !this.invokable;
    this.invalidate();
    return this;
  }
  /**
   * Sets the service as optional.
   * This will not throw an error if the service is not found. The proxy however
   * will continue to exist, just any access to it will return undefined.
   *
   * You can use `isNullish` from the guards to check if the service if a proxy is actually
   * nullish.
   *
   * @param optional
   * @returns
   */
  withOptional(optional?: boolean) {
    this.optional = optional ?? !this.optional;
    this.invalidate();
    return this;
  }
  /**
   * This is used to set a value.  This is useful for things like constants.  This will not be invoked.
   * @param value
   * @returns
   */
  withValue(value: ValueOf<TRegistry, T>) {
    this.service = value;
    this.invokable = false;
    this.invalidate();
    return this;
  }
  /**
   * Tags are used to group services.  This is useful for finding all services of a certain type.
   * @param tags
   * @returns
   */
  withTags(...tags: PBinJKeyType<any>[]) {
    this.tags = tags;
    return this;
  }
  /**
   * A description of the service.  This is useful for debugging.
   * @param description
   * @returns
   */
  withDescription(description: string) {
    this.description = description;
    return this;
  }
  /**
   * Interceptors allow you to intercept the invocation of a service.  This is useful for things like logging, or
   * metrics.
   * @param interceptors
   * @returns
   */
  withInterceptors(...interceptors: InterceptFn<Returns<T>>[]) {
    this.interceptors = [...(this.interceptors ?? []), ...interceptors];
    return this;
  }

  /**
   * Override the name of the service.  This is useful for debugging.
   * @param name
   */
  withName(name: string) {
    this._name = name;
    return this;
  }
  withInitialize(method:keyof V & string ) {
    this.initialize = method;
    return this;
  }
  /**
   * Check to see if the current service has a dependency.
   * @param key
   * @returns
   */
  hasDependency(key: CKey) {
    if (this._isListOf) {
      if (this._cacheable && !this.invalid) {
        return this._instance?.map(proxyKey).includes(key);
      }
      return this.invoke()?.map(proxyKey).includes(key);
    }
    return this.dependencies?.has(key) ?? false;
  }
  /**
   * Add a dependency to the service.  This is used to track dependencies.
   * @param keys
   * @returns
   */
  addDependency(...keys: CKey[]) {
    if (keys.length) {
      const set = (this.dependencies ??= new Set<CKey>());
      keys.forEach((v) => set.add(v));
    }
    return this;
  }
  hasTag(tag: PBinJKeyType<any>) {
    return this.tags.includes(tag);
  }
  invalidate = () => {
    if (!this.invoked ) {
      return;
    }
    this.logger.debug("invalidating service");
    this.invalid = true;
    this.invoked = false;
    this._instance = undefined;
    this.onChange?.();
  };
  /**
   * Invokes the service and returns the value.  This is where the main resolution happens.
   *
   * @returns
   */
  invoke = (): Returns<T> => {
    if (this.interceptors?.length) {
      const invoke = this.interceptors?.reduceRight(
        (next: () => Returns<T>, interceptor) => {
          return () => interceptor.call(this, next);
        },
        this._invoke,
      );
      return invoke.call(this);
    }

    const ret = this._invoke();

    // Setup initialization if needed
    if (this.initialize && has(ret, this.initialize)) {
      this._init = new ServiceInit<V>(this.initialize, ret as unknown as V);
    }

    return ret;
  };

  private _promise?: Promise<T> & { resolved?: boolean };
  _invoke = (): Returns<T> => {
    if (this._promise) {
      throw new PBinJAsyncError(this[serviceSymbol], this._promise);
    }
    if (!this.invokable) {
      return this.service as Returns<T>;
    }
    if (!this.invalid && this.invoked && this.cacheable) {
      return this._instance as Returns<T>;
    }
    if (!isFn(this.service)) {
      this.logger.error(`service '{service}' is not a function`, {
        service: asString(this.service as any),
      });
      throw new PBinJError(
        `service '${String(this.service)}' is not a function and is not configured as a value, to configure as a value set invokable to false on the service description`,
      );
    }
    ServiceDescriptor.#dependencies.clear();
    let resp;
    if (this._factory) {
      const val = this.service(...this.args);
      this.addDependency(...ServiceDescriptor.#dependencies);

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
        throw new PBinJAsyncError(this[serviceSymbol], val);
      }
      resp = val;
    } else {
      try {
        resp = new (this.service as any)(...this.args);
        if (this.error) {
          this.logger.info("service has recovered");
        }
        this.error = undefined;
      } catch (e) {
        const obj = { message: String(e) };
        this.logger.error("error invoking service {message}", obj);
        this.invalidate();
        this.error = obj;
        throw e;
      }
    }

    this.addDependency(...ServiceDescriptor.#dependencies);
    this.invoked = true;
    this.primitive = isPrimitive(resp);
    if (resp == null && !this.optional) {
      throw new PBinJError(
        `service '${String(this[serviceSymbol])}' is not optional and returned null`,
      );
    }
    if (this.cacheable) {
      this._instance = resp;
    }

    return resp;
  };
  asArray() {
    this._isListOf = true;
    return this;
  }
  toJSON() {
    return {
      name: this.name,
      description: this.description,
      cacheable: this.cacheable,
      invokable: this.invokable,
      optional: this.optional,
      tags: this.tags.map(asString),
      invoked: this.invoked,
      invalid: this.invalid,
      primitive: this.primitive,
      listOf: this._isListOf,
      error: this.error,
      dependencies: Array.from(this.dependencies ?? [], asString as any),
      args: this.args?.map(asString as any),
    };
  }
}
/**
 * The interceptor function, allows you to intercept the invocation of a service.  The
 * invocation may be a previous interceptor.
 */
type InterceptFn<T> = (invoke: () => T) => T;

export type ServiceDescriptorListener = (
  service: ServiceDescriptor<any, any>,
) => void;

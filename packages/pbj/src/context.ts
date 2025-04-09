import { type Registry } from "./registry.js";
import { isConstructor, isFn, isSymbol } from "@pbinj/pbj-guards";
import { PBinJError } from "./errors.js";
import type {
  Constructor,
  ValueOf,
  Fn,
  VisitFn,
  PBinJKey,
  CKey,
  RegistryType,
  ServiceArgs,
  PBinJKeyType,
} from "./types.js";
import {
  ServiceDescriptor,
  type ServiceDescriptorListener,
} from "./ServiceDescriptor.js";
import { filterMap, isInherited, keyOf } from "./util.js";
import { pbjKey, isPBinJKey, asString } from "./pbjKey.js";
import { isAsyncError } from "./errors.js";
import { Logger } from "./logger.js";

export interface Context<TRegistry extends RegistryType = Registry> {
  register<TKey extends PBinJKey<TRegistry>>(
    typeKey: TKey,
    ...args: ServiceArgs<TKey, TRegistry> | []
  ): ServiceDescriptor<TRegistry, ValueOf<TRegistry, TKey>>;
  resolve<TKey extends PBinJKey<TRegistry>>(
    typeKey: TKey,
    ...args: ServiceArgs<TKey, TRegistry> | []
  ): ValueOf<TRegistry, TKey>;
  newContext<TTRegistry extends TRegistry = TRegistry>(): Context<TTRegistry>;
  pbj<T extends PBinJKey<TRegistry>>(service: T): ValueOf<TRegistry, T>;
  pbj(service: unknown): unknown;
  visit(fn: VisitFn<TRegistry, any>): void;
  visit<T extends PBinJKey<TRegistry>>(
    service: T,
    fn: VisitFn<TRegistry, T>,
  ): void;
  onServiceAdded(
    fn: ServiceDescriptorListener,
    noInitial?: boolean,
  ): () => void;

  resolveAsync<T extends PBinJKey<TRegistry>>(
    typeKey: T,
    ...args: ServiceArgs<T, TRegistry> | []
  ): Promise<ValueOf<TRegistry, T>>;
}
export class Context<TRegistry extends RegistryType = Registry>
  implements Context<TRegistry>
{
  //this thing is used to keep track of dependencies.
  protected map = new Map<CKey, ServiceDescriptor<TRegistry, any>>();
  private listeners: ServiceDescriptorListener[] = [];
  // Track services that have been initialized
  private initializedServices = new Set<CKey>();
  // Track services that are pending initialization
  private pendingInitialization = new Set<CKey>();
  public logger = new Logger();
  constructor(private readonly parent?: Context<any>) {}

  public onServiceAdded(
    fn: ServiceDescriptorListener,
    initialize = true,
  ): () => void {
    this.logger.info("onServiceAdded: listener added");
    if (initialize) {
      for (const service of this.map.values()) {
        for (const fn of this.listeners) {
          fn(service);
        }
      }
    }
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((v) => v !== fn);
    };
  }

  pbj<T extends PBinJKey<TRegistry>>(service: T): ValueOf<TRegistry, T>;
  pbj(service: unknown): unknown {
    return (this.get(keyOf(service as any)) ?? this.register(service as any))
      .proxy;
  }

  /**
   * Starting at a service, apply a function to all dependencies.  This is
   * useful if you want to destroy all dependencies.   This also could be
   * used for trigger init methods.  It will only visit each dependency once.
   *
   *
   * ```typescript
   *   context.visit(EmailService, (v)=>{
   *     v.destroy?.();
   *     return removeSymbol;
   *   });
   *
   * ```
   *
   * @param fn
   */
  visit(fn: VisitFn<TRegistry, any>): void;
  visit<T extends PBinJKey<TRegistry>>(
    service: T,
    fn: VisitFn<TRegistry, T>,
  ): void;
  visit<T extends PBinJKey<TRegistry>>(
    service: T | VisitFn<TRegistry, any>,
    fn?: VisitFn<TRegistry, T> | undefined,
  ) {
    const key = keyOf(service);
    if (isFn(fn)) {
      this._visit(key, fn as any);
    } else if (isFn(service)) {
      for (const key of this.map.keys()) {
        this._visit(key, service as VisitFn<TRegistry, any>);
      }
    } else {
      throw new PBinJError("invalid arguments");
    }
  }

  private _visit(
    service: CKey,
    fn: VisitFn<TRegistry, any>,
    seen = new Set<CKey>(),
  ) {
    if (seen.size === seen.add(service).size) {
      return;
    }
    const ctx = this.get(service);
    if (ctx) {
      if (ctx.dependencies?.size) {
        for (const dep of ctx.dependencies) {
          this._visit(dep, fn, seen);
        }
      }
      fn(ctx);
    }
  }

  get(key: CKey): ServiceDescriptor<TRegistry, any> | undefined {
    return this.map.get(key) ?? this.parent?.get(key);
  }

  private invalidate(
    key: CKey,
    ctx?: ServiceDescriptor<TRegistry, any>,
    seen = new Set<CKey>(),
  ) {
    if (seen.size === seen.add(key).size) {
      return;
    }
    ctx = ctx ?? this.map.get(key);

    if (!ctx) {
      //I don't  think this should happen, but what do I know.
      this.logger.warn(`invalidate called on unknown key ${String(key)}`);
      return;
    }
    ctx.invalidate();
    this.logger.warn("invalidating service {key}", { key: asString(key) });
    for (const [k, v] of this.map) {
      if (v.hasDependency(key)) {
        this.invalidate(k, v, seen);
      }
    }
    //No longer initialized (it may have changed from initialized to not initialized)
    this.initializedServices.delete(key);
    if (ctx.initializer) {
      this.pendingInitialization.add(key);
    }
  }

  register<TKey extends PBinJKey<TRegistry>>(
    serviceKey: TKey,
    ...origArgs: ServiceArgs<TKey, TRegistry> | []
  ): ServiceDescriptor<TRegistry, ValueOf<TRegistry, TKey>> {
    const key = keyOf(serviceKey);

    let service: Constructor | Fn | unknown = serviceKey;
    let args: any[] = [...origArgs];

    if (isSymbol(serviceKey)) {
      service = args.shift();
    }

    let inst = this.map.get(key);

    if (inst) {
      if (origArgs?.length) {
        this.logger.info("modifying registered service {key}", {
          key: asString(serviceKey),
        });

        inst.args = args;
        inst.service = service;
      }
      if (inst.invalid) {
        this.invalidate(key);
      }
      return inst;
    }
    const newInst = new ServiceDescriptor<TRegistry, ValueOf<TRegistry, TKey>>(
      serviceKey,
      service as any,
      args as any,
      true,
      isFn(service),
      undefined,
      () => {
        this.invalidate(key);
      },
      this.logger.createChild(asString(serviceKey)!),
    );

    this.map.set(key, newInst);
    void this.notifyAdd(newInst);
    this.logger.info("registering service with key {key}", {
      key: asString(serviceKey),
    });
    return newInst;
  }
  private notifyAdd(inst: ServiceDescriptor<TRegistry, any>) {
    return new Promise<void>((resolve) => {
      setTimeout(
        (listeners) => {
          listeners.forEach((fn) => fn(inst));
          resolve();
        },
        0,
        this.listeners,
      );
    });
  }
  resolve<TKey extends PBinJKey<TRegistry>>(
    typeKey: TKey,
    ...args: ServiceArgs<TKey, TRegistry> | []
  ): ValueOf<TRegistry, TKey> {
    const service = this.register(typeKey, ...args);
    const result = service.invoke() as any;

    // If the service has an initialization method, initialize it
    if (service.initializer && result) {
      const key = keyOf(typeKey);

      // Initialize the service and its dependencies
      this._initializeService(key, new Set());

      // For circular dependencies, we need to ensure all services are fully initialized
      // This is a second pass to make sure everything is properly initialized
      this._ensureAllServicesInitialized();
    }

    return result;
  }

  /**
   * Ensure all services with initialization methods are initialized
   * This is needed for circular dependencies
   */
  private _ensureAllServicesInitialized(): void {
    // Get all services with initialization methods
    const servicesToInitialize = Array.from(this.map.entries()).filter(
      ([key, service]) =>
        service.initializer && !this.initializedServices.has(key),
    );

    // Initialize each service
    for (const [key] of servicesToInitialize) {
      this._initializeService(key, new Set());
    }

    // For circular dependencies, we need to ensure all services can access each other
    // This is done by resolving all services again after initialization
    for (const [key, service] of this.map.entries()) {
      if (service.initializer && this.initializedServices.has(key)) {
        // Re-invoke the service to ensure it has access to all dependencies
        service.invoke();
      }
    }
  }

  newContext<TTRegistry extends TRegistry = TRegistry>() {
    this.logger.info("new context");

    return new Context<TTRegistry>(this);
  }

  /**
   * Initialize a service and notify any services waiting on it
   * @param key The service key
   * @param visitedKeys Set of keys that have been visited (to detect circular dependencies)
   */
  private _initializeService(
    key: CKey,
    visitedKeys: Set<CKey> = new Set(),
  ): void {
    // Skip if already initialized
    if (this.initializedServices.has(key)) {
      return;
    }

    const service = this.get(key);
    if (!service) {
      this.logger.warn("Cannot initialize service {key}: not found", {
        key: asString(key),
      });
      return;
    }

    // Skip if no initialization method
    if (!service.initializer) {
      this.initializedServices.add(key);
      this._notifyDependentServices(key);
      return;
    }

    // If we've already visited this key, we have a circular dependency
    // mark it as initialized to break the cycle, but don't return yet,
    // we need to continue to ensure the service is properly initialized
    if (visitedKeys.size === visitedKeys.add(key).size) {
      this.logger.debug(
        "Detected circular dependency for {key}, marking as initialized",
        { key: asString(key) },
      );
      this.initializedServices.add(key);

      // For circular dependencies, we need to ensure all dependencies are marked as initialized
      // before calling the initialization method

      // Mark all dependencies as initialized
      const dependencies = service.dependencies || new Set<CKey>();
      for (const depKey of dependencies) {
        if (!this.initializedServices.has(depKey)) {
          this.initializedServices.add(depKey);
          this.logger.debug(
            "Marking dependency {depKey} as initialized due to circular dependency",
            {
              depKey: asString(depKey),
            },
          );
        }
      }
    }
    try {
      // Get the instance of the service
      service.initializer?.invoke(service.invoke());
    } catch (e) {
      this.logger.error("Error initializing service {key}: {error}", {
        key: asString(key),
        error: e,
      });
    }
    this.logger.debug("Marked service as initialized {key}", {
      key: asString(key),
    });
    this.initializedServices.add(key);
    // Notify services waiting on this one
    this._notifyDependentServices(key);
  }

  /**
   * Notify services that were waiting for a dependency to be initialized
   * @param key The dependency key that was just initialized
   */
  private _notifyDependentServices(key: CKey): void {
    // Remove this dependency from the pending list
    this.pendingInitialization.delete(key);

    // Check each waiting service to see if all its dependencies are now initialized
    for (const waitingKey of this.get(key)?.dependencies || []) {
      const dependencies = this.get(waitingKey)?.dependencies;
      if (!dependencies) continue;
      if (
        Array.prototype.every.call(dependencies, (depKey) =>
          this.initializedServices.has(depKey),
        )
      ) {
        // All dependencies initialized, so initialize this service
        this._initializeService(waitingKey);
      }
    }
  }

  scoped<R, TKey extends PBinJKeyType | (keyof TRegistry & symbol)>(
    _key: TKey,
  ): (next: () => R, ...args: ServiceArgs<TKey, TRegistry>) => R {
    this.logger.error("scoped not enabled");
    throw new PBinJError(
      "async not enabled, please add 'import \"@pbinj/pbj/scope\";' to your module to enable async support",
    );
  }
  protected *_listOf<T extends PBinJKey<TRegistry>>(
    service: T,
  ): Generator<ValueOf<TRegistry, T>> {
    const sym = isPBinJKey(service);

    if (sym) {
      yield* filterMap(this.map.values(), (v) =>
        v.tags.includes(service as any) ? v.proxy : undefined,
      );
    } else if (isFn(service)) {
      if (isConstructor(service)) {
        yield* filterMap(this.map.values(), (v) =>
          isInherited(v.service, service) ? v.proxy : undefined,
        );
      } else {
        yield* filterMap(this.map.values(), (v) =>
          v.service && v.service === service ? v.proxy : undefined,
        );
      }
    }
    if (this.parent) yield* this.parent._listOf(service);
  }

  /**
   * Tries to find all instances of a service.  This is useful if you want to find all instances of a service. Or a tag
   * of service.   tags should be PBinJKeyType that are used to tag services.  Note this returns a proxy.  So it should
   * recall if a dependent value changes.
   *
   * The performance currently should be not great, but all we really need is a mechanism to only invalidate the list
   * when a dependency changes.  This is a future optimization.  That should make it very fast.   So far I have been
   * hesitant to add 'events' to the system, however this is a good way to do it.
   *
   *
   *
   * @param service
   * @returns
   */
  listOf<T extends PBinJKey<TRegistry>>(
    service: T,
  ): Array<ValueOf<TRegistry, T>> {
    const ret = this.register(
      isPBinJKey(service) ? service : pbjKey(String(service)),
      () => Array.from(this._listOf(service)),
    ).withCacheable(false);

    //any time a new item is added invalidate the list, this should allow for things to be cached.
    // we would also need to invalidate on tags changes.
    this.listeners.push(() => {
      ret.invalidate();
    });

    return ret.proxy as any;
  }
  toJSON() {
    return Array.from(this.map.values()).map((v) => v.toJSON());
  }
  async resolveAsync<T extends PBinJKey<TRegistry>>(
    key: T,
  ): Promise<ValueOf<TRegistry, T>> {
    try {
      return this.resolve(key);
    } catch (e) {
      if (isAsyncError(e)) {
        this.logger.debug("waiting for promise[{waitKey}] for {key}", {
          key: asString(key),
          waitKey: asString(e.key),
        });
        await e.promise;
        return this.resolveAsync(key);
      }
      this.logger.error("error resolving async {key} {error}", {
        key: asString(key),
        error: e,
      });
      throw e;
    }
  }
}

export function createNewContext<TRegistry extends RegistryType>() {
  return new Context<TRegistry>();
}

declare global {
  // noinspection ES6ConvertVarToLetConst
  var __pbj_context: Context<Registry> | undefined;
}

//Make this work when pbj is imported from multiple locations.
export const context = (globalThis["__pbj_context"] ??=
  createNewContext<Registry>());

export const pbj = context.pbj.bind(context);

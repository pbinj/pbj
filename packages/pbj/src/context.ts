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
  ServiceDescriptorI,
} from "./types.js";
import { ServiceDescriptor } from "./service-descriptor.js";
import { ServiceContext } from "./service-context.js";
import { filterMap, isInherited, keyOf, Listener, listener } from "./util.js";
import { pbjKey, isPBinJKey, asString, isTypeAlias } from "./pbjKey.js";
import { isAsyncError } from "./errors.js";
import { Logger } from "./logger.js";
import { RegisterArgs, ToInject } from "./context-types.js";
import { serviceSymbol } from "./symbols.js";
type serviceSymbolType = typeof serviceSymbol;

/**
 * The main dependency injection context for PBinJ.
 *
 * Context manages service registration, resolution, and lifecycle. It provides
 * type-safe dependency injection with support for factories, constructors, and values.
 *
 * @template TRegistry - The registry type defining available services
 *
 * @example
 * ```typescript
 * import { context, pbjKey } from "@pbinj/pbj";
 *
 * // Register a simple value
 * context.register("config", { apiUrl: "https://api.example.com" });
 *
 * // Register a class with dependencies
 * class UserService {
 *   constructor(private config: Config) {}
 * }
 * context.register(UserService, context.pbj("config"));
 *
 * // Resolve a service
 * const userService = context.resolve(UserService);
 * ```
 */
export class Context<TRegistry extends RegistryType = Registry> {
  // implements ContextI<TRegistry>
  //this thing is used to keep track of dependencies.
  protected map = new Map<CKey, ServiceContext<TRegistry, any>>();
  private listeners = listener<ServiceDescriptorI<TRegistry, any>>();
  // Track services that have been initialized
  private initializedServices = new Set<CKey>();
  // Track services that are pending initialization
  private pendingInitialization = new Set<CKey>();
  public logger = new Logger();

  /**
   * Creates a new Context instance.
   *
   * @param parent - Optional parent context for hierarchical dependency resolution
   */
  constructor(private readonly parent?: Context<any>) {}

  /**
   * Subscribe to service registration events.
   *
   * This method allows you to be notified when services are added to the context.
   * Useful for implementing plugins, monitoring, or dynamic service discovery.
   *
   * @param fn - Callback function invoked when services are added
   * @param initialize - If true, immediately invoke callback for existing services
   * @returns Unsubscribe function to remove the listener
   *
   * @example
   * ```typescript
   * const unsubscribe = context.onServiceAdded((descriptor) => {
   *   console.log(`Service registered: ${descriptor.name}`);
   * });
   *
   * // Later, to stop listening:
   * unsubscribe();
   * ```
   */
  public onServiceAdded(
    fn: Listener<ServiceDescriptorI<TRegistry, any>>,
    initialize = false,
  ): () => void {
    this.logger.info("onServiceAdded: listener added");
    const ret = this.listeners.subscribe(fn);
    if (initialize) {
      const [service, ...rest] = this.map.values();
      if (service) {
        this.listeners(
          service.description,
          ...rest.map(({ description }) => description),
        );
      }
    }

    return ret;
  }

  /**
   * Get a proxy reference to a service without resolving it immediately.
   *
   * This method returns a proxy that will resolve the service lazily when accessed.
   * Useful for avoiding circular dependencies and deferring service initialization.
   *
   * @template T - The service key type
   * @param service - The service key to get a proxy for
   * @returns A proxy that will resolve to the service value when accessed
   *
   * @example
   * ```typescript
   * const configKey = pbjKey<Config>("config");
   * const configProxy = context.pbj(configKey);
   *
   * // Service is not resolved until accessed
   * console.log(configProxy.apiUrl); // Resolves here
   * ```
   */
  pbj<T extends PBinJKey<TRegistry>>(service: T): ValueOf<TRegistry, T> {
    return (this.get(keyOf(service as any)) ?? this._register(service as any))
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
   *     return destroySymbol;
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
    if (!ctx) {
      return;
    }
    if (ctx.dependencies?.size) {
      for (const dep of ctx.dependencies) {
        this._visit(dep, fn, seen);
      }
    }
    fn(ctx.description);
  }

  get(key: CKey): ServiceContext<TRegistry, any> | undefined {
    return this.map.get(key) ?? this.parent?.get(key);
  }

  public invalidate(
    key: CKey,
    ctx?: ServiceContext<TRegistry, any>,
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
    //ctx.invalidate();
    ///this.logger.warn("invalidating service {key}", { key: asString(key) });
    for (const [k, v] of this.map) {
      if (v.description.hasDependency(key) && !seen.has(k)) {
        if (!v.description.invalid) {
          v.invalidate();
        }
        this.invalidate(k, v, seen);
      }
    }
    //No longer initialized (it may have changed from initialized to not initialized)
    this.initializedServices.delete(key);
    if (ctx.initializer) {
      this.pendingInitialization.add(key);
    }
  }

  /**
   * Register a service with the context.
   *
   * This is the primary method for registering services. It supports multiple patterns:
   * - Register a value directly
   * - Register a factory function with dependencies
   * - Register a class constructor with dependencies
   * - Register using a PBinJKey for type safety
   *
   * Dependencies can be specified as:
   * - Direct values
   * - PBinJKey references (using `context.pbj(key)`)
   * - Other registered services
   *
   * @template T - The service type
   * @param key - Service key (string, symbol, class, or PBinJKey)
   * @param value - The service value, factory function, or constructor
   * @param args - Dependencies to inject (optional)
   * @returns Service descriptor for further configuration
   *
   * @example
   * ```typescript
   * // Register a simple value
   * context.register("apiUrl", "https://api.example.com");
   *
   * // Register a factory with dependencies
   * const configKey = pbjKey<Config>("config");
   * context.register("apiClient", (config: Config) => new ApiClient(config), context.pbj(configKey));
   *
   * // Register a class with dependencies
   * class UserService {
   *   constructor(private apiClient: ApiClient) {}
   * }
   * context.register(UserService, context.pbj("apiClient"));
   *
   * // Configure the service descriptor
   * context.register("cache", CacheService)
   *   .withInterceptors((value) => {
   *     console.log("Cache accessed");
   *     return value;
   *   });
   * ```
   */
  register<T extends keyof TRegistry, TFn extends Fn<TRegistry[T]>>(
    key: T,
    fn: TFn,
    ...args: ToInject<Parameters<TFn>>
  ): ServiceDescriptorI<TRegistry, TRegistry[T]>;
  register<T extends keyof TRegistry>(
    key: T,
    value: TRegistry[T],
  ): ServiceDescriptorI<TRegistry, TRegistry[T]>;

  register<T extends keyof TRegistry, TFn extends Constructor<TRegistry[T]>>(
    key: T,
    fn: TFn,
    ...args: ToInject<ConstructorParameters<TFn>>
  ): ServiceDescriptorI<TRegistry, TRegistry[T]>;
  register<T extends keyof TRegistry>(
    key: T,
    value: TRegistry[T],
  ): ServiceDescriptorI<TRegistry, TRegistry[T]>;

  register<
    TKey extends PBinJKeyType,
    T extends TKey extends PBinJKeyType<infer V> ? V : never,
    TCon extends Constructor<T>,
  >(
    key: TKey,
    fn: TCon,
    ...args: ToInject<ConstructorParameters<TCon>>
  ): ServiceDescriptorI<TRegistry, T>;

  register<
    const TKey extends PBinJKeyType,
    const TFn extends Fn<TValue>,
    const TValue extends TKey extends PBinJKeyType<infer V> ? V : never,
  >(
    key: TKey,
    fn: TFn,
    ...args: ToInject<Parameters<TFn>>
  ): ServiceDescriptorI<TRegistry, TValue>;

  register<
    const TKey extends PBinJKeyType,
    const T extends TKey extends PBinJKeyType<infer V> ? V : never,
  >(key: TKey, value: T): ServiceDescriptorI<TRegistry, T>;

  register<TKey extends PBinJKeyType<any>>(
    key: TKey,
  ): ServiceDescriptorI<
    TRegistry,
    TKey extends PBinJKeyType<infer T> ? T : never
  >;

  register<
    TCon extends Constructor<any>,
    T extends TCon extends Constructor<infer V> ? V : never,
  >(
    fn: TCon,
    ...args: ToInject<ConstructorParameters<TCon>> | []
  ): ServiceDescriptorI<TRegistry, T>;

  register<T, TFn extends Fn<T>>(
    fn: TFn,
    ...args: ToInject<Parameters<TFn>>
  ): ServiceDescriptorI<TRegistry, T>;
  register<T, TFn extends Fn<T>>(fn: TFn): ServiceDescriptorI<TRegistry, T>;

  // register<T extends keyof TRegistry,
  //     V extends TRegistry[T],
  //     TFn extends Fn<V>
  // >(key:T, fn:TFn, ...args:ToInject<Parameters<TFn>>):ServiceDescriptorI<TRegistry,V>;

  register(serviceKey: unknown, ...origArgs: unknown[]): never {
    return this._register(serviceKey as any, ...(origArgs as any))
      .description as unknown as never;
  }

  protected _register<TKey extends PBinJKey<TRegistry>>(
    serviceKey: TKey,
    ...origArgs: RegisterArgs<TRegistry, TKey> | []
  ): ServiceContext<TRegistry, ValueOf<TRegistry, TKey>> {
    if (serviceKey instanceof ServiceDescriptor) {
      const key = keyOf(serviceKey.key);
      return this.addServiceContext(
        key,
        new ServiceContext<TRegistry, ValueOf<TRegistry, TKey>>(
          this as any,
          serviceKey,
          this.logger.createChild(serviceKey.name!),
        ),
      );
    }
    const key = keyOf(serviceKey);

    let service: Constructor | Fn | unknown = serviceKey;
    let args: any[] = [...origArgs];

    if (isSymbol(serviceKey) || isTypeAlias(serviceKey)) {
      service = args.shift();
    }

    let inst = this.map.get(key) as ServiceContext<
      TRegistry,
      ValueOf<TRegistry, TKey>
    >;

    if (inst) {
      if (origArgs?.length) {
        this.logger.info("modifying registered service {name}", {
          name: asString(serviceKey),
        });
        //@ts-expect-error
        inst.description.args = args;
        //@ts-expect-error
        inst.description.service = service;
      }

      return inst;
    }
    return this.addServiceContext(
      key,
      new ServiceContext<TRegistry, ValueOf<TRegistry, TKey>>(
        this as any,
        new ServiceDescriptor(
          serviceKey,
          service as any,
          args as any,
          true,
          isFn(service),
          undefined,
        ),
        this.logger.createChild(asString(serviceKey)!),
      ),
    );
  }
  private addServiceContext(
    key: CKey,
    newInst: ServiceContext<TRegistry, any>,
  ) {
    this.map.set(key, newInst);
    void this.notifyAdd(newInst);
    this.logger.info("registering service with key {key}", {
      key: asString(key),
    });
    return newInst;
  }
  private notifyAdd(inst: ServiceContext<TRegistry, any>) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        this.listeners(inst.description);
        resolve();
      }, 0);
    });
  }
  resolve<T extends keyof TRegistry>(key: T): TRegistry[T];
  resolve<T extends keyof TRegistry>(
    key: T,
    alias: PBinJKeyType<TRegistry[T]>,
  ): TRegistry[T];
  resolve<T extends keyof TRegistry, TFn extends Fn<TRegistry[T]>>(
    key: T,
    fn: TFn,
    ...args: ToInject<Parameters<TFn>>
  ): TRegistry[T];
  resolve<T extends keyof TRegistry, TCon extends Constructor<TRegistry[T]>>(
    key: T,
    fn: TCon,
    ...args: ToInject<ConstructorParameters<TCon>>
  ): TRegistry[T];

  resolve<TKey extends PBinJKeyType>(
    key: TKey,
  ): TKey extends PBinJKeyType<infer T> ? T : never;
  resolve<T, TKey extends PBinJKeyType<T>>(
    key: TKey,
    alias: PBinJKeyType<T>,
  ): T;
  resolve<T, TKey extends PBinJKeyType<T>, TFn extends Fn<T>>(
    key: TKey,
    fn: TFn,
    ...args: ToInject<Parameters<TFn>>
  ): T;
  resolve<T, TKey extends PBinJKeyType<T>, TCon extends Constructor<T>>(
    key: TKey,
    fn: TCon,
    ...args: ToInject<ConstructorParameters<TCon>>
  ): T;

  resolve<TCon>(
    fn: TCon,
    ...args: TCon extends Constructor<any>
      ? ToInject<ConstructorParameters<TCon>> | []
      : never
  ): TCon extends Constructor<any> ? InstanceType<TCon> : never;

  resolve<T, TFn extends Fn<T>>(fn: TFn, ...args: ToInject<Parameters<TFn>>): T;
  resolve<T, TFn extends Fn<T>>(fn: TFn): T;

  /**
   * Resolve a service and return its instance.
   *
   * This method retrieves or creates an instance of a registered service.
   * If the service hasn't been registered yet, it will be registered automatically.
   *
   * Services are cached by default, so subsequent calls return the same instance
   * unless the service is configured as non-cacheable.
   *
   * @template T - The service type
   * @param typeKey - Service key (string, symbol, class, or PBinJKey)
   * @param args - Optional arguments to override registered dependencies
   * @returns The resolved service instance
   *
   * @throws {PBinJError} If the service cannot be resolved
   *
   * @example
   * ```typescript
   * // Resolve a registered service
   * const config = context.resolve("config");
   *
   * // Resolve a class
   * const userService = context.resolve(UserService);
   *
   * // Resolve with custom arguments (overrides registered dependencies)
   * const customService = context.resolve(MyService, customDep1, customDep2);
   * ```
   */
  resolve(typeKey: any, ...args: any[]): any {
    return this._register(typeKey, ...(args as any)).invoke();
  }

  /**
   * Create a new child context that inherits from this context.
   *
   * Child contexts can access services from their parent but maintain
   * their own service registrations. This is useful for creating isolated
   * scopes or test contexts.
   *
   * @template TTRegistry - The registry type for the new context
   * @returns A new Context instance with this context as its parent
   *
   * @example
   * ```typescript
   * const parentContext = context;
   * const childContext = parentContext.newContext();
   *
   * // Child can access parent services
   * const config = childContext.resolve("config");
   *
   * // But has its own registrations
   * childContext.register("childService", ChildService);
   * ```
   */
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
      const dependencies = service.description.dependencies || new Set<CKey>();
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

  scoped<R, TKey extends PBinJKey<TRegistry>>(
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
        v.description.tags.includes(service as any) ? v.proxy : undefined,
      );
    } else if (isFn(service)) {
      if (isConstructor(service)) {
        yield* filterMap(this.map.values(), (v) =>
          isInherited(v.description.service, service) ? v.proxy : undefined,
        );
      } else {
        yield* filterMap(this.map.values(), (v) =>
          v.description.service === service ? v.proxy : undefined,
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
    const ret = this._register(
      isPBinJKey(service) ? service : pbjKey(String(service)),
      () => {
        return Array.from(this._listOf(service));
      },
    );
    ret.description.withListOf(true);
    ret.description.withCacheable(false);

    //any time a new item is added invalidate the list, this should allow for things to be cached.
    // we would also need to invalidate on tags changes.

    return ret.proxy as any;
  }
  toJSON(): unknown {
    return Array.from(this.map.values()).map((v) => v.toJSON());
  }
  async resolveAsync(key: any): Promise<any> {
    try {
      return this.resolve(key) as any;
    } catch (e) {
      if (isAsyncError(e)) {
        this.logger.debug("waiting for promise[{waitKey}] for {key}", {
          key: asString(key),
          waitKey: asString(e.key),
        });
        await e.promise;
        return this.resolveAsync(key) as any;
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

//Make this work when pbj is imported from multiple locations.
// export const context = (globalThis["__pbj_context"] ??=
//   createNewContext<Registry>());

export const pbj: typeof context.pbj = function _pbj(
  this: Context | undefined,
  ...args
) {
  return context.pbj(...args);
};

let ctx = createNewContext<Registry>();
export const contextProxyKey = Symbol("@pbj/private/context");
export const context = new Proxy({} as Context, {
  set(_target, prop, value, receiver) {
    if (prop === contextProxyKey) {
      ctx = value;
      return true;
    }
    return Reflect.set(ctx, prop, value, receiver);
  },
  has(_target, prop) {
    if (prop === contextProxyKey) {
      return true;
    }
    return Reflect.has(ctx, prop);
  },

  get(_target, prop, receiver) {
    if (prop === contextProxyKey) {
      return ctx;
    } else if (prop === "pbj") {
      return ctx.pbj.bind(ctx);
    }
    return Reflect.get(ctx, prop, receiver);
  },
});

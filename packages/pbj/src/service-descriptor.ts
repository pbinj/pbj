import {isConstructor, isFn, isPrimitive,} from "@pbinj/pbj-guards";
import type { Registry } from "./registry.js";
import {  serviceSymbol } from "./symbols.js";
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
  InterceptFn,
  ValueOf,
} from "./types.js";
import {asString, isPBinJKey} from "./pbjKey.js";
import { Logger } from "./logger.js";
import {ContextI} from "./context-types";
import {keyOf, listener} from "./util";
import {isPBinJ} from "./guards";

const EMPTY = [] as const;

export class ServiceDescriptor<
  TRegistry extends RegistryType,
  T extends Constructor | Fn | unknown,
> implements ServiceDescriptorI<TRegistry, T>
{
  static #dependencies = new Set<CKey>();

  static value<
    T extends keyof TRegistry ,
    TRegistry extends RegistryType = Registry,
  >(key: T, service: TRegistry[T]) {
    return new ServiceDescriptor<TRegistry, TRegistry[T]>(key, service, EMPTY as any, false, false);
  }

  static singleton<T extends Constructor | Fn>(service: T, ...args: Args<T>) {
    return new ServiceDescriptor(service, service, args, true);
  }

  static factory<T extends Constructor | Fn>(service: T, ...args: Args<T>) {
    return new ServiceDescriptor(service, service, args, false);
  }

  //  public readonly [serviceSymbol]: PBinJKey<TRegistry>;
  dependencies?: Set<CKey>;
  public invoked = false;
  private _cacheable = true;
  private _service?: OfA<T>;
  private _args: Args<T> = [] as any;
  public factory = false;
  public isListOf = false;
  public interceptors?: InterceptFn<Returns<T>>[];
  public initializer?: string;
  public primitive?: boolean;
  public optional = true;
  public error?: { message: string };
  /**
   * When true, the service is invalid and needs to be re-invoked.
   * Once it is invoked, it is no longer invalid.  This is used for
   * caching and invalidation.
   */
  public invalid = true;
  public key: PBinJKey<TRegistry>;
  public tags: PBinJKeyType<T>[] = [];
  private _name: string | undefined;
  public context:ContextI<TRegistry> | undefined;
  public onChange = listener<ServiceDescriptor<any, any>>();
  [serviceSymbol]: PBinJKey<TRegistry>;
  constructor(
    key: PBinJKey<TRegistry>,
    service: T | undefined = undefined,
    args: Args<T> = [] as any,
    cacheable = true,
    public invokable = true,
    public description?: string,
    private logger = new Logger(),
  ) {

    this[serviceSymbol] = key;
    this.key = key;
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
    this.invokable = isFn(_service);
    this._service = _service;
    this.primitive = isPrimitive(_service);
    this.factory = this.invokable && !isConstructor(_service as Fn<T>);

    this.invalidate();
    this.logger.debug("service updated");
  }

  get service() {
    return this._service as OfA<T>;
  }

  get args() {
    return this._args!;
  }

  set args(newArgs:Args<T>) {
    if(newArgs === this._args) {
      return;
    }

    if (newArgs.length !== this._args.length || newArgs.some((v, i) => v !== this._args[i])) {
      this.logger.debug("changed args");
      newArgs.map(v=>{

        if(isPBinJKey(v)){
          this.addDependency(keyOf(v));
        }else if (isPBinJ(v)){
          this.addDependency((v as any)[serviceSymbol]);
        }

        return v;
      })
      this._args = newArgs;
      this.invalidate();
    }

  }
  addDependency(...keys: CKey[]) {
    if (keys.length) {
      const set = (this.dependencies ??= new Set<CKey>());
      keys.forEach((v) => set.add(v));
    }
    return this;
  }
  /**
   * Set the args to be used with the service.   These can be other pbj's, or any other value.
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
   * You can use `isNullish` from the guards to check if the service is a proxy is actually
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
  withTags(...tags: PBinJKeyType[]) {
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
    this.invalidate();
    return this;
  }

  /**
   * Override the name of the service.  This is useful for debugging.
   * @param name
   */
  withName(name: string) {
    this._name = name;
    this.invalidate();
    return this;
  }
  withInitialize(method?: string) {
      this.initializer = method;
      this.invalidate();
    return this;
  }

  withListOf(isList:boolean) {
    this.isListOf = isList;
    this.invalidate();
    return this;
  }

  /**
   * Add a dependency to the service.  This is used to track dependencies.
   * @param tag {PBinJKeyType} - The tag to add.
   * @returns
   */

  hasTag(tag: PBinJKeyType) {
    return this.tags.includes(tag);
  }
  invalidate = () => {
    if (!this.invalid) {
      this.logger.debug("invalidating service {{name}}", { name: this.name });
      this.invalid = true;
      this.onChange(this);
    }
  };

  asArray() {
    this.isListOf = true;
    this.invalidate();
    return this;
  }
  hasDependency(key: CKey) {
    return this.dependencies?.has(key) ?? false;
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
      primitive: this.primitive,
      listOf: this.isListOf,
      error: this.error,
      invalid: this.invalid,
      factory: this.factory,
      dependencies: Array.from(this.dependencies ?? [], asString as any),
      args: this.args?.map(asString as any),
    };
  }

}

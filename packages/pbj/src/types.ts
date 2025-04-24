import {
  destroySymbol,
  pbjKeySymbol,
  removeSymbol,
  serviceSymbol,
  typeAliasSymbol,
} from "./symbols.js";

export type Constructor<T = any> = new (...args: any[]) => T;

export type Fn<T = any> = (...args: any[]) => T | Promise<T>;

//This is just a fake type to make key tracking easier.
export type CKey = { __brand: "ContextKey" };

export type PBinJKey<TRegistry extends RegistryType> =
  | PBinJKeyType
  | Constructor
  | Fn
  | keyof TRegistry;

export interface Service<T extends symbol = symbol> {
  [serviceSymbol]: T;
}

export type ValueOf<TRegistry extends RegistryType, T> =
  T extends PBinJKeyType<infer TValue>
    ? TValue
    : T extends Constructor
      ? InstanceType<T>
      : T extends Fn
        ? ReturnType<T>
        : T extends keyof TRegistry
          ? TRegistry[T]
          : never;

export type VisitFn<
  TRegistry extends RegistryType,
  T extends PBinJKey<TRegistry>,
> = (
  value: ServiceDescriptorI<TRegistry, T>,
) => unknown | typeof destroySymbol | typeof removeSymbol;

export interface RegistryType {}

export type PBinJKeyType<T = any> = { [pbjKeySymbol]: T };

export type OfA<T> = Constructor<T> | Fn<T> | T;
//The second argument is usually a factory.  It could also be a value.   This tries to enforce if it is a factory, it should
// return the right type.   It is a little broken, because if the first argument is a factory (and key) than the second argument
// should be treated like an argument.   Which seems asymetrical but is I think correct.

export type ServiceArgs<TKey, TRegistry extends RegistryType> =
  TKey extends PBinJKeyType<infer TValue>
    ? ParamArr<TValue>
    : TKey extends keyof TRegistry
      ? ParamArr<TRegistry[TKey]>
      : TKey extends Constructor
        ? ConstructorParameters<TKey>
        : TKey extends Fn
          ? Parameters<TKey>
          : [];

type ParamArr<
  T,
  TFn extends Fn<T> = Fn<T>,
  TCon extends Constructor<T> = Constructor<T>,
> = [TFn, ...Parameters<TFn>] | [TCon, ...ConstructorParameters<TCon>] | [T];

const EMPTY = [] as const;
type EmptyTuple = typeof EMPTY;

export type Args<T> = T extends Constructor
  ? ConstructorParameters<T>
  : T extends Fn
    ? Parameters<T>
    : EmptyTuple;
export type Returns<T> = T extends Constructor
  ? InstanceType<T>
  : T extends Fn
    ? ReturnType<T>
    : T;
export interface ServiceInitI {
  initialized: boolean;
  invoke(instance: unknown): unknown;
  method: string;
  invalidate(): void;
}
export interface ServiceDescriptorI<
  TRegistry extends RegistryType,
  T extends Constructor | Fn | unknown,
> {
  key: PBinJKey<TRegistry>;
  [serviceSymbol]: PBinJKey<TRegistry>;
  primitive?: boolean;
  optional: boolean;
  tags: PBinJKeyType<T>[];
  invokable: boolean;
  description?: string;
  name?: string;
  cacheable: boolean;
  service: OfA<T> | undefined;
  args: Args<T>;
  initializer?: string;
  /**
   * Set the args to be used with the service.   These can be other pbjs, or any other value.
   * @param args
   * @returns
   */
  withArgs(...args: Args<T>): this;
  /**
   * Change the service implementation.
   * @param service
   * @returns
   */
  withService(service: T): this;
  /**
   * You can turn off response caching by setting this to false.
   * This is useful for things taht can not be cached.   Any pbj depending on a non-cacheable,
   * will be not cached.
   *
   * @param cacheable
   * @returns
   */
  withCacheable(cacheable?: boolean): this;
  withInvokable(invokable?: boolean): this;
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
  withOptional(optional?: boolean): this;
  /**
   * This is used to set a value.  This is useful for things like constants.  This will not be invoked.
   * @param value
   * @returns
   */
  withValue(value: ValueOf<TRegistry, T>): this;
  /**
   * Tags are used to group services.  This is useful for finding all services of a certain type.
   * @param tags
   * @returns
   */
  withTags(...tags: PBinJKeyType<any>[]): this;
  /**
   * A description of the service.  This is useful for debugging.
   * @param description
   * @returns
   */
  withDescription(description: string): this;
  /**
   * Interceptors allow you to intercept the invocation of a service.  This is useful for things like logging, or
   * metrics.
   * @param interceptors
   * @returns
   */
  withInterceptors(...interceptors: InterceptFn<Returns<T>>[]): this;
  /**
   * Override the name of the service.  This is useful for debugging.
   * @param name
   */
  withName(name: string): this;

  /**
   *
   */
  withInitialize(method?: string): this;

  /**
   * Checks if the dependency has a tag
   * @param tag
   */
  hasTag(tag: PBinJKeyType): boolean;

  asArray(): this;

  invalidate(): void;

  toJSON(): unknown;
}
/**
 * The interceptor function, allows you to intercept the invocation of a service.  The
 * invocation may be a previous interceptor.
 */
export type InterceptFn<T> = (invoke: () => T) => T;

export type TypeAlias = { [typeAliasSymbol]: PBinJKey<any> };

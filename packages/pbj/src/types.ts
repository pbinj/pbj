import { destroySymbol, removeSymbol, serviceSymbol } from "./symbols.js";

export interface Constructor<T = any> {
  new (...args: any[]):T;
}

export interface  Fn<T = any> {
  (...args: any[]): Awaited<T>;
}

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

export type Primitive = string | number | boolean | symbol | bigint;
export type PrimitiveType = String | Number | Boolean | Symbol | BigInt;
export type PrimitiveValue<T extends PrimitiveType> = T extends String
  ? string
  : T extends Number
    ? number
    : T extends Boolean
      ? boolean
      : T extends Symbol
        ? symbol
        : T extends BigInt
          ? bigint
          : never;

export type VisitFn<
  TRegistry extends RegistryType,
  T extends PBinJKey<TRegistry>,
> = (
  value: ServiceDescriptorI<TRegistry, T>,
) => unknown | typeof destroySymbol | typeof removeSymbol;

export interface RegistryType {
  [key: symbol]: any;
}

export type PBinJKeyType<T = any> = symbol & { [serviceSymbol]: T };

export type OfA<T> = Constructor<T> | Fn<T> | T;
//The second argument is usually a factory.  It could also be a value.   This tries to enforce if it is a factory, it should
// return the right type.   It is a little broken, because if the first argument is a factory (and key) than the second argument
// should be treated like an argument.   Which seems asymmetrical but is I think correct.
type Factory<T> = Constructor<T> | Fn<T>;
type FactoryParameters<T extends Factory<any>> = T extends Constructor
  ? ParamArr<ConstructorParameters<T>>
  : T extends Fn
    ? ParamArr<Parameters<T>>
    : [];

type FactoryArgs<T, F = any> = F extends Factory<T>
  ? [F, ...ParamArr<FactoryParameters<F>>] | ParamArr<FactoryParameters<F>>
    : [T | PBinJKeyType<T>];


export type ServiceArgs<T, TRegistry extends RegistryType> =
      T extends PBinJKeyType<infer TValue> ? FactoryArgs<TValue> :
        T extends keyof TRegistry ? FactoryArgs<TRegistry[T]> : [];


type OrKey<V> = V | PBinJKeyType<V>;

type ParamOrPBinJKeyType<T> =
    T extends [infer First, ...infer Rest] ?
     [ OrKey<First>, ...ParamOrPBinJKeyType<Rest> ] : [];

type ParamArr<
  T
> = T extends Constructor ?
    ParamOrPBinJKeyType<ConstructorParameters<T>> :
        T extends Fn ?
            ParamOrPBinJKeyType<Parameters<T>> :
              T;

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
  [serviceSymbol]: PBinJKey<TRegistry>;
  dependencies?: Set<CKey>;
  invoked: boolean;
  primitive?: boolean;
  invalid: boolean;
  optional: boolean;
  tags: PBinJKeyType<T>[];
  invokable: boolean;
  description?: string;
  name?: string;
  cacheable: boolean;
  proxy: Returns<T>;
  service: OfA<T> | undefined;
  args: Args<T>;
  initializer?: ServiceInitI;
  /**
   * Set the args to be used with the service.   These can be other pbj's, or any other value.
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
   * This is useful for things that can not be cached.   Any pbj depending on a non-cacheable,
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
   * You can use `isNullish` from the guards to check if the service
   * is a proxy is actually nullish.
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
  withName(name: string): this;
  /**
   * Check to see if the current service has a dependency.
   * @param key
   * @returns
   */
  hasDependency(key: CKey): boolean;
  /**
   * Add a dependency to the service.  This is used to track dependencies.
   * @param keys
   * @returns
   */
  addDependency(...keys: CKey[]): this;
  hasTag(tag: PBinJKeyType<any>): boolean;

  /**
   * Invokes the service and returns the value.  This is where the main resolution happens.
   *
   * @returns
   */
  invoke(): Returns<T>;

  asArray(): this;

  invalidate(): void;
}
/**
 * The interceptor function, allows you to intercept the invocation of a service.  The
 * invocation may be a previous interceptor.
 */
type InterceptFn<T> = (invoke: () => T) => T;

export type ServiceDescriptorListener = (
  service: ServiceDescriptorI<any, any>,
) => void;

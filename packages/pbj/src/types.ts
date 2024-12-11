import type { ServiceDescriptor } from "./ServiceDescriptor";
import { destroySymbol, removeSymbol, serviceSymbol } from "./symbols";

export type Constructor<T = any> = new (...args: any[]) => T;
export type Fn<T = any> = (...args: any[]) => T;

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
  value: ServiceDescriptor<TRegistry, T>,
) => unknown | typeof destroySymbol | typeof removeSymbol;

export interface RegistryType {
  [key: symbol]: any;
}

export type PBinJKeyType<T = any> = symbol & { [serviceSymbol]: T };
export type Rest<T extends any[]> = T extends [any, ...infer U] ? U : [];

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

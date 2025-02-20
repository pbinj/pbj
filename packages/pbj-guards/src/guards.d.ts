import type { Constructor, Fn, Primitive, PrimitiveType } from "./types.js";
export declare const nullableSymbol: unique symbol;
export declare const guardType: unique symbol;
export type Guard<T> = ((value: unknown) => value is T) & {
  [guardType]?: string;
};
export declare function isSymbol(x: unknown): x is symbol;
export declare function isFn(x: unknown): x is Fn;
export declare function isConstructor(x: Constructor | Fn): x is Constructor;
export declare function isObjectish(x: unknown): x is object;
export declare function has(
  x: unknown,
  k: PropertyKey,
): x is {
  [k in PropertyKey]: unknown;
};
export declare function hasA<V>(
  x: unknown,
  k: PropertyKey,
  guard: Guard<V>,
): x is {
  [k in PropertyKey]: V;
};
export declare function isPrimitive(v: unknown): v is Primitive;
export declare function isPrimitiveType(v: unknown): v is PrimitiveType;
export declare function isBoolean(v: unknown): v is boolean;
export declare function isNullish(v: unknown): v is null | undefined;
export declare function isRequired<V>(v: V): v is Exclude<V, null | undefined>;
export type AllOf<T> = T extends [
  Guard<infer U>,
  ...infer Rest extends readonly Guard<any>[],
]
  ? Rest["length"] extends 0
    ? U
    : U & AllOf<Rest>
  : never;
export declare function asserts<T extends readonly Guard<any>[]>(
  ...guards: T
): (value: unknown) => asserts value is AllOf<T>;
export declare class GuardError extends Error {
  constructor(message: string);
}

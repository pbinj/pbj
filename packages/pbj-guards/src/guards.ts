import type { Constructor, Fn, Primitive, PrimitiveType } from "./types.js";

export const nullableSymbol = Symbol("@pbj/nullable");

export const guardType = Symbol("@pbj/visualization/guardType");

export type Guard<T> = ((value: unknown) => value is T) & {
  [guardType]?: string;
};

export function isSymbol(x: unknown): x is symbol {
  return typeof x === "symbol";
}

export function isFn(x: unknown): x is Fn {
  return typeof x === "function";
}

export function isConstructor(x: Constructor | Fn): x is Constructor {
  return !!x.prototype && !!x.prototype.constructor.name;
}

export function isObjectish(x: unknown): x is object {
  switch (typeof x) {
    case "object":
    case "function":
      return x != null;
    default:
      return false;
  }
}

export function has(
  x: unknown,
  k: PropertyKey
): x is { [k in PropertyKey]: unknown } {
  return isObjectish(x) && k in x;
}

export function hasA<V>(
  x: unknown,
  k: PropertyKey,
  guard: Guard<V>
): x is { [k in PropertyKey]: V } {
  return has(x, k) ? guard(x[k]) : false;
}

export function isPrimitive(v: unknown): v is Primitive {
  const type = typeof v;
  return (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    type === "symbol" ||
    type === "bigint"
  );
}

export function isPrimitiveType(v: unknown): v is PrimitiveType {
  return (
    v === String ||
    v === Number ||
    v === Boolean ||
    v === Symbol ||
    v === BigInt
  );
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isNullish(v: unknown): v is null | undefined {
  return v == null || hasA(v, nullableSymbol, isBoolean)
    ? (v?.nullable ?? false)
    : false;
}

export function isRequired<V>(v: V): v is Exclude<V, null | undefined> {
  return v != null;
}

export type AllOf<T> = T extends [
  Guard<infer U>,
  ...infer Rest extends readonly Guard<any>[],
]
  ? Rest["length"] extends 0
    ? U
    : U & AllOf<Rest>
  : never;

export function asserts<T extends readonly Guard<any>[]>(...guards: T) {
  return function assertsGuard(value: unknown): asserts value is AllOf<T> {
    for (const guard of guards) {
      if (!guard(value)) {
        throw new GuardError(`Value '${value}' does not match guard`);
      }
    }
  };
}

export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, GuardError.prototype);
  }
}

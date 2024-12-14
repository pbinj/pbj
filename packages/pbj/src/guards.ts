import { serviceSymbol, proxyKey } from "./symbols";
import type {
  Constructor,
  Fn,
  PBinJKeyType,
  Primitive,
  PrimitiveType,
} from "./types";

export function isSymbol(x: unknown): x is symbol {
  return typeof x === "symbol";
}

export function isFn(x: unknown): x is Fn {
  return typeof x === "function";
}
export function isService(x: unknown): x is { [serviceSymbol]: symbol } {
  return hasA(x, serviceSymbol, isSymbol);
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
  k: PropertyKey,
): x is { [k in PropertyKey]: unknown } {
  return isObjectish(x) && k in x;
}

export function hasA<V>(
  x: unknown,
  k: PropertyKey,
  guard: isA<V>,
): x is { [k in PropertyKey]: V } {
  return has(x, k) ? guard(x[k]) : false;
}

export type isA<Out> = (v: unknown) => v is Out;
export function isPrimitive(v: unknown): v is Primitive {
  return (
    typeof v === "string" ||
    typeof v === "number" ||
    typeof v === "boolean" ||
    typeof v === "symbol" ||
    typeof v === "bigint"
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
export function isPBinJ(v: unknown): v is { [proxyKey]: symbol } {
  return hasA(v, proxyKey, isSymbol);
}
export class PBinJError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, Error);
  }
}
export const nullableSymbol = Symbol("@pbj/nullable");

export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isNullish(v: unknown): v is null | undefined {
  return v == null || hasA(v, nullableSymbol, isBoolean)
    ? (v?.nullable ?? false)
    : false;
}

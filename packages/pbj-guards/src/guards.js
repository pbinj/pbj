export const nullableSymbol = Symbol("@pbj/nullable");
export const guardType = Symbol("@pbj/visualization/guardType");
export function isSymbol(x) {
  return typeof x === "symbol";
}
export function isFn(x) {
  return typeof x === "function";
}
export function isConstructor(x) {
  return !!x.prototype && !!x.prototype.constructor.name;
}
export function isObjectish(x) {
  switch (typeof x) {
    case "object":
    case "function":
      return x != null;
    default:
      return false;
  }
}
export function has(x, k) {
  return isObjectish(x) && k in x;
}
export function hasA(x, k, guard) {
  return has(x, k) ? guard(x[k]) : false;
}
export function isPrimitive(v) {
  const type = typeof v;
  return (
    type === "string" ||
    type === "number" ||
    type === "boolean" ||
    type === "symbol" ||
    type === "bigint"
  );
}
export function isPrimitiveType(v) {
  return (
    v === String ||
    v === Number ||
    v === Boolean ||
    v === Symbol ||
    v === BigInt
  );
}
export function isBoolean(v) {
  return typeof v === "boolean";
}
export function isNullish(v) {
  return v == null || hasA(v, nullableSymbol, isBoolean)
    ? (v?.nullable ?? false)
    : false;
}
export function isRequired(v) {
  return v != null;
}
export function asserts(...guards) {
  return function assertsGuard(value) {
    for (const guard of guards) {
      if (!guard(value)) {
        throw new GuardError(`Value '${value}' does not match guard`);
      }
    }
  };
}
export class GuardError extends Error {
  constructor(message) {
    super(message);
    Object.setPrototypeOf(this, GuardError.prototype);
  }
}

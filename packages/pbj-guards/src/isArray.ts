import { type Guard } from "./guards.js";
import type { ArraySubtype, SchemaObject } from "./schema/json-schema.types.js";
import { toSchemaNested } from "./schema/toSchemaNested.js";

export function isArray<T>(v: unknown, guard?: Guard<T>): v is T[] {
  const isArr = Array.isArray(v);
  if (!isArr) {
    return false;
  }

  if (!guard) {
    return true;
  }

  for (const item of v) {
    if (!guard(item)) {
      return false;
    }
  }

  return true;
}

export function array<T = any>(
  guard?: Guard<T>,
  options: Omit<ArraySubtype, "type" | "items"> = {},
) {
  const ret = function isArrayGuard(v: unknown): v is T[] {
    return isArray<T>(v, guard);
  };

  ret.toSchema = (ctx: SchemaObject, key: string): ArraySubtype => ({
    type: "array",
    items: guard ? toSchemaNested(guard, ctx, key) : undefined,
    ...options,
  });

  return ret;
}

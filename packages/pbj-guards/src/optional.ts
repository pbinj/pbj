import type { Guard } from "./guards.js";

export function optional<T>(this: Guard<T>): Guard<T | undefined> {
  const guard = this;
  const ret = function optionalGuard(value: unknown): value is T | undefined {
    return value == null || guard(value);
  };
  // @ts-ignore
  ret[guardType] = guard[guardType];
  // @ts-ignore
  ret.toString = guard.toSchema;
  return ret;
}

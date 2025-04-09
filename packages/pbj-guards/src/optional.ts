import { guardType, type Guard } from "./guards.js";

export function optional<T>(this: Guard<T>): Guard<T | undefined> {
  const guard = this;
  function optionalGuard(value: unknown): value is T | undefined {
    return value == null || guard(value);
  }
  // @ts-ignore
  optionalGuard[guardType] = guard[guardType];
  // @ts-ignore
  optionalGuard.toString = guard.toSchema;
  return optionalGuard;
}

import { hasA, isSymbol } from "./guards";
import { serviceSymbol } from "./symbols";
import type { CKey, PBinJKey, Service } from "./types";

export function keyOf(key: PBinJKey<any> | Service): CKey {
  return hasA(key, serviceSymbol, isSymbol)
    ? (key[serviceSymbol] as any)
    : (key as any);
}

export function* filter<T>(it: Iterable<T>, fn: (v: T) => boolean) {
  for (const v of it) {
    if (fn(v)) {
      yield v;
    }
  }
}
/**
 * Concats a bunch of iterables, skipping nulls and undefined.
 * @param it
 */
export function* concat<T>(...it: (Iterable<T> | undefined | null)[]) {
  for (const v of it) {
    if (v == null) {
      continue;
    }
    yield* v;
  }
}
/**
 * Filters and maps iterable, skipping nulls and undefined.
 * @param it
 * @param fn
 */
export function* filterMap<T, V>(it: Iterable<T>, fn: (v: T) => V | undefined) {
  for (const v of it) {
    const val = fn(v);
    if (val != null) {
      yield val;
    }
  }
}

export function isInherited(child: unknown, parent: unknown) {
  if (child === parent) {
    return true;
  }
  if (child == null || parent == null) {
    return false;
  }
  return isInherited(Object.getPrototypeOf(child), parent);
}

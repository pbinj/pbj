import { hasA, isSymbol } from "@pbinj/pbj-guards";
import { serviceSymbol } from "./symbols.js";
import type { CKey, PBinJKey, Service } from "./types.js";

export type PathOf<
  T,
  TPath extends string,
  TKey extends string & keyof T = keyof T & string,
> = TPath extends TKey
  ? T[TPath]
  : TPath extends
        | `${infer TFirst extends TKey}.${infer TRest}`
        | `[${infer TFirst extends TKey}]${infer TRest}`
    ? PathOf<T[TFirst], TRest>
    : never;

const toPath = (path: string) => path.split(/\.|\[(.+?)\]/g).filter(Boolean);

export function get<T, TKey extends string>(
  obj: T,
  key: TKey,
  defaultValue?: PathOf<T, TKey> | undefined,
): PathOf<T, TKey> {
  const value = toPath(key).reduce((acc, part) => {
    return (acc as any)?.[part];
  }, obj) as any;
  return value ?? defaultValue;
}

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
 * Concat a bunch of iterables, skipping nulls and undefined.
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

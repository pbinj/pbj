import { isFn, isPBinJ, isSymbol } from "./guards.js";
import { proxyKey } from "./symbols.js";
import type { Fn, PBinJKey, PBinJKeyType } from "./types.js";

const pbjKeyMap = new WeakMap<{}, string>();
const anonymousMap = new WeakMap<Fn, string>();

export const pbjKey = <T>(name: string): PBinJKeyType<T> => {
  const sym = Symbol();
  sym.toString = () => {
    return name;
  }
  pbjKeyMap.set(sym, name);
  return sym as any;
};

export const pbjKeyName = (key: PBinJKeyType<any>) => {
  return pbjKeyMap.get(key);
};
export function isPBinJKey(v: unknown): v is PBinJKeyType<unknown> {
  return pbjKeyMap.has(v as any);
}
export function asString(key: PBinJKey<any>) {
  if (isPBinJ(key)) {
    const service = key[proxyKey];
    return asString(service);
  }
  if (isPBinJKey(key)) {
    return pbjKeyName(key);
  }
  if (isFn(key)) {
    return key.name || anonymous(key);
  }
  if (isSymbol(key)) {
    return key.description;
  }
  return String(key);
}

let count = 0;
/**
 * We want to return a unique number for each anonymous function, it should be the same number
 * for the same function.
 */
function anonymous(v: Fn) {
  let val = anonymousMap.get(v);
  if (val != null) {
    return val;
  }

  anonymousMap.set(v, (val = `<anonymous>@${count++}`));
  return val;
}

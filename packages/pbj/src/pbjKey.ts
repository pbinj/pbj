import { isPBinJ } from "./guards.js";
import {proxyKey, pbjKeySymbol, typeAliasSymbol} from "./symbols.js";
import type { CKey, Constructor, Fn, PBinJKey, PBinJKeyType } from "./types.js";
import {hasA, isConstructor, isFn, isString, isSymbol} from "@pbinj/pbj-guards";

const pbjKeyMap = new WeakMap<{}, string>();
const anonymousMap = new WeakMap<Fn, string>();

export const pbjKey = <T>(name: string): PBinJKeyType<T> => {
  const sym = Symbol();
  pbjKeyMap.set(sym, name);
  return sym as any;
};

export const pbjKeyName = (key: PBinJKeyType<any>) => {
  return pbjKeyMap.get(key);
};
export function isPBinJKey(v: unknown): v is PBinJKeyType<unknown> {
  return pbjKeyMap.has(v as any);
}
export function isTypeAlias(v: unknown): v is { [typeAliasSymbol]: string } {
  return hasA(v, typeAliasSymbol, isString);
}
export function asString(
  key: PBinJKey<any> | CKey | Constructor | Fn | symbol | unknown,
): string {
  if (key == null) {
    return "<unknown>";
  }
  if (typeof key === "string") {
    return key;
  }
  if (isPBinJ(key)) {
    const service = key[proxyKey];
    return asString(service);
  }
  if (isPBinJKey(key)) {
    const ret = pbjKeyName(key);
    if (ret != null) {
      return ret;
    }
  }

  if (isFn(key)) {
    if (isConstructor(key)) {
      return key.name;
    }
    return key.name || anonymous(key);
  }
  if (isSymbol(key) && key.description) {
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

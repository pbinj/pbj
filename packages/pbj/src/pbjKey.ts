import { isPBinJ } from "./guards.js";
import { proxyKey, pbjKeySymbol, typeAliasSymbol } from "./symbols.js";
import {
  CKey,
  Constructor,
  Fn,
  PBinJKey,
  PBinJKeyType,
  TypeAlias,
} from "./types.js";
import {
  has,
  hasA,
  isConstructor,
  isFn,
  isString,
  isSymbol,
} from "@pbinj/pbj-guards";

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

export function isTypeAlias(v: unknown): v is TypeAlias {
  return has(v, typeAliasSymbol);
}
export function asString(
  key: PBinJKey<any> | TypeAlias | CKey | Constructor | Fn | symbol | unknown,
): string {
  if (key == null) {
    return "<unknown>";
  }
  if (typeof key === "string") {
    return key;
  }
  if (isTypeAlias(key)) {
    return asString(key[typeAliasSymbol]);
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
    if (isConstructor(key) && hasA(key, "name", isString)) {
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

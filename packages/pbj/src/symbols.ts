import { isConstructor, isFn, isSymbol } from "./guards";
import { PBinJKey, PBinJKeyType } from "./types";

export const serviceSymbol = Symbol("@pbj/Service");
export const destroySymbol = Symbol("@pbj/Service.destroy");
export const removeSymbol = Symbol("@pbj/Service.remove");

const pbjKeyMap = new WeakMap<{}, string>();

export const pbjKey = <T>(name: string): PBinJKeyType<T> => {
  const sym = Symbol();
  pbjKeyMap.set(sym, name);
  return sym as any;
};

export const pbjKeyName = (key: PBinJKeyType<any>) => {
  return pbjKeyMap.get(key);
};

export function isPBinJKey(v: unknown): v is PBinJKeyType<unknown> {
  return isSymbol(v) ? pbjKeyMap.has(v) : false;
}
export function asString(key: PBinJKey<any>) {
  if (isPBinJKey(key)) {
    return pbjKeyName(key);
  }
  if (isFn(key)) {
    return key.name ?? "<anonymous>";
  }
  return String(key);
}

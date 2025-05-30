import { hasA, isSymbol, isBoolean } from "@pbinj/pbj-guards";

import { proxyKey } from "./symbols.js";
import { CKey } from "./types.js";

interface HasProxyCKey {
  [proxyKey]: CKey;
}
export function isPBinJ(v: unknown): v is HasProxyCKey {
  return hasA(v, proxyKey, isSymbol);
}

export const nullableSymbol = Symbol("@pbj/nullable");

export function isNullish(v: unknown): v is null | undefined {
  return v == null || hasA(v, nullableSymbol, isBoolean)
    ? (v?.[nullableSymbol] ?? false)
    : false;
}

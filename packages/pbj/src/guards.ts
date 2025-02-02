import { serviceSymbol, proxyKey } from "./symbols.js";
import { hasA, isSymbol, isBoolean } from "@pbinj/pbj-guards";
export * from "@pbinj/pbj-guards";

export function isPBinJ(v: unknown): v is { [proxyKey]: symbol } {
  return hasA(v, proxyKey, isSymbol);
}

export const nullableSymbol = Symbol("@pbj/nullable");

export function isNullish(v: unknown): v is null | undefined {
  return v == null || hasA(v, nullableSymbol, isBoolean)
    ? (v?.nullable ?? false)
    : false;
}

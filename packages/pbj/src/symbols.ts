import { isFn, isSymbol } from "./guards";
import { type PBinJKey, type PBinJKeyType } from "./types";

export const serviceSymbol = Symbol("@pbj/Service");
export const destroySymbol = Symbol("@pbj/Service.destroy");
export const removeSymbol = Symbol("@pbj/Service.remove");
export const proxyKey = Symbol("@pbj/Service.proxy");


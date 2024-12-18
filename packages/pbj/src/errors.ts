import { has } from "./guards.js";
import { asString } from "./pbjKey.js";
import { PBinJKey } from "./types.js";
const symbol = Symbol("@pbj/ServiceDescriptorProxy");

export class PBinJAsyncError extends Error {
  [symbol] = true;
  constructor(
    public key: PBinJKey<any>,
    public promise: Promise<any>,
  ) {
    super(
      `[${asString(key)} pending]: you have a async return from a service, please use context.resolveAsync`,
    );
    Object.setPrototypeOf(this, Error);
  }
}
export function isAsyncError(e: any): e is PBinJAsyncError {
  return has(e, symbol) && e[symbol] === true;
}
export class PBinJError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, Error);
  }
}

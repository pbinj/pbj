import { context, Context } from "./context.js";
import { pbjKey } from "./pbjKey.js";
import "./helpers.js";
import { env as DefaultEnv } from "./process.js";

declare module "./context.js" {
  interface Context {
    env<K extends keyof PBinJEnv & string, D extends string>(
      this: Context,
      envKey: K,
      defaultValue?: D,
    ): string | D;
    envRequired<K extends keyof PBinJEnv & string>(
      this: Context,
      envKey: K,
    ): string;
  }
}

//make env easier to use.
export interface PBinJEnv extends Record<string, string | undefined> {}

export const envPBinJKey = pbjKey<PBinJEnv>("@pbj/env");

context.register(envPBinJKey, () => DefaultEnv);

Context.prototype.env = function env<
  K extends keyof PBinJEnv & string,
  D extends string,
>(this: Context, envKey: K, defaultValue?: D): string | D {
  return this._register(
    Symbol.for(`@pbj/env/${envKey}`),
    this.pathOf(envPBinJKey, envKey, defaultValue as any),
  ).proxy;
};

Context.prototype.envRequired = function envRequired<
  K extends keyof PBinJEnv & string,
>(this: Context, envKey: K): string {
  const ret =   this._register(
    Symbol.for(`@pbj/env/${envKey}`),
    this.pathOf(envPBinJKey, envKey),
  )
  ret.description.withOptional(false);
  return ret.proxy;
};
export const env = context.env.bind(context);
export const envRequired = context.envRequired.bind(context);

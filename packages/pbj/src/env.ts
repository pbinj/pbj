import { Context, context } from "./context.js";
import { pbjKey } from "./pbjKey.js";
import { pathOf } from "./helpers.js";
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

export const Default = {
  env: process.env,
};

type Env = typeof process.env;

//make env easier to use.
export interface PBinJEnv extends Env {}

export const envPBinJKey = pbjKey<PBinJEnv>("@pbj/env");

context.register(envPBinJKey, () => Default.env);

Context.prototype.env = function env<
  K extends keyof PBinJEnv & string,
  D extends string,
>(this: Context, envKey: K, defaultValue?: D): string | D {
  return this.register(
    Symbol.for(`@pbj/env/${envKey}`),
    pathOf(envPBinJKey, envKey, defaultValue as any),
  ).proxy;
};

Context.prototype.envRequired = function envRequired<
  K extends keyof PBinJEnv & string,
>(this: Context, envKey: K): string {
  return this.register(
    Symbol.for(`@pbj/env/${envKey}`),
    pathOf(envPBinJKey, envKey),
  ).withOptional(false).proxy;
};
export const env = context.env.bind(context);
export const envRequired = context.envRequired.bind(context);

import { context } from "./context.js";
import { pbjKey } from "./pbjKey.js";
import { pathOf } from "./helpers.js";

export const Default = {
  env: process.env,
};

type Env = typeof process.env;

//make env easier to use.
export interface PBinJEnv extends Env {}

export const envPBinJKey = pbjKey<PBinJEnv>("@pbj/env");

context.register(envPBinJKey, () => Default.env);

export function env<K extends keyof PBinJEnv & string, D extends string>(
  envKey: K,
  defaultValue?: D
): string | D {
  return context.register(
    Symbol.for(`@pbj/env/${envKey}`),
    pathOf(envPBinJKey, envKey, defaultValue as any)
  ).proxy;
}

export function envRequired<K extends keyof PBinJEnv & string>(
  envKey: K
): string {
  return context
    .register(Symbol.for(`@pbj/env/${envKey}`), pathOf(envPBinJKey, envKey))
    .withOptional(false).proxy;
}

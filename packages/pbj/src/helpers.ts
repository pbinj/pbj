import { type Registry } from "./registry.js";
import { context, Context } from "./context.js";
import type { PBinJKey, RegistryType, ValueOf } from "./types.js";
import { type PathOf, get } from "./util.js";
declare module "./context.js" {
  interface Context {
    transform<
      R,
      T extends PBinJKey<TRegistry>,
      TRegistry extends RegistryType = Registry,
    >(
      this: Context,
      service: T,
      transformer: (v: ValueOf<TRegistry, T>) => R,
    ): R;

    pathOf<
      T extends PBinJKey<TRegistry>,
      TPath extends string,
      TRegistry extends RegistryType = Registry,
    >(
      this: Context,
      service: T,
      path: TPath,
      defaultValue?: PathOf<ValueOf<TRegistry, T>, TPath> | undefined,
    ): (v?: ValueOf<TRegistry, T>) => PathOf<ValueOf<TRegistry, T>, TPath>;
  }
}

function _pathOf<
  T extends PBinJKey<TRegistry>,
  TPath extends string,
  TRegistry extends RegistryType,
>(
  this: Context<TRegistry>,
  service: T,
  path: TPath,
  defaultValue?: PathOf<ValueOf<TRegistry, T>, TPath> | undefined,
) {
  return (ctx = this.pbj(service)) =>
    get(ctx as ValueOf<TRegistry, T>, path, defaultValue);
}
//@ts-expect-error - type madness
Context.prototype.pathOf = _pathOf;
function _transform<
  R,
  T extends PBinJKey<TRegistry>,
  TRegistry extends RegistryType = Registry,
>(
  this: Context<TRegistry>,
  service: T,
  transformer: (v: ValueOf<TRegistry, T>) => R,
): R {
  return this.pbj(() => transformer(this.resolve(service as any)));
}
//@ts-expect-error - type madness
Context.prototype.transform = _transform;

export const transform = context.transform.bind(context);
export const pathOf = context.pathOf.bind(context);

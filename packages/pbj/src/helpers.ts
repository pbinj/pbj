import { type Registry } from "./registry.js";
import { context, pbj } from "./context.js";
import type { PBinJKey, RegistryType, ValueOf } from "./types.js";
import { Context } from "./context.js";
declare module "./context.js" {
  interface Context {
    value<T, TKey extends string>(
      this: Context,
      obj: T,
      key: TKey,
      defaultValue?: PathOf<T, TKey> | undefined,
    ): PathOf<T, TKey>;

    transform<
      R,
      T extends PBinJKey<TRegistry>,
      TRegistry extends RegistryType = Registry,
    >(this: Context, service: T, transformer: (v: ValueOf<TRegistry, T>) => R): R;

    pathOf<
      T extends PBinJKey<TRegistry>,
      TPath extends string,
      TRegistry extends RegistryType = Registry,
    >(
      this: Context,
      service: T,
      path: TPath,
      defaultValue?: PathOf<ValueOf<TRegistry, T>, TPath> | undefined,
    ): () => PathOf<ValueOf<TRegistry, T>, TPath>;
  }
}


type PathOf<
  T,
  TPath extends string,
  TKey extends string & keyof T = keyof T & string,
> = TPath extends TKey
  ? T[TPath]
  : TPath extends
  | `${infer TFirst extends TKey}.${infer TRest}`
  | `[${infer TFirst extends TKey}]${infer TRest}`
  ? PathOf<T[TFirst], TRest>
  : never;

const toPath = (path: string) => path.split(/\.|\[(.+?)\]/g).filter(Boolean);

Context.prototype.value = function get<T, TKey extends string>(
  this: Context,
  obj: T,
  key: TKey,
  defaultValue?: PathOf<T, TKey> | undefined,
): PathOf<T, TKey> {
  const value = toPath(key).reduce((acc, part) => {
    return (acc as any)?.[part];
  }, obj) as any;
  return value ?? defaultValue;
}

Context.prototype.pathOf = function pathOf<
  T extends PBinJKey<TRegistry>,
  TPath extends string,
  TRegistry extends RegistryType = Registry,
>(
  this: Context,
  service: T,
  path: TPath,
  defaultValue?: PathOf<ValueOf<TRegistry, T>, TPath> | undefined,
) {
  return (ctx = this.pbj(service)) =>
    this.value(ctx as ValueOf<TRegistry, T>, path, defaultValue);
}

Context.prototype.transform = function transform<
  R,
  T extends PBinJKey<TRegistry>,
  TRegistry extends RegistryType = Registry,
>(this: Context, service: T, transformer: (v: ValueOf<TRegistry, T>) => R): R {
  return this.pbj(() => transformer(this.resolve(service as any)));
}

export const transform = context.transform.bind(context);
export const get = context.value.bind(context);
export const value = context.value.bind(context);
export const pathOf = context.pathOf.bind(context);
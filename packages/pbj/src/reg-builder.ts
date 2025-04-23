import {
  Constructor,
  Fn,
  PBinJKeyType,
  RegistryType,
  ServiceDescriptorI,
} from "./types.js";
import { ServiceDescriptor } from "./service-descriptor.js";
import type { ContextI, ToInject } from "./context-types.js";
import { typeAliasSymbol } from "./symbols.js";
import { asString, pbjKey } from "./pbjKey.js";
import { has, hasA, isFn } from "@pbinj/pbj-guards";
import { Context } from "./context.js";
import { isAsyncFunction } from "node:util/types";

export interface HasDescriptions<TRegistry extends RegistryType> {
  readonly descriptions: {
    [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
  };
}

export interface HasRefs<TRegistry extends RegistryType> {
  readonly refs: { [K in keyof TRegistry]: PBinJKeyType<TRegistry[K]> };
}
export interface ApplyContextI<TRegistry extends RegistryType>
  extends HasRefs<TRegistry> {
  apply<TCRegistry extends RegistryType = {}>(
    ctx: ContextI<TCRegistry>,
  ): ContextI<TRegistry & TCRegistry>;
}

export interface RegBuilderI<TRegistry extends RegistryType>
  extends HasRefs<TRegistry>,
    HasDescriptions<TRegistry> {
  export<
    T extends (keyof TRegistry)[],
    TRet extends { [K in T[number]]: TRegistry[K] } = T extends []
      ? TRegistry
      : { [K in T[number]]: TRegistry[K] },
  >(
    ...keys: T
  ): ApplyContextI<TRet>;

  register<T extends string, TFn extends Constructor>(
    key: T,
    val: TFn,
    ...args: ToInject<ConstructorParameters<TFn>>
  ): RegBuilderI<TRegistry & { [K in T]: InstanceType<TFn> }>;

  register<T extends string, V, TFn extends Fn>(
    key: T,
    val: TFn,
    ...args: ToInject<Parameters<TFn>>
  ): RegBuilderI<TRegistry & { [K in T]: ReturnType<TFn> }>;

  register<T extends string, V>(
    key: T,
    val: V,
  ): RegBuilderI<TRegistry & { [K in T]: V }>;

  configure<T extends keyof TRegistry>(
    key: T,
  ): ServiceDescriptorI<TRegistry, TRegistry[T]>;

  uses<T extends ApplyContextI<any>[]>(
    ...args: T
  ): RegBuilderI<TRegistry & Merge<T>>;
}

type Merge<T extends ApplyContextI<any>[]> = T extends [
  infer First,
  ...infer Rest extends ApplyContextI<any>[],
]
  ? First extends ApplyContextI<infer V>
    ? V & Merge<Rest>
    : {}
  : {};

export const builder = <T extends RegistryType = {}>(): RegBuilderI<T> => {
  return new RegBuilder<T>();
};

export class HasRefsImpl<TRegistry extends RegistryType>
  implements HasRefs<TRegistry>
{
  protected constructor(
    protected _descriptions: {
      [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
    } = {} as any,
    protected _appliedContexts: ApplyContextI<any>[] = [],
  ) {}

  public get descriptions(): {
    [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
  } {
    return this._appliedContexts.reduce(
      (acc, cur) => {
        const desc = has(cur, "descriptions")
          ? (cur as any).descriptions
          : undefined;
        return desc ? Object.assign(acc, desc) : acc;
      },
      Object.assign({}, this._descriptions as any),
    );
  }

  public get refs(): { [K in keyof TRegistry]: PBinJKeyType<TRegistry[K]> } {
    return Object.fromEntries(
      Object.keys(this.descriptions).map((key) => {
        return [key, typeAlias<TRegistry>(key as keyof TRegistry)] as const;
      }),
    ) as any;
  }
}

class RegBuilder<TRegistry extends RegistryType = {}>
  extends HasRefsImpl<TRegistry>
  implements RegBuilderI<TRegistry>, HasDescriptions<TRegistry>
{
  constructor() {
    super();
  }

  /**
   * Register a value. with a key.
   * @param key
   * @param val
   */
  register<T extends keyof TRegistry>(key: T, ...val: unknown[]) {
    (this._descriptions as any)[key] = new ServiceDescriptor<
      TRegistry,
      TRegistry[T]
    >(key, val[0] as any, val.slice(1) as any);
    return this as any;
  }

  /**
   * Merge in other registries.
   * @param args
   */
  uses<T extends ApplyContextI<any>[]>(
    ...args: T
  ): RegBuilderI<TRegistry & Merge<T>> {
    this._appliedContexts.push(...args);
    return this as any;
  }

  configure<T extends keyof TRegistry>(key: T) {
    return this.descriptions[key] as any;
  }
  private _apply = (ctx: ContextI<any>) => {
    for (const val of Object.values(this._descriptions) as ServiceDescriptorI<
      any,
      any
    >[]) {
      ctx.register(val);
    }
  };
  /**
   * Close the registry and return an ApplyContext. This instance
   * should be used to apply the registry to a context.  The original
   * class should not be used after this.
   */
  export<
    T extends (keyof TRegistry)[],
    TRet extends { [K in T[number]]: TRegistry[K] } = T extends []
      ? TRegistry
      : { [K in T[number]]: TRegistry[K] },
  >(...keys: T): ApplyContextI<TRet> {
    const desc = this.descriptions;
    const descriptions = keys.length
      ? (Object.fromEntries(keys.map((v) => [v, desc[v]])) as any)
      : desc;

    return new ApplyContext<TRet>(
      descriptions,
      this._appliedContexts,
      this._apply,
    );
  }
}

/**
 * A registry that can be applied to a context. The idea being
 * we can create typesafe registries that can be composed together.
 *
 */
class ApplyContext<TRegistry extends RegistryType>
  extends HasRefsImpl<TRegistry>
  implements ApplyContextI<TRegistry>
{
  constructor(
    _descriptions: {
      [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
    } = {} as any,
    registries: ApplyContextI<any>[],
    private onApplyContext: (ctx: ContextI<TRegistry>) => void,
    private appliedContextKey = pbjKey<ApplyContextI<TRegistry>>(
      "applied-builder-context",
    ),
  ) {
    super(_descriptions, registries);
  }
  apply<TCRegistry extends RegistryType = {}>(
    ctx: ContextI<TCRegistry>,
  ): ContextI<TRegistry & TCRegistry> {
    if (hasA(ctx, "get", isFn)) {
      //checks if we are registered already.
      if (ctx.get(this.appliedContextKey as any)) {
        return ctx as any;
      }
    }

    for (const builder of this._appliedContexts) {
      builder.apply(ctx);
    }
    ctx.register(this.appliedContextKey, this as any);
    this.onApplyContext(ctx as any);
    return ctx as any;
  }
}
function typeAlias<
  TRegistry extends RegistryType,
  Key extends keyof TRegistry = keyof TRegistry,
>(name: Key): RegistryRef<TRegistry[Key]> {
  return { [typeAliasSymbol]: name } as any;
}

type RegistryRef<V> = PBinJKeyType<V>;

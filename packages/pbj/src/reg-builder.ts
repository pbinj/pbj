import {
  PBinJKeyType,
  RegistryType,
  ServiceDescriptorI,
} from "./types.js";
import { ServiceDescriptor } from "./service-descriptor.js";
import type { ContextI } from "./context-types.js";
import { typeAliasSymbol } from "./symbols.js";
import { pbjKey } from "./pbjKey.js";
import { has, hasA, isFn } from "@pbinj/pbj-guards";
import {
  ApplyContextI,
  RegBuilderI,
  HasRefs,
  ExtractNS,
  NamespaceRegistry,
  HasDescriptions,
  Ns,
  NamespaceRegistryToRegistry
} from "./reg-builder-type";

export {
  ApplyContextI, RegBuilderI, HasRefs, NamespaceRegistry, HasDescriptions, Ns
};

export const builder = <
    const TNamespace extends string | undefined,
    const  TApply extends ApplyContextI<any, any>[],
    const TRegistry extends RegistryType = {}
>(
    namespace?:TNamespace,
    ...args:TApply
):RegBuilderI<TRegistry, ExtractNS<TApply>, TNamespace> => {
  return new RegBuilder<TRegistry, ExtractNS<TApply>, TNamespace>(namespace).uses( ...args);
};

export class HasRefsImpl<TRegistry extends RegistryType>
  implements HasRefs<TRegistry>
{
  protected constructor(
    protected _namespace:string | undefined = undefined,
    protected _descriptions: {
      [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
    } = {} as any,
    protected _appliedContexts: ApplyContextI<any, any>[] = [],
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
      Object.entries(this.descriptions).map(([key, value]) => {
        const ta = typeAlias<TRegistry, keyof TRegistry>((value as any).key);
        return [key, ta] as const;
      }),
    ) as any;
  }
}

class RegBuilder<
    TRegistry extends RegistryType,
    TUses extends NamespaceRegistry[],
    TNamespace extends Ns,
    TRegNs extends RegistryType = TRegistry & NamespaceRegistryToRegistry<TUses>
>
  extends HasRefsImpl<TRegNs>
  implements RegBuilderI<TRegistry, TUses, TNamespace,TRegNs>, HasDescriptions<TRegNs>
{
  constructor(namespace?:TNamespace) {
    super(namespace);
  }
  namespace<T extends Ns>(name?: T): RegBuilderI<TRegistry, TUses, T> {
    this._namespace = name;
    return this as any;
  }

  /**
   * Register a value. with a key.
   * @param key
   * @param val
   */
  register<T extends keyof TRegistry>(key: T, ...val: any[]) {
    const [service, ...args] = val;
    (this._descriptions as any)[key] = new ServiceDescriptor<
      any,
      any>(key, service, args);
    return this as any;
  }

  /**
   * Merge in other registries.
   * @param args
   */
  uses<T extends ApplyContextI<any, any>[]>(
    ...args: T
  ) {
    this._appliedContexts.push(...args);
    return this as any;
  }

  configure(key: unknown) {
    return (this.descriptions as any)[key as any] as any;
  }
  private _apply = (ctx: ContextI<any>) => {
    for (const val of Object.values(this._descriptions) as ServiceDescriptorI<
      any,
      any
    >[]) {
      //namespace might be set after register, so this should make that work.
      val.key = this._namespace ? `${this._namespace}:${String(val.key)}` : val.key;
      ctx.register(val);
    }
  };
  /**
   * Close the registry and return an ApplyContext. This instance
   * should be used to apply the registry to a context.  The original
   * class should not be used after this.
   */
  export(...[key, ...rest]:unknown[]) {
    const desc = key === true ? this._descriptions : this.descriptions;
    const keys = ((key === true || key == null) ? Object.keys(desc) : [key, ...rest]) as unknown as (keyof TRegNs)[];
    const descriptions = keys.length
      ? (Object.fromEntries(keys.map((v) => [v, desc[v] as ServiceDescriptorI<any, any>])) as any)
      : desc;

    return new ApplyContext(
      this._namespace,
      descriptions,
      this._appliedContexts,
      this._apply,
    ) as any;
  }
}

/**
 * A registry that can be applied to a context. The idea being
 * we can create typesafe registries that can be composed together.
 *
 */
class ApplyContext<
    const TRegistry extends RegistryType,
    const TNamespace extends Ns,
    const TUses extends NamespaceRegistry[] ,
    const TNsReg extends TRegistry & NamespaceRegistryToRegistry<TUses> = TRegistry & NamespaceRegistryToRegistry<TUses>
>
  extends HasRefsImpl<TNsReg>
  implements ApplyContextI<TRegistry, TUses>
{
  constructor(
    _namespace:TNamespace,
    _descriptions: {
      [K in keyof TNsReg]: ServiceDescriptorI<TNsReg, TNsReg[K]>;
    } = {} as any,
    registries: ApplyContextI<any, any>[],
    private onApplyContext: (ctx: ContextI) => void,
    private appliedContextKey = pbjKey<ApplyContextI<TRegistry, TUses, TNsReg>>(
      _namespace ? `${_namespace}:applied-builder-context`: "applied-builder-context",
    ),
  ) {
    super(_namespace, _descriptions, registries);
  }
  apply<TCtx extends RegistryType>(
    ctx: ContextI<TCtx>,
  ) {
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
>(name: Key, namespace?:string): RegistryRef<TRegistry[Key]> {
  return { [typeAliasSymbol]: namespace ? `${namespace}:${String(name)}` : name } as any;
}

type RegistryRef<V> = PBinJKeyType<V>;

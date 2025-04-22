import {
  Constructor,
  Fn,
  PBinJKeyType,
  RegistryType,
  ServiceDescriptorI,
} from "./types.js";
import { ServiceDescriptor } from "./service-descriptor.js";
import { ContextI } from "./context-types.js";
import { typeAliasSymbol } from "./symbols.js";

type Merge<T> = T extends [infer First, ...infer Rest]
  ? First extends ApplyContext<infer T>
    ? T & Merge<Rest>
    : T & Merge<Rest>
  : T;

export const builder = () => {
  return new RegBuilder();
};
abstract class HasRefsImpl<TRegistry extends RegistryType> {
  protected constructor(
    protected _descriptions: {
      [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
    } = {} as any,
    protected registries: HasRefsImpl<any>[] = [],
  ) {}
  public get descriptions(): {
    [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
  } {
    return this.registries.reduce((acc, cur) => {
      const desc = cur.descriptions;
      return { ...acc, ...desc };
    }, this._descriptions) as any;
  }
  public get refs(): { [K in keyof TRegistry]: PBinJKeyType<TRegistry[K]> } {
    return Object.fromEntries(
      Object.entries(this.descriptions).map(([key, value]) => {
        return [
          key,
          regKey<TRegistry, keyof TRegistry>(key as keyof TRegistry),
        ] as const;
      }),
    ) as any;
  }
  protected addRegistry(...reg: HasRefsImpl<any>[]) {
    this.registries.push(...reg);
  }

  apply(ctx: ContextI<TRegistry>) {
    for (const reg of this.registries) {
      reg.apply(ctx);
    }
  }
}

class RegBuilder<
  TRegistry extends RegistryType = {},
> extends HasRefsImpl<TRegistry> {
  private services = new Set<ServiceDescriptorI<TRegistry, any>>();
  constructor() {
    super();
  }

  register<T extends string, V, TFn extends Constructor<V>>(
    key: T,
    val: TFn,
    ...args: ToKey<ConstructorParameters<TFn>>
  ): RegBuilder<TRegistry & { [K in T]: V }>;

  register<T extends string, V, TFn extends Fn<V>>(
    key: T,
    val: TFn,
    ...args: ToKey<Parameters<TFn>>
  ): RegBuilder<TRegistry & { [K in T]: V }>;

  register<T extends string, V>(
    key: T,
    val: V,
  ): RegBuilder<TRegistry & { [K in T]: V }>;

  /**
   * Register a value. with a key.
   * @param key
   * @param val
   */
  register<T extends keyof TRegistry>(key: T, ...val: unknown[]) {
    const serviceDescriptor = new ServiceDescriptor<TRegistry, TRegistry[T]>(
      key,
      val[0] as any,
      val.slice(1) as any,
    );
    serviceDescriptor.withName(String(key));
    this.services.add(serviceDescriptor);
    (this._descriptions as any)[key] = serviceDescriptor;
    return this as any;
  }

  /**
   * Merge in other registries.
   * @param args
   */
  uses<T extends ApplyContext<any>[]>(
    ...args: T
  ): RegBuilder<TRegistry & Merge<T>> {
    this.addRegistry(...args);
    return this as any;
  }

  configure(key: keyof TRegistry) {
    return this.descriptions[key];
  }

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
  >(...keys: T): ApplyContext<TRet> {
    const descriptions = keys.length
      ? (Object.fromEntries(keys.map((v) => [v, this._descriptions[v]])) as any)
      : this._descriptions;
    return new ApplyContext<TRet>(descriptions, this.registries, (ctx) => {
      for (const builder of this.registries) {
        builder.apply(ctx);
      }
      for (const val of this.services) {
        ctx.register(val);
      }
    });
  }
}

/**
 * A registry that can be applied to a context. The idea being
 * we can create typesafe registries that can be composed together.
 *
 */
class ApplyContext<
  TRegistry extends RegistryType,
> extends HasRefsImpl<TRegistry> {
  private applied = false;
  constructor(
    _descriptions: {
      [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
    } = {} as any,
    registries: HasRefsImpl<any>[],
    private onApplyContext: (ctx: ContextI<TRegistry>) => void,
  ) {
    super(_descriptions, registries);
  }
  apply<TCRegistry extends RegistryType = {}>(
    ctx: ContextI<TCRegistry>,
  ): ContextI<TRegistry & TCRegistry> {
    if (this.applied) return ctx as any;
    this.onApplyContext(ctx as any);
    this.applied = true;
    return ctx as any;
  }
}
function regKey<TRegistry extends RegistryType, Key extends keyof TRegistry>(
  name: Key,
): RegistryRef<TRegistry[Key]> {
  return { [typeAliasSymbol]: name } as any;
}

type ToKey<T> = T extends [infer First, ...infer Rest]
  ? [First | RegistryRef<First>, ...ToKey<Rest>]
  : [];

type RegistryRef<V> = PBinJKeyType<V>;

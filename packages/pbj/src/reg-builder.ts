import {Constructor, Fn, PBinJKeyType, RegistryType, ServiceDescriptorI} from "./types.js";
import {serviceSymbol} from "./symbols.js";
import {ServiceDescriptor} from "./service-descriptor.js";
import {ContextI} from "./context-types.js";
import {pbjKey} from './pbjKey.js'
type Merge<T> = T extends [infer First, ...infer Rest] ?
    First extends ApplyContext<infer T> ? T & Merge<Rest> : T & Merge<Rest> : T;

export const builder = ()=>{
    return new RegBuilder();
}

 class RegBuilder<TRegistry extends RegistryType = {}> {
    private services = new Map<symbol,ServiceDescriptorI<TRegistry, any>>();
    private refs = new Map<PropertyKey, RegistryRef<any>>();
    private registries: ApplyContext<any>[] = [];
    constructor() {
    }
    /**
     * Register a value. with a key.
     * @param key
     * @param val
     */
    register<T extends string, V>(key: T, val: V):RegBuilder<TRegistry & { [K in T]: V }> {
        const ref = this.ref(key as any);
        this.services.set(ref,new ServiceDescriptor(
            ref,
            val,
            undefined,
            false,
            false,
        ));
        return this as any;
    }
    /**
     * Configure a service.
     * @param key
     */
    configure<T extends keyof TRegistry>(key:T){
        return this.services.get(this.ref(key))!
    }
    /**
     * Merge in other registries.
     * @param args
     */
    uses<T extends ApplyContext<any>[]>(...args: T): RegBuilder<TRegistry & Merge<T>> {
        this.registries.push(...args);
        return this as any;
    }

    /**
     * Create a reference to a value in the registry.
     * @param key
     */
    ref<K extends keyof TRegistry>(key: K): RegistryRef<TRegistry[K]> {
        if (this.refs.has(key)) return this.refs.get(key)!;
        const ref = regKey<TRegistry, K>(key);
        this.refs.set(key, ref);
        return ref;
    }
    factory<T extends string, V,
        TFn extends Constructor<V>,
        TArgs extends ToKey<ConstructorParameters<TFn>>,
    >(key: T, val: TFn, ...args: TArgs):RegBuilder<TRegistry & { [K in T]: V }> ;
    /**
     * Register a factory.
     * @param key
     * @param val
     * @param args
     */
    factory<T extends string, V,
        TFn extends Fn<V>,

    >(key: T, val: TFn, ...args:ToKey<Parameters<TFn>>):RegBuilder<TRegistry & { [K in T]: V }>;

    factory(key:string, ...vals:unknown[]){
        this.services.set(this.ref(key as any), ServiceDescriptor.factory(vals[0] as any, ...vals.slice(1) as any));
        return this as any;
    }

    /**
     * Close the registry and return an ApplyContext. This instance
     * should be used to apply the registry to a context.  The original
     * class should not be used after this.
     */
    close() {
        return new ApplyContext<TRegistry>((ctx) => {
            for (const builder of this.registries) {
                builder.apply(ctx);
            }
            for (const val of this.services.values()) {
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
class ApplyContext<TRegistry extends RegistryType> {
    private applied = false;
    constructor(private onApplyContext: (ctx: ContextI<TRegistry>)=> void) {}
    apply(ctx: ContextI<TRegistry>) {
        if (this.applied) return;
        this.onApplyContext(ctx);
        this.applied = true;
    }
}
function regKey<TRegistry extends RegistryType, Key extends keyof TRegistry>(name: Key): RegistryRef<TRegistry[Key]> {
    return pbjKey<TRegistry[Key]>(name as any);
}

type ToKey<T> = T extends [infer First, ...infer Rest]
    ? [First | RegistryRef<First>, ...ToKey<Rest>]
    : [];

type RegistryRef<V> = PBinJKeyType<V>;


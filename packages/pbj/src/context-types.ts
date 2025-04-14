import type {
    Constructor,
    Fn,
    PBinJKey,
    PBinJKeyType,
    RegistryType,
    ServiceDescriptorI,
    ValueOf, VisitFn
} from "./types";
import type {Registry} from "./registry";
import {Listener} from "./util";
import {ServiceContext} from "./service-context";

/**
 * This needs to make all the arguments for a type.
 * register(class Service{})
 * and
 * register(()=>{});
 * should both work.  In addition,
 * function fn(a:string, b:string) {}
 * const aKey = pbjKey("a");
 * register(aKey, "a");
 * register(fn, aKey, "b");
 *              ----  ---  -- MakeFactory
 *
 */
type ToInject<T> = T extends [infer First, ...infer Rest] ? [First | PBinJKeyType<First>, ...ToInject<Rest>] : [];

type FlatInvoke<TValue, TFn extends Fn<TValue> = Fn<TValue>, TCon extends Constructor<TValue> = Constructor<TValue>> =  [
    TCon, ...ToInject<ConstructorParameters<TCon>>
] | [
    TFn, ...ToInject<Parameters<TFn>>
] | [TValue];

const EMPTY_ARR = [] as const;
type EMPTY = typeof EMPTY_ARR;

export type RegisterArgs<TRegistry extends RegistryType, TKey extends PBinJKey<TRegistry>> = EMPTY |(
    TKey extends PBinJKeyType<infer TValue> ? FlatInvoke<TValue> :
        TKey extends keyof TRegistry ? FlatInvoke<TRegistry[TKey]> :
                TKey extends Constructor? (ToInject<ConstructorParameters<TKey>> ):
                        TKey extends Fn ? (ToInject<Parameters<TKey>>    ):  EMPTY);




export interface  ResolveContext<TRegistry extends RegistryType> {
    resolve<T extends PBinJKey<TRegistry>>(key:T, ...args: RegisterArgs<TRegistry,T> ):ValueOf<TRegistry, T>;
    resolveAsync<T extends PBinJKey<TRegistry>>(key:T, ...args:RegisterArgs< TRegistry, T>):Promise<ValueOf<TRegistry, T>>;
}

export interface RegisterContext<TRegistry extends RegistryType> {
    register<T extends PBinJKey<TRegistry>>(key:T, ...args: RegisterArgs<TRegistry, T>):ServiceDescriptorI<TRegistry, ValueOf<TRegistry, T>>;
}

export interface ContextI<TRegistry extends RegistryType = Registry> extends ResolveContext<TRegistry>, RegisterContext<TRegistry>{


    newContext<TTRegistry extends TRegistry = TRegistry>(): ContextI<TTRegistry>;
    pbj<T extends PBinJKey<TRegistry>>(service: T): ValueOf<TRegistry, T>;
    pbj(service: unknown): unknown;
    visit(fn: VisitFn<TRegistry, any>): void;
    visit<T extends PBinJKey<TRegistry>>(
        service: T,
        fn: VisitFn<TRegistry, T>,
    ): void;
    onServiceAdded(
        fn:Listener<ServiceContext<TRegistry, any>>,
        noInitial?: boolean,
    ): () => void;

}
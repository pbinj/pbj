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
export type ToInject<T> = T extends [infer First, ...infer Rest] ? [ PBinJKeyType<First>| First, ...ToInject<Rest>] : [];

type FlatInvoke<TValue, TFn extends Fn<TValue> = Fn<TValue>, TCon extends Constructor<TValue> = Constructor<TValue>> =  readonly [
    TCon, ...ToInject<ConstructorParameters<TCon>>
] | readonly [
    TFn, ...ToInject<Parameters<TFn>>
];
type FnInvoke<TValue, TFn extends Fn<TValue> = Fn<TValue>> = readonly [TFn, ...ToInject<Parameters<TFn>>];
const EMPTY_ARR = [] as const;
type EMPTY = typeof EMPTY_ARR;

export type RegisterArgs<TRegistry extends RegistryType,
    TKey extends PBinJKey<TRegistry>
    > = EMPTY |(
    TKey extends PBinJKeyType<infer TValue> ?
        FnInvoke<TValue> :
        TKey extends keyof TRegistry ? FlatInvoke<TRegistry[TKey]> :
                TKey extends Constructor? (ToInject<ConstructorParameters<TKey>> ):
                        TKey extends Fn ? (ToInject<Parameters<TKey>>    ):  never);




export interface  ResolveContext<TRegistry extends RegistryType> {
    resolve<T extends keyof TRegistry>(key:T):TRegistry[T];
    resolve<T extends keyof TRegistry>(key:T, alias: PBinJKeyType<TRegistry[T]>):TRegistry[T];
    resolve<T extends keyof TRegistry, TFn extends Fn<TRegistry[T]>>(key:T, fn:TFn, ...args:ToInject<Parameters<TFn>>):TRegistry[T];
    resolve<T extends keyof TRegistry, TCon extends Constructor<TRegistry[T]>>(key:T, fn:TCon, ...args:ToInject<ConstructorParameters<TCon>>):TRegistry[T];

    resolve<T, TKey extends PBinJKeyType<T>>(key:TKey):T;
    resolve<T, TKey extends PBinJKeyType<T>>(key:TKey, alias:PBinJKeyType<T>):T;
    resolve<T,
        TKey extends PBinJKeyType<T>,
        TFn extends Fn<T>
    >(key:TKey, fn:TFn, ...args:ToInject<Parameters<TFn>>):T;
    resolve<T,
        TKey extends PBinJKeyType<T>,
        TCon extends Constructor<T>
    >(key:TKey, fn:TCon, ...args:ToInject<ConstructorParameters<TCon>>):T;

    resolve<T, TFn extends Fn<T>>(fn:TFn):T;
    resolve<T, TFn extends Fn<T>>(fn:TFn, ...args:ToInject<Parameters<TFn>>):T;

    resolve<T, TCon extends Constructor<T>>(fn:TCon):T;
    resolve<T, TCon extends Constructor<T>>(fn:TCon, ...args:ToInject<Constructor<TCon>>):T;

}
export interface  ResolveAsyncContext<TRegistry extends RegistryType> {
    resolveAsync<T extends keyof TRegistry>(key:T):Promise<TRegistry[T]>;
    resolveAsync<T, TKey extends PBinJKeyType<T>>(key:TKey):Promise<T>;
    resolveAsync<T, TFn extends Fn<T>>(fn:TFn):Promise<T>;
    resolveAsync<T, TFn extends Constructor<T>>(fn:TFn):Promise<T>;
}

export interface RegisterContext<TRegistry extends RegistryType> {
    register<T extends keyof TRegistry>(key:T):ServiceDescriptorI<TRegistry,TRegistry[T]>;
    register<T extends keyof TRegistry>(key:T, alias: PBinJKeyType<TRegistry[T]>):ServiceDescriptorI<TRegistry,TRegistry[T]>;
    register<T extends keyof TRegistry, TFn extends Fn<TRegistry[T]>>(key:T, fn:TFn, ...args:ToInject<Parameters<TFn>>):ServiceDescriptorI<TRegistry,TRegistry[T]>;
    register<T extends keyof TRegistry, TCon extends Constructor<TRegistry[T]>>(key:T, fn:TCon, ...args:ToInject<ConstructorParameters<TCon>>):ServiceDescriptorI<TRegistry,TRegistry[T]>;

    register<T, TKey extends PBinJKeyType<T>>(key:TKey):ServiceDescriptorI<TRegistry,T>;
    register<T, TKey extends PBinJKeyType<T>>(key:TKey, alias:PBinJKeyType<T>):ServiceDescriptorI<TRegistry,T>;
    register<T,
        TKey extends PBinJKeyType<T>,
        TFn extends Fn<T>
    >(key:TKey, fn:TFn, ...args:ToInject<Parameters<TFn>>):ServiceDescriptorI<TRegistry,T>;
    register<T,
        TKey extends PBinJKeyType<T>,
        TCon extends Constructor<T>
    >(key:TKey, fn:TCon, ...args:ToInject<ConstructorParameters<TCon>>):ServiceDescriptorI<TRegistry,T>;

    register<T, TFn extends Fn<T>>(fn:TFn):ServiceDescriptorI<TRegistry,T>;
    register<T, TFn extends Fn<T>>(fn:TFn, ...args:ToInject<Parameters<TFn>>):ServiceDescriptorI<TRegistry,T>;

    register<T, TCon extends Constructor<T>>(fn:TCon):ServiceDescriptorI<TRegistry,T>;
    register<T, TCon extends Constructor<T>>(fn:TCon, ...args:ToInject<Constructor<TCon>>):ServiceDescriptorI<TRegistry,T>;
}

export interface ContextI<TRegistry extends RegistryType = Registry>
    extends ResolveContext<TRegistry>,
        ResolveAsyncContext<TRegistry>,
        RegisterContext<TRegistry>{


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

export type ToPBinJType<T> = T extends [infer First, ...infer Rest] ? [ PBinJKeyType<First>, ...ToPBinJType<Rest>] : [];
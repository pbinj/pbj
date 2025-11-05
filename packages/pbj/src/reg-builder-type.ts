import {
    Constructor,
    Fn,
    PBinJKeyType,
    RegistryType,
    ServiceDescriptorI,
} from "./types.js";
import type { ContextI, ToInject } from "./context-types.js";

export type ExtractNS<T extends ApplyContextI<any, any>[]> = T extends [
        infer _First extends ApplyContextI<any, infer TNr extends NamespaceRegistry>,
        ...infer Rest extends ApplyContextI<any, any>[],
    ]
    ? [...TNr, ...ExtractNS<Rest>]
    : [];

export interface HasDescriptions<TRegistry extends RegistryType> {
    readonly descriptions: {
        [K in keyof TRegistry]: ServiceDescriptorI<TRegistry, TRegistry[K]>;
    };
}

export interface HasRefs<TRegistry extends RegistryType> {
    readonly refs: { [K in keyof TRegistry]: PBinJKeyType<TRegistry[K]> };
}

export type Ns = string | undefined;

type ToNamespace<T, TNs extends Ns> = TNs extends string ? {
    [K in keyof T & string as `${TNs}:${K}`]:T[K]
} : T;

export type NamespaceRegistry<TRegistry extends RegistryType = any, TNamespace extends Ns = any> =
    [registry:TRegistry, namespace:TNamespace];

export type NamespaceRegistryToRegistry<T extends NamespaceRegistry[]> = T extends [
    infer First extends NamespaceRegistry,
    ...infer Rest extends NamespaceRegistry[],
] ? ToNamespace<First[0], First[1]> & NamespaceRegistryToRegistry<Rest> : {};

export interface ApplyContextI<
    TRegistry extends RegistryType,
    TNs extends NamespaceRegistry[],
    TNsReg extends TRegistry & NamespaceRegistryToRegistry<TNs> = TRegistry & NamespaceRegistryToRegistry<TNs>
> extends HasRefs<TNsReg> {
    apply<Ctx extends ContextI<any>>(
        ctx: Ctx,
    ): Ctx extends ContextI<infer TCtx> ? ContextI< TRegistry & NamespaceRegistryToRegistry<TNs>  & TCtx> : never;
}

export interface RegBuilderI<
    TRegistry extends RegistryType,
    TUses extends NamespaceRegistry[],
    TNamespace extends Ns ,
    TNSReg extends TRegistry & NamespaceRegistryToRegistry<TUses> = TRegistry & NamespaceRegistryToRegistry<TUses>
>
    extends HasRefs<TNSReg>,
        HasDescriptions<TNSReg> {
    namespace<const TNs extends Ns>(name:TNs):RegBuilderI<TRegistry, [[TRegistry, TNs], ...TUses], TNs>;
    export(val:true): ApplyContextI<TRegistry, [[TRegistry, TNamespace], ...TUses]>;
    export<
        const T extends (keyof TNSReg)[] ,
        const TRet extends { [K in T[number]]: TNSReg[K] } = T extends []
            ? TRegistry
            : { [K in T[number]]: TRegistry[K] },
    >(
        ...keys: T
    ): ApplyContextI<TRet,  [[TRet, TNamespace], ...TUses]>;

    register< const T extends string, TFn extends Constructor>(
        key: T,
        val: TFn,
        ...args: ToInject<ConstructorParameters<TFn>>
    ): RegBuilderI<TRegistry & { [K in T]: InstanceType<TFn> }, TUses, TNamespace>;

    register< const T extends string, V, TFn extends Fn>(
        key: T,
        val: TFn,
        ...args: ToInject<Parameters<TFn>>
    ): RegBuilderI<TRegistry & { [K in T]: ReturnType<TFn> }, TUses, TNamespace>;

    register< const T extends string, V>(
        key: T,
        val: V,
    ): RegBuilderI<TRegistry & { [K in T]: V }, TUses, TNamespace>;

    configure<
        const TNs extends RegistryType = TRegistry & NamespaceRegistryToRegistry<TUses>,
        const T extends keyof TNs = keyof TNs>(
        key: T,
    ): ServiceDescriptorI<TNs, TNs[T]>;

    uses<
        const T extends ApplyContextI<any, any>[]>(
        ...args: T
    ): RegBuilderI<TRegistry, [...TUses, ...ExtractNS<T>], TNamespace>;
}

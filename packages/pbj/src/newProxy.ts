import { nullableSymbol } from "./guards.js";
import {
  has as _has,
  hasA,
  type Constructor,
  type Fn,
  isObjectish,
} from "@pbinj/pbj-guards";
import { proxyKey, serviceDescriptorKey, serviceSymbol } from "./symbols.js";
import type {RegistryType, Returns, ServiceDescriptorI} from "./types.js";
import {ServiceContext} from "./service-context";

export function newProxy<T, TRegistry extends RegistryType, V extends Returns<T>>(
  service:ServiceContext<TRegistry, T>
):V {
  return new Proxy( service.description.isListOf ? [] : {} as any, {
    get(_target, prop) {
      if (prop === proxyKey) {
        return service.key;
      }
      if (prop === serviceDescriptorKey) {
        return service;
      }
      const val = service.invoke();
      if (prop === nullableSymbol) {
        return val == null;
      }
      if (val == null) {
        if (prop === "toString") {
          return () => val + "";
        }
        return null;
      }

      //So sometimes a factory value returns a primitive, this handles that.
      if (service.primitive) {
        const prim = val;
        if (
          prop === Symbol.toPrimitive ||
          prop === Symbol.toStringTag ||
          prop === "$$typeof"
        ) {
          return (prim as any)[prop];
        }
        const value = (prim as any)[prop as any];
        return value == null
          ? prim
          : typeof value === "function"
            ? value.bind(prim)
            : value;
      }

      return typeof (val as any)[prop] === "function"
        ? (val as any)[prop].bind(val)
        : (val as any)[prop];
    },
    getOwnPropertyDescriptor(_target, prop) {
      const val = service.invoke();
      if (service.description.isListOf && prop === "length") {
        let aval = Array.isArray(val) ? val : Array.from(Object.values(val as any));
        return Reflect.getOwnPropertyDescriptor(aval as any, prop);
      }
      if (Array.isArray(val)) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(val as any, prop);
    },
    set(_target, prop, value) {
      (service.invoke() as any)[prop] = value;
      return true;
    },
    ownKeys() {
      const value = service.invoke();
      if (service.primitive) {
        return [];
      }
      return Reflect.ownKeys(value as any);
    },
    has(_target, prop) {
      const val = service.invoke();
      if (service.primitive) {
        return false;
      }
      return isObjectish(val) ? prop in val : false;
    },
    getPrototypeOf() {
      return Object.getPrototypeOf(service.invoke());
    },
  });
}

function isServiceDescriptor<T extends Fn | Constructor | unknown>(
  v: unknown,
): v is ServiceDescriptorI<any, T> {
  return _has(v, serviceSymbol);
}

export const serviceDescriptor = <T extends Fn | Constructor | unknown>(
  v: T,
): ServiceDescriptorI<any, T> | undefined => {
  if (hasA(v, serviceDescriptorKey, isServiceDescriptor)) {
    return v[serviceDescriptorKey] as any;
  }
  return;
};

import { hasA, nullableSymbol } from "./guards";
import { ServiceDescriptor } from "./ServiceDescriptor";
import type { Constructor, Fn } from "./types";

export const proxyKey = Symbol("@pbj/proxy-key");
export const serviceDescriptorKey = Symbol("@pbj/service-descriptor");

export function newProxy<T extends Constructor>(
  key: unknown,
  service: ServiceDescriptor<any, any>,
) {
  return new Proxy({} as InstanceType<T>, {
    get(_target, prop) {
      if (prop === proxyKey) {
        return key;
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
    getOwnPropertyDescriptor(target, prop) {
      const val = service.invoke();
      if (Array.isArray(val)) {
        return undefined;
      }
      return Reflect.getOwnPropertyDescriptor(val, prop);
    },
    set(_target, prop, value) {
      service.invoke()[prop] = value;
      return true;
    },
    ownKeys() {
      const value = service.invoke();
      if (service.primitive) {
        return [];
      }
      const keys = Reflect.ownKeys(value);
      return keys;
    },
    has(_target, prop) {
      const val = service.invoke();
      if (service.primitive) {
        return false;
      }
      return prop in val;
    },
    getPrototypeOf() {
      return Object.getPrototypeOf(service.invoke());
    },
  });
}

function isServiceDescriptor<T extends Fn | Constructor | unknown>(
  v: unknown,
): v is ServiceDescriptor<any, T> {
  return v instanceof ServiceDescriptor;
}

export const serviceDesciptor = <T extends Fn | Constructor | unknown>(
  v: T,
): ServiceDescriptor<any, T> | undefined => {
  if (hasA(v, serviceDescriptorKey, isServiceDescriptor)) {
    return v[serviceDescriptorKey] as any;
  }
  return;
};

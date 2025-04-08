import { has, hasA, isFn, isSymbol } from "@pbinj/pbj-guards";
import { PBinJError } from "./errors.js";
import { Context } from "./context.js";
import { ServiceDescriptor } from "./ServiceDescriptor.js";
import { keyOf } from "./util.js";
import { type PBinJKey, type ServiceDescriptorI } from "./types.js";
import { serviceProxySymbol } from "./symbols.js";
import { AsyncLocalStorage } from "node:async_hooks";

//borrowed from https://eytanmanor.medium.com/should-you-use-asynclocalstorage-2063854356bb
const asyncLocalStorage = new AsyncLocalStorage<
  Map<PBinJKey<any>, ServiceDescriptorI<any, any>>
>();

/**
 * Scoping allows for a variable to be scoped to a specific context.  This is
 * useful for things like database connections, or other resources that need to be
 * scoped to a specific context.   Note the requirement to use either a `Registry` key or
 * a `pbjKey`.
 *
 * @param key - typeKey or registry key
 * @returns
 */
const scoped: Context["scoped"] = function (this: Context, key) {
  const serviceDesc = this.register(key);
  if (
    hasA(serviceDesc, serviceProxySymbol, isSymbol) &&
    serviceDesc[serviceProxySymbol] !== (keyOf(key) as any)
  ) {
    throw new PBinJError(
      `key ${String(key)} already registered as '${String(serviceDesc[serviceProxySymbol])}', can not register a key into more than one scope`,
    );
  }
  if (has(serviceDesc, asyncLocalSymbol)) {
    throw new PBinJError(
      `key ${String(key)} already registered as async scoped, can not register a key into more than one scope`,
    );
  }

  serviceDesc.withInterceptors(() => {
    return getServiceDescription(key).invoke();
  });
  //@ts-expect-error - this allows to check if the invoke function is async scoped.
  serviceDesc[asyncLocalSymbol] = key;

  return (next: () => void, ...[service, ...args]) => {
    const map = asyncLocalStorage.getStore() ?? new Map();
    if (!map.has(key)) {
      map.set(
        key,
        new ServiceDescriptor(
          key,
          service,
          args as any,
          false,
          isFn(service),
          `async scoped pbj '${String(key)}'`,
        ),
      );
    }
    return asyncLocalStorage.run(map, next) as any;
  };
};

function getServiceDescription(
  key: PBinJKey<any>,
): ServiceDescriptorI<any, any> {
  const serviceDesc = asyncLocalStorage.getStore()?.get(key);
  if (!serviceDesc) {
    throw new PBinJError(
      `key ${String(key)} not found in async storage, make sure the callback has been handled.`,
    );
  }
  return serviceDesc;
}
Context.prototype.scoped = scoped;

const asyncLocalSymbol = Symbol();

import { context, contextProxyKey, Context, createNewContext } from "./context.js";
import { isObjectish } from "@pbinj/pbj-guards";
import { proxyValueSymbol } from "./symbols.js";

let origContext: Context | undefined;

let count = 0;

/**
 * Run this before each test, to create new context.
 * any pbj proxies created after this will be in the new context.
 * any pbj proxies created before this will be in the original context.
 */
export function runBeforeEachTest() {
  if (count) {
    console.warn(
      "runBeforeEachTest called more than once, before runAfterEachTest",
    );
  }
  console.log("runBeforeEachTest");
  count++;
  //@ts-ignore
  origContext = context[contextProxyKey] as Context;
  //@ts-ignore
  context[contextProxyKey] = createNewContext();
}
/**
 * Run this after each test, to restore the original context.
 */
export function runAfterEachTest() {
  count--;

  if (count < 0) {
    console.warn(
      "runAfterEachTest called more than once, before runBeforeEachTest",
    );
  }
  //@ts-ignore
  context[contextProxyKey] = origContext;
}

function isPBJProxy(a: unknown) {
  return isObjectish(a) && (a as any)[proxyValueSymbol] !== undefined;
}

/**
 * Usable with some `expect` like vitest `toEqual` so you
 * can compare proxies nicely.   This should prevent the
 * need to "convert" proxies to their underlying value before comparing.
 * Note: this will return `undefined` if neither `a` nor `b` are proxies. This
 * is the signal to `expect` to use its default equality tester.
 *
 * ```
 * import {expect} from 'vitest';
 * expect.addEqualityTesters([isPBJProxyEqualalityTester]);
 * ```
 *
 */
export function isPBJProxyEqualalityTester(a: unknown, b: unknown) {
  const isAProxy = isPBJProxy(a);
  const isBProxy = isPBJProxy(b);
  if (isAProxy && isBProxy) {
    return (a as any)[proxyValueSymbol] === (b as any)[proxyValueSymbol];
  }
  if (isAProxy) {
    return (a as any)[proxyValueSymbol] === b;
  }
  if (isBProxy) {
    return a === (b as any)[proxyValueSymbol];
  }
  return undefined;
}

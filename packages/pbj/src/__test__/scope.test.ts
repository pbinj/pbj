import { describe, it, expect } from "vitest";
import { context, pbj, pbjKey } from "../index.js";
import "../scope.js";

const MAX_ITER = 100;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
describe("scope", () => {
  it("should maintain separate values across async operations", async () => {
    const scopedKey = pbjKey<string>("async-scoped-value");

    class ScopedValue {
      constructor(public value: string = pbj(scopedKey)) {}
    }
    const sv = pbj(ScopedValue);
    const scopeHandler = context.scoped(scopedKey);
    const all: unknown[] = [];

    for (const [i, v] of range(0, MAX_ITER, "value")) {
      // Create a new scope for each iteration so we can make sure scopes don't leak across async operations.
      const handle = scopeHandler(async () => {
        expect(sv.value.toString()).toBe(v);

        //I want the promises to step on each other, to make sure its safe.
        await wait(5 * (MAX_ITER - i));

        expect(sv.value.toString()).toBe(v);
      }, v);

      // Verify that the handler returns a promise
      expect(handle).toBeInstanceOf(Promise);

      // Collect all promises so we can wait for them to complete
      all.push(handle);
    }

    expect((await Promise.all(all)).length).toBe(MAX_ITER);

    // Verify that accessing outside of any scope throws an error
    expect(() => context.resolve(scopedKey)).toThrow();
  });
});

function* range(start: number, end: number, prefix = "") {
  for (let i = start; i < end; i++) yield [i, `${prefix}${i}`] as const;
}

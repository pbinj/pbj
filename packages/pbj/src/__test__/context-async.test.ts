import { describe, it, expect } from "vitest";
import { context, createNewContext, Fn, pbjKey } from "../index.js";
import "../scope.js";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
describe("resolveAsync", () => {
  it("should resolve async dependencies", async () => {
    const ctx = createNewContext();
    const asyncKey = pbjKey<string>("async-value");
    const dependentKey = pbjKey<string>("dependent-value");

    // Register an async service
    ctx.register(asyncKey, async () => {
      await wait(10);
      return "async result";
    });

    // Register a dependent service
    ctx.register(dependentKey, (asyncValue = ctx.pbj(asyncKey)) => {
      return `dependent: ${asyncValue}`;
    });

    // Test async resolution
    const result = await ctx.resolveAsync(dependentKey);
    expect(result).toBe("dependent: async result");
  });

  it("should handle multiple async dependencies", async () => {
    const ctx = createNewContext();
    const async1 = pbjKey<number>("async1");
    const async2 = pbjKey<number>("async2");
    const sumKey = pbjKey<number>("sum");

    ctx.register(async1, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 1;
    });

    ctx.register(async2, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return 2;
    });

    ctx.register(sumKey, (a = ctx.pbj(async1), b = ctx.pbj(async2)) => {
      return a + b;
    });

    const result = await ctx.resolveAsync(sumKey);
    expect(result).toBe(3);
  });

  it("should throw non-async errors", async () => {
    const ctx = createNewContext();
    const errorKey = pbjKey<string>("error");

    ctx.register(errorKey, () => {
      throw new Error("test error");
    });

    await expect(ctx.resolveAsync(errorKey)).rejects.toThrow("test error");
  });
  it("should throw an error when async is not enabled", () => {
    const ctx = createNewContext();
    const asyncKey = pbjKey<string>("async-value");
    const dependentKey = pbjKey<string>("dependent-value");

    // Register an async service
    ctx.register(asyncKey, async () => {
      await wait(10);
      return "async result";
    });

    // Register a dependent service
    ctx.register(dependentKey, (asyncValue = ctx.pbj(asyncKey)) => {
      return `dependent: ${asyncValue}`;
    });

    // Test async resolution
    expect(() => ctx.resolve(dependentKey)).toThrowError(
      "[async-value pending]: you have a async return from a service, please use context.resolveAsync"
    );
  });
});

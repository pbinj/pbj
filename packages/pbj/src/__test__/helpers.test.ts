import { describe, it, expect } from "vitest";
import { pathOf } from "../helpers.js";
import { context, pbjKey } from "../index.js";

describe("helpers", () => {
  describe("toPath", () => {
    // Testing the internal toPath function behavior through get/pathOf
    it("should split path with dots", () => {
      const value = { a: { b: "value" } } as const;
      const key = pbjKey<typeof value>("test");
      context.register(key, value);
      const getter = pathOf(key, "a.b");
      expect(getter()).toBe("value");
    });

    it("should split path with brackets", () => {
      const key = pbjKey<{ items: string[] }>("test-array");
      context.register(key, { items: ["a", "b"] });
      const getter = pathOf(key, "items[0]");
      expect(getter()).toBe("a");
    });
  });

  describe("get", () => {
    it("should handle undefined gracefully", () => {
      const key = pbjKey<{ a?: { b: string } }>("test-undefined");
      context.register(key, {});
      const getter = pathOf(key, "a.b");
      expect(getter()).toBeUndefined();
    });

    it("should handle nested paths", () => {
      const key = pbjKey<{ deep: { nested: { value: number } } }>("test-deep");
      context.register(key, { deep: { nested: { value: 42 } } });
      const getter = pathOf(key, "deep.nested.value");
      expect(getter()).toBe(42);
    });
  });

  describe("pathOf", () => {
    it("should create a getter function", () => {
      const key = pbjKey<{ value: string }>("test-getter");
      context.register(key, { value: "test" });
      const getter = pathOf(key, "value");
      expect(getter()).toBe("test");
    });
    it("should create a getter function twice", () => {
      const key = pbjKey<{ value: string }>("test-getter");
      context.register(key, { value: "test" });
      const getter = pathOf(key, "value");
      expect(getter()).toBe("test");

      context.register(key, { value: "test2" });
      const getter2 = pathOf(key, "value");
      expect(getter2()).toBe("test2");
    });
    it("should handle factory returns", () => {
      const factory = () => ({ value: "test" });
      context.register(factory);
      const getter = pathOf(factory, "value");
      expect(getter()).toBe("test");
    });

    it("should work with custom context", () => {
      const key = pbjKey<{ value: string }>("test-context");
      const customCtx = { value: "custom" };
      const getter = pathOf(key, "value");
      expect(getter(customCtx)).toBe("custom");
    });

    it("should handle complex paths", () => {
      const key = pbjKey<{ users: Array<{ name: string }> }>("test-complex");
      context.register(key, {
        users: [{ name: "Alice" }, { name: "Bob" }],
      });

      const getter = pathOf(key, "users[1].name");
      expect(getter()).toBe("Bob");
    });
  });
});

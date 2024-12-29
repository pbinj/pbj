import { describe, it, expect } from "vitest";
import { isRequired, asserts, GuardError, isNumber, isString } from "../guard";
import { allOf, anyOf } from "../schema/schema";

describe("guard", () => {
  describe("anyOf", () => {
    it("should return true if any guard passes", () => {
      const guard = anyOf(isString, isNumber);

      expect(guard("hello")).toBe(true);
      expect(guard(42)).toBe(true);
      expect(guard(true)).toBe(false);
    });
  });

  describe("allOf", () => {
    it("should return true if all guards pass", () => {
      const isLongEnough = (value: unknown): value is string =>
        typeof value === "string" && value.length > 5;
      const guard = allOf(isString, isLongEnough);

      expect(guard("hello world")).toBe(true);
      expect(guard("short")).toBe(false);
      expect(guard(42)).toBe(false);
    });
    it("should return false if all guards do not pass", () => {
      //This is not possible but, testing it
      const guard = allOf(isString, isNumber);

      expect(guard("hello world")).toBe(false);
    });
  });

  describe("isRequired", () => {
    it("should return true for non-null and non-undefined values", () => {
      expect(isRequired("hello")).toBe(true);
      expect(isRequired(0)).toBe(true);
      expect(isRequired(false)).toBe(true);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe("asserts", () => {
    it("should not throw for valid values", () => {
      const assertString = asserts(isString);

      expect(() => assertString("hello")).not.toThrow();
    });

    it("should throw GuardError for invalid values", () => {
      const assertString = asserts(isString);

      expect(() => assertString(42)).toThrow(GuardError);
    });
  });
});

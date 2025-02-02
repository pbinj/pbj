import { describe, it, expect } from "vitest";
import { isArray, array } from "../isArray.js";
import { isString } from "../isString.js";
import { isNumber } from "../isNumber.js";

describe("isArray", () => {
  describe("basic array validation", () => {
    it("should return true for arrays", () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(["a", "b", "c"])).toBe(true);
    });

    it("should return false for non-arrays", () => {
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray("not an array")).toBe(false);
      expect(isArray(123)).toBe(false);
    });
  });

  describe("with type guard", () => {
    it("should validate array elements with string guard", () => {
      expect(isArray(["a", "b", "c"], isString)).toBe(true);
      expect(isArray(["a", 1, "c"], isString)).toBe(false);
      expect(isArray([], isString)).toBe(true);
    });

    it("should validate array elements with number guard", () => {
      expect(isArray([1, 2, 3], isNumber)).toBe(true);
      expect(isArray([1, "2", 3], isNumber)).toBe(false);
      expect(isArray([], isNumber)).toBe(true);
    });
  });
});

describe("array", () => {
  describe("guard creation", () => {
    it("should create a type guard for arrays", () => {
      const stringArrayGuard = array(isString);
      expect(stringArrayGuard(["hello", "world"])).toBe(true);
      expect(stringArrayGuard([1, 2, 3])).toBe(false);
    });

    it("should create a guard without element type checking", () => {
      const anyArrayGuard = array();
      expect(anyArrayGuard([])).toBe(true);
      expect(anyArrayGuard([1, "2", true])).toBe(true);
      expect(anyArrayGuard("not an array")).toBe(false);
    });
  });

  describe("schema generation", () => {
    it("should generate correct schema for array without guard", () => {
      const anyArrayGuard = array();
      const schema = anyArrayGuard.toSchema({}, "test");
      expect(schema).toEqual({
        type: "array",
        items: undefined,
      });
    });

    it("should generate correct schema for typed array", () => {
      const stringArrayGuard = array(isString);
      const schema = stringArrayGuard.toSchema(
        {
          type: "array",
        },
        "test",
      );
      expect(schema).toEqual({
        type: "array",
        items: { type: "string" },
      });
    });

    it("should include additional options in schema", () => {
      const stringArrayGuard = array(isString, {
        minItems: 1,
        maxItems: 5,
      });
      const schema = stringArrayGuard.toSchema({} as any, "test");
      expect(schema).toEqual({
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5,
      });
    });
  });
});

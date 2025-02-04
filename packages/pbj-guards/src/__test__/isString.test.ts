import { describe, it, expect } from "vitest";
import { isString } from "../isString.js";

describe("isString", () => {
  describe("basic string validation", () => {
    it("should return true for string values", () => {
      expect(isString("hello")).toBe(true);
      expect(isString("")).toBe(true);
      expect(isString(" ")).toBe(true);
    });

    it("should return false for non-string values", () => {
      expect(isString(123)).toBe(false);
      expect(isString(null)).toBe(false);
      expect(isString(undefined)).toBe(false);
      expect(isString({})).toBe(false);
      expect(isString([])).toBe(false);
      expect(isString(true)).toBe(false);
    });
  });

  describe("config", () => {
    describe("minLength", () => {
      const isLongString = isString.config({ minLength: 5 });

      it("should validate strings with minimum length", () => {
        expect(isLongString("hello")).toBe(true);
        expect(isLongString("hello world")).toBe(true);
        expect(isLongString("hi")).toBe(false);
        expect(isLongString("")).toBe(false);
      });

      it("should return false for non-strings", () => {
        expect(isLongString(123)).toBe(false);
        expect(isLongString(null)).toBe(false);
      });
    });

    describe("maxLength", () => {
      const isShortString = isString.config({ maxLength: 5 });

      it("should validate strings with maximum length", () => {
        expect(isShortString("hi")).toBe(true);
        expect(isShortString("hello")).toBe(true);
        expect(isShortString("hello world")).toBe(false);
      });

      it("should return false for non-strings", () => {
        expect(isShortString(123)).toBe(false);
        expect(isShortString(null)).toBe(false);
      });
    });

    describe("pattern", () => {
      const isEmail = isString.config({ pattern: "^[^@]+@[^@]+\\.[^@]+$" });

      it("should validate strings matching the pattern", () => {
        expect(isEmail("test@example.com")).toBe(true);
        expect(isEmail("invalid-email")).toBe(false);
        expect(isEmail("test@incomplete")).toBe(false);
      });

      it("should return false for non-strings", () => {
        expect(isEmail(123)).toBe(false);
        expect(isEmail(null)).toBe(false);
      });
    });

    describe("combined constraints", () => {
      const isConstrainedString = isString.config({
        minLength: 5,
        maxLength: 10,
        pattern: "^[a-z]+$",
      });

      it("should validate strings meeting all constraints", () => {
        expect(isConstrainedString("hello")).toBe(true);
        expect(isConstrainedString("helloworld")).toBe(true);
        expect(isConstrainedString("hi")).toBe(false);
        expect(isConstrainedString("helloWorldTooLong")).toBe(false);
        expect(isConstrainedString("Hello123")).toBe(false);
      });
    });

    describe("schema generation", () => {
      it("should generate correct schema for configured guard", () => {
        const guard = isString.config({
          minLength: 5,
          maxLength: 10,
          pattern: "^[a-z]+$",
        });

        expect(guard.toSchema()).toEqual({
          type: "string",
          minLength: 5,
          maxLength: 10,
          pattern: "^[a-z]+$",
        });
      });
    });
  });
});

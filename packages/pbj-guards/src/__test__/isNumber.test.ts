import { describe, it, expect } from "vitest";
import { isNumber, isInteger } from "../isNumber.js";

describe("isNumber", () => {
  describe("basic number validation", () => {
    it("should return true for number values", () => {
      expect(isNumber(123)).toBe(true);
      expect(isNumber(0)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
    });

    it("should return false for non-number values", () => {
      expect(isNumber("123")).toBe(false);
      expect(isNumber(null)).toBe(false);
      expect(isNumber(undefined)).toBe(false);
      expect(isNumber({})).toBe(false);
      expect(isNumber([])).toBe(false);
      expect(isNumber(true)).toBe(false);
    });
  });

  describe("config", () => {
    describe("minimum/maximum", () => {
      const isValidRange = isNumber.config({ minimum: 0, maximum: 100 });

      it("should validate numbers within range", () => {
        expect(isValidRange(50)).toBe(true);
        expect(isValidRange(0)).toBe(false); // exclusive because minimum
        expect(isValidRange(100)).toBe(false); // exclusive because maximum
        expect(isValidRange(-1)).toBe(false);
        expect(isValidRange(101)).toBe(false);
      });
    });

    describe("exclusiveMinimum/exclusiveMaximum", () => {
      const isValidRange = isNumber.config({
        minimum: 0,
        maximum: 100,
      });

      it("should validate numbers within exclusive range", () => {
        expect(isValidRange(50)).toBe(true);
        expect(isValidRange(0)).toBe(false);
        expect(isValidRange(100)).toBe(false);
        expect(isValidRange(-1)).toBe(false);
        expect(isValidRange(101)).toBe(false);
      });
    });

    describe("multipleOf", () => {
      const isMultipleOfFive = isNumber.config({ multipleOf: 5 });

      it("should validate numbers that are multiples", () => {
        expect(isMultipleOfFive(15)).toBe(true);
        expect(isMultipleOfFive(20)).toBe(true);
        expect(isMultipleOfFive(7)).toBe(false);
        expect(isMultipleOfFive(13)).toBe(false);
      });
    });

    describe("enum", () => {
      const isValidEnum = isNumber.config({ enum: [1, 2, 3] });

      it("should validate numbers in enum", () => {
        expect(isValidEnum(1)).toBe(true);
        expect(isValidEnum(2)).toBe(true);
        expect(isValidEnum(3)).toBe(true);
        expect(isValidEnum(4)).toBe(false);
        expect(isValidEnum(0)).toBe(false);
      });
    });
  });
});

describe("isInteger", () => {
  describe("basic integer validation", () => {
    it("should return true for integer values", () => {
      expect(isInteger(123)).toBe(true);
      expect(isInteger(0)).toBe(true);
      expect(isInteger(-1)).toBe(true);
    });

    it("should return false for non-integer values", () => {
      expect(isInteger(3.14)).toBe(false);
      expect(isInteger("123")).toBe(false);
      expect(isInteger(null)).toBe(false);
      expect(isInteger(undefined)).toBe(false);
      expect(isInteger({})).toBe(false);
      expect(isInteger([])).toBe(false);
    });
  });

  describe("config", () => {
    describe("with combined constraints", () => {
      const isValidInteger = isInteger.config({
        minimum: 0,
        maximum: 100,
        multipleOf: 2,
      });

      it("should validate integers meeting all constraints", () => {
        expect(isValidInteger(50)).toBe(true);
        expect(isValidInteger(98)).toBe(true);
        expect(isValidInteger(99)).toBe(false); // not multiple of 2
        expect(isValidInteger(-2)).toBe(false); // below minimum
        expect(isValidInteger(102)).toBe(false); // above maximum
      });
    });
  });
});

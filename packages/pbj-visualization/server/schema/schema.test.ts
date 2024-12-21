import { describe, it, expect } from "vitest";
import { array, guardType, toSchema, allOf, required, shape } from "./schema";
import { isString, isNumber, isBoolean } from "../guard";

describe("schema functions", () => {
  describe("array function", () => {
    it("should create a guard for arrays", () => {
      const stringArrayGuard = array(isString);

      expect(stringArrayGuard([])).toBe(true);
      expect(stringArrayGuard(["a", "b", "c"])).toBe(true);
      expect(stringArrayGuard([1, 2, 3])).toBe(false);
      expect(stringArrayGuard("not an array")).toBe(false);
    });
    it("should work with required", () => {
      const objectRequiredProp = shape({ key: required(isString) });

      expect(toSchema(objectRequiredProp)).toMatchObject({
        type: "object",
        properties: {
          key: { type: "string" },
        },
        required: ["key"],
      });
    });

    it("should generate correct schema", () => {
      const numberArrayGuard = array(isNumber);
      const schema = toSchema(numberArrayGuard);

      expect(schema).toMatchObject({
        type: "array",
        items: { type: "number" },
      });
    });
  });

  // describe('$ref', () => {
  //     it('should work', () => {
  //         const refGuard = $ref('MyRef', isString);
  //         const schema = toSchema(shape({ myRef: refGuard }));
  //         expect(schema).toMatchObject({
  //             type: 'object',
  //             properties: {
  //                 myRef: {
  //                     $ref: '#/definitions/MyRef'
  //                 }
  //             },

  //             definitions: {
  //                 MyRef: {
  //                     type: 'string'
  //                 }
  //             }
  //         });
  //     })
  // })
  describe("toSchema function", () => {
    it("should handle shape guards", () => {
      const personGuard = shape({
        name: isString,
        age: isNumber,
      });

      const schema = toSchema(personGuard);
      expect(schema).toMatchObject({
        type: "object",
        properties: {
          name: { type: "string" },
          age: { type: "number" },
        },
      });
    });

    it("should handle nested guards", () => {
      const nestedGuard = shape({
        items: array(isString),
        details: shape({
          id: isNumber,
          active: isBoolean,
        }),
      });

      const schema = toSchema(nestedGuard);
      expect(schema).toMatchObject({
        type: "object",
        properties: {
          items: {
            type: "array",
            items: { type: "string" },
          },
          details: {
            type: "object",
            properties: {
              id: { type: "number" },
              active: { type: "boolean" },
            },
          },
        },
      });
    });
  });
  describe("allOf", () => {
    it("should work", () => {
      const allOfGuard = shape({ stuff: allOf(isString, isNumber) });
      const schema = toSchema(allOfGuard);
      console.log(JSON.stringify(schema, null, 2));
      expect(schema).toMatchObject({
        type: "object",
        properties: {
          stuff: {
            allOf: [
              {
                type: "string",
              },
              {
                type: "number",
              },
            ],
          },
        },
      });
    });
  });

  describe("shape", () => {
    const guard = shape({
      name: isString,
      age: isNumber,
    });
    it("should validate object shape", () => {
      expect(guard({ name: "John", age: 30 })).toBe(true);
      expect(guard({ name: "John", age: "30" })).toBe(false);
      expect(guard({ name: "John" })).toBe(false);
      expect(guard(null)).toBe(false);
    });
  });
});

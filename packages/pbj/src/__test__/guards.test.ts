import { describe, it, expect } from "vitest";
import { isConstructor, isPrimitive, isPrimitiveType } from "../guards";

describe("guards test", () => {
  it("should be a constructor", () => {
    expect(isConstructor(class A {})).toBe(true);
  });
  it("should not be a constructor fat arrow", () => {
    expect(isConstructor(() => void 0)).toBe(false);
  });
  // it('should not be a constructor', ()=>{
  //     function fn(){
  //         return true;
  //     }
  //     console.log(fn.prototype.constructor.name);
  //     expect(isConstructor(fn)).toBe(false);
  // })
  it("should say be a primitive type", () => {
    expect(isPrimitiveType(String)).toBe(true);
    expect(isPrimitiveType(Number)).toBe(true);
    expect(isPrimitiveType(Boolean)).toBe(true);
    expect(isPrimitiveType(BigInt)).toBe(true);
    expect(isPrimitiveType(Symbol)).toBe(true);
    expect(isPrimitiveType("")).toBe(false);
    expect(isPrimitiveType(1)).toBe(false);
    expect(isPrimitiveType(true)).toBe(false);
    expect(isPrimitiveType(BigInt(1))).toBe(false);
    expect(isPrimitiveType(Symbol("test"))).toBe(false);
  });
  it("should say be a primitive", () => {
    expect(isPrimitive("")).toBe(true);
    expect(isPrimitive(1)).toBe(true);
    expect(isPrimitive(true)).toBe(true);
    expect(isPrimitive(BigInt(1))).toBe(true);
    expect(isPrimitive(Symbol("test"))).toBe(true);
    expect(isPrimitive(String)).toBe(false);
    expect(isPrimitive(Number)).toBe(false);
    expect(isPrimitive(Boolean)).toBe(false);
    expect(isPrimitive(BigInt)).toBe(false);
    expect(isPrimitive(Symbol)).toBe(false);
    expect(isPrimitive(class A {})).toBe(false);
    expect(isPrimitive(() => void 0)).toBe(false);
    expect(isPrimitive({})).toBe(false);
  });
});

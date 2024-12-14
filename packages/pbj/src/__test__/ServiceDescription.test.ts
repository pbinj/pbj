import { it, describe, expect } from "vitest";
import { pbjKey } from "../pbjKey";
import { ServiceDescriptor } from "../ServiceDescriptor";
describe("ServiceDescription", () => {
  describe("ServiceDescription#name", () => {
    it("should name it with pbjkey", () => {
      const myKey = pbjKey<string>("my-cool-key");
      expect(new ServiceDescriptor(myKey).name).toEqual("my-cool-key");
    });
    it("should name it with Constructor", () => {
      expect(new ServiceDescriptor(class A {}).name).toEqual("A");
    });
    it("should return anonymous", () => {
      expect(new ServiceDescriptor(() => "what").name).toEqual("<anonymous>@0");
      expect(new ServiceDescriptor(() => "what").name).toEqual("<anonymous>@1");
    });
    it("should use function name", () => {
      const myFunc = () => "w";
      expect(new ServiceDescriptor(myFunc).name).toEqual("myFunc");
    });
    it("should use symbol description", () => {
      const desc = Symbol("my-sym");
      expect(new ServiceDescriptor(desc).name).toEqual("my-sym");
    });
  });
});

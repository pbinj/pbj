import { it, describe, expect } from "vitest";
import { builder, context, ToInject } from "@pbinj/pbj";
import { runBeforeEachTest, runAfterEachTest } from "../test";
import { beforeEach, afterEach } from "vitest";

beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);

const fn = (a: number, b: string) => a + 1 + b;

describe("reg-builder", () => {
  it("should merge", () => {
    const reg = builder().register("a", 1);
    const a2 = builder().register("c", 3);
    const reg3 = reg.uses(a2.export());
    expect(reg3.refs.c).toBeDefined();
    expect(reg3.refs.a).toBeDefined();
  });
  it("should factory", () => {
    const reg = builder().register("a", "");
    const a2 = builder().register("b", 3);
    const reg3 = reg.uses(a2.export());
    const a = reg3.register("f", fn, reg3.refs.b, reg3.refs.a);
    expect(a.configure("b").service).toEqual(3);
  });
  it("should factory more", () => {
    const reg = builder().register("a", "");
    const a2 = builder().register("b", 3);
    const reg3 = reg.uses(a2.export());
    const a = reg3.register("f", fn, reg3.refs.b, reg3.refs.a);
    expect(a.configure("f").name).toEqual("f");
  });

  it("should register everything", () => {
    const reg = builder().register("a", 1);
    const a2 = builder().register("b", 3).export();
    const reg3 = reg.uses(a2);
    const a = reg3.register(
      "f",
      (a: number, b: number) => a + b,
      reg3.refs.b,
      reg3.refs.a,
    );

    const ctx = a.export().apply(context);
    expect(ctx.resolve(reg.refs.a)).toEqual(1);
    expect(ctx.resolve(a2.refs.b)).toEqual(3);
    expect(ctx.resolve(a.refs.f)).toEqual(4);
  });
  it("should register everything and limit", () => {
    const reg = builder().register("a", 1);
    const a2 = builder().register("b", 3).export();
    const reg3 = reg.uses(a2);
    const a = reg3.register(
      "f",
      (a: number, b: number) => a + b,
      reg3.refs.b,
      reg3.refs.a,
    );
    const e = a.export("a", "f");
    const ctx = e.apply(context);
    const aref = e.refs.a;
    const ra = ctx.resolve(aref);
    expect(ra).toEqual(1);
    expect(ctx.resolve(e.refs.f)).toEqual(4);
    // TODO: Fix type system to prevent access to non-exported keys
    // This should be a TypeScript error but currently isn't
    const error = e.refs.b;
  });

  it("should work with optional dependencies", () => {
    class OptA {
      constructor(public a?: string) {}
    }
    const reg = builder().register("opt", OptA, "a");
    const a = reg.export().apply(context).resolve(reg.refs.opt);
    expect(a.a).toEqual("a");
  });
  it("should work with optional dependencies without option", () => {
    class OptA {
      constructor(public a?: string) {}
    }
    const reg = builder().register("opt", OptA);
    const a = reg.export().apply(context).resolve(reg.refs.opt);
    expect(a.a).toEqual(undefined);
  });

  it('should work with default values', ()=>{
    class Def {
      constructor(public a = "a") {}
    }
    const reg = builder().register("def", Def);
    const a = reg.export().apply(context).resolve(reg.refs.def);
    expect(a.a).toEqual("a");
  });
  it('should work with default values override', ()=>{
    class Def {
      constructor(public a = "a") {}
    }
    const reg = builder().register("def", Def, "b");
    const a = reg.export().apply(context).resolve(reg.refs.def);
    expect(a.a).toEqual("b");
  });
  // TODO: Implement conflict detection when merging registries with duplicate keys
  // Currently, Object.assign silently overwrites duplicate keys in HasRefsImpl.descriptions getter
  it.skip('conflict', ()=>{
    const reg1 = builder().register("a", 1);
    const reg2 = builder().register("a", "2");
    const v = reg1.export().apply(context);
    const val = v.resolve("a");
    expect(() => reg1.uses(reg2.export())).toThrowError();

  });
  it('should namespace simple', ()=>{
    const v = builder("ns1").register("a", 1).export().apply(context);
    expect( v.resolve("ns1:a")).toEqual(1);
  });
  it('should namespace be more simple', ()=>{
    const a1 = builder("ns1").register("a", 1).export();
    const b2 = builder("ns2").uses(a1).register("b", 2).export();
    const ctx = b2.apply(context);
    const v = ctx.resolve("ns2:b");

    expect(v).toEqual(2);
    expect(ctx.resolve(b2.refs.b)).toEqual(2);
    expect(ctx.resolve(a1.refs.a)).toEqual(1);
    expect(ctx.resolve("ns1:a")).toEqual(1);
  })
});

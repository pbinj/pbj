import { builder } from "../reg-builder.js";
import { it, describe, expect } from "vitest";
import { createNewContext } from "@pbinj/pbj";
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

    const ctx = a.export().apply(createNewContext());
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
    const ctx = e.apply(createNewContext());
    expect(ctx.resolve(e.refs.a)).toEqual(1);
    expect(ctx.resolve(e.refs.f)).toEqual(4);
    //@ts-expect-error - this should be an error please do not remove.  `export` should prevent this from being accessible.
    const error = e.refs.b;
  });
});

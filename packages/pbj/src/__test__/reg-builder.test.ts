import { RegBuilder } from "../reg-builder";
import { it, describe, expect } from "vitest";



describe("reg-builder", () => {

    it('should merge', ()=>{
        const reg = new RegBuilder().register("a", 1);
        const a2 = new RegBuilder().register("c", 3);
        const reg3 = reg.uses(a2.close());

    });
    it('should factory' ,()=>{
        const fn = (a: number, b:string) => (a + 1) + b;
        const reg = new RegBuilder().register("a", "");
        const a2 = new RegBuilder().register("b", 3);
        const reg3 = reg.uses(a2.close());
        const a = reg3.factory("f", fn, reg3.ref("b"), reg3.ref("a"));
        expect(a).toBe(3);
    });
});
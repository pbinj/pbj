import { it, describe, expect, beforeEach, afterEach } from "vitest";
import {
  context as ctx,
  createNewContext,
  destroySymbol,
  pbj,
  pbjKey,
  type RegistryType,
  serviceSymbol,
} from "@pbinj/pbj";
import { EmailService } from "./sample-services/email.js";
import {
  auth,
  AuthService,
  authServiceSymbol,
} from "./sample-services/auth.js";
import { connectionPBinJKey, DBService } from "./sample-services/db.js";
import { runBeforeEachTest, runAfterEachTest } from "../test.js";
import { ServiceDescriptor } from "../service-descriptor.js";
import { keyOf } from "../util.js";

const aiSymbol = Symbol("a");
const abSymbol = Symbol("b");
const acSymbol = Symbol("c");
class A {
  static readonly [serviceSymbol] = aiSymbol;
  constructor(readonly connectionUrl: string) {}
  connection() {
    return this.connectionUrl;
  }
}
class C {
  constructor(readonly a = pbj(aiSymbol)) {}
}
type AI = InstanceType<typeof A>;
declare module "@pbinj/pbj" {
  export interface Registry {
    [aiSymbol]: AI;
    [abSymbol]: string;
    [acSymbol]: C;
  }
}
beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);

describe("context", () => {
  it("should test something", () => {
    const t = { value: "I am a string" };
    const proxy = new Proxy(t, {
      getPrototypeOf() {
        return String.prototype;
      },
      get(target, prop, receiver) {
        const prim = Reflect.get(target, "value");
        const value = prim[prop as any] as any;
        return typeof value === "function" ? value.bind(prim) : value;
      },
    });
    expect(proxy + "").toBe("I am a string");
    t.value = "what";
    expect(proxy + "").toBe("what");
    expect(proxy).toBeInstanceOf(String);
  });

  it("should return the an instance", () => {
    ctx.register(abSymbol, "myconnection");
    ctx.resolve(abSymbol);
    expect(ctx.resolve(abSymbol) == "myconnection").toBe(true);
    // ctx.register(aiSymbol, A, pbj(abSymbol));

    // const ainstance = ctx.resolve(aiSymbol);

    // expect(ainstance.connection() == "myconnection").toBe(true);
    // expect(ctx.resolve(abSymbol)).toBe("myconnection");
  });

  it("should instatiate classes that", () => {
    class B {}
    const resp = ctx.resolve(B);
    expect(ctx.resolve(B)).toBeInstanceOf(B);
  });

  it("should return factory functions", () => {
    const fn = () => {
      return "fn";
    };
    const result = ctx.register(fn);
    expect(result.service).toBe(fn);
  });

  it("should in inject the things", async () => {
    auth(ctx);
    ctx.register(authServiceSymbol, AuthService);
    ctx.register(connectionPBinJKey, "hello");
    ctx.register(DBService);
    const result = ctx.resolve(EmailService);
    expect(result).toBeInstanceOf(EmailService);
    expect(result.sendEmail("to", "what", "go")).toBeInstanceOf(Promise);
  });
  it("should cache things", () => {
    let i = 0;
    class Cache {
      constructor() {
        i++;
      }
    }
    const result = ctx.resolve(Cache);
    const result2 = ctx.resolve(Cache);

    expect(result).toBeInstanceOf(Cache);
    expect(result2).toBe(result);
    expect(i).toBe(1);
  });
  it("should visit and destroy", () => {
    let d = 0;
    let c = 0;
    class Base {
      constructor() {
        c++;
      }
      destroy() {
        d++;
      }

      toString() {
        return this.constructor.name;
      }
    }
    class TA extends Base {}
    class TB extends Base {
      constructor(readonly a = ctx.pbj(TA)) {
        super();
      }
    }
    class TC extends Base {
      constructor(readonly b = ctx.pbj(TB)) {
        super();
      }
    }

    class TD {
      constructor(
        readonly a = ctx.pbj(TA),
        readonly b = ctx.pbj(TB),
        readonly c = ctx.pbj(TC),
      ) {}
      toString() {
        return [this.a, this.b, this.c].join("-");
      }
    }

    const v = ctx.resolve(TD);
    expect(v.toString()).toBe("TA-TB-TC");
    expect(v.a).toBeInstanceOf(TA);
    expect(v.b).toBeInstanceOf(TB);
    expect(v.c).toBeInstanceOf(TC);
    expect(c).toBe(3);
    //make sure we only resolve once.
    ctx.resolve(TD).toString();

    ctx.visit(TD, (v) => {
      const val = ctx.resolve(v.key as any);
      if (val instanceof Base) {
        val.destroy();
      }
      return destroySymbol;
    });

    expect(d).toBe(3);
    ctx.resolve(TD).toString();
    expect(c).toBe(3);
    expect(ctx.resolve(TD)).toBeInstanceOf(TD);
    expect(c).toBe(3);
  });

  it("should work with Service", () => {
    class TT {
      static [serviceSymbol] = Symbol("tt");
    }

    expect(ctx.resolve(TT)).toBeInstanceOf(TT);
  });
  it("should work with custom context", () => {
    const someKey = Symbol("custom");
    interface CustomRegistry extends RegistryType {
      [someKey]: string;
    }
    const customContext = createNewContext<CustomRegistry>();

    customContext.register(someKey, "custom value");

    expect(customContext.resolve(someKey)).toBe("custom value");
  });
  it("should inject non primitive objects", () => {
    const value = { test: 1 } as const;
    const CONFIG = pbjKey<typeof value>("test-config");

    ctx.register(CONFIG, { test: 1 });
    expect(ctx.resolve(CONFIG).test).toBe(1);
  });
  it("should allow for injection of proxies in resolve", () => {
    let v = 10;
    const val = () => {
      return v++;
    };
    const factory = (a: number) => {
      return a + 1;
    };
    expect(ctx.resolve(factory, pbj(val))).toBe(11);
    expect(ctx.resolve(val)).toBe(10);
    //check it again it should not change.
    expect(ctx.resolve(val)).toBe(10);
  });
  it("should recalculate when registration changes", () => {
    let c = 0;

    const dep = (val = 0) => {
      return val + c++;
    };
    const factory = (a: number) => {
      return a + 1;
    };
    const arg = pbj(dep);
    ctx.resolve(factory, arg);
    expect(ctx.resolve(factory, arg)).toBe(1);
    // //check it again it should not change.
    // expect(ctx.resolve(val)).toBe(10);
    ctx.register(dep).service = () => 100;
    expect(ctx.resolve(factory, pbj(dep))).toBe(101);
    expect(ctx.resolve(factory, pbj(dep))).toBe(101);
  });
  it("should work with pbjkeys strings", () => {
    const pkey = pbjKey<string>("test");
    ctx.register(pkey, () => "test");
    expect(ctx.resolve(pkey)).toBe("test");
  });
  it("should work with pbjkeys constructor", () => {
    class TestPBinJkey {
      a = 1;
    }
    const pkey = pbjKey<TestPBinJkey>("test-1");
    ctx.register(pkey, TestPBinJkey);
    expect(ctx.resolve(pkey).a).toBe(1);
  });
  it("should work with pbjkeys factory", () => {
    const pkey = pbjKey<string>("test-2");
    ctx.register(pkey, () => "test");
    expect(ctx.resolve(pkey)).toBe("test");
  });
  it("should handle mixed invocation", () => {
    const pkey = pbjKey<string>("test-3");
    class TestA {
      constructor(
        readonly a: number,
        public b = pbj(pkey),
      ) {}
    }
    ctx.register(pkey, () => "test");
    const result = ctx.resolve(TestA, 2);
    expect(result.a == 2).toBe(true);
    expect(result.b + "" === "test").toBe(true);
  });
  it("should handle mixed invocation with constructor with a lot", () => {
    class TestAlot {
      constructor(
        readonly a: number,
        public b: string,
        public c: string,
        public d: string,
      ) {}
    }
    const result = ctx.resolve(TestAlot, 2, "b", "c", "d");
    expect(result.a == 2).toBe(true);
    expect(result.b == "b").toBe(true);
    expect(result.c == "c").toBe(true);
    expect(result.d == "d").toBe(true);
  });

  it("should be an error if the types do not align", () => {
    const pkey = pbjKey<string>("test-3");
    //@ts-expect-error - this should be an error please do not remove.  You shouldn't be able to register a number as a string.
    ctx.register(pkey, 1);
    //@ts-expect-error - this should be an error please do not remove.  You shouldn't be able to register a number as a string.
    ctx.register(pkey, () => 1);
  });
  it("should be an error if the types do not align in the registry", () => {
    //@ts-expect-error - this should be an error please do not remove.  You shouldn't be able to register a number as a string.
    ctx.register(abSymbol, 1);
    //@ts-expect-error - this should be an error please do not remove.  You shouldn't be able to register a number as a string.
    ctx.register(abSymbol, () => 1);
  });
});

describe("proxy", () => {
  it("should work with proxy", () => {
    const pkey = pbjKey<string>("test-3");
    ctx.register(pkey, () => "test");
    const resp = ctx.pbj(pkey);
    expect(resp == "test").toBe(true);
  });
  it("should work with proxy", () => {
    class PA {
      public a = 1;
    }
    const resp = ctx.pbj(PA);
    expect(resp.a).toBe(1);
  });
  it("should have keys", () => {
    class PA {
      public a = 1;
    }
    const a = pbj(PA);
    expect(Object.keys(a)).toEqual(["a"]);
  });
  it("should work with has", () => {
    class PA {
      public a = 1;
    }
    const a = pbj(PA);
    expect("a" in a).toBe(true);
  });

  describe("listOf", () => {
    it("should work with a pbjKey and tags", () => {
      class PA {
        public a = 1;
      }

      class PB {
        public b = 1;
      }
      class PC {
        public c = 1;
      }
      const key = pbjKey<PA | PB>("test-list-of");
      ctx.register(PA).withTags(key);
      ctx.register(PB).withTags(key);
      const a = ctx.pbj(PA);
      const b = ctx.pbj(PB);
      const sd = ctx.register(PC);
      //expect this to be nicely typed based on the PBinJKeyType.
      const result: (PA | PB)[] = ctx.listOf(key);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
      sd.withTags(key);
      const c = ctx.pbj(PC);

      expect(result.length).toBe(3);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
      expect(result[2]).toBe(c);
    });

    it("should work with inheritance", () => {
      class Base {
        public a = 1;
      }

      class PB extends Base {
        public b = 1;
      }
      class PC extends Base {
        public c = 1;
      }
      ctx.register(PB);
      const b = ctx.pbj(PB);
      ctx.register(PC);
      const c = ctx.pbj(PC);
      const result = ctx.listOf(Base);
      expect(result.length).toBe(2);
      expect(result[0]).toBe(b);
      expect(result[1]).toBe(c);
    });
    it("should work with factories", () => {
      const factory = () => ({ a: 1 });
      const aKey = pbjKey<ReturnType<typeof factory>>("test-factory-a");
      const a = ctx.pbj(aKey);
      ctx.register(aKey, factory);
      const bKey = pbjKey<ReturnType<typeof factory>>("test-factory-b");
      ctx.register(bKey, factory);
      const b = ctx.pbj(bKey);
      ctx.register(factory);
      const c = ctx.pbj(factory);
      const result = ctx.listOf(factory);
      //This doesn't work because the proxy is not an array.
      //Array.isArray(new Proxy([], {}) is different from
      //Array.isArray(new Proxy({}, {}) and we may not know the type when
      // the proxy is created.
      expect(result.length).toBe(3);
      expect(result[0]).toBe(a);
      expect(result[1]).toBe(b);
      expect(result[2]).toBe(c);
    });
  });
  describe("withInterceptors", () => {
    it("should work with interceptors", () => {
      const factory = () => ({ a: 1 });
      const a = ctx.register(pbjKey<{ a: number }>("test-factory-a"), factory);
      let i = 0;
      let b = 0;
      a.withInterceptors((invoke) => {
        i++;
        return invoke();
      });
      expect(ctx.resolve(a.key).a).toBe(1);
      expect(i).toBe(1);

      a.withInterceptors((invoke) => {
        b++;
        return invoke();
      });
      expect(ctx.resolve(a.key).a).toBe(1);
      expect(i).toBe(2);

      expect(b).toBe(1);
    });
  });
  describe("null", () => {
    it("should not blow up if a value is null", () => {
      const factory = () => null as any;
      const key = pbjKey<{ a: number }>("test-factory-a");
      const a = ctx.resolve(key, factory);
      expect(a).toBe(null);
    });
  });

  describe("should not be a dependency on itself", () => {
    it("should not be a dependency on itself", () => {
      const key = pbjKey<{ a: number }>("test-factory-a");
      const resp = ctx.register(key, () => ({ a: 1 })) as ServiceDescriptor<
        any,
        any
      >;

      resp.addDependency(keyOf(key));
      expect(resp.dependencies?.size).toBe(0);
    });

    it("should serialize ctx", () => {
      const key1 = pbjKey<{ a: number }>("test-factory-a");
      const key2 = pbjKey<{ a: number }>("test-factory-b");
      const key3 = pbjKey<{ a: number }>("test-factory-c");
      const factory = (a: { a: number }) => ({ a: 1 });
      ctx.register(key1, factory, { a: 1 });
      ctx.register(key2, factory, key1);
      ctx.register(key3, factory, key2);
      expect(ctx.toJSON()).toMatchSnapshot();
    });
  });
});

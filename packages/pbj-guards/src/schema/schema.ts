import type {
  ArraySubtype,
  ObjectSubtype,
  SchemaObject,
} from "./json-schema.types.js";
import {
  type AllOf,
  type Guard,
  isObjectish,
  isBoolean,
  isRequired,
  guardType,
} from "../guards.js";
import { isString } from "../isString.js";
import { isNumber, isInteger } from "../isNumber.js";
import { toSchemaNested } from "./toSchemaNested.js";

export type Config<T> = Partial<Omit<T, "type">>;
export const parentSchema: unique symbol = Symbol();

type Schema = SchemaObject & {
  [parentSchema]?: Schema;
  definitions?: Record<string, Schema>;
};

function addGuard(guard: Guard<any> & { [guardType]?: string }, type: string) {
  guard[guardType] = type;
}
addGuard(isBoolean, "boolean");
addGuard(isInteger, "integer");
addGuard(isNumber, "number");
addGuard(isString, "string");

/**Only one can be matched, more than one or less than one fails. */
export function oneOf<T extends readonly Guard<any>[]>(...guards: T) {
  function oneOfGuard(value: unknown): value is AnyOf<T> {
    let hasTrue = false;
    for (const guard of guards) {
      if (guard(value)) {
        if (hasTrue) {
          return false;
        }
        hasTrue = true;
      }
    }
    return hasTrue;
  }
  oneOfGuard.toSchema = (ctx: SchemaObject, key: string) => {
    return {
      oneOf: guards.map((g) => toSchemaNested(g, ctx, key)),
    };
  };
  return oneOfGuard;
}
export function anyOf<T extends readonly Guard<any>[]>(...guards: T) {
  function anyOfGuard(value: unknown): value is AnyOf<T> {
    for (const guard of guards) {
      if (guard(value)) {
        return true;
      }
    }
    return false;
  }
  anyOfGuard.toSchema = (ctx: SchemaObject, key: string) => {
    return {
      anyOf: guards.map((g) => toSchemaNested(g, ctx, key)),
    };
  };
  return anyOfGuard;
}

export function allOf<T extends readonly Guard<any>[]>(...guards: T) {
  function allOfGuard(value: unknown): value is AllOf<T> {
    for (const guard of guards) {
      if (!guard(value)) {
        return false;
      }
    }
    return true;
  }
  allOfGuard.toSchema = (ctx: SchemaObject, key: string) => {
    return {
      allOf: guards.map((g) => toSchemaNested(g, ctx, key)),
    };
  };
  return allOfGuard;
}

export function $ref(ref: string, guard: Guard<any>) {
  function isRefGuard(value: unknown): value is any {
    return true;
  }
  isRefGuard.toSchema = (ctx: Schema, key: string) => {
    const defs = ctx.definitions || (ctx.definitions = {});
    defs[ref] = toSchemaNested(guard, ctx, ref);

    return { $ref: `#/definitions/${ref}` };
  };
  return isRefGuard;
}
export function required(guard: Guard<any>) {
  function isRequiredGuard(
    value: unknown,
  ): value is Exclude<ReturnType<typeof guard>, null | undefined> {
    return guard(value) && isRequired(value);
  }

  isRequiredGuard.toSchema = (ctx: SchemaObject, key: string) => {
    if (!ctx.required) {
      ctx.required = [];
    }
    ctx.required.push(key);
    return toSchemaNested(guard, ctx, key);
  };

  return isRequiredGuard;
}

export function pickShape<T extends Record<PropertyKey, Guard<any>>>(obj: T) {
  const keys = Object.keys(obj);
  return function pickShapeGuard(value: unknown): {
    [K in keyof T]: T[K] extends Guard<infer U> ? U : undefined;
  } {
    const v: any = {};
    for (const k of keys) {
      const check = (value as any)[k];
      if (!obj[k](check)) {
        v[k] = check;
      }
    }
    return v;
  };
}

export function shape<T extends Record<PropertyKey, Guard<any>>>(
  obj: T,
  config: Config<ObjectSubtype> = {},
) {
  const entries = Object.entries(obj);

  const additionalProperties = config.additionalProperties ?? true;

  const ret = function isShapeGuard(
    value: unknown,
  ): value is { [K in keyof T]: T[K] extends Guard<infer U> ? U : never } {
    if (!isObjectish(value)) {
      return false;
    }
    for (const [k, v] of entries) {
      if (!v((value as any)[k])) {
        return false;
      }
    }
    return additionalProperties
      ? true
      : Object.keys(value).length === entries.length;
  };
  ret.toSchema = (ctx: Schema) => {
    const cur: Schema = {
      type: "object",
      [parentSchema]: ctx,
      ...config,
      properties: {} as Record<string, Schema>,
    };
    for (const [k, v] of entries) {
      cur.properties![k] = toSchemaNested(v, cur, k);
    }
    return cur;
  };
  return ret;
}

export function eq<T>(v: T): Guard<T> {
  function isEq(value: unknown): value is T {
    return value == v;
  }
  isEq.toSchema = () => ({ const: v });
  return isEq;
}

export function exactShape<T extends Record<string, Guard<any>>>(obj: T) {
  const entries = Object.entries(obj);
  function isShapeGuard(
    value: unknown,
  ): value is { [K in keyof T]: T[K] extends Guard<infer U> ? U : never } {
    if (!isObjectish(value)) {
      return false;
    }
    const seen = new Set(Object.keys(value));
    for (const [k, guard] of entries) {
      seen.delete(k);
      if (!guard((value as any)[k])) {
        return false;
      }
    }
    return seen.size === 0;
  }
  isShapeGuard.toSchema = (ctx: Schema) => {
    const cur: Schema = {
      type: "object",
      [parentSchema]: ctx,
      properties: {} as Record<string, Schema>,
    };
    for (const [k, v] of entries) {
      cur.properties![k] = toSchemaNested(v, cur, k);
    }
    return cur;
  };
  return isShapeGuard;
}

type AnyOf<T> = T extends [
  Guard<infer U>,
  ...infer Rest extends readonly Guard<any>[],
]
  ? U | AnyOf<Rest>
  : never;

export function toSchema(
  v: Guard<any>,
  config: Config<SchemaObject> = {},
): SchemaObject {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    ...config,
    ...toSchemaNested(v),
  } as SchemaObject;
}

export function tuple(...values: (string | number)[]) {
  function isTupleGuard(value: unknown): value is any[] {
    for (const v of values) {
      if (value === v) {
        return true;
      }
    }
    return false;
  }

  isTupleGuard.toSchema = (ctx: SchemaObject, key: string) => {
    return {
      enum: values,
    };
  };
  return isTupleGuard;
}

export function literal<T extends PropertyKey>(v: T) {
  function isConst(value: unknown): value is keyof { [k in T]: unknown } {
    return value === v;
  }
  isConst.toSchema = () => ({ const: v });
  return isConst;
}

export function enums<T extends PropertyKey>(...values: T[]) {
  function isEnum(value: unknown): value is keyof { [k in T]: unknown } {
    for (const v of values) {
      if (value === v) {
        return true;
      }
    }
    return false;
  }
  isEnum.toSchema = () => ({ enum: values });
  return isEnum;
}

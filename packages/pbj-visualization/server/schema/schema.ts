import { has, hasA, isFn, isObjectish } from "@pbinj/pbj/guards";
import {
  ArraySubtype,
  NumberSubtype,
  ObjectSubtype,
  SchemaObject,
  StringSubtype,
} from "./json-schema.types";
import {
  AllOf,
  Guard,
  isArray,
  isBoolean,
  isInteger,
  isNumber,
  isRequired,
  isString,
} from "../guard";

export const guardType = Symbol("@pbj/visualization/guardType");

type Config<T> = Partial<Omit<T, "type">>;

type Schema = SchemaObject & {
  [parent]?: Schema;
  definitions?: Record<string, Schema>;
};

function addGuard(guard: Guard<any> & { [guardType]?: string }, type: string) {
  guard[guardType] = type;
}
addGuard(isBoolean, "boolean");
addGuard(isInteger, "integer");
addGuard(isNumber, "number");
addGuard(isString, "string");

function root(v: Schema): Schema {
  return v?.[parent] ? root(v[parent]) : v;
}

export function anyOf<T extends readonly Guard<any>[]>(...guards: T) {
  return function (value: unknown): value is AnyOf<T> {
    for (const guard of guards) {
      if (guard(value)) {
        return true;
      }
    }
    return false;
  };
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
    const allOf = guards.map((g) => toSchemaNested(g, ctx, key));
    return {
      allOf,
    };
  };
  return allOfGuard;
}

const parent = Symbol();
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
export function shape<T extends Record<string, Guard<any>>>(
  obj: T,
  config: Config<ObjectSubtype> = {},
) {
  const entries = Object.entries(obj);

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
    return true;
  };
  ret.toSchema = (ctx: Schema) => {
    const cur: Schema = {
      type: "object",
      [parent]: ctx,
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

export function eq<T>(v: T) {
  function isEq(value: unknown): value is T {
    return value == v;
  }
  isEq.toSchema = () => ({ const: v });
  return isEq;
}

function checkNumber(val: number, v: Config<NumberSubtype> = {}) {
  if (hasA(v, "minimum", isNumber) && val <= v.minimum) {
    return false;
  }
  if (hasA(v, "maximum", isNumber) && val >= v.maximum) {
    return false;
  }
  if (hasA(v, "multipleOf", isNumber) && val % v.multipleOf !== 0) {
    return false;
  }
  if (hasA(v, "enum", array(isNumber)) && !v.enum.includes(val)) {
    return false;
  }
  if (hasA(v, "exclusiveMinimum", isNumber) && val < v.exclusiveMinimum) {
    return false;
  }
  if (hasA(v, "exclusiveMaximum", isNumber) && val > v.exclusiveMaximum) {
    return false;
  }
  return true;
}
export function integer(v: Config<NumberSubtype> = {}) {
  function isIntegerGuard(val: unknown): val is number {
    if (!isInteger(val)) {
      return false;
    }

    return checkNumber(val, v);
  }
  isIntegerGuard.toSchema = () => ({ ...v, type: "integer" });
  return isIntegerGuard;
}
export function number(v: Partial<Omit<NumberSubtype, "type">>) {
  function isNumberGuard(val: unknown): val is number {
    if (!isNumber(val)) {
      return false;
    }

    return checkNumber(val, v);
  }
  isNumberGuard.toSchema = () => ({ ...v, type: "number" });
  return isNumberGuard;
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
      [parent]: ctx,
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

export function string(opts: Partial<Omit<StringSubtype, "type">> = {}) {
  function isStringGuard(v: unknown): v is string {
    if (typeof v !== "string") {
      return false;
    }
    if (hasA(opts, "minLength", isNumber) && v.length < opts.minLength) {
      return false;
    }
    if (hasA(opts, "maxLength", isNumber) && v.length > opts.maxLength) {
      return false;
    }
    if (hasA(opts, "pattern", isString) && !new RegExp(opts.pattern).test(v)) {
      return false;
    }
    return true;
  }
  isStringGuard.toSchema = () => ({
    type: "string",
    ...opts,
  });
  return isStringGuard;
}

export function array(
  guard?: Guard<any>,
  options: Omit<ArraySubtype, "type" | "items"> = {},
) {
  const ret = function isArrayGuard(v: unknown): v is any[] {
    return isArray(v, guard);
  };
  ret.toSchema = (ctx: SchemaObject, key: string): ArraySubtype => ({
    type: "array",
    items: guard ? toSchemaNested(guard, ctx, key) : undefined,
    ...options,
  });

  return ret;
}

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

export const toSchemaNested = (
  v: Guard<any>,
  ctx: SchemaObject = {
    type: "object",
  },
  key?: string,
): SchemaObject => {
  if (has(v, guardType)) {
    if (isFn(v[guardType])) {
      return v[guardType](ctx, key);
    } else {
      return { type: v[guardType] as "string" };
    }
  }

  return hasA(v, "toSchema", isFn) ? v.toSchema(ctx, key) : ctx;
};

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

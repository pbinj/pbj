import { type Guard, has, guardType, isFn, hasA } from "../guards.js";
import type { SchemaObject } from "./json-schema.types.js";

export const toSchemaNested = (
  v: Guard<any>,
  ctx: SchemaObject = {
    type: "object",
  },
  key?: string,
): SchemaObject => {
  if (hasA(v, "toSchema", isFn)) {
    return v.toSchema(ctx, key);
  }
  if (has(v, guardType)) {
    if (isFn(v[guardType])) {
      return v[guardType](ctx, key);
    } else {
      return { type: v[guardType] as "string" };
    }
  }

  return hasA(v, "toSchema", isFn) ? v.toSchema(ctx, key) : ctx;
};

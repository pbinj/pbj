import { guardType, hasA } from "./guards.js";
import { type Config } from "./schema/schema.js";
import { type NumberSubtype } from "./schema/json-schema.types.js";
import { array } from "./isArray.js";
import { optional } from "./optional.js";

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

  if (hasA(v, "inclusiveMinimum", isNumber) && val < v.inclusiveMinimum) {
    return false;
  }
  if (hasA(v, "inclusiveMaximum", isNumber) && val > v.inclusiveMaximum) {
    return false;
  }
  return true;
}
export const isNumber = Object.assign(
  function (v: unknown): v is number {
    return typeof v === "number";
  },
  {
    [guardType]: "number",
    optional,
    config(v: Partial<Omit<NumberSubtype, "type">>) {
      function isNumberGuard(val: unknown): val is number {
        return isNumber(val) && checkNumber(val, v);
      }
      isNumberGuard.toSchema = () => ({ ...v, type: "number" });
      return isNumberGuard;
    },
  },
);

export const isInteger = Object.assign(
  function isInteger(v: unknown): v is number {
    return Number.isInteger(v);
  },
  {
    [guardType]: "integer",
    optional,
    config: (v: Config<NumberSubtype> = {}) => {
      function isIntegerGuard(val: unknown): val is number {
        return isInteger(val) && checkNumber(val, v);
      }
      isIntegerGuard.toSchema = () => ({ ...v, type: "integer" });
      return isIntegerGuard;
    },
  },
);

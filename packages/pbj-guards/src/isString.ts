import { hasA } from "./guards.js";
import { isNumber } from "./isNumber.js";
import { StringSubtype } from "./schema/json-schema.types.js";
import { guardType } from "./guards.js";
import { optional } from "./optional.js";
export const isString = Object.assign(
  function isString(v: unknown): v is string {
    return typeof v === "string";
  },
  {
    [guardType]: "string",
    optional,
    config(opts: Partial<Omit<StringSubtype, "type">> = {}) {
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
        if (
          hasA(opts, "pattern", isString) &&
          !new RegExp(opts.pattern).test(v)
        ) {
          return false;
        }
        return true;
      }
      isStringGuard.toSchema = () => ({
        type: "string",
        ...opts,
      });
      return isStringGuard;
    },
  },
);

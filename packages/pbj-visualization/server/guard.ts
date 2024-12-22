export const guardType = Symbol("@pbj/visualization/guardType");
export type Guard<T> = ((value: unknown) => value is T) & {
  [guardType]?: string;
};

export function isRequired<V>(v: V): v is Exclude<V, null | undefined> {
  return v != null;
}

export function isInteger(v: unknown): v is number {
  return Number.isInteger(v);
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}
export function isNumber(v: unknown): v is number {
  return typeof v === "number";
}
export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isArray<T>(v: unknown, guard?: Guard<T>): v is T[] {
  const isArr = Array.isArray(v);
  if (!isArr) {
    return false;
  }
  if (guard) {
    for (const item of v) {
      if (!guard(item)) {
        return false;
      }
    }
  }

  return isArr;
}

export type AllOf<T> = T extends [
  Guard<infer U>,
  ...infer Rest extends readonly Guard<any>[]
]
  ? Rest["length"] extends 0
    ? U
    : U & AllOf<Rest>
  : never;

export function asserts<T extends readonly Guard<any>[]>(...guards: T) {
  return function assertsGuard(value: unknown): asserts value is AllOf<T> {
    for (const guard of guards) {
      if (!guard(value)) {
        throw new GuardError(`Value '${value}' does not match guard`);
      }
    }
  };
}

export class GuardError extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, GuardError.prototype);
  }
}

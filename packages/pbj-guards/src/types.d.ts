export type Constructor<T = any> = new (...args: any[]) => T;
export type Fn<T = any> = (...args: any[]) => T | Promise<T>;
export type Primitive = string | number | boolean | symbol | bigint;
export type PrimitiveType = String | Number | Boolean | Symbol | BigInt;
export type PrimitiveValue<T extends PrimitiveType> = T extends String
  ? string
  : T extends Number
    ? number
    : T extends Boolean
      ? boolean
      : T extends Symbol
        ? symbol
        : T extends BigInt
          ? bigint
          : never;

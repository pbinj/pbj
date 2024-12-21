import {
  asString,
  type ServiceDescriptorI,
  type Registry,
  type RegistryType,
  context,
  serviceSymbol,
  PBinJKeyType,
  PBinJKey,
} from "@pbinj/pbj";
import { allOf, asserts, isRequired, shape } from "./guard";

export class PBinJService<TRegistry extends RegistryType = Registry> {
  constructor(private ctx = context) {}
  #findNyName(name: string): ServiceDescriptorI<TRegistry, any> {
    let service: ServiceDescriptorI<TRegistry, any> | undefined = undefined;
    this.ctx.visit((v) => {
      if (v?.name && asString(v.name) === name) {
        service = v;
      }
    });
    if (!service) {
      throw Error(`Service ${name} not found`);
    }
    return service;
  }
  async invoke(arg: { name: string }) {
    const service = this.#findNyName(arg.name);
    if (service) {
      try {
        this.ctx.resolveAsync(service[serviceSymbol] as any);
      } catch (e) {
        throw e instanceof Error ? e : Error(String(e));
      }
    }
  }
  async invalidate(arg: { name: string }) {
    hasName(arg);
    const service = this.#findNyName(arg.name);
    if (service) {
      try {
        return service.invalidate();
      } catch (e) {
        throw e instanceof Error ? e : Error(String(e));
      }
    }
  }
  configure(
    id: string,
    change: Partial<{
      readonly [K in keyof ServiceDescriptorI<
        TRegistry,
        any
      >]: ServiceDescriptorI<TRegistry, any>[K] extends
        | string
        | number
        | boolean
        | null
        | undefined
        ? ServiceDescriptorI<TRegistry, any>[K]
        : never;
    }>
  ) {
    const service = this.#findNyName(id);
    if (service) {
      Object.assign(
        service,
        allow(
          change,
          "name",
          "invokable",
          "cacheable",
          "description",
          "optional",
          "tags"
        )
      );
    }
    return service;
  }
}

function allow<T extends { [k: PropertyKey]: any }, K extends (keyof T)[]>(
  obj: T,
  ...keys: K
): Omit<T, K[number]> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k, v]) => !keys.includes(k))
  ) as any;
}
function isString(v: unknown): v is string {
  return typeof v === "string";
}
const hasName = asserts(
  shape({
    name: allOf(isRequired, (v: unknown): v is string => typeof v === "string"),
  })
);

const assertString = asserts(isRequired, isString);
const b: unknown = "1";
assertString(b);

hasName({ name: "" });

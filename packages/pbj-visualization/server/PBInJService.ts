import {
  asString,
  type ServiceDescriptorI,
  type Registry,
  type RegistryType,
  context,
  serviceSymbol,
} from "@pbinj/pbj";
import { asserts, isString } from "./guard";
import { exactShape } from "./schema/schema";

const hasName = exactShape({
  name: isString,
});
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
  async invalidate(arg: unknown) {
    if (!hasName(arg)) {
      throw Error("Invalid argument");
    }
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
    }>,
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
          "tags",
        ),
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
    Object.entries(obj).filter(([k, v]) => !keys.includes(k)),
  ) as any;
}

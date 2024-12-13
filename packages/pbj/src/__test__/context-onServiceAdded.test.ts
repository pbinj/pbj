import { it, describe, expect } from "vitest";
import { pbj, pbjKey, createNewContext } from "../index";
import { a } from "vitest/dist/chunks/suite.B2jumIFP";
import { env } from "../env";
const wait = (ms: number = 10) =>
  new Promise((resolve) => setTimeout(resolve, ms));
describe("onServiceAdded", () => {
  it("should notify when services are added", async () => {
    const events: string[] = [];
    const ctx = createNewContext();

    ctx.onServiceAdded((service) => {
      events.push(`added: ${service.name}`);
    });

    class TestService {}
    ctx.register(TestService);
    await wait();
    expect(events).toEqual(["added: TestService"]);
  });

  it("should notify when services change", async () => {
    const events: string[] = [];
    const ctx = createNewContext();
    const serviceKey = pbjKey<string>("test");
    // Initial registration
    ctx.register(pbjKey<string>("intital"), "initial");

    ctx.onServiceAdded((...services) => {
      for (const service of services) {
        events.push(`changed: ${service.name}`);
      }
    });

    // Update service
    ctx.register(serviceKey, "updated");
    await wait();
    expect(events).toEqual(["changed: intital", "changed: test"]);
  });

  it("should notify for tagged services", async () => {
    const events: string[] = [];
    const ctx = createNewContext();
    const pluginKey = pbjKey<any>("plugin");

    ctx.onServiceAdded((...services) => {
      for (const service of services) {
        if (service.hasTag(pluginKey)) {
          events.push(`plugin: ${service.name}`);
        }
      }
    });

    class PluginA {}
    class PluginB {}

    ctx.register(PluginA).withTags(pluginKey);
    ctx.register(PluginB).withTags(pluginKey);
    await wait();

    expect(events).toEqual(["plugin: PluginA", "plugin: PluginB"]);
  });

  it("should allow unsubscribing", async () => {
    const events: string[] = [];
    const ctx = createNewContext();

    const unsubscribe = ctx.onServiceAdded((...services) => {
      for (const service of services) events.push(service.name!);
    });

    class ServiceA {}
    ctx.register(ServiceA);

    unsubscribe();

    class ServiceB {}
    ctx.register(ServiceB);
    await wait();
    expect(events).toEqual(["ServiceA"]);
  });

  it("should notify immediately for existing services", async () => {
    const ctx = createNewContext();
    const events: string[] = [];

    class ExistingService {}
    ctx.register(ExistingService);

    ctx.onServiceAdded((service) => {
      events.push(`existing: ${service.name}`);
    });

    await wait();

    expect(events).toEqual(["existing: ExistingService"]);
  });

  it("should handle multiple listeners", async () => {
    const ctx = createNewContext();
    const events1: string[] = [];
    const events2: string[] = [];

    ctx.onServiceAdded((service) => {
      events1.push(service.name!);
    });

    ctx.onServiceAdded((service) => {
      events2.push(service.name!);
    });

    class TestService {}
    ctx.register(TestService);
    await wait();
    expect(events1).toEqual(["TestService"]);
    expect(events2).toEqual(["TestService"]);
  });
});

import { it, describe, expect, beforeEach, afterEach } from "vitest";
import { context, pbjKey, createNewContext } from "../index.js";
import { runBeforeEachTest, runAfterEachTest } from "../test.js";
beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);

const wait = (ms: number = 10) =>
  new Promise((resolve) => setTimeout(resolve, ms));
describe("onServiceAdded", () => {
  it("should notify when services are added", async () => {
    const events: string[] = [];

    context.onServiceAdded((service) => {
      events.push(`added: ${service?.name}`);
    });

    class TestService {}
    context.register(TestService);
    await wait();
    expect(events).toEqual(["added: TestService"]);
  });

  it("should notify when services change", async () => {
    const events: string[] = [];
    const serviceKey = pbjKey<string>("test");
    // Initial registration
    context.register(pbjKey<string>("intital"), "initial");

    context.onServiceAdded((service) => {
      events.push(`changed: ${service.name}`);
    });

    // Update service
    context.register(serviceKey, "updated");
    await wait();
    expect(events).toEqual(["changed: intital", "changed: test"]);
  });

  it("should notify for tagged services", async () => {
    const events: string[] = [];
    const pluginKey = pbjKey<any>("plugin");

    context.onServiceAdded((...services) => {
      for (const service of services) {
        if (service.hasTag(pluginKey)) {
          events.push(`plugin: ${service.name}`);
        }
      }
    });

    class PluginA {}
    class PluginB {}

    context.register(PluginA).withTags(pluginKey);
    context.register(PluginB).withTags(pluginKey);
    await wait();

    expect(events).toEqual(["plugin: PluginA", "plugin: PluginB"]);
  });

  it("should allow unsubscribing", async () => {
    const events: string[] = [];

    const unsubscribe = context.onServiceAdded((...services) => {
      for (const service of services) events.push("first" + service.name!);
    });

    class ServiceA {}
    context.register(ServiceA);
    unsubscribe();

    context.onServiceAdded((...services) => {
      for (const service of services) events.push("second" + service.name!);
    });
    class ServiceB {}
    context.register(ServiceB);
    await wait();
    expect(events).toEqual(["secondServiceA", "secondServiceB"]);
  });

  it("should notify immediately for existing services", async () => {
    const events: string[] = [];

    class ExistingService {}
    context.register(ExistingService);

    context.onServiceAdded((service) => {
      events.push(`existing: ${service.name}`);
    });

    await wait();

    expect(events).toEqual(["existing: ExistingService"]);
  });

  it("should handle multiple listeners", async () => {
    const events1: string[] = [];
    const events2: string[] = [];

    context.onServiceAdded((service) => {
      events1.push(service.name!);
    });

    context.onServiceAdded((service) => {
      events2.push(service.name!);
    });

    class TestService {}
    context.register(TestService);
    await wait();
    expect(events1).toEqual(["TestService"]);
    expect(events2).toEqual(["TestService"]);
  });
});

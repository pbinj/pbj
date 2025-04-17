import { it, describe, expect } from "vitest";
import { MetricsConfig } from "../MetricsConfig.js";
import { register, registerKey } from "../pbj.js";
import { context } from "@pbinj/pbj";
import {beforeEach, afterEach} from "vitest";
import {runBeforeEachTest, runAfterEachTest} from "@pbinj/pbj/test";
beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);

describe("metrics", () => {
  it("config", () => {
    const metricConfig = new MetricsConfig("9090");
    expect(metricConfig.port).toBe(9090);
  });
  it("should boot", async () => {
    register(context);
    const registry = context.resolve(registerKey);
    const resp = await registry.metrics();
    expect(await registry.metrics()).toMatch(/pbj_up/);
  });
});

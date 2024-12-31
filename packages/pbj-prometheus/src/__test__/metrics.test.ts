import { it, describe, expect } from "vitest";
import { MetricsConfig } from "../MetricsConfig.js";
import { register, registerKey } from "../pbj.js";
import { createNewContext } from "@pbinj/pbj";

describe("metrics", () => {
  it("config", () => {
    const metricConfig = new MetricsConfig("9090");
    expect(metricConfig.port).toBe(9090);
  });
  it("should boot", async () => {
    const ctx = createNewContext();
    register(ctx);
    const registry = ctx.resolve(registerKey);
    expect(await registry.metrics()).toMatch(/pbj_up/);
  });
});

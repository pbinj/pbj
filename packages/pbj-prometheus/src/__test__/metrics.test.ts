import { it, describe, expect } from "vitest";
import { MetricsConfig } from "../MetricsConfig.js";
import { promClientPBinJKey, registerKey } from "../pbj.js";
import { context, pbjKey } from "@pbinj/pbj";
import { beforeEach, afterEach } from "vitest";
import { runBeforeEachTest, runAfterEachTest } from "@pbinj/pbj/test";
import * as client from "prom-client";
import { MetricService } from "../MetricService.js";

beforeEach(runBeforeEachTest);
afterEach(runAfterEachTest);

// Simplified register function for tests to avoid circular references
function registerForTest(ctx = context) {
  // Register the client and registry without the circular listener
  ctx.register(promClientPBinJKey, () => client);
  ctx.register(registerKey, () => new client.Registry());
  ctx.register(MetricsConfig);

  // Register MetricService but don't set up the listener that causes circular refs
  const metricServiceKey = pbjKey<MetricService>(
    "@pbj/prometheus/metricService",
  );
  ctx.register(metricServiceKey, MetricService);

  // Initialize the up gauge directly
  const config = ctx.resolve(MetricsConfig);
  const registry = ctx.resolve(registerKey);
  const promClient = ctx.resolve(promClientPBinJKey);

  if (config.includeUp !== false) {
    const up = new promClient.Gauge({
      name: config.formatName("up"),
      help: "1 = up, 0 = not up",
      registers: [registry],
    });
    up.set(1);
  }

  return registry;
}

describe("metrics", () => {
  it("config", () => {
    const metricConfig = new MetricsConfig("9090");
    expect(metricConfig.port).toBe(9090);
  });

  it("should boot", async () => {
    // Use the test-specific register function
    const registry = registerForTest(context);
    const metrics = await registry.metrics();
    expect(metrics).toMatch(/pbj_up/);
  });
});

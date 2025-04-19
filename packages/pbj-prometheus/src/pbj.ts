import { context, pbjKey } from "@pbinj/pbj";
import * as client from "prom-client";
import { MetricsConfig } from "./MetricsConfig.js";
import { MetricService } from "./MetricService.js";

export const promClientPBinJKey = pbjKey<typeof client>(
  "@pbj/prometheus/metrics",
);

export const registerKey = pbjKey<InstanceType<typeof client.Registry>>(
  "@pbj/prometheus/register",
);
export const metricServiceKey = pbjKey<InstanceType<typeof MetricService>>(
  "@pbj/prometheus/metricService",
);

export function register(ctx = context) {
  ctx.register(promClientPBinJKey, () => client);
  ctx.register(registerKey, () => new client.Registry());
  ctx.register(MetricsConfig);
  ctx.register(metricServiceKey, MetricService);
  ctx.resolve(
    (config: MetricsConfig, metricService: MetricService) => {
      ctx.onServiceAdded((...services) => {
        const tags = config.tags;
        for (const service of services) {
          if (tags?.length) {
            if (service.tags.some((v) => tags.includes(v))) {
              metricService.withMetric(service);
            }
          } else {
            metricService.withMetric(service);
          }
        }
      }, true);
    },
    ctx.pbj(MetricsConfig),
    metricServiceKey,
  );
}

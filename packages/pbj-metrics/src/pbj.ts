import { context, pbj, pbjKey } from "@pbinj/pbj";
import * as client from "prom-client";
import { MetricsConfig } from "./MetricsConfig";
import { MetricService } from "./MetricService";

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
  const p = ctx.register(promClientPBinJKey, () => client);
  const r = ctx.register(registerKey, () => new client.Registry());
  const c = ctx.register(MetricsConfig);
  const m = ctx.register(
    metricServiceKey,
    MetricService,
    c.proxy,
    p.proxy,
    r.proxy,
  );
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
      });
    },
    c.proxy,
    m.proxy,
  );
}

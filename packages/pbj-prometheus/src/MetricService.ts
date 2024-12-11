import { pbj } from "@pbinj/pbj";
import { MetricsConfig } from "./MetricsConfig";
import { promClientPBinJKey, registerKey } from "./pbj";
import { ServiceDescriptor } from "@pbinj/pbj/ServiceDescriptor";

export class MetricService {
  constructor(
    private config = pbj(MetricsConfig),
    private promClient = pbj(promClientPBinJKey),
    private register = pbj(registerKey),
  ) {
    if (config.includeUp !== false) {
      const up = new promClient.Gauge({
        name: config.formatName("up"),
        help: "1 = up, 0 = not up",
        registers: [this.register],
      });

      up.set(1);
    }
  }
  withMetric(v: ServiceDescriptor<any, any>) {
    const name = v.name ?? "";
    switch (name) {
      case "@pbj/prometheus/metrics":
        return;
      case "":
      case "<anonymous>":
        console.warn(
          `can not monitor anonmous pbj's please use pbjKey, symbol with a description, or name the pbj`,
        );
        return;
    }
    const metric = this.newMetric(name);
    v.withInterceptors((invoke) => {
      const endTimer = metric.startTimer();
      let status = "success";
      try {
        return invoke.call(v);
      } catch (e) {
        status = "failed";
        throw e;
      } finally {
        endTimer({ status });
      }
    });
  }
  newMetric(oname: string) {
    const name = this.config.formatName(oname);

    const labelNames = ["status"];
    labelNames.push.apply(labelNames, Object.keys(this.config.labels));
    if (this.config.metricType === "summary") {
      return new this.promClient.Summary({
        name,
        help:
          "duration summary of method invocation labeled with: " +
          labelNames.join(", "),
        labelNames,
        percentiles: this.config.percentiles,
        maxAgeSeconds: this.config.maxAgeSeconds,
        ageBuckets: this.config.ageBuckets,
        registers: [this.register],
        pruneAgedBuckets: this.config.pruneAgedBuckets,
      });
    }

    if (this.config.metricType === "histogram") {
      return new this.promClient.Histogram({
        name,
        help:
          "duration histogram of method invocation labeled with: " +
          labelNames.join(", "),
        labelNames,
        buckets: this.config.buckets,
        registers: [this.register],
      });
    }
    throw new Error("metricType option must be histogram or summary");
  }
}

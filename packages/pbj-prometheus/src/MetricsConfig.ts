import { env } from "@pbinj/pbj/env";
import { isNullish } from "@pbinj/pbj/guards";
import { type PBinJKey } from "@pbinj/pbj";

export class MetricsConfig {
  constructor(
    private _port = env("METRICS_PORT", "9100"),
    public path = env("METRICS_PATH", "/metrics"),
    public host = env("METRICS_HOST", "localhost"),
    public prefix = env("METRICS_PREFIX", "pbj_"),
    /**
     * Timeout for
     */
    private _timeout = env("METRICS_TIMEOUT", "1000"),
    /**
     * Labels to add to metrics, needs to be a JSON notation string
     */
    private _labels = env("METRICS_LABELS", "{}"),
    public collectDefaultMetrics: { prefix?: string } | undefined = {},
    /**
     * Tags to listen invocation metrics
     */
    public tags: PBinJKey<any>[] = [],
    public metricType: "summary" | "histogram" = "summary",
    public percentiles = [0.5, 0.75, 0.95, 0.98, 0.99, 0.999],
    public maxAgeSeconds = 1000,
    public ageBuckets = 5,
    public pruneAgedBuckets = true,
    public buckets = [0.003, 0.03, 0.1, 0.3, 1.5, 10],
    public includeUp = true,
    public formatName = (oname: string) =>
      camelToSnakeCase(`${prefix}${oname}`)
        .replace(/[^a-zA-Z0-9_:]/g, "_")
        .replace(/__/g, "_"),
  ) {}

  get port() {
    return Number(this._port);
  }
  get timeout() {
    return Number(this._timeout);
  }
  get labels(): Record<string, string> {
    if (isNullish(this._labels)) {
      return {};
    }
    return JSON.parse(this._labels) as Record<string, string>;
  }
}
function camelToSnakeCase(str: string): string {
  return str.replace(/(.+?)([A-Z])/g, "$1_$2").toLowerCase();
}

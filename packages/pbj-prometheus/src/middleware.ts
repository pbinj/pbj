import { context } from "@pbinj/pbj";
import { register, registerKey } from "./pbj.js";
import { MetricsConfig } from "./MetricsConfig.js";
import type { Express, Response } from "express";

export const middleware = (ctx = context) =>
  async function middleware$inner(_req: any, res: Response) {
    const register = ctx.resolve(registerKey);
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  };

export async function apply(v: Express, ctx = context) {
  register(ctx);
  const config = ctx.resolve(MetricsConfig);
  const path = config.path + "" || "/metrics";
  const host = config.host + "" || "localhost";

  v.use(path, middleware(ctx));

  v.listen(config.port, config.host, () => {
    console.log(
      `@pbinj/pbj-prometheus is running on 'http://${host}:${config.port}${path}'`,
    );
  });
}

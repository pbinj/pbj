import { pbjKey, context } from "@pbinj/pbj";
import { env } from "@pbinj/pbj/env";
import express from "express";

/**
 * CJS / ESM madness.
 */
const dirname = (() => {
  try {
    //@ts-ignore
    return new URL("..", import.meta.url).pathname;
  } catch (e) {
    return `${__dirname}/..`;
  }
})();
export const serverConfigPBinJKey = pbjKey<ServerConfig>("serverConfig");
export class ServerConfig {
  constructor(
    private _port = env("PJB_PORT", "3000"),
    private _host = env("PJB_HOST", "localhost"),
    private _path = env("PJB_PATH", "/"),
  ) { }
  get host() {
    return this._host + "";
  }
  get url() {
    return `http://${this.host}:${this.port}`;
  }
  get port() {
    return Number(this._port);
  }
  get path() {
    return this._path + "";
  }
}

export async function register(ctx = context, start = true): Promise<express.Express> {
  ctx.register(serverConfigPBinJKey, ServerConfig);

  const app = express();
  const config = ctx.resolve(serverConfigPBinJKey);
  const index = `${dirname}/../web/index.html`;
  app.use(config.path, express.static(`${dirname}/../web`));
  app.get("/", (_, res) => {
    res.sendFile(index);
  });
  app.get("/api/services", (_, res) => {
    res.send(JSON.stringify(ctx.toJSON()));
  });

  if (start) {
    await new Promise<void>((resolve) => app.listen(config.port, config.host, resolve));
    console.log("PBinJ visualization server started at: %s", config.url);
  }
  return app;
}

import {
  pbjKey,
  context,
  asString,
  type ServiceDescriptorI,
  type Registry,
  serviceSymbol,
} from "@pbinj/pbj";
import { env } from "@pbinj/pbj/env";
import express from "express";
import { Server } from "http";
import type { AddressInfo } from "net";
import { route } from "./framework";

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
    private _port = env("PJB_PORT", "0"),
    private _host = env("PJB_HOST", "localhost"),
    private _path = env("PJB_PATH", "/"),
  ) {}
  get host() {
    return this._host + "";
  }
  set host(host: string) {
    this._host = host;
  }
  get url() {
    return `http://${this.host}:${this.port}${this.path}`;
  }
  get port() {
    return Number(this._port);
  }
  set port(port: number) {
    this._port = port + "";
  }
  get path() {
    return this._path + "";
  }
  set path(path: string) {
    this._path = path;
  }
}

export async function register(
  ctx = context,
  start = true,
): Promise<express.Express> {
  ctx.register(serverConfigPBinJKey, ServerConfig);

  const app = express();
  const config = ctx.resolve(serverConfigPBinJKey);
  const index = `${dirname}/../web/index.html`;
  app.use(config.path, express.static(`${dirname}/../web`));
  app.use(express.json());
  app.get("/", (_, res) => {
    res.sendFile(index);
  });
  app.post("/api/invoke", async (req, res) => {
    if (req.body.name) {
      let service: ServiceDescriptorI<Registry, any> | undefined = undefined;
      ctx.visit((v) => {
        if (v?.name && asString(v.name) === req.body.name) {
          service = v;
        }
      });
      if (service) {
        try {
          const resp = await ctx.resolveAsync(service[serviceSymbol]);
          res.send(JSON.stringify(resp));
        } catch (e) {
          res.send({ error: String(e) });
        }
      }
    } else {
      res.send({ error: "Service was not found" });
    }
  });
  app.post("/api/invalidate", async (req, res) => {
    if (req.body.name) {
      let service: ServiceDescriptorI<Registry, any> | undefined = undefined;
      ctx.visit((v) => {
        if (v?.name && asString(v.name) === req.body.name) {
          service = v;
        }
      });
      if (service) {
        try {
          (
            ctx.resolve(service[serviceSymbol]) as ServiceDescriptorI<
              Registry,
              any
            >
          )?.invalidate();
          res.send(
            JSON.stringify({
              success: true,
              message: "Service invalidated",
              service,
            }),
          );
        } catch (e) {
          res.send({ error: String(e) });
        }
      }
    } else {
      res.send({ error: "Service was not found" });
    }
  });

  app.get("/api/services", (_, res) => {
    res.send(JSON.stringify(ctx.toJSON()));
  });

  if (start) {
    const server = await new Promise<Server>((resolve) => {
      const _server = app.listen(config.port, config.host, () => {
        resolve(_server);
      });
    });
    //In dev mode the os will assign a port (0) and then we will assign it back to the config.
    //this should allow vite to
    config.port = (server.address() as AddressInfo)?.port!;
    console.log("PBinJ visualization server started at: %s", config.url);
  }
  return app;
}

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
import { anyOf, enums } from "@pbinj/pbj-guards";
import { Server as ServerIO } from "socket.io";

const isAction = anyOf(enums("invoke", "invalidate"));

/**
 * CJS / ESM madness.
 */
const dirname = (() => {
  try {
    //eslint-disable-next-line
    //@ts-ignore
    return new URL("..", import.meta.url).pathname;
  } catch {
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
  toJSON() {
    return {
      port: this.port,
      host: this.host,
      path: this.path,
      url: this.url,
    };
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

  app.get("/api/services", (_, res) => {
    res.send(JSON.stringify(ctx.toJSON()));
  });

  app.post("/api/:action", async (req, res) => {
    const action = req.params.action;
    if (!isAction(action)) {
      ctx.logger.error(`{error} {action} service`, {
        error: "invalid action",
        action,
      });
      res.send({ error: "Invalid action" });
      return;
    }
    if (!req.body.name) {
      res.send({ error: "name required." });
    }

    let service: ServiceDescriptorI<Registry, any> | undefined = undefined;
    ctx.visit((v) => {
      if (v?.name && asString(v.name) === req.body.name) {
        service = v;
      }
    });

    if (!service) {
      ctx.logger.error(`{error} {action} {name}`, {
        error: "not found",
        action,
        name: req.body.name,
      });
      res.send({ error: "Service was not found" });
      return;
    }
    let value: any;
    let perf = performance.now();
    let message: string;
    try {
      switch (action) {
        case "invalidate": {
          value = (
            ctx.register(service[serviceSymbol]) as ServiceDescriptorI<
              Registry,
              any
            >
          )?.invalidate();
          message = "Service invalidated";
          break;
        }
        case "invoke": {
          value = await ctx.resolveAsync(service[serviceSymbol] as any);
          message = "Service invoked";
          break;
        }
      }

      res.send(
        JSON.stringify({
          success: true,
          action,
          value,
          timing: performance.now() - perf,
          message,
          service: asString(service[serviceSymbol]),
        }),
      );
    } catch (e) {
      ctx.logger.error(`error {action} {service}`, {
        error: e,
        action,
        service: asString(service[serviceSymbol]),
      });
      res.send({ error: String(e) });
    }
  });
  if (start) {
    const server = await new Promise<Server>((resolve) => {
      const _server = app.listen(config.port, config.host, () => {
        resolve(_server);
      });
    });
    const io = new ServerIO(server, { path: "/socket.io" });
    io.on("connection", (socket) => {
      console.log("connected", socket.id);
      socket.emit("connected", `Connected ${socket.id}`);
      const unsub = ctx.logger.onLogMessage((msg) => {
        socket.emit("log", msg);
      });
      const unadd = ctx.onServiceAdded((service) => {
        socket.emit("onServiceAdded", service);
      });
      socket.on("ping", (ping) => {
        ping?.emit("pong");
      });
      socket.on("disconnect", () => {
        unsub?.();
        unadd?.();
        console.log("disconnected");
      });
    });
    //In dev mode the os will assign a port (0) and then we will assign it back to the config.
    //this should allow vite to
    config.port = (server.address() as AddressInfo)?.port!;
    ctx.logger.info(
      "PBinJ visualization server started at: {url}",
      config as any,
    );
    console.log("PBinJ visualization server started at: %s", config.url);
  }
  return app;
}

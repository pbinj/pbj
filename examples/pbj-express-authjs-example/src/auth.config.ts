import { ExpressAuthConfig } from "@auth/express";
import { context, pbj } from "@pbinj/pbj";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import GitHub from "@auth/express/providers/github";
import { env } from "@pbinj/pbj/env";
import { drizzlePBinJKey, register } from "pbj-drizzle-example";
import "@pbinj/pbj/async";

register();

context.register(
  DrizzleAdapter,
  pbj(drizzlePBinJKey) as unknown as Parameters<typeof DrizzleAdapter>[0]
);

export class ClientConfig {
  constructor(
    provider = "github",
    private _clientId = env(`AUTH_${provider.toUpperCase()}_ID`),
    private _clientSecret = env(`AUTH_${provider.toUpperCase()}_SECRET`)
  ) {}
  get clientId(): string {
    //This is a hack to get around the fact that the auth library expects a string, but we are using a proxy.
    return this._clientId + "";
  }
  get clientSecret(): string {
    //This is a hack to get around the fact that the auth library expects a string, but we are using a proxy.
    return this._clientSecret + "";
  }
}

export class ExpressAuthConfigClass implements ExpressAuthConfig {
  constructor(
    public providers: ExpressAuthConfig["providers"] = [
      GitHub(pbj(ClientConfig)),
    ],
    public adapter = pbj(DrizzleAdapter),
    public basePath = "/auth"
  ) {}
}

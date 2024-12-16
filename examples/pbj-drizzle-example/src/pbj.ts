import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { envRequired } from "@pbinj/pbj/env";
import { pbj, context, pbjKey } from "@pbinj/pbj";
import * as schemaOrig from "./schema";

export const schema = schemaOrig;

export class ClientConfig {
  constructor(
    private _url = envRequired("DATABASE_URL"),
    public _authToken = envRequired("DATABASE_AUTH_TOKEN")
  ) {}
  //These eventually get passed into  rust, and rust really doesn't seem to like proxied strings, so we need to force them to be real strings.
  //Otherwise in the downstream libsql code we get "TypeError: failed to downcast any to string"
  get url() {
    return this._url + "";
  }
  get authToken() {
    return this._authToken + "";
  }
}

const drizzleFactory = (drizzleConfig = pbj(ClientConfig)) => {
  return drizzle(createClient(drizzleConfig), { schema });
};

export const drizzlePBinJKey =
  pbjKey<ReturnType<typeof drizzleFactory>>("drizzle");

export function register() {
  context.register(drizzlePBinJKey, drizzleFactory);
}

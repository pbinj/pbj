import { pbj, type ContextI, pbjKey } from "@pbinj/pbj";

/**
 * use pbjKey so that we do not have to add it to the registry.
 *
 */
export const dbServiceSymbol = pbjKey<IDBService>("db-service-type");

export interface IDBService {
  connection(): string;
}

export const connectionPBinJKey = pbjKey<string>("connection");

export class DBService implements IDBService {
  constructor(
    private readonly connectionUrl: string = pbj(connectionPBinJKey),
  ) {}
  connection() {
    return this.connectionUrl;
  }
}

export function db(ctx: ContextI) {
  ctx.register(dbServiceSymbol, DBService);
  return ctx;
}

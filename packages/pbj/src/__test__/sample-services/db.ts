import { pbjKey, serviceSymbol } from "@pbinj/pbj";
import { pbj } from "../../context";

export const dbServiceSymbol = pbjKey<typeof DBService>("db-service-type");

export interface IDBService {
  connection(): string;
}

export const connectionPBinJKey = pbjKey<string>("connection");

export class DBService implements IDBService {
  public static readonly [serviceSymbol] = dbServiceSymbol;

  constructor(private readonly connectionUrl: string = pbj(connectionPBinJKey)) { }
  connection() {
    return this.connectionUrl;
  }
}

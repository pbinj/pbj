import { builder } from "@pbinj/pbj";

export interface IDBService {
  connection(): string;
}

export class DBService implements IDBService {
  constructor(private readonly connectionUrl: string) {}
  connection() {
    return this.connectionUrl;
  }
}
const dbb = builder().register("connectionUrl", "psql://localhost:5432/mydb");

export const db = dbb
  .register(
    "db",
    (conn: string): IDBService => {
      return new DBService(conn);
    },
    dbb.refs.connectionUrl,
  )
  .export("db", "connectionUrl");

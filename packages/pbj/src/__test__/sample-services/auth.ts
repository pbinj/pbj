import { pbj, type ContextI } from "@pbinj/pbj";
import { db, dbServiceSymbol } from "./db.js";

export const authServiceSymbol = Symbol("auth-service-type");

export interface IAuthService {
  isAuthenticated(): Promise<boolean>;
}

export class AuthService implements IAuthService {
  public static readonly service = authServiceSymbol;

  constructor(private readonly dbService = pbj(dbServiceSymbol)) {}

  async isAuthenticated() {
    this.dbService.connection();
    console.log("authenticated");
    return true;
  }
}

declare module "@pbinj/pbj" {
  export interface Registry {
    [authServiceSymbol]: InstanceType<typeof AuthService>;
  }
}

export function auth(ctx: ContextI) {
  db(ctx).register(authServiceSymbol, AuthService);
  return ctx;
}

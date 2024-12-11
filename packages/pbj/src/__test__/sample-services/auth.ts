import { pbj } from "../../context";
import { DBService } from "./db";

export const authServiceSymbol = Symbol("auth-service-type");

export interface IAuthService {
  isAuthenticated(): Promise<boolean>;
}

export class AuthService implements IAuthService {
  public static readonly service = authServiceSymbol;

  constructor(private readonly dbService = pbj(DBService)) {}

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

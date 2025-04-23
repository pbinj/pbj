import { builder } from "@pbinj/pbj";
import { db, type IDBService } from "./db.js";

export interface IAuthService {
  isAuthenticated(): Promise<boolean>;
}

export class AuthService implements IAuthService {
  constructor(private readonly dbService: IDBService) {}

  async isAuthenticated() {
    this.dbService.connection();
    console.log("authenticated");
    return true;
  }
}

/**
 * Allows us to reference the builder, in itself, also it uses the db, so we can reference that. It also ensures
 * that db is registered in the context, so we don't have to know the actual order.
 */
const ab = builder().uses(db);

/**
 * This only exports the AuthService, if a user wanted to change the connection url,
 * they should go through the `db` interface.   We don't have a great namespacing story yet.
 */
export const auth = ab
  .register("authService", AuthService, ab.refs.db)
  .export("authService");

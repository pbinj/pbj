import { auth, authServiceSymbol } from "./auth.js";
import { DBService, IDBService } from "./db.js";
import { pbj, serviceSymbol } from "@pbinj/pbj";
import { ContextI } from "../../context-types";

export const emailServiceSymbol = Symbol("email-service-type");

export class EmailService {
  static [serviceSymbol] = emailServiceSymbol;
  constructor(
    private authService = pbj(authServiceSymbol),
    private dbService: IDBService = pbj(DBService),
  ) {}

  async sendEmail(to: string, subject: string, body: string) {
    if (await this.authService.isAuthenticated()) {
      console.log("authenticated");
    }
    if (this.dbService.connection()) {
      console.log("connected");
    }
    console.log(
      `Email sent to ${to} with subject "${subject}" and body "${body}"`,
    );
  }
}

/**
 * This is how you can extend the built-in type registry
 * with your own types.  This is really not that useful, and
 * may go away in the future
 */
declare module "@pbinj/pbj" {
  interface Registry {
    [emailServiceSymbol]: InstanceType<typeof EmailService>;
  }
}

export function email(ctx: ContextI) {
  auth(ctx);
  ctx.register(emailServiceSymbol, EmailService);
  return ctx;
}

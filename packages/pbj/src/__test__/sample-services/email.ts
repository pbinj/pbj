import { authServiceSymbol } from "./auth.js";
import { DBService, IDBService } from "./db.js";
import { pbj, serviceSymbol } from "@pbinj/pbj";
declare module "@pbinj/pbj" {
  interface Registry {
    [emailServiceSymbol]: typeof EmailService;
  }
}
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

import { builder } from "@pbinj/pbj";
import { db, type IDBService } from "./db.js";
import { auth, type AuthService } from "./auth.js";

export class EmailService {
  constructor(
    private authService: AuthService,
    private dbService: IDBService,
  ) {}

  public async sendEmail(to: string, subject: string, body: string) {
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
const eb = builder().uses(db, auth);
export const email = eb
  .register("emailService", EmailService, eb.refs.authService, eb.refs.db)
  .export();

import { email } from "./email.js";
import { context } from "@pbinj/pbj";

export async function main(...[to, subject, message]: string[]) {
  return email
    .apply(context)
    .resolve("emailService")
    .sendEmail(to, subject, message);
}

main(...process.argv.slice(2)).then(console.log, console.error);

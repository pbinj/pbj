import { context } from "@pbinj/pbj";
import { email, emailServiceSymbol } from "./email.js";

export async function main(...[to, subject, message]: string[]) {
  return email(context)
    .resolve(emailServiceSymbol)
    .sendEmail(to, subject, message);
}

main(...process.argv.slice(2)).then(console.log, console.error);

#!/usr/bin/env tsx
import { eq } from "drizzle-orm";
import { drizzlePBinJKey, register } from "./pbj";
import { pbj } from "@pbinj/pbj";
import { users as usersTable } from "./schema";
import { fileURLToPath } from "url";

register();

async function main(db = pbj(drizzlePBinJKey)) {
  const email = `john${Date.now()}@example.com`;
  await db.insert(usersTable).values({
    id: crypto.randomUUID(),
    name: "John",
    email,
  });
  console.log("New user created!");
  const users = await db.query.users.findMany();
  console.log("Getting all users from the database: ", users);
  await db
    .update(usersTable)
    .set({
      emailVerified: new Date(),
    })
    .where(eq(usersTable.email, email));
  console.log("User info updated!");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}

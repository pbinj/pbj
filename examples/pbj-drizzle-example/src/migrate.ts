#!/usr/bin/env tsx

import { migrate as dbMigrate } from "drizzle-orm/libsql/migrator";
import { drizzlePBinJKey, register } from "./pbj";
import { pbj } from "@pbinj/pbj";
import { fileURLToPath } from "url";

register();

export async function migrate(
  db = pbj(drizzlePBinJKey),
  migrationsFolder = `${process.cwd()}/drizzle`
) {
  console.log("Running migrations from: %s", migrationsFolder);

  await dbMigrate(db, { migrationsFolder });

  console.log("Migrated successfully");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  await migrate();
}

#!/usr/bin/env node
import { register } from "./pbj.js";
export async function main(imports: string[] = process.argv.slice(2)) {
  console.log("Running server");
  if (imports.length === 0) {
    console.log(
      "No imports provided, please give a file to import context from",
    );
    return;
  }
  for (const arg of imports) {
    console.log("importing ", arg);
    await import(arg);
  }
  await register();
}

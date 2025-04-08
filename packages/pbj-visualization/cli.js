#!/usr/bin/env node
/**
 * This exists so that npm can nicely find it during install, before the
 * actual cli is built. This needs to be plain jain javascript.  Because
 * this module is marked as a module we use esm.
 *
 * If this fails trying running the build to ensure that it exists.
 * ```
 * $pnmp run build
 * ```
 *
 */
import { main } from "./dist/esm/cli.js";
main().catch((e) => {
  console.trace(e);
  process.exit(1);
});

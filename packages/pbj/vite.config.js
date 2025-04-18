import { defineConfig } from "vite";
import { resolve } from "path";
import JSON5 from "json5";
import pkg from "./package.json";
import fs from "fs";

function parseFile(file) {
  return JSON5.parse(fs.readFileSync(file, "utf8"));
}
const tsconfig = parseFile(resolve(__dirname, "tsconfig.json"));

console.log(tsconfig);
const DEFAULT = [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"];
const extensions = [...DEFAULT.map((ext) => `.browser${ext}`), ...DEFAULT];
const entry = Object.keys(pkg.exports).map((key) =>
  resolve(__dirname, "src", (key === "." ? "index" : key) + ".ts"),
);

export default defineConfig({
  resolve: {
    extensions,
    alias: [
      {
        find: "node:async_hooks",
        replacement: resolve(__dirname, "src/async-local.browser.js"),
      },
      ...Object.entries(tsconfig.compilerOptions.paths).map(
        ([path, [value]]) => ({
          find: path,
          replacement: resolve(__dirname, value),
        }),
      ),
    ],
  },
  build: {
    outDir: "dist/browser",
    lib: {
      entry,
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },

    sourcemap: true,
  },
});

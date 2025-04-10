import { defineConfig } from "vite";
import { resolve } from "path";
import pkg from "./package.json";

const DEFAULT = [".mjs", ".js", ".mts", ".ts", ".jsx", ".tsx", ".json"];
const extensions = [...DEFAULT.map((ext) => `.browser${ext}`), ...DEFAULT];
const entry = Object.keys(pkg.exports).map((key) =>
  resolve(__dirname, "src", (key === "." ? "index" : key) + ".ts"),
);

export default defineConfig({
  resolve: {
    extensions,
    alias: {
      "@pbinj/pbj-guards": resolve(__dirname, "../pbj-guards/src"),
      "@pbinj/pbj": resolve(__dirname, "src/index.ts"),
      "node:async_hooks": resolve(__dirname, "src/async-local.browser.js"),
    },
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

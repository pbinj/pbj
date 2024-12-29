import { fileURLToPath } from "node:url";
import { mergeConfig, defineConfig, configDefaults } from "vitest/config";
import { CONFIG } from "./vite.config";

export default mergeConfig(
  CONFIG,
  defineConfig({
    test: {
      pool: "vmThreads",

      css: true,
      environment: "jsdom",
      exclude: [...configDefaults.exclude, "e2e/**"],
      root: fileURLToPath(new URL("./", import.meta.url)),
    },
  }),
);

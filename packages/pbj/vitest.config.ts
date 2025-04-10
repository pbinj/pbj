import { defineConfig } from "vitest/config";
import {resolve} from "path";

export default defineConfig({
  resolve:{
    alias: {
      "@pbinj/pbj-guards": resolve(__dirname, "../pbj-guards/src"),
      "@pbinj/pbj":resolve(__dirname, "src/index.ts"),
    },
  },
  test: {
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["./src/__test__/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
  optimizeDeps: {
    exclude: ["@pbinj/pbj"],
  },
});

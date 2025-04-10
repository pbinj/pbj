import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["./src/__test__/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
  optimizeDeps: {
    exclude: ["@pbinj/pbj"],
  },
});

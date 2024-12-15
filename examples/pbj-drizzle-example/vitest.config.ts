import tsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config.js";

export default defineConfig({
  plugins: [tsConfigPaths() as any],
  test: {
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["./src/__test__/*.test.ts"],
  },
});

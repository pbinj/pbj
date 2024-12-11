import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    setupFiles: ["./src/__test__/setup.ts"],
    include: ["./src/__test__/*.test.ts"],
  },
});

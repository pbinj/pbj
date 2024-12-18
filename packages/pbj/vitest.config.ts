import { defineConfig } from "vitest/config";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths() as any],
  test: {
    include: ["./src/__test__/*.test.ts"],
  },
});

import { defineConfig, Plugin } from "vitest/config";
import tsConfigPaths, { PluginOptions } from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsConfigPaths() as Plugin<PluginOptions>],
  test: {
    include: ["./src/**/*.test.ts"],
  },
});

import { defineConfig, Plugin } from "vitest/config";

export default defineConfig({
  test: {
    include: ["./src/**/*.test.ts"],
  },
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {},
  },
  test: {
    include: ["./src/__test__/*.test.ts"],
  },
});

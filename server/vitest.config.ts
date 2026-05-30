import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/api-blackbox-testing.ts"],
    testTimeout: 15000
  }
});

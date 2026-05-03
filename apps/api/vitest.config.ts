import { resolve } from "path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname, "src")
    }
  },
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.spec.ts"],
    setupFiles: ["./test/setup-vitest.ts"],
    coverage: {
      provider: "v8",
      reportsDirectory: "../coverage/api"
    }
  }
});

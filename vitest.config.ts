import path from "node:path";
import { defineConfig } from "vitest/config";

process.env["TZ"] = "UTC";

export default defineConfig({
  resolve: {
    alias: { "#": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    coverage: {
      exclude: ["src/**/*.{test,spec}.ts", "src/main.ts", "src/cli/**"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reportsDirectory: "reports/coverage",
      thresholds: { 100: true },
    },
    environment: "node",
    include: ["src/**/*.{test,spec}.ts", "scripts/**/*.{test,spec}.ts"],
  },
});

import path from "node:path";
import { defineConfig } from "vitest/config";

// Unit tests of the academy's pure rules, the middleware and the API
// handlers. API tests run against a MongoDB started in memory per file
// (tests/helpers/db.ts); nothing here reaches a real database or sends mail.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    // Each file gets its own MongoDB; running files in parallel is fine.
    fileParallelism: true,
  },
});

import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    // Mirror the "@/*" -> "src/*" alias from tsconfig.json.
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // A dummy connection string so importing modules that instantiate Prisma
    // doesn't complain. No real database is contacted — these are pure-logic
    // unit tests.
    env: {
      DATABASE_URL: "postgresql://user:password@localhost:5432/carvista?schema=public",
    },
  },
});

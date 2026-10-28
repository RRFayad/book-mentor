import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./src/testing/test-env.ts";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    globalSetup: ["src/testing/global-setup.ts"],
    setupFiles: ["src/testing/setup.ts"],
    env: {
      DATABASE_URL: TEST_DATABASE_URL,
      FRONTEND_URL: "http://localhost:3000",
      BILLING_ENABLED: "false",
      OPENAI_API_KEY: "test-key",
    },
    // The test files share one database, so they run one at a time.
    fileParallelism: false,
  },
});

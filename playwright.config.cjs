const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/ui",
  timeout: 30000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5088",
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node scripts/qa-server.cjs",
    url: "http://127.0.0.1:5088/api/health",
    reuseExistingServer: false,
  },
  reporter: "list",
});

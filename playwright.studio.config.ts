import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: /(?:infographic-studio|carousel-studio)\.spec\.ts/,
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: "http://localhost:3100",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
  },
  outputDir: "test-results/infographic-studio",
});

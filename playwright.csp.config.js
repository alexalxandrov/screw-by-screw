import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  testMatch: ["csp.spec.js"],
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:4174",
    headless: true
  },
  projects: [
    {
      name: "chromium-strict-csp",
      use: {
        browserName: "chromium",
        launchOptions: {
          args: [
            "--use-gl=angle",
            "--use-angle=swiftshader",
            "--enable-webgl",
            "--ignore-gpu-blocklist"
          ]
        }
      }
    }
  ],
  webServer: {
    command: "node tools/serve_secure_preview.mjs",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});

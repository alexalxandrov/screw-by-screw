import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 45000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    headless: true
  },
  projects: [
    {
      name: "chromium",
      testMatch: ["**/viewer.spec.js", "**/catalog.spec.js", "**/file-open.spec.js", "**/model-package.spec.js", "**/rotation-controls.spec.js", "**/inventory-export.spec.js", "**/learning-progress.spec.js", "**/generated-model-package.spec.js", "**/accessibility.spec.js", "**/bundled-model.spec.js"],
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
    },
    {
      name: "firefox-smoke",
      testMatch: "**/firefox-smoke.spec.js",
      use: { browserName: "firefox" }
    }
  ],
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});

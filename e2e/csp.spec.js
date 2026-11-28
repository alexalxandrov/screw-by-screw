import { test, expect } from "@playwright/test";

test("production web build runs under strict CSP without breaking the published viewer", async ({ page }) => {
  const pageErrors = [];
  const failedRequests = [];

  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => failedRequests.push({
    url: request.url(),
    failure: request.failure()?.errorText
  }));

  await page.addInitScript(() => {
    window.__sbsCspViolations = [];
    document.addEventListener("securitypolicyviolation", (event) => {
      window.__sbsCspViolations.push({
        directive: event.effectiveDirective,
        blockedURI: event.blockedURI,
        sourceFile: event.sourceFile
      });
    });
  });

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);

  const headers = response?.headers() ?? {};
  const policy = headers["content-security-policy"] ?? "";
  expect(policy).toContain("script-src 'self'");
  expect(policy).toContain("style-src 'self'");
  expect(policy).toContain("script-src-attr 'none'");
  expect(policy).toContain("style-src-attr 'none'");
  expect(policy).not.toMatch(/unsafe-inline|unsafe-eval/i);
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("no-referrer");

  await expect(page.locator("#viewer-canvas canvas")).toBeVisible({ timeout: 15000 });
  await expect(page.locator("#model-title")).toContainText("Personal Computer 5150");
  await expect(page.locator("#component-count")).toHaveText("71");

  const switcher = page.locator("#model-switcher");
  await expect(switcher.locator("option")).toHaveCount(3);
  await switcher.selectOption("pc.dell.optiplex-5060-tower.family");
  await expect(page.locator("#model-title")).toContainText("OptiPlex 5060");
  await expect(page.locator("#component-count")).toHaveText("137");

  await switcher.selectOption("computer.ibm.5150.1981");
  await expect(page.locator("#model-title")).toContainText("Personal Computer 5150");
  await expect(page.locator("#component-count")).toHaveText("71");

  await page.locator('.view-tab[data-mode="compare"]').click();
  await expect(page.locator("#comparison-panel")).toBeVisible();
  await page.waitForTimeout(200);

  expect(await page.evaluate(() => window.__sbsCspViolations)).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedRequests).toEqual([]);
});

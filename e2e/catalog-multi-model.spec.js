import { test, expect } from "@playwright/test";

test("catalogue lists multiple device classes and loads the OptiPlex package", async ({ page }) => {
  await page.goto("/");
  await page.locator("#catalog-open").click();

  const dialog = page.locator("#model-catalog-dialog");
  await expect(dialog).toBeVisible();

  const pc = page.locator('[data-model-id="pc.dell.optiplex-5060-mt"]');
  await expect(pc).toBeVisible();
  await expect(pc).toContainText("OptiPlex 5060 Tower");
  await expect(pc).toContainText("D18M005");

  await page.locator("#catalog-category").selectOption("desktop_computers");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(1);

  await pc.click();
  await expect(dialog).toBeHidden();
  await expect(page.locator("#model-title")).toHaveText("OptiPlex 5060 Tower");
  await expect(page.locator("#model-sku")).toHaveText("D18M005");
  await expect(page.locator("#app-status")).toContainText("Package validated");
  await expect(page.locator("#component-count")).not.toHaveText("0");

  await page.locator("#catalog-open").click();
  await expect(page.locator('[data-model-id="gpu.evga.12g-p5-3655-kr"]')).toBeVisible();
  await expect(page.locator('[data-model-id="pc.dell.optiplex-5060-mt"]')).toHaveClass(/is-loaded/);
});

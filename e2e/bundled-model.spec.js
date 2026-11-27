import { test, expect } from "@playwright/test";

test("loads IBM PC 5150 as the default self-contained reference package", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("#model-title")).toHaveText("IBM Personal Computer 5150");
  await expect(page.locator("#model-sku")).toHaveText("5150");
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");
  await expect(page.locator("#component-count")).toHaveText("71");
  await expect(page.locator('#component-tree button[data-id="computer.ibm.5150.1981"]')).toBeVisible();
  await expect(page.locator('#component-tree button[data-id="assembly.system_board"]')).toBeVisible();

  await page.locator("#catalog-open").click();
  await expect(page.locator('[data-model-id="computer.ibm.5150.1981"]')).toBeVisible();
  await expect(page.locator('[data-model-id="gpu.evga.12g-p5-3655-kr"]')).toHaveCount(0);
});

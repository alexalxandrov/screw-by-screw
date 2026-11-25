import { test, expect } from "@playwright/test";

test("opens the real Blender-generated RTX 3060 .sbsmodel archive", async ({ page }) => {
  await page.goto("/");
  await page.locator("#model-file").setInputFiles("public/models/rtx3060_xc_black_v04.sbsmodel");
  await expect(page.locator("#model-title")).toHaveText("EVGA GeForce RTX 3060 XC BLACK GAMING 12GB", { timeout: 15000 });
  await expect(page.locator("#model-sku")).toHaveText("12G-P5-3655-KR");
  await expect(page.locator("#component-tree")).toContainText("Корпус GPU · GA106");
  await expect(page.locator("#component-tree")).toContainText("Разъём питания 8-pin");
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");
  await page.locator(".process-button[data-layer=\"power_delivery\"]").click();
  await expect(page.locator("#process-details")).toBeVisible();
});

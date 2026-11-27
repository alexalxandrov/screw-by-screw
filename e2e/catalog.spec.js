import { test, expect } from "@playwright/test";

test("publishes IBM 5150 and keeps the unverified GPU package out of the public model library", async ({ page }) => {
  await page.goto("/");
  const open = page.locator("#catalog-open");
  await open.click();
  const dialog = page.locator("#model-catalog-dialog");
  await expect(dialog).toBeVisible();

  const archivedGpu = page.locator('[data-model-id="gpu.evga.12g-p5-3655-kr"]');
  await expect(archivedGpu).toHaveCount(0);
  await expect(page.locator('[data-model-id="pc.dell.optiplex-5060-tower.family"]')).toHaveCount(0);
  const card = page.locator('[data-model-id="computer.ibm.5150.1981"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText("Персональный компьютер IBM 5150 (1981)");
  await expect(card).toContainText("Условная геометрия · не CAD");

  await page.locator("#catalog-search").fill("12g-p5-3655-kr");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(0);
  await page.locator("#catalog-category").selectOption("graphics_cards");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(0);
  await page.locator("#catalog-category").selectOption("personal_computers");
  await page.locator("#catalog-search").fill("5150");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(1);

  await page.locator("#catalog-search").fill("no-such-device");
  await expect(page.locator("#catalog-results")).toContainText("Подходящих моделей не найдено");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test("catalog search is bilingual and retains the query when the UI language changes", async ({ page }) => {
  await page.goto("/");
  await page.locator("#catalog-open").click();
  await page.locator("#catalog-search").fill("IBM 5150");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(1);

  await page.locator("#catalog-close").click();
  await page.locator("#language-toggle").click();
  await page.locator("#catalog-open").click();
  await expect(page.locator("#catalog-title")).toHaveText("MODEL LIBRARY");
  await expect(page.locator("#catalog-search")).toHaveValue("IBM 5150");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(1);
});

test("catalogue lists IBM PC 5150 as a separate personal-computer reference", async ({ page }) => {
  await page.goto("/");
  await page.locator("#catalog-open").click();

  const dialog = page.locator("#model-catalog-dialog");
  await expect(dialog).toBeVisible();

  const card = page.locator('[data-model-id="computer.ibm.5150.1981"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText("Персональный компьютер IBM 5150 (1981)");
  await expect(card).toContainText("5150");
  await expect(card).toContainText("Условная геометрия · не CAD");

  await page.locator("#catalog-search").fill("5150");
  await page.locator("#catalog-category").selectOption("personal_computers");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(1);

  await page.locator("#catalog-search").fill("no-such-computer");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(0);
  await expect(page.locator("#catalog-results")).toContainText("Подходящих моделей не найдено");
});

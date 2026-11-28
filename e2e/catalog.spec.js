import { test, expect } from "@playwright/test";

test("publishes IBM 5150 and keeps the unverified GPU package out of the public model library", async ({ page }) => {
  await page.goto("/");
  const open = page.locator("#catalog-open");
  await open.click();
  const dialog = page.locator("#model-catalog-dialog");
  await expect(dialog).toBeVisible();

  const archivedGpu = page.locator('[data-model-id="gpu.evga.12g-p5-3655-kr"]');
  await expect(archivedGpu).toHaveCount(0);
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


test("quick switcher lists only published models and switches between IBM and Dell", async ({ page }) => {
  await page.goto("/");
  const switcher = page.locator("#model-switcher");
  await expect(switcher).toBeVisible();
  await expect(switcher.locator("option")).toHaveCount(3);
  await expect(page.locator("#model-title")).toContainText("Personal Computer 5150");
  await expect(page.locator("#component-count")).toHaveText("71");
  await expect(switcher).toHaveValue("computer.ibm.5150.1981");

  const publishedOptions = await switcher.locator("option").evaluateAll((options) =>
    options.map((option) => ({ value: option.value, label: option.textContent }))
  );
  expect(publishedOptions.map((option) => option.value)).toEqual([
    "",
    "computer.ibm.5150.1981",
    "pc.dell.optiplex-5060-tower.family"
  ]);
  expect(publishedOptions.some((option) => /RTX 3060/i.test(option.label || ""))).toBe(false);

  await switcher.selectOption("pc.dell.optiplex-5060-tower.family");
  await expect(page.locator("#model-title")).toContainText("OptiPlex 5060");
  await expect(page.locator("#component-count")).toHaveText("137");
  await expect(switcher).toHaveValue("pc.dell.optiplex-5060-tower.family");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-inspection-presentation", "optiplex-open-xray");

  await switcher.selectOption("computer.ibm.5150.1981");
  await expect(page.locator("#model-title")).toContainText("Personal Computer 5150");
  await expect(page.locator("#component-count")).toHaveText("71");
  await expect(switcher).toHaveValue("computer.ibm.5150.1981");
  await expect(page.locator("#viewer-canvas")).not.toHaveAttribute("data-inspection-presentation");
});

test("loads the published Dell OptiPlex 5060 family package", async ({ page }) => {
  await page.goto("/");
  await page.locator("#catalog-open").click();
  const card = page.locator('[data-model-id="pc.dell.optiplex-5060-tower.family"]');
  await expect(card).toBeVisible();
  await expect(card).toContainText("OptiPlex 5060 Tower");
  await expect(card).toContainText("Семейство платформы · без единого артикула");
  await page.locator("#catalog-category").selectOption("desktop_computers");
  await page.locator("#catalog-search").fill("OptiPlex 5060");
  await expect(page.locator("#catalog-results .catalog-card")).toHaveCount(1);
  await card.locator(".catalog-load-button").click();
  await expect(page.locator("#model-title")).toContainText("OptiPlex 5060 Tower");
  await expect(page.locator("#component-count")).toHaveText("137");
  await expect(page.locator("#load-state")).toContainText("SBS MODEL");
});

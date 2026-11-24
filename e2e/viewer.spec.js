import { test, expect } from "@playwright/test";

test("renders the fallback GPU scene and selects a component", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Screw by Screw/);
  await expect(page.locator("#viewer-canvas canvas")).toBeVisible();
  await expect(page.locator("#component-count")).not.toHaveText("—");
  const rootItem = page.getByRole("button", { name: /Видеокарта в сборе/ });
  await expect(rootItem).toBeVisible();
  await rootItem.click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-id")).toHaveText("assembly.card.root");
  expect(pageErrors).toEqual([]);
});

test("shows linked components and source-backed process explanations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  await page.getByRole("button", { name: /Охлаждение/ }).click();
  await expect(page.locator("#process-details")).toBeVisible();
  await expect(page.locator("#process-detail-title")).toHaveText("Охлаждение и воздушный поток");
  const heatsink = page.locator("#process-components").getByRole("button", { name: "Радиатор с рёбрами" });
  await expect(heatsink).toBeVisible();
  await heatsink.click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-id")).toHaveText("cooling.heatsink");
});

test("runs the source-backed quiz in Russian and English", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Обучение" }).click();
  await expect(page.locator("#learning-panel")).toBeVisible();
  await expect(page.locator("#quiz-question")).toHaveText("Какой объём памяти GDDR6 указан для этого SKU?");
  await page.locator("#quiz-choices").getByRole("button", { name: "12 ГБ" }).click();
  await page.locator("#quiz-next").click();
  await expect(page.locator("#quiz-feedback")).toContainText("Верно");
  await page.locator("#quiz-next").click();
  await page.locator("#language-toggle").click();
  await expect(page.locator("#quiz-question")).toHaveText("What is the memory bus width?");
  await expect(page.locator("#quiz-choices").getByRole("button", { name: "192-bit" })).toBeVisible();
});

test("exploded view can be returned to assembled state", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  await page.locator("#explode-slider").evaluate((element) => {
    element.value = "100";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#explode-value")).toHaveText("100%");
  await page.getByRole("button", { name: "Собрать" }).click();
  await expect(page.locator("#explode-value")).toHaveText("0%");
});

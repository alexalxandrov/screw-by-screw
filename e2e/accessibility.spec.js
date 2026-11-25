import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function audit(page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test("viewer shell meets automated WCAG A/AA checks", async ({ page }) => {
  await page.goto("/");
  await audit(page);
});

test("learning panel meets automated WCAG A/AA checks", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Обучение" }).click();
  await audit(page);
});

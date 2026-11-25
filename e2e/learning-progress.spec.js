import { test, expect } from "@playwright/test";

test("resumes learning progress after page reload in the same browser", async ({ page }) => {
  await page.goto("/");
  const learn = page.locator('.view-tab[data-mode="learn"]');
  await expect(learn).toBeEnabled();
  await learn.click();

  await expect(page.locator("#quiz-progress")).toHaveText("01 / 05");
  await page.locator("#quiz-choices .quiz-choice").nth(1).click();
  await page.locator("#quiz-next").click();
  await expect(page.locator("#quiz-feedback")).toContainText("Верно");
  await page.locator("#quiz-next").click();

  await expect(page.locator("#quiz-progress")).toHaveText("02 / 05");
  await expect(page.locator("#quiz-score")).toContainText("1");
  await page.locator("#quiz-choices .quiz-choice").nth(1).click();
  await page.reload();

  await page.locator('.view-tab[data-mode="learn"]').click();
  await expect(page.locator("#quiz-progress")).toHaveText("02 / 05");
  await expect(page.locator("#quiz-score")).toContainText("1");
  await expect(page.locator("#quiz-choices .quiz-choice").nth(1)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#learning-save-status")).toContainText("сохранён");
  await page.locator("#quiz-next").click();
  await expect(page.locator("#quiz-feedback")).toContainText("Верно");
});

test("restarting a completed learning quiz clears its saved progress", async ({ page }) => {
  await page.goto("/");
  await page.locator('.view-tab[data-mode="learn"]').click();

  for (let index = 0; index < 5; index += 1) {
    await page.locator("#quiz-choices .quiz-choice").nth(1).click();
    await page.locator("#quiz-next").click();
    if (index < 4) await page.locator("#quiz-next").click();
  }
  await page.locator("#quiz-next").click();

  await expect(page.locator("#quiz-question")).toHaveText("Тест завершён");
  await page.locator("#quiz-next").click();
  await expect(page.locator("#quiz-progress")).toHaveText("01 / 05");
  await expect(page.locator("#quiz-score")).toContainText("0");
  await expect(page.locator("#quiz-choices .quiz-choice").first()).toHaveAttribute("aria-pressed", "false");
});

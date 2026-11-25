import { test, expect } from "@playwright/test";

test("rotates a selected component and allows the motion to be interrupted", async ({ page }) => {
  await page.goto("/");
  await page.locator("#component-tree button").first().click();
  const button = page.locator("#rotate-component");
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toBeDisabled();
  await page.locator("#assemble-button").click();
  await expect(button).toBeEnabled({ timeout: 3000 });
});

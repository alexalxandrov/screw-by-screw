import { test, expect } from "@playwright/test";

test("rotates a selected component and allows the motion to be interrupted", async ({ page }) => {
  await page.goto("/?demo=1");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  const fan = page.locator('#component-tree button[data-id="assembly.fan.1"]');
  await expect(fan).toBeVisible();
  await fan.click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-id")).toHaveText("assembly.fan.1");

  const button = page.locator("#rotate-component");
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
  await expect(button).toBeDisabled();
  await page.locator("#assemble-button").click();
  await expect(button).toBeEnabled({ timeout: 3000 });
});

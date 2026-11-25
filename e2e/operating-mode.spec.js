import { expect, test } from "@playwright/test";

test("Run mode spins separate fan rotors and animates qualitative process paths", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  const power = page.locator("#power-toggle");
  await expect(power).toBeVisible();
  await expect(page.locator("#viewer-canvas canvas")).toBeVisible();

  await power.click();
  await expect(page.locator("body")).toHaveAttribute("data-sbs-powered", "true");
  await expect(power).toHaveAttribute("aria-pressed", "true");
  await expect(power).toHaveText(/выключить питание|power off/i);
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-process-visuals", /airflow,power|power,airflow/);
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-fan-rotors", "2");

  const before = await page.locator("#viewer-canvas").getAttribute("data-run-frames");
  await page.waitForTimeout(450);
  const after = await page.locator("#viewer-canvas").getAttribute("data-run-frames");
  expect(Number(after)).toBeGreaterThan(Number(before));

  await page.locator("#simulation-speed").evaluate((node) => {
    node.value = "1.75";
    node.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#simulation-speed-value")).toHaveText("1.75×");
  await power.click();
  await expect(page.locator("body")).toHaveAttribute("data-sbs-powered", "false");
  await expect(power).toHaveAttribute("aria-pressed", "false");
});

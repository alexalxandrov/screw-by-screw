import { test, expect } from "@playwright/test";

test("loads the generated Blender v0.4 GLB and resolves content-package IDs", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const modelResponsePromise = page.waitForResponse((response) => response.url().includes("rtx3060_xc_black_blockout_v04.glb"));
  await page.goto("/");
  const modelResponse = await modelResponsePromise;
  expect(modelResponse.ok()).toBeTruthy();
  const modelBytes = await modelResponse.body();
  expect(modelBytes.byteLength).toBeLessThan(1024 * 1024);
  await expect(page.locator("#app-status")).toHaveText("Модель готова");
  await expect(page.locator("#component-count")).toHaveText("67");
  await expect(page.getByRole("button", { name: /Видеокарта в сборе/ })).toBeVisible();

  await page.getByRole("button", { name: /Охлаждение/ }).click();
  await expect(page.locator("#process-details")).toBeVisible();
  const heatsink = page.locator("#process-components").getByRole("button", { name: "Радиатор с рёбрами" });
  await expect(heatsink).toBeVisible();
  await heatsink.click();
  await expect(page.locator("#detail-id")).toHaveText("cooling.heatsink");

  await page.locator("#explode-slider").evaluate((element) => {
    element.value = "100";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#explode-value")).toHaveText("100%");
  expect(pageErrors).toEqual([]);
});

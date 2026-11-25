import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("opens root index.html directly without a web server or external JS/CSS", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));

  const rootIndex = pathToFileURL(resolve(process.cwd(), "index.html")).href;
  await page.goto(rootIndex);

  await expect(page).toHaveTitle(/Screw by Screw/);
  await expect(page.locator("#viewer-canvas canvas")).toBeVisible({ timeout: 15000 });
  await expect(page.locator("#component-count")).not.toHaveText("—");
  await expect(page.locator("#startup-fallback")).toBeHidden();

  const externalAssets = await page.evaluate(() => ({
    scripts: [...document.querySelectorAll("script[src]")].map((node) => node.src),
    stylesheets: [...document.querySelectorAll('link[rel="stylesheet"][href]')].map((node) => node.href)
  }));
  expect(externalAssets).toEqual({ scripts: [], stylesheets: [] });

  await page.getByRole("button", { name: /Видеокарта в сборе/ }).click();
  await expect(page.locator("#detail-id")).toHaveText("assembly.card.root");
  expect(pageErrors).toEqual([]);
});

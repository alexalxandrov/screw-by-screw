import { expect, test } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("opens root index.html directly without a web server or external JS/CSS", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("requestfailed", (request) => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText }));

  const rootIndex = pathToFileURL(resolve(process.cwd(), "index.html")).href;
  await page.goto(rootIndex);
  await page.waitForTimeout(1000);

  const diagnostics = await page.evaluate(() => ({
    ready: document.documentElement.classList.contains("sbs-ready"),
    canvasCount: document.querySelectorAll("#viewer-canvas canvas").length,
    status: document.querySelector("#app-status")?.textContent,
    loadState: document.querySelector("#load-state")?.textContent,
    startupFallbackVisible: !document.querySelector("#startup-fallback")?.hidden,
    scriptCount: document.querySelectorAll("script").length,
    externalScripts: [...document.querySelectorAll("script[src]")].map((node) => node.src),
    stylesheets: [...document.querySelectorAll('link[rel="stylesheet"][href]')].map((node) => node.href),
    webgl: (() => {
      try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      } catch { return false; }
    })()
  }));

  await expect(page, JSON.stringify({ diagnostics, pageErrors, consoleErrors, requestFailures })).toHaveTitle(/Screw by Screw/);
  await expect(page.locator("#viewer-canvas canvas"), JSON.stringify({ diagnostics, pageErrors, consoleErrors, requestFailures })).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#component-count")).not.toHaveText("—");
  await expect(page.locator("#startup-fallback")).toBeHidden();
  expect(diagnostics.externalScripts).toEqual([]);
  expect(diagnostics.stylesheets).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(requestFailures).toEqual([]);

  await page.getByRole("button", { name: /Видеокарта в сборе/ }).click();
  await expect(page.locator("#detail-id")).toHaveText("assembly.card.root");
});

import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
  await expect(page.locator("#component-count")).toHaveText("77");
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


test("opens the self-contained root index.html directly with the embedded Blender model", async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  const requestFailures = [];
  page.on("pageerror", (error) => pageErrors.push({ message: error.message, stack: error.stack }));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("requestfailed", (request) => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText }));
  await page.goto(pathToFileURL(resolve(process.cwd(), "index.html")).href);
  await page.waitForTimeout(1000);

  const diagnostics = await page.evaluate(() => ({
    ready: document.documentElement.classList.contains("sbs-ready"),
    canvasHost: Boolean(document.querySelector("#viewer-canvas")),
    canvasCount: document.querySelectorAll("#viewer-canvas canvas").length,
    status: document.querySelector("#app-status")?.textContent,
    loadState: document.querySelector("#load-state")?.textContent,
    scriptCount: document.querySelectorAll("script").length,
    scripts: [...document.querySelectorAll("script")].map((node) => ({
      type: node.type || "classic",
      source: node.src || "inline",
      length: node.textContent?.length ?? 0,
      first: node.textContent?.slice(0, 160) ?? "",
      last: node.textContent?.slice(-160) ?? ""
    })),
    externalScripts: [...document.querySelectorAll("script[src]")].map((node) => node.src),
    webgl: (() => {
      try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
      } catch { return false; }
    })()
  }));
  await expect(page.locator("#viewer-canvas canvas"), JSON.stringify({ diagnostics, pageErrors, consoleErrors, requestFailures })).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#component-count")).toHaveText("77", { timeout: 15000 });
  await expect(page.locator("#load-state")).toContainText("ВСТРОЕННАЯ МОДЕЛЬ");
  await page.getByRole("button", { name: /Охлаждение/ }).click();
  await expect(page.locator("#process-details")).toBeVisible();
  expect(pageErrors).toEqual([]);
});

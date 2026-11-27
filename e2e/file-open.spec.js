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

  // The standalone launcher now defaults to the published IBM 5150 model;
  // keep this smoke test valid for either the GPU fallback or the IBM package.
  const rootButton = page.locator(
    '#component-tree button[data-id="computer.ibm.5150.1981"], #component-tree button[data-id="assembly.card.root"]'
  );
  await expect(rootButton).toBeVisible();
  const rootId = await rootButton.getAttribute("data-id");
  await rootButton.click();
  await expect(page.locator("#detail-id")).toHaveText(rootId);
});


test("opens the published Dell package from the standalone file and verifies real disassembly and animation motion", async ({ page }) => {
  const pageErrors = [];
  const requestFailures = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => requestFailures.push({ url: request.url(), failure: request.failure()?.errorText }));

  const rootIndex = pathToFileURL(resolve(process.cwd(), "index.html")).href;
  await page.goto(rootIndex);
  await expect(page.locator("#viewer-canvas canvas")).toBeVisible({ timeout: 10000 });
  await page.locator("#catalog-open").click();
  const dellCard = page.locator('[data-model-id="pc.dell.optiplex-5060-tower.family"]');
  await expect(dellCard).toBeVisible();
  await dellCard.locator("[data-open-catalog-model]").click();

  await expect(page.locator("#model-title")).toContainText("OptiPlex 5060");
  await expect(page.locator("#component-count")).toHaveText("137");
  await expect(page.locator("#animation-player-panel")).toBeVisible();
  await expect(page.locator("#animation-clip-select option")).toHaveCount(3);

  await page.locator('[data-mode="disassemble"]').click();
  await page.locator("#assembly-step-next").click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-procedure-motion", "illustrative-translation");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-procedure-applied-count", "1");
  const procedureDelta = JSON.parse(await page.locator("#viewer-canvas").getAttribute("data-procedure-world-deltas"));
  expect(Math.hypot(...procedureDelta[0].delta)).toBeGreaterThan(0);

  await page.locator("#animation-clip-select").selectOption("clip.optiplex.cpu-cooling-removal");
  await page.locator("#animation-seek").evaluate((element) => {
    element.value = "1000";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const animationDeltas = JSON.parse(await page.locator("#viewer-canvas").getAttribute("data-animation-world-deltas"));
  console.log("STANDALONE_DELL_CPU_WORLD_DELTAS", JSON.stringify(animationDeltas));
  expect(animationDeltas).toHaveLength(2);
  for (const movement of animationDeltas) {
    expect(movement.delta[2]).toBeGreaterThan(0);
    expect(Math.abs(movement.delta[1])).toBeLessThan(0.01);
  }
  expect(pageErrors).toEqual([]);
  expect(requestFailures).toEqual([]);
});

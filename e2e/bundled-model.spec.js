import { test, expect } from "@playwright/test";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

test("loads the generated Blender v0.5 SBS model package and resolves content-package IDs", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const modelResponsePromise = page.waitForResponse((response) => response.url().includes("rtx3060_xc_black_v05.sbsmodel"));
  await page.goto("/");
  const modelResponse = await modelResponsePromise;
  expect(modelResponse.ok()).toBeTruthy();
  const modelBytes = await modelResponse.body();
  expect(modelBytes.byteLength).toBeGreaterThan(0);
  expect(modelBytes.byteLength).toBeLessThan(512 * 1024 * 1024);
  await expect(page.locator("#app-status")).toHaveText("Модель готова");
  const componentCount = Number(await page.locator("#component-count").textContent());
  expect(Number.isInteger(componentCount) && componentCount >= 85).toBeTruthy();
  for (const id of ["chip.gpu.die", "fastener.cooler.01", "pcb.connector.pcie", "connector.fan.header.1", "connector.displayport.1", "connector.hdmi.1", "power.inductor.candidate.1", "power.capacitor.cluster", "power.switching_device.cluster", "power.controller.candidate", "chip.gpu.sm.cluster", "chip.gpu.tensor_core.array", "chip.memory.gddr6.bus", "chip.memory.channel.06", "fan.1.frame", "fan.1.hub", "fan.1.blade.1", "fan.1.blade.8", "fan.2.blade.8", "cooling.heatsink.fin.01", "cooling.heatpipe.candidate.1", "cooling.heatpipe.end.04", "cooling.heatpipe.main.04", "cooling.heatpipe.side.02", "cooling.thermal_pad.memory.01"]) {
    await expect(page.locator(`#component-tree button[data-id="${id}"]`)).toBeVisible();
  }
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-fan-rotors", "2");
  await expect(page.locator('#component-tree button[data-id="assembly.fan.1.rotor"]')).toBeVisible();
  await expect(page.locator('#component-tree button[data-id="assembly.fan.2.rotor"]')).toBeVisible();
  const deviceRoot = page.getByRole("button", { name: /Видеокарта в сборе/ });
  await expect(deviceRoot).toBeVisible();
  await deviceRoot.click();
  await expect(page.locator("#assembly-step-list .assembly-step-card")).toHaveCount(5);
  await expect(page.locator("#assembly-step-list")).toContainText("Вывернуть четыре подпружиненных винта крепления кулера вокруг GPU");
  await expect(page.locator("#assembly-step-list")).toContainText("Освободить отдельный крепёж основания пакета рёбер");
  await expect(page.locator("#assembly-step-list")).toContainText("Освободить крепёж I/O-планки и выходной панели");
  await expect(page.locator("#assembly-step-list")).toContainText("Отсоединить оба кабеля вентиляторов перед снятием кулера");
  await expect(page.locator("#assembly-step-list")).toContainText("Вывернуть по три крепёжных винта каждого вентилятора");
  await page.locator("#animation-clip-select").selectOption("clip.exploded-cooler-overview");
  await expect(page.locator("#animation-evidence-note")).toContainText("визуальное разнесение");
  await page.locator("#animation-seek").evaluate((element) => {
    element.value = "1000";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-animation-progress", "1");
  await page.locator("#animation-stop").click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-animation-progress", "0");
  await page.locator("#catalog-open").click();
  const loadedCard = page.locator('[data-model-id="gpu.evga.12g-p5-3655-kr"]');
  await expect(loadedCard.locator(".catalog-load-button")).toBeDisabled();
  await expect(loadedCard).toContainText("Уже загружена");
  await page.locator("#catalog-close").click();

  await page.locator("#camera-preset").selectOption("fan");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-camera-preset", "fan");
  await page.locator("#camera-preset").selectOption("pcb");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-camera-preset", "pcb");

  await page.locator("#slice-toggle").click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-slice-enabled", "true");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-slice-plane-count", "1");
  await page.locator("#slice-axis").selectOption("y");
  await page.locator("#slice-position").evaluate((element) => {
    element.value = "35";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-slice-axis", "y");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-slice-fraction", "0.35");
  await page.locator("#slice-toggle").click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-slice-enabled", "false");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-slice-plane-count", "0");

  await page.locator('.process-button[data-layer="cooling"]').click();
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

  await page.locator("#simulation-speed").evaluate((element) => {
    element.value = "1.5";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#simulation-speed-value")).toHaveText("1.50×");
  await page.locator("#power-toggle").click();
  await expect(page.locator("#power-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-process-visuals", "airflow,power");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-fan-spin", "true");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-flow-motion", "true");
  await page.locator("#power-toggle").click();
  await expect(page.locator("#power-toggle")).toHaveAttribute("aria-pressed", "false");
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
  const standaloneComponentCount = Number(await page.locator("#component-count").textContent());
  expect(Number.isInteger(standaloneComponentCount) && standaloneComponentCount >= 85).toBeTruthy();
  for (const id of ["chip.gpu.die", "fastener.cooler.01", "pcb.connector.pcie", "connector.fan.header.1", "connector.displayport.1", "connector.hdmi.1", "power.inductor.candidate.1", "power.capacitor.cluster", "power.switching_device.cluster", "power.controller.candidate", "fan.1.frame", "fan.1.hub", "fan.1.blade.1", "cooling.heatsink.fin.01", "cooling.heatpipe.candidate.1", "cooling.thermal_pad.memory.01"]) {
    await expect(page.locator(`#component-tree button[data-id="${id}"]`)).toBeVisible();
  }
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-fan-rotors", "2");
  await expect(page.locator('#component-tree button[data-id="assembly.fan.1.rotor"]')).toBeVisible();
  await expect(page.locator('#component-tree button[data-id="assembly.fan.2.rotor"]')).toBeVisible();
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");
  const embeddedCatalogueIds = await page.evaluate(() => Object.keys(globalThis.SBS_CATALOG_PACKAGE_DATA_URLS ?? {}));
  expect(embeddedCatalogueIds).toContain("gpu.evga.12g-p5-3655-kr");
  await page.locator("#catalog-open").click();
  const loadedFileCard = page.locator('[data-model-id="gpu.evga.12g-p5-3655-kr"]');
  await expect(loadedFileCard.locator(".catalog-load-button")).toBeDisabled();
  await expect(loadedFileCard).toContainText("Уже загружена");
  await page.locator("#catalog-close").click();
  await page.locator("#camera-preset").selectOption("io");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-camera-preset", "io");
  await page.locator("#slice-toggle").click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-slice-enabled", "true");
  await page.getByRole("button", { name: /Воздушный поток|Охлаждение/ }).click();
  await expect(page.locator("#process-details")).toBeVisible();
  await page.locator("#power-toggle").click();
  await expect(page.locator("#power-toggle")).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-process-visuals", "airflow,power");
  expect(pageErrors).toEqual([]);
});


test("keeps process paths but suppresses continuous animation for reduced-motion users", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-reduced-motion", "true");
  await page.locator("#power-toggle").click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-process-visuals", "airflow,power");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-fan-spin", "false");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-flow-motion", "false");
});

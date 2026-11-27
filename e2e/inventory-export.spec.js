import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

test("exports the active model as semantic JSON and a CSV ZIP without geometry", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#model-title")).toHaveText("IBM Personal Computer 5150");
  await expect(page.locator("#model-sku")).toHaveText("5150");
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");
  await expect(page.locator("#export-inventory-json")).toBeVisible();

  const jsonDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-inventory-json").click();
  const jsonDownload = await jsonDownloadPromise;
  expect(jsonDownload.suggestedFilename()).toContain("semantic-inventory.json");
  const jsonPath = await jsonDownload.path();
  const inventory = JSON.parse(await readFile(jsonPath, "utf8"));
  expect(inventory.format).toBe("sbs-semantic-inventory");
  expect(inventory.model.part_number).toBe("5150");
  expect(inventory.counts.components).toBeGreaterThan(0);
  expect(inventory.scope.type).toBe("semantic_inventory");
  expect(inventory.scope.limitations.join(" ")).toMatch(/not a bill of materials/i);
  expect(inventory).not.toHaveProperty("scene");
  expect(inventory).not.toHaveProperty("geometry");

  const zipDownloadPromise = page.waitForEvent("download");
  await page.locator("#export-inventory-csv").click();
  const zipDownload = await zipDownloadPromise;
  expect(zipDownload.suggestedFilename()).toContain("semantic-inventory-csv.zip");
  const zipPath = await zipDownload.path();
  const archive = unzipSync(new Uint8Array(await readFile(zipPath)));
  expect(Object.keys(archive)).toContain("components.csv");
  expect(Object.keys(archive)).toContain("claims.csv");
  expect(Object.keys(archive)).toContain("relationships.csv");
  expect(Object.keys(archive)).toContain("sources.csv");
  expect(Object.keys(archive)).toContain("source_observations.csv");
  const componentsCsv = strFromU8(archive["components.csv"]);
  expect([...archive["components.csv"].slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
  expect(componentsCsv).toContain("evidence_status");
  expect(componentsCsv).toContain("geometry_status");
});

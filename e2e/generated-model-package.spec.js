import { test, expect } from "@playwright/test";

test("opens the real Blender-generated RTX 3060 .sbsmodel archive", async ({ page }) => {
  await page.goto("/");
  await page.locator("#model-file").setInputFiles("public/models/rtx3060_xc_black_v05.sbsmodel");
  await expect(page.locator("#model-title")).toHaveText("EVGA GeForce RTX 3060 XC BLACK GAMING 12GB", { timeout: 15000 });
  await expect(page.locator("#model-sku")).toHaveText("12G-P5-3655-KR");
  await expect(page.locator("#component-tree")).toContainText("Корпус GPU · GA106");
  await expect(page.locator("#component-tree")).toContainText("Разъём питания 8-pin");
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-fan-rotors", "2");
  await expect(page.locator("#component-tree")).toContainText("Крыльчатка вентилятора 1");
  await expect(page.locator("#animation-player-panel")).toBeVisible();
  await expect(page.locator("#animation-clip-select")).toContainText("Демонстрация вращения крыльчатки");
  await expect(page.locator("#animation-evidence-note")).toContainText("не является измеренным RPM");
  await page.locator("#component-tree button[data-id=\"assembly.fan.1.rotor\"]").click();
  await expect(page.locator("#detail-id")).toHaveText("assembly.fan.1.rotor");
  await expect(page.locator('#component-tree button[data-id="fan.1.blade.8"]')).toBeVisible();
  await expect(page.locator('#component-tree button[data-id="fan.2.blade.8"]')).toBeVisible();
  await page.locator('#component-tree button[data-id="fan.1.blade.8"]').click();
  await expect(page.locator("#detail-id")).toHaveText("fan.1.blade.8");
  await expect(page.locator("#detail-description")).toContainText("восемь");
  await page.locator("#animation-play").click();
  await expect(page.locator("#animation-player-panel")).toHaveAttribute("data-status", "playing");
  await page.waitForTimeout(140);
  await page.locator("#animation-pause").click();
  await expect(page.locator("#animation-player-panel")).toHaveAttribute("data-status", "paused");
  await page.locator("#animation-stop").click();
  await expect(page.locator("#animation-player-panel")).toHaveAttribute("data-status", "ready");
  await page.locator(".process-button[data-layer=\"power_delivery\"]").click();
  await page.locator("#catalog-open").click();
  const loadedCard = page.locator('[data-model-id="gpu.evga.12g-p5-3655-kr"]');
  await expect(loadedCard.locator(".catalog-load-button")).toBeDisabled();
  await expect(loadedCard).toContainText("Уже загружена");
  await page.locator("#catalog-close").click();
  await expect(page.locator("#process-details")).toBeVisible();
});

test("IBM PC 5150 renders the sourced branching FRU graph and replacement fragments", async ({ page }) => {
  await page.goto("/");
  await page.locator("#model-file").setInputFiles("public/models/ibm_pc_5150_1981.sbsmodel");

  await expect(page.locator("#model-title")).toHaveText("IBM Personal Computer 5150", { timeout: 15000 });
  await expect(page.locator("#model-sku")).toHaveText("5150");
  await expect(page.locator("#load-state")).toContainText("ПАКЕТ SBS MODEL");

  await page.locator('#component-tree button[data-id="computer.ibm.5150.1981"]').click();
  await expect(page.locator("#assembly-policy-note")).toBeVisible();
  await expect(page.locator("#assembly-policy-note")).toContainText("Номера шагов служат только порядком отображения");
  await expect(page.locator("#assembly-step-list .assembly-step-card")).toHaveCount(14);
  await expect(page.locator("#assembly-step-list .assembly-procedure-group")).toHaveCount(7);
  await expect(page.locator("#assembly-step-list")).toContainText("Независимая ветвь FRU");
  await expect(page.locator("#assembly-step-list")).toContainText("Сдвинуть плату примерно на 1/2 дюйма от БП");
  await expect(page.locator("#assembly-policy-note")).toContainText("извлекать сам БП");
  await expect(page.locator("#assembly-replacement-list .assembly-replacement-card")).toHaveCount(4);
  await expect(page.locator("#assembly-replacement-policy")).toContainText("не полная последовательность обратной сборки");

  await page.locator('#component-tree button[data-id="assembly.system_board"]').click();
  await expect(page.locator("#assembly-step-list .assembly-step-card")).toHaveCount(3);
  await expect(page.locator("#assembly-step-list")).toContainText("единственный удерживающий винт платы");
});

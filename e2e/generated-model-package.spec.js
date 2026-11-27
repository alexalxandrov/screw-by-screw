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
  await expect(page.locator("#assembly-playback-controls")).toBeVisible();
  await expect(page.locator("#assembly-step-progress")).toContainText("0 / 14");
  await page.locator("#assembly-step-next").click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-procedure-step-id", "step.power.isolate");
  await page.locator("#assembly-step-reset").click();
  await expect(page.locator("#viewer-canvas")).not.toHaveAttribute("data-procedure-step-id");
  await expect(page.locator("#assembly-policy-note")).toContainText("Номера шагов служат только порядком отображения");
  await expect(page.locator("#assembly-step-list .assembly-step-card")).toHaveCount(14);
  await expect(page.locator("#assembly-step-list .assembly-procedure-group")).toHaveCount(7);
  await expect(page.locator("#assembly-step-list")).toContainText("Независимая ветвь FRU");
  await expect(page.locator("#assembly-step-list")).toContainText("Сдвинуть плату примерно на 1/2 дюйма от БП");
  await expect(page.locator("#assembly-policy-note")).toContainText("извлекать сам БП");
  await expect(page.locator("#assembly-replacement-list .assembly-replacement-card")).toHaveCount(4);
  await expect(page.locator("#assembly-replacement-policy")).toContainText("не полная последовательность обратной сборки");

  // Common opening is shared. A user must then choose one independent FRU
  // branch; the interface must not linearize PSU, speaker and board removal.
  const runner = page.locator("#procedure-runner");
  await expect(runner).toBeVisible();
  await expect(runner).toHaveAttribute("data-branch", "common");
  await expect(runner).toHaveAttribute("data-completed-count", "0");
  await page.locator("#procedure-next").click();
  await expect(runner).toHaveAttribute("data-step-id", "step.system.isolate_power");
  await page.locator("#procedure-next").click();
  await expect(runner).toHaveAttribute("data-step-id", "step.cover.retaining_screws.loosen");
  await page.locator("#procedure-next").click();
  await expect(runner).toHaveAttribute("data-step-id", "step.cover.remove");
  await expect(runner).toHaveAttribute("data-completed-count", "3");
  await expect(page.locator("#procedure-next")).toBeDisabled();
  await expect(page.locator("#procedure-runner-status")).toContainText("Выберите одну ветвь FRU");

  await page.locator("#procedure-branch-select").selectOption("system_board");
  await expect(runner).toHaveAttribute("data-branch", "system_board");
  await expect(page.locator("#procedure-runner-progress")).toHaveText("0 / 10");

  // Re-run common entry for this route, then the board-specific branch.
  for (let i = 0; i < 3; i += 1) await page.locator("#procedure-next").click();
  await page.locator("#procedure-next").click(); // empty option-adapter slots: no-op
  await expect(runner).toHaveAttribute("data-step-id", "step.adapters.remove");
  await page.locator("#procedure-next").click(); // P1/P2 shared preparation
  await expect(runner).toHaveAttribute("data-step-id", "step.psu.board_power.disconnect");
  await page.locator("#procedure-next").click(); // no fitted diskette drives: no-op
  await expect(runner).toHaveAttribute("data-step-id", "step.diskette.leads.disconnect");
  await page.locator("#procedure-next").click(); // shared P3 connector preparation
  await expect(runner).toHaveAttribute("data-step-id", "step.speaker.leads.disconnect");
  await page.locator("#procedure-next").click(); // one board retaining screw
  await expect(runner).toHaveAttribute("data-step-id", "step.board.mounting_screw.remove");
  await page.locator("#procedure-next").click(); // manufacturer-stated 1/2-inch release slide
  await expect(runner).toHaveAttribute("data-step-id", "step.board.slide.release_standoffs");
  await page.locator("#procedure-next").click(); // illustrative final lift
  await expect(runner).toHaveAttribute("data-step-id", "step.board.remove");
  await expect(runner).toHaveAttribute("data-completed-count", "10");
  await expect(page.locator("#procedure-runner-status")).toContainText("ветвь FRU завершена");

  await page.locator("#procedure-previous").click();
  await expect(runner).toHaveAttribute("data-step-id", "step.board.slide.release_standoffs");
  await page.locator("#procedure-reset").click();
  await expect(runner).toHaveAttribute("data-branch", "common");
  await expect(runner).toHaveAttribute("data-completed-count", "0");

  await page.locator('#component-tree button[data-id="assembly.system_board"]').click();
  await expect(page.locator("#assembly-playback-controls")).toBeHidden();
  await expect(page.locator("#assembly-step-list .assembly-step-card")).toHaveCount(3);
  await expect(page.locator("#assembly-step-list")).toContainText("единственный удерживающий винт платы");
  await page.locator('[data-step-id="step.board.slide.release_standoffs"] .assembly-step-run').click();
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-procedure-step-id", "step.board.slide.release_standoffs");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-procedure-motion", "manufacturer-stated-slide");
  await expect(page.locator("#assembly-motion-status")).toContainText("12,7 мм");
  await page.locator("#assembly-step-reset").click();
  await expect(page.locator("#viewer-canvas")).not.toHaveAttribute("data-procedure-step-id");
});

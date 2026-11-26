import { test, expect } from "@playwright/test";

test("mobile workspace switches panels instead of stacking the whole application", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const switcher = page.locator("#mobile-panel-switcher");
  await expect(switcher).toBeVisible();
  await expect(page.locator("#catalog-open")).toBeVisible();
  await expect(page.locator("#language-toggle")).toBeVisible();
  await expect(page.locator(".viewer-column")).toBeVisible();
  await expect(page.locator(".left-panel")).toBeHidden();
  await expect(page.locator(".details-panel")).toBeHidden();
  await expect(page.locator('.mobile-panel-button[data-mobile-panel="viewer"]')).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Структура" }).click();
  await expect(page.locator(".left-panel")).toBeVisible();
  await expect(page.locator(".viewer-column")).toBeHidden();
  await expect(page.locator(".details-panel")).toBeHidden();
  await expect(page.locator('.mobile-panel-button[data-mobile-panel="structure"]')).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Детали" }).click();
  await expect(page.locator(".details-panel")).toBeVisible();
  await expect(page.locator(".left-panel")).toBeHidden();
  await expect(page.locator(".viewer-column")).toBeHidden();
  await expect(page.locator('.mobile-panel-button[data-mobile-panel="details"]')).toHaveAttribute("aria-pressed", "true");

  await page.locator("#language-toggle").click();
  await expect(page.getByRole("button", { name: "Structure" })).toBeVisible();
});

test("mobile understand and learn modes reveal their detail content", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.locator('.view-tab[data-mode="understand"]').click();
  await expect(page.locator("#app")).toHaveAttribute("data-mobile-panel", "details");
  await expect(page.locator("#process-details")).toBeVisible();
  await expect(page.locator(".details-panel")).toBeVisible();

  await page.locator('.mobile-panel-button[data-mobile-panel="viewer"]').click();
  await page.locator('.view-tab[data-mode="learn"]').click();
  await expect(page.locator("#app")).toHaveAttribute("data-mobile-panel", "details");
  await expect(page.locator("#learning-panel")).toBeVisible();
});

test("mobile workspace navigation remains hidden on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/");
  await expect(page.locator("#mobile-panel-switcher")).toBeHidden();
  await expect(page.locator(".viewer-column")).toBeVisible();
  await expect(page.locator(".left-panel")).toBeVisible();
  await expect(page.locator(".details-panel")).toBeVisible();
});

test("renders the fallback GPU scene and selects a component", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle(/Screw by Screw/);
  await expect(page.locator("#viewer-canvas canvas")).toBeVisible();
  await expect(page.locator("#component-count")).not.toHaveText("—");
  const rootItem = page.getByRole("button", { name: /Видеокарта в сборе/ });
  await expect(rootItem).toBeVisible();
  await rootItem.click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-id")).toHaveText("assembly.card.root");
  expect(pageErrors).toEqual([]);
});

test("shows linked components and source-backed process explanations", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  await page.locator('.process-button[data-layer="cooling"]').click();
  await expect(page.locator("#process-details")).toBeVisible();
  await expect(page.locator("#process-detail-title")).toHaveText("Охлаждение и воздушный поток");
  const heatsink = page.locator("#process-components").getByRole("button", { name: "Радиатор с рёбрами" });
  await expect(heatsink).toBeVisible();
  await heatsink.click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-id")).toHaveText("cooling.heatsink");
});

test("binds the power process layer from package relationships", async ({ page }) => {
  await page.goto("/");
  await page.locator('.process-button[data-layer="power_delivery"]').click();
  await expect(page.locator("#process-details")).toBeVisible();
  await expect(page.locator("#process-detail-title")).toHaveText("Ввод питания");
  await expect(page.locator("#process-components button")).toHaveCount(17);
  await expect(page.locator("#process-diagram .architecture-diagram-group")).toHaveCount(4);
  const shunt = page.locator('#process-diagram .architecture-node[data-component-id="power.shunt.8pin"]');
  await expect(shunt).toBeVisible();
  await shunt.click();
  await expect(page.locator("#detail-id")).toHaveText("power.shunt.8pin");
});

test("renders conceptual GPU graphics paths and selects a linked architecture node", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await page.locator('.process-button[data-layer="graphics_pipeline"]').click();
  await expect(page.locator("#process-details")).toBeVisible();
  await expect(page.locator("#process-detail-title")).toHaveText("Графические тракты GA106 и видеовыходы");
  await expect(page.locator("#process-diagram .architecture-diagram-group")).toHaveCount(5);
  const rops = page.locator('#process-diagram .architecture-node[data-component-id="chip.gpu.rop.array"]');
  await expect(rops).toBeVisible();
  await rops.click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-id")).toHaveText("chip.gpu.rop.array");
  expect(pageErrors).toEqual([]);
});

test("renders the RTX 3060 NVENC and NVDEC media-engine map", async ({ page }) => {
  const pageErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/");
  await page.locator('.process-button[data-layer="video_codec"]').click();
  await expect(page.locator("#process-details")).toBeVisible();
  await expect(page.locator("#process-detail-title")).toHaveText("Выделенные блоки видеокодирования и декодирования");
  await expect(page.locator("#process-diagram .architecture-diagram-group")).toHaveCount(3);
  const nvdec = page.locator('#process-diagram .architecture-node[data-component-id="chip.gpu.nvdec"]');
  await expect(nvdec).toBeVisible();
  await nvdec.click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-id")).toHaveText("chip.gpu.nvdec");
  expect(pageErrors).toEqual([]);
});

test("allows an animated explode sequence to be cancelled and reassembled", async ({ page }) => {
  await page.goto("/");
  const button = page.locator("#animate-button");
  await button.click();
  await expect(button).toBeDisabled();
  await page.locator("#assemble-button").click();
  await expect(button).toBeEnabled({ timeout: 3000 });
  await expect(page.locator("#explode-slider")).toHaveValue("0");
});

test("runs the source-backed quiz in Russian and English", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Обучение" }).click();
  await expect(page.locator("#learning-panel")).toBeVisible();
  await expect(page.locator("#quiz-question")).toHaveText("Какой объём памяти GDDR6 указан для этого SKU?");
  await page.locator("#quiz-choices").getByRole("button", { name: "12 ГБ" }).click();
  await page.locator("#quiz-next").click();
  await expect(page.locator("#quiz-feedback")).toContainText("Верно");
  await page.locator("#quiz-next").click();
  await page.locator("#language-toggle").click();
  await expect(page.locator("#quiz-question")).toHaveText("What is the memory bus width?");
  await expect(page.locator("#quiz-choices").getByRole("button", { name: "192-bit" })).toBeVisible();
});

test("exploded view can be returned to assembled state", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  await page.locator("#explode-slider").evaluate((element) => {
    element.value = "100";
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await expect(page.locator("#explode-value")).toHaveText("100%");
  await page.getByRole("button", { name: "Собрать" }).click();
  await expect(page.locator("#explode-value")).toHaveText("0%");
});

test("rejects GLB files that reference external resources", async ({ page }) => {
  await page.goto("/");
  const document = {
    asset: { version: "2.0" },
    scene: 0,
    scenes: [{ nodes: [] }],
    nodes: [],
    images: [{ uri: "https://example.invalid/remote-image.png" }]
  };
  const json = new TextEncoder().encode(JSON.stringify(document));
  const paddedLength = Math.ceil(json.length / 4) * 4;
  const buffer = new Uint8Array(20 + paddedLength);
  const view = new DataView(buffer.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, buffer.byteLength, true);
  view.setUint32(12, paddedLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  buffer.set(json, 20);
  buffer.fill(0x20, 20 + json.length);
  await page.locator("#model-file").setInputFiles({
    name: "external-resource.glb",
    mimeType: "model/gltf-binary",
    buffer: Buffer.from(buffer)
  });
  await expect(page.locator("#viewer-error")).toContainText("внешние файлы");
});


test("keeps the shell styled and explains when the app entry module fails", async ({ page }) => {
  await page.route("**/src/main.js", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#startup-fallback")).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#app")).toHaveClass(/app-shell/);
  const bodyBackground = await page.locator("body").evaluate((node) => getComputedStyle(node).backgroundColor);
  expect(bodyBackground).toBe("rgb(9, 13, 18)");
});


test("measurement mode is reversible, keyboard-accessible and labelled as model-space only", async ({ page }) => {
  await page.goto("/");
  const processPanel = page.locator("#process-panel");
  const toggle = page.locator("#measurement-toggle");
  const readout = page.locator("#measurement-readout");
  await expect(processPanel).toHaveCSS("overflow-y", "auto");
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(readout).toContainText("Измерение выключено");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-measurement-enabled", "true");
  await expect(readout).toContainText("Нажмите на видимую поверхность");
  await page.locator("#language-toggle").click();
  await expect(readout).toContainText("Click a visible surface");
  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.locator("#language-toggle").click();
  await page.locator("#measurement-toggle").click();
  await page.locator("#measurement-clear").click();
  await expect(readout).toContainText("Нажмите на видимую поверхность");
});


test("shows source-backed claims, evidence classes and explicit unknown values", async ({ page }) => {
  await page.goto("/");
  await page.locator('#component-tree button[data-id="assembly.pcb.board"]').click();
  await expect(page.locator("#detail-claims-section")).toBeVisible();

  const revision = page.locator('[data-claim-id="claim.pcb.revision"]');
  await expect(revision).toContainText("Ревизия печатной платы");
  await expect(revision).toContainText("Неизвестно");

  const markingCandidate = page.locator('[data-claim-id="claim.pcb.silkscreen_marking.candidate"]');
  await expect(markingCandidate).toContainText("EVGA232 REV 1.0");
  await expect(markingCandidate).toContainText("TechPowerUp");
  await expect(markingCandidate).toContainText("Кандидатное наблюдение по справочному изображению");
  await expect(revision).toContainText("Неизвестно");

  const backplate = page.locator('[data-claim-id="claim.card.backplate"]');
  await expect(backplate).toContainText("Наличие задней пластины");
  await expect(backplate).toContainText("Нет");
  await expect(backplate.locator('a[href="https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1"]')).toBeVisible();
  await expect(backplate.locator('a[href="https://www.neoseeker.com/Articles/Hardware/Reviews/evga-geforce-rtx-3060-xc-black-gaming/"]')).toBeVisible();
  await expect(backplate.locator("a")).toHaveCount(2);
  await expect(backplate).toContainText("Независимо подтверждено");
});

test("shows model-level specifications when the top-level device is selected", async ({ page }) => {
  await page.goto("/");
  await page.locator('#component-tree button[data-id="assembly.card.root"]').click();
  await expect(page.locator("#detail-claims-section")).toBeVisible();
  await expect(page.locator('[data-claim-id="claim.memory.capacity"]')).toContainText("12 GB");

  // The outer shroud length belongs to the shroud assembly, not the device-level subject.
  await page.locator('#component-tree button[data-id="assembly.shroud"]').click();
  await expect(page.locator('[data-claim-id="claim.card.outer_shroud_length"]')).toContainText("Неизвестно");
});


test("shows exact-SKU cooler screw count and secondary-catalog memory attributes", async ({ page }) => {
  await page.goto("/");
  await page.locator('#component-tree .tree-item[data-id="assembly.fasteners"]').click();
  await expect(page.locator('[data-claim-id="claim.cooler.fastener.count.total"]')).toContainText("8");
  await expect(page.locator('[data-claim-id="claim.cooler.fastener.count.rear"]')).toContainText("4");
  await expect(page.locator('[data-claim-id="claim.cooler.fastener.count.total"]')).toContainText("Независимо подтверждено");

  await page.locator('#component-tree .tree-item[data-id="assembly.pcb.electronics"]').click();
  await expect(page.locator('[data-claim-id="claim.memory.package_part_number"]')).toContainText("Samsung K4ZAF325BM-HC16");
  await expect(page.locator('[data-claim-id="claim.memory.package_part_number"] a[href="https://www.tomshardware.com/reviews/nvidia-geforce-rtx-3060-review/2"]')).toBeVisible();

  await page.locator('#component-tree .tree-item[data-id="chip.memory.gddr6.bus"]').click();
  await expect(page.locator('[data-claim-id="claim.memory.package_density"]')).toContainText("Данные вторичного каталога");
});



test("keeps heatpipe route counts separate from unknown physical loop count and OEM fan identity", async ({ page }) => {
  await page.goto("/");
  await page.locator('#component-tree button[data-id="cooling.heatpipes"]').click();
  await expect(page.locator('[data-claim-id="claim.cooling.heatpipe_count"]')).toContainText("6");
  await expect(page.locator('[data-claim-id="claim.cooling.heatpipe_count"]')).toContainText("reported heatpipe runs");
  await expect(page.locator('[data-claim-id="claim.cooling.heatpipe.physical_loop_count"]')).toContainText("Неизвестно");
  await expect(page.locator('[data-claim-id="claim.cooling.heatpipe.counting_convention"]')).toContainText("six reported runs");
  await expect(page.locator('[data-claim-id="claim.cooling.heatpipe.counting_convention"]')).toContainText("four copper heatpipes");

  await page.locator('#component-tree button[data-id="assembly.cooling"]').click();
  await expect(page.locator('[data-claim-id="claim.fan.oem_part_identity"]')).toContainText("Неизвестно");
  await expect(page.locator('[data-claim-id="claim.fan.oem_part_identity"]')).toContainText("Aftermarket");
});

test("search finds components by package marking and source title", async ({ page }) => {
  await page.goto("/");
  const search = page.locator("#component-search");

  await search.fill("K4ZAF325BM-HC16");
  const electronics = page.locator('#component-tree .tree-item[data-id="assembly.pcb.electronics"]');
  await expect(electronics).toBeVisible();
  await expect(electronics).toHaveClass(/search-match/);
  await expect(page.locator('#component-tree button[data-id="assembly.card.root"]')).toBeVisible();

  await search.fill("Tom's Hardware");
  await expect(electronics).toBeVisible();
  await expect(electronics).toHaveClass(/search-match/);

  await search.fill("3584");
  const device = page.locator('#component-tree button[data-id="assembly.card.root"]');
  await expect(device).toBeVisible();
  await expect(device).toHaveClass(/search-match/);
});

test("component search keeps ordinary name and stable-ID lookup", async ({ page }) => {
  await page.goto("/");
  const search = page.locator("#component-search");
  await search.fill("cooling.heatsink");
  await expect(page.locator('#component-tree button[data-id="cooling.heatsink"]')).toBeVisible();
  await search.fill("Радиатор с рёбрами");
  await expect(page.locator('#component-tree button[data-id="cooling.heatsink"]')).toBeVisible();
});


test("component cards expose typed, source-linked relationships and navigate between components", async ({ page }) => {
  await page.goto("/");
  await page.locator('#component-tree button[data-id="assembly.cooling"]').click();
  await expect(page.locator("#detail-relations-section")).toBeVisible();

  const heatsinkRelation = page.locator('[data-relationship-id="rel.cooling.contains.heatsink"]');
  await expect(heatsinkRelation).toContainText("Содержит");
  await expect(heatsinkRelation.locator("a")).toHaveCount(1);
  await heatsinkRelation.getByRole("button", { name: "Радиатор с рёбрами" }).click();
  await expect(page.locator("#detail-id")).toHaveText("cooling.heatsink");

  const airflow = page.locator('[data-relationship-id="rel.cooling.airflow"]');
  await expect(airflow).toContainText("Обдувается потоком от");
  await expect(airflow).toContainText("Качественная связь");
  await expect(airflow.getByRole("button", { name: "Осевой вентилятор 1" })).toBeVisible();
  const secondAirflow = page.locator('[data-relationship-id="rel.cooling.airflow.fan2"]');
  await expect(secondAirflow).toContainText("Обдувается потоком от");
  await expect(secondAirflow.getByRole("button", { name: "Осевой вентилятор 2" })).toBeVisible();
});

test("relationships without registered sources are labelled rather than silently presented as sourced", async ({ page }) => {
  await page.goto("/");
  await page.locator('#component-tree button[data-id="assembly.power_stage"]').click();
  const relation = page.locator('[data-relationship-id="rel.pcb.contains.power_stage"]');
  await expect(relation).toBeVisible();
  await expect(relation).toContainText("Входит в");
  await expect(relation).toContainText("Источник не зарегистрирован");
});


test("a missing optional bundled model does not reset active user interaction", async ({ page }) => {
  await page.route("**/models/rtx3060_xc_black_blockout_v04.glb", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 750));
    await route.fulfill({ status: 404, body: "not found" });
  });
  await page.goto("/");
  const toggle = page.locator("#measurement-toggle");
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(850);
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-measurement-enabled", "true");
});


test("cooling layer exposes an inspectable thermal path without claiming simulation", async ({ page }) => {
  await page.goto("/");
  await page.locator('.process-button[data-layer="cooling"]').click();
  await expect(page.locator("#process-detail-title")).toContainText("Охлаждение и воздушный поток");
  const diagram = page.locator("#process-diagram");
  await expect(diagram).toBeVisible();
  await expect(diagram.locator(".architecture-diagram-group")).toHaveCount(4);
  await expect(diagram.locator(".architecture-node")).toHaveCount(32);
  await expect(diagram.locator(".architecture-diagram-badge")).toContainText("НЕ CFD / ТЕПЛОВАЯ СИМУЛЯЦИЯ");
  await expect(diagram.locator('.architecture-node[data-component-id="cooling.gpu_contact"]')).toContainText("Медная контактная пластина");
  await expect(diagram.locator('.architecture-node[data-component-id="cooling.heatpipe.candidate.1"]')).toContainText("Кандидатная трасса трубки 1");
  await expect(diagram.locator('.architecture-node[data-component-id="cooling.heatpipe.end.04"]')).toContainText("Медное окончание 04");
  await expect(diagram.locator('.architecture-node[data-component-id="cooling.heatpipe.main.04"]')).toContainText("Основная тепловая трубка GPU 4");
  await expect(diagram.locator('.architecture-node[data-component-id="cooling.heatpipe.side.02"]')).toContainText("Боковая тепловая трубка 2");
  await expect(diagram.locator('.architecture-node[data-component-id="fan.2.blade.1"]')).toContainText("Макетная лопасть вентилятора 2");
  await expect(page.locator("#process-assumptions li")).toHaveCount(6);
  await expect(page.locator("#process-sources a")).toHaveCount(6);
  await diagram.locator('.architecture-node[data-component-id="cooling.thermal_pad.memory"]').click();
  await expect(page.locator("#detail-id")).toHaveText("cooling.thermal_pad.memory");
  await expect(page.locator("#detail-description")).toContainText("толщина");
});

test("GPU architecture layer exposes source-linked logical GA106 and GDDR6 nodes", async ({ page }) => {
  await page.goto("/");
  await page.locator('.process-button[data-layer="gpu_compute"]').click();
  await expect(page.locator("#process-detail-title")).toContainText("Архитектура вычислений GA106");
  const diagram = page.locator("#process-diagram");
  await expect(diagram).toBeVisible();
  await expect(diagram.locator(".architecture-diagram-group")).toHaveCount(3);
  const diagramNodes = diagram.locator(".architecture-node");
  await expect(diagramNodes).toHaveCount(31);
  await expect(diagram.locator('.architecture-node[data-component-id="chip.gpu.die"]')).toContainText("Кристалл GA106");
  await expect(diagram.locator('.architecture-node[data-component-id="chip.gpu.cuda_core.array"]')).toContainText("3 584");
  await expect(diagram.locator('.architecture-node[data-component-id="chip.memory.gddr6.bus"]')).toContainText("192-битная GDDR6");
  await expect(diagram.locator('.architecture-node[data-component-id="pcb.memory.unpopulated.01"]')).toContainText("Незанятая позиция памяти 01");
  await expect(diagram.locator('.architecture-node[data-component-id="pcb.memory.unpopulated.02"]')).toContainText("Незанятая позиция памяти 02");

  const linked = page.locator("#process-components .process-component-chip");
  await expect(linked).toHaveCount(194);
  await expect(page.locator('#process-components .process-component-chip[data-component-id="chip.gpu.sm.cluster"]')).toContainText("Кластер потоковых мультипроцессоров Ampere");
  await expect(diagram.locator('.architecture-node[data-component-id="chip.gpu.tpc.cluster"]')).toContainText("14 логических TPC");
  await expect(diagram.locator('.architecture-node[data-component-id="chip.gpu.tpc.14"]')).toContainText("2 SM");
  await expect(page.locator('#process-components .process-component-chip[data-component-id="chip.gpu.sm.28"]')).toContainText("GA106 SM 28");
  await expect(page.locator('#process-components .process-component-chip[data-component-id="chip.gpu.sm.28.partition.04"]')).toContainText("вычислительная секция 4");
  await expect(page.locator('#process-components .process-component-chip[data-component-id="chip.gpu.tpc.14"]')).toContainText("TPC 14");
  await expect(page.locator('#process-components .process-component-chip[data-component-id="chip.memory.channel.06"]')).toContainText("Визуальный сегмент интерфейса GDDR6 06");
  await expect(page.locator('#process-components .process-component-chip[data-component-id="pcb.memory.unpopulated.locations"]')).toContainText("Две незанятые позиции памяти");
  await expect(page.locator("#process-assumptions")).toContainText("две незанятые позиции памяти");

  await expect(page.locator("#process-assumptions")).toContainText("не воспроизводят физическую топологию GA106");
  await expect(page.locator("#process-sources a")).toHaveCount(5);
  await diagram.locator('.architecture-node[data-component-id="chip.gpu.sm.cluster"]').click();
  await expect(page.locator("#component-details")).toBeVisible();
  await expect(page.locator("#detail-name")).toContainText("Кластер потоковых мультипроцессоров Ampere");
  await page.locator('.process-button[data-layer="gpu_compute"]').click();
  await expect(page.locator("#process-diagram")).toBeVisible();
  await page.locator('.process-button[data-layer="clear"]').click();
  await expect(page.locator("#process-details")).toBeHidden();
});

test("partial teardown steps and source observations are both shown without conflating them", async ({ page }) => {
  await page.goto("/");
  await page.locator('#component-tree button[data-id="assembly.card.root"]').click();

  const section = page.locator("#detail-assembly-section");
  await expect(section).toBeVisible();
  await expect(page.locator("#assembly-empty-note")).toBeHidden();
  const steps = page.locator("#assembly-step-list .assembly-step-card");
  await expect(steps).toHaveCount(5);
  await expect(steps.nth(0)).toContainText("Вывернуть четыре подпружиненных винта крепления кулера вокруг GPU");
  await expect(steps.nth(1)).toContainText("Освободить отдельный крепёж основания пакета рёбер");
  await expect(steps.nth(2)).toContainText("Освободить крепёж I/O-планки и выходной панели");
  await expect(steps.nth(3)).toContainText("Отсоединить оба кабеля вентиляторов перед снятием кулера");
  await expect(steps.nth(4)).toContainText("Вывернуть по три крепёжных винта каждого вентилятора");
  const exactFastenerObservation = page.locator('[data-observation-source-id="src.lanoc.review"]').first();
  await expect(exactFastenerObservation).toContainText("вокруг GPU видны четыре винта крепления радиатора");
  await expect(page.locator("#assembly-observation-heading")).toContainText("НАБЛЮДЕНИЯ В ИСТОЧНИКАХ");
  const observation = page.locator('[data-observation-source-id="src.gamersnexus.teardown"]').first();
  await expect(observation).toContainText("01:30");
  await expect(observation).toContainText("эта отметка времени не является полным описанием шага");
  await expect(observation.locator("a")).toHaveAttribute("href", /t=90s/);
});


test("a successful but delayed bundled model cannot replace a scene after user interaction", async ({ page }) => {
  await page.route("**/models/rtx3060_xc_black_blockout_v05.glb", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const document = {
      asset: { version: "2.0" },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ name: "Late bundled root", extras: { sbs_component_id: "assembly.card.root" } }]
    };
    const json = Buffer.from(JSON.stringify(document), "utf8");
    const paddedLength = Math.ceil(json.length / 4) * 4;
    const glb = Buffer.alloc(20 + paddedLength);
    glb.writeUInt32LE(0x46546c67, 0);
    glb.writeUInt32LE(2, 4);
    glb.writeUInt32LE(glb.length, 8);
    glb.writeUInt32LE(paddedLength, 12);
    glb.writeUInt32LE(0x4e4f534a, 16);
    json.copy(glb, 20);
    glb.fill(0x20, 20 + json.length);
    await route.fulfill({ status: 200, contentType: "model/gltf-binary", body: glb });
  });

  await page.goto("/");
  await expect(page.locator("#component-count")).not.toHaveText("—");
  const fan = page.locator('#component-tree button[data-id="assembly.fan.1"]');
  await expect(fan).toBeVisible();
  await fan.click();
  await expect(page.locator("#detail-id")).toHaveText("assembly.fan.1");
  await page.waitForTimeout(1450);
  await expect(page.locator("#detail-id")).toHaveText("assembly.fan.1");
  await expect(page.locator('#component-tree button[data-id="assembly.fan.1"]')).toBeVisible();
});


test("fallback impellers have independent pivots and an evidence-labelled package clip", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#viewer-canvas")).toHaveAttribute("data-fan-rotors", "2");
  await expect(page.locator("#animation-player-panel")).toBeVisible();
  await expect(page.locator("#animation-evidence-note")).toContainText("не является измеренным RPM");

  const rotor = page.locator("#component-tree button[data-id=\"assembly.fan.1.rotor\"]");
  await expect(rotor).toBeVisible();
  await rotor.click();
  await expect(page.locator("#detail-id")).toHaveText("assembly.fan.1.rotor");
  await expect(page.locator("#evidence-badge")).toHaveText("УСЛОВНАЯ ГЕОМЕТРИЯ");

  await page.locator("#power-toggle").click();
  await expect(page.locator("body")).toHaveAttribute("data-sbs-powered", "true");
  await expect(page.locator("#animation-player-panel")).toHaveAttribute("data-status", "ready");
  await page.locator("#animation-play").click();
  await expect(page.locator("body")).toHaveAttribute("data-sbs-powered", "false");
  await expect(page.locator("#animation-player-panel")).toHaveAttribute("data-status", "playing");
  await page.waitForTimeout(140);
  await page.locator("#animation-pause").click();
  await page.locator("#animation-stop").click();
  await expect(page.locator("#animation-player-panel")).toHaveAttribute("data-status", "ready");
  await expect(page.locator("#component-tree button[data-id=\"assembly.fan.2.rotor\"]")).toBeVisible();
});


test("shows a workload-specific cooling and board-power operating point with source caveats", async ({ page }) => {
  await page.goto("/");

  await page.locator('#component-tree button[data-id="assembly.cooling"]').click();
  const fanRpm = page.locator('[data-claim-id="claim.cooling.fan.rpm.sample_operating_point"]');
  const fanDuty = page.locator('[data-claim-id="claim.cooling.fan.pwm.sample_operating_point"]');
  await page.locator('#component-tree button[data-id="cooling.heatpipes"]').click();
  const pipeDiameter = page.locator('[data-claim-id="claim.cooling.heatpipe.diameter.observed_estimate"]');
  await expect(pipeDiameter.locator(".claim-value")).toContainText("6 mm");
  await expect(pipeDiameter).toContainText("rough teardown estimate");
  await expect(pipeDiameter.locator(".claim-sources a")).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=hJFJ_clQT8U"
  );
  await page.locator('#component-tree button[data-id="assembly.cooling"]').click();
  await expect(fanRpm.locator(".claim-value")).toContainText("2030 RPM");
  await expect(fanRpm).toContainText("not the fan's maximum/nominal RPM or a factory fan curve");
  await expect(fanDuty.locator(".claim-value")).toContainText("73 %");
  await expect(fanRpm.locator(".claim-sources a")).toHaveAttribute(
    "href",
    "https://pcper.com/2021/02/nvidia-geforce-rtx-3060-review-evga-xc-black-tested/"
  );

  await page.locator('#component-tree button[data-id="chip.gpu.ga106"]').click();
  const edgeTemperature = page.locator('[data-claim-id="claim.gpu.temperature.edge.sample_operating_point"]');
  const hotspot = page.locator('[data-claim-id="claim.gpu.temperature.hotspot.sample_operating_point"]');
  await expect(edgeTemperature.locator(".claim-value")).toContainText("68.1 °C");
  await expect(hotspot.locator(".claim-value")).toContainText("80.5 °C");
  await expect(hotspot).toContainText("not a design target");
  const observedPeak = page.locator('[data-claim-id="claim.gpu.frequency.peak.sample_operating_point"]');
  await expect(observedPeak.locator(".claim-value")).toContainText("1905 MHz");
  await expect(observedPeak).toContainText("not EVGA's published 1777 MHz boost clock");
  await expect(observedPeak.locator(".claim-sources a")).toHaveAttribute(
    "href",
    "https://pcper.com/2021/02/nvidia-geforce-rtx-3060-review-evga-xc-black-tested/"
  );

  await page.locator('#component-tree button[data-id="assembly.card.root"]').click();
  const boardPower = page.locator('[data-claim-id="claim.power.board_power.sample_operating_point"]');
  await expect(boardPower.locator(".claim-value")).toContainText("172.4 W");
  await expect(boardPower).toContainText("not a revised TGP/TDP specification");
  await expect(page.locator('[data-claim-id="claim.power.total_graphics_power"] .claim-value')).toContainText("170 W");
});

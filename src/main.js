import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SceneController } from "./viewer/SceneController.js";
import { MeasurementController } from "./viewer/MeasurementController.js";
import { MODEL as DEFAULT_MODEL, COMPONENTS as DEFAULT_COMPONENTS, EVIDENCE, createModelDataAdapter } from "./data/model.js";
import DEFAULT_LEARNING_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/learning.json";
import DEFAULT_PROCESS_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/process_layers.json";
import DEFAULT_CLAIM_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/claims.json";
import DEFAULT_RELATIONSHIP_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/relationships.json";
import { loadModelPackage, validateSelfContainedGlb, MAX_MODEL_PACKAGE_BYTES, MAX_SCENE_GLB_BYTES } from "./viewer/ModelPackageLoader.js";

let MODEL = DEFAULT_MODEL;
let COMPONENTS = DEFAULT_COMPONENTS;
let LEARNING_PACKAGE = DEFAULT_LEARNING_PACKAGE;
let PROCESS_PACKAGE = DEFAULT_PROCESS_PACKAGE;
let CLAIM_PACKAGE = DEFAULT_CLAIM_PACKAGE;
let RELATIONSHIP_PACKAGE = DEFAULT_RELATIONSHIP_PACKAGE;

const $ = (selector) => document.querySelector(selector);
const canvasHost = $("#viewer-canvas");
const state = {
  language: "ru",
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  modelRoot: null,
  selected: null,
  selectedId: null,
  componentNodes: new Map(),
  catalog: new Map(COMPONENTS.map((item) => [item.id, item])),
  sceneController: null,
  cameraHome: null,
  gridHelper: null,
  exploded: 0,
  isolated: false,
  wireframe: false,
  activeLayer: null,
  sourceMode: "demo",
  animationFrame: 0,
  learningMode: false,
  learningIndex: 0,
  learningScore: 0,
  learningSelected: null,
  learningAnswered: false,
  learningComplete: false,
  modelWarnings: [],
  modelRevision: 0,
  powered: false,
  simulationSpeed: 1,
  reducedMotion: false,
  fanRotors: [],
  processVisuals: null,
  flowParticles: [],
  cameraPreset: "isometric",
  sliceEnabled: false,
  sliceAxis: "x",
  sliceFraction: 0.5,
  slicePlane: new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
  measurementController: null,
  measurementEnabled: false
};

const MAX_GLB_BYTES = MAX_SCENE_GLB_BYTES;

const UI = {
  en: {
    modelLabel: "MODEL", structure: "STRUCTURE", components: "Components",
    searchPlaceholder: "Search components, claims, IDs and sources…", assemblyTree: "ASSEMBLY TREE", showAll: "Show all",
    proxyNote: "Illustrative geometry · not CAD", explore: "Explore", disassemble: "Disassemble",
    understand: "Understand", animate: "Animate", assembledState: "ASSEMBLED STATE", demoScene: "DEMO SCENE · LOCAL",
    assemblyState: "ASSEMBLY STATE", assemble: "Assemble", explode: "Explode",
    assembled: "ASSEMBLED", exploded: "EXPLODED", processLayers: "PROCESS LAYERS",
    qualitativeOnly: "SCHEMATIC · NOT CFD / SPICE", cooling: "Airflow", powerDelivery: "Power path",
    powerOn: "Run animation", powerOff: "Stop animation", operatingState: "OPERATING VISUALIZATION", simulationSpeed: "Animation speed",
    cameraPreset: "VIEW", viewIso: "Isometric", viewFan: "Fan side", viewPcb: "PCB side", viewIo: "I/O bracket", viewPower: "Power connector", viewTop: "Top",
    sliceToggle: "Section cut", sliceAxis: "Axis", sliceNote: "Visual cut · uncapped · not CAD",
    measure: "Measure", clearMeasurement: "Clear", measureIdle: "Measurement off · model-space only", measurePrompt: "Click a visible surface to set point 1 of 2", measureFirstPoint: "Point 1 of 2 set · select the second point", measureDistance: "Distance", measureDisclaimer: "model-space only", measureNoHit: "Click a visible model surface", measureEnabled: "Measurement enabled", measureDisabled: "Measurement disabled", modelUnits: "model units", measureNote: "Not a verified physical dimension",
    clearLayer: "Clear layer", inspection: "INSPECTION", componentDetails: "Component details",
    selectComponent: "Select a component", selectHint: "Choose a part in the 3D view or assembly tree to inspect its role and evidence.",
    identity: "IDENTITY", parent: "Parent", geometry: "Geometry", evidence: "EVIDENCE", technicalClaims: "TECHNICAL CLAIMS", claimUnknown: "Unknown", yes: "Yes", no: "No", claimSources: "Evidence sources", technicalRelationships: "TECHNICAL RELATIONSHIPS", qualitativeRelation: "Qualitative relationship", noRelationshipSource: "No source registered",
    sources: "SOURCES", accuracyFooter: "Unknown values remain unknown. No inferred CAD accuracy.",
    ready: "READY", localFirst: "LOCAL-FIRST · NO ACCOUNT", openModel: "Open model",
    noSelection: "No component selected", componentsCount: "components",
    loadError: "Could not load this GLB file.", loadedGlb: "GLB LOADED · LOCAL FILE", loadedPackage: "SBS MODEL PACKAGE · LOCAL", loadedBundled: "BUNDLED MODEL · LOCAL",
    demoLoaded: "DEMO SCENE · LOCAL", loading: "LOADING MODEL…", isolate: "Isolated",
    allVisible: "All components visible", layerCooling: "Cooling layer · qualitative",
    layerPower: "Power path · qualitative", noWebgl: "WebGL is unavailable in this browser.",
    source: "Source", noSources: "No direct source linked to this component.",
    modelLoaded: "Model ready", glbPicker: "Choose a .glb file", learn: "Learn", learning: "LEARNING", linkedComponents: "LINKED COMPONENTS", assumptions: "ASSUMPTIONS & LIMITS", processLayer: "PROCESS LAYER", fileTooLarge: "GLB exceeds the 256 MB limit.", packageTooLarge: "SBS model package exceeds the 512 MB limit.", externalResources: "This GLB references external files. Only self-contained GLB files are allowed.", question: "QUESTION", checkAnswer: "Check answer", nextQuestion: "Next question", finishQuiz: "Finish", restartQuiz: "Try again", correctAnswer: "Correct", wrongAnswer: "Not quite", quizComplete: "Quiz complete", yourScore: "Your score", chooseAnswer: "Choose an answer first"
  },
  ru: {
    modelLabel: "МОДЕЛЬ", structure: "СТРУКТУРА", components: "Компоненты",
    searchPlaceholder: "Компонент, маркировка, утверждение или источник…", assemblyTree: "ДЕРЕВО СБОРКИ", showAll: "Показать все",
    proxyNote: "Условная геометрия · не CAD", explore: "Обзор", disassemble: "Разборка",
    understand: "Принцип работы", animate: "Анимировать", assembledState: "СОБРАННОЕ СОСТОЯНИЕ", demoScene: "ДЕМО-СЦЕНА · ЛОКАЛЬНО",
    assemblyState: "СОСТОЯНИЕ СБОРКИ", assemble: "Собрать", explode: "Разобрать",
    assembled: "СОБРАНО", exploded: "РАЗОБРАНО", processLayers: "СЛОИ ПРОЦЕССОВ",
    qualitativeOnly: "СХЕМА · НЕ CFD / SPICE", cooling: "Воздушный поток", powerDelivery: "Путь питания",
    powerOn: "Включить анимацию", powerOff: "Остановить анимацию", operatingState: "ВИЗУАЛИЗАЦИЯ РАБОТЫ", simulationSpeed: "Скорость анимации",
    cameraPreset: "РАКУРС", viewIso: "Изометрия", viewFan: "Сторона вентиляторов", viewPcb: "Сторона PCB", viewIo: "Планка I/O", viewPower: "Разъём питания", viewTop: "Сверху",
    sliceToggle: "Сечение", sliceAxis: "Ось", sliceNote: "Визуальный срез · без крышек · не CAD",
    measure: "Измерить", clearMeasurement: "Сброс", measureIdle: "Измерение выключено · только пространство модели", measurePrompt: "Нажмите на видимую поверхность, чтобы задать точку 1 из 2", measureFirstPoint: "Точка 1 из 2 задана · выберите вторую", measureDistance: "Расстояние", measureDisclaimer: "ед. модели", measureNoHit: "Нажмите на видимую поверхность модели", measureEnabled: "Инструмент измерения включён", measureDisabled: "Инструмент измерения выключен", modelUnits: "единицы модели", measureNote: "Не подтверждённый физический размер",
    clearLayer: "Сбросить слой", inspection: "ИНСПЕКЦИЯ", componentDetails: "Карточка компонента",
    selectComponent: "Выберите компонент", selectHint: "Выберите деталь в 3D-окне или дереве сборки, чтобы изучить её назначение и источники.",
    identity: "ИДЕНТИФИКАЦИЯ", parent: "Родитель", geometry: "Геометрия", evidence: "ДОКАЗАТЕЛЬНОСТЬ", technicalClaims: "ТЕХНИЧЕСКИЕ УТВЕРЖДЕНИЯ", claimUnknown: "Неизвестно", yes: "Да", no: "Нет", claimSources: "Источники утверждения", technicalRelationships: "ТЕХНИЧЕСКИЕ СВЯЗИ", qualitativeRelation: "Качественная связь", noRelationshipSource: "Источник не зарегистрирован",
    sources: "ИСТОЧНИКИ", accuracyFooter: "Неизвестное остаётся неизвестным. Точность CAD не подразумевается.",
    ready: "ГОТОВО", localFirst: "ЛОКАЛЬНО · БЕЗ АККАУНТА", openModel: "Открыть модель",
    noSelection: "Компонент не выбран", componentsCount: "компонентов",
    loadError: "Не удалось загрузить этот GLB-файл.", loadedGlb: "GLB ЗАГРУЖЕН · ЛОКАЛЬНЫЙ ФАЙЛ", loadedPackage: "ПАКЕТ SBS MODEL · ЛОКАЛЬНО", loadedBundled: "ВСТРОЕННАЯ МОДЕЛЬ · ЛОКАЛЬНО",
    demoLoaded: "ДЕМО-СЦЕНА · ЛОКАЛЬНО", loading: "ЗАГРУЗКА МОДЕЛИ…", isolate: "Изолировано",
    allVisible: "Все компоненты видимы", layerCooling: "Слой охлаждения · качественно",
    layerPower: "Путь питания · качественно", noWebgl: "В этом браузере недоступен WebGL.",
    source: "Источник", noSources: "Для этого компонента нет прямой ссылки на источник.",
    modelLoaded: "Модель готова", glbPicker: "Выберите файл .glb", learn: "Обучение", learning: "ОБУЧЕНИЕ", linkedComponents: "СВЯЗАННЫЕ КОМПОНЕНТЫ", assumptions: "ДОПУЩЕНИЯ И ОГРАНИЧЕНИЯ", processLayer: "СЛОЙ ПРОЦЕССА", fileTooLarge: "GLB превышает лимит 256 МБ.", packageTooLarge: "Пакет SBS model превышает лимит 512 МБ.", externalResources: "Этот GLB ссылается на внешние файлы. Разрешены только самодостаточные GLB.", question: "ВОПРОС", checkAnswer: "Проверить ответ", nextQuestion: "Следующий вопрос", finishQuiz: "Завершить", restartQuiz: "Повторить", correctAnswer: "Верно", wrongAnswer: "Не совсем", quizComplete: "Тест завершён", yourScore: "Ваш результат", chooseAnswer: "Сначала выберите ответ"
  }
};

function t(key) { return UI[state.language][key] ?? key; }
function setStatus(message) { $("#app-status").textContent = message; }
function setLoadState(message) { $("#load-state").textContent = message; }

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const value = t(node.dataset.i18n);
    if (value) node.textContent = value;
  });
  const powerButton = $("#power-toggle");
  if (powerButton) powerButton.textContent = t(state.powered ? "powerOff" : "powerOn");
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  renderTree();
  if (state.activeLayer) renderProcessLayer();
  else if (state.learningMode) renderLearning();
  else if (state.selectedId) renderDetails(state.selectedId);
  updateMeasurementReadout();
}

function tag(object, id, evidence = "illustrative", geometry = "proxy") {
  object.userData.sbs_component_id = id;
  object.userData.sbs_evidence_status = evidence;
  object.userData.sbs_geometry_status = geometry;
  return object;
}

function makeGroup(parent, id, name, position = [0, 0, 0]) {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  tag(group, id, "visible_exact_model", "assembly_node");
  parent.add(group);
  return group;
}

function makeMesh(parent, id, name, geometry, material, position, evidence = "illustrative") {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  tag(mesh, id, evidence, "proxy");
  parent.add(mesh);
  return mesh;
}

function createBladeGeometry() {
  const shape = new THREE.Shape();
  shape.moveTo(13, -3);
  shape.quadraticCurveTo(23, -5, 31, -1);
  shape.quadraticCurveTo(39, 3, 42, 5);
  shape.quadraticCurveTo(31, 6, 23, 4);
  shape.quadraticCurveTo(16, 2, 13, -3);
  return new THREE.ShapeGeometry(shape, 12);
}

function createFan(parent, index, x) {
  const fan = makeGroup(parent, `assembly.fan.${index}`, `Fan ${index} assembly`, [x, -19.5, 56]);
  const fanPlane = new THREE.Group();
  fanPlane.rotation.x = Math.PI / 2;
  fan.add(fanPlane);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(43.5, 2.2, 10, 72),
    new THREE.MeshStandardMaterial({ color: 0x333a42, metalness: 0.38, roughness: 0.52 })
  );
  ring.name = `Fan ${index} annular frame`;
  tag(ring, `fan.${index}.frame`, "reviewer_measurement", "proxy");
  fanPlane.add(ring);

  const hub = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 13, 4, 48),
    new THREE.MeshStandardMaterial({ color: 0x1b2229, metalness: 0.25, roughness: 0.58 })
  );
  hub.rotation.x = Math.PI / 2;
  hub.name = `Fan ${index} hub`;
  tag(hub, `fan.${index}.hub`);
  fanPlane.add(hub);

  // Keep the shroud ring and hub stationary; only the impeller is animated.
  const rotor = new THREE.Group();
  rotor.name = `Fan ${index} rotor`;
  rotor.userData.sbs_fan_rotor = true;
  rotor.userData.sbs_fan_axis = "z";
  fanPlane.add(rotor);

  for (let blade = 0; blade < 7; blade += 1) {
    const bladeMesh = new THREE.Mesh(
      createBladeGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x242c34, side: THREE.DoubleSide, roughness: 0.68 })
    );
    bladeMesh.rotation.z = (Math.PI * 2 * blade) / 7;
    bladeMesh.name = `Fan ${index} blade ${blade + 1}`;
    tag(bladeMesh, `fan.${index}.blade.${blade + 1}`);
    rotor.add(bladeMesh);
  }
}

function createFallbackModel() {
  const root = new THREE.Group();
  root.name = "EVGA RTX 3060 XC BLACK · proxy scene";
  tag(root, "assembly.card.root", "illustrative", "assembly_node");

  const materials = {
    shroud: new THREE.MeshStandardMaterial({ color: 0x171d24, roughness: 0.72 }),
    pcb: new THREE.MeshStandardMaterial({ color: 0x176044, roughness: 0.8 }),
    metal: new THREE.MeshStandardMaterial({ color: 0x747d84, metalness: 0.62, roughness: 0.48 }),
    copper: new THREE.MeshStandardMaterial({ color: 0xb66a39, metalness: 0.72, roughness: 0.38 }),
    chip: new THREE.MeshStandardMaterial({ color: 0x272d35, metalness: 0.12, roughness: 0.6 }),
    memory: new THREE.MeshStandardMaterial({ color: 0x343b44, metalness: 0.12, roughness: 0.55 }),
    fan: new THREE.MeshStandardMaterial({ color: 0x252d35, roughness: 0.65 })
  };

  const shroud = makeGroup(root, "assembly.shroud", "Shroud assembly");
  const cooling = makeGroup(root, "assembly.cooling", "Cooling assembly");
  const pcbAssembly = makeGroup(root, "assembly.pcb.electronics", "PCB and electronics assembly");
  const connectors = makeGroup(root, "assembly.connectors", "Connectors assembly");

  makeMesh(pcbAssembly, "assembly.pcb.board", "Exposed PCB proxy",
    new THREE.BoxGeometry(178, 1.6, 85), materials.pcb, [101, 16.5, 55], "visible_exact_model");

  const fasciaY = -16;
  const rails = [
    ["assembly.shroud.top", "Top shroud rail", [101, fasciaY, 106], [202, 5, 8]],
    ["assembly.shroud.bottom", "Bottom shroud rail", [101, fasciaY, 4], [202, 5, 8]],
    ["assembly.shroud.left", "Left shroud rail", [4, fasciaY, 55], [8, 5, 94]],
    ["assembly.shroud.right", "Right shroud rail", [198, fasciaY, 55], [8, 5, 94]],
    ["assembly.shroud.bridge", "Central shroud bridge", [100.5, fasciaY, 56], [3, 5, 12]]
  ];
  rails.forEach(([id, name, position, size]) => {
    makeMesh(shroud, id, name, new THREE.BoxGeometry(...size), materials.shroud, position);
  });

  createFan(cooling, 1, 55);
  createFan(cooling, 2, 146);

  const heatsink = makeGroup(cooling, "cooling.heatsink", "Heatsink assembly");
  const finSpan = 145.3;
  for (let index = 0; index < 24; index += 1) {
    const x = (201.8 - finSpan) / 2 + (index * finSpan) / 23;
    makeMesh(heatsink, `cooling.heatsink.fin.${String(index + 1).padStart(2, "0")}`,
      `Heatsink fin proxy ${index + 1}`,
      new THREE.BoxGeometry(1, 13, 52.8), materials.metal, [x, 0, 55]);
  }

  makeMesh(cooling, "cooling.gpu_contact", "Copper GPU contact proxy",
    new THREE.BoxGeometry(48, 3, 42), materials.copper, [97, -3, 57]);

  const heatpipes = makeGroup(cooling, "cooling.heatpipes", "Heatpipe group · illustrative");
  const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0xb97845, metalness: 0.78, roughness: 0.32 });
  const pipeCurves = [
    [[76, -4, 57], [62, -2.5, 61], [50, -1, 64], [40, 0, 65]],
    [[118, -4, 57], [132, -2.5, 61], [145, -1, 64], [158, 0, 65]]
  ];
  pipeCurves.forEach((points, index) => {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, 1.7, 8, false), pipeMaterial);
    pipe.name = `Illustrative heatpipe ${index + 1}`;
    heatpipes.add(pipe);
  });

  makeMesh(pcbAssembly, "chip.gpu.ga106", "GPU package proxy",
    new THREE.BoxGeometry(40, 5, 40), materials.chip, [97, 14, 57], "teardown_supported");

  const powerStage = makeGroup(pcbAssembly, "assembly.power_stage", "Power conversion zone · proxy", [145, 13.5, 78]);
  const stageMaterial = new THREE.MeshStandardMaterial({ color: 0x555c64, metalness: 0.28, roughness: 0.5 });
  const stageParts = [
    [[-10, 0, -5], [7, 4, 8]], [[1, 0, -5], [7, 4, 8]], [[12, 0, -5], [7, 4, 8]],
    [[-8, 0, 6], [4, 5, 5]], [[0, 0, 6], [4, 5, 5]], [[8, 0, 6], [4, 5, 5]]
  ];
  stageParts.forEach(([position, size]) => {
    const part = new THREE.Mesh(new THREE.BoxGeometry(...size), stageMaterial);
    part.position.set(...position);
    part.name = "Unidentified power-stage proxy";
    powerStage.add(part);
  });
  for (let index = 0; index < 6; index += 1) {
    makeMesh(pcbAssembly, `chip.memory.candidate.${index + 1}`, `GDDR6 candidate ${index + 1}`,
      new THREE.BoxGeometry(14, 4, 12), materials.memory,
      [50 + index * 16, 14, 57]);
  }

  makeMesh(connectors, "connector.power.8pin", "8-pin power connector proxy",
    new THREE.BoxGeometry(22, 8, 10), materials.chip, [145, 16, 105], "manufacturer_data");
  makeMesh(connectors, "connector.io.bracket", "I/O bracket proxy",
    new THREE.BoxGeometry(2, 36, 110), materials.metal, [1, 0, 55], "manufacturer_data");
  makeMesh(connectors, "connector.io.panel", "Display output panel proxy",
    new THREE.BoxGeometry(3, 29, 48), materials.shroud, [1.5, 0, 53]);

  return root;
}

function getNodeId(object) {
  let current = object;
  while (current && current !== state.modelRoot) {
    const id = current.userData?.sbs_component_id;
    if (id) return id;
    current = current.parent;
  }
  return null;
}

function findNodeById(id) {
  return state.componentNodes.get(id) ?? null;
}

function collectNodes(root) {
  state.componentNodes.clear();
  state.modelWarnings = [];
  root.traverse((object) => {
    const id = object.userData?.sbs_component_id;
    if (id && state.componentNodes.has(id)) state.modelWarnings.push(id);
    else if (id) state.componentNodes.set(id, object);
  });
  $("#component-count").textContent = String(state.componentNodes.size);
  $("#scene-stats").textContent = `${state.componentNodes.size} ${t("componentsCount").toUpperCase()}`;
  renderTree();
}

function getComponentData(id, object) {
  const known = state.catalog.get(id);
  if (known) return known;
  const evidence = object?.userData?.sbs_evidence_status ?? "illustrative";
  return {
    id,
    parent: getNodeId(object?.parent),
    category: object?.type === "Group" ? "assembly" : "component",
    en: object?.name ?? id,
    ru: object?.name ?? id,
    descriptionEn: "Imported GLB node. No additional component description is supplied in the model manifest.",
    descriptionRu: "Узел импортированного GLB. В манифесте нет дополнительного описания компонента.",
    evidence,
    geometry: object?.userData?.sbs_geometry_status ?? "unknown",
    sourceIds: []
  };
}

function renderTree() {
  const host = $("#component-tree");
  if (!host) return;
  const query = $("#component-search").value.trim().toLocaleLowerCase();
  host.replaceChildren();

  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  const entries = [...state.componentNodes.entries()].map(([id, object]) => {
    const data = getComponentData(id, object);
    const label = state.language === "ru" ? data.ru : data.en;
    let depth = 0;
    let parent = object.parent;
    while (parent && parent !== state.modelRoot) {
      if (parent.userData?.sbs_component_id) depth += 1;
      parent = parent.parent;
    }

    const isDeviceRoot = id === "assembly.card.root";
    const claims = (CLAIM_PACKAGE.claims ?? []).filter((claim) =>
      claim.subject_id === id || (isDeviceRoot && claim.subject_id === MODEL.id)
    );
    const claimText = claims.flatMap((claim) => [
      claim.id,
      claim.predicate,
      claimPredicateLabel(claim.predicate),
      formatClaimValue(claim.value),
      claim.value === null || claim.value === undefined ? "" : JSON.stringify(claim.value),
      claim.unit,
      claim.confidence_class,
      claim.notes,
      ...(claim.source_ids ?? [])
    ]);
    const sourceIds = new Set([
      ...(data.sourceIds ?? []),
      ...claims.flatMap((claim) => claim.source_ids ?? [])
    ]);
    const sources = [...sourceIds].map((sourceId) => sourceMap.get(sourceId)).filter(Boolean);
    const sourceText = sources.flatMap((source) => [source.id, source.label, source.url]);
    const searchText = [
      id, data.en, data.ru, data.descriptionEn, data.descriptionRu,
      ...claimText, ...sourceText
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    const matches = !query || searchText.includes(query);
    return { id, object, data, label, depth, matches };
  });

  // Keep parent assemblies visible as context when a child matches the query.
  const visibleIds = new Set(entries.filter((entry) => entry.matches).map((entry) => entry.id));
  if (query) {
    for (const entry of entries.filter((item) => item.matches)) {
      let parent = entry.object.parent;
      while (parent) {
        const parentId = parent.userData?.sbs_component_id;
        if (parentId) visibleIds.add(parentId);
        if (parent === state.modelRoot) break;
        parent = parent.parent;
      }
    }
  }
  const visibleEntries = entries.filter((entry) => !query || visibleIds.has(entry.id));
  visibleEntries.sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));

  visibleEntries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tree-item${entry.id === state.selectedId ? " active" : ""}`;
    button.classList.add(`depth-${Math.min(entry.depth, 5)}`);
    if (query && entry.matches) button.classList.add("search-match");
    else if (query) button.classList.add("search-context");
    button.dataset.id = entry.id;
    const symbol = document.createElement("span");
    symbol.className = "tree-symbol";
    symbol.textContent = entry.object.type === "Group" ? "▸" : "·";
    const label = document.createElement("span");
    label.className = "tree-label";
    label.textContent = entry.label;
    const kind = document.createElement("span");
    kind.className = "tree-kind";
    kind.textContent = entry.object.type === "Group" ? "ASM" : "3D";
    if (query && entry.matches) {
      const match = document.createElement("span");
      match.className = "tree-match-tag";
      match.textContent = "MATCH";
      button.append(symbol, label, match, kind);
    } else {
      button.append(symbol, label, kind);
    }
    button.addEventListener("click", () => selectComponent(entry.id));
    host.append(button);
  });
}


function claimPredicateLabel(predicate) {
  const labels = {
    memory_capacity: ["Объём памяти", "Memory capacity"],
    memory_type: ["Тип памяти", "Memory type"],
    memory_bus_width: ["Ширина шины памяти", "Memory bus width"],
    cuda_core_count: ["Количество CUDA-ядер", "CUDA core count"],
    boost_clock: ["Boost-частота", "Boost clock"],
    memory_bandwidth: ["Пропускная способность памяти", "Memory bandwidth"],
    nominal_length: ["Номинальная длина", "Nominal length"],
    overall_outer_length: ["Полная длина кожуха", "Overall outer length"],
    height: ["Высота", "Height"],
    axial_fan_count: ["Количество осевых вентиляторов", "Axial fan count"],
    fan_opening_diameter: ["Диаметр отверстия вентилятора", "Fan opening diameter"],
    fan_impeller_diameter: ["Диаметр крыльчатки", "Fan impeller diameter"],
    auxiliary_power_connector: ["Дополнительный разъём питания", "Auxiliary power connector"],
    display_outputs: ["Видеовыходы", "Display outputs"],
    backplate_present: ["Наличие задней пластины", "Backplate present"],
    pcb_revision: ["Ревизия печатной платы", "PCB revision"],
    gddr6_package_population: ["Количество микросхем GDDR6", "GDDR6 package population"],
    heatsink_fin_count: ["Количество рёбер радиатора", "Heatsink fin count"],
    gddr6_package_part_number: ["Маркировка микросхем памяти", "GDDR6 package part number"]
  };
  const label = labels[predicate];
  return label ? label[state.language === "ru" ? 0 : 1] : String(predicate ?? "").replaceAll("_", " ");
}

function formatClaimValue(value) {
  if (value === null || value === undefined) return t("claimUnknown");
  if (typeof value === "boolean") return value ? t("yes") : t("no");
  if (typeof value === "object") {
    return Object.entries(value).map(([key, entry]) => `${key}: ${String(entry)}`).join(" · ");
  }
  return String(value);
}

function renderClaims(componentId) {
  const section = $("#detail-claims-section");
  const host = $("#claim-list");
  if (!section || !host) return;
  host.replaceChildren();
  const modelLevel = componentId === "assembly.card.root";
  const claims = (CLAIM_PACKAGE.claims ?? []).filter((claim) =>
    claim.subject_id === componentId || (modelLevel && claim.subject_id === MODEL.id)
  );
  section.hidden = claims.length === 0;
  if (!claims.length) return;

  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  claims.forEach((claim) => {
    const card = document.createElement("article");
    card.className = "claim-card";
    card.dataset.claimId = claim.id;

    const heading = document.createElement("strong");
    heading.className = "claim-title";
    heading.textContent = claimPredicateLabel(claim.predicate);

    const value = document.createElement("div");
    value.className = "claim-value";
    value.textContent = [formatClaimValue(claim.value), claim.unit].filter(Boolean).join(" ");

    const evidence = EVIDENCE[claim.confidence_class] ?? EVIDENCE.unknown;
    const confidence = document.createElement("span");
    confidence.className = "claim-confidence";
    confidence.textContent = evidence[state.language] ?? evidence.en;

    card.append(heading, value, confidence);

    if (claim.notes) {
      const note = document.createElement("p");
      note.className = "claim-note";
      note.textContent = claim.notes;
      card.append(note);
    }

    const sources = (claim.source_ids ?? []).map((sourceId) => sourceMap.get(sourceId)).filter((source) => source?.url);
    if (sources.length) {
      const sourceList = document.createElement("div");
      sourceList.className = "claim-sources";
      sources.forEach((source) => {
        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `↗ ${source.label}`;
        sourceList.append(link);
      });
      card.append(sourceList);
    }
    host.append(card);
  });
}


function relationshipLabel(type, outgoing) {
  const labels = {
    contains: { out: ["Содержит", "Contains"], in: ["Входит в", "Part of"] },
    mounted_in: { out: ["Установлен в", "Mounted in"], in: ["Содержит установленный узел", "Contains mounted component"] },
    fastened_to: { out: ["Закреплён на", "Fastened to"], in: ["Служит точкой крепления", "Fastened by"] },
    connected_to: { out: ["Соединён с", "Connected to"], in: ["Соединён с", "Connected to"] },
    powered_by: { out: ["Питается от", "Powered by"], in: ["Питает", "Powers"] },
    signals_to: { out: ["Передаёт сигнал", "Signals to"], in: ["Получает сигнал от", "Receives signal from"] },
    drives: { out: ["Приводит в действие", "Drives"], in: ["Приводится в действие", "Driven by"] },
    cooled_by: { out: ["Охлаждается с помощью", "Cooled by"], in: ["Охлаждает", "Cools"] },
    transfers_heat_to: { out: ["Передаёт тепло к", "Transfers heat to"], in: ["Получает тепло от", "Receives heat from"] },
    airflow_over: { out: ["Направляет поток на", "Moves airflow over"], in: ["Обдувается потоком от", "Receives airflow from"] },
    depends_on: { out: ["Зависит от", "Depends on"], in: ["Является зависимостью для", "Is a dependency for"] }
  };
  const entry = labels[type];
  if (!entry) return String(type ?? "").replaceAll("_", " ");
  return entry[outgoing ? "out" : "in"][state.language === "ru" ? 0 : 1];
}

function renderRelationships(componentId) {
  const section = $("#detail-relations-section");
  const host = $("#relationship-list");
  if (!section || !host) return;
  host.replaceChildren();

  const relations = (RELATIONSHIP_PACKAGE.relationships ?? []).filter((relation) =>
    relation.from === componentId || relation.to === componentId
  );
  section.hidden = relations.length === 0;
  if (!relations.length) return;

  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  relations.forEach((relation) => {
    const outgoing = relation.from === componentId;
    const neighborId = outgoing ? relation.to : relation.from;
    const neighbor = state.catalog.get(neighborId);
    const neighborObject = findNodeById(neighborId);
    const neighborName = neighbor
      ? (state.language === "ru" ? neighbor.ru : neighbor.en)
      : neighborObject?.name ?? neighborId;

    const card = document.createElement("article");
    card.className = "relationship-card";
    card.dataset.relationshipId = relation.id;

    const heading = document.createElement("div");
    heading.className = "relationship-type";
    heading.textContent = relationshipLabel(relation.type, outgoing);

    const link = document.createElement("button");
    link.type = "button";
    link.className = "relationship-component-link";
    link.dataset.componentId = neighborId;
    link.textContent = neighborName;
    link.disabled = !neighborObject;
    link.addEventListener("click", () => {
      if (neighborObject) selectComponent(neighborId);
    });

    const direction = document.createElement("span");
    direction.className = "relationship-direction";
    direction.textContent = outgoing ? "→" : "←";

    const target = document.createElement("div");
    target.className = "relationship-target";
    target.append(direction, link);
    card.append(heading, target);

    if (relation.certainty) {
      const certainty = document.createElement("span");
      certainty.className = "relationship-certainty";
      certainty.textContent = relation.certainty === "qualitative"
        ? t("qualitativeRelation")
        : String(relation.certainty).replaceAll("_", " ");
      card.append(certainty);
    }

    const sources = (relation.source_ids ?? []).map((sourceId) => sourceMap.get(sourceId)).filter((source) => source?.url);
    if (sources.length) {
      const sourceList = document.createElement("div");
      sourceList.className = "relationship-sources";
      sources.forEach((source) => {
        const sourceLink = document.createElement("a");
        sourceLink.href = source.url;
        sourceLink.target = "_blank";
        sourceLink.rel = "noopener noreferrer";
        sourceLink.textContent = `↗ ${source.label}`;
        sourceList.append(sourceLink);
      });
      card.append(sourceList);
    } else {
      const noSource = document.createElement("span");
      noSource.className = "relationship-no-source";
      noSource.textContent = t("noRelationshipSource");
      card.append(noSource);
    }

    host.append(card);
  });
}

function renderDetails(id) {
  state.learningMode = false;
  $("#learning-panel").hidden = true;
  $("#process-details").hidden = true;
  $("#details-heading-eyebrow").textContent = t("inspection");
  $("#details-heading-title").textContent = t("componentDetails");
  const object = findNodeById(id);
  const data = getComponentData(id, object);
  const label = state.language === "ru" ? data.ru : data.en;
  const description = state.language === "ru" ? data.descriptionRu : data.descriptionEn;
  const evidence = EVIDENCE[data.evidence] ?? EVIDENCE.illustrative;

  $("#empty-selection").hidden = true;
  $("#component-details").hidden = false;
  $("#detail-index").textContent = String([...state.componentNodes.keys()].indexOf(id) + 1).padStart(2, "0");
  $("#detail-category").textContent = (data.category ?? "component").replaceAll("_", " ").toUpperCase();
  $("#detail-name").textContent = label;
  $("#detail-description").textContent = description;
  $("#detail-id").textContent = id;
  $("#detail-parent").textContent = data.parent ?? "—";
  $("#detail-geometry").textContent = data.geometry ?? "unknown";
  $("#evidence-badge").textContent = evidence[state.language].toUpperCase();
  $("#evidence-copy").textContent = evidence[state.language === "ru" ? "copyRu" : "copyEn"];
  renderClaims(id);
  renderRelationships(id);
  $("#rotate-component").disabled = !object || !state.sceneController;

  const sourceHost = $("#source-links");
  sourceHost.replaceChildren();
  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  const sourceList = (data.sourceIds ?? []).map((sourceId) => sourceMap.get(sourceId)).filter(Boolean);
  sourceList.forEach((source) => {
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `↗ ${source.label}`;
    sourceHost.append(link);
  });
}

function showLearning() {
  clearHighlights();
  state.activeLayer = null;
  document.querySelectorAll(".process-button").forEach((button) => button.classList.remove("active"));
  $("#process-details").hidden = true;
  buildProcessVisuals();
  state.learningMode = true;
  state.learningIndex = 0;
  state.learningScore = 0;
  state.learningSelected = null;
  state.learningAnswered = false;
  state.learningComplete = false;
  $("#empty-selection").hidden = true;
  $("#component-details").hidden = true;
  $("#learning-panel").hidden = false;
  $("#details-heading-eyebrow").textContent = t("learning");
  $("#details-heading-title").textContent = t("learn");
  renderLearning();
}

function renderLearning() {
  const questions = LEARNING_PACKAGE.questions ?? [];
  const panel = $("#learning-panel");
  if (!panel || !state.learningMode) return;
  panel.hidden = false;
  $("#quiz-sources").replaceChildren();

  if (state.learningComplete) {
    $("#quiz-progress").textContent = `${questions.length} / ${questions.length}`;
    $("#quiz-score").textContent = `${t("yourScore")}: ${state.learningScore} / ${questions.length}`;
    $("#quiz-question").textContent = t("quizComplete");
    $("#quiz-choices").replaceChildren();
    $("#quiz-feedback").textContent = `${state.learningScore} / ${questions.length}`;
    $("#quiz-next").disabled = false;
    $("#quiz-next").textContent = t("restartQuiz");
    return;
  }

  const question = questions[state.learningIndex];
  $("#quiz-progress").textContent = `${String(state.learningIndex + 1).padStart(2, "0")} / ${String(questions.length).padStart(2, "0")}`;
  $("#quiz-score").textContent = `${t("yourScore")}: ${state.learningScore}`;
  $("#quiz-question").textContent = question.prompt[state.language];
  $("#quiz-feedback").textContent = state.learningAnswered
    ? question.explanation[state.language]
    : "";
  $("#quiz-choices").replaceChildren();

  question.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-choice";
    button.textContent = choice[state.language];
    button.setAttribute("aria-pressed", String(state.learningSelected === index));
    if (state.learningSelected === index) button.classList.add("selected");
    if (state.learningAnswered && index === question.correct_index) button.classList.add("correct");
    if (state.learningAnswered && state.learningSelected === index && index !== question.correct_index) button.classList.add("incorrect");
    button.disabled = state.learningAnswered;
    button.addEventListener("click", () => {
      state.learningSelected = index;
      renderLearning();
    });
    $("#quiz-choices").append(button);
  });

  if (state.learningAnswered) {
    $("#quiz-feedback").classList.toggle("correct-copy", state.learningSelected === question.correct_index);
    $("#quiz-feedback").classList.toggle("incorrect-copy", state.learningSelected !== question.correct_index);
    $("#quiz-feedback").textContent = `${state.learningSelected === question.correct_index ? t("correctAnswer") : t("wrongAnswer")} — ${question.explanation[state.language]}`;
  } else {
    $("#quiz-feedback").classList.remove("correct-copy", "incorrect-copy");
  }

  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  (question.source_ids ?? []).forEach((sourceId) => {
    const source = sourceMap.get(sourceId);
    if (!source) return;
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `↗ ${source.label}`;
    $("#quiz-sources").append(link);
  });

  $("#quiz-next").disabled = !state.learningAnswered && state.learningSelected === null;
  $("#quiz-next").textContent = !state.learningAnswered
    ? t("checkAnswer")
    : state.learningIndex === questions.length - 1 ? t("finishQuiz") : t("nextQuestion");
}

function submitLearningAnswer() {
  const questions = LEARNING_PACKAGE.questions ?? [];
  if (state.learningComplete) {
    state.learningIndex = 0;
    state.learningScore = 0;
    state.learningSelected = null;
    state.learningAnswered = false;
    state.learningComplete = false;
    renderLearning();
    return;
  }
  const question = questions[state.learningIndex];
  if (!state.learningAnswered) {
    if (state.learningSelected === null) return;
    if (state.learningSelected === question.correct_index) state.learningScore += 1;
    state.learningAnswered = true;
    renderLearning();
    return;
  }
  if (state.learningIndex >= questions.length - 1) {
    state.learningComplete = true;
  } else {
    state.learningIndex += 1;
    state.learningSelected = null;
    state.learningAnswered = false;
  }
  renderLearning();
}

function renderProcessLayer() {
  const layer = PROCESS_PACKAGE.process_layers.find((item) => item.type === state.activeLayer);
  if (!layer) return;
  state.learningMode = false;
  $("#learning-panel").hidden = true;
  $("#component-details").hidden = true;
  $("#empty-selection").hidden = true;
  $("#process-details").hidden = false;
  $("#details-heading-eyebrow").textContent = t("processLayer");
  $("#details-heading-title").textContent = state.language === "ru" ? layer.title.ru : layer.title.en;
  $("#process-detail-type").textContent = layer.type.replaceAll("_", " ").toUpperCase();
  $("#process-detail-title").textContent = state.language === "ru" ? layer.title.ru : layer.title.en;
  $("#process-detail-description").textContent = state.language === "ru" ? layer.description.ru : layer.description.en;

  const componentHost = $("#process-components");
  componentHost.replaceChildren();
  (layer.linked_component_ids ?? []).forEach((id) => {
    const object = findNodeById(id);
    const data = getComponentData(id, object);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "process-component-chip";
    button.textContent = state.language === "ru" ? data.ru : data.en;
    button.addEventListener("click", () => selectComponent(id));
    componentHost.append(button);
  });

  const assumptions = $("#process-assumptions");
  assumptions.replaceChildren();
  (layer.assumptions ?? []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    assumptions.append(li);
  });

  const sourceHost = $("#process-sources");
  sourceHost.replaceChildren();
  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  (layer.source_ids ?? []).forEach((id) => {
    const source = sourceMap.get(id);
    if (!source) return;
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `↗ ${source.label}`;
    sourceHost.append(link);
  });
}

function applyHighlight(object, color = 0xc3e86d) {
  if (!object || object.userData.__sbsHighlighted) return;
  object.userData.__sbsOriginalMaterial = object.material;
  const clone = (material) => {
    if (!material) return material;
    const copy = material.clone();
    if (copy.emissive) {
      copy.emissive.setHex(color);
      copy.emissiveIntensity = 0.45;
    }
    return copy;
  };
  object.material = Array.isArray(object.material)
    ? object.material.map(clone)
    : clone(object.material);
  object.userData.__sbsHighlighted = true;
}

function clearHighlights() {
  state.modelRoot?.traverse((object) => {
    if (object.userData.__sbsHighlighted) {
      object.material = object.userData.__sbsOriginalMaterial;
      delete object.userData.__sbsOriginalMaterial;
      delete object.userData.__sbsHighlighted;
    }
  });
}

function selectComponent(id) {
  const object = findNodeById(id);
  if (!object) return;
  clearHighlights();
  state.activeLayer = null;
  buildProcessVisuals();
  document.querySelectorAll(".process-button").forEach((button) => button.classList.remove("active"));
  $("#process-details").hidden = true;
  state.learningMode = false;
  state.selected = object;
  state.selectedId = id;
  object.traverse((child) => { if (child.isMesh) applyHighlight(child); });
  if (object.isMesh) applyHighlight(object);
  renderDetails(id);
  renderTree();
  setStatus(id);
}

function setCameraPreset(preset) {
  if (!state.camera || !state.controls || !state.modelRoot) return;
  const directions = {
    isometric: null,
    fan: new THREE.Vector3(0, -1, 0.08),
    pcb: new THREE.Vector3(0, 1, 0.08),
    io: new THREE.Vector3(-1, 0, 0.08),
    power: new THREE.Vector3(1, 0, 0.08),
    top: new THREE.Vector3(0, 0, 1)
  };
  const selected = Object.hasOwn(directions, preset) ? preset : "isometric";
  state.camera.up.set(0, 0, 1);
  if (selected === "isometric" && state.cameraHome) {
    state.camera.position.copy(state.cameraHome.position);
    state.controls.target.copy(state.cameraHome.target);
  } else {
    const bounds = new THREE.Box3().setFromObject(state.modelRoot);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const span = Math.max(size.x, size.y, size.z, 100);
    const direction = directions[selected].clone().normalize();
    if (selected === "top") state.camera.up.set(0, -1, 0);
    state.controls.target.copy(center);
    state.camera.position.copy(center).addScaledVector(direction, Math.max(160, span * 1.85));
  }
  state.camera.lookAt(state.controls.target);
  state.camera.updateProjectionMatrix();
  state.controls.update();
  state.cameraPreset = selected;
  const selector = $("#camera-preset");
  if (selector) selector.value = selected;
  canvasHost.dataset.cameraPreset = selected;
}

function resetCamera() {
  setCameraPreset("isometric");
}

function updateSlicePlane() {
  if (!state.renderer || !state.modelRoot) return;
  if (!state.sliceEnabled) {
    state.renderer.clippingPlanes = [];
    canvasHost.dataset.slicePlaneCount = "0";
    canvasHost.dataset.sliceEnabled = "false";
    return;
  }
  const bounds = new THREE.Box3().setFromObject(state.modelRoot);
  const axisIndex = { x: 0, y: 1, z: 2 }[state.sliceAxis] ?? 0;
  const minimum = bounds.min.getComponent(axisIndex);
  const maximum = bounds.max.getComponent(axisIndex);
  const position = minimum + (maximum - minimum) * state.sliceFraction;
  const normal = new THREE.Vector3(
    state.sliceAxis === "x" ? 1 : 0,
    state.sliceAxis === "y" ? 1 : 0,
    state.sliceAxis === "z" ? 1 : 0
  );
  state.slicePlane.normal.copy(normal);
  state.slicePlane.constant = -position;
  state.renderer.clippingPlanes = [state.slicePlane];
  canvasHost.dataset.slicePlaneCount = "1";
  canvasHost.dataset.sliceEnabled = "true";
  canvasHost.dataset.sliceAxis = state.sliceAxis;
  canvasHost.dataset.sliceFraction = String(Number(state.sliceFraction.toFixed(2)));
}

function setSliceEnabled(enabled) {
  state.sliceEnabled = Boolean(enabled);
  const button = $("#slice-toggle");
  if (button) {
    button.classList.toggle("active", state.sliceEnabled);
    button.setAttribute("aria-pressed", String(state.sliceEnabled));
  }
  $("#slice-axis").disabled = !state.sliceEnabled;
  $("#slice-position").disabled = !state.sliceEnabled;
  updateSlicePlane();
}

function updateSlicePosition(value) {
  state.sliceFraction = THREE.MathUtils.clamp(Number(value) / 100, 0, 1);
  $("#slice-position").value = String(Math.round(state.sliceFraction * 100));
  $("#slice-value").textContent = `${Math.round(state.sliceFraction * 100)}%`;
  updateSlicePlane();
}

function updateExplodeUi(value) {
  state.exploded = Math.max(0, Math.min(100, Number(value)));
  $("#explode-slider").value = String(state.exploded);
  $("#explode-value").textContent = `${Math.round(state.exploded)}%`;
  $("#model-state").textContent = state.powered ? t("operatingState") : (state.exploded ? t("exploded") : t("assembledState"));
}

function setExplode(value) {
  if (!state.sceneController) return;
  state.sceneController.setExplode(value);
  updateExplodeUi(value);
}

async function animateExplodeCycle() {
  if (!state.sceneController) return;
  const controller = state.sceneController;
  const button = $("#animate-button");
  button.disabled = true;
  try {
    const expanded = await controller.animateExplode(100, 950, updateExplodeUi);
    if (expanded) await controller.animateExplode(0, 950, updateExplodeUi);
  } finally {
    button.disabled = false;
  }
}

function setIsolated(isolate) {
  if (!state.selected || !state.sceneController) return;
  state.isolated = Boolean(isolate);
  state.sceneController.setIsolated(state.selected, state.isolated);
  $("#isolate-toggle").classList.toggle("active", state.isolated);
  setStatus(state.isolated ? t("isolate") : t("allVisible"));
}

function disposeProcessVisuals() {
  if (state.processVisuals) {
    state.processVisuals.traverse((object) => {
      object.geometry?.dispose();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => material.dispose());
    });
    state.scene?.remove(state.processVisuals);
  }
  state.processVisuals = null;
  state.flowParticles = [];
  if (canvasHost) canvasHost.dataset.processVisuals = "none";
}

function addProcessPath(points, color, { count = 5, radius = 0.65, speed = 0.23 } = {}) {
  if (!state.processVisuals || points.length < 2) return;
  const curve = new THREE.CatmullRomCurve3(points.map((point) => point.clone()));
  const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 64, radius, 7, false),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.48, depthWrite: false }));
  line.renderOrder = 4;
  state.processVisuals.add(line);
  for (let index = 0; index < count; index += 1) {
    const phase = index / count;
    const particle = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.75, 10, 8),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, depthWrite: false }));
    particle.position.copy(curve.getPointAt(phase));
    particle.renderOrder = 5;
    state.processVisuals.add(particle);
    state.flowParticles.push({ mesh: particle, curve, phase, speed });
  }
}

function buildProcessVisuals() {
  disposeProcessVisuals();
  if (!state.scene || !state.modelRoot) return;
  const airflowVisible = state.activeLayer === "cooling" || state.powered;
  const powerVisible = state.activeLayer === "power_delivery" || state.powered;
  if (!airflowVisible && !powerVisible) return;
  const group = new THREE.Group();
  group.name = "Screw by Screw · qualitative process overlays";
  group.userData.sbs_overlay = true;
  state.processVisuals = group;
  state.scene.add(group);
  if (airflowVisible) {
    for (const id of ["assembly.fan.1", "assembly.fan.2"]) {
      const fan = findNodeById(id);
      if (!fan) continue;
      const center = fan.getWorldPosition(new THREE.Vector3());
      const spread = id.endsWith(".1") ? -3.5 : 3.5;
      addProcessPath([
        center.clone().add(new THREE.Vector3(0, -10, -2)),
        center.clone().add(new THREE.Vector3(spread, -4, 0)),
        center.clone().add(new THREE.Vector3(spread * 1.5, 5, 2)),
        center.clone().add(new THREE.Vector3(spread * 1.8, 13, 5))
      ], 0x65c9ee, { count: 5, radius: 0.58, speed: 0.25 });
    }
  }
  if (powerVisible) {
    const connector = findNodeById("connector.power.8pin");
    const stage = findNodeById("assembly.power_stage");
    const gpu = findNodeById("chip.gpu.ga106");
    if (connector && gpu) {
      const start = connector.getWorldPosition(new THREE.Vector3());
      const finish = gpu.getWorldPosition(new THREE.Vector3());
      const middle = stage?.getWorldPosition(new THREE.Vector3()) ?? start.clone().lerp(finish, 0.55);
      addProcessPath([start, start.clone().lerp(middle, 0.32).add(new THREE.Vector3(0, 0, -3)), middle,
        middle.clone().lerp(finish, 0.58).add(new THREE.Vector3(0, 0, 2)), finish],
        0xf1bd62, { count: 6, radius: 0.82, speed: 0.2 });
    }
  }
  const active = [airflowVisible ? "airflow" : null, powerVisible ? "power" : null].filter(Boolean);
  canvasHost.dataset.processVisuals = active.join(",") || "none";
}

function collectFanRotors(root) {
  state.fanRotors = [];
  const authoredPivots = [];
  root.traverse((object) => {
    if (object.userData?.sbs_fan_rotor !== true) return;
    const axis = String(object.userData.sbs_fan_axis ?? "y").toLowerCase();
    if (["x", "y", "z"].includes(axis)) authoredPivots.push({ object, axis });
  });

  if (authoredPivots.length) {
    state.fanRotors = authoredPivots;
  } else {
    // Older Blender GLBs contain individually tagged blade meshes. Reparent
    // them under a runtime-only pivot at the fan centre so the shroud and hub
    // remain still while the entire impeller rotates as one assembly.
    for (const fanNumber of [1, 2]) {
      const fan = findNodeById(`assembly.fan.${fanNumber}`);
      if (!fan) continue;
      const blades = [];
      fan.traverse((object) => {
        if (new RegExp(`^fan\\.${fanNumber}\\.blade\\.`).test(object.userData?.sbs_component_id ?? "")) {
          blades.push(object);
        }
      });
      if (!blades.length) continue;
      const pivot = new THREE.Group();
      pivot.name = `Fan ${fanNumber} runtime rotor pivot`;
      fan.add(pivot);
      fan.updateMatrixWorld(true);
      blades.forEach((blade) => pivot.attach(blade));
      state.fanRotors.push({ object: pivot, axis: "y" });
    }
  }
  canvasHost.dataset.fanRotors = String(state.fanRotors.length);
  canvasHost.dataset.fanSpin = "false";
  canvasHost.dataset.flowMotion = "false";
}

function updateOperatingEffects(delta) {
  if (!state.powered || state.reducedMotion) {
    canvasHost.dataset.fanSpin = "false";
    canvasHost.dataset.flowMotion = "false";
    return;
  }
  const rotation = delta * 10.5 * state.simulationSpeed;
  state.fanRotors.forEach(({ object, axis }) => { object.rotation[axis] += rotation; });
  state.flowParticles.forEach((particle) => {
    particle.phase = (particle.phase + delta * particle.speed * state.simulationSpeed) % 1;
    particle.mesh.position.copy(particle.curve.getPointAt(particle.phase));
  });
  const spinning = state.fanRotors.some(({ object, axis }) => Math.abs(object.rotation[axis]) > 0.01);
  canvasHost.dataset.fanSpin = String(spinning);
  canvasHost.dataset.flowMotion = String(state.flowParticles.length > 0);
}

function setPowered(enabled) {
  state.powered = Boolean(enabled);
  const button = $("#power-toggle");
  if (button) {
    button.textContent = t(state.powered ? "powerOff" : "powerOn");
    button.classList.toggle("active", state.powered);
    button.setAttribute("aria-pressed", String(state.powered));
  }
  document.body.dataset.sbsPowered = String(state.powered);
  if (!state.powered || state.reducedMotion) {
    canvasHost.dataset.fanSpin = "false";
    canvasHost.dataset.flowMotion = "false";
  }
  if (state.powered && !state.activeLayer) setLayer("cooling");
  else buildProcessVisuals();
  if (state.powered) {
    $("#model-state").textContent = t("operatingState");
    setStatus(state.reducedMotion ? "Power on · reduced motion" : "Power on · fan and flow animation");
  } else {
    updateExplodeUi(state.exploded);
    setStatus(t("ready"));
  }
}

function setSimulationSpeed(value) {
  state.simulationSpeed = THREE.MathUtils.clamp(Number(value) || 1, 0.25, 2);
  const output = $("#simulation-speed-value");
  if (output) output.textContent = `${state.simulationSpeed.toFixed(2)}×`;
}

function setLayer(layer) {
  if (!state.modelRoot) return;
  clearHighlights();
  state.activeLayer = layer === "clear" || state.activeLayer === layer ? null : layer;
  document.querySelectorAll(".process-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.layer === state.activeLayer);
  });
  if (!state.activeLayer) {
    state.learningMode = false;
    $("#learning-panel").hidden = true;
    $("#process-details").hidden = true;
    if (state.selectedId) renderDetails(state.selectedId);
    else {
      $("#empty-selection").hidden = false;
      $("#component-details").hidden = true;
    }
    buildProcessVisuals();
    setStatus(t("ready"));
    return;
  }
  const layerData = PROCESS_PACKAGE.process_layers.find((item) => item.type === state.activeLayer);
  const linkedIds = new Set(layerData?.linked_component_ids ?? []);
  const matches = [];
  state.modelRoot.traverse((object) => {
    const id = object.userData?.sbs_component_id;
    if (id && linkedIds.has(id)) matches.push(object);
  });
  matches.forEach((object) => {
    const color = state.activeLayer === "cooling" ? 0x6bc8e8 : 0xe8b75e;
    if (object.isMesh) applyHighlight(object, color);
    else object.traverse((child) => { if (child.isMesh) applyHighlight(child, color); });
  });
  buildProcessVisuals();
  renderProcessLayer();
  setStatus(t(state.activeLayer === "cooling" ? "layerCooling" : "layerPower"));
}

function fitModel(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 100);
  if (state.gridHelper) {
    state.gridHelper.position.set(center.x, center.y, box.min.z - maxDimension * 0.08);
    state.gridHelper.scale.setScalar(maxDimension / 100);
  }
  state.controls.target.copy(center);
  state.camera.position.copy(center).add(new THREE.Vector3(maxDimension * 1.35, maxDimension * 1.0, maxDimension * 1.25));
  state.controls.minDistance = Math.max(0.01, maxDimension * 0.08);
  state.controls.maxDistance = maxDimension * 30;
  state.camera.near = Math.max(0.001, maxDimension / 1000);
  state.camera.far = maxDimension * 40;
  state.camera.updateProjectionMatrix();
  state.controls.update();
  state.cameraHome = {
    position: state.camera.position.clone(),
    target: center.clone()
  };
  setCameraPreset("isometric");
  updateSlicePlane();
}

function disposeModel(root) {
  if (!root) return;
  root.traverse((object) => {
    if (object.geometry) object.geometry.dispose();
    if (object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material.dispose());
    }
  });
  state.scene.remove(root);
}

function installModel(root, mode) {
  if (state.sceneController) state.sceneController.reset();
  disposeProcessVisuals();
  state.measurementController?.clear();
  state.measurementController?.setUnit(MODEL.units ?? null);
  state.measurementEnabled = false;
  const measurementButton = $("#measurement-toggle");
  if (measurementButton) {
    measurementButton.classList.remove("active");
    measurementButton.setAttribute("aria-pressed", "false");
    measurementButton.disabled = !root;
  }
  if (canvasHost) {
    canvasHost.dataset.measurementEnabled = "false";
    canvasHost.dataset.measurementPoints = "0";
  }
  updateMeasurementReadout();
  state.powered = false;
  const powerButton = $("#power-toggle");
  if (powerButton) {
    powerButton.textContent = t("powerOn");
    powerButton.classList.remove("active");
    powerButton.setAttribute("aria-pressed", "false");
  }
  document.body.dataset.sbsPowered = "false";
  state.cameraPreset = "isometric";
  state.sliceEnabled = false;
  state.sliceAxis = "x";
  state.sliceFraction = 0.5;
  const cameraSelector = $("#camera-preset");
  if (cameraSelector) cameraSelector.value = "isometric";
  const sliceAxis = $("#slice-axis");
  const slicePosition = $("#slice-position");
  if (sliceAxis) sliceAxis.value = "x";
  if (slicePosition) slicePosition.value = "50";
  const sliceValue = $("#slice-value");
  if (sliceValue) sliceValue.textContent = "50%";
  setSliceEnabled(false);
  state.sceneController = null;
  if (state.modelRoot) disposeModel(state.modelRoot);
  state.modelRoot = root;
  state.modelRevision += 1;
  state.scene.add(root);
  state.sourceMode = mode;
  state.selected = null;
  state.selectedId = null;
  state.isolated = false;
  state.activeLayer = null;
  $("#isolate-toggle").classList.remove("active");
  $("#component-details").hidden = true;
  $("#empty-selection").hidden = false;
  document.querySelectorAll(".process-button").forEach((button) => button.classList.remove("active"));
  collectNodes(root);
  collectFanRotors(root);
  state.sceneController = new SceneController(root);
  fitModel(root);
  setExplode(0);
  setLoadState(mode === "package" ? t("loadedPackage") : mode === "file" ? t("loadedGlb") : mode === "bundled" ? t("loadedBundled") : t("demoLoaded"));
  setStatus(state.modelWarnings.length ? 'Duplicate component IDs: ' + [...new Set(state.modelWarnings)].join(', ') : t('modelLoaded'));
}

function loadDemo() {
  installModel(createFallbackModel(), "demo");
}

function updateModelHeader() {
  $("#model-title").textContent = MODEL.name;
  $("#model-sku").textContent = MODEL.partNumber || MODEL.manufacturer || "Imported model";
}

function applyPackageData(packageData) {
  const adapter = createModelDataAdapter(packageData);
  MODEL = adapter.model;
  COMPONENTS = adapter.components;
  LEARNING_PACKAGE = packageData.learning ?? { questions: [] };
  PROCESS_PACKAGE = packageData.process_layers ?? { process_layers: [] };
  CLAIM_PACKAGE = packageData.claims ?? { claims: [] };
  RELATIONSHIP_PACKAGE = packageData.relationships ?? { relationships: [] };
  state.catalog = new Map(COMPONENTS.map((item) => [item.id, item]));
  state.learningMode = false;
  state.learningIndex = 0;
  state.learningScore = 0;
  state.learningSelected = null;
  state.learningAnswered = false;
  state.learningComplete = false;
  updateModelHeader();
  document.querySelectorAll(".process-button").forEach((button) => {
    button.disabled = button.dataset.layer !== "clear" &&
      !PROCESS_PACKAGE.process_layers.some((layer) => layer.type === button.dataset.layer);
  });
  document.querySelectorAll(".view-tab").forEach((button) => {
    if (button.dataset.mode === "learn") button.disabled = LEARNING_PACKAGE.questions.length === 0;
  });
}

function useGenericModelData(filename) {
  MODEL = {
    id: "imported.glb",
    name: filename || "Imported GLB",
    partNumber: "",
    manufacturer: "Imported model",
    status: "unknown",
    units: null,
    sources: []
  };
  COMPONENTS = [];
  LEARNING_PACKAGE = { questions: [] };
  PROCESS_PACKAGE = { process_layers: [] };
  CLAIM_PACKAGE = { claims: [] };
  RELATIONSHIP_PACKAGE = { relationships: [] };
  state.catalog = new Map();
  state.learningMode = false;
  updateModelHeader();
  document.querySelectorAll(".process-button").forEach((button) => {
    button.disabled = button.dataset.layer !== "clear";
  });
  document.querySelectorAll(".view-tab").forEach((button) => {
    if (button.dataset.mode === "learn") button.disabled = true;
  });
}

function loadArrayBuffer(buffer, filename, mode = "file", packageData = null) {
  setStatus(t("loading"));
  if (buffer.byteLength > MAX_GLB_BYTES) {
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = t("fileTooLarge");
    setStatus(t("fileTooLarge"));
    return;
  }
  try {
    validateSelfContainedGlb(buffer);
  } catch (error) {
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = error.message.includes("External resource") ? t("externalResources") : t("loadError");
    setStatus($("#viewer-error").textContent);
    return;
  }
  const loader = new GLTFLoader();
  const fail = (error) => {
    console.error(error);
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = t("loadError");
    setStatus(t("loadError"));
  };
  try {
    loader.parse(buffer, "", (gltf) => {
      try {
        const root = new THREE.Group();
        root.name = filename || "Imported model";
        root.add(gltf.scene);
        // Blender GLB export is Y-up; the atlas uses the source scene Z-up convention.
        root.rotation.x = Math.PI / 2;
        if (packageData) applyPackageData(packageData);
        else if (mode === "file") useGenericModelData(filename);
        $("#viewer-error").hidden = true;
        installModel(root, mode);
      } catch (error) {
        fail(error);
      }
    }, fail);
  } catch (error) {
    fail(error);
  }
}

function initRenderer() {
  try {
    state.scene = new THREE.Scene();
    state.measurementController = new MeasurementController(state.scene, { markerRadius: 1.5, unit: MODEL.units ?? null });
    state.scene.background = new THREE.Color(0x0a1016);
    state.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000);
    state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    state.renderer.localClippingEnabled = true;
    state.renderer.outputColorSpace = THREE.SRGBColorSpace;
    state.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    state.renderer.toneMappingExposure = 1.1;
    canvasHost.append(state.renderer.domElement);

    state.controls = new OrbitControls(state.camera, state.renderer.domElement);
    state.controls.enableDamping = true;
    state.controls.dampingFactor = 0.07;
    state.controls.minDistance = 70;
    state.controls.maxDistance = 1200;
    state.controls.maxPolarAngle = Math.PI * 0.92;

    state.scene.add(new THREE.HemisphereLight(0xc5d8e8, 0x202a32, 2.0));
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(140, 230, 180);
    state.scene.add(key);
    const rim = new THREE.DirectionalLight(0x7da6bd, 1.2);
    rim.position.set(-170, 70, -120);
    state.scene.add(rim);

    const grid = new THREE.GridHelper(280, 28, 0x293640, 0x1b2730);
    grid.rotation.x = Math.PI / 2;
    state.gridHelper = grid;
    state.scene.add(grid);

    const resize = () => {
      const width = Math.max(1, canvasHost.clientWidth);
      const height = Math.max(1, canvasHost.clientHeight);
      state.camera.aspect = width / height;
      state.camera.updateProjectionMatrix();
      state.renderer.setSize(width, height, false);
    };
    new ResizeObserver(resize).observe(canvasHost);
    resize();

    state.reducedMotion = Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches);
    canvasHost.dataset.reducedMotion = String(state.reducedMotion);
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.addEventListener?.("change", (event) => {
      state.reducedMotion = event.matches;
      canvasHost.dataset.reducedMotion = String(state.reducedMotion);
      if (state.reducedMotion && state.powered) setStatus("Reduced motion preference enabled");
    });
    const clock = new THREE.Clock();
    const render = () => {
      state.animationFrame = requestAnimationFrame(render);
      const delta = Math.min(clock.getDelta(), 0.05);
      updateOperatingEffects(delta);
      state.controls.update();
      state.renderer.render(state.scene, state.camera);
    };
    render();
    resetCamera();
  } catch (error) {
    console.error(error);
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = t("noWebgl");
    setStatus(t("noWebgl"));
  }
}


function measurementUnitLabel() {
  const unit = MODEL.units;
  if (!unit) return t("modelUnits");
  if (state.language === "ru" && unit === "mm") return "мм";
  return unit;
}

function updateMeasurementReadout() {
  const output = $("#measurement-readout");
  if (!output) return;
  const points = state.measurementController?.points ?? [];
  if (points.length >= 2) {
    const distance = state.measurementController.getDistance();
    output.textContent = `${t("measureDistance")}: ${distance.toFixed(2)} ${measurementUnitLabel()} · ${t("measureNote")}`;
  } else if (points.length === 1) {
    output.textContent = t("measureFirstPoint");
  } else {
    output.textContent = state.measurementEnabled ? t("measurePrompt") : t("measureIdle");
  }
}

function setMeasurementEnabled(enabled) {
  if (!state.measurementController || !state.modelRoot) return;
  state.measurementEnabled = Boolean(enabled);
  const button = $("#measurement-toggle");
  button?.classList.toggle("active", state.measurementEnabled);
  button?.setAttribute("aria-pressed", String(state.measurementEnabled));
  if (canvasHost) canvasHost.dataset.measurementEnabled = String(state.measurementEnabled);
  updateMeasurementReadout();
  setStatus(state.measurementEnabled ? t("measureEnabled") : t("measureDisabled"));
}

function clearMeasurement() {
  state.measurementController?.clear();
  if (canvasHost) canvasHost.dataset.measurementPoints = "0";
  updateMeasurementReadout();
}

function onCanvasClick(event) {
  const rect = state.renderer.domElement.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const hits = state.raycaster.intersectObject(state.modelRoot, true);
  if (!hits.length) {
    if (state.measurementEnabled) setStatus(t("measureNoHit"));
    return;
  }
  if (state.measurementEnabled) {
    const result = state.measurementController.addPoint(hits[0].point);
    canvasHost.dataset.measurementPoints = String(result.pointCount);
    updateMeasurementReadout();
    setStatus(result.distance === null ? t("measureFirstPoint") : `${t("measureDistance")}: ${result.distance.toFixed(2)} ${measurementUnitLabel()}`);
    return;
  }
  const id = getNodeId(hits[0].object);
  if (id) selectComponent(id);
}

function bindUI() {
  $("#language-toggle").addEventListener("click", () => {
    state.language = state.language === "ru" ? "en" : "ru";
    applyLanguage();
  });
  $("#open-model").addEventListener("click", () => $("#model-file").click());
  $("#model-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const isPackage = /\.sbsmodel$/i.test(file.name);
    const sizeLimit = isPackage ? MAX_MODEL_PACKAGE_BYTES : MAX_GLB_BYTES;
    if (file.size > sizeLimit) {
      const message = isPackage ? t("packageTooLarge") : t("fileTooLarge");
      $("#viewer-error").hidden = false;
      $("#viewer-error").textContent = message;
      setStatus(message);
      event.target.value = "";
      return;
    }
    $("#viewer-error").hidden = true;
    try {
      if (isPackage) {
        const modelPackage = await loadModelPackage(file);
        loadArrayBuffer(modelPackage.sceneBuffer, file.name, "package", modelPackage.data);
        setStatus(`Package validated · ${modelPackage.report.componentCount} components · ${modelPackage.report.relationshipCount} relationships`);
      } else {
        loadArrayBuffer(await file.arrayBuffer(), file.name, "file");
      }
    } catch (error) {
      $("#viewer-error").hidden = false;
      $("#viewer-error").textContent = error.message || t("loadError");
      setStatus(t("loadError"));
    }
    event.target.value = "";
  });
  $("#component-search").addEventListener("input", renderTree);
  $("#camera-preset").addEventListener("change", (event) => setCameraPreset(event.target.value));
  $("#slice-toggle").addEventListener("click", () => setSliceEnabled(!state.sliceEnabled));
  $("#slice-axis").addEventListener("change", (event) => {
    state.sliceAxis = event.target.value;
    updateSlicePlane();
  });
  $("#slice-position").addEventListener("input", (event) => updateSlicePosition(event.target.value));
  $("#measurement-toggle").addEventListener("click", () => setMeasurementEnabled(!state.measurementEnabled));
  $("#measurement-clear").addEventListener("click", clearMeasurement);
  $("#reset-view").addEventListener("click", resetCamera);
  $("#expand-tree").addEventListener("click", () => {
    $("#component-search").value = "";
    renderTree();
    setIsolated(false);
  });
  $("#isolate-toggle").addEventListener("click", () => setIsolated(!state.isolated));
  $("#wireframe-toggle").addEventListener("click", () => {
    state.wireframe = !state.wireframe;
    state.modelRoot?.traverse((object) => {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.filter(Boolean).forEach((material) => { material.wireframe = state.wireframe; });
    });
    $("#wireframe-toggle").classList.toggle("active", state.wireframe);
  });
  $("#explode-slider").addEventListener("input", (event) => setExplode(event.target.value));
  $("#power-toggle").addEventListener("click", () => setPowered(!state.powered));
  $("#simulation-speed").addEventListener("input", (event) => setSimulationSpeed(event.target.value));
  $("#quiz-next").addEventListener("click", submitLearningAnswer);
  setSimulationSpeed($("#simulation-speed")?.value ?? 1);
  $("#assemble-button").addEventListener("click", () => setExplode(0));
  $("#explode-button").addEventListener("click", () => setExplode(100));
  $("#animate-button").addEventListener("click", animateExplodeCycle);
  $("#rotate-component").addEventListener("click", async () => {
    const id = state.selectedId;
    const controller = state.sceneController;
    const button = $("#rotate-component");
    if (!id || !controller) return;
    button.disabled = true;
    try {
      await controller.animateRotation(id, { axis: "y", turns: 1, duration: 900 });
    } catch (error) {
      console.error(error);
      setStatus(t("rotationError"));
    } finally {
      button.disabled = false;
    }
  });
  document.querySelectorAll(".process-button").forEach((button) => {
    button.addEventListener("click", () => setLayer(button.dataset.layer));
  });
  document.querySelectorAll(".view-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".view-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      if (button.dataset.mode === "disassemble") { setLayer("clear"); setExplode(100); }
      if (button.dataset.mode === "explore") { setLayer("clear"); setExplode(0); }
      if (button.dataset.mode === "understand") setLayer("cooling");
      if (button.dataset.mode === "learn") showLearning();
      else if (state.learningMode) {
        state.learningMode = false;
        $("#learning-panel").hidden = true;
        if (state.selectedId) renderDetails(state.selectedId);
        else $("#empty-selection").hidden = false;
      }
    });
  });
  canvasHost.addEventListener("click", onCanvasClick);
  window.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement?.tagName !== "INPUT") {
      event.preventDefault();
      $("#component-search").focus();
    }
    if (event.key === "Escape") {
      setMeasurementEnabled(false);
      setIsolated(false);
      setExplode(0);
      setLayer("clear");
    }
  });
}

async function tryLoadBundledModel() {
  const revision = state.modelRevision;
  try {
    const embeddedModelUrl = globalThis.SBS_BUNDLED_GLB_DATA_URL;
    if (!embeddedModelUrl && window.location.protocol === "file:") {
      setLoadState(t("demoLoaded"));
      return;
    }
    const modelUrl = embeddedModelUrl || `${import.meta.env.BASE_URL}models/rtx3060_xc_black_blockout_v05.glb`;
    const response = await fetch(modelUrl);
    if (!response.ok) throw new Error("No bundled model");
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) throw new Error("No bundled model");
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 12 || new TextDecoder().decode(buffer.slice(0, 4)) !== "glTF") throw new Error("No bundled GLB asset");
    if (state.modelRevision !== revision) return;
    loadArrayBuffer(buffer, "Bundled v0.5 GLB", "bundled");
  } catch {
    if (state.modelRevision === revision) loadDemo();
  }
}

bindUI();
applyLanguage();
initRenderer();
document.documentElement.classList.add("sbs-ready");
const startupFallback = $("#startup-fallback");
if (startupFallback) startupFallback.hidden = true;
if (state.renderer) {
  canvasHost.addEventListener("dblclick", resetCamera);
  loadDemo();
  tryLoadBundledModel();
}

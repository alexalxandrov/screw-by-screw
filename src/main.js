import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MODEL, COMPONENTS, EVIDENCE } from "./data/model.js";
import LEARNING_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/learning.json";
import PROCESS_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/process_layers.json";
import "./styles.css";

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
  baseTransforms: new Map(),
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
  modelWarnings: []
};

const MAX_GLB_BYTES = 256 * 1024 * 1024;

const UI = {
  en: {
    pilotModel: "PILOT MODEL", structure: "STRUCTURE", components: "Components",
    searchPlaceholder: "Find a component…", assemblyTree: "ASSEMBLY TREE", showAll: "Show all",
    proxyNote: "Illustrative geometry · not CAD", explore: "Explore", disassemble: "Disassemble",
    understand: "Understand", assembledState: "ASSEMBLED STATE", demoScene: "DEMO SCENE · LOCAL",
    assemblyState: "ASSEMBLY STATE", assemble: "Assemble", explode: "Explode",
    assembled: "ASSEMBLED", exploded: "EXPLODED", processLayers: "PROCESS LAYERS",
    qualitativeOnly: "QUALITATIVE ONLY", cooling: "Cooling", powerDelivery: "Power delivery",
    clearLayer: "Clear layer", inspection: "INSPECTION", componentDetails: "Component details",
    selectComponent: "Select a component", selectHint: "Choose a part in the 3D view or assembly tree to inspect its role and evidence.",
    identity: "IDENTITY", parent: "Parent", geometry: "Geometry", evidence: "EVIDENCE",
    sources: "SOURCES", accuracyFooter: "Unknown values remain unknown. No inferred CAD accuracy.",
    ready: "READY", localFirst: "LOCAL-FIRST · NO ACCOUNT", openGlb: "Open GLB",
    noSelection: "No component selected", componentsCount: "components",
    loadError: "Could not load this GLB file.", loadedGlb: "GLB LOADED · LOCAL FILE",
    demoLoaded: "DEMO SCENE · LOCAL", loading: "LOADING MODEL…", isolate: "Isolated",
    allVisible: "All components visible", layerCooling: "Cooling layer · qualitative",
    layerPower: "Power path · qualitative", noWebgl: "WebGL is unavailable in this browser.",
    source: "Source", noSources: "No direct source linked to this component.",
    modelLoaded: "Model ready", glbPicker: "Choose a .glb file", learn: "Learn", learning: "LEARNING", linkedComponents: "LINKED COMPONENTS", assumptions: "ASSUMPTIONS & LIMITS", processLayer: "PROCESS LAYER", fileTooLarge: "GLB exceeds the 256 MB prototype limit.", question: "QUESTION", checkAnswer: "Check answer", nextQuestion: "Next question", finishQuiz: "Finish", restartQuiz: "Try again", correctAnswer: "Correct", wrongAnswer: "Not quite", quizComplete: "Quiz complete", yourScore: "Your score", chooseAnswer: "Choose an answer first"
  },
  ru: {
    pilotModel: "ПИЛОТНАЯ МОДЕЛЬ", structure: "СТРУКТУРА", components: "Компоненты",
    searchPlaceholder: "Найти компонент…", assemblyTree: "ДЕРЕВО СБОРКИ", showAll: "Показать все",
    proxyNote: "Условная геометрия · не CAD", explore: "Обзор", disassemble: "Разборка",
    understand: "Принцип работы", assembledState: "СОБРАННОЕ СОСТОЯНИЕ", demoScene: "ДЕМО-СЦЕНА · ЛОКАЛЬНО",
    assemblyState: "СОСТОЯНИЕ СБОРКИ", assemble: "Собрать", explode: "Разобрать",
    assembled: "СОБРАНО", exploded: "РАЗОБРАНО", processLayers: "СЛОИ ПРОЦЕССОВ",
    qualitativeOnly: "КАЧЕСТВЕННО", cooling: "Охлаждение", powerDelivery: "Питание",
    clearLayer: "Сбросить слой", inspection: "ИНСПЕКЦИЯ", componentDetails: "Карточка компонента",
    selectComponent: "Выберите компонент", selectHint: "Выберите деталь в 3D-окне или дереве сборки, чтобы изучить её назначение и источники.",
    identity: "ИДЕНТИФИКАЦИЯ", parent: "Родитель", geometry: "Геометрия", evidence: "ДОКАЗАТЕЛЬНОСТЬ",
    sources: "ИСТОЧНИКИ", accuracyFooter: "Неизвестное остаётся неизвестным. Точность CAD не подразумевается.",
    ready: "ГОТОВО", localFirst: "ЛОКАЛЬНО · БЕЗ АККАУНТА", openGlb: "Открыть GLB",
    noSelection: "Компонент не выбран", componentsCount: "компонентов",
    loadError: "Не удалось загрузить этот GLB-файл.", loadedGlb: "GLB ЗАГРУЖЕН · ЛОКАЛЬНЫЙ ФАЙЛ",
    demoLoaded: "ДЕМО-СЦЕНА · ЛОКАЛЬНО", loading: "ЗАГРУЗКА МОДЕЛИ…", isolate: "Изолировано",
    allVisible: "Все компоненты видимы", layerCooling: "Слой охлаждения · качественно",
    layerPower: "Путь питания · качественно", noWebgl: "В этом браузере недоступен WebGL.",
    source: "Источник", noSources: "Для этого компонента нет прямой ссылки на источник.",
    modelLoaded: "Модель готова", glbPicker: "Выберите файл .glb", learn: "Обучение", learning: "ОБУЧЕНИЕ", linkedComponents: "СВЯЗАННЫЕ КОМПОНЕНТЫ", assumptions: "ДОПУЩЕНИЯ И ОГРАНИЧЕНИЯ", processLayer: "СЛОЙ ПРОЦЕССА", fileTooLarge: "GLB превышает лимит прототипа 256 МБ.", question: "ВОПРОС", checkAnswer: "Проверить ответ", nextQuestion: "Следующий вопрос", finishQuiz: "Завершить", restartQuiz: "Повторить", correctAnswer: "Верно", wrongAnswer: "Не совсем", quizComplete: "Тест завершён", yourScore: "Ваш результат", chooseAnswer: "Сначала выберите ответ"
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
  document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
    node.placeholder = t(node.dataset.i18nPlaceholder);
  });
  renderTree();
  if (state.activeLayer) renderProcessLayer();
  else if (state.learningMode) renderLearning();
  else if (state.selectedId) renderDetails(state.selectedId);
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

  for (let blade = 0; blade < 7; blade += 1) {
    const bladeMesh = new THREE.Mesh(
      createBladeGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x242c34, side: THREE.DoubleSide, roughness: 0.68 })
    );
    bladeMesh.rotation.z = (Math.PI * 2 * blade) / 7;
    bladeMesh.name = `Fan ${index} blade ${blade + 1}`;
    tag(bladeMesh, `fan.${index}.blade.${blade + 1}`);
    fanPlane.add(bladeMesh);
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

  const finSpan = 145.3;
  for (let index = 0; index < 24; index += 1) {
    const x = (201.8 - finSpan) / 2 + (index * finSpan) / 23;
    makeMesh(cooling, `cooling.heatsink.fin.${String(index + 1).padStart(2, "0")}`,
      `Heatsink fin proxy ${index + 1}`,
      new THREE.BoxGeometry(1, 13, 52.8), materials.metal, [x, 0, 55]);
  }

  makeMesh(cooling, "cooling.gpu_contact", "Copper GPU contact proxy",
    new THREE.BoxGeometry(48, 3, 42), materials.copper, [97, -3, 57]);

  makeMesh(pcbAssembly, "chip.gpu.ga106", "GPU package proxy",
    new THREE.BoxGeometry(40, 5, 40), materials.chip, [97, 14, 57], "teardown_supported");
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
    geometry: object?.userData?.sbs_geometry_status ?? "unknown"
  };
}

function renderTree() {
  const host = $("#component-tree");
  if (!host) return;
  const query = $("#component-search").value.trim().toLowerCase();
  host.replaceChildren();
  const entries = [...state.componentNodes.entries()].map(([id, object]) => {
    const data = getComponentData(id, object);
    const label = state.language === "ru" ? data.ru : data.en;
    let depth = 0;
    let parent = object.parent;
    while (parent && parent !== state.modelRoot) {
      if (parent.userData?.sbs_component_id) depth += 1;
      parent = parent.parent;
    }
    return { id, object, data, label, depth };
  }).filter((entry) => !query || entry.label.toLowerCase().includes(query) || entry.id.toLowerCase().includes(query));
  entries.sort((a, b) => a.depth - b.depth || a.id.localeCompare(b.id));

  entries.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tree-item${entry.id === state.selectedId ? " active" : ""}`;
    button.style.paddingLeft = `${7 + Math.min(entry.depth, 5) * 12}px`;
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
    button.append(symbol, label, kind);
    button.addEventListener("click", () => selectComponent(entry.id));
    host.append(button);
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

  const sourceHost = $("#source-links");
  sourceHost.replaceChildren();
  const sourceList = data.id === "assembly.card.root"
    ? MODEL.sources
    : data.id.includes("gpu") || data.id.includes("memory")
      ? [MODEL.sources[2], MODEL.sources[1]]
      : data.id.includes("fan") || data.id.includes("cooling") || data.id.includes("shroud")
        ? [MODEL.sources[1], MODEL.sources[2]]
        : [MODEL.sources[0], MODEL.sources[1]];
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
  const questions = LEARNING_PACKAGE.questions;
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
  question.source_ids.forEach((sourceId) => {
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
  const questions = LEARNING_PACKAGE.questions;
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
  layer.linked_component_ids.forEach((id) => {
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
  layer.assumptions.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    assumptions.append(li);
  });

  const sourceHost = $("#process-sources");
  sourceHost.replaceChildren();
  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  layer.source_ids.forEach((id) => {
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

function resetCamera() {
  if (!state.camera || !state.controls) return;
  state.camera.up.set(0, 0, 1);
  state.camera.position.set(300, 235, 260);
  state.controls.target.set(101, 0, 55);
  state.controls.update();
}

function saveBaseTransforms() {
  state.baseTransforms.clear();
  state.modelRoot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(state.modelRoot);
  const center = box.getCenter(new THREE.Vector3());
  state.modelRoot.traverse((object) => {
    if (object === state.modelRoot) return;
    if (!object.isMesh && !object.userData?.sbs_component_id) return;
    object.updateMatrixWorld(true);
    const world = object.getWorldPosition(new THREE.Vector3());
    const direction = world.clone().sub(center);
    if (direction.lengthSq() < 0.001) direction.set(0, 0.8, 0);
    direction.normalize();
    state.baseTransforms.set(object.uuid, {
      object,
      local: object.position.clone(),
      world,
      direction
    });
  });
}

function setExplode(value) {
  state.exploded = Math.max(0, Math.min(100, Number(value)));
  const amount = state.exploded * 0.42;
  state.modelRoot.updateMatrixWorld(true);
  for (const record of state.baseTransforms.values()) {
    const targetWorld = record.world.clone().add(record.direction.clone().multiplyScalar(amount));
    if (record.object.parent) {
      record.object.parent.updateWorldMatrix(true, false);
      record.object.position.copy(record.object.parent.worldToLocal(targetWorld));
    } else {
      record.object.position.copy(targetWorld);
    }
  }
  $("#explode-slider").value = String(state.exploded);
  $("#explode-value").textContent = `${state.exploded}%`;
  $("#model-state").textContent = state.exploded ? "EXPLODED VIEW" : t("assembledState");
}

function setIsolated(isolate) {
  if (!state.selected) return;
  state.isolated = isolate;
  const keep = new Set();
  let current = state.selected;
  while (current) {
    keep.add(current);
    current = current.parent;
  }
  state.selected.traverse((object) => keep.add(object));
  state.modelRoot.traverse((object) => {
    if (object === state.modelRoot) return;
    object.visible = !isolate || keep.has(object);
  });
  $("#isolate-toggle").classList.toggle("active", isolate);
  setStatus(isolate ? t("isolate") : t("allVisible"));
}

function setLayer(layer) {
  clearHighlights();
  state.activeLayer = layer === "clear" || state.activeLayer === layer ? null : layer;
  document.querySelectorAll(".process-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.layer === state.activeLayer);
  });
  if (!state.activeLayer) {
    $("#process-details").hidden = true;
    if (state.selectedId) renderDetails(state.selectedId);
    else {
      $("#empty-selection").hidden = false;
      $("#component-details").hidden = true;
    }
    setStatus(t("ready"));
    return;
  }
  const matches = [];
  state.modelRoot.traverse((object) => {
    const id = getNodeId(object) ?? "";
    const match = state.activeLayer === "cooling"
      ? id.includes("cooling") || id.includes("fan") || id.includes("shroud")
      : id.includes("power") || id.includes("gpu") || id.includes("connector");
    if (match && object.userData?.sbs_component_id) matches.push(object);
  });
  matches.forEach((object) => {
    const color = state.activeLayer === "cooling" ? 0x6bc8e8 : 0xe8b75e;
    if (object.isMesh) applyHighlight(object, color);
    else object.traverse((child) => { if (child.isMesh) applyHighlight(child, color); });
  });
  renderProcessLayer();
  setStatus(t(state.activeLayer === "cooling" ? "layerCooling" : "layerPower"));
}

function fitModel(root) {
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z, 100);
  state.controls.target.copy(center);
  state.camera.position.copy(center).add(new THREE.Vector3(maxDimension * 1.35, maxDimension * 1.0, maxDimension * 1.25));
  state.camera.near = Math.max(0.1, maxDimension / 1000);
  state.camera.far = maxDimension * 30;
  state.camera.updateProjectionMatrix();
  state.controls.update();
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
  if (state.modelRoot) disposeModel(state.modelRoot);
  state.modelRoot = root;
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
  saveBaseTransforms();
  fitModel(root);
  setExplode(0);
  setLoadState(mode === "file" ? t("loadedGlb") : t("demoLoaded"));
  setStatus(state.modelWarnings.length ? 'Duplicate component IDs: ' + [...new Set(state.modelWarnings)].join(', ') : t('modelLoaded'));
}

function loadDemo() {
  installModel(createFallbackModel(), "demo");
}

function loadArrayBuffer(buffer, filename) {
  setStatus(t("loading"));
  if (buffer.byteLength > MAX_GLB_BYTES) {
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = t("fileTooLarge");
    setStatus(t("fileTooLarge"));
    return;
  }
  const loader = new GLTFLoader();
  loader.parse(buffer, "", (gltf) => {
    const root = new THREE.Group();
    root.name = filename || "Imported GLB";
    root.add(gltf.scene);
    // Blender GLB export is Y-up; the atlas uses the source scene Z-up convention.
    root.rotation.x = Math.PI / 2;
    installModel(root, "file");
  }, (error) => {
    console.error(error);
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = t("loadError");
    setStatus(t("loadError"));
    loadDemo();
  });
}

function initRenderer() {
  try {
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x0a1016);
    state.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 4000);
    state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    state.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
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
    grid.position.set(101, -25, 55);
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

    const render = () => {
      state.animationFrame = requestAnimationFrame(render);
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

function onCanvasClick(event) {
  const rect = state.renderer.domElement.getBoundingClientRect();
  state.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  state.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const hits = state.raycaster.intersectObject(state.modelRoot, true);
  if (!hits.length) return;
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
    if (file.size > MAX_GLB_BYTES) {
      $("#viewer-error").hidden = false;
      $("#viewer-error").textContent = t("fileTooLarge");
      setStatus(t("fileTooLarge"));
      event.target.value = "";
      return;
    }
    $("#viewer-error").hidden = true;
    loadArrayBuffer(await file.arrayBuffer(), file.name);
    event.target.value = "";
  });
  $("#component-search").addEventListener("input", renderTree);
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
  $("#quiz-next").addEventListener("click", submitLearningAnswer);
  $("#assemble-button").addEventListener("click", () => setExplode(0));
  $("#explode-button").addEventListener("click", () => setExplode(100));
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
      setIsolated(false);
      setExplode(0);
      setLayer("clear");
    }
  });
}

async function tryLoadBundledModel() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}models/rtx3060_xc_black_blockout_v04.glb`);
    if (!response.ok) throw new Error("No bundled model");
    const buffer = await response.arrayBuffer();
    loadArrayBuffer(buffer, "Bundled v0.4 GLB");
  } catch {
    loadDemo();
  }
}

bindUI();
applyLanguage();
initRenderer();
if (state.renderer) {
  canvasHost.addEventListener("dblclick", resetCamera);
  tryLoadBundledModel();
}

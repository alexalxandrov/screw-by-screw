import * as THREE from "three";
import { zipSync, strToU8 } from "fflate";
import { createSemanticInventory, createInventoryCsvFiles } from "./data/inventory-export.js";
import { createLearningProgressStore } from "./data/learning-progress.js";
import { compareModelPackages } from "./data/model-comparison.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { SceneController } from "./viewer/SceneController.js";
import { ProcedureController } from "./viewer/ProcedureController.js";
import { MeasurementController } from "./viewer/MeasurementController.js";
import { AnimationPlayer } from "./viewer/AnimationPlayer.js";
import { createCatalogAdapter } from "./data/catalog.js";
import CATALOG_SOURCE from "../content/catalog/models.json";
import { MODEL as DEFAULT_MODEL, COMPONENTS as DEFAULT_COMPONENTS, EVIDENCE, createModelDataAdapter } from "./data/model.js";
import DEFAULT_LEARNING_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/learning.json";
import DEFAULT_PROCESS_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/process_layers.json";
import DEFAULT_CLAIM_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/claims.json";
import DEFAULT_RELATIONSHIP_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/relationships.json";
import DEFAULT_ASSEMBLY_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/assembly_steps.json";
import DEFAULT_ANIMATION_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/animations.json";
import DEFAULT_MODEL_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/model.json";
import DEFAULT_COMPONENT_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/components.json";
import DEFAULT_SOURCE_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/sources.json";
import DEFAULT_RELEASE_PACKAGE from "../content/models/evga-rtx3060-xc-black-12gb/release.json";
import { loadModelPackage, validateSelfContainedGlb, MAX_MODEL_PACKAGE_BYTES, MAX_SCENE_GLB_BYTES } from "./viewer/ModelPackageLoader.js";

let MODEL = DEFAULT_MODEL;
let COMPONENTS = DEFAULT_COMPONENTS;
let LEARNING_PACKAGE = DEFAULT_LEARNING_PACKAGE;
let PROCESS_PACKAGE = DEFAULT_PROCESS_PACKAGE;
let CLAIM_PACKAGE = DEFAULT_CLAIM_PACKAGE;
let RELATIONSHIP_PACKAGE = DEFAULT_RELATIONSHIP_PACKAGE;
let ASSEMBLY_PACKAGE = DEFAULT_ASSEMBLY_PACKAGE;
let ANIMATION_PACKAGE = DEFAULT_ANIMATION_PACKAGE;
const DEFAULT_PACKAGE_DATA = {
  model: DEFAULT_MODEL_PACKAGE,
  components: DEFAULT_COMPONENT_PACKAGE,
  sources: DEFAULT_SOURCE_PACKAGE,
  learning: DEFAULT_LEARNING_PACKAGE,
  process_layers: DEFAULT_PROCESS_PACKAGE,
  claims: DEFAULT_CLAIM_PACKAGE,
  relationships: DEFAULT_RELATIONSHIP_PACKAGE,
  assembly_steps: DEFAULT_ASSEMBLY_PACKAGE,
  animations: DEFAULT_ANIMATION_PACKAGE,
  release: DEFAULT_RELEASE_PACKAGE
};
const LEARNING_PROGRESS_STORE = createLearningProgressStore();
const catalogDefaultPackage = CATALOG_SOURCE.models.find((entry) => entry?.default_package === true);
const catalogDefaultPackageModelId =
  typeof catalogDefaultPackage?.package_model_id === "string" && catalogDefaultPackage.package_model_id.trim()
    ? catalogDefaultPackage.package_model_id.trim()
    : DEFAULT_MODEL.id;
const MODEL_CATALOG = createCatalogAdapter(CATALOG_SOURCE, {
  defaultPackageModelId: catalogDefaultPackageModelId
});

const $ = (selector) => document.querySelector(selector);
const canvasHost = $("#viewer-canvas");
const appShell = $("#app");
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
  procedureController: null,
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
  learningProgressAvailable: false,
  learningResumed: false,
  modelWarnings: [],
  modelRevision: 0,
  powered: false,
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
  measurementEnabled: false,
  userInteracted: false,
  animationPlayer: null,
  loadRequestId: 0,
  loadedCatalogModelId: null,
  pendingCatalogModelId: null,
  catalogSearch: "",
  catalogCategory: "all",
  catalogLoadingId: null,
  catalogOpener: null,
  packageData: DEFAULT_PACKAGE_DATA
};

const MAX_GLB_BYTES = MAX_SCENE_GLB_BYTES;

const UI = {
  en: {
    modelLabel: "MODEL", modelSwitcherLabel: "SWITCH MODEL", modelSwitcherPlaceholder: "Choose a model…", catalogOpen: "Library", catalogTitle: "MODEL LIBRARY", catalogSubtitle: "Offline-ready model packages", catalogClose: "Close library", catalogSearch: "Search model, manufacturer or part number…", catalogSearchLabel: "SEARCH THE LIBRARY", catalogCategoryLabel: "CATEGORY", catalogEntries: "MODELS", catalogFooter: "Model packages are stored locally. No account or remote catalogue service is required.", catalogAllCategories: "All categories", catalogEmpty: "No models match this search.", catalogLoad: "Open model", catalogLoaded: "Currently loaded", catalogLoading: "Loading package…", catalogStatusResearch: "RESEARCH BLOCKOUT", catalogGeometryProxy: "Illustrative proxy · not CAD", catalogFamilyIdentity: "Platform family · no single part number", catalogPackageVersion: "Package", catalogChoosePackage: "Choose the matching .sbsmodel package to continue.", catalogError: "Could not open this catalog package.", structure: "STRUCTURE", components: "Components",
    searchPlaceholder: "Search components, claims, IDs and sources…", assemblyTree: "ASSEMBLY TREE", showAll: "Show all",
    proxyNote: "Illustrative geometry · not CAD", explore: "Explore", disassemble: "Disassemble",
    understand: "Understand", animate: "Animate", assembledState: "ASSEMBLED STATE", demoScene: "DEMO SCENE · LOCAL",
    assemblyState: "ASSEMBLY STATE", assemble: "Assemble", explode: "Explode",
    assembled: "ASSEMBLED", exploded: "EXPLODED", processLayers: "PROCESS LAYERS",
    qualitativeOnly: "SCHEMATIC · NOT CFD / SPICE", cooling: "Airflow", powerDelivery: "Power path", gpuCompute: "GPU architecture", graphicsPipeline: "GPU data paths", videoCodec: "Video engines",
    powerOn: "Run animation", powerOff: "Stop animation", operatingState: "OPERATING VISUALIZATION", simulationSpeed: "Animation speed",
    cameraPreset: "VIEW", viewIso: "Isometric", viewFan: "Fan side", viewPcb: "PCB side", viewIo: "I/O bracket", viewPower: "Power connector", viewTop: "Top",
    sliceToggle: "Section cut", sliceAxis: "Axis", sliceNote: "Visual cut · uncapped · not CAD",
    measure: "Measure", clearMeasurement: "Clear", measureIdle: "Measurement off · model-space only", measurePrompt: "Click a visible surface to set point 1 of 2", measureFirstPoint: "Point 1 of 2 set · select the second point", measureDistance: "Distance", measureDisclaimer: "model-space only", measureNoHit: "Click a visible model surface", measureEnabled: "Measurement enabled", measureDisabled: "Measurement disabled", modelUnits: "model units", measureNote: "Not a verified physical dimension",
    clearLayer: "Clear layer", inspection: "INSPECTION", componentDetails: "Component details",
    selectComponent: "Select a component", selectHint: "Choose a part in the 3D view or assembly tree to inspect its role and evidence.",
    identity: "IDENTITY", parent: "Parent", geometry: "Geometry", evidence: "EVIDENCE", technicalClaims: "TECHNICAL CLAIMS", claimUnknown: "Unknown", yes: "Yes", no: "No", claimSources: "Evidence sources", technicalRelationships: "TECHNICAL RELATIONSHIPS", qualitativeRelation: "Qualitative relationship", noRelationshipSource: "No source registered", exportData: "MODEL DATA", exportJson: "Export JSON", exportCsv: "CSV ZIP", exportComplete: "Export prepared · local only", exportFailed: "Export failed", assemblyEvidence: "DISASSEMBLY EVIDENCE", noVerifiedSequence: "No verified disassembly sequence has been authored for this model.", sourceObservations: "SOURCE OBSERVATIONS · NOT DISASSEMBLY STEPS", stepLabel: "Step", toolsLabel: "Tools", safetyLabel: "Safety", prerequisitesLabel: "Prerequisites", openAtSource: "Open source", runProcedureStep: "Show this step in 3D", resetProcedureScene: "Reset 3D procedure", previousProcedureStep: "Previous", nextProcedureStep: "Next", procedureReady: "Procedure scene ready", procedureReset: "Procedure scene reset", procedureNoGeometry: "No separate physical mesh is registered for this action; the relevant component is selected.", procedureExactSlide: "Manufacturer-stated slide: 12.7 mm (1/2 in)", procedureApproxMotion: "Illustrative extraction movement; travel is not specified by IBM.", procedureProgress: "Step", procedureBranchLabel: "SELECT FRU BRANCH", procedureCommonBranch: "Common opening only", procedureChooseBranch: "Common access is complete. Choose one FRU branch; the service manual does not require a single linear teardown.", procedureRunnerTitle: "STEP-BY-STEP 3D PROCEDURE", procedureRunnerDisclaimer: "Educational scene playback only · does not control physical hardware. Proxy clearances are not measured.", procedureRunnerNext: "Show next step", procedureRunnerPrevious: "Previous step", procedureRunnerReset: "Reset procedure", procedureRunnerReady: "Start with safe power isolation and cover access.", procedureRunnerVisualized: "Visual state applied in the 3D model. This does not confirm a physical service action.", procedureRunnerComplete: "Selected FRU branch completed in the educational scene.", procedureRunnerNoop: "No scene movement: this option is absent from the 16 KB launch baseline.", procedureRunnerSafety: "SAFETY / PROCEDURAL NOTE", procedureGroup: "PROCEDURE BRANCH", commonEntryMode: "Common entry", conditionalBranchMode: "Conditional branch", sharedPreparationMode: "Shared preparation", independentFruBranchMode: "Independent FRU branch", replacementFragments: "DOCUMENTED REPLACEMENT FRAGMENTS · NOT A COMPLETE REASSEMBLY", sequenceDisplayOnly: "Display order only · follow the source-backed prerequisites and the selected FRU branch.",
    sources: "SOURCES", accuracyFooter: "Unknown values remain unknown. No inferred CAD accuracy.",
    ready: "READY", localFirst: "LOCAL-FIRST · NO ACCOUNT", openModel: "Open model",
    noSelection: "No component selected", componentsCount: "components",
    loadError: "Could not load this GLB file.", loadedGlb: "GLB LOADED · LOCAL FILE", loadedPackage: "SBS MODEL PACKAGE · LOCAL", loadedBundled: "BUNDLED MODEL · LOCAL",
    demoLoaded: "DEMO SCENE · LOCAL", loading: "LOADING MODEL…", isolate: "Isolated",
    allVisible: "All components visible", layerCooling: "Cooling layer · qualitative",
    layerPower: "Power path · qualitative", layerCompute: "GPU architecture · logical map", layerGraphicsPipeline: "Graphics paths · conceptual map", layerVideoCodec: "Video codec engines · logical map", noWebgl: "WebGL is unavailable in this browser.",
    source: "Source", noSources: "No direct source linked to this component.",
    modelLoaded: "Model ready", glbPicker: "Choose a .glb file", learn: "Learn", learning: "LEARNING", authoredAnimations: "PACKAGE ANIMATIONS", runtimeDiagnostics: "Runtime diagnostics", diagnosticsModel: "Model ID", diagnosticsComponents: "Mapped components", diagnosticsProcedure: "Procedure step", diagnosticsAnimation: "Animation clip", diagnosticsMotion: "World-space displacement", clipSelect: "Select clip", clipTimeline: "Animation timeline", clipPlay: "Play", clipPause: "Pause", clipStop: "Stop / reset", clipReady: "Ready", clipPlaying: "Playing", clipPaused: "Paused", clipCompleted: "Completed", clipTime: "TIME", clipEvidenceNote: "Authored model motion · not a physics simulation", clipEducationalApproximation: "Educational approximation · duration is not measured RPM", clipIllustrative: "Illustrative motion · not a measured mechanism", clipDocumentedMotion: "Documented motion · source-linked", clipMeasuredMotion: "Measured motion · source and method recorded", linkedComponents: "LINKED COMPONENTS", assumptions: "ASSUMPTIONS & LIMITS", processLayer: "PROCESS LAYER", fileTooLarge: "GLB exceeds the 256 MB limit.", packageTooLarge: "SBS model package exceeds the 512 MB limit.", externalResources: "This GLB references external files. Only self-contained GLB files are allowed.", question: "QUESTION", checkAnswer: "Check answer", nextQuestion: "Next question", finishQuiz: "Finish", restartQuiz: "Try again", correctAnswer: "Correct", wrongAnswer: "Not quite", quizComplete: "Quiz complete", yourScore: "Your score", chooseAnswer: "Choose an answer first", learningProgressSaved: "Progress saved in this browser", learningProgressLocal: "Local progress · this browser", learningProgressSession: "Local storage unavailable · session only", mobileViewer: "3D", mobileStructure: "Structure", mobileDetails: "Details", compare: "Compare", compareTitle: "MODEL COMPARISON", compareLeft: "MODEL A · ACTIVE PACKAGE", compareRight: "MODEL B · COMPARISON PACKAGE", compareChoosePackage: "Load a second .sbsmodel package", compareClearPackage: "Clear comparison", compareWaiting: "Load a validated .sbsmodel package to compare semantic data.", compareLoaded: "Comparison package validated", compareError: "Could not validate the comparison package", compareSku: "PART NUMBER", compareGeometry: "GEOMETRY EVIDENCE", comparePcb: "PCB REVISION", compareSpecifications: "SPECIFICATION COMPARISON", compareClaims: "SOURCE-BACKED CLAIMS", compareCoverage: "COMPONENT INVENTORY COVERAGE", compareShared: "Shared IDs", compareLeftOnly: "Recorded only in package A", compareRightOnly: "Recorded only in package B", compareSame: "Same value", compareDifferent: "Different", compareUnknownBoth: "Unknown in both", compareUnknownLeft: "Unknown in A", compareUnknownRight: "Unknown in B", compareNotRecordedLeft: "Not recorded in A", compareNotRecordedRight: "Not recorded in B", compareOnlyLeft: "Only in package A", compareOnlyRight: "Only in package B", compareUnknown: "Unknown", compareNotRecorded: "Not recorded", compareEvidenceA: "Evidence A", compareEvidenceB: "Evidence B", compareSourcesA: "Sources A", compareSourcesB: "Sources B", compareNoClaims: "No comparable claims are recorded.", compareNoSpecifications: "No specification values are recorded in these packages.", compareCoverageNote: "Package inventory differences describe coverage only; they do not prove a physical component is absent.", compareLimitations: "INTERPRETATION LIMITS", compareLimitationsList: ["Comparison is limited to validated semantic packages, not hardware inspection.", "Unknown values are not inferred from another SKU or PCB revision.", "A missing package field does not prove physical absence.", "Component ID differences do not prove physical additions or removals.", "3D geometry, CAD, BoardView, PCB routing and physical fitment are not compared."], comparePackageModel: "Model ID"
  },
  ru: {
    modelLabel: "МОДЕЛЬ", modelSwitcherLabel: "БЫСТРОЕ ПЕРЕКЛЮЧЕНИЕ", modelSwitcherPlaceholder: "Выбрать модель…", catalogOpen: "Каталог", catalogTitle: "БИБЛИОТЕКА МОДЕЛЕЙ", catalogSubtitle: "Автономные пакеты устройств", catalogClose: "Закрыть каталог", catalogSearch: "Название, производитель или part number…", catalogSearchLabel: "ПОИСК ПО БИБЛИОТЕКЕ", catalogCategoryLabel: "КАТЕГОРИЯ", catalogEntries: "МОДЕЛИ", catalogFooter: "Пакеты моделей хранятся локально. Аккаунт и удалённый сервис каталога не нужны.", catalogAllCategories: "Все категории", catalogEmpty: "Подходящих моделей не найдено.", catalogLoad: "Открыть модель", catalogLoaded: "Уже загружена", catalogLoading: "Загрузка пакета…", catalogStatusResearch: "ИССЛЕДОВАТЕЛЬСКИЙ МАКЕТ", catalogGeometryProxy: "Условная геометрия · не CAD", catalogFamilyIdentity: "Семейство платформы · без единого артикула", catalogPackageVersion: "Пакет", catalogChoosePackage: "Выберите соответствующий файл .sbsmodel.", catalogError: "Не удалось открыть пакет из каталога.", structure: "СТРУКТУРА", components: "Компоненты",
    searchPlaceholder: "Компонент, маркировка, утверждение или источник…", assemblyTree: "ДЕРЕВО СБОРКИ", showAll: "Показать все",
    proxyNote: "Условная геометрия · не CAD", explore: "Обзор", disassemble: "Разборка",
    understand: "Принцип работы", animate: "Анимировать", assembledState: "СОБРАННОЕ СОСТОЯНИЕ", demoScene: "ДЕМО-СЦЕНА · ЛОКАЛЬНО",
    assemblyState: "СОСТОЯНИЕ СБОРКИ", assemble: "Собрать", explode: "Разобрать",
    assembled: "СОБРАНО", exploded: "РАЗОБРАНО", processLayers: "СЛОИ ПРОЦЕССОВ",
    qualitativeOnly: "СХЕМА · НЕ CFD / SPICE", cooling: "Воздушный поток", powerDelivery: "Путь питания", gpuCompute: "Архитектура GPU", graphicsPipeline: "Тракты GPU", videoCodec: "Медиаблоки видео",
    powerOn: "Включить анимацию", powerOff: "Остановить анимацию", operatingState: "ВИЗУАЛИЗАЦИЯ РАБОТЫ", simulationSpeed: "Скорость анимации",
    cameraPreset: "РАКУРС", viewIso: "Изометрия", viewFan: "Сторона вентиляторов", viewPcb: "Сторона PCB", viewIo: "Планка I/O", viewPower: "Разъём питания", viewTop: "Сверху",
    sliceToggle: "Сечение", sliceAxis: "Ось", sliceNote: "Визуальный срез · без крышек · не CAD",
    measure: "Измерить", clearMeasurement: "Сброс", measureIdle: "Измерение выключено · только пространство модели", measurePrompt: "Нажмите на видимую поверхность, чтобы задать точку 1 из 2", measureFirstPoint: "Точка 1 из 2 задана · выберите вторую", measureDistance: "Расстояние", measureDisclaimer: "ед. модели", measureNoHit: "Нажмите на видимую поверхность модели", measureEnabled: "Инструмент измерения включён", measureDisabled: "Инструмент измерения выключен", modelUnits: "единицы модели", measureNote: "Не подтверждённый физический размер",
    clearLayer: "Сбросить слой", inspection: "ИНСПЕКЦИЯ", componentDetails: "Карточка компонента",
    selectComponent: "Выберите компонент", selectHint: "Выберите деталь в 3D-окне или дереве сборки, чтобы изучить её назначение и источники.",
    identity: "ИДЕНТИФИКАЦИЯ", parent: "Родитель", geometry: "Геометрия", evidence: "ДОКАЗАТЕЛЬНОСТЬ", technicalClaims: "ТЕХНИЧЕСКИЕ УТВЕРЖДЕНИЯ", claimUnknown: "Неизвестно", yes: "Да", no: "Нет", claimSources: "Источники утверждения", technicalRelationships: "ТЕХНИЧЕСКИЕ СВЯЗИ", qualitativeRelation: "Качественная связь", noRelationshipSource: "Источник не зарегистрирован", exportData: "ДАННЫЕ МОДЕЛИ", exportJson: "Экспорт JSON", exportCsv: "CSV ZIP", exportComplete: "Экспорт подготовлен · локально", exportFailed: "Ошибка экспорта", assemblyEvidence: "ДОКАЗАТЕЛЬСТВА РАЗБОРКИ", noVerifiedSequence: "Подтверждённая последовательность разборки для этой модели пока не составлена.", sourceObservations: "НАБЛЮДЕНИЯ В ИСТОЧНИКАХ · НЕ ШАГИ РАЗБОРКИ", stepLabel: "Шаг", toolsLabel: "Инструменты", safetyLabel: "Безопасность", prerequisitesLabel: "Предварительные шаги", openAtSource: "Открыть источник", runProcedureStep: "Показать действие в 3D", resetProcedureScene: "Сбросить разборку", previousProcedureStep: "Назад", nextProcedureStep: "Далее", procedureReady: "Сцена процедуры готова", procedureReset: "Сцена возвращена в исходное состояние", procedureNoGeometry: "Для этого действия нет отдельной физической геометрии; выбран соответствующий компонент.", procedureExactSlide: "Заданный производителем сдвиг: 12,7 мм (1/2 дюйма)", procedureApproxMotion: "Условное извлечение; величина перемещения IBM не указана.", procedureProgress: "Шаг", procedureBranchLabel: "ВЫБЕРИТЕ ВЕТВЬ FRU", procedureCommonBranch: "Только общая подготовка", procedureChooseBranch: "Общая подготовка завершена. Выберите одну ветвь FRU: руководство не требует единой линейной разборки.", procedureRunnerTitle: "ПОШАГОВАЯ 3D-ПРОЦЕДУРА", procedureRunnerDisclaimer: "Только учебное воспроизведение в сцене · не управляет реальной аппаратурой. Условные зазоры не измерены.", procedureRunnerNext: "Показать следующий шаг", procedureRunnerPrevious: "Предыдущий шаг", procedureRunnerReset: "Сбросить процедуру", procedureRunnerReady: "Начните с безопасного отключения питания и открытия корпуса.", procedureRunnerVisualized: "Визуальное состояние применено в 3D-модели. Это не подтверждает выполнение физической операции.", procedureRunnerComplete: "Выбранная ветвь FRU завершена в учебной сцене.", procedureRunnerNoop: "Геометрия не перемещается: в стартовой конфигурации 16 КБ этот узел отсутствует.", procedureRunnerSafety: "БЕЗОПАСНОСТЬ И ПРИМЕЧАНИЕ К ПРОЦЕДУРЕ", procedureGroup: "ВЕТВЬ ПРОЦЕДУРЫ", commonEntryMode: "Общая начальная подготовка", conditionalBranchMode: "Условная ветвь", sharedPreparationMode: "Общая подготовка разъёмов", independentFruBranchMode: "Независимая ветвь FRU", replacementFragments: "ДОКУМЕНТИРОВАННЫЕ ФРАГМЕНТЫ УСТАНОВКИ · НЕ ПОЛНАЯ ОБРАТНАЯ СБОРКА", sequenceDisplayOnly: "Порядок отображения · следуйте подтверждённым зависимостям и выбранной ветви FRU.",
    sources: "ИСТОЧНИКИ", accuracyFooter: "Неизвестное остаётся неизвестным. Точность CAD не подразумевается.",
    ready: "ГОТОВО", localFirst: "ЛОКАЛЬНО · БЕЗ АККАУНТА", openModel: "Открыть модель",
    noSelection: "Компонент не выбран", componentsCount: "компонентов",
    loadError: "Не удалось загрузить этот GLB-файл.", loadedGlb: "GLB ЗАГРУЖЕН · ЛОКАЛЬНЫЙ ФАЙЛ", loadedPackage: "ПАКЕТ SBS MODEL · ЛОКАЛЬНО", loadedBundled: "ВСТРОЕННАЯ МОДЕЛЬ · ЛОКАЛЬНО",
    demoLoaded: "ДЕМО-СЦЕНА · ЛОКАЛЬНО", loading: "ЗАГРУЗКА МОДЕЛИ…", isolate: "Изолировано",
    allVisible: "Все компоненты видимы", layerCooling: "Слой охлаждения · качественно",
    layerPower: "Путь питания · качественно", layerCompute: "Архитектура GPU · логическая карта", layerGraphicsPipeline: "Тракты GPU · концептуальная схема", layerVideoCodec: "NVENC / NVDEC · логическая карта", noWebgl: "В этом браузере недоступен WebGL.",
    source: "Источник", noSources: "Для этого компонента нет прямой ссылки на источник.",
    modelLoaded: "Модель готова", glbPicker: "Выберите файл .glb", learn: "Обучение", learning: "ОБУЧЕНИЕ", authoredAnimations: "АНИМАЦИИ ПАКЕТА", runtimeDiagnostics: "Диагностика выполнения", diagnosticsModel: "ID модели", diagnosticsComponents: "Найдено компонентов", diagnosticsProcedure: "Шаг разборки", diagnosticsAnimation: "Клип анимации", diagnosticsMotion: "Смещение в мире", clipSelect: "Выберите клип", clipTimeline: "Шкала анимации", clipPlay: "Пуск", clipPause: "Пауза", clipStop: "Стоп / сброс", clipReady: "Готово", clipPlaying: "Воспроизведение", clipPaused: "Пауза", clipCompleted: "Завершено", clipTime: "ВРЕМЯ", clipEvidenceNote: "Анимация из пакета · не физическая симуляция", clipEducationalApproximation: "Учебное приближение · длительность не является измеренным RPM", clipIllustrative: "Условное движение · не измеренный механизм", clipDocumentedMotion: "Движение подтверждено источником", clipMeasuredMotion: "Измеренное движение · источник и метод указаны", linkedComponents: "СВЯЗАННЫЕ КОМПОНЕНТЫ", assumptions: "ДОПУЩЕНИЯ И ОГРАНИЧЕНИЯ", processLayer: "СЛОЙ ПРОЦЕССА", fileTooLarge: "GLB превышает лимит 256 МБ.", packageTooLarge: "Пакет SBS model превышает лимит 512 МБ.", externalResources: "Этот GLB ссылается на внешние файлы. Разрешены только самодостаточные GLB.", question: "ВОПРОС", checkAnswer: "Проверить ответ", nextQuestion: "Следующий вопрос", finishQuiz: "Завершить", restartQuiz: "Повторить", correctAnswer: "Верно", wrongAnswer: "Не совсем", quizComplete: "Тест завершён", yourScore: "Ваш результат", chooseAnswer: "Сначала выберите ответ", learningProgressSaved: "Прогресс сохранён в этом браузере", learningProgressLocal: "ПРОГРЕСС · ЭТОТ БРАУЗЕР", learningProgressSession: "Локальное хранилище недоступно · только эта сессия", mobileViewer: "3D", mobileStructure: "Структура", mobileDetails: "Детали", compare: "Сравнить", compareTitle: "СРАВНЕНИЕ МОДЕЛЕЙ", compareLeft: "МОДЕЛЬ А · АКТИВНЫЙ ПАКЕТ", compareRight: "МОДЕЛЬ Б · ПАКЕТ ДЛЯ СРАВНЕНИЯ", compareChoosePackage: "Загрузить второй пакет .sbsmodel", compareClearPackage: "Убрать сравнение", compareWaiting: "Загрузите проверенный пакет .sbsmodel для сопоставления семантических данных.", compareLoaded: "Пакет для сравнения проверен", compareError: "Не удалось проверить пакет для сравнения", compareSku: "PART NUMBER", compareGeometry: "ДОСТОВЕРНОСТЬ ГЕОМЕТРИИ", comparePcb: "РЕВИЗИЯ PCB", compareSpecifications: "СРАВНЕНИЕ ХАРАКТЕРИСТИК", compareClaims: "УТВЕРЖДЕНИЯ С ИСТОЧНИКАМИ", compareCoverage: "ПОКРЫТИЕ ИНВЕНТАРЯ КОМПОНЕНТОВ", compareShared: "Общие ID", compareLeftOnly: "Записаны только в пакете А", compareRightOnly: "Записаны только в пакете Б", compareSame: "Значения совпадают", compareDifferent: "Значения различаются", compareUnknownBoth: "Неизвестно в обоих", compareUnknownLeft: "Неизвестно в А", compareUnknownRight: "Неизвестно в Б", compareNotRecordedLeft: "Не записано в А", compareNotRecordedRight: "Не записано в Б", compareOnlyLeft: "Только в пакете А", compareOnlyRight: "Только в пакете Б", compareUnknown: "Неизвестно", compareNotRecorded: "Не записано", compareEvidenceA: "Доказательность А", compareEvidenceB: "Доказательность Б", compareSourcesA: "Источники А", compareSourcesB: "Источники Б", compareNoClaims: "Сопоставимых утверждений в пакетах нет.", compareNoSpecifications: "В этих пакетах нет записанных характеристик.", compareCoverageNote: "Различия показывают только покрытие инвентаря в пакетах и не доказывают физическое отсутствие детали.", compareLimitations: "ОГРАНИЧЕНИЯ ИНТЕРПРЕТАЦИИ", compareLimitationsList: ["Сравниваются проверенные семантические пакеты, а не сами физические устройства.", "Неизвестные значения не выводятся из другого SKU или ревизии PCB.", "Отсутствующее поле пакета не доказывает физическое отсутствие детали.", "Различия ID компонентов не доказывают физическое добавление или удаление деталей.", "Геометрия 3D, CAD, BoardView, трассировка PCB и совместимость по размерам не сравниваются."], comparePackageModel: "ID модели"
  }
};

function t(key) { return UI[state.language][key] ?? key; }
function setStatus(message) { $("#app-status").textContent = message; }
function setLoadState(message) { $("#load-state").textContent = message; }

function setMobilePanel(panel) {
  if (!["viewer", "structure", "details"].includes(panel) || !appShell) return;
  appShell.dataset.mobilePanel = panel;
  document.querySelectorAll(".mobile-panel-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.mobilePanel === panel));
  });
}



function renderAnimationClipOptions() {
  const select = $("#animation-clip-select");
  const panel = $("#animation-player-panel");
  if (!select || !panel) return;
  const clips = Array.isArray(ANIMATION_PACKAGE.clips) ? ANIMATION_PACKAGE.clips : [];
  panel.hidden = clips.length === 0 || !state.animationPlayer;
  const selectedId = state.animationPlayer?.clip?.id ?? clips[0]?.id ?? "";
  select.replaceChildren();
  clips.forEach((clip) => {
    const option = document.createElement("option");
    option.value = clip.id;
    option.textContent = localizedPackageText(clip.title) || clip.id;
    select.append(option);
  });
  select.value = selectedId;
  select.setAttribute("aria-label", t("clipSelect"));
  $("#animation-seek")?.setAttribute("aria-label", t("clipTimeline"));
  updateAnimationPlayerUI();
}

function animationStatusLabel(status) {
  const labels = {
    idle: "clipReady",
    ready: "clipReady",
    playing: "clipPlaying",
    paused: "clipPaused",
    completed: "clipCompleted"
  };
  return t(labels[status] ?? "clipReady");
}

function renderRuntimeDiagnostics() {
  const setValue = (id, value) => {
    const element = $("#" + id);
    if (element) element.textContent = value || "—";
  };
  if (!canvasHost) return;
  const data = canvasHost.dataset;
  const procedureStep = data.procedureStepId || "—";
  const procedureMotion = data.procedureMotion || "idle";
  const procedureTargets = data.procedureTargetCount || "0";
  const procedureApplied = data.procedureAppliedCount || "0";
  setValue("diagnostics-model", MODEL.id || MODEL.name || "—");
  setValue("diagnostics-components", String(state.componentNodes.size));
  setValue("diagnostics-procedure", `${procedureStep} · ${procedureMotion} · ${procedureApplied}/${procedureTargets}`);
  const player = state.animationPlayer;
  const snapshot = player?.getSnapshot();
  setValue("diagnostics-animation", player?.clip
    ? `${player.clip.id} · ${snapshot.status} · ${snapshot.movedTargetCount}/${snapshot.targetCount}`
    : `no active clip · ${ANIMATION_PACKAGE.clips?.length ?? 0} available`);
  const parseDeltas = (value) => {
    try { return JSON.parse(value || "[]"); } catch { return []; }
  };
  const animationDeltas = parseDeltas(data.animationWorldDeltas);
  const procedureDeltas = parseDeltas(data.procedureWorldDeltas);
  const formatDeltas = (items) => items.map((item) => {
    const vector = (item.delta ?? []).map((value) => Number(value).toFixed(1)).join(", ");
    return `${item.targetId || item.id || "target"}: [${vector}]`;
  }).join("; ");
  const motion = [
    animationDeltas.length ? "animation " + formatDeltas(animationDeltas) : "",
    procedureDeltas.length ? "procedure " + formatDeltas(procedureDeltas) : ""
  ].filter(Boolean).join(" | ");
  setValue("diagnostics-motion", motion || "no displacement recorded");
}

function updateAnimationPlayerUI(snapshot = state.animationPlayer?.getSnapshot()) {
  const panel = $("#animation-player-panel");
  if (!panel) return;
  if (!state.animationPlayer || !snapshot?.clipId) {
    panel.hidden = true;
    if (canvasHost) {
      canvasHost.dataset.animationStatus = "idle";
      canvasHost.dataset.animationProgress = "0";
      canvasHost.dataset.animationTargetCount = "0";
      canvasHost.dataset.animationMovedTargetCount = "0";
      canvasHost.dataset.animationWorldDeltas = "[]";
    }
    renderRuntimeDiagnostics();
    return;
  }
  panel.hidden = false;
  panel.dataset.status = snapshot.status;
  if (canvasHost) {
    canvasHost.dataset.animationStatus = snapshot.status;
    canvasHost.dataset.animationProgress = String(snapshot.progress);
    canvasHost.dataset.animationTargetCount = String(snapshot.targetCount ?? 0);
    canvasHost.dataset.animationMovedTargetCount = String(snapshot.movedTargetCount ?? 0);
    canvasHost.dataset.animationWorldDeltas = JSON.stringify(snapshot.worldDeltas ?? []);
  }
  renderRuntimeDiagnostics();
  const select = $("#animation-clip-select");
  const play = $("#animation-play");
  const pause = $("#animation-pause");
  const stop = $("#animation-stop");
  const seek = $("#animation-seek");
  const status = $("#animation-status");
  const time = $("#animation-time");
  const evidenceNote = $("#animation-evidence-note");
  if (select && select.value !== snapshot.clipId) select.value = snapshot.clipId;
  if (play) play.disabled = snapshot.status === "playing";
  if (pause) pause.disabled = snapshot.status !== "playing";
  if (stop) stop.disabled = snapshot.status === "ready" && snapshot.time === 0;
  if (seek) {
    seek.disabled = false;
    seek.value = String(Math.round(snapshot.progress * 1000));
  }
  if (evidenceNote) {
    const evidenceLabel = {
      educational_approximation: "clipEducationalApproximation",
      illustrative: "clipIllustrative",
      documented_motion: "clipDocumentedMotion",
      measured_motion: "clipMeasuredMotion"
    }[state.animationPlayer.clip?.evidence_status] ?? "clipEvidenceNote";
    const description = localizedPackageText(state.animationPlayer.clip?.description);
    evidenceNote.textContent = description ? `${t(evidenceLabel)} · ${description}` : t(evidenceLabel);
  }
  if (status) {
    status.textContent = animationStatusLabel(snapshot.status);
    status.dataset.status = snapshot.status;
  }
  if (time) time.textContent = `${(snapshot.time / 1000).toFixed(2)} / ${(snapshot.duration / 1000).toFixed(2)} s`;
}

function setupAnimationPlayer(root) {
  state.animationPlayer?.dispose();
  state.animationPlayer = null;
  const clips = Array.isArray(ANIMATION_PACKAGE.clips) ? ANIMATION_PACKAGE.clips : [];
  const panel = $("#animation-player-panel");
  if (!clips.length || !root) {
    if (panel) panel.hidden = true;
    if (canvasHost) {
      canvasHost.dataset.animationStatus = "idle";
      canvasHost.dataset.animationProgress = "0";
      canvasHost.dataset.animationTargetCount = "0";
      canvasHost.dataset.animationMovedTargetCount = "0";
      canvasHost.dataset.animationWorldDeltas = "[]";
    }
    renderRuntimeDiagnostics();
    return;
  }
  state.animationPlayer = new AnimationPlayer(root, clips, {
    onChange: (snapshot) => updateAnimationPlayerUI(snapshot)
  });
  renderAnimationClipOptions();
  state.animationPlayer.selectClip(clips[0].id);
}

function localizedCatalogValue(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return value[state.language] ?? value.en ?? value.ru ?? "";
}

function catalogGeometryLabel(entry) {
  return entry.geometryStatus === "illustrative_proxy_not_cad"
    ? t("catalogGeometryProxy")
    : entry.geometryStatus.replaceAll("_", " ");
}

function catalogStatusLabel(entry) {
  return entry.status === "research_blockout"
    ? t("catalogStatusResearch")
    : entry.status.replaceAll("_", " ").toUpperCase();
}

function renderModelSwitcher() {
  const selector = $("#model-switcher");
  if (!selector) return;
  const activeId = state.catalogLoadingId || state.loadedCatalogModelId || "";
  selector.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = t("modelSwitcherPlaceholder");
  selector.append(placeholder);
  MODEL_CATALOG.models.filter((entry) => entry.published === true).forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.id;
    option.textContent = `${entry.manufacturer} · ${localizedCatalogValue(entry.name)}`;
    selector.append(option);
  });
  selector.value = activeId;
  selector.disabled = Boolean(state.catalogLoadingId);
  selector.setAttribute("aria-label", t("modelSwitcherLabel"));
}

function renderCatalog() {
  const host = $("#catalog-results");
  const count = $("#catalog-count");
  const categorySelect = $("#catalog-category");
  if (!host || !categorySelect) return;
  renderModelSwitcher();

  if (categorySelect.dataset.initialized !== "true") {
    categorySelect.replaceChildren();
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = t("catalogAllCategories");
    categorySelect.append(all);
    MODEL_CATALOG.categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.id;
      option.textContent = localizedCatalogValue(category.label);
      categorySelect.append(option);
    });
    categorySelect.dataset.initialized = "true";
  } else {
    const all = categorySelect.options[0];
    if (all) all.textContent = t("catalogAllCategories");
    [...categorySelect.options].slice(1).forEach((option) => {
      const category = MODEL_CATALOG.categories.find((item) => item.id === option.value);
      if (category) option.textContent = localizedCatalogValue(category.label);
    });
  }
  categorySelect.value = state.catalogCategory;

  const query = state.catalogSearch.trim().toLocaleLowerCase();
  const entries = MODEL_CATALOG.models.filter((entry) => entry.published !== false).filter((entry) => {
    if (state.catalogCategory !== "all" && entry.categoryId !== state.catalogCategory) return false;
    const searchable = [
      entry.id, entry.manufacturer, entry.name.en, entry.name.ru, entry.partNumber,
      entry.category.en, entry.category.ru, entry.summary.en, entry.summary.ru, ...entry.tags
    ].join(" ").toLocaleLowerCase();
    return !query || searchable.includes(query);
  });

  host.replaceChildren();
  if (count) count.textContent = String(entries.length);
  if (!entries.length) {
    const empty = document.createElement("p");
    empty.className = "catalog-empty";
    empty.textContent = t("catalogEmpty");
    host.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "catalog-card";
    card.dataset.modelId = entry.id;
    if (state.loadedCatalogModelId === entry.id) card.classList.add("is-loaded");

    const category = document.createElement("span");
    category.className = "catalog-card-category";
    category.textContent = localizedCatalogValue(entry.category);
    const title = document.createElement("h3");
    title.textContent = localizedCatalogValue(entry.name);
    const manufacturer = document.createElement("p");
    manufacturer.className = "catalog-manufacturer";
    manufacturer.textContent = entry.manufacturer;
    const sku = document.createElement("p");
    sku.className = "catalog-sku";
    sku.textContent = entry.partNumber || (entry.identityScope === "platform_family" ? t("catalogFamilyIdentity") : "");
    sku.dataset.identityScope = entry.identityScope || "exact_sku";
    const summary = document.createElement("p");
    summary.className = "catalog-summary";
    summary.textContent = localizedCatalogValue(entry.summary);

    const metadata = document.createElement("div");
    metadata.className = "catalog-metadata";
    const status = document.createElement("span");
    status.className = "catalog-status";
    status.textContent = catalogStatusLabel(entry);
    const geometry = document.createElement("span");
    geometry.className = "catalog-geometry";
    geometry.textContent = catalogGeometryLabel(entry);
    metadata.append(status, geometry);

    const footer = document.createElement("div");
    footer.className = "catalog-card-footer";
    const version = document.createElement("span");
    version.className = "catalog-version";
    version.textContent = `${t("catalogPackageVersion")} v${entry.packageVersion}`;
    const open = document.createElement("button");
    open.type = "button";
    open.className = "catalog-load-button";
    open.dataset.openCatalogModel = entry.id;
    if (state.loadedCatalogModelId === entry.id) {
      open.disabled = true;
      open.textContent = t("catalogLoaded");
    } else if (state.catalogLoadingId === entry.id) {
      open.disabled = true;
      open.textContent = t("catalogLoading");
    } else {
      open.textContent = t("catalogLoad");
      open.addEventListener("click", () => openCatalogEntry(entry));
    }
    footer.append(version, open);
    card.append(category, title, manufacturer, sku, summary, metadata, footer);
    host.append(card);
  });
}

function openCatalog() {
  const dialog = $("#model-catalog-dialog");
  if (!dialog || dialog.open) return;
  state.catalogOpener = document.activeElement;
  state.catalogSearch = $("#catalog-search")?.value ?? state.catalogSearch;
  dialog.showModal();
  renderCatalog();
  $("#catalog-search")?.focus();
}

function closeCatalog() {
  const dialog = $("#model-catalog-dialog");
  if (dialog?.open) dialog.close();
}

async function fetchCatalogPackage(entry) {
  const embedded = globalThis.SBS_CATALOG_PACKAGE_DATA_URLS?.[entry.id];
  if (!embedded && window.location.protocol === "file:") return null;

  const packageUrl = embedded || `${import.meta.env.BASE_URL}${entry.packagePath}`;
  const response = await fetch(packageUrl);
  if (!response.ok) throw new Error(`Package request failed: ${response.status}`);
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/html")) throw new Error("The catalogue package URL returned HTML");
  const buffer = await response.arrayBuffer();
  if (!buffer.byteLength || buffer.byteLength > MAX_MODEL_PACKAGE_BYTES) {
    throw new Error("The catalogue package size is outside the allowed range");
  }
  const filename = entry.packagePath.split("/").pop();
  const file = { name: filename, size: buffer.byteLength, arrayBuffer: async () => buffer };
  const modelPackage = await loadModelPackage(file);
  if (modelPackage.report.modelId !== entry.packageModelId) {
    throw new Error("Catalog package ID does not match the selected model");
  }
  return { filename, modelPackage };
}

async function openCatalogEntry(entry) {
  if (!entry) return;
  if (state.loadedCatalogModelId === entry.id) {
    closeCatalog();
    return;
  }
  state.catalogLoadingId = entry.id;
  renderCatalog();
  let handedToViewer = false;
  try {
    const loaded = await fetchCatalogPackage(entry);
    if (!loaded) {
      state.pendingCatalogModelId = entry.packageModelId;
      closeCatalog();
      setStatus(t("catalogChoosePackage"));
      $("#model-file").click();
      return;
    }
    closeCatalog();
    handedToViewer = true;
    loadArrayBuffer(loaded.modelPackage.sceneBuffer, loaded.filename, "package", loaded.modelPackage.data);
    setStatus(`Package validated · ${loaded.modelPackage.report.componentCount} components · ${loaded.modelPackage.report.relationshipCount} relationships`);
  } catch (error) {
    state.catalogLoadingId = null;
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = `${t("catalogError")} ${error.message || ""}`;
    setStatus(t("catalogError"));
  } finally {
    if (!handedToViewer) state.catalogLoadingId = null;
    renderCatalog();
  }
}

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
  if ($("#model-catalog-dialog")?.open) renderCatalog();
  if (state.compareMode) renderComparison();
  else if (state.activeLayer) renderProcessLayer();
  else if (state.learningMode) renderLearning();
  else if (state.selectedId) renderDetails(state.selectedId);
  updateMeasurementReadout();
  renderAnimationClipOptions();
}

function tag(object, id, evidence = "illustrative", geometry = "proxy") {
  object.userData.sbs_component_id = id;
  object.userData.sbs_evidence_status = evidence;
  object.userData.sbs_geometry_status = geometry;
  return object;
}

function makeGroup(parent, id, name, position = [0, 0, 0], evidence = "visible_exact_model", geometry = "assembly_node") {
  const group = new THREE.Group();
  group.name = name;
  group.position.set(...position);
  tag(group, id, evidence, geometry);
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
  const geometry = new THREE.ShapeGeometry(shape, 12);
  geometry.rotateX(Math.PI / 2);
  return geometry;
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
  rotor.position.y = -1.5;
  tag(rotor, `assembly.fan.${index}.rotor`, "illustrative", "assembly_node");
  rotor.userData.sbs_fan_rotor = true;
  rotor.userData.sbs_fan_axis = "y";
  fan.add(rotor);

  for (let blade = 0; blade < 7; blade += 1) {
    const bladeMesh = new THREE.Mesh(
      createBladeGeometry(),
      new THREE.MeshStandardMaterial({ color: 0x242c34, side: THREE.DoubleSide, roughness: 0.68 })
    );
    bladeMesh.rotation.y = (Math.PI * 2 * blade) / 7;
    bladeMesh.name = `Fan ${index} blade ${blade + 1}`;
    tag(bladeMesh, `fan.${index}.blade.${blade + 1}`);
    rotor.add(bladeMesh);
  }
  // Exact-model teardown: three screws per replaceable fan; individual positions unknown.
  for (let screwIndex = 1; screwIndex <= 3; screwIndex += 1) {
    const screwId = `fastener.fan.${index}.${String(screwIndex).padStart(2, "0")}`;
    makeGroup(fan, screwId, `Fan ${index} mounting screw ${screwIndex} · location unmapped`,
      [0, 0, 0], "visible_exact_model", "logical_only");
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
  const fasteners = makeGroup(root, "assembly.fasteners", "Eight cooler/shroud retention screws", [0, 0, 0], "visible_exact_model", "assembly_node");
  // Only the four GPU-area screw centres are photo-estimated in the current scene.
  // The four far/rear screws remain count-confirmed logical nodes without fake coordinates.
  const gpuScrewPositions = [[72, 31], [122, 31], [72, 83], [122, 83]];
  gpuScrewPositions.forEach(([x, z], index) => {
    const id = "fastener.cooler." + String(index + 1).padStart(2, "0");
    const head = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 1.1, 24),
      materials.metal
    );
    head.name = "GPU-area cooler screw " + (index + 1) + " · photo-position estimate";
    head.position.set(x, 18.2, z);
    tag(head, id, "visible_exact_model", "illustrative_proxy");
    fasteners.add(head);
    const crossA = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.25, 0.45), materials.shroud);
    crossA.position.set(x, 18.82, z);
    crossA.name = "Illustrative Phillips recess A";
    tag(crossA, id, "illustrative", "illustrative_proxy");
    fasteners.add(crossA);
    const crossB = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 2.2), materials.shroud);
    crossB.position.set(x, 18.82, z);
    crossB.name = "Illustrative Phillips recess B";
    tag(crossB, id, "illustrative", "illustrative_proxy");
    fasteners.add(crossB);
  });
  for (let index = 5; index <= 8; index += 1) {
    const id = "fastener.cooler." + String(index).padStart(2, "0");
    makeGroup(fasteners, id, "Rear-area cooler screw " + (index - 4) + " · position unmapped",
      [0, 0, 0], "visible_exact_model", "logical_only");
  }

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

  // Match the selectable thermal-interface structure in the full Blender asset.
  // Dimensions and placement below remain visual placeholders, not replacement-pad specs.
  const thermalInterface = makeGroup(cooling, "cooling.thermal_interface", "Thermal interface group", [0, 0, 0], "teardown_supported", "illustrative_proxy");
  makeMesh(thermalInterface, "cooling.thermal_paste.gpu", "GPU thermal compound proxy",
    new THREE.BoxGeometry(19, 0.35, 19), materials.copper, [97, -5, 57]);
  const memoryPads = makeGroup(thermalInterface, "cooling.thermal_pad.memory", "Memory thermal pads", [0, 0, 0], "teardown_supported", "illustrative_proxy");
  for (let index = 0; index < 6; index += 1) {
    const x = 50 + index * 16;
    const padId = "cooling.thermal_pad.memory." + String(index + 1).padStart(2, "0");
    makeMesh(memoryPads, padId, "Memory thermal pad proxy " + (index + 1),
      new THREE.BoxGeometry(14, 0.65, 12), materials.metal, [x, -5.6, 57], "illustrative");
  }
  const vrmPads = makeGroup(thermalInterface, "cooling.thermal_pad.vrm", "Power-stage thermal pads", [0, 0, 0], "teardown_supported", "illustrative_proxy");
  makeMesh(vrmPads, "cooling.thermal_pad.vrm.01", "Inductor-area thermal pad proxy · contact extent unmeasured",
    new THREE.BoxGeometry(34, 0.65, 18), materials.metal, [145, -5.6, 78], "illustrative");
  makeMesh(thermalInterface, "cooling.vrm.copper_contact", "Copper plate contacting MOSFET row · proxy",
    new THREE.BoxGeometry(38, 1, 17), materials.copper, [147, -4.8, 64], "teardown_supported");

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

  const gpuPackage = makeMesh(pcbAssembly, "chip.gpu.ga106", "GPU package proxy",
    new THREE.BoxGeometry(40, 5, 40), materials.chip, [97, 14, 57], "teardown_supported");
  // Architecture entries are logical navigation nodes, not physical silicon floorplan geometry.
  const gpuDie = makeGroup(gpuPackage, "chip.gpu.die", "GA106 die · logical proxy", [0, 0, 0], "manufacturer_data", "logical_only");
  const smCluster = makeGroup(gpuDie, "chip.gpu.sm.cluster", "GA106 SM cluster · logical", [0, 0, 0], "manufacturer_data", "logical_only");
  for (const [id, name] of [
    ["chip.gpu.cuda_core.array", "CUDA core array · 3,584"],
    ["chip.gpu.tensor_core.array", "Tensor Core array · 112"],
    ["chip.gpu.rt_core.array", "RT Core array · 28"],
    ["chip.gpu.tmu.array", "Texture unit array · 112"],
    ["chip.gpu.rop.array", "ROP array · 48"]
  ]) {
    makeGroup(smCluster, id, name, [0, 0, 0], "manufacturer_data", "logical_only");
  }

  const memoryBus = makeGroup(pcbAssembly, "chip.memory.gddr6.bus", "GDDR6 interface · 192-bit logical", [0, 0, 0], "manufacturer_data", "logical_only");
  for (let index = 0; index < 6; index += 1) {
    const channelId = "chip.memory.channel." + String(index + 1).padStart(2, "0");
    makeGroup(memoryBus, channelId, "GDDR6 interface presentation segment " + (index + 1),
      [50 + index * 16, 14, 57], "illustrative", "logical_only");
  }

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
  const shuntCluster = makeGroup(powerStage, "power.shunt.cluster", "Two current-sense shunts · proxy");
  makeMesh(shuntCluster, "power.shunt.8pin", "Auxiliary 8-pin shunt · 5 mΩ stated",
    new THREE.BoxGeometry(3, 1.2, 2), materials.metal, [-18, -2, -15], "teardown_supported");
  makeGroup(shuntCluster, "power.shunt.pcie_slot", "PCIe-slot 12 V shunt · value unknown",
    [-10, -2, -15], "teardown_supported", "logical_only");
  makeGroup(powerStage, "power.fuse.input", "Input protection fuse · rating unknown",
    [22, -2, 12], "teardown_supported", "logical_only");
  const mosfetRow = makeGroup(powerStage, "power.switching_device.cluster", "MOSFET row · copper plate contact");
  for (let index = 0; index < 6; index += 1) {
    makeMesh(mosfetRow, `power.switching_device.proxy.${index + 1}`, `MOSFET visual proxy ${index + 1}`,
      new THREE.BoxGeometry(3.5, 2, 4), materials.connector, [-9 + index * 5, -2, -13]);
  }
  makeGroup(powerStage, "power.inductor.candidate.1", "Inductor 1 · exact teardown observed",
    [-4, -2, -5], "teardown_supported", "illustrative_proxy");
  makeGroup(powerStage, "power.inductor.candidate.2", "Inductor 2 · exact teardown observed",
    [12, -2, 8], "teardown_supported", "illustrative_proxy");
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
  captureProcedureSceneBaseline(root);
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

    const isDeviceRoot = id === MODEL.id || id === "assembly.card.root";
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
    observed_peak_frequency: ["Наблюдаемая пиковая частота", "Observed peak frequency"],
    observed_heatpipe_tube_diameter_estimate: ["Оценочный диаметр трубки теплотрубки", "Estimated heatpipe tube diameter"],
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
    gddr6_package_part_number: ["Маркировка микросхем памяти", "GDDR6 package part number"],
    effective_memory_clock: ["Эффективная частота памяти", "Effective memory clock"],
    total_graphics_power: ["Полная мощность видеокарты", "Total graphics power"],
    recommended_power_supply: ["Рекомендуемая мощность БП", "Recommended power supply"],
    display_interface_versions: ["Версии видеовыходов", "Display interface versions"],
    slot_width: ["Ширина по слотам", "Slot width"],
    max_digital_resolution: ["Максимальное цифровое разрешение", "Maximum digital resolution"]
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
  const modelLevel = componentId === MODEL.id || componentId === "assembly.card.root";
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

        if (source.identity_reference_url) {
          const identityPage = document.createElement("a");
          identityPage.href = source.identity_reference_url;
          identityPage.target = "_blank";
          identityPage.rel = "noopener noreferrer";
          identityPage.textContent = state.language === "ru" ? "↗ Страница с фото наклейки SKU" : "↗ SKU identity photo page";
          sourceList.append(identityPage);
        }
        if (source.identity_reference_image_url) {
          const identityImage = document.createElement("a");
          identityImage.href = source.identity_reference_image_url;
          identityImage.target = "_blank";
          identityImage.rel = "noopener noreferrer";
          identityImage.textContent = state.language === "ru" ? "↗ Открыть фото маркировки PCB" : "↗ Open PCB label photo";
          sourceList.append(identityImage);
        }
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


function localizedPackageText(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const localized = value[state.language] ?? value.en ?? value.ru;
    return typeof localized === "string" ? localized : "";
  }
  return "";
}

function localizedPackageList(value) {
  const items = Array.isArray(value) ? value : value == null ? [] : [value];
  return items.map(localizedPackageText).filter(Boolean);
}

function sourceUrlAtLocator(source, locator) {
  if (!source?.url || typeof locator !== "string") return source?.url ?? "";
  try {
    const url = new URL(source.url);
    const match = locator.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})$/);
    const isYouTube = url.hostname === "youtube.com" || url.hostname === "www.youtube.com" || url.hostname === "youtu.be";
    if (match && isYouTube) {
      const hours = Number(match[1] ?? 0);
      const minutes = Number(match[2]);
      const seconds = Number(match[3]);
      url.searchParams.set("t", `${hours * 3600 + minutes * 60 + seconds}s`);
    }
    return url.href;
  } catch {
    return source.url;
  }
}

function renderProcedureRunner(componentId) {
  const host = $("#procedure-runner");
  if (!host) return;
  const isDeviceRoot = componentId === MODEL.id || componentId === "assembly.card.root";
  const isRootProcedureComponent = isDeviceRoot;
  const controller = state.procedureController;
  const routeData = ASSEMBLY_PACKAGE.procedure_routes;
  host.hidden = !(isDeviceRoot && controller && Array.isArray(routeData?.branches));
  if (host.hidden) return;

  const snapshot = controller.getSnapshot();
  const branchSelect = $("#procedure-branch-select");
  const selectedBranch = snapshot.branchId ?? "";
  if (branchSelect.dataset.modelId !== MODEL.id) {
    branchSelect.replaceChildren();
    const commonOption = document.createElement("option");
    commonOption.value = "";
    commonOption.textContent = t("procedureCommonBranch");
    branchSelect.append(commonOption);
    for (const route of routeData.branches) {
      const option = document.createElement("option");
      option.value = route.id;
      option.textContent = localizedPackageText(route.title);
      branchSelect.append(option);
    }
    branchSelect.dataset.modelId = MODEL.id;
  }
  branchSelect.value = selectedBranch;
  branchSelect.disabled = snapshot.busy;

  const title = $("#procedure-runner-current-title");
  const description = $("#procedure-runner-description");
  const note = $("#procedure-runner-note");
  const safety = $("#procedure-runner-safety");
  const safetyLabel = $("#procedure-runner-safety-label");
  const sourcesHost = $("#procedure-runner-sources");
  const progress = $("#procedure-runner-progress");
  const status = $("#procedure-runner-status");
  const previous = $("#procedure-previous");
  const next = $("#procedure-next");
  const reset = $("#procedure-reset");
  const step = snapshot.currentStep;

  host.dataset.branch = selectedBranch || "common";
  host.dataset.stepId = snapshot.currentStepId ?? "";
  host.dataset.completedCount = String(snapshot.completedStepIds.length);
  host.dataset.busy = String(snapshot.busy);

  progress.textContent = `${Math.max(0, snapshot.stepIndex + 1)} / ${snapshot.stepCount}`;
  title.textContent = step
    ? `${t("stepLabel")} ${Number.isInteger(step.sequence) ? step.sequence : snapshot.stepIndex + 1}: ${localizedPackageText(step.title ?? step.action)}`
    : t("procedureRunnerTitle");
  description.textContent = step ? localizedPackageText(step.description) : t("procedureRunnerReady");

  const baselineOutcome = localizedPackageText(step?.baseline_outcome);
  const actionNotes = localizedPackageList([
    ...(step?.visual_actions ?? []).map((action) => action.note),
    ...(step?.scene_actions ?? []).map((action) => action.note),
    step?.scene_action?.note
  ]);
  const visualizationPolicy = localizedPackageText(ASSEMBLY_PACKAGE.visualization_policy);
  const detailNotes = [baselineOutcome, ...actionNotes, visualizationPolicy].filter(Boolean);
  note.textContent = detailNotes.join(" ");
  note.hidden = detailNotes.length === 0;

  const safetyText = localizedPackageList(step?.safety_notes).join(" ");
  safetyLabel.textContent = t("procedureRunnerSafety");
  safety.textContent = safetyText;
  safety.hidden = !safetyText;
  safetyLabel.hidden = !safetyText;

  sourcesHost.replaceChildren();
  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  for (const sourceId of step?.source_ids ?? []) {
    const source = sourceMap.get(sourceId);
    if (!source?.url) continue;
    const link = document.createElement("a");
    link.className = "assembly-source-link";
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = `↗ ${t("openAtSource")}: ${source.label}`;
    sourcesHost.append(link);
  }

  if (snapshot.busy) status.textContent = t("loading");
  else if (snapshot.branchRequired) status.textContent = t("procedureChooseBranch");
  else if (snapshot.isComplete) status.textContent = t("procedureRunnerComplete");
  else if (step) status.textContent = t("procedureRunnerVisualized");
  else status.textContent = t("procedureRunnerReady");

  previous.disabled = !snapshot.canGoPrevious;
  next.disabled = !snapshot.canGoNext;
  next.textContent = t("procedureRunnerNext");
  reset.disabled = snapshot.stepIndex < 0 || snapshot.busy;
  if (snapshot.branchRequired) branchSelect.focus?.({ preventScroll: true });
}


let procedureSceneBaselineRoot = null;
let procedureSceneBaseline = new Map();
let procedureCurrentIndex = -1;
let procedureAnimationToken = 0;

function captureProcedureSceneBaseline(root) {
  procedureSceneBaselineRoot = root;
  procedureSceneBaseline = new Map();
  procedureCurrentIndex = -1;
  state.componentNodes.forEach((object, id) => {
    procedureSceneBaseline.set(id, {
      position: object.position.clone(),
      visible: object.visible
    });
  });
}

function restoreProcedureSceneBaseline() {
  if (!state.modelRoot || procedureSceneBaselineRoot !== state.modelRoot) {
    captureProcedureSceneBaseline(state.modelRoot);
  }
  procedureAnimationToken += 1;
  procedureSceneBaseline.forEach((base, id) => {
    const object = findNodeById(id);
    if (!object) return;
    object.position.copy(base.position);
    object.visible = base.visible;
  });
  procedureCurrentIndex = -1;
  if (canvasHost) {
    delete canvasHost.dataset.procedureStepId;
    delete canvasHost.dataset.procedureMotion;
    delete canvasHost.dataset.procedureSelectedComponent;
    delete canvasHost.dataset.procedureActionType;
    delete canvasHost.dataset.procedureDirection;
    delete canvasHost.dataset.procedureTargetCount;
    delete canvasHost.dataset.procedureResolvedTargets;
    delete canvasHost.dataset.procedureAppliedCount;
    delete canvasHost.dataset.procedureWorldDeltas;
  }
  const status = $("#assembly-motion-status");
  if (status) status.textContent = t("procedureReset");
  updateProcedureControls();
}

function animateProcedurePositions(entries, duration = 480) {
  const moves = (entries ?? []).filter((entry) => entry?.object && entry?.target);
  if (!moves.length) return;
  const starts = moves.map((entry) => entry.object.position.clone());
  const targets = moves.map((entry) => entry.target.clone());
  if (typeof requestAnimationFrame !== "function") {
    moves.forEach((entry, index) => entry.object.position.copy(targets[index]));
    state.modelRoot?.updateMatrixWorld(true);
    return;
  }
  const token = ++procedureAnimationToken;
  const startedAt = performance.now();
  const tick = (now) => {
    if (token !== procedureAnimationToken) return;
    const progress = Math.min(1, (now - startedAt) / Math.max(1, duration));
    const eased = progress * progress * (3 - 2 * progress);
    moves.forEach((entry, index) => entry.object.position.lerpVectors(starts[index], targets[index], eased));
    state.modelRoot?.updateMatrixWorld(true);
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function animateProcedurePosition(object, target, duration = 480) {
  animateProcedurePositions([{ object, target }], duration);
}

function procedureComponentMatches(pattern) {
  const data = COMPONENTS.find((item) => pattern.test([
    item.id, item.en, item.ru, item.descriptionEn, item.descriptionRu
  ].filter(Boolean).join(" ")));
  return data ? findNodeById(data.id) : null;
}

function procedureWorldCenter(object) {
  if (!object) return null;
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return object.getWorldPosition(new THREE.Vector3());
  return bounds.getCenter(new THREE.Vector3());
}

function procedureWorldDeltaToLocal(object, worldDelta) {
  if (!object?.parent) return worldDelta.clone();
  object.parent.updateMatrixWorld(true);
  const origin = object.getWorldPosition(new THREE.Vector3());
  const end = origin.clone().add(worldDelta);
  return object.parent.worldToLocal(end).sub(object.parent.worldToLocal(origin));
}

function procedureMoveWorld(object, worldDelta, animate = true) {
  if (!object || !worldDelta || worldDelta.lengthSq() === 0) return false;
  const localDelta = procedureWorldDeltaToLocal(object, worldDelta);
  const target = object.position.clone().add(localDelta);
  if (animate) animateProcedurePosition(object, target);
  else object.position.copy(target);
  return true;
}

function procedureLabel(id) {
  const data = state.catalog.get(id);
  return data ? (state.language === "ru" ? data.ru : data.en) : id;
}

function procedureDirectionForAction(action, object) {
  const modelQuaternion = state.modelRoot.getWorldQuaternion(new THREE.Quaternion());
  const direction = String(action.direction ?? "").toLowerCase();
  if (direction === "away_from_component") {
    const reference = findNodeById(action.reference_component_id);
    if (!reference) return null;
    return procedureWorldCenter(object).sub(procedureWorldCenter(reference)).normalize();
  }
  if (direction === "up") return new THREE.Vector3(0, 0, 1);
  if (direction === "frontward" || direction === "outward_from_case") {
    const rootBounds = new THREE.Box3().setFromObject(state.modelRoot);
    const rootCenter = rootBounds.getCenter(new THREE.Vector3());
    return procedureWorldCenter(object).sub(rootCenter).normalize();
  }
  return null;
}

function procedureActionDistance(action, object) {
  const specified = Number(action.distance);
  if (Number.isFinite(specified) && specified > 0) {
    const unit = String(action.unit ?? "model_units").toLowerCase();
    const scale = unit === "mm" ? 1 : unit === "cm" ? 10 : unit === "in" || unit === "inch" ? 25.4 : unit === "m" ? 1000 : 1;
    return specified * scale;
  }
  const bounds = new THREE.Box3().setFromObject(object);
  if (bounds.isEmpty()) return 24;
  const size = bounds.getSize(new THREE.Vector3());
  return Math.max(24, size.length() * 0.7);
}

function publishProcedureDiagnostics(targets, appliedCount, worldDeltas = []) {
  if (!canvasHost) return;
  canvasHost.dataset.procedureTargetCount = String(targets.length);
  canvasHost.dataset.procedureResolvedTargets = targets.map((entry) => entry.id).join(",");
  canvasHost.dataset.procedureAppliedCount = String(appliedCount);
  canvasHost.dataset.procedureWorldDeltas = JSON.stringify(worldDeltas);
  renderRuntimeDiagnostics();
}

function applyAuthoredSceneAction(action, animate = true) {
  const ids = action.target_component_ids ?? action.target_ids ?? [];
  const targets = ids.map((id) => ({ id, node: findNodeById(id) })).filter((entry) => entry.node);
  const type = String(action.type ?? "").toLowerCase();
  const note = localizedPackageText(action.note);
  publishProcedureDiagnostics(targets, 0);

  if (type === "conditional" || type === "noop") {
    if (canvasHost) canvasHost.dataset.procedureMotion = "conditional-noop";
    const status = $("#assembly-motion-status");
    if (status) status.textContent = note || t("procedureNoGeometry");
    return true;
  }
  if (type === "select") {
    if (canvasHost) {
      canvasHost.dataset.procedureMotion = "selection-only";
      canvasHost.dataset.procedureSelectedComponent = targets[0]?.id ?? "";
    }
    publishProcedureDiagnostics(targets, targets.length);
    const status = $("#assembly-motion-status");
    if (status) status.textContent = note || (targets[0] ? procedureLabel(targets[0].id) : t("procedureNoGeometry"));
    return targets.length > 0;
  }
  if (type === "hide" || type === "show") {
    for (const { node } of targets) node.visible = type === "show";
    if (canvasHost) canvasHost.dataset.procedureMotion = type;
    publishProcedureDiagnostics(targets, targets.length);
    const status = $("#assembly-motion-status");
    if (status) status.textContent = note || t("procedureRunnerVisualized");
    return targets.length > 0;
  }
  if (type === "translate" || type === "move") {
    const moves = [];
    const worldDeltas = [];
    for (const { id, node } of targets) {
      const direction = procedureDirectionForAction(action, node);
      if (!direction || direction.lengthSq() < 1e-8) continue;
      direction.normalize();
      if (canvasHost) canvasHost.dataset.procedureDirection = direction.toArray().map((value) => Math.abs(value) < 1e-8 ? "0" : String(Number(value.toFixed(3)))).join(",");
      const worldDelta = direction.multiplyScalar(procedureActionDistance(action, node));
      const localDelta = procedureWorldDeltaToLocal(node, worldDelta);
      worldDeltas.push({
        id,
        delta: worldDelta.toArray().map((value) => Math.abs(value) < 1e-8 ? 0 : Number(value.toFixed(3)))
      });
      moves.push({ id, object: node, target: node.position.clone().add(localDelta) });
    }
    publishProcedureDiagnostics(targets, moves.length, worldDeltas);
    if (animate) animateProcedurePositions(moves, Number(action.duration_ms) || 480);
    else moves.forEach((move) => move.object.position.copy(move.target));
    state.modelRoot.updateMatrixWorld(true);
    if (canvasHost) canvasHost.dataset.procedureMotion = action.evidence_class === "manufacturer_data"
      ? "manufacturer-stated-translation"
      : "illustrative-translation";
    const status = $("#assembly-motion-status");
    if (status) status.textContent = note || t("procedureRunnerVisualized");
    return moves.length > 0;
  }
  if (type === "emphasis") {
    for (const { node } of targets) {
      node.traverse((object) => {
        if (!object.isMesh || !object.material) return;
        const applyColor = (material) => {
          const clone = material.clone();
          if (clone.color?.set) clone.color.set(action.color ?? "#d2a45e");
          if (clone.emissive?.set) {
            clone.emissive.set(action.color ?? "#d2a45e");
            clone.emissiveIntensity = Math.max(Number(clone.emissiveIntensity) || 0, 0.16);
          }
          return clone;
        };
        object.material = Array.isArray(object.material)
          ? object.material.map(applyColor)
          : applyColor(object.material);
      });
    }
    publishProcedureDiagnostics(targets, targets.length);
    return targets.length > 0;
  }
  return false;
}

function procedureEffectForStep(step, animate = true) {
  const authoredActions = Array.isArray(step.scene_actions)
    ? step.scene_actions
    : step.scene_action
      ? [step.scene_action]
      : [];
  if (authoredActions.length) {
    let changed = false;
    for (const action of authoredActions) {
      changed = applyAuthoredSceneAction(action, animate) || changed;
    }
    if (authoredActions.length && !changed && canvasHost) canvasHost.dataset.procedureMotion = "no-target";
    return changed;
  }

  const descriptors = [step.id, localizedPackageText(step.title), localizedPackageText(step.action),
    localizedPackageText(step.description)].filter(Boolean).join(" ").toLowerCase();
  const ids = step.component_ids ?? [];
  const targetNodes = ids.map((id) => ({ id, node: findNodeById(id), label: procedureLabel(id) }))
    .filter((item) => item.node);

  const connectorAction = /disconnect|unplug|отключ|отсоедин|разъ[её]м/.test(descriptors);
  const fastenerAction = /screw|fastener|винт|креп[её]ж/.test(descriptors);
  let changed = false;

  if (connectorAction) {
    for (const item of targetNodes) {
      if (/connector|plug|cable|lead|power|p[123]|разъ[её]м|кабел|провод|штекер/i.test(item.id + " " + item.label)) {
        item.node.visible = false;
        changed = true;
      }
    }
  }

  if (fastenerAction && /remove|loosen|unscrew|извлеч|ослаб|выкрут|снять/.test(descriptors)) {
    for (const item of targetNodes) {
      if (/screw|fastener|винт|креп[её]ж/i.test(item.id + " " + item.label)) {
        item.node.visible = false;
        changed = true;
      }
    }
  }

  const board = findNodeById("assembly.system_board");
  const psu = procedureComponentMatches(/power[ -]?supply|\\bpsu\\b|блок питания/i);
  const speaker = procedureComponentMatches(/speaker|loudspeaker|динамик/i);
  const cover = procedureComponentMatches(/case cover|top cover|chassis cover|крышка корпуса|верхняя крышка/i);

  if (/step\\.board\\.slide|board\\.slide|сдвинуть плату|отвести плату/.test(descriptors) && board) {
    const boardCenter = procedureWorldCenter(board);
    const psuCenter = procedureWorldCenter(psu);
    if (boardCenter && psuCenter) {
      const direction = boardCenter.clone().sub(psuCenter);
      direction.z = 0;
      if (direction.lengthSq() > 1e-6) {
        direction.normalize();
        changed = procedureMoveWorld(board, direction.multiplyScalar(12.7), animate) || changed;
      }
    }
    if (changed && canvasHost) canvasHost.dataset.procedureMotion = "manufacturer-stated-slide";
    const status = $("#assembly-motion-status");
    if (status) status.textContent = changed ? t("procedureExactSlide") : t("procedureNoGeometry");
  } else if (/step\\.board\\.remove|lift.*board|remove.*board|поднять.*плат|извлечь.*плат/.test(descriptors) && board) {
    const bounds = new THREE.Box3().setFromObject(board);
    const size = bounds.getSize(new THREE.Vector3());
    const travel = Math.max(24, size.x * 0.55);
    changed = procedureMoveWorld(board, new THREE.Vector3(0, 0, travel), animate) || changed;
    if (canvasHost) canvasHost.dataset.procedureMotion = "illustrative-lift";
  } else if (/step\\.speaker|speaker.*remove|remove.*speaker|извлечь.*динамик|снять.*динамик/.test(descriptors) && speaker) {
    const bounds = new THREE.Box3().setFromObject(speaker);
    const size = bounds.getSize(new THREE.Vector3());
    changed = procedureMoveWorld(speaker, new THREE.Vector3(0, 0, Math.max(22, size.z * 1.5)), animate) || changed;
    if (canvasHost) canvasHost.dataset.procedureMotion = "illustrative-lift";
  } else if (/step\\.psu|power supply.*remove|remove.*power supply|извлечь.*блок питания|снять.*блок питания/.test(descriptors) && psu) {
    const rootBox = new THREE.Box3().setFromObject(state.modelRoot);
    const rootCenter = rootBox.getCenter(new THREE.Vector3());
    const psuCenter = procedureWorldCenter(psu);
    if (psuCenter) {
      const direction = psuCenter.clone().sub(rootCenter);
      direction.z = 0;
      if (direction.lengthSq() > 1e-6) {
        direction.normalize();
        changed = procedureMoveWorld(psu, direction.multiplyScalar(55), animate) || changed;
      }
    }
    if (canvasHost) canvasHost.dataset.procedureMotion = "illustrative-fru-extraction";
  } else if (/step\\.cover|cover.*remove|remove.*cover|сдвинуть.*крышк|снять.*крышк/.test(descriptors) && cover) {
    const bounds = new THREE.Box3().setFromObject(state.modelRoot);
    const rootCenter = bounds.getCenter(new THREE.Vector3());
    const coverCenter = procedureWorldCenter(cover);
    if (coverCenter) {
      const direction = coverCenter.clone().sub(rootCenter);
      direction.z = 0;
      if (direction.lengthSq() > 1e-6) {
        direction.normalize();
        changed = procedureMoveWorld(cover, direction.multiplyScalar(55), animate) || changed;
      }
    }
    if (canvasHost) canvasHost.dataset.procedureMotion = "illustrative-cover-slide";
  }

  return changed;
}

function setProcedureSceneIndex(nextIndex) {
  state.animationPlayer?.stop();
  const steps = ASSEMBLY_PACKAGE.steps ?? [];
  if (!steps.length) return;
  const index = Math.max(-1, Math.min(steps.length - 1, nextIndex));
  restoreProcedureSceneBaseline();
  procedureCurrentIndex = index;
  for (let i = 0; i <= index; i += 1) {
    const changed = procedureEffectForStep(steps[i], i === index);
    if (i === index) {
      if (canvasHost) {
        canvasHost.dataset.procedureStepId = steps[i].id;
        const actions = Array.isArray(steps[i].scene_actions) ? steps[i].scene_actions : steps[i].scene_action ? [steps[i].scene_action] : [];
        canvasHost.dataset.procedureActionType = actions.map((action) => action.type).join(",");
        canvasHost.dataset.procedureTargets = actions.flatMap((action) => action.target_component_ids ?? action.target_ids ?? []).join(",");
      }
      if (!changed) {
        const targetId = (steps[i].component_ids ?? [])[0];
        if (targetId && findNodeById(targetId)) selectComponent(targetId);
        const status = $("#assembly-motion-status");
        if (status) status.textContent = t("procedureNoGeometry");
      }
    }
  }
  updateProcedureControls();
  renderRuntimeDiagnostics();
}

function updateProcedureControls() {
  const steps = ASSEMBLY_PACKAGE.steps ?? [];
  const previous = $("#assembly-step-previous");
  const next = $("#assembly-step-next");
  const reset = $("#assembly-step-reset");
  const progress = $("#assembly-step-progress");
  if (previous) previous.disabled = procedureCurrentIndex <= -1;
  if (next) next.disabled = procedureCurrentIndex >= steps.length - 1;
  if (reset) reset.disabled = procedureCurrentIndex === -1;
  if (progress) progress.textContent = procedureCurrentIndex < 0
    ? `${t("procedureProgress")} 0 / ${steps.length}`
    : `${t("procedureProgress")} ${procedureCurrentIndex + 1} / ${steps.length}`;
}

function deviceRootComponentId() {
  const roots = COMPONENTS.filter((component) => !component.parent_id);
  const preferred = roots.find((component) => component.id === MODEL.id);
  return preferred?.id ?? roots[0]?.id ?? null;
}

function isDeviceRootComponent(componentId) {
  return componentId === MODEL.id || componentId === "assembly.card.root" ||
    (deviceRootComponentId() !== null && componentId === deviceRootComponentId());
}

function renderAssemblyEvidence(componentId) {
  const section = $("#detail-assembly-section");
  const emptyNote = $("#assembly-empty-note");
  const stepHost = $("#assembly-step-list");
  const policyNote = $("#assembly-policy-note");
  const observationHeading = $("#assembly-observation-heading");
  const observationHost = $("#assembly-observation-list");
  const replacementHeading = $("#assembly-replacement-heading");
  const replacementPolicy = $("#assembly-replacement-policy");
  const replacementHost = $("#assembly-replacement-list");
  if (!section || !emptyNote || !stepHost || !observationHeading || !observationHost) return;

  stepHost.replaceChildren();
  const previousControl = $("#assembly-step-previous");
  const nextControl = $("#assembly-step-next");
  const resetControl = $("#assembly-step-reset");
  previousControl?.replaceWith(previousControl.cloneNode(true));
  nextControl?.replaceWith(nextControl.cloneNode(true));
  resetControl?.replaceWith(resetControl.cloneNode(true));
  $("#assembly-step-previous")?.addEventListener("click", () => setProcedureSceneIndex(procedureCurrentIndex - 1));
  $("#assembly-step-next")?.addEventListener("click", () => setProcedureSceneIndex(procedureCurrentIndex + 1));
  $("#assembly-step-reset")?.addEventListener("click", () => restoreProcedureSceneBaseline());
  const playbackControls = $("#assembly-playback-controls");
  const isDeviceRoot = isDeviceRootComponent(componentId);
  if (playbackControls) playbackControls.hidden = !isDeviceRoot;
  updateProcedureControls();
  observationHost.replaceChildren();
  replacementHost?.replaceChildren();
  const steps = (ASSEMBLY_PACKAGE.steps ?? []).filter((step) =>
    isDeviceRoot || (step.component_ids ?? []).includes(componentId)
  );
  const observations = isDeviceRoot ? (ASSEMBLY_PACKAGE.observations ?? []) : [];
  const replacementProcedures = isDeviceRoot
    ? (ASSEMBLY_PACKAGE.replacement_procedures?.procedures ?? [])
    : [];
  section.hidden = steps.length === 0 && observations.length === 0 && replacementProcedures.length === 0 && !isDeviceRoot;
  if (section.hidden) return;

  emptyNote.hidden = !(isDeviceRoot && steps.length === 0);
  emptyNote.textContent = steps.length === 0 ? t("noVerifiedSequence") : "";
  stepHost.hidden = steps.length === 0;
  if (policyNote) {
    const policy = isDeviceRoot ? localizedPackageText(ASSEMBLY_PACKAGE.policy) : "";
    policyNote.hidden = !policy;
    policyNote.textContent = policy;
  }
  observationHeading.hidden = observations.length === 0;
  observationHeading.textContent = t("sourceObservations");
  observationHost.hidden = observations.length === 0;
  if (replacementHeading) {
    replacementHeading.hidden = replacementProcedures.length === 0;
    replacementHeading.textContent = t("replacementFragments");
  }
  if (replacementPolicy) {
    const policy = isDeviceRoot
      ? localizedPackageText(ASSEMBLY_PACKAGE.replacement_procedures?.policy)
      : "";
    replacementPolicy.hidden = !policy;
    replacementPolicy.textContent = policy;
  }
  if (replacementHost) replacementHost.hidden = replacementProcedures.length === 0;

  const sourceMap = new Map(MODEL.sources.map((source) => [source.id, source]));
  const groupMap = new Map((ASSEMBLY_PACKAGE.procedure_groups ?? []).map((group) => [group.id, group]));
  const modeLabels = {
    common_entry: "commonEntryMode",
    conditional_branch: "conditionalBranchMode",
    shared_preparation: "sharedPreparationMode",
    independent_fru_branch: "independentFruBranchMode"
  };
  let previousGroupId = null;

  steps.forEach((step, index) => {
    if (step.group_id && step.group_id !== previousGroupId) {
      const group = groupMap.get(step.group_id);
      const groupHeader = document.createElement("div");
      groupHeader.className = "assembly-procedure-group";
      groupHeader.dataset.groupId = step.group_id;
      const groupTitle = document.createElement("strong");
      groupTitle.className = "assembly-procedure-group-title";
      groupTitle.textContent = group ? localizedPackageText(group.title) : step.group_id;
      groupHeader.append(groupTitle);
      const modeKey = modeLabels[group?.mode];
      if (modeKey) {
        const mode = document.createElement("span");
        mode.className = "assembly-procedure-group-mode";
        mode.textContent = t(modeKey);
        groupHeader.append(mode);
      }
      if (isDeviceRoot) stepHost.append(groupHeader);
      previousGroupId = step.group_id;
    }

    const card = document.createElement("article");
    card.className = "assembly-step-card";
    card.dataset.stepId = step.id ?? `step-${index + 1}`;

    const title = document.createElement("strong");
    title.className = "assembly-step-title";
    const sequence = Number.isInteger(step.sequence) ? step.sequence : index + 1;
    title.textContent = `${t("stepLabel")} ${sequence}: ${localizedPackageText(step.title ?? step.action)}`;
    card.append(title);

    const descriptionText = localizedPackageText(step.description);
    if (descriptionText) {
      const description = document.createElement("p");
      description.className = "assembly-step-description";
      description.textContent = descriptionText;
      card.append(description);
    }

    const targets = (step.component_ids ?? []).map((id) => {
      const data = state.catalog.get(id);
      const object = findNodeById(id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "assembly-component-link";
      button.dataset.componentId = id;
      button.textContent = data
        ? (state.language === "ru" ? data.ru : data.en)
        : id;
      button.disabled = !object;
      button.addEventListener("click", () => {
        if (object) selectComponent(id);
      });
      return button;
    });
    if (targets.length) {
      const targetList = document.createElement("div");
      targetList.className = "assembly-step-targets";
      targets.forEach((button) => targetList.append(button));
      card.append(targetList);
    }

    const tools = localizedPackageList(step.tool_requirements);
    if (tools.length) {
      const toolsText = document.createElement("p");
      toolsText.className = "assembly-step-meta";
      toolsText.textContent = `${t("toolsLabel")}: ${tools.join(" · ")}`;
      card.append(toolsText);
    }

    const safety = localizedPackageList(step.safety_notes);
    if (safety.length) {
      const safetyText = document.createElement("p");
      safetyText.className = "assembly-step-safety";
      safetyText.textContent = `${t("safetyLabel")}: ${safety.join(" · ")}`;
      card.append(safetyText);
    }

    const prerequisites = step.prerequisite_step_ids ?? [];
    if (prerequisites.length) {
      const prerequisiteText = document.createElement("p");
      prerequisiteText.className = "assembly-step-meta";
      prerequisiteText.textContent = `${t("prerequisitesLabel")}: ${prerequisites.join(", ")}`;
      card.append(prerequisiteText);
    }

    const sources = (step.source_ids ?? []).map((sourceId) => sourceMap.get(sourceId)).filter((source) => source?.url);
    sources.forEach((source) => {
      const link = document.createElement("a");
      link.className = "assembly-source-link";
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `↗ ${source.label}`;
      card.append(link);
    });

    const runStep = document.createElement("button");
    runStep.type = "button";
    runStep.className = "assembly-step-run";
    runStep.textContent = t("runProcedureStep");
    runStep.dataset.runProcedureStep = step.id;
    runStep.addEventListener("click", () => {
      const fullIndex = (ASSEMBLY_PACKAGE.steps ?? []).findIndex((item) => item.id === step.id);
      setProcedureSceneIndex(fullIndex);
    });
    card.append(runStep);
    stepHost.append(card);
  });

  observations.forEach((observation, index) => {
    const card = document.createElement("article");
    card.className = "assembly-observation-card";
    card.dataset.observationSourceId = observation.source_id ?? "";
    card.dataset.observationIndex = String(index);

    const source = sourceMap.get(observation.source_id);
    const locator = document.createElement("strong");
    locator.className = "assembly-observation-locator";
    locator.textContent = observation.locator ?? "—";

    const note = document.createElement("p");
    note.className = "assembly-observation-note";
    note.textContent = localizedPackageText(observation.note);

    card.append(locator, note);
    if (source?.url) {
      const link = document.createElement("a");
      link.className = "assembly-source-link";
      link.href = sourceUrlAtLocator(source, observation.locator);
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `↗ ${t("openAtSource")}: ${source.label}`;
      card.append(link);
    } else {
      const missing = document.createElement("span");
      missing.className = "assembly-step-meta";
      missing.textContent = t("noRelationshipSource");
      card.append(missing);
    }
    observationHost.append(card);
  });

  replacementProcedures.forEach((procedure) => {
    const card = document.createElement("article");
    card.className = "assembly-replacement-card";
    card.dataset.procedureId = procedure.id;
    const title = document.createElement("strong");
    title.className = "assembly-observation-locator";
    title.textContent = localizedPackageText(procedure.title);
    const locator = document.createElement("p");
    locator.className = "assembly-step-meta";
    locator.textContent = procedure.locator ?? "";
    const list = document.createElement("ol");
    list.className = "assembly-replacement-steps";
    for (const item of procedure.steps ?? []) {
      const li = document.createElement("li");
      li.textContent = localizedPackageText(item);
      list.append(li);
    }
    card.append(title, locator, list);
    for (const sourceId of procedure.source_ids ?? []) {
      const source = sourceMap.get(sourceId);
      if (!source?.url) continue;
      const link = document.createElement("a");
      link.className = "assembly-source-link";
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = `↗ ${t("openAtSource")}: ${source.label}`;
      card.append(link);
    }
    replacementHost?.append(card);
  });
}

function renderDetails(id) {
  state.compareMode = false;
  $("#comparison-panel").hidden = true;
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
  const componentIndex = [...state.componentNodes.keys()].indexOf(id);
  $("#detail-index").textContent = componentIndex < 0 ? "—" : String(componentIndex + 1).padStart(2, "0");
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
  renderAssemblyEvidence(id);
  renderProcedureRunner(id);
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

function persistLearningProgress() {
  const saved = LEARNING_PROGRESS_STORE.save(MODEL.id, LEARNING_PACKAGE.questions ?? [], {
    index: state.learningIndex,
    score: state.learningScore,
    selected_index: state.learningSelected,
    answered: state.learningAnswered,
    complete: state.learningComplete
  });
  state.learningProgressAvailable = saved;
  state.learningResumed = saved;
  return saved;
}

function updateLearningProgressStatus() {
  const status = $("#learning-save-status");
  if (!status) return;
  status.textContent = t(
    !state.learningProgressAvailable
      ? "learningProgressSession"
      : state.learningResumed ? "learningProgressSaved" : "learningProgressLocal"
  );
  status.dataset.available = String(state.learningProgressAvailable);
}

function showLearning() {
  state.compareMode = false;
  $("#comparison-panel").hidden = true;
  clearHighlights();
  state.activeLayer = null;
  document.querySelectorAll(".process-button").forEach((button) => button.classList.remove("active"));
  $("#process-details").hidden = true;
  buildProcessVisuals();
  state.learningMode = true;
  const restored = LEARNING_PROGRESS_STORE.load(MODEL.id, LEARNING_PACKAGE.questions ?? []);
  state.learningIndex = restored.progress.index;
  state.learningScore = restored.progress.score;
  state.learningSelected = restored.progress.selected_index;
  state.learningAnswered = restored.progress.answered;
  state.learningComplete = restored.progress.complete;
  state.learningProgressAvailable = restored.available;
  state.learningResumed = restored.resumed;
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
  updateLearningProgressStatus();

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
      persistLearningProgress();
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
    state.learningResumed = false;
    state.learningProgressAvailable = LEARNING_PROGRESS_STORE.clear(MODEL.id);
    renderLearning();
    return;
  }
  const question = questions[state.learningIndex];
  if (!state.learningAnswered) {
    if (state.learningSelected === null) return;
    if (state.learningSelected === question.correct_index) state.learningScore += 1;
    state.learningAnswered = true;
    persistLearningProgress();
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
  persistLearningProgress();
  renderLearning();
}

function comparisonStatusLabel(status) {
  const keys = {
    same: "compareSame",
    different: "compareDifferent",
    unknown_both: "compareUnknownBoth",
    unknown_left: "compareUnknownLeft",
    unknown_right: "compareUnknownRight",
    not_recorded_left: "compareNotRecordedLeft",
    not_recorded_right: "compareNotRecordedRight"
  };
  return t(keys[status] ?? "compareNotRecorded");
}

function comparisonValueText(value) {
  if (value === null || value === undefined) return t("compareUnknown");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function comparisonIdentity(data) {
  const model = data.model ?? {};
  const pcb = (data.claims?.claims ?? []).find((claim) => claim.predicate === "pcb_revision");
  return {
    id: model.id ?? "unknown",
    manufacturer: model.manufacturer ?? "",
    name: model.display_name ?? model.product_name ?? model.name ?? model.id ?? "Unknown model",
    part_number: model.part_number ?? "",
    geometry_status: model.geometry_status ?? "unknown",
    pcb_revision: pcb?.value ?? model.specifications?.pcb_revision ?? null
  };
}

function appendComparisonIdentity(host, identity, side, sideLabel) {
  const card = document.createElement("article");
  card.className = "comparison-identity-card";
  card.dataset.side = side;
  const heading = document.createElement("span");
  heading.className = "eyebrow";
  heading.textContent = sideLabel;
  const name = document.createElement("strong");
  name.className = "comparison-identity-name";
  name.textContent = identity.name;
  const manufacturer = document.createElement("span");
  manufacturer.className = "comparison-identity-manufacturer";
  manufacturer.textContent = identity.manufacturer || t("compareNotRecorded");
  const part = document.createElement("div");
  part.className = "comparison-identity-field";
  part.textContent = `${t("compareSku")}: ${identity.part_number || t("compareNotRecorded")}`;
  const geometry = document.createElement("div");
  geometry.className = "comparison-identity-field";
  geometry.textContent = `${t("compareGeometry")}: ${identity.geometry_status}`;
  const pcb = document.createElement("div");
  pcb.className = "comparison-identity-field";
  pcb.textContent = `${t("comparePcb")}: ${comparisonValueText(identity.pcb_revision)}`;
  card.append(heading, name, manufacturer, part, geometry, pcb);
  host.append(card);
}

function createComparisonStatusBadge(status) {
  const badge = document.createElement("span");
  badge.className = "comparison-status";
  badge.dataset.status = status;
  badge.textContent = comparisonStatusLabel(status);
  return badge;
}

function appendComparisonSources(host, sources, label) {
  if (!sources?.length) return;
  const block = document.createElement("div");
  block.className = "comparison-sources";
  const heading = document.createElement("span");
  heading.className = "eyebrow";
  heading.textContent = label;
  block.append(heading);
  const list = document.createElement("div");
  list.className = "comparison-source-list";
  sources.forEach((source) => {
    const item = source.url && /^https?:\/\//i.test(source.url)
      ? document.createElement("a")
      : document.createElement("span");
    item.textContent = source.label ?? source.id ?? t("compareNotRecorded");
    if (item.tagName === "A") {
      item.href = source.url;
      item.target = "_blank";
      item.rel = "noopener noreferrer";
    }
    list.append(item);
  });
  block.append(list);
  host.append(block);
}

function appendComparisonCell(host, value, evidence, sources, evidenceLabel, notes = null, sourceLabel = evidenceLabel) {
  const cell = document.createElement("div");
  cell.className = "comparison-value-cell";
  const valueText = document.createElement("div");
  valueText.className = "comparison-value";
  valueText.textContent = comparisonValueText(value);
  cell.append(valueText);
  if (evidence) {
    const evidenceText = document.createElement("span");
    evidenceText.className = "comparison-evidence";
    evidenceText.textContent = `${evidenceLabel}: ${evidence}`;
    cell.append(evidenceText);
  }
  if (notes) {
    const note = document.createElement("p");
    note.className = "comparison-note";
    note.textContent = typeof notes === "object" && notes
      ? (notes[state.language] ?? notes.en ?? notes.ru ?? JSON.stringify(notes))
      : String(notes);
    cell.append(note);
  }
  appendComparisonSources(cell, sources, sourceLabel);
  host.append(cell);
}

function renderComparisonRows(report, rows, host, kind) {
  host.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "comparison-empty";
    empty.textContent = kind === "claims" ? t("compareNoClaims") : t("compareNoSpecifications");
    host.append(empty);
    return;
  }

  rows.forEach((row) => {
    const card = document.createElement("article");
    card.className = "comparison-row";
    card.dataset.status = row.status;
    card.dataset.comparisonKey = kind === "claims" ? String(row.predicate) : row.path;
    const header = document.createElement("div");
    header.className = "comparison-row-header";
    const key = document.createElement("strong");
    key.textContent = kind === "claims"
      ? String(row.predicate).replaceAll("_", " ")
      : row.path.replaceAll(".", " · ").replaceAll("_", " ");
    header.append(key, createComparisonStatusBadge(row.status));
    const values = document.createElement("div");
    values.className = "comparison-values";

    if (kind === "claims") {
      appendComparisonCell(values, row.value_left, row.evidence_left,
        row.sources_left, t("compareEvidenceA"), row.notes_left, t("compareSourcesA"));
      appendComparisonCell(values, row.value_right, row.evidence_right,
        row.sources_right, t("compareEvidenceB"), row.notes_right, t("compareSourcesB"));
      if (row.unit_left || row.unit_right) {
        const units = document.createElement("div");
        units.className = "comparison-units";
        units.textContent = `A: ${row.unit_left ?? "—"} · B: ${row.unit_right ?? "—"}`;
        values.append(units);
      }
    } else {
      appendComparisonCell(values, row.left, null, null, "");
      appendComparisonCell(values, row.right, null, null, "");
    }
    card.append(header, values);
    host.append(card);
  });
}

function renderComparison() {
  if (!state.compareMode) return;
  const panel = $("#comparison-panel");
  if (!panel) return;
  panel.hidden = false;
  $("#details-heading-eyebrow").textContent = t("compareTitle");
  $("#details-heading-title").textContent = t("compare");
  const identities = $("#comparison-identities");
  identities.replaceChildren();
  appendComparisonIdentity(identities, comparisonIdentity(state.packageData),
    "a", t("compareLeft"));

  const rightData = state.comparisonPackageData;
  if (!rightData) {
    const placeholder = document.createElement("article");
    placeholder.className = "comparison-identity-card comparison-identity-placeholder";
    const label = document.createElement("span");
    label.className = "eyebrow";
    label.textContent = t("compareRight");
    const hint = document.createElement("p");
    hint.textContent = t("compareWaiting");
    placeholder.append(label, hint);
    identities.append(placeholder);
    $("#comparison-status").textContent = t("compareWaiting");
    $("#comparison-summary").replaceChildren();
    $("#comparison-specification-list").replaceChildren();
    $("#comparison-claim-list").replaceChildren();
    $("#comparison-coverage").replaceChildren();
    $("#compare-clear-model").disabled = true;
    return;
  }

  try {
    const report = compareModelPackages(state.packageData, rightData);
    appendComparisonIdentity(identities, report.right, "b", t("compareRight"));
    $("#comparison-status").textContent = `${t("compareLoaded")} · ${state.comparisonFilename}`;
    $("#compare-clear-model").disabled = false;

    const summary = $("#comparison-summary");
    summary.replaceChildren();
    [
      [t("compareSame"), report.summary.specifications_same],
      [t("compareDifferent"), report.summary.specifications_different],
      [t("compareUnknown"), report.summary.specifications_unknown],
      [t("compareNotRecorded"), report.summary.specifications_not_recorded]
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "comparison-summary-item";
      const number = document.createElement("strong");
      number.textContent = String(value);
      const text = document.createElement("span");
      text.textContent = label;
      item.append(number, text);
      summary.append(item);
    });

    renderComparisonRows(report, report.specifications, $("#comparison-specification-list"), "specifications");
    renderComparisonRows(report, report.claims, $("#comparison-claim-list"), "claims");

    const coverage = $("#comparison-coverage");
    coverage.replaceChildren();
    const counts = report.component_coverage;
    [
      [t("compareShared"), counts.shared_count],
      [t("compareLeftOnly"), counts.left_only_ids.length],
      [t("compareRightOnly"), counts.right_only_ids.length]
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "comparison-summary-item";
      const number = document.createElement("strong");
      number.textContent = String(value);
      const text = document.createElement("span");
      text.textContent = label;
      item.append(number, text);
      coverage.append(item);
    });
    const inventoryNote = document.createElement("p");
    inventoryNote.className = "comparison-caveat";
    inventoryNote.textContent = t("compareCoverageNote");
    coverage.append(inventoryNote);

    const limitations = document.createElement("ul");
    limitations.className = "comparison-limitations";
    t("compareLimitationsList").forEach((message) => {
      const item = document.createElement("li");
      item.textContent = message;
      limitations.append(item);
    });
    $("#comparison-limitations").replaceChildren(limitations);
  } catch (error) {
    $("#comparison-status").textContent = `${t("compareError")}: ${error.message}`;
    $("#comparison-summary").replaceChildren();
    $("#comparison-specification-list").replaceChildren();
    $("#comparison-claim-list").replaceChildren();
    $("#comparison-coverage").replaceChildren();
    $("#comparison-limitations").replaceChildren();
    $("#compare-clear-model").disabled = false;
  }
}

function showComparison() {
  if (state.activeLayer) setLayer("clear");
  else clearHighlights();
  state.animationPlayer?.stop();
  state.compareMode = true;
  state.learningMode = false;
  $("#learning-panel").hidden = true;
  $("#process-details").hidden = true;
  $("#component-details").hidden = true;
  $("#empty-selection").hidden = true;
  $("#comparison-panel").hidden = false;
  renderComparison();
}

function renderProcessLayer() {
  state.compareMode = false;
  $("#comparison-panel").hidden = true;
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
  const diagramHost = $("#process-diagram");
  diagramHost.replaceChildren();
  const diagram = layer.visualization?.diagram;
  diagramHost.hidden = !diagram;
  if (diagram) {
    const badge = document.createElement("div");
    badge.className = "architecture-diagram-badge";
    badge.textContent = localizedPackageText(diagram.badge);
    diagramHost.append(badge);

    const grid = document.createElement("div");
    grid.className = "architecture-diagram-grid";
    (diagram.groups ?? []).forEach((group, groupIndex) => {
      const section = document.createElement("section");
      section.className = "architecture-diagram-group";
      section.dataset.groupId = group.id ?? String(groupIndex);
      const heading = document.createElement("h4");
      heading.textContent = localizedPackageText(group.title);
      const summary = document.createElement("p");
      summary.className = "architecture-diagram-summary";
      summary.textContent = localizedPackageText(group.summary);
      const nodes = document.createElement("div");
      nodes.className = "architecture-node-grid";
      (group.nodes ?? []).forEach((node) => {
        const componentId = node.component_id;
        if (!componentId) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "architecture-node";
        button.dataset.componentId = componentId;
        button.setAttribute("aria-label", localizedPackageText(node.title));
        const title = document.createElement("span");
        title.className = "architecture-node-title";
        title.textContent = localizedPackageText(node.title);
        const metric = document.createElement("span");
        metric.className = "architecture-node-metric";
        metric.textContent = localizedPackageText(node.metric);
        button.append(title, metric);
        button.addEventListener("click", () => selectComponent(componentId));
        nodes.append(button);
      });
      section.append(heading, summary, nodes);
      grid.append(section);
      if (groupIndex < (diagram.groups?.length ?? 0) - 1) {
        const connector = document.createElement("div");
        connector.className = "architecture-diagram-connector";
        connector.setAttribute("aria-hidden", "true");
        connector.textContent = "↓";
        grid.append(connector);
      }
    });
    diagramHost.append(grid);
  }


  const componentHost = $("#process-components");
  componentHost.replaceChildren();
  (layer.linked_component_ids ?? []).forEach((id) => {
    const object = findNodeById(id);
    const data = getComponentData(id, object);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "process-component-chip";
    button.dataset.componentId = id;
    button.textContent = state.language === "ru" ? data.ru : data.en;
    button.addEventListener("click", () => selectComponent(id));
    componentHost.append(button);
  });

  const assumptions = $("#process-assumptions");
  assumptions.replaceChildren();
  (layer.assumptions ?? []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = localizedPackageText(item);
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
  // Some process diagrams expose manufacturer-documented logical components
  // (for example NVENC/NVDEC) that intentionally have no physical placement
  // or mesh in the current illustrative scene. They remain inspectable from
  // their semantic package data without fabricating a 3D object.
  if (!object && !state.catalog.has(id)) return;
  clearHighlights();
  state.activeLayer = null;
  buildProcessVisuals();
  document.querySelectorAll(".process-button").forEach((button) => button.classList.remove("active"));
  $("#process-details").hidden = true;
  state.learningMode = false;
  state.selected = object;
  state.selectedId = id;
  if (object) {
    object.traverse((child) => { if (child.isMesh) applyHighlight(child); });
    if (object.isMesh) applyHighlight(object);
  }
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
  const procedureState = state.procedureController?.getSnapshot();
  if (procedureState && procedureState.stepIndex >= 0) {
    state.procedureController.reset();
    if (state.selectedId === MODEL.id) renderProcedureRunner(state.selectedId);
  }
  const clipState = state.animationPlayer?.getSnapshot();
  if (clipState && clipState.status !== "idle" && clipState.status !== "ready") state.animationPlayer.stop();
  state.sceneController.setExplode(value);
  updateExplodeUi(value);
}

async function animateExplodeCycle() {
  if (!state.sceneController) return;
  state.animationPlayer?.stop();
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
    const componentId = String(object.userData?.sbs_component_id ?? "");
    const hasStableRotorId = /^assembly\\.fan\\.[12]\\.rotor$/.test(componentId);
    if (object.userData?.sbs_fan_rotor !== true && !hasStableRotorId) return;
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
  const rotation = delta * 10.5;
  state.fanRotors.forEach(({ object, axis }) => { object.rotation[axis] += rotation; });
  state.flowParticles.forEach((particle) => {
    particle.phase = (particle.phase + delta * particle.speed) % 1;
    particle.mesh.position.copy(particle.curve.getPointAt(particle.phase));
  });
  const spinning = state.fanRotors.some(({ object, axis }) => Math.abs(object.rotation[axis]) > 0.01);
  canvasHost.dataset.fanSpin = String(spinning);
  canvasHost.dataset.flowMotion = String(state.flowParticles.length > 0);
}

function setPowered(enabled) {
  if (enabled) state.animationPlayer?.stop();
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
    const layerColors = { cooling: 0x6bc8e8, power_delivery: 0xe8b75e, gpu_compute: 0xb18be6 };
    const color = layerColors[state.activeLayer] ?? 0xc3e86d;
    if (object.isMesh) applyHighlight(object, color);
    else object.traverse((child) => { if (child.isMesh) applyHighlight(child, color); });
  });
  buildProcessVisuals();
  renderProcessLayer();
  const layerStatus = { cooling: "layerCooling", power_delivery: "layerPower", gpu_compute: "layerCompute", graphics_pipeline: "layerGraphicsPipeline", video_codec: "layerVideoCodec" };
  setStatus(t(layerStatus[state.activeLayer] ?? "ready"));
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
  state.animationPlayer?.dispose();
  state.animationPlayer = null;
  state.procedureController?.dispose();
  state.procedureController = null;
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
  if (Array.isArray(ASSEMBLY_PACKAGE.procedure_routes?.common_step_ids) && Array.isArray(ASSEMBLY_PACKAGE.procedure_routes?.branches)) {
    state.procedureController = new ProcedureController(root, {
      steps: ASSEMBLY_PACKAGE.steps ?? [],
      commonStepIds: ASSEMBLY_PACKAGE.procedure_routes.common_step_ids,
      routes: ASSEMBLY_PACKAGE.procedure_routes.branches
    });
  }
  fitModel(root);
  setExplode(0);
  setupAnimationPlayer(root);
  setLoadState(mode === "package" ? t("loadedPackage") : mode === "file" ? t("loadedGlb") : mode === "bundled" ? t("loadedBundled") : t("demoLoaded"));
  setStatus(state.modelWarnings.length ? 'Duplicate component IDs: ' + [...new Set(state.modelWarnings)].join(', ') : t('modelLoaded'));
  renderRuntimeDiagnostics();
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
  state.packageData = packageData;
  MODEL = adapter.model;
  COMPONENTS = adapter.components;
  LEARNING_PACKAGE = packageData.learning ?? { questions: [] };
  PROCESS_PACKAGE = packageData.process_layers ?? { process_layers: [] };
  CLAIM_PACKAGE = packageData.claims ?? { claims: [] };
  RELATIONSHIP_PACKAGE = packageData.relationships ?? { relationships: [] };
  ASSEMBLY_PACKAGE = packageData.assembly_steps ?? { steps: [], observations: [] };
  ANIMATION_PACKAGE = packageData.animations ?? { clips: [] };
  state.catalog = new Map(COMPONENTS.map((item) => [item.id, item]));
  state.learningMode = false;
  state.learningIndex = 0;
  state.learningScore = 0;
  state.learningSelected = null;
  state.learningAnswered = false;
  state.learningComplete = false;
  state.learningProgressAvailable = false;
  state.learningResumed = false;
  state.loadedCatalogModelId = MODEL_CATALOG.models.find((entry) => entry.packageModelId === MODEL.id)?.id ?? null;
  state.catalogLoadingId = null;
  updateModelHeader();
  renderCatalog();
  document.querySelectorAll(".process-button[data-layer]").forEach((button) => {
    button.disabled = button.dataset.layer !== "clear" &&
      !PROCESS_PACKAGE.process_layers.some((layer) => layer.type === button.dataset.layer);
  });
  document.querySelectorAll(".view-tab").forEach((button) => {
    if (button.dataset.mode === "learn") button.disabled = LEARNING_PACKAGE.questions.length === 0;
  });
  if (state.compareMode) renderComparison();
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
  ASSEMBLY_PACKAGE = { steps: [], observations: [] };
  ANIMATION_PACKAGE = { clips: [] };
  state.catalog = new Map();
  state.packageData = {
    model: { id: MODEL.id, manufacturer: MODEL.manufacturer, name: MODEL.name, geometry_status: "unknown", specifications: {} },
    components: { components: [] },
    sources: { sources: [] },
    relationships: { relationships: [] },
    claims: { claims: [] },
    process_layers: { process_layers: [] },
    assembly_steps: { steps: [], observations: [] },
    learning: { questions: [] },
    animations: { clips: [] },
    release: null
  };
  state.loadedCatalogModelId = null;
  state.catalogLoadingId = null;
  renderCatalog();
  state.learningMode = false;
  state.learningProgressAvailable = false;
  state.learningResumed = false;
  updateModelHeader();
  document.querySelectorAll(".process-button[data-layer]").forEach((button) => {
    button.disabled = button.dataset.layer !== "clear";
  });
  document.querySelectorAll(".view-tab").forEach((button) => {
    if (button.dataset.mode === "learn") button.disabled = true;
  });
  if (state.compareMode) renderComparison();
}

function loadArrayBuffer(buffer, filename, mode = "file", packageData = null, { cancelIfInteracted = false } = {}) {
  const loadRequestId = ++state.loadRequestId;
  const clearCatalogLoading = () => {
    if (state.catalogLoadingId) {
      state.catalogLoadingId = null;
      renderCatalog();
    }
  };
  setStatus(t("loading"));
  if (buffer.byteLength > MAX_GLB_BYTES) {
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = t("fileTooLarge");
    setStatus(t("fileTooLarge"));
    clearCatalogLoading();
    return;
  }
  try {
    validateSelfContainedGlb(buffer);
  } catch (error) {
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = error.message.includes("External resource") ? t("externalResources") : t("loadError");
    setStatus($("#viewer-error").textContent);
    clearCatalogLoading();
    return;
  }
  const loader = new GLTFLoader();
  const fail = (error) => {
    if (loadRequestId !== state.loadRequestId) return;
    console.error(error);
    $("#viewer-error").hidden = false;
    $("#viewer-error").textContent = t("loadError");
    setStatus(t("loadError"));
    clearCatalogLoading();
  };
  try {
    loader.parse(buffer, "", (gltf) => {
      if (loadRequestId !== state.loadRequestId || (cancelIfInteracted && state.userInteracted)) {
        gltf.scene.traverse((object) => {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.filter(Boolean).forEach((material) => material.dispose());
        });
        if (loadRequestId === state.loadRequestId && cancelIfInteracted && state.userInteracted) {
          setLoadState(t("demoLoaded"));
          setStatus(t("modelLoaded"));
        }
        return;
      }
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

function exportFileStem() {
  const raw = state.packageData?.model?.id ?? MODEL.id ?? "model";
  return String(raw).replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "model";
}

function downloadLocalFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
}

function exportSemanticInventoryJson() {
  try {
    const inventory = createSemanticInventory(state.packageData);
    const filename = exportFileStem() + "-semantic-inventory.json";
    downloadLocalFile(filename, JSON.stringify(inventory, null, 2), "application/json;charset=utf-8");
    setStatus(t("exportComplete"));
  } catch (error) {
    console.error("Semantic inventory JSON export failed:", error);
    setStatus(t("exportFailed"));
  }
}

function exportSemanticInventoryCsv() {
  try {
    const inventory = createSemanticInventory(state.packageData);
    const csvFiles = createInventoryCsvFiles(inventory);
    const archiveFiles = {
      "README.txt": strToU8([
        "Screw by Screw — semantic inventory export",
        "",
        "This archive contains semantic data tables only.",
        "It does not contain 3D geometry, CAD, BoardView or a complete physical BOM.",
        "Unknown values and evidence labels are preserved; candidates are not confirmed population.",
        "",
        "Model: " + (inventory.model.display_name ?? inventory.model.product_name ?? inventory.model.name ?? inventory.model.id),
        "Model ID: " + inventory.model.id,
        "Generated: " + inventory.generated_at,
        "",
        "CSV tables use UTF-8 with BOM and semicolon delimiters."
      ].join("\n")),
      ...Object.fromEntries(Object.entries(csvFiles).map(([name, csv]) => [name, strToU8(csv)]))
    };
    const archive = zipSync(archiveFiles, { level: 6 });
    const filename = exportFileStem() + "-semantic-inventory-csv.zip";
    downloadLocalFile(filename, archive, "application/zip");
    setStatus(t("exportComplete"));
  } catch (error) {
    console.error("Semantic inventory CSV export failed:", error);
    setStatus(t("exportFailed"));
  }
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
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest(".mobile-panel-switcher, #language-toggle")) return;
    state.userInteracted = true;
  }, { capture: true });
  document.addEventListener("keydown", (event) => {
    if (event.target instanceof Element && event.target.closest(".mobile-panel-switcher, #language-toggle")) return;
    state.userInteracted = true;
  }, { capture: true });
  document.querySelectorAll(".mobile-panel-button").forEach((button) => {
    button.addEventListener("click", () => setMobilePanel(button.dataset.mobilePanel));
  });
  setMobilePanel(appShell?.dataset.mobilePanel || "viewer");
  $("#export-inventory-json").addEventListener("click", exportSemanticInventoryJson);
  $("#export-inventory-csv").addEventListener("click", exportSemanticInventoryCsv);
  $("#catalog-open").addEventListener("click", openCatalog);
  $("#catalog-close").addEventListener("click", closeCatalog);
  $("#model-switcher").addEventListener("change", (event) => {
    const entry = MODEL_CATALOG.models.find((item) =>
      item.id === event.target.value && item.published === true
    );
    if (entry) openCatalogEntry(entry);
  });
  $("#catalog-search").addEventListener("input", (event) => { state.catalogSearch = event.target.value; renderCatalog(); });
  $("#catalog-category").addEventListener("change", (event) => { state.catalogCategory = event.target.value; renderCatalog(); });
  $("#model-catalog-dialog").addEventListener("click", (event) => {
    if (event.target === $("#model-catalog-dialog")) closeCatalog();
  });
  $("#model-catalog-dialog").addEventListener("close", () => {
    const opener = state.catalogOpener;
    state.catalogOpener = null;
    if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
  });
  $("#language-toggle").addEventListener("click", () => {
    state.language = state.language === "ru" ? "en" : "ru";
    applyLanguage();
  });
  $("#open-model").addEventListener("click", () => {
    state.pendingCatalogModelId = null;
    $("#model-file").click();
  });
  $("#model-file").addEventListener("cancel", () => { state.pendingCatalogModelId = null; });
  $("#model-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) { state.pendingCatalogModelId = null; return; }
    state.userInteracted = true;
    const isPackage = /\.sbsmodel$/i.test(file.name);
    if (state.pendingCatalogModelId && !isPackage) {
      const message = t("catalogChoosePackage");
      $("#viewer-error").hidden = false;
      $("#viewer-error").textContent = message;
      setStatus(message);
      state.pendingCatalogModelId = null;
      event.target.value = "";
      return;
    }
    const sizeLimit = isPackage ? MAX_MODEL_PACKAGE_BYTES : MAX_GLB_BYTES;
    if (file.size > sizeLimit) {
      const message = isPackage ? t("packageTooLarge") : t("fileTooLarge");
      $("#viewer-error").hidden = false;
      $("#viewer-error").textContent = message;
      setStatus(message);
      state.pendingCatalogModelId = null;
      event.target.value = "";
      return;
    }
    $("#viewer-error").hidden = true;
    try {
      if (isPackage) {
        const modelPackage = await loadModelPackage(file);
        const expectedPackageModelId = state.pendingCatalogModelId;
        if (expectedPackageModelId && modelPackage.report.modelId !== expectedPackageModelId) {
          throw new Error("Selected package does not match the catalogue item");
        }
        state.pendingCatalogModelId = null;
        loadArrayBuffer(modelPackage.sceneBuffer, file.name, "package", modelPackage.data);
        setStatus(`Package validated · ${modelPackage.report.componentCount} components · ${modelPackage.report.relationshipCount} relationships`);
      } else {
        loadArrayBuffer(await file.arrayBuffer(), file.name, "file");
      }
    } catch (error) {
      state.pendingCatalogModelId = null;
      $("#viewer-error").hidden = false;
      $("#viewer-error").textContent = error.message || t("loadError");
      setStatus(t("loadError"));
    }
    event.target.value = "";
  });
  $("#compare-select-model").addEventListener("click", () => $("#comparison-file").click());
  $("#compare-clear-model").addEventListener("click", () => {
    state.comparisonPackageData = null;
    state.comparisonFilename = "";
    $("#comparison-file").value = "";
    renderComparison();
  });
  $("#comparison-file").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    state.userInteracted = true;
    if (!/\.sbsmodel$/i.test(file.name)) {
      $("#comparison-status").textContent = t("compareError") + ": .sbsmodel required";
      event.target.value = "";
      return;
    }
    if (file.size > MAX_MODEL_PACKAGE_BYTES) {
      $("#comparison-status").textContent = t("packageTooLarge");
      event.target.value = "";
      return;
    }
    $("#comparison-status").textContent = t("loading");
    try {
      const candidate = await loadModelPackage(file);
      if (candidate.report.modelId === state.packageData.model.id) {
        // An identical model ID is permitted, but both packages remain independent snapshots.
      }
      state.comparisonPackageData = candidate.data;
      state.comparisonFilename = file.name;
      renderComparison();
    } catch (error) {
      state.comparisonPackageData = null;
      state.comparisonFilename = "";
      renderComparison();
      $("#comparison-status").textContent = `${t("compareError")}: ${error.message}`;
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
  $("#animation-clip-select").addEventListener("change", (event) => {
    if (state.powered) setPowered(false);
    state.animationPlayer?.selectClip(event.target.value);
  });
  $("#animation-play").addEventListener("click", () => {
    if (state.powered) setPowered(false);
    state.animationPlayer?.play();
  });
  $("#animation-pause").addEventListener("click", () => state.animationPlayer?.pause());
  $("#animation-stop").addEventListener("click", () => state.animationPlayer?.stop());
  $("#animation-seek").addEventListener("input", (event) => state.animationPlayer?.seek(Number(event.target.value) / 1000));
  $("#quiz-next").addEventListener("click", submitLearningAnswer);
  $("#procedure-branch-select").addEventListener("change", (event) => {
    if (!state.procedureController) return;
    try {
      state.procedureController.setBranch(event.target.value);
      renderProcedureRunner(state.selectedId);
      setStatus(t("ready"));
    } catch (error) {
      console.error(error);
      setStatus(t("catalogError"));
    }
  });
  $("#procedure-next").addEventListener("click", async () => {
    const controller = state.procedureController;
    if (!controller) return;
    const nextButton = $("#procedure-next");
    const branchSelect = $("#procedure-branch-select");
    nextButton.disabled = true;
    branchSelect.disabled = true;
    state.animationPlayer?.stop();
    try {
      const result = await controller.advance({ animate: !state.reducedMotion });
      if (!result.ok && result.reason === "missing_prerequisites") {
        setStatus(t("prerequisitesLabel") + ": " + result.missing.join(", "));
      } else if (!result.ok && result.reason === "branch_required") {
        setStatus(t("procedureChooseBranch"));
      } else if (!result.ok && result.reason === "complete") {
        setStatus(t("procedureRunnerComplete"));
      } else {
        setStatus(t("procedureRunnerVisualized"));
      }
    } catch (error) {
      console.error(error);
      setStatus(error.message || t("catalogError"));
    } finally {
      renderProcedureRunner(state.selectedId);
    }
  });
  $("#procedure-previous").addEventListener("click", () => {
    if (!state.procedureController) return;
    try {
      state.procedureController.previous();
      renderProcedureRunner(state.selectedId);
    } catch (error) {
      console.error(error);
      setStatus(error.message || t("catalogError"));
    }
  });
  $("#procedure-reset").addEventListener("click", () => {
    if (!state.procedureController) return;
    try {
      state.procedureController.reset();
      renderProcedureRunner(state.selectedId);
      setStatus(t("ready"));
    } catch (error) {
      console.error(error);
      setStatus(error.message || t("catalogError"));
    }
  });
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
    button.addEventListener("click", () => {
      setLayer(button.dataset.layer);
      if (button.dataset.layer !== "clear" && window.matchMedia("(max-width: 820px)").matches) {
        setMobilePanel("details");
      }
    });
  });
  document.querySelectorAll(".view-tab").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".view-tab").forEach((tab) => tab.classList.toggle("active", tab === button));
      if (button.dataset.mode === "compare") { showComparison(); return; }
      if (state.compareMode) { state.compareMode = false; $("#comparison-panel").hidden = true; }
      if (button.dataset.mode === "disassemble") {
        setLayer("clear");
        setExplode(0);
        const deviceRootId = deviceRootComponentId();
        if (deviceRootId) selectComponent(deviceRootId);
      }
      if (button.dataset.mode === "explore") { setLayer("clear"); setExplode(0); }
      if (button.dataset.mode === "understand") {
        setLayer("cooling");
        if (window.matchMedia("(max-width: 820px)").matches) setMobilePanel("details");
      }
      if (button.dataset.mode === "learn") {
        showLearning();
        if (window.matchMedia("(max-width: 820px)").matches) setMobilePanel("details");
      }
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
    if (event.key === "Escape" && $("#model-catalog-dialog")?.open) {
      event.preventDefault();
      closeCatalog();
      return;
    }
    if (event.key === "Escape") {
      setMeasurementEnabled(false);
      state.animationPlayer?.stop();
      setIsolated(false);
      setExplode(0);
      setLayer("clear");
    }
  });
}

async function tryLoadBundledModel() {
  const revision = state.modelRevision;
  try {
    const defaultEntry = MODEL_CATALOG.models.find((entry) => entry.defaultPackage) ?? MODEL_CATALOG.models[0];
    if (!defaultEntry) throw new Error("The model catalogue contains no default package");
    const loaded = await fetchCatalogPackage(defaultEntry);
    if (!loaded) {
      setLoadState(t("demoLoaded"));
      return;
    }
    if (state.modelRevision !== revision || state.userInteracted) {
      if (state.modelRevision === revision) setLoadState(t("demoLoaded"));
      return;
    }
    loadArrayBuffer(loaded.modelPackage.sceneBuffer, loaded.filename, "package", loaded.modelPackage.data, { cancelIfInteracted: true });
  } catch (error) {
    console.warn("Optional catalogue package could not be loaded:", error);
    if (state.modelRevision === revision) setLoadState(t("demoLoaded"));
  }
}

bindUI();
applyLanguage();
initRenderer();
document.documentElement.classList.add("sbs-ready");
document.documentElement.dispatchEvent(new Event("sbs-ready"));
const startupFallback = $("#startup-fallback");
if (startupFallback) startupFallback.hidden = true;
if (state.renderer) {
  canvasHost.addEventListener("dblclick", resetCamera);
  loadDemo();
  tryLoadBundledModel();
}

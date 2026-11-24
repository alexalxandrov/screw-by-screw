export const MODEL = {
  id: "gpu.evga.12g-p5-3655-kr",
  name: "EVGA GeForce RTX 3060 XC BLACK GAMING 12GB",
  partNumber: "12G-P5-3655-KR",
  manufacturer: "EVGA",
  status: "illustrative_proxy_not_cad",
  sources: [
    { id: "src.evga.spec", label: "EVGA specifications", url: "https://sg-repo-production-photos.s3.eu-central-1.amazonaws.com/aikido/cache/70b60b3a1a7bbeaced972a5b6905797f.pdf" },
    { id: "src.lanoc.review", label: "LanOC exact XC BLACK review", url: "https://lanoc.org/review/video-cards/evga-rtx-3060-xc-black?showall=1" },
    { id: "src.gamersnexus.teardown", label: "Gamers Nexus teardown", url: "https://www.youtube.com/watch?v=hJFJ_clQT8U" },
    { id: "src.neoseeker.review", label: "Neoseeker exact SKU review", url: "https://www.neoseeker.com/Articles/Hardware/Reviews/evga-geforce-rtx-3060-xc-black-gaming/" }
  ]
};

export const COMPONENTS = [
  { id: "assembly.card.root", parent: null, category: "assembly", en: "Graphics card assembly", ru: "Видеокарта в сборе", descriptionEn: "Top-level assembly of the exact EVGA XC BLACK retail variant.", descriptionRu: "Верхний уровень сборки точной розничной версии EVGA XC BLACK.", evidence: "illustrative", geometry: "assembly_node" },
  { id: "assembly.shroud", parent: "assembly.card.root", category: "assembly", en: "Fan shroud", ru: "Кожух вентиляторов", descriptionEn: "Plastic outer fascia around the two axial fans. The exact contour is not yet measured.", descriptionRu: "Внешняя пластиковая фасция вокруг двух осевых вентиляторов. Точный контур пока не измерен.", evidence: "visible_exact_model", geometry: "proxy" },
  { id: "assembly.cooling", parent: "assembly.card.root", category: "assembly", en: "Cooling assembly", ru: "Система охлаждения", descriptionEn: "Dual-fan cooler with an aluminium fin stack and copper contact area. Internal routing remains incomplete.", descriptionRu: "Двухвентиляторный кулер с алюминиевым радиатором и медной контактной зоной. Внутренняя разводка пока не реконструирована.", evidence: "visible_exact_model", geometry: "proxy" },
  { id: "assembly.fan.1", parent: "assembly.cooling", category: "thermal_mechanical", en: "Axial fan 1", ru: "Осевой вентилятор 1", descriptionEn: "First axial fan. Its centre and blade profile are illustrative placeholders.", descriptionRu: "Первый осевой вентилятор. Центр и профиль лопастей заданы условно.", evidence: "visible_exact_model", geometry: "proxy" },
  { id: "assembly.fan.2", parent: "assembly.cooling", category: "thermal_mechanical", en: "Axial fan 2", ru: "Осевой вентилятор 2", descriptionEn: "Second axial fan. Its centre and blade profile are illustrative placeholders.", descriptionRu: "Второй осевой вентилятор. Центр и профиль лопастей заданы условно.", evidence: "visible_exact_model", geometry: "proxy" },
  { id: "cooling.heatsink", parent: "assembly.cooling", category: "thermal", en: "Heatsink fin stack", ru: "Радиатор с рёбрами", descriptionEn: "A set of independent fin proxies used to communicate the fin-stack topology. Count and pitch are not measured.", descriptionRu: "Набор отдельных прокси-рёбер для отображения структуры радиатора. Количество и шаг не измерены.", evidence: "visible_exact_model", geometry: "illustrative_proxy" },
  { id: "cooling.gpu_contact", parent: "assembly.cooling", category: "thermal", en: "Copper contact plate", ru: "Медная контактная пластина", descriptionEn: "The review describes a copper contact plate spanning the GPU and memory thermal-contact area.", descriptionRu: "В обзоре описана медная контактная пластина, охватывающая зону теплового контакта GPU и памяти.", evidence: "visible_exact_model", geometry: "proxy" },
  { id: "assembly.pcb.electronics", parent: "assembly.card.root", category: "assembly", en: "PCB and electronics", ru: "Печатная плата и электроника", descriptionEn: "Exposed PCB assembly. The exact PCB revision has not been identified.", descriptionRu: "Сборка открытой печатной платы. Точная ревизия PCB пока не установлена.", evidence: "visible_exact_model", geometry: "proxy" },
  { id: "assembly.pcb.board", parent: "assembly.pcb.electronics", category: "electrical_mechanical", en: "Printed circuit board", ru: "Печатная плата", descriptionEn: "The rear PCB is exposed; no backplate is present on this XC BLACK sample. The outline is a proxy.", descriptionRu: "Задняя сторона PCB открыта; на данном XC BLACK нет backplate. Контур платы условный.", evidence: "visible_exact_model", geometry: "proxy" },
  { id: "chip.gpu.ga106", parent: "assembly.pcb.electronics", category: "semiconductor", en: "GPU package · GA106", ru: "Корпус GPU · GA106", descriptionEn: "NVIDIA GA106 GPU package. Exact package coordinates are not yet confirmed for this PCB revision.", descriptionRu: "Графический процессор NVIDIA GA106. Точные координаты корпуса для этой ревизии PCB не подтверждены.", evidence: "teardown_supported", geometry: "proxy" },
  { id: "connector.power.8pin", parent: "assembly.connectors", category: "power_electronics", en: "8-pin power connector", ru: "Разъём питания 8-pin", descriptionEn: "Single 8-pin auxiliary power connector. Exact placement and internal pin mapping are not documented here.", descriptionRu: "Один дополнительный разъём питания 8-pin. Точное положение и внутренняя распиновка здесь не документированы.", evidence: "manufacturer_data", geometry: "proxy" },
  { id: "connector.io.bracket", parent: "assembly.connectors", category: "mechanical_io", en: "I/O bracket", ru: "Планка интерфейсных разъёмов", descriptionEn: "Rear bracket with three DisplayPort outputs and one HDMI output. Aperture dimensions are approximate.", descriptionRu: "Задняя планка с тремя DisplayPort и одним HDMI. Размеры отверстий приблизительные.", evidence: "manufacturer_data", geometry: "proxy" },
  { id: "assembly.connectors", parent: "assembly.card.root", category: "assembly", en: "Connectors", ru: "Разъёмы", descriptionEn: "Power and display-output connector group.", descriptionRu: "Группа разъёмов питания и вывода изображения.", evidence: "visible_exact_model", geometry: "proxy" }
];

export const EVIDENCE = {
  manufacturer_data: { en: "Manufacturer specification", ru: "Данные производителя", copyEn: "Published by the manufacturer. Applies to the exact retail SKU where stated.", copyRu: "Опубликовано производителем. Применимость к точному SKU указана отдельно." },
  reviewer_measurement: { en: "Reviewer measurement", ru: "Измерение автора обзора", copyEn: "Measured by a reviewer; not a manufacturer drawing.", copyRu: "Измерено автором обзора; это не заводской чертёж." },
  visible_exact_model: { en: "Visible on exact model", ru: "Видно на точной модели", copyEn: "The feature is visible in an exact XC BLACK reference. Its dimensions may still be approximate.", copyRu: "Элемент виден на источнике именно XC BLACK. Его размеры всё ещё могут быть приблизительными." },
  teardown_supported: { en: "Teardown-supported", ru: "Подтверждено разборкой", copyEn: "Supported by the exact-model teardown, but not a complete board-level identification.", copyRu: "Подтверждено разборкой точной модели, но не является полной идентификацией на уровне платы." },
  illustrative: { en: "Illustrative proxy", ru: "Условная геометрия", copyEn: "Visual proxy only. Not a measured physical part or CAD.", copyRu: "Только визуальный заместитель. Не измеренная физическая деталь и не CAD." }
};

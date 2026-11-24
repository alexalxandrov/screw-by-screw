import MODEL_PACKAGE from "../../content/models/evga-rtx3060-xc-black-12gb/model.json";
import SOURCE_PACKAGE from "../../content/models/evga-rtx3060-xc-black-12gb/sources.json";
import COMPONENT_PACKAGE from "../../content/models/evga-rtx3060-xc-black-12gb/components.json";

export const MODEL = {
  id: MODEL_PACKAGE.id,
  name: MODEL_PACKAGE.product_name,
  partNumber: MODEL_PACKAGE.part_number,
  manufacturer: MODEL_PACKAGE.manufacturer,
  status: MODEL_PACKAGE.geometry_status,
  sources: SOURCE_PACKAGE.sources.map((source) => ({
    id: source.id,
    label: source.title,
    url: source.url
  }))
};

export const COMPONENTS = COMPONENT_PACKAGE.components.map((component) => ({
  id: component.id,
  parent: component.parent_id,
  category: component.category,
  en: component.name.en,
  ru: component.name.ru,
  descriptionEn: component.description.en,
  descriptionRu: component.description.ru,
  evidence: component.evidence_status,
  geometry: component.geometry_status
}));

export const EVIDENCE = {
  manufacturer_data: {
    en: "Manufacturer specification",
    ru: "Данные производителя",
    copyEn: "Published by the manufacturer. Applies to the exact retail SKU where stated.",
    copyRu: "Опубликовано производителем. Применимость к точному SKU указана отдельно."
  },
  reviewer_measurement: {
    en: "Reviewer measurement",
    ru: "Измерение автора обзора",
    copyEn: "Measured by a reviewer; not a manufacturer drawing.",
    copyRu: "Измерено автором обзора; это не заводской чертёж."
  },
  visible_exact_model: {
    en: "Visible on exact model",
    ru: "Видно на точной модели",
    copyEn: "The feature is visible in an exact XC BLACK reference. Its dimensions may still be approximate.",
    copyRu: "Элемент виден на источнике именно XC BLACK. Его размеры всё ещё могут быть приблизительными."
  },
  teardown_supported: {
    en: "Teardown-supported",
    ru: "Подтверждено разборкой",
    copyEn: "Supported by the exact-model teardown, but not a complete board-level identification.",
    copyRu: "Подтверждено разборкой точной модели, но не является полной идентификацией на уровне платы."
  },
  independently_verified: {
    en: "Independently verified",
    ru: "Независимо подтверждено",
    copyEn: "Cross-checked against an exact-model source. This does not imply metrology-grade measurement.",
    copyRu: "Сверено с источником точной модели. Это не означает метрологически точное измерение."
  },
  measured: {
    en: "Measured",
    ru: "Измерено",
    copyEn: "A measurement reported by a reviewer, with the source and limitations recorded.",
    copyRu: "Измерение, опубликованное автором обзора; источник и ограничения указаны."
  },
  candidate_count_requires_exact_board_confirmation: {
    en: "Unconfirmed component candidate",
    ru: "Неподтверждённый компонент-кандидат",
    copyEn: "This is a candidate placement only. Exact PCB revision and component population must be confirmed.",
    copyRu: "Это только кандидат размещения. Необходимо подтвердить ревизию PCB и состав компонентов."
  },
  illustrative: {
    en: "Illustrative proxy",
    ru: "Условная геометрия",
    copyEn: "Visual proxy only. Not a measured physical part or CAD.",
    copyRu: "Только визуальный заместитель. Не измеренная физическая деталь и не CAD."
  },
  unknown: {
    en: "Unknown",
    ru: "Неизвестно",
    copyEn: "No reliable value is available. The value is intentionally left unknown.",
    copyRu: "Надёжное значение отсутствует. Поле намеренно оставлено неизвестным."
  }
};

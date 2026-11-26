import MODEL_PACKAGE from "../../content/models/evga-rtx3060-xc-black-12gb/model.json";
import SOURCE_PACKAGE from "../../content/models/evga-rtx3060-xc-black-12gb/sources.json";
import COMPONENT_PACKAGE from "../../content/models/evga-rtx3060-xc-black-12gb/components.json";

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
  candidate_reference_observation: {
    en: "Candidate reference observation",
    ru: "Кандидатное наблюдение по справочному изображению",
    copyEn: "The marking is visible on a public product-page photograph, but the photographed board has not been independently tied to this exact retail sample or production batch.",
    copyRu: "Маркировка читается на фотографии из публичной карточки продукта, но показанная плата не сопоставлена независимо с этим точным розничным экземпляром или производственной партией."
  },
  secondary_catalog_data: {
    en: "Secondary catalog data",
    ru: "Данные вторичного каталога",
    copyEn: "A device attribute is transcribed from a secondary catalog, not a primary manufacturer datasheet. Confirm it against an authoritative datasheet before using it for repair or design.",
    copyRu: "Параметр микросхемы перенесён из вторичного каталога, а не первичного паспорта производителя. Перед ремонтом или проектированием сверяйте его с официальным даташитом."
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

export function createModelDataAdapter(data) {
  const modelPackage = data?.model;
  const sourcePackage = data?.sources;
  const componentPackage = data?.components;
  if (!modelPackage?.id || !Array.isArray(sourcePackage?.sources) || !Array.isArray(componentPackage?.components)) {
    throw new TypeError("Model package is missing model, sources or components data");
  }
  return {
    model: {
      id: modelPackage.id,
      name: modelPackage.display_name ?? [modelPackage.manufacturer, modelPackage.product_name ?? modelPackage.name ?? modelPackage.id].filter(Boolean).join(" "),
      partNumber: modelPackage.part_number ?? "",
      manufacturer: modelPackage.manufacturer ?? "",
      status: modelPackage.geometry_status ?? "unknown",
      units: modelPackage.coordinate_system?.units ?? null,
      sources: sourcePackage.sources.map((source) => ({
        ...source,
        id: source.id,
        label: source.title ?? source.label ?? source.id,
        url: source.url ?? ""
      }))
    },
    components: componentPackage.components.map((component) => ({
      id: component.id,
      parent: component.parent_id ?? null,
      category: component.category ?? "component",
      en: component.name?.en ?? component.id,
      ru: component.name?.ru ?? component.name?.en ?? component.id,
      descriptionEn: component.description?.en ?? "",
      descriptionRu: component.description?.ru ?? component.description?.en ?? "",
      evidence: component.evidence_status ?? "unknown",
      geometry: component.geometry_status ?? "unknown",
      sourceIds: component.source_ids ?? []
    })),
    evidence: EVIDENCE
  };
}

const DEFAULT_ADAPTER = createModelDataAdapter({
  model: MODEL_PACKAGE,
  sources: SOURCE_PACKAGE,
  components: COMPONENT_PACKAGE
});
export const MODEL = DEFAULT_ADAPTER.model;
export const COMPONENTS = DEFAULT_ADAPTER.components;

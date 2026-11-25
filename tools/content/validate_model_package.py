#!/usr/bin/env python3
"""Validate semantic references in a Screw by Screw content package."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

FILES = ("model.json", "sources.json", "components.json", "relationships.json",
         "process_layers.json", "assembly_steps.json", "learning.json")
EVIDENCE = {
    "manufacturer_data", "reviewer_measurement", "visible_exact_model",
    "teardown_supported", "illustrative", "candidate_count_requires_exact_board_confirmation",
    "unknown",
}
RELATIONSHIP_TYPES = {
    "contains", "mounted_in", "fastened_to", "connected_to", "powered_by",
    "signals_to", "cooled_by", "transfers_heat_to", "airflow_over", "depends_on",
}


class PackageError(ValueError):
    pass


def load_package(directory: Path) -> dict:
    package = {}
    for filename in FILES:
        path = directory / filename
        if not path.is_file():
            raise PackageError(f"Required package file is missing: {filename}")
        try:
            package[filename.removesuffix(".json")] = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise PackageError(f"Invalid JSON in {filename}: {exc}") from exc
    return package


def unique_ids(items: list, key: str, label: str) -> set[str]:
    result = set()
    for index, item in enumerate(items):
        if not isinstance(item, dict):
            raise PackageError(f"{label}[{index}] must be an object")
        value = item.get(key)
        if not isinstance(value, str) or not value:
            raise PackageError(f"{label}[{index}] has no valid {key}")
        if value in result:
            raise PackageError(f"Duplicate {label} ID: {value}")
        result.add(value)
    return result


def require_source_ids(values, source_ids: set[str], label: str) -> None:
    if not isinstance(values, list):
        raise PackageError(f"{label} source_ids must be an array")
    missing = sorted(set(values) - source_ids)
    if missing:
        raise PackageError(f"{label} references unknown sources: {missing}")


def validate_package(package: dict) -> list[str]:
    model = package["model"]
    sources_doc = package["sources"]
    components_doc = package["components"]
    relationships_doc = package["relationships"]
    layers_doc = package["process_layers"]
    steps_doc = package["assembly_steps"]
    learning_doc = package["learning"]

    if not isinstance(model, dict) or not isinstance(model.get("id"), str):
        raise PackageError("model.json must define a model id")
    if model.get("geometry_status") != "illustrative_proxy_not_cad":
        raise PackageError("Pilot geometry must remain explicitly labelled illustrative_proxy_not_cad")

    sources = sources_doc.get("sources") if isinstance(sources_doc, dict) else None
    components = components_doc.get("components") if isinstance(components_doc, dict) else None
    relationships = relationships_doc.get("relationships") if isinstance(relationships_doc, dict) else None
    layers = layers_doc.get("process_layers") if isinstance(layers_doc, dict) else None
    steps = steps_doc.get("steps") if isinstance(steps_doc, dict) else None
    questions = learning_doc.get("questions") if isinstance(learning_doc, dict) else None
    for value, label in ((sources, "sources"), (components, "components"),
                         (relationships, "relationships"), (layers, "process_layers"),
                         (steps, "steps"), (questions, "questions")):
        if not isinstance(value, list):
            raise PackageError(f"{label} must be an array")

    source_ids = unique_ids(sources, "id", "sources")
    component_ids = unique_ids(components, "id", "components")
    relationship_ids = unique_ids(relationships, "id", "relationships")
    layer_ids = unique_ids(layers, "id", "process_layers")
    question_ids = unique_ids(questions, "id", "questions")

    require_source_ids(model.get("source_ids"), source_ids, "model")
    for component in components:
        parent = component.get("parent_id")
        if parent is not None and parent not in component_ids:
            raise PackageError(f"Component {component['id']} has unknown parent_id: {parent}")
        if component.get("evidence_status") not in EVIDENCE:
            raise PackageError(f"Component {component['id']} has invalid evidence_status")
        name = component.get("name")
        if not isinstance(name, dict) or not all(isinstance(name.get(lang), str) and name[lang] for lang in ("en", "ru")):
            raise PackageError(f"Component {component['id']} must have non-empty en/ru names")
        require_source_ids(component.get("source_ids"), source_ids, f"component {component['id']}")

    for relationship in relationships:
        for endpoint in ("from", "to"):
            if relationship.get(endpoint) not in component_ids:
                raise PackageError(f"Relationship {relationship['id']} has unknown {endpoint} component")
        if relationship.get("type") not in RELATIONSHIP_TYPES:
            raise PackageError(f"Relationship {relationship['id']} has unsupported type")
        require_source_ids(relationship.get("source_ids"), source_ids, f"relationship {relationship['id']}")

    for layer in layers:
        linked = layer.get("linked_component_ids")
        if not isinstance(linked, list) or not linked:
            raise PackageError(f"Process layer {layer['id']} must link at least one component")
        missing = sorted(set(linked) - component_ids)
        if missing:
            raise PackageError(f"Process layer {layer['id']} has unknown components: {missing}")
        if layer.get("mode") not in {"qualitative", "quantitative"}:
            raise PackageError(f"Process layer {layer['id']} has invalid mode")
        require_source_ids(layer.get("source_ids"), source_ids, f"process layer {layer['id']}")

    for step in steps:
        if not isinstance(step, dict) or not isinstance(step.get("id"), str):
            raise PackageError("Every assembly step must be an object with an id")
        targets = step.get("target_component_ids", [])
        if not isinstance(targets, list) or set(targets) - component_ids:
            raise PackageError(f"Assembly step {step.get('id')} has unknown targets")
        require_source_ids(step.get("source_ids"), source_ids, f"assembly step {step['id']}")

    for question in questions:
        choices = question.get("choices")
        answer = question.get("correct_index")
        if not isinstance(choices, list) or len(choices) < 2:
            raise PackageError(f"Question {question['id']} must have at least two choices")
        if isinstance(answer, bool) or not isinstance(answer, int) or answer < 0 or answer >= len(choices):
            raise PackageError(f"Question {question['id']} has invalid correct_index")
        for lang in ("en", "ru"):
            if not isinstance(question.get("prompt", {}).get(lang), str):
                raise PackageError(f"Question {question['id']} has no {lang} prompt")
        require_source_ids(question.get("source_ids"), source_ids, f"question {question['id']}")

    if steps_doc.get("status") == "not_authored" and steps:
        raise PackageError("Assembly steps marked not_authored must have an empty steps array")

    return [
        f"Sources: {len(source_ids)}",
        f"Components: {len(component_ids)}",
        f"Relationships: {len(relationship_ids)}",
        f"Process layers: {len(layer_ids)}",
        f"Learning questions: {len(question_ids)}",
        f"Assembly steps: {len(steps)} ({steps_doc.get('status', 'status missing')})",
        "Bilingual labels and semantic references: PASS",
        "Accuracy status: illustrative proxy, not CAD",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package", type=Path, help="Directory containing model.json and related package files")
    args = parser.parse_args()
    try:
        report = validate_package(load_package(args.package))
    except (OSError, PackageError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    print("SCREW BY SCREW CONTENT PACKAGE VALIDATION")
    for line in report:
        print(line)
    print("RESULT: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

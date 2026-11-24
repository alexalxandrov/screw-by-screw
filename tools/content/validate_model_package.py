#!/usr/bin/env python3
"""Validate semantic references and hashes in a Screw by Screw content package."""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

FILES = ("model.json", "sources.json", "components.json", "relationships.json",
         "process_layers.json", "assembly_steps.json", "learning.json",
         "claims.json", "release.json")
HASHED_FILES = FILES[:-1]
EVIDENCE = {"manufacturer_data", "reviewer_measurement", "visible_exact_model",
            "teardown_supported", "illustrative",
            "candidate_count_requires_exact_board_confirmation", "unknown"}
CLAIM_CLASSES = {"manufacturer_data", "measured", "independently_verified",
                 "calculated", "educational_approximation", "illustrative", "unknown"}
RELATIONSHIP_TYPES = {"contains", "mounted_in", "fastened_to", "connected_to",
                      "powered_by", "signals_to", "cooled_by", "transfers_heat_to",
                      "airflow_over", "depends_on"}


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
    if not isinstance(values, list) or any(not isinstance(value, str) for value in values):
        raise PackageError(f"{label} source_ids must be an array of strings")
    missing = sorted(set(values) - source_ids)
    if missing:
        raise PackageError(f"{label} references unknown sources: {missing}")


def _validate_release(release: dict, model: dict, package_dir: Path | None) -> None:
    if not isinstance(release, dict):
        raise PackageError("release.json must be an object")
    for key in ("model_id", "part_number", "package_version", "status", "geometry_status"):
        if not isinstance(release.get(key), str) or not release[key]:
            raise PackageError(f"release.json must define {key}")
    if release["model_id"] != model["id"]:
        raise PackageError("Release manifest model_id does not match model.json")
    if release["part_number"] != model.get("part_number"):
        raise PackageError("Release manifest part_number does not match model.json")
    if release["geometry_status"] != model.get("geometry_status"):
        raise PackageError("Release manifest geometry_status does not match model.json")
    if release["package_version"] != model.get("release", {}).get("version"):
        raise PackageError("Release manifest package_version does not match model release version")
    if release["status"] not in {"draft", "review", "published", "withdrawn"}:
        raise PackageError("Release manifest has unsupported status")
    files = release.get("files")
    if not isinstance(files, list):
        raise PackageError("Release manifest files must be an array")
    file_map = {}
    for item in files:
        if not isinstance(item, dict):
            raise PackageError("Release manifest file entries must be objects")
        name, digest = item.get("path"), item.get("sha256")
        if name not in HASHED_FILES:
            raise PackageError(f"Release manifest contains unsupported path: {name!r}")
        if name in file_map:
            raise PackageError(f"Duplicate release manifest path: {name}")
        if not isinstance(digest, str) or not re.fullmatch(r"[0-9a-f]{64}", digest):
            raise PackageError(f"Invalid SHA-256 for {name}")
        file_map[name] = digest
    if package_dir is not None:
        expected = set(HASHED_FILES)
        if set(file_map) != expected:
            raise PackageError(
                f"Release manifest file set mismatch; missing={sorted(expected - set(file_map))}, "
                f"unexpected={sorted(set(file_map) - expected)}"
            )
        for name, expected_hash in file_map.items():
            actual_hash = hashlib.sha256((package_dir / name).read_bytes()).hexdigest()
            if actual_hash != expected_hash:
                raise PackageError(f"SHA-256 mismatch for {name}")


def validate_package(package: dict, package_dir: Path | None = None) -> list[str]:
    model = package["model"]
    sources_doc = package["sources"]
    components_doc = package["components"]
    relationships_doc = package["relationships"]
    layers_doc = package["process_layers"]
    steps_doc = package["assembly_steps"]
    learning_doc = package["learning"]
    claims_doc = package["claims"]
    release_doc = package["release"]
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
    claims = claims_doc.get("claims") if isinstance(claims_doc, dict) else None
    for value, label in ((sources, "sources"), (components, "components"),
                         (relationships, "relationships"), (layers, "process_layers"),
                         (steps, "steps"), (questions, "questions"), (claims, "claims")):
        if not isinstance(value, list):
            raise PackageError(f"{label} must be an array")

    source_ids = unique_ids(sources, "id", "sources")
    component_ids = unique_ids(components, "id", "components")
    relationship_ids = unique_ids(relationships, "id", "relationships")
    layer_ids = unique_ids(layers, "id", "process_layers")
    question_ids = unique_ids(questions, "id", "questions")
    claim_ids = unique_ids(claims, "id", "claims")
    require_source_ids(model.get("source_ids"), source_ids, "model")
    for source in sources:
        if not isinstance(source.get("url"), str) or not source["url"].startswith(("https://", "http://")):
            raise PackageError(f"Source {source['id']} has no valid URL")
        if not isinstance(source.get("title"), str) or not isinstance(source.get("publisher"), str):
            raise PackageError(f"Source {source['id']} needs title and publisher")
        if not isinstance(source.get("license_status"), str):
            raise PackageError(f"Source {source['id']} has no license_status")

    parent_map = {}
    for component in components:
        parent = component.get("parent_id")
        if parent is not None and parent not in component_ids:
            raise PackageError(f"Component {component['id']} has unknown parent_id: {parent}")
        if parent == component["id"]:
            raise PackageError(f"Component {component['id']} cannot parent itself")
        parent_map[component["id"]] = parent
        if component.get("evidence_status") not in EVIDENCE:
            raise PackageError(f"Component {component['id']} has invalid evidence_status")
        name = component.get("name")
        if not isinstance(name, dict) or not all(isinstance(name.get(lang), str) and name[lang] for lang in ("en", "ru")):
            raise PackageError(f"Component {component['id']} must have non-empty en/ru names")
        description = component.get("description")
        if not isinstance(description, dict) or not all(isinstance(description.get(lang), str) and description[lang] for lang in ("en", "ru")):
            raise PackageError(f"Component {component['id']} must have bilingual descriptions")
        require_source_ids(component.get("source_ids"), source_ids, f"component {component['id']}")
    for component_id in parent_map:
        seen = set()
        current = component_id
        while current is not None:
            if current in seen:
                raise PackageError(f"Component hierarchy cycle detected at {current}")
            seen.add(current)
            current = parent_map[current]

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
        if not isinstance(layer.get("assumptions"), list) or any(not isinstance(value, str) for value in layer["assumptions"]):
            raise PackageError(f"Process layer {layer['id']} assumptions must be an array of strings")
        for field in ("title", "description"):
            localized = layer.get(field)
            if not isinstance(localized, dict) or not all(isinstance(localized.get(lang), str) and localized[lang] for lang in ("en", "ru")):
                raise PackageError(f"Process layer {layer['id']} must have bilingual {field}")

    for step in steps:
        if not isinstance(step, dict) or not isinstance(step.get("id"), str):
            raise PackageError("Every assembly step must be an object with an id")
        targets = step.get("target_component_ids", [])
        if not isinstance(targets, list) or set(targets) - component_ids:
            raise PackageError(f"Assembly step {step.get('id')} has unknown targets")
        require_source_ids(step.get("source_ids"), source_ids, f"assembly step {step['id']}")
    observations = steps_doc.get("observations", [])
    if not isinstance(observations, list):
        raise PackageError("Assembly observations must be an array")
    for index, observation in enumerate(observations):
        if not isinstance(observation, dict) or not isinstance(observation.get("source_id"), str):
            raise PackageError(f"Assembly observation {index} must define source_id")
        require_source_ids([observation["source_id"]], source_ids, f"assembly observation {index}")

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
        for choice_index, choice in enumerate(choices):
            if not isinstance(choice, dict) or not all(isinstance(choice.get(lang), str) and choice[lang] for lang in ("en", "ru")):
                raise PackageError(f"Question {question['id']} choice {choice_index} must be bilingual")
        require_source_ids(question.get("source_ids"), source_ids, f"question {question['id']}")

    for claim in claims:
        if claim.get("subject_id") not in component_ids | {model["id"]}:
            raise PackageError(f"Claim {claim['id']} has unknown subject_id")
        if not isinstance(claim.get("predicate"), str) or not claim["predicate"]:
            raise PackageError(f"Claim {claim['id']} has no predicate")
        confidence = claim.get("confidence_class")
        if confidence not in CLAIM_CLASSES:
            raise PackageError(f"Claim {claim['id']} has invalid confidence_class")
        if confidence == "unknown" and claim.get("value") is not None:
            raise PackageError(f"Unknown claim {claim['id']} must have a null value")
        if confidence != "unknown" and claim.get("value") is None:
            raise PackageError(f"Claim {claim['id']} needs a value or confidence_class unknown")
        require_source_ids(claim.get("source_ids"), source_ids, f"claim {claim['id']}")

    if steps_doc.get("status") == "not_authored" and steps:
        raise PackageError("Assembly steps marked not_authored must have an empty steps array")
    _validate_release(release_doc, model, package_dir)
    return [
        f"Sources: {len(source_ids)}",
        f"Components: {len(component_ids)}",
        f"Relationships: {len(relationship_ids)}",
        f"Claims: {len(claim_ids)}",
        f"Process layers: {len(layer_ids)}",
        f"Learning questions: {len(question_ids)}",
        f"Assembly steps: {len(steps)} ({steps_doc.get('status', 'status missing')})",
        "Bilingual labels and semantic references: PASS",
        "Release manifest and SHA-256 integrity: PASS" if package_dir is not None else "Release manifest structure: PASS",
        "Accuracy status: illustrative proxy, not CAD",
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package", type=Path, help="Directory containing model.json and related package files")
    args = parser.parse_args()
    try:
        report = validate_package(load_package(args.package), args.package)
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

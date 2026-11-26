#!/usr/bin/env python3
"""Build the checksummed UTF-8 JSON envelope used by text-based .sbsmodel packages.

The envelope keeps editable sidecars as UTF-8 JSON text and embeds a self-contained
GLB as base64. The production loader also continues to support the legacy ZIP
container. This format is useful for repositories and transports that only accept
text file contents while preserving the same manifest and SHA-256 contract.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
from pathlib import Path, PurePosixPath


PREFIX = "SBSMODEL-JSON\n"
FILE_ORDER = (
    "model.json",
    "components.json",
    "sources.json",
    "relationships.json",
    "claims.json",
    "process_layers.json",
    "assembly_steps.json",
    "learning.json",
    "animations.json",
    "release.json",
    "scene.glb",
)


def safe_package_path(value: str) -> Path:
    if not isinstance(value, str) or not value:
        raise ValueError("package file path must be a non-empty string")
    pure = PurePosixPath(value)
    if pure.is_absolute() or ".." in pure.parts or "\\" in value:
        raise ValueError(f"unsafe package path: {value!r}")
    return Path(*pure.parts)


def build_envelope(model_dir: Path, scene_path: Path) -> str:
    package_path = model_dir / "model-package.json"
    package_doc = json.loads(package_path.read_text(encoding="utf-8"))
    files_map = package_doc.get("files")
    if not isinstance(files_map, dict):
        raise ValueError("model-package.json must contain a files object")

    file_payloads: dict[str, bytes] = {}
    file_text: dict[str, str] = {}
    for key, relative_path in files_map.items():
        if key not in {"model", "scene", "components", "sources", "relationships",
                       "claims", "process_layers", "assembly_steps", "learning",
                       "animations", "release"}:
            raise ValueError(f"unsupported manifest file key: {key}")
        safe_path = safe_package_path(relative_path)
        if key == "scene":
            payload = scene_path.read_bytes()
            file_payloads[relative_path] = payload
            file_text[relative_path] = base64.b64encode(payload).decode("ascii")
        else:
            payload = (model_dir / safe_path).read_bytes()
            # Decode strictly so the envelope cannot silently carry invalid UTF-8.
            text = payload.decode("utf-8", errors="strict")
            file_payloads[relative_path] = payload
            file_text[relative_path] = text

    expected_names = {files_map[key] for key in files_map}
    if set(file_text) != expected_names:
        raise ValueError("manifest paths are not unique")
    required_names = set(FILE_ORDER)
    if expected_names != required_names:
        missing = sorted(required_names - expected_names)
        extra = sorted(expected_names - required_names)
        raise ValueError(f"package file map mismatch; missing={missing}, extra={extra}")

    manifest = {
        "format": package_doc.get("format", "sbs-model"),
        "schema_version": package_doc.get("schema_version", "1.0.0"),
        "model_id": package_doc.get("model_id"),
        "package_version": package_doc.get("package_version"),
        "status": package_doc.get("status"),
        "files": package_doc["files"],
        "sha256": {
            path: hashlib.sha256(file_payloads[path]).hexdigest()
            for path in FILE_ORDER
        },
    }
    if not manifest["model_id"] or not manifest["package_version"]:
        raise ValueError("model-package.json is missing model_id or package_version")

    # Maintain deterministic insertion order to make the committed result reproducible.
    ordered_text = {path: file_text[path] for path in FILE_ORDER}
    envelope = {
        "format": "sbs-model-json",
        "schema_version": "1.0.0",
        "manifest": manifest,
        "files": ordered_text,
    }
    return PREFIX + json.dumps(envelope, ensure_ascii=False, separators=(",", ":"))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--scene", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()

    text = build_envelope(args.model_dir, args.scene)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8", newline="")
    print(json.dumps({
        "output": str(args.output),
        "bytes": args.output.stat().st_size,
        "format": "SBSMODEL-JSON",
        "files": len(FILE_ORDER),
        "integrity": "SHA-256",
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

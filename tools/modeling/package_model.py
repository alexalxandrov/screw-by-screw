#!/usr/bin/env python3
"""Build a portable .sbsmodel ZIP package from model sidecars and a self-contained GLB."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import struct
import tempfile
import zipfile
from pathlib import Path
from typing import Any

MAX_PACKAGE_BYTES = 512 * 1024 * 1024
MAX_ENTRY_BYTES = 256 * 1024 * 1024
REQUIRED_KEYS = ("model", "scene", "components", "sources", "relationships", "claims", "process_layers", "assembly_steps", "learning", "animations")

def read_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"cannot read JSON file {path}: {exc}") from exc
    if not isinstance(value, dict):
        raise ValueError(f"expected a JSON object in {path}")
    return value

def safe_relative_path(value: str) -> Path:
    path = Path(value)
    if path.is_absolute() or not value or "\\" in value or any(part in ("", ".", "..") for part in value.split("/")):
        raise ValueError(f"unsafe package path: {value!r}")
    return path

def validate_glb(data: bytes) -> None:
    if len(data) < 20 or len(data) > MAX_ENTRY_BYTES:
        raise ValueError("GLB size is outside the allowed range")
    magic, version, total_length = struct.unpack_from("<III", data, 0)
    if magic != 0x46546C67 or version != 2 or total_length != len(data):
        raise ValueError("invalid GLB header")
    chunk_length, chunk_type = struct.unpack_from("<II", data, 12)
    if chunk_type != 0x4E4F534A or chunk_length % 4 or 20 + chunk_length > len(data):
        raise ValueError("invalid GLB JSON chunk")
    try:
        document = json.loads(data[20:20 + chunk_length].decode("utf-8").rstrip(" \t\r\n\0"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("invalid GLB JSON document") from exc
    resources = list(document.get("buffers", [])) + list(document.get("images", []))
    if any(isinstance(item, dict) and isinstance(item.get("uri"), str) and not item["uri"].startswith("data:") for item in resources):
        raise ValueError("external GLB resource URIs are not allowed")

def build_package(model_dir: Path, scene_path: Path, output_path: Path) -> dict[str, Any]:
    model_dir = model_dir.resolve(strict=True)
    scene_path = scene_path.resolve(strict=True)
    manifest_path = (model_dir / "model-package.json").resolve(strict=True)
    if model_dir not in manifest_path.parents:
        raise ValueError("model-package.json escapes model directory")
    manifest = read_json(manifest_path)
    if manifest.get("format") != "sbs-model" or manifest.get("schema_version") != "1.0.0":
        raise ValueError("unsupported model-package.json format or schema version")
    files = manifest.get("files")
    if not isinstance(files, dict) or any(not isinstance(files.get(key), str) for key in REQUIRED_KEYS):
        raise ValueError("model-package.json is missing required file entries")
    model_path = (model_dir / safe_relative_path(files["model"])).resolve(strict=True)
    if model_dir not in model_path.parents:
        raise ValueError("model metadata escapes model directory")
    model = read_json(model_path)
    if model.get("id") != manifest.get("model_id"):
        raise ValueError("model ID does not match package manifest")
    payload: dict[str, bytes] = {"model-package.json": (model_dir / "model-package.json").read_bytes()}
    archive_names = {"model-package.json"}
    for key in REQUIRED_KEYS:
        archive_path = safe_relative_path(files[key]).as_posix()
        if archive_path in archive_names:
            raise ValueError(f"duplicate package archive path: {archive_path}")
        archive_names.add(archive_path)
        source_path = scene_path if key == "scene" else (model_dir / safe_relative_path(files[key])).resolve(strict=True)
        if key != "scene" and model_dir not in source_path.parents:
            raise ValueError(f"package file escapes model directory: {source_path}")
        data = source_path.read_bytes()
        if len(data) > MAX_ENTRY_BYTES:
            raise ValueError(f"package entry is too large: {archive_path}")
        if key == "scene":
            validate_glb(data)
        payload[archive_path] = data
    release_name = files.get("release")
    if release_name:
        release_archive_path = safe_relative_path(release_name).as_posix()
        if release_archive_path in archive_names:
            raise ValueError(f"duplicate package archive path: {release_archive_path}")
        archive_names.add(release_archive_path)
        release_path = (model_dir / safe_relative_path(release_name)).resolve(strict=True)
        if model_dir not in release_path.parents:
            raise ValueError("release file escapes model directory")
        payload[release_archive_path] = release_path.read_bytes()
    total_size = sum(len(value) for value in payload.values())
    if total_size > MAX_PACKAGE_BYTES:
        raise ValueError("expanded model package exceeds 512 MiB")
    manifest = dict(manifest)
    manifest["sha256"] = {name: hashlib.sha256(value).hexdigest() for name, value in sorted(payload.items())}
    manifest_bytes = (json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n").encode("utf-8")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary_name = tempfile.mkstemp(prefix=output_path.name + ".", suffix=".tmp", dir=output_path.parent)
    os.close(fd)
    try:
        with zipfile.ZipFile(temporary_name, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=False) as archive:
            entries = {"sbs-model.json": manifest_bytes, **payload}
            for name, value in sorted(entries.items()):
                info = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                archive.writestr(info, value, compress_type=zipfile.ZIP_DEFLATED, compresslevel=6)
        temporary = Path(temporary_name)
        if temporary.stat().st_size > MAX_PACKAGE_BYTES:
            raise ValueError("compressed model package exceeds 512 MiB")
        temporary.replace(output_path)
    finally:
        if Path(temporary_name).exists():
            Path(temporary_name).unlink()
    return {"output": str(output_path), "files": len(payload) + 1, "expanded_bytes": total_size, "package_bytes": output_path.stat().st_size, "sha256": hashlib.sha256(output_path.read_bytes()).hexdigest()}

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, required=True, help="Directory containing model-package.json and sidecar JSON files")
    parser.add_argument("--scene", type=Path, required=True, help="Self-contained GLB exported from Blender")
    parser.add_argument("--output", type=Path, required=True, help="Destination .sbsmodel file")
    args = parser.parse_args()
    result = build_package(args.model_dir, args.scene, args.output)
    print(json.dumps(result, indent=2))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

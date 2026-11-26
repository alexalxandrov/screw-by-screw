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
import struct
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



def read_envelope(path: Path) -> dict:
    raw = path.read_bytes()
    prefix = PREFIX.encode("ascii")
    if not raw.startswith(prefix):
        raise ValueError(f"{path} is not an SBSMODEL-JSON envelope")
    envelope = json.loads(raw[len(prefix):].decode("utf-8", errors="strict"))
    if envelope.get("format") != "sbs-model-json" or envelope.get("schema_version") != "1.0.0":
        raise ValueError(f"{path} has an unsupported envelope schema")
    return envelope


def parse_glb(encoded: str, label: str) -> tuple[dict, bytes]:
    try:
        raw = base64.b64decode(encoded, validate=True)
    except (ValueError, TypeError) as error:
        raise ValueError(f"{label}: invalid scene.glb base64") from error
    if len(raw) < 20:
        raise ValueError(f"{label}: GLB is truncated")
    magic, version, declared_length = struct.unpack_from("<4sII", raw, 0)
    if magic != b"glTF" or version != 2 or declared_length != len(raw):
        raise ValueError(f"{label}: invalid GLB header")
    offset = 12
    json_doc = None
    binary_chunk = None
    while offset + 8 <= len(raw):
        chunk_length, chunk_type = struct.unpack_from("<II", raw, offset)
        offset += 8
        end = offset + chunk_length
        if end > len(raw):
            raise ValueError(f"{label}: GLB chunk exceeds file size")
        chunk = raw[offset:end]
        offset = end
        if chunk_type == 0x4E4F534A:
            if json_doc is not None:
                raise ValueError(f"{label}: duplicate GLB JSON chunk")
            json_doc = json.loads(chunk.rstrip(b" ").decode("utf-8", errors="strict"))
        elif chunk_type == 0x004E4942:
            if binary_chunk is not None:
                raise ValueError(f"{label}: duplicate GLB BIN chunk")
            binary_chunk = chunk
    if offset != len(raw) or json_doc is None or binary_chunk is None:
        raise ValueError(f"{label}: incomplete or malformed GLB chunks")
    return json_doc, binary_chunk


def verify_envelope_equivalence(rebuilt_path: Path, committed_path: Path) -> None:
    rebuilt = read_envelope(rebuilt_path)
    committed = read_envelope(committed_path)
    if rebuilt["manifest"].get("files") != committed["manifest"].get("files"):
        raise ValueError("rebuilt package manifest file map differs from committed package")
    for field in ("format", "schema_version", "model_id", "package_version", "status"):
        if rebuilt["manifest"].get(field) != committed["manifest"].get(field):
            raise ValueError(f"rebuilt package manifest field differs: {field}")
    rebuilt_files = rebuilt.get("files")
    committed_files = committed.get("files")
    if not isinstance(rebuilt_files, dict) or not isinstance(committed_files, dict):
        raise ValueError("package envelope files must be objects")
    if set(rebuilt_files) != set(committed_files):
        raise ValueError("rebuilt package file set differs from committed package")
    rebuilt_hashes = rebuilt["manifest"].get("sha256", {})
    committed_hashes = committed["manifest"].get("sha256", {})
    if set(rebuilt_hashes) != set(committed_hashes):
        raise ValueError("rebuilt package checksum paths differ from committed package")

    for name in rebuilt_files:
        if name == "scene.glb":
            continue
        if rebuilt_files[name] != committed_files[name]:
            raise ValueError(f"rebuilt sidecar differs: {name}")
        digest = hashlib.sha256(rebuilt_files[name].encode("utf-8")).hexdigest()
        if digest != rebuilt_hashes.get(name) or digest != committed_hashes.get(name):
            raise ValueError(f"sidecar checksum mismatch: {name}")

    if "scene.glb" not in rebuilt_files:
        raise ValueError("scene.glb is missing from package")
    rebuilt_glb_json, rebuilt_bin = parse_glb(rebuilt_files["scene.glb"], "rebuilt package")
    committed_glb_json, committed_bin = parse_glb(committed_files["scene.glb"], "committed package")
    if rebuilt_glb_json != committed_glb_json:
        raise ValueError("rebuilt GLB scene graph differs from committed package")
    if rebuilt_bin != committed_bin:
        raise ValueError("rebuilt GLB binary geometry differs from committed package")
    for envelope, files in ((rebuilt, rebuilt_files), (committed, committed_files)):
        glb_bytes = base64.b64decode(files["scene.glb"], validate=True)
        digest = hashlib.sha256(glb_bytes).hexdigest()
        if digest != envelope["manifest"]["sha256"].get("scene.glb"):
            raise ValueError("scene.glb checksum does not match its package manifest")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--model-dir", type=Path, required=True)
    parser.add_argument("--scene", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument(
        "--compare-existing",
        type=Path,
        help="verify exact sidecars and equivalent GLB geometry against a committed package",
    )
    args = parser.parse_args()

    text = build_envelope(args.model_dir, args.scene)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(text, encoding="utf-8", newline="")
    if args.compare_existing:
        verify_envelope_equivalence(args.output, args.compare_existing)
    print(json.dumps({
        "output": str(args.output),
        "bytes": args.output.stat().st_size,
        "format": "SBSMODEL-JSON",
        "files": len(FILE_ORDER),
        "integrity": "SHA-256",
        "comparison": "equivalent" if args.compare_existing else None,
        "compared_with": str(args.compare_existing) if args.compare_existing else None,
    }, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build a deterministic SHA-256 release manifest for a content package."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path

HASHED_FILES = ("model.json", "sources.json", "components.json", "relationships.json",
                "process_layers.json", "assembly_steps.json", "learning.json", "claims.json", "animations.json")


def build_manifest(directory: Path) -> dict:
    model = json.loads((directory / "model.json").read_text(encoding="utf-8"))
    files = []
    for filename in HASHED_FILES:
        path = directory / filename
        if not path.is_file():
            raise FileNotFoundError(f"Required content file missing: {filename}")
        files.append({"path": filename, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()})
    release = {
        "schema_version": "0.1.0",
        "model_id": model["id"],
        "part_number": model["part_number"],
        "package_version": model.get("release", {}).get("version", "0.1-draft"),
        "status": model.get("release", {}).get("status", "draft"),
        "geometry_status": model["geometry_status"],
        "files": files
    }
    (directory / "release.json").write_text(
        json.dumps(release, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    return release


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("package", type=Path)
    args = parser.parse_args()
    release = build_manifest(args.package)
    print(f"Manifest written: {args.package / 'release.json'}")
    print(f"Files hashed: {len(release['files'])}")
    print(f"Model: {release['model_id']} / {release['part_number']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

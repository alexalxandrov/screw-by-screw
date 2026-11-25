# Blender generation in CI

The repository includes a reproducible headless generation workflow for the v0.4 pilot model.

- Downloads the official Blender 4.3.2 Linux archive from Blender's release server.
- Verifies the archive against Blender's published SHA-256 checksum file.
- Runs the generator, scene inspector and GLB/manifest validator.
- Uploads the .blend, .glb, manifest and text/JSON inspection as a seven-day workflow artifact.

The workflow runs when the modeling pipeline or pilot model package changes. It can also be started manually with GitHub Actions → **Blender blockout generation** → **Run workflow**.

This proves the build can execute reproducibly in the pinned Blender version. It does not prove that proxy geometry matches a physical card or that the viewer's visual appearance is correct. The owner should still review the inspection report and generated model artifact.

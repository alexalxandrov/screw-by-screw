# Blender generation in CI

The repository includes a reproducible headless generation workflow for the v0.4 pilot model.

- Downloads the official Blender 4.3.2 Linux archive.
- Verifies the archive against Blender's published SHA-256 checksum.
- Runs the generator and text/JSON scene inspector.
- Validates the GLB 2.0 package and its manifest.
- Checks that all 20 canonical content component IDs exist exactly once in the GLB and that their parent relationships are represented in the node ancestry.
- Copies the generated GLB into the viewer's public model path, builds the production frontend and runs Playwright against the actual Blender output.
- Enforces a 1 MiB GLB asset-size budget.
- Uploads the .blend, .glb, manifest and inspection reports as a seven-day workflow artifact.

The latest successful end-to-end run generated 68 Blender objects (60 meshes and 8 assembly nodes) and exported 67 stable-ID GLB nodes. The 20 canonical content components all resolved to GLB nodes with the expected ancestry. The generated model loaded in the Three.js viewer, and the heatsink assembly could be selected through the cooling process layer.

The workflow runs on relevant branch pushes and can be started manually with GitHub Actions → **Blender blockout generation** → **Run workflow**.

This proves reproducible generation, structural integrity and browser integration. It does not prove that proxy geometry matches a physical card or that the model's appearance is correct. Owner review of the generated model and inspection report remains required.

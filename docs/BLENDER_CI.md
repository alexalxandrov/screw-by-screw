# Blender generation in CI

The repository includes a reproducible headless generation workflow for the v0.5 pilot model.

- Downloads the official Blender 4.3.2 Linux archive.
- Verifies the archive against Blender's published SHA-256 checksum.
- Runs the generator and text/JSON scene inspector.
- Validates the GLB 2.0 package and its manifest.
- Checks that all 22 canonical content component IDs exist exactly once in the GLB and that their parent relationships are represented in the node ancestry.
- Copies the generated GLB into the viewer's public model path, builds the production frontend and runs Playwright against the actual Blender output.
- Enforces a 1 MiB GLB asset-size budget.
- Uploads the .blend, .glb, manifest and inspection reports as a seven-day workflow artifact.

The latest successful end-to-end run generated 84 Blender objects (74 meshes and 10 assembly nodes) and exported 83 stable-ID GLB nodes. The 22 canonical content components all resolved to GLB nodes with the expected ancestry. The generated model loaded in the Three.js viewer, and the heatsink assembly could be selected through the cooling process layer.

The v0.5 scene adds a teardown-supported-but-not-measured heatpipe group and an unverified power-conversion proxy group. Their geometry is deliberately labelled as illustrative. The process viewer can animate fan rotation and directional particles, but the latter are not a CFD or electrical simulation.

The workflow runs on relevant branch pushes and can be started manually with GitHub Actions → **Blender blockout generation** → **Run workflow**.

This proves reproducible generation, structural integrity and browser integration. It does not prove that proxy geometry matches a physical card or that the model's appearance is correct. Owner review of the generated model and inspection report remains required.

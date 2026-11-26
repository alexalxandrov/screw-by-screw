# Blender generation in CI

The repository includes a reproducible headless generation workflow for the v0.5 pilot model.

- Downloads the official Blender 4.3.2 Linux archive.
- Verifies the archive against Blender's published SHA-256 checksum.
- Runs the generator and text/JSON scene inspector.
- Validates the GLB 2.0 package and its manifest.
- Checks canonical component identity and parent ancestry against the current 307-component semantic package, including logical-only assembly nodes.
- Copies the generated GLB into the viewer's public model path, builds the production frontend and runs Playwright against the actual Blender output.
- Enforces a 1 MiB GLB asset-size budget.
- Uploads the .blend, .glb, manifest and inspection reports as a seven-day workflow artifact.

The current end-to-end workflow generates the expanded component atlas, inspects the Blender scene, validates the GLB/manifest and portable `.sbsmodel`, then loads both generated assets in Chromium. It verifies canonical IDs and hierarchy, a real package import, the viewer interaction suite and accessibility checks. Object counts are not hard-coded here because the generator is expected to evolve with the evidence-backed component inventory.

The current scene contains six selectable heatpipe route proxies (four main GPU-contact plus two side), separate fan frames/hubs/impeller proxies, selectable fasteners, thermal-interface groups, six memory-package positions and power-stage candidate groups. Source-backed counts are kept separate from illustrative route geometry, package coordinates and unidentified electrical components. The process viewer can animate fan rotation and directional particles, but the latter are not a CFD or electrical simulation.

The workflow runs on relevant branch pushes and can be started manually with GitHub Actions → **Blender blockout generation** → **Run workflow**.

This proves reproducible generation, structural integrity and browser integration. It does not prove that proxy geometry matches a physical card or that the model's appearance is correct. Owner review of the generated model and inspection report remains required.


The v0.6 browser interaction slice additionally tests the fan/PCB/I/O/power/top/isometric camera presets, adjustable X/Y/Z clipping plane, powered fan rotation and reduced-motion behaviour. The section is an uncapped visual clipping operation; it does not invent section caps or imply CAD topology.


The GA106 compute layer exports 14 numbered logical TPC nodes, 28 logical SM nodes (two per TPC), one PolyMorph Engine per TPC and 112 individually selectable processing-partition nodes (four per SM). All are EMPTY hierarchy nodes; the GA102 illustration from NVIDIA's GA10x whitepaper is not transplanted as a physical GA106 die floorplan.


The PCB airflow cutout is a rounded-rectangle Boolean through-hole proxy (18 × 22 mm blockout). Its dimensions and centre are explicitly `illustrative`, not measured or taken from BoardView; the selection node exports the placeholder metadata and retains a stable component ID.

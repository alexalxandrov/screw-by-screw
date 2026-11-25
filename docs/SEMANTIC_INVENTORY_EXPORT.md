# Semantic inventory export

## Purpose

The viewer can export the currently loaded model package as an interoperable semantic inventory. The export is intended for research, review, spreadsheets and downstream tools; it does not replace the original .sbsmodel package.

## Formats

- **JSON** — one structured sbs-semantic-inventory document containing exact model identity/specifications, components, sources, claims, relationships, process layers, assembly evidence, learning data, animation metadata and release metadata.
- **CSV ZIP** — UTF-8 CSV tables for components, claims, relationships, sources, process layers, authored assembly steps, source observations, learning questions and animation clips. CSV uses semicolon delimiters and quotes fields as required. Component names and descriptions are split into RU/EN columns.

## Accuracy boundary

The export is semantic data only. It excludes GLB/3D geometry, CAD and BoardView. It is **not a BOM, procurement list or manufacturing definition**. Unknown values remain null/empty and evidence classes are preserved. Candidate or illustrative component records must not be interpreted as confirmed board population. Source observations remain separate from authored disassembly steps.

## Local-first behaviour

Both files are generated locally in the browser from the active model package. No upload, account, analytics endpoint or backend is involved. File names are derived from the loaded model ID and include the export format.

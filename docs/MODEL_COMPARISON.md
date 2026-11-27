# Exact model and revision comparison

## Purpose

Compare two validated .sbsmodel packages without replacing the active 3D scene or merging device facts. Model A is the package currently loaded in the atlas. Model B is selected locally from a second .sbsmodel file.

## Compared data

- Exact model identity: manufacturer, display name, manufacturer part number and package model ID.
- Geometry evidence class and recorded PCB revision, shown as metadata rather than promoted to a claim.
- Nested model specifications, compared by their field paths.
- Atomic claims, matched by stable subject and predicate. Model-level subjects are normalized to the model root; component claims are correlated only when their component IDs match.
- Component ID coverage, reported as the contents of the two packages rather than confirmed physical population.

Each side retains its own evidence class, source IDs, source labels, URLs and notes. Sources from one model are never attached to the other model's claims.

## Comparison statuses

A field is shown as same, different, unknown on one or both sides, or not recorded in one of the packages. Missing information is not treated as proof of physical absence. A claim on a component whose stable ID differs is left unpaired rather than guessed to describe the same physical part.

## Accuracy boundary

This is a semantic metadata comparison, not a hardware inspection. The viewer does not overlay geometry, compare CAD/BoardView, trace PCB routing, establish fitment, or infer a physical difference from a package inventory difference. Different exact SKUs and PCB revisions remain separate evidence domains.

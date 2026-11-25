# Package-authored animation runtime

## Purpose

The universal viewer plays authored motion clips from animations.json. A clip is a deterministic timeline targeting stable component IDs, not a general-purpose physics engine.

## Clip contract

Each clip contains a stable clip ID, localized title, duration_ms (maximum ten minutes), explicit evidence_status, optional registered source_ids when the clip is explicitly illustrative, optional clip-level easing (linear or ease_in_out), and one or more tracks.

Each track targets one stable component ID and one property: position, rotation, scale or visible. A target/property pair may appear only once in a clip. Vector values contain three finite numbers; visibility values are booleans. Keyframes use normalized time from 0 to 1, strictly increase, and must include both endpoints.

Documented motion requires registered source IDs. A clip with no source is allowed only when its evidence_status is explicitly illustrative or educational_approximation.

## Runtime controls

The viewer provides clip selection, play, pause, normalized seek, playback speed, completion state and stop/reset. Speed follows the existing animation speed control. Stop and clip switching restore the captured values for every targeted property. Model replacement disposes the player and its pending animation frame.

When no clips exist, the package animation panel is hidden. The viewer does not synthesize clips from viewer_effects; fan rotation, airflow particles, power pulses and exploded-view animations remain separate viewer-generated educational effects.

## Interactions and conflict policy

A package clip and an exploded-view transform both write component transforms. Starting a scene explode/reassemble action stops and restores any package clip first. Escape also stops the active clip. This prevents independent timelines from competing over the same object transform.

## Validation and evidence

The package validator checks clip IDs, titles, duration, easing, evidence status, source references, target component references, duplicate target/property tracks, property/value types and normalized keyframe order. The runtime snapshots original transforms and restores them on stop, clip switching or disposal.

The runtime does not infer fan RPM, physical mechanisms, removal order, airflow, thermal behavior or electrical waveforms. Those remain separate evidence and simulation concerns.

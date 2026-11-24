# MVP Specification

**Product:** Screw by Screw
**Pilot device:** EVGA GeForce RTX 3060 XC BLACK GAMING 12GB
**Part number:** 12G-P5-3655-KR
**Status:** pre-implementation specification

## Objective

Prove that one real hardware product can become a source-traceable interactive technical atlas. This is a vertical slice, not a broad catalog or a full engineering simulator.

## User outcome

A user opens the RTX 3060 model, understands its major assemblies, separates and inspects supported components, reads bilingual explanations, and follows verified relationships and learning prompts.

## In scope

### 3D viewer
- Load one optimized GLB.
- Orbit, zoom, pan, reset camera.
- Select/highlight a component.
- Isolate, hide/show, restore.
- Component tree navigation.
- Responsive desktop-first layout.

### Disassembly
- Global exploded-view control from 0 to 100 percent.
- Return to assembled state.
- Isolate/explode a supported subassembly.
- Step-by-step sequence only where teardown evidence supports order.
- No claim that arbitrary exploded animation is a real removal path.

### Component information
- Russian and English names.
- Category, parent assembly, function, location.
- Source-backed specifications where available.
- Provenance and confidence labels.
- Linked components and related concepts.
- Explicit unknown/not documented state.

### Learning
A small set of find-the-component and identify-the-function questions, using the same component IDs as the 3D scene.

### Process layers
Initial target: qualitative airflow/cooling explanation and simplified power-delivery map, provided sources support them. These are educational visualizations, not CFD or circuit simulation. Signal/data layer may be deferred if source coverage is insufficient.

## Out of scope

Multiple device models; user accounts/community publishing; full CMS; automatic CAD generation from photographs; physically accurate CFD, thermal FEA or SPICE; live hardware telemetry; repair instructions replacing service manuals; mobile-first authoring.

## Acceptance criteria

1. Exact product variant and part number are visible.
2. Every published asset has recorded source and permission status.
3. Every selectable scene component maps to a stable instance ID.
4. Component tree and 3D selection stay synchronized.
5. Exploded state is deterministic and reversible.
6. Components can be isolated and restored.
7. Cards work in RU and EN.
8. Claims show provenance and distinguish confirmed data from approximation.
9. Unsupported specifications are never shown as fact.
10. Scene loads in a current desktop browser without console errors.
11. Validation report records missing geometry, unmapped nodes, and unverified claims.

## Content completeness

First milestone: defensible hierarchy of the whole card and major assemblies. Modeling every resistor and screw is a later milestone dependent on BoardView/schematic/source access. Report geometric, semantic, claim, relationship, process-layer, and licensing coverage separately.

## Definition of done

Acceptance criteria pass, limitations are disclosed, and a second device can reuse the schema and viewer without changing core architecture.

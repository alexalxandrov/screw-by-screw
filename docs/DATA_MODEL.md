# Data Model

**Status:** initial schema proposal with a validated pilot content package
**Pilot:** EVGA GeForce RTX 3060 XC BLACK GAMING 12GB

## Principles

- Stable IDs are independent of filenames and Blender object names.
- A component definition is not the same as an instance in one card.
- Geometry nodes, technical claims, and sources are separate entities.
- Unknown values remain null/unknown, never guessed or replaced by zero.
- Every relationship has a type and may cite evidence.
- Localization is stored as fields, not duplicated records.

## Core entities

### DeviceModel
Identifies a marketed product variant. Fields: id, manufacturer, product_name, part_number, category, variant_notes, nullable revision, identity_sources, status. Pilot ID: gpu.evga.12g-p5-3655-kr.

### DeviceRelease
Versioned content release: id, device_model_id, version, status (draft/review/published/withdrawn), timestamps, manifest_hash, review_notes.

### ComponentDefinition
Reusable kind of part: id, category, names in RU/EN, aliases, descriptions in RU/EN, standard/part number, generic attributes. Examples: axial fan, fin-stack heatsink, GDDR6 package, power MOSFET, inductor, capacitor, screw.

### ComponentInstance
Specific occurrence in a device: id, device_model_id, definition_id, parent_instance_id, instance_name, reference_designator, quantity, geometry_node_ids, transform, visibility_defaults, evidence_status. Repeated memory packages and fasteners have distinct instance IDs.

### GeometryAsset and GeometryNode
Asset fields: id, device_model_id, format, path/URI, source_asset_id, SHA-256, units, coordinate_system, LOD, license_status, export_settings. Node fields: id, asset_id, node_name, component_instance_id, parent_node_id, original_transform, exploded_transform, bounds. Unmapped nodes must be explicitly decorative/structural.

### Relationship
Fields: id, from_instance_id, to_instance_id, type, directionality, description RU/EN, conditions, source_claim_ids. Initial types: contains, mounted_in, fastened_to, connected_to, powered_by, signals_to, cooled_by, transfers_heat_to, airflow_over, depends_on.

### Claim
Atomic factual statement: id, subject_id, predicate, value, unit, language, applicability, confidence_class, source_ids, review_status, reviewer_notes. Classes: manufacturer_data, measured, independently_verified, calculated, educational_approximation, illustrative, unknown.

### Source
Fields: id, title, publisher/author, URL, source_type, publication_date, retrieved_at, applicable_model, applicable_revision, locator (page/timecode/figure), file_hash, license_or_terms, attribution, redistribution_allowed, derivatives_allowed, notes.

### DisassemblyStep
Fields: id, device_model_id, sequence, action, target_instance_ids, prerequisite_step_ids, tool_requirements, safety_notes, source_ids, animation_state. Only author steps supported by teardown/manual or physically reviewed procedure.

### ProcessLayer
Fields: id, device_model_id, type, title and description RU/EN, visualization_asset, linked_instance_ids, quantitative_or_qualitative, assumptions, source_ids.

## Illustrative component tree

EVGA RTX 3060 XC BLACK → cooler assembly → fan A / fan B / heatsink; PCB assembly → GPU package / GDDR6 packages / power delivery / connectors; external housing and fasteners. This is not a confirmed inventory; actual hierarchy must be reconciled with exact SKU and evidence.

## Example JSON shape

    {
      "device_model": {
        "id": "gpu.evga.12g-p5-3655-kr",
        "manufacturer": "EVGA",
        "product_name": "GeForce RTX 3060 XC BLACK GAMING",
        "part_number": "12G-P5-3655-KR",
        "memory": {"capacity_gb": 12, "type": "GDDR6"}
      },
      "components": [], "relationships": [], "claims": [], "sources": []
    }

This is an illustrative shape, not a validated schema. Add formal JSON Schema after the first real component inventory.


## Implemented pilot package

The first structured content package is located at `content/models/evga-rtx3060-xc-black-12gb/`. It contains model identity/specifications, source register, bilingual component records, typed relationships, qualitative process layers, teardown observations, and source-backed learning questions. The package validator checks stable IDs and cross-file references. Assembly steps remain intentionally empty until the full teardown sequence is reviewed; six memory candidates and all proxy geometry remain explicitly unconfirmed.

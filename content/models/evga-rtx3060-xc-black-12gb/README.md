# EVGA RTX 3060 XC BLACK content package

**Exact SKU:** `12G-P5-3655-KR`  
**Status:** draft / educational proxy  
**Geometry:** `illustrative_proxy_not_cad`

This package separates device identity, component instances, relationships, process layers, source provenance, assembly observations and learning prompts.

## Validate

```bash
python tools/content/validate_model_package.py content/models/evga-rtx3060-xc-black-12gb
```

The validator checks bilingual component names, unique IDs, parent references, relationship endpoints, source references, process-layer links and quiz answer indices.

## Evidence rules

- Manufacturer specifications, reviewer observations, teardown evidence, illustrative geometry and unknowns remain separate evidence classes.
- The 201.8 mm length is a nominal published value; it is not treated as the maximum outer-shroud extent.
- Six memory package candidates are not a confirmed exact-board population.
- The 24 heatsink fins in the current model are illustrative proxies, not a measured fin count.
- Assembly steps remain intentionally empty until the teardown is reviewed in sufficient detail to support an actual sequence.
- No third-party images or video frames are redistributed in this package.

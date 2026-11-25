# Typed component relationship inspector

## Behaviour

Selecting a component displays every relationship where its stable ID appears as the source or target endpoint. Direction is preserved. The neighbour is a local navigation control that selects the other component in the 3D scene.

Relationship labels are localized for the known schema vocabulary (contains, mounted_in, fastened_to, connected_to, powered_by, signals_to, drives, cooled_by, transfers_heat_to, airflow_over and depends_on). Unknown types are shown as their original underscore-separated type rather than silently mapped to an unrelated meaning.

## Evidence

- Source links are resolved only through the package source register.
- Optional certainty metadata such as qualitative is shown next to the edge.
- Edges with no registered source are explicitly labelled as unsourced.
- A relationship is not treated as an additional physical measurement or CAD constraint.
- Plain GLB imports have no relationship data and therefore display no inferred graph.

## Data contract

The source model package stores relationships as directed edges with the fields id, from, to, type, source_ids, and optional certainty. Both endpoint IDs must be present in the model component inventory; the package validator enforces those references before the viewer loads the package.

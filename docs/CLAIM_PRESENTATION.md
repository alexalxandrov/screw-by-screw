# Source-backed claim presentation

## Behaviour

The component inspector renders only claims whose subject ID matches the selected component instance. When the top-level device assembly is selected, model-level claims keyed to the device model ID are also shown.

Each claim card contains:
- a readable predicate label;
- the value and unit, with null represented as Unknown / Неизвестно;
- the evidence class from the claim record;
- an editorial note when supplied;
- direct links to registered sources.

Boolean values are localized. Object values are displayed as compact key/value pairs. All imported text is assigned through DOM text nodes; model package strings are not interpreted as HTML.

## Accuracy policy

A claim is not promoted to fact merely because it is displayed. The evidence class stays visible and is taken from the package. A null value remains explicitly unknown. Claim source IDs are resolved against the package source register; missing sources are not replaced with guessed links. Geometry status and claim confidence remain separate concepts.

Generic GLB files have no claim sidecar and therefore receive no model-specific claims.

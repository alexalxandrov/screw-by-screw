# Assembly evidence and disassembly timeline

## Two different evidence types

The package distinguishes:

- **Authored steps:** a reviewed, source-backed sequence with stable step IDs, order, target component IDs, prerequisites, tool requirements, safety notes and source IDs.
- **Source observations:** timecodes, figure/page locators and editorial observations from teardown or reference sources. An observation is not automatically a removal instruction or a complete procedural step.

## Viewer behaviour

When the top-level device is selected, the inspector displays the assembly evidence panel. If no steps are authored, it states that no verified sequence exists and may show source observations separately. Each timecoded YouTube observation can link to its source at the recorded timestamp.

When a component is selected, only authored steps that target that component are shown. Target component buttons navigate to the corresponding 3D part. Steps are not animated as physical removal paths by this panel.

## Accuracy and safety

- Sparse video timecodes are not converted into a teardown sequence.
- A source observation does not establish screw count, tool size, torque, access order or safe service procedure.
- Actual steps require review of the complete exact-model teardown or service documentation.
- Every published step must cite at least one registered source.
- Unknown procedure details remain unpublished rather than inferred.

## Validation contract

A step requires a unique ID, unique positive sequence integer, readable action/title, one or more component IDs, and one or more source IDs. Prerequisite IDs must resolve within the same assembly-step package. Optional safety notes and tool requirements are rendered as authored content. Observation entries require a registered source, locator and note.

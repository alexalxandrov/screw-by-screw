# Assembly evidence and disassembly timeline

## Two different evidence types

The package distinguishes:

- **Authored steps:** a reviewed, source-backed sequence with stable step IDs, order, target component IDs, prerequisites, tool requirements, safety notes and source IDs.
- **Source observations:** timecodes, figure/page locators and editorial observations from teardown or reference sources. An observation is not automatically a removal instruction or a complete procedural step.

## Viewer behaviour

When the top-level device is selected, the inspector displays the assembly evidence panel, including package-authored procedure policy, branch groups and separately documented replacement fragments where present. If no steps are authored, it states that no verified sequence exists and may show source observations separately. Each timecoded YouTube observation can link to its source at the recorded timestamp.

When a component is selected, only authored steps that target that component are shown. Target component buttons navigate to the corresponding 3D part. Steps are not animated as physical removal paths by this panel.

## Accuracy and safety

- Sparse video timecodes are not converted into a teardown sequence.
- A source observation does not establish screw count, tool size, torque, access order or safe service procedure.
- Actual steps require review of the complete exact-model teardown or service documentation.
- Every published step must cite at least one registered source.
- Unknown procedure details remain unpublished rather than inferred.

## Validation contract

A step requires a unique ID, unique positive sequence integer, readable action/title, one or more component IDs, and one or more source IDs. Prerequisite IDs must resolve within the same assembly-step package. Optional safety notes and tool requirements are rendered as authored content. Observation entries require a registered source, locator and note.


## Localization

Observation notes accept either a plain string or an RU/EN object. The viewer selects the current language and falls back to the available translation. Localization changes presentation only; source locators, timestamps and evidence meaning remain unchanged.


## IBM Personal Computer 5150 (August 1981) — branching FRU graph

The IBM 5150 package uses 14 granular actions arranged in seven display groups. This is a dependency graph, not a universal linear teardown. The common opening sequence isolates mains power and removes the cover; after that, PSU, speaker and system-board FRU removal are independent branches. P1/P2, optional diskette leads and the speaker connector are modeled as shared preparation actions when their relevant FRU branch requires them.

The system-board branch records the IBM first-edition sequence: remove fitted adapters, disconnect P1/P2, disconnect fitted-drive leads if applicable, disconnect speaker connector P3, remove one board-retaining screw, slide the board about 1/2 inch away from the PSU until the standoffs clear their slots, then lift the board out. The branch does not require removing the PSU or removing the speaker assembly.

The Viewer displays the bilingual branch-scope note, group headings, prerequisites, target-component links and source links. Four replacement fragments (cover, adapter, PSU, system board) are displayed separately as source-bounded fragments, not a full reverse procedure. The manual does not provide a separately headed speaker replacement sequence.

Only IBM's explicit 1/2-inch slide distances are treated as manufacturer-stated motion. PSU lift/left offsets, speaker lift and board lift are educational approximations. See [IBM PC 5150 disassembly sequence](IBM_PC_5150_DISASSEMBLY_SEQUENCE.md).

## RTX 3060 XC BLACK pilot — current partial evidence

The `12G-P5-3655-KR` package currently records five **partial source observations** from the exact-model Gamers Nexus teardown: (1) four spring-loaded screws around the GPU cooler; (2) a separate pair retaining the fin-stack base; (3) two narrow I/O-bracket screws with reverse-side nuts and three display-output retaining screws (Phillips #0 is used for the latter); (4) disconnect both fan leads before separating the cooler; and (5) three screws retaining each independently replaceable fan. These observations are deliberately not converted into a complete removal/reassembly order.

Tom's Hardware separately reports an eight-screw cooler/shroud aggregate on a teardown sample whose rear-PCB identity photograph reads P/N `12G-P5-3655-KR`: four around the GPU and four near the far end. The overlap between that aggregate and the Gamers Nexus fastener groups is not established; the counts must not be added together or represented as a reconciled screw inventory. Only four GPU-area screws have photo-positioned mesh proxies; unmapped fasteners remain logical-only. Additional shroud screws remain an uncertain four-or-six candidate group. No torque, thread, screw length or complete service procedure is inferred.

The package marks the evidence as `partial_observed_sequence` and `complete_sequence: false`. It must not be treated as a full repair instruction or reassembly procedure.

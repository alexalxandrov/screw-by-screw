# MODELS

## Publication status

- **Published reference:** IBM Personal Computer 5150 (1981), system-unit scope. Primary IBM technical and service manuals support the model and its partial FRU branches.
- **Research archive, not published:** EVGA RTX 3060 XC BLACK (12G-P5-3655-KR). Its source package and geometry work are retained for future research, but the exact PCB revision and a complete reconciled screw/service sequence remain unverified. It is hidden from the public catalogue and not embedded in the standalone launcher.

A model may enter the public catalogue only after its hardware revision, source coverage, component inventory, fastener map and disassembly dependencies have passed evidence review.

Каталог контентных пакетов устройств Screw by Screw.

## Structure

- GPUS/ — видеокарты.
- COMPUTERS/ — персональные компьютеры и системные блоки.
- Внутри категории: производитель → конкретная модель/вариант.
- Каждый пакет хранит паспорт модели, компоненты, связи, источники, шаги разборки, process layers и экспортированную геометрию.
- Исходные и производные активы разделяются; в Git попадают только материалы, которые разрешено распространять.

## Reference models

| Category | Model | Package ID | State |
|---|---|---|---|
| GPU | EVGA GeForce RTX 3060 XC BLACK GAMING 12GB, 12G-P5-3655-KR | `gpu.evga.12g-p5-3655-kr` | Research blockout; illustrative proxy, not CAD |
| Computer | IBM Personal Computer 5150 (1981), system unit only | `computer.ibm.5150.1981` | Launch-era reference; illustrative proxy, not CAD |

The IBM package contains 71 semantic components, 100 typed relationships, 21 source-linked claims and 6 registered sources. Its service graph contains 14 granular actions in seven groups plus four partial replacement fragments. Its external envelope is referenced to one FAU museum specimen; its board layout follows relative zones in IBM Fig. 4, without claiming measured component coordinates. The first-edition IBM service manual specifies one system-board mounting screw, but not the number or coordinates of its standoffs; four visible support markers are illustrative. A different, revision-unmatched specimen reports two screws and four standoffs and is not used as the launch baseline. See the [fastener evidence audit](../docs/IBM_PC_5150_FASTENER_EVIDENCE.md), [branching disassembly sequence](../docs/IBM_PC_5150_DISASSEMBLY_SEQUENCE.md). The package is scoped to the August 1981 launch-era system unit. It excludes the display, keyboard, printer, external cassette recorder, optional adapter cards, later 5150 board revisions, and the IBM PC/XT 5160. See [IBM 5150 model notes](COMPUTERS/IBM/5150/README.md), [source register](COMPUTERS/IBM/5150/00-SOURCES/REFERENCE_REGISTER.md), and [atlas implementation specification](../docs/IBM_PC_5150_ATLAS_SPEC.md).

## Standards

- Идентификатор модели закрепляется за точным SKU/вариантом.
- Не смешивать аппаратные ревизии и близкие SKU.
- Геометрия и сервисные процедуры должны иметь явный статус доказательности; учебный proxy нельзя называть CAD.
- Не коммитить сторонние CAD, BoardView, схемы, фотографии и видео без проверки прав.
- Для отсутствующих материалов указывать not_found или not_verified, а не создавать фиктивные файлы.

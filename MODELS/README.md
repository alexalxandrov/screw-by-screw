# MODELS

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

The IBM package is scoped to the August 1981 launch-era system unit. It excludes the display, keyboard, printer, external cassette recorder, optional adapter cards, later 5150 board revisions, and the IBM PC/XT 5160. See [IBM 5150 model notes](COMPUTERS/IBM/5150/README.md), [source register](COMPUTERS/IBM/5150/00-SOURCES/REFERENCE_REGISTER.md), and [atlas implementation specification](../docs/IBM_PC_5150_ATLAS_SPEC.md).

## Standards

- Идентификатор модели закрепляется за точным SKU/вариантом.
- Не смешивать аппаратные ревизии и близкие SKU.
- Геометрия и сервисные процедуры должны иметь явный статус доказательности; учебный proxy нельзя называть CAD.
- Не коммитить сторонние CAD, BoardView, схемы, фотографии и видео без проверки прав.
- Для отсутствующих материалов указывать not_found или not_verified, а не создавать фиктивные файлы.

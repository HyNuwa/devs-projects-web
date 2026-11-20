## MODIFIED Requirements

### Requirement: Browsing steps
The product SHALL offer public pages for each step: Universidades (`/universidades`), a universidad (`/universidades/<uni>`) with its facultades, a facultad (`/universidades/<uni>/<facultad>`) with its published carreras, and a carrera (`/universidades/<uni>/<facultad>/<carrera>`) with its materias grouped by año and, within each año, anuales first and then by cuatrimestre, followed by an «Optativas» section with its optativas by name when it has any. Every materia SHALL link to its materia page. Each segment SHALL be the lowercase short name of the universidad or facultad, or the carrera's code. Every step SHALL be shown even when a level has a single entry. `/materias` SHALL redirect to `/universidades`. A segment that is an old slug of a renamed universidad, facultad or carrera SHALL redirect permanently to the current address, and `/materias/<code>` with an old materia code SHALL redirect the same way. An unknown segment, and a carrera en borrador, SHALL show the not-found page.

#### Scenario: Student walks to a materia
- **WHEN** a visitor opens `/universidades`, chooses UNJU, then Facultad de Ingeniería, then Ingeniería Informática
- **THEN** each step opens its own URL, and the carrera page lists «Introducción a la Programación» under 1.º año, 1.º cuatrimestre, linking to its materia page

#### Scenario: Only one universidad has carreras
- **WHEN** a visitor opens «Materias» from the menu
- **THEN** they land on Universidades and choose the universidad themselves; nothing skips a step

#### Scenario: Old address
- **WHEN** someone opens `/materias`
- **THEN** they are redirected to `/universidades`

#### Scenario: Unknown facultad
- **WHEN** someone opens `/universidades/unju/xyz`
- **THEN** the not-found page is shown

#### Scenario: Renamed facultad
- **WHEN** someone opens `/universidades/unsa/fcex` after the facultad was renamed «FCE»
- **THEN** they are redirected permanently to `/universidades/unsa/fce`

#### Scenario: Carrera en borrador
- **WHEN** someone opens the address of a carrera en borrador
- **THEN** the not-found page is shown

#### Scenario: Materias anuales
- **WHEN** a carrera has «Anatomía» anual and «Química» 1.º cuatrimestre in 1.º año
- **THEN** the carrera page lists «Anatomía» first under 1.º año, marked anual, and «Química» under 1.º cuatrimestre

#### Scenario: Optativas
- **WHEN** a carrera of five años lists «Robótica» and «Inteligencia Artificial» as optativas
- **THEN** the carrera page shows them by name under «Optativas», after 5.º año, each linking to its materia page

### Requirement: Order and counts on the cards
Universidades SHALL be ordered with the viewer's ubicación first and the rest by name. Facultades SHALL be ordered with those that have carreras first, then by name, and carreras by name. Cards SHALL show only counts computed from loaded data: a universidad's facultades and published materials, a facultad's carreras and published materials, a carrera's materias, años and créditos, where optativas count as materias but not towards años or créditos. They SHALL NOT show a number of students, nor marks that need measurements the product does not take, like «Más consultada».

#### Scenario: Facultad card
- **WHEN** a visitor opens the UNJU page
- **THEN** the Facultad de Ingeniería card shows its number of carreras and of published materials, and no number of students

#### Scenario: Carrera card with optativas
- **WHEN** a carrera has 40 materias in 5 años and 6 optativas
- **THEN** its card shows 46 materias and 5 años, and its créditos add up only the 40 materias with an año

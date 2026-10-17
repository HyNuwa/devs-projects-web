## MODIFIED Requirements

### Requirement: Browsing steps
The product SHALL offer public pages for each step: Universidades (`/universidades`), a universidad (`/universidades/<uni>`) with its facultades, a facultad (`/universidades/<uni>/<facultad>`) with its published carreras, and a carrera (`/universidades/<uni>/<facultad>/<carrera>`) with its materias grouped by año and, within each año, anuales first and then by cuatrimestre. Every materia SHALL link to its materia page. Each segment SHALL be the lowercase short name of the universidad or facultad, or the carrera's code. Every step SHALL be shown even when a level has a single entry. `/materias` SHALL redirect to `/universidades`. A segment that is an old slug of a renamed universidad, facultad or carrera SHALL redirect permanently to the current address, and `/materias/<code>` with an old materia code SHALL redirect the same way. An unknown segment, and a carrera en borrador, SHALL show the not-found page.

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

### Requirement: Honest empty states
A universidad or facultad without published carreras, and a carrera without materias, SHALL show its page with a message that its content is not loaded yet, such as «Todavía no cargamos sus carreras». A facultad without published carreras SHALL offer «Pedí tu carrera», which opens the solicitud de carrera form with that facultad chosen. The pages SHALL NOT show placeholder institutions that do not exist in the catalog, «Próximamente» labels, notification sign-ups or actions that lead nowhere. The Universidades page SHALL end with «¿No está la tuya?», linking to the solicitud de carrera form.

#### Scenario: Preloaded facultad without carreras
- **WHEN** a visitor opens a facultad of the UNC that has no carreras yet
- **THEN** the page names the facultad, says its carreras are not loaded yet, and offers «Pedí tu carrera»

#### Scenario: Universidad missing
- **WHEN** a visitor reaches the end of the Universidades page
- **THEN** «¿No está la tuya?» links to the solicitud de carrera form

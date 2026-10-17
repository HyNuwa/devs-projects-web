# academic-structure/browsing Specification

## Purpose

Let anyone find their materia by walking universidad → facultad → carrera, so a student from any loaded universidad finds their place, and let the viewer's ubicación decide where search and rankings start.

## Requirements

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

### Requirement: Honest empty states
A universidad or facultad without published carreras, and a carrera without materias, SHALL show its page with a message that its content is not loaded yet, such as «Todavía no cargamos sus carreras». A facultad without published carreras SHALL offer «Pedí tu carrera», which opens the solicitud de carrera form with that facultad chosen. The pages SHALL NOT show placeholder institutions that do not exist in the catalog, «Próximamente» labels, notification sign-ups or actions that lead nowhere. The Universidades page SHALL end with «¿No está la tuya?», linking to the solicitud de carrera form.

#### Scenario: Preloaded facultad without carreras
- **WHEN** a visitor opens a facultad of the UNC that has no carreras yet
- **THEN** the page names the facultad, says its carreras are not loaded yet, and offers «Pedí tu carrera»

#### Scenario: Universidad missing
- **WHEN** a visitor reaches the end of the Universidades page
- **THEN** «¿No está la tuya?» links to the solicitud de carrera form

### Requirement: Official plan link on the carrera page
When a carrera has a link to its official plan, the carrera page SHALL show it as «Plan oficial ↗», opening the university's page in a new tab. The pages SHALL NOT mention plan names, plan versions or a plan selector.

#### Scenario: Carrera with a plan link
- **WHEN** a visitor opens Ingeniería Informática, which has an official plan link
- **THEN** the page shows «Plan oficial ↗» pointing to that link, and no plan name or selector

### Requirement: «Tu carrera» shortcut
On the Universidades page, a signed-in student who declared a carrera as cursando SHALL see a shortcut to that carrera's page. With several carreras cursando, it SHALL show the one declared first. Students without one, and visitors, SHALL NOT see it.

#### Scenario: Student with a carrera
- **WHEN** a student cursando Ingeniería Informática opens `/universidades`
- **THEN** the page offers «Tu carrera: Ingeniería Informática →» linking to its page

### Requirement: Materia breadcrumb
The materia page SHALL show the trail Universidades › universidad › facultad › carrera › materia, every segment but the last being a link. The carrera SHALL be the one the viewer came from when the link named it, else the first carrera the viewer declared that includes the materia, else the first such carrera by name.

#### Scenario: Coming from a carrera page
- **WHEN** a visitor opens a materia shared by Informática and Industrial from the Industrial page
- **THEN** the trail shows Ingeniería Industrial, and its segment links back to that page

#### Scenario: Direct link without a carrera
- **WHEN** a visitor without a session opens the same materia from a shared link that names no carrera
- **THEN** the trail shows the first carrera by name that includes it

### Requirement: Ubicación
The header SHALL show the viewer's ubicación as universidad and facultad short names. For a signed-in student it SHALL be the facultad of the carrera they declared first as cursando, unless they chose another on this device. For anyone else it SHALL be the facultad chosen on this device, and before a choice it SHALL invite them to choose one. Activating it SHALL offer a link to the facultad's page and a universidad and facultad selector; the choice SHALL be remembered on the device only, and SHALL never be sent to the server as part of the account. The ubicación SHALL NOT hide or filter any content by itself.

#### Scenario: Signed-in student
- **WHEN** a student cursando Ingeniería Informática at FI-UNJU opens any page
- **THEN** the header shows «UNJU · FI»

#### Scenario: Visitor chooses
- **WHEN** a visitor without a session chooses UNSa and a facultad in the selector and comes back the next day on the same device
- **THEN** the header shows that choice

#### Scenario: Visitor before choosing
- **WHEN** a visitor who never chose opens the site
- **THEN** the header invites them to choose their facultad and nothing on the page is filtered

### Requirement: Search and rankings start at the ubicación
When the viewer has an ubicación, search SHALL start limited to materials of that facultad, saying so, and SHALL offer «en todas» to search everywhere; the choice SHALL be part of the shareable search URL. `/ranking` SHALL start at the ubicación as described in reputation/rankings. The Experiencias landing (`/experiencias`) SHALL start at the ubicación's facultad, name it, and let the viewer narrow within it by carrera, año and type or change the ubicación from the page (see academic-community/experiences); the facultad SHALL NOT be part of its URL. Without an ubicación, search SHALL cover every facultad and the Experiencias landing SHALL show every facultad and invite the viewer to choose one.

#### Scenario: Searching from FI-UNJU
- **WHEN** a student with ubicación FI-UNJU searches «parcial»
- **THEN** results come from FI-UNJU materias, the page says «en FI · UNJU», and choosing «en todas» widens the results

#### Scenario: Shared search link
- **WHEN** a student shares a search made «en todas» and a visitor with another ubicación opens it
- **THEN** the visitor sees the same results «en todas»

#### Scenario: Experiencias landing from FI-UNJU
- **WHEN** a student with ubicación FI-UNJU opens `/experiencias`
- **THEN** the page names «Universidad Nacional de Jujuy · Facultad de Ingeniería», its sections consider that facultad, and «Cambiar» opens the ubicación selector

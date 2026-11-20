## MODIFIED Requirements

### Requirement: Primary menu destinations
The shell SHALL offer exactly the primary destinations that exist in the product, in this order: Inicio (`/`), Materias (`/universidades`) and Experiencias (`/resenas`). Destinations without a working page SHALL NOT appear in the menu.

#### Scenario: Visitor views the desktop header
- **WHEN** anyone views a page at the desktop breakpoint or wider
- **THEN** the header shows the DevsProject logo linking to `/`, the menu Inicio · Materias · Experiencias, a search control, the `Subir material` action and the viewer's ubicación (see academic-structure/browsing) in place of a fixed UNJU/FI mark

#### Scenario: Unbuilt destinations are hidden
- **WHEN** the header or bottom bar renders
- **THEN** no Eventos or Clasificados link is shown

### Requirement: Current destination is identified
The shell SHALL mark at most one primary destination as current, using `aria-current="page"` and a visual cue that does not rely on color alone. When several destinations match a route, the most specific match SHALL win.

#### Scenario: Home
- **WHEN** the route is `/`
- **THEN** Inicio is the current destination

#### Scenario: Materias and resource hierarchy
- **WHEN** the route is `/universidades`, any nested `/universidades/...` route, `/materias/<codigo>` or `/materiales/<id>`
- **THEN** Materias is the current destination

#### Scenario: Experiences
- **WHEN** the route is under `/resenas`, under `/finales`, or is `/materias/<codigo>/resenar` or `/materias/<codigo>/final`
- **THEN** Experiencias is the current destination, not Materias

#### Scenario: Upload
- **WHEN** the route is `/materiales/nuevo`
- **THEN** the bottom bar's Subir item is current and no desktop menu link is current

#### Scenario: Route outside the menu
- **WHEN** the route is `/buscar`, under `/profile`, `/admin`, `/foro`, `/profesores` or `/ranking`
- **THEN** no primary destination is marked current

### Requirement: Mobile header and bottom bar
Below the desktop breakpoint (1024px) the shell SHALL replace the desktop header with a compact header (logo, ubicación, search control, account affordance) and SHALL show a bottom bar fixed to the viewport with Inicio · Materias · Subir · Experiencias. The compact header SHALL show at least the ubicación's facultad short name. Subir SHALL link to `/materiales/nuevo` and be visually emphasized. The bar SHALL respect the device's bottom safe area, and page content SHALL NOT be hidden behind it. The shell SHALL NOT offer a separate hamburger menu.

#### Scenario: Narrow viewport
- **WHEN** a user views a page at 390px wide
- **THEN** the compact header with the ubicación and the bottom bar are visible, the desktop menu links are not, there is no hamburger control, and nothing overflows horizontally

#### Scenario: Scrolling to the end of a page
- **WHEN** a user scrolls to the bottom of a page on a narrow viewport
- **THEN** the last content and the footer are fully visible above the bottom bar

#### Scenario: Desktop viewport
- **WHEN** a user views a page at 1024px wide or more
- **THEN** the bottom bar is not rendered visibly and the desktop header is shown

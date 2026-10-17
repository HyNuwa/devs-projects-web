## MODIFIED Requirements

### Requirement: Primary menu destinations
The shell SHALL offer exactly the primary destinations that exist in the product, in this order: Inicio (`/`), Materias (`/universidades`) and Experiencias (`/experiencias`). Destinations without a working page SHALL NOT appear in the menu.

#### Scenario: Visitor views the desktop header
- **WHEN** anyone views a page at the desktop breakpoint or wider
- **THEN** the header shows the DevsProject logo linking to `/`, the menu Inicio · Materias · Experiencias, a search control, the `Subir material` action and the viewer's ubicación (see academic-structure/browsing) in place of a fixed UNJU/FI mark

#### Scenario: Experiencias leads to the landing
- **WHEN** anyone activates Experiencias in the header, the bottom bar or the footer
- **THEN** the browser opens `/experiencias`

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
- **WHEN** the route is `/experiencias`, under `/experiencias/...`, under `/resenas`, under `/finales`, or is `/materias/<codigo>/resenar` or `/materias/<codigo>/final`
- **THEN** Experiencias is the current destination, not Materias

#### Scenario: Upload
- **WHEN** the route is `/materiales/nuevo`
- **THEN** the bottom bar's Subir item is current and no desktop menu link is current

#### Scenario: Route outside the menu
- **WHEN** the route is `/buscar`, under `/profile`, `/admin`, `/foro`, `/profesores` or `/ranking`
- **THEN** no primary destination is marked current

### Requirement: Shell variants for access and focus screens
Access routes (`/auth/**`) SHALL use a reduced header with the logo and a single link to the complementary access action (`Crear cuenta` on sign-in screens, `Ingresar` on registration), with no primary menu, bottom bar or footer. Focus screens (`/materiales/nuevo`, `/materias/<codigo>/resenar`, `/materias/<codigo>/final`, `/experiencias/escribir`) SHALL keep the header but SHALL NOT show the bottom bar.

#### Scenario: Sign-in screen
- **WHEN** a visitor opens `/auth/login`
- **THEN** the page shows the reduced header with a `Crear cuenta` link and no primary menu, bottom bar or footer

#### Scenario: Registration screen
- **WHEN** a visitor opens `/auth/register`
- **THEN** the reduced header offers `Ingresar` instead of `Crear cuenta`

#### Scenario: Writing a reseña on mobile
- **WHEN** a user opens `/materias/<codigo>/resenar` at 390px wide
- **THEN** the compact header is shown and the bottom bar is not

#### Scenario: Choosing what to write on mobile
- **WHEN** a user opens `/experiencias/escribir` at 390px wide
- **THEN** the compact header is shown and the bottom bar is not

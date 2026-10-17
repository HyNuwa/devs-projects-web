## MODIFIED Requirements

### Requirement: Materia-scoped search
The materia page SHALL provide a search control scoped to that materia's materials, with the active query represented in the URL.

#### Scenario: User searches within a materia
- **WHEN** a user enters a query on a materia page
- **THEN** only approved public resources belonging to that materia are searched and the interface identifies the active scope

#### Scenario: Scoped query is shared
- **WHEN** another user opens the URL of a materia-scoped search
- **THEN** the same materia, resource type when present, and query are restored

### Requirement: Materia context names its facultad
Wherever a materia's academic context is presented, the system SHALL name the materia's facultad by its short name and universidad together with each carrera that includes it, with the año and cuatrimestre it has there, in a stable order by carrera name. It SHALL NOT name plans.

#### Scenario: Materia page header
- **WHEN** a user opens a materia page
- **THEN** each placement reads like «FI (UNJU) · Ingeniería Informática · Año 2 · Cuatrimestre 1»

#### Scenario: Materia in several plans
- **WHEN** a materia belongs to two carreras
- **THEN** the page shows one placement per carrera, ordered by carrera name

### Requirement: Filterable and shareable result state
The results experience SHALL support filters for facultad, resource type, materia, ciclo lectivo, and professor, and SHALL encode the active query, filters, and supported sort selection in the URL. The facultad filter SHALL start at the viewer's ubicación (see academic-structure/browsing) and offer «en todas».

#### Scenario: User applies filters
- **WHEN** a user applies one or more filters
- **THEN** active filters remain visible, the result set updates, and reloading or sharing the URL restores the same state

#### Scenario: User filters on a narrow viewport
- **WHEN** a user opens filters on a mobile viewport
- **THEN** the system uses a keyboard-operable drawer or bottom sheet that preserves visible labels and focus management

#### Scenario: Search limited to a facultad
- **WHEN** a user filters by FI-UNJU
- **THEN** only resources of FI-UNJU materias are listed, and the URL keeps the facultad

## REMOVED Requirements

### Requirement: Hierarchical materials browsing
**Reason**: Replaced by browsing by institution (academic-structure/browsing): the career-first `/materiales` browser duplicated it and could not show universidades or facultades without carreras.
**Migration**: `/materiales` and its nested addresses redirect to the equivalent universidad, facultad, carrera or materia page; the materia page lists its resources by type.

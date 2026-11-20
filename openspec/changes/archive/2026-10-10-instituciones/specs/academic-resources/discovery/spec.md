## MODIFIED Requirements

### Requirement: Hierarchical materials browsing
The public materials experience SHALL let users navigate from careers to curriculum years, from a year to its materias, from a materia to its resource categories, and from a category to its file list without requiring a search query. The first level SHALL group careers under their facultad and universidad; while only one facultad exists, the grouping MUST NOT add a separate browsing level or change existing URLs.

#### Scenario: User enters Materials
- **WHEN** a user opens `/materiales`
- **THEN** the system presents the available careers as the first browsing level, each group headed by its facultad and universidad

#### Scenario: Several facultades exist
- **WHEN** careers of more than one facultad exist and a user opens `/materiales`
- **THEN** each career appears once, under its own facultad, and facultades of the same universidad appear together

#### Scenario: User follows the academic hierarchy
- **WHEN** a user chooses a career, curriculum year, materia, and resource category in sequence
- **THEN** each selection opens a stable URL-backed level whose content is limited to that academic context

#### Scenario: A hierarchy level has no public content
- **WHEN** the selected career, year, materia, or resource category contains no approved public materials
- **THEN** the system preserves the selected context and explains the empty state without inventing child records

### Requirement: Comparison-first search results
The system SHALL provide a public `/buscar` experience that presents matching materias above compact resource comparison rows.

#### Scenario: Search returns a strong materia match
- **WHEN** a query strongly matches a materia
- **THEN** the page uses that materia's name, facultad and code as its primary heading context, omits the generic discovery hero and duplicate materia card, and provides an obvious action to search across all materias

#### Scenario: Search is not resolved to one materia
- **WHEN** a query has no single strong materia match
- **THEN** the results retain a concise generic discovery heading and present matching materias before resources

#### Scenario: Resource row is rendered
- **WHEN** a matching resource appears in results
- **THEN** its row exposes title, resource type, materia, known ciclo lectivo, professor and turno, helpfulness count, star aggregate, and an open-preview action without navigating to a standalone file page

#### Scenario: Optional academic context is missing
- **WHEN** a result lacks ciclo lectivo, professor, or turno
- **THEN** the missing value is shown as `No informado` and is not inferred from other records

## ADDED Requirements

### Requirement: Materia context names its facultad
Wherever a materia's academic context is presented (the materia page and its plan placements), the system SHALL name the materia's facultad by its short name and universidad together with the career, curriculum year and cuatrimestre, for every plan that includes the materia, in a stable order.

#### Scenario: Materia page header
- **WHEN** a user opens a materia page
- **THEN** each plan placement reads like «FI (UNJU) · Ingeniería Informática · Año 2 · Cuatrimestre 1»

#### Scenario: Materia in several plans
- **WHEN** a materia belongs to plans of two carreras
- **THEN** the page shows one placement per plan, ordered by carrera, plan and year

## Purpose

Enable students to find materias and compare relevant academic resources quickly while preserving enough academic context to make an informed choice.

## ADDED Requirements

### Requirement: Grouped discovery suggestions
The system SHALL provide bounded, accent-insensitive search suggestions grouped into matching materias first and matching academic resources second, with each result visibly identified by kind and every displayed item matching the current query.

#### Scenario: Query matches materias and resources
- **WHEN** a user enters a non-empty discovery query that matches both materias and resources
- **THEN** the system presents the materia group before the resource group and labels each group unambiguously

#### Scenario: Query has no matches
- **WHEN** a user enters a query with no matching materia or resource
- **THEN** the system presents a clear no-results message and preserves the query for revision

### Requirement: Hierarchical materials browsing
The public materials experience SHALL let users navigate from careers to curriculum years, from a year to its materias, from a materia to its resource categories, and from a category to its file list without requiring a search query.

#### Scenario: User enters Materials
- **WHEN** a user opens `/materiales`
- **THEN** the system presents the available careers as the first browsing level

#### Scenario: User follows the academic hierarchy
- **WHEN** a user chooses a career, curriculum year, materia, and resource category in sequence
- **THEN** each selection opens a stable URL-backed level whose content is limited to that academic context

#### Scenario: A hierarchy level has no public content
- **WHEN** the selected career, year, materia, or resource category contains no approved public materials
- **THEN** the system preserves the selected context and explains the empty state without inventing child records

### Requirement: Materia-scoped search
Every materia resource view SHALL provide a search control scoped to that materia, with the active query represented in the URL.

#### Scenario: User searches within a materia
- **WHEN** a user enters a query from a materia resource view
- **THEN** only approved public resources belonging to that materia are searched and the interface identifies the active scope

#### Scenario: Scoped query is shared
- **WHEN** another user opens the URL of a materia-scoped search
- **THEN** the same materia, resource category when present, and query are restored

### Requirement: Homepage discovery entry
The homepage SHALL prioritize an outcome-oriented promise and the primary discovery input before community or contribution content.

#### Scenario: First visit without a query
- **WHEN** a user opens the homepage
- **THEN** the primary search control and shortcuts for Parciales, Finales, Apuntes, and Resúmenes are available before supporting community sections

### Requirement: Comparison-first search results
The system SHALL provide a public `/buscar` experience that presents matching materias above compact resource comparison rows.

#### Scenario: Search returns a strong materia match
- **WHEN** a query strongly matches a materia
- **THEN** the page uses that materia's name, career, curriculum year, and code as its primary heading context, omits the generic discovery hero and duplicate materia card, and provides an obvious action to search across all materias

#### Scenario: Search is not resolved to one materia
- **WHEN** a query has no single strong materia match
- **THEN** the results retain a concise generic discovery heading and present matching materias before resources

#### Scenario: Resource row is rendered
- **WHEN** a matching resource appears in results
- **THEN** its row exposes title, resource type, materia, known ciclo lectivo, professor and turno, helpfulness count, star aggregate, and an open-preview action without navigating to a standalone file page

#### Scenario: Optional academic context is missing
- **WHEN** a result lacks ciclo lectivo, professor, or turno
- **THEN** the missing value is shown as `No informado` and is not inferred from other records

### Requirement: Filterable and shareable result state
The results experience SHALL support filters for resource type, materia, ciclo lectivo, and professor, and SHALL encode the active query, filters, and supported sort selection in the URL.

#### Scenario: User applies filters
- **WHEN** a user applies one or more filters
- **THEN** active filters remain visible, the result set updates, and reloading or sharing the URL restores the same state

#### Scenario: User filters on a narrow viewport
- **WHEN** a user opens filters on a mobile viewport
- **THEN** the system uses a keyboard-operable drawer or bottom sheet that preserves visible labels and focus management

### Requirement: Deterministic default ordering
The default resource ordering SHALL evaluate textual relevance first, followed by academic-context completeness, recency, helpfulness, and a stable identifier tie-breaker.

#### Scenario: Resources have different trust and context signals
- **WHEN** multiple resources have comparable textual relevance
- **THEN** the system orders them using the documented completeness, recency, helpfulness, and stable tie-breaking precedence while keeping star ratings visible for comparison without allowing a small rating sample to override that precedence

### Requirement: Public and resilient discovery
Searching, filtering, reading result metadata, opening previews, and downloading public resources SHALL NOT require authentication.

#### Scenario: Anonymous user searches
- **WHEN** an unauthenticated user searches for resources
- **THEN** the system returns the same public discovery data available to an authenticated user, excluding viewer-specific mutation state

#### Scenario: Discovery request fails
- **WHEN** a discovery request fails
- **THEN** the interface preserves the query and filters, explains the failure in plain language, and offers a retry action

#### Scenario: Filters produce no resources
- **WHEN** a valid query and filter combination returns no resources
- **THEN** the interface presents an empty state with actions to remove filters or revise the query

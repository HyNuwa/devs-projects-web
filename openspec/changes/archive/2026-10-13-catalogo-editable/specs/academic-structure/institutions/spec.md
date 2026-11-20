## MODIFIED Requirements

### Requirement: Institutional hierarchy
The system SHALL organize academic structure as universidad → facultad → carrera → materia. Every facultad MUST belong to exactly one universidad, every carrera to exactly one facultad, and every materia to exactly one facultad. A carrera's code MUST be unique within its facultad, and two universidades MAY each have a facultad with the same name. A materia's code, when it has one, MUST be unique across the whole system. Each carrera SHALL have exactly one internal arrangement of materias by año and cuatrimestre, where a materia's cuatrimestre is 1.º, 2.º or anual; the product SHALL NOT keep or show versions of it.

#### Scenario: Same facultad name in two universidades
- **WHEN** two universidades each have a «Facultad de Ingeniería»
- **THEN** the system treats them as two distinct facultades, each with its own carreras and materias

#### Scenario: Same carrera code in two facultades
- **WHEN** two facultades each have a carrera with the code `II`
- **THEN** both carreras exist and each is identified within its own facultad

#### Scenario: Repeated materia code
- **WHEN** an attempt is made to save a materia with a code another materia already has, in any facultad
- **THEN** the system rejects it and the existing materia keeps its code

#### Scenario: Second arrangement for a carrera
- **WHEN** an attempt is made to add a second arrangement of materias to a carrera that has one
- **THEN** the system rejects it

#### Scenario: Materia anual
- **WHEN** a carrera places «Anatomía» in 1.º año as anual
- **THEN** the carrera keeps it as anual, not as 1.º or 2.º cuatrimestre

### Requirement: Public institutional catalog
The system SHALL expose a public, read-only catalog of universidades, their facultades and their published carreras, ordered by name, without requiring sign-in. Each carrera SHALL include its link to the official plan when it has one. A carrera en borrador MUST NOT appear in it. Universidades, facultades, carreras and materias SHALL be creatable and editable only by ADMIN and SUPERADMIN, through the Catálogo tab described in academic-structure/catalog-editing.

#### Scenario: Visitor reads the catalog
- **WHEN** a visitor without a session requests the catalog
- **THEN** the system returns every universidad with its facultades and published carreras, including preloaded ones without carreras

#### Scenario: Carrera en borrador
- **WHEN** a facultad has a carrera en borrador and a published one
- **THEN** the catalog lists only the published one

#### Scenario: Admin looks for a way to add a facultad
- **WHEN** an admin opens the Catálogo tab of the panel
- **THEN** they can create, rename and delete universidades, facultades, carreras and materias there

#### Scenario: Student looks for a way to add a facultad
- **WHEN** a student without a staff role uses the product interface
- **THEN** no action exists to create, rename or delete a universidad, facultad, carrera or materia, only to ask for a carrera

## ADDED Requirements

### Requirement: Only published carreras are declarable
A student SHALL be able to declare only published carreras. A declaration of a carrera en borrador SHALL be refused as invalid.

#### Scenario: Declaring a carrera en borrador
- **WHEN** a student sends a declaration for a carrera en borrador by its id
- **THEN** the system refuses it and their declared carreras stay as they were

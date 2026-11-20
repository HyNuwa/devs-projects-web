# academic-structure/institutions Specification

## Purpose

Model the institutions DevsProject serves (universidad → facultad → carrera → plan → materia) so content and reputation can be grouped per facultad, and let each student declare the study plans they follow.

## Requirements

### Requirement: Institutional hierarchy
The system SHALL organize academic structure as universidad → facultad → carrera → materia. Every facultad MUST belong to exactly one universidad, every carrera to exactly one facultad, and every materia to exactly one facultad. A carrera's code MUST be unique within its facultad, and two universidades MAY each have a facultad with the same name. A materia's code, when it has one, MUST be unique across the whole system. Each carrera SHALL have exactly one internal arrangement of materias: each materia is either placed in an año and cuatrimestre, where the cuatrimestre is 1.º, 2.º or anual, or is an optativa with no año or cuatrimestre; the product SHALL NOT keep or show versions of it.

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

#### Scenario: Optativa
- **WHEN** a carrera lists «Robótica» as an optativa
- **THEN** the carrera keeps it with no año or cuatrimestre

#### Scenario: Optativa in one carrera, placed in another
- **WHEN** «Robótica» is an optativa of Ingeniería Informática and placed in 4.º año of Ingeniería Electrónica in the same facultad
- **THEN** both carreras keep their own arrangement and the materia keeps one set of content

### Requirement: Materias belong to one facultad
A carrera SHALL only include materias of its own facultad. A materia taught under the same name in two facultades MUST be two different materias with separate resources, reviews, exam experiences and professor links.

#### Scenario: Plan includes a materia of another facultad
- **WHEN** an attempt is made to add a materia of facultad A to a carrera in facultad B
- **THEN** the system rejects the change and the carrera keeps its previous materias

#### Scenario: Plans of the same facultad share a materia
- **WHEN** two carreras of the same facultad include the same materia
- **THEN** the materia is one record, shared by both carreras, and its content appears under both

### Requirement: Existing data starts at FI-UNJU
On adoption, the system SHALL place every existing carrera and materia under the facultad «Facultad de Ingeniería» (FI) of the universidad «Universidad Nacional de Jujuy» (UNJU), without deleting or altering any other academic, contribution or account data.

#### Scenario: Migration over existing data
- **WHEN** the migration runs on a database with carreras, plans, materias and contributions
- **THEN** each carrera and materia belongs to FI-UNJU afterwards, and every plan, materia, contribution and account is otherwise unchanged

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

### Requirement: Main universidades are preloaded
The catalog SHALL include, from this change on, these universidades with their facultades (or, for the UTN, its facultades regionales), each taken from an official source that is recorded: UNJU, UNSa, UNT, UNCA, UNSE, UBA, UNC, UNLP, UTN, UNR, UNCuyo, UNL and UNNE. Loading them SHALL NOT create carreras or materias for them, and SHALL NOT change the existing FI-UNJU carreras, materias, contributions or accounts.

#### Scenario: Catalog after the migration
- **WHEN** the migration runs on a database with FI-UNJU data
- **THEN** the catalog lists the 13 universidades with their facultades, FI-UNJU keeps its carreras and materias, and no other facultad has carreras

#### Scenario: Running it again
- **WHEN** the same data is applied to a database that already has some of those universidades
- **THEN** no universidad or facultad is duplicated

### Requirement: Official plan link
A carrera MAY have a link to its official plan on the universidad's website. The link SHALL be an `https` address. FI-UNJU's Ingeniería Informática SHALL have its link loaded.

#### Scenario: Link that is not https
- **WHEN** an attempt is made to save a carrera's plan link that is not an `https` address
- **THEN** the system rejects it

### Requirement: Students declare their carreras
A signed-in student SHALL be able to declare one or more carreras, chosen through universidad, facultad and carrera, and mark each as cursando, terminada or abandonada. A student MUST NOT declare the same carrera twice, and MAY declare carreras of different facultades. Only the student can read or change their declared carreras; the public profile, other students and the catalog MUST NOT reveal them. The single exception is moderation: a moderator reviewing an account sees one carrera label with its facultad, taken from a carrera cursando or else a finished one, and never the full list or the statuses. The student's facultades are derived from their declared carreras and never stored on the account directly. The interface SHALL NOT ask for or show a plan.

#### Scenario: Student declares a carrera
- **WHEN** a signed-in student chooses UNJU, Facultad de Ingeniería, Ingeniería Informática, and marks it cursando
- **THEN** the carrera appears in their «Mi carrera» section with status cursando, and they were never asked for a plan

#### Scenario: Declarations made before this change
- **WHEN** a student had declared a plan before this change
- **THEN** «Mi carrera» shows its carrera with the same status

#### Scenario: Student finishes one carrera and starts another
- **WHEN** a student marks one carrera terminada and adds a carrera of another facultad as cursando
- **THEN** both are kept with their statuses, and the student belongs to both facultades

#### Scenario: Duplicate carrera
- **WHEN** a student tries to declare a carrera they already declared
- **THEN** the system rejects the duplicate and keeps the existing entry and its status

#### Scenario: Student removes a carrera
- **WHEN** a student removes a declared carrera
- **THEN** it no longer counts for anything derived from their carreras, such as the carreras behind the Puente insignia

#### Scenario: Another user asks for someone's carreras
- **WHEN** a visitor or another student opens a student's public profile or the public profile API
- **THEN** the response contains none of that student's declared carreras

#### Scenario: Moderator reviews an account
- **WHEN** a moderator opens the file of a student with a carrera cursando and a finished one
- **THEN** the file shows only the carrera cursando with its facultad, like «Ingeniería Informática · FI (UNJU)»

#### Scenario: Unauthenticated change
- **WHEN** a request without a session tries to read or change declared carreras
- **THEN** the system rejects it with an authentication error

### Requirement: Only published carreras are declarable
A student SHALL be able to declare only published carreras. A declaration of a carrera en borrador SHALL be refused as invalid.

#### Scenario: Declaring a carrera en borrador
- **WHEN** a student sends a declaration for a carrera en borrador by its id
- **THEN** the system refuses it and their declared carreras stay as they were

# academic-structure/institutions Specification

## Purpose

Model the institutions DevsProject serves (universidad → facultad → carrera → plan → materia) so content and reputation can be grouped per facultad, and let each student declare the study plans they follow.

## Requirements

### Requirement: Institutional hierarchy
The system SHALL organize academic structure as universidad → facultad → carrera → plan de estudio → materia. Every facultad MUST belong to exactly one universidad, every carrera to exactly one facultad, and every materia to exactly one facultad. A carrera's code MUST be unique within its facultad, and two universidades MAY each have a facultad with the same name.

#### Scenario: Same facultad name in two universidades
- **WHEN** two universidades each have a «Facultad de Ingeniería»
- **THEN** the system treats them as two distinct facultades, each with its own carreras and materias

#### Scenario: Same carrera code in two facultades
- **WHEN** two facultades each have a carrera with the code `II`
- **THEN** both carreras exist and each is identified within its own facultad

### Requirement: Materias belong to one facultad
A plan de estudio SHALL only include materias of its own carrera's facultad. A materia taught under the same name in two facultades MUST be two different materias with separate resources, reviews, exam experiences and professor links.

#### Scenario: Plan includes a materia of another facultad
- **WHEN** an attempt is made to add a materia of facultad A to a plan of a carrera in facultad B
- **THEN** the system rejects the change and the plan keeps its previous materias

#### Scenario: Plans of the same facultad share a materia
- **WHEN** two carreras of the same facultad include the same materia in their plans
- **THEN** the materia is one record, shared by both plans, and its content appears under both carreras

### Requirement: Existing data starts at FI-UNJU
On adoption, the system SHALL place every existing carrera and materia under the facultad «Facultad de Ingeniería» (FI) of the universidad «Universidad Nacional de Jujuy» (UNJU), without deleting or altering any other academic, contribution or account data.

#### Scenario: Migration over existing data
- **WHEN** the migration runs on a database with carreras, plans, materias and contributions
- **THEN** each carrera and materia belongs to FI-UNJU afterwards, and every plan, materia, contribution and account is otherwise unchanged

### Requirement: Public institutional catalog
The system SHALL expose a public, read-only catalog of universidades, their facultades, their carreras and each carrera's plans, ordered by name, without requiring sign-in. Universidades and facultades MUST NOT be creatable or editable from the product interface.

#### Scenario: Visitor reads the catalog
- **WHEN** a visitor without a session requests the catalog
- **THEN** the system returns every universidad with its facultades, carreras and plans

#### Scenario: Admin looks for a way to add a facultad
- **WHEN** an admin uses the product interface
- **THEN** no action exists to create, rename or delete a universidad or facultad

### Requirement: Students declare their study plans
A signed-in student SHALL be able to declare one or more planes de estudio, chosen through universidad, facultad, carrera and plan, and mark each as activo, terminado or abandonado. A student MUST NOT declare the same plan twice, and MAY declare plans of different facultades. Only the student can read or change their declared plans; the public profile, other students and the catalog MUST NOT reveal them. The single exception is moderation: a moderator reviewing an account sees one carrera label with its facultad, taken from an active plan or else a finished one, and never the full list or the statuses. The student's facultades are derived from their declared plans and never stored on the account directly.

#### Scenario: Student declares a plan
- **WHEN** a signed-in student chooses UNJU, Facultad de Ingeniería, Ingeniería Informática, Plan 2023, and marks it activo
- **THEN** the plan appears in their «Mi carrera» section with status activo

#### Scenario: Student finishes one carrera and starts another
- **WHEN** a student marks one plan terminado and adds a plan of another facultad as activo
- **THEN** both plans are kept with their statuses, and the student belongs to both facultades

#### Scenario: Duplicate plan
- **WHEN** a student tries to declare a plan they already declared
- **THEN** the system rejects the duplicate and keeps the existing entry and its status

#### Scenario: Student removes a plan
- **WHEN** a student removes a declared plan
- **THEN** it no longer counts for anything derived from their plans, such as the carreras behind the Puente insignia

#### Scenario: Another user asks for someone's plans
- **WHEN** a visitor or another student opens a student's public profile or the public profile API
- **THEN** the response contains none of that student's declared plans

#### Scenario: Moderator reviews an account
- **WHEN** a moderator opens the file of a student with an active plan and a finished one
- **THEN** the file shows only the active plan's carrera with its facultad, like «Ingeniería Informática · FI (UNJU)»

#### Scenario: Unauthenticated change
- **WHEN** a request without a session tries to read or change declared plans
- **THEN** the system rejects it with an authentication error

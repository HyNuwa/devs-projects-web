# academic-structure/catalog-editing Specification

## Purpose

Let admins grow and fix the catálogo from the panel (universidades, facultades, carreras and materias) without migrations, keeping shared links working and every change on record.

## Requirements

### Requirement: Catálogo tab
The moderation panel SHALL have a «Catálogo» tab visible only to ADMIN and SUPERADMIN. It SHALL present the catálogo as a tree universidad → facultad → carrera, and within a carrera its materias grouped by año and cuatrimestre. Carreras en borrador SHALL be marked as such in the tree. A MODERATOR or USER SHALL NOT see the tab, and every catálogo write SHALL be refused for them with a permission error.

#### Scenario: Admin opens the tab
- **WHEN** an admin opens Catálogo and expands UNSa
- **THEN** they see its facultades, and expanding one shows its carreras, with those en borrador marked

#### Scenario: Moderator tries a catálogo write
- **WHEN** a MODERATOR sends a request to rename a facultad
- **THEN** the request is refused with a permission error and nothing changes

### Requirement: Creating and editing
An admin SHALL be able to:
- create a universidad (name, short name) and edit both;
- create a facultad in a universidad (name, short name) and edit both;
- create a carrera in a facultad (name, code, optional official plan link) and edit them;
- create a materia in a facultad (name, code) and edit both;
- add a materia of the carrera's facultad to a carrera with año, cuatrimestre (1.º, 2.º or anual) and optional créditos, change those, or remove it from the carrera.

Short names and codes SHALL be slug-safe (ASCII letters, digits and hyphens) and unique where the institutional hierarchy requires it, ignoring case. A new universidad or facultad SHALL be public at once. Removing a materia from a carrera SHALL NOT delete the materia, its content, or its place in other carreras.

#### Scenario: Fixing a proposed short name
- **WHEN** an admin changes the short name of UNSa's «Facultad de Ciencias Exactas» from «FCEx» to «FCE»
- **THEN** its page is at `/universidades/unsa/fce` and the header of a student located there shows «UNSa · FCE»

#### Scenario: Short name already used in the universidad
- **WHEN** an admin gives a UNSa facultad the short name «fi» while another UNSa facultad is «FI»
- **THEN** the change is refused and both facultades keep their names

#### Scenario: Removing a materia from one carrera
- **WHEN** an admin removes a materia shared by two carreras from one of them
- **THEN** the materia stays in the other carrera with all its materials, reseñas and experiencias

### Requirement: Carrera en borrador
A carrera SHALL be created en borrador. A carrera en borrador SHALL NOT appear in browsing, the public catálogo, search filters or the «Mi carrera» selector, and its page SHALL show the not-found page. An admin SHALL be able to publish it, and from then on edits SHALL apply at once. An admin SHALL be able to return a published carrera to borrador only if no student has declared it. The carrera that exists before this change SHALL be published.

#### Scenario: Loading a new carrera
- **WHEN** an admin creates Licenciatura en Física in UNSa's FCE and adds twelve materias
- **THEN** a visitor opening UNSa's FCE still sees «Todavía no cargamos sus carreras», and the carrera's URL shows the not-found page

#### Scenario: Publishing
- **WHEN** the admin publishes it
- **THEN** it appears in the facultad page and in the «Mi carrera» selector

#### Scenario: Unpublishing a declared carrera
- **WHEN** an admin tries to return Ingeniería Informática to borrador while students declared it
- **THEN** the request is refused and the carrera stays published

### Requirement: Old slugs keep working
When the short name of a universidad or facultad, or the code of a carrera or materia, changes, its previous slug SHALL remain as an alias, and a request for a page by the alias SHALL redirect permanently to the current address. When a new or renamed entity takes a slug that is an alias of another entity in the same place, the new one SHALL win and the alias SHALL be dropped; the editor SHALL warn which entity the alias was pointing to before confirming.

#### Scenario: Shared link after a rename
- **WHEN** a link to `/universidades/unsa/fcex/lf` was shared and the facultad was renamed to «FCE»
- **THEN** opening it redirects permanently to `/universidades/unsa/fce/lf`

#### Scenario: Old materia code
- **WHEN** a materia's code changes from `unsa-fce-algebra` to `unsa-fce-algebra-1`
- **THEN** `/materias/unsa-fce-algebra` redirects to `/materias/unsa-fce-algebra-1`

#### Scenario: Alias taken by a new facultad
- **WHEN** the alias `fi` points to a UNSa facultad renamed «FING», and an admin gives another UNSa facultad the short name «FI»
- **THEN** the editor warns that `fi` stops redirecting to FING, and after confirming `/universidades/unsa/fi` opens the new facultad

### Requirement: Deleting only what is empty
An admin SHALL be able to delete:
- a universidad without facultades;
- a facultad without carreras, materias or assigned moderators;
- a carrera no student has declared;
- a materia without materials, reseñas or experiencias (deleting it removes it from every carrera).

Any other deletion SHALL be refused, saying what blocks it. Nothing in the catálogo SHALL be hidden instead of deleted.

#### Scenario: Facultad with a moderator
- **WHEN** an admin tries to delete a facultad that a moderator covers
- **THEN** the request is refused, naming the assigned moderators as the reason

#### Scenario: Materia with materials
- **WHEN** an admin tries to delete a materia with published materials
- **THEN** the request is refused and the materia stays in its carreras

### Requirement: Generated materia codes
When an admin creates a materia, the system SHALL propose a code made of the universidad and facultad short names and the materia's name (for example `unsa-fce-algebra-lineal`), adding a number when it is taken, and the admin MAY change it before saving. A materia code SHALL be unique across the system, up to 60 characters. Existing codes SHALL stay as they are.

#### Scenario: Proposed code
- **WHEN** an admin creates «Álgebra Lineal» in UNSa's FCE
- **THEN** the proposed code is `unsa-fce-algebra-lineal`

#### Scenario: Code taken
- **WHEN** that code already exists
- **THEN** the proposal is `unsa-fce-algebra-lineal-2`

### Requirement: Carga masiva
Within a carrera, an admin SHALL be able to paste one line per materia in the form `año;cuatrimestre;nombre[;créditos]`, where cuatrimestre is 1, 2 or A (anual), up to 200 lines at once. Before anything is saved, a preview SHALL show each line as:
- reusing the materia of the facultad with the same name, ignoring case and accents;
- or creating a new materia with its proposed code;
- or invalid, with the reason.

The admin SHALL be able to change each row's choice and values, and confirming SHALL apply every valid row at once or none. It SHALL add the carrera's missing materias and update año, cuatrimestre and créditos of those already in it, and SHALL NOT remove any materia from the carrera.

#### Scenario: Preview with a shared materia
- **WHEN** an admin pastes `1;1;Análisis Matemático I` into a new carrera of a facultad that already has that materia
- **THEN** the preview marks the line as reusing it, and after confirming the materia appears in both carreras with the same content

#### Scenario: Invalid line
- **WHEN** a pasted line is `7;3;Física`
- **THEN** the preview marks it invalid with the reason, and confirming applies nothing until it is fixed or dropped

#### Scenario: Re-pasting a shorter list
- **WHEN** an admin pastes a list without a materia that the carrera already has
- **THEN** that materia stays in the carrera

### Requirement: Catálogo history
Every catálogo change SHALL be recorded in the moderation history with the actor, the entity, the values before and after, and the date: creation, edit, rename, publication, return to borrador, deletion, placement changes and each carga masiva. Only ADMIN and SUPERADMIN SHALL see these events.

#### Scenario: Rename on record
- **WHEN** an admin renames a facultad's short name
- **THEN** Historial shows the admin, the facultad, the old and new short names and the date, and a MODERATOR does not see the event

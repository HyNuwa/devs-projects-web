## MODIFIED Requirements

### Requirement: Creating and editing
An admin SHALL be able to:
- create a universidad (name, short name) and edit both;
- create a facultad in a universidad (name, short name) and edit both;
- create a carrera in a facultad (name, code, optional official plan link) and edit them;
- create a materia in a facultad (name, code) and edit both;
- add a materia of the carrera's facultad to a carrera with año, cuatrimestre (1.º, 2.º or anual) and optional créditos, or as an optativa with optional créditos, change those, or remove it from the carrera.

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

#### Scenario: Placing an optativa
- **WHEN** an admin adds «Robótica» to Ingeniería Informática as an optativa
- **THEN** it is in the carrera with no año or cuatrimestre, and moving it later to 4.º año, 2.º cuatrimestre keeps it in the carrera once

### Requirement: Carga masiva
Within a carrera, an admin SHALL be able to paste one line per materia in the form `año;cuatrimestre;nombre[;créditos]`, where cuatrimestre is 1, 2 or A (anual), or `O;;nombre[;créditos]` for an optativa, up to 200 lines at once. The text box MAY be filled by a lectura del plan. Before anything is saved, a preview SHALL show each line as:
- reusing the materia of the facultad with the same name, ignoring case and accents;
- or creating a new materia with its proposed code;
- or invalid, with the reason.

The admin SHALL be able to change each row's choice and values, and confirming SHALL apply every valid row at once or none. It SHALL add the carrera's missing materias and update año, cuatrimestre, optativa and créditos of those already in it, and SHALL NOT remove any materia from the carrera.

#### Scenario: Preview with a shared materia
- **WHEN** an admin pastes `1;1;Análisis Matemático I` into a new carrera of a facultad that already has that materia
- **THEN** the preview marks the line as reusing it, and after confirming the materia appears in both carreras with the same content

#### Scenario: Invalid line
- **WHEN** a pasted line is `7;3;Física`
- **THEN** the preview marks it invalid with the reason, and confirming applies nothing until it is fixed or dropped

#### Scenario: Re-pasting a shorter list
- **WHEN** an admin pastes a list without a materia that the carrera already has
- **THEN** that materia stays in the carrera

#### Scenario: Optativa line
- **WHEN** an admin pastes `O;;Robótica;6`
- **THEN** the preview shows it as an optativa with 6 créditos, and an optativa line with an año or cuatrimestre, such as `O;2;Robótica`, is invalid with the reason

### Requirement: Catálogo history
Every catálogo change SHALL be recorded in the moderation history with the actor, the entity, the values before and after, and the date: creation, edit, rename, publication, return to borrador, deletion, placement changes, each carga masiva and each lectura del plan. Only ADMIN and SUPERADMIN SHALL see these events.

#### Scenario: Rename on record
- **WHEN** an admin renames a facultad's short name
- **THEN** Historial shows the admin, the facultad, the old and new short names and the date, and a MODERATOR does not see the event

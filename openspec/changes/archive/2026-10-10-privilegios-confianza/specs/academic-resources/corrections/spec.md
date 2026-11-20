## Purpose

Let trusted students fix how someone else's material is classified (materia, tipo, ciclo lectivo or profesor), so it appears where people look for it. Its author decides first, and moderation decides only when the author does not answer.

## ADDED Requirements

### Requirement: Suggesting a correction
A student with the Sugerir correcciones privilege SHALL be able to suggest, on another student's published material, a new value for exactly one of these fields:
- materia, chosen from the materias of the material's facultad;
- tipo de recurso;
- ciclo lectivo;
- profesor, chosen from the professors linked to the material's materia.

A suggestion MAY carry a comment of at most 500 characters. The title, description and file SHALL never be correctable. The system SHALL reject a suggestion in any of these cases:
- on the student's own material;
- on a material that is not published;
- whose value equals the current one;
- for a field that already has an open suggestion on that material;
- from a student who already has 10 open suggestions.

#### Scenario: Wrong type
- **WHEN** a student with the privilege sees a parcial filed as a final and suggests «Parcial» as its tipo
- **THEN** an open suggestion is created and the material is unchanged until someone decides

#### Scenario: Second suggestion on the same field
- **WHEN** another student suggests a tipo for that material while the first suggestion is open
- **THEN** the system rejects it, and still accepts a suggestion for its ciclo lectivo

#### Scenario: Own material
- **WHEN** a student tries to suggest a correction on their own material
- **THEN** the system rejects it

### Requirement: The author decides first
For 7 days after a suggestion is made, only the material's author SHALL be able to decide it. The author decides from «Mis envíos», which SHALL list the open suggestions on their materials with the current value, the proposed value and the comment, but never who made them.
- Accepting SHALL apply the new value.
- Rejecting SHALL close the suggestion without any further step.

#### Scenario: Author accepts
- **WHEN** the author accepts a suggestion to move their material from «Final» to «Parcial»
- **THEN** the material becomes a parcial, the suggestion is accepted, and the student who suggested it earns 2 points

#### Scenario: Author rejects
- **WHEN** the author rejects a suggestion
- **THEN** it closes as rejected and never reaches moderation

#### Scenario: Who suggested it
- **WHEN** the author looks at a suggestion in «Mis envíos»
- **THEN** it does not say who made it

### Requirement: Moderation decides after 7 days
A suggestion still open 7 days after it was made SHALL leave «Mis envíos» and appear in the Correcciones tab of the moderation panel, oldest first. There, a moderator SHALL accept or reject it, seeing the material, both values and the comment. Only ADMIN and SUPERADMIN SHALL see who suggested it: a suggestion proves its author was in good standing on that date, so a MODERATOR who knows who suggested could rule people out as the authors of anonymous content just retired. A moderator SHALL NOT decide a suggestion on their own material or one they made.

#### Scenario: Author does not answer
- **WHEN** an author ignores a suggestion for 7 days
- **THEN** it appears in Correcciones, and the author can no longer decide it

#### Scenario: Who suggested it, in moderation
- **WHEN** a MODERATOR and an ADMIN open Correcciones
- **THEN** only the ADMIN sees who made each suggestion

#### Scenario: Moderator's own suggestion
- **WHEN** a moderator opens Correcciones
- **THEN** suggestions they made, and suggestions on their own materials, are not offered to them

### Requirement: Accepting applies the change as an edit
Accepting a suggestion SHALL change the material's field exactly as if its author had edited it, with the same validation. When a new materia is accepted and the material's profesor is not linked to it, the profesor SHALL be removed, because a profesor must teach the materia. That includes reverting and re-evaluating the pioneer bonus when the materia or tipo changes. The student who suggested it SHALL earn `CORRECTION_ACCEPTED`. If the change is no longer valid when accepted, such as a profesor not linked to the materia, the system SHALL reject the decision and leave the material unchanged.

#### Scenario: Materia corrected
- **WHEN** a suggestion moving a material from «Análisis I» to «Análisis II» is accepted
- **THEN** the material appears under «Análisis II», and its pioneer bonus is reverted and evaluated again with the new materia

#### Scenario: Materia corrected, profesor of the old materia
- **WHEN** a suggestion moving a material to «Análisis II» is accepted, and its profesor teaches only «Análisis I»
- **THEN** the material appears under «Análisis II» without a profesor

### Requirement: Suggestions close on their own
An open suggestion SHALL close without a decision in either of these cases:
- its field no longer holds the value it had when the suggestion was made, because the author or another accepted suggestion changed it;
- the material is retired or deleted.

A closed suggestion SHALL leave «Mis envíos» and Correcciones, and SHALL earn nothing.

#### Scenario: Author edits the field
- **WHEN** the author changes the material's tipo themselves while a tipo suggestion is open
- **THEN** the suggestion closes and appears nowhere for a decision

#### Scenario: Material retired
- **WHEN** moderation retires a material with an open suggestion
- **THEN** the suggestion closes

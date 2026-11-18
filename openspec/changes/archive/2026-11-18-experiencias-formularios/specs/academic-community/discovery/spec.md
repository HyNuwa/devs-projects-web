## MODIFIED Requirements

### Requirement: Course-review evidence is explicit
A newly published course review SHALL declare materia, ciclo lectivo, a one-to-five-star recommendation, one result from `Promoción`, `Regular`, or `Libre`, one cursada situation, and a narrative between 30 and 4,000 characters. It MAY declare one principal professor, a franja horaria, one difficulty from `Muy baja`, `Baja`, `Media`, `Alta`, or `Muy alta`, and, only when the result is `Promoción`, a nota de promoción as an integer from 1 to 10; it SHALL NOT collect cuatrimestre. A nota de promoción sent with any other result SHALL be refused, and changing the result away from `Promoción` in the form SHALL clear it.

#### Scenario: Student submits a complete review
- **WHEN** an authenticated student submits every required field within its allowed range
- **THEN** the system creates a new review and preserves all declared optional context without inferring omitted facts

#### Scenario: Student identifies recurrence
- **WHEN** an author selects their cursada situation
- **THEN** the accepted values are `Primera cursada`, `Primera recursada`, `Segunda o más recursadas`, and `Prefiero no responder`

#### Scenario: Professor is not in the catalog
- **WHEN** an author wants to identify a principal professor who is not selectable from the catalog
- **THEN** the system accepts one manually entered professor name instead of blocking publication

#### Scenario: Student declares a nota de promoción
- **WHEN** an author chooses `Promoción` and enters 8 in «¿Con qué nota promocionaste?»
- **THEN** the review stores the grade and presents its result as «Promoción · 8»

#### Scenario: Nota de promoción without Promoción
- **WHEN** a request declares a nota de promoción with the result `Regular` or `Libre`, or a nota outside 1 to 10
- **THEN** the system rejects it with field-specific guidance and preserves the entered values

#### Scenario: Review input is invalid
- **WHEN** the result is absent, the recommendation is outside one to five, the year is invalid, or the narrative is outside 30 to 4,000 characters
- **THEN** the system rejects publication with field-specific guidance and preserves the entered values

### Requirement: Final experiences represent independent attempts
The system SHALL allow an author to publish multiple final experiences for the same materia. A newly published experience SHALL declare materia, year, exam period, format, an outcome from `Aprobado`, `Desaprobado`, or `Prefiero no decir`, and one narrative between 30 and 4,000 characters. Preparation and topics MAY also be declared as the structured facts of the next requirement; advice stays in the narrative.

#### Scenario: Student publishes another attempt
- **WHEN** an author submits a valid experience for a later or repeated attempt at the same final
- **THEN** the system creates a separate record without replacing previous attempts

#### Scenario: Final narrative is invalid
- **WHEN** the submitted narrative is shorter than 30 or longer than 4,000 characters
- **THEN** the system rejects publication with field-specific guidance and preserves the entered values

#### Scenario: Outcome is missing
- **WHEN** a new experience is submitted without an outcome
- **THEN** the system rejects it with field-specific guidance and preserves the entered values

### Requirement: Optional final context remains semantically bounded
A new final experience SHALL declare an integer grade from zero to ten when its outcome is `Aprobado` or `Desaprobado`, and SHALL NOT accept a grade with `Prefiero no decir`; the grade SHALL NOT be used to infer or correct the outcome. It MAY declare:
- the examiner, one professor from the catalog or one manually written name;
- a dificultad de teoría and a dificultad de práctica, each an integer from 1 to 5, independent of each other;
- the profesores en la mesa as a count from 1 to 10;
- the tiempo del examen from 10 to 480 minutes, meaning the time given to solve a written exam or the length of the student's own oral exam, never the waiting time;
- the preparación as a lead time from 1 to 365 days and a time per day from 30 to 960 minutes, independent of each other;
- up to ten temas que tomaron, each 2 to 60 characters after collapsing whitespace, with duplicates that differ only in case or spacing kept once.

The form SHALL NOT ask for an exact exam date, a franja horaria or a verbal difficulty. Older experiences that carry those facts SHALL keep and present them, and editing SHALL NOT clear them.

#### Scenario: Student supplies outcome and grade
- **WHEN** an author declares `Aprobado` or `Desaprobado` with a grade from zero to ten
- **THEN** the system stores and presents both facts exactly as declared

#### Scenario: Grade lacks an explicit outcome
- **WHEN** an author declares `Aprobado` or `Desaprobado` without a grade, or sends a grade with `Prefiero no decir`
- **THEN** the system rejects it with field-specific guidance, without inferring an outcome or a grade

#### Scenario: Student declares the mesa and the preparation
- **WHEN** an author declares 3 profesores en la mesa, 180 minutes, a lead time of 21 days and 60 minutes per day
- **THEN** the experience presents «Mesa de 3 profesores · 3 horas» and «Preparación: 3 semanas, 1 h por día», with «Unas 21 horas de estudio en total» as an estimate

#### Scenario: Only one preparation fact
- **WHEN** an author declares the lead time but not the time per day
- **THEN** the experience presents the lead time alone and no total

#### Scenario: Repeated topics
- **WHEN** an author enters «Integrales dobles», «integrales  dobles» and «Teorema de Green»
- **THEN** the experience keeps «Integrales dobles» and «Teorema de Green»

#### Scenario: Out-of-range context
- **WHEN** a request declares eleven topics, a topic of one character, 0 profesores, 5 minutes, a dificultad of 6 or a lead time of 400 days
- **THEN** the system rejects it with field-specific guidance and preserves the entered values

#### Scenario: Student omits optional final context
- **WHEN** an experience has no examiner, dificultad, mesa, tiempo, preparación or temas
- **THEN** the system accepts the experience and omits those facts from its public presentation

#### Scenario: Older final with a date and a verbal difficulty
- **WHEN** an author edits an older experience that declared an exam date, a franja and a verbal difficulty
- **THEN** the form does not ask for them, saving keeps them, and the detail still presents them

### Requirement: Community summaries lead to shareable details
Aggregate lists, the Experiencias landing and the materia page SHALL present every entry with the experiencia card of academic-community/experiences: a bounded narrative excerpt, compact academic facts, and one explicit `Leer completa` action. Full entries SHALL be available at `/resenas/:id` and `/finales/:id`, with a visible link back to their materia context. A final's detail SHALL present every declared fact, including the mesa, tiempo, preparación and temas que tomaron; the card SHALL NOT list the temas.

#### Scenario: Course-review card is rendered
- **WHEN** a visible course review is summarized
- **THEN** the card shows its stars without a long visible rating label, exposes an accessible recommendation name, presents known year/result/nota de promoción/difficulty/cursada/professor context, and bounds the narrative preview

#### Scenario: Final-experience card is rendered
- **WHEN** a visible final experience is summarized
- **THEN** the card presents known exam facts and a bounded narrative excerpt without fabricating missing examiner, outcome, grade, date, or difficulty data

#### Scenario: User opens full community content
- **WHEN** a user activates `Leer completa`
- **THEN** the corresponding shareable detail route presents the complete source record and its canonical materia link

#### Scenario: Final detail with every fact
- **WHEN** a user opens a final that declared mesa, tiempo, preparación and three temas
- **THEN** the detail shows «Mesa de 3 profesores · 3 horas», the preparación with its estimated total, «Teoría 4/5 · Práctica 3/5» and the three temas as chips

### Requirement: Authors control their published entries
An author SHALL be able to edit or permanently delete their own review or final experience. An entry whose authored content has changed after publication SHALL display `Editada · <fecha>` using its last edit date. Saving an edit SHALL require the fields a new entry requires; when an older entry lacks one, the edit form SHALL say which fact is missing and ask for it, and the stored entry SHALL NOT receive invented values.

#### Scenario: Author edits an entry
- **WHEN** the authenticated owner submits a valid edit
- **THEN** the system updates that entry, preserves its identity and creation date, and publicly displays its last edit date

#### Scenario: Author edits an older final without outcome
- **WHEN** the owner opens the edit form of a final that never declared an outcome
- **THEN** the form marks the outcome as missing and does not save until an outcome, and a grade when required, are declared

#### Scenario: Author deletes an entry
- **WHEN** the authenticated owner confirms permanent deletion
- **THEN** the system deletes the entry and removes it from discovery, detail access, materia views, and aggregates

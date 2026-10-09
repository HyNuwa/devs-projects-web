## Purpose

Provide distinct, trustworthy discovery and publication flows for course reviews and final-exam experiences while preserving the materia context, author control, privacy choices, and moderation evidence of every entry.

## ADDED Requirements

### Requirement: Reviews and final experiences remain distinct
The system SHALL treat a `Reseña de cursada` as evidence about one completed cursada and an `Experiencia de final` as evidence about one final-exam attempt. It SHALL expose them through the separate public entrances `/resenas` and `/finales` and SHALL preserve the materia hub as their canonical academic context.

#### Scenario: User enters community discovery
- **WHEN** a user opens the primary community navigation
- **THEN** the interface labels the destinations `Reseñas` and `Finales` and does not merge their records, filters, or summaries

#### Scenario: Entry appears in aggregate and materia contexts
- **WHEN** the same entry is visible in aggregate discovery, its detail route, and its materia hub
- **THEN** every view derives from the same source record and presents consistent academic facts and labels

### Requirement: Community publication requires only authentication
The system SHALL require an authenticated account to publish, edit, or delete a course review or final experience, but SHALL NOT require verified email, verified enrollment, or an attestation checkbox as an additional publication gate.

#### Scenario: Authenticated account publishes
- **WHEN** an authenticated account submits a valid review or final experience
- **THEN** the system accepts it regardless of email-verification state and applies the configured technical anti-spam controls

#### Scenario: Anonymous visitor attempts publication
- **WHEN** an unauthenticated visitor attempts to publish community content
- **THEN** the system requests sign-in and preserves a validated same-origin return path

### Requirement: Course reviews represent independent cursadas
The system SHALL store each submitted course review as an independent cursada record, including when the same author reviews the same materia more than once in the same ciclo lectivo. It SHALL NOT silently overwrite or merge an earlier review.

#### Scenario: Same student reviews two cursadas in one year
- **WHEN** an author submits a second valid review for the same materia and ciclo lectivo
- **THEN** both reviews remain separate and independently readable

#### Scenario: Submission resembles a probable duplicate
- **WHEN** a new review closely matches a recent review by the same author for the same materia and context
- **THEN** the system warns about the probable duplicate but allows the author to confirm and publish it as a distinct cursada

### Requirement: Course-review evidence is explicit
A newly published course review SHALL declare materia, ciclo lectivo, a one-to-five-star recommendation, one result from `Promoción`, `Regular`, or `Libre`, one cursada situation, and a narrative between 30 and 4,000 characters. It MAY declare one principal professor, a franja horaria, and one difficulty from `Muy baja`, `Baja`, `Media`, `Alta`, or `Muy alta`; it SHALL NOT collect cuatrimestre.

#### Scenario: Student submits a complete review
- **WHEN** an authenticated student submits every required field within its allowed range
- **THEN** the system creates a new review and preserves all declared optional context without inferring omitted facts

#### Scenario: Student identifies recurrence
- **WHEN** an author selects their cursada situation
- **THEN** the accepted values are `Primera cursada`, `Primera recursada`, `Segunda o más recursadas`, and `Prefiero no responder`

#### Scenario: Professor is not in the catalog
- **WHEN** an author wants to identify a principal professor who is not selectable from the catalog
- **THEN** the system accepts one manually entered professor name instead of blocking publication

#### Scenario: Review input is invalid
- **WHEN** the result is absent, the recommendation is outside one to five, the year is invalid, or the narrative is outside 30 to 4,000 characters
- **THEN** the system rejects publication with field-specific guidance and preserves the entered values

### Requirement: Final experiences represent independent attempts
The system SHALL allow an author to publish multiple final experiences for the same materia. A newly published experience SHALL declare materia, year, exam period, format, and one narrative between 30 and 4,000 characters; preparation, topics, and advice SHALL remain within that single narrative rather than becoming mandatory subsections.

#### Scenario: Student publishes another attempt
- **WHEN** an author submits a valid experience for a later or repeated attempt at the same final
- **THEN** the system creates a separate record without replacing previous attempts

#### Scenario: Final narrative is invalid
- **WHEN** the submitted narrative is shorter than 30 or longer than 4,000 characters
- **THEN** the system rejects publication with field-specific guidance and preserves the entered values

### Requirement: Optional final context remains semantically bounded
A final experience MAY declare an exact exam date, franja horaria, one examiner or professor, one general difficulty from the shared verbal scale, an outcome from `Aprobado`, `Desaprobado`, or `Prefiero no decir`, and an integer grade from zero to ten. A grade SHALL be accepted only with an explicit `Aprobado` or `Desaprobado` outcome and SHALL NOT be used to infer or correct the outcome.

#### Scenario: Student supplies outcome and grade
- **WHEN** an author declares `Aprobado` or `Desaprobado` with a grade from zero to ten
- **THEN** the system stores and presents both facts exactly as declared

#### Scenario: Grade lacks an explicit outcome
- **WHEN** an author supplies a grade while omitting the outcome or choosing `Prefiero no decir`
- **THEN** the system requests an explicit publishable outcome or removal of the grade without inferring one

#### Scenario: Student omits optional final context
- **WHEN** an experience has no exact date, professor, outcome, grade, franja horaria, or difficulty
- **THEN** the system accepts the experience and omits those facts from its public presentation

### Requirement: Public identity is selected per entry
Every course review and final experience SHALL retain its authenticated author internally and SHALL allow that author to publish the individual entry either under their username or as `Anónimo`.

#### Scenario: Author publishes under username
- **WHEN** an author does not enable anonymous publication
- **THEN** the public entry displays the account username without requiring a display name

#### Scenario: Author publishes anonymously
- **WHEN** an author enables anonymous publication for an entry
- **THEN** public responses display `Anónimo` without avatar, profile link, or stable anonymous alias while the author and authorized moderators retain access to the real ownership record

### Requirement: Aggregate course recommendation is transparent
The system SHALL calculate the displayed course recommendation from every distinct, publicly visible course review, including anonymous and multiple legitimate reviews by the same author, and SHALL show both the average and contributing review count.

#### Scenario: Subject has visible reviews
- **WHEN** a subject has one or more publicly visible course reviews
- **THEN** the interface presents an average and count such as `4,3 ★ · 18 reseñas` without implying academic verification

#### Scenario: Review is removed from public view
- **WHEN** a moderator removes a review or its author permanently deletes it
- **THEN** that review no longer contributes to the public average or count

### Requirement: Review discovery is filterable and shareable
The `/resenas` entrance SHALL default to the most recent reviews, support ascending and descending star order, and support URL-backed filters for materia, ciclo lectivo, principal professor, difficulty, and cursada situation.

#### Scenario: User filters reviews
- **WHEN** a user applies supported review filters or sort order
- **THEN** the result set updates and the URL can restore the same public view after reload or sharing

#### Scenario: No reviews match
- **WHEN** valid review filters return no entries
- **THEN** the interface preserves the filters, explains the empty result, and offers a way to clear or revise them

### Requirement: Final discovery is filterable and shareable
The `/finales` entrance SHALL order by exact exam date descending when known and otherwise by publication date descending. It SHALL support URL-backed filters for materia, year, exam period, examiner or professor, format, and outcome, and SHALL NOT offer grade-based ordering.

#### Scenario: User filters final experiences
- **WHEN** a user applies supported final filters
- **THEN** the result set updates without fetching every materia hub client-side and the URL restores the same public view

#### Scenario: Experiences have mixed date completeness
- **WHEN** some matching experiences include an exact exam date and others do not
- **THEN** the system applies the documented date fallback deterministically and preserves stable pagination

### Requirement: Community summaries lead to shareable details
Aggregate lists and materia hubs SHALL present a bounded three-to-four-line narrative excerpt, compact academic facts, and one explicit `Leer más` action. Full entries SHALL be available at `/resenas/:id` and `/finales/:id`, with a visible link back to their materia context.

#### Scenario: Course-review card is rendered
- **WHEN** a visible course review is summarized
- **THEN** the card shows its stars without a long visible rating label, exposes an accessible recommendation name, presents known year/result/difficulty/cursada/professor context, and bounds the narrative preview

#### Scenario: Final-experience card is rendered
- **WHEN** a visible final experience is summarized
- **THEN** the card presents known exam facts and a bounded narrative excerpt without fabricating missing examiner, outcome, grade, date, or difficulty data

#### Scenario: User opens full community content
- **WHEN** a user activates `Leer más`
- **THEN** the corresponding shareable detail route presents the complete source record and its canonical materia link

### Requirement: Authors control their published entries
An author SHALL be able to edit or permanently delete their own review or final experience. An entry whose authored content has changed after publication SHALL display `Editada · <fecha>` using its last edit date.

#### Scenario: Author edits an entry
- **WHEN** the authenticated owner submits a valid edit
- **THEN** the system updates that entry, preserves its identity and creation date, and publicly displays its last edit date

#### Scenario: Author deletes an entry
- **WHEN** the authenticated owner confirms permanent deletion
- **THEN** the system deletes the entry and removes it from discovery, detail access, materia views, and aggregates

### Requirement: Reports do not determine visibility automatically
An authenticated user SHALL be able to report visible community content as spam or repeated content, insults or harassment, exposed personal data, unrelated content, potentially misleading information, or another explained reason. A report SHALL NOT automatically hide the target entry.

#### Scenario: User reports an entry
- **WHEN** a signed-in user submits a supported report reason and any required explanation
- **THEN** the system records the report for moderator review while the target remains publicly visible until a moderator decides otherwise

#### Scenario: Reporter chooses another reason
- **WHEN** a reporter chooses `Otro`
- **THEN** the system requires a bounded plain-language explanation before accepting the report

### Requirement: Moderator removal is reversible and attributable
An authorized moderator SHALL be able to remove a reported or directly reviewed entry from public view and later restore it. Removal evidence SHALL preserve the moderator, author, reason, and action date; the author SHALL be able to see the removal reason, and moderators SHALL be able to identify the author of an anonymously published entry.

#### Scenario: Moderator removes an entry
- **WHEN** an authorized moderator records a removal reason
- **THEN** the entry becomes unavailable to the public and stops contributing to aggregates while its ownership and moderation evidence remain preserved

#### Scenario: Moderator restores an entry
- **WHEN** an authorized moderator reverses a prior removal
- **THEN** the same source entry returns to public views and aggregate calculations without being recreated

#### Scenario: Author inspects removed content
- **WHEN** the owner views their removed entry through an authenticated management view
- **THEN** the system identifies the removal state, reason, and date without exposing private moderator notes

### Requirement: Community content does not become professor ranking or a social thread
Stars and difficulty SHALL describe the declared cursada or final experience and SHALL NOT be aggregated into professor scores, professor rankings, or valorative professor profiles. Course reviews and final experiences SHALL NOT gain `Me sirvió`, nested comments, or reply threads in this change.

#### Scenario: Professor appears on multiple entries
- **WHEN** a professor is associated with multiple reviews or final experiences
- **THEN** the system may filter those entries by professor but does not calculate or display a professor rating or ranking

#### Scenario: User reads an entry
- **WHEN** a user views a course review or final experience
- **THEN** the available community interactions exclude helpfulness voting, nested comments, and replies

### Requirement: Community discovery handles bounded states
Both aggregate entrances and both detail routes SHALL provide accessible loading, empty, partial-data, not-found, removed, error, and retry states without fabricating platform-scale claims.

#### Scenario: Aggregate request fails
- **WHEN** a review or final discovery request fails
- **THEN** the interface preserves active filters and offers a retry action

#### Scenario: Detail is unavailable
- **WHEN** a public detail request targets a missing, deleted, or moderator-removed entry
- **THEN** the interface presents the appropriate bounded unavailable state without exposing private ownership or moderation data

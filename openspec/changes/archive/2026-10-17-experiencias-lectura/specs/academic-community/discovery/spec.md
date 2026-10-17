## MODIFIED Requirements

### Requirement: Reviews and final experiences remain distinct
The system SHALL treat a `Reseña de cursada` as evidence about one completed cursada and an `Experiencia de final` as evidence about one final-exam attempt. The Experiencias section SHALL open at `/experiencias` and show a materia's experiencias at `/experiencias/<código>` (see academic-community/experiences), and SHALL keep the separate public entrances `/resenas` and `/finales` as the full lists of each type, preserving the materia hub as their canonical academic context. Records and filters SHALL stay separate per type. The landing MAY interleave both types by publication date when every card carries its type; a materia summary MAY present the figures of both types side by side when every figure names its type, and the only figure that adds both SHALL be the headline count of experiencias.

#### Scenario: User enters community discovery
- **WHEN** a user opens Experiencias from the primary navigation
- **THEN** they land on `/experiencias`, whose «Ver todas» links lead to `/resenas` and `/finales`, labelled `Reseñas` and `Finales`, and no list applies the filters of one type to the other

#### Scenario: Entry appears in aggregate and materia contexts
- **WHEN** the same entry is visible on the landing, in aggregate discovery, its detail route, and its materia page
- **THEN** every view derives from the same source record and presents consistent academic facts and labels

#### Scenario: Mixed feed keeps the types apart
- **WHEN** «Recién publicadas» shows a reseña next to a final
- **THEN** each card states «Reseña de cursada» or «Experiencia de final», and no figure other than the «N experiencias» headline adds both types

### Requirement: Public identity is selected per entry
Every course review and final experience SHALL retain its authenticated author internally and SHALL allow that author to publish the individual entry either under their username or as `Anónimo`. The choice SHALL be made when publishing and SHALL NOT change by editing. Changing it later would move the author's points at that moment and point at them; to change it, the author deletes the entry and publishes it again. When anonymous publication is selected, the form SHALL say «Las publicaciones anónimas no suman puntos».

#### Scenario: Author publishes under username
- **WHEN** an author does not enable anonymous publication
- **THEN** the public entry displays the account username without requiring a display name

#### Scenario: Author publishes anonymously
- **WHEN** an author enables anonymous publication for an entry
- **THEN** public responses display `Anónimo` with the marca de anónimo, the same mark for every anonymous entry and never a user avatar, without profile link or stable anonymous alias, while the author and authorized moderators retain access to the real ownership record

#### Scenario: Author edits an anonymous entry
- **WHEN** the author edits an anonymous reseña and the request asks to publish it under their username
- **THEN** the content changes are saved and the reseña stays anonymous

#### Scenario: Anonymous choice in the form
- **WHEN** an author selects anonymous publication in the reseña or experiencia form
- **THEN** the form shows «Las publicaciones anónimas no suman puntos», and the edit form shows the choice without letting it change

### Requirement: Community summaries lead to shareable details
Aggregate lists, the Experiencias landing and the materia page SHALL present every entry with the experiencia card of academic-community/experiences: a bounded narrative excerpt, compact academic facts, and one explicit `Leer completa` action. Full entries SHALL be available at `/resenas/:id` and `/finales/:id`, with a visible link back to their materia context.

#### Scenario: Course-review card is rendered
- **WHEN** a visible course review is summarized
- **THEN** the card shows its stars without a long visible rating label, exposes an accessible recommendation name, presents known year/result/difficulty/cursada/professor context, and bounds the narrative preview

#### Scenario: Final-experience card is rendered
- **WHEN** a visible final experience is summarized
- **THEN** the card presents known exam facts and a bounded narrative excerpt without fabricating missing examiner, outcome, grade, date, or difficulty data

#### Scenario: User opens full community content
- **WHEN** a user activates `Leer completa`
- **THEN** the corresponding shareable detail route presents the complete source record and its canonical materia link

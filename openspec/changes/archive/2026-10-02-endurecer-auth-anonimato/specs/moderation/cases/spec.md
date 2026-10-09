## MODIFIED Requirements

### Requirement: Points follow publication
A contribution's existing points (10 for a material, 5 for a reseña de cursada or an experiencia de final) SHALL be awarded when it becomes `Publicado` (on submission or on approval of a revisión previa), reverted when it becomes `Retirado`, and awarded again when it is restored. Ocultamiento preventivo and revisión previa SHALL NOT award or deduct points. A contribution SHALL never hold more than one active award. Moderation decisions about an anonymous reseña or experiencia (retiro, restoration, approval of a revisión previa, an accepted appeal of its retiro) SHALL NOT award or deduct points: the author's public points would change with the decision and name them. How much each contribution earns, and whether anonymous entries earn points when published, belongs to the points change.

#### Scenario: Material published on upload
- **WHEN** a material is published immediately
- **THEN** its author receives 10 points once

#### Scenario: Reseña waiting for revisión previa
- **WHEN** a reseña enters `En revisión previa`
- **THEN** no points are awarded until a moderator approves it, and then 5 points are awarded once

#### Scenario: Retire and restore
- **WHEN** a published material is retired and later restored
- **THEN** its author's net points from that material are 10, not 20 and not 0

#### Scenario: Retiro of an anonymous reseña
- **WHEN** a moderator retires an anonymous reseña that earned 5 points, and later it is restored
- **THEN** its author's points, level and account row are the same before the retiro, after it and after the restoration

### Requirement: Immutable moderation history
Every moderation action SHALL be recorded in one append-only history. That includes:
- revisión previa approvals and rejections
- ocultamiento preventivo
- caso decisions and restorations
- revelación de autor
- sanciones and their lifting
- suspension proposals and their confirmation or rejection
- appeals and their answers

Each record SHALL hold who acted (a person or the system), the action, the target, the date and the reason. No user, including SUPERADMIN, SHALL be able to edit or delete a record through the product. Moderators SHALL be able to filter the history by action, actor, content and date. For MODERATOR, events about an account that came from a caso about anonymous content SHALL NOT be listed, with any filter. These are sanción events (advertencia, silenciamiento, suspensión, lifting, suspension proposal and its rejection) and appeals of those sanciones with their answers. Showing them would let a moderator match their reason, text and time with the account, and their mere existence would tell: «Advertir también» skips staff authors silently, so an advertencia row would say the hidden author is not staff. For MODERATOR, appeals of a retiro of anonymous content and their answers SHALL NOT show the reason either, as the read-only appeal does not show what the appellant wrote. ADMIN and SUPERADMIN SHALL see everything.

#### Scenario: Automatic hiding appears in history
- **WHEN** the system hides content after three reportes
- **THEN** the history shows a record attributed to «Sistema» with the reason «3 reportes en 48 h»

#### Scenario: Sanction appears in history
- **WHEN** a moderator silences an account
- **THEN** the history shows who silenced which account, the reason and the end date

#### Scenario: Advertencia from an anonymous caso
- **WHEN** a MODERATOR opens the history after an advertencia was given from a caso about an anonymous reseña
- **THEN** the advertencia is not listed, whatever the filter, and an ADMIN sees it with the account, the reason, the caso and the content

#### Scenario: «Advertir también» on an anonymous caso by a staff author
- **WHEN** a moderator retires with «Advertir también» an anonymous reseña by a student and another by a moderator, and opens the history
- **THEN** neither retiro is followed by an advertencia in the moderator's history, so the two look the same

#### Scenario: Appeal of a sanción from an anonymous caso
- **WHEN** the author appeals that advertencia and a MODERATOR opens the history
- **THEN** the appeal record is not listed, and an ADMIN sees it

#### Scenario: Attempt to alter a record
- **WHEN** any client requests to update or delete a history record
- **THEN** no such operation exists and the record is unchanged

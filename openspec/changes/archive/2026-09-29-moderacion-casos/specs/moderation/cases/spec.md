## Purpose

Let the community flag published contributions, group those reportes into casos that moderators resolve once with a written reason, hide content early only on strong independent signals, and keep an immutable record of every moderation action.

## ADDED Requirements

### Requirement: Reporting published content
A signed-in user SHALL be able to report a visible material, reseña de cursada or experiencia de final with one of the fixed reasons: spam o contenido repetido, insultos o acoso, expone datos personales, no relacionado con la materia, información posiblemente engañosa, or otro motivo with a required explanation of at most 1000 characters. A user SHALL NOT report their own content, content that is not publicly visible, or the same content twice.

#### Scenario: Student reports a material
- **WHEN** a signed-in student reports a published material for «no relacionado con la materia»
- **THEN** the report is recorded, joins the material's open caso (creating one if needed), and the material stays visible

#### Scenario: Second report from the same account
- **WHEN** the same account reports the same content again
- **THEN** the request is refused and the existing report is unchanged

#### Scenario: Author reports their own content
- **WHEN** the author tries to report their own reseña
- **THEN** the request is refused

#### Scenario: Visitor tries to report
- **WHEN** a signed-out visitor activates «Reportar»
- **THEN** they are asked to sign in and returned to the same content afterwards

### Requirement: Reports group into one caso per content
All open reportes about one piece of content SHALL belong to a single open caso de moderación. A caso SHALL be resolved once, and resolving it SHALL resolve all its reportes. After a caso is closed, new reportes about the same content SHALL open a new caso that shows the previous one as history.

#### Scenario: Three students report the same reseña
- **WHEN** three accounts report the same reseña with different reasons
- **THEN** there is one open caso listing the three reportes and their reasons

#### Scenario: New report after a dismissed caso
- **WHEN** content that moderation kept visible is reported again
- **THEN** a new caso opens and shows the earlier caso and its decision as history

### Requirement: Ocultamiento preventivo on strong signals
Content SHALL become `Oculto mientras se revisa` automatically when its open caso receives reportes from 3 distinct qualified accounts within 48 hours, or 1 reporte for «expone datos personales» from a qualified account. A qualified account has a verified email and is older than 7 days. A «datos personales» reporte from an unqualified account SHALL raise the caso's priority without hiding the content. Hiding SHALL be recorded as a system action and SHALL NOT deduct points.

#### Scenario: Three qualified reports in 48 hours
- **WHEN** three distinct qualified accounts report the same material within 48 hours
- **THEN** the material becomes `Oculto mientras se revisa`, the system action is recorded, and the author's points are unchanged

#### Scenario: Reports spread over time
- **WHEN** three qualified accounts report the same content over five days
- **THEN** the content stays visible and the caso stays open

#### Scenario: Personal-data report from a qualified account
- **WHEN** a qualified account reports a material for «expone datos personales»
- **THEN** the material is hidden immediately

#### Scenario: Personal-data report from a new account
- **WHEN** an account created yesterday reports content for «expone datos personales»
- **THEN** the content stays visible and its caso is marked high priority

### Requirement: Decisions on a caso
A moderator SHALL resolve a caso with one decision. «Mantener visible» makes the content `Publicado`, dismisses all its reportes, and accepts an optional internal note. «Retirar» makes the content `Retirado`, confirms all its reportes, requires a reason of at most 1000 characters that the author will see, removes the content from aggregates, and reverts the points it earned. «Restaurar» applies to `Retirado` content, makes it `Publicado` again with its history intact, requires an internal reason, and re-awards its points. Every decision SHALL record the moderator, the decision, the reason and the date.

#### Scenario: Moderator keeps a reported material
- **WHEN** a moderator decides «Mantener visible» on a caso whose material is hidden
- **THEN** the material is `Publicado` and visible again, every reporte of the caso is dismissed, and the caso is closed

#### Scenario: Moderator retires a reseña
- **WHEN** a moderator decides «Retirar» with a reason
- **THEN** the reseña is `Retirado`, leaves public views and the materia's aggregates, its reportes are confirmed, and its author sees the reason and date in Mis envíos

#### Scenario: Retire without a reason
- **WHEN** a moderator submits «Retirar» with an empty reason
- **THEN** the decision is refused

#### Scenario: Moderator restores a retired material
- **WHEN** a moderator restores a `Retirado` material with an internal reason
- **THEN** the same material is `Publicado` again and the 10 points reverted at retiro are awarded to its author again

### Requirement: Conflict of interest
A moderator SHALL NOT decide a caso about their own content, a caso in which they filed a reporte, or a revisión previa of their own content.

#### Scenario: Moderator opens a caso about their own material
- **WHEN** a moderator opens a caso about content they authored
- **THEN** the decision controls are unavailable and a decision request is refused

### Requirement: Points follow publication
A contribution's existing points (10 for a material, 5 for a reseña de cursada or an experiencia de final) SHALL be awarded when it becomes `Publicado` (on submission or on approval of a revisión previa), reverted when it becomes `Retirado`, and awarded again when it is restored. Ocultamiento preventivo and revisión previa SHALL NOT award or deduct points. A contribution SHALL never hold more than one active award. How much each contribution earns, and whether anonymous entries earn points, belongs to the points change.

#### Scenario: Material published on upload
- **WHEN** a material is published immediately
- **THEN** its author receives 10 points once

#### Scenario: Reseña waiting for revisión previa
- **WHEN** a reseña enters `En revisión previa`
- **THEN** no points are awarded until a moderator approves it, and then 5 points are awarded once

#### Scenario: Retire and restore
- **WHEN** a published material is retired and later restored
- **THEN** its author's net points from that material are 10, not 20 and not 0

### Requirement: Revelación de autor
Moderators SHALL see an anonymous entry's author as «Autor oculto». Seeing the author SHALL require a written reason of at most 300 characters and SHALL be recorded with the moderator, the entry, the reason and the date. Records of revelación de autor SHALL be visible only to ADMIN and SUPERADMIN. Content published under the author's name SHALL show the author to moderators directly.

#### Scenario: Moderator reveals an anonymous author
- **WHEN** a moderator writes a reason and activates «Ver autor» on an anonymous reseña
- **THEN** the author's account is shown and the revelación is recorded

#### Scenario: Reveal without a reason
- **WHEN** a moderator activates «Ver autor» with an empty reason
- **THEN** the author stays hidden

#### Scenario: Moderator browses the history
- **WHEN** a MODERATOR opens the history
- **THEN** revelación de autor entries are not listed; an ADMIN sees them

### Requirement: Immutable moderation history
Every moderation action SHALL be recorded in one append-only history: revisión previa approvals and rejections, ocultamiento preventivo, caso decisions, restorations and revelación de autor. Each record SHALL hold who acted (a person or the system), the action, the target, the date and the reason. No user, including SUPERADMIN, SHALL be able to edit or delete a record through the product. Moderators SHALL be able to filter the history by action, actor, content and date.

#### Scenario: Automatic hiding appears in history
- **WHEN** the system hides content after three reportes
- **THEN** the history shows a record attributed to «Sistema» with the reason «3 reportes en 48 h»

#### Scenario: Attempt to alter a record
- **WHEN** any client requests to update or delete a history record
- **THEN** no such operation exists and the record is unchanged

### Requirement: Moderation panel
The moderation panel SHALL be available only to MODERATOR, ADMIN and SUPERADMIN, and SHALL offer a Casos tab and a Historial tab. Casos SHALL list open work grouped as Ocultos preventivamente, Revisión previa and Reportados, ordered by urgency (hidden first, then high-priority casos, then by number of reportes, then oldest first), and show for each caso the content preview, its reportes with reasons, the author (or «Autor oculto» with «Ver autor»), previous casos, and the decision controls with the required reason. J and K SHALL move to the next and previous caso; V and R SHALL open the «Mantener visible» and «Retirar» actions with focus on the reason field and SHALL NOT decide on their own. The panel SHALL NOT show tabs for features that do not exist yet.

#### Scenario: Moderator works the queue with the keyboard
- **WHEN** a moderator presses J on the Casos list
- **THEN** the next caso opens (K goes back to the previous one); pressing R opens «Retirar» with focus on the reason field and nothing is decided until they confirm

#### Scenario: Student opens the panel URL
- **WHEN** a signed-in USER opens `/admin`
- **THEN** access is refused

#### Scenario: Panel tabs
- **WHEN** a moderator opens the panel
- **THEN** it shows Casos and Historial and no Usuarios or Apelaciones tab

## MODIFIED Requirements

### Requirement: Decisions on a caso
A moderator SHALL resolve a caso with one decision:
- **«Mantener visible»:** makes the content `Publicado`, dismisses all its reportes, and accepts an optional internal note.
- **«Retirar»:**
  - Makes the content `Retirado`, confirms all its reportes, removes the content from aggregates, and reverts the points it earned.
  - Requires a reason of at most 1000 characters that the author will see.
  - Offers «Advertir también». It is preselected when the author's paso sugerido is an advertencia, and when checked it gives the author an advertencia with the same reason, linked to the caso.
- **«Restaurar»:** applies to `Retirado` content, makes it `Publicado` again with its history intact, requires an internal reason, and re-awards its points.

Every decision SHALL record the moderator, the decision, the reason and the date.

#### Scenario: Moderator keeps a reported material
- **WHEN** a moderator decides «Mantener visible» on a caso whose material is hidden
- **THEN** the material is `Publicado` and visible again, every reporte of the caso is dismissed, and the caso is closed

#### Scenario: Moderator retires a reseña
- **WHEN** a moderator decides «Retirar» with a reason
- **THEN** the reseña is `Retirado`, leaves public views and the materia's aggregates, its reportes are confirmed, and its author sees the reason and date in Mis envíos

#### Scenario: Retire and warn in one step
- **WHEN** a moderator retires the first contribution of an account in 90 days and keeps «Advertir también» checked
- **THEN** the content is `Retirado` and the author's account has an advertencia with the same reason, linked to the caso

#### Scenario: Retire without a reason
- **WHEN** a moderator submits «Retirar» with an empty reason
- **THEN** the decision is refused

#### Scenario: Moderator restores a retired material
- **WHEN** a moderator restores a `Retirado` material with an internal reason
- **THEN** the same material is `Publicado` again and the 10 points reverted at retiro are awarded to its author again

### Requirement: Immutable moderation history
Every moderation action SHALL be recorded in one append-only history. That includes:
- revisión previa approvals and rejections
- ocultamiento preventivo
- caso decisions and restorations
- revelación de autor
- sanciones and their lifting
- suspension proposals and their confirmation or rejection
- appeals and their answers

Each record SHALL hold who acted (a person or the system), the action, the target, the date and the reason. No user, including SUPERADMIN, SHALL be able to edit or delete a record through the product. Moderators SHALL be able to filter the history by action, actor, content and date.

#### Scenario: Automatic hiding appears in history
- **WHEN** the system hides content after three reportes
- **THEN** the history shows a record attributed to «Sistema» with the reason «3 reportes en 48 h»

#### Scenario: Sanction appears in history
- **WHEN** a moderator silences an account
- **THEN** the history shows who silenced which account, the reason and the end date

#### Scenario: Attempt to alter a record
- **WHEN** any client requests to update or delete a history record
- **THEN** no such operation exists and the record is unchanged

### Requirement: Moderation panel
The moderation panel SHALL be available only to MODERATOR, ADMIN and SUPERADMIN, and SHALL offer the Casos, Usuarios, Apelaciones and Historial tabs.

Casos SHALL list open work in these groups, in this order:
1. Vencidos: casos past their response time, meaning 48 hours for hidden content and 7 days for everything else, most overdue first.
2. Ocultos preventivamente.
3. Revisión previa.
4. Reportados.

Outside Vencidos, each group SHALL be ordered by urgency: hidden first, then high-priority casos, then by number of reportes, then oldest first.

For each caso, Casos SHALL show the content preview, its reportes with reasons, the author (or «Autor oculto» with «Ver autor»), previous casos, and the decision controls with the required reason. J and K SHALL move to the next and previous caso. V and R SHALL open the «Mantener visible» and «Retirar» actions with focus on the reason field, and SHALL NOT decide on their own.

ADMIN and SUPERADMIN SHALL see a notice in the panel with the number of overdue casos and a link to them. The panel tabs SHALL show counts of pending casos and appeals.

#### Scenario: Moderator works the queue with the keyboard
- **WHEN** a moderator presses J on the Casos list
- **THEN** the next caso opens (K goes back to the previous one); pressing R opens «Retirar» with focus on the reason field and nothing is decided until they confirm

#### Scenario: Student opens the panel URL
- **WHEN** a signed-in USER opens `/admin`
- **THEN** access is refused

#### Scenario: Panel tabs
- **WHEN** a moderator opens the panel
- **THEN** it shows the Casos, Usuarios, Apelaciones and Historial tabs

#### Scenario: Overdue caso
- **WHEN** a caso of hidden content has been open for more than 48 hours
- **THEN** it appears in Vencidos at the top of Casos, and admins see the overdue count in the panel

## MODIFIED Requirements

### Requirement: Immutable moderation history
Every moderation action SHALL be recorded in one append-only history. That includes:
- revisión previa approvals and rejections
- ocultamiento preventivo
- caso decisions and restorations
- revelación de autor
- sanciones and their lifting
- suspension proposals and their confirmation or rejection
- appeals and their answers
- role changes and changes to a moderator's facultades

Each record SHALL hold who acted (a person or the system), the action, the target, the date and the reason. No user, including SUPERADMIN, SHALL be able to edit or delete a record through the product. Moderators SHALL be able to filter the history by action, actor, content and date. For MODERATOR, events about an account that came from a caso about anonymous content SHALL NOT be listed, with any filter. These are sanción events (advertencia, silenciamiento, suspensión, lifting, suspension proposal and its rejection) and appeals of those sanciones with their answers. Showing them would let a moderator match their reason, text and time with the account, and their mere existence would tell: «Advertir también» skips staff authors silently, so an advertencia row would say the hidden author is not staff. For MODERATOR, appeals of a retiro of anonymous content and their answers SHALL NOT show the reason either, as the read-only appeal does not show what the appellant wrote. For MODERATOR, the history SHALL list only events about content of their facultades and about accounts they can see (see moderation/scope), and SHALL NOT list role changes or changes to anyone's facultades. ADMIN and SUPERADMIN SHALL see everything.

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

#### Scenario: Event of another facultad
- **WHEN** a moderator covering FI-UNJU opens the history after a retiro in another facultad
- **THEN** that retiro is not listed, and an admin sees it

### Requirement: Moderation panel
The moderation panel SHALL be available only to MODERATOR, ADMIN and SUPERADMIN, and SHALL offer the Casos, Correcciones, Usuarios, Apelaciones and Historial tabs. Correcciones lists the correction suggestions that their authors did not decide within 7 days (see academic-resources/corrections).

Every tab SHALL show only the work and accounts within the viewer's alcance de moderación (see moderation/scope). Casos SHALL list open work in these groups, in this order:
1. Vencidos: casos past their response time, meaning 48 hours for hidden content and 7 days for everything else, most overdue first.
2. Ocultos preventivamente.
3. Revisión previa.
4. Reportados.

Outside Vencidos, each group SHALL be ordered by urgency: hidden first, then high-priority casos, then casos with a priority reporte (see reputation/trust-privileges), then by number of reportes, then oldest first.

For each caso, Casos SHALL show the content preview, its reportes with reasons, the author (or «Autor oculto» with «Ver autor»), previous casos, and the decision controls with the required reason. J and K SHALL move to the next and previous caso. V and R SHALL open the «Mantener visible» and «Retirar» actions with focus on the reason field, and SHALL NOT decide on their own.

ADMIN and SUPERADMIN SHALL see a notice in the panel with the number of overdue casos and a link to them. The panel tabs SHALL show counts of pending casos, corrections and appeals.

#### Scenario: Moderator works the queue with the keyboard
- **WHEN** a moderator presses J on the Casos list
- **THEN** the next caso opens (K goes back to the previous one); pressing R opens «Retirar» with focus on the reason field and nothing is decided until they confirm

#### Scenario: Student opens the panel URL
- **WHEN** a signed-in USER opens `/admin`
- **THEN** access is refused

#### Scenario: Panel tabs
- **WHEN** a moderator opens the panel
- **THEN** it shows the Casos, Correcciones, Usuarios, Apelaciones and Historial tabs

#### Scenario: Overdue caso
- **WHEN** a caso of hidden content has been open for more than 48 hours
- **THEN** it appears in Vencidos at the top of Casos, and admins see the overdue count in the panel

#### Scenario: Priority reporte
- **WHEN** two reported casos have one reporte each, and one of those reportes is priority
- **THEN** the caso with the priority reporte comes first in Reportados, after any high-priority caso

#### Scenario: Counts follow the facultades
- **WHEN** a moderator covering FI-UNJU opens the panel while another facultad has three open casos
- **THEN** those casos appear neither in Casos nor in the tab counts

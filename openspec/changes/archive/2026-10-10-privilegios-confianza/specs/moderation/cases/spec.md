## MODIFIED Requirements

### Requirement: Moderation panel
The moderation panel SHALL be available only to MODERATOR, ADMIN and SUPERADMIN, and SHALL offer the Casos, Correcciones, Usuarios, Apelaciones and Historial tabs. Correcciones lists the correction suggestions that their authors did not decide within 7 days (see academic-resources/corrections).

Casos SHALL list open work in these groups, in this order:
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

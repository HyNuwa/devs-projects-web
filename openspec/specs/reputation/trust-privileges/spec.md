# reputation/trust-privileges Specification

## Purpose

Give students who help well some extra reach, such as suggesting corrections, having their reportes seen first or being eligible to moderate. These privilegios de confianza come from signals that predict good use and are lost with sanciones, and they never reveal anyone's sanciones or anonymous content.

## Requirements

### Requirement: Good standing
An account SHALL be in good standing when 90 days have passed since its last sanción, and no sanción is active. These count as sanciones:
- a silenciamiento or a suspensión, from the moment it ended or was lifted;
- a retiro por normas of the account's content, anonymous content included, from the moment its caso closed.

These SHALL NOT count:
- advertencias;
- sanciones voided on appeal;
- retiros that were restored or overturned on appeal.

An account with a permanent suspensión SHALL never be in good standing. Every privilegio de confianza SHALL require good standing, and SHALL compare any required nivel against the nivel máximo alcanzado.

#### Scenario: Silenciamiento ended 60 days ago
- **WHEN** a student at nivel máximo alcanzado 4, whose 7-day silenciamiento ended 60 days ago, opens a material
- **THEN** they cannot suggest corrections, and «Tu progreso» says when the privilege comes back

#### Scenario: Retiro overturned on appeal
- **WHEN** a student's only retiro in the last 90 days was overturned on appeal
- **THEN** the retiro does not count and the student is in good standing

#### Scenario: Retiro of anonymous content
- **WHEN** moderation retires an anonymous reseña of a student
- **THEN** the student loses their privileges for 90 days, and nothing visible to other users or to moderators reveals why

### Requirement: Sugerir correcciones privilege
A student in good standing with nivel máximo alcanzado 3 or more SHALL be able to suggest corrections to other students' published materials (see academic-resources/corrections). Losing the privilege SHALL NOT close suggestions already made, because they are judged on their content.

#### Scenario: Nivel 3 student
- **WHEN** a student in good standing at nivel máximo alcanzado 3 opens another student's published material
- **THEN** «Sugerir corrección» is offered

#### Scenario: Points went down
- **WHEN** a student reached nivel 3 and then dropped to nivel 2
- **THEN** they keep the privilege, because the nivel máximo alcanzado decides

### Requirement: Reportes prioritarios
A reporte SHALL be priority when, at the moment it is filed, its reporter is in good standing and, over the last 90 days, has at least 5 confirmed reportes and a precision of 70 % or more. Precision is confirmed reportes divided by confirmed plus dismissed reportes, and pending reportes do not count. The flag SHALL be stored with the reporte and SHALL NOT change later. Moderators SHALL NOT see who filed a reporte, nor which reportes are priority beyond the order of the queue.

#### Scenario: Precise reporter
- **WHEN** a student in good standing with 6 confirmed and 2 dismissed reportes in 90 days reports a material
- **THEN** the reporte is priority and its caso moves ahead of casos without priority reportes in its group, after high-priority casos

#### Scenario: Precision drops later
- **WHEN** that student's precision later drops below 70 %
- **THEN** their earlier reporte stays priority and their next reportes are not

### Requirement: Elegible para moderar
An account with the USER role SHALL be eligible to moderate when it meets all of these:
- nivel máximo alcanzado 6 or more;
- an account older than 6 months;
- at least 5 confirmed reportes or 10 accepted corrections, over its whole history;
- good standing.

Eligibility SHALL be shown only to ADMIN and SUPERADMIN, as a mark and a filter in the Usuarios tab. Inviting someone stays manual: an admin contacts them outside the platform and changes their role. Eligibility SHALL NOT be shown to the account itself, nor to MODERATOR accounts.

#### Scenario: Admin looks for candidates
- **WHEN** an ADMIN filters Usuarios by «Elegibles»
- **THEN** the list shows the USER accounts that meet every requirement, each with the «Elegible» mark

#### Scenario: Moderator opens Usuarios
- **WHEN** a MODERATOR opens Usuarios
- **THEN** there is no «Elegibles» filter and no «Elegible» mark

### Requirement: Privileges in Tu progreso
«Tu progreso» SHALL show the account its Sugerir correcciones and Reportes prioritarios privileges. Each SHALL appear as «Activo», or with what is missing:
- the niveles left;
- the confirmed reportes or the precision left;
- the date good standing comes back, or that it does not come back after a permanent suspensión.

It SHALL NOT show eligibility to moderate. Only the account itself SHALL see this.

#### Scenario: Missing precision
- **WHEN** a student with 5 confirmed and 4 dismissed reportes in 90 days opens «Tu progreso»
- **THEN** Reportes prioritarios shows that their precision is 56 % and 70 % is needed

### Requirement: Promoting to moderator and changing roles
An ADMIN or SUPERADMIN SHALL be able to make a USER account a MODERATOR from its Usuarios file with «Hacer moderador». That action SHALL change only USER accounts, and only to MODERATOR. Any other role change SHALL accept only a known role, SHALL require SUPERADMIN to grant or remove ADMIN or SUPERADMIN, and SHALL NOT let an account change its own role. Every actual role change SHALL be recorded in the moderation history with the previous and new role, visible in Historial only to ADMIN and SUPERADMIN; a request that does not change the role records nothing.

#### Scenario: Admin promotes an eligible student
- **WHEN** an ADMIN uses «Hacer moderador» on an eligible USER account
- **THEN** the account becomes MODERATOR

#### Scenario: Admin tries to grant superadmin
- **WHEN** an ADMIN asks to change an account's role to SUPERADMIN
- **THEN** the request is refused and the role is unchanged

#### Scenario: Role changes in Historial
- **WHEN** an ADMIN and a MODERATOR open Historial after a promotion
- **THEN** the ADMIN sees «Cambio de rol» from Estudiante to Moderación, and the MODERATOR does not see it

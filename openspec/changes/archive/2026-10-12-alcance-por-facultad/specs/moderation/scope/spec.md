## Purpose

Give each moderator the facultades they cover, so moderation can grow with new facultades and universidades without every moderator seeing and acting on everything, while keeping anonymous authors hidden.

## ADDED Requirements

### Requirement: Assigning facultades
An ADMIN or SUPERADMIN SHALL assign the facultades a MODERATOR covers: when promoting the account, which requires at least one facultad, and later from the account's file, where they can add or remove facultades. Each assignment change SHALL be recorded in the moderation history with who changed it, the account, the facultades before and after and the date, visible only to ADMIN and SUPERADMIN. When an account stops being a MODERATOR, its facultades SHALL be removed. ADMIN and SUPERADMIN SHALL cover every facultad without assignments. On adoption, every existing MODERATOR SHALL cover FI-UNJU.

#### Scenario: Promoting with facultades
- **WHEN** an admin promotes an eligible account and chooses FI-UNJU
- **THEN** the account becomes MODERATOR covering FI-UNJU, and the history records the role change and the facultades

#### Scenario: Promoting without facultades
- **WHEN** an admin tries to promote an account without choosing a facultad
- **THEN** the promotion is refused and the account stays USER

#### Scenario: Demotion
- **WHEN** an admin changes a MODERATOR back to USER and later promotes them again
- **THEN** the new promotion starts with no facultades from before

#### Scenario: Migration
- **WHEN** the migration runs with two existing moderators
- **THEN** both cover FI-UNJU and keep seeing the casos they saw before

### Requirement: Facultad of a caso
A caso, a correction suggestion and an appeal of a caso decision SHALL belong to the facultad of the materia of the content they are about, read from the content when needed and never stored separately. A caso about content without a materia SHALL belong to no facultad and be handled only by ADMIN and SUPERADMIN.

#### Scenario: Material moved by a correction
- **WHEN** an accepted correction moves a reported material to another materia of the same facultad
- **THEN** its caso stays in that facultad

#### Scenario: Content without a materia
- **WHEN** a caso exists about content that has no materia
- **THEN** no MODERATOR sees it, and admins do

### Requirement: What a moderator sees
A MODERATOR SHALL see and act only on casos, revisiones previas, correction suggestions and appeals of their facultades, and the panel counts SHALL count only those. A MODERATOR without facultades SHALL see no casos and a message saying they have no facultades assigned yet. Opening or acting on an item of another facultad SHALL be refused with the same answer as an item that does not exist, so the refusal reveals nothing about it. Staff SHALL take down another author's material only through a retiro from its caso, which follows these facultades and is recorded in the history; deleting a material directly SHALL be its author's alone.

#### Scenario: Caso of another facultad
- **WHEN** a moderator covering FI-UNJU requests a caso about a material of another facultad by its address
- **THEN** the response is the same not-found answer as for a caso that does not exist

#### Scenario: Moderator without facultades
- **WHEN** a moderator with no facultades opens the panel
- **THEN** Casos is empty, the counts are zero, and the panel says they have no facultades assigned yet

#### Scenario: Deleting someone else's material
- **WHEN** a moderator, admin or superadmin asks to delete a material they did not write
- **THEN** the request is refused, the material stays, and the material view offers them no delete action

### Requirement: Accounts a moderator can see
A MODERATOR SHALL see in Usuarios, open the file of, and sanction only accounts that declared a carrera of one of their facultades, or that are the named author of a caso about signed content of one of their facultades. A caso about anonymous content SHALL never make its author visible to a MODERATOR. Once visible, the file SHALL show the account's whole record under the existing rules of the Usuarios tab, including casos and sanciones from other facultades, because the suggested escalera counts them. A request for an account the moderator cannot see SHALL get the same answer as an account that does not exist. ADMIN and SUPERADMIN SHALL see every account.

#### Scenario: Account with a carrera in the facultad
- **WHEN** a moderator covering FI-UNJU searches for a student cursando Ingeniería Informática
- **THEN** the account appears and the moderator can open its file and act on it

#### Scenario: Author of an anonymous reseña only
- **WHEN** an account with no carrera declared wrote only an anonymous reseña of an FI-UNJU materia, and that reseña has a caso
- **THEN** a moderator covering FI-UNJU does not find the account in Usuarios

#### Scenario: Sanción from another facultad in the file
- **WHEN** a moderator opens the file of a visible account that was silenced from a caso of another facultad
- **THEN** the timeline shows that silenciamiento under the usual rules

### Requirement: Panel label and admin filter
The moderation panel SHALL show the viewer's role and facultades, like «Tu rol: moderación · FI UNJU». ADMIN and SUPERADMIN SHALL have a facultad filter on Casos, Correcciones, Apelaciones and Historial, defaulting to every facultad.

#### Scenario: Admin filters
- **WHEN** an admin chooses FI-UNJU in the facultad filter on Casos
- **THEN** only casos of FI-UNJU are listed, and the counts follow the filter

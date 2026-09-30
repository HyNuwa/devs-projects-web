## MODIFIED Requirements

### Requirement: Who can sanction whom
Nobody SHALL be able to sanction their own account. The sanctioner's role SHALL determine who they can sanction:
- A MODERATOR can advertir and silenciar only USER accounts, and can propose a suspensión.
- An ADMIN can sanction USER and MODERATOR accounts, and can confirm, reject or lift suspensiones.
- Only a SUPERADMIN can sanction an ADMIN.

A moderator SHALL NOT sanction an account from a caso in which they filed a reporte. From the Usuarios tab, a moderator SHALL NOT advertir, silenciar or propose a suspensión for an account whose content published under its name they reported in the last 90 days. The refusal SHALL say «Reportaste contenido de esta cuenta: lo resuelve otra persona de moderación». Reportes on anonymous content SHALL NOT cause this refusal, because it would reveal who wrote it. Any moderator SHALL be able to lift a silenciamiento of an account they could sanction. Only an ADMIN or SUPERADMIN SHALL lift a suspensión before its end date.

#### Scenario: Moderator tries to silence another moderator
- **WHEN** a MODERATOR tries to silence a MODERATOR account
- **THEN** the request is refused

#### Scenario: Moderator lifts a silenciamiento
- **WHEN** a moderator lifts an active silenciamiento with a reason
- **THEN** the account can publish again immediately and the history records it

#### Scenario: Moderator reported the account's material
- **WHEN** a moderator who reported a material published under an account's name 10 days ago tries to silence that account from Usuarios
- **THEN** the request is refused with «Reportaste contenido de esta cuenta: lo resuelve otra persona de moderación»

#### Scenario: Moderator reported the account's anonymous reseña
- **WHEN** a moderator who reported an anonymous reseña tries to warn its author's account from Usuarios
- **THEN** the report does not block the advertencia

## MODIFIED Requirements

### Requirement: Advertencia with a retiro
When a moderator retires content, the «Retirar» action SHALL offer to warn the author in the same step («Advertir también»). For content published under the author's name, the option SHALL be preselected when the paso sugerido is an advertencia, and the moderator SHALL be able to leave it unchecked. For anonymous content, the option SHALL never be preselected, because the preselection would say something about the hidden author's record. The advertencia SHALL go to the author of the caso's content, resolved by the server from the caso. The moderator SHALL NOT choose or see that account, and the answer to the decision SHALL be the same whether an advertencia was recorded or not.

#### Scenario: First retiro of an account
- **WHEN** a moderator retires the first contribution of an account in 90 days and confirms with «Advertir también» checked
- **THEN** the content is retired and the account receives an advertencia with the retiro's reason, linked to the caso

#### Scenario: Moderator declines the suggested advertencia
- **WHEN** the moderator unchecks «Advertir también» before retiring
- **THEN** the content is retired and no advertencia is recorded

#### Scenario: Anonymous reseña
- **WHEN** a moderator opens a caso about an anonymous reseña whose author has no retiros
- **THEN** «Advertir también» is not preselected, and if the moderator checks it and retires, the author's account receives the advertencia without being shown

### Requirement: Who can sanction whom
Nobody SHALL be able to sanction their own account. The sanctioner's role SHALL determine who they can sanction:
- A MODERATOR can advertir and silenciar only USER accounts, and can propose a suspensión.
- An ADMIN can sanction USER and MODERATOR accounts, and can confirm, reject or lift suspensiones.
- Only a SUPERADMIN can sanction an ADMIN.

A moderator SHALL NOT sanction an account from a caso in which they filed a reporte. Sanctions from the Usuarios tab SHALL NOT name a caso: a request that names one SHALL be refused as invalid, the same way for every account, so its result never depends on who wrote a caso's content. The only sanción tied to a caso is the advertencia given while deciding it («Advertir también»).

From the Usuarios tab, a moderator SHALL NOT advertir, silenciar or propose a suspensión for an account whose content published under its name they reported in the last 90 days. «Advertir también» is exempt, since the caso's own reporter check applies and refusing it for another report could reveal who wrote anonymous content. The refusal SHALL say «Reportaste contenido de esta cuenta: lo resuelve otra persona de moderación». Reportes on anonymous content SHALL NOT cause this refusal, because it would reveal who wrote it.

Any moderator SHALL be able to lift a silenciamiento of an account they could sanction. Only an ADMIN or SUPERADMIN SHALL lift a suspensión before its end date.

#### Scenario: Moderator tries to silence another moderator
- **WHEN** a MODERATOR tries to silence a MODERATOR account
- **THEN** the request is refused

#### Scenario: Moderator lifts a silenciamiento
- **WHEN** a moderator lifts an active silenciamiento with a reason
- **THEN** the account can publish again immediately and the history records it

#### Scenario: Moderator reported the account's material
- **WHEN** a moderator who reported a material published under an account's name 10 days ago tries to silence that account from Usuarios
- **THEN** the request is refused with «Reportaste contenido de esta cuenta: lo resuelve otra persona de moderación»

#### Scenario: Naming another caso
- **WHEN** a moderator warns, silences or proposes a suspensión for an account from Usuarios and the request names a caso, whether or not the account wrote that caso's content
- **THEN** the request is refused as invalid with the same answer, and nothing is recorded

#### Scenario: Moderator reported the account's anonymous reseña
- **WHEN** a moderator who reported an anonymous reseña tries to warn its author's account from Usuarios
- **THEN** the report does not block the advertencia

### Requirement: Usuarios tab
The moderation panel SHALL offer a Usuarios tab. It SHALL list accounts with a paso sugerido, sanctioned accounts and accounts in revisión previa, with a search by username. For ADMIN and SUPERADMIN it SHALL also list pending suspension proposals.

For each account it SHALL show:
- username, carrera, account age, whether the email is verified, and a masked email address
- current status
- published contributions and retiros por normas in the last 90 days
- the precision of its reportes: confirmed out of confirmed plus dismissed, shown only with at least 5 resolved reportes
- a timeline of casos, sanciones, dismissed reportes and account creation
- the paso sugerido with its explanation
- the actions its viewer is allowed to take

The Usuarios tab SHALL NOT reveal which anonymous entries belong to the account; linking them requires «Ver autor» from a caso.

For a MODERATOR, nothing in the tab SHALL depend on retiros of anonymous content or on sanciones from casos about anonymous content: not the list, its filters, its order, the counts, the status, the paso sugerido nor the timeline. Otherwise deciding an anonymous caso and then looking at the tab would show which account wrote it.

ADMIN and SUPERADMIN SHALL see them. To them, a sanción from a caso about anonymous content SHALL appear as «por un caso sobre una publicación anónima», with its reason and date and without a link to the caso.

#### Scenario: Moderator opens an account with a suggestion
- **WHEN** a moderator opens an account with two retiros por normas in 90 days
- **THEN** the file shows «Paso sugerido: silenciar 7 días» with the explanation, and the «Advertir», «Silenciar 7 días» and «Proponer suspensión» actions

#### Scenario: Few resolved reports
- **WHEN** an account has 3 resolved reportes
- **THEN** its report precision is not shown

#### Scenario: Account with anonymous reseñas
- **WHEN** a moderator opens the file of an account that published anonymous reseñas
- **THEN** none of those reseñas appears in the file or its timeline

#### Scenario: Sanction from an anonymous caso in the file
- **WHEN** an ADMIN opens the file of an account that was warned from a caso about its anonymous reseña
- **THEN** the timeline shows the advertencia «por un caso sobre una publicación anónima» with its reason and date, and no link to the caso

#### Scenario: Moderator after retiring an anonymous reseña
- **WHEN** a moderator retires an anonymous reseña with «Advertir también» and then opens Usuarios
- **THEN** the author's account shows the same list membership, counts, status, paso sugerido and timeline as before the decision

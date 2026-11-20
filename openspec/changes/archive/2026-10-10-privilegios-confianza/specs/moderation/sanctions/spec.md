## MODIFIED Requirements

### Requirement: Usuarios tab
The moderation panel SHALL offer a Usuarios tab. It SHALL list accounts with a paso sugerido, sanctioned accounts and accounts in revisión previa, with a search by username. For ADMIN and SUPERADMIN it SHALL also list pending suspension proposals, and SHALL offer an «Elegibles» filter with the accounts eligible to moderate (see reputation/trust-privileges), each marked «Elegible».

For each account it SHALL show:
- username, carrera, account age, whether the email is verified, and a masked email address
- current status
- published contributions and retiros por normas in the last 90 days
- the precision of its reportes: confirmed out of confirmed plus dismissed, shown only with at least 5 resolved reportes
- a timeline of casos, sanciones, dismissed reportes and account creation
- the paso sugerido with its explanation
- the actions its viewer is allowed to take

The Usuarios tab SHALL NOT reveal which anonymous entries belong to the account; linking them requires «Ver autor» from a caso.

For a MODERATOR, nothing in the tab SHALL depend on retiros of anonymous content or on sanciones from casos about anonymous content: not the list, its filters, its order, the counts, the status, the paso sugerido nor the timeline. Otherwise deciding an anonymous caso and then looking at the tab would show which account wrote it. The same SHALL hold for the author a MODERATOR sees on a caso about signed content: its retiros in 90 days and the preselection of «Advertir también».

ADMIN and SUPERADMIN SHALL see them. Because eligibility depends on good standing, which counts retiros of anonymous content, the «Elegibles» filter and the «Elegible» mark SHALL NOT be shown to a MODERATOR. To them, a sanción from a caso about anonymous content SHALL appear as «por un caso sobre una publicación anónima», with its reason and date and without a link to the caso.

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

#### Scenario: Moderator opens a signed caso of the same author
- **WHEN** a moderator retires an anonymous reseña with «Advertir también» and then opens a caso about a material by the same account
- **THEN** the author's retiros in 90 days and the preselection of «Advertir también» are the same as before the decision, while an ADMIN sees the retiro

#### Scenario: Eligible account for an admin
- **WHEN** an ADMIN opens the file of an eligible account
- **THEN** it shows the «Elegible» mark, and the admin can change the account's role with the existing action

#### Scenario: Eligible account for a moderator
- **WHEN** a MODERATOR opens the file of the same account
- **THEN** it shows no «Elegible» mark

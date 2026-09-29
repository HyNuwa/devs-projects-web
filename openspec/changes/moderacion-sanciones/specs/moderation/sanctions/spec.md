## Purpose

Let moderation respond to accounts that repeatedly break the community rules with advertencias, silenciamientos and suspensiones. A person always decides them, guided by a suggested escalera. They are enforced, and the affected account always knows why and until when.

## ADDED Requirements

### Requirement: Sanction types
Moderation SHALL be able to apply three sanciones to an account, each with a written reason of at most 1000 characters:
- **Advertencia:** a notice with no restriction.
- **Silenciamiento:** lasts exactly 7 days.
- **Suspensión:** lasts 7 days, 30 days, or is permanent.

A sanción SHALL stop applying on its own when its end date passes, without any action by moderation. Every sanción SHALL be recorded in the moderation history with who applied it, the account, the type, the reason, the end date and, when it came from a caso, the caso.

#### Scenario: Moderator silences an account
- **WHEN** a moderator silences an account with a reason
- **THEN** the account is silenced for 7 days and the history records the sanción with its reason and end date

#### Scenario: Silenciamiento ends
- **WHEN** 7 days have passed since an account was silenced
- **THEN** the account can publish and report again without anyone lifting the sanción

#### Scenario: Sanction without a reason
- **WHEN** a moderator submits any sanción with an empty reason
- **THEN** the sanción is refused

### Requirement: Suggested escalera
For every account, the system SHALL compute a paso sugerido, and SHALL NOT apply it on its own:
- **Advertencia:** for a first retiro por normas in the last 90 days.
- **Silenciamiento:** for a second retiro por normas within 90 days.
- **Suspensión:** for a third retiro por normas within 90 days, or for a retiro por normas while the account has a silenciamiento in the last 90 days.

A retiro por normas is a «Retirar» decision on a caso. It SHALL NOT count if the author deleted the content, if it was a rejection in revisión previa, or if the retiro was restored or overturned on appeal. Advertencias and silenciamientos SHALL stop raising the step after 90 days. A suspensión SHALL keep counting.

#### Scenario: Second retiro in 90 days
- **WHEN** an account already has one retiro por normas in the last 90 days and moderation retires another of its contributions
- **THEN** the paso sugerido for the account is «Silenciar 7 días», and the account is not silenced until a moderator applies it

#### Scenario: Restored retiro does not count
- **WHEN** a retiro por normas is later restored
- **THEN** it no longer counts towards the account's paso sugerido

#### Scenario: Old advertencia
- **WHEN** an account's only advertencia is older than 90 days and it gets a new retiro
- **THEN** the paso sugerido is «Advertencia», not «Silenciar»

### Requirement: Advertencia with a retiro
When a moderator retires content, the «Retirar» action SHALL offer to warn the author in the same step («Advertir también»). The option SHALL be preselected when the paso sugerido is an advertencia, and the moderator SHALL be able to leave it unchecked. For anonymous content, the advertencia SHALL go to the author's account without revealing the author.

#### Scenario: First retiro of an account
- **WHEN** a moderator retires the first contribution of an account in 90 days and confirms with «Advertir también» checked
- **THEN** the content is retired and the account receives an advertencia with the retiro's reason, linked to the caso

#### Scenario: Moderator declines the suggested advertencia
- **WHEN** the moderator unchecks «Advertir también» before retiring
- **THEN** the content is retired and no advertencia is recorded

### Requirement: Who can sanction whom
Nobody SHALL be able to sanction their own account. The sanctioner's role SHALL determine who they can sanction:
- A MODERATOR can advertir and silenciar only USER accounts, and can propose a suspensión.
- An ADMIN can sanction USER and MODERATOR accounts, and can confirm, reject or lift suspensiones.
- Only a SUPERADMIN can sanction an ADMIN.

A moderator SHALL NOT sanction an account from a caso in which they filed a reporte. Any moderator SHALL be able to lift a silenciamiento. Only an ADMIN or SUPERADMIN SHALL lift a suspensión before its end date.

#### Scenario: Moderator tries to silence another moderator
- **WHEN** a MODERATOR tries to silence a MODERATOR account
- **THEN** the request is refused

#### Scenario: Moderator lifts a silenciamiento
- **WHEN** a moderator lifts an active silenciamiento with a reason
- **THEN** the account can publish again immediately and the history records it

### Requirement: Suspension requires an admin
A MODERATOR SHALL only propose a suspensión, with a reason and a proposed duration. A proposal SHALL NOT restrict the account. An ADMIN or SUPERADMIN SHALL confirm it (and may change the duration) or reject it, in both cases with a reason. An ADMIN or SUPERADMIN SHALL be able to suspend directly, without a proposal, for example for spam or fake accounts. When confirming or applying a suspensión, the admin SHALL be able to retire every published contribution of the account in the same step; those contributions become `Retirado` with the suspensión's reason and their points are reverted. Otherwise the account's published contributions SHALL stay visible.

#### Scenario: Moderator proposes a suspensión
- **WHEN** a moderator proposes a 30-day suspensión for an account
- **THEN** the account can still sign in, and admins see the proposal in Usuarios

#### Scenario: Admin suspends a spam account and its content
- **WHEN** an admin suspends an account permanently and checks «Retirar también sus aportes publicados»
- **THEN** the account cannot sign in, every published contribution of it is `Retirado` with that reason, and their points are reverted

### Requirement: Suspended accounts cannot use the product
A suspended account SHALL NOT be able to sign in or renew its session until the suspensión ends. Sign-in SHALL show the reason and the end date (or that it is permanent). Confirming a suspensión SHALL end every open session of the account. While an already issued short-lived access lasts, every action that writes content, reports or «Me sirvió» SHALL still be refused for the suspended account.

#### Scenario: Suspended student signs in
- **WHEN** a suspended account enters correct credentials
- **THEN** sign-in is refused with the reason and the date the suspensión ends

#### Scenario: Session open at the moment of suspension
- **WHEN** an account is suspended while it has an open session and then tries to publish a reseña
- **THEN** the publication is refused and the session cannot be renewed

### Requirement: Silenced accounts cannot contribute
While silenced, an account SHALL NOT be able to do any of the following: publish or edit a material, reseña or experiencia; resubmit a rejected contribution; report content; mark «Me sirvió». It SHALL still be able to read, search, download and save. The server SHALL refuse the blocked actions with an explanation that includes the end date. The interface SHALL show them disabled with the same explanation instead of letting the user fill in a form they cannot submit.

#### Scenario: Silenced student opens Subir material
- **WHEN** a silenced account opens Subir material
- **THEN** the form is disabled with «Estás silenciado hasta el <fecha>: no podés publicar, reportar ni marcar Me sirvió»

#### Scenario: Silenced account calls the API directly
- **WHEN** a silenced account submits a report through the API
- **THEN** the request is refused and no report is recorded

#### Scenario: Silenced account downloads a material
- **WHEN** a silenced account downloads a published material
- **THEN** the download works

### Requirement: The account knows its sanction
While an account has an active sanción, every page SHALL show a notice with the type of sanción, its reason, its end date and a way to appeal it. Advertencias SHALL be shown once and then remain in Mis envíos. Mis envíos SHALL list the account's sanciones with their type, reason, dates and appeal status. The notices SHALL NOT reveal who applied the sanción or who reported.

#### Scenario: Silenced student opens the site
- **WHEN** a silenced account opens any page
- **THEN** a notice shows that it is silenced, why, until when, and «Apelar»

#### Scenario: Warned student
- **WHEN** an account receives an advertencia and signs in
- **THEN** it sees the advertencia with its reason once, and afterwards finds it in the Sanciones section of Mis envíos

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

The Usuarios tab SHALL NOT reveal which anonymous entries belong to the account; linking them requires «Ver autor» from a caso. A sanción that came from a caso about anonymous content SHALL appear as «por un caso sobre una publicación anónima», with its reason and date and without a link to the caso.

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
- **WHEN** a moderator opens the file of an account that was warned from a caso about its anonymous reseña
- **THEN** the timeline shows the advertencia «por un caso sobre una publicación anónima» with its reason and date, and no link to the caso

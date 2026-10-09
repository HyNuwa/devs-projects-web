## Why

Change 2a (`moderacion-casos`) lets moderation retire content, but nothing happens to the account behind repeated retiros. `isMuted` and `isBanned` exist in the schema, yet nothing enforces them, and a suspended account can still sign in. Authors also have no way to contest a retiro. This change (2b) completes `docs/README_MODERACION.md` §6–§8, §13 and §14.2: sanciones with a suggested escalera, appeals reviewed by someone else, the Usuarios and Apelaciones tabs, and response-time alerts.

## What Changes

- **Sanciones** on accounts, always applied by a person:
  - **Advertencia:** the «Retirar» screen offers «Advertir también», checked when it is the suggested step. It can also be given from Usuarios.
  - **Silenciamiento:** fixed 7 days. It blocks publishing, editing, resubmitting, reporting and «Me sirvió». Any moderator can lift it.
  - **Suspensión:** 7 days, 30 days or permanent. A moderator proposes it and an admin confirms it, rejects it or lifts it early. An admin can suspend spam and fake accounts directly. While confirming, the admin can also retire the account's published contributions.
  - A sanction ends on its own when its end date passes (`mutedUntil`, new `bannedUntil`), with no scheduled job.
- **Escalera:** suggests the next step from retiros por normas and silenciamientos in the last 90 days, and never applies it. Retiros that were restored or overturned on appeal do not count.
- **Who sanctions whom:**
  - Nobody sanctions themselves.
  - A moderator is sanctioned only by an ADMIN, and an ADMIN only by a SUPERADMIN.
  - Nobody sanctions from a caso they reported.
  - The author of an anonymous entry can be sanctioned from the caso without being revealed.
- **BREAKING — enforcement:** a suspended account cannot sign in or refresh its session. Confirming a suspension revokes its sessions. Write endpoints check the account status in the database, so the up-to-15-minute access token cannot be used to write. A silenced account gets 403 `ACCOUNT_MUTED` on blocked actions, and the UI shows them disabled with an explanation.
- **Apelaciones:**
  - Retiros and sanciones can be appealed once, within 14 days. Revisión previa rejections and «Mantener visible» cannot.
  - Another moderator reviews it; an admin reviews suspensions, and an admin also takes appeals when nobody else is eligible. The answer is final and always carries a reason.
  - An accepted retiro restores the content, re-awards its points, stops counting for the escalera and voids the advertencia given with it. An accepted sanción is lifted.
  - A suspended account appeals from the login screen by re-entering its credentials.
  - Anonymous authors stay «Autor oculto» to the reviewer.
- **Moderation panel:**
  - **Usuarios tab:**
    - List with the filters «Con sugerencias», «Sancionados» and «Revisión previa», a search by username, and suspension proposals for admins.
    - User file with carrera, account age, masked email, status, contribution and retiro counts, report precision (shown only with at least 5 resolved reports), a timeline and the suggested step.
    - A user's anonymous entries are never listed.
  - **Apelaciones tab:** only appeals of other people's decisions.
  - **Casos:** a «Vencidos» group at the top of the queue (48 h for hidden content, 7 days for the rest), and a banner for admins with the overdue count.
- **Author-facing notices (no notifications system yet):**
  - A banner in the shell while a sanción is active, with the reason, the end date and «Apelar».
  - A «Sanciones» section in Mis envíos, and «Apelar» on retired contributions within 14 days.
  - `/normas` gains the sanciones and appeals sections it deliberately left out in 2a.
- **Testing:** Vitest is set up in the backend next to Jest. New backend tests are written in Vitest; the existing Jest specs stay as they are.
- **Out of scope:**
  - Retention purges (nothing expires before September 2027).
  - Notifications and email (`docs/README_MODERACION.md` §15).
  - Freezing points, hiding personalizaciones and removing privilegios de confianza during a sanción (points change).
  - ModeratorScope by facultad (Facultad change).
  - Sanctions tied to eventos and avisos.

## Capabilities

### New Capabilities
- `moderation/sanctions`: advertencia, silenciamiento and suspensión; the escalera and its suggested step; who can sanction whom; enforcement at sign-in and on writes; author-facing notices; the Usuarios tab.
- `moderation/appeals`: what can be appealed and when; who reviews it; the effects of accepting or rejecting it; appealing a suspension from sign-in; the Apelaciones tab.

### Modified Capabilities
- `moderation/cases`:
  - «Decisions on a caso» lets «Retirar» carry an advertencia.
  - «Immutable moderation history» also records sanciones, suspension proposals and appeals.
  - «Moderation panel» gains the Usuarios and Apelaciones tabs, the «Vencidos» group and the admin overdue banner.
- `moderation/publication`:
  - «Authors see the status of their contributions» adds the Sanciones section, «Apelar» on retiros and the appeal outcome.
  - «Contributors are told the publication rules» lets `/normas` describe sanciones and appeals.

## Impact

- **Database:**
  - New `Sanction`, `SuspensionProposal` and `Appeal` models, plus `User.bannedUntil`.
  - New `ModerationEvent` actions for sanciones, proposals and appeals.
  - A migration with a database test.
- **Backend:**
  - A sanctions module (escalera, apply/lift/propose/confirm, user file and list) and an appeals module.
  - Auth: login and refresh refuse suspended accounts; refresh tokens are revoked on suspension; a credential-checked endpoint for appealing a suspension.
  - An account-status check on the write paths (materials, reseñas, experiencias, resubmit, reports, «Me sirvió»).
  - Decisions: «Retirar» with «Advertir también»; the queue gains overdue grouping.
  - Vitest configuration (`unplugin-swc`) next to the Jest suites.
- **Frontend:**
  - The panel's Usuarios and Apelaciones tabs, the «Vencidos» group and the admin banner.
  - The shell sanction banner, and the login screen for suspended accounts with its appeal form.
  - Mis envíos Sanciones section and «Apelar».
  - Disabled write actions with an explanation while silenced.
  - `/normas` sections on sanciones and appeals.
- **Docs:** already updated in `docs/README_MODERACION.md` (§6–§8, §13, §14, §15), `docs/README_PUNTOS_E_INSIGNIAS.md` §5.2 and `CONTEXT.md`.

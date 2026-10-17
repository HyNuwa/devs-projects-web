## Context

See proposal.md, «Why». Current state that shapes the approach:

- **Password checks:**
  - `AuthService.validateUser` returns `null` before `bcrypt.compare` when the email has no account.
  - `SuspensionAppealController.appeal` does the same with `!user || !(await bcrypt.compare(...))`.
  - Real hashes use `SALT_ROUNDS = 12` in `auth.service.ts`.
- **Logging:**
  - `requestPasswordReset` logs `Solicitud de reset para email no registrado: ${email}`.
  - Mail failures are logged with the raw error, and a nodemailer error can name the recipient.
  - In development, `MailService.send` prints `Email to: ${to}`.
  - `pino-http` logs method, URL and status, not bodies.
- **Sanctions from Usuarios:**
  - `SanctionReasonDto` and `ProposeSuspensionDto` take an optional `caseId`.
  - `SanctionsService.apply` and `SuspensionProposalsService.propose` call `caseAbout`, which answers 400 «Ese caso no es sobre esta cuenta» when the account is not the caso's author.
  - The frontend never sends `caseId`. The only caller that passes one is `DecisionsService.decide` («Advertir también»), which calls `sanctions.warn(moderator, snapshot.authorId, …, { caseId, tx, decidingCase: true })` with the author resolved from the caso.
  - The global `ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`.
- **Usuarios:** `moderation-users.service.ts` builds the list, the filters and the file from:
  - `loadHistories`: retiros (casos with `decision: REMOVE`) and non-voided sanciones, anonymous included.
  - `publishedCount`, which includes anonymous reseñas and experiencias.
  - The candidate queries: «suggested» from recent retiros, «sanctioned» from recent sanciones and restriction flags.
  - The file's casos already exclude anonymous content (`NOT_ANONYMOUS`), and its sanciones mark `anonymousCase`.
- **Caso detail:** `CasesService.detail` returns `warnSuggested`, computed from the hidden author's history and whether the viewer may warn them (false for staff).
- **Appeals:**
  - `canReview` takes `anonymousContent`, set only for RETIRO appeals.
  - `AppealsQueryService.summary` shows the username for SANCTION appeals and marks `anonymousCase`.

## Goals / Non-Goals

**Goals:**
- One password-verification helper used by every credential check, so no path can skip the hash comparison.
- A MODERATOR's view of accounts does not depend on anonymous content at all. Admin views are unchanged.

**Non-Goals:**
- **Sign-up** still answers 409 «El email ya está registrado» for an existing email: an explicit enumeration, limited to 3 per hour per IP. Removing it needs a verification-email flow for existing addresses; it is out of scope and noted in `README_SECURITY`.
- **Recovery** still does its database writes only for existing accounts. The difference is a few milliseconds of database time, not a bcrypt round, and the response is already identical. It is not equalized here.
- A structured security audit log. There is no correlation need today, so no email HMAC is logged either.

## Decisions

### A password verifier with a stand-in hash
A new injectable `PasswordHasher` in the auth module, with `PASSWORD_HASH_ROUNDS = 12` (moved from `auth.service.ts`), offers:
- `hash(password)`.
- `verify(password, hash | null)`: with a `null` hash, it compares against a stand-in hash and returns `false`.

**The stand-in hash:**
- Created once, in `onModuleInit`, with `bcrypt.hash(randomBytes(32).toString('hex'), PASSWORD_HASH_ROUNDS)`. It is ready before the app takes requests, so no request pays for it.
- Its random input means no password can match it, and it has the same cost as real hashes.
- Not configurable, since nothing needs to tune it.

**Callers:**
- `AuthService.validateUser`, `register`, and the password reset.
- The suspension appeal controller (the auth module exports `PasswordHasher`).

**Alternatives rejected:**
- A hard-coded hash string: it has to be kept in step with the cost by hand.
- Creating it lazily on first use: that first unknown-email check would be slower.
- Creating it at module import: every test process would pay for it.

### Logs record the event, not the address
- **Recovery:** it logs `Solicitud de recuperación` with `{ accountFound: boolean }` at debug level. The event is not security-relevant enough to need correlation, so no HMAC is written.
- **Mail errors:** `logger.error('Error enviando email de …', mailError(err))` logs only `name`, `code` and `responseCode`, never `message` or `response`, which can quote the recipient.
- **Development mail sink:** it keeps printing subject and body, because developers need the links, but prints the recipient as `<destinatario oculto>`.
- **Alternative rejected:** a pino `redact` path, because these are free-text messages, not structured fields.

### Usuarios actions never take a caso
`caseId` is removed from `SanctionReasonDto` and `ProposeSuspensionDto`, and from the controller calls. With `forbidNonWhitelisted`, a body that carries it gets the same 400 «property caseId should not exist» for every account, before any lookup.
- `SuspensionProposalsService.propose` loses its `caseId` option, since no caller needs it.
- `SanctionsService` keeps `caseId` in its internal options for the decision path only.
- `caseAbout` stays: the decision passes the caso's own author, so its 400 cannot be reached with a chosen account.
- **Alternative rejected:** keep `caseId` and answer the same whether or not the account is the author. The sanción would still be created and linked, so creating it would be the oracle.

### No preselection on anonymous casos
`warnSuggested` is `false` when the target is anonymous, without reading the author's history. The decision path is unchanged: `Advertir también` warns the caso's author when the moderator may sanction them. For staff authors it is skipped silently, and the decision answer is the same in both cases.

### A viewer-aware account history
`loadHistories(client, ids, { anonymous })` gains an option:
- **`anonymous: 'exclude'`:** drops retiros whose caso content is an anonymous reseña or experiencia, and sanciones whose caso is about one.
- **Who gets it:** `ModerationUsersService` passes it for MODERATOR, and ADMIN and SUPERADMIN keep `'include'`. The same filter applies to:
  - the «suggested» candidates (retiro casos) and the «sanctioned» candidates (recent sanciones);
  - the file's sanciones timeline;
  - `publishedCount`, which counts only signed reseñas and experiencias for MODERATOR;
  - on a caso about signed content (`CasesService.detail`), the author's `removalsLast90Days` and the history behind `warnSuggested`. Found during implementation: comparing that card before and after an anonymous retiro would name the author just like Usuarios.
- **What stays:** the escalera for decisions (`DecisionsService`) and «Ver autor» (`HistoryService.revealAuthor`, which is recorded) keep the full history, so reincidence still counts for the account.
- **Restriction flags:** mute and suspension come only from Usuarios actions, which need the account. «Advertir también» only warns, and warnings do not change the account row, so the flags cannot come from an anonymous caso. The status is computed from the filtered history, so an anonymous advertencia does not turn a MODERATOR's view into WARNED.
- **Alternative rejected:** hiding only the timeline entries. The counts and filters would still move.

### Appeals of sanciones from anonymous casos
`anonymousContent` becomes true for a SANCTION appeal whose sanción's caso is about anonymous content, in `canReview`'s callers: list, detail, answer and count. For MODERATOR, `summary` shows such an appellant as `{ hidden: true, username: null }`, as for anonymous retiros. ADMIN still sees the username, since the sanción is on the account and its file shows it to them. The read-only path already keeps the explanation out.

### Found by the code review (6.2)
- **Points on anonymous decisions:** a retiro reverted the author's points and a restoration awarded them back, and points and level are public (`/ranking`). Diffing them before and after deciding an anonymous caso named the author. `DecisionsService` (decision and `restoreFromAppeal`) no longer moves points for anonymous content. An anonymous entry that is retired keeps its points until the points change removes anonymous points for everyone at once (README_PUNTOS_E_INSIGNIAS §3.4 and its migration).
- **History rows that exist only for some authors:** «Advertir también» skips staff authors silently, so a masked WARNED row after an anonymous retiro said the author was not staff. For MODERATOR, `HistoryService.list` drops account events from anonymous casos instead of masking them.
- **Over-exposed profile:** `GET /users/:id` returned another account's whole row (email, sanción flags, `lastLogin`, `updatedAt`). It now returns the public profile: id, username, display name, avatar, bio, points, level and creation date. `/users/me` is unchanged. The frontend did not call it.
- **Log format:** pino drops extra arguments to a message, so `accountFound` and the mail error fields never reached production logs. They are logged as one object (`{ msg, accountFound }`, `{ msg, mailError }`).
- **Not changed:** email lookup is not normalized (case and whitespace), unlike the rate-limit key; it is a correctness issue with existing data, not an oracle, since both paths pay the bcrypt round. The extra writes of «Advertir también» for a warnable author are a sub-millisecond database difference. Stored hashes with a lower cost than 12 would answer faster than the stand-in; the code never produced them, but some demo rows have them.

## Risks / Trade-offs

- **[Moderators no longer see anonymous reincidence in Usuarios]** → The paso sugerido of a caso decision still counts it. A moderator can use «Ver autor», which is recorded, or leave the escalation to an admin. Documented in README_MODERACION §9, replacing 2c's accepted risk.
- **[A MODERATOR sees a different paso sugerido than an ADMIN for the same account]** → Intended. The file says nothing about why, and admins act on the full picture.
- **[An API client that sent `caseId` to the Usuarios endpoints now gets 400]** → None exists: the frontend never sent it.
- **[Startup takes one extra bcrypt round, about 250 ms]** → Once per process, before the app listens; acceptable.

## Migration Plan

No data migration. Deploy with the backend and frontend together. Rollback is a redeploy of the previous build.

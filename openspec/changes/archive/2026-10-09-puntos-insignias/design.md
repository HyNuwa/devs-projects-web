## Context

See proposal.md, «Why». Current state that shapes the approach:

- **Schema:**
  - `Badge` has only `name`, `description` and `imageUrl`.
  - `UserBadge` has `earnedAt` and `@@unique([userId, badgeId])`.
  - Nothing reads or writes either table.
- **Change 3a gave the data the criteria need:**
  - `PointTransaction` with `MATERIAL_PIONEER` and `REPORT_CONFIRMED` movements.
  - Valid «Me sirvió», as `HelpfulPoints` defines them: a verified giver, no active sanción, not the author.
  - Signed versus anonymous entries.
  - The time zone convention: UTC-3, as in `point-ledger.ts`.
- **Other data:**
  - Carreras come from `UserStudyPlan` → `StudyPlan.careerId`.
  - Reseñas carry `academicYear`, `professorId` or `professorName`, `shift`, `condition` and `difficulty`.
  - Experiencias carry `session` and `year`.
- **Assets:** `apps/frontend/public/assets/insignias/gema/<slug>.{svg,lottie}`, 18 gems. Each `.lottie` has the markers `estatica` (frame 0), `entrada` (1–99) and `toque` (100–149). `@lottiefiles/dotlottie-react` is installed.
- **Pages:** «Tu progreso» exists at `/mi-espacio/progreso` (`ProgressPage`). There is no public profile page.

## Goals / Non-Goals

**Goals:**
- One pure, testable definition per insignia that computes, from an account's data, the grado and edición it currently holds and its progress to the next one.
- A single evaluation that brings `UserBadge` in line with those definitions, used by every reader and by the rebuild.

**Non-Goals:**
- Eager evaluation on every event, notifications, pinning, titles, the public profile page, Lupa.
- Rankings by insignias.

## Decisions

### Evaluate when read, not on every event
`BadgeService.evaluate(tx, userId)` recomputes all criteria for one account and reconciles its `UserBadge` rows:
- insert what is newly met, with `earnedAt = now` and `seenAt = null`;
- update a changed grado, with `tierUpdatedAt = now` and `seenAt = null`, so the new grado animates;
- delete what is no longer met, with no notice.

It runs under an advisory lock on the account, in its own transaction.

**Callers:**
- `GET /me/badges`, which «Tu progreso» calls;
- the public badges of `GET /users/:id`;
- the rebuild script.

**Why:** almost every event that changes an insignia (publication, «Me sirvió», retiro, deletion, edits of a material's subject or type, edits of a reseña's context, confirmed reportes) happens in a different service and transaction. Recomputing on read is always consistent, needs no hooks in moderation transactions (§9.2 asks to keep insignias out of them), and an insignia is only ever visible when it is read.

**Trade-off:** `earnedAt` is when the insignia was first seen to be met, not the exact moment of the event. «Tu progreso» shows month and year, so the difference rarely shows. When notifications arrive, they will need eager evaluation, and this same `evaluate` is what they will call.

**Alternative rejected:** collecting touched accounts during each transaction and evaluating after commit. It needs an after-commit hook in about ten services, and fails silently if one is missed.

### Pure criteria over a loaded snapshot
`loadBadgeSnapshot(tx, userId)` reads once:
- published materials, with type, subject, `academicYear` and `createdAt`;
- signed published reseñas and experiencias, with their fields and `createdAt`;
- each material's valid «Me sirvió», with the giver's carreras;
- active `MATERIAL_PIONEER` count;
- confirmed reportes, counted as distinct casos with a confirmed reporte of the account whose REMOVE stands (not as `REPORT_CONFIRMED` movements, which the 10-points-a-week cap leaves out);
- `emailVerified` and `createdAt`.

Each insignia in `badge-catalog.ts` is a pure function from snapshot and calendar to `{ tier | null, editions[], progress }`.

**Details per criterion:**
- **«Primera luz»:** the snapshot also carries, for each subject where the account has published materials, whether its earliest ever-published material (`PUBLISHED`, `HIDDEN` or `REMOVED`) is the account's and still published.
- **Validity of «Me sirvió»:** the same rule as `HelpfulPoints`, extracted to one shared helper.
- **Contribution date:** `createdAt` of the published entry.
- **Unit tests:** criteria are unit-tested without a database, and the loader with e2e tests.

### Calendar
`badge-calendar.ts` holds the defaults:
- **Cuatrimestres:** a date in March–July is `<year>-1`, in August–December `<year>-2`, and in January–February `<year-1>-2`.
- **Exam periods:** February–March, July and December. A period's edición is `YYYYMM` of its first month, for example `202612`.
- **«Mesa de diciembre»:** its edición is the experiencia's `year`.
- **«Primera camada»:** its window comes from the optional `FOUNDER_WINDOW_START` and `FOUNDER_WINDOW_END` (ISO dates) in `env.validation.ts`. Without both, nobody earns it. «Configuration» in the spec means this module plus those two variables; cuatrimestres and mesas change rarely enough to live in code.

### Schema
- **`Badge`:** gains `slug` (unique), `rarity` (enum `COMUN`, `RARA`, `TEMPORADA`, `EDICION_UNICA`) and `sortOrder`. `imageUrl` holds `/assets/insignias/gema/<slug>.svg`.
- **Catalog rows:** the migration inserts the 17 catalog rows, with `ON CONFLICT (slug) DO UPDATE`. A test checks that the rows match `badge-catalog.ts`.
- **`UserBadge`:**
  - gains `tier` (enum `BRONCE`, `PLATA`, `ORO`, nullable), `tierUpdatedAt`, `edition` (`Int`, default 0) and `seenAt`;
  - the unique key becomes `[userId, badgeId, edition]`.

### API
- **`GET /me/badges`:** evaluates, then returns:
  - `earned`: slug, name, rarity, tier, edition, earnedAt, seen;
  - `pending`: slug, name, rarity, criterion;
  - `closest`: up to 3 non-seasonal pending insignias or next grados, by `current / target`, each with `current`, `target` and a `missing` phrase.
- **`POST /me/badges/seen`:** marks the account's unseen rows as seen.
- **`GET /users/:id`:** evaluates, then adds `badges: [{ slug, name, rarity, tier, edition }]`, without dates and without `ojo-atento`.

### Frontend
- «Tu progreso» gets an «Insignias» section after the canvas `p_progreso` (collection grid, «Las más cercanas» with bars).
- A `Gem` component shows the `.svg`. For unseen earned insignias it shows the `.lottie` playing the `entrada` marker once, unless `prefers-reduced-motion` is set.
- After render, it calls `POST /me/badges/seen`.

### Retroactive awarding
`rebuildPoints` calls `evaluate` for each account after its points, with `retroactive`: every new row, seasonal ones included, and every raised grado is stored with `seenAt = now`, so a deploy doesn't animate dozens of gems. Seasonal ediciones only count contributions shared during their period («Mesa de diciembre» needs the experiencia shared in that December or the following January–February), so neither the backfill nor a later read invents past ediciones.

### Changes from the final review
- A lowered grado updates `tier` only: it keeps `tierUpdatedAt` and `seenAt`.
- «Puente» matches carreras to distinct givers (a small bipartite matching).
- Contributions under ocultamiento preventivo (`HIDDEN`) count, as for points. «Me sirvió» count only on published materials.
- `POST /me/badges/seen` takes the `(slug, edition)` keys the page showed. The page sends them when the section comes into view (IntersectionObserver).
- The public profile lists only catalog slugs except `ojo-atento`, and re-evaluates another account at most once a minute per instance.
- `FOUNDER_WINDOW_START` and `FOUNDER_WINDOW_END` must be set together.
- **Known limitation, as for the pioneer bonus in 3a:** «Primera luz» picks the first material by `createdAt` among ever-published ones. A material that waited in revisión previa can therefore take the place of one published while it waited. There is no stored publication date to order by.

## Risks / Trade-offs

- **[Reading «Tu progreso» or a public profile runs about 8 queries and may write]** → It is scoped to one account, and its cost is comparable to the progress endpoint. The account lock prevents duplicate rows from concurrent reads.
- **[`earnedAt` is approximate]** → It is shown at month precision. Documented.
- **[A public profile request writes to another account's `UserBadge`]** → The write is idempotent, and gives the same result the owner would see.
- **[A calendar in code]** → The values are defaults; changing them is a code change, rare and reviewed.

## Migration Plan

1. Deploy the schema migration with its catalog rows and the code.
2. Run `rebuild-points` as a dry run, then with `--apply`. It now also awards insignias.
3. Rollback: there is no down migration. Restore the backup taken before step 1. There is only development and demo data.

## Context

See proposal.md, «Why». Current state that shapes the approach:

- **`PointService`** (`ranking/point.service.ts`) has three methods:
  - `awardPoints`: legacy, used only by guías.
  - `awardFor(tx, award)`: skips the award when the reference already nets above zero.
  - `revertFor(tx, referenceId)`: writes `-net` with reason `<reason>_REVERTED`.

  `applyDelta` updates `User.points` and `User.level` through `rpg-levels.ts`, which still holds the legacy table.
- **`PointTransaction`:** `reason` is `VarChar(100)`, and `referenceId` is a nullable string. There is no idempotency key, no reversal link and no uniqueness.
- **Callers:**
  - `materials.service.ts` awards on publication.
  - `subjects.service.ts` awards reseñas and experiencias on creation, anonymous ones included.
  - `decisions.service.ts` reverts on REMOVE and awards on RESTORE or APPROVE, both skipped for anonymous since 2d, and awards again in `restoreFromAppeal`.
  - `bulk-retiro.ts` reverts.
  - Author deletion of reseñas and experiencias reverts nothing (a hard delete), and neither does material deletion.
- **«Me sirvió»:** `MaterialsService.setHelpfulness` upserts or deletes a `MaterialHelpfulness` row (`@@unique([userId, materialId])`) and moves no points.
- **Edits:** they reuse the create DTOs, so `isAnonymous` can change on edit.
- **Periods:**
  - Reseñas carry `academicYear` (nullable) as the ciclo lectivo.
  - Experiencias carry `year` and `session` (`ExamSession`, with `NO_RECUERDO`) as the período de examen.
- **Frontend:** no Mi espacio exists yet. The account menu has Mi perfil, Mis envíos, Moderación and Cerrar sesión. The design is in `design/canvas/extra/generar_extra.py` (`p_progreso`) and the Ayuda pages in `generar_ayuda.py`.
- **Data:** only development and demo data, with no production.

## Goals / Non-Goals

**Goals:**
- One ledger service that every point movement goes through. Idempotency, caps and the sanction freeze are enforced inside it, so a caller cannot get them wrong.
- The same rules for live awards and for the rebuild: the rebuild replays history through the ledger.

**Non-Goals:**
- Badges, unlock retention when the level drops, personalization, trust privileges, rankings and notifications.
- The legacy `/ranking` module beyond keeping it compiling: it reads `User.points` and is deleted by the cleanup change.
- A periodic reconciliation job (§9.2): the rebuild script can check consistency on demand.

## Decisions

### `PointLedger` replaces `PointService`
A `PointLedger` service in the ranking module (renamed later with the cleanup) exposes:

- `award(tx, { userId, reason, referenceId, amount, context })`
- `revert(tx, { reason, referenceId })`
- `revertMatching(tx, { reason, referencePrefix })`, for the «Me sirvió» of a material.

All of them run inside the caller's transaction. `awardPoints` and `awardFor`/`revertFor` are removed and their callers migrated.

`award` does, in order:
1. Lock the account row (`SELECT … FOR UPDATE` on `users`), so caps hold under concurrency. Accounts are always locked before the advisory key lock, and a caller that moves points of several accounts (a retiro: author and reporters) locks them up front in id order (`lockAccounts`), so concurrent operations cannot deadlock.
2. Refuse quietly (no movement) when the account is silenced (`mutedUntil > now`) or suspended. The exception is `context.appeal`, so an accepted appeal still gives points back.
3. Check the reason's cap (below).
4. Insert with `idempotencyKey = <reason>:<referenceId>:<n>`, where `n` is the number of reversals already recorded for that reason and reference. A unique violation would abort the caller's transaction, so it is prevented, not caught: under the locks the award is checked before writing, and every reference belongs to one account.
5. `applyDelta` on `points` and `level`.

`revert` finds the active (unreversed) award for the reason and reference, locks its account and key, reads it again, and inserts `-amount` with `reversesId` pointing at it. `reversesId` is unique, so a double reversal fails and is treated as done.

**Alternative rejected:** `@@unique([userId, reason, referenceId])`. It blocks the award after a restore, and nullable references escape it (§3.5).

### References and caps
| Reason | `referenceId` | Cap check, against active awards (not reversed) |
|---|---|---|
| `MATERIAL_PUBLISHED` | material id | none |
| `COURSE_REVIEWED` | reseña id | no active award for another reseña of the same author, materia and `academicYear` (null counts as its own value) |
| `EXAM_EXPERIENCE_SHARED` | experiencia id | no active award for another experiencia of the same author, materia, `session` and `year` |
| `HELPFUL_RECEIVED` | `<materialId>:<giverId>` | under 25 for the material (prefix `materialId:`); under 20 for the author since local midnight (America/Argentina/Jujuy); under 5 for the author from that giver (suffix `:giverId`) in the calendar month |
| `MATERIAL_PIONEER` | `<subjectId>:<resourceType>:<materialId>` | no other material of that materia and type ever held it |
| `REPORT_CONFIRMED` | `<caseId>:<reporterId>` | the reporter's awards in the last 7 days sum under 10 points |
| `GUIDE_CREATED` | guía id | never awarded again; legacy rows only |

The daily and monthly caps count active awards, not attempts, within bounded windows (from the start of the local day or month to its end), so a replay in any order counts each event in its own window. Removing and adding a «Me sirvió» again therefore never nets more than one point.

### «Me sirvió»
`setHelpfulness` calls `award` after the upsert and `revert` after the delete, in the same transaction. The material row is locked `FOR NO KEY UPDATE` first (not `FOR UPDATE`, which deadlocks with the KEY SHARE lock the inserted «Me sirvió» holds), so a retiro committing meanwhile cannot leave a point on a retired material. Validity is checked first:
- the giver has a verified email and no active sanción;
- the giver is not the author;
- the material is `PUBLISHED`.

After an award, the pioneer bonus is evaluated.

### Pioneer bonus
A material qualifies when all of these hold:
- its type is not `OTRO`;
- it is the earliest material by `createdAt` of its `(subjectId, resourceType)` among those that were ever `PUBLISHED`, so a retired pioneer still blocks the others;
- it has at least 3 valid «Me sirvió».

The award goes to that material's author with reference `<subjectId>:<resourceType>:<materialId>`, and no other material of that materia and type can earn it once one held it (the final review found that checking only «first by `createdAt`» let a material approved later from revisión previa take the place, or revoke the holder's bonus). When a published material's subject or type is edited, its own bonus is reverted and the new materia and type are evaluated. Retiro or deletion reverts it, and it does not pass to another material.

### Reversal points
- **Moderation REMOVE:**
  - the contribution award, if signed;
  - for a material, also `HELPFUL_RECEIVED` by prefix and its pioneer bonus.
- **RESTORE, APPROVE and `restoreFromAppeal`:** award the contribution again. For a material, also award again its current valid «Me sirvió» in `createdAt` order within the caps, and evaluate the pioneer bonus.
- **REMOVE confirming reportes:** award `REPORT_CONFIRMED` to each distinct reporter whose report was created before the decision.
- **RESTORE or an overturned retiro:** revert those `REPORT_CONFIRMED`.
- **`bulk-retiro`:** retires as moderation does. It confirms no reportes.
- **Author deletion:** the same reversals, before a reseña's or experiencia's hard delete, and on a material's soft delete.
- **Edits that change the period** of a published, signed reseña (`academicYear`) or experiencia (`session`, `year`): its points are reverted and evaluated again in the new period, so an edit cannot hold two awards in one period.
- **Accepted appeals** pass `appeal` down to the «Me sirvió» and pioneer awards too, so they come back during a sanción.

### Anonymity
- Anonymous reseñas and experiencias are never passed to `award` for themselves.
- **Edits:** the update DTOs keep accepting `isAnonymous`, because removing it would make the global `forbidNonWhitelisted` refuse edits from older clients. The update services ignore it and always keep the stored value, so an edit saves its content and never changes the choice.
- **Reportes:** `REPORT_CONFIRMED` on anonymous content is allowed. It goes to the reporter, never to the author.

### Levels
`rpg-levels.ts` holds the new table: number, name, threshold and the unlock text shown in «Tu progreso». `levelForPoints(max(0, points))`.

### Data migration and rebuild
- **Prisma migration:**
  - Create the `PointReason` enum and convert `reason` with `USING`: `MATERIAL_APPROVED → MATERIAL_PUBLISHED`, a `_REVERTED` suffix becomes the base reason, and any other value (the dev seed writes `SEED`) becomes `LEGACY_ADJUSTMENT`, a reason that is never awarded.
  - Add `idempotency_key` (unique; legacy rows get `legacy:<id>`), `reverses_id` (unique, nullable FK), and the indexes `(user_id, created_at)` and `(reason, reference_id)`.

  It deletes no rows.
- **Rebuild script** (`prisma/backfills/rebuild-points.ts`):
  - It is a dry run by default and prints a per-account report. `--apply` does the work.
  - For each account, in one transaction: it deletes the account's movimientos except `GUIDE_CREATED`, resets `points` and `level`, and replays through `PointLedger` in date order:
    - published signed contributions;
    - valid «Me sirvió»;
    - pioneer bonuses;
    - confirmed reportes.
  - Sanctions are not replayed: past freezes are not reconstructed.
  - Content hidden while moderation reviews it (`HIDDEN`) keeps its contribution points, as live; its «Me sirvió» are not replayed, as a hidden material earns none.
- Running `--apply` on the development database needs the user's consent, as any destructive data step does. The e2e and migration test databases run it freely.
- `seed.ts` creates points through `PointLedger`, so demo accounts match the rules.

### Public profile
`GET /users/:id` returns the nivel computed from the points, never the exact total: a jump of 2 when a reporte is confirmed would tell a retired author who reported them, and §8 shows only the nivel publicly.

### Progress API and UI
`GET /me/progress` (authenticated) returns:

```
{ level, levelName, points, displayPoints,
  next: { level, name, threshold, missing, unlocks } | null,
  movements: [{ reason, amount, createdAt, reversal, subject: { type, title } | null }] }
```

`movements` holds the last 20.
- `subject` is the student's own contribution: the material's title, or «Reseña de <materia>». It is null for `REPORT_CONFIRMED`, so the content stays unnamed.
- `HELPFUL_RECEIVED` rows carry the material, never the giver.

Frontend:
- **`/mi-espacio/progreso`:** built after the canvas `p_progreso` (level card with bar, «Al llegar a Nv. N se desbloquea», movements list). It is added to the account menu as «Tu progreso».
- **`/puntos`:** a static «Cómo funcionan los puntos» page after `generar_ayuda.py`, linked from «Tu progreso» and from the anonymity notice.
- **Forms:** the reseña and experiencia forms show «Las publicaciones anónimas no suman puntos» when anonymous is selected. In edit mode the choice is shown disabled.

## Risks / Trade-offs

- **[The author row lock serializes awards per author]** → Awards are short. Contention only matters for a very popular material, and correctness of caps needs it.
- **[Caps keyed on local midnight and calendar month need a fixed time zone]** → `America/Argentina/Jujuy`, as a constant.
- **[The rebuild drops every account's points at once]** → Intended (§9.3): the new levels table lands together with it, so a lower level says nothing about anonymous reseñas.
- **[Pioneer «earliest ever published» needs the publication history]** → `createdAt` among materials whose status is or was `PUBLISHED`. That is `PUBLISHED` or `REMOVED`, which excludes revisión-previa rejections.
- **[Locking anonymity on edit is a product change]** → Delete-and-publish covers the rare case, and the form explains the choice.
- **[The REPORT_CONFIRMED cap is read as 10 points per week]** → §3.1 says «hasta 10 por semana»; 10 points is the conservative reading. Tunable as a constant.

## Migration Plan

1. Deploy the schema migration, the code and the new levels table together.
2. Run `rebuild-points.ts` as a dry run, review the report, then run it with `--apply`.
3. The rebuild is part of the deployment: legacy reversals (`*_REVERTED`) are not linked to what they reversed until it runs.
4. Rollback: there is no down migration; the previous build cannot write to the enum and key columns. Restore the database backup taken before step 1 and redeploy the previous build. There is only development and demo data today.

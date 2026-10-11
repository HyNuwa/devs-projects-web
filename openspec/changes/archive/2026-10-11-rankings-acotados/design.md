## Context

- **Movimientos:** `PointTransaction` holds every movimiento (`reason`, `referenceId`, `amount`, `createdAt`, with reversals as negative rows). The `referenceId` points to the contribution each reason is about:

  | Reason | `referenceId` | Materia comes from |
  |---|---|---|
  | `MATERIAL_PUBLISHED` | material id | the material |
  | `HELPFUL_RECEIVED` | `<materialId>:<giverId>` | the material |
  | `MATERIAL_PIONEER` | `<subjectId>:<type>:<materialId>` | the first segment |
  | `COURSE_REVIEWED` | review id | the review |
  | `EXAM_EXPERIENCE_SHARED` | experience id | the experience |
  | `REPORT_CONFIRMED` | `<caseId>:<reporterId>` | the case's target |
  | `CORRECTION_ACCEPTED` | suggestion id | the suggestion's material |
  | `GUIDE_CREATED`, `LEGACY_ADJUSTMENT` | — | none |

- **Materias and carreras:** `StudyPlanSubject` links a materia to plans, and plans to carreras.
- **Sanctions:** `isSanctioned(account, now)` in `point-ledger.ts` decides an active sanción. `isBanned` with `bannedUntil` null is a permanent suspensión.
- **The switch:** `ProfileCustomization.showLevelAndBadges` (3c-1). A missing row means `true`.
- **Valid «Me sirvió»:** `isValidHelpful` (`helpful-validity.ts`). `badge-calendar.ts` defines the cuatrimestres: March–July, then August to February.
- **Public routes** never populate `req.user`, so a signed-in variant needs its own authenticated route.
- **Legacy:** the current `/ranking` page renders the legacy `RankCard`, `RankingList` and `LevelsTable`. `ranking.service.ts` has the global, weekly and monthly-by-total queries, plus `getUserRank` and `getLevelInfo`.

## Goals / Non-Goals

**Goals:**
- One attribution function from movimientos to materias, unit-tested.
- Exclusions applied on the server, so no endpoint ever returns a hidden or excluded account.
- Small, cacheable queries. The data is one facultad today.

**Non-Goals:**
- Past months or history.
- Caching or materialized views. Revisit them when data grows.
- Rankings by facultad by points.
- Notifications.

## Decisions

### Attribution: `ranking/attribution.ts`

- `materiaOf(movimientos)` resolves each `(reason, referenceId)` to a `subjectId`, batched:
  - the materia segment is read directly for the pioneer bonus;
  - one `findMany` each for materials, reviews, experiences, cases and suggestions;
  - case targets go through their material, review or experience.
- `careersOf(subjectIds)` maps each materia to the set of carreras with a plan that includes it, through `StudyPlanSubject` → `StudyPlan.careerId`.
- The monthly ranking for carrera C:
  1. load the month's movimientos, `createdAt ∈ [startOfLocalMonth, startOfNextLocalMonth)`;
  2. keep those whose materia belongs to C;
  3. sum `amount` per user;
  4. keep sums above 0;
  5. drop excluded accounts;
  6. order by points desc, then display name;
  7. assign competition ranks.

  It reuses `startOfLocalMonth` from `point-ledger.ts`, exported. Step 1 skips `REPORT_CONFIRMED` and `CORRECTION_ACCEPTED`: their +2 lands right when the author sees the retiro or the change, so a jump would reveal who reported or suggested. The perfil público hides exact points for the same reason.
- **The materia is the current one:** if a correction later moves a material, its past points move with it. That is consistent with «the carrera of the materia of the contribution», and simpler than snapshotting.

### Exclusions: `ranking/exclusions.ts`

- **`hiddenAccounts(ids)`:** the accounts with `showLevelAndBadges = false`. Used by both rankings.
- **Monthly:** also drops accounts with a `MUTE` or `SUSPENSION` in force at `startOfLocalMonth(now)`, read from `Sanction` (started by then, and not ended, lifted or voided by then). Judging at the month start keeps the list fixed for the month, so a sanción applied, lifted or voided mid-month is never revealed. A sanctioned account cannot earn points anyway (`PointLedger.award`).
- **Leyendas:** also drops `isBanned && bannedUntil === null && no lift`, the permanent suspensiones.

Excluded accounts take no place, so the next one moves up. «Tu posición» is computed on the same filtered list, so a hidden or sanctioned viewer gets `null`.

### Leyendas

- **The query:** `user.findMany` where `maxLevel >= 10` and some `studyPlans` has `status in (ACTIVE, COMPLETED)` and `studyPlan.career.facultyId = F`.
- **Then:** the exclusions apply, and the list is ordered by `displayName ?? username` with `Intl.Collator('es')`.
- **No limit:** it is a short list by design. It returns at most 200, and the page says so if it is cut.

### The materia top

- **The rows:** `MaterialHelpfulness` with `createdAt` in the current cuatrimestre, joined to published, not-deleted materials of the materia and to the giver's validity fields.
- **The rule:** `isValidHelpful` is applied in TS, as the ledger does.
- **The result:** counted per material, top 10 by count desc and then title, with competition ranks.
- **The calendar:** `semesterRange(now)` is added next to `semesterOf` in `badge-calendar.ts`, with unit tests.

### Endpoints

| Route | Auth | Returns |
|---|---|---|
| `GET /ranking/monthly?careerId=` | public | `{ career, month: 'YYYY-MM', entries: [{ rank, username, displayName, level, points }] }`. Without `careerId`, the first carrera by name. |
| `GET /ranking/monthly/me?careerId=` | signed in | `{ careerId, defaultCareerId, me: { rank, points } \| null }`. `defaultCareerId` is the viewer's active plan's carrera; `me` is null when absent, hidden or sanctioned. |
| `GET /ranking/legends?facultyId=` | public | `{ faculty, entries: [{ username, displayName }] }`. Without `facultyId`, the first facultad by name. |
| `GET /ranking/legends/me` | signed in | `{ defaultFacultyId }`, from the viewer's active or finished plans. |
| `GET /subjects/:code/top-materials` | public | `{ semester: { year, half }, entries: [{ rank, material: { id, title, resourceType, fileType, academicYear, createdAt }, helpful }] }` |
| `GET /ranking/levels` | public | kept |

The old `GET /ranking?period=`, `/ranking/top` and `/ranking/me` are removed, with their service methods and spec, and `ranking.service.ts` is rewritten around the functions above. `level` in the entries is the current nivel computed from points, as in the perfil público.

### Frontend

- **`(site)/ranking/page.tsx`** renders a new `RankingPage`:
  - tabs synced to `?tab=mes|leyendas`;
  - a carrera select from `GET /institutions`, defaulting to `defaultCareerId` when signed in;
  - a universidad and facultad select for Leyendas;
  - entries with `AuthorLink`, rank badges and «Nv. N».
- **«Tu posición»:** shown below the top 10 when `me.rank > 10`.
- **States:** empty, «Todavía nadie sumó puntos este mes en esta carrera», and errors.
- **`SubjectHub`:** a «Más útiles este cuatrimestre» list in the materials tab, opening `MaterialPreviewDialog`, hidden when empty.
- **«Tu progreso»:** gets a «Ver rankings» link.
- **Removed:** the legacy `RankCard`, `RankingList`, `LevelsTable`, `types/ranking.ts` and `lib/ranking-client` (or equivalents), with their tests.

## Risks / Trade-offs

- **Query cost:** the monthly ranking reads every movimiento of the month for a carrera. That is fine at one facultad's volume. Revisit with a materialized aggregate if it grows.
- **The materia can move:** a correction that moves a material moves its past points between carreras. This is accepted and documented. The pioneer bonus does not move: its reference names the materia, and a correction reverts it there and re-awards it under the new one.
- **Deleted reseñas and experiencias:** they are hard-deleted, so the reversal written on deletion resolves to no materia and lowers no carrera. Deleting on the 1st a reseña awarded on the 31st and publishing it again gains 5 in the new month. This is accepted at today's volume; the real fix is storing the materia on each movimiento (a migration) or soft-deleting those contributions.
- **Malformed references:** ids that are not uuids resolve to no materia instead of failing the query.
- **Legends by name, not by achievement date:** the date nivel 10 was first reached is not stored. Alphabetical order avoids implying a race.
- **Removing endpoints:** no current redesigned page uses them. The legacy page goes in this change, ahead of the cleanup plan.

## Migration Plan

None. Code only. Rollback is reverting the commit.

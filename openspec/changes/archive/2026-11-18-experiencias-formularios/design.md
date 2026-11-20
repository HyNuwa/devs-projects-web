## Context

Change 5 (`experiencias-lectura`) built the reading side of Experiencias from fields already stored, and its summary explicitly withheld nota de promoción, preparación típica and the mesa's professors and duration. The writing side still uses `ReviewForm` and `ExamForm` (`components/subjects`), single-page React Hook Form + Zod forms with «Tu cursada / Recomendación y relato / Contexto opcional» sections. The canvases (`design/canvas/experiencias/generar_experiencias.py:562–657`, mobile in `design/canvas/estados/generar_movil2.py:162`) show numbered sections with an «Así se va a ver» preview.

Relevant facts in the code:
- `CourseReview` and `ExamExperience` (`prisma/schema.prisma:482`, `:518`) already have nullable `difficultyTheory` and `difficultyPractice` on finals. The write mapping in `subjects.service.ts:124–153` neither accepts nor writes them, and so preserves them on update.
- PUT reuses the full create DTO, so an edit already requires every mandatory field. `ReviewForm` already flags legacy reseñas missing required facts (`ReviewForm.tsx:184`).
- Anonymity is stripped from edit data (`withoutAnonymity`, `subjects.service.ts:721`).
- The summary (`discovery.service.ts:285`, `experiences-summary.ts`) is built from `groupBy` and `aggregate` calls plus pure threshold functions.
- `publicVisibilitySql` (`modules/moderation/visibility.ts:51`) is the raw-SQL twin of the public filter.
- The badge «Contexto completo» (`ranking/badges/badge-catalog.ts:333–339`) checks `condition`, while its spec names situación de cursada (`attempt`).

## Goals / Non-Goals

**Goals:**
- Rebuild both forms as the canvas layout, collect the new facts, and make the final's outcome and grade rule strict for new writes and edits.
- Show the new facts on cards, details and the materia summary under the mínimo de muestra.
- Keep every legacy row valid and untouched, with no backfill.

**Non-Goals:**
- Points, insignia rules other than the «Contexto completo» fix, «Mismo contexto».
- A saved anonymity default.
- Drafts that survive a reload.
- A topic catalog or topic moderation beyond reporting the entry.

## Decisions

### Data model: additive nullable columns, topics as `text[]`

The migration adds:
- `course_reviews.promotion_grade smallint`;
- `exam_experiences.board_size smallint`, `duration_minutes smallint`, `prep_lead_days smallint` and `prep_daily_minutes smallint`;
- `exam_experiences.topics text[] NOT NULL DEFAULT '{}'`.

There are no new constraints at the database level beyond the types, matching the existing style where ranges live in DTOs.

Topics are stored as a Postgres array, not a join table. They are always read together with their final, at most ten per final, and the only aggregate (topics in two or more finales) is one `unnest` query. A `Topic` table would need lifecycle and orphan rules nobody asked for.

Normalization happens on write:
- trim, collapse internal whitespace, cap at 60 characters;
- drop entries under 2 characters (rejected, not silently dropped);
- dedupe by `lower(collapsed)` keeping the first spelling.

The stored value keeps the author's casing.

*Alternative rejected:* storing preparation as a single «total hours» number. The canvas asks two questions and the summary shows two medians; the total is a display estimate only.

### Units

- **Preparation lead time:** stored in days. The form offers días / semanas / meses with a number; semanas ×7 and meses ×30. The display converts back to the largest whole unit: «3 semanas», «2 meses», «5 días».
- **Time per day:** stored in minutes, with a stepper in half hours.
- **Exam time:** stored in minutes, entered as hours + minutes, displayed «3 horas», «1 h 30 min», «45 min».
- **Total estimate:** `round(lead_days × daily_minutes / 60)` hours, shown as «Unas N horas de estudio en total» only when both exist.

### Write contract

`CreateExamExperienceDto` changes:
- `outcome` becomes required (`@IsIn([...])`).
- `grade` is required when the outcome is APROBADO or DESAPROBADO and forbidden with PREFIERO_NO_DECIR, using the existing `community-write.validators.ts` style.
- New optional fields: `difficultyTheory` and `difficultyPractice` (int 1–5), `boardSize` (int 1–10), `durationMinutes` (int 10–480), `prepLeadDays` (int 1–365), `prepDailyMinutes` (int 30–960, multiple of 30), and `topics` (array ≤ 10 of strings, normalized then length-checked 2–60).
- `examDate`, `shift` and `difficulty` are removed from the exam DTO. The global pipe runs with `whitelist` and `forbidNonWhitelisted` (`config/configure-app.ts:36`), so a request that sends them gets 400. The service no longer writes them, so an update leaves legacy values intact, the same mechanism that already preserves theory/practice today.

`CreateCourseReviewDto` adds `promotionGrade` (int 1–10, optional), with a validator that refuses it unless `condition === PROMO`. The frontend clears the field when the condition changes, so a well-behaved client never trips it.

This is a breaking change to `POST/PUT /subjects/:code/exams` (outcome now required). The only client is this frontend, and both ship together.

### Reading contract

- **Discovery items:** `experience-items.ts` selects and maps the new columns into the review and exam DTOs and the frontend Zod schemas. Topics go only into the exam detail DTO, not the list item, since cards never show them.
- **Summary:**
  - `getSubjectExperiencesSummary` adds `groupBy` calls over `promotionGrade`, `boardSize` and `durationMinutes` (the last two filtered to the mesa más comentada's `session`), and over `prepLeadDays` and `prepDailyMinutes`. Each returns value→count rows, small because the domains are bounded.
  - Pure functions in `experiences-summary.ts` compute averages and medians from those distributions and apply the thresholds (5 for averages of grades, 3 for medians). The median of an even count is the lower middle value, so it is always a value someone declared.
  - The mesa sentence needs the mesa más comentada first, so those two `groupBy` calls run after the session groups resolve.
- **Temas que más toman:**
  - One raw query: `SELECT min(t) AS topic, count(DISTINCT e.id) AS n FROM exam_experiences e, unnest(e.topics) t WHERE e.subject_id = $1 AND <publicVisibilitySql> GROUP BY lower(t) HAVING count(DISTINCT e.id) >= 2 ORDER BY n DESC, lower(min(t)) LIMIT $limit`. It aliases the table `m` to reuse `publicVisibilitySql`.
  - Normalization on write makes `lower(t)` a sufficient key.
  - The same query with limit 5 feeds the summary, and with limit 20 feeds the new public `GET /discovery/subjects/:code/exam-topics` (404 on unknown code). The form filters out already-added topics client-side.
- **Overview card for «Solo finales»:** `kind=exams` drops `topDifficulty` and adds `theory` and `practice` averages, from an `_avg`/`_count` aggregate per top-six subject, threshold 3. Mixed and reseña-only views keep `topDifficulty`, computed from reseñas only as change 5 left it.

### Frontend forms

- **Structure:**
  - `components/experiences/forms/` holds `ReviewForm` and `ExamForm`, rebuilt on the existing React Hook Form + Zod stack, plus their shared pieces: `FormSection` (numbered heading with an Obligatorio/Opcional tag), `PublicationSection`, `ExperiencePreview` and `TopicsInput`.
  - The routes keep their files and import the new components.
  - The old `components/subjects/ReviewForm.tsx` and `ExamForm.tsx` are deleted with their tests rewritten, not kept side by side.
- **Preview:** `ExperiencePreview` renders the same fact components the detail uses (`components/experiences/facts.tsx`) from `watch()` values. It renders at `lg` and up only, so there is one source of truth for how facts read.
- **Draft across «Cambiar»:**
  - The form writes its values to `sessionStorage` under `experience-draft` (one slot) before navigating to `/experiencias/escribir?tipo=<type>&materia=<código>&desde=formulario`.
  - The chooser preselects from those params.
  - The form it continues to reads the slot on mount, keeping the fields that exist in its type; the narrative is shared.
  - The slot is cleared on successful publish and on «Cancelar».
  - Reads and writes are wrapped in try/catch, so storage unavailability only loses the draft.
- **After publishing:**
  - On a `PUBLISHED` outcome the form navigates to `/resenas/<id>` or `/finales/<id>` with `?publicada=1`. `CommunityDetailPage` shows the «Publicada» toast once and strips the param with `router.replace`.
  - On `PENDING_REVIEW` the current `PriorReviewNotice` path is unchanged.
- **Mobile:**
  - Below `lg`, one column, no preview.
  - A sticky bottom bar holds the submit button, using the safe-area inset like the bottom navigation.
  - The forms live in the `(focus)` group, so no bottom navigation competes with it.
- **Legacy edit:** the existing «datos incompletos» banner gains the final's outcome and grade. Older finals with date, franja or verbal dificultad show nothing for them in the form, and the PUT payload never includes them.

### Insignia fix

«Contexto completo» switches its `condition` check to `attempt` being one of the three real situations, excluding `PREFIERO_NO_RESPONDER`, as the spec says. Insignias are evaluated on read, so no backfill is needed. Some users may gain or lose progress. That is accepted, because the code was wrong against the spec.

## Risks / Trade-offs

- **Outcome now required:** older API callers break. There are none outside this repo. The frontend and backend deploy together.
- **Topics stored per final with free text:** misspellings fragment the suggestions («Integrales doble»). This is accepted, because the threshold of two finales already hides one-offs, and a catalog is out of scope.
- **The summary query count grows by about six `groupBy` calls plus one raw query.** All are indexed on `subject_id` and bounded by one materia. There is still no cache, as change 5 decided.
- **sessionStorage draft:** it is lost on reload or in a new tab. This is accepted: the canvas only promises the draft survives «Cambiar».
- **«Contexto completo» semantics change:** a user's displayed progress may shift once. This is accepted and called out in the PR.

## Migration Plan

1. Add the Prisma migration `experiencias_formularios` (additive columns, `topics` default `'{}'`). It needs no backfill, and old rows read as «not declared».
2. Deploy the backend and frontend together.
3. Rollback: revert the code. The extra columns are harmless to the old code, which never selects them.

## Open Questions

None. The grilling settled Q1–Q21, recorded in the proposal.

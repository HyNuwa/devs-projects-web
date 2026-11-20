## Context

See proposal.md for the why. State of the code after change 4c (verified on `feature/experiencias`, HEAD d0bfa2e):

- **Schema:** `Subject.facultyId` is direct. A materia's carrera and año come from `StudyPlanSubject` (`year` and `semester` nullable, both null for an optativa; `semester` 0 anual, 1, 2) through `StudyPlan`, one plan per carrera (`@@unique([careerId])`). `CourseReview` has `academicYear`, `shift`, `condition` (`PROMO`, `REGULAR`, `LIBRE`, `PREFIERO_NO_RESPONDER`), `attempt`, `professorId` or `professorName`, `difficulty`, `recommendation`, `isAnonymous`, `publicationStatus`, `createdAt`. `ExamExperience` has `year`, `session` (`NO_RECUERDO` included), `format` (required), `examDate`, `shift`, `professorId` or `examinerName`, `difficulty`, `difficultyTheory`, `difficultyPractice`, `outcome` (`APROBADO`, `DESAPROBADO`, `PREFIERO_NO_DECIR`), `grade`. Indexes exist on `(subjectId)`, `(subjectId, academicYear, createdAt)`, `(publicationStatus, createdAt)` and the per-filter ones. No cuatrimestre is stored on an entry.
- **Backend `modules/discovery`:** `GET /discovery/suggestions` (`q`, `facultyId`, returns `subjects` and `materials`), `GET /discovery/course-reviews` (filters `subjectId`, `academicYear`, `professorId`, `difficulty`, `attempt`; sorts `RECENT`, `STARS_ASC`, `STARS_DESC`; 360-character excerpt; aggregate average and count), `GET /discovery/exam-experiences` (filters `subjectId`, `year`, `session`, `professorId`, `format`, `outcome`; order `examDate desc nulls last, createdAt desc`), and both details. Public visibility comes from `publicVisibility(now)` in `moderation/visibility`. `DiscoveryPublicAuthorDto` is `{ username }`, `Anónimo` for anonymous entries. `subjects.service.getReviews` still returns a `conditionBreakdown` for the hub, and `renamedCode` resolves old materia codes. `users/public-profile.service.ts` already exposes `avatarUrl` and `avatarCat` publicly.
- **Frontend:** `app/(site)/resenas`, `/finales` and their `[id]`; `app/(focus)/materias/[codigo]/resenar` and `/final`; the `(focus)` route group is the header without the bottom bar. `components/community/`: `CourseReviewDiscoveryPage` and `ExamExperienceDiscoveryPage` (URL state through `lib/course-review-discovery-state.ts` and `lib/exam-experience-discovery-state.ts`), `CommunitySummaryCards` (`CourseReviewSummaryCard`, `FinalExperienceSummaryCard`, `StarRecommendation`, `CommunityFactList`), `CommunityDetailPage` (Compartir, Reportar with `components/moderation/ReportDialog`). `components/subjects/SubjectHub.tsx` keeps its tabs in state, not in the URL, and resolves the breadcrumb carrera with `trailPlacement`. `lib/discovery-client.ts` holds the zod schemas, serializers and fetchers. `components/layout/navigation.ts` declares destinations with `match` patterns; `stores/ubicacionStore.ts` keeps the Ubicación (`facultyId`, short names) in `localStorage` and `components/layout/UbicacionChip.tsx` opens the selector. `components/layout/account.ts` has `avatarSrc`. There is no relative-time helper. Canvas assets live in `design/canvas/home/project/`; the app serves `public/assets/` and `public/avatars/`.
- **Specs in force:** `frontend/visual-identity` (tokens, Figtree, 1.5px navy outlines, cream page), `frontend/app-shell` (bottom bar Inicio · Materias · Subir · Experiencias), `academic-community/discovery`, `academic-structure/browsing` (Ubicación).

## Goals / Non-Goals

**Goals:**
- A landing and a materia page that only ever show facts the platform stores, with the mínimo de muestra applied in one place.
- One experiencia card and one summary computation shared by every view, so the numbers never disagree.
- No migration, so 5b can add its fields on a clean base.

**Non-Goals:**
- The step-by-step forms and new fields (5b); «Tus materias»; «Me sirvió» on experiencias; caching; an academic calendar; text search inside experiencias; removing the legacy `GET /subjects/:code/reviews` and `/exams` endpoints (change 8).

## Decisions

### Landing scope and URL state
- The facultad comes from `useUbicacionStore` and never enters the URL. `carrera`, `anio` and `tipo` (`resenas` | `finales`, absent for both) live in the URL through a new `lib/experiences-landing-state.ts` with `parse`/`toHref`, the same pattern as `course-review-discovery-state.ts`.
- An explicit «Todas las carreras» serializes as `carrera=todas` (`allCareers` in the parsed state), distinct from the implicit default; the profile preselect applies only without both. Changing the Ubicación's facultad clears `carrera`/`anio` but keeps `tipo`.
- The carrera chips are the published carreras of the facultad, from the existing browse endpoint; the año chips go from 1 to the highest placement año of the chosen carrera (or of all the facultad's carreras); the browse `years` figure is that maximum non-null `StudyPlanSubject.year`, null when every placement is an optativa — not `StudyPlan.duration`.
- The signed-in default carrera is `firstCareerCursando(myCareers)` when its facultad is the Ubicación's.
- Without an Ubicación the overview is requested without `facultyId`; the panel shows the invitation that `UbicacionChip` already renders, and no carrera or año chips.
- **Alternative rejected:** facultad in the URL. The browsing spec keeps the Ubicación device-side, and the landing is a starting page, not a search result.

### Backend: three reads in `discovery`, computed per request
No new tables, no cache. All reads use `publicVisibility(now)`.

- **`GET /discovery/experiences/overview?facultyId&careerId&year&kind`** (`kind`: `reviews` | `exams`, absent for both). Response:
  ```
  {
    scope: { facultyId, careerId, year, kind },
    mostCommented: {
      window: 'LAST_120_DAYS' | 'ALL_TIME',
      items: [{
        subject: { id, code, name },
        placement: { careerId, careerName, year, semester } | null,
        total, recentCount, latestAt,
        promotion: { percent | null, promoted, answered },
        approval: { percent | null, approved, answered },
        topDifficulty: CommunityDifficulty | null
      }]
    },
    recent: [{ kind: 'review', review: DiscoveryCourseReviewDto } | { kind: 'exam', exam: DiscoveryExamExperienceDto }]
  }
  ```
  Queries: `courseReview.groupBy({ by: ['subjectId'], where: { ...public, createdAt >= now − 120 d, subject: { facultyId, studyPlans: { some: { year, studyPlan: { careerId } } } } }, _count })` and the same on `examExperience`; merge the counts in memory, keep subjects with ≥ 3; if none, repeat without the date bound and report `ALL_TIME`. All-time totals for the candidates come from one more `groupBy` pair with `subjectId: { in }`. Order by recent count, total, name; take 6. For those 6: `groupBy(['subjectId', 'condition'])`, `groupBy(['subjectId', 'difficulty'])`, `groupBy(['subjectId', 'outcome'])`, `_max(createdAt)` per subject, and the subjects with their `studyPlans` and careers for the placement label (the active carrera, else the first by name). `recent` is `findMany` of 6 reviews and 6 exams with the same scope, merged by `createdAt desc`, sliced to 6. `kind` drops the other type from every count.
  The scope filter on `year` matches a placement `year` in the chosen carrera or in any carrera of the facultad; optativas (`year null`) never match it.
- **`GET /discovery/subjects/:code/experiences-summary`**, 404 for an unknown code (the page redirects old codes before asking). Response:
  ```
  {
    subject: { id, code, name },
    reviews: {
      count,
      recommendation: { average | null, count },
      results: { answered, unanswered, promo, regular, libre, percents: { promo, regular, libre } | null },
      difficulty: { answered, unanswered, counts: { MUY_BAJA, BAJA, MEDIA, ALTA, MUY_ALTA }, top | null }
    },
    exams: {
      count,
      outcomes: { answered, undeclared, aprobado, desaprobado, percent | null },
      formats: { counts: { ESCRITO, ORAL, MIXTO }, top | null },
      theory: { average | null, count },
      practice: { average | null, count },
      topSession: { session, count } | null,
      grade: { average | null, count }
    }
  }
  ```
  One `groupBy` per dimension plus `aggregate` for the averages (grade only where `outcome in [APROBADO, DESAPROBADO]`). The mínimo de muestra is applied here, in `experiences-summary.ts` with the constants `MIN_FOR_PERCENT = 5`, `MIN_FOR_TOP = 3`, `MIN_FOR_AVERAGE = 3`, `MIN_FOR_GRADE = 5`: below a minimum the figure is `null` and the counts stay, so the hub card, the materia page and the detail panels cannot disagree. The overview reuses the same functions for its cards.
- **`GET /discovery/course-reviews/:id/related`** and **`GET /discovery/exam-experiences/:id/related`**, 404 when the entry is not public. Response `{ sharedContext, items }`: for a review, `sharedContext` is `{ professor: { id, name } | { name }, shift }` with only the facts the review declared (`professorId` matches by id; a manual `professorName` matches the same trimmed, case-insensitive name; `shift` other than `NO_INDICO`), and `null` with empty `items` when it declared neither; for an exam, `{ session, format }` with `session` only when it is not `NO_RECUERDO` (format is required, so an exam always has a context). `items` are up to 3 other public entries of the same materia, most recent first, as the list DTOs.
- **`shift` and `condition`** join `DiscoveryCourseReviewsQueryDto` as optional enum filters; the `/resenas` page does not expose them.
- **`DiscoveryPublicAuthorDto`** gains `id`, `avatarUrl` and `avatarCat` for named authors, the same facts the perfil público exposes; anonymous entries stay `{ username: 'Anónimo' }`.
- **Alternative rejected:** a new `experiences` module. It would duplicate the public selects, visibility and author DTOs that live in `discovery`.
- **Alternative rejected:** raw SQL. Prisma `groupBy` accepts relation filters in `where`, and the scopes are facultad-sized; raw SQL only if a measurement says so.

### Frontend layout
New code lives in `components/experiences/`:
- `ExperiencesLanding.tsx` (page composition, one `getExperiencesOverview` call, error and retry for the two data sections), `LandingContext.tsx` (facultad chip, carrera, año and type chips), `SubjectSearch.tsx` (hero search and the one in the chooser, on `getGroupedSuggestions(...).subjects`), `MostCommentedSubjects.tsx`, `RecentExperiences.tsx`, `HowToRead.tsx`, `YourTurn.tsx`.
- `SubjectExperiencesPage.tsx`, `SubjectSummary.tsx` (figures, bars, histogram, «El final»), `ExperienceTabs.tsx` (tabs, filters, sort, «Ver más»; URL state in `lib/subject-experiences-state.ts` with `tab`, the per-type filters and `sort`).
- `ExperienceCard.tsx` (both kinds), `AnonymousMark.tsx`, `StarRecommendation` and `CommunityFactList` moved here from `CommunitySummaryCards.tsx`, which is deleted once `/resenas` and `/finales` use the new card.
- `SubjectAccordingPanel.tsx` («La materia según N …») and `SameContextPanel.tsx`, mounted by `CommunityDetailPage`.
- `WriteExperienceMenu.tsx` (two-option menu for a known materia) and `WriteExperienceChooser.tsx` (the `/experiencias/escribir` screen).
- `SubjectExperiencesSummaryCard.tsx` for the hub.
- `lib/experiences-client.ts` with the zod schemas and fetchers for the three reads, and `lib/relative-time.ts` (`formatRelativeTime(date, now)` on `Intl.RelativeTimeFormat('es')`, «hace 2 días»); the detail keeps its full date.

Routes: `app/(site)/experiencias/page.tsx`, `app/(site)/experiencias/[codigo]/page.tsx` (calls `redirectOldSubjectCode` like the hub page, then renders the page in a `Suspense`), `app/(focus)/experiencias/escribir/page.tsx`. The sections that depend on the Ubicación render on the client, as the discovery pages do today.

### Navigation and shell
- `navigation.ts`: Experiencias `href: '/experiencias'`, `match` adds `/experiencias` and `/experiencias/**`; the footer reads the same destination.
- `/experiencias/escribir` is a focus screen by living under `(focus)`.
- `SubjectHub`: the reviews and exams tabs go; `SubjectExperiencesSummaryCard` takes their place with the summary endpoint; the materials tab and the write buttons stay. `GET /subjects/:code/reviews` and `/exams` stay in the backend untouched (change 8 removes them).

### Card, anonymity and reporting
- `ExperienceCard` renders the author with `avatarSrc` when `author.id` is present, else `AnonymousMark` (lucide `VenetianMask` in a neutral circle with the navy outline, `aria-hidden`, next to the text «Anónimo»); `CommunityDetailPage` switches to the same mark.
- Chips: reseña → «Ciclo YYYY», franja, professor, situación; final → «Mesa de <período> <año>» (or «Final <año>» for `NO_RECUERDO`), formato, professor; then the resultado or outcome chip (with the grade when declared) and «Dificultad <nivel>».
- «Reportar» on the card opens `ReportDialog` with the same arguments the detail passes.
- «Leer completa» replaces «Leer más» everywhere, including the discovery page tests.

### Summary presentation
- Percentages, modes and averages come from the API already thresholded; the UI only decides the wording («2 de 3 promocionaron» when `percents` is null, «la informaron 9 de 11» next to an average).
- The eyebrow «1° año · 2° cuatrimestre» / «Anual» / «Optativa» and the breadcrumb carrera use `trailPlacement` with the materia's placements, as the hub does.
- Hidden until 5b: nota de promoción, preparación típica, number of professors and duration in the mesa sentence, which reads «La mesa más comentada es diciembre (9). Nota promedio: 6,4.» when both pass their minimum, and drops the part that does not.

### Mobile
- Landing: one column; the chip rows are `overflow-x-auto` with no wrap; «Materias más comentadas» is `grid-cols-2` with compact cards (code, name, total, one figure); the rest stacks.
- Materia page: the four figures in `grid-cols-2`; filters as chips in a scrollable row; the «Escribir» button opens the two-option menu. The existing bottom bar stays.

### Testing
- Backend, Vitest e2e in `apps/backend/test/experiences-overview.e2e.test.ts`, `experiences-summary.e2e.test.ts` and `experiences-related.e2e.test.ts`, seeding two facultades, carreras with placements (one optativa), reviews and exams with mixed visibility, anonymity and dates; unit tests for `experiences-summary.ts` (thresholds, rounding, excluded values) and for the related-context keys.
- Frontend, Vitest with the clients mocked: `ExperiencesLanding` (context, URL state, signed-in default, empty and error states, «Buscar en todas»), `SubjectExperiencesPage` (summary wording under each minimum, tabs, filters, «Ver más», empty materia), `ExperienceCard` (both kinds, anonymous mark, no fabricated facts), detail panels, chooser and menu, `SubjectHub` summary card, `navigation.test.ts`, and the two list pages with the new card.
- Suites run through a Haiku subagent with logs in `.audit-logs/`, per AGENTS.md.

## Risks / Trade-offs

- **[Aggregates computed on every request]** → Scopes are one facultad and the existing `(subjectId, …, createdAt)` and `(publicationStatus, createdAt)` indexes serve the group-bys; volumes are in the thousands. If a measurement shows otherwise, a `(subjectId, createdAt)` index or a 60-second cache is a later change.
- **[Author id and avatar on public cards]** → Already public on the perfil público; anonymous entries carry neither, and the mark is shared, so nothing links anonymous entries.
- **[Replacing two cards with one]** → `/resenas` and `/finales` tests change with them; the structure of those pages does not.
- **[Relative times and hydration]** → Cards render after a client fetch with one `now` per render, so server and client never disagree.
- **[Percentages hidden under the minimum may read as missing data]** → The counts always show («2 de 3»), and the summary states how many answered.

## Migration Plan

- No database migration. Deploy copies `hero-experiencias.png` and `gato-escribe.png` from the canvas into `public/assets/`. No new environment variables.
- Rollback is a code revert: the new endpoints have no consumers outside this change.

## Open Questions

None. Every decision came from the grilling session (rounds 1 to 3).

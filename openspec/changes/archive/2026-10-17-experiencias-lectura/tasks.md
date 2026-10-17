## 1. Backend reads

- [x] 1.1 Write Vitest unit tests for `experiences-summary.ts`:
  - percentages are null under 5 answers and present from 5, each with its counts;
  - `top` (dificultad, formato, período) is null under 3 answers; «no recuerdo» never wins the período;
  - theory and practice averages need 3, the grade average needs 5 and only counts finales with `APROBADO` or `DESAPROBADO`;
  - the recomendación average shows from 1 review with its count;
  - `PREFIERO_NO_RESPONDER` and `PREFIERO_NO_DECIR` count as unanswered.

  Implement the pure functions and constants. Verify the tests pass.
- [x] 1.2 Write e2e tests for `GET /discovery/subjects/:code/experiences-summary`:
  - the response matches design.md for a materia with mixed reviews and exams, anonymous ones included;
  - hidden, pending and deleted entries are not counted;
  - an unknown code gives 404;
  - the figures equal those the overview returns for the same materia.

  Implement the service method, DTOs and controller route. Verify the tests pass.
- [x] 1.3 Write e2e tests for `GET /discovery/experiences/overview`:
  - with `facultyId`, only that facultad's materias appear, ordered by the 120-day count, then total, then name, at most 6, each with ≥ 3 in the window;
  - `careerId` and `year` narrow the materias through their placements, and an optativa never matches a `year`;
  - `kind=exams` drops reviews from every count and the cards carry `approval` figures;
  - when no materia reaches 3 in the window the response says `ALL_TIME` and ranks by totals;
  - the card placement names the active carrera, else the first by name;
  - `recent` interleaves 6 entries by `createdAt` with their kind, honouring the scope;
  - without `facultyId` every facultad counts;
  - an invalid `kind` or `year` gives 400.

  Implement it with the group-by plan from design.md. Verify the tests pass.
- [x] 1.4 Write e2e tests for the related endpoints:
  - a review with professor and franja returns up to 3 other public reviews of the materia with both, any ciclo, most recent first, and `sharedContext` names them;
  - a review with only a manual `professorName` matches the same name case-insensitively;
  - a review with neither returns `sharedContext: null` and no items;
  - an exam with `NO_RECUERDO` matches by format only; one with a período matches both;
  - the entry itself and non-public entries are excluded; a non-public entry gives 404.

  Implement both routes. Verify the tests pass.
- [x] 1.5 Extend the course-review discovery tests: `shift` and `condition` filter the list, an invalid value gives 400, and the author DTO carries `id`, `avatarUrl` and `avatarCat` for named authors and only `username: 'Anónimo'` for anonymous ones, in lists, details and related items. Implement the DTO and select changes. Verify the tests pass.

## 2. Shared frontend pieces

- [x] 2.1 Write tests for `lib/relative-time.ts` («ahora», «hace 3 horas», «hace 2 días», «hace 3 semanas», «hace 2 meses») and for `lib/experiences-client.ts` schemas (overview, summary, related parse the fixtures from the e2e tests). Implement them. Verify the tests pass.
- [x] 2.2 Write tests for `ExperienceCard`:
  - a named review shows avatar, name, «Reseña de cursada · hace 2 días», context chips, resultado, dificultad, stars with an accessible name, excerpt, «Leer completa» to `/resenas/<id>` and «Reportar» opening the dialog;
  - an anonymous final shows the `AnonymousMark`, «Anónimo», «Mesa de diciembre 2024», formato, outcome with grade, and no fabricated professor or dificultad;
  - a `NO_RECUERDO` final shows «Final 2024»;
  - no «Me sirvió» control renders.

  Implement `ExperienceCard`, `AnonymousMark`, and move `StarRecommendation` and `CommunityFactList` into `components/experiences/`. Verify the tests pass.
- [x] 2.3 Update `CourseReviewDiscoveryPage`, `ExamExperienceDiscoveryPage` and `CommunityDetailPage` to the new card, the anonymous mark and «Leer completa»; add the «← Experiencias» header link to both lists; delete `CommunitySummaryCards.tsx`. Update their tests. Verify they pass.

## 3. Landing

- [x] 3.1 Write tests for `lib/experiences-landing-state.ts`: parse and serialize `carrera`, `anio`, `tipo`; invalid values fall back to defaults. Implement it. Verify the tests pass.
- [x] 3.2 Write tests for `ExperiencesLanding` with mocked clients and `ubicacionStore`:
  - with an Ubicación the panel names universidad and facultad, the overview is requested with `facultyId`, and the subtitle says the facultad, «todas las carreras» and «últimos meses»;
  - a signed-in student gets their first carrera cursando preselected with «tomado de tu perfil» and no «Plan» text, only when it belongs to the facultad;
  - carrera, año and type chips update the URL and the request; an optativa-only carrera shows no año chips beyond «Todos»;
  - without an Ubicación: invitation, no carrera or año chips, «todas las facultades»;
  - `ALL_TIME` shows «de siempre»; an empty context shows «Todavía no hay experiencias en <facultad>» with «Escribir la primera» and «Ver las de todas las facultades»;
  - «% promocionó» is hidden under the minimum and replaced by «aprobaron X de Y» with «Solo finales»;
  - «Ver todas las materias» points at the carrera page with a chip active, else the facultad page; «Ver todas las reseñas» / «Ver todos los finales» follow the type;
  - a failed overview shows an error with retry while hero, panel, «Tu turno» and «Cómo leer» still render;
  - «Escribir experiencia» links to `/experiencias/escribir`.

  Implement the landing components and `app/(site)/experiencias/page.tsx` with metadata. Verify the tests pass.
- [x] 3.3 Write tests for `SubjectSearch`: suggestions use only `subjects` and the Ubicación's `facultyId`; choosing one navigates to `/experiencias/<código>`; Enter opens the first; no match shows «No encontramos esa materia en <facultad>» and «Buscar en todas» retries without `facultyId`. Implement it. Verify the tests pass.

## 4. Page per materia

- [x] 4.1 Write tests for `lib/subject-experiences-state.ts`: `tab`, the per-type filters and `sort` round-trip through the URL; the page number never does. Implement it. Verify the tests pass.
- [x] 4.2 Write tests for `SubjectSummary`:
  - the full summary from the design fixture («Resumen de 58 experiencias», «34 reseñas de cursada», «24 experiencias de final», «aprobaron 15 de 22», bars with «5 prefirieron no responder», histogram with «3 no la indicaron», «El final» with formato counts, averages, mesa más comentada and nota promedio);
  - under each minimum the wording switches to counts («2 de 3 promocionaron») or omits the figure;
  - no nota de promoción, preparación típica, professors or duration text renders.

  Implement it. Verify the tests pass.
- [x] 4.3 Write tests for `SubjectExperiencesPage` and `ExperienceTabs`:
  - breadcrumb Experiencias › carrera › materia and the eyebrow «1° año · 2° cuatrimestre», «Anual» or «Optativa»;
  - «Ver recursos de la materia» links to `/materias/<código>`; «Escribir experiencia» opens the two-option menu with both form links;
  - tabs «Reseñas · N» / «Finales · N», Reseñas default, tab in the URL;
  - reseña filters (ciclo, franja, profesor, situación, resultado) and the three sorts; final filters (período, año, formato, profesor, resultado) and only Más recientes;
  - ten cards then «Ver más» appends ten without changing the URL;
  - an empty filter result keeps the filters and offers to clear them;
  - a materia without experiencias shows «Nadie contó todavía cómo le fue en <materia>» with «Escribir la primera».

  Implement them and `app/(site)/experiencias/[codigo]/page.tsx` with `redirectOldSubjectCode` and metadata. Verify the tests pass.

## 5. Details, chooser, shell and hub

- [x] 5.1 Write tests for `SubjectAccordingPanel` and `SameContextPanel` inside `CommunityDetailPage`: the review panel shows average, dificultad más elegida and bars with «Ver todas las experiencias» to `/experiencias/<código>`; the final panel shows «aprobaron X de Y», formato más común and the two averages; the context panel names the shared facts and lists up to 3 cards; it does not render when `sharedContext` is null; «Escribir» opens the two-option menu. Implement them. Verify the tests pass.
- [x] 5.2 Write tests for `WriteExperienceChooser`: the two type cards, the materia search, and the continue link to `/materias/<código>/resenar` or `/final`; the button stays disabled until both are chosen. Implement it and `app/(focus)/experiencias/escribir/page.tsx`. Verify the tests pass.
- [x] 5.3 Update `navigation.test.ts`: Experiencias points at `/experiencias`, and `/experiencias`, `/experiencias/<código>` and `/experiencias/escribir` mark it current while `/materias/<código>` still marks Materias. Implement it in `navigation.ts` and check the footer uses the destination. Verify the tests pass.
- [x] 5.4 Update `SubjectHub` tests: no reseñas or finales tab; the summary card shows the two counts, the recomendación promedio, «aprobaron X de Y», «Ver experiencias →» to `/experiencias/<código>` and the two write actions; the materials tab is unchanged. Implement `SubjectExperiencesSummaryCard` and the hub change. Verify the tests pass.
- [x] 5.5 Copy `hero-experiencias.png` and `gato-escribe.png` into `public/assets/`, use them on the landing and chooser, and check the landing and the materia page at 390px: one column, scrollable chip rows, two-column materias, 2×2 figures, no horizontal overflow. Record the check in this task.
  - Checked 2026-10-17 at 390×844 (Chrome DevTools, mobile emulation) against the dev DB: `/experiencias` one column, type chips scroll, no page overflow (scrollWidth 390), hero and «Tu turno» images load; `/experiencias/14` breadcrumb, eyebrow, summary figures 2×2, no overflow; `/experiencias/escribir` focus layout without bottom bar, image loads. Found and fixed: the materia page filter selects shrank to unreadable stubs instead of scrolling; `shrink-0` on `chipSelect` in `ExperienceTabs.tsx` (row now 1024px wide inside 366px, scrolls). The dev data has a single qualifying materia, so the two-column materias grid shows one card.

## 6. Docs and checks

- [x] 6.1 Update README_FRONTEND (the Experiencias routes, the shared card, the anonymous mark) and README_BACKEND (the three reads and the two filters). Verify they match the specs.
- [x] 6.2 Run backend and frontend lint, typecheck and test suites through a Haiku subagent, with logs in `.audit-logs/`. Verify everything is green except pre-existing failures already noted in 4b and 4c.
- [x] 6.3 Run `graphify update .` and verify it completes.

## Review (2026-10-17)

Fresh review by two Codex sessions (backend, frontend); all 11 findings confirmed and fixed test-first: draft carreras excluded from the overview scope; overview dificultad from one type only; placements loaded only for the top six; tests for the total tiebreak, truncation to six, unscoped facultades and anonymous finales; landing keeps the URL carrera and año until the facultad browse resolves; hub «Ver experiencias» keeps the carrera; «Solo finales» cards always say «aprobaron X de Y»; «Ver las de todas las facultades» widens the overview in place; heading «Con el mismo contexto». Also fixed: stale `/resenas` expectations in BottomBar and SiteHeader tests, a prettier error, and missing fixtures in the overview e2e test.

Checks after the fixes (logs in `.audit-logs/`, `y-*`, `z-*`, `x-vitest-e2e-*`): backend jest 343/343, vitest unit 385/385, vitest e2e 69 files green (run in two batches), lint clean, build ok; frontend vitest 645/645, typecheck clean, lint 0 errors (5 pre-existing warnings), design tokens ok. The pre-existing `tsc` errors in `moderation/review-fixes.test.ts` and `history-anonymity.e2e.test.ts` are outside this change.

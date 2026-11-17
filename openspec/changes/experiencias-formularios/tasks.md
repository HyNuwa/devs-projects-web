## 1. Data and write contract

- [x] 1.1 Write a Vitest migration test for `experiencias_formularios`:
  - the new nullable columns exist with their types;
  - `topics` defaults to an empty array;
  - existing reseñas and finales keep every value.

  Add the Prisma fields and the migration. Verify the test passes.
- [x] 1.2 Write e2e tests for the final write API (`POST /subjects/:code/exams`, `PUT /subjects/exams/:id`):
  - a missing outcome gives 400;
  - Aprobado or Desaprobado without a grade gives 400;
  - a grade with Prefiero no decir gives 400;
  - each new field accepts its range limits and refuses the values just outside them;
  - topics are trimmed, whitespace-collapsed and deduped case-insensitively keeping the first spelling, with eleven topics or a 1-character topic giving 400;
  - `examDate`, `shift` and `difficulty` give 400;
  - an update of a legacy final with date, franja and verbal difficulty keeps them.

  Implement the DTO, the validators and the service mapping. Verify the tests pass.
- [x] 1.3 Write e2e tests for the reseña write API:
  - `promotionGrade` 1–10 is stored with PROMO;
  - it gives 400 with REGULAR or LIBRE, or outside 1–10;
  - an update can clear it.

  Implement it. Verify the tests pass.

## 2. Reading contract

- [ ] 2.1 Write Vitest unit tests for the new pure functions in `experiences-summary.ts`:
  - the median of a value→count distribution, taking the lower middle for an even count;
  - the medians and the promotion average with their thresholds (3 and 5);
  - the mesa sentence parts dropped below 3;
  - the estimated total hours.

  Implement them. Verify the tests pass.
- [ ] 2.2 Extend the summary e2e tests (`experiences-summary.e2e.test.ts`):
  - «Nota de promoción» answered and average (Y = reseñas with PROMO);
  - preparation medians;
  - professors and duration medians limited to the mesa más comentada;
  - «Temas que más toman» with the two-finales rule, case-insensitive grouping, at most 5, and retired or hidden finales not counted;
  - every figure matching the mínimo de muestra.

  Implement the queries. Verify the tests pass.
- [ ] 2.3 Write e2e tests for `GET /discovery/subjects/:code/exam-topics`:
  - topics in at least two public finales, by count then name, at most 20;
  - a topic in one final is absent;
  - an unknown code gives 404.

  Implement the route. Verify the tests pass.
- [ ] 2.4 Extend the overview e2e tests: with `kind=exams` the cards carry `theory` and `practice` averages (null below 3) and no verbal dificultad; other kinds are unchanged. Implement it. Verify the tests pass.
- [ ] 2.5 Extend the discovery list and detail e2e tests:
  - reseñas carry `promotionGrade`;
  - final items carry theory, practice, board size and duration;
  - final details also carry the preparation and topics;
  - legacy date, franja and verbal difficulty are still returned.

  Implement the selects, DTOs and mappers. Verify the tests pass.
- [ ] 2.6 Update the «Contexto completo» badge tests to count reseñas by a real situación de cursada instead of the resultado. Implement the change in `badge-catalog.ts`. Verify the tests pass.

## 3. Frontend reading

- [ ] 3.1 Update the `experiences-client` and discovery Zod schemas and their fixture tests for the new fields, the topics endpoint and the overview's theory and practice. Verify the tests pass.
- [ ] 3.2 Update the `ExperienceCard` tests:
  - «Promoción · 9»;
  - a final shows «Teoría 4/5 · Práctica 3/5», or an older final's verbal dificultad when it has none;
  - a «Prefiero no decir» final shows no grade;
  - no mesa, tiempo, preparación or temas on the card.

  Implement it. Verify the tests pass.
- [ ] 3.3 Update the `CommunityDetailPage` tests:
  - a final detail shows «Mesa de 3 profesores · 3 horas», «Preparación: 3 semanas, 1 h por día» with «Unas 21 horas de estudio en total», and the temas as chips;
  - an older final still shows its date, franja and verbal dificultad;
  - `?publicada=1` shows «Publicada» once and is removed from the URL.

  Implement it. Verify the tests pass.
- [ ] 3.4 Update the `SubjectSummary` and `SubjectAccordingPanel` tests:
  - «Nota de promoción · 8,2 / 10 promedio · la informaron 9 de 11» and its below-minimum wording;
  - «Preparación típica»;
  - the mesa sentence with and without its parts;
  - «Temas que más toman».

  Implement them. Verify the tests pass.
- [ ] 3.5 Update the landing tests: with «Solo finales», the cards show «Teoría X · Práctica Y» averages and omit the one below its minimum. Implement it in `MostCommentedSubjects`. Verify the tests pass.

## 4. Frontend forms

- [ ] 4.1 Write tests for `FormSection`, `PublicationSection` and `ExperiencePreview`:
  - numbered headings with «Obligatorio» / «Opcional»;
  - the anonymity toggle off by default with the exact copy, and disabled in edit;
  - the publication rule text;
  - the preview rendering the same facts as the detail.

  Implement them. Verify the tests pass.
- [ ] 4.2 Write tests for `TopicsInput`:
  - Enter adds a chip and duplicates are ignored;
  - removing a chip;
  - the eleventh topic is refused with a message;
  - suggestions come from the topics endpoint, leave out added topics and add on click.

  Implement it. Verify the tests pass.
- [ ] 4.3 Rewrite the `ReviewForm` tests on the new layout:
  - the five sections;
  - required fields;
  - «¿Con qué nota promocionaste?» appears only with Promoción and clears on change;
  - the counter «/ 4000»;
  - the payload carries `promotionGrade`;
  - the duplicate-cursada dialog;
  - revisión previa;
  - success navigating to `/resenas/<id>?publicada=1`;
  - edit mode with «Guardar cambios» and legacy completion.

  Implement it in `components/experiences/forms/` and delete the old component. Verify the tests pass.
- [ ] 4.4 Rewrite the `ExamForm` tests on the new layout:
  - the seven sections;
  - the outcome is required, the grade is required unless «Prefiero no decir», with the exact helper copy;
  - teoría and práctica independent;
  - mesa, tiempo and preparación with their units and the estimated total;
  - no date, franja or verbal dificultad;
  - the payload;
  - success to `/finales/<id>?publicada=1`;
  - editing a legacy final without an outcome asks for it.

  Implement it and delete the old component. Verify the tests pass.
- [ ] 4.5 Write tests for the draft across «Cambiar»:
  - the form saves the draft and opens `/experiencias/escribir` with type and materia preselected;
  - continuing restores the shared and same-type fields;
  - publish and «Cancelar» clear it;
  - unavailable storage loses only the draft.

  Implement it in the forms and `WriteExperienceChooser`. Verify the tests pass.
- [ ] 4.6 Check both forms at 390px and on desktop in the running app:
  - one column with every field;
  - no preview on a phone;
  - a sticky publish button that never covers the last field;
  - the preview beside the form on desktop;
  - no horizontal overflow.

  Record the check in this task.

## 5. Docs and checks

- [ ] 5.1 Update README_BACKEND (the exam and review write contract, the topics route, the summary fields) and README_FRONTEND (the forms and the draft). Verify they match the specs.
- [ ] 5.2 Run backend and frontend lint, typecheck, build and test suites through a Haiku subagent, with logs in `.audit-logs/`, running the backend e2e suite in two batches. Verify everything is green except the pre-existing failures already noted in change 5.
- [ ] 5.3 Run `graphify update .` and verify it completes.

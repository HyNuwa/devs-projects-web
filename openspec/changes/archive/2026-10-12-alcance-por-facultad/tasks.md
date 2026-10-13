## 1. Catalog data

- [x] 1.1 Research with a Sonnet subagent the facultades of UNJU, UNSa, UNT, UNCA, UNSE, UBA, UNC, UNLP, UTN (facultades regionales), UNR, UNCuyo, UNL and UNNE from official sources. Also look up the official plan URL of FI-UNJU's Ingeniería Informática. Write them to `docs/catalogo/FUENTES_PRECARGA.md` with universidad, facultad, short name, source URL and date checked. Short names must be slug-safe (no spaces or accents). Verify: every row has an official source. **Stop and ask the user to review the list before 1.3.**
- [x] 1.2 Write a Vitest migration test for the schema migration:
  - a repeated `subjects.code` is rejected and several NULL codes are accepted;
  - a second plan for a carrera is rejected;
  - a `careers.plan_url` that is not `https` is rejected;
  - slugs that differ only by case are rejected for universities, faculties within a universidad and careers within a facultad;
  - `moderator_scopes` cascades on user deletion and restricts faculty deletion.

  Write the migration (Prisma schema plus SQL, including the `MODERATOR_SCOPE_CHANGED` enum value) and its part of `rollback.sql`. First check the dev and e2e databases for duplicate codes and multi-plan carreras. Verify the test passes.
- [x] 1.3 Write a Vitest migration test for the data migration:
  - the 13 universidades and the reviewed facultades exist;
  - FI-UNJU keeps its carreras, materias and contributions;
  - no other facultad gets carreras;
  - every existing MODERATOR covers FI-UNJU;
  - Ingeniería Informática has its plan link;
  - applying the inserts again duplicates nothing.

  Write the data migration and the rest of `rollback.sql`. Verify the test passes.

## 2. Catalog and declarations API

- [x] 2.1 Write Vitest e2e tests for the browse endpoints:
  - `GET /institutions/browse` returns universidades with facultad and published-material counts;
  - `/:uni`, `/:uni/:fac` and `/:uni/:fac/:career` resolve case-insensitive slugs;
  - the carrera level returns materias with año, cuatrimestre and créditos, plus the plan years and `planUrl`;
  - empty levels return empty lists;
  - unknown slugs return 404;
  - all of them are public.

  Implement them and add `planUrl` to `GET /institutions`. Verify the tests pass.
- [x] 2.2 Update the Vitest e2e tests of `/users/me/study-plans` for declaring by `careerId`:
  - the server resolves the carrera's single plan, and a carrera without a plan is invalid;
  - duplicates are rejected;
  - declarations made before this change come back with their `careerId` and status;
  - 401 without a session.

  Implement it. Verify the tests pass.
- [x] 2.3 Write Vitest e2e tests for the `facultyId` filter on `GET /materials` and on the materia matches of search: only materials of that facultad's materias, with no filter meaning everything. Implement it. Verify the tests pass.

## 3. Alcance de moderación API

- [x] 3.1 Write Vitest unit tests for `moderation/scope.ts`:
  - `scopeOf` returns `ALL` for ADMIN and SUPERADMIN and the assigned facultades for MODERATOR;
  - each builder (`caseWhere`, `correctionWhere`, `appealWhere`, `accountWhere`) returns no restriction for `ALL`;
  - for an empty list, each builder matches nothing.

  Implement it. Verify the tests pass.
- [x] 3.2 Write Vitest e2e tests for casos, revisión previa, the summary counts and correcciones with two facultades:
  - a moderator covering one sees and acts only on its items;
  - opening or deciding an item of the other gets the same 404 as a missing one;
  - a moderator without facultades gets empty lists and zero counts;
  - an admin sees both, and `facultyId` filters them;
  - a caso about content without a materia is admin-only (construct it directly in the test).

  Apply the builders in those services. Verify the tests pass.
- [x] 3.3 Write Vitest e2e tests for Usuarios and sanciones:
  - an account with a carrera in the facultad is listed, and its file opens;
  - the signed author of a caso in the facultad is listed;
  - an author of only an anonymous reseña with a caso is not listed, and searching their username finds nothing;
  - warning, silencing or proposing a suspensión for an invisible account gets the same answer as a missing account, and nothing is recorded;
  - the file of a visible account shows a sanción from another facultad.

  Implement it. Verify the tests pass.
- [x] 3.4 Write Vitest e2e tests for appeals:
  - a moderator of another facultad does not see an appeal;
  - with a single moderator covering the facultad who made the decision, the appeal waits for an admin;
  - a second moderator covering it can answer;
  - an appeal of a sanción from Usuarios follows the account's visibility.

  Implement it. Verify the tests pass.
- [x] 3.5 Write Vitest e2e tests for the history:
  - a moderator sees content events of their facultades and account events of the accounts they can see, and nothing from the other facultad;
  - role changes and `MODERATOR_SCOPE_CHANGED` are listed only to admins;
  - the existing anonymous-caso exclusions still hold.

  Implement the scoped query. Verify the tests pass.
- [x] 3.6 Write Vitest e2e tests for assignment:
  - promoting without `facultyIds` is refused, and the account stays USER;
  - promoting with them creates the scopes and records `ROLE_CHANGED` and `MODERATOR_SCOPE_CHANGED`;
  - `PATCH /admin/users/:id/role` to MODERATOR also requires them;
  - a role change away from MODERATOR deletes the scopes;
  - `PUT /moderation/users/:id/faculties` replaces them and records the before and after; it is admin-only;
  - `GET /moderation/summary` returns the viewer's scope.

  Implement it. Verify the tests pass.

## 4. Browsing frontend

- [x] 4.1 Write Vitest + Testing Library tests for the Universidades, universidad, facultad and carrera pages:
  - order: ubicación first, facultades with carreras first, then by name;
  - real counts and no «estudiantes»;
  - empty states with no buttons;
  - the fixed «¿No está la tuya?» text;
  - «Plan oficial ↗» opens in a new tab, and no plan name appears;
  - materias grouped by año and cuatrimestre, linking with `?carrera=`;
  - the «Tu carrera» shortcut only for a student cursando;
  - the breadcrumb on each level.

  Implement the server pages, client islands and not-found handling, with `noindex` on empty levels. Verify the tests pass.
- [x] 4.2 Write tests for the redirects:
  - `/materias` goes to `/universidades`;
  - an old `/materiales/...` URL with a career UUID goes to its carrera page, and one with a subject UUID to `/materias/[code]`;
  - unresolvable URLs go to `/universidades`;
  - `/materiales/[id]` and `/materiales/nuevo` still render.

  Implement them. Verify the tests pass.
- [x] 4.3 Write `SubjectHub` tests:
  - the breadcrumb uses `?carrera=`, else the viewer's first declared carrera that includes the materia, else the first by name;
  - placements read «FI (UNJU) · carrera · Año · Cuatrimestre» without plans;
  - the Materiales search field keeps `?q=` and searches only that materia.

  Implement it. Verify the tests pass.
- [x] 4.4 Write tests for the ubicación store and the header chip:
  - the order is device choice, then the first carrera cursando, then none;
  - storage failures are tolerated;
  - before a choice, the chip invites the viewer to choose;
  - the popover links to the facultad page and saves a new choice;
  - the compact header shows the facultad short name;
  - nothing is filtered by the chip itself.

  Implement it, replacing the fixed UNJU/FI mark. Verify the tests pass.
- [x] 4.5 Write tests for `/buscar` with `?facultad=`:
  - a missing param with an ubicación is written to the URL;
  - «en todas» widens the search;
  - a shared URL restores its own scope whatever the viewer's ubicación.

  Then write tests for `/ranking` defaults: a visitor with an ubicación starts at its first carrera by name, and Leyendas starts at its facultad. Implement it. Verify the tests pass.
- [x] 4.6 Update the «Mi carrera» tests: the form asks universidad, facultad and carrera with no plan select; the status labels read cursando, terminada and abandonada; existing declarations show their carrera. Implement it. Verify the tests pass.
- [x] 4.7 Update the app-shell tests: the menu's Materias links to `/universidades` and is current on `/universidades/**`, `/materias/<codigo>` and `/materiales/<id>`; Experiencias still wins on the review and final routes. Implement it. Verify the tests pass.

## 5. Moderation panel frontend

- [x] 5.1 Write tests for the panel:
  - the «Tu rol: moderación · FI UNJU» label;
  - the «no tenés facultades asignadas» message with empty lists;
  - the admin facultad filter on Casos, Correcciones, Apelaciones and Historial, kept in `?facultad=`;
  - the account file's «Facultades» editor for admins only;
  - the promote dialog requires at least one facultad and preselects the account's carreras' facultades.

  Implement it. Verify the tests pass.

## 6. Removals, docs and verification

- [x] 6.1 Delete `SubjectList`, `MaterialHierarchyPage`, `lib/discovery-hierarchy-client.ts` and the `discovery/hierarchy/*` endpoints with their DTOs and tests. Verify that a grep finds no references and that the backend and frontend builds pass.
- [x] 6.2 Update the docs:
  - README_MODERACION: alcance de moderación;
  - README_DATABASE: the new table, unique codes, the single plan, `plan_url` and the preload;
  - README_AUTH and README_SECURITY: mark `ModeratorScope` done;
  - PLAN_LIMPIEZA_HEREDADOS: the hierarchy browser and the flat list are gone;
  - `docs/catalogo/FUENTES_PRECARGA.md` is final.

  Verify every mention of `ModeratorScope` as pending is gone.
- [x] 6.3 Apply both migrations to dev and e2e with `prisma migrate deploy` (no reset, no seed), then run the full verification through a Haiku subagent:
  - backend Jest and Vitest (unit, e2e, migration), lint and build;
  - frontend tests, lint, design tokens and build.

  Run `graphify update .`. Verify all pass.
- [x] 6.4 Check in the browser with agent-browser, at 1440 and 390 px, saving screenshots to `docs/validation/evidence/alcance-por-facultad/`:
  - the four browsing steps and an empty preloaded facultad;
  - the materia breadcrumb;
  - the ubicación chip and its popover;
  - `/buscar` «en FI · UNJU» and «en todas»;
  - «Mi carrera» without a plan;
  - the moderation panel as a moderator (label) and as an admin (filter, Facultades editor).

  Verify there is no horizontal overflow at 390 px. Revert any demo inserts and stop the servers.
- [x] 6.5 Run a fresh Opus subagent review of the change against the specs, with special attention to every moderation query passing through the scope seam and to anonymity in Usuarios and the history. Apply its fixes test-first and note them in this file. Verify the full suite still passes.

## Review notes

Notes from the apply (2026-10-12):

- **Catalog review (1.1):** the user approved `docs/catalogo/FUENTES_PRECARGA.md`, with its decisions recorded there: escuelas and institutos included, the 30 UTN regionales, accepted short names, real acronyms for UNCA, «Facultad de Medicina» for UBA. The data migration loads 13 universidades and 170 facultades.
- **«Un caso sin facultad lo ven solo los admins»:** no e2e test, because the CHECK on `moderation_cases` requires exactly one content target, so the case cannot exist today. `scope.test.ts` covers it.
- **Declaration order:** `replaceDeclaredCareers` used to delete and recreate every row, which lost which carrera was declared first. That order sets the ranking and ubicación defaults. Saving now keeps existing rows.
- **History scope:** first built from id lists. A facultad with 70,000 materials made the history answer 500 (Postgres bind limit), so a scoped page now comes from SQL subqueries (`eventScopeSql`), fixed after the review at the user's request (see below).
- **Beyond the tasks:**
  - the history `facultyId` filter for admins;
  - the admin file's `careerFacultyIds`/`moderatorFaculties` backend test was written without being seen red first.
- **Behavior change:** a moderator gets 404, not the old role-based 403, for an account outside their facultades.
- **Test data:** the e2e database keeps 13 leftover test universidades and many accounts from earlier runs. Two older tests broke because of that accumulation, not because of this change:
  - `moderation-eligibility` now looks its accounts up by username;
  - the eligible candidate cap now takes the newest accounts first, a stable order.
- **Verification fixes (6.3):**
  - `sanctions-conflict` gave its anonymous-report author an FI carrera;
  - `/universidades` calls `connection()`, so the build no longer fetches the API;
  - `MaterialSearchPage` derives the facultad label without a setState inside an effect;
  - lint fixes (prettier, typed response bodies, unused imports).
- **Browser check (6.4):** at 390 px the ubicación popover was cut off on the left. It now sits between the viewport gutters below `lg`. Screenshots `07b`/`07f` were retaken after the fix; no page overflows horizontally at 390 px.
- **Opus review (6.5), fixed test-first:**
  1. **History leak (high).** Content events also store the author as `targetUserId`, even for anonymous content. So a visible account pulled another facultad's content events into a moderator's history, and `?contentId=` showed whether an anonymous author belonged to their facultad. The account branch now matches only events without content. New case in `moderation-scope-history`.
  2. **Usuarios:** search and every filter took their 50 or 200 candidates across all accounts before narrowing to the moderator's scope. Visible ids now narrow the queries before their limit. New case in `moderation-scope-users`.
  3. **`rollback.sql`:** now deletes `moderator_scopes` before the preloaded facultades. Without that, `RESTRICT` aborted the rollback as soon as a moderator covered one.
  4. **Concurrent saves of «Mi carrera»:** answer 409 `STUDY_PLANS_CHANGED` on P2025 too (unit test).
  5. **Catalog counts:** now use `publicVisibility`, so materials hidden past their review window count, as on the materia page.
  6. **Seed:** demo moderators get FI-UNJU, since the seed creates them after the migration.
  7. **Test gaps:** the experiencia branch of `SIGNED_CASE` is checked in `scope.test.ts`; out-of-scope `unmute` and `lift-suspension` answer the same 404.
- **Follow-ups fixed at the user's request (test-first):**
  1. **Direct material deletion:** `DELETE /materials/:id` let any MODERATOR, ADMIN or SUPERADMIN delete any material, outside the scope and without a history event (it predates the change). Now only the author deletes; staff use a retiro. The material view and the preview dialog no longer offer staff the delete or «Gestionar material» action. E2e `material-delete-author-only`, frontend tests updated.
  2. **History at scale:** `eventScopeSql` replaces the id lists; new e2e tests page a moderator through 55 events and load the history with 70,000 materials in the facultad.
- **Left as is:** guide removal (`DELETE /guides/:id`) still lets staff delete; guides left the product and have no facultad (`PLAN_LIMPIEZA_HEREDADOS.md`).

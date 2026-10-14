## 1. Schema

- [x] 1.1 Write a Vitest migration test:
  - existing carreras are `PUBLISHED` and new ones default to `DRAFT`;
  - `semester` accepts 0, 1 and 2 and rejects 3;
  - a 60-character materia code is accepted and existing codes are unchanged;
  - a new short name or code with a space or accent is rejected;
  - `catalog_slug_aliases` rejects a duplicate `(kind, parent, slug)`;
  - `career_requests` rejects a non-`https` `plan_url` and a row without `faculty_id` or `faculty_text`;
  - a supporter can't be added twice;
  - the new `ModerationEventAction` values exist.

  Write the Prisma schema and SQL migration and `rollback.sql`, which aborts on codes longer than 20, anual placements or catálogo events. Verify the test passes.

## 2. Catálogo core

- [x] 2.1 Write Vitest unit tests for `slugify` and the materia code proposal:
  - accents and symbols are stripped;
  - output is trimmed to 60 characters;
  - `-2`, `-3` are appended when the code is taken as a code or as an alias, or earlier in the same batch.

  Implement them. Verify the tests pass.
- [x] 2.2 Write Vitest unit tests for the carga masiva parser:
  - valid lines with and without créditos;
  - `A` and `a` as anual;
  - empty lines are skipped;
  - año out of 1–10, unknown cuatrimestre, a missing name, a name over 150 characters and créditos out of range each give an error with its line number.

  Implement it. Verify the tests pass.
- [x] 2.3 Write Vitest e2e tests for creating and editing universidades, facultades, carreras and materias through `/admin/catalog`:
  - ADMIN and SUPERADMIN succeed, MODERATOR and USER get 403;
  - a case-insensitive duplicate short name in the same universidad gets 409 with the field;
  - a carrera is created `DRAFT` with its single plan;
  - a placement of a materia of another facultad gets 409;
  - each write records its event with `before` and `after`.

  Implement `CatalogService` and the controller. Verify the tests pass.
- [x] 2.4 Write Vitest e2e tests for publish and unpublish:
  - publishing makes the carrera appear in `GET /institutions`, the browse endpoints and declarations;
  - a draft carrera is 404 in browse, missing from the catálogo, and refused as a declaration;
  - unpublishing a declared carrera gets 409, while an undeclared one goes back to draft.

  Implement it, including the `PUBLISHED` filter in every reader listed in design.md. Verify the tests pass.
- [x] 2.5 Write Vitest e2e tests for deletion:
  - each entity deletes when empty;
  - a universidad with facultades, a facultad with carreras, materias or moderators, a declared carrera, and a materia with content each get 409 with their `blockers`;
  - removing a placement leaves the materia in its other carreras.

  Implement it. Verify the tests pass.
- [x] 2.6 Write Vitest e2e tests for aliases:
  - renaming a facultad makes the browse endpoint answer `redirect` to the canonical path for the old slug, including for carreras under it;
  - a renamed carrera or materia redirects;
  - renaming back removes the alias;
  - `slug-check` reports an alias held by another entity, and taking that slug drops the alias;
  - deleting an entity deletes its aliases.

  Implement it in `CatalogService`, the browse service and `GET /subjects/:code`. Verify the tests pass.
- [x] 2.7 Write Vitest e2e tests for the carga masiva:
  - the preview marks reuse (accent- and case-insensitive), new (with proposed codes), update and unchanged, and writes nothing;
  - apply writes every row in one transaction and records one `CATALOG_BULK_APPLIED` event;
  - one invalid row makes apply write nothing;
  - materias missing from the text stay in the carrera;
  - anual rows are stored as 0.

  Implement it. Verify the tests pass.
- [x] 2.8 Write Vitest e2e tests for the history: the catálogo actions appear in `/moderation/history` for admins with their metadata and never for a MODERATOR. Implement it (add them to `ADMIN_ONLY_ACTIONS`). Verify the tests pass.

## 3. Solicitudes de carrera API

- [x] 3.1 Write Vitest e2e tests for creating a solicitud:
  - a verified, unsanctioned student creates one with a catálogo facultad, or with free text;
  - an `http` link, an unverified email and an active silenciamiento are refused;
  - a fourth pending solicitud is refused;
  - visitors get 401;
  - the rate limit applies.

  Implement it. Verify the tests pass.
- [x] 3.2 Write Vitest e2e tests for «Yo también» and withdrawal:
  - the pending list of a facultad shows count and no identities;
  - joining twice or joining your own is refused;
  - a supporter can withdraw their support;
  - an author withdrawing with supporters hands the solicitud to the oldest supporter, and without supporters closes it as `WITHDRAWN`;
  - nothing can be withdrawn after it is resolved.

  Implement it. Verify the tests pass.
- [x] 3.3 Write Vitest e2e tests for resolution:
  - accepting creates a draft carrera with the name and `planUrl`, plus facultad and universidad from confirmed values when they were free text;
  - rejecting requires a reason;
  - already-loaded requires a published carrera;
  - publishing the carrera turns accepted solicitudes to `PUBLISHED`;
  - each resolution records `CAREER_REQUEST_RESOLVED`;
  - only admins can resolve;
  - `GET /users/me/career-requests` lists authored and supported ones with their status.

  Implement it. Verify the tests pass.
- [x] 3.4 Write Vitest tests for the two emails:
  - rejection and publication send one email per student in the solicitud with a verified email, after commit;
  - a failed send keeps the decision.

  Add `sendCareerRequestRejected` and `sendCareerPublished` to `MailService`. Verify the tests pass.

## 4. Frontend

- [x] 4.1 Write Vitest tests for anual placements in `CareerView` (listed first in their año, labeled «Anual») and for `SubjectHub`'s placement labels. Update `types/subject.ts` and `catalog-client.ts`. Verify the tests pass.
- [x] 4.2 Write Vitest tests for the alias redirects in the `/universidades/...` and `/materias/[codigo]` server components (a `redirect` answer calls `permanentRedirect`). Implement them. Verify the tests pass.
- [x] 4.3 Write Vitest tests for the Catálogo tab:
  - it is visible only to ADMIN and SUPERADMIN, with the pending count;
  - the tree expands lazily and marks borradores;
  - the edit panel saves a rename and shows the alias warning;
  - deletion shows the `blockers` message;
  - publish and unpublish work.

  Implement `/admin/catalogo`. Verify the tests pass.
- [x] 4.4 Write Vitest tests for the carrera editor and the carga masiva dialog:
  - placements are grouped by año;
  - add, edit and remove a placement;
  - paste → preview table with per-row action switch → confirm;
  - invalid rows block confirmation.

  Implement it. Verify the tests pass.
- [x] 4.5 Write Vitest tests for `/admin/catalogo/solicitudes`:
  - the list shows count and free-text facultades;
  - accept (with the facultad confirmation when it is free text), reject with a required reason, and already loaded with a carrera picker.

  Implement it. Verify the tests pass.
- [x] 4.6 Write Vitest tests for the solicitud form `/universidades/pedir`:
  - the facultad is preselected from `?facultad=`;
  - pending solicitudes of the facultad are shown with «Yo también»;
  - a free-text facultad or universidad can be entered;
  - an `http` link is rejected inline;
  - a visitor is sent to login with `next`.

  Implement it, plus the entry points «Pedí tu carrera», «¿No está la tuya?» and «No encuentro mi carrera». Verify the tests pass.
- [x] 4.7 Write Vitest tests for «Mis solicitudes» on the profile page: every status with its label, the rejection reason, the link to the carrera when published or already loaded, and withdraw while pending. Implement it. Verify the tests pass.

## 5. Docs and checks

- [x] 5.1 Update README_DATABASE (new tables, `careers.status`, anual = 0, aliases, rollback) and README_MODERACION (catálogo events, admin-only). In `docs/catalogo/FUENTES_PRECARGA.md`, note that short names are now fixed from the panel. Verify the links resolve.
- [x] 5.2 Through a Haiku subagent, run the backend and frontend suites, lint and typecheck, with logs in an ignored local artifact. Verify it reports every suite passing.
- [x] 5.3 In the running app, as an admin: rename a facultad and open its old URL; create a carrera, load it with carga masiva including an anual, and publish it; as a student, ask for a carrera, join it from another account, accept it, publish it, and check «Mis solicitudes» and the email in the dev mail log. Verify each step behaves as the specs say.
- [x] 5.4 Run `graphify update .` and `openspec validate catalogo-editable --strict`. Verify both succeed.

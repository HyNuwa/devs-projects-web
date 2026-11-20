## 1. Nivel máximo alcanzado and schema

- [x] 1.1 Write a Vitest migration test that seeds pre-migration users at different niveles, applies the migration and asserts:
  - `max_level` equals each user's `level`;
  - `profile_customizations` exists with its defaults (`featured_badges = {}`, `pinned = []`, `show_level_and_badges = true`);
  - deleting a user cascades to its row.

  Add `User.maxLevel` and the `ProfileCustomization` model, the migration SQL, and `rollback.sql` in the change folder. Verify `pnpm test:vitest:migration` passes.
- [x] 1.2 Write Vitest e2e tests for the ledger:
  - reaching a higher nivel raises `maxLevel`;
  - a reversal that lowers the nivel keeps `maxLevel`;
  - a sanctioned account's reversal keeps it;
  - `rebuild-points` sets `maxLevel` to the rebuilt nivel.

  Implement the `GREATEST` write in `point-ledger.ts` and the rebuild change. Verify these tests and the existing points suites pass.

## 2. Option catalog and customization API

- [x] 2.1 Write Vitest unit tests for `profile-options.ts`:
  - every option id is unique;
  - `isUnlocked` follows nivel máximo alcanzado for level options and held insignias for `marco-salvavidas`;
  - `pinLimit` is 0, 1 and 3 at niveles 1, 2 and 3;
  - the título needs nivel 6;
  - `ojo-atento` is never eligible.

  Implement the catalog. Verify the tests pass.
- [x] 2.2 Write Vitest e2e tests for `GET`/`PUT /users/me/profile-customization`:
  - defaults without a row;
  - options come with `unlocked` and `unlockLabel`;
  - replace-all saves;
  - 400 for an unknown id, a locked option, a título below nivel 6, an insignia not held, `ojo-atento`, more than 3 destacadas, duplicates, too many pins for the nivel, and pinning someone else's, an anonymous, an unpublished or a deleted contribution. The last four get the same message, and nothing changes on any 400;
  - 401 without a session;
  - `/users/me` returns `avatarCat`.

  Implement the service, DTO and controller. Verify the tests pass.

## 3. Public profile API

- [x] 3.1 Write Vitest e2e tests for `GET /profiles/:username`:
  - public without a session, and 404 for an unknown username;
  - nivel shown, never points, email, sanción, study plans, «Ojo atento» or insignia dates;
  - customization returned;
  - título and destacadas in order, with the current grado;
  - a lost Salvavidas drops the frame, the título and the destacada;
  - a retired or deleted pin is dropped, and a restored one comes back;
  - with the switch off, there is no nivel, insignias or título, but the cosmetics and pins remain;
  - a muted and a suspended account return the same profile as before the sanción;
  - `GET /users/:id` returns the same projection.

  Implement `PublicProfileService` and the controller. Verify these tests and the existing `users-public-profile` and badge tests pass.
- [x] 3.2 Write Vitest e2e tests for `GET /profiles/:username/contributions`:
  - only published, not deleted and named materials, reseñas and experiencias;
  - newest first, in pages of 20 with `hasMore`, so 25 items give 5 on page 2;
  - anonymous, retired, hidden, pending and rejected entries are excluded.

  Implement the `UNION ALL` query. Verify the tests pass.

## 4. Art

- [x] 4.1 Generate with `codex-imagegen`:
  - the 4 nivel-2 cats and the 3 nivel-7 cats, matching `birrete.webp` and `crema.webp`, as 256×256 webp in `public/avatars/`;
  - the 3 banners as 1200×300 webp in `public/assets/perfil/banners/`.

  Compare them side by side with the existing cats, fix the catalog ids to match the art, and save a contact sheet in `docs/validation/evidence/perfil-publico/`.

## 5. Frontend

- [x] 5.1 Write frontend Vitest tests for `avatarSrc`:
  - chosen cat;
  - `gato-animado` uses `crema.webp`;
  - the photo when there is no cat;
  - the id cat otherwise.

  Then test that `AccountMenu` and `ProgressPage` render the chosen cat. Implement them. Verify the tests pass.
- [x] 5.2 Write frontend Vitest tests for `PublicProfileEditor` in `ProfilePage`:
  - locked options are disabled with their label;
  - choosing a cat, accent, frame or banner, the título, destacadas, pins and the switch sends the full PUT;
  - an API error is shown and keeps the choices;
  - «Mi foto» sends `avatarCat: null`;
  - «Ver mi perfil público» links to `/usuarios/<username>`.

  Implement the section and its client. Verify the tests pass.
- [x] 5.3 Write frontend Vitest tests for `PublicProfilePage` at `/usuarios/[username]`:
  - section order;
  - «Nv. 5 · Siete vidas» and «Miembro desde» with month and year;
  - destacadas before the grid;
  - with the switch off, there is no nivel or insignias, and the frame still shows;
  - pins and a paginated contributions list, where a material opens the preview and reseñas and experiencias link to their pages;
  - the not-found state;
  - the customization classes applied;
  - the animated cat is still under reduced motion.

  Implement the route, components and CSS. Verify the tests pass.
- [x] 5.4 Write frontend Vitest tests for `AuthorLink`:
  - a named author links to `/usuarios/<username>`;
  - «Anónimo» is plain text.

  Then test it in `CommunityDetailPage`, `CommunitySummaryCards`, `MaterialPreviewDialog` and the `/buscar` rows that show an author. Implement them. Verify the tests and the existing tests of those components pass.

## 6. Docs, review and verification

- [x] 6.1 Update the docs and verify they match groups 1–5:
  - `README_PUNTOS_E_INSIGNIAS.md`: state line, §4 with «Mi perfil → Perfil público» and the option ids, §8;
  - `README_DATABASE.md`: `max_level`, `profile_customizations`, rollback;
  - `rpg-levels.ts`: the `unlocks` texts, if the final art names change them.
- [x] 6.2 Apply the migration to dev `devs_project_moderacion` with `prisma migrate deploy`, with no reset and no seed. To raise a demo account's nivel, use a targeted update of `max_level` only, and revert it afterwards.

  Run a browser check with agent-browser:
  - editing the perfil público as a demo student;
  - viewing `/usuarios/<username>` signed out, at 1440 and 390, with and without the switch and with reduced motion;
  - an author link from a reseña.

  Save the evidence in `docs/validation/evidence/perfil-publico/`, then stop the servers.
- [x] 6.3 Run a fresh code review with an Opus subagent focused on anonymity (pins, contributions list, error messages), unlock validation, read-time fallbacks, the `maxLevel` monotonicity and what the public projection exposes. Fix the confirmed findings and rerun the affected tests.
- [x] 6.4 Run full verification with logs in `.audit-logs/`, reporting only summaries:
  - backend: Jest (unit with `--maxWorkers=2`, e2e), Vitest (unit, e2e, migration), lint and build;
  - frontend: tests, lint, design tokens and build;
  - then `graphify update .`.

  Verify everything passes.
- [x] 6.5 Write Vitest unit tests that check:
  - «Anónimo» and its variants are reserved, ignoring case, accents and spaces;
  - names like `anonimo_fi` are allowed;
  - `RegisterDto` and `UpdateProfileDto` reject a reserved username or display name.

  Implement the `NotReservedName` validator. This task was added after the review: without it, an account named «Anónimo» would pass for an anonymous author. Verify the tests pass.

> **Note on test-first:** in 3.2 and 5.4, and in fixes 2, 3 and 5 of the review, I wrote each test before its implementation, but I did not run it until the implementation was in place. So no red run was recorded for them. Every other task saw its tests fail first.

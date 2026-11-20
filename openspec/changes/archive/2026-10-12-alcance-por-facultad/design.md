## Context

See proposal.md for the why. State of the code this design builds on:

- **Catalog:** `GET /institutions` returns the whole tree (universidad → facultades → carreras → plans) with no counts.
  - `Subject.code` is nullable and not unique; `GET /subjects/:code` takes the first match. Dev has 49 subjects, all with a code and no duplicates.
  - `StudyPlanSubject` holds `year`, `semester` (both required) and `credits`. Dev has one plan per carrera.
- **Browsing:** `/materias` is a flat client list (`SubjectList`). `/materiales/[...segments]` is a career-first browser (`MaterialHierarchyPage`) over `GET /discovery/hierarchy/*`, which only `lib/discovery-hierarchy-client.ts` calls. Its URLs carry career, plan and subject UUIDs.
- **Header:** `SiteHeader` shows a fixed «UNJU · FI» mark. `/buscar` (`MaterialSearchPage`) calls `GET /materials`, which filters by materia but not by facultad.
- **«Mi carrera»:** `MyStudyPlans` asks universidad → facultad → carrera → plan. `PUT /users/me/study-plans` takes `studyPlanId` and a status (`ACTIVE`, `COMPLETED`, `ABANDONED`).
- **Moderation:** every service (cases, summary, corrections, appeals, history, users, sanctions) sees everything. A caso's facultad is derivable as content → `subject.facultyId`, and DB triggers keep each subject in one facultad. `ModerationEvent` has no FKs to its targets. Promotion (`POST /moderation/users/:id/promote`) and `PATCH /admin/users/:id/role` take no facultades.

## Goals / Non-Goals

**Goals:**
- One scope seam that every moderation query goes through, so a new moderation surface cannot forget it.
- Browsing pages a shared link renders on the server, with real counts.
- Schema changes that need no rewrite of existing rows.

**Non-Goals:**
- Dropping the plan table (ADR 0003).
- Caching or precomputing counts.
- Moderation of content without a materia. Only the rule is set; the content types arrive later.

## Decisions

### Slugs and routes
- **URL segments:**
  - universidad: `lower(shortName)`;
  - facultad: `lower(shortName)` within its universidad;
  - carrera: `lower(code)` within its facultad.
- **Uniqueness:** a migration adds unique indexes on `lower(short_name)` for universities, on `(university_id, lower(short_name))` for faculties, and on `(faculty_id, lower(code))` for careers, so a slug always resolves to one row. Short names with spaces or accents are not allowed by data rule (checked in the migration's data and documented).
- **New public endpoints:**
  - `GET /institutions/browse` lists universidades with counts.
  - `GET /institutions/browse/:uni`, `/:uni/:fac` and `/:uni/:fac/:career` return one level with its children and counts. The carrera level returns materias with year, semester and credits, the plan years and `planUrl`.
  - Counts are `count`/`groupBy` queries per request. Published materials means status `PUBLISHED` and not deleted.
- **Alternative rejected:** UUIDs in the URL. They are unreadable in a shared link, and the slug is already unique.

### Pages
- `app/(site)/universidades/...` are server components that fetch the browse endpoints with a short revalidation. They are what a shared link shows first.
- Client islands hold the viewer-dependent bits: the «Tu carrera» shortcut and the ubicación-first order of universidades. The server orders by name, and the island moves the ubicación's universidad to the top after mount.
- **Pages with nothing loaded:** a facultad without carreras or a carrera without materias sets `robots: noindex` until content exists.
- **Redirects:**
  - `/materias` redirects to `/universidades` in `next.config`.
  - `/materiales` and `/materiales/[...segments]` become a server redirect. It resolves the career or subject UUID in the old URL through the backend: a career goes to its carrera page, a subject to `/materias/[code]`, and anything unresolvable to `/universidades`.
  - `/materiales/[id]` and `/materiales/nuevo` keep their pages.

### Materia page
- `SubjectHub` reads `?carrera=<code>` for the breadcrumb.
  - Without the param, it uses the first declared carrera of the viewer that includes the materia, else the first by name. The candidate carreras come from the materia's placements, which already include career and facultad.
  - Links from carrera pages add `?carrera=`.
- The Materiales tab gets a search field bound to `?q=`, which calls `GET /materials?subjectId=&q=`. It replaces the materia-scoped search the hierarchy browser had.

### Materia code and the single plan
- `Subject.code` gets `@unique`; Postgres allows several NULLs.
- `StudyPlan` gets `@@unique([careerId])`.
- **Declarations:** `PUT /users/me/study-plans` takes `{ careerId, status }[]`, and the server resolves each carrera's only plan; a carrera without a plan is refused as invalid. The response adds `careerId`. The status enum stays, and the interface labels it cursando, terminada or abandonada.
- **Alternative rejected:** keeping `studyPlanId` in the API. It would leak the hidden concept to the client forever.

### Official plan link
- `careers.plan_url varchar(500)` is nullable, with `CHECK (plan_url LIKE 'https://%')`.
- It is exposed in the catalog and the browse endpoints. The data migration loads it for Ingeniería Informática.

### Preloaded universidades
- A data migration inserts the 13 universidades and their facultades with `ON CONFLICT DO NOTHING` on the unique keys, so applying it where some already exist duplicates nothing.
- A Sonnet research subagent gathers the facultades from official sources. They are recorded in `docs/catalogo/FUENTES_PRECARGA.md` (universidad, facultad, short name, URL, date checked).
- The user reviews that list before the migration is written.
- UTN's units load as faculties named «Facultad Regional <Ciudad>» with short names like `FRT`.

### Ubicación
- A small client store (`useUbicacion`) resolves the ubicación in this order:
  1. a facultad id saved under one localStorage key;
  2. the facultad of the viewer's first `ACTIVE` declaration;
  3. none.
- It reads storage in try/catch and renders after mount to avoid hydration mismatch. The header chip shows a fixed-width placeholder until then.
- The chip opens a popover with a link to the facultad page and the universidad and facultad selects, using the catalog. Choosing writes storage only.
- **Search:**
  - `/buscar` takes `?facultad=<id>|todas`.
  - When the param is missing and there is an ubicación, the page writes it with `router.replace`. A shared URL then always carries the scope it was made with.
  - The backend adds an optional `facultyId` filter to `GET /materials` and to the materia matches.
- **Ranking:** `/ranking` uses the ubicación when `me` gives no default carrera: the first carrera of that facultad by name. The Leyendas default is the ubicación's facultad, or the first facultad.

### Alcance de moderación
- **Model:** `ModeratorScope { userId, facultyId }` with a composite primary key, `onDelete: Cascade` on the user and `Restrict` on the faculty.
- **The seam:** `moderation/scope.ts` with `scopeOf(actor)`, which returns `'ALL'` for ADMIN and SUPERADMIN or a facultad id list. Every moderation service calls one of its builders:
  - `caseWhere(scope)`: an `OR` over the material, review and exam relations to `subject.facultyId in`. A caso with no content relation matches none, so it is admin-only by construction.
  - `correctionWhere(scope)`: `material.subject.facultyId in`.
  - `appealWhere(scope)`: by the appeal's caso through `caseWhere`. For a sanción from Usuarios with no caso, the sanctioned account must pass `accountWhere`.
  - `accountWhere(scope)`: a declared plan whose carrera is in the facultades, or being `targetAuthorId` of a caso about signed content in them. Anonymous reviews and experiences are excluded by their anonymity flag.
  - History: `ModerationEvent` has no FKs, so Prisma cannot join its targets. For a scoped viewer the page of event ids comes from SQL (`eventScopeSql` in `scope.ts`, with subqueries on the content's materia and `EXISTS` for visible accounts), and Prisma then loads those events. Content events need their content in scope; account events need the account to pass the account rule. Role and scope events are excluded for MODERATOR. Id lists were the first implementation; they overflowed Postgres's bind limit with a facultad of 70,000 materials (e2e test).
- Single-item reads and actions check the same builders and throw the existing not-found error, so out of scope and nonexistent look alike.
- **Assignment:**
  - Promotion and `PATCH /admin/users/:id/role` to MODERATOR require `facultyIds` (min 1). A role change away from MODERATOR deletes the scopes in the same transaction.
  - `PUT /moderation/users/:id/faculties` (ADMIN, SUPERADMIN) replaces them.
  - Each change writes a new `MODERATOR_SCOPE_CHANGED` event with the before and after ids.
- **Appeals:** an eligible reviewer must pass `appealWhere` for that appeal. The existing «no other eligible moderator → waits for ADMIN» rule then covers the single-moderator facultad.
- **Panel:**
  - `GET /moderation/summary` returns the viewer's scope (`all` or facultades with short names) for the «Tu rol» label.
  - Admins get a `?facultad=` filter on Casos, Correcciones, Apelaciones and Historial, passed to the endpoints as `facultyId`.
  - The account file gets a «Facultades» editor for admins, and the promote dialog gets facultad checkboxes preselected from the account's declared carreras.
- **Alternative rejected:** storing the facultad on each caso. It duplicates the content's materia, and the README note that suggested it predates the triggers that pin a materia to one facultad.

### Removals
`SubjectList`, `MaterialHierarchyPage`, `lib/discovery-hierarchy-client.ts`, the `discovery/hierarchy/*` endpoints with their DTOs and tests, and the plan select in «Mi carrera».

## Risks / Trade-offs

- **[Wrong preloaded data shows on the page we share]** → Each facultad has an official source, the user reviews the list before the migration, and the data is plain inserts that are easy to correct with a follow-up migration or, later, `catalogo-editable`.
- **[A scope check forgotten on a new endpoint]** → One seam. An e2e test per moderation surface checks that an out-of-scope moderator gets not-found or an empty list, and the review checks every moderation query for a builder call.
- **[Usuarios visibility leaking anonymous authorship]** → The account rule ignores anonymous casos, and refusals equal not-found. An e2e test covers the anonymous-only author case from the spec.
- **[History scope in SQL drifting from the Prisma builders]** → `eventScopeSql` sits next to `caseWhere` and `accountWhere` with a note to keep them in sync. Covered by e2e tests for each event family, paging, and a facultad of 70,000 materials.
- **[Unique materia code breaks e2e fixtures with fixed codes]** → Fixtures generate unique codes; the shared e2e DB is checked for duplicates before the migration runs there.
- **[Ubicación flicker on first paint]** → Fixed-width placeholder, and nothing on the page depends on it during SSR.
- **[Moderators lose visibility silently after the migration]** → The migration gives every current MODERATOR FI-UNJU, the only facultad with content.

## Migration Plan

1. **Schema migration:**
   - `moderator_scopes`;
   - unique `subjects.code`;
   - unique `study_plans.career_id`;
   - `careers.plan_url` with its check;
   - the lowercase unique indexes;
   - the `MODERATOR_SCOPE_CHANGED` enum value.
2. **Data migration:** the 13 universidades with their facultades, FI-UNJU scope for every MODERATOR, and the plan link of Ingeniería Informática.
3. **Rollback:** `rollback.sql` in the change folder. It drops the new table, indexes, column and the preloaded rows that have no carreras. The enum value stays, as Postgres cannot drop it, and is harmless.
4. **Dev:** apply with `prisma migrate deploy` only. No reset and no seed; data goes in by targeted inserts.
5. **e2e DB:** same command, after checking for duplicate codes.

## Open Questions

- The exact official URL for Ingeniería Informática's plan is looked up during implementation; it changes no spec.

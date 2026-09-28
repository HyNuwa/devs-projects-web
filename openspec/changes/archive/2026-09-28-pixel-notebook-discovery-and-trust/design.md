## Context

See `proposal.md` for motivation and the four delta specs for observable behavior.

The product is a pnpm monorepo with a Next.js 16/React 19 frontend and a NestJS/Prisma/PostgreSQL backend. The frontend uses App Router, CSS Modules, a small existing `components/ui` layer, client-side Axios calls, and routes for home, materias, material listing/detail, review/final forms, auth, profile, and administration. Tailwind, shadcn/ui, and Radix are not currently configured. The backend already supports subject hubs, course reviews, exam experiences, material publication moderation, Google Drive previews/downloads, ratings, and approved-only public material queries.

`Material` currently has file metadata, author, subject, publication moderation, download count, and rating aggregates, but no academic resource type, ciclo lectivo, professor, turno, helpfulness, or saved state. Course reviews and exam experiences are currently read through individual materia endpoints rather than paginated cross-materia endpoints.

The completed Open Design export defines the Pixel Notebook visual values and seven 1672×941 PNG hero candidates, each roughly 1.3–1.94 MB. Those external files are design inputs, not yet repo-owned production assets. PixelRepo assets require attribution and cannot be redistributed as an asset collection; Glyphy is only a discovery source for manually curated Unicode kaomoji.

`CourseReview` currently upserts against unique `(userId, subjectId, shift)`, permits an optional comment, and lacks ciclo lectivo, professor, recurrence, difficulty, anonymity, reporting, and reversible removal. `ExamExperience` already allows multiple records and optional professor identity but stores separate numeric theory/practice difficulty. Neither model exposes shareable detail routes, author editing for both record types, or community-content moderation.

The repository is single-context. `CONTEXT.md` owns domain language, `apps/frontend/PRODUCT.md` owns durable product constraints, and the approved prototype blueprint owns interaction intent. The initial production system remains light-theme only.

## Goals / Non-Goals

**Goals:**

- Add the new behavior through additive APIs and migrations while keeping approved materials and existing routes readable.
- Establish one semantic frontend token and primitive layer that can migrate routes incrementally.
- Keep search ranking, approved-only material visibility, and aggregate community queries on the server so every client receives consistent results.
- Keep publication moderation, helpfulness, saved state, ratings, and comments as distinct domain concepts; never present publication approval as academic verification.
- Preserve course reviews and final experiences as separate authored-evidence models with explicit privacy, editing, reporting, and moderation boundaries.
- Make asset rights, attribution, optimization, accessibility, and performance part of the implementation contract.
- Deliver and validate one complete homepage → results/hierarchy → resource-list/modal vertical slice before migrating every secondary route.

**Non-Goals:**

- Dark mode, a second visual direction, or a full visual rewrite in one commit.
- Changes to Lemmy, forum account integration, ranking/gamification, or professor ratings.
- Replacing Google Drive or the current publication moderation workflow.
- AI-generated trust summaries, inferred academic metadata, or bulk PixelRepo acquisition.
- Redesigning admin, profile, upload, or authentication beyond the minimum needed to support the new contracts.

## Decisions

### 1. Preserve layered sources of truth and use a validation gate

OpenSpec specs are authoritative for behavior. `CONTEXT.md` and `PRODUCT.md` remain authoritative for domain language and product boundaries. The approved blueprint and final screenshots supply interaction and visual intent. Imported token and asset values will be documented in `apps/frontend/DESIGN.md` only after they have been verified in the production frontend.

Wave 0 may import tokens, document provenance, optimize approved artwork, and prepare a minimal connected walkthrough. The product owner completed the first walkthrough, found the public `Revisado` label confusing, and requested revisions to search presentation and the resource-opening model. Before schema/API expansion, the revised prototype must pass an explicit owner walkthrough plus real-browser desktop/mobile functional and accessibility checks. The product owner has deferred the previously proposed 3–5 independent-student gate; that decision is recorded transparently and independent participants are not simulated.

**Alternative considered:** treat the single owner walkthrough as evidence from representative students. Rejected because it would fabricate independent validation; the owner session remains useful product evidence but is labelled accurately.

### 2. Adopt Tailwind, shadcn/ui, and Radix incrementally inside the existing React application

Tailwind is configured once for the Next.js workspace and consumes the same semantic CSS custom properties imported by `app/globals.css`. New and materially touched screens use Tailwind utilities for composition; untouched CSS Modules remain valid until a separately justified migration. The setup includes an explicit Preflight audit against current global element styles so introducing Tailwind does not silently change legacy pages.

shadcn/ui components are source-owned under the existing `components/ui` boundary and adapted to Pixel Notebook tokens instead of forming a second generic visual system. Radix primitives provide behavior and accessibility for Dialog, Sheet, Select, Popover, Tabs, Tooltip, and menu-like controls; simple display components do not add Radix without a behavioral need. Feature compositions remain under domain folders such as `components/discovery`, `components/materials`, `components/community`, and `components/subjects`.

All pages and controls remain React components. They render semantic browser elements for native keyboard and accessibility behavior; the instruction to use React does not replace buttons, links, headings, labels, or forms with non-semantic containers. Section accents are controlled through tokens or component props and never redefine generic state colors. A repo-owned `apps/frontend/DESIGN.md` records token roles, component ownership, Tailwind/shadcn conventions, and approved CSS Module exceptions.

**Alternatives considered:** rewrite every route to Tailwind at once, which widens regression scope; keep growing bespoke overlay/form behavior, which duplicates accessibility work; copy prototype CSS/HTML route by route, which creates visual drift. All are rejected in favor of incremental source-owned React primitives.

### 3. Use URL state and a dedicated discovery read model

`/buscar` treats `q`, resource type, materia, ciclo lectivo, professor, page, and supported sort as canonical URL state. The route renders from that state and client controls update it progressively; refresh, back/forward navigation, and sharing therefore preserve the result set. When the query resolves strongly to one materia, the materia identity and academic metadata replace the generic results hero and duplicate materia card.

The materials browser uses stable App Router segments for `/materiales`, career, curriculum year, materia, and resource type. Each route loads only the next level or the final file list. A shared breadcrumb is derived from the same route/read-model data so labels and links cannot drift from the visible heading. Materia pages provide a scoped `q` parameter; category and other active list state remain in the URL.

The backend adds a `DiscoveryModule` with read-oriented endpoints:

- `GET /discovery/suggestions?q=&limit=` returns bounded `subjects` then `materials` groups.
- Existing `GET /materials` gains typed filters and the documented default ordering.
- A bounded academic-hierarchy projection returns careers, years, materias, resource categories, and approved counts without forcing the frontend to fan out across records; existing curriculum endpoints are reused where they already provide an equivalent projection.
- `GET /discovery/course-reviews` returns paged cross-materia course-review summaries.
- `GET /discovery/exam-experiences` returns paged cross-materia exam-experience summaries.
- `GET /discovery/course-reviews/:id` and `GET /discovery/exam-experiences/:id` return public shareable-detail projections.

The discovery service returns DTO projections containing exactly the comparison/summary fields required by the specs. It does not expose Prisma records or force clients to fan out across materia hubs.

For accent-insensitive matching without a new PostgreSQL extension, `Subject` and `Material` receive internal normalized search keys generated by the application by lowercasing, removing diacritics, collapsing whitespace, and trimming. Suggestions are filtered from the current normalized query rather than rendered from a static group. A dedicated repository query applies parameterized SQL `CASE` expressions for exact, prefix, and contains relevance, then context completeness, recency, helpfulness count, and a stable id tie-breaker. Star aggregates remain visible comparison evidence but do not precede those defaults because small samples and popularity can distort ordering. The same normalization function runs during backfill and on relevant writes.

**Alternatives considered:** rank a fetched candidate set in the frontend or application service, which breaks stable pagination; use PostgreSQL `unaccent`/`pg_trgm`, which adds deployment privileges and extension coupling. Both are rejected for this phase.

### 4. Add explicit material context and independent interaction records

Prisma receives:

- `MaterialResourceType`: `PARCIAL`, `FINAL`, `APUNTE`, `RESUMEN`, `TRABAJO_PRACTICO`, `GUIA_EJERCICIOS`, `OTRO`.
- `Material.resourceType` with temporary/default `OTRO` for existing rows.
- Nullable `Material.academicYear`, `Material.professorId`, and `Material.shift` using the existing `Shift` enum.
- Internal `Material.searchKey` maintained from the title.
- Internal `Subject.searchKey` maintained from the name and code.
- `MaterialHelpfulness` with unique `(userId, materialId)`.
- `SavedMaterial` with unique `(userId, materialId)`.

Foreign-key and composite indexes cover material filters, publication state, helpfulness counts, saved lists, and community pagination. New-upload DTO validation requires an explicit resource type and validates academic-year bounds; optional values remain null. Existing rows backfill to `OTRO` and unknown optional context.

The established upload moderation state remains authoritative: upload creates a pending non-public material, authorized moderators approve or reject it, and every public material query constrains visibility to approved records. No public `Revisado` field or correctness claim is derived from this state.

**Alternatives considered:** add a separate academic-review table and badge, which duplicates a moderation step while inviting a stronger correctness interpretation than the reviewer can support; store helpfulness and saves as counters/arrays on `Material`, which cannot enforce per-user idempotency. Both are rejected.

### 5. Separate public aggregates from viewer-specific state

Public material and discovery DTOs include academic context, `helpfulCount`, ratings, comment summaries, and preview/download information. They expose only approved materials and do not include a public moderation badge. Viewer-specific state uses authenticated endpoints so public reads do not need optional-auth branching:

- `GET /materials/:id/viewer-state`
- `PUT /materials/:id/helpfulness` with the desired boolean state
- `PUT /materials/:id/saved` with the desired boolean state

Both mutations run transactionally and return the resulting viewer state; helpfulness also returns the updated aggregate. Repeating the same desired state is successful and count-neutral. Anonymous UI actions redirect to sign-in with a validated same-origin return path.

Publication approval and rejection continue to use the existing moderator/admin authorization boundary and moderation evidence. Pending and rejected records remain unavailable from every public projection, including direct preview and download paths.

**Alternative considered:** include viewer state in every public material response through optional authentication. Rejected because it couples cacheable public reads to cookies and complicates consistent caching and testing.

### 6. Use a URL-backed resource dialog with explicit, security-bounded preview behavior

The materia/category route renders a compact Drive-like list rather than one primary page per file. Selecting a row writes `archivo=<materialId>` while preserving the hierarchy, scoped query, filters, and list position. Refreshing or sharing restores the list and opens the same material. Closing removes only `archivo`; back navigation and focus return preserve orientation.

A source-owned React composition built on Radix Dialog provides labelled modal semantics, focus trapping, Escape/outside close behavior, background inertness, and focus restoration. Desktop uses a large preview region with a dedicated comments/community panel; mobile becomes full-screen or stacked. File identity, close, and download remain reachable before the document, while save and `Me sirvió` keep their existing authenticated behavior.

The backend response identifies whether a material has an inline-preview candidate and returns the approved preview/download URLs already produced by storage. The frontend selects an image, PDF/embed, or fallback renderer from explicit file/preview metadata rather than attempting arbitrary content sniffing.

Embedded origins are allowlisted, iframe capabilities are minimized, links use safe external-navigation attributes, and failed load state remains inside the preview boundary. Failure never removes metadata, comments, actions, or download access. Owner/moderator edit and delete controls remain available but outside the student's primary action area.

**Alternative considered:** render every Drive URL directly in a generic iframe. Rejected because formats and failure modes differ and unconstrained embeds increase security and accessibility risk.

### 7. Model community entries as independent authored evidence

The additive Prisma migration expands `CourseReview` with nullable-at-rest `academicYear` for legacy compatibility, `CourseAttempt`, optional `professorId` plus manual-name fallback, optional shared verbal `CommunityDifficulty`, and `isAnonymous`. New-write DTOs require ciclo lectivo, recommendation from one to five, condition restricted to `PROMO`, `REGULAR`, or `LIBRE`, a declared attempt value including `PREFIERO_NO_RESPONDER`, and a 30–4,000 character comment. The current `(userId, subjectId, shift)` unique constraint and upsert behavior are removed: every confirmed submission creates a new row. Existing rows with unknown year, comment, or legacy `PREFIERO_NO_RESPONDER` condition remain readable as `No informado`; new writes cannot create those gaps.

`CourseAttempt` maps to `PRIMERA_CURSADA`, `PRIMERA_RECURSADA`, `SEGUNDA_O_MAS_RECURSADAS`, and `PREFIERO_NO_RESPONDER`. `CommunityDifficulty` maps to `MUY_BAJA`, `BAJA`, `MEDIA`, `ALTA`, and `MUY_ALTA`. Public presentation renames the existing `Shift` concept to `Franja horaria`; the stored enum remains compatible. No cuatrimestre field is added.

`ExamExperience` gains nullable `examDate`, `ExamOutcome`, integer `grade`, general `CommunityDifficulty`, and `isAnonymous`. New writes keep year, exam session, format, and a 30–4,000 character narrative required, while exact date, franja horaria, professor/examiner, difficulty, outcome, and grade remain optional. A database/DTO invariant permits grade zero through ten only with `APROBADO` or `DESAPROBADO`; no code derives one field from the other. The migration preserves the existing theory/practice difficulty columns for rollback and historical evidence but stops writing them. Existing rows do not receive an invented general difficulty; they may retain explicitly labelled legacy difficulty in detail projections until their author edits them.

Both content models retain author ownership, creation/update timestamps, and efficient indexes for their approved discovery filters and date ordering. Probable duplicate detection is a non-blocking server check over recent same-author/same-materia context; a confirmation request creates the independent record. Configurable server-side rate limits protect create, edit, and report endpoints without requiring email verification or enrollment proof.

Public projections select either the username or the literal `Anónimo` per entry. Anonymous projections omit avatar, profile link, and stable pseudonym, while owner/admin projections retain user identity. Recommendation aggregates include every publicly visible review row, including anonymous and repeated legitimate cursadas, and return both average and count; removed/deleted rows are excluded. Stars render compactly with a visually hidden accessible name rather than a long visible label.

Shared summary components use three-to-four-line excerpts and link to `/resenas/[id]` or `/finales/[id]`; those details link back to the canonical materia hub. URL-backed aggregate state supports the exact filters and ordering in the community spec. Shared domain helpers own labels for franja horaria, condition, course attempt, exam period, format, outcome, difficulty, and unknown legacy values.

**Alternatives considered:** retain the current upsert/unique key, which destroys legitimate repeated-cursada evidence; infer cuatrimestre from the study plan, which stores irrelevant and potentially inaccurate context; merge records in the browser, which creates N+1 traffic and unstable pagination. All are rejected.

### 8. Add community reporting and reversible moderation without pre-publication review

Valid authenticated community submissions publish immediately. A `CommunityReport` stores reporter, categorized reason, optional bounded explanation, timestamps, and exactly one course-review or exam-experience target. Database constraints and service validation enforce one target kind. Reporting never changes public visibility.

Each target stores its current reversible removal state for efficient public filtering, while append-only community moderation actions preserve moderator, author, reason, target, action type, and date. Remove and restore operations run transactionally. The public API treats removed content as unavailable; the owner projection includes state, reason, and date; moderator projections may resolve anonymous ownership. Author-requested deletion remains a permanent owner action and cascades or anonymizes dependent reports/audit references according to the repository's retention policy without exposing private identity publicly.

Edit endpoints authorize by immutable `userId`, validate the same create contract, and use `updatedAt` to emit `Editada · <fecha>` only after authored content changes. Neither reviews nor final experiences receive helpfulness votes, replies, nested comments, or professor aggregates. Professor associations support context/filtering only.

**Alternatives considered:** pre-publication approval, which adds friction inconsistent with the accepted account-only gate; auto-hide after a report threshold, which lets unverified reports determine visibility; hard-delete moderator actions, which destroys evidence. All are rejected.

### 9. Treat visual assets as governed build inputs

Approved assets are copied individually into a Pixel Notebook asset workspace only after provenance and rights are recorded. A manifest records provider/creator, source URL or Open Design project, license/version, acquisition date, modifications, attribution, dimensions, generated variants, and consuming routes. PixelRepo source packs and editable originals are not committed as a reusable collection.

A deterministic image script produces width-bounded AVIF/WebP variants from approved hero sources. Production pages use `next/image` with explicit dimensions and `sizes`; only the active route's LCP hero has priority. Hidden route art and below-fold assets are lazy. A visible credits location contains required PixelRepo attribution. Kaomoji are a local typed allowlist and are decorative unless explicitly labeled.

**Alternative considered:** rely only on browser delivery of the 1.3–1.94 MB PNG files. Rejected because it makes hero art the dominant transfer cost and risks LCP regressions.

### 10. Roll out additively, then switch the shared shell

Backend schema and APIs deploy before frontend routes depend on them. Existing response fields and routes remain compatible; new fields are additive. Frontend primitives and new routes can be verified while the current shell remains active, then the navigation/homepage switch happens once the vertical slice passes functional, accessibility, and performance checks.

Route migration proceeds homepage/search/detail first, then materias, reviews, and finals. Auth, upload, profile, and admin adopt shared primitives only where required by touched flows, avoiding a broad CSS rewrite.

**Alternative considered:** replace the entire frontend shell and every route in one release. Rejected because it prevents representative vertical verification and makes rollback unnecessarily broad.

## Risks / Trade-offs

- **[Prototype imagery dominates LCP]** → Pre-generate modern responsive variants, reserve dimensions, allow one eager hero, and measure transfer/LCP before the shell switch.
- **[Publication approval is mistaken for academic correctness]** → Expose approved content without a `Revisado` badge, keep ratings/helpfulness/context distinct, and test the exact language after implementation.
- **[Deep hierarchy becomes slow or disorienting]** → Use stable URLs, linked breadcrumbs, bounded level projections, honest empty states, and materia-scoped search.
- **[Modal preview harms navigation or mobile usability]** → Encode selection in the URL, preserve list state and focus, use Radix dialog behavior, and verify desktop, mobile, keyboard, and reload flows.
- **[Normalized search keys drift from source text]** → Centralize normalization, run it on create/update, backfill in migration tooling, and add service tests for accented FI-UNJU names.
- **[Raw SQL ranking diverges from DTO filters]** → Isolate the parameterized query behind one repository contract and cover ordering/filter combinations with integration tests.
- **[Existing materials all become `OTRO`]** → Keep the migration lossless, show honest unknown values, and allow later moderator/contributor enrichment without blocking public access.
- **[Additional reactions increase write contention]** → Enforce unique constraints, use transactional desired-state mutations, and index by material and user.
- **[Third-party asset license changes or is ambiguous]** → Snapshot provenance/license facts at adoption time, keep attribution visible, and exclude any asset whose rights are not clear.
- **[Four top-level entrances duplicate subject data]** → Use read projections and canonical materia links; do not create parallel review or experience records.
- **[Multiple legitimate reviews are abused to skew averages]** → Keep every confirmed cursada visible and countable as agreed, but add probable-duplicate warnings, authenticated rate limits, transparent counts, reports, and moderator removal rather than hidden deduplication.
- **[Anonymous publication is mistaken for unowned content]** → Retain immutable internal ownership, omit public identity consistently, and expose it only to the owner and authorized moderators.
- **[Legacy difficulty or missing review fields are fabricated during migration]** → Preserve source fields, expose honest unknown/legacy states, and require the new contract only on create or author edit.
- **[Scope grows into a full legacy redesign]** → Enforce the route order and non-goals; migrate untouched routes only through separately approved work.

## Migration Plan

1. **Design-source adoption:** verify rights, import canonical tokens and selected artwork, create the manifest and credits treatment, generate responsive variants, and document the implemented system.
2. **Owner validation gate:** record the completed owner walkthrough as a revise decision, apply the approved search/moderation/hierarchy/modal changes, then require a dated owner proceed decision backed by real-browser desktop/mobile checks. Record external student testing as deferred rather than completed.
3. **Additive schema migration:** add material enums/context/search/helpfulness/save structures plus community attempt/difficulty/outcome/privacy/report/removal structures. Preserve the existing material publication-moderation state and approved-only visibility. Remove the course-review upsert uniqueness only after create semantics are deployed; preserve unknown legacy community values and backfill existing materials without deleting or hiding records.
4. **Backend deployment:** release additive material DTOs, approved-only hierarchy/discovery projections, community create/edit/delete/report/moderation contracts, anonymous public projections, viewer-state endpoints, and tests while the current frontend remains compatible.
5. **Frontend foundation:** configure Tailwind and shadcn/ui, audit Preflight, add Radix-backed behavior primitives, release tokens, and verify the new shell and routes without removing legacy routes or CSS Modules.
6. **Vertical slice:** switch homepage, `/buscar`, hierarchical materials routes, resource lists, and preview dialog after discovery, breadcrumb, keyboard, reduced-motion, preview fallback, and image budgets pass.
7. **Secondary migration:** move materia hubs, `/resenas`, `/finales`, and their detail routes to shared summaries, forms, privacy/report controls, and presentation helpers.
8. **Cleanup:** remove superseded homepage/material presentation code only after route parity and regression checks; retain additive database structures.

Rollback is application-first: restore the previous shell/routes and backend version while leaving additive nullable columns and tables in place. Do not drop migrated data during an urgent rollback. A later reviewed migration may remove unused structures only after backups and compatibility checks.

## Open Questions

- Which editorial serif file, if any, has an explicit web-distribution license suitable for bundling? Until confirmed, use the documented Charter/Georgia/system fallback stack.
- Which individual PixelRepo accents, if any, add value beyond the completed hero set? Default to none; adoption requires a route-specific need and completed manifest entry.

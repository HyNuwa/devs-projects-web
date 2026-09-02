## 1. Design source adoption and validation gate

- [x] 1.1 Create the canonical Pixel Notebook token stylesheet from the approved Open Design export and verify every documented semantic token maps to one production CSS custom property without route-local duplicates.
- [x] 1.2 Create the asset provenance/attribution manifest, record rights for each selected Open Design or third-party asset, and verify assets with incomplete rights are excluded.
- [x] 1.3 Add a deterministic hero-image conversion workflow and generate width-bounded AVIF/WebP variants; verify dimensions, formats, and file sizes in the manifest and confirm source PNGs are not the default page candidates.
- [x] 1.4 Create `apps/frontend/DESIGN.md` from the implemented tokens, typography roles, component rules, asset policy, and approved exceptions; verify it agrees with `CONTEXT.md`, `PRODUCT.md`, and the Pixel Notebook interface spec.
- [x] 1.5 Prepare the initial connected homepage → results → material-detail walkthrough and five-task protocol; verify search, comparison, preview, download, save, and helpfulness can be exercised without coaching.
- [x] 1.6 Record the product owner's completed walkthrough as a dated `REVISAR` decision, including successful tasks, the malformed suggestion presentation, and confusion caused by `Revisado`; record the proposed 3–5 independent-student validation as explicitly deferred rather than completed.
- [x] 1.7 Revise the connected prototype to remove public `Revisado`, use query-matched responsive suggestions, add hierarchy/breadcrumb/materia-search flows, remove the duplicated strong-materia hero, and replace standalone file detail with a Drive-like list plus URL-backed preview/comments dialog.
- [x] 1.8 Exercise the revised prototype in a real browser at desktop and mobile widths, including hierarchy, breadcrumbs, scoped/global search, preview reload/close, comments, download, save, helpfulness, keyboard focus, and preview failure; store concise dated evidence.
- [x] 1.9 Record the product owner's explicit dated `PROCEDER` or `REVISAR` decision on the revised prototype before starting task group 2.

## 2. Material and community schema foundations

- [x] 2.1 Add `MaterialResourceType`, material academic-context fields, normalized search keys, `MaterialHelpfulness`, and `SavedMaterial` to Prisma while preserving the established material publication-moderation state; verify `prisma validate` and schema-generation checks pass.
- [x] 2.2 Create an additive migration with foreign keys, unique constraints, and filter/reaction indexes; verify a migration test preserves existing materials, backfills `resourceType=OTRO`, and leaves optional context unknown.
- [x] 2.3 Implement one shared accent-insensitive search-key normalizer and wire it to subject/material create and update paths; verify unit tests cover accents, case, whitespace, materia code, and deterministic output.
- [x] 2.4 Add a controlled backfill for existing subject/material search keys and verify a dry-run reports expected row counts before the write path is exercised in migration tests.
- [x] 2.5 Extend create/update material DTO validation for resource type, academic year, professor, and turno; verify tests accept omitted optional context and reject invalid enums, years, and foreign keys.
- [x] 2.6 Extend backend response DTOs and frontend material types with academic context, approved-only public visibility, helpful count, star/comment summaries, preview capability, and viewer-state contracts; verify type-checking catches missing required response fields and no public moderation badge is introduced.
- [x] 2.7 Add `CourseAttempt`, `CommunityDifficulty`, and `ExamOutcome`; extend course reviews and final experiences with the approved year/professor/attempt/difficulty/date/outcome/grade/anonymity fields and verify `prisma validate` plus enum-bound tests pass.
- [x] 2.8 Create the additive community migration, remove the course-review `(userId, subjectId, shift)` unique constraint, preserve legacy unknown fields and theory/practice difficulty without inventing replacements, and verify fixtures with repeated same-year cursadas survive as separate records.
- [x] 2.9 Add community reports, reversible removal state, and append-only moderation evidence with exactly-one-target constraints and indexes; verify migration tests cover review targets, final targets, remove, restore, and invalid dual/no-target rows.
- [x] 2.10 Replace course-review upsert DTO semantics and extend both community write contracts with required 30–4,000 character narratives, field bounds, optional manual professor fallback, and cross-field grade/outcome validation; verify focused DTO tests cover every accepted enum and rejection case.

## 3. Trust, interaction, community mutation, and preview APIs

- [x] 3.1 Preserve mandatory material publication moderation so valid uploads enter pending, only authorized moderators can approve or reject, and moderation evidence remains available to authorized/contributor views; verify authorization and transition tests.
- [x] 3.2 Enforce approved-only public material reads, search, hierarchy counts, preview, comments, and download, including direct-ID requests; verify pending/rejected records remain non-public and public DTOs expose no `Revisado` or academic-correctness claim.
- [x] 3.3 Implement transactional desired-state helpfulness mutations with the unique user/material constraint; verify repeated set/unset requests are idempotent and aggregate counts remain correct under tests.
- [x] 3.4 Implement transactional desired-state save mutations and the authenticated material viewer-state endpoint; verify repeated save/unsave requests remain duplicate-free and do not alter ranking or trust data.
- [x] 3.5 Add explicit preview capability/fallback metadata to public material responses while preserving existing download behavior; verify supported, unsupported, unavailable, and failed-preview contract tests pass.
- [x] 3.6 Preserve approved public read/search/preview/download/comment access while protecting mutations; verify anonymous API tests can read and download but receive the established unauthorized contract for rating, comment, helpfulness, and save writes.
- [x] 3.7 Implement independent course-review create, owner edit, and permanent owner delete operations with probable-duplicate warning/confirmation, entry-level anonymity, account-only authentication, and rate limiting; verify same-author/same-materia/same-year records remain independent and email verification is not required.
- [x] 3.8 Implement final-experience create, owner edit, and permanent owner delete operations with multiple-attempt support, one optional general difficulty, grade/outcome invariants, entry-level anonymity, and rate limiting; verify ownership and validation integration tests pass.
- [x] 3.9 Implement categorized community reporting without automatic hiding and moderator remove/restore actions with owner-visible reason/date and protected anonymous ownership; verify authorization, audit-evidence, public-visibility, and aggregate-exclusion scenarios pass.

## 4. Discovery and community read models

- [x] 4.1 Add the backend `DiscoveryModule` and bounded grouped suggestion endpoint; verify every returned item matches the accent-insensitive current query, materias precede resources, and no-result queries return an explicit empty group state.
- [x] 4.2 Add a bounded approved-only academic hierarchy read model for careers → curriculum years → materias → resource categories/files, reusing equivalent existing curriculum endpoints where available; verify counts, stable identifiers, empty levels, and direct-level access without N+1 queries.
- [x] 4.3 Extend paged material queries with resource type, materia, ciclo lectivo, professor, scoped/global query, page, and supported sort validation; verify materia-scoped search cannot return another materia and every filter works alone and in representative combinations.
- [x] 4.4 Implement parameterized database ranking for exact/prefix/contains relevance, context completeness, recency, helpfulness, and stable id tie-breaking; verify integration fixtures produce the documented deterministic order across pages while star aggregates remain presentation-only evidence.
- [x] 4.5 Implement paged course-review discovery with recent/star ordering, materia/year/professor/difficulty/cursada filters, canonical materia links, public anonymity projection, and visible-only average/count; verify URL-query fixtures count every legitimate visible record and exclude removed entries.
- [x] 4.6 Implement paged final-experience discovery with exam-date/publication-date fallback ordering and materia/year/period/professor/format/outcome filters; verify stable pagination, anonymous projection, no grade sort, no all-subject fan-out, and omission of unknown optional facts.
- [x] 4.7 Implement public review/final detail projections for shareable identifiers and owner/moderator variants for removed or anonymous records; verify not-found, removed, owner, moderator, and ordinary-public authorization scenarios.
- [x] 4.8 Add query-count or repository-level integration coverage for discovery projections; verify representative hierarchy, result, review, final, aggregate, and detail requests do not introduce N+1 lookups.

## 5. Pixel Notebook React primitives and shared shell

- [x] 5.1 Configure Tailwind for the Next.js workspace and initialize shadcn/ui against the existing aliases and semantic CSS variables; verify dependency installation, config resolution, and a production frontend build succeed.
- [x] 5.2 Audit Tailwind Preflight against current global styles and CSS Modules, document every compatibility override, and verify representative untouched legacy routes have no unintended typography, spacing, control, or border regression.
- [x] 5.3 Import the canonical tokens once through frontend globals and map Tailwind/shadcn roles to them; verify touched raw color/shadow values use semantic variables and the frontend build has one active token source.
- [x] 5.4 Add or migrate source-owned React Button, Input, form field, chip, disclosure, and loading/empty/error primitives; use Radix-backed Dialog, Sheet, Select, Popover, Tabs, Tooltip, and menus only where behavior requires them, and verify component/accessibility tests cover variants, focus, labels, and semantic DOM.
- [x] 5.5 Add a semantic responsive Breadcrumb React primitive with linked ancestors, `aria-current`, compact overflow handling, and route-derived labels; verify keyboard, narrow viewport, and 200% zoom behavior.
- [x] 5.6 Implement the mobile filter Sheet with focus trap, Escape handling, labelled controls, and focus restoration; verify keyboard interaction tests cover open, apply, clear, and close flows.
- [x] 5.7 Rebuild the shared shell with Materias, Reseñas, Materiales, Finales, `Subir material`, and account actions while keeping forum/ranking outside primary navigation; verify desktop/mobile route and active-state checks pass.
- [x] 5.8 Add global focus-visible, 200% zoom, non-color status, and reduced-motion rules; verify a fixture journey remains operable with keyboard-only and reduced-motion settings.
- [x] 5.9 Add the local typed kaomoji allowlist with accessible decorative behavior and no runtime Glyphy request; verify network inspection and component tests show only local Unicode content.

## 6. Homepage and comparison search

- [x] 6.1 Add typed frontend clients for grouped suggestions and filtered material discovery; verify request serialization preserves supported URL parameters and rejects unsupported values.
- [x] 6.2 Build the Pixel Notebook homepage hero with dominant search, truly query-matched grouped suggestions, assessment shortcuts, and optional daily kaomoji; verify search remains the first meaningful task and the suggestion panel stacks before text becomes cramped on desktop or mobile.
- [x] 6.3 Add supporting homepage sections in the approved order using real API data or explicitly labelled bounded empty states; verify no synthetic platform-scale claim is rendered.
- [x] 6.4 Implement `/buscar` with URL-backed query/filter/page/sort state and compact resource rows; when one materia strongly matches, promote its identity/metadata to the page heading and omit the generic hero plus duplicate materia card, while retaining an all-materias escape. Verify refresh, sharing, and browser back/forward preserve state.
- [x] 6.5 Implement comparison rows with resource type, materia, optional context, helpful count, star aggregate, and open-preview action; verify missing values render `No informado`, no `Revisado` badge appears, and stars remain compact comparison evidence.
- [x] 6.6 Implement desktop and mobile filter controls with visible active chips and clear actions; verify equivalent filter behavior and keyboard access at representative viewport sizes.
- [x] 6.7 Implement loading, partial-context, no-match, filtered-empty, API-error, and retry states for suggestions/results; verify query and filter state survive every failure path.
- [x] 6.8 Implement `/materiales` hierarchy routes for career → year → materia → resource category/file list with breadcrumbs and materia-scoped search; verify stable URLs, empty states, scope isolation, deep links, and mobile navigation.

## 7. Resource list and context-preserving preview

- [x] 7.1 Build compact Drive-like resource lists inside materia/category routes and encode the selected file as `archivo=<materialId>` without losing query, filter, breadcrumb, or scroll context; verify row activation, reload, sharing, browser history, and close behavior.
- [x] 7.2 Build the source-owned Radix Dialog preview composition with visible file identity/actions, large desktop preview plus right-hand comments/community panel, and full-screen or stacked mobile layout; verify focus trap, Escape/outside close, background inertness, accessible naming, and focus restoration.
- [x] 7.3 Implement image/PDF preview renderers with allowlisted embed behavior and an explicit unsupported/failed fallback; verify metadata, comments, actions, and download remain available when preview fails.
- [x] 7.4 Wire `Me sirvió` and `Guardar` to viewer state and idempotent mutations; verify optimistic or loading feedback reconciles with server state and anonymous sign-in preserves a same-origin return path.
- [x] 7.5 Integrate ratings and comments into the preview dialog's community panel while preserving existing behavior; verify stars, counts, comment states, and `Me sirvió` remain visually distinct from publication moderation.
- [x] 7.6 Preserve owner/moderator edit and delete controls outside the student's primary modal actions; verify existing authorization and destructive-confirmation tests still pass.

## 8. Materias, course reviews, and finals

- [x] 8.1 Centralize presentation labels for franja horaria, result, cursada situation, exam period, format, outcome, difficulty, resource type, and unknown/legacy values; verify aggregate, detail, form, and materia-hub fixtures render identical terminology.
- [x] 8.2 Build shared React review/final summary cards with compact facts, three-to-four-line excerpts, stars-only visual treatment with an accessible name, `Leer más`, anonymous identity, and `Editada · <fecha>`; verify missing optional facts and legacy difficulty are omitted or explicitly labelled rather than fabricated.
- [x] 8.3 Rebuild the course-review form for independent creates and owner edits with required year/stars/result/cursada/comment, optional professor/franja/difficulty, per-entry anonymity, 30–4,000 character feedback, and probable-duplicate confirmation; verify valid, invalid, legacy-edit, and keyboard flows.
- [x] 8.4 Rebuild the final-experience form for independent attempts and owner edits with required year/period/format/comment, optional date/professor/franja/difficulty/outcome/grade, per-entry anonymity, and grade/outcome validation; verify valid, invalid, repeated-attempt, and keyboard flows.
- [x] 8.5 Implement `/resenas` with pagination, URL-backed approved filters/sorts, transparent average/count, Pixel Notebook cobalto entrance, and canonical materia links; verify anonymous/repeated/removed aggregation plus filtered, empty, error, retry, and mobile states.
- [x] 8.6 Implement `/finales` with pagination, URL-backed approved filters, deterministic date fallback ordering, Pixel Notebook night entrance, and canonical materia links; verify no grade sort plus filtered, empty, error, retry, and mobile states.
- [x] 8.7 Implement `/resenas/[id]` and `/finales/[id]` with full narratives, known facts, materia links, share/report actions, and bounded unavailable states; verify direct navigation, sharing, anonymous identity, not-found, removed, and responsive behavior.
- [x] 8.8 Add owner edit/permanent-delete controls and report UI plus the minimum moderator remove/restore view required by the contract; verify ownership, confirmation, categorized reasons, no automatic hiding, owner-visible removal evidence, and moderator-only anonymous identity.
- [x] 8.9 Migrate the materia index and hub to shared tokens, cards, forms, and source records without duplicating community entries; verify aggregate/detail/hub consistency and existing material-hub behavior.
- [x] 8.10 Verify the review/final structure uses Pixel Notebook primitives rather than the fifth reference image's visual styling through screenshot comparison against the approved design sources.

## 9. Integrated verification and handoff

- [x] 9.1 Run Prisma validation/generation, migration verification, backend lint/build, and backend unit/integration suites with full output stored in ignored artifacts; verify concise summaries report zero unresolved failures.
- [ ] 9.2 Run frontend lint, type/build, and component/integration suites with full output stored in ignored artifacts; verify concise summaries report zero unresolved failures.
- [ ] 9.3 Exercise homepage → suggestions → `/buscar` plus `/materiales` → career → year → materia → scoped search → file-list dialog → preview/comments/download and authenticated helpful/save flows in a real browser at desktop and mobile widths; verify all spec scenarios and failure states have evidence.
- [ ] 9.4 Exercise authenticated review/final create → anonymous/public discovery → shareable detail → edit → report → moderator remove/restore → owner delete flows in a real browser; verify averages, visibility, identity boundaries, timestamps, URLs, and failure states match the community spec.
- [ ] 9.5 Audit keyboard-only use, breadcrumb navigation, preview-dialog focus trapping/restoration, 200% zoom, reduced motion, semantic labels, non-color statuses, and contrast; verify no high-severity accessibility issue remains.
- [ ] 9.6 Measure route image transfer, LCP, and CLS for the homepage and four section entrances; verify only the active hero is eager, source PNGs are not default candidates, and documented budgets pass.
- [ ] 9.7 Verify visible asset credits and manifest completeness in the built product; confirm no unapproved PixelRepo source pack, remote Glyphy dependency, or unlicensed font is shipped.
- [ ] 9.8 Run `graphify update .` after implementation and verify the knowledge graph completes without losing the new discovery, hierarchy, preview-dialog, publication-moderation, community-moderation, and route relationships.
- [ ] 9.9 Record implementation decisions, owner-gate resolution, the explicitly deferred external-student validation, verification summaries, and any other deferred follow-up; verify the OpenSpec task checklist and repository documentation agree before requesting archive.

## Why

DevsProject already stores materias, academic resources, course reviews, and exam experiences, but its current interface does not provide the search-first comparison, explicit academic context, or separated trust signals that students need when choosing study material under time pressure. The completed Pixel Notebook prototype and design system now provide enough visual certainty to turn the approved interaction blueprint into a production contract.

## What Changes

- Adopt the completed Pixel Notebook visual system as a repo-owned, responsive, accessible frontend foundation with documented tokens, typography, artwork provenance, attribution, and image-performance rules.
- Replace the current homepage and material-card browsing emphasis with grouped materia/resource search suggestions, a comparison-first `/buscar` results experience, and a browsable `Materiales → carrera → año → materia → tipo de recurso` hierarchy.
- Extend academic resources with required resource type and optional ciclo lectivo, professor, and turno context while preserving existing records.
- Preserve mandatory pre-publication moderation for every upload: new material remains private while pending, moderators approve or reject it, and only approved material enters public reads, search, preview, and download. Because every public material has passed this gate, the interface does not display a redundant `Revisado` badge or imply that moderation guarantees academic correctness.
- Add an idempotent per-user `Me sirvió` signal that remains distinct from ratings and academic correctness.
- Add an authenticated saved-resource state so the approved `Guardar` action persists without blocking public discovery.
- Add linked breadcrumbs and materia-scoped search throughout hierarchical material discovery.
- Replace standalone per-file detail as the primary journey with Drive-like resource lists and a URL-backed preview modal that keeps file context, download/save/usefulness actions, and comments available, with resilient preview fallbacks.
- When `/buscar` resolves a strong materia match, use that materia's identity and academic metadata as the page heading instead of duplicating a generic discovery hero above a second materia card.
- Keep `Reseñas de cursada` and `Experiencias de final` as distinct community records, add cross-materia `/resenas` and `/finales` entrances plus shareable detail pages, and keep materia hubs as their canonical academic context.
- Expand course reviews with ciclo lectivo, one independent record per real cursada, optional professor/franja horaria/difficulty context, recurrence situation, mandatory stars/result/narrative, and transparent aggregates.
- Expand final experiences with one general difficulty, optional exam date/result/grade/professor context, multiple independent attempts, and final-specific filtering without professor rankings.
- Add per-entry anonymous publication, author edit/delete, visible edit dates, categorized reports, and reversible moderator removal while requiring only an authenticated account to publish.
- Adopt Tailwind CSS for new and touched screens, repo-owned shadcn/ui components, and Radix behavior primitives incrementally alongside legacy CSS Modules.
- Validate the revised core journey through an explicit product-owner walkthrough and real-browser desktop/mobile checks before backend-heavy implementation. Record the prior external 3–5-student gate as deferred by the product owner rather than fabricating independent participants.

## Capabilities

### New Capabilities

- `academic-resources/discovery`: Grouped search suggestions, hierarchical carrera/year/materia/resource browsing, breadcrumbs, materia-scoped search, materia-first comparison results, filtering, ordering, URL-backed state, and public discovery access.
- `academic-resources/trust`: Resource academic context, approved-only publication, usefulness reactions, ratings, and context-preserving modal preview behavior.
- `academic-community/discovery`: Distinct review/final publication contracts, cross-materia discovery, shareable details, anonymity, lifecycle, aggregation, reporting, and moderation behavior.
- `frontend/pixel-notebook-interface`: Shared Pixel Notebook shell, visual tokens, responsive/accessibility behavior, asset governance, and artwork performance requirements.

### Modified Capabilities

None. The repository has no existing OpenSpec capability specifications; current behavior is captured as implementation context rather than misrepresented as a pre-existing spec contract.

## Impact

- **Frontend:** Next.js App Router navigation, homepage, new `/buscar`, hierarchical materials browser, linked breadcrumbs, materia-scoped search, Drive-like file lists, URL-backed preview/comment dialogs, materia hubs, `/resenas`, `/finales`, shareable community detail routes, Tailwind/shadcn/Radix foundations, shared UI primitives, styles, types, and public assets.
- **Backend:** NestJS materials and subjects/community APIs, approved-only public material projections, hierarchy/read DTOs, authenticated community mutations, anonymous public projections, report/moderation actions, search/filter ordering, rate limits, and test coverage.
- **Data:** Additive Prisma migrations for material academic context, helpfulness, saved resources, expanded course reviews/final experiences, reports, and reversible removal evidence, while preserving the established material publication-moderation state and safely handling existing records.
- **Operations and legal:** Asset provenance and visible attribution, optimized AVIF/WebP variants, performance budgets, accessibility checks, and concise verification logs.
- **Compatibility:** Existing public reading and download paths remain available; existing material records remain readable with unknown optional metadata represented explicitly.

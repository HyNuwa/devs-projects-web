# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The primary user is a first- or second-year FI-UNJU engineering student preparing for an exam, often under time pressure, who needs to find a relevant and trustworthy academic resource quickly.

## Product Purpose

DevsProject is a trusted academic survival kit. It helps students identify the right materia, compare resources using meaningful academic context, and reach a useful preview or download with minimal friction.

Success means a new student understands the product within five seconds and reaches a relevant resource within three interactions.

## Positioning

DevsProject organizes community-contributed resources around FI-UNJU materias and their real cursada context. Mandatory moderation controls publication: pending or rejected uploads stay private, while approved resources enter public discovery without a redundant review badge or a claim of academic correctness.

## Operating Context

Students search by materia or assessment need, inspect subject-first results, narrow resources by academic metadata, compare trust information, and open or download the strongest match. Community contribution supports this discovery journey rather than competing with it.

## Capabilities and Constraints

- The product already has materia hubs, course reviews, exam experiences, resource upload, publication moderation, and professor information.
- The visual prototype and Pixel Notebook design system are complete. Production work must now connect that visual authority to the approved homepage, search results, career/year/materia hierarchy, compact resource lists, and context-preserving preview dialog.
- Prototype data is synthetic and bounded; production work must preserve existing backend capabilities while adding the academic context, approved-only discovery, and usefulness contracts required by the approved experience.
- Authentication must not block reading, searching, previewing, or downloading. Mutating community actions may require sign-in and must preserve the user's return path.
- The external Lemmy forum remains separate from the academic-resource experience.
- The interface is responsive, supports keyboard navigation, and respects reduced-motion preferences.

## Brand Commitments

- Product name: DevsProject.
- Voice: friendly Argentine student language such as “buscá,” “subí,” and “aprobá”; capable classmate rather than administrator or game narrator.
- Academic concepts use real terminology. Fantasy item, loot, rarity, XP, and rank language must not replace it.
- The completed Pixel Notebook screenshots and Open Design export are the binding visual reference. `CONTEXT.md` and the approved interaction blueprint remain binding for domain language and behavior.

## Evidence on Hand

- Existing production-oriented frontend and backend implementation in this repository.
- Historical implementation record at `.omo/plans/reviews-subject-hubs-and-moderation.md`.
- Approved prototype direction at `../../../ui-style-lab/DESIGN_DIRECTION.md`.
- Completed Pixel Notebook screenshots and Open Design design-system export, closed on 2026-08-25.
- The product owner completed the initial walkthrough and recorded `REVISAR` on 2026-08-26. Representative-student testing with 3–5 FI-UNJU students remains explicitly deferred rather than completed or simulated.

## Product Principles

- Search and resource discovery lead; contribution and community remain secondary.
- Academic context and honest community evidence outrank aggregate ratings or decorative prominence; publication moderation remains an internal gate, not a public correctness signal.
- The shortest useful path should still preserve enough information for a student to judge relevance.
- Playfulness may create warmth, but must never obscure academic meaning or task completion.
- Unknown academic metadata is shown honestly rather than inferred.

## Accessibility & Inclusion

The core discovery journey must remain usable on mobile and desktop, preserve trust metadata at every viewport, support keyboard interaction, expose clear focus states, and provide an immediate reduced-motion alternative.

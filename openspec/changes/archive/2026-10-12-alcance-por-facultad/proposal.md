## Why

The model already has universidad → facultad → carrera (change `instituciones`), but nothing in the product lets anyone walk it: `/materias` is a flat list and `/materiales` a career-first browser. A student from another universidad who follows a shared link finds nothing of theirs. Moderation still lets every moderator act on every caso, which stops working the day a second facultad joins. Both were kept out of `instituciones` and are needed before the site link is shared with other universities' groups (after `catalogo-editable`, the next change).

## What Changes

- **Browsing by institution**, following the redesign canvas: Universidades → Universidad → Facultad → Carrera → Materia, at `/universidades/[uni]/[facultad]/[carrera]`, always with every step. The menu's «Materias» goes there and `/materias` redirects to it. A signed-in student with a carrera cursando sees a «Tu carrera» shortcut. Cards show only real counts (facultades, carreras, materias, published materials; años and créditos for a carrera) and never «estudiantes». The materia page gets a linked breadcrumb; its carrera comes from the link the student followed, else their own carrera, else the first by name.
- **Preloaded universidades**: the main universidades of Argentina (NOA plus the large national ones) with their facultades, loaded by a data migration with recorded sources. A universidad or facultad without carreras shows an honest empty state («Todavía no cargamos sus carreras»), with no «Próximamente» cards, «Avisame» buttons or dead links.
- **Ubicación chip** in the header, replacing the fixed UNJU/FI mark: the facultad of the student's carrera, or one a visitor chose on their device. It links to that facultad and sets where search and `/ranking` start, with an «en todas» option; it never hides content.
- **No plans in the interface** (ADR 0003): «Mi carrera» asks universidad → facultad → carrera, keeping cursando/terminada; the carrera page lists its materias by año and cuatrimestre. Internally each carrera keeps exactly one plan. A carrera can carry a link to its official plan, shown as «Plan oficial ↗».
- **Materia codes become unique** across the system, so `/materias/[código]` always names one materia.
- **Alcance de moderación** (`ModeratorScope`): an admin assigns each moderator one or more facultades, when promoting and from the account file. Casos (including revisión previa), correcciones, apelaciones, historial and the panel counts are limited to the moderator's facultades, judged by the facultad of the content's materia. Casos about content without a facultad go only to admins. A moderator without facultades sees no casos. Usuarios lists only accounts with a carrera in, or a signed caso about content of, the moderator's facultades, and only those can be sanctioned. Appeals go to another moderator covering that facultad, else to an admin. Existing moderators get FI-UNJU.
- **BREAKING (routes):** `/materias` (flat list) and `/materiales/[...segments]` (hierarchy browser) are replaced; old URLs redirect to the equivalent page. `/materiales/[id]` and `/materiales/nuevo` stay.
- **Removed:** `SubjectList` and `MaterialHierarchyPage` with their tests and the hierarchy endpoints only they use.

Out of scope: editing the catalog from the interface and student requests with the plan link (change `catalogo-editable`), filtering the home page by ubicación, plan versions.

## Capabilities

### New Capabilities
- `academic-structure/browsing`: the Universidades → Universidad → Facultad → Carrera pages, their counts and empty states, the «Tu carrera» shortcut, the materia breadcrumb, and the ubicación chip with its effect on search.
- `moderation/scope`: assigning facultades to moderators and what a moderator can see and act on because of them.

### Modified Capabilities
- `academic-structure/institutions`: one hidden plan per carrera, globally unique materia codes, the catalog lists carreras with their official plan link, students declare carreras instead of plans, and the main universidades are preloaded.
- `academic-resources/discovery`: the career-first hierarchical browsing is removed; materia-scoped search moves to the materia page; a materia's placements name carrera, año and cuatrimestre without plans.
- `frontend/app-shell`: the header shows the ubicación chip instead of the UNJU/FI mark, and Materias is current on the new routes.
- `frontend/pixel-notebook-interface`: the breadcrumb follows Universidades → Universidad → Facultad → Carrera → Materia.
- `moderation/cases`: the panel and the history are limited to the viewer's facultades, with an admin filter and the «Tu rol» label.
- `moderation/appeals`: the reviewer must cover the appeal's facultad.
- `moderation/sanctions`: who a moderator can sanction, and who Usuarios lists, follow the alcance de moderación.
- `reputation/rankings`: defaults follow the ubicación, and membership is described by declared carreras.

## Impact

- **Database:** new `moderator_scopes` table; unique `subjects.code`; unique `study_plans.career_id`; nullable `careers.plan_url`; data migration with the preloaded universidades and facultades and the FI-UNJU scope for current moderators. Each migration gets a rollback.
- **Backend:**
  - institutions module (catalog with counts, pages by slug);
  - study plans (declare by carrera);
  - every moderation service (cases, summary, corrections, appeals, history, users, sanctions) through one scope filter;
  - the admin promote and account file endpoints (facultades);
  - ranking defaults;
  - search (facultad filter);
  - the hierarchy endpoints are removed.
- **Frontend:**
  - new pages under `/universidades`;
  - redirects from `/materias` and `/materiales/[...]`;
  - `SubjectHub` (breadcrumb and materia search);
  - the header and the ubicación chip;
  - «Mi carrera»;
  - the moderation panel (label, filter, facultades in the account file);
  - `/ranking` defaults.
- **Docs:** README_MODERACION, README_DATABASE, README_AUTH, README_SECURITY, the cleanup plan; ADR 0002 (updated) and ADR 0003 (new) are already written.

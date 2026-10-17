## Why

The redesign left «a dedicated Experiencias landing» pending: the menu's Experiencias still opens `/resenas`, a flat list, nothing shows a materia's reseñas and finales together, and a visitor has no place that answers «¿cómo les fue a los que ya cursaron?». The Experiencias canvases exist (landing, with session, per materia, detail, mobile). This change builds the reading side with the data the platform already stores; the writing side (step-by-step forms and the new fields they collect) is the next change, 5b.

## What Changes

- **Experiencia** becomes the umbrella term for a reseña de cursada or an experiencia de final (`CONTEXT.md`). It names the section and the action «Escribir experiencia».
- **`/experiencias`, the landing.** Hero with a materia search; «¿Qué estudiás?» with the universidad and facultad from the Ubicación plus carrera, año and type chips (carrera, año and type in the URL); «Materias más comentadas» (facultad, last 120 days, at least 3 experiencias each, top 6); «Tu turno» with «Escribir experiencia»; «Cómo leer una experiencia»; «Recién publicadas», reseñas and finales interleaved by publication date with a type chip. A signed-in student gets their declared carrera preselected, «tomado de tu perfil», with no «Plan» label (ADR 0003). Without an Ubicación the landing invites to choose one and shows every facultad. «Tus materias» from the mochila is left out until the mochila exists.
- **`/experiencias/<código>`, the page per materia.** Breadcrumb Experiencias › carrera › materia; «Ver recursos de la materia» and «Escribir experiencia». A summary built only from existing fields: reseñas, finales, recomendación promedio, «aprobaron X de Y»; Promoción / Regular / Libre bars; the dificultad histogram; «El final» with formato, dificultad teoría y práctica, mesa más comentada and nota promedio. Nota de promoción and preparación típica wait for 5b. Every percentage, mode and average respects the **mínimo de muestra**. Tabs «Reseñas · N» / «Finales · N» with the filters of each type (franja and resultado are new for reseñas), sort, and «Ver más» in place.
- **Details.** `/resenas/<id>` and `/finales/<id>` gain «La materia según N …» and «Con el mismo contexto». «Me sirvió» stays out.
- **`/experiencias/escribir`.** A focus screen that asks type and materia and continues to the existing forms. Where the materia is known, «Escribir experiencia» opens a two-option menu.
- **One experiencia card** everywhere (landing, materia page, `/resenas`, `/finales`): author or the **marca de anónimo**, context chips, bounded excerpt, «Leer completa» and «Reportar». Anonymous entries show a single shared mark instead of no avatar.
- **Shell.** The menu and footer point Experiencias at `/experiencias`; `/experiencias/**` marks Experiencias current; `/experiencias/escribir` is a focus screen. `/resenas` and `/finales` remain as the full lists. The materia hub's reseñas and finales tabs become a summary card linking to `/experiencias/<código>`.
- **Backend.** Three public reads in the discovery module (overview, materia summary, related entries) and two filters on the course-review list (franja, resultado). No migration, no cache.

Out of scope: the step-by-step forms and the new fields (nota de promoción, temas, preparación, profesores en la mesa, tiempo del final); «Tus materias»; «Me sirvió» on experiencias; changes to puntos or insignias; a per-facultad academic calendar («este cuatrimestre» reads «últimos meses»).

## Capabilities

### New Capabilities
- `academic-community/experiences`: the Experiencias section: the landing and its context, the materia search, materias más comentadas, recién publicadas, the page per materia with its summary and mínimo de muestra, mismo contexto on details, the writing entry point, the shared card and its states.

### Modified Capabilities
- `academic-community/discovery`: `/experiencias` as the section's landing while `/resenas` and `/finales` stay as the per-type lists; what may and may not be combined across types; the marca de anónimo instead of «without avatar»; «Leer completa» instead of «Leer más».
- `frontend/app-shell`: Experiencias points at `/experiencias`; `/experiencias/**` makes it current; `/experiencias/escribir` joins the focus screens.
- `academic-structure/browsing`: the Experiencias landing starts at the ubicación, like search and rankings.

## Impact

- **Backend:** `modules/discovery` (service, controller, DTOs, module tests) gains `GET /discovery/experiences/overview`, `GET /discovery/subjects/:code/experiences-summary`, `GET /discovery/course-reviews/:id/related`, `GET /discovery/exam-experiences/:id/related`, and the `shift` and `condition` query filters on `GET /discovery/course-reviews`. No schema change.
- **Frontend:** new routes `app/(site)/experiencias`, `app/(site)/experiencias/[codigo]` and `app/(focus)/experiencias/escribir`; new `components/experiences/`; `components/layout/navigation.ts`; `SubjectHub`; `CommunityDetailPage`; the two list pages; `lib/discovery-client.ts`; the canvas assets copied into `public/`.
- **Specs and docs:** the three modified specs and the new one; `CONTEXT.md` (already updated); README_FRONTEND and README_BACKEND.

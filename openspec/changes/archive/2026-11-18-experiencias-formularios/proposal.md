## Why

Change 5 built the reading side of Experiencias with only the facts the platform already stored, and left the writing side for this change. The forms at `/materias/<código>/resenar` and `/final` still use the old layout. They don't ask for the facts the Experiencias canvases need: nota de promoción, profesores en la mesa, tiempo del examen, temas and preparación. They also don't ask for teoría and práctica, though those columns already exist. Because of that, the materia summary cannot show «Nota de promoción», «Preparación típica» or a mesa sentence with professors and hours.

## What Changes

- **Forms redesigned.** Each form becomes one page with numbered sections and, on desktop, an «Así se va a ver» preview beside it; it is not a wizard. Section 1 shows the chosen type and materia with «Cambiar», which returns to `/experiencias/escribir` and keeps what was typed. Below the desktop breakpoint both forms stack in one column with every field, no preview, and a sticky publish button.
- **Reseña de cursada.** It keeps every current field. It adds an optional **nota de promoción**, an integer from 1 to 10 that only appears with Promoción; it is cleared when the resultado changes and refused by the API with any other resultado.
- **Experiencia de final**:
  - **BREAKING (write API):** the outcome becomes required, and the grade is required with Aprobado or Desaprobado and refused with «Prefiero no decir». It is still an integer from 0 to 10 and never infers the outcome.
  - New optional fields:
    - teoría and práctica, 1 to 5, using the existing columns;
    - **profesores en la mesa**, a count from 1 to 10, while the single examiner stays as «¿Quién te tomó?»;
    - **tiempo del examen**, 10 to 480 minutes;
    - **preparación**, a lead time from 1 to 365 days and time per day from 30 to 960 minutes, independent of each other;
    - **temas que tomaron**, up to ten free-text topics of 2 to 60 characters, deduplicated case-insensitively.
  - The form stops asking for the exact date, franja and verbal dificultad. Old values are kept, shown on the detail and never cleared by an edit.
- **Narrative.** It stays required, from 30 to 4,000 characters, with a «/ 4000» counter.
- **Editing old entries.** An edit must complete the fields that are now required. The database keeps them nullable and nothing is invented for old rows.
- **Publication copy and outcome.** The anonymity toggle stays off by default, with «Se muestra como «Anónimo» y no aparece en tu perfil. Las publicaciones anónimas no suman puntos.» Above the submit button: «Se publica al instante. Si alguien la reporta y no cumple las normas, moderación puede retirarla.» After publishing, the browser opens the new entry's detail with a «Publicada» notice. The revisión previa notice and the duplicate-cursada dialog behave as today.
- **Reading side**:
  - Promotion chips read «Promoción · 8».
  - The summary adds «Nota de promoción» («la informaron X de Y», with the average from five grades) and «Preparación típica» (medians, from three answers each).
  - The mesa sentence adds the median professors and hours for the mesa más comentada, from three answers each.
  - The summary adds «Temas que más toman», up to five topics found in at least two public finales; the final detail lists its own topics.
  - With «Solo finales», «Materias más comentadas» shows «Teoría X · Práctica Y» averages instead of the verbal dificultad.
- **Topic suggestions.** A public read returns the topics of a materia found in at least two public finales, by frequency, for the «Temas que tomaron» input.
- **Insignia fix.** «Contexto completo» checks the situación de cursada, as its spec already says; the code checked the resultado.

Out of scope: points and their rules (no completeness bonus); «Mismo contexto», which keeps its current facts; a saved anonymity preference in Configuración; «Tus materias»; «Me sirvió» on experiencias.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `academic-community/discovery`: the reseña's evidence gains the nota de promoción. The final's evidence makes outcome and grade required and adds teoría, práctica, profesores en la mesa, tiempo, preparación and temas. The final form stops collecting date, franja and verbal dificultad. Edits of old entries complete the required fields. Cards and details show the new facts.
- `academic-community/experiences`: the materia summary and mínimo de muestra add the nota de promoción, preparación típica, mesa medians and temas que más toman. «Materias más comentadas» uses teoría and práctica for finales. The writing entry point and forms gain their layout, publication outcome and narrow-viewport behavior. The topic suggestions are new.

## Impact

- **Backend:**
  - New Prisma migration adding nullable `course_reviews.promotion_grade` and the following on `exam_experiences`: `board_size`, `duration_minutes`, `prep_lead_days`, `prep_daily_minutes`, and `topics text[]` (default empty).
  - The write DTOs and `subjects.service` mapping of `modules/subjects`.
  - The discovery item selects and DTOs, `experiences-summary.ts`, the overview's final dificultad, and a new `GET /discovery/subjects/:code/exam-topics`.
  - The badge catalog («Contexto completo»).
- **Frontend:**
  - `ReviewForm` and `ExamForm` rebuilt as the numbered-section forms with a preview.
  - The writing chooser keeps a draft.
  - Discovery types and Zod schemas.
  - `ExperienceCard`, `CommunityDetailPage`, `SubjectSummary`, `SubjectAccordingPanel` and `MostCommentedSubjects`.
- **Specs and docs:** the two modified specs; `CONTEXT.md` (already updated with the new terms); README_BACKEND and README_FRONTEND.
- **Deploy:** one additive migration, no backfill. Clients of `POST/PUT /subjects/:code/exams` must now send an outcome; the only client is this frontend.

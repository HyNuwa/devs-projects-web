## Why

Change 4b lets admins accept solicitudes de carrera, but every accepted carrera en borrador still has to be typed in by hand from its official plan: a long PDF or a facultad page, often scanned. That is the slow step between a student asking and the carrera being published, and it gets worse once the site is shared with other universidades. Plans also list optativas, which the catálogo cannot hold today because every materia of a carrera needs an año.

## What Changes

- **Optativas**: a carrera can list a materia as an optativa, with no año or cuatrimestre and optional créditos.
  - The carrera page shows them in an «Optativas» section after the last año. The materia page says «Optativa» for that carrera.
  - The carga masiva accepts `O;;nombre[;créditos]`, and the carrera editor can place a materia as an optativa.
  - Optativas do not count towards a carrera's años. Slots in a plan such as «Optativa I» are not loaded as materias.
- **Lectura del plan**: in the editor of a carrera en borrador with a plan link, an admin chooses «Leer plan con IA».
  - The server downloads the plan:
    - `https` only, never to private or local addresses, including after redirects;
    - at most 3 redirects, 20 seconds and 15 MB;
    - HTML or PDF only.
  - HTML is cleaned to text. A PDF, scanned or not, is sent as is. When a page has no materias but links to the plan, the model picks the link and the server reads that one page or PDF, without following its links.
  - Gemini returns the materias (año or optativa, cuatrimestre, nombre, créditos) and notices in a strict schema. The page content is treated as data; the model has no tools.
  - The result fills the carga masiva text box and shows the notices: the plan version used, the linked plan read, optativas, anything doubtful. The admin previews, fixes and applies as in 4b. **The lectura never changes the catálogo.**
  - It runs while the admin waits. Errors are plain: unreachable link, nothing found, AI quota used up.
  - Each lectura is recorded in the catálogo history (who, carrera, links read, rows and notices or the error).
  - Limits: ADMIN and SUPERADMIN only; 20 lecturas an hour per admin; a configurable daily total, 100 by default.

Out of scope: background jobs; providers other than Gemini (the code keeps a provider interface); correlativas; reading plans from places other than the carrera's plan link; students triggering a lectura.

## Capabilities

### New Capabilities
- `academic-structure/plan-reading`: the lectura del plan: who can run it, what it reads and how safely, what it returns to the carga masiva, limits, errors and its record.

### Modified Capabilities
- `academic-structure/institutions`: a carrera's arrangement has optativas besides materias by año and cuatrimestre.
- `academic-structure/browsing`: the carrera page lists optativas in their own section, and años count only materias with an año.
- `academic-structure/catalog-editing`: placing a materia as an optativa in the editor and in the carga masiva (`O`), and the lectura del plan in the catálogo history.

## Impact

- **Database:**
  - `study_plan_subjects.year` and `semester` become nullable, both null for an optativa (a CHECK keeps them together);
  - a new `ModerationEventAction` value for the lectura del plan.

  The migration gets a rollback.
- **Backend:**
  - the carga masiva parser and apply, placements, the carrera's años and the browse and materia endpoints handle optativas;
  - a plan-reading module:
    - a safe fetcher with DNS checks against private addresses;
    - HTML cleaning;
    - a Gemini provider behind an interface, using `fetch` against the Gemini REST API, with no new SDK;
    - the endpoint, rate-limit policy and daily cap.
- **Config:** `API_KEY_GEMINI` (already in `.env.example`), `GEMINI_MODEL`, `PLAN_READING_DAILY_LIMIT`.
- **Frontend:**
  - «Leer plan con IA» and its notices in the carga masiva;
  - optativa in the placement form;
  - the «Optativas» section on the carrera page and its label on the materia page;
  - the history label.
- **Docs:** README_DATABASE, README_MODERACION (new history event), README_SECURITY (the fetcher), `.env.example`.

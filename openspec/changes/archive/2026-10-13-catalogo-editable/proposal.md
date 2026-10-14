## Why

The catálogo now has 13 universidades and 170 facultades, but only one carrera (Ingeniería Informática, FI-UNJU), and nothing in the product can add more: every change needs a migration. The short names marked «(propuesto)» in `docs/catalogo/FUENTES_PRECARGA.md` can only be fixed the same way. The site is about to be shared with students of other universidades, who will find their facultad empty and no way to ask for their carrera. Admins need to load carreras quickly, and students need a way to say which ones to load first.

## What Changes

- **«Catálogo» tab in the panel**, for ADMIN and SUPERADMIN only. It is a tree universidad → facultad → carrera → materias where they can create and edit universidades, facultades, carreras and materias, and rename short names and codes.
  - Universidades and facultades are public as soon as they are created.
  - **Carreras start as a carrera en borrador**: not in browsing or the catálogo, not declarable, until an admin publishes them. A published carrera goes back to borrador only if nobody declared it.
  - Edits to a published carrera apply at once.
- **Renames keep old links working**: renaming the short name of a universidad or facultad, or the code of a carrera or materia, keeps the old slug as an alias that redirects (301) to the current one. A new slug that equals an alias takes it over, after a warning in the editor.
- **Deleting only what is empty**: a universidad without facultades; a facultad without carreras, materias or moderators; a carrera nobody declared; a materia without content. Removing a materia from a carrera never deletes it.
- **Generated materia codes**: a new materia gets a code built from universidad, facultad and name, editable when created and later (with an alias). `subjects.code` grows past 20 characters.
- **Materias anuales**: a carrera can place a materia as anual in a year. The carrera page lists anuales first within their año.
- **Carga masiva**: an admin pastes one line per materia, `año;cuatrimestre(1|2|A);nombre[;créditos]`. A preview marks each line as reusing an existing materia of the facultad (same name ignoring case and accents) or creating a new one, and lets them adjust each row before confirming. It only adds or updates placements; it never removes materias.
- **Catálogo history**: every create, rename, publish, unpublish, delete and placement change is recorded in Historial with actor, before and after. Only ADMIN and SUPERADMIN see it.
- **Solicitud de carrera**: a signed-in student with a verified email and no active sanción asks for a carrera with universidad, facultad, carrera name and an `https` link to the official plan. If their facultad or universidad is missing, they write it in free text.
  - Before sending, they see the pending solicitudes of that facultad and can join one with «Yo también».
  - At most 3 pending per account. A student can withdraw their solicitud or their «Yo también» while it is pending. If the author withdraws and others joined, it passes to the first who joined.
  - Admins resolve it in a «Solicitudes» view with a pending count: accept (creates the carrera en borrador, prefilled with name and link, and the facultad or universidad if needed; it ends as accepted when that carrera is published), reject with a written reason, or mark it as already loaded, pointing to the existing carrera.
  - Students follow their solicitudes in «Mis solicitudes» in Mi perfil, and every student in it gets an email when it is rejected or its carrera is published, with a link to declare it.
- **Entry points**: «¿No está la tuya?» on `/universidades` now links to the form; a facultad without carreras offers «Pedí tu carrera» with the facultad chosen; «Mi carrera» offers «No encuentro mi carrera». Visitors go through sign-in and come back to the form.

Out of scope: the bot that drafts a carrera from its plan link (change 4c, `borrador-por-bot`, which fills the carrera en borrador this change introduces); in-app notifications; moderators editing the catálogo of their facultades; merging duplicate materias.

## Capabilities

### New Capabilities
- `academic-structure/catalog-editing`: the Catálogo tab, who can edit, carreras en borrador and publishing, slug aliases, deletion rules, generated materia codes, the carga masiva and the catálogo history.
- `academic-structure/career-requests`: solicitudes de carrera, «Yo también», limits, withdrawal, how admins resolve them, «Mis solicitudes» and the emails.

### Modified Capabilities
- `academic-structure/institutions`: the catálogo becomes editable by admins; a carrera en borrador is left out of the public catálogo and cannot be declared; a materia can be anual in a carrera.
- `academic-structure/browsing`: old slugs redirect to the current page; a carrera en borrador is not found; anuales are listed first in their año; the empty states and «¿No está la tuya?» link to the solicitud form.

## Impact

- **Database:**
  - `careers.status` (borrador or publicada; the existing carrera is publicada);
  - an anual value for `study_plan_subjects.semester`;
  - wider `subjects.code`;
  - a slug alias table;
  - `career_requests` and their «Yo también» supporters;
  - new `ModerationEventAction` values for catálogo events.

  Each migration gets a rollback.
- **Backend:**
  - an admin catálogo module (CRUD, publish, carga masiva preview and apply, deletion checks);
  - alias resolution in the browse endpoints;
  - the career requests module;
  - two new mail templates;
  - Historial includes the catálogo events for admins;
  - the public catálogo, browse and study plans endpoints skip carreras en borrador.
- **Frontend:**
  - the Catálogo tab with Solicitudes;
  - the solicitud form and its three entry points;
  - «Mis solicitudes» in Mi perfil;
  - anual in the carrera page;
  - redirects from aliases in the `/universidades` pages and `/materias/[code]`.
- **Docs:** README_DATABASE, README_MODERACION (catálogo history), `docs/catalogo/FUENTES_PRECARGA.md` (short names can now be fixed in the panel).

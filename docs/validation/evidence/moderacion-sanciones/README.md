# moderacion-sanciones — browser evidence (2026-09-29)

**Setup:**
- Production builds: `node dist/src/main.js` on `localhost:3001`, and `pnpm build && pnpm start` on `localhost:3000`.
- Database: the local `devs_project_moderacion`, freshly seeded (`tsx prisma/seed.ts`), including the sanctions demo accounts from `prisma/seed-sanctions.ts`.
- Driven with agent-browser. The database state after each step was checked with direct SQL queries.

**Accounts:**
- `moderator` and `admin`
- `user`: a student with no prior retiros
- `juan.p`: already warned, with an overdue caso
- `sofi.c`: a retiro under appeal

## Flows

| Flow | Width | Result | Capture |
| --- | --- | --- | --- |
| Overdue caso and admin notice | 1440 | `juan.p`'s reseña, hidden 3 days ago, appears in «Vencidos» at the top of Casos. The admin sees «1 caso vencido» with «Ver vencidos»; the moderator sees no notice. Tabs: Casos 5 · Usuarios 1 (proposals) · Apelaciones 2 (for the moderator). | `vencidos-admin-1440` |
| «Retirar» with «Advertir también» | 1440 | On `user`'s first retiro the checkbox is preselected, with «Sería su primer retiro en 90 días». Retiring creates a `WARNING` linked to the caso, with the same reason. | `retirar-advertir-1440` |
| The author sees the advertencia once and in Sanciones | 390 | The banner «Recibiste una advertencia de moderación» disappears after «Entendido» and does not come back. Mis envíos › Sanciones lists it with «Apelar» (deadline 13 Oct). | `advertencia-banner-390`, `mis-envios-sanciones-390` |
| A moderator does not see appeals of their own decisions | 1440 | `user` appeals the retiro that `moderator` decided: it is missing from `moderator`'s Apelaciones, and `admin` sees it. | `apelaciones-moderador-1440` |
| Another moderator accepts an appeal of a retiro | 1440 | `moderator` answers `sofi.c`'s appeal, whose retiro `admin` decided, with «Aceptar y restaurar». The material is `PUBLISHED` again, the appeal is `ACCEPTED` with its answer, and `sofi.c` goes from 0 to 10 points. | `apelacion-retiro-1440` |
| Second retiro, «Silenciar» suggested, silence | 1440 | On the second retiro the checkbox is not preselected. `user`'s file shows «Paso sugerido: silenciar 7 días», and «Silenciar 7 días» leaves it «Silenciado hasta el 6 oct». | `usuarios-ficha-sugerido-1440`, `usuarios-silenciado-1440` |
| The silenced author cannot write | 390 | The banner and Subir material show «Estás silenciado hasta el 6 oct: no podés publicar, reportar ni marcar Me sirvió», and the form's fieldset is disabled. A direct `POST /reports` gets 403 `ACCOUNT_MUTED` with `until`. | `silenciado-subir-material-390` |
| «Quitar silencio» | 1440 | Back to «Advertido». Events `MUTED` → `SANCTION_LIFTED`. | — |
| Propose → admin confirms | 1440 | `moderator` proposes 30 days for `juan.p`. The admin sees it under «Suspensiones propuestas», confirms from the file, and the status becomes «Suspendido hasta el 29 oct». | `propuesta-suspension-admin-1440` |
| The session opened before the suspensión | — | A write with the old access token gets 403 `ACCOUNT_SUSPENDED`, and `POST /auth/refresh` gets 401 (the refresh tokens were deleted). | — |
| Sign-in shows the suspensión and its appeal | 390 / 1440 | After closing the session (what the client does on a 403 `ACCOUNT_SUSPENDED`), `/auth/login?suspendida=1` shows the notice. Signing in shows the reason, the end date and «Apelar esta suspensión». The appeal is recorded (`SANCTION`, `PENDING`) without opening a session. Signing in again shows «Recibimos tu apelación». | `ingreso-suspendido-390`, `ingreso-suspendido-apelado-1440` |

The 390 capture of the suspension screen was taken before a copy fix; it now reads «La suspensión dura hasta el …». The 1440 capture shows the final text.

## Accessibility

axe (`wcag2a`, `wcag2aa`, `wcag21aa`) found **0 violations** on:
- `/admin/usuarios`, `/admin/apelaciones` and `/profile/me` (Mis envíos with Sanciones), at 390 and 1440px
- the suspension screen at sign-in, at 390px

The results are in `axe/*.json`. `color-contrast` stays "incomplete" over the grid background, as in the earlier changes.

## Bugs found and fixed during this pass

1. **Reselecting the account or appeal that is already open left it on «Cargando…».** The load did not run again because the selected id did not change. Fixed in `UsersPanel` and `AppealsPanel`, with tests.
2. **The end-date copy on the suspension screen read badly.** It now says «La suspensión dura hasta el …».

## Not covered here

- The redirect to sign-in on any 403 `ACCOUNT_SUSPENDED` is covered by `lib/api.test.ts`. In the browser, the page from the old session was closed by hand, the same way the client does it.
- Notifications and email (`docs/README_MODERACION.md` §15) are out of scope for this change.

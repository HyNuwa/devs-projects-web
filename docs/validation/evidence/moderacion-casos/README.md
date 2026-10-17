# moderacion-casos — browser evidence (2026-09-29)

Production builds (`node dist/src/main.js` on `localhost:3001`, `pnpm build && pnpm start` on `localhost:3000`) against the local `devs_project_moderacion` database after `migrate reset` and `pnpm seed`, driven with agent-browser. Accounts: `user` (established), `nueva.cuenta` (2 days old, email not verified), `moderator` and `admin`. The DB state after each step was checked with direct SQL queries.

## Flows

| Flow | Width | Result | Capture |
| --- | --- | --- | --- |
| Established upload → published | 1440 | «¡Ya está publicado!»; `PUBLISHED`, visible in its materia | `publicado-1440` |
| Duplicate upload (same file, same materia) | 390 | 409 `DUPLICATE_MATERIAL`; the form says «Este archivo ya está publicado en esta materia» with a link to the existing one | `duplicado-390` |
| New-account upload → prior review | 390 | «En revisión previa» with the `NEW_ACCOUNT` reason; Mis envíos shows it | `revision-previa-390` |
| Moderator rejects | 1440 | Rejecting without a reason is refused; with one, `REJECTED` + `PRIOR_REVIEW_REJECTED` | `panel-revision-previa-1440`, `panel-rechazo-1440` |
| Author sees the reason → resubmits with a new file | 390 | «Rechazado» + reason; «Reenviar a revisión» returns it to `PENDING_REVIEW` | `mis-envios-rechazado-390`, `mis-envios-reenviado-390` |
| Moderator approves the resubmission | 1440 | Preview of the corrected file; «Aprobar y publicar» → `PUBLISHED` | `panel-reenvio-preview-1440` |
| Third qualified report → hidden → keep visible | 390 / 1440 | `admin` filed the third report (the two seeded ones came from `lucia.p` and `mica.v`): `HIDDEN` + `AUTO_HIDDEN` «3 reportes en 48 h». The moderator saw why it is hidden and the 3 reports without reporter identities; «Mantener visible» → `PUBLISHED`, 3 reports `DISMISSED`, `KEPT_VISIBLE` | `reporte-dialogo-390`, `panel-oculto-3-reportes-1440` |
| Personal-data report → retire → author sees the reason → restore | 1440 / 390 | «Retirar» → `REMOVED` with the author-facing reason; Mis envíos shows «Retirado» + reason; from the closed case (`/admin?caso=`), «Restaurar» without a reason is refused, with one → `PUBLISHED`, reason cleared, `RESTORED` | `mis-envios-retirado-390`, `panel-restaurado-1440` |
| Anonymous reseña → «Ver autor» → Historial | 1440 | With a reason, the reveal shows `@user` (refusing it without one is covered by component tests); `AUTHOR_REVEALED` with the reason. The admin's Historial lists it first (highlighted); the moderator's Historial does not show it | `panel-ver-autor-1440`, `historial-admin-ver-autor-1440` |

The full set of screenshots stays in the ignored `.audit-logs/moderacion-screens/`.

## Keyboard

In the panel, J moves to the next case and the URL keeps `/admin` (K back is covered by component tests). No decision is taken from the keyboard.

## Accessibility

axe (`wcag2a`, `wcag2aa`, `wcag21aa`) on `/admin`, `/admin/historial`, `/profile/me` (Mis envíos), `/materiales/nuevo` and `/normas` at 390 and 1440px, signed in: **0 violations** (`axe/*.json`). `color-contrast` stays "incomplete" over the grid gradient, as in base-visual.

## Bugs found and fixed during this pass

1. **Duplicate and daily-limit refusals showed nothing.** The global `HttpExceptionFilter` rebuilt the body and dropped `code` and `materialId`. It now keeps coded details (`global-exception-filters.integration.spec.ts`).
2. **The materia's materials list returned 500.** `material-ranking.query.ts` still filtered on `moderation_status`, which this change drops. It now uses `publicVisibilitySql`, the SQL twin of `publicVisibility`. The ranking integration test built its own table with the old column; it now uses the real columns and covers every status, including hidden over 7 days.
3. **The file preview in the panel was blank.** It framed the API URL, which the API's `frame-ancestors 'self'` blocks from the frontend's origin. The panel now downloads the file with the moderator's session and shows it only if it really is a PDF.
4. **Status chips were below 4.5:1.** Red and green text on their own tints (3.5–4.48:1). New `--dp-red-ink` and `--dp-green-ink` tokens (≥ 4.84:1 on card, page and secondary) are used for text on tints in `Chip`, the panel, Mis envíos and the reseña/final forms.
5. **In-text links to `/normas` relied on color only.** They are now always underlined.

## Not covered here

- `/materias/:codigo` links each material to the legacy `/materiales/:id` page, which has no «Reportar». Reporting works from the catalog's preview dialog. The legacy page is deleted by the cleanup change.
- Files stay local (`/uploads/...`) in this environment; Drive publication is not exercised.

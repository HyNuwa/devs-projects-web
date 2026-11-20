# Evidence: privilegios-confianza (3c-2)

Browser check with agent-browser on 2026-10-10, against the dev database `devs_project_moderacion`. The migrations `20261013000000_trust_privileges` and `20261013010000_role_changed_event` were applied with `prisma migrate deploy`, without reset or seed.

**Temporary demo data**, inserted by a script and reverted afterwards:
- a material «Final de diciembre (demo)» by `moderator`;
- `vale.mod` raised to nivel máximo alcanzado 3;
- an 8-day-old suggestion by `vale.mod`;
- `lucia.p` made eligible: nivel 6, a year old, 10 accepted corrections.

**Restored afterwards:**
- the material, the suggestions and the 2 `CORRECTION_ACCEPTED` points `admin` earned were deleted, and `materialCount` was restored;
- `vale.mod` and `lucia.p` went back to their original values;
- `admin` got its `level` and `max_level` back to 8. The +2 had made the ledger recalculate its nivel from its stale dev totals, since `rebuild-points` has not run on dev.

| File | What it shows |
|---|---|
| `tu-progreso-privilegios-1440.webp`, `tu-progreso-privilegios-390.webp` | «Tu progreso» of `vale.mod`. A retiro of its content 15 days ago leaves both privileges «Todavía no», with the date they come back, and Reportes prioritarios also says how many confirmed reportes are missing. Nothing mentions moderating. |
| `sugerir-correccion-1440.webp`, `sugerir-correccion-390.webp` | «Sugerir corrección» in the material preview, as `admin`: field, value and comment. «Enviar» stays disabled until a value is chosen. |
| `mis-envios-sugerencias-1440.webp` | «Sugerencias para tus materiales» for the author (`moderator`): «Final → Parcial» with the comment and without who suggested it. The 8-day-old suggestion is not listed here. Accepting changed the material to Parcial and gave `admin` +2. |
| `admin-correcciones-1440.webp`, `admin-correcciones-390.webp` | The new Correcciones tab with its count: the escalated suggestion, with «Sugerida por @vale.mod». |
| `admin-usuarios-elegibles-1440.webp` | Usuarios → «Elegibles» as admin: `lucia.p` marked «Elegible», and «Elegible para moderar» with «Hacer moderador» in the file. Not clicked. |

As `vale.mod` (MODERATOR), the Usuarios tab shows neither the «Elegibles» filter nor any «Elegible» mark (checked by reading the page text).

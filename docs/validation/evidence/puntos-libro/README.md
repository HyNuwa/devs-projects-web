# puntos-libro: browser evidence

Checked on 2026-10-09 against the local API and `next dev`, as the demo student `user`, on the development database with the `point_ledger` migration applied. The rebuild script was not run there: `user` keeps its 100 seed points, shown as «Ajuste de puntos anteriores».

| Check | Width | What was done | Evidence |
|---|---|---|---|
| Tu progreso | 1440, 390 | `/mi-espacio/progreso` shows Nv. 3 «De pasillo en pasillo», 100 points, «Faltan 150 para Nv. 4 · Mochila cargada», what nivel 4 unlocks, the ten-level path with the current one marked, and the latest movement. | `tu-progreso-1440`, `tu-progreso-390` |
| Cómo funcionan los puntos | 1440 | `/puntos` shows the point table with limits, that anonymous entries earn nothing, which «Me sirvió» count, reversals and the levels. | `como-funcionan-los-puntos-1440` |
| Anonymous notice | 1440 | Checking «Publicar como Anónimo» in the reseña form shows «Las publicaciones anónimas no suman puntos» with a link to `/puntos`. | `resena-anonima-aviso-1440` |
| Anonymity locked on edit | 1440 | An anonymous reseña published through the API earned nothing (100 points before and after). Its edit form shows the choice checked and disabled, with «Se elige al publicar y no cambia al editar». | `resena-anonima-editar-1440` |

## Accessibility

axe (`wcag2a`, `wcag2aa`, `wcag21aa`) on «Tu progreso» (1440 and 390), the help page and the edit form: 0 violations (`axe/*.json`).

## Why

`/ranking` still orders everyone by total points, globally and by week. The same few always win and newcomers give up, which goes against README_PUNTOS_E_INSIGNIAS §1, «quality over quantity». The grilling of 3c replaced it with **bounded rankings that renew**: one per month and carrera, a fixed list of «Leyendas de la facultad», and the most useful materials of a materia this cuatrimestre.

3c-1 left one promise open: «Mostrar mi nivel e insignias» must take an account out of every ranking, and today's `/ranking` ignores it. 3c-1 and 3c-2 cannot ship without this change, which is 3c-3, the last of the series.

## What Changes

- **«Este mes en tu carrera»:**
  - **What counts:** net points of the current calendar month, in Argentina time (UTC−3): awards minus reversals.
  - **Attribution:** each movimiento counts for the carrera of the materia of the contribution that generated it, or for every carrera that has that materia in a plan. Movimientos without a materia (guías, legacy adjustments) count nowhere. `REPORT_CONFIRMED` and `CORRECTION_ACCEPTED` count nowhere either: they arrive right when the author sees the retiro or the change, so a +2 jump would reveal who reported or suggested.
  - **What it shows:** the top 10 with «Nv. N» and the month's points, where ties share the place, plus «tu posición» when the viewer is outside the top 10 and appears in the ranking.
  - **Default carrera:** the viewer's active plan, with a selector; without a session or a plan, the first carrera.
- **«Leyendas de la facultad»:** a fixed list, one per facultad, of accounts whose nivel máximo alcanzado is 10. An account appears in the facultades of its active or finished plans; without a plan it appears nowhere. Order is alphabetical, because a list of legends is not a race. The default is the viewer's facultad, with a universidad and facultad selector.
- **Exclusions:**
  - Neither ranking shows an account that turned off «Mostrar mi nivel e insignias».
  - The monthly one also leaves out accounts that had a sanción in force when the month began. It is judged once per month, so the list only changes when it starts over and never reveals a sanción applied or lifted during the month.
  - Leyendas leaves out only permanent suspensiones: taking someone off a fixed list during a 7-day silenciamiento would reveal it.
- **«Más útiles este cuatrimestre»** on the materia page: the top 10 materials by valid «Me sirvió» received during the current cuatrimestre (the calendar of `badge-calendar.ts`), whenever they were published. It has no «tu posición» and no author exclusions, because it ranks materials, not people. The section is hidden when it is empty.
- **`/ranking`** has two tabs, «Este mes en tu carrera» and «Leyendas de la facultad», and every name links to its perfil público with `AuthorLink`.
- **BREAKING (API):** the global and weekly rankings are removed, along with `GET /ranking?period=…`, `GET /ranking/top` and `GET /ranking/me`, and the legacy `RankingList`, `RankCard` and `LevelsTable` components. `GET /ranking/levels` stays. «Tu progreso» links to the rankings.
- **Out of scope:**
  - past months;
  - rankings per facultad by points;
  - notifications;
  - the ambassador program.

## Capabilities

### New Capabilities
- `reputation/rankings`: the monthly ranking per carrera, Leyendas per facultad, the materia's most useful materials, their exclusions and ties, and the `/ranking` page.

### Modified Capabilities
- `reputation/public-profile`: «Mostrar mi nivel e insignias» also keeps the account out of every ranking, fulfilling what 3c-1 deferred.

## Impact

- **Backend:**
  - `ranking.service.ts` and `ranking.controller.ts`, rewritten:
    - attribution from `PointTransaction` to materias and carreras;
    - Leyendas from `User.maxLevel` and `UserStudyPlan`;
    - the materia top from `MaterialHelpfulness`.
  - New endpoints: `GET /ranking/monthly?careerId=` (public), `GET /ranking/monthly/me?careerId=` (signed in), `GET /ranking/legends?facultyId=` (public) and `GET /subjects/:code/top-materials` (public).
  - Old ranking endpoints and their spec removed.
- **Frontend:**
  - a new `RankingPage` (tabs, carrera and facultad selectors, AuthorLink);
  - a «Más útiles este cuatrimestre» section in `SubjectHub`;
  - a link from «Tu progreso»;
  - the legacy ranking components and their client removed.
- **Data:** no migration.
- **Docs:** `README_PUNTOS_E_INSIGNIAS.md` §7 and §8, and `PLAN_LIMPIEZA_HEREDADOS.md` (the legacy ranking is gone).

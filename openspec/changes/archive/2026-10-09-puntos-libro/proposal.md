## Why

Points today are a thin counter. `reason` is free text, nothing stops a duplicate award, and there are no caps. «Me sirvió» earns nothing. The levels table is unreachable and uses gendered names.

Anonymous reseñas and experiencias still earn points when published. Anyone can see that, so it can point at the author. Change 2d only stopped moderation decisions from moving them.

`docs/README_PUNTOS_E_INSIGNIAS` defines the system. This change is its first part (3a): the points ledger and the student's view of it. Badges (3b) and profile customization, privileges and rankings (3c) follow as separate changes.

## What Changes

- **A ledger of movimientos de puntos:**
  - a fixed set of reasons;
  - one award per contribution, safe against retries and double clicks;
  - reversals recorded as linked negative movements;
  - an account total that always equals the sum of its movements.
- **Point sources:**
  - +10 per material published.
  - +5 per signed reseña, with one awarded per subject and ciclo lectivo.
  - +5 per signed experiencia, with one awarded per subject, período de examen and year.
  - +1 per valid «Me sirvió» received. Caps: 25 per material, 20 per day per author, 5 per month from the same student to the same author.
  - +5 for the first material of a type in a subject, once it reaches 3 valid «Me sirvió» (pioneer).
  - +2 to a reporter whose reporte led to a retiro, up to 10 per week.
- **Reversals:**
  - When a contribution is retired or deleted by its author, its points are reverted. A retired material also loses its pioneer bonus and its «Me sirvió» points.
  - When a contribution is restored, its points are awarded again.
  - Removing a «Me sirvió» reverts the point it gave.
- **Anonymous entries never earn points.**
  - **BREAKING (product):** a reseña or experiencia is published signed or anonymous, and that choice can no longer be changed by editing.
  - The form says «Las publicaciones anónimas no suman puntos».
- **Sanctions:** a silenced or suspended account earns no points while the sanción lasts, and the lost points are not kept for later. An accepted appeal still gives points back.
- **Levels:** the new 10-level table, from «Primeros pasos» to «Leyenda de la facultad», with reachable thresholds. The level is computed on `max(0, points)`.
- **Guías:** they stop earning points (they are out of the product).
- **Migration:** the reasons become a fixed set, and every account's points and level are rebuilt with the new rules. There is only development and demo data, so it is a schema migration plus a rebuild script; the seed is updated to match.
- **«Tu progreso»** in Mi espacio (`/mi-espacio/progreso`, linked from the account menu):
  - level number and name;
  - points, how many are missing for the next level and what it unlocks;
  - the latest movimientos with their reason.

  It also links to a «Cómo funcionan los puntos» page with the point table and rules.
- **Out of scope:**
  - Badges (3b).
  - Personalization, trust privileges, «Sugerir correcciones» and `CORRECTION_ACCEPTED`, rankings (3c).
  - Notifications: a separate plan.
  - The legacy `/ranking`, removed by the cleanup change.

## Capabilities

### New Capabilities
- `reputation/points`: the points ledger, its sources, caps and reversals, valid «Me sirvió», the sanction freeze, the levels table, «Tu progreso» and the points help page.

### Modified Capabilities
- `academic-community/discovery`: «Public identity is selected per entry». The choice is fixed at publishing, and the form tells anonymous authors that the entry earns no points.
- `moderation/cases`: «Points follow publication». It now defers amounts, anonymity and reversals to `reputation/points`, keeping only the moderation states that award or revert.

## Impact

- **Backend:**
  - `prisma/schema.prisma`: `PointReason` enum, `idempotencyKey` and `reversesId` on `PointTransaction`, and indexes.
  - A migration and a rebuild script under `prisma/backfills`, plus `seed.ts`.
  - The ranking module: `point.service.ts` and `rpg-levels.ts`.
  - The callers:
    - `materials.service.ts`: publication, author deletion, «Me sirvió», and subject or type edits for the pioneer bonus.
    - `subjects.service.ts`: reseñas and experiencias (publish, edit, delete).
    - `decisions.service.ts` and `bulk-retiro.ts`.
    - Reportes: the reporter award.
    - `guides.service.ts`: it stops awarding.
  - A new `GET /me/progress` endpoint.
- **Frontend:**
  - The «Tu progreso» page and its account-menu entry.
  - The «Cómo funcionan los puntos» page.
  - The reseña and experiencia forms: the anonymity notice and the choice locked on edit.
- **Docs:** `README_PUNTOS_E_INSIGNIAS` (state, §2 and §9 marked as built for 3a, open question on new accounts closed) and `CONTEXT.md` (already updated: Puntos, Movimiento de puntos, «Me sirvió» válido, Nivel).

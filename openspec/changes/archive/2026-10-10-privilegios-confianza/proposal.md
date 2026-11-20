## Why

Since 3a the points table lists `CORRECTION_ACCEPTED` and «Lupa», and README §5 describes three privilegios de confianza. None of them exist yet:
- a misclassified material, such as a final saved as a parcial or a file under the wrong materia, stays hidden from whoever looks for it unless its author fixes it;
- moderation cannot tell a careful reporter from a noisy one;
- there is no way to spot students who could be invited to moderate.

This is 3c-2, built on `perfil-publico` (3c-1), which stores the nivel máximo alcanzado these privileges read. 3c-3 (`rankings-acotados`) follows it.

## What Changes

- **Good standing:** a student holds privilegios de confianza only after 90 days without sanciones.
  - These count: a silenciamiento or suspensión, measured from when it ended, and a retiro por normas of their content, anonymous content included, measured from when its caso closed.
  - These do not count: advertencias, and anything voided on appeal or restored.
  - A permanent suspensión never clears.
  - Required niveles compare against the nivel máximo alcanzado.
- **Sugerir correcciones** (nivel 3 and good standing):
  - On someone else's published material, a student can propose a new value for one field: materia, tipo, ciclo lectivo or profesor (from the materia's list), with an optional comment.
  - Only one suggestion can be open per material and field.
  - **The author decides first**, from «Mis envíos». Accepting applies the change exactly as if the author had edited it, including the pioneer bonus re-evaluation. Rejecting closes the suggestion.
  - After 7 days without an answer it moves to a new **Correcciones** tab in the moderation panel, and moderation decides.
  - A suggestion closes on its own if that field changed meanwhile, or if the material is retired or deleted.
  - Each accepted suggestion earns the student who made it `CORRECTION_ACCEPTED`: +2, at most 10 points a week. It counts for **Lupa** (10 accepted), even if the material is retired later.
  - The author never sees who made the suggestion.
- **Reportes prioritarios** (good standing, plus at least 5 confirmed reportes at 70 % precision or more in the last 90 days, pending ones excluded):
  - The privilege is checked when the student reports and stored on the reporte.
  - A caso with a priority reporte is ordered right after high-priority casos (datos personales) and before the reporte count.
  - Moderators never see who reported.
- **Elegible para moderar** (nivel 6, account older than 6 months, 5 confirmed reportes or 10 accepted corrections, and good standing):
  - It has no entity of its own: there is an «Elegible» mark and filter in Usuarios, and a new «Hacer moderador» action (USER → MODERATOR only).
  - The existing `PATCH /admin/users/:id/role` is hardened: today any ADMIN can grant SUPERADMIN. It will take only known roles, only a SUPERADMIN can grant or remove ADMIN or SUPERADMIN, and nobody can change their own role.
  - **Only ADMIN and SUPERADMIN see it.** It depends on anonymous retiros, and the Usuarios tab must not let a MODERATOR infer those.
- **«Tu progreso»** shows Sugerir correcciones and Reportes prioritarios as «activo» or with what is missing, including the date good standing comes back. It never shows eligibility to moderate.
- **Lupa** joins the catalog (18 insignias), with its existing gem art.
- **`/puntos`** explains corrections, Lupa and the privileges.
- **Out of scope:**
  - notifications (Novedades): the author learns about suggestions from «Mis envíos» until those arrive;
  - an invitation entity;
  - the ambassador program;
  - rankings (3c-3).

## Capabilities

### New Capabilities
- `reputation/trust-privileges`: good standing, the requirements of each privilegio de confianza, priority reportes, eligibility to moderate and promoting to moderator, role-change limits, and how «Tu progreso» shows them.
- `academic-resources/corrections`: correction suggestions on a material's classification, the author-first decision, escalation to moderation after 7 days, what accepting applies, and when a suggestion closes on its own.

### Modified Capabilities
- `reputation/points`: ADDED «Accepted corrections earn points».
- `reputation/badges`: «Insignia catalog» gains Lupa and drops the line saying Lupa waits for corrections.
- `moderation/cases`: «Moderation panel» gains the Correcciones tab and orders priority reportes into the urgency.
- `moderation/sanctions`: «Usuarios tab» gains the «Elegible» mark and filter, shown to ADMIN and SUPERADMIN only.

## Impact

- **Backend:**
  - `schema.prisma` and a migration:
    - new `CorrectionSuggestion` (with a partial unique index on one open suggestion per material and field);
    - `Report.priority`;
    - `PointReason.CORRECTION_ACCEPTED`;
    - the Lupa badge row.
  - A new `trust` module with good standing and privileges, `GET /users/me/privileges`, and the corrections endpoints for students, authors and moderation.
  - `reports.service.ts` (stores priority), `queue.ts` and `cases.service.ts` (urgency).
  - `materials.service.ts`: the classification update is shared by author edits and accepted corrections.
  - `moderation-users.service.ts` (eligibility for admins).
  - `badge-catalog.ts` and `badge-snapshot.ts` (Lupa), and the point ledger caps.
- **Frontend:**
  - «Sugerir corrección» in `MaterialPreviewDialog`;
  - the suggestions section in «Mis envíos»;
  - the `/admin/correcciones` tab and the `ModerationHeader` tabs;
  - the «Elegibles» filter and mark in `UsersPanel`;
  - a privileges card in «Tu progreso»;
  - `/puntos`.
- **Data:** an additive migration only. The dev database gets it with `migrate deploy`.
- **Docs:** `README_PUNTOS_E_INSIGNIAS.md` §5, §6 and §9, `README_MODERACION.md` (Correcciones tab, priority), `README_DATABASE.md`, and `CONTEXT.md` (good standing, corrección).

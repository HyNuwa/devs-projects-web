# moderacion-ajustes: browser evidence

Checked on 2026-09-30 against the local API (memory rate limiter, `GET /api/v1/health` → `{"status":"ok","rateLimiter":"memory"}`) and `next dev`, on the demo data of `prisma/seed.ts` plus the `vale.mod` case of `seed-sanctions.ts`. For task 7.3, the database got the `nico.r` and `caro.m` cases of the current `seed-sanctions.ts` by targeted inserts and updates, without re-seeding.

| Check | Width | What was done | Evidence |
|---|---|---|---|
| Sign-in limit | 390 | Five wrong passwords for `juan.p`, then the correct one: the sixth attempt is refused with «Demasiados intentos. Probá de nuevo en 15 minutos» and stays on `/auth/login`. | `ingreso-limite-390` |
| Read-only appeal | 1440, 390 | As `moderator`, Apelaciones lists the appeal of `vale.mod` (a moderator) on the retiro of their anonymous reseña, marked «La resuelve un admin». The detail shows the decision and «Autor oculto», without the explanation, the content or answer controls. | `apelacion-solo-lectura-1440`, `apelacion-solo-lectura-390` |
| Anonymous-content appeals go to admins (task 7.3) | 1440 | As `moderator`, the appeals of `vale.mod` (a moderator) and `nico.r` (a student) on the retiros of their anonymous reseñas, both decided by `caro.m`, are listed and detailed identically: «Autor oculto», the decision, «La resuelve un admin», no explanation, content or answer controls. The note under the list reads «Las de suspensiones y de contenido anónimo las resuelve un admin». As `admin`, both show the explanation, the content and the answer controls (not answered, to keep the demo data). | `apelacion-anonima-{moderador,estudiante}-moderator-1440`, `apelacion-anonima-{moderador,estudiante}-admin-1440` |

## Accessibility

axe (`wcag2a`, `wcag2aa`, `wcag21aa`) on each captured screen: 0 violations (`axe/*.json`).

The `apelacion-solo-lectura-*` captures predate task 7 (the decider was then `admin`).

The first sign-in pass found one: the auth forms' error box had `#dc2626` on `#fef2f2` (4.41:1). The four auth forms now use `--destructive-ink`.

## Covered by automated tests instead

Sign-up, recovery, the appeal from sign-in, per-client limits, `TRUST_PROXY`, the history masking and the conflict of interest from Usuarios are covered by `test/rate-limiting.e2e.test.ts`, `test/history-anonymity.e2e.test.ts`, `test/sanctions-conflict.e2e.test.ts` and `test/appeals-review.e2e.test.ts`. That the 429 message reaches each form is covered by the frontend tests.

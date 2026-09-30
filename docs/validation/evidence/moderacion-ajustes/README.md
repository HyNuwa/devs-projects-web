# moderacion-ajustes: browser evidence

Checked on 2026-09-30 against the local API (memory rate limiter, `GET /api/v1/health` → `{"status":"ok","rateLimiter":"memory"}`) and `next dev`, on the demo data of `prisma/seed.ts` plus the `vale.mod` case of `seed-sanctions.ts`.

| Check | Width | What was done | Evidence |
|---|---|---|---|
| Sign-in limit | 390 | Five wrong passwords for `juan.p`, then the correct one: the sixth attempt is refused with «Demasiados intentos. Probá de nuevo en 15 minutos» and stays on `/auth/login`. | `ingreso-limite-390` |
| Read-only appeal | 1440, 390 | As `moderator`, Apelaciones lists the appeal of `vale.mod` (a moderator) on the retiro of their anonymous reseña, marked «La resuelve un admin». The detail shows the decision and «Autor oculto», without the explanation, the content or answer controls. | `apelacion-solo-lectura-1440`, `apelacion-solo-lectura-390` |

## Accessibility

axe (`wcag2a`, `wcag2aa`, `wcag21aa`) on each captured screen: 0 violations (`axe/*.json`).

The first sign-in pass found one: the auth forms' error box had `#dc2626` on `#fef2f2` (4.41:1). The four auth forms now use `--destructive-ink`.

## Covered by automated tests instead

Sign-up, recovery, the appeal from sign-in, per-client limits, `TRUST_PROXY`, the history masking and the conflict of interest from Usuarios are covered by `test/rate-limiting.e2e.test.ts`, `test/history-anonymity.e2e.test.ts`, `test/sanctions-conflict.e2e.test.ts` and `test/appeals-review.e2e.test.ts`. That the 429 message reaches each form is covered by the frontend tests.

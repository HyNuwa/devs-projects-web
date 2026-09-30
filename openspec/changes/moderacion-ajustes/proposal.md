## Why

Change 2b left open points that its review surfaced:
- Sign-in, sign-up and password recovery have no rate limit, so passwords can be brute-forced.
- The only per-IP limiter would share one bucket for everyone behind the planned Nginx proxy.
- Two anonymity channels remain: the history shows the same sanción reason as the user file, and the Apelaciones list hides staff appellants' appeals, so their absence gives them away.
- From the Usuarios tab, a moderator can sanction an account whose content they reported.

These close before change 3, so 2b and this change merge together.

## What Changes

- **Rate limiting:** one fixed-window limiter for sign-in, sign-up, password recovery, «Apelar esta suspensión» and community writes (reseñas, experiencias, reportes). It answers 429 with `Retry-After` and «Demasiados intentos. Probá de nuevo en X minutos».
  - **Sign-in:** 5 failed attempts per email + IP every 15 minutes, reset by a successful sign-in; 20 failed attempts per IP, not reset.
  - **Sign-up:** 3 per hour per IP.
  - **Recovery:** 3 per hour per email and 3 per hour per IP, whether or not the account exists.
  - **Appeal from sign-in:** 5 per email + IP every 15 minutes.
  - **Community writes:** 6 per minute per account on each action, as today, now also on filing reportes.
- **Storage:**
  - Redis when `REDIS_URL` is set; memory otherwise (development and tests).
  - **BREAKING (deployment):** production refuses to start without `REDIS_URL` and `RATE_LIMIT_SECRET`.
  - If Redis fails, the limiter falls back to memory, logs once per transition, and reports it.
  - Emails are keyed by HMAC with `RATE_LIMIT_SECRET`, never stored in plain text.
- **`TRUST_PROXY`:** configures which client IP is trusted behind a proxy; off by default.
- **`GET /health`:** public, reports `status` (`ok` | `degraded`) and which limiter backend is active.
- **History:** a MODERATOR no longer sees the reason of sanction events (advertencia, silenciamiento, suspensión, proposal) that came from an anonymous caso. An ADMIN still does.
- **Apelaciones:** appeals a MODERATOR cannot answer only because of the appellant's role appear read-only as «La resuelve un admin».
- **Conflict of interest from Usuarios:** a moderator cannot sanction or propose a suspensión for an account whose non-anonymous content they reported in the last 90 days, with a neutral message. Anonymous content never blocks, because the refusal would reveal authorship.
- **Accepted risk, documented:** the paso sugerido and retiro count in Usuarios include anonymous retiros.
- **Out of scope:**
  - Rate limits on uploads and reads (`README_SECURITY`).
  - Lockout of accounts after failed attempts.
  - Deploying Redis (`README_DEVOPS`, «Arquitectura propuesta»).

## Capabilities

### New Capabilities
- `security/rate-limiting`: limits on sign-in, sign-up, password recovery, the appeal from sign-in and community writes; the Redis and memory backends with their fallback; hashed email keys; trusted client IP; the health endpoint.

### Modified Capabilities
- `moderation/sanctions`: «Who can sanction whom» adds the conflict of interest from the Usuarios tab.
- `moderation/appeals`: «Apelaciones tab» lists appeals the viewer cannot answer only because of role, as read-only.
- `moderation/cases`: «Immutable moderation history» hides from moderators the reason of sanctions that came from anonymous casos.

## Impact

- **Backend:**
  - A rate-limit module (Redis client with a Lua fixed-window script, memory backend, fallback, key builders), guards or calls on the auth controller, the suspension-appeal controller and the community write endpoints; it replaces `CommunityWriteThrottlerGuard` and `SuspensionAppealLimiter`.
  - `env.validation.ts` (`REDIS_URL`, `RATE_LIMIT_SECRET` and `TRUST_PROXY`), `configureApp` for `trust proxy`, and a health controller.
  - Moderation: history masking, the appeals query and conflict of interest in the sanctions services.
- **Dependencies:** a Redis client (`ioredis`).
- **Frontend:** tests that the 429 message reaches the sign-in, sign-up, recovery, appeal and community forms, and the read-only appeal in Apelaciones.
- **Docs:** already updated in `README_SECURITY`, `README_DEVOPS` and `README_MODERACION` (§7–§9).

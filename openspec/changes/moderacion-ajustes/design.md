## Context

- **Existing limiters:**
  - Community writes use `@nestjs/throttler` through `CommunityWriteThrottlerGuard` (`subjects.module.ts`, `subjects.controller.ts`).
  - The appeal from sign-in uses an in-memory `SuspensionAppealLimiter` keyed by `@Ip()`.
  - Sign-in, sign-up and recovery have no limit.
- **Sign-in:** `POST /api/v1/auth/login` runs `AuthGuard('local')`. `validateUser` checks the password and then refuses suspended accounts with 403.
- **Dependencies and config:** `ioredis` is already a dependency but no code uses it. Environment validation lives in `src/config/env.validation.ts`, and app setup (prefix, cookies, pipes) in `src/config/configure-app.ts`, shared by `main.ts` and the e2e app.
- **Moderation code:**
  - History masking (`history.service.ts`) hides the target account and the author-as-actor on anonymous content for non-admins, but still returns `reason`.
  - The Apelaciones list (`appeals-query.service.ts`) drops every appeal that `canReview` refuses.
  - `sanctions.service.ts` blocks sanctioning from a caso the moderator reported (`assertAllowed` plus a report lookup by `caseId`). `ModerationCase.targetAuthorId` identifies the author of reported content.

## Goals / Non-Goals

**Goals:**
- One limiter service for every limit, testable with the memory backend, with identical semantics on Redis.
- Limits applied declaratively (`@RateLimit(policy)`), so controllers keep their shape.
- Moderation adjustments stay inside the existing query and service functions; no schema change.

**Non-Goals:**
- Distributed consistency during a Redis outage: each instance counts on its own until Redis returns.
- Sliding windows or token buckets.
- A Redis container in the dev compose file. Development and tests use memory; production operations are in `README_DEVOPS`.

## Decisions

### Limiter core
`RateLimiterService.hit(key, limit, windowMs)` returns `{ count, retryAfterMs }`, and the request is allowed while `count <= limit`.
- **Redis backend:** one Lua script. It runs `INCR`; when the result is 1 it runs `PEXPIRE`; then it runs `PTTL`, and returns count and TTL. The script is atomic, so concurrent requests cannot exceed the limit, and a key never loses its expiry.
- **Memory backend:** a `Map<key, { count, resetAt }>` with the same rules, and a lazy sweep of expired entries on access so the map cannot grow without bound.
- **Two more operations:**
  - `reset(key)`: deletes a counter.
  - `refund(key)`: decrements it if present, never below zero, and keeps its TTL. This is also a Lua script on Redis.
- **Alternative rejected:** keep `@nestjs/throttler` with a Redis storage package. It adds a dependency and doesn't fit «count only failed sign-ins».

### Failed sign-in counting: consume first, forgive on success
The guard hits both `login:<emailHmac>:<ip>` and `login-ip:<ip>` before `AuthGuard('local')` runs. After a successful sign-in, the controller calls `reset` on the email+IP key and `refund` on the IP key. Net effect: only failures stay counted.
- **Alternative rejected:** peek first and increment on failure. It is racy, because parallel guesses all pass the peek.
- **Suspended accounts:** a 403 for a suspended account (correct password) is forgiven like a success. It is not a guess, and the 403 is already revealed today.

### Declarative policies
`@RateLimit('signup' | 'recovery' | 'login' | 'appeal' | 'communityWrite')` plus `RateLimitGuard`. A policy table maps each name to a list of `{ key(req), limit, windowMs }`:
- **Keys:** from `req.ip` and a normalized `req.body.email`. The community-write key uses the authenticated `req.user.id`, available because the global JWT guard runs first.
- **Order of checks:** every key of a policy is hit, then any key over its limit refuses with the longest `retryAfter`, so both counters advance together.
- **Replaces:** `CommunityWriteThrottlerGuard` (with `ThrottlerModule`) and `SuspensionAppealLimiter`.

### 429 response
The guard sets `Retry-After = ceil(retryAfterMs / 1000)` and throws `HttpException(429)`. The body carries `error: 'TOO_MANY_REQUESTS'` and the message «Demasiados intentos. Probá de nuevo en X minutos», with X = `ceil(seconds / 60)`, minimum 1. It passes through the existing exception filter. The frontend already shows the backend `message` on these forms; tasks verify each one and fix any that swallows it.

### Email keys
`emailHmac = HMAC_SHA256(RATE_LIMIT_SECRET, email.trim().toLowerCase())`, hex. In development and tests, `RATE_LIMIT_SECRET` defaults to a fixed string.

### Backend selection and fallback
`RATE_LIMIT_BACKEND` is derived, not configured: `redis` if `REDIS_URL` is set, `memory` otherwise.
- **The client:** ioredis with `enableOfflineQueue: false` and a short `commandTimeout`, so a dead Redis fails fast instead of queuing.
- **On a Redis error:** the service switches to its memory backend, logs `error` once, and stays in `memory-fallback`. ioredis keeps reconnecting, and its `ready` event switches back and logs `info` once. The memory counters are dropped at recovery; Redis is the source of truth again.

### Boot validation
In `env.validation.ts`, when `NODE_ENV=production`, `REDIS_URL` and `RATE_LIMIT_SECRET` are required, and startup fails with the variable name.

### TRUST_PROXY
`configureApp` calls `app.set('trust proxy', n)` when `TRUST_PROXY` is a positive integer (hop count) and leaves it unset otherwise. `req.ip` is then the only IP source; `@Ip()` in the appeal controller is replaced by the guard's `req.ip`.

### Health
A `HealthController` at `GET /api/v1/health`, `@Public()` and exempt from `ActiveAccountGuard`, returns `{ status, rateLimiter }` from the limiter's current mode.

### History reason masking
In `history.service.ts`, the anonymity decision today uses the event's content id. Sanction events from a caso may carry only `caseId`, so anonymity also resolves through the caso's content. For a MODERATOR viewer, an event whose action is in {WARNED, MUTED, SUSPENDED, SUSPENSION_PROPOSED} and whose caso or content is anonymous returns `reason: null` and no `targetUser`. REMOVED and other actions keep their reason. ADMIN and SUPERADMIN are unchanged.

### Read-only appeals
`AppealsQueryService.list` keeps the rows `canReview` accepts, plus, for MODERATOR, rows refused only because of the appellant's role. For those it calls `canReview` again with the appellant role treated as USER, and still excludes the viewer's own decisions and suspensions. Each summary gains `canAnswer`.
- **For these rows:** `detail` returns the summary without the explanation, answer controls or content comment, and `answer` still goes through `canReview`, so it stays 403.
- **Frontend:** renders «La resuelve un admin» instead of the controls.

### Conflict of interest from Usuarios
In `sanctions.service.ts`, a check runs for warn, mute and propose when there is no `caseId`. It looks for a `Report` with `reporterId = actor`, `createdAt >= now - COI_WINDOW_DAYS` (constant 90) and `case.targetAuthorId = target`, whose content is a material, a non-anonymous reseña or a non-anonymous experiencia. If one exists, the request is refused with 403 `CONFLICT_OF_INTEREST` and the neutral message. From a caso, the existing reporter check keeps applying.

## Risks / Trade-offs

- **[Per-instance counting during a Redis outage multiplies the effective limit by the instance count]** → Accepted for availability; it is logged and visible on `/health`.
- **[Shared IPs (university networks) hit `login-ip` and `signup` together]** → Limits are sized for that: 20 failures per 15 minutes, 3 sign-ups per hour. They can be tuned in the policy table.
- **[A misconfigured `TRUST_PROXY` lets clients spoof their IP]** → Off by default, documented as `1` behind Nginx only; an e2e test covers the spoofing scenario.
- **[Recovery limits enable email-based lockout of a victim's recovery]** → Capped at one hour; the victim can still sign in.
- **[Read-only appeals still disclose that an appeal exists]** → Intended: that disclosure is the same for any appellant, so it reveals nothing about role.

## Migration Plan

- **Deploy:** set `REDIS_URL`, `RATE_LIMIT_SECRET` and `TRUST_PROXY=1` in production before deploying (the boot check enforces the first two). No database migration.
- **Rollback:** redeploy the previous build; Redis keys expire on their own.

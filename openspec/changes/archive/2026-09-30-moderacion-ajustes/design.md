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
- **Redis backend:** one Lua script. It runs `INCR` and `PTTL`; when the key has no expiry (new, or left without one) it runs `PEXPIRE`; it returns count and TTL. Starting the window on «no expiry» rather than on «count is 1» keeps the window of a key refunded to zero, as the memory backend does. The script is atomic, so concurrent requests cannot exceed the limit, and a key never loses its expiry.
- **Memory backend:** a `Map<key, { count, resetAt }>` with the same rules, and a lazy sweep of expired entries on access so the map cannot grow without bound.
- **Two more operations:**
  - `reset(key)`: deletes a counter.
  - `refund(key)`: decrements it if present, never below zero, and keeps its TTL. This is also a Lua script on Redis.
- **Alternative rejected:** keep `@nestjs/throttler` with a Redis storage package. It adds a dependency and doesn't fit «count only failed sign-ins».

### Failed sign-in counting: consume first, forgive on success
The guard reserves the attempt on both `login:<emailHmac>:<ip>` and `login-ip:<ip>` before `AuthGuard('local')` runs, atomically per key. When the password is correct:
- `reset` deletes the whole email+IP counter, so it goes back to zero.
- `refund` undoes only this attempt on the IP counter. Earlier failures and the TTL are kept, and the counter never goes below zero.

Net effect: only failures stay counted, and a correct password never adds to `login-ip`.
- **Alternative rejected:** peek first and increment on failure. It is racy, because parallel guesses all pass the peek.
- **Suspended accounts:** a 403 for a suspended account proves the password was correct, so it gets the same `reset` + `refund` as a success. It is not a guess, and the 403 is already revealed today. `validateUser` throws before the controller runs, so the forgiveness happens where the suspension is detected: the local strategy catches `ACCOUNT_SUSPENDED`, forgives, and rethrows.

### Why not `@nestjs/throttler` with a custom storage
Checked against `@nestjs/throttler` 6.5.0 (guard source and typings) before removing it. It would keep only the decorator and loop plumbing. Everything else would still be ours, and several agreed behaviors would fight its abstraction:
- **Storage:** `ThrottlerStorage` has only `increment(key, ttl, limit, blockDuration, name)`. `reset` and `refund` for sign-in would be extra adapter methods called outside the throttler. Atomic Lua, the memory backend, fallback, transition logs and `/health` would live in that adapter, which is exactly the code written here.
- **Coordinated counters:** `canActivate` runs named throttlers in sequence and throws at the first blocked one. The ones before it stay incremented and the ones after it are never counted. Handing back hits on keys within their limit would mean overriding `canActivate`, the guard's core.
- **Window semantics:** exceeding a limit starts a separate `blockDuration` block. `Retry-After` counts from that moment, not from the fixed window's end, and named throttlers send `Retry-After-<name>`. Both differ from the spec.
- **Per-route policies:** every named throttler applies to every guarded route. Seven counters across five policies would need `@SkipThrottle` for all the others on each route, or one guard subclass per policy.
- **What it would give:** HMAC keys and per-endpoint keys fit `getTracker` and `generateKey`, but the policy table already does that in a few lines.

Decision: keep `@RateLimit(policy)` + `RateLimiterService` and remove the package. The agreed behavior is not bent to reuse it.

### Declarative policies
`@RateLimit('signup' | 'recovery' | 'login' | 'appeal' | 'communityWrite')` plus `RateLimitGuard`. A policy table maps each name to a list of `{ key(req), limit, windowMs }`:
- **Keys:** from `req.ip` and a normalized `req.body.email`. An IPv4-mapped address is keyed as its IPv4, and an IPv6 address by its /64 (found in the final review: a subscriber holds a whole /64 and could rotate addresses in it). The community-write key is `community:<Controller.handler>:<userId>`, per account and per endpoint as `@nestjs/throttler` counted it. `req.user.id` is available because the global JWT guard runs first.
- **Order of checks:** every key of a policy is hit, then any key over its limit refuses with the longest `retryAfter`.
- **Refunds on refusal:** a refused request is not an attempt, so keys still within their limit get their hit back. Otherwise an email blocked on `login:<emailHmac>:<ip>` would keep using up `login-ip:<ip>`.
- **Before validation:** guards run before the validation pipe, so invalid bodies count too, as they did with the throttler.
- **Appeal from sign-in:** it answers 401 for a wrong password and 409 for a right one on an active account, so it is a password check too. Besides its own `appeal:<emailHmac>:<ip>` key it hits `login-ip:<ip>`, and a correct password refunds that hit, as a sign-in does. Found in the final review: with only the email+IP key it was a guessing channel without a per-IP cap.
- **Replaces:** `CommunityWriteThrottlerGuard` (with `ThrottlerModule`; `@nestjs/throttler` is removed) and `SuspensionAppealLimiter`.

### 429 response
The guard sets `Retry-After = ceil(retryAfterMs / 1000)` and throws `HttpException(429)`. The body carries `code: 'TOO_MANY_REQUESTS'` (the filter's convention for machine-readable refusals), `retryAfter` in seconds, and the message «Demasiados intentos. Probá de nuevo en X minutos», with X = `ceil(seconds / 60)`, minimum 1 («1 minuto» in singular). It passes through the existing exception filter. The frontend already shows the backend `message` on these forms; tasks verify each one and fix any that swallows it.

### Testing Redis without Redis
`ioredis-mock` (a dev dependency) runs the Lua scripts, so the unit tests exercise the real scripts. There is no Docker in development.

### Email keys
`emailHmac = HMAC_SHA256(RATE_LIMIT_SECRET, email.trim().toLowerCase())`, hex. In development and tests, `RATE_LIMIT_SECRET` defaults to a fixed string.

### Backend selection and fallback
`RATE_LIMIT_BACKEND` is derived, not configured: `redis` if `REDIS_URL` is set, `memory` otherwise.
- **The client:** ioredis with `enableOfflineQueue: false` and a short `commandTimeout`, so a dead Redis fails fast instead of queuing.
- **On a Redis error:** the service switches to its memory backend, logs `error` once, and stays in `memory-fallback`. ioredis keeps reconnecting, and its `ready` event switches back and logs `info` once. A command can also fail on a live connection (a timeout), where no `ready` comes, so while degraded and connected the service retries Redis every 5 seconds and recovers on the first success. The memory counters are dropped at recovery; Redis is the source of truth again.
- **Accepted:** around a transition, one request's operations can land on different backends (a hit in Redis and its refund in memory). The effect is one extra or one missing count for one window.

### Boot validation
In `env.validation.ts`, when `NODE_ENV=production`, `REDIS_URL` and `RATE_LIMIT_SECRET` are required, and startup fails with the variable name. The secret must have at least 32 characters and differ from the development default.

### TRUST_PROXY
`configureApp` calls `app.set('trust proxy', n)` when `TRUST_PROXY` is a positive integer (hop count) and leaves it unset otherwise. `req.ip` is then the only IP source; `@Ip()` in the appeal controller is replaced by the guard's `req.ip`.
`ConfigModule` validates the environment when `AppModule` is imported, so an e2e test cannot turn `TRUST_PROXY` on afterwards. `configureApp` is covered by a unit test, and the e2e test sets `trust proxy` on the app directly.

### Health
A `HealthController` at `GET /api/v1/health`, `@Public()` and exempt from `ActiveAccountGuard`, returns `{ status, rateLimiter }` from the limiter's current mode.

### History reason masking
In `history.service.ts`, the anonymity decision today uses the event's content id. Sanction events from a caso may carry only `caseId`, so anonymity also resolves through the caso's content. This is not a new rule: it completes the existing «autor oculto» rule (no identifiable account or author-as-actor) for events that lack a direct content id. The only new masking is the reason:
- **For a MODERATOR viewer:** an event whose action is in {WARNED, MUTED, SUSPENDED, SUSPENSION_PROPOSED} and whose caso or content is anonymous also returns `reason: null`.
- **Found in the final review:** the reason alone was not enough. The event's time, caso and content still matched the account's file and the Apelaciones tab. So for a MODERATOR, an event about the account (the sanción actions, SANCTION_LIFTED, SUSPENSION_REJECTED, and APPEAL_* of a sanción) from an anonymous caso loses its reason, `caseId` and target, and a `contentId` filter drops it. APPEAL_* of a retiro of anonymous content keeps its content but not its reason, as the read-only appeal hides the explanation.
- **Other actions**, REMOVED included, keep their reason.
- **ADMIN and SUPERADMIN** see everything.

### Anonymous-content appeals go to admins
An appeal of a retiro of an anonymous reseña or experiencia is answered only by ADMIN or SUPERADMIN, whatever the appellant's role. `canReview` gains an `anonymousContent` flag that raises the minimum rank to ADMIN, like `suspension`. It is enforced where `canReview` is called: the Apelaciones list and detail, answering, and the pending-appeals count.
- **Why:** if a moderator could answer a student's anonymous-content appeal but only see a staff member's read-only, the mark itself would reveal that the anonymous author is staff. Sending all of them to admins makes every such appeal look the same to a moderator (product decision on 2026-09-30, accepting the extra admin workload).
- **Scope:** retiro appeals only. A sanción appeal already shows the appellant's username, and a sanción from an anonymous caso is shown «por un caso sobre una publicación anónima», without linking the caso, so moderators keep answering those.
- **Alternative rejected:** keeping moderators on anonymous-content appeals and documenting the leak as an accepted risk.

### Read-only appeals
`AppealsQueryService.list` keeps the rows `canReview` accepts, plus, for MODERATOR, rows refused only because of the appellant's role or because they are about anonymous content. For those it calls `canReview` again with the appellant role treated as USER and the content treated as signed, and still excludes the viewer's own decisions and suspensions. Each summary gains `canAnswer`.
- **For these rows:** `detail` returns the summary without the explanation, answer controls or content comment, and `answer` still goes through `canReview`, so it stays 403.
- **Frontend:** renders «La resuelve un admin» instead of the controls.

### Conflict of interest from Usuarios
In `sanctions.service.ts`, a check runs for warn, mute and propose, with or without `caseId`: the final review found that naming any caso about the account skipped it. Only the advertencia of a caso's decision («Advertir también», `decidingCase`) is exempt; refusing it for another report could reveal that the anonymous author is the account the moderator reported. It looks for a `Report` with `reporterId = actor`, `createdAt >= now - COI_WINDOW_DAYS` (constant 90) and `case.targetAuthorId = target`, whose content is a material, a non-anonymous reseña or a non-anonymous experiencia. If one exists, the request is refused with 403 `CONFLICT_OF_INTEREST` and the neutral message. From a caso, the existing reporter check keeps applying.

## Risks / Trade-offs

- **[Per-instance counting during a Redis outage multiplies the effective limit by the instance count]** → Accepted for availability; it is logged and visible on `/health`.
- **[Shared IPs (university networks) hit `login-ip` and `signup` together]** → Limits are sized for that: 20 failures per 15 minutes, 3 sign-ups per hour. They can be tuned in the policy table.
- **[A misconfigured `TRUST_PROXY` lets clients spoof their IP]** → Off by default, documented as `1` behind Nginx only; an e2e test covers the spoofing scenario.
- **[Recovery limits enable email-based lockout of a victim's recovery]** → Capped at one hour; the victim can still sign in.
- **[Admins answer every appeal about anonymous content]** → More admin workload, accepted because anonymity is the stronger constraint. The Apelaciones count for moderators still includes those read-only items.

## Migration Plan

- **Deploy:** set `REDIS_URL`, `RATE_LIMIT_SECRET` and `TRUST_PROXY=1` in production before deploying (the boot check enforces the first two). No database migration.
- **Rollback:** redeploy the previous build; Redis keys expire on their own.

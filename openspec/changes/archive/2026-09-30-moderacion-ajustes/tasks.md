## 1. Limiter core

- [x] 1.1 Write Vitest tests for the memory backend (window start, count, `retryAfterMs`, expiry, `reset`, `refund` never below zero with TTL kept, sweep of expired keys) and implement it; verify `pnpm test:vitest` passes
- [x] 1.2 Write Vitest tests for the Redis backend's Lua scripts against a fake client or `ioredis-mock` (atomic hit sets expiry only on the first hit, refund keeps TTL) and implement them; verify the tests pass
- [x] 1.3 Write Vitest tests for `RateLimiterService` mode switching: `memory` without `REDIS_URL`, `redis` with it, `memory-fallback` on a Redis error, recovery on `ready`, exactly one error log and one info log per transition. Implement it with ioredis (`enableOfflineQueue: false`, short `commandTimeout`); verify the tests pass
- [x] 1.4 Add `emailHmac` with Vitest tests (trim + lowercase, secret-dependent, no plain email in the key); verify the tests pass

## 2. Configuration

- [x] 2.1 Extend `env.validation.ts` with `REDIS_URL`, `RATE_LIMIT_SECRET` (with a dev default) and `TRUST_PROXY`, with Vitest tests that production without either required variable fails naming it; verify the tests pass
- [x] 2.2 Apply `trust proxy` in `configureApp` from `TRUST_PROXY`; verify with an e2e test that, without it, a changing `X-Forwarded-For` still hits the same counter
- [x] 2.3 Add `HealthController` (`GET /api/v1/health`, public, not account-guarded) with an e2e test for `{ status: 'ok', rateLimiter: 'memory' }` and a unit test for `degraded`/`memory-fallback`; verify the tests pass

## 3. Policies and endpoints

- [x] 3.1 Add `@RateLimit(policy)`, `RateLimitGuard` and the policy table (login, login-ip, signup, recovery, recovery-ip, appeal, communityWrite), with the 429 body, `Retry-After` and «Demasiados intentos. Probá de nuevo en X minutos». Cover it with Vitest unit tests for key building, the longest retry and the minutes rounding; verify the tests pass
- [x] 3.2 Apply it to login before `AuthGuard('local')`, and forgive on success (reset the email+IP key, refund the IP key), including the suspended-account 403. Verify with e2e tests: the sixth wrong password is refused even with the correct one; after two failures and a success, 5 more failures are allowed; 20 failures across emails block the IP
- [x] 3.3 Apply it to register and forgot-password; verify with e2e tests that the fourth sign-up per IP and the fourth recovery for an unknown email get 429 identical to an existing account's
- [x] 3.4 Replace `SuspensionAppealLimiter` and `@Ip()` in `suspension-appeal.controller.ts` with the appeal policy, and delete the old limiter; verify the existing appeal e2e tests plus a 6th-attempt 429 test pass
- [x] 3.5 Replace `CommunityWriteThrottlerGuard` and `ThrottlerModule` with the communityWrite policy on reseñas, experiencias and reportes, remove `@nestjs/throttler` if unused, and update `subjects.community-write-api.spec.ts`; verify Jest and a Vitest e2e 7th-reporte 429 test pass

## 4. Moderation adjustments

- [x] 4.1 History: resolve anonymity through the caso's content too, and hide `reason` and `targetUser` of WARNED, MUTED, SUSPENDED and SUSPENSION_PROPOSED events from anonymous casos for MODERATOR. Verify with Vitest e2e tests: a MODERATOR sees no account or reason, an ADMIN sees both, and REMOVED keeps its reason
- [x] 4.2 Apelaciones: list role-only-refused appeals for MODERATOR with `canAnswer: false` (never own decisions or suspensions); `detail` without explanation or comment; `answer` still 403. Verify with Vitest e2e tests
- [x] 4.3 Conflict of interest from Usuarios: add `COI_WINDOW_DAYS = 90` and refuse warn, mute and propose without `caseId` when the actor reported the target's non-anonymous content within the window, with 403 `CONFLICT_OF_INTEREST` and the neutral message. Verify with Vitest e2e tests covering a material 10 days ago (refused), an anonymous reseña (allowed) and a report from 91 days ago (allowed)

## 5. Frontend

- [x] 5.1 Write Vitest tests that a 429 message is shown on sign-in, sign-up, password recovery, «Apelar esta suspensión» and the reseña, experiencia and reporte forms; fix any form that swallows it; verify the frontend tests pass
- [x] 5.2 Render read-only appeals in Apelaciones with «La resuelve un admin» and no answer controls, with a Vitest test; verify the tests pass

## 6. Verification

- [x] 6.1 Run backend Jest (unit and e2e), Vitest (unit, e2e, migration), lint and build, and frontend tests, lint, design tokens and build, with logs in `.audit-logs/`; verify all pass and report only the summaries
- [x] 6.2 Browser check with agent-browser: the sign-in 429 message after 5 wrong passwords, and a read-only appeal as MODERATOR; save the evidence in `docs/validation/evidence/moderacion-ajustes/`, then stop the servers
- [x] 6.3 Run `graphify update .`; verify it exits 0

## 7. Anonymous-content appeals go to admins (decision after 6.2)

- [x] 7.1 Add an `anonymousContent` flag to `canReview` (minimum ADMIN) and pass it from every caller for retiro appeals of anonymous reseñas and experiencias: the Apelaciones list and detail, answering, and the pending-appeals count. Verify with Vitest unit tests on `canReview` and e2e tests: a student's and a moderator's anonymous-content appeals are listed identically read-only for another moderator, answering either is 403 for a moderator, and an ADMIN answers both
- [x] 7.2 Update existing tests that expect a moderator to answer an anonymous-content appeal (`appeals-review.e2e.test.ts`, `appeals-answer.test.ts`, the frontend `AppealsPanel` fixtures if needed), plus the demo data (`seed-sanctions.ts`) if a demo step relies on it; verify backend Vitest (unit, e2e), Jest and frontend tests pass
- [x] 7.3 Browser check as `moderator`: both anonymous-content appeals read-only and identical; as `admin`: both answerable. Update `docs/validation/evidence/moderacion-ajustes/`, then stop the servers

## 8. Review and archive

- [x] 8.1 Fresh code review by an Opus subagent (security focus: rate-limit bypass and races, Redis/memory fallback, reset/refund, IP spoofing and `TRUST_PROXY`, account enumeration, anonymity inference, authorization regressions, spec/implementation mismatches). Fix what it finds and rerun the relevant tests
- [x] 8.2 Rerun the full verification (6.1) and `graphify update .`; verify all pass

## Purpose

Slow down password guessing, account-creation abuse and bursts of community writes with per-account and per-client limits that keep working across several API instances and degrade safely when their storage fails.

## ADDED Requirements

### Requirement: Sign-in, sign-up and recovery limits
The API SHALL limit:
- **Sign-in:** 5 failed attempts per email and client IP every 15 minutes, reset by a successful sign-in; and 20 failed attempts per client IP every 15 minutes, not reset by a successful sign-in.
- **Sign-up:** 3 attempts per client IP every hour.
- **Password recovery:** 3 requests per email every hour and 3 requests per client IP every hour, counted whether or not the account exists.
- **Appeal from sign-in** («Apelar esta suspensión»): 5 attempts per email and client IP every 15 minutes.

An exceeded limit SHALL be answered with status 429, a `Retry-After` header in seconds and the message «Demasiados intentos. Probá de nuevo en X minutos», where X is the remaining wait rounded up. The answer SHALL NOT reveal whether the account exists.

#### Scenario: Sixth wrong password
- **WHEN** a client enters a wrong password for the same email 5 times within 15 minutes and tries again
- **THEN** the sixth attempt is refused with 429 and `Retry-After`, even if the password is now correct

#### Scenario: Successful sign-in after mistakes
- **WHEN** a student mistypes their password twice and then signs in correctly
- **THEN** their email-and-IP counter starts again from zero, while the per-IP counter keeps the two failures

#### Scenario: Many emails from one client
- **WHEN** one client IP fails 20 sign-ins across different emails within 15 minutes
- **THEN** further sign-in attempts from that IP are refused until the window ends

#### Scenario: Recovery for an unknown email
- **WHEN** a client asks to recover the password of an email with no account 4 times in an hour
- **THEN** the fourth request is refused with 429 exactly as for an existing account

### Requirement: Community write limit
Publishing or editing reseñas and experiencias, and filing reportes, SHALL be limited to 6 per account per minute by the same limiter, answering 429 with `Retry-After` and the same message.

#### Scenario: Burst of reportes
- **WHEN** an account files a seventh reporte within a minute
- **THEN** it is refused with 429 and `Retry-After`

### Requirement: Shared, degradable limit storage
Limits SHALL be counted in fixed windows, where incrementing a counter, starting its window and reading its remaining time happen in one atomic operation. With `REDIS_URL` configured, the counters SHALL be shared through Redis so every API instance applies the same limits. Without it, they SHALL be kept in the process's memory with the same behavior. In production, the API SHALL refuse to start without `REDIS_URL` and `RATE_LIMIT_SECRET`. If Redis stops answering, the API SHALL keep limiting with per-instance memory counters. It SHALL log once when it degrades and once when it recovers, never once per request.

#### Scenario: Production without Redis configured
- **WHEN** the API starts with `NODE_ENV=production` and no `REDIS_URL`
- **THEN** it refuses to start and names the missing variable

#### Scenario: Redis goes down
- **WHEN** Redis stops answering while the API runs
- **THEN** sign-in attempts are still limited per instance, one error is logged, and when Redis answers again one recovery is logged and the shared counters are used again

### Requirement: Private limit keys
Keys that include an email SHALL use an HMAC of the email, trimmed and lowercased, with `RATE_LIMIT_SECRET`. The limit storage SHALL NOT contain email addresses.

#### Scenario: Reading the limit storage
- **WHEN** someone lists the keys in Redis after sign-in attempts
- **THEN** no key contains an email address

### Requirement: Trusted client IP
The client IP used by limits SHALL come from the connection unless `TRUST_PROXY` is configured, in which case forwarded addresses from that many proxy hops SHALL be trusted. `TRUST_PROXY` SHALL be off by default.

#### Scenario: Spoofed forwarded address without a proxy
- **WHEN** `TRUST_PROXY` is not set and a client sends a different `X-Forwarded-For` on each attempt
- **THEN** its attempts are still counted against its connection IP

### Requirement: Health endpoint
A public `GET /health` SHALL answer with `status` (`ok` or `degraded`) and `rateLimiter` (`redis`, `memory` or `memory-fallback`), and nothing else about the system. `degraded` SHALL mean that Redis is configured but not answering.

#### Scenario: Monitoring during a Redis outage
- **WHEN** Redis is configured but not answering and a monitor calls `GET /health`
- **THEN** it answers `{ status: 'degraded', rateLimiter: 'memory-fallback' }`

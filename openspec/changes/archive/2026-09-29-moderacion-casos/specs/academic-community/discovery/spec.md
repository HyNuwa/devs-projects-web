## MODIFIED Requirements

### Requirement: Community publication requires only authentication
The system SHALL require an authenticated account to publish, edit, or delete a course review or final experience, but SHALL NOT require verified email, verified enrollment, or an attestation checkbox as a condition for accepting a submission. Accepted submissions from accounts that meet a revisión previa condition (see `moderation/publication`) SHALL wait for moderator approval before becoming public.

#### Scenario: Authenticated account publishes
- **WHEN** an authenticated account that meets no revisión previa condition submits a valid review or final experience
- **THEN** the system accepts and publishes it immediately and applies the configured technical anti-spam controls

#### Scenario: Unverified account publishes
- **WHEN** an authenticated account with an unverified email submits a valid review or final experience
- **THEN** the system accepts it, keeps it in revisión previa, and tells the author why

#### Scenario: Anonymous visitor attempts publication
- **WHEN** an unauthenticated visitor attempts to publish community content
- **THEN** the system requests sign-in and preserves a validated same-origin return path

## REMOVED Requirements

### Requirement: Reports do not determine visibility automatically
**Reason**: Reportes now group into casos, and strong independent signals trigger ocultamiento preventivo (ADR 0001, `docs/README_MODERACION.md` §4).
**Migration**: See `moderation/cases` ("Reporting published content", "Reports group into one caso per content", "Ocultamiento preventivo on strong signals").

### Requirement: Moderator removal is reversible and attributable
**Reason**: Retiro and restauración now apply to every contribution type through casos, and moderators no longer see anonymous authors by default.
**Migration**: See `moderation/cases` ("Decisions on a caso", "Revelación de autor", "Immutable moderation history") and `moderation/publication` ("Authors see the status of their contributions").

## ADDED Requirements

### Requirement: Publication is not a correctness claim
The public interface SHALL NOT display a `Revisado`, `Aprobado` or similar badge on published materials, and SHALL NOT imply that publication or moderation guarantees academic correctness.

#### Scenario: Public user judges a material
- **WHEN** a user views a published material
- **THEN** the interface presents declared academic context, preview availability, ratings and `Me sirvió` as separate evidence, and makes no public correctness or verification claim

## REMOVED Requirements

### Requirement: Mandatory pre-publication moderation
**Reason**: ADR 0001 replaces approval before publication with publicación inmediata and moderación posterior.
**Migration**: See `moderation/publication` (shared publication status, immediate publication, automatic checks, revisión previa) and `moderation/cases` (reportes, casos, decisions). The no-correctness-claim scenario moves to "Publication is not a correctness claim" in this capability.

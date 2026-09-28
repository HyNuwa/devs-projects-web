## Purpose

Publish community contributions (materials, reseñas de cursada and experiencias de final) as soon as they pass automatic checks, hold only risky ones for revisión previa, and keep authors informed of what happened to each contribution.

## ADDED Requirements

### Requirement: Shared publication status
Every material, reseña de cursada and experiencia de final SHALL have exactly one publication status: `Publicado`, `En revisión previa`, `Rechazado en revisión previa`, `Oculto mientras se revisa` or `Retirado`. Only `Publicado` content, and `Oculto mientras se revisa` content that has been hidden for more than 7 days, SHALL appear in public lists, search, materia views, aggregates, preview, comments and download. Permanent deletion by the author SHALL remain separate from these statuses.

#### Scenario: Public reads exclude non-public statuses
- **WHEN** a material is `En revisión previa`, `Rechazado en revisión previa`, `Oculto mientras se revisa` (hidden 7 days or less) or `Retirado`
- **THEN** it is absent from every public list, search result, materia view, aggregate, preview, comment surface and download route

#### Scenario: Hidden content is not hidden indefinitely
- **WHEN** content has been `Oculto mientras se revisa` for more than 7 days and no moderator has decided its caso
- **THEN** it appears publicly again and its caso stays open and flagged as overdue

### Requirement: Immediate publication
A contribution from an account that does not meet any revisión previa condition SHALL become `Publicado` as soon as it passes the automatic checks, without moderator action. A published material's file SHALL be downloadable and previewable immediately. Being published SHALL NOT be presented as an academic-correctness or verification claim.

#### Scenario: Established student uploads a material
- **WHEN** an account older than 7 days with a verified email and no retiro in the last 90 days uploads a valid material
- **THEN** the material is `Publicado` immediately and appears in its materia, search and preview

#### Scenario: Student publishes a reseña
- **WHEN** an account that meets no revisión previa condition submits a valid reseña de cursada or experiencia de final
- **THEN** it is `Publicado` immediately

### Requirement: Automatic checks before publishing a material
Before accepting a material, the system SHALL reject it with an explanatory message when the file format is unsupported, the file exceeds 25 MB, the file is empty, or the materia or tipo de recurso is missing. It SHALL block an exact duplicate (a file with the same content hash already `Publicado`, `En revisión previa` or `Oculto mientras se revisa` in the same materia) and point to the existing material. It SHALL accept at most 10 material uploads per account per rolling 24 hours.

#### Scenario: Exact duplicate in the same materia
- **WHEN** a student uploads a file whose content hash matches a published material of the same materia
- **THEN** the upload is refused, nothing is stored, and the response identifies the existing material so the interface can link to it

#### Scenario: Same file in a different materia
- **WHEN** the matching file belongs to a different materia
- **THEN** the upload is accepted normally

#### Scenario: Upload limit reached
- **WHEN** an account that already uploaded 10 materials in the last 24 hours uploads another
- **THEN** the upload is refused with a message saying when it can upload again

#### Scenario: Empty file
- **WHEN** a student uploads a zero-byte file
- **THEN** the upload is refused before any storage

### Requirement: Revisión previa for risky accounts
A contribution SHALL enter `En revisión previa` instead of being published when its author's account is younger than 7 days, has not verified its email, or had content `Retirado` within the last 90 days. The author SHALL be told at submission that the contribution is waiting for review and why, in plain words. A moderator SHALL either approve it (it becomes `Publicado`) or reject it with a required reason (it becomes `Rechazado en revisión previa`).

#### Scenario: New account uploads a material
- **WHEN** an account created 2 days ago uploads a valid material
- **THEN** the material is `En revisión previa`, its file is not public, and the confirmation says it will be visible after review because the account is new

#### Scenario: Unverified email publishes a reseña
- **WHEN** an account with an unverified email submits a valid reseña
- **THEN** the reseña is accepted as `En revisión previa` and the confirmation says why

#### Scenario: Moderator approves a revisión previa
- **WHEN** a moderator approves content `En revisión previa`
- **THEN** it becomes `Publicado` and the approval is recorded with the moderator and date

#### Scenario: Moderator rejects a revisión previa
- **WHEN** a moderator rejects content `En revisión previa` with a reason
- **THEN** it becomes `Rechazado en revisión previa`, stays private, and its author sees the reason and date

### Requirement: Correct and resubmit after a rejection
The author of content `Rechazado en revisión previa` SHALL be able to edit it, including replacing a material's file, and resubmit it. A resubmission SHALL return it to `En revisión previa` and keep the earlier rejection in its history.

#### Scenario: Author resubmits a rejected material
- **WHEN** the author edits a rejected material and resubmits it
- **THEN** it becomes `En revisión previa` again and moderators see the previous rejection reason with it

### Requirement: Authors see the status of their contributions
In Mis envíos, the signed-in author SHALL see every material, reseña and experiencia they contributed, including anonymous ones, with its publication status, the latest decision reason when there is one, and its date. Authors SHALL NOT see who decided or who reported. `Oculto mientras se revisa` SHALL be explained as temporary; `Retirado` SHALL show the retiro reason; `Rechazado en revisión previa` SHALL offer editing and resubmitting.

#### Scenario: Author checks a retired reseña
- **WHEN** the author opens Mis envíos after their reseña was retired
- **THEN** the entry shows `Retirado`, the reason written by moderation and the date, without the moderator's identity

#### Scenario: Author checks hidden content
- **WHEN** the author's material is `Oculto mientras se revisa`
- **THEN** Mis envíos shows it as hidden while moderation reviews it, with no points deducted yet

#### Scenario: Another user looks for someone's submissions
- **WHEN** a signed-in user requests another account's submissions
- **THEN** the request is refused

### Requirement: Contributors are told the publication rules
Subir material and the reseña and experiencia forms SHALL say that contributions are published immediately and that publication does not mean the content is correct, and SHALL link to the community rules. A public `/normas` page SHALL present the community rules for materials, reseñas and experiencias, convivencia and what happens when something breaks them, matching the rules in force. It SHALL NOT describe features or processes that do not exist yet (Clasificados, Eventos, appeals, sanctions).

#### Scenario: Visitor reads the rules
- **WHEN** anyone opens `/normas`
- **THEN** the page explains immediate publication, reporting, ocultamiento preventivo (3 qualified reports in 48 hours, or 1 qualified report of personal data) and retiro with a visible reason, and contains no section on Clasificados, Eventos, appeals or sanctions

#### Scenario: Student opens Subir material
- **WHEN** a signed-in student opens Subir material
- **THEN** the form states that the material is published immediately unless it needs revisión previa, and links to `/normas`

## Purpose

Let students judge whether an approved academic resource is relevant and useful through declared context, preview, ratings, and community signals without presenting publication moderation as a guarantee of academic correctness.

## ADDED Requirements

### Requirement: Resource academic context
Every newly contributed resource SHALL declare a materia and resource type and MAY declare ciclo lectivo, professor, and turno; public responses SHALL expose the known context without inference.

#### Scenario: New resource has complete context
- **WHEN** a contributor submits a resource with all supported academic-context fields
- **THEN** the system stores and returns the declared materia, resource type, ciclo lectivo, professor, and turno

#### Scenario: New resource omits optional context
- **WHEN** a contributor omits ciclo lectivo, professor, or turno
- **THEN** the system accepts the resource and exposes each omitted field as unknown

#### Scenario: Existing resource predates academic context
- **WHEN** an existing resource is read after migration
- **THEN** it remains accessible with a safe resource-type backfill and unknown optional context rather than fabricated metadata

### Requirement: Mandatory pre-publication moderation
Every uploaded material SHALL enter a non-public pending state and SHALL become available through public reads, search, preview, comments, and download only after an authorized moderator approves it. Rejected material SHALL remain non-public, and the public interface SHALL NOT display a redundant `Revisado` badge or imply that moderation guarantees academic correctness.

#### Scenario: Contributor uploads a material
- **WHEN** a contributor completes a valid material upload
- **THEN** the material is recorded as pending and is absent from every public list, search result, preview, comment surface, and download route

#### Scenario: Moderator approves a pending material
- **WHEN** an authorized moderator approves the material
- **THEN** the material becomes eligible for public discovery, preview, comments, and download without a public approval badge

#### Scenario: Moderator rejects a pending material
- **WHEN** an authorized moderator rejects the material
- **THEN** the material remains non-public and the established moderation evidence and contributor-facing status are preserved

#### Scenario: Public user judges a material
- **WHEN** a user views an approved public material
- **THEN** the interface presents declared academic context, preview availability, ratings, and `Me sirvió` as separate evidence and makes no public correctness or verification claim

### Requirement: Idempotent helpfulness signal
The system SHALL provide `Me sirvió` as a unique per-user resource reaction and SHALL expose its aggregate count separately from ratings and publication moderation.

#### Scenario: Authenticated user marks a resource helpful
- **WHEN** a signed-in user sets `Me sirvió` on a resource they have not marked helpful
- **THEN** the viewer state becomes active and the aggregate count increases exactly once

#### Scenario: User repeats the same helpfulness state
- **WHEN** the same user submits the already-current helpfulness state again
- **THEN** the system succeeds without creating a duplicate or changing the aggregate count twice

#### Scenario: User removes helpfulness
- **WHEN** a signed-in user removes `Me sirvió`
- **THEN** the viewer state becomes inactive and the aggregate count decreases exactly once

#### Scenario: Anonymous user attempts helpfulness
- **WHEN** an unauthenticated user activates `Me sirvió`
- **THEN** the system requests sign-in and preserves a return path to the resource

### Requirement: Persistent saved-resource state
The system SHALL allow an authenticated user to save or unsave a resource idempotently and SHALL expose the viewer's saved state without changing public ranking, ratings, helpfulness, or moderation state.

#### Scenario: User saves a resource
- **WHEN** a signed-in user selects `Guardar` on an unsaved resource
- **THEN** the saved state persists for that user and repeated requests do not create duplicates

#### Scenario: Anonymous user attempts to save
- **WHEN** an unauthenticated user selects `Guardar`
- **THEN** the system requests sign-in and preserves a return path to the resource

### Requirement: Context-preserving material preview
The primary material-opening journey SHALL keep the user in the current resource list and open a URL-backed modal containing the file identity, preview, download/save/usefulness actions, ratings, and comments rather than navigating to a standalone file page.

#### Scenario: User opens a material on desktop
- **WHEN** a user opens an approved public material from a desktop resource list
- **THEN** a modal keeps the file name and primary actions visible, presents a large preview region on the left, and presents comments plus community context in a dedicated right-hand panel

#### Scenario: User opens a material on mobile
- **WHEN** a user opens an approved public material on a narrow viewport
- **THEN** the preview uses a full-screen or stacked dialog layout with title, close and download controls reachable before the document and comments reachable without two-dimensional page scrolling

#### Scenario: Preview URL is shared or restored
- **WHEN** a user reloads, bookmarks, or shares a resource-list URL containing the selected material identifier
- **THEN** the same list context is restored and the corresponding modal opens; closing it removes only the modal state and retains the underlying list state

#### Scenario: Ratings are present
- **WHEN** a resource has star ratings or written comments
- **THEN** those signals remain accessible in the modal and are not styled as academic verification or moderator endorsement

### Requirement: Resilient preview fallback
The system SHALL preserve file identity, academic context, comments, actions, and download access when inline preview is unsupported, unavailable, or fails.

#### Scenario: Preview is supported
- **WHEN** a public PDF or image has a usable preview source
- **THEN** the user can inspect it inside the modal without losing the underlying hierarchy, search, filters, or list position

#### Scenario: Preview is unsupported or fails
- **WHEN** the file format is unsupported or the preview source cannot load
- **THEN** the modal explains the limitation, retains the file context, comments, and actions, and offers the download fallback

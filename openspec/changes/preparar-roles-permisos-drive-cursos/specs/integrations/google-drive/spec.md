# Spec Delta

## Purpose

Almacenar y servir archivos de cursos con Google Drive conservando en la aplicación la autorización, las relaciones académicas y la recuperación de fallas.

## ADDED Requirements

### Requirement: Explicit server configuration
Drive credentials SHALL remain server-side. Incomplete or malformed configuration SHALL fail startup without exposing secrets. When Drive is entirely unconfigured, authentication and educational operations without files SHALL remain available and course-file operations SHALL return 503 without creating file records.

#### Scenario: No Drive credentials
- **WHEN** an administrator uploads a course file with Drive unconfigured
- **THEN** the API returns 503 without creating an attachment or silently storing it publicly

### Requirement: Private course uploads
Course uploads SHALL create private files inside the configured storage root, never anyone-reader permissions. The API SHALL reject empty files, unsupported formats, mismatched content signatures and files above 25 MiB before contacting Drive. The supported course formats SHALL be PDF, JPEG, PNG and WebP.

#### Scenario: Valid private attachment
- **WHEN** an administrator uploads a valid PDF to a lesson
- **THEN** the file is private in Drive and a database attachment links it to that lesson and uploader

#### Scenario: Disguised executable
- **WHEN** a file named apuntes.pdf contains an executable signature
- **THEN** the API returns 400 without contacting Drive

### Requirement: Authorized import from configured storage
Only an account with Drive-management permission SHALL browse or import existing files. Browse results SHALL be paginated, exclude trashed entries and stay within the configured root. Import SHALL verify ancestry, supported format and absence of public sharing. Each Drive file SHALL be linked at most once; a duplicate SHALL return 409.

#### Scenario: Quoted folder identifier
- **WHEN** an administrator supplies an invalid folder identifier containing Drive query syntax
- **THEN** the API returns 400 before issuing a Drive query

#### Scenario: External file import
- **WHEN** an administrator attempts to import a file outside the configured root
- **THEN** the API returns 404 and creates no database relationship

#### Scenario: Additional browse page
- **WHEN** a folder contains more files than one response page can hold
- **THEN** the response provides a continuation token without pretending the first page is complete

### Requirement: Safe private streaming
The API SHALL authorize the database attachment and its course before streaming its Drive file. Valid single byte ranges SHALL return 206, invalid or multiple ranges SHALL return 416. Responses SHALL use safe filenames, trusted content types, nosniff and private no-store caching. Private files SHALL NOT redirect to Drive.

#### Scenario: Partial PDF request
- **WHEN** an authorized reader requests a valid byte range of a READY attachment
- **THEN** the API streams only that range with Content-Range and Content-Length

### Requirement: Recoverable attachment persistence
New uploads SHALL reserve a database attachment before contacting Drive and become readable only after READY is persisted. Failures SHALL leave a tracked recoverable state. Newly uploaded files that cannot be linked SHALL be cleaned up or recorded for retry; imported files SHALL NOT be deleted on persistence failure.

#### Scenario: Drive succeeds and database completion fails
- **WHEN** a new file uploads successfully but its attachment cannot become READY
- **THEN** it remains unreadable and a durable operation identifier allows reconciliation or cleanup

### Requirement: Existing account compatibility
Drive integration SHALL preserve existing user identifiers and authentication routes on develop. Private course files SHALL NOT require public sharing or introduce public static storage. Course and materia creation SHALL remain usable without Google credentials.

#### Scenario: Platform has no Drive configuration
- **WHEN** an administrator creates a materia and course without Google credentials
- **THEN** those operations succeed and existing user identifiers and authentication remain valid

### Requirement: Provider failures preserve confidentiality
Provider failures SHALL return a sanitized error without credentials, raw provider responses or Drive identifiers. Missing Drive files SHALL return 404, invalid ranges 416, throttling or transient failures 503, and provider permission failures 502. Failed or pending attachments SHALL never appear as readable files.

#### Scenario: Provider rate limit
- **WHEN** Drive throttles an authorized download
- **THEN** the API returns 503 without exposing provider internals or issuing a public URL

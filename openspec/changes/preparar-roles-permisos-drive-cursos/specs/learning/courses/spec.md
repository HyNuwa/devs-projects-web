# Spec Delta

## Purpose

Permitir crear materias y organizar cursos formativos con secciones y clases, relacionados opcionalmente con una materia universitaria y accesibles mediante inscripción.

## ADDED Requirements

### Requirement: Academic context creation
Only accounts with materia-management permission SHALL create and edit materias and associate them with existing study plans. A materia SHALL require a nonempty name and allow an optional code and description. A duplicate study-plan association SHALL return 409 and a missing materia or plan SHALL return 404. Existing academic contributions SHALL retain their relationships.

#### Scenario: Administrator creates a materia and a related course
- **WHEN** an authorized administrator creates a materia and then a course referencing its identifier
- **THEN** both records exist independently and the course references the new materia

#### Scenario: Student creates academic context
- **WHEN** a USER attempts to create or edit a materia or associate a study plan
- **THEN** the API returns 403 and no academic records change

#### Scenario: Invalid study-plan association
- **WHEN** an administrator links a materia to a nonexistent study plan
- **THEN** the API returns 404 without creating the association

### Requirement: Course academic relationships
A course SHALL have a title, description, creator, status and optional existing materia. Each section SHALL belong to exactly one course, each lesson to one section, and each lesson file to one lesson. Existing materias, recursos académicos and reseñas de cursada SHALL retain their current meaning and relationships.

#### Scenario: Course linked to a materia
- **WHEN** an authorized administrator creates a course linked to an existing materia
- **THEN** the course stores that relationship without creating or changing a reseña de cursada

#### Scenario: Invalid academic relationship
- **WHEN** a course references a nonexistent materia
- **THEN** the API returns 404 and no course is created

### Requirement: Editorial course lifecycle
Only accounts with course-management permission SHALL create, edit, publish or archive courses and their structure. Courses SHALL start as DRAFT. Publication SHALL require at least one section with a lesson; every existing section SHALL contain a lesson, and every lesson SHALL have text or a READY file. Archived courses SHALL reject new enrollment and student content access.

#### Scenario: Empty course publication
- **WHEN** an administrator publishes a course without lessons
- **THEN** the API returns 400 and the course stays DRAFT

#### Scenario: Student edits a lesson
- **WHEN** an enrolled USER attempts to edit a lesson
- **THEN** the API returns 403

### Requirement: Ordered and scoped structure
Sections and lessons SHALL have nonnegative positions unique within their parent. Nested operations SHALL verify every parent-child relationship. Duplicate positions SHALL return 409 without partial changes. Structure changes to a published course SHALL preserve publication validity or be rejected.

#### Scenario: Lesson from a different course
- **WHEN** an administrator supplies a lesson belonging to a different course in a nested course route
- **THEN** the API returns 404 without changing either course

### Requirement: Public catalog excludes private content
Anyone SHALL be able to read a paginated catalog and summary of PUBLISHED courses. Public responses SHALL exclude lesson text, file metadata, Drive identifiers, storage paths and enrollment identities. DRAFT and ARCHIVED courses SHALL return 404 through public routes.

#### Scenario: Visitor opens a course
- **WHEN** an unauthenticated visitor reads a published course summary
- **THEN** they receive the title, description, optional materia and section/lesson titles, without lesson bodies or files

### Requirement: Enrollment grants content access
A nonsuspended USER, MODERATOR, ADMIN or SUPERADMIN SHALL be able to enroll themselves in a published course without payment. Enrollment SHALL be idempotent. Lesson content SHALL require active enrollment or course-management permission; private reads of unpublished or unrelated content SHALL return 404. Enrollment changes SHALL be limited to the account itself or administrators.

#### Scenario: Unenrolled student requests a lesson
- **WHEN** a USER without active enrollment requests a lesson of a published course
- **THEN** the API returns 404 without revealing lesson content or file metadata

#### Scenario: Duplicate enrollment
- **WHEN** an account enrolls in the same course twice
- **THEN** exactly one active enrollment exists and both requests return that enrollment

#### Scenario: Enrollment revoked
- **WHEN** enrollment becomes inactive and the student requests lesson content or a file
- **THEN** access is denied immediately

### Requirement: Private file delivery
A lesson file SHALL only be readable through a domain-authorized API route, identified by its database UUID. Download permission SHALL be separate from inline reading. The API SHALL NOT return public Drive URLs or accept arbitrary Drive file identifiers from students.

#### Scenario: File belongs to a different lesson
- **WHEN** an enrolled student supplies a file UUID from another course
- **THEN** the API returns 404 and does not contact Drive

#### Scenario: Downloads disabled
- **WHEN** a student requests attachment download of a file with downloads disabled
- **THEN** the API returns 403; authorized inline reading remains available

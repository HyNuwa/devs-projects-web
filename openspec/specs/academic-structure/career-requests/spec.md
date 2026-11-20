# academic-structure/career-requests Specification

## Purpose

Let students ask for the carrera they study, with the link to its official plan, so admins know which carreras to load first and the students hear back when it is ready.

## Requirements

### Requirement: Asking for a carrera
A signed-in student with a verified email and no active sanción SHALL be able to send a solicitud de carrera with:
- a universidad and facultad from the catálogo, or the facultad (and, if needed, universidad) name in free text when it is missing;
- the carrera's name;
- the link to its official plan, which MUST be an `https` address;
- an optional comment.

The form SHALL be reachable from «¿No está la tuya?» on the Universidades page, from «Pedí tu carrera» on a facultad without carreras (with that facultad chosen), and from «No encuentro mi carrera» in «Mi carrera». A visitor SHALL be sent to sign in and back to the form.

#### Scenario: Student asks from an empty facultad
- **WHEN** a verified student opens UNSa's FCE, chooses «Pedí tu carrera», and sends «Licenciatura en Física» with an `https` plan link
- **THEN** the solicitud is pending, with UNSa's FCE already chosen

#### Scenario: Facultad not in the catálogo
- **WHEN** a student's facultad is missing and they write its name in free text
- **THEN** the solicitud is accepted with that text and no catálogo facultad

#### Scenario: Plan link that is not https
- **WHEN** a student sends a solicitud with an `http` link
- **THEN** it is refused and nothing is saved

#### Scenario: Unverified or sanctioned account
- **WHEN** an account without a verified email, or a silenced one, tries to send a solicitud
- **THEN** it is refused with the reason

#### Scenario: Visitor
- **WHEN** a visitor without a session chooses «¿No está la tuya?»
- **THEN** they are asked to sign in and land on the form afterwards

### Requirement: «Yo también»
Before sending a solicitud for a facultad of the catálogo, the form SHALL show that facultad's pending solicitudes, and the student SHALL be able to join one with «Yo también» instead of sending a new one. A student SHALL NOT join a solicitud twice nor join their own. Solicitudes in free text SHALL NOT be offered for joining. Admins SHALL see how many students are in each solicitud.

#### Scenario: Joining a pending solicitud
- **WHEN** a student asking for Licenciatura en Física at UNSa's FCE sees that it is already pending and chooses «Yo también»
- **THEN** no new solicitud is created and the existing one counts two students

### Requirement: Limits and withdrawal
A student SHALL have at most 3 pending solicitudes they authored. A student SHALL be able to withdraw their solicitud or their «Yo también» while it is pending. When the author withdraws a solicitud that others joined, it SHALL pass to the first student who joined and stay pending; when nobody joined, it SHALL be closed as withdrawn.

#### Scenario: Fourth solicitud
- **WHEN** a student with 3 pending solicitudes sends another
- **THEN** it is refused, saying the limit

#### Scenario: Author withdraws a joined solicitud
- **WHEN** the author of a solicitud that two students joined withdraws it
- **THEN** it stays pending with the first student who joined as author, counting two students

### Requirement: Admins resolve solicitudes
The Catálogo tab SHALL have a «Solicitudes» view, for ADMIN and SUPERADMIN only, listing pending solicitudes with their students count, newest activity first, and its pending count on the tab. An admin SHALL resolve each pending solicitud as:
- **accepted**: a carrera en borrador is created in the solicitud's facultad, prefilled with its name and plan link. When the facultad was in free text, the admin either chooses an existing facultad of the catálogo or confirms a new one (and its universidad, if needed), created first. The solicitud SHALL show as in progress until that carrera is published, and then as published;
- **rejected**, with a written reason the students see;
- **already loaded**, pointing to an existing published carrera.

Each resolution SHALL be recorded in the catálogo history. Only staff SHALL see the solicitudes of other students.

#### Scenario: Accepting
- **WHEN** an admin accepts the solicitud for Licenciatura en Física at UNSa's FCE
- **THEN** a carrera en borrador with that name and plan link exists in that facultad, and the solicitud shows as in progress

#### Scenario: Accepting with a missing facultad
- **WHEN** an admin accepts a solicitud whose facultad was free text
- **THEN** the admin confirms the new facultad's name and short name, and the facultad and the carrera en borrador are created together

#### Scenario: Free-text facultad that now exists
- **WHEN** two solicitudes name the same facultad in free text and the first one's acceptance created it
- **THEN** the admin accepts the second into that existing facultad, and no facultad is duplicated

#### Scenario: Already loaded
- **WHEN** an admin marks a solicitud as already loaded, pointing to Ingeniería Informática
- **THEN** its students see that the carrera exists with a link to its page

### Requirement: Students follow their solicitudes
«Mi perfil» SHALL have a «Mis solicitudes» section listing the solicitudes a student authored or joined, with their status (pending, in progress, published, rejected with its reason, already loaded, withdrawn). When a solicitud is rejected or its carrera is published, every student in it SHALL get an email; the publication email SHALL link to the carrera's page and to «Mi carrera» to declare it. The carrera SHALL NOT be declared for them.

#### Scenario: Carrera published
- **WHEN** the carrera of a solicitud with two students is published
- **THEN** both get an email linking to the carrera page, «Mis solicitudes» shows it as published, and neither has the carrera declared

#### Scenario: Rejected
- **WHEN** an admin rejects a solicitud with the reason «No es una carrera de grado»
- **THEN** its students get an email with that reason and see it in «Mis solicitudes»

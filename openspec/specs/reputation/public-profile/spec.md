# reputation/public-profile Specification

## Purpose

Give every student a public page that shows their nivel, insignias, personalization and signed contributions to anyone, so that the recognition earned through points and insignias is visible, while anonymous entries, declared plans, sanciones and exact points stay private.

## Requirements

### Requirement: Public profile page
The system SHALL serve a perfil público at `/usuarios/<username>` that anyone can open without signing in. It SHALL show, in this order:
- a header with the banner, the avatar with its frame, the display name or username, the título, the nivel as «Nv. N · Nombre» and «Miembro desde» with month and year;
- the insignias destacadas;
- the aportes fijados;
- every public insignia with grado and edición;
- the student's contributions.

A username that does not exist SHALL show a not-found page. The page SHALL apply the account's background, accent color and theme.

#### Scenario: Visitor opens a profile
- **WHEN** a visitor without a session opens `/usuarios/vale` for an account at nivel 5 with a banner and two insignias destacadas
- **THEN** the page shows the banner, the avatar, the name, «Nv. 5 · Siete vidas», «Miembro desde» with month and year, and the two destacadas first

#### Scenario: Unknown username
- **WHEN** someone opens `/usuarios/nadie-existe`
- **THEN** the system shows a not-found page

### Requirement: What the public profile never shows
The perfil público page and its API SHALL NOT expose any of these:
- the account's email;
- its exact points;
- its sanción state;
- its declared study plans;
- role-only data;
- activity timestamps other than the month and year it joined;
- «Ojo atento»;
- the dates insignias were earned.

Anonymous reseñas and experiencias SHALL never appear on it, count on it, or link to it.

#### Scenario: Account with anonymous reseñas
- **WHEN** a student who published two signed reseñas and one anonymous reseña is viewed
- **THEN** the profile lists the two signed reseñas only, and its counts include only those two

#### Scenario: API response
- **WHEN** anyone requests the public profile API for an account
- **THEN** the response contains no email, points total, sanción, study plan, «Ojo atento» or insignia date

### Requirement: Mostrar mi nivel e insignias
A student SHALL be able to turn off «Mostrar mi nivel e insignias» in Mi perfil → «Perfil público»; it SHALL be on by default. While it is off, the perfil público page and API SHALL NOT show the account's nivel, any insignia (destacadas or the grid) or the título. The rest of the personalization (avatar, frame, banner, background, accent and theme), the aportes fijados and the contributions SHALL stay visible.

#### Scenario: Student hides their nivel
- **WHEN** a student at nivel 10 with the legendary frame turns the switch off
- **THEN** their perfil público shows no nivel, no insignias and no título, and still shows the legendary frame and their contributions

### Requirement: Sanciones do not change the profile
While an account is muted or suspended, its perfil público SHALL look exactly as it would without the sanción: the same personalization, nivel, insignias, título and aportes fijados, and no notice of the sanción.

#### Scenario: Muted student
- **WHEN** a student with a banner and a título is muted
- **THEN** their perfil público still shows the banner, the título and their nivel, with no mention of the silenciamiento

### Requirement: Contributions on the profile
The perfil público SHALL list the account's published recursos académicos, and its published reseñas de cursada and experiencias de final signed with their name. They SHALL be newest first, in pages of at most 20, and each SHALL link to where the content can be read. Retired, hidden, rejected, pending, deleted and anonymous contributions SHALL NOT be listed.

#### Scenario: Second page of contributions
- **WHEN** a visitor asks for the second page of a profile with 25 published contributions
- **THEN** the system returns the 5 oldest, newest first

#### Scenario: Retired material
- **WHEN** moderation retires one of a student's materials
- **THEN** it no longer appears among their contributions

### Requirement: Named authors link to their profile
In the redesigned discovery and community pages, the name of the author of a material, a reseña or an experiencia published with their name SHALL link to that author's perfil público. «Anónimo» SHALL never be a link. Mi perfil SHALL offer «Ver mi perfil público».

#### Scenario: Signed reseña
- **WHEN** a user reads a reseña signed by `vale`
- **THEN** the author name links to `/usuarios/vale`

#### Scenario: Anonymous experiencia
- **WHEN** a user reads an anonymous experiencia de final
- **THEN** «Anónimo» is plain text with no link to any profile

### Requirement: «Anónimo» is a reserved name
Because anonymous entries are shown as «Anónimo», no account SHALL register a username, or set a display name, that reads as «Anónimo». The check SHALL ignore case, accents and surrounding spaces, and SHALL also cover «Anónima», «Anónime», «Anónimx» and «Anonymous». The rejection SHALL be a validation error that says the name is reserved.

#### Scenario: Registering as Anónimo
- **WHEN** someone registers with the username «anonimo»
- **THEN** the registration is rejected because the name is reserved

#### Scenario: Display name
- **WHEN** a student sets their display name to «ANÓNIMA»
- **THEN** the change is rejected and their previous display name is kept

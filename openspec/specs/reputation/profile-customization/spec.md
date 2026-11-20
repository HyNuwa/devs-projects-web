# reputation/profile-customization Specification

## Purpose

Let a student shape how their perfil público looks with predefined cosmetic options that their nivel máximo alcanzado or their insignias unlock, without anything they upload needing moderation and without any of it reaching contribution cards.

## Requirements

### Requirement: Nivel máximo alcanzado decides the unlocks
Every personalization option unlocked by nivel SHALL be available once the account's nivel máximo alcanzado reaches that nivel, and SHALL stay available when the current nivel later goes down. Options unlocked by an insignia SHALL be available only while the account holds that insignia, in any grado. The options and what unlocks them are:

| Unlocked by | Options |
|---|---|
| Nivel 1 | 4 basic cat avatars |
| Nivel 2 | 4 more cat avatars · 1 aporte fijado |
| Nivel 3 | 6 accent colors · up to 3 aportes fijados |
| Nivel 4 | Backgrounds: cuadriculado, hoja de apuntes, pixel |
| Nivel 5 | Avatar frame · 3 illustrated banners |
| Nivel 6 | Título |
| Nivel 7 | 3 special-edition cat avatars |
| Nivel 8 | Exclusive profile theme |
| Nivel 9 | Animated cat avatar |
| Nivel 10 | Legendary frame |
| «Salvavidas», any grado | Salvavidas frame |

#### Scenario: Student reaches nivel 5
- **WHEN** a student's nivel máximo alcanzado becomes 5
- **THEN** they can choose the avatar frame and any of the 3 banners, as well as everything unlocked by niveles 1 to 4

#### Scenario: Points go down after choosing
- **WHEN** a student who reached nivel 5 and chose the frame drops to nivel 4 because a material was retired
- **THEN** the frame stays on their profile and they can still choose any option up to nivel 5

#### Scenario: Insignia frame is lost
- **WHEN** a student with the Salvavidas frame loses «Salvavidas» because its material was retired
- **THEN** their profile shows no frame, and the Salvavidas frame is no longer offered to them

### Requirement: Choices are validated by the server
The student SHALL edit their choices in Mi perfil → «Perfil público». The system SHALL reject, with a validation error and without changing anything, any of these:
- a choice that is not a predefined option;
- an option the account has not unlocked;
- more insignias destacadas or aportes fijados than allowed;
- a repeated entry.

Every option SHALL be predefined: the student never uploads a banner, background, frame or theme, and personalization never needs moderation.

#### Scenario: Locked option
- **WHEN** a student at nivel máximo alcanzado 3 tries to save the banner of nivel 5
- **THEN** the request is rejected and their previous choices are kept

#### Scenario: Editor shows what is locked
- **WHEN** a student opens «Perfil público» in Mi perfil
- **THEN** each option they have not unlocked is shown as locked with the nivel or insignia that unlocks it, and cannot be chosen

### Requirement: Chosen avatar
A student SHALL be able to use their own uploaded photo or any cat avatar they have unlocked. Without a choice, the system SHALL show the uploaded photo if there is one, and otherwise the basic cat assigned to the account. The chosen avatar SHALL show wherever the account's avatar is shown in the redesigned product, such as the account menu and «Tu progreso». The animated cat SHALL stay still when the viewer prefers reduced motion.

#### Scenario: Student picks a cat over their photo
- **WHEN** a student with an uploaded photo chooses a nivel-2 cat
- **THEN** the account menu, «Tu progreso» and their perfil público show that cat

#### Scenario: Back to the photo
- **WHEN** that student chooses «Mi foto» again
- **THEN** their uploaded photo is shown again everywhere

### Requirement: Título and insignias destacadas
From nivel máximo alcanzado 6, a student SHALL be able to pick one of their public insignias as their título, shown under their name on the perfil público. From any nivel, a student SHALL be able to choose up to 3 of their public insignias as insignias destacadas, shown first and in the chosen order. «Ojo atento» SHALL NOT be eligible for either. An insignia the account no longer holds SHALL stop showing as título or destacada on its own, and a destacada SHALL always show the insignia's current grado.

#### Scenario: Título from nivel 6
- **WHEN** a student at nivel máximo alcanzado 6 who holds «Salvavidas» picks it as título
- **THEN** «Salvavidas» appears under their name on the perfil público

#### Scenario: Destacada goes down a grado
- **WHEN** a destacada «Trotamaterias» goes from plata to bronce
- **THEN** the perfil público shows it in bronce, still among the destacadas

#### Scenario: Ojo atento cannot be shown
- **WHEN** a student tries to pick «Ojo atento» as título or destacada
- **THEN** the request is rejected

### Requirement: Aportes fijados
A student SHALL be able to pin, in order, up to 1 contribution from nivel máximo alcanzado 2 and up to 3 from nivel 3. Only the student's own published contributions SHALL be pinnable: a recurso académico, or a reseña de cursada or experiencia de final published with their name. Pinning an anonymous entry SHALL be rejected, because it would reveal its author. A pinned contribution that is retired, hidden or deleted SHALL stop showing on its own, and SHALL show again if it is restored.

#### Scenario: Pinning an anonymous reseña
- **WHEN** a student tries to pin a reseña they published as anonymous
- **THEN** the request is rejected and nothing reveals that the reseña is theirs to anyone else

#### Scenario: Pinning someone else's material
- **WHEN** a student tries to pin a material published by another account
- **THEN** the request is rejected

#### Scenario: Pinned material is retired
- **WHEN** moderation retires a material a student had pinned
- **THEN** their perfil público no longer shows it among the aportes fijados

### Requirement: Personalization stays on the profile
The frame, banner, background, accent color, theme and título SHALL appear only on the perfil público. Contribution cards, search results and moderation views SHALL show at most the author's name and avatar, never their nivel, insignias or other personalization.

#### Scenario: Legendary frame and a material card
- **WHEN** a student with the legendary frame publishes a material
- **THEN** the material's card and preview show their name without any frame, nivel or insignia

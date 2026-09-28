## Purpose

Frame every page with the redesigned DevsProject shell: the header and primary menu, the account menu, the mobile header and bottom bar, the footer, and the reduced variants used on access and focus screens.

## ADDED Requirements

### Requirement: Primary menu destinations
The shell SHALL offer exactly the primary destinations that exist in the product, in this order: Inicio (`/`), Materias (`/materias`) and Experiencias (`/resenas`). Destinations without a working page SHALL NOT appear in the menu.

#### Scenario: Visitor views the desktop header
- **WHEN** anyone views a page at the desktop breakpoint or wider
- **THEN** the header shows the DevsProject logo linking to `/`, the menu Inicio · Materias · Experiencias, a search control, the `Subir material` action and the UNJU/FI mark

#### Scenario: Unbuilt destinations are hidden
- **WHEN** the header or bottom bar renders
- **THEN** no Eventos or Clasificados link is shown

### Requirement: Current destination is identified
The shell SHALL mark at most one primary destination as current, using `aria-current="page"` and a visual cue that does not rely on color alone. When several destinations match a route, the most specific match SHALL win.

#### Scenario: Home
- **WHEN** the route is `/`
- **THEN** Inicio is the current destination

#### Scenario: Materias and resource hierarchy
- **WHEN** the route is `/materias`, `/materias/<codigo>`, `/materiales` or any nested `/materiales/...` route other than `/materiales/nuevo`
- **THEN** Materias is the current destination

#### Scenario: Experiences
- **WHEN** the route is under `/resenas`, under `/finales`, or is `/materias/<codigo>/resenar` or `/materias/<codigo>/final`
- **THEN** Experiencias is the current destination, not Materias

#### Scenario: Upload
- **WHEN** the route is `/materiales/nuevo`
- **THEN** the bottom bar's Subir item is current and no desktop menu link is current

#### Scenario: Route outside the menu
- **WHEN** the route is `/buscar`, under `/profile`, `/admin`, `/foro`, `/profesores` or `/ranking`
- **THEN** no primary destination is marked current

### Requirement: Search entry point
The shell SHALL expose a labelled search control on every shell variant that shows the full header, and activating it SHALL navigate to `/buscar`.

#### Scenario: User activates search
- **WHEN** a user activates the search control in the desktop or mobile header
- **THEN** the browser navigates to `/buscar`

### Requirement: Account affordance
The header SHALL show `Iniciar sesión` (desktop) or `Ingresar` (mobile) to signed-out visitors, and an avatar pill with the user's display name (or username) to signed-in users. The avatar pill SHALL open an account menu listing, in order: Mi perfil (`/profile/me`), Mis envíos (the submissions section of `/profile/me`), Moderación (`/admin`, only for moderators, admins and superadmins) and Cerrar sesión.

#### Scenario: Signed-out visitor
- **WHEN** no user is signed in
- **THEN** the header shows the sign-in link to `/auth/login` and no avatar pill

#### Scenario: Student opens the account menu
- **WHEN** a signed-in user with role USER opens the avatar pill
- **THEN** the menu lists Mi perfil, Mis envíos and Cerrar sesión, and does not list Moderación

#### Scenario: Moderator opens the account menu
- **WHEN** a signed-in user with role MODERATOR, ADMIN or SUPERADMIN opens the avatar pill
- **THEN** the menu also lists Moderación, linking to `/admin`

#### Scenario: User signs out from the menu
- **WHEN** a user activates Cerrar sesión
- **THEN** the session ends, the menu closes and the header shows the signed-out affordance

#### Scenario: User has no avatar image
- **WHEN** the signed-in user has no avatar image
- **THEN** the pill shows one of the default cat avatars, and the same user always gets the same one

### Requirement: Keyboard-operable account menu
The account menu SHALL open from the keyboard, move focus into its items, support arrow-key navigation on desktop, close on Escape, and return focus to the avatar pill when it closes. On narrow viewports it SHALL open as a bottom sheet with a labelled title and a close control.

#### Scenario: Desktop keyboard use
- **WHEN** a keyboard user focuses the avatar pill and presses Enter
- **THEN** the menu opens with focus on its first item, arrow keys move between items, and Escape closes it and returns focus to the pill

#### Scenario: Mobile bottom sheet
- **WHEN** a user opens the account menu below the desktop breakpoint
- **THEN** it appears as a bottom sheet with the same items, traps focus while open, and returns focus to the pill when closed

### Requirement: Mobile header and bottom bar
Below the desktop breakpoint (1024px) the shell SHALL replace the desktop header with a compact header (logo, search control, account affordance) and SHALL show a bottom bar fixed to the viewport with Inicio · Materias · Subir · Experiencias. Subir SHALL link to `/materiales/nuevo` and be visually emphasized. The bar SHALL respect the device's bottom safe area, and page content SHALL NOT be hidden behind it. The shell SHALL NOT offer a separate hamburger menu.

#### Scenario: Narrow viewport
- **WHEN** a user views a page at 390px wide
- **THEN** the compact header and the bottom bar are visible, the desktop menu links are not, and there is no hamburger control

#### Scenario: Scrolling to the end of a page
- **WHEN** a user scrolls to the bottom of a page on a narrow viewport
- **THEN** the last content and the footer are fully visible above the bottom bar

#### Scenario: Desktop viewport
- **WHEN** a user views a page at 1024px wide or more
- **THEN** the bottom bar is not rendered visibly and the desktop header is shown

### Requirement: Shell variants for access and focus screens
Access routes (`/auth/**`) SHALL use a reduced header with the logo and a single link to the complementary access action (`Crear cuenta` on sign-in screens, `Ingresar` on registration), with no primary menu, bottom bar or footer. Focus screens (`/materiales/nuevo`, `/materias/<codigo>/resenar`, `/materias/<codigo>/final`) SHALL keep the header but SHALL NOT show the bottom bar.

#### Scenario: Sign-in screen
- **WHEN** a visitor opens `/auth/login`
- **THEN** the page shows the reduced header with a `Crear cuenta` link and no primary menu, bottom bar or footer

#### Scenario: Registration screen
- **WHEN** a visitor opens `/auth/register`
- **THEN** the reduced header offers `Ingresar` instead of `Crear cuenta`

#### Scenario: Writing a reseña on mobile
- **WHEN** a user opens `/materias/<codigo>/resenar` at 390px wide
- **THEN** the compact header is shown and the bottom bar is not

### Requirement: Minimal footer
Pages with the full shell SHALL end with a footer showing the DevsProject brand, a one-line description of the community, links to the primary destinations and `Subir material`, and the copyright year. The footer SHALL NOT link to legacy routes (Foro, Profesores, Ranking, Materiales, Finales as separate destinations).

#### Scenario: Footer content
- **WHEN** a page with the full shell renders
- **THEN** the footer links only to Inicio, Materias, Experiencias and Subir material, and contains no Foro link

### Requirement: Skip link
Every shell variant SHALL provide a skip link as the first focusable element that moves focus to the main content.

#### Scenario: Keyboard user skips navigation
- **WHEN** a keyboard user presses Tab once on any page and activates the revealed link
- **THEN** focus moves to the main content region

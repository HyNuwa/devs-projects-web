## Purpose

Keep the interface faithful to the approved redesign by defining one canonical set of design tokens, the typography, and the styling of shared controls, and by guarding them with an automated check.

## ADDED Requirements

### Requirement: Canonical design tokens
The frontend SHALL declare its colors, radii, borders, shadows, page grid and fonts in a single canonical token source whose values match the approved canvas: navy ink `#021238`, primary blue `#0261FE`, link blue `#0A4DE8`, cream page `#FDF3E5` with a faint navy grid, white surfaces outlined in 1.5px navy, and rounded corners. Semantic roles used by components (background, foreground, card, primary, secondary, muted, accent, destructive, success, border, input, ring, radius, shadows) SHALL resolve to these tokens. The Pixel Notebook tokens and their legacy aliases SHALL NOT remain.

#### Scenario: Component consumes a semantic role
- **WHEN** a component styles itself with the primary, border or background role
- **THEN** it renders with the canvas blue, the navy outline or the cream grid page respectively

#### Scenario: Legacy token remains
- **WHEN** any stylesheet or component still declares or references a `--pn-*` token, a `--color-primary-<n>` alias, `--font-pixel` or the `font-pixel` class
- **THEN** the design-token check fails and names the file

#### Scenario: Canonical value drifts
- **WHEN** a canonical token's value differs from the approved value
- **THEN** the design-token check fails and names the token

### Requirement: Typography
All interface text SHALL use Figtree, with display headings in heavy weights and tight negative tracking. Caveat SHALL be used only for decorative handwritten accents and never for body text, labels or controls. Both fonts SHALL be self-hosted by the application with a system sans-serif fallback, so no text stays invisible while fonts load.

#### Scenario: Page renders headings and body
- **WHEN** any page renders
- **THEN** headings and body text use Figtree and no element uses Press Start 2P or a serif display face

#### Scenario: Font fails to load
- **WHEN** the web font cannot be loaded
- **THEN** text remains visible in the system sans-serif fallback

### Requirement: Light theme only
The interface SHALL render in the light theme regardless of the operating system's color-scheme preference.

#### Scenario: Device prefers dark mode
- **WHEN** a user's device requests a dark color scheme
- **THEN** the interface still renders the cream page, navy ink and white surfaces

### Requirement: Shared control styling
Buttons, chips, text fields, inputs, breadcrumbs and state panels provided by the shared component library SHALL follow the canvas: the primary button is solid blue with white text, secondary buttons are white with an outline, chips are rounded pastel labels, fields are white with a navy or warm outline, and every control shows a visible focus ring in the ring role. Interactive controls SHALL have a touch target of at least 44 by 44 CSS pixels.

#### Scenario: Primary action
- **WHEN** a view renders a primary button
- **THEN** it is solid blue with white text and meets WCAG AA contrast

#### Scenario: Keyboard focus on a control
- **WHEN** a keyboard user focuses any shared control
- **THEN** a visible focus ring appears that is distinguishable from the control's resting border

### Requirement: Documented visual system
The frontend's design documentation SHALL describe the current token set, typography, control styling, header and bottom bar, and SHALL NOT instruct contributors to apply the Pixel Notebook system.

#### Scenario: Contributor reads the design documentation
- **WHEN** a contributor or agent reads the frontend design documentation
- **THEN** it describes the redesigned system and names the canonical token source

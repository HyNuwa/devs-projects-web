## Purpose

Establish a coherent, accessible, and performant Pixel Notebook interface that supports academic discovery without allowing decorative RPG character to obscure task completion.

## ADDED Requirements

### Requirement: Shared light-theme application shell
The system SHALL provide a responsive light-theme shell with DevsProject identity, navigation to Materias, Reseñas, Materiales, and Finales, a persistent `Subir material` action, and an account affordance.

#### Scenario: Desktop navigation
- **WHEN** a user views the application at a desktop width
- **THEN** all primary destinations, the contribution action, and account affordance are visible and the current destination is identified without relying on color alone

#### Scenario: Mobile navigation
- **WHEN** a user views the application at a narrow width
- **THEN** the same destinations and actions are available through a keyboard-operable compact menu with managed focus

### Requirement: Pixel Notebook visual roles
The interface SHALL use the approved warm lined-paper canvas, dark editorial display hierarchy, compact monospaced labels, one-pixel borders, crisp offset shadows, and one dominant cobalt primary action per view.

#### Scenario: Section accent is applied
- **WHEN** a Materias, Reseñas, Materiales, or Finales entrance uses its approved accent palette and artwork
- **THEN** the accent identifies that content family without redefining generic success, warning, error, focus, disabled, or trust semantics

#### Scenario: Font is unavailable locally
- **WHEN** the preferred editorial font is not installed on the user's device
- **THEN** the interface uses a documented licensed or system fallback without losing readable hierarchy or causing hidden text

### Requirement: Responsive hierarchy and accessibility
The core discovery journey SHALL preserve information hierarchy across desktop and mobile, support keyboard operation, expose visible focus, maintain readable zoom behavior, and provide non-color status cues.

#### Scenario: Keyboard-only journey
- **WHEN** a user navigates the shell, search, filters, results, preview controls, and dialogs using only a keyboard
- **THEN** focus follows a logical order, remains visible, and returns to the invoking control when an overlay closes

#### Scenario: User zooms content
- **WHEN** a user zooms the interface to 200 percent at a supported desktop viewport
- **THEN** core content and actions remain available without two-dimensional page scrolling

#### Scenario: Status is presented
- **WHEN** the interface displays review, success, warning, error, pending, or disabled state
- **THEN** text or iconography communicates the state in addition to color

### Requirement: Linked academic breadcrumbs
Hierarchical material routes SHALL display a semantic breadcrumb trail representing the available `Materiales → Carrera → Año → Materia → Tipo de recurso` context without copying the visual styling of an external product.

#### Scenario: User views a nested materials level
- **WHEN** a user is inside a career, year, materia, or resource-category route
- **THEN** every preceding segment is a real keyboard-operable link, the current segment is identified with `aria-current="page"`, and the trail agrees with the route and visible page heading

#### Scenario: Breadcrumb is wider than a narrow viewport
- **WHEN** the complete trail does not fit on one line
- **THEN** the component preserves the current segment and immediate parent, offers an accessible way to reach omitted ancestors, and does not cause horizontal page overflow

### Requirement: Accessible resource-preview dialog
The resource preview SHALL use a source-owned React dialog built on Radix Dialog or an equivalent accessible behavior primitive and SHALL preserve the surrounding list as its navigation context.

#### Scenario: Preview dialog opens
- **WHEN** a user activates a resource row or its preview action
- **THEN** focus moves into the labelled dialog, background content is not interactable, the file identity and close action are announced, and the selected resource is represented in the URL

#### Scenario: Preview dialog closes
- **WHEN** a user presses Escape, activates the close control, or uses an explicitly supported outside-close action
- **THEN** the dialog closes, only its URL state is removed, and focus returns to the resource control that invoked it

#### Scenario: Preview dialog is used on mobile
- **WHEN** the preview opens on a narrow viewport
- **THEN** it becomes a full-screen or stacked dialog whose document, download action, and comments remain keyboard and touch accessible without two-dimensional page scrolling

### Requirement: Restrained and optional motion
Motion SHALL support orientation or feedback, SHALL stop immediately under reduced-motion preferences, and SHALL NOT use perpetual decorative animation.

#### Scenario: Standard motion preference
- **WHEN** a user has not requested reduced motion
- **THEN** the interface may use the approved one-time reveal, quick result/filter transitions, button compression, and concise state feedback without delaying task completion

#### Scenario: Reduced-motion preference
- **WHEN** a user requests reduced motion
- **THEN** non-essential animation is removed and state changes remain immediate and understandable

### Requirement: Governed third-party and generated assets
Every adopted third-party or generated visual asset SHALL have recorded provenance, usage rights, modification history, consuming routes, and required attribution before it is shipped.

#### Scenario: PixelRepo asset is adopted
- **WHEN** an individual PixelRepo free asset is selected for product use
- **THEN** its source URL, collection, download date, license version, modifications, and the required PixelRepo attribution are recorded and visible credit is available in the product or accompanying documentation

#### Scenario: Asset rights are uncertain
- **WHEN** redistribution or attribution requirements cannot be satisfied for an asset
- **THEN** the asset is not committed or shipped

#### Scenario: Kaomoji is used
- **WHEN** the interface displays a kaomoji
- **THEN** it comes from a reviewed local Unicode allowlist, has no runtime Glyphy dependency, and is not used as a control, trust signal, or sole accessible label

### Requirement: Responsive artwork delivery
Hero and decorative artwork SHALL be delivered with explicit dimensions and responsive modern formats, and the interface SHALL avoid loading artwork that is not currently visible.

#### Scenario: Active route hero loads
- **WHEN** a route renders a hero illustration above the fold
- **THEN** the browser receives an appropriately sized AVIF or WebP candidate with reserved dimensions and only that route's LCP candidate may load eagerly

#### Scenario: Inactive or below-fold artwork exists
- **WHEN** destination artwork is not visible in the current viewport
- **THEN** it is lazy-loaded and its source PNG is not transferred as the default candidate

### Requirement: Honest decorative content
Decorative artwork and kaomoji SHALL NOT displace search, obscure academic terminology, or create unlabeled product-scale claims.

#### Scenario: Decorative content is present in the first viewport
- **WHEN** a page includes hero art or a daily kaomoji near discovery controls
- **THEN** the primary task remains reachable and visually dominant, decorative content is hidden from assistive technology when it conveys no meaning, and any meaningful image has concise alternative text

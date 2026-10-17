## MODIFIED Requirements

### Requirement: Linked academic breadcrumbs
The browsing steps and the materia page SHALL display a semantic breadcrumb trail representing the available `Universidades → Universidad → Facultad → Carrera → Materia` context without copying the visual styling of an external product.

#### Scenario: User views a nested materials level
- **WHEN** a user is on a universidad, facultad, carrera or materia page
- **THEN** every preceding segment is a real keyboard-operable link, the current segment is identified with `aria-current="page"`, and the trail agrees with the route and visible page heading

#### Scenario: Breadcrumb is wider than a narrow viewport
- **WHEN** the complete trail does not fit on one line
- **THEN** the component preserves the current segment and immediate parent, offers an accessible way to reach omitted ancestors, and does not cause horizontal page overflow

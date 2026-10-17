## MODIFIED Requirements

### Requirement: Search and rankings start at the ubicación
When the viewer has an ubicación, search SHALL start limited to materials of that facultad, saying so, and SHALL offer «en todas» to search everywhere; the choice SHALL be part of the shareable search URL. `/ranking` SHALL start at the ubicación as described in reputation/rankings. The Experiencias landing (`/experiencias`) SHALL start at the ubicación's facultad, name it, and let the viewer narrow within it by carrera, año and type or change the ubicación from the page (see academic-community/experiences); the facultad SHALL NOT be part of its URL. Without an ubicación, search SHALL cover every facultad and the Experiencias landing SHALL show every facultad and invite the viewer to choose one.

#### Scenario: Searching from FI-UNJU
- **WHEN** a student with ubicación FI-UNJU searches «parcial»
- **THEN** results come from FI-UNJU materias, the page says «en FI · UNJU», and choosing «en todas» widens the results

#### Scenario: Shared search link
- **WHEN** a student shares a search made «en todas» and a visitor with another ubicación opens it
- **THEN** the visitor sees the same results «en todas»

#### Scenario: Experiencias landing from FI-UNJU
- **WHEN** a student with ubicación FI-UNJU opens `/experiencias`
- **THEN** the page names «Universidad Nacional de Jujuy · Facultad de Ingeniería», its sections consider that facultad, and «Cambiar» opens the ubicación selector

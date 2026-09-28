## MODIFIED Requirements

### Requirement: Minimal footer
Pages with the full shell SHALL end with a footer showing the DevsProject brand, a one-line description of the community, links to the primary destinations, `Subir material` and `Normas`, and the copyright year. The footer SHALL NOT link to legacy routes (Foro, Profesores, Ranking, Materiales, Finales as separate destinations).

#### Scenario: Footer content
- **WHEN** a page with the full shell renders
- **THEN** the footer links only to Inicio, Materias, Experiencias, Subir material and Normas (`/normas`), and contains no Foro link

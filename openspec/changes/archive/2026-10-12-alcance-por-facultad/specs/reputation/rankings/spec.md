## MODIFIED Requirements

### Requirement: What the monthly ranking shows
The monthly ranking SHALL show the top 10 with their display name, «Nv. N» and the month's points, each name linking to its perfil público. Accounts with the same points SHALL share the place (1, 1, 3). A signed-in student who is in the ranking but outside the top 10 SHALL also see their own place and points. By default it SHALL show the carrera the viewer declared first as cursando, and it SHALL offer a selector for any carrera. Without one, it SHALL show the first carrera by name of the viewer's ubicación (see academic-structure/browsing), and without an ubicación, or when that facultad has no carreras, the first carrera by name.

#### Scenario: Tie
- **WHEN** two students have 30 points this month and a third has 20
- **THEN** the first two are both 1.º and the third is 3.º

#### Scenario: Own place
- **WHEN** a student who is 14.º in their carrera opens the ranking
- **THEN** they see the top 10 and, below, their own place 14 with their points

#### Scenario: Visitor with an ubicación
- **WHEN** a visitor whose ubicación is FI-UNJU opens the ranking
- **THEN** it shows the first FI-UNJU carrera by name

### Requirement: Leyendas de la facultad
The system SHALL list, for each facultad, every account whose nivel máximo alcanzado is 10 and that declared a carrera of that facultad as cursando or terminada. An account with carreras in two facultades SHALL appear in both, and an account without such a carrera SHALL appear in none. The list SHALL be ordered by display name, with each name linking to its perfil público. By default it SHALL show the facultad of the viewer's ubicación, and it SHALL offer a universidad and facultad selector.

#### Scenario: Legend with a finished plan
- **WHEN** a student who reached nivel 10 marked Ingeniería Informática terminada
- **THEN** they still appear in the Leyendas of the Facultad de Ingeniería

#### Scenario: Points go down
- **WHEN** a legend's points drop below nivel 10
- **THEN** they stay in Leyendas, because the nivel máximo alcanzado decides

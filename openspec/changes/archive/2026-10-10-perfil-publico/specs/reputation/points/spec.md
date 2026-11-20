## MODIFIED Requirements

### Requirement: Levels
An account's nivel SHALL be computed from `max(0, points)` with this table:

| Nivel | Nombre | Puntos |
|---|---|---|
| 1 | Primeros pasos | 0 |
| 2 | Bigotes curiosos | 30 |
| 3 | De pasillo en pasillo | 100 |
| 4 | Mochila cargada | 250 |
| 5 | Siete vidas | 500 |
| 6 | Apuntes de oro | 900 |
| 7 | Biblioteca viva | 1.500 |
| 8 | Faro de la carrera | 2.300 |
| 9 | Memoria de la facultad | 3.300 |
| 10 | Leyenda de la facultad | 4.500 |

The nivel SHALL go down if points go down. Every account SHALL also keep its nivel máximo alcanzado: the highest nivel it has reached. It SHALL go up when the nivel goes above it and SHALL NOT go down when points go down or a sanción applies. On adoption, it SHALL start at the account's current nivel. Profiles show the current nivel; the nivel máximo alcanzado only decides unlocks.

#### Scenario: Reaching a level
- **WHEN** an account goes from 95 to 100 points
- **THEN** its nivel becomes 3, «De pasillo en pasillo», and its nivel máximo alcanzado becomes 3 if it was lower

#### Scenario: Losing points keeps the maximum
- **WHEN** an account at nivel 5 loses points to nivel 4 because a material is retired
- **THEN** its nivel is 4 and its nivel máximo alcanzado stays 5

### Requirement: Other accounts see the nivel, not the points
Another account's public profile SHALL show its nivel, computed from its points, and SHALL NOT show its exact points total. A small jump, such as the 2 points of a confirmed reporte, would tell an author whose content was retired who reported it. When the account has turned off «Mostrar mi nivel e insignias», the public profile SHALL NOT show its nivel either.

#### Scenario: Viewing another student's profile
- **WHEN** a student opens another account's public profile
- **THEN** it shows that account's nivel and not its points

#### Scenario: Nivel hidden by its owner
- **WHEN** a student opens the public profile of an account that turned off «Mostrar mi nivel e insignias»
- **THEN** it shows neither that account's nivel nor its points

### Requirement: Points are rebuilt with the new rules
When this system is deployed, every account's movimientos, points and nivel SHALL be rebuilt from its current published content and «Me sirvió» with these rules. The rebuild drops the points earned by anonymous entries. The rebuild SHALL be deployed together with the new levels table, so everyone's nivel changes at once. The rebuild SHALL set the nivel máximo alcanzado to the rebuilt nivel, since the history before the ledger is not reliable.

#### Scenario: Account that wrote anonymous reseñas
- **WHEN** the rebuild runs for an account with two anonymous reseñas and one signed material
- **THEN** its points come only from the material and its valid «Me sirvió»

#### Scenario: Rebuild sets the maximum
- **WHEN** the rebuild leaves an account at nivel 3
- **THEN** its nivel máximo alcanzado is 3

## MODIFIED Requirements

### Requirement: Points follow publication
A contribution's points SHALL be awarded when it becomes `Publicado` (on submission or on approval of a revisión previa), reverted when it becomes `Retirado`, and awarded again when it is restored or its retiro is overturned on appeal. Ocultamiento preventivo and revisión previa SHALL NOT award or deduct points. A contribution SHALL never hold more than one active award. Anonymous reseñas and experiencias earn no points, so moderation decisions about them SHALL NOT award or deduct points to their author. Amounts, caps, the «Me sirvió» and reporte points that follow these states, and the sanction freeze belong to `reputation/points`.

#### Scenario: Material published on upload
- **WHEN** a material is published immediately
- **THEN** its author receives 10 points once

#### Scenario: Reseña waiting for revisión previa
- **WHEN** a signed reseña enters `En revisión previa`
- **THEN** no points are awarded until a moderator approves it, and then 5 points are awarded once

#### Scenario: Retire and restore
- **WHEN** a published material is retired and later restored
- **THEN** its author's net points from publishing it are 10, not 20 and not 0

#### Scenario: Retiro of an anonymous reseña
- **WHEN** a moderator retires an anonymous reseña, and later it is restored
- **THEN** its author's points, level and account row are the same before the retiro, after it and after the restoration

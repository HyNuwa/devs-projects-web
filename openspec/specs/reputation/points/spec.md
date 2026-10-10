# reputation/points Specification

## Purpose

Recognize students who help others with a reputation that is earned only by published contributions and by the «Me sirvió» other students give them. It is recorded movement by movement so it can always be audited and reversed, and it never reveals who wrote anonymous content.

## Requirements

### Requirement: Points are a ledger of movimientos
Every change to an account's points SHALL be recorded as a movimiento de puntos. A movimiento has an amount, a reason from a fixed set, the contribution or event it refers to, and its date. The reasons are: material publicado, material pionero, «Me sirvió» recibido, reseña con nombre, experiencia con nombre, reporte confirmado, and two legacy reasons that are never awarded: guía creada, and ajuste heredado for any older movimiento without a known reason.

Movimientos SHALL never be edited or deleted. A reversal SHALL be a new movimiento with the negative amount that names the movimiento it reverses, and a movimiento SHALL be reversed at most once.

An account's total SHALL always equal the sum of its movimientos, also when that sum is negative. It SHALL be shown as 0 at least.

#### Scenario: Retry of the same award
- **WHEN** the same award for the same contribution is requested twice, for example by a retried request
- **THEN** only one movimiento is recorded and the account gains the points once

#### Scenario: Award after a reversal
- **WHEN** a reseña's points are reverted by a retiro and the reseña is later restored
- **THEN** a new award is recorded, and the reseña's net points are 5

#### Scenario: Negative total
- **WHEN** an account's movimientos sum to -3
- **THEN** its stored total is -3, it is shown as 0, and its level is the first one

### Requirement: Contributions earn points when published
A contribution SHALL earn its points when it becomes `Publicado`, either on submission or when a moderator approves its revisión previa:
- A material earns 10.
- A reseña de cursada published under the author's name earns 5. Only one per account, materia and ciclo lectivo earns points, and reseñas without a ciclo lectivo count as one more ciclo.
- An experiencia de final published under the author's name earns 5. Only one per account, materia, período de examen and year earns points, and «no recuerdo» counts as one more período.

Further entries that pass the cap SHALL still be published, without points. An edit that moves a published entry to another ciclo, período or year SHALL give back its points and earn them again only if that period has no other entry with points. A contribution in revisión previa or hidden by ocultamiento preventivo SHALL earn nothing until it is `Publicado`.

#### Scenario: Two reseñas of the same cursada period
- **WHEN** a student publishes two signed reseñas of the same materia and ciclo lectivo
- **THEN** both are published and only the first earns 5 points

#### Scenario: Editing a reseña into a period that already has points
- **WHEN** a student edits a signed reseña that earned points into a ciclo lectivo where another of their reseñas already earned them
- **THEN** the edited reseña's points are reverted, and the student keeps 5 points for that ciclo

#### Scenario: Material approved after revisión previa
- **WHEN** a moderator approves a material in revisión previa
- **THEN** its author earns 10 points once

### Requirement: Anonymous entries earn nothing
A reseña or experiencia published as anonymous SHALL earn no points, for itself or for anything that happens to it later, and SHALL lose none. Its author's points SHALL be the same before and after it is published, retired, restored, appealed or deleted.

#### Scenario: Anonymous reseña published
- **WHEN** a student publishes an anonymous reseña
- **THEN** their points, level and movimientos do not change

### Requirement: Valid «Me sirvió» earn points within caps
A «Me sirvió» SHALL be valid only when all of these hold:
- it is given by an account with a verified email and no active sanción;
- the giver is not the material's author;
- the material is `Publicado`.

Each valid «Me sirvió» SHALL earn the material's author 1 point, within these caps:
- at most 25 points per material;
- at most 20 points per day per author;
- at most 5 points per calendar month from the same giver to the same author.

A «Me sirvió» over a cap SHALL earn nothing, and that point SHALL NOT be kept for later. Caps SHALL hold under concurrent «Me sirvió». Removing a «Me sirvió» SHALL revert the point it earned, if it earned one.

#### Scenario: Friends marking each other
- **WHEN** one student marks six materials of the same author as «Me sirvió» in one month
- **THEN** the author earns 5 points from that student that month

#### Scenario: Removing a «Me sirvió» that earned a point
- **WHEN** a student removes a «Me sirvió» that earned its author 1 point
- **THEN** that point is reverted

#### Scenario: Unverified account
- **WHEN** an account without a verified email marks a material as «Me sirvió»
- **THEN** the mark is recorded and the author earns no points

### Requirement: Pioneer bonus
The first material published of a type in a materia SHALL earn its author 5 more points when it reaches 3 valid «Me sirvió». The type `OTRO` is excluded. The bonus SHALL be awarded once per materia and type.

If that material is retired or deleted, the bonus SHALL be reverted and SHALL NOT pass to another material. If its materia or type is edited after publication, the bonus SHALL be reverted and evaluated again with the new values.

#### Scenario: First final of a subject
- **WHEN** the first published final of Bases de Datos gets its third valid «Me sirvió»
- **THEN** its author earns 5 bonus points once

#### Scenario: Second material of the same type
- **WHEN** a second final of Bases de Datos gets 3 valid «Me sirvió»
- **THEN** no bonus is awarded

### Requirement: Confirmed reportes earn points
When moderation retires reported content, each account that reported it before the retiro SHALL earn 2 points, at most 10 such points per account per week. This SHALL apply to materials, reseñas and experiencias, anonymous ones included, because the award says nothing about the author. If the retiro is later restored or overturned on appeal, those points SHALL be reverted, since the reporte was not confirmed after all.

#### Scenario: Reporte leads to a retiro
- **WHEN** a moderator retires a reseña that a student reported
- **THEN** the student earns 2 points

#### Scenario: Retiro overturned
- **WHEN** that retiro is overturned on appeal
- **THEN** the student's 2 points are reverted

### Requirement: Retired and deleted contributions lose their points
When a contribution is retired by moderation or deleted by its author, its points SHALL be reverted. For a material, that also reverts its pioneer bonus and every point its «Me sirvió» earned. When a retired contribution is restored, or its retiro is overturned on appeal, its points SHALL be awarded again. Its «Me sirvió» SHALL count again within the caps. A rejection in revisión previa SHALL NOT deduct points.

#### Scenario: Retire and restore a material
- **WHEN** a material with 12 points from «Me sirvió» is retired and later restored
- **THEN** after the retiro its author has lost its 10 points and the 12, and after the restoration the 10 come back and its «Me sirvió» count again within the caps

### Requirement: Sanctions freeze earning
While an account is silenced or suspended, it SHALL earn no points from any source, and the points it would have earned SHALL NOT be kept for later. Points given back by an accepted appeal SHALL still be awarded during a sanción.

#### Scenario: «Me sirvió» during a silenciamiento
- **WHEN** a material of a silenced account gets a valid «Me sirvió»
- **THEN** its author earns no point, and none is added when the silenciamiento ends

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

### Requirement: Tu progreso
A signed-in student SHALL see, in Mi espacio → «Tu progreso»:
- their nivel number and name;
- their points;
- how many points they need for the next nivel and what it unlocks;
- their latest movimientos, each with its reason in plain language, its amount and its date.

A movimiento SHALL name the student's own contribution it refers to. It SHALL NOT name who gave a «Me sirvió» or which content a reporte was about. «Tu progreso» SHALL be visible only to the account itself, and SHALL link to a public «Cómo funcionan los puntos» page that explains the point table, valid «Me sirvió», reversals and levels.

#### Scenario: Student opens Tu progreso
- **WHEN** a student with 320 points opens «Tu progreso»
- **THEN** it shows «Nv. 4 · Mochila cargada», 320 points, 180 missing for «Nv. 5 · Siete vidas», what nivel 5 unlocks, and their latest movimientos

#### Scenario: Movement from a «Me sirvió»
- **WHEN** a student earned a point because someone marked their material
- **THEN** «Tu progreso» shows «Me sirvió recibido» with the material's title, and not who marked it

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

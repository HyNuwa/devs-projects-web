## Purpose

Recognize who helps others with bounded rankings that renew (this month in a carrera, the most useful materials of a materia this cuatrimestre) and a fixed list of legends per facultad, instead of one global race by total points that the same few always win.

## ADDED Requirements

### Requirement: This month in a carrera
The system SHALL rank accounts in a carrera by the net points of the current calendar month in Argentina time (UTC−3): awards minus reversals made in that month. Each movimiento SHALL count for every carrera with a plan that includes the materia of the contribution that generated it. Movimientos without a materia SHALL count for no carrera. Points for a confirmed reporte or an accepted correction SHALL count for no carrera: they arrive right when the author sees the retiro or the change, so a jump in the ranking would tell the author who reported or suggested it. Only accounts with positive net points SHALL appear.

#### Scenario: Points from two materias
- **WHEN** this month a student earns 10 points for a material of a materia of Informática and 5 for a reseña of a materia that both Informática and Industrial share
- **THEN** they have 15 points in Informática and 5 in Industrial

#### Scenario: A reversal this month
- **WHEN** a material that earned 10 points last month is retired this month
- **THEN** this month's net points in its carrera go down by 10

#### Scenario: A confirmed reporte
- **WHEN** a student earns 2 points because a material they reported was retired
- **THEN** their place in this month's ranking does not change

#### Scenario: New month
- **WHEN** a new month starts in Argentina time
- **THEN** every carrera's ranking starts empty

### Requirement: What the monthly ranking shows
The monthly ranking SHALL show the top 10 with their display name, «Nv. N» and the month's points, each name linking to its perfil público. Accounts with the same points SHALL share the place (1, 1, 3). A signed-in student who is in the ranking but outside the top 10 SHALL also see their own place and points. By default it SHALL show the carrera of the viewer's active plan, and it SHALL offer a selector for any carrera. Without a session or an active plan, it SHALL show the first carrera by name.

#### Scenario: Tie
- **WHEN** two students have 30 points this month and a third has 20
- **THEN** the first two are both 1.º and the third is 3.º

#### Scenario: Own place
- **WHEN** a student who is 14.º in their carrera opens the ranking
- **THEN** they see the top 10 and, below, their own place 14 with their points

### Requirement: Leyendas de la facultad
The system SHALL list, for each facultad, every account whose nivel máximo alcanzado is 10 and that has an active or finished plan in a carrera of that facultad. An account with plans in two facultades SHALL appear in both, and an account without such a plan SHALL appear in none. The list SHALL be ordered by display name, with each name linking to its perfil público. By default it SHALL show the viewer's facultad, from an active or finished plan, and it SHALL offer a universidad and facultad selector.

#### Scenario: Legend with a finished plan
- **WHEN** a student who reached nivel 10 marked their Informática plan terminado
- **THEN** they still appear in the Leyendas of the Facultad de Ingeniería

#### Scenario: Points go down
- **WHEN** a legend's points drop below nivel 10
- **THEN** they stay in Leyendas, because the nivel máximo alcanzado decides

### Requirement: Who never appears in rankings of people
Neither ranking of people SHALL show an account that turned off «Mostrar mi nivel e insignias», nor give it a place. The monthly ranking SHALL also leave out accounts that had a silenciamiento or suspensión in force when the month began. A sanción applied, lifted or voided during the month SHALL NOT change that month's ranking, because someone disappearing mid-month would reveal it. Leyendas SHALL leave out only accounts with a permanent suspensión, because removing someone from a fixed list during a temporary sanción would reveal it.

#### Scenario: Hidden nivel
- **WHEN** the student with the most points this month has turned off «Mostrar mi nivel e insignias»
- **THEN** they appear in neither ranking, and the next student is 1.º

#### Scenario: Silenced during the month
- **WHEN** a student who is 3.º this month is silenced for 7 days on the 12th
- **THEN** they stay in this month's ranking and in Leyendas

#### Scenario: Sanctioned when the month begins
- **WHEN** a student's suspensión started last month and still holds on the 1st
- **THEN** they do not appear in this month's ranking, and they still appear in Leyendas

### Requirement: Most useful materials of a materia this cuatrimestre
The materia page SHALL show the 10 materials of that materia with the most valid «Me sirvió» received during the current cuatrimestre: March–July is the first, August–December the second, and January and February belong to the second of the previous year. The materials count whenever they were published. A «Me sirvió» is valid when it comes from a verified account without an active sanción, not the material's author, on a published material. Materials with the same count SHALL share the place. The section SHALL show no viewer place, exclude no author, and be hidden when no material received a valid «Me sirvió» this cuatrimestre.

#### Scenario: An old summary still helps
- **WHEN** a summary published two years ago receives 12 valid «Me sirvió» this cuatrimestre
- **THEN** it appears in the materia's most useful materials with 12

#### Scenario: No activity this cuatrimestre
- **WHEN** no material of a materia received a valid «Me sirvió» this cuatrimestre
- **THEN** the materia page shows no «Más útiles» section

### Requirement: The rankings page
`/ranking` SHALL offer two tabs, «Este mes en tu carrera» and «Leyendas de la facultad», open to anyone. The global, weekly and all-time rankings by total points SHALL no longer exist, in the page or in the API.

#### Scenario: Visitor opens the rankings
- **WHEN** a visitor without a session opens `/ranking`
- **THEN** they see this month's ranking of the first carrera, with a tab for Leyendas, and no global or weekly ranking

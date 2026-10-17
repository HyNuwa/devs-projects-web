## MODIFIED Requirements

### Requirement: Insignia catalog
The system SHALL offer these insignias. Each has a criterion, a rarity, and, where marked, grados that replace one another:

| Insignia | Criterion (bronce / plata / oro) | Rarity |
|---|---|---|
| Primer aporte | A published material | Común |
| Primer «Me sirvió» | A valid «Me sirvió» received | Común |
| Salvavidas | One material with 50 / 150 / 400 valid «Me sirvió» | Rara |
| Trotamaterias | Published materials in 5 / 10 / 20 materias | Común |
| Primera huella | 1 / 3 / 8 pioneer bonuses held | Rara |
| Primera luz | The first material ever published in a materia, still published | Rara |
| Kit completo | Published materials of 4 types, other than «Otro», in one materia | Rara |
| Archivo histórico | Published materials of the same type and materia in 3 ciclos lectivos | Rara |
| Puente | One material with valid «Me sirvió» from students of 3 different carreras, by their active study plans | Rara |
| Constante | Published contributions in 2 / 4 / 8 consecutive cuatrimestres | Común |
| Voz de la cursada | 5 / 15 / 40 signed reseñas | Común |
| Contexto completo | 10 signed reseñas that state ciclo lectivo, profesor, franja horaria, situación de cursada and dificultad | Rara |
| Cronista de mesas | Signed experiencias de final of the December, July and February/March (or March) mesas | Rara |
| Mesa de diciembre | A signed experiencia de final of a December mesa, one edición per year | De temporada |
| Temporada de finales | 3 published contributions during one exam period, one edición per period | De temporada |
| Ojo atento | 10 confirmed reportes | Rara |
| Lupa | 10 accepted correction suggestions, even if their materials were retired later | Rara |
| Primera camada | An account with a verified email created during the platform's first cuatrimestre, with a contribution published in it | Edición única |

Insignias SHALL award no points. «Puente» SHALL count carreras of different students: one student enrolled in three carreras counts once.

#### Scenario: A material reaches 50 «Me sirvió»
- **WHEN** one of a student's materials reaches 50 valid «Me sirvió»
- **THEN** the student has «Salvavidas» in bronce, and in plata when that material reaches 150

#### Scenario: Volume alone
- **WHEN** a student publishes 30 materials in one materia that nobody marks
- **THEN** they earn «Primer aporte» but neither «Trotamaterias» nor «Salvavidas»

#### Scenario: Ten accepted corrections
- **WHEN** a student's tenth correction suggestion is accepted
- **THEN** they hold «Lupa», and keep it if one of those materials is retired later

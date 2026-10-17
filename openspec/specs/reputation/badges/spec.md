# reputation/badges Specification

## Purpose

Recognize concrete, verifiable achievements that points alone don't show, such as a material that helped many students, without rewarding volume alone and without revealing who wrote anonymous content or who reported.

## Requirements

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

### Requirement: Insignias follow current contributions
An account's insignias SHALL be computed from what currently counts:
- published contributions;
- signed reseñas and experiencias only;
- valid «Me sirvió» only;
- confirmed reportes whose retiro was not undone.

Anonymous entries SHALL NOT count for any insignia. Contributions hidden while moderation reviews them SHALL keep counting, as their points do. When the contributions behind an insignia are retired or deleted, the insignia SHALL be removed, or lowered to the grado its criterion still meets, without notice or penalty: a lowered grado keeps its date and is not shown as new. If they are restored, it SHALL come back.

#### Scenario: The only material behind Salvavidas is retired
- **WHEN** the material that gave a student «Salvavidas» is retired
- **THEN** the student no longer has «Salvavidas», and has it again if the material is restored

#### Scenario: Anonymous reseñas
- **WHEN** a student has 6 anonymous reseñas and no signed ones
- **THEN** they have no «Voz de la cursada»

### Requirement: Calendar for dated insignias
Cuatrimestres and exam periods SHALL follow these defaults, kept in code; the platform's first cuatrimestre SHALL come from configuration:
- The first cuatrimestre runs March to July and the second August to December, with January and February counted in the preceding second cuatrimestre.
- The exam periods are February–March, July and December.

Seasonal insignias SHALL be earned once per edición: «Mesa de diciembre» per year, «Temporada de finales» per exam period. They SHALL count only contributions shared during that period: a December mesa told months later earns no past edición. «Primera camada» SHALL be awarded only when its window is configured, and SHALL never be awarded to an account created after it.

#### Scenario: Two Decembers
- **WHEN** a student shares signed experiencias of the December mesas of 2025 and 2026
- **THEN** they hold «Mesa de diciembre» editions 2025 and 2026

#### Scenario: Primera camada not configured
- **WHEN** no first-cuatrimestre window is configured
- **THEN** nobody holds «Primera camada»

### Requirement: Insignias in Tu progreso
«Tu progreso» SHALL show the account's insignias:
- every offered insignia, earned or pending;
- for earned ones, the grado, edición, rarity and the date it was earned;
- for pending ones, the criterion;
- the three pending insignias or grados closest to being reached, with their progress in plain words.

An insignia earned, or raised to a higher grado, since the student last saw it SHALL be shown with its gem's «entrada» animation once, when the section is on screen, and then that insignia SHALL be marked as seen. With reduced motion, the animation SHALL NOT play.

#### Scenario: Closest insignias
- **WHEN** a student's best material has 38 valid «Me sirvió»
- **THEN** «Tu progreso» lists «Salvavidas» among the closest, with «Te faltan 12 "Me sirvió"»

#### Scenario: A newly earned insignia
- **WHEN** a student opens «Tu progreso» after earning «Primer aporte»
- **THEN** its gem plays the entrada animation once, and does not play it again on the next visit

### Requirement: Public insignias
Another account's public profile SHALL list its earned insignias with grado and edición, its insignias destacadas first in the order the account chose, and SHALL NOT show when they were earned. «Ojo atento» SHALL appear only to its own account, because it is about reporting and reporting stays anonymous. When the account has turned off «Mostrar mi nivel e insignias», its public profile SHALL list no insignias.

#### Scenario: Viewing another student's insignias
- **WHEN** a student requests another account's public profile, and that account holds «Salvavidas» in plata and «Ojo atento»
- **THEN** the response lists «Salvavidas» in plata without a date, and does not list «Ojo atento»

#### Scenario: Insignias hidden by their owner
- **WHEN** a student requests the public profile of an account that holds «Salvavidas» and turned off «Mostrar mi nivel e insignias»
- **THEN** the response lists no insignias, destacadas or título

### Requirement: Insignias are awarded retroactively
When this system is deployed, every account SHALL get the insignias its current contributions already meet, together with the points rebuild, already marked as seen so no animation plays for them.

#### Scenario: An established author
- **WHEN** the rebuild runs for an account with 5 signed reseñas
- **THEN** it holds «Voz de la cursada» in bronce, and its gem does not play the entrada animation

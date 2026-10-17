## MODIFIED Requirements

### Requirement: Mostrar mi nivel e insignias
A student SHALL be able to turn off «Mostrar mi nivel e insignias» in Mi perfil → «Perfil público»; it SHALL be on by default. While it is off, the perfil público page and API SHALL NOT show the account's nivel, any insignia (destacadas or the grid) or the título. The rest of the personalization (avatar, frame, banner, background, accent and theme), the aportes fijados and the contributions SHALL stay visible. The account SHALL also be left out of every ranking of people (see reputation/rankings).

#### Scenario: Student hides their nivel
- **WHEN** a student at nivel 10 with the legendary frame turns the switch off
- **THEN** their perfil público shows no nivel, no insignias and no título, and still shows the legendary frame and their contributions

#### Scenario: Hidden nivel and the rankings
- **WHEN** a student with the most points this month turns the switch off
- **THEN** they no longer appear in this month's ranking of their carrera, nor in Leyendas

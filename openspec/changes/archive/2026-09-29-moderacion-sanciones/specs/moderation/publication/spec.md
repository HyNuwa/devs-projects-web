## MODIFIED Requirements

### Requirement: Authors see the status of their contributions
In Mis envíos, the signed-in author SHALL see every material, reseña and experiencia they contributed, including anonymous ones, with its publication status, the latest decision reason when there is one, and its date. Authors SHALL NOT see who decided, who reported, or who answered an appeal. Depending on the status:
- `Oculto mientras se revisa` SHALL be explained as temporary.
- `Retirado` SHALL show the retiro reason. It SHALL offer «Apelar» within 14 days of the retiro when it has not been appealed, and SHALL show the status and answer of its appeal when there is one.
- `Rechazado en revisión previa` SHALL offer editing and resubmitting.

Mis envíos SHALL also have a Sanciones section listing the account's sanciones with their type, reason, dates, «Apelar» while appealable, and the appeal's status and answer.

#### Scenario: Author checks a retired reseña
- **WHEN** the author opens Mis envíos after their reseña was retired
- **THEN** the entry shows `Retirado`, the reason written by moderation, the date and «Apelar», without the moderator's identity

#### Scenario: Author checks hidden content
- **WHEN** the author's material is `Oculto mientras se revisa`
- **THEN** Mis envíos shows it as hidden while moderation reviews it, with no points deducted yet

#### Scenario: Author sees an appeal's answer
- **WHEN** the appeal of a retired material was rejected
- **THEN** the entry shows `Retirado`, the appeal's answer and its reason, and no «Apelar»

#### Scenario: Author checks their sanciones
- **WHEN** a silenced author opens Mis envíos
- **THEN** the Sanciones section shows the silenciamiento, its reason, its end date and «Apelar»

#### Scenario: Another user looks for someone's submissions
- **WHEN** a signed-in user requests another account's submissions
- **THEN** the request is refused

### Requirement: Contributors are told the publication rules
Subir material and the reseña and experiencia forms SHALL say that contributions are published immediately and that publication does not mean the content is correct, and SHALL link to the community rules. A public `/normas` page SHALL present the community rules in force for:
- materials, reseñas and experiencias
- convivencia
- what happens when something breaks them: retiro, sanciones (advertencia, silenciamiento and suspensión, with the suggested escalera) and appeals (once, within 14 days, reviewed by someone else, final answer)

It SHALL NOT describe features or processes that do not exist yet (Clasificados, Eventos).

#### Scenario: Visitor reads the rules
- **WHEN** anyone opens `/normas`
- **THEN** the page explains:
  - immediate publication and reporting
  - ocultamiento preventivo (3 qualified reports in 48 hours, or 1 qualified report of personal data)
  - retiro with a visible reason
  - the sanciones and how to appeal

  It contains no section on Clasificados or Eventos.

#### Scenario: Student opens Subir material
- **WHEN** a signed-in student opens Subir material
- **THEN** the form states that the material is published immediately unless it needs revisión previa, and links to `/normas`

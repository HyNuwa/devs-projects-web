## MODIFIED Requirements

### Requirement: Immutable moderation history
Every moderation action SHALL be recorded in one append-only history. That includes:
- revisión previa approvals and rejections
- ocultamiento preventivo
- caso decisions and restorations
- revelación de autor
- sanciones and their lifting
- suspension proposals and their confirmation or rejection
- appeals and their answers

Each record SHALL hold who acted (a person or the system), the action, the target, the date and the reason. No user, including SUPERADMIN, SHALL be able to edit or delete a record through the product. Moderators SHALL be able to filter the history by action, actor, content and date. For MODERATOR, events about an account that came from a caso about anonymous content SHALL NOT show the reason, the caso or the content, and filtering by that content SHALL NOT return them. These are sanción events (advertencia, silenciamiento, suspensión, lifting, suspension proposal and its rejection) and appeals of those sanciones with their answers. The account's file and the Apelaciones tab show the account with the same reason, text and time, and matching them would link the account to the anonymous entry. For MODERATOR, appeals of a retiro of anonymous content and their answers SHALL NOT show the reason either, as the read-only appeal does not show what the appellant wrote. ADMIN and SUPERADMIN SHALL see everything.

#### Scenario: Automatic hiding appears in history
- **WHEN** the system hides content after three reportes
- **THEN** the history shows a record attributed to «Sistema» with the reason «3 reportes en 48 h»

#### Scenario: Sanction appears in history
- **WHEN** a moderator silences an account
- **THEN** the history shows who silenced which account, the reason and the end date

#### Scenario: Advertencia from an anonymous caso
- **WHEN** a MODERATOR opens the history after an advertencia was given from a caso about an anonymous reseña
- **THEN** the record shows the action and who acted, without the account, the reason, the caso or the content, and an ADMIN sees all of them

#### Scenario: Appeal of a sanción from an anonymous caso
- **WHEN** the author appeals that advertencia and a MODERATOR opens the history
- **THEN** the appeal record shows neither what the author wrote nor the caso, and filtering the history by the anonymous reseña does not return it

#### Scenario: Attempt to alter a record
- **WHEN** any client requests to update or delete a history record
- **THEN** no such operation exists and the record is unchanged

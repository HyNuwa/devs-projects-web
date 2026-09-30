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

Each record SHALL hold who acted (a person or the system), the action, the target, the date and the reason. No user, including SUPERADMIN, SHALL be able to edit or delete a record through the product. Moderators SHALL be able to filter the history by action, actor, content and date. For MODERATOR, the history SHALL NOT show the reason of sanción events (advertencia, silenciamiento, suspensión, suspension proposal) that came from a caso about anonymous content. The same reason appears in the account's file, and matching them would link the account to the entry. ADMIN and SUPERADMIN SHALL see every reason.

#### Scenario: Automatic hiding appears in history
- **WHEN** the system hides content after three reportes
- **THEN** the history shows a record attributed to «Sistema» with the reason «3 reportes en 48 h»

#### Scenario: Sanction appears in history
- **WHEN** a moderator silences an account
- **THEN** the history shows who silenced which account, the reason and the end date

#### Scenario: Advertencia from an anonymous caso
- **WHEN** a MODERATOR opens the history after an advertencia was given from a caso about an anonymous reseña
- **THEN** the record shows the action and the caso without the account or the reason, and an ADMIN sees both

#### Scenario: Attempt to alter a record
- **WHEN** any client requests to update or delete a history record
- **THEN** no such operation exists and the record is unchanged

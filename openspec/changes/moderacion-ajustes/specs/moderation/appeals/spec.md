## MODIFIED Requirements

### Requirement: Apelaciones tab
The moderation panel SHALL offer an Apelaciones tab. It SHALL list pending appeals, oldest first, with how long ago each was filed:
- Appeals the viewer may resolve, with the answer controls.
- For MODERATOR, appeals they cannot resolve only because of the appellant's role, as read-only items marked «La resuelve un admin», without answer controls. Their absence would otherwise reveal that the appellant is staff.

The viewer's own decisions SHALL NOT be listed, and for MODERATOR appeals of suspensiones SHALL NOT be listed either. Each appeal SHALL show:
- the appealed decision, its reason, date and decider
- what the appellant wrote
- the content (with «Autor oculto» for anonymous content)
- the answer controls with the required reason and a note that the answer is final, when the viewer may resolve it

#### Scenario: Moderator opens Apelaciones
- **WHEN** a moderator opens Apelaciones
- **THEN** it lists appeals of decisions made by other people, excluding suspensiones, and each resolvable one shows the decision, the appellant's explanation and the answer controls

#### Scenario: Appeal by another moderator
- **WHEN** a MODERATOR appeals a retiro of their anonymous reseña and another moderator opens Apelaciones
- **THEN** the appeal is listed as «La resuelve un admin» with «Autor oculto», and it cannot be answered from that account

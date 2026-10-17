## MODIFIED Requirements

### Requirement: Someone else reviews the appeal
An appeal SHALL be reviewed by someone other than the one who made the appealed decision, never by the appellant, and only by someone whose role is above the appellant's (a moderator's appeal goes to an admin, as with sanciones). Appeals of a suspensión SHALL be reviewed by an ADMIN or SUPERADMIN.

Appeals about anonymous content SHALL be reviewed by an ADMIN or SUPERADMIN, whatever the appellant's role. These are appeals of a retiro of anonymous content, and appeals of a sanción that came from a caso about anonymous content. If moderators answered them, which ones they could answer, or the appellant shown next to the decision, would reveal who wrote the content.

When no moderator other than the decider is eligible, the appeal SHALL wait for an ADMIN. The reviewer of an appeal of a retiro of anonymous content SHALL see «Autor oculto» and SHALL need «Ver autor», with a recorded reason, to see who it is.

#### Scenario: Moderator opens an appeal of their own retiro
- **WHEN** the moderator who retired a material opens the appeal against that retiro
- **THEN** they cannot answer it, and it is not listed among the appeals they can resolve

#### Scenario: Moderator appeals a sanción
- **WHEN** a MODERATOR account appeals a silenciamiento
- **THEN** only an ADMIN or SUPERADMIN can answer it

#### Scenario: Appeal of an anonymous reseña's retiro
- **WHEN** a student appeals the retiro of their anonymous reseña
- **THEN** only an ADMIN or SUPERADMIN can answer it, and they see the appellant as «Autor oculto»

#### Scenario: Appeal of an advertencia from an anonymous caso
- **WHEN** a student appeals the advertencia they received together with the retiro of their anonymous reseña
- **THEN** only an ADMIN or SUPERADMIN can answer it

### Requirement: Apelaciones tab
The moderation panel SHALL offer an Apelaciones tab. It SHALL list pending appeals, oldest first, with how long ago each was filed:
- Appeals the viewer may resolve, with the answer controls.
- For MODERATOR, appeals about anonymous content, as read-only items marked «La resuelve un admin», without answer controls and with the appellant as «Autor oculto». These are appeals of retiros of anonymous content and of sanciones from casos about anonymous content. Every such appeal SHALL look the same whatever the appellant's role, so neither the mark nor its absence says anything about who wrote the content.
- For MODERATOR, appeals of signed content they cannot resolve only because of the appellant's role, as the same read-only items.

The viewer's own decisions SHALL NOT be listed, and for MODERATOR appeals of suspensiones SHALL NOT be listed either. Each resolvable appeal SHALL show:
- the appealed decision, its reason, date and decider
- what the appellant wrote
- the content (with «Autor oculto» for anonymous content)
- the answer controls with the required reason and a note that the answer is final

A read-only appeal SHALL show only the appealed decision, its reason, date and decider, and the appellant as the list shows them, with «La resuelve un admin» and no reason why.

#### Scenario: Moderator opens Apelaciones
- **WHEN** a moderator opens Apelaciones
- **THEN** it lists appeals of decisions made by other people, excluding suspensiones, and each resolvable one shows the decision, the appellant's explanation and the answer controls

#### Scenario: Appeals about anonymous content
- **WHEN** a student and a MODERATOR each appeal the retiro of their anonymous reseña, and another moderator opens Apelaciones
- **THEN** both are listed identically as «La resuelve un admin» with «Autor oculto», neither can be answered from that account, and an ADMIN can answer both

#### Scenario: Appeal of a sanción from an anonymous caso
- **WHEN** a student appeals an advertencia from a caso about their anonymous reseña, and a moderator opens Apelaciones
- **THEN** it is listed read-only as «La resuelve un admin» with «Autor oculto» instead of the username, and answering it from that account is refused

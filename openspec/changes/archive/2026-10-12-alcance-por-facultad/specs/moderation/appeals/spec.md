## MODIFIED Requirements

### Requirement: Someone else reviews the appeal
An appeal SHALL be reviewed by someone other than the one who made the appealed decision, never by the appellant, and only by someone whose role is above the appellant's (a moderator's appeal goes to an admin, as with sanciones). Appeals of a suspensión SHALL be reviewed by an ADMIN or SUPERADMIN.

Appeals about anonymous content SHALL be reviewed by an ADMIN or SUPERADMIN, whatever the appellant's role. These are appeals of a retiro of anonymous content, and appeals of a sanción that came from a caso about anonymous content. If moderators answered them, which ones they could answer, or the appellant shown next to the decision, would reveal who wrote the content.

A MODERATOR SHALL be eligible to review an appeal only if they cover its facultad: the facultad of the caso's content, or, for a sanción applied from Usuarios, any facultad through which they can see the account (see moderation/scope). When no moderator other than the decider is eligible, the appeal SHALL wait for an ADMIN. The reviewer of an appeal of a retiro of anonymous content SHALL see «Autor oculto» and SHALL need «Ver autor», with a recorded reason, to see who it is.

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

#### Scenario: Only one moderator covers the facultad
- **WHEN** the single moderator covering a facultad retired a material and its author appeals
- **THEN** no moderator can answer it and it waits for an ADMIN

#### Scenario: Moderator of another facultad
- **WHEN** a moderator covering only another facultad looks for that appeal
- **THEN** it is not listed for them

# moderation/appeals Specification

## Purpose

Give every author and sanctioned account one chance to have a retiro or a sanción reviewed by someone who did not decide it. The answer is final and explained, and an accepted appeal fully undoes the decision.

## Requirements

### Requirement: What can be appealed
An account SHALL be able to appeal a retiro of its content, or a sanción on it (advertencia, silenciamiento or suspensión), once per decision, within 14 days of the decision, with an explanation of at most 1000 characters. The following SHALL NOT be appealable:
- a rejection in revisión previa, which is corrected and resubmitted instead
- a «Mantener visible» decision
- another account's decisions

#### Scenario: Author appeals a retiro
- **WHEN** the author of a material retired 3 days ago appeals it from Mis envíos with an explanation
- **THEN** the appeal is recorded and the material shows «Apelación en revisión»

#### Scenario: Second appeal
- **WHEN** the author tries to appeal the same retiro again
- **THEN** the request is refused

#### Scenario: Appeal after 14 days
- **WHEN** the author tries to appeal a retiro decided 15 days ago
- **THEN** the request is refused and «Apelar» is no longer offered

#### Scenario: Appeal a revisión previa rejection
- **WHEN** the author tries to appeal a rejection in revisión previa
- **THEN** the request is refused and the author is pointed to editing and resubmitting

### Requirement: A suspended account appeals from sign-in
When sign-in is refused because of a suspensión, the account SHALL be able to appeal that suspensión from the same screen. It does so by entering its credentials again, once, within 14 days of the suspensión. The appeal SHALL NOT sign the account in.

#### Scenario: Suspended student appeals
- **WHEN** a suspended account enters correct credentials and an explanation in «Apelar esta suspensión»
- **THEN** the appeal is recorded and the account is still not signed in

#### Scenario: Wrong credentials
- **WHEN** someone submits «Apelar esta suspensión» with a wrong password
- **THEN** the appeal is refused without saying whether the account exists or is suspended

### Requirement: Someone else reviews the appeal
An appeal SHALL be reviewed by a moderator other than the one who made the appealed decision, never by the appellant, and only by someone whose role is above the appellant's (a moderator's appeal goes to an admin, as with sanciones). Appeals of a suspensión SHALL be reviewed by an ADMIN or SUPERADMIN. When no moderator other than the decider is eligible, the appeal SHALL wait for an ADMIN. The reviewer of an appeal about anonymous content SHALL see «Autor oculto» and SHALL need «Ver autor», with a recorded reason, to see who it is.

#### Scenario: Moderator opens an appeal of their own retiro
- **WHEN** the moderator who retired a material opens the appeal against that retiro
- **THEN** they cannot answer it, and it is not listed among the appeals they can resolve

#### Scenario: Moderator appeals a sanción
- **WHEN** a MODERATOR account appeals a silenciamiento
- **THEN** only an ADMIN or SUPERADMIN can answer it

#### Scenario: Appeal of an anonymous reseña's retiro
- **WHEN** a moderator reviews the appeal of a retired anonymous reseña
- **THEN** the appellant is shown as «Autor oculto»

### Requirement: The answer is final and undoes accepted decisions
The reviewer SHALL accept or reject an appeal with a written reason of at most 1000 characters, and the answer SHALL be final. The effects of accepting SHALL depend on what was appealed:
- **A retiro:** the content becomes `Publicado` again, its points are awarded again (even if the account has an active sanción), the retiro stops counting for the escalera, and any advertencia given together with that retiro is voided.
- **A sanción:** the sanción is lifted immediately and stops counting for the escalera.

Rejecting SHALL keep the decision unchanged. The appellant SHALL see the answer and its reason in Mis envíos, without the reviewer's identity. Every appeal and its answer SHALL be recorded in the moderation history.

#### Scenario: Accepted appeal of a retiro
- **WHEN** a reviewer accepts the appeal of a retired material with a reason
- **THEN** the material is `Publicado`, its author has its 10 points again, the retiro no longer counts for the escalera, and Mis envíos shows the answer

#### Scenario: Accepted appeal of a silenciamiento
- **WHEN** a reviewer accepts the appeal of an active silenciamiento
- **THEN** the account can publish again immediately

#### Scenario: Rejected appeal
- **WHEN** a reviewer rejects an appeal with a reason
- **THEN** the retiro or sanción stays as it was, the appellant sees the reason, and the decision can no longer be appealed

#### Scenario: Answer without a reason
- **WHEN** a reviewer submits an answer with an empty reason
- **THEN** the answer is refused

### Requirement: Apelaciones tab
The moderation panel SHALL offer an Apelaciones tab. It SHALL list pending appeals that the viewer is allowed to resolve, oldest first, with how long ago each was filed. The viewer's own decisions SHALL NOT be listed; for MODERATOR, appeals of suspensiones SHALL NOT be listed either. Each appeal SHALL show:
- the appealed decision, its reason, date and decider
- what the appellant wrote
- the content (with «Autor oculto» for anonymous content)
- the answer controls with the required reason and a note that the answer is final

#### Scenario: Moderator opens Apelaciones
- **WHEN** a moderator opens Apelaciones
- **THEN** it lists only appeals of decisions made by other people, excluding suspensiones, and each shows the decision, the appellant's explanation and the answer controls

## MODIFIED Requirements

### Requirement: Public identity is selected per entry
Every course review and final experience SHALL retain its authenticated author internally and SHALL allow that author to publish the individual entry either under their username or as `Anónimo`. The choice SHALL be made when publishing and SHALL NOT change by editing. Changing it later would move the author's points at that moment and point at them; to change it, the author deletes the entry and publishes it again. When anonymous publication is selected, the form SHALL say «Las publicaciones anónimas no suman puntos».

#### Scenario: Author publishes under username
- **WHEN** an author does not enable anonymous publication
- **THEN** the public entry displays the account username without requiring a display name

#### Scenario: Author publishes anonymously
- **WHEN** an author enables anonymous publication for an entry
- **THEN** public responses display `Anónimo` without avatar, profile link, or stable anonymous alias while the author and authorized moderators retain access to the real ownership record

#### Scenario: Author edits an anonymous entry
- **WHEN** the author edits an anonymous reseña and the request asks to publish it under their username
- **THEN** the content changes are saved and the reseña stays anonymous

#### Scenario: Anonymous choice in the form
- **WHEN** an author selects anonymous publication in the reseña or experiencia form
- **THEN** the form shows «Las publicaciones anónimas no suman puntos», and the edit form shows the choice without letting it change

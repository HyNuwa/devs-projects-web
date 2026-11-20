## ADDED Requirements

### Requirement: Accepted corrections earn points
When a correction suggestion is accepted, by its material's author or by moderation, the student who made it SHALL earn 2 points (`CORRECTION_ACCEPTED`), at most 10 such points per account per week. The points SHALL be kept if the material is retired later, because the correction was right. Like every other award, the points SHALL NOT be earned while the account has an active sanción.

#### Scenario: Correction accepted
- **WHEN** an author accepts a student's suggestion
- **THEN** that student earns 2 points, shown in «Tu progreso» as «Corrección aceptada»

#### Scenario: Weekly cap
- **WHEN** a student has six suggestions accepted in one week
- **THEN** they earn 10 points that week, not 12

## MODIFIED Requirements

### Requirement: Public insignias
Another account's public profile SHALL list its earned insignias with grado and edición, its insignias destacadas first in the order the account chose, and SHALL NOT show when they were earned. «Ojo atento» SHALL appear only to its own account, because it is about reporting and reporting stays anonymous. When the account has turned off «Mostrar mi nivel e insignias», its public profile SHALL list no insignias.

#### Scenario: Viewing another student's insignias
- **WHEN** a student requests another account's public profile, and that account holds «Salvavidas» in plata and «Ojo atento»
- **THEN** the response lists «Salvavidas» in plata without a date, and does not list «Ojo atento»

#### Scenario: Insignias hidden by their owner
- **WHEN** a student requests the public profile of an account that holds «Salvavidas» and turned off «Mostrar mi nivel e insignias»
- **THEN** the response lists no insignias, destacadas or título

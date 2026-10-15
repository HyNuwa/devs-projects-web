## MODIFIED Requirements

### Requirement: Institutional hierarchy
The system SHALL organize academic structure as universidad → facultad → carrera → materia. Every facultad MUST belong to exactly one universidad, every carrera to exactly one facultad, and every materia to exactly one facultad. A carrera's code MUST be unique within its facultad, and two universidades MAY each have a facultad with the same name. A materia's code, when it has one, MUST be unique across the whole system. Each carrera SHALL have exactly one internal arrangement of materias: each materia is either placed in an año and cuatrimestre, where the cuatrimestre is 1.º, 2.º or anual, or is an optativa with no año or cuatrimestre; the product SHALL NOT keep or show versions of it.

#### Scenario: Same facultad name in two universidades
- **WHEN** two universidades each have a «Facultad de Ingeniería»
- **THEN** the system treats them as two distinct facultades, each with its own carreras and materias

#### Scenario: Same carrera code in two facultades
- **WHEN** two facultades each have a carrera with the code `II`
- **THEN** both carreras exist and each is identified within its own facultad

#### Scenario: Repeated materia code
- **WHEN** an attempt is made to save a materia with a code another materia already has, in any facultad
- **THEN** the system rejects it and the existing materia keeps its code

#### Scenario: Second arrangement for a carrera
- **WHEN** an attempt is made to add a second arrangement of materias to a carrera that has one
- **THEN** the system rejects it

#### Scenario: Materia anual
- **WHEN** a carrera places «Anatomía» in 1.º año as anual
- **THEN** the carrera keeps it as anual, not as 1.º or 2.º cuatrimestre

#### Scenario: Optativa
- **WHEN** a carrera lists «Robótica» as an optativa
- **THEN** the carrera keeps it with no año or cuatrimestre

#### Scenario: Optativa in one carrera, placed in another
- **WHEN** «Robótica» is an optativa of Ingeniería Informática and placed in 4.º año of Ingeniería Electrónica in the same facultad
- **THEN** both carreras keep their own arrangement and the materia keeps one set of content

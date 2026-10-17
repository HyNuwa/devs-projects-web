# 0002 · Jerarquía universidad → facultad antes de la expansión

- **Estado:** aceptada
- **Fecha:** 9 de octubre de 2026

## Contexto

DevsProject empieza en FI-UNJU, pero desde el primer día se va a invitar a otras facultades y universidades a sumarse. Hoy el modelo no tiene facultad ni universidad: la cadena es carrera → plan → materia, con una sola carrera cargada. Los rankings de puntos («Leyendas de la facultad») son lo primero que necesita agrupar por facultad.

## Decisión

Se agrega la jerarquía **Universidad → Facultad → Carrera → Plan → Materia** en un cambio propio (`instituciones`), antes de la personalización del perfil y los rankings, aunque al principio haya una sola universidad (UNJU) y una sola facultad (Ingeniería). Reglas:

- **Cada materia pertenece a los planes de una sola facultad.** Si dos facultades dictan «Análisis Matemático I», son materias distintas, cada una con sus materiales, reseñas y profesores.
- **Un estudiante no pertenece a una facultad de forma directa.** Su facultad se deduce de sus planes de estudio, y puede tener planes en más de una.
- **Los profesores siguen colgando de las materias**, sin facultad propia por ahora.
- Las facultades se cargan con migración o seed; no hay alta desde la interfaz.

## Opciones descartadas

- **Esperar a la segunda facultad** para crear el modelo. Es más barato hoy, pero cada cambio que agrupe por carrera o por materia mientras tanto habría que revisarlo al expandirse, y «Leyendas de la facultad» nacería como una lista global que después cambia de significado.
- **Solo facultad, sin universidad.** No distingue dos «Facultad de Ingeniería» de universidades distintas.

## Consecuencias

- Leyendas de la facultad es una lista por facultad desde el primer día. Alguien aparece en las facultades de sus planes de estudio, activos o terminados.
- El ranking mensual sigue agrupando por carrera, que ya admite varias.
- Una universidad y una facultad con una sola fila cada una parecen diseño especulativo. Esta ADR explica por qué existen.

## Actualización (12 de octubre de 2026)

- El cambio `alcance-por-facultad` precarga las universidades principales del país con sus facultades, aunque todavía no tengan carreras, para que quien llegue desde otra universidad encuentre la suya. Las carreras y materias se suman a demanda.
- El alta desde la interfaz llega con el cambio `catalogo-editable`: un admin carga o aprueba pedidos de estudiantes, que traen el link al plan oficial de la carrera. Desde ese cambio, lo nuevo deja de cargarse por migración.
- La tabla de planes queda como detalle interno, un plan por carrera ([ADR 0003](0003-un-plan-por-carrera.md)).

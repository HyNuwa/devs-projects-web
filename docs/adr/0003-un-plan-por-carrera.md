# 0003 · Un plan por carrera, sin versiones visibles

- **Estado:** aceptada
- **Fecha:** 12 de octubre de 2026

## Contexto

El modelo tiene Carrera → Plan de estudios → Materia (ADR 0002), y «Mi carrera» pide elegir un plan. Seguir qué planes tiene cada carrera de cada universidad, y cuál está vigente, es difícil de mantener al día. Además, los materiales de una materia casi no cambian entre planes.

## Decisión

La interfaz no habla de planes: un estudiante declara su **carrera**, y la página de la carrera muestra sus materias por año y cuatrimestre. En la base, la tabla de planes se queda como detalle interno, con **un solo plan por carrera** garantizado por una restricción única.

## Opciones descartadas

- **Planes con versión vigente y anteriores**, como en el canvas: obliga a cargar y mantener cada versión y a marcar la vigente, para un beneficio que casi no se nota en los materiales.
- **Borrar la tabla de planes** y colgar las materias directo de la carrera: sería el modelo más limpio, pero es una migración grande sobre lo que ya depende de los planes (Leyendas, atribución del ranking, «Mi carrera» y los triggers que atan cada materia a una sola facultad).

## Consecuencias

- Si una carrera cambia su plan, se actualizan sus materias en el mismo plan y no queda historial de versiones.
- Si algún día hacen falta versiones, la tabla ya existe: alcanza con quitar la restricción única y volver a mostrar el selector.

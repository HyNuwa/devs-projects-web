# Protocolo de validación: descubrimiento y confianza Pixel Notebook

## Objetivo y alcance

Validar si participantes representativos de FI-UNJU pueden completar los recorridos inicio → resultados y Materiales → carrera → año → materia → categoría → archivo sin ayuda, y si comprenden las señales comunitarias disponibles. Esta sesión evalúa arquitectura de información y comportamiento; no evalúa contenido académico real ni fidelidad del backend.

Estado: el walkthrough inicial del product owner terminó en `REVISAR` el 2026-08-26. La validación independiente con 3–5 estudiantes está diferida por decisión del owner y no se considera realizada.

- Recorrido: `/validacion/pixel-notebook`
- Estado de los datos: sintéticos y explícitamente rotulados.
- Duración estimada: 12–18 minutos por participante.
- Dispositivo: el que la persona usaría normalmente; registrar viewport aproximado.

## Preparación del facilitador

1. Abrir el recorrido en su pantalla inicial y restablecer cualquier acción local.
2. Decir: “Queremos probar el diseño, no evaluarte a vos. Pensá en voz alta. No voy a indicarte dónde hacer clic.”
3. No explicar el orden de resultados, los breadcrumbs ni la diferencia entre estrellas, `Me sirvió` y `Guardar` antes de las tareas.
4. Si la persona queda bloqueada por 30 segundos, registrar el bloqueo antes de ofrecer una pista neutral. Toda pista convierte la tarea en “con ayuda”.
5. No usar las preguntas de cierre para corregir respuestas durante el recorrido.

## Cinco tareas

### Tarea 1 — Encontrar

“Necesitás preparar Estructura de Datos. Encontrá materiales que puedan servirte para el primer parcial.”

Éxito sin ayuda: inicia una búsqueda o usa una sugerencia y llega a resultados relevantes. Registrar si distingue sugerencias de materias y recursos.

### Tarea 2 — Comparar

“Elegí cuál de los tres resultados abrirías primero. Contame qué información usaste y qué dudas te quedan.”

Éxito sin ayuda: compara al menos tipo, materia, contexto académico y una señal comunitaria; no interpreta las estrellas como garantía de corrección.

### Tarea 3 — Recorrer la organización

“Entrá por Materiales, elegí Ingeniería Informática, 1.er año y Estructura de Datos. Buscá los parciales y explicame dónde estás usando la ruta de arriba.”

Éxito sin ayuda: recorre carrera, año, materia y categoría; interpreta el breadcrumb y usa la búsqueda propia de la materia sin recibir pistas.

### Tarea 4 — Inspeccionar y obtener

“Revisá el contenido antes de bajarlo y después descargalo.”

Éxito sin ayuda: abre el modal desde la lista, identifica que conserva el contexto, encuentra comentarios y `Descargar`, cierra sin perder la lista y puede continuar ante el fallo simulado de vista previa.

### Tarea 5 — Retener y reaccionar

“Guardá este material para volver más tarde y marcá si te sirvió. Explicá si esas acciones cambian sus estrellas.”

Éxito sin ayuda: reconoce los cambios de estado `Guardar`/`Guardado` y `Me sirvió`, y entiende que utilidad, guardado y estrellas son conceptos separados.

## Registro por participante

Copiar esta tabla por persona. No guardar nombre completo, correo ni legajo.

| Campo | Registro |
| --- | --- |
| Código anónimo | P__ |
| Fecha y hora | AAAA-MM-DD HH:mm ART |
| Carrera / tramo aproximado |  |
| Dispositivo / viewport |  |
| Tarea 1 | Sin ayuda / Con ayuda / No completada · tiempo · observación |
| Tarea 2 | Sin ayuda / Con ayuda / No completada · tiempo · criterio usado |
| Tarea 3 | Sin ayuda / Con ayuda / No completada · interpretación literal |
| Tarea 4 | Sin ayuda / Con ayuda / No completada · preview / fallo / descarga |
| Tarea 5 | Sin ayuda / Con ayuda / No completada · interpretación de estados |
| Hesitaciones | Elemento, duración aproximada, comentario |
| Interpretaciones erróneas | Frase literal o paráfrasis fiel |
| Pistas dadas | Momento y texto de la pista |

## Preguntas de cierre

- ¿Qué dato te dio más confianza para elegir?
- ¿Qué información faltó para decidir?
- ¿Qué esperabas que ocurriera al abrir la vista previa y al descargar?
- ¿Qué diferencia ves entre estrellas, “Me sirvió” y “Guardar”?
- Si pudieras cambiar una sola cosa del recorrido, ¿cuál sería?

## Criterio de la compuerta

Se considera problema severo cualquier patrón repetido por dos o más participantes que:

- impida encontrar resultados o reconocer la materia como contexto;
- impida completar la jerarquía o usar el breadcrumb para orientarse;
- haga confundir estrellas o “Me sirvió” con garantía de corrección;
- impida localizar vista previa, descarga o el fallback tras un fallo;
- haga que contexto desconocido parezca información negativa o inventada.

La decisión será **PROCEDER** solo si no hay problemas severos repetidos sin resolver y al menos 4 de cada 5 tareas se completan sin ayuda por la mayoría de participantes. En otro caso será **REVISAR**, se actualizarán diseño/especificaciones y se repetirá la parte afectada.

## Evidencia y decisión fechada

Crear `docs/validation/evidence/pixel-notebook-AAAA-MM-DD.md` con:

- fecha, cantidad y perfil agregado de participantes;
- resultados por tarea, tiempos aproximados y pistas;
- hesitaciones e interpretaciones erróneas, incluyendo patrones;
- cambios propuestos y su impacto en OpenSpec;
- decisión explícita `PROCEDER` o `REVISAR`, responsable y fecha.

No iniciar el grupo 2 hasta que la revisión del prototipo tenga evidencia de navegador y el product owner registre la decisión OpenSpec 1.9 como `PROCEDER` o `REVISAR`.

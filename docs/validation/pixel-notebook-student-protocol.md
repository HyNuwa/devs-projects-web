# Protocolo de validación: descubrimiento y confianza Pixel Notebook

## Objetivo y alcance

Validar si 3–5 estudiantes representativos de FI-UNJU pueden completar el recorrido inicio → resultados → detalle sin ayuda y comprenden qué evidencias ofrece cada material. Esta sesión evalúa arquitectura de información y comportamiento; no evalúa contenido académico real ni fidelidad del backend.

- Recorrido: `/validacion/pixel-notebook`
- Estado de los datos: sintéticos y explícitamente rotulados.
- Duración estimada: 12–18 minutos por participante.
Dispositivo: el que la persona usaría normalmente; registrar viewport aproximado.

## Preparación del facilitador

1. Abrir el recorrido en su pantalla inicial y restablecer cualquier acción local.
2. Decir: “Queremos probar el diseño, no evaluarte a vos. Pensá en voz alta. No voy a indicarte dónde hacer clic.”
3. No explicar `Revisado`, el orden de resultados ni la diferencia entre señales antes de las tareas.
4. Si la persona queda bloqueada por 30 segundos, registrar el bloqueo antes de ofrecer una pista neutral. Toda pista convierte la tarea en “con ayuda”.
5. No usar las preguntas de cierre para corregir respuestas durante el recorrido.

## Cinco tareas

### Tarea 1 — Encontrar

“Necesitás preparar Algoritmos y Estructuras de Datos. Encontrá materiales que puedan servirte para el primer parcial.”

Éxito sin ayuda: inicia una búsqueda o usa una sugerencia y llega a resultados relevantes. Registrar si distingue sugerencias de materias y recursos.

### Tarea 2 — Comparar

“Elegí cuál de los tres resultados abrirías primero. Contame qué información usaste y qué dudas te quedan.”

Éxito sin ayuda: compara al menos tipo, materia y una señal de contexto o confianza; no elige únicamente por estrellas suponiendo que implican verificación.

### Tarea 3 — Interpretar confianza

“En el material que elegiste aparece `Revisado`. Averiguá qué significa y explicámelo con tus palabras. ¿Qué no garantiza?”

Éxito sin ayuda: abre la divulgación y comprende que se verificaron apertura y credibilidad del contexto declarado, no corrección total. Preguntar después: “¿Es lo mismo que estar publicado, tener estrellas o recibir ‘Me sirvió’?”

### Tarea 4 — Inspeccionar y obtener

“Revisá el contenido antes de bajarlo y después descargalo.”

Éxito sin ayuda: usa `Abrir vista previa`, identifica que conserva el contexto, y encuentra `Descargar`. Luego pedir que simule el fallo de vista previa y observe si todavía sabría cómo continuar.

### Tarea 5 — Retener y reaccionar

“Guardá este material para volver más tarde y marcá si te sirvió. Explicá si esas acciones cambian su revisión o su puntuación.”

Éxito sin ayuda: reconoce los cambios de estado `Guardar`/`Guardado` y `Me sirvió`, y entiende que utilidad, guardado, estrellas y revisión son conceptos separados.

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
- ¿Qué diferencia ves entre `Revisado`, estrellas y “Me sirvió”?
- Si pudieras cambiar una sola cosa del recorrido, ¿cuál sería?

## Criterio de la compuerta

Se considera problema severo cualquier patrón repetido por dos o más participantes que:

- impida encontrar resultados o reconocer la materia como contexto;
- haga interpretar `Revisado` como garantía de respuestas correctas o como simple aprobación de publicación;
- haga confundir estrellas o “Me sirvió” con revisión académica;
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

No marcar OpenSpec 1.6 ni iniciar el grupo 2 hasta que ese archivo exista y la decisión esté asentada.

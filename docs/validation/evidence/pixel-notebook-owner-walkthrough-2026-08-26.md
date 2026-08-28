# Pixel Notebook — recorrido del dueño del producto

- Fecha de la sesión: 2026-08-26
- Fecha de registro: 2026-08-27

## Alcance de la evidencia

- Participante: dueño del producto.
- Cantidad de participantes: 1.
- Tipo de sesión: recorrido interno del prototipo con datos sintéticos.
- Esta sesión no constituye validación representativa con estudiantes FI-UNJU.
- La validación externa propuesta con 3–5 estudiantes queda diferida por decisión del dueño del producto. No se la registra como realizada y no se simulan participantes independientes.

## Resultados por tarea

### Tarea 1 — Buscar `estructura de datos`

Resultado: completada.

El participante encontró la materia y recursos relacionados, pero la presentación de sugerencias se percibió extraña. La captura muestra dos columnas demasiado estrechas para los títulos largos y contenido estático que no comunica con suficiente claridad qué elementos coinciden con la consulta.

Decisión: revisar el filtrado real de sugerencias, ocultar elementos que no coincidan y apilar los grupos antes de que el texto quede comprimido.

### Tarea 2 — Comparar materiales

Resultado: completada.

El participante comparó varios materiales y eligió uno utilizando las estrellas y la cantidad de personas que marcaron `Me sirvió`.

Decisión: conservar ambas señales como evidencia comunitaria visible y separada.

### Tarea 3 — Interpretar `Revisado`

Resultado: completada con interpretación problemática.

El participante consideró confusa la etiqueta `Revisado`. Como todo material público ya debe atravesar moderación previa, la etiqueta resulta redundante y puede sugerir una garantía académica que el proceso de publicación no ofrece.

Decisión: eliminar `Revisado` de la interfaz pública. Mantener el pipeline interno obligatorio `pendiente → aprobado/rechazado` y limitar toda lectura pública a materiales aprobados.

### Tarea 4 — Vista previa y descarga

Resultado: completada.

El participante abrió correctamente la vista previa y descargó el material.

Decisión: conservar ambas acciones, pero trasladar la vista previa principal a un diálogo contextual abierto desde un listado de archivos.

### Tarea 5 — `Guardar` y `Me sirvió`

Resultado: completada.

El participante entendió la diferencia entre guardar un recurso para uso personal y marcar que le resultó útil.

Decisión: conservar ambas acciones y sus estados separados.

## Hallazgos adicionales posteriores a la sesión

- Materiales necesita navegación jerárquica por carrera, año, materia y tipo de recurso.
- Cada nivel necesita breadcrumbs enlazados y cada materia, una búsqueda acotada a su propio contenido.
- Cuando una búsqueda identifica claramente una materia, su identidad debe reemplazar el encabezado genérico y no duplicarse en una tarjeta inmediata.
- El patrón principal debe ser un listado compacto de archivos; al abrir uno, un diálogo mantiene la vista previa, comentarios y acciones sin perder el contexto de la lista.
- Las referencias visuales externas se usan únicamente como inspiración estructural; no se copia su estilo.

## Decisión fechada

**REVISAR — 2026-08-26**

No corresponde iniciar el grupo 2 todavía. Antes se debe actualizar el prototipo, comprobar el recorrido revisado en navegador real para escritorio y móvil y registrar una nueva decisión explícita `PROCEDER` o `REVISAR` del dueño del producto.

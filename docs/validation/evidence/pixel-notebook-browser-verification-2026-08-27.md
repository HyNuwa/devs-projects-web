# Pixel Notebook — verificación de navegador del prototipo revisado

- Fecha: 2026-08-27 (ART)
- Entorno: Next.js 16.2.10 local, navegador integrado de Codex
- Viewports: desktop 1280 × 800; mobile 390 × 844
- Datos: sintéticos y acotados a Ingeniería Informática
- Alcance humano: verificación técnica, no prueba con estudiantes representativos

## Resultado

La revisión conectada satisface el recorrido y los estados requeridos por OpenSpec 1.7–1.8. No se observó ningún error o warning de consola durante el recorrido. El gate de producto 1.9 sigue pendiente de una decisión explícita del owner.

## Evidencia funcional

| Área | Evidencia observada |
| --- | --- |
| Sugerencias globales | `estructura de datos` mostró sólo la materia real `Estructura de Datos` y sus tres recursos; desktop usó dos columnas y mobile una columna scrollable. |
| Resultados | La coincidencia fuerte promovió `Estructura de Datos`, `1.er año`, `Ingeniería Informática`, código `08` al encabezado; no se renderizó hero genérico duplicado ni texto `Revisado`. |
| Comparación | Tres filas expusieron tipo, contexto, estrellas, cantidad de valoraciones y `Me sirvió`, con una acción clara `Abrir vista previa`. |
| Jerarquía | Se recorrió `Materiales → Ingeniería Informática → 1.º año → Estructura de Datos → Parciales` mediante links y URLs estables. |
| Breadcrumb | Cada nivel visitado mostró etiquetas y links coherentes con el heading y la URL; la categoría final quedó marcada como contexto actual. |
| Búsqueda de materia | `?q=listas` dentro de `Estructura de Datos` devolvió exactamente dos recursos de esa materia y mantuvo el breadcrumb. |
| Modal y URL | Abrir el parcial añadió `archivo=parcial-estructura-datos-2025`; recargar restauró el mismo modal y cerrar retiró sólo `archivo`. |
| Desktop | El modal quedó centrado con preview a la izquierda y panel de comunidad/comentarios a la derecha. |
| Mobile | El modal ocupó 390 × 844, apiló preview y comentarios en una sola columna y mantuvo identidad, descarga y cierre visibles. |
| Comunidad | Se comprobaron `4,6 · 18 valoraciones`, un comentario, `Guardar`/`Guardado` y `Me sirvió` 34/35 como estados independientes. |
| Descarga | El link visible disparó un evento de descarga del archivo sintético. |
| Fallback | `Simular fallo` mostró una explicación accionable; `Reintentar`, descarga, identidad, comentario y acciones permanecieron disponibles. |
| Teclado y cierre | El foco inicial y diez tabulaciones permanecieron dentro del modal; botón cerrar restauró foco al link de origen; Escape y clic exterior cerraron y conservaron la lista. |

## Defecto encontrado y corregido durante la pasada

Después de una recarga, el navegador integrado no emitía de forma fiable el cierre nativo con Escape. Se añadió un manejador explícito que conserva el diálogo nativo, se recompiló y se repitió la prueba: Escape cerró el modal, eliminó sólo `archivo` y dejó cero diálogos abiertos. También se centró explícitamente el diálogo en desktop y se confirmó un margen uniforme de 50 px horizontal y 18 px vertical.

## Verificación técnica

- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types scripts/verify-pixel-notebook-prototype.mjs`: exit 0; contratos de normalización, sugerencias y scope aprobados.
- `tsc --noEmit`: exit 0.
- `eslint` sobre rutas, componentes y verificador Pixel Notebook: exit 0, sin warnings.
- `next build`: exit 0 con acceso de red para las fuentes declaradas; compiló, verificó TypeScript y generó 20/20 páginas. Persiste el warning conocido de múltiples lockfiles/workspace root.
- Detector Impeccable: sólo advisories de escala tipográfica contra un `DESIGN.md` que documenta una rampa reducida; no se detectó un defecto funcional. La sidecar `.impeccable/design.json` ya estaba desactualizada antes de esta revisión y no se regeneró como efecto colateral.

## Limitaciones y gate

- La jerarquía demuestra un solo plan real del seed y concentra archivos sintéticos en `Estructura de Datos`; los años sin datos muestran un estado acotado honesto.
- No se simularon estudiantes ni se atribuyeron estos resultados a participantes independientes.
- Próxima decisión requerida: product owner `PROCEDER` o `REVISAR`, fechada, antes de comenzar el grupo 2.

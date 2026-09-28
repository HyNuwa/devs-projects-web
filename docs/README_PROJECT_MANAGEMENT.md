# Gestión del proyecto

Cómo se decide, planifica y reparte el trabajo. Lo trabajan personas y agentes (Claude Code y Codex) con el mismo flujo.

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Vocabulario del dominio | [`CONTEXT.md`](../CONTEXT.md) |
| Decisiones difíciles de revertir | [`docs/adr/`](adr) |
| Especificaciones funcionales | `docs/README_*.md` (por ejemplo [moderación](README_MODERACION.md) y [puntos](README_PUNTOS_E_INSIGNIAS.md)) |
| Cambios planificados: propuesta, diseño, specs y tareas | `openspec/changes/<cambio>/`, con `tasks.md` como lista de tickets |
| Bugs y pedidos que llegan de afuera | GitHub Issues (`HyNuwa/devs-projects-web`) |
| Diseño de pantallas | Canvas [DevsProject · Home](https://claude.ai/artifact/VwRuyScjfH3AjjpF2SPYaU) |

El trabajo planificado **no** se carga como issue: vive en OpenSpec.

## Ciclo de un cambio

Detalle completo en [`agents/workflow.md`](agents/workflow.md).

1. **Afinar la idea** (`/grill-with-docs`) hasta que no queden preguntas abiertas. Los términos nuevos van a `CONTEXT.md` y las decisiones duras, a un ADR.
2. **Proponer** (`openspec-propose`): propuesta, specs y `tasks.md`.
3. **Implementar** (`openspec-apply-change`) de a una tarea, con los tests primero. Se tilda la tarea cuando sus tests pasan.
4. **Revisar** (`/code-review`) por alguien que no implementó el cambio.
5. **Archivar** (`openspec-archive-change`) cuando todas las tareas están tildadas.

Para prototipos, bugs difíciles o mantenimiento, ver los caminos laterales en `workflow.md`.

## Issues y etiquetas

Los issues entrantes pasan por `/triage` y reciben una etiqueta de estado ([`agents/triage-labels.md`](agents/triage-labels.md)):

| Etiqueta | Significa |
|---|---|
| `needs-triage` | Nadie lo evaluó todavía |
| `needs-info` | Falta información de quien lo reportó |
| `ready-for-agent` | Claro y acotado; lo puede tomar un agente |
| `ready-for-human` | Requiere criterio o acceso de una persona |
| `wontfix` | No se va a hacer |

Un issue aceptado que no es un arreglo trivial entra al ciclo en el paso 1. Comandos de `gh` en [`agents/issue-tracker.md`](agents/issue-tracker.md).

## Ramas y pull requests

- Ramas desde `develop`: `feature/<tema>`, `fix/<tema>`, `prototype/<nombre>`. Un cambio de OpenSpec por rama.
- Título del PR en Conventional Commits (ver [`README_RULES.md`](README_RULES.md)).
- Descripción: qué cambia y por qué, con enlace al cambio de OpenSpec o al issue.
- Al menos una revisión antes de mergear. Los cambios de auth, archivos, permisos o datos personales siempre pasan por revisión (ver [`README_SECURITY.md`](README_SECURITY.md)).
- Antes de abrir el PR, actualizar la rama con `develop` y correr lint y tests de las apps tocadas.

### Checklist de revisión

- [ ] ¿Los nombres siguen `CONTEXT.md` y describen responsabilidades, no pantallas?
- [ ] ¿Hay validación de entrada y permisos en el controlador?
- [ ] ¿Se manejan los errores y los estados vacíos?
- [ ] ¿Hay tests del comportamiento nuevo?
- [ ] ¿No hay secretos en el código?
- [ ] ¿Se actualizó la documentación afectada?

## Hoja de ruta

Grandes bloques pendientes, sin fechas. Cada uno se convierte en uno o más cambios de OpenSpec.

| Bloque | Especificación | Estado |
|---|---|---|
| Moderación con publicación inmediata | [`README_MODERACION.md`](README_MODERACION.md), [ADR 0001](adr/0001-publicacion-inmediata-con-moderacion-posterior.md) | Especificado |
| Puntos, niveles e insignias | [`README_PUNTOS_E_INSIGNIAS.md`](README_PUNTOS_E_INSIGNIAS.md) | Especificado |
| Rediseño visual | Canvas DevsProject · Home | Diseñado |
| Universidad → Facultad en el modelo | [`README_DATABASE.md`](README_DATABASE.md) | Por especificar |
| Eventos | Canvas (página Eventos) | Diseñado, por especificar |
| Clasificados (venta y tutorías) | Canvas (página Clasificados) | Diseñado, por especificar |
| Infraestructura y despliegue | [`README_DEVOPS.md`](README_DEVOPS.md) | Plan |
| Limpieza de lo heredado (foro, guías, profesores, ranking) | — | Por decidir |

## Bloqueos

Si una tarea depende de otra que no está lista:

1. Anotarlo en el `tasks.md` del cambio, o en el issue.
2. Avisar a quien tiene la tarea que bloquea.
3. Mientras tanto, tomar otra tarea que no dependa de ella.

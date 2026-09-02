# Verificación Graphify — 2026-09-02

- Alcance: tarea OpenSpec 9.8.
- Comando: `graphify update .`
- Resultado: exit 0; 6.625 nodos, 13.829 relaciones y una vista agregada de 383 comunidades.

## Relaciones comprobadas

| Área | Consulta Graphify | Relación extraída |
| --- | --- | --- |
| Ruta y jerarquía | `graphify explain "MaterialHierarchyPage"` | `app/materiales/[...segments]/page.tsx` importa `MaterialHierarchyPage`. |
| Jerarquía y preview | `graphify path "MaterialHierarchyPage.tsx" "MaterialPreviewDialog.tsx"` | Import directo de `MaterialPreviewDialog` desde la página jerárquica. |
| Descubrimiento | `graphify path "CourseReviewDiscoveryPage.tsx" "discovery-client.ts"` | Import directo del cliente de descubrimiento. |
| Publicación/materiales | `graphify path "MaterialsController" "MaterialsService"` | El controlador llega al servicio a través de su constructor. |
| Moderación comunitaria | `graphify path "community-moderation.controller.ts" "CommunityModerationService"` | Import directo del servicio de moderación. |

Las consultas temáticas también devolvieron los nodos de discovery, hierarchy, preview dialog, material controller, moderation panel, curso/final discovery y detalle comunitario. La herramienta no infiere enlaces HTTP frontend→backend como imports directos; por eso la evidencia verifica cada extremo de esa frontera estática y sus dependencias reales, sin inventar una arista.

## Advertencias conocidas

- La skill de Graphify instalada es 0.9.32 y el paquete es 0.9.50.
- Siete archivos `.sql` no aportan nodos porque falta `tree_sitter_sql`.

Ambas advertencias son de la herramienta y no impidieron extraer las relaciones TypeScript/React/Nest requeridas. No se modificaron los archivos generados de `graphify-out/` para este commit.

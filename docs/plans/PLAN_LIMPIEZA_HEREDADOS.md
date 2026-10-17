# Plan: limpieza de lo heredado

> **Estado:** inventario en curso, sin grilling ni cambio OpenSpec (octubre 2026). Va al final de la secuencia del rediseño, después de Clasificados.
> **Regla mientras tanto:** no se pule código que este plan va a borrar. Si un cambio lo rompe, se anota acá y se arregla solo si la página sigue en uso real.
> **Relacionado:** `docs/README_PROJECT_MANAGEMENT.md` (hoja de ruta) y `docs/README_PUNTOS_E_INSIGNIAS.md`.

## 1. Qué se borra

| Ruta o pieza | Por qué se va | Reemplazo |
|---|---|---|
| `/foro` y `/foro/[categoria]` (`components/foro`) | El foro salió del producto. | Ninguno. |
| `/profesores` y `/profesores/[id]` | Las páginas de profesores salieron del producto. `Professor` sigue como dato de contexto. | El profesor como dato dentro de materiales, reseñas y finales. |
| Guías (`Guide`, `GuideStep`) | Salieron del producto. Sus puntos `GUIDE_CREATED` se conservan en el libro. | Ninguno. |
| `/materiales/[id]` (`MaterialDetail`) | El rediseño no tiene página propia del material: se abre en `MaterialPreviewDialog`. | `MaterialPreviewDialog`. |
| `/validacion/pixel-notebook` | Prototipo del rediseño. | Ninguno. |

**Ya borrado:** la lista plana de `/materias` (`SubjectList`) y el explorador `/materiales/[...]` (`MaterialHierarchyPage`, con los endpoints `discovery/hierarchy/*`) se borraron en el cambio 4 (`alcance-por-facultad`); sus URLs redirigen al recorrido por universidades. El `/ranking` heredado (global, semanal, `/ranking/top` y `/ranking/me`, con `RankCard`, `RankingList` y `LevelsTable`) se borró en 3c-3 (`rankings-acotados`). La URL `/ranking` sigue y muestra los rankings nuevos.

## 2. Diferencias conocidas que no se arreglan

Las tolera el producto hasta que se borre la pieza:

- **Avatar elegido (desde `perfil-publico`, 3c-1):** `/materiales/[id]` muestra solo `avatarUrl`, la foto subida. No muestran el gato elegido ni el gato asignado por id. El resto del producto usa `avatarSrc` (`components/layout/account.ts`).
- **Enlace al perfil público (3c-1):** esa misma página no enlaza el nombre del autor a `/usuarios/[username]`. Las vistas rediseñadas usan `AuthorLink`.
- **Warnings de lint en archivos heredados:** `components/foro/ThreadCard.tsx`, `components/materials/MaterialDetail.tsx`, `types/material-response.contract.ts` y las rutas `(focus)/materias/[codigo]/final` y `/resenar`. Hay que revisar si esas rutas de foco siguen en uso antes de borrarlas.
- **CSS sin uso:** `ProfilePage.module.css` todavía tiene `.avatarFallback`. Desde 3c-1, la tarjeta de «Mi perfil» siempre dibuja una imagen.

## 3. Antes de proponer el cambio

- Confirmar con un grilling qué rutas siguen recibiendo tráfico real, como enlaces viejos o el panel de moderación.
- Decidir la redirección de `/materiales/[id]` a la materia con la vista previa abierta.
- Borrar con cada pieza sus tests, sus tipos y sus endpoints del backend que ya no use nadie.

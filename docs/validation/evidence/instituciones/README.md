# Evidencia: cambio `instituciones`

Base `devs_project_moderacion` con la migración `20261011000000_institutions` aplicada con `prisma migrate deploy` (sin reset ni seed). Revisado con agent-browser el 10 de octubre de 2026, como `vale.mod`.

| Captura | Qué muestra |
|---|---|
| `materiales-1440.webp`, `materiales-390.webp` | `/materiales` agrupa las carreras bajo «Facultad de Ingeniería · UNJU». Sin scroll horizontal a 390 px. |
| `materia-1440.webp` | La ubicación de la materia en el plan: «FI (UNJU) · Ingeniería Informática · Año 6 · Cuatrimestre 0 · 6 créditos». El «Cuatrimestre 0» de las materias anuales ya venía así en los datos. |
| `mi-carrera-vacia-1440.webp` | «Mi carrera» sin planes, con universidad, facultad, carrera y plan preseleccionados porque cada nivel tiene una sola opción. |
| `mi-carrera-plan-1440.webp`, `mi-carrera-plan-390.webp` | Después de «Agregar plan»: el plan aparece con su estado y el aviso de privacidad. |

Al terminar se quitó el plan de prueba, así que la base de dev quedó sin planes declarados.

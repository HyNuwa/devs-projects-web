# Verificación visual comunitaria — Pixel Notebook

- Fecha: 2026-09-02 (ART)
- Entorno: frontend local y API local, navegador integrado de Codex
- Rutas comparadas: `/resenas` y `/finales`
- Viewports comprobados: desktop 1280 × 720; móvil 390 × 844
- Fuentes de diseño: `apps/frontend/DESIGN.md` y las referencias aprobadas por el owner.

## Resultado

**Aprobado.** Las rutas de reseñas y finales aplican la dirección Pixel Notebook. La quinta referencia aportada por el owner se usó solamente para conservar la utilidad de su estructura de contenido; su estilo visual no fue reproducido.

## Evidencia por ruta

| Ruta | Captura y contenido observado | Correspondencia Pixel Notebook |
| --- | --- | --- |
| `/resenas` desktop | Hero de reseñas, arte pixel de la ruta, promedio `4,7`, tres reseñas publicadas, filtros y tarjetas con fuente, estrellas, hechos, extracto y CTA. | Papel rayado cálido, contornos cuadrados de un píxel, texto académico literal, acción cobalt y composición editorial. |
| `/finales` desktop | Hero de finales con arte de faro, dos experiencias publicadas, filtros y tarjetas con resultado, preparación, mesa, consejo y CTA. | Misma base de papel rayado y controles compactos; el arte identifica la ruta sin sustituir la información académica. |
| `/resenas` móvil | A 390 × 844 px, navegación compacta, hero apilado, identidad de ruta visible y acceso a filtros. | La jerarquía se conserva en una columna, sin perder controles ni convertir la interfaz en una copia de la referencia. |

## Comparación explícita con la quinta referencia

Se retuvieron sólo las piezas útiles de información: autor/fuente, hechos escaneables, resumen y una acción para ampliar. Se excluyeron sus decisiones visuales:

- No hay tarjetas beige redondeadas ni sombras suaves como lenguaje principal.
- No se usa su combinación de chips verdes, avatares y rejilla de dos tarjetas como sistema visual.
- No se replica su tipografía, paleta ni jerarquía de rating.
- Las tarjetas comunitarias usan los tokens compartidos de papel rayado, cobalt, cobre, bordes cuadrados y etiquetas monoespaciadas definidos en `DESIGN.md`.

## Nota de datos

Antes de la prueba se aplicaron las migraciones locales pendientes al entorno de desarrollo. Eso reparó las respuestas de descubrimiento que devolvían 500; no implicó cambios de código ni de comportamiento de producción.

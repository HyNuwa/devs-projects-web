# 0001 · Publicación inmediata con moderación posterior

- **Estado:** aceptada
- **Fecha:** 28 de septiembre de 2026
- **Reemplaza:** la regla *Aprobación para publicación* de `CONTEXT.md` («todo lo que se sube empieza pendiente; solo lo aprobado entra al descubrimiento público»).

## Contexto

Hoy cada recurso académico empieza en `PENDING` y solo se ve cuando moderación lo aprueba. Con un equipo de moderación chico, revisar cada material y cada evento antes de publicarlo no escala: la cola crece, los aportes tardan en verse y moderar se vuelve el cuello de botella del producto.

## Decisión

Todo el contenido (materiales, reseñas, experiencias, eventos y avisos de Clasificados) se publica al instante y se modera después, según riesgo y confianza:

- Antes de publicar solo corren controles automáticos (formato, tamaño, duplicado exacto, ritmo de subidas).
- La revisión previa queda para casos de riesgo: cuentas nuevas o sin email verificado, cuentas con un retiro reciente, contenido marcado como spam y organizadores con eventos retirados.
- Un reporte no borra nada: abre o suma a un caso. Varias señales independientes (3 reportes de cuentas distintas en 48 h, o 1 por datos personales) ocultan el contenido de forma preventiva hasta que moderación decida.
- Los puntos de un aporte se otorgan al publicarse y se revierten si se retira.

El detalle está en `docs/README_MODERACION.md`.

## Consecuencias

- **A favor:** los aportes se ven enseguida; moderación trabaja sobre lo sospechoso y no sobre todo.
- **En contra:** contenido malo puede verse durante un rato antes de que alguien lo reporte, y los puntos otorgados al instante pueden tener que revertirse. Se mitiga con los controles automáticos, la revisión previa para cuentas de riesgo y el ocultamiento preventivo.
- **Trabajo:** cambian el estado por defecto de `Material`, el panel de moderación (de cola de aprobación a cola de casos), *Subir material*, *Mis aportes*, las *Normas de la comunidad* y el sistema de puntos.

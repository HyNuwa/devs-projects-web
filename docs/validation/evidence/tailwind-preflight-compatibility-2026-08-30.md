# Compatibilidad de Tailwind Preflight con la UI legada

Fecha: 2026-08-30
Alcance: `apps/frontend/src/app/globals.css` y los 37 CSS Modules actuales de `apps/frontend/src`.

## Decisión

Se mantiene Tailwind Preflight activo. No se agrega una anulación global de Preflight ni se desactiva su capa `base`: ambas opciones harían menos predecible la convivencia con los componentes shadcn que se incorporarán después.

La única compatibilidad explícita es `body { line-height: normal; }` en `globals.css`. Antes de incorporar Tailwind, la interfaz legada heredaba el ritmo tipográfico del navegador. Preflight establece `line-height: 1.5` en `html`; la regla conserva el ritmo anterior hasta que los componentes migrados declaren su escala tipográfica de forma deliberada.

## Matriz de impacto

| Reset de Preflight                        | Cobertura existente                                                                                                                    | Decisión                                |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Márgenes y padding iniciales              | `globals.css` ya aplica `* { box-sizing: border-box; padding: 0; margin: 0; }`.                                                        | Sin cambio adicional.                   |
| Tipografía de encabezados                 | `globals.css` conserva la familia de encabezados y cada módulo legado define los tamaños que necesita.                                 | Sin cambio adicional.                   |
| Listas sin viñetas                        | Las listas de navegación ya declaran `list-style: none`; no hay listas de contenido legadas que dependan de las viñetas del navegador. | Sin cambio adicional.                   |
| Fondo, borde, fuente y radio de controles | Los controles de `Button`, `Input`, autenticación, navegación y materiales definen estas propiedades en sus CSS Modules.               | Sin selector universal de compensación. |
| Bordes sólidos por defecto                | Los módulos que muestran bordes declaran `border` completo; los botones sin borde declaran `border: none`.                             | Sin cambio adicional.                   |
| Imágenes como bloque y con ancho máximo   | Las imágenes legadas usan dimensiones, `object-fit` o contenedores propios. El resultado coincide con el layout esperado.              | Sin cambio adicional.                   |

Las reglas sin capa de `globals.css` y de los CSS Modules tienen prioridad sobre la capa `base` de Tailwind. Por eso la compensación queda limitada al único valor heredado que no estaba declarado en los estilos legados: `line-height`.

## Verificación de rutas legadas

Se probó la aplicación local con Tailwind Preflight activo mediante un navegador aislado:

| Ruta          | Verificación                                                                                             |
| ------------- | -------------------------------------------------------------------------------------------------------- |
| `/`           | Jerarquía de encabezados, navegación, tarjetas, imágenes, márgenes y footer se renderizan correctamente. |
| `/auth/login` | Etiquetas, campos, bordes, botones y espaciado del formulario permanecen visibles y operables.           |
| `/materiales` | Select, búsqueda, botón y estado de error conservan tamaño, borde, fondo y alineación.                   |
| `/ranking`    | Cabecera, pestañas, botones, tarjetas y estados de error conservan sus bordes y separación.              |

Las rutas que consultan la API mostraron sus estados de error previstos porque la API local no formó parte de esta verificación. Esto no impidió revisar el shell, los controles ni los contenedores de cada ruta.

## Diferido intencionalmente

- La migración de controles legados a primitivas fuente-propias o Radix corresponde a la tarea 5.4.
- Los ajustes de foco visible, zoom y movimiento reducido corresponden a la tarea 5.8.
- El mapeo de tokens canónicos en la capa global corresponde a la tarea 5.3.

## Referencias

- [Tailwind Preflight](https://tailwindcss.com/docs/preflight)
- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md)

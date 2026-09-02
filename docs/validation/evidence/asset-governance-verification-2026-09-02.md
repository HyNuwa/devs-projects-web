# Verificación de gobernanza de assets — 2026-09-02

- Alcance: tarea OpenSpec 9.7.
- Entorno: build frontend local y navegador integrado de Codex.
- Artefactos completos: `%TEMP%/devsproject-9.7-assets/`.

## Resultado

**Aprobado.** No se entrega ningún pack PixelRepo, no existe dependencia runtime de Glyphy y no se distribuye ninguna fuente sin licencia identificada.

## Evidencia

| Control | Resultado |
| --- | --- |
| `pnpm --filter frontend verify:assets` | Exit 0; 4 assets aprobados, 3 grupos excluidos, 32 variantes AVIF/WebP verificadas y ningún PNG fuente público. |
| `pnpm --filter frontend verify:kaomoji` | Exit 0; allowlist Unicode local tipada y 200 archivos de producción sin referencias remotas de emoticonos. |
| Manifest | Los cuatro assets activos son de Open Design, tienen hash, dimensiones, licencia, fuente, variantes y ruta consumidora. |
| PixelRepo | Figura como grupo excluido: no hay asset individual aprobado ni runtime catalog dependency. |
| Glyphy | Figura como grupo excluido; el producto usa sólo kaomoji local y decorativo. |
| Créditos visibles | La atribución visible se exige sólo cuando un asset adoptado la requiere. El manifest declara `attributionRequired: false` para los cuatro assets Open Design y no hay assets PixelRepo adoptados, por lo que no existe crédito de terceros que deba renderizarse. |
| Producto renderizado | El hero de inicio resolvió vía `next/image` a `/assets/pixel-notebook/heroes/hero-home-brasa-kit-1280.webp`; el DOM no expuso links de PixelRepo, Glyphy, Google Fonts ni gstatic. |

## Fuentes tipográficas

El layout importa Inter, Outfit y Press Start 2P mediante `next/font/google`; el build las entrega localmente, sin URL de Google Fonts en el DOM. Los tres proyectos declaran SIL Open Font License 1.1 en su repositorio canónico de Google Fonts: [Inter](https://raw.githubusercontent.com/google/fonts/main/ofl/inter/OFL.txt), [Outfit](https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/OFL.txt) y [Press Start 2P](https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/OFL.txt).

El stack editorial Pixel Notebook continúa usando las familias locales/fallback documentadas. La presencia de estas fuentes auxiliares con OFL no introduce una dependencia remota ni una fuente sin licencia.

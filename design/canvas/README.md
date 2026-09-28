# Fuentes del canvas «DevsProject · Home»

Canvas publicado: https://claude.ai/artifact/VwRuyScjfH3AjjpF2SPYaU

Esta carpeta guarda lo necesario para retocar el diseño sin rehacerlo a mano. No es código de la app.

| Ruta | Qué es |
|---|---|
| `home/project/*.dc.html` | Un artboard por archivo (formato de Claude Design) |
| `home/project/canvas.json` | Páginas, posiciones y altos de cada artboard |
| `home/project/*.png, *.jpg, *.svg` | Imágenes del canvas (mascota, flyers, insignias) |
| `home/src/` | Arte original de la mascota |
| `*/generar*.py` | Generadores de Python que escriben los artboards |
| `medir.py` | Mide el alto natural de un artboard con Chrome headless (`--fijo` para popups) |
| `_regenerar.py` | Corre generadores con los altos de `canvas.json` y vuelve a medir |

Los scripts usan rutas relativas: se corren desde esta carpeta (`design/canvas`).

Para publicar cambios, se arma el HTML del canvas con el seed de Claude Design (contrato 0.1.31) y se republica en la misma URL. Otra opción es pedirle a Claude que lea el canvas publicado y lo edite.

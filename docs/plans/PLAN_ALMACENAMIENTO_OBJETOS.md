# Plan: almacenamiento de archivos en object storage

> **Estado:** idea, sin grilling ni cambio OpenSpec (octubre 2026).
> **Origen:** investigación propia del dueño del proyecto sobre importar desde Drive y cuánto espacio haría falta.
> **Relacionado:** `PLAN_IMPORTACION_DRIVE.md` (depende de este plan), `docs/README_DEVOPS.md`, `apps/backend/src/modules/materials/` (`file-storage.service.ts`, `google-drive-storage.service.ts`, `material-upload.options.ts`).

## 1. Problema

No sabemos cuánto espacio van a ocupar los materiales, y el VPS previsto tiene unos 80 GB, que también necesitan el sistema operativo, Postgres, Redis, los logs y los archivos temporales. Además, hoy los archivos dependen de una carpeta de Google Drive.

La idea es separar los archivos del servidor y guardarlos en un **object storage** con API compatible con S3, pagando por lo que se usa. Así no hay que estimar el tamaño de antemano.

## 2. Cómo funciona hoy

- **Subida:** `POST /materials` recibe el archivo en memoria (Multer sin `diskStorage`). Acepta como máximo 25 MB y estas extensiones: pdf, doc, docx, pptx, xls, txt, md, jpg, png y webp. Solo se valida la extensión, no el tipo MIME.
- **Staging:** el archivo se escribe en `storage/staging/materials/<uuid>.<ext>` y queda ahí hasta publicarse. Si hay revisión previa, espera la aprobación del moderador.
- **Proveedor:** la factory `FILE_STORAGE` elige `GoogleDriveStorageService` si hay credenciales y, si no, `LocalFileStorageService` (`public/uploads/materials`).
  - **Drive** usa una cuenta de servicio (`GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`, scope `drive.file`) y le da a cada archivo permiso público de lectura.
  - Guarda `driveFileId`, `drivePreviewUrl` (`/preview`) y `driveDownloadUrl`.
- **Descarga:** `GET /materials/:id/download` redirige a Drive o, en local, sirve el archivo con `sendFile`. La vista previa del material usa el iframe `/preview` de Drive, que **también muestra docx, pptx y xls**.
- **Duplicados:** `fileHash` es el sha256 del archivo. Se rechaza un duplicado exacto dentro de la misma materia.
- **Lo que el README no refleja:**
  - el `FILE_STORAGE` que menciona `README_DEVOPS.md` no se lee en ningún lado;
  - las variables de Drive no están en `.env.example` ni en `env.validation.ts`;
  - `README_BACKEND.md` y `README_DATABASE.md` dicen que no hay Redis, y sí lo hay, para el rate limit.

## 3. Riesgos de quedarse en Drive

- **Cuota de la cuenta de servicio (a verificar).** Google documenta que las cuentas de servicio no tienen cuota de almacenamiento propia. Para subir archivos necesitan una unidad compartida de Workspace o delegación. Hay que confirmar si la configuración actual sobrevive a volumen real antes de depender de ella.
- **Límites y dependencia:** rige la cuota de requests de la API de Drive, los archivos públicos quedan bajo las políticas de Drive (y pueden bloquearse por abuso) y el enlace de descarga directa de Drive muestra una pantalla intermedia con archivos grandes.
- **Respaldo:** hoy no hay ninguna copia de los archivos fuera de Drive.

## 4. Propuesta

1. **Agregar un proveedor `S3StorageService`** detrás de la misma interfaz `FILE_STORAGE`, con el SDK de AWS S3, que funciona con R2, B2, MinIO y S3. La elección pasa a ser una variable de entorno validada (`FILE_STORAGE=local|drive|s3`), así se puede cambiar de proveedor sin tocar el dominio.
2. **Proveedor inicial: Cloudflare R2.** No cobra transferencia de salida, que en una biblioteca con muchas descargas es el costo impredecible. B2 cuesta menos por GB, pero cobra la salida que pasa de 3 veces lo almacenado.
3. **Claves por contenido:** `materials/<sha256>.<ext>`. Si dos registros tienen el mismo archivo, hay una sola copia física. El duplicado *dentro de una materia* sigue siendo un rechazo de producto; esto solo ahorra espacio entre materias.
4. **Descargas:**
   - **Opción A:** bucket privado y `GET /materials/:id/download` redirige a una URL firmada de pocos minutos. Mantiene el conteo de descargas y permite retirar un archivo al instante.
   - **Opción B:** bucket público con dominio propio. Es más simple, pero un archivo retirado sigue accesible para quien tenga la URL.
   - Recomendación: A, porque los retiros de moderación tienen que cortar el acceso.
5. **Vista previa:** sin Drive se pierde la vista previa de Office. Opciones:
   - PDF e imágenes con el visor del navegador o pdf.js. Office solo se descarga.
   - Convertir Office a PDF al publicar (LibreOffice headless en un worker) y guardar los dos archivos.
   - Decisión pendiente: depende de cuánto Office se sube en la práctica.
6. **Subida directa (más adelante):** URLs firmadas de subida para que el archivo no pase por la memoria del backend. Hasta que haga falta, se mantiene el flujo actual con staging.
7. **Migración:** un script copia cada material de Drive al bucket (por `driveFileId`), verifica el sha256 y completa la clave nueva. Los campos de Drive se conservan hasta terminar la migración y después se eliminan.

## 5. Costos de referencia

Precios relevados en octubre de 2026. Hay que verificarlos al decidir.

- **Cloudflare R2:** US$0,015 por GB al mes, 10 GB gratis y salida sin costo ([pricing](https://developers.cloudflare.com/r2/pricing)).
- **Backblaze B2:** US$6,95 por TB al mes. La salida es gratis hasta 3 veces lo almacenado y después cuesta US$0,01 por GB. No queda claro si tiene capa gratuita.

Escenarios con un promedio supuesto de 5 MB por archivo (un PDF de texto pesa menos de 1 MB; uno escaneado, 30 MB o más):

| Archivos | Espacio | R2 / mes | B2 / mes |
|---|---|---|---|
| 2.000 | 10 GB | US$0 | ~US$0,07 |
| 10.000 | 50 GB | ~US$0,60 | ~US$0,35 |
| 20.000 | 100 GB | ~US$1,35 | ~US$0,70 |
| 100.000 | 500 GB | ~US$7,35 | ~US$3,50 |
| 200.000 | 1 TB | ~US$14,85 | ~US$6,95 |

Las operaciones de lectura y escritura se cobran aparte, pero a esta escala son marginales. Lo que más pesa al crecer es el procesamiento (miniaturas, conversiones) y los backups, no el espacio.

## 6. Controles desde el primer día

- Mantener la lista de extensiones y validar también el tipo MIME real (magic bytes), no solo la extensión.
- Mantener el límite de 25 MB por archivo y dejarlo configurable.
- Un panel de admin con el espacio usado, el crecimiento mensual, los archivos más pesados y el costo estimado.
- Respaldo: activar el versionado o el bloqueo de objetos del bucket, o hacer una copia periódica a un segundo proveedor (B2), en línea con los backups previstos en `README_DEVOPS.md`.
- Corregir de paso lo que el README no refleja (§2).

## 7. Preguntas para el grilling

- ¿Bucket privado con URLs firmadas (A) o público (B)?
- ¿Se convierte Office a PDF para la vista previa o solo se descarga?
- ¿Se migra todo Drive de una vez o se deja Drive como proveedor de lectura para los materiales viejos?
- ¿Dónde corre el procesamiento pesado (conversiones, miniaturas): en el mismo backend o en un worker aparte? Lo mismo necesita la importación desde Drive.
- ¿Hace falta antes de la importación desde Drive? Sí: importar cientos de archivos a la cuenta de servicio de Drive agravaría el riesgo de cuota (§3).

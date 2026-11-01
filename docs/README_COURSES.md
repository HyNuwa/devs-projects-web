# Materias, cursos y Google Drive

Implementación de backend sobre `develop` (`ed2fc26`). Esta rama partía de autenticación y `User.id` entero; no contiene el módulo de materiales ni la moderación presentes en `main`. Se conservaron los IDs y las rutas de autenticación. Las nuevas entidades educativas usan UUID y sus referencias a usuarios siguen siendo enteros.

## Organización

Carrera → plan de estudio ↔ materia → cursos opcionales → secciones → clases → archivos. Una materia puede existir sin curso y un curso puede existir sin materia. Una cuenta puede inscribirse en muchos cursos y cada curso tiene muchos estudiantes. Los archivos de clases son privados; el catálogo público solo presenta resúmenes y títulos.

Los módulos NestJS separan `authorization`, `subjects`, `courses` y `drive`. Prisma persiste relaciones y auditoría. Los permisos se declaran en controladores; los servicios comprueban pertenencia, inscripción y estado. No se trasladó Express ni Sequelize del repositorio de referencia.

## Preparación

Desde la raíz, instalar con `pnpm install --frozen-lockfile`. Definir `DATABASE_URL` para la base elegida y ejecutar:

```sh
pnpm --filter backend exec prisma generate
pnpm --filter backend exec prisma migrate deploy
pnpm --filter backend build
pnpm --filter backend start:dev
```

La migración es aditiva: conserva `User` y sus registros; agrega las relaciones educativas, auditoría y controles de cuenta. No usar `migrate reset` sobre datos compartidos. Swagger está en `/docs` fuera de producción. Todos los endpoints usan el prefijo `/api/v1`.

Para el primer administrador, registrar una cuenta normalmente, exportar `DATABASE_URL` y `BOOTSTRAP_SUPERADMIN_EMAIL` con el correo de esa cuenta, y ejecutar `pnpm --filter backend bootstrap:superadmin`. Solo funciona cuando no hay SUPERADMIN, toma el mismo lock que la API y registra auditoría. No crea contraseñas ni usuarios predeterminados. Los siguientes nombramientos se hacen por API.

## Roles y permisos

| Rol | Capacidad inicial |
|---|---|
| VISITOR | Lecturas públicas |
| USER, MODERATOR | Catálogo, inscripción propia y lectura de cursos con inscripción activa |
| ADMIN | Gestión de materias/carreras/planes, cursos, archivos y nombramientos de VISITOR/USER/MODERATOR |
| SUPERADMIN | Gestión administrativa y nombramientos de ADMIN/SUPERADMIN |

`GET /auth/permissions` devuelve `{ role, permissions }` para la sesión. `GET /admin/roles` devuelve la matriz a administradores. Cada solicitud autenticada relee la cuenta: un rol falso o anterior en el JWT no concede acceso. `isBanned` con fin futuro o sin fin invalida la sesión; `mutedUntil` futuro impide escrituras protegidas. Son controles de base preparados, sin un sistema nuevo de sanciones o una pantalla de administración de sanciones.

`PATCH /admin/users/:id/role` ahora exige `{ "role": "MODERATOR", "reason": "Responsable de moderación" }`. No permite autocambios; ADMIN no puede tocar cuentas administrativas. Rol y auditoría se escriben juntos. La exclusión transaccional conserva al menos un SUPERADMIN bajo concurrencia.

## API educativa

| Rutas | Uso |
|---|---|
| `GET /subjects[/:uuid]`, `/careers`, `/study-plans` | Contexto académico público; listas con page/limit |
| `POST /admin/careers` | `{ name, code }` |
| `POST /admin/study-plans` | `{ careerId, name, code }` |
| `POST /admin/subjects`, `PATCH /admin/subjects/:uuid` | `{ name, code?, description? }` |
| `POST /admin/subjects/:uuid/study-plans` | `{ studyPlanId, year, semester, credits? }` |
| `GET /courses`, `GET /courses/:uuid` | Catálogo/resumen públicos; page/limit y filtro subjectId |
| `GET /courses/management`, `GET /courses/:uuid/management` | Listado y estructura administrativa, incluso borradores |
| `POST /courses`, `PATCH /courses/:uuid` | `{ title, description, subjectId? }` |
| `POST /courses/:uuid/sections` | `{ title, position }` |
| `PATCH/DELETE /courses/:uuid/sections/:sectionId` | Editar/eliminar sección sin archivos asociados |
| `POST /courses/:uuid/sections/:sectionId/lessons` | `{ title, position, body? }` |
| `PATCH/DELETE /courses/:uuid/lessons/:lessonId` | Editar/eliminar clase sin archivos asociados |
| `POST /courses/:uuid/publish`, `/archive`, `/draft` | Transiciones editoriales |
| `PUT/DELETE /courses/:uuid/enrollment` | Inscripción propia idempotente o baja |
| `PATCH /courses/:uuid/enrollments/:userId` | Activar/revocar inscripción existente, `{ active: true/false }` |
| `GET /courses/:uuid/lessons/:lessonId` | Clase y metadatos de archivos disponibles, con inscripción o gestión |

Las posiciones son enteros desde 0, únicos en su padre. Publicar requiere secciones con clases y cada clase debe tener texto o un archivo READY. Editar un publicado no puede invalidar esa estructura: volver a borrador para reorganizar. Archivar retira el catálogo y el acceso estudiantil. Las entidades anidadas ajenas responden 404. No hay borrado físico de cursos ni materias.

Los booleanos JSON deben ser `true`/`false`, no cadenas. Campos desconocidos y `null` en campos no anulables devuelven 400. Conflictos de unicidad devuelven 409. Los tamaños de archivos se serializan como cadenas decimales.

## Google Drive

Configurar en el servidor las variables de `.env.example`:

- `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`: JSON completo de una cuenta de servicio dedicada; la clave debe ser RSA PEM válida. Nunca enviarlo al navegador ni versionarlo.
- `GOOGLE_DRIVE_SHARED_DRIVE_ID`: unidad compartida accesible por la cuenta de servicio con permiso para crear y eliminar sus archivos.
- `GOOGLE_DRIVE_FOLDER_ID`: carpeta raíz privada dentro de esa unidad. No admitir enlaces anyone/domain, incluidos heredados.
- `COURSE_UPLOAD_STAGING_DIR`: volumen privado persistente para recuperar subidas (por defecto `storage/course-uploads`). No servirlo estáticamente. En múltiples instancias, compartir el volumen o conservar la afinidad de los trabajadores a ese almacenamiento.

Habilitar Drive API en el proyecto de Google y agregar la cuenta de servicio a la unidad compartida. El scope del servidor es `drive` para importar archivos preexistentes; limitar el acceso de esa cuenta a la unidad requerida. Los uploads nunca crean permisos públicos. La configuración parcial o PEM/JSON inválido impide iniciar; la raíz/privacidad remota se comprueba antes de operar. Sin ninguna configuración, el resto de la plataforma funciona y las operaciones de archivo devuelven 503.

| Ruta | Uso |
|---|---|
| `GET /admin/drive/files` | Explorar raíz o folderId descendiente; pageSize 1–100 y pageToken. Devuelve nextPageToken |
| `POST /courses/:uuid/lessons/:lessonId/files` | Multipart con un solo `file`, PDF/JPEG/PNG/WebP, hasta 25 MiB; firma y extensión deben coincidir |
| `POST /courses/:uuid/lessons/:lessonId/files/import` | `{ driveFileId, allowDownload? }`; valida raíz, privacidad, tamaño y firma; rechaza duplicados |
| `DELETE /courses/:uuid/lessons/:lessonId/files/:fileId` | Desvincular; limpia solo uploads de la aplicación, nunca archivos importados |
| `GET /courses/:uuid/lessons/:lessonId/files/:fileId/content` | Leer inline; `?download=true` descarga si está habilitado; soporta un solo Range de bytes |

La aplicación valida la inscripción y las relaciones antes de contactar Drive. No expone URLs públicas ni IDs de Drive a estudiantes. `allowDownload=false` impide la descarga como adjunto, pero no es DRM: el navegador recibe los bytes para visualizarlos.

La reserva PENDING y operationId sobreviven a una caída. Un trabajador cada minuto reconcilia PENDING/FAILED/DETACHING, usa un lease atómico de 10 minutos y hasta 10 intentos. Si la subida ya existe, la localiza por appProperties antes de repetirla. Un staging ausente queda como FAILED y puede desvincularse desde administración; no se inventa su contenido. El estado y lastErrorCode están en la vista administrativa. Los errores del proveedor se sanitizan.

## Verificación

`pnpm --filter backend exec jest --runInBand` ejecuta las unitarias. Para integración, usar exclusivamente una base PostgreSQL descartable llamada `codex_courses_test`, definir `DATABASE_URL`, `JWT_SECRET` y `NODE_ENV=test`, aplicar migraciones y ejecutar `pnpm --filter backend test:learning`. La suite vacía los datos de esa base de pruebas al iniciar, comprueba la configuración HTTP real y sustituye solo Drive por un proveedor simulado. No necesita credenciales Google.

Para verificar Drive real hace falta una unidad de pruebas y credenciales. Usar un documento sintético privado y comprobar subida, importación, lectura autorizada, revocación y limpieza. Esta verificación externa queda pendiente cuando no hay credenciales; los tests simulados no la sustituyen.

Esta entrega prepara backend y contratos. Las pantallas tipo Udemy, reproductor de video, pagos, quizzes, progreso y delegación de docentes por curso requieren cambios posteriores.

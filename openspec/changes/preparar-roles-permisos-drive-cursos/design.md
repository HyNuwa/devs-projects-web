# Design

## Context

Ver la motivación y el alcance aclarado por el usuario en `proposal.md`: crear materias y cursos en una plataforma educativa tipo Udemy. Base de implementación solicitada: `origin/develop` (`ed2fc26`). La inspección inicial de main se usó como referencia, sin fusionarla. Arquitectura actual: monorepo pnpm, frontend Next.js, backend modular NestJS, PostgreSQL con Prisma 7, validación global de DTOs y JWT global con cookies httpOnly.

`JwtStrategy.validate` usa el rol del JWT. `RolesGuard` compara ese rol. `AdminController.updateUserRole` escribe un rol recibido por `@Body('role')` sin DTO, jerarquía ni auditoría. `GoogleDriveStorageService` ya existe, utiliza un cliente sin tipar, hace públicos los archivos, pasa un Buffer como cuerpo de subida y limita el listado de una carpeta a la primera página. `Material` ya tiene relación obligatoria con `Subject` y metadatos de Drive; no necesita una tabla de cursos para seguir funcionando.

El otro repositorio usa Express/Sequelize, roles/permisos muchos-a-muchos y una jerarquía Course → Section → Content → ContentFiles. Se toma esa organización funcional, manteniendo las convenciones locales. El código vigente prevalece sobre README antiguos que describen moderación y sanciones como pendientes.

## Goals / Non-Goals

**Goals:** separar autorización, dominio educativo y proveedor externo; garantizar acceso privado a clases; mantener las relaciones por UUID y las reglas existentes de moderación; tener una implementación dividida en tareas comprobables.

**Non-Goals:** pagos, suscripciones, quizzes, seguimiento de progreso, cursos en video, roles configurables desde una interfaz, pantallas nuevas, cambios en los puntos o en la política comunitaria. La primera entrega admite adjuntos PDF e imágenes de hasta 25 MiB. `allowDownload=false` controla la descarga como adjunto; no es DRM y no impide copiar contenido recibido por el navegador.

## Decisions

### 1. Autorización sobre el rol vigente

Crear `AuthorizationModule` con catálogo tipado y matriz estática versionada. Conservar el enum Prisma `Role` y `User.role`: migrar ahora a roles dinámicos duplicaría el modelo existente y aumentaría el riesgo de regresiones en moderación.

| Permiso nuevo | VISITOR | USER | MODERATOR | ADMIN | SUPERADMIN |
|---|---|---|---|---|---|
| `courses:read` | Sí | Sí | Sí | Sí | Sí |
| `courses:enroll` | No | Sí | Sí | Sí | Sí |
| `courses:manage` | No | No | No | Sí | Sí |
| `subjects:manage` | No | No | No | Sí | Sí |
| `drive:manage` | No | No | No | Sí | Sí |
| `roles:read` | No | No | No | Sí | Sí |
| `roles:assign` | No | No | No | Sí, con jerarquía | Sí, con jerarquía |

El catálogo público usa `@Public()`; el permiso `courses:read` describe la capacidad y no convierte en privada esa ruta. `@Permissions()` y `PermissionsGuard` exigen todos los permisos declarados. Se mantienen `@Roles()` y `RolesGuard` en las rutas actuales. Ante la ausencia de permisos declarados, el nuevo guard no altera la ruta existente; los permisos desconocidos nunca autorizan.

Actualizar `JwtStrategy.validate` para cargar id, email, role y estado de suspensión desde Prisma en cada solicitud autenticada, con `isSuspended` y la semántica actual de fin de sanción. Cuenta inexistente/suspendida → 401. El guard de permisos controla mutedUntil para escrituras. No hay AccountStatusService ni sistema de sanciones en develop. Evitar cachear autorizaciones inicialmente: los cambios de rol deben aplicarse de inmediato. Los checks de permisos van en controladores; la relación entre curso, clase, archivo e inscripción se valida en el servicio de dominio.

No se agrega INSTRUCTOR al enum: la edición inicial es administrativa. Si se requiere delegar docentes por curso, será una relación de membresía acotada al curso, no un privilegio administrativo global.

### 2. Cambios de rol transaccionales

Mover la operación de `AdminController` a un servicio y usar DTO con enum y razón de 10–500 caracteres. ADMIN puede administrar VISITOR/USER/MODERATOR; SUPERADMIN puede administrar todos. Se rechazan autocambios. Todas las asignaciones se serializan dentro de una transacción PostgreSQL mediante un advisory lock exclusivo con una clave común; después de adquirirlo se releen actor y destino y se cuenta el remanente antes de persistir. Esto impide usar permisos revocados concurrentemente. Error de concurrencia reintentable → reintento acotado y luego 409.

Crear `RoleChangeAudit`: UUID, actorId, targetId, oldRole, newRole, reason, createdAt; índices por targetId/createdAt y actorId/createdAt. Las referencias a User son Int, conservando su PK existente; las entidades nuevas tienen UUID. Relaciones a User con `onDelete: Restrict`, sin guardar correo ni tokens. La escritura del rol y la auditoría es atómica. Un rol igual al actual devuelve 409. Este registro no se mezcla con la evidencia de casos de moderación.

### 3. Modelo educativo independiente

La creación y edición de materias incorpora `Subject` y `StudyPlanSubject` en el nuevo `SubjectsModule`, con rutas administrativas separadas de las lecturas públicas existentes. No se crean tablas paralelas de materias. El DTO admite name (1–150), code opcional (1–20), description opcional (hasta 5000); searchKey se calcula con el normalizador existente y materialCount nunca es editable. Se permite una materia sin plan y se pueden agregar asociaciones con planes existentes: year 1–20, semester 1–2 y credits opcional positivo. La clave compuesta existente impide duplicar la asociación; plan ausente devuelve 404 y asociación duplicada 409. El borrado de materias queda fuera para preservar recursos, reseñas y referencias. Estas escrituras requieren `subjects:manage`; no modifican ni reemplazan reseñas o experiencias.

Todos los modelos nuevos usan UUID, `createdAt`, `updatedAt`, nombres SQL en snake_case y claves foráneas explícitas.

| Modelo | Campos y relaciones principales | Restricciones |
|---|---|---|
| `Course` | title, description, status DRAFT/PUBLISHED/ARCHIVED, creatorId → User, subjectId? → Subject | índices status/createdAt, subjectId; Subject onDelete SetNull, creator Restrict |
| `CourseSection` | courseId → Course, title, position | unique(courseId, position); Cascade |
| `CourseLesson` | sectionId → CourseSection, title, body?, position | unique(sectionId, position); Cascade |
| `CourseEnrollment` | courseId → Course, userId → User, active | unique(courseId, userId), index(userId, active); Cascade |
| `CourseFile` | lessonId → CourseLesson, uploaderId → User, driveFileId?, originalName, mimeType, size BigInt, allowDownload, state, operationId UUID unique, origin UPLOAD/IMPORT, lastErrorCode? | driveFileId unique si existe; index(lessonId, state); lesson Restrict; uploader Restrict |

Estados de archivo: PENDING → READY o FAILED; un reintento usa el mismo operationId. READY exige driveFileId. La desvinculación pasa a DETACHING, deja de permitir lecturas y conserva la fila hasta completar limpieza; los archivos importados solo se desvinculan. Para importar, se reserva el driveFileId con la restricción única antes de llamar al proveedor. Para subir, `operationId` viaja en `appProperties`; permite encontrar un archivo aunque se pierda la respuesta del proveedor. Un archivo siempre pertenece a una clase; su curso y materia se derivan de las relaciones y no se duplican.

No hay borrado físico de cursos en esta entrega: se archivan. No se eliminan clases con archivos; primero se desvinculan los adjuntos. La desvinculación de un archivo conserva un registro de operación para su limpieza asíncrona, sin borrar archivos importados. No se sobrecarga `PublicationStatus`: el estado editorial de un curso es independiente de la publicación inmediata del ADR 0001.

Publicar valida toda la estructura en una transacción: al menos una sección y una clase, ninguna sección vacía y ninguna clase sin texto ni archivo READY. Editar/borrar contenido de un curso PUBLISHED debe mantener esa condición. Las posiciones empiezan en 0 y se modifican con checks de unicidad; el reordenamiento masivo queda fuera de esta entrega.

### 4. Contratos REST

Prefijo `/api/v1`; DTOs con class-validator/Swagger. UUIDs en parámetros; títulos 1–200 caracteres; descripciones/cuerpos con límites explícitos; posiciones enteras >= 0. Listas con page >= 1, limit 1–100, orden estable por fecha/id. PATCH permite solo campos declarados y no usa `null` para evitar validaciones de campos obligatorios.

| Método / ruta | Contrato y acceso |
|---|---|
| `GET /auth/permissions` | sesión → `{ role, permissions }` vigente |
| `GET /admin/roles` | `roles:read` → catálogo fijo de roles/permisos |
| `PATCH /admin/users/:id/role` | `roles:assign` + jerarquía; `{ role, reason }` |
| `POST /admin/subjects` | `subjects:manage`; `{ name, code?, description? }` |
| `PATCH /admin/subjects/:id` | `subjects:manage`; metadatos de materia por UUID |
| `POST /admin/subjects/:id/study-plans` | `subjects:manage`; `{ studyPlanId, year, semester, credits? }` |
| `GET /courses` | público; `{ items, page, limit, total }`, publicados; filtro opcional subjectId |
| `GET /courses/:id` | público; resumen y títulos, sin cuerpos ni archivos |
| `GET /courses/management` | `courses:manage`; todos los estados; declarar antes de `:id` |
| `GET /courses/:id/management` | `courses:manage`; estructura completa y estados de archivos |
| `POST /courses` / `PATCH /courses/:id` | `courses:manage`; creación y metadatos; el estado solo cambia por rutas específicas |
| `POST /courses/:id/publish` / `POST /courses/:id/archive` | `courses:manage`; validar transición |
| `POST /courses/:id/sections` | `courses:manage`; `{ title, position }` |
| `PATCH/DELETE /courses/:id/sections/:sectionId` | `courses:manage` + pertenencia |
| `POST /courses/:id/sections/:sectionId/lessons` | `courses:manage`; `{ title, body?, position }` |
| `PATCH/DELETE /courses/:id/lessons/:lessonId` | `courses:manage` + pertenencia |
| `PUT /courses/:id/enrollment` | `courses:enroll`; idempotente, inscripción propia en publicado |
| `DELETE /courses/:id/enrollment` | sesión; desactivar inscripción propia |
| `PATCH /courses/:id/enrollments/:userId` | `courses:manage`; `{ active }` sobre inscripción existente |
| `GET /courses/:id/lessons/:lessonId` | inscripción activa en publicado o `courses:manage` |
| `POST /courses/:id/lessons/:lessonId/files` | `courses:manage` + `drive:manage`; multipart |
| `POST /courses/:id/lessons/:lessonId/files/import` | mismos permisos; `{ driveFileId, allowDownload }` |
| `DELETE /courses/:id/lessons/:lessonId/files/:fileId` | mismos permisos; desvinculación y limpieza controlada |
| `GET /courses/:id/lessons/:lessonId/files/:fileId/content` | política de la clase; inline por defecto, `download=true` exige allowDownload para estudiantes |
| `GET /admin/drive/files` | `drive:manage`; folderId opcional, pageSize 1–100, pageToken acotado |

Las comprobaciones de pertenencia preceden al acceso a Drive. Ausencia de sesión → 401, acción prohibida por permiso → 403, recurso privado o anidado ajeno → 404, DTO inválido → 400, unicidad/transición concurrente → 409. El catálogo no expone uploaderId, Drive IDs ni rutas. La vista privada de alumno entrega metadatos de archivos con UUID y URL de API, nunca enlaces Drive. La API responde 201 para creaciones y 200 para operaciones idempotentes.

### 5. Drive como infraestructura compartida

Crear `DriveModule` con `DriveService` tipado con `drive_v3.Drive`, inicialización diferida y timeouts. En develop no existe GoogleDriveStorageService ni FILE_STORAGE; se implementa desde esta base. Configuración: `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID` y `GOOGLE_DRIVE_SHARED_DRIVE_ID`. Ausencia total → materias/cursos sin archivos operativos, 503 para archivos de cursos. Configuración parcial o JSON inválido → error al iniciar sin imprimir secretos. Validar IDs con `[A-Za-z0-9_-]+` y longitud acotada.

La cuenta de servicio necesita acceso de escritura a una raíz en una unidad compartida. Verificar raíz, driveId y que no sea pública antes de habilitar cursos; una carpeta heredando acceso anyone/domain no sirve para clases privadas. Usar scope `drive` para navegar/importar archivos preexistentes, condicionado al acceso limitado de la cuenta de servicio a esa unidad. `drive.file` del proveedor original no basta para asumir acceso a archivos preexistentes arbitrarios. Explicar ese alcance en la configuración.

Subida: stream `Readable`, tamaño conocido, tipos admitidos PDF/JPEG/PNG/WebP comprobados por firma y extensión. No se usan los límites de materiales para habilitar videos. `supportsAllDrives` en operaciones compatibles, `includeItemsFromAllDrives` y `corpora=drive`/driveId para listado; `fields` explícitos y nextPageToken. Toda carpeta o archivo importado debe tener ascendencia comprobada hasta la raíz configurada, con límite de profundidad y detección de ciclos; rechazar shortcuts y archivos con ACL pública. No se expone un proxy genérico de Drive.

Los uploads de cursos no crean permisos públicos. Al importar, no se cambian ACLs: se rechaza el archivo si es público. Nunca eliminar un archivo importado ante un fallo. No se incorpora el proveedor público de materiales de main; todos los adjuntos de este cambio son privados.

Streaming: buscar CourseFile READY, validar estructura, inscripción/estado o permiso de gestión y luego `files.get(alt=media)` como stream. Soportar un único Range normalizado tras conocer el tamaño; 206/416 y headers correspondientes. Sanitizar Content-Disposition, forzar MIME confiable, `X-Content-Type-Options: nosniff` y `Cache-Control: private, no-store`; cortar la petición upstream si el cliente se desconecta. No redirigir ni cachear respuestas privadas públicamente.

La creación persiste primero la reserva PENDING. Subida externa y cierre READY no comparten transacción: operationId/appProperties y reconciliador permiten recuperar el estado tras caídas. Persistir códigos de error sanitizados, no mensajes crudos de Google. Si falla el cierre en DB, localizar por operationId y completar o limpiar; un job periódico reintenta PENDING/FAILED con backoff y exclusión entre trabajadores. Para importaciones, completar relación o liberar reserva, sin borrar el origen. No reintentar subidas ciegamente.

Referencias primarias: [subida de archivos](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [unidades compartidas](https://developers.google.com/workspace/drive/api/guides/enable-shareddrives), [autorización NestJS](https://docs.nestjs.com/security/authorization).

## Risks / Trade-offs

- La referencia a Udemy describe la organización educativa → el alcance confirmado incluye materias y cursos; pagos, videos y pantallas siguen fuera de esta primera preparación de backend y necesitan definición propia.
- Lectura de cuenta por solicitud → agrega una consulta; comenzar con la PK indexada y medir antes de introducir caché con revocación.
- Scope Drive amplio → cuenta de servicio dedicada con acceso solo a la unidad requerida; credenciales fuera del repositorio y del cliente.
- Cambios manuales de ACL en Drive → verificar raíz al iniciar y ACL del archivo antes de servir/importar; los administradores del Drive son parte de la frontera de confianza y deben conservar privada la raíz.
- Consistencia DB/Drive → reservas durables y reconciliación; no hay atomicidad distribuida.
- Archivos públicos de materiales existentes → conservan su política; no prometer revocación de sus enlaces mediante la nueva autorización de cursos.
- ADMIN puede gestionar todos los cursos → decisión inicial explícita; delegación docente futura requiere alcance por curso.

## Migration Plan

1. Incorporar el alcance confirmado de materias y cursos y el vocabulario «curso formativo», «clase» e «inscripción» en CONTEXT.md durante la implementación, sin redefinir materia/cursada.
2. Agregar modelos e índices con migración SQL aditiva y constraints READY/driveFileId. Probar sobre esquema vacío y snapshot con usuarios preexistentes. No usar reset sobre una base compartida.
3. Desplegar autorización y DTO de rol. Actualizar consumidores del endpoint para enviar reason. Los tokens existentes siguen autenticando, pero sus roles se releen de la DB.
4. Desplegar módulos con cursos vacíos y Drive sin configurar: debe seguir funcionando la creación de materias y cursos. Crear un SUPERADMIN mediante procedimiento operativo existente si aún no hay uno; nunca insertar credenciales predeterminadas.
5. Configurar cuenta de servicio y unidad compartida; probar con un archivo sintético privado, lectura autorizada, revocación y limpieza. Las pruebas automatizadas usan un proveedor simulado.
6. Validar catálogo, inscripciones, aislamiento entre cursos, auditoría, migración y compatibilidad de autenticación. Documentar configuración y contratos en README_BACKEND, README_DATABASE, README_AUTH y README_DEVOPS.
7. Revisión independiente antes de merge por tocar autenticación/archivos/permisos; archivar OpenSpec solo tras checks aprobados.

Rollback: desactivar las rutas nuevas o volver al backend anterior conservando tablas y archivos privados. No borrar datos ni Drive para revertir. La versión anterior recuperaría el problema de roles del JWT; evaluar ese riesgo antes de retroceder autorización y mantener ese arreglo si es posible.

## Adaptación verificada a develop

Los pasajes iniciales que describen materiales y moderación corresponden a la comparación histórica de main; no son componentes existentes de develop ni se declaran probados. Esta implementación conserva User.id Int, agrega el contexto académico completo y no porta materiales/moderación. Se agregan rutas POST /admin/careers y /admin/study-plans para crear ese contexto, y POST /courses/:id/draft para reorganizar cursos. La ruta administrativa de usuarios sigue recibiendo ID entero. El primer SUPERADMIN se inicializa mediante script operativo auditado, exclusivamente si todavía no existe uno.

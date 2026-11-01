# Tasks

Alcance confirmado por el usuario: creación de materias y cursos con secciones/clases, como base de una plataforma educativa tipo Udemy. Las materias son contexto académico y los cursos pueden vincularse a ellas. Ninguna casilla implica trabajo ya implementado.

## 1. Autorización vigente y permisos

- [x] 1.1 Crear catálogo tipado, matriz de cinco roles, AuthorizationModule y decorador/guard de permisos; verificar con pruebas que USER no administra cursos/Drive, roles desconocidos no autorizan y se exigen todos los permisos declarados.
- [x] 1.2 Leer rol y suspensión vigentes desde Prisma en JwtStrategy; verificar con pruebas de estrategia y e2e que un JWT anterior pierde acceso tras degradación/suspensión y que cuenta inexistente devuelve 401.
- [x] 1.3 Agregar GET /auth/permissions y GET /admin/roles con DTOs Swagger; verificar 401 sin sesión, 403 de USER al catálogo y ausencia de datos ajenos en respuestas.
- [x] 1.4 Registrar matriz, comportamiento de revocación y coexistencia con RolesGuard en README_AUTH; verificar contratos documentados contra las rutas y ejecutar los tests de autenticación/sanciones afectados.

## 2. Administración segura de roles

- [x] 2.1 Agregar RoleChangeAudit y migración aditiva con FKs/índices; verificar migración en PostgreSQL descartable y persistencia del actor/destino sin credenciales.
- [x] 2.2 Reemplazar @Body('role') por DTO con motivo y servicio transaccional; verificar enum inválido, razón vacía/solo espacios, campos extra, destino ausente y rollback cuando falla auditoría.
- [x] 2.3 Implementar jerarquía, prohibición de autocambio y lock transaccional exclusivo; verificar e2e ADMIN→SUPERADMIN denegado y dos cambios concurrentes conservando al menos un SUPERADMIN y revalidando el actor.
- [x] 2.4 Actualizar consumidores existentes y documentación del endpoint para reason; verificar con búsqueda que no quede un llamador antiguo y ejecutar pruebas de contrato sobre el payload nuevo.

## 3. Materias, modelo y estructura de cursos

- [x] 3.1 Registrar el alcance confirmado y curso formativo/clase/inscripción en CONTEXT.md; verificar que materia y reseña de cursada conservan sus definiciones.
- [x] 3.2 Agregar Career, StudyPlan, Subject, StudyPlanSubject, Course, CourseSection, CourseLesson, CourseEnrollment y CourseFile con enums, relaciones e índices del diseño; verificar prisma validate/generate y migración en DB vacía y con usuarios preexistentes, conservando sus IDs enteros.
- [x] 3.3 Implementar CourseModule, DTOs y creación/edición administrativa; verificar 400 para null/valores vacíos, 403 a USER y 404 a materia inexistente, con unitarias y e2e.
- [x] 3.4 Implementar CRUD anidado de secciones/clases con posiciones únicas; verificar 409 por posición duplicada, 404 por padres ajenos y rollback de cambios inválidos.
- [x] 3.5 Implementar publicación/archivo y vistas de gestión; verificar estructura mínima, clases con texto o READY, denegación de cambios que vacían un publicado y ocultamiento de DRAFT/ARCHIVED al público.
- [x] 3.6 Implementar catálogo paginado y resumen con proyecciones públicas; verificar límites, orden estable, filtro por materia y ausencia de texto de clase, archivos e identificadores privados. Documentar rutas y relaciones en README_BACKEND/README_DATABASE.
- [x] 3.7 Incorporar subjects:manage a la matriz e implementar POST/PATCH /admin/subjects en SubjectsModule; verificar permisos, DTO inválido, searchKey normalizada y relaciones académicas nuevas. Documentar los contratos administrativos de materias; no hay recursos/reseñas previos en develop.
- [x] 3.8 Implementar POST /admin/subjects/:id/study-plans reutilizando StudyPlanSubject; verificar 404 de plan/materia ausente, 409 duplicado, validación de año/cuatrimestre/créditos y recorrido crear materia→vincular plan→crear curso asociado.

## 4. Inscripciones y lectura de clases

- [x] 4.1 Implementar autoinscripción idempotente y desinscripción; verificar concurrencia sin duplicados, 404 en cursos no publicados y 403 para VISITOR.
- [x] 4.2 Implementar revocación administrativa sobre inscripción existente; verificar que un estudiante no modifique otra cuenta y que la revocación surta efecto en la siguiente lectura.
- [x] 4.3 Implementar política de acceso a clase por inscripción/gestión y comprobar cadena de padres; verificar e2e dos cursos y dos usuarios, incluyendo 404 sin inscripción y acceso de gestión a borradores.
- [x] 4.4 Documentar acceso gratuito inicial y límites de allowDownload; verificar ejemplos de inscripción/lectura contra contratos Swagger.

## 5. Infraestructura Drive compartida

- [x] 5.1 Crear cliente tipado en DriveModule sobre develop, donde no hay proveedor previo de materiales; verificar autenticación y creación de materias/cursos sin credenciales Google. Regresiones del módulo de materiales de main no aplican a esta rama.
- [x] 5.2 Validar configuración y disponibilidad de raíz privada en unidad compartida; verificar JSON inválido, configuración parcial, raíz pública y falta de credenciales sin exposición de secretos ni registros huérfanos.
- [x] 5.3 Implementar listado paginado y validación de ascendencia acotada; verificar nextPageToken, unidades compartidas, exclusión de trashed/shortcuts y rechazo de ID con comillas o carpeta externa antes de consultar contenido.
- [x] 5.4 Implementar subidas privadas PDF/JPEG/PNG/WebP con límite 25 MiB, firma y streams; verificar archivo vacío, MIME/extensión falsos y ausencia total de permissions.create(anyone) en cursos.
- [x] 5.5 Documentar variables, scope, unidad compartida y acceso de cuenta de servicio en .env.example y README_DEVOPS; verificar ejemplo sin secretos y prueba simulada de configuración completa.

## 6. Archivos de clases y recuperación

- [x] 6.1 Implementar reserva PENDING y carga vinculada a clase con operationId/appProperties; verificar READY solo con driveFileId y unicidad de importación concurrente.
- [x] 6.2 Implementar importación con verificación de formato, raíz y ACL; verificar 404 externo, 409 duplicado y que un fallo de DB nunca borre un archivo importado.
- [x] 6.3 Implementar reconciliador de PENDING/FAILED con backoff y exclusión de trabajadores; simular caída tras subida y pérdida de respuesta, verificando que se localiza por operationId y no se duplican archivos.
- [x] 6.4 Implementar desvinculación DETACHING y limpieza recuperable de uploads propios; verificar que desaparece del acceso inmediatamente, no elimina importados y no invalida una clase publicada sin alternativa.
- [x] 6.5 Implementar streaming por UUID autorizado, Range único y disposición segura; verificar 200/206/416, content type confiable, no-store, descarga deshabilitada y desconexión del cliente.
- [x] 6.6 Mapear fallas Drive a errores sanitizados y documentar los contratos de archivos; verificar 404/416/502/503 y que ningún error/respuesta de alumno incluya secretos, rutas locales o enlaces Drive.

## 7. Integración y revisión

- [x] 7.1 Ejecutar checks de formato/lint sobre archivos afectados, build backend, Jest/Vitest relevantes y suites e2e/migración en PostgreSQL descartable; guardar logs completos ignorados y registrar resumen, duración, código de salida y fallas relevantes.
- [x] 7.2 Probar el recorrido integrado administrador→materia→curso→clase→archivo→inscripción→lectura→revocación con Drive simulado; verificar denegación posterior y compatibilidad con usuarios/autenticación existentes. Moderación/materiales de main no aplican a develop.
- [ ] 7.3 Ejecutar smoke test de Drive real solo con credenciales de entorno de prueba y archivo sintético privado; verificar acceso autorizado, ausencia de ACL pública y limpieza. Si faltan credenciales, registrar explícitamente la validación pendiente.
- [x] 7.4 Ejecutar revisión independiente requerida por el repositorio sobre permisos, archivos y migraciones; resolver hallazgos confirmados y repetir únicamente checks afectados. Verificar informe de revisión y evidencia de correcciones.

## Workflow follow-up

- Archivar el cambio cuando las tareas y revisión estén completas, incorporando sus specs al catálogo principal.
- Antes de merge, cumplir la revisión de otra persona indicada en README_SECURITY; publicar/deployar solo dentro de la autorización recibida.

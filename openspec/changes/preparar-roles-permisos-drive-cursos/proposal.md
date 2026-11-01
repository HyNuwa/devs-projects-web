# Proposal

## Why

El backend de `develop` tiene usuarios y roles básicos, pero no materias, Drive ni cursos con secciones, clases e inscripciones. Preparar esa base permite incorporar la experiencia de DevsProject conservando NestJS, Prisma y los IDs de usuarios existentes.

## What Changes

- Mantener `User.role` y los cinco roles existentes; agregar un catálogo de permisos tipado, una matriz explícita y un guard reutilizable. Validar permisos contra el rol vigente de la base.
- **BREAKING** Validar y auditar cambios de rol, impedir escaladas y proteger al último SUPERADMIN. `PATCH /admin/users/:id/role` exigirá también un motivo y rechazará asignaciones antes permitidas sin jerarquía.
- Incorporar cursos formativos con secciones, clases, archivos privados e inscripciones, con una relación opcional a `Subject`. Una materia sigue siendo una materia; `CourseReview` conserva su significado actual.
- Permitir crear y editar materias con un permiso administrativo propio, y asociarlas a planes de estudio existentes para que puedan organizar recursos y cursos.
- Crear un módulo de Drive: cuenta de servicio, unidades compartidas, archivos privados, paginación y descargas por API con autorización. `develop` no tiene todavía un proveedor de materiales que reutilizar.
- Definir contratos REST, migraciones aditivas, DTOs, pruebas de autorización y guía de configuración, incluyendo comportamiento cuando Drive no está configurado.
- Alcance aclarado por el usuario: una plataforma educativa tipo Udemy que permita crear materias, cursos y su estructura de clases. Materias y cursos son entidades distintas que pueden relacionarse; la referencia orienta la experiencia educativa, sin implicar incorporar todos sus servicios comerciales.

## Capabilities

### New Capabilities

- `security/authorization`: permisos por acción, rol vigente, jerarquía y auditoría administrativa.
- `learning/courses`: creación de materias como contexto académico, catálogo, estructura de cursos, inscripciones y acceso al contenido.
- `integrations/google-drive`: almacenamiento y lectura de archivos con autorización del dominio y consistencia con la base de datos.

### Modified Capabilities

Ninguna. Se conservan las rutas de autenticación existentes y se preparan controles de suspensión/silenciamiento sin portar el sistema de moderación de `main`. Los cursos tienen su propio estado editorial.

## Impact

- Backend: `modules/auth`, `modules/admin`, nuevos módulos `subjects`, `authorization`, `courses` y `drive`; registro en `AppModule`. Carreras y planes también se crean desde esta base inicial.
- Base: nuevas tablas relacionadas por UUID, índices y migraciones Prisma; no se renombran ni eliminan tablas existentes.
- API: nuevas rutas `/api/v1/courses`, `/api/v1/admin/subjects`, `/api/v1/admin/roles`, `/api/v1/auth/permissions`; validación más estricta de `PATCH /admin/users/:id/role`.
- Operación: variables Drive y unidad compartida accesible por la cuenta de servicio; credenciales exclusivamente del servidor. Se utiliza la dependencia `googleapis` ya instalada.
- Frontend: queda preparado el contrato para consumir permisos y cursos; las pantallas de cursos y administración se implementan en un cambio posterior.
- Referencias inspeccionadas: `HyNuwa/devs-projects-web` en `48e0c0f`, `4lexxe/DevsProject` en `6cfcbce`. Se adapta su organización funcional; no se traslada Express/Sequelize ni el sistema de pagos.
- Base definitiva solicitada por el usuario: `HyNuwa/devs-projects-web`, rama `develop`, commit `ed2fc26`. No se integra ni se fusiona `main`.

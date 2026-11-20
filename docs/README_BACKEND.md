# Backend (NestJS)

API REST de DevsProject en `apps/backend`. El vocabulario del dominio está en [`CONTEXT.md`](../CONTEXT.md); la autenticación, en [`README_AUTH.md`](README_AUTH.md).

## Stack

| Tecnología | Uso |
|---|---|
| NestJS 11 + TypeScript 5 | Framework (módulos, DI, guards, pipes) |
| Prisma 7 + `@prisma/adapter-pg` | ORM y migraciones sobre PostgreSQL |
| class-validator / class-transformer | Validación de DTOs (`whitelist` + `forbidNonWhitelisted`) |
| Passport (local + jwt), `@nestjs/jwt`, bcrypt | Autenticación |
| `@nestjs/throttler` | Límite de escrituras de la comunidad (registrado en `SubjectsModule`) |
| helmet, cookie-parser | Cabeceras de seguridad y cookies |
| nodemailer | Mails de verificación y recuperación |
| googleapis | Almacenamiento de archivos en Google Drive |
| sharp | Procesamiento de imágenes (avatares) |
| nestjs-pino | Logging estructurado |
| `@nestjs/swagger` | OpenAPI en `/docs` (fuera de producción) |

`ioredis` figura como dependencia pero no se usa: no hay Redis en el proyecto.

## Estructura

```
apps/backend/
├── prisma/
│   ├── schema.prisma            modelo de datos (ver README_DATABASE.md)
│   ├── migrations/
│   ├── migration-tests/         pruebas de migraciones contra una base real
│   ├── backfills/               scripts de relleno (search keys)
│   └── seed.ts                  datos de ejemplo
└── src/
    ├── main.ts                  prefijo global, helmet, CORS, cookies, Swagger
    ├── app.module.ts            JwtAuthGuard global, pino
    ├── config/                  app, jwt, mail, validación de env, seguridad HTTP
    ├── common/
    │   ├── decorators/          @Public, @Roles
    │   ├── guards/              JwtAuthGuard, RolesGuard, CommunityWriteThrottlerGuard
    │   ├── filters/             filtros globales de excepciones
    │   ├── search/              claves de búsqueda normalizadas
    │   └── validation/          ciclo lectivo
    ├── prisma/                  PrismaService
    └── modules/                 un módulo por área (tabla de abajo)
```

## Módulos y endpoints

Prefijo global `/api/v1`. Todo requiere sesión salvo lo marcado con `@Public()`; Swagger documenta cada contrato.

| Módulo | Rutas | Qué cubre |
|---|---|---|
| `auth` | `POST register, login, verify-email, forgot-password, reset-password, refresh, logout` · `GET me` | Cuentas y sesión |
| `users` | `GET/PATCH me` · `POST me/avatar` · `GET :id` | Perfil propio y perfil público |
| `subjects` | `GET /`, `GET :code` · `GET/POST :code/reviews` · `PUT/DELETE reviews/:id` · `GET/POST :code/exams` · `PUT/DELETE exams/:id` | Materias, reseñas de cursada y experiencias de final |
| `subjects` (moderación comunitaria) | `POST reviews/:id/reports`, `exams/:id/reports` · `GET community/reports` · `GET …/:id/management` · `POST …/:id/moderation/remove` y `restore` | Reportes y retiro reversible de reseñas y experiencias |
| `materials` | `GET/POST /` · `GET mine` · `GET pending` · `GET/PATCH/DELETE :id` · `POST :id/approve`, `reject` · `GET :id/download` · `POST :id/rate` · `GET :id/ratings`, `viewer-state` · `PUT :id/helpfulness`, `saved` | Recursos académicos: subida, vista previa, descarga, «Me sirvió», guardado, valoraciones |
| `discovery` | `GET suggestions` · `GET course-reviews[/:id]`, `exam-experiences[/:id]` · `GET hierarchy/careers`, `careers/:id/years`, `subjects/:id/resource-categories` | Búsqueda, navegación Universidad → Carrera → Año → Materia |
| `discovery` (Experiencias) | `GET experiences/overview?facultyId&careerId&year&kind` · `GET subjects/:code/experiences-summary` · `GET subjects/:code/exam-topics` · `GET course-reviews/:id/related`, `exam-experiences/:id/related` | Lecturas públicas de Experiencias: materias más comentadas y recién publicadas, resumen por materia, temas sugeridos para el formulario de final y otras experiencias con el mismo contexto. `GET course-reviews` también filtra por `shift` y `condition` |
| `ranking` | `GET /`, `me`, `levels`, `top` | Puntos y niveles |
| `admin` | `GET users`, `users/:id`, `stats` · `PATCH users/:id/role` | Administración (ADMIN, SUPERADMIN) |
| `mail` | — | Servicio interno de envío |
| `guides`, `professors` | CRUD | **Heredados.** El producto ya no incluye guías ni profesores; no construir sobre ellos. |

### Reseñas y experiencias de final: contrato de escritura

`POST :code/reviews` y `PUT reviews/:id` usan el mismo DTO (`CreateCourseReviewDto`); `POST :code/exams` y `PUT exams/:id`, también (`CreateExamExperienceDto`). Por eso una edición pide los mismos campos obligatorios que una publicación nueva. Los rangos viven en los DTOs y los validadores en `subjects/dto/community-write.validators.ts`.

| Entrada | Obligatorio | Opcional |
|---|---|---|
| Reseña | ciclo lectivo, recomendación 1–5, resultado (`PROMO`, `REGULAR`, `LIBRE`), situación de cursada, relato de 30 a 4.000 caracteres | profesor (del catálogo o nombre manual, no ambos), franja, dificultad, `promotionGrade` 1–10 |
| Final | año, período, formato, `outcome` (`APROBADO`, `DESAPROBADO`, `PREFIERO_NO_DECIR`), relato de 30 a 4.000 caracteres | examinador, `difficultyTheory` y `difficultyPractice` 1–5, `boardSize` 1–10, `durationMinutes` 10–480, `prepLeadDays` 1–365, `prepDailyMinutes` 30–960 en pasos de 30, `topics` |

- `promotionGrade` solo se acepta con resultado `PROMO`; con `REGULAR` o `LIBRE` da 400. Si no se manda, se guarda vacío, también al editar.
- `grade` (entero 0–10) es obligatoria con `APROBADO` o `DESAPROBADO` y se rechaza con `PREFIERO_NO_DECIR`. La nota nunca infiere el resultado.
- `topics`: hasta 10. Se recortan, se colapsan los espacios y se quitan los repetidos sin distinguir mayúsculas ni espacios, conservando la primera escritura; después se valida que cada tema tenga de 2 a 60 caracteres.
- `examDate`, `shift` y `difficulty` ya no forman parte del DTO de final: con `whitelist` + `forbidNonWhitelisted`, mandarlos da 400. El servicio nunca los escribe, así que un final viejo los conserva al editarlo.
- Al editar un final, cada dato nuevo que no se declara se guarda vacío (`null`, o `[]` para los temas): la edición borra lo que el autor sacó.

### Lecturas de Experiencias

- **Detalle y listados.** Las reseñas traen `promotionGrade` (o `null`). Los finales traen `difficultyTheory`, `difficultyPractice`, `boardSize` y `durationMinutes` cuando se declararon, y la fecha, la franja y la dificultad verbal heredadas si las tienen. El detalle de un final suma `prepLeadDays`, `prepDailyMinutes`, `estimatedStudyHours` (`round(días × minutos / 60)`, solo con ambos datos) y `topics`.
- **Resumen** (`GET subjects/:code/experiences-summary`). Además de los conteos, los promedios y la mesa más comentada, trae:
  - `reviews.promotionGrade`: `average` (desde 5 notas), `informed` y `promoted` (reseñas con `PROMO`).
  - `exams.topSession.boardSize` y `exams.topSession.duration`: medianas de profesores y minutos de la mesa más comentada, desde 3 respuestas.
  - `exams.preparation.leadDays` y `exams.preparation.dailyMinutes`: medianas desde 3 respuestas.
  - `exams.topics`: hasta 5 temas que aparecen en al menos 2 finales públicos.

  Debajo del mínimo, la mediana o el promedio vienen en `null` con su `count`. La mediana de una cantidad par toma el valor del medio inferior.
- **Temas sugeridos** (`GET subjects/:code/exam-topics`, público). Hasta 20 temas de al menos 2 finales públicos distintos de la materia, ordenados por cantidad y después por nombre, comparando sin mayúsculas. Un código desconocido da 404.
- **Portada** (`GET experiences/overview`). Con `kind=exams`, cada materia más comentada trae `theory` y `practice` (promedio en `null` por debajo de 3) y no trae `topDifficulty`. Los otros tipos mantienen `topDifficulty`, calculado sobre las reseñas.

### Almacenamiento de archivos

`FileStorageService` abstrae el proveedor: disco local (staging privado y luego publicación) o Google Drive, que además permite importar una carpeta existente. Las descargas pasan por `GET materials/:id/download`.

## Puntos (estado actual vs. especificación)

La especificación está en [`README_PUNTOS_E_INSIGNIAS.md`](README_PUNTOS_E_INSIGNIAS.md). El código (`modules/ranking/point.service.ts`, `rpg-levels.ts`) todavía refleja el modelo anterior:

| Tema | Código hoy | Especificación |
|---|---|---|
| Material | +10 al **aprobar** (`MATERIAL_APPROVED`) | Al publicar (`MATERIAL_PUBLISHED`), se revierte al retirar |
| Reseña / experiencia | +5 siempre | Sin puntos si es anónima |
| Guía | +15 (`GUIDE_CREATED`) | Sin guías |
| Niveles | Viajero Novato … Leyenda Eterna (0–12000) | Primeros pasos … Leyenda de la facultad (0–4500) |
| Insignias | Tablas `Badge` y `UserBadge` vacías, sin lógica | Catálogo completo en el documento |

## Moderación (estado actual vs. especificación)

La especificación está en [`README_MODERACION.md`](README_MODERACION.md) y el [ADR 0001](adr/0001-publicacion-inmediata-con-moderacion-posterior.md). Hoy:

- Los materiales esperan aprobación (`pending` → `approve`/`reject`). La especificación pide publicación inmediata con revisión previa solo en casos de riesgo.
- Las reseñas y experiencias ya se publican al instante y se pueden reportar, retirar y restaurar.
- Faltan casos agrupados, ocultamiento preventivo, sanciones, apelaciones, alcance por facultad y registro de «Ver autor».

## Convenciones

- Un módulo por área: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/`, tests `*.spec.ts` junto al código.
- DTOs con class-validator y decoradores de Swagger (`@ApiTags`, `@ApiOperation`, `@ApiResponse`).
- Los permisos se declaran en el controlador (`@Public()`, `@Roles()`), no dentro del servicio.
- Cambios en el esquema: ver [`README_DATABASE.md`](README_DATABASE.md). Tests: [`README_TESTING.md`](README_TESTING.md).

## Scripts

| Comando (`pnpm --filter backend …`) | Qué hace |
|---|---|
| `start:dev` | Servidor con recarga |
| `build`, `start:prod` | Compilar y correr `dist/` |
| `lint`, `format` | ESLint y Prettier |
| `test`, `test:e2e`, `test:cov` | Jest unitario, e2e y cobertura |
| `test:migration:*`, `test:integration:material-ranking` | Pruebas de migraciones e integración contra Postgres |
| `backfill:search-keys` | Recalcula claves de búsqueda |

# Testing

Cómo se testea cada app y qué se espera de un cambio. Para salidas largas, seguir la regla de [`AGENTS.md`](../AGENTS.md): guardar el log completo en un archivo ignorado y reportar solo el resumen.

## Stack

| App | Herramientas | Dónde están los tests |
|---|---|---|
| Backend: tests nuevos | Vitest (SWC) + `@nestjs/testing` + Supertest | `src/**/*.test.ts` junto al código; e2e en `test/*.e2e.test.ts` |
| Backend: tests anteriores | Jest + `@nestjs/testing` + Supertest | `src/**/*.spec.ts` junto al código, `test/*.e2e-spec.ts` |
| Backend: migraciones | Vitest (`vitest.migration.config.ts`) y scripts tsx contra un Postgres real | `prisma/migration-tests/*.ts` |
| Frontend | Vitest + Testing Library (jsdom) | `src/**/*.test.ts(x)` junto al código; setup en `src/test/setup.ts` |

Los tests nuevos del backend se escriben en Vitest; los de Jest se mantienen hasta migrarlos. Vitest corre `*.test.ts` y Jest `*.spec.ts`, así que no se pisan.

Los e2e de Vitest levantan la API completa (`test/support/e2e-app.ts`) contra su propia base, `<base de DATABASE_URL>_e2e` (o `E2E_DATABASE_URL`), que crea `test/support/e2e-global-setup.ts`. Corren de a un archivo por vez (`fileParallelism: false`).

No hay tests E2E de navegador (Playwright) ni CI todavía.

## Qué cubre hoy

**Backend (44 archivos Jest, 26 Vitest unit y 16 Vitest e2e)**

- Auth y guards.
- Materiales: servicio, controlador, API anónima y consulta de ranking.
- Discovery: sugerencias, jerarquía, reseñas y finales.
- Reseñas y experiencias: escrituras con límite de frecuencia.
- Moderación comunitaria: controlador y servicio.
- Puntos y ranking.
- Seguridad HTTP, filtros de excepciones y claves de búsqueda.
- Límites de frecuencia (memoria y Redis).
- Moderación: casos, decisiones, sanciones, apelaciones, historial, pestaña Usuarios.
- Anonimato frente a moderadores: ningún canal revela al autor de una publicación anónima (`auth-enumeration`, `anonymous-decision-traces`, `history-anonymity`, `case-warn-suggestion`, `moderation-users`, `appeals-review`).
- Credenciales que no revelan cuentas y logs de autenticación sin emails.

**Migraciones.** `material-context`, `community-evidence` y `community-moderation` verifican que la migración transforme bien los datos existentes. Cada prueba crea un schema temporal en la base de `MIGRATION_TEST_DATABASE_URL` (o `DATABASE_URL`).

**Frontend (~36 archivos).**

- Formularios de auth.
- `lib/api.ts` y la ruta de retorno tras login.
- Clientes de reportes y gestión de la comunidad.
- Estado de descubrimiento, componentes de materiales y de materias.
- Tokens del sistema visual.

## Comandos

```bash
pnpm --filter backend test                     # Jest unit + integración
pnpm --filter backend test:e2e                 # Jest e2e
pnpm --filter backend test:vitest              # Vitest unit
pnpm --filter backend test:vitest:e2e          # Vitest e2e (requiere Postgres)
pnpm --filter backend test:vitest:migration    # requiere Postgres
pnpm --filter backend test:all                 # Jest y Vitest, unit y e2e
pnpm --filter backend test:cov
pnpm --filter backend test:migration:community-moderation   # requiere Postgres
pnpm --filter backend test:integration:material-ranking     # requiere Postgres

pnpm --filter frontend test
pnpm --filter frontend verify:design-tokens    # y los demás verify:*
```

## Qué se espera de un cambio

- **Lógica nueva en un servicio:** tests unitarios con Prisma simulado, que cubran el caso feliz, los permisos (403 al tocar algo ajeno) y la validación.
- **Endpoint nuevo:** test de controlador o de API con Supertest, que verifique `@Public()`/`@Roles()` y el formato de respuesta.
- **Migración que mueve datos:** una prueba en `prisma/migration-tests/` y su script `test:migration:<nombre>`.
- **Componente con comportamiento:** test con Testing Library, que pruebe estados de carga, error y vacío.
- Nombres de `describe`/`it` descriptivos, en el idioma del archivo vecino: hoy conviven tests en español y en inglés (con los términos del dominio en español, como «caso» o «retiro»). Se testea el comportamiento, no la implementación interna.
- **Cambio que toca anonimato:** un e2e que compare lo que ve un `MODERATOR` antes y después de decidir sobre contenido anónimo, para todo canal que muestre datos de una cuenta.

## Próximos casos importantes

Salen de las especificaciones y todavía no tienen tests porque no están implementados:

| Área | Casos |
|---|---|
| [Moderación](README_MODERACION.md) | 3 reportes en 48 h ocultan el contenido; 1 reporte por datos personales lo oculta al instante; se reabre a los 7 días sin resolución; un moderador no ve otra facultad; «Ver autor» sin motivo falla; la apelación la revisa otra persona; solo ADMIN suspende |
| [Puntos](README_PUNTOS_E_INSIGNIAS.md) | Puntos al publicar y reversión al retirar; anónimo no suma; cambio de nivel en cada umbral; insignia otorgada una sola vez |
| Auth | Refresh automático en el frontend; rate limit de login |

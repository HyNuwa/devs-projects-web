# Infraestructura y despliegue

> **Estado: plan, sin implementar.** No hay Docker, CI ni servidor. Hoy el proyecto corre solo en local (ver el [README](../README.md)). Este documento describe hacia dónde ir.

## Qué hay hoy

| Pieza | Estado |
|---|---|
| Monorepo pnpm (`apps/frontend`, `apps/backend`) | ✅ |
| `.env.example` del backend | ✅ |
| husky + lint-staged (ESLint y Prettier en pre-commit) | ✅ |
| Mails | SMTP configurable (`SMTP_*`); en local, un servidor de prueba en el puerto 1025 |
| Archivos | Disco local o Google Drive según `FILE_STORAGE` (`FileStorageService`) |
| Docker, CI, servidor, backups, monitoreo | ⬜ |

## Arquitectura propuesta

Un VPS con Docker Compose:

```
Nginx (:80/:443, TLS con Let's Encrypt)
 ├── frontend   Next.js    (:3000)
 └── backend    NestJS     (:3001, prefijo /api/v1)
       ├── postgres        (:5432, volumen pg_data)
       ├── redis           (:6379, solo red interna; límites de frecuencia)
       └── uploads         (volumen, si no se usa Drive)
```

**Redis** guarda solo los contadores de los límites de frecuencia (login, registro, recuperación, apelación desde el ingreso y escrituras de la comunidad); consume muy poca memoria. Sesiones y tokens siguen en Postgres. Ver `README_SECURITY.md`, «Límites de frecuencia».

Variables obligatorias en producción, además de las actuales: `REDIS_URL`, `RATE_LIMIT_SECRET` (al menos 32 caracteres, por ejemplo `openssl rand -hex 32`) y `TRUST_PROXY=1` (la API corre detrás de Nginx). La API no arranca sin las dos primeras.

**Monitoreo**: `GET /api/v1/health` es público y responde `{ status: 'ok' | 'degraded', rateLimiter: 'redis' | 'memory' | 'memory-fallback' }`. `degraded` significa que Redis no responde y los límites corren en memoria de cada instancia.

- Servidor: 2 vCPU, 4 GB de RAM (8 GB recomendados), 40 GB de SSD, Ubuntu LTS.
- Endurecimiento: usuario sin root, SSH solo con clave, UFW con los puertos 22, 80 y 443, swap de 2 GB y logrotate.
- Dominios: uno para el frontend y otro (o una ruta) para la API.

## CI/CD propuesto (GitHub Actions)

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `ci.yml` | Cada PR | `pnpm install`, lint, typecheck y tests de ambas apps; pruebas de migración con un Postgres de servicio |
| `deploy-staging.yml` | Merge a `develop` | Construir imágenes y desplegar en staging |
| `deploy-production.yml` | Merge a `main` (o manual) | Desplegar en producción y correr `prisma migrate deploy` |

## Backups

| Qué | Frecuencia | Retención | Destino |
|---|---|---|---|
| PostgreSQL (`pg_dump`, cifrado) | Diario | 7 diarios + 4 semanales | Almacenamiento externo (S3 o B2) |
| Uploads locales | Semanal | 4 semanas | Ídem |
| Configuración | En Git | — | GitHub |

La retención de datos de moderación (reportes, registros de «Ver autor») está en [`README_MODERACION.md`](README_MODERACION.md) §14. Los backups no deben guardar esos datos más tiempo del definido allí.

## Monitoreo

- Uptime Kuma para disponibilidad.
- Sentry (plan gratuito) para errores de frontend y backend.
- Logs de pino (JSON) con rotación.

## Secretos

Las credenciales de producción (`DATABASE_URL`, `JWT_SECRET`, `SMTP_USER`/`SMTP_PASS`, `GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON`) nunca van al repositorio: GitHub Secrets para CI y un `.env` protegido en el servidor.

## Orden sugerido

1. `ci.yml` con lint y tests: es lo que más protege hoy, aun sin servidor.
2. Dockerfiles y `docker-compose.yml` para desarrollo local.
3. VPS, Nginx y TLS.
4. Deploy a staging y a producción.
5. Backups, monitoreo, Dependabot.

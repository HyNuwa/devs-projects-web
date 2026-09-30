# Seguridad

Qué protege hoy la plataforma y qué falta. Referencia: OWASP Top 10. Detalle de sesiones en [`README_AUTH.md`](README_AUTH.md); reglas de moderación y privacidad en [`README_MODERACION.md`](README_MODERACION.md).

Estado: ✅ hecho · 🟡 parcial · ⬜ pendiente.

## Autenticación y sesiones

| Medida | Estado | Detalle |
|---|---|---|
| Contraseñas con bcrypt (12 rondas) | ✅ | `auth.service.ts` |
| Política de contraseña | ✅ | 8+ caracteres, mayúscula, número y carácter especial (DTO + zod) |
| JWT corto en cookie httpOnly | ✅ | 15 min, `SameSite=Lax`, `Secure` en producción |
| Refresh token rotativo en base | ✅ | 7 días, hasheado, se rota y se revoca en logout y reset |
| Verificación de email / reset de contraseña | ✅ | Tokens de un solo uso, 24 h y 1 h; forgot-password no revela si el email existe |
| Refresh automático en el frontend | ⬜ | Hoy un 401 manda al login (ver README_AUTH) |
| Rate limit en login, registro y forgot-password | ⬜ | Decidido (cambio `moderacion-ajustes`): login 5 fallidos / 15 min por email + IP y 20 / 15 min por IP (un ingreso correcto reinicia solo el de email + IP); registro 3 / hora por IP; recuperación 3 / hora por email y 3 / hora por IP, exista o no la cuenta; «Apelar esta suspensión» 5 / 15 min por email + IP. Respuesta 429 con `Retry-After`. Ver «Límites de frecuencia» |
| Bloqueo por intentos fallidos | ⬜ | Propuesta: 5 intentos fallidos bloquean 15 min |

## API

| Medida | Estado | Detalle |
|---|---|---|
| Validación de entrada | ✅ | `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`; zod en formularios |
| SQL injection | ✅ | Prisma (consultas parametrizadas) |
| Helmet | ✅ | `config/http-security.ts`, configuración por defecto |
| CORS con lista de orígenes | ✅ | `CORS_ORIGIN` separado por comas, `credentials: true` |
| Rate limit de escrituras de la comunidad | ✅ | 6 por minuto por usuario (`COMMUNITY_WRITE_RATE_LIMIT`, `…_TTL_MS`) en reseñas, experiencias y reportes. Pasa al mismo limitador en Redis que auth (cambio `moderacion-ajustes`) |
| Rate limit general y de subidas | ⬜ | Sin límite en `POST /materials` ni en lecturas |
| CSP propia | ⬜ | Solo la que trae helmet por defecto; revisar para el frontend |
| Swagger fuera de producción | ✅ | `/docs` solo si `NODE_ENV !== production` |
| Logs sin secretos | ✅ | pino redacta `authorization` y `cookie` |

## Autorización

| Medida | Estado | Detalle |
|---|---|---|
| RBAC | ✅ | `RolesGuard` + `@Roles()`; `JwtAuthGuard` global con `@Public()` explícito |
| Chequeo de dueño | ✅ | Editar o borrar reseñas, experiencias y materiales exige ser autor |
| Registro de acciones de moderación | 🟡 | `ModerationLog` (materiales) y `CommunityModerationAction` (reseñas y experiencias); falta el historial unificado |
| Alcance por facultad para moderadores | ⬜ | Especificado en README_MODERACION |
| «Ver autor» con motivo registrado | ⬜ | Especificado en README_MODERACION |

## Archivos

| Medida | Estado | Detalle |
|---|---|---|
| Lista blanca de extensiones | ✅ | `ALLOWED_EXTENSIONS` en `file-storage.service.ts` |
| Tamaño máximo | ✅ | 25 MB |
| Verificación del tipo real (magic bytes) | ⬜ | Hoy solo se mira la extensión |
| Staging privado antes de publicar | ✅ | El archivo local queda fuera de `public/` hasta publicarse |
| Escaneo de malware | ⬜ | Evaluar antes de abrir la subida a todos |

## Privacidad

| Medida | Estado | Detalle |
|---|---|---|
| Nunca devolver `passwordHash` | ✅ | DTOs de respuesta |
| Publicación anónima | ✅ | La API pública muestra «Anónimo»; el autor solo lo ven los moderadores |
| Anónimos no suman puntos | ⬜ | Hoy suman (ver README_BACKEND) |
| Retención de reportes y registros | ⬜ | Plazos definidos en README_MODERACION §14 |
| Eliminación de cuenta | ⬜ | Borrado o anonimización de datos personales |
| Términos y privacidad | 🟡 | Borrador en el canvas (Ayuda → Términos); requiere revisión legal (Ley 25.326) |

## Dependencias e infraestructura

| Medida | Estado | Detalle |
|---|---|---|
| Lockfiles | ✅ | `pnpm-lock.yaml` |
| Hooks de pre-commit | ✅ | husky + lint-staged (ESLint y Prettier) |
| Auditoría de dependencias | ⬜ | Sin Dependabot ni `pnpm audit` en CI (no hay CI) |
| HTTPS, backups cifrados | ⬜ | Ver [`README_DEVOPS.md`](README_DEVOPS.md) |

## Regla de revisión

Todo cambio que toque autenticación, subida de archivos, permisos o datos personales necesita que otra persona lo revise antes de entrar a `main`.

## Límites de frecuencia

Decisiones del cambio `moderacion-ajustes`:

- **Un solo limitador** para auth, apelación desde el ingreso y escrituras de la comunidad.
- **Redis** cuando hay `REDIS_URL`; en memoria cuando no (desarrollo y tests). En producción la API no arranca sin `REDIS_URL` ni `RATE_LIMIT_SECRET` (`env.validation.ts`).
- **Ventana fija**: incrementar, fijar la expiración en el primer hit y leer contador y TTL en una sola operación atómica (script Lua). La versión en memoria reproduce la misma semántica. `Retry-After` sale del TTL restante.
- **Claves**: `login:<emailHmac>:<ip>`, `login-ip:<ip>`, `signup:<ip>`, `recovery:<emailHmac>`, `recovery-ip:<ip>`, más las de apelación y comunidad. `emailHmac` es `HMAC_SHA256(RATE_LIMIT_SECRET, email.trim().toLowerCase())`: Redis nunca guarda emails. Sin normalizaciones por proveedor.
- **Redis caído**: se usa el limitador en memoria (por instancia) en vez de dejar pasar todo; se registra un `error` al degradarse y un `info` al recuperarse, una vez por transición. `GET /health` informa `status` (`ok` | `degraded`) y `rateLimiter` (`redis` | `memory` | `memory-fallback`).
- **IP real**: `TRUST_PROXY` (desactivado por defecto). Detrás de Nginx se configura `TRUST_PROXY=1`; sin proxy no se confía en `X-Forwarded-For`, que permitiría falsear la IP.
- **Mensaje**: «Demasiados intentos. Probá de nuevo en X minutos», que los formularios existentes ya muestran.


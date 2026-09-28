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
| Rate limit en login, registro y forgot-password | ⬜ | Propuesta: 5 / 15 min en login, 3 / hora en registro y recuperación |
| Bloqueo por intentos fallidos | ⬜ | Propuesta: 5 intentos fallidos bloquean 15 min |

## API

| Medida | Estado | Detalle |
|---|---|---|
| Validación de entrada | ✅ | `ValidationPipe` con `whitelist` y `forbidNonWhitelisted`; zod en formularios |
| SQL injection | ✅ | Prisma (consultas parametrizadas) |
| Helmet | ✅ | `config/http-security.ts`, configuración por defecto |
| CORS con lista de orígenes | ✅ | `CORS_ORIGIN` separado por comas, `credentials: true` |
| Rate limit de escrituras de la comunidad | ✅ | 6 por minuto por defecto (`COMMUNITY_WRITE_RATE_LIMIT`, `…_TTL_MS`) en reseñas, experiencias y reportes |
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

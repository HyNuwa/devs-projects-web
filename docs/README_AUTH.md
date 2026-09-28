# Autenticación y autorización

Cómo se registra, se identifica y se autoriza a una persona en DevsProject. Los permisos de moderación se detallan en [`README_MODERACION.md`](README_MODERACION.md).

---

## Resumen

- Sesión con **dos cookies httpOnly**: `access_token` (JWT, 15 min, `path=/`) y `refresh_token` (7 días, `path=/api/v1/auth/refresh`).
- Los refresh tokens se guardan **hasheados** (SHA‑256) en la tabla `RefreshToken`. Se rotan en cada refresh y se borran al cerrar sesión o al cambiar la contraseña.
- Contraseñas con bcrypt, 12 rondas.
- Verificación de email con un token de un solo uso válido 24 h. Recuperación de contraseña con un token válido 1 h.
- `JwtAuthGuard` es global: toda ruta requiere sesión salvo las marcadas con `@Public()`. `RolesGuard` + `@Roles()` restringen por rol.

---

## Flujos

### Registro

```
POST /api/v1/auth/register  { username, email, password }
  → RegisterDto (class-validator: 8+ caracteres, mayúscula, número y carácter especial)
  → AuthService.register()
      ├── valida que username y email no existan
      ├── bcrypt.hash(password, 12)
      ├── crea User (role USER, emailVerified false)
      ├── crea EmailVerification (token hasheado, vence en 24 h) y envía el mail
      └── emite access + refresh token
  → setea las dos cookies y responde { user }
```

### Login

```
POST /api/v1/auth/login  { email, password }
  → LocalStrategy → AuthService.validateUser()   (401 «Credenciales inválidas»)
  → emite access + refresh token → cookies → { user }
```

El login **no exige** email verificado. Qué acciones requieren verificación es una decisión pendiente (ver «Pendiente»).

### Refresh

```
POST /api/v1/auth/refresh        (cookie refresh_token)
  → busca el hash en RefreshToken
      ├── no existe → 401 «Refresh token inválido»
      ├── vencido   → se borra → 401 «Refresh token expirado»
  → borra el token usado y emite un par nuevo (rotación) → cookies → { user }
```

**Hoy el frontend no llama a este endpoint.** El interceptor de `lib/api.ts` redirige al login ante un 401 (salvo en rutas `/auth/*` y en lecturas en segundo plano marcadas con `skipAuthRedirect`), así que la sesión se corta a los 15 min aunque el refresh token siga vigente.

### Verificación de email y recuperación de contraseña

| Endpoint | Qué hace |
|---|---|
| `POST /auth/verify-email` `{ token }` | Marca `emailVerified = true` si el token existe y no venció (24 h). |
| `POST /auth/forgot-password` `{ email }` | Crea un `PasswordResetRequest` (1 h) y envía el enlace. Responde lo mismo exista o no el email. |
| `POST /auth/reset-password` `{ token, password }` | Cambia la contraseña y **revoca todos los refresh tokens** de la cuenta. |

Los mails salen por el módulo `mail` (config en `config/mail.config.ts`).

### Sesión y logout

- `GET /auth/me` devuelve el perfil (`UserResponseDto`).
- `POST /auth/logout` borra el refresh token de la base y limpia ambas cookies.

---

## Roles

Enum `Role` en `prisma/schema.prisma`.

| Rol | Uso actual en el código | Según el diseño de moderación |
|---|---|---|
| `VISITOR` | Sin uso (reservado) | — |
| `USER` | Rol por defecto al registrarse | Publica, reporta, apela |
| `MODERATOR` | Aprobar/rechazar materiales (`materials/pending`, `approve`, `reject`) y retirar/restaurar reseñas y experiencias (`community-moderation`) | Resuelve casos de su facultad, advierte y silencia 7 días; no suspende |
| `ADMIN` | `admin/*`, alta/edición de profesores, más todo lo de `MODERATOR` | Suspende, nombra moderadores y organizadores verificados, ve todas las facultades |
| `SUPERADMIN` | Igual que `ADMIN` | Igual que `ADMIN` |

> Con la publicación inmediata ([ADR 0001](adr/0001-publicacion-inmediata-con-moderacion-posterior.md)) los endpoints de aprobación de materiales quedan solo para los casos de revisión previa. El alcance por facultad todavía no existe en el esquema.

```typescript
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController { ... }
```

---

## Guards y decoradores

| Pieza | Archivo | Qué hace |
|---|---|---|
| `JwtAuthGuard` | `src/common/guards/jwt-auth.guard.ts` | Global (`APP_GUARD`). Lee el JWT de la cookie `access_token` o del header `Authorization: Bearer`. |
| `@Public()` | `src/common/decorators/public.decorator.ts` | Saltea el guard global. |
| `RolesGuard` + `@Roles()` | `src/common/guards/roles.guard.ts`, `src/common/decorators/roles.decorator.ts` | Compara `request.user.role`; si no coincide, 403. Se aplica por controlador o por ruta. |
| `CommunityWriteThrottlerGuard` | `src/common/guards/community-write-throttler.guard.ts` | Limita la frecuencia al crear o editar reseñas y experiencias de final y al reportarlas. |

---

## Endpoints

Prefijo `/api/v1`.

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/auth/register` | Público |
| POST | `/auth/login` | Público |
| POST | `/auth/verify-email` | Público |
| POST | `/auth/forgot-password` | Público |
| POST | `/auth/reset-password` | Público |
| POST | `/auth/refresh` | Público (usa la cookie de refresh) |
| GET | `/auth/me` | Sesión |
| POST | `/auth/logout` | Sesión |
| GET | `/admin/users`, `/admin/users/:id` | ADMIN, SUPERADMIN |
| PATCH | `/admin/users/:id/role` | ADMIN, SUPERADMIN |
| GET | `/admin/stats` | ADMIN, SUPERADMIN |

---

## Archivos

```
apps/backend/src/
├── config/jwt.config.ts, env.validation.ts     JWT_SECRET, JWT_EXPIRATION (900 s)
├── common/decorators/                          @Public, @Roles
├── common/guards/                              JwtAuthGuard, RolesGuard, throttler de comunidad
└── modules/auth/
    ├── auth.controller.ts                      endpoints y cookies
    ├── auth.service.ts                         tokens, verificación, reset
    ├── dto/                                    register, login, auth-actions, auth-response
    └── strategies/                             local.strategy, jwt.strategy

apps/frontend/src/
├── lib/api.ts                                  axios withCredentials + redirección al login en 401
├── stores/authStore.ts                         zustand: login, register, logout, checkAuth
├── components/auth/                            LoginForm, RegisterForm, ForgotPasswordForm,
│                                               ResetPasswordForm, VerifyEmail, AuthGuard, AuthInitializer
├── app/(auth)/auth/                            login, register, verify-email, forgot-password, reset-password
└── proxy.ts                                    protección de rutas del lado del servidor (Next.js 16)
```

---

## Pendiente

| Medida | Detalle |
|---|---|
| Refresh en el frontend | Reintentar con `POST /auth/refresh` ante un 401 antes de mandar al login. |
| Rate limit en auth | Hoy el throttler solo cubre escrituras de la comunidad. Falta limitar login, register y forgot-password. |
| Bloqueo por intentos fallidos | Por ejemplo, 5 intentos fallidos bloquean 15 min. |
| Qué exige email verificado | Decidir si publicar o reportar requiere cuenta verificada. |
| Alcance por facultad para moderadores | Lo pide [`README_MODERACION.md`](README_MODERACION.md); el esquema no lo modela. |
| Sanciones | Silenciar y suspender no existen todavía; un usuario suspendido debería perder la sesión (borrar sus refresh tokens). |

---

## Cómo probar

Swagger en `http://localhost:3001/docs` (fuera de producción).

```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"StrongP@ss1"}' -c cookies.txt

curl http://localhost:3001/api/v1/auth/me -b cookies.txt
curl -X POST http://localhost:3001/api/v1/auth/logout -b cookies.txt
```

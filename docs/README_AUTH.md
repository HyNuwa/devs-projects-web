# Sistema de Autenticación y Autorización

> Documentación completa del flujo de auth basado en roles implementado en devs-projects.

---

## Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌────────────┐  │
│  │LoginForm │   │RegisterForm│  │AuthGuard  │   │useAuthStore│  │
│  │/Register │   │           │   │(wrapper)  │   │(zustand)   │  │
│  └────┬─────┘   └─────┬─────┘   └─────┬─────┘   └─────┬──────┘  │
│       │               │               │               │         │
│       └───────────────┴───────┬───────┴───────────────┘         │
│                               │                                  │
│                      ┌────────┴────────┐                        │
│                      │    api.ts        │  axios + withCreds     │
│                      │ (lib/api.ts)     │                        │
│                      └────────┬────────┘                        │
│                               │ cookies httpOnly                 │
├───────────────────────────────┼──────────────────────────────────┤
│                        BACKEND (NestJS)                          │
│                               │                                  │
│                      ┌────────┴────────┐                        │
│                      │  cookie-parser   │                        │
│                      └────────┬────────┘                        │
│                               │                                  │
│              ┌────────────────┼────────────────┐                │
│              ▼                ▼                ▼                │
│         @Public()       JwtAuthGuard      RolesGuard            │
│         (sin token)     (requiere JWT)    (requiere rol)        │
│              │                │                │                │
│              ▼                ▼                ▼                │
│     auth/register       auth/me          admin/*                │
│     auth/login          auth/logout                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Estrategias Passport                     │   │
│  │  LocalStrategy (email + password)                         │   │
│  │  JwtStrategy   (cookie httpOnly + Bearer header)          │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Flujo de Autenticación

### Registro

```
POST /api/v1/auth/register  { username, email, password }
         │
         ▼
  RegisterDto → class-validator (password: 8+ chars, mayúscula, número, especial)
         │
         ▼
  AuthService.register()
    ├── Verifica unicidad de username y email
    ├── bcrypt.hash(password, 12 rounds) → passwordHash
    ├── Prisma user.create() → User (role: USER por defecto)
    ├── jwtService.sign({ sub, email, role }) → accessToken (15 min)
    └── Retorna { accessToken, user }
         │
         ▼
  AuthController → res.cookie('access_token', ..., httpOnly, SameSite=Lax)
         │
         ▼
  Response: { user } + cookie httpOnly con JWT
```

### Login

```
POST /api/v1/auth/login  { email, password }
         │
         ▼
  @UseGuards(AuthGuard('local'))  →  LocalStrategy
         │
         ▼
  AuthService.validateUser(email, password)
    ├── Prisma user.findUnique({ email })
    ├── bcrypt.compare(password, passwordHash)
    └── Retorna user (sin passwordHash) o null → 401
         │
         ▼
  AuthService.login(user)
    ├── jwtService.sign({ sub, email, role })
    └── Retorna { accessToken, user }
         │
         ▼
  AuthController → res.cookie('access_token', ...)
         │
         ▼
  Response: { user } + cookie httpOnly con JWT
```

### Sesión (checkAuth / me)

```
GET /api/v1/auth/me
         │
         ▼
  JwtAuthGuard (global)
    ├── ¿@Public()? → OK sin token
    └── Extrae JWT de cookie httpOnly (o Bearer header)
         │
         ▼
  JwtStrategy.validate(payload) → { id, email, role }
         │
         ▼
  AuthService.getProfile(userId) → UserResponseDto
```

### Logout

```
POST /api/v1/auth/logout
         │
         ▼
  JwtAuthGuard → requiere JWT
         │
         ▼
  res.clearCookie('access_token') → elimina cookie
         │
         ▼
  Response: { message: 'Sesión cerrada exitosamente' }
```

---

## Roles y Permisos

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `VISITOR` | Usuario no verificado (futuro) | Rutas públicas |
| `USER` | Usuario registrado (default al registrarse) | Rutas autenticadas, `auth/me`, `auth/logout` |
| `MODERATOR` | Moderador de contenido | Pendiente: gestión de foro |
| `ADMIN` | Administrador | `admin/*` (usuarios, stats) |
| `SUPERADMIN` | Super administrador | `admin/*` (todos los endpoints) |

Los roles se definen en el enum de Prisma (`schema.prisma`) y se verifican en el backend con:

```typescript
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController { ... }
```

---

## Guards y Decoradores

### `JwtAuthGuard` (`src/common/guards/jwt-auth.guard.ts`)

- **Registrado globalmente** en `app.module.ts` vía `APP_GUARD`
- Todas las rutas requieren JWT **por defecto**
- Soporta el decorador `@Public()` para omitir la verificación
- Extrae el token de la cookie `access_token` (httpOnly) o del header `Authorization: Bearer`

### `@Public()` (`src/common/decorators/public.decorator.ts`)

```typescript
@Public()           // ← esta ruta NO requiere autenticación
@Post('register')
async register(...) { }
```

### `RolesGuard` (`src/common/guards/roles.guard.ts`)

- **No es global** — se aplica manualmente con `@UseGuards(RolesGuard)`
- Lee los roles requeridos del decorador `@Roles()`
- Compara con `request.user.role` (inyectado por JwtStrategy)
- Si no coincide → `403 Forbidden`

### `@Roles()` (`src/common/decorators/roles.decorator.ts`)

```typescript
@Roles(Role.ADMIN, Role.SUPERADMIN)  // ← solo estos roles pueden acceder
@Get('users')
async getUsers() { }
```

---

## API Endpoints

| Método | Ruta | Auth | Roles | Descripción |
|--------|------|------|-------|-------------|
| `POST` | `/api/v1/auth/register` | `@Public()` | — | Registrar usuario |
| `POST` | `/api/v1/auth/login` | `@Public()` + LocalAuth | — | Login, retorna cookie httpOnly |
| `GET` | `/api/v1/auth/me` | JWT | — | Perfil del usuario autenticado |
| `POST` | `/api/v1/auth/logout` | JWT | — | Cerrar sesión (limpia cookie) |
| `GET` | `/api/v1/admin/users` | JWT | `ADMIN`, `SUPERADMIN` | Listar usuarios |
| `GET` | `/api/v1/admin/users/:id` | JWT | `ADMIN`, `SUPERADMIN` | Detalle de usuario |
| `PATCH` | `/api/v1/admin/users/:id/role` | JWT | `ADMIN`, `SUPERADMIN` | Cambiar rol |
| `GET` | `/api/v1/admin/stats` | JWT | `ADMIN`, `SUPERADMIN` | Estadísticas |

---

## Estructura de Archivos

### Backend

```
apps/backend/
├── prisma/
│   ├── schema.prisma              # Modelo User + enum Role
│   └── migrations/                # Migraciones de DB
├── src/
│   ├── config/
│   │   ├── jwt.config.ts          # Config JWT (registerAs)
│   │   └── env.validation.ts      # JWT_SECRET, JWT_EXPIRATION
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts   # @Public()
│   │   │   └── roles.decorator.ts    # @Roles()
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts     # JwtAuthGuard (global)
│   │       └── roles.guard.ts        # RolesGuard
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts        # AuthModule
│   │   │   ├── auth.service.ts       # register, validate, login, getProfile
│   │   │   ├── auth.controller.ts    # Endpoints REST
│   │   │   ├── dto/
│   │   │   │   ├── register.dto.ts   # Validación de registro
│   │   │   │   ├── login.dto.ts      # Validación de login
│   │   │   │   └── auth-response.dto.ts  # UserResponseDto, Role enum
│   │   │   └── strategies/
│   │   │       ├── local.strategy.ts     # Passport Local
│   │   │       └── jwt.strategy.ts       # Passport JWT (cookie + bearer)
│   │   └── admin/
│   │       ├── admin.module.ts       # AdminModule
│   │       └── admin.controller.ts   # CRUD usuarios + stats
│   ├── app.module.ts             # APP_GUARD (JwtAuthGuard), imports
│   └── main.ts                   # cookie-parser, CORS, Swagger
```

### Frontend

```
apps/frontend/
├── src/
│   ├── types/
│   │   └── auth.ts               # User, Role, LoginPayload, RegisterPayload
│   ├── lib/
│   │   └── api.ts                # Axios con withCredentials, interceptor 401
│   ├── stores/
│   │   └── authStore.ts          # Zustand: login, register, logout, checkAuth
│   ├── components/
│   │   └── auth/
│   │       ├── LoginForm.tsx          # Formulario login (react-hook-form + zod)
│   │       ├── LoginForm.module.css
│   │       ├── RegisterForm.tsx       # Formulario registro
│   │       ├── RegisterForm.module.css
│   │       ├── AuthGuard.tsx          # Wrapper para rutas protegidas
│   │       └── AuthInitializer.tsx    # checkAuth() al montar la app
│   ├── app/
│   │   ├── layout.tsx            # <AuthInitializer /> en el root
│   │   └── (auth)/
│   │       └── auth/
│   │           ├── login/page.tsx     # /auth/login
│   │           └── register/page.tsx  # /auth/register
│   └── proxy.ts                  # Middleware Next.js 16 (protección server-side)
```

---

## Seguridad

| Medida | Implementación |
|--------|---------------|
| Hashing de contraseñas | bcrypt, salt rounds **12** |
| Token JWT | HS256, expiración **900s** (15 min) |
| httpOnly cookies | El token **no es accesible desde JavaScript** |
| SameSite | `Lax` (protección CSRF básica) |
| CORS con credenciales | `credentials: true`, origen configurable |
| Helmet | Headers de seguridad HTTP |
| Validación de entrada | `class-validator` en DTOs, `zod` en formularios frontend |
| Contraseñas seguras | Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 especial |
| `whitelist` + `forbidNonWhitelisted` | ValidationPipe rechaza propiedades no declaradas |
| Redacción de datos sensibles | Pino redacta `authorization` y `cookie` en logs |

### Pendiente (próximos sprints)

| Medida | Detalle |
|--------|---------|
| Refresh tokens con Redis | Rotación de refresh tokens, invalidación en logout real |
| Rate limiting | 5 req/15 min en login, 3 req/hora en register |
| Verificación de email | Token único + expiración 24h |
| Bloqueo por intentos fallidos | 5 intentos → bloqueo 15 min (Redis) |

---

## Cómo Probar

### Swagger
Abrir `http://localhost:3001/docs` y usar los endpoints documentados. El candado `Authorize` acepta el token JWT para probar rutas protegidas.

### curl

```bash
# Registrar usuario
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"StrongP@ss1"}'

# Login (cookie httpOnly se guarda automáticamente con -c)
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"StrongP@ss1"}' \
  -c cookies.txt

# Perfil (usando cookie guardada)
curl http://localhost:3001/api/v1/auth/me -b cookies.txt

# Admin — cambiar rol a ADMIN primero (si eres ADMIN)
curl -X PATCH http://localhost:3001/api/v1/admin/users/1/role \
  -H "Content-Type: application/json" \
  -d '{"role":"ADMIN"}' \
  -b cookies.txt
```

### Frontend
1. Abrir `http://localhost:3000/auth/register` y crear un usuario
2. Ser redirigido a `/` con el navbar mostrando el username
3. Cerrar sesión → vuelve a mostrar "Iniciar sesión"
4. Login en `http://localhost:3000/auth/login`

---

## Issues Cubiertos

| Issue | Descripción | Estado |
|-------|-------------|--------|
| DB-002 | Modelo User + enum Role + migración | ✅ |
| B-010 | AuthModule + RegisterDto + registro | ✅ |
| B-011 | LocalStrategy + JwtStrategy (Passport) | ✅ |
| B-012 | JwtAuthGuard global + @Public() | ✅ |
| B-013 | RolesGuard + @Roles() decorator | ✅ |
| B-060 | AdminModule (panel) | ✅ |
| F-020 | Contexto de autenticación (Zustand store) | ✅ |
| F-018 | LoginForm + RegisterForm | ✅ |
| F-019 | AuthGuard para rutas protegidas | ✅ |

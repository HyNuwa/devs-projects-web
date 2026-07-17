# ⚙️ DEVs PROJECT — Plan de Backend (NestJS)

> Documento de planificación para el equipo de Backend / API.

## 📐 Stack

| Tecnología | Uso |
|-----------|-----|
| NestJS 11 | Framework principal (arquitectura modular, DI, decoradores) |
| Node.js 22 LTS | Runtime |
| TypeScript 5 | Tipado estático (nativo en NestJS) |
| Prisma 6 | ORM + migraciones |
| class-validator + class-transformer | Validación con decoradores (DTOs) |
| @nestjs/jwt + Passport | Autenticación |
| bcrypt | Hashing contraseñas |
| @nestjs/websockets + Socket.io | Tiempo real |
| @nestjs/bull + Redis | Cola de trabajos |
| @nestjs-modules/mailer | Emails |
| Sharp | Procesamiento imágenes |
| @nestjs/platform-express + Multer | Upload archivos |
| Winston / Pino (nestjs-pino) | Logging |
| @nestjs/swagger | Documentación OpenAPI automática |

## 🏛️ Arquitectura Modular (NestJS)

NestJS usa una arquitectura modular basada en **Módulos**, **Controllers**, **Services**, **Guards**, **Pipes**, **Interceptors** y **Decoradores**.

```
backend/src/
├── main.ts                        # Bootstrap NestJS application
├── app.module.ts                  # Módulo raíz
├── config/                        # Configuración con @nestjs/config
│   ├── app.config.ts
│   ├── database.config.ts
│   └── jwt.config.ts
├── common/                        # Código compartido
│   ├── decorators/                # @CurrentUser, @Roles, @Public
│   ├── guards/                    # JwtAuthGuard, RolesGuard
│   ├── interceptors/              # TransformInterceptor, LoggingInterceptor
│   ├── pipes/                     # ValidationPipe custom
│   ├── filters/                   # HttpExceptionFilter global
│   ├── dto/                       # DTOs compartidos (pagination, etc.)
│   └── utils/                     # Funciones utilitarias
├── modules/                       # Un módulo NestJS por feature
│   ├── auth/
│   │   ├── auth.module.ts         # Declara providers, imports, exports
│   │   ├── auth.controller.ts     # Rutas HTTP con decoradores
│   │   ├── auth.service.ts        # Lógica de negocio
│   │   ├── dto/                   # CreateUserDto, LoginDto, etc.
│   │   ├── strategies/            # JwtStrategy, LocalStrategy (Passport)
│   │   ├── guards/                # Guards específicos del módulo
│   │   └── auth.controller.spec.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── dto/
│   │   └── entities/              # User entity type
│   ├── forum/
│   │   ├── forum.module.ts
│   │   ├── threads/               # Sub-módulo de hilos
│   │   │   ├── threads.controller.ts
│   │   │   ├── threads.service.ts
│   │   │   └── dto/
│   │   ├── replies/               # Sub-módulo de respuestas
│   │   ├── votes/                 # Sub-módulo de votación
│   │   └── categories/            # Sub-módulo de categorías
│   ├── materials/
│   ├── guides/
│   ├── professors/
│   ├── ranking/
│   ├── search/
│   ├── notifications/
│   └── admin/
├── prisma/                        # Módulo Prisma como servicio global
│   ├── prisma.module.ts
│   └── prisma.service.ts
└── redis/                         # Módulo Redis
    ├── redis.module.ts
    └── redis.service.ts
```

> [!NOTE]
> En NestJS, cada **Module** encapsula su funcionalidad. Los `Controllers` manejan rutas HTTP, los `Services` contienen la lógica de negocio, los `Guards` protegen rutas, y los `Pipes` validan/transforman datos. Todo se conecta mediante **Dependency Injection** automática.

### Ejemplo de estructura NestJS (AuthModule)

```typescript
// auth.module.ts
@Module({
  imports: [
    JwtModule.registerAsync({ ... }),
    PassportModule,
    UsersModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}

// auth.controller.ts
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe())
  register(@Body() dto: RegisterDto) { ... }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  login(@Request() req) { ... }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: User) { ... }
}
```

## 🔌 API Endpoints

### 🔐 Auth (`/api/auth`)
| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/register` | Registro | ❌ |
| POST | `/login` | Login | ❌ |
| POST | `/logout` | Cerrar sesión | ✅ |
| POST | `/refresh` | Renovar token | ✅ |
| POST | `/forgot-password` | Recuperar contraseña | ❌ |
| POST | `/reset-password` | Restablecer contraseña | ❌ |
| GET | `/verify-email/:token` | Verificar email | ❌ |
| GET | `/me` | Usuario autenticado | ✅ |

### 👤 Users (`/api/users`)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/` | Listar (paginado) | Admin |
| GET | `/:username` | Perfil público | — |
| PATCH | `/:id` | Editar perfil | Owner |
| PATCH | `/:id/avatar` | Cambiar avatar | Owner |
| DELETE | `/:id` | Desactivar cuenta | Owner/Admin |
| PATCH | `/:id/role` | Cambiar rol | SuperAdmin |

### 💬 Forum (`/api/forum`)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET | `/categories` | Listar categorías | — |
| POST | `/categories` | Crear categoría | Admin |
| GET/POST | `/threads` | Listar/Crear hilos | Estudiante+ |
| GET/PATCH/DELETE | `/threads/:id` | CRUD hilo | Owner/Mod |
| POST | `/threads/:id/replies` | Responder | Estudiante+ |
| POST | `/threads/:id/vote` | Votar (+1/-1) | Estudiante+ |
| POST | `/threads/:id/pin` | Fijar hilo | Mod+ |
| POST | `/threads/:id/lock` | Bloquear hilo | Mod+ |
| POST | `/threads/:id/report` | Reportar | Estudiante+ |

### 📚 Materiales (`/api/materials`)
| Método | Ruta | Descripción | Rol |
|--------|------|-------------|-----|
| GET/POST | `/` | Listar/Subir | Estudiante+ |
| GET | `/:id` | Detalle | — |
| GET | `/:id/download` | Descargar | — |
| POST | `/:id/rate` | Valorar (1-5) | Estudiante+ |
| DELETE | `/:id` | Eliminar | Owner/Mod |

### 📖 Guías, 🎓 Profesores, 🏆 Ranking, 🔍 Búsqueda, 🔔 Notificaciones, 🛡️ Admin
> Cada uno sigue el mismo patrón CRUD con permisos por rol. La documentación completa se genera automáticamente con `@nestjs/swagger`.

## 🔐 Sistema de Autenticación (Passport + JWT)

NestJS usa **Passport.js** integrado con Guards:

- **LocalStrategy**: Valida email + contraseña en login
- **JwtStrategy**: Valida access token en rutas protegidas
- **RolesGuard**: Verifica el rol del usuario con decorador `@Roles()`

### Tokens
- **Access Token**: JWT, 15 min, contiene `userId`, `role`, `email`
- **Refresh Token**: UUID opaco, 7 días, en Redis
- **Email Verification**: UUID, 24h, un solo uso
- **Password Reset**: UUID, 1h, un solo uso
- Contraseñas hasheadas con **bcrypt** (salt rounds: 12)

## 🏅 Sistema de Puntos

| Acción | Puntos |
|--------|--------|
| Crear hilo | +5 |
| Responder hilo | +3 |
| Recibir upvote (hilo) | +2 |
| Recibir upvote (respuesta) | +1 |
| Subir material | +10 |
| Crear guía | +15 |
| Evaluar profesor | +5 |
| Login diario | +1 |
| Recibir downvote | -1 |
| Contenido eliminado por reporte | -20 |

### Niveles RPG
| Nivel | Nombre | Puntos |
|-------|--------|--------|
| 1 | Viajero Novato | 0 |
| 2 | Aprendiz | 50 |
| 3 | Explorador | 150 |
| 4 | Aventurero | 400 |
| 5 | Caballero del Código | 800 |
| 6 | Mago del Saber | 1500 |
| 7 | Maestro Arcano | 3000 |
| 8 | Guardián Legendario | 5000 |
| 9 | Sabio Ancestral | 8000 |
| 10 | Leyenda Eterna | 12000 |

## 📋 Tareas del Equipo Backend

### Sprint 0 — Setup

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| B-001 | Inicializar proyecto con `nest new` (NestJS CLI) | 🔵 Solo | — |
| B-002 | ESLint + Prettier (viene preconfigurado en NestJS) | 🔵 Solo | B-001 |
| B-003 | Crear PrismaModule + PrismaService global | 🟠 Conjunto (DB) | **DB-001** |
| B-004 | Configurar módulos globales (ConfigModule, Swagger, CORS, Helmet) | 🔵 Solo | B-001 |
| B-005 | Configurar @nestjs/config con validación de env | 🔵 Solo | B-001 |
| B-006 | Crear HttpExceptionFilter global | 🔵 Solo | B-001 |
| B-007 | Configurar logging (nestjs-pino o Winston) | 🟢 Paralelo | B-001 |
| B-008 | Configurar Docker para desarrollo | 🟠 Conjunto (DevOps) | **DO-001** |

### Sprint 1 — Auth + Usuarios

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| B-010 | Crear AuthModule + RegisterDto + registro | 🟠 Conjunto (DB) | **DB-002** |
| B-011 | Implementar LocalStrategy + JwtStrategy (Passport) | 🔵 Solo | B-010 |
| B-012 | Crear JwtAuthGuard global | 🔵 Solo | B-011 |
| B-013 | Crear RolesGuard + @Roles() decorator | 🔵 Solo | B-012 |
| B-014 | Implementar verificación de email | 🟠 Conjunto (DevOps) | **DO-005** |
| B-015 | Implementar recuperar contraseña | 🔵 Solo | B-014 |
| B-016 | Crear UsersModule con CRUD de perfil | 🔵 Solo | B-012 |
| B-017 | Implementar subida de avatar (Multer + Sharp) | 🔵 Solo | B-016 |

### Sprint 2 — Foro + Búsqueda

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| B-020 | Crear ForumModule + CategoriesController | 🟠 Conjunto (DB) | **DB-003** |
| B-021 | Crear ThreadsController + ThreadsService (CRUD) | 🔵 Solo | B-020 |
| B-022 | Crear RepliesController + RepliesService | 🔵 Solo | B-021 |
| B-023 | Crear VotesService (upvote/downvote) | 🔵 Solo | B-021 |
| B-024 | Sistema de reportes | 🔵 Solo | B-021 |
| B-025 | Fijar/bloquear hilos (moderación) | 🔵 Solo | B-021 |
| B-026 | Crear RankingModule (cálculo de puntos) | 🟠 Conjunto (DB) | **DB-004** |
| B-030 | Crear SearchModule (full-text search PostgreSQL) | 🟠 Conjunto (DB) | **DB-005** |

### Sprint 3 — Materiales + Guías

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| B-040 | Crear MaterialsModule + upload de archivos | 🟠 Conjunto (DB) | **DB-006** |
| B-041 | Descargas + contador | 🔵 Solo | B-040 |
| B-042 | Crear GuidesModule | 🟠 Conjunto (DB) | **DB-007** |
| B-043 | Valoración de materiales | 🔵 Solo | B-040 |

### Sprint 4 — Ranking, Profesores, Notif, Admin

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| B-050 | Perfil extendido | 🔵 Solo | B-016 |
| B-051 | API ranking (global, semanal, mensual) | 🟠 Conjunto (DB) | **DB-004** |
| B-052 | Crear ProfessorsModule + evaluaciones | 🟠 Conjunto (DB) | **DB-008** |
| B-053 | Crear NotificationsGateway (WebSockets) | 🔵 Solo | B-012 |
| B-054 | Crear MailModule con @nestjs/bull (cola) | 🟢 Paralelo | B-014 |
| B-060 | Crear AdminModule (panel) | 🔵 Solo | B-013 |
| B-061 | Moderación (ban, mute, reportes) | 🔵 Solo | B-060 |

## 🔑 Leyenda

| Icono | Tipo | Significado |
|-------|------|-------------|
| 🔵 | **Solo** | Independiente, sin esperar a otros |
| 🟢 | **Paralelo** | Simultáneo con otras tareas del sprint |
| 🟠 | **Conjunto** | Requiere coordinación con otro equipo |

> [!IMPORTANT]
> NestJS genera documentación Swagger automáticamente con decoradores `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`. Usarla en cada controller para que Frontend pueda consultar los contratos de API en `/api/docs`.

---
*📅 Última actualización: Julio 2026*

# Plan de Implementación: Sistema de Autenticación y Autorización

> **Issues cubiertos:** DB-002, B-010, B-011, B-012, B-013, B-060, F-020, F-018, F-019
> **Fecha:** Julio 2026
> **Estado:** COMPLETADO

---

## Decisiones de arquitectura

1. **Cookies httpOnly** para el access token (backend setea, frontend no puede leer desde JS)
2. **Refresh tokens con Redis** (implementación diferida a sprint posterior con Redis)
3. **Roles**: `VISITOR`, `USER`, `MODERATOR`, `ADMIN`, `SUPERADMIN` (default: `USER`)
4. **bcrypt salt rounds**: 12
5. **Password policy**: mínimo 8 chars, 1 mayúscula, 1 número, 1 especial

---

## Archivos creados/modificados por issue

### DB-002 (FASE 1)
| Acción | Archivo |
|--------|---------|
| Modificado | `apps/backend/prisma/schema.prisma` |
| Creado | `apps/backend/prisma/migrations/20260718225826_add_auth_fields/` |

### B-010 (FASE 2)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/backend/src/config/jwt.config.ts` |
| Creado | `apps/backend/src/modules/auth/auth.module.ts` |
| Creado | `apps/backend/src/modules/auth/auth.service.ts` |
| Creado | `apps/backend/src/modules/auth/auth.controller.ts` |
| Creado | `apps/backend/src/modules/auth/dto/register.dto.ts` |
| Creado | `apps/backend/src/modules/auth/dto/login.dto.ts` |
| Creado | `apps/backend/src/modules/auth/dto/auth-response.dto.ts` |
| Modificado | `apps/backend/src/config/env.validation.ts` |
| Modificado | `apps/backend/src/config/app.config.ts` |
| Modificado | `apps/backend/.env.example` |
| Modificado | `apps/backend/.env` |

### B-011 (FASE 2)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/backend/src/modules/auth/strategies/local.strategy.ts` |
| Creado | `apps/backend/src/modules/auth/strategies/jwt.strategy.ts` |

### B-012 (FASE 2)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/backend/src/common/guards/jwt-auth.guard.ts` |
| Creado | `apps/backend/src/common/decorators/public.decorator.ts` |
| Modificado | `apps/backend/src/app.module.ts` |
| Modificado | `apps/backend/src/main.ts` |

### B-013 (FASE 3)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/backend/src/common/decorators/roles.decorator.ts` |
| Creado | `apps/backend/src/common/guards/roles.guard.ts` |

### B-060 (FASE 3)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/backend/src/modules/admin/admin.module.ts` |
| Creado | `apps/backend/src/modules/admin/admin.controller.ts` |

### F-020 (FASE 4)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/frontend/src/types/auth.ts` |
| Creado | `apps/frontend/src/lib/api.ts` |
| Creado | `apps/frontend/src/stores/authStore.ts` |
| Creado | `apps/frontend/src/components/auth/AuthInitializer.tsx` |
| Modificado | `apps/frontend/src/app/layout.tsx` |

### F-018 (FASE 5)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/frontend/src/components/auth/LoginForm.tsx` |
| Creado | `apps/frontend/src/components/auth/LoginForm.module.css` |
| Creado | `apps/frontend/src/components/auth/RegisterForm.tsx` |
| Creado | `apps/frontend/src/components/auth/RegisterForm.module.css` |
| Creado | `apps/frontend/src/app/(auth)/auth/login/page.tsx` |
| Creado | `apps/frontend/src/app/(auth)/auth/register/page.tsx` |

### F-019 (FASE 5)
| Acción | Archivo |
|--------|---------|
| Creado | `apps/frontend/src/components/auth/AuthGuard.tsx` |
| Creado | `apps/frontend/src/proxy.ts` |
| Modificado | `apps/frontend/src/components/layout/Navbar.tsx` |
| Modificado | `apps/frontend/src/components/layout/Navbar.module.css` |
| Modificado | `apps/frontend/src/app/globals.css` |

### Adicional
| Acción | Archivo |
|--------|---------|
| Modificado | `package.json` (pnpm.onlyBuiltDependencies) |
| Modificado | `apps/backend/src/prisma/prisma.service.ts` (import path) |
| Modificado | `apps/backend/prisma/schema.prisma` (generator output path) |

---

## Endpoints API resultantes

| Método | Ruta | Auth | Roles |
|--------|------|------|-------|
| POST | `/api/v1/auth/register` | Público | — |
| POST | `/api/v1/auth/login` | Público | — |
| GET | `/api/v1/auth/me` | JWT | — |
| POST | `/api/v1/auth/logout` | JWT | — |
| GET | `/api/v1/admin/users` | JWT | ADMIN, SUPERADMIN |
| GET | `/api/v1/admin/users/:id` | JWT | ADMIN, SUPERADMIN |
| PATCH | `/api/v1/admin/users/:id/role` | JWT | ADMIN, SUPERADMIN |
| GET | `/api/v1/admin/stats` | JWT | ADMIN, SUPERADMIN |

---

## Próximos pasos (fuera de este plan)

1. **Redis + Refresh tokens** (B-014 parcial): Instalar ioredis, crear módulo Redis, implementar refresh token rotativo
2. **Rate limiting** (S-004): Rate limiting con Redis en endpoints de auth
3. **Verificación de email** (B-014): Token de verificación vía email
4. **Recuperar contraseña** (B-015): Flujo de forgot/reset password
5. **UsersModule** (B-016): CRUD de perfil público/privado
6. **Admin panel en Next.js**: Páginas protegidas en `/admin/*` usando AuthGuard + middleware

---

*Última actualización: Julio 2026*

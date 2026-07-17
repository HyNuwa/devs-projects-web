# 🛡️ DEVs PROJECT — Plan de Seguridad

> Documento de planificación para el equipo de Seguridad.

## 🎯 Objetivos

Proteger la plataforma contra las vulnerabilidades más comunes (OWASP Top 10) y garantizar la privacidad de los datos de los usuarios.

## 🔒 Áreas de Seguridad

### 1. Autenticación y Sesiones

| Medida | Implementación | Prioridad |
|--------|----------------|-----------|
| Hashing de contraseñas | bcrypt con salt rounds 12 | 🔴 Crítica |
| Tokens JWT firmados | Algoritmo RS256 o HS256 con secreto fuerte (256+ bits) | 🔴 Crítica |
| Access token corto | 15 minutos de expiración | 🔴 Crítica |
| Refresh token rotativo | Invalida el anterior al renovar | 🔴 Crítica |
| Logout real | Invalida refresh token en Redis | 🔴 Crítica |
| Verificación de email | Token único + expiración 24h | 🟡 Alta |
| Bloqueo por intentos fallidos | 5 intentos → bloqueo 15 min (Redis) | 🟡 Alta |
| Contraseña segura | Mínimo 8 chars, 1 mayúscula, 1 número, 1 especial | 🟡 Alta |

### 2. Validación de Entrada (contra Inyección)

| Medida | Implementación | Prioridad |
|--------|----------------|-----------|
| Validación con class-validator | DTOs con decoradores en cada endpoint (ValidationPipe de NestJS) | 🔴 Crítica |
| Queries parametrizadas | Prisma ORM (previene SQL injection por defecto) | 🔴 Crítica |
| Sanitización HTML | DOMPurify en contenido Markdown renderizado | 🔴 Crítica |
| Límites de longitud | Máximos en todos los campos de texto | 🟡 Alta |
| Validación de tipos de archivo | Whitelist de extensiones + verificación MIME real | 🟡 Alta |
| Límite de tamaño de archivos | Máximo 50MB por archivo | 🟡 Alta |

### 3. Protección del API

| Medida | Implementación | Prioridad |
|--------|----------------|-----------|
| Rate limiting | Límite por IP y por usuario (Redis) | 🔴 Crítica |
| CORS restringido | Solo dominios permitidos en producción | 🔴 Crítica |
| Helmet | Headers de seguridad HTTP | 🔴 Crítica |
| HTTPS obligatorio | Redirect HTTP → HTTPS (Nginx) | 🔴 Crítica |
| CSRF protection | SameSite cookies + token anti-CSRF | 🟡 Alta |
| Content-Security-Policy | CSP headers estrictos | 🟡 Alta |

### 4. Autorización y Permisos

| Medida | Implementación | Prioridad |
|--------|----------------|-----------|
| RBAC (Role-Based Access) | Middleware de roles en cada ruta | 🔴 Crítica |
| Ownership checks | Verificar que el usuario es dueño del recurso | 🔴 Crítica |
| Principio de mínimo privilegio | Usuarios nuevos = rol `student` por defecto | 🟡 Alta |
| Auditoría de acciones admin | Log de acciones de moderación/admin | 🟡 Alta |

### 5. Protección de Datos

| Medida | Implementación | Prioridad |
|--------|----------------|-----------|
| Encriptación en tránsito | TLS 1.3 vía Let's Encrypt | 🔴 Crítica |
| Encriptación en reposo | Encriptar backups de DB | 🟡 Alta |
| No exponer datos sensibles | Nunca retornar `password_hash` en respuestas | 🔴 Crítica |
| Evaluaciones anónimas | Profesores NO pueden ver quién evaluó | 🔴 Crítica |
| Eliminación de cuenta | Soft delete + anonimización de datos | 🟡 Alta |

### 6. Protección contra ataques comunes

| Ataque (OWASP) | Mitigación |
|-----------------|------------|
| **A01: Broken Access Control** | RBAC + ownership checks + tests |
| **A02: Cryptographic Failures** | bcrypt, JWT RS256, TLS 1.3 |
| **A03: Injection** | Prisma ORM, Zod validation, DOMPurify |
| **A04: Insecure Design** | Threat modeling, review de diseño |
| **A05: Security Misconfiguration** | Helmet, CSP, CORS, env vars seguras |
| **A06: Vulnerable Components** | Dependabot/Renovate, auditorías npm |
| **A07: Auth Failures** | Rate limiting, bloqueo por intentos |
| **A08: Software Integrity** | GitHub Actions con hashes, lockfiles |
| **A09: Logging Failures** | Winston con logs estructurados |
| **A10: SSRF** | Validar URLs de entrada, no fetch arbitrario |

## 🔐 Rate Limiting por Endpoint

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| POST `/auth/login` | 5 req | 15 min |
| POST `/auth/register` | 3 req | 1 hora |
| POST `/auth/forgot-password` | 3 req | 1 hora |
| POST `/forum/threads` | 10 req | 1 hora |
| POST `/materials` (upload) | 5 req | 1 hora |
| GET (general API) | 100 req | 1 min |
| POST (general API) | 30 req | 1 min |

## 📋 Tareas del Equipo Seguridad

### Sprint 0 — Fundamentos

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| S-001 | Definir política de contraseñas | 🔵 Solo | — |
| S-002 | Configurar Helmet + CSP headers | 🟠 Conjunto (Backend) | **B-004** |
| S-003 | Configurar CORS | 🟠 Conjunto (Backend) | **B-004** |
| S-004 | Configurar rate limiting con Redis | 🟠 Conjunto (Backend+DB) | **B-001, DB-013** |

### Sprint 1 — Auth Security

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| S-010 | Revisar implementación de bcrypt | 🟠 Conjunto (Backend) | **B-010** |
| S-011 | Revisar flujo de JWT + refresh tokens | 🟠 Conjunto (Backend) | **B-011** |
| S-012 | Implementar bloqueo por intentos fallidos | 🟠 Conjunto (Backend) | **B-011** |
| S-013 | Validar sanitización de inputs en registro | 🟠 Conjunto (Backend) | **B-010** |
| S-014 | Configurar DOMPurify en contenido Markdown | 🟠 Conjunto (Frontend) | **F-033** |

### Sprint 2+ — Revisiones continuas

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| S-020 | Auditar permisos RBAC en todos los endpoints | 🔵 Solo | **B-013** |
| S-021 | Validar que uploads no permitan archivos maliciosos | 🟠 Conjunto (Backend) | **B-040** |
| S-022 | Verificar anonimidad de evaluaciones de profesores | 🟠 Conjunto (Backend) | **B-052** |
| S-023 | Configurar Dependabot / Renovate | 🟠 Conjunto (DevOps) | **DO-003** |
| S-024 | Ejecutar `npm audit` y resolver vulnerabilidades | 🔵 Solo | Cada sprint |
| S-025 | Penetration testing básico (manual) | 🔵 Solo | Sprint 3+ |
| S-026 | Documentar procedimiento de incidentes | 🔵 Solo | — |

## 🔑 Leyenda

| Icono | Tipo |
|-------|------|
| 🔵 Solo | Independiente |
| 🟠 Conjunto | Requiere coordinación con otro equipo |

> [!CAUTION]
> El equipo de seguridad debe **revisar cada feature** antes de que pase a producción. Ningún merge a `main` sin revisión de seguridad para endpoints que manejan autenticación, uploads, o datos sensibles.

---
*📅 Última actualización: Julio 2026*

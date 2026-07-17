# 🧪 DEVs PROJECT — Plan de Testing / QA

> Documento de planificación para el equipo de Testing y Control de Calidad.

## 📐 Stack de Testing

| Tecnología | Uso |
|-----------|-----|
| Vitest | Unit tests (Backend + Frontend) |
| Testing Library | Tests de componentes React |
| Playwright | Tests E2E (end-to-end) en el navegador |
| @nestjs/testing + Supertest | Tests de integración de API (NestJS TestingModule) |
| MSW (Mock Service Worker) | Mocking de API en frontend |
| Faker.js | Generación de datos de prueba |
| c8 / istanbul | Cobertura de código |

## 📊 Estrategia de Testing (Pirámide)

```
        ╱╲
       ╱ E2E ╲           ← Pocos, lentos, alto valor
      ╱────────╲
     ╱Integration╲       ← Moderados, API + DB
    ╱──────────────╲
   ╱   Unit Tests    ╲   ← Muchos, rápidos, base
  ╱────────────────────╲
```

| Nivel | Qué se testea | Herramienta | Cobertura objetivo |
|-------|---------------|-------------|---------------------|
| **Unit** | Funciones puras, utilidades, services | Vitest | 80%+ |
| **Componentes** | Componentes React aislados | Testing Library | 70%+ |
| **Integración** | Endpoints API con DB real (test) | Supertest + Vitest | 70%+ |
| **E2E** | Flujos completos en navegador | Playwright | Flujos críticos |

## 🔬 Qué testear por módulo

### Auth
| Test | Tipo | Descripción |
|------|------|-------------|
| Registro exitoso | Integración | Crear usuario, verificar en DB |
| Registro con email duplicado | Integración | Debe retornar 409 |
| Login correcto | Integración | Retorna tokens válidos |
| Login con contraseña incorrecta | Integración | Retorna 401 |
| Token expirado | Unit | Middleware rechaza token vencido |
| Refresh token | Integración | Genera nuevo access token |
| Verificación de email | Integración | Token válido activa cuenta |
| Formulario login UI | Componente | Validación, estados de carga, errores |
| Flujo registro completo | E2E | Registro → verificar email → login |

### Foro
| Test | Tipo | Descripción |
|------|------|-------------|
| CRUD de hilos | Integración | Crear, leer, editar, eliminar |
| Permisos (no puede editar ajeno) | Integración | 403 al editar hilo de otro |
| Votación sin duplicados | Integración | No puede votar 2 veces el mismo hilo |
| Paginación correcta | Integración | Offset, limit, total |
| Búsqueda full-text | Integración | Resultados relevantes |
| Crear hilo desde UI | E2E | Formulario → publicar → aparece en lista |
| Responder hilo | E2E | Escribir → enviar → aparece respuesta |

### Materiales
| Test | Tipo | Descripción |
|------|------|-------------|
| Upload de archivo | Integración | Subir PDF, verificar almacenamiento |
| Límite de tamaño | Integración | Rechazar archivos > límite |
| Tipos permitidos | Unit | Solo pdf/doc/ppt/img/zip |
| Descarga incrementa contador | Integración | download_count +1 |
| Subir material desde UI | E2E | Drag & drop → formulario → subir |

### Gamificación
| Test | Tipo | Descripción |
|------|------|-------------|
| Puntos al crear hilo | Unit | +5 puntos correctamente |
| Subida de nivel | Unit | Cambio automático al alcanzar umbral |
| Penalización por reporte | Unit | -20 puntos correctamente |
| Ranking ordenado | Integración | Usuarios en orden descendente |

## 📋 Tareas del Equipo Testing

### Sprint 0 — Setup

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| T-001 | Configurar Vitest en backend | 🟠 Conjunto (Backend) | **B-001** |
| T-002 | Configurar Vitest + Testing Library en frontend | 🟠 Conjunto (Frontend) | **F-001** |
| T-003 | Configurar Playwright | 🟠 Conjunto (DevOps) | **DO-001** |
| T-004 | Configurar base de datos de test | 🟠 Conjunto (DB) | **DB-001** |
| T-005 | Crear factories/fixtures de datos (Faker) | 🔵 Solo | T-004 |
| T-006 | Configurar CI para tests automáticos | 🟠 Conjunto (DevOps) | **DO-003** |

### Sprint 1 — Tests de Auth

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| T-010 | Tests de integración de registro | 🟠 Conjunto (Backend) | **B-010** |
| T-011 | Tests de integración de login/JWT | 🟠 Conjunto (Backend) | **B-011** |
| T-012 | Tests de middleware auth | 🔵 Solo | **B-012** |
| T-013 | Tests de componentes LoginForm/RegisterForm | 🟠 Conjunto (Frontend) | **F-018** |
| T-014 | Test E2E: flujo de registro completo | 🟠 Conjunto (Front+Back) | **F-019, B-014** |

### Sprint 2 — Tests de Foro

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| T-020 | Tests de CRUD hilos/respuestas | 🟠 Conjunto (Backend) | **B-021, B-022** |
| T-021 | Tests de votación | 🟠 Conjunto (Backend) | **B-023** |
| T-022 | Tests de permisos y roles | 🔵 Solo | **B-013** |
| T-023 | Tests de búsqueda full-text | 🟠 Conjunto (Backend) | **B-030** |
| T-024 | Test E2E: crear y responder un hilo | 🟠 Conjunto (Front+Back) | **F-032** |

### Sprint 3+ — Tests de Materiales, Guías, etc.

| # | Tarea | Tipo | Dependencias |
|---|-------|------|--------------|
| T-030 | Tests de upload/download materiales | 🟠 Conjunto (Backend) | **B-040** |
| T-031 | Tests de gamificación/puntos | 🔵 Solo | **B-026** |
| T-032 | Tests E2E: flujos principales completos | 🟠 Conjunto (Front+Back) | Sprint 3 completado |
| T-033 | Tests de rendimiento (carga) | 🔵 Solo | Sprint 3 completado |

## 📏 Convenciones

- Archivos de test junto al archivo fuente: `auth.service.test.ts`
- Usar `describe` → `it`/`test` con nombres descriptivos en español
- Un `beforeEach` por suite para setup limpio
- Nunca testear implementación interna, solo comportamiento

## 🔑 Leyenda

| Icono | Tipo |
|-------|------|
| 🔵 Solo | Independiente |
| 🟢 Paralelo | Simultáneo |
| 🟠 Conjunto | Requiere que el código a testear esté listo |

> [!IMPORTANT]
> Los tests de integración y E2E **dependen** de que el código funcional esté implementado. El equipo QA debe coordinarse sprint a sprint con Backend y Frontend para escribir tests **inmediatamente** después de cada feature.

---
*📅 Última actualización: Julio 2026*

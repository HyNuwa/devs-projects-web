# DevsProject

DevsProject es una comunidad para estudiantes de la **Facultad de Ingeniería de la UNJu**. Sirve para encontrar y compartir recursos académicos (parciales, finales, apuntes, resúmenes) dentro de su materia y su contexto de cursada, y para contar cómo fue cursar o rendir una materia.

El vocabulario del dominio está en [`CONTEXT.md`](CONTEXT.md). Antes de tocar código, leelo.

## Qué hace hoy

| Área | Estado |
|---|---|
| Cuentas: registro, verificación de email, recuperación de contraseña, sesiones con refresh token | Implementado |
| Materias y planes de estudio (Plan 2023 de Ingeniería Informática) | Implementado |
| Recursos académicos: subida, vista previa, descarga, «Me sirvió», guardado, valoraciones | Implementado |
| Reseñas de cursada y experiencias de final, con publicación anónima | Implementado |
| Reportes y retiro de reseñas y experiencias por moderación | Implementado |
| Puntos y niveles | Parcial: ver [`docs/README_PUNTOS_E_INSIGNIAS.md`](docs/README_PUNTOS_E_INSIGNIAS.md) |
| Moderación con publicación inmediata, casos y apelaciones | Especificado: [`docs/README_MODERACION.md`](docs/README_MODERACION.md) |
| Rediseño, Eventos, Clasificados, insignias | Diseñado, sin implementar |

El rediseño completo (escritorio y mobile) está en el canvas **DevsProject · Home**: https://claude.ai/artifact/VwRuyScjfH3AjjpF2SPYaU

## Estructura

```
.
├── apps/
│   ├── backend/     API REST con NestJS + Prisma + PostgreSQL
│   └── frontend/    Next.js (App Router) + React + Tailwind
├── docs/            Documentación por área (ver abajo)
│   └── adr/         Decisiones de arquitectura
├── openspec/        Cambios planificados (propuestas, specs y tareas)
├── CONTEXT.md       Glosario del dominio
└── AGENTS.md        Instrucciones para agentes (Claude Code y Codex)
```

## Cómo levantarlo

Requisitos: Node.js (LTS), pnpm y PostgreSQL.

```bash
pnpm install
cp apps/backend/.env.example apps/backend/.env   # completar DATABASE_URL, JWT_SECRET, etc.
pnpm --filter backend exec prisma migrate dev
pnpm dev                                          # frontend y backend juntos
```

- Frontend: http://localhost:3000
- API: `http://localhost:<PORT>/<API_PREFIX>` y Swagger en `/docs` (fuera de producción).

## Documentación

| Documento | Qué cubre |
|---|---|
| [`docs/README_BACKEND.md`](docs/README_BACKEND.md) | Stack, módulos y endpoints de la API |
| [`docs/README_DATABASE.md`](docs/README_DATABASE.md) | Modelo de datos (Prisma) y migraciones |
| [`docs/README_FRONTEND.md`](docs/README_FRONTEND.md) | Rutas, sistema visual y rediseño |
| [`docs/README_AUTH.md`](docs/README_AUTH.md) | Autenticación, sesiones y roles |
| [`docs/README_SECURITY.md`](docs/README_SECURITY.md) | Medidas de seguridad y pendientes |
| [`docs/README_TESTING.md`](docs/README_TESTING.md) | Cómo se testea cada app |
| [`docs/README_MODERACION.md`](docs/README_MODERACION.md) | Cómo funciona la moderación |
| [`docs/README_PUNTOS_E_INSIGNIAS.md`](docs/README_PUNTOS_E_INSIGNIAS.md) | Puntos, niveles, insignias y privilegios |
| [`docs/README_DEVOPS.md`](docs/README_DEVOPS.md) | Plan de infraestructura y despliegue |
| [`docs/README_RULES.md`](docs/README_RULES.md) | Convenciones de código y de Git |
| [`docs/README_PROJECT_MANAGEMENT.md`](docs/README_PROJECT_MANAGEMENT.md) | Cómo se planifica y reparte el trabajo |
| [`docs/agents/`](docs/agents) | Flujo de trabajo con OpenSpec, issues y etiquetas |

## Licencia

Proyecto de código abierto para la comunidad universitaria.

# 🎨 DEVs PROJECT — Plan de Frontend

> Documento de planificación para el equipo de Frontend.

---

## 📐 Stack del Frontend

| Tecnología | Uso |
|-----------|-----|
| Next.js 15 (App Router) | Framework principal, SSR/SSG |
| React 19 | Librería de UI |
| TypeScript 5 | Tipado estático |
| CSS Modules + Variables CSS | Estilos con scope, design tokens |
| Framer Motion | Animaciones y transiciones |
| TanStack Query (React Query) | Fetching y cache del servidor |
| Zustand | Estado global (auth, theme, notifications) |
| Socket.io Client | Notificaciones en tiempo real |
| React Hook Form + Zod | Formularios con validación |
| next-themes | Dark/Light mode |

---

## 🗺️ Mapa de Páginas

```
/                          → Landing / Home (Hero RPG + módulos)
/auth/login                → Iniciar sesión
/auth/register             → Registro
/auth/forgot-password      → Recuperar contraseña
/auth/verify-email         → Verificación de email
/foro                      → Listado de categorías del foro
/foro/[categoria]          → Hilos de una categoría
/foro/[categoria]/[hilo]   → Vista de hilo + respuestas
/foro/nuevo                → Crear nuevo hilo
/materiales                → Explorador de apuntes y materiales
/materiales/[id]           → Detalle de material (preview + descarga)
/materiales/subir          → Subir nuevo material
/guias                     → Listado de guías y cursos
/guias/[id]                → Vista de guía paso a paso
/guias/crear               → Crear nueva guía
/plan-de-estudio           → Explorador de planes por carrera
/plan-de-estudio/[carrera] → Plan detallado de una carrera
/herramientas              → Catálogo de herramientas
/profesores                → Listado de profesores evaluados
/profesores/[id]           → Perfil de profesor + reseñas
/profesores/evaluar        → Formulario de evaluación
/ranking                   → Tabla de ranking de usuarios
/perfil/[username]         → Perfil público de usuario
/perfil/editar             → Edición de perfil propio
/notificaciones            → Centro de notificaciones
/buscar                    → Resultados de búsqueda global
/admin                     → Panel de administración
/admin/usuarios            → Gestión de usuarios
/admin/reportes            → Reportes de contenido
/admin/materias            → Gestión de materias/carreras
```

---

## 🧩 Componentes Principales

### Layout & Navegación
| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| `Navbar` | Barra superior con logo, navegación, búsqueda, auth | 🔴 Alta |
| `Footer` | Pie de página con links, redes sociales | 🟡 Media |
| `Sidebar` | Panel lateral para categorías del foro | 🟡 Media |
| `MobileMenu` | Menú hamburguesa responsive | 🔴 Alta |
| `Breadcrumbs` | Navegación por migas de pan | 🟢 Baja |

### Autenticación
| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| `LoginForm` | Formulario de login con validación | 🔴 Alta |
| `RegisterForm` | Formulario de registro multi-step | 🔴 Alta |
| `ForgotPasswordForm` | Recuperación de contraseña | 🟡 Media |
| `AuthGuard` | HOC que protege rutas privadas | 🔴 Alta |

### Home / Landing
| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| `HeroBanner` | Banner principal con animación RPG del mago pixel-art | 🔴 Alta |
| `StatsPanel` | Tarjeta de estadísticas (miembros, materiales, etc.) | 🔴 Alta |
| `ModuleCards` | 6 tarjetas de módulos interactivas con hover | 🔴 Alta |
| `RecentPosts` | Sección de publicaciones recientes | 🟡 Media |
| `FeaturedMembers` | Miembros destacados con ranking | 🟡 Media |
| `CommunityQuote` | Bloque de cita motivacional | 🟢 Baja |

### Foro
| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| `CategoryList` | Lista de categorías con iconos y contadores | 🔴 Alta |
| `ThreadList` | Lista de hilos con paginación | 🔴 Alta |
| `ThreadCard` | Tarjeta de hilo (título, tags, votos, respuestas) | 🔴 Alta |
| `ThreadView` | Vista completa de un hilo con respuestas | 🔴 Alta |
| `ReplyEditor` | Editor de respuesta con Markdown | 🔴 Alta |
| `VoteButtons` | Botones de upvote/downvote | 🟡 Media |
| `TagSelector` | Selector de tags para publicaciones | 🟡 Media |

### Materiales
| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| `MaterialGrid` | Grilla de materiales con filtros | 🔴 Alta |
| `MaterialCard` | Tarjeta con preview, tipo, descargas | 🔴 Alta |
| `FileUploader` | Componente de subida con drag & drop | 🔴 Alta |
| `FilePreview` | Preview de PDF/imagen inline | 🟡 Media |
| `DownloadButton` | Botón con contador de descargas | 🟢 Baja |

### Gamificación
| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| `UserLevel` | Badge de nivel RPG del usuario | 🟡 Media |
| `PointsDisplay` | Visualización de puntos acumulados | 🟡 Media |
| `AchievementBadge` | Insignias desbloqueadas | 🟡 Media |
| `LeaderboardTable` | Tabla de ranking con filtros | 🟡 Media |
| `LevelUpAnimation` | Animación de subida de nivel | 🟢 Baja |

### Compartidos / UI Kit
| Componente | Descripción | Prioridad |
|-----------|-------------|-----------|
| `Button` | Botón con variantes (primary, secondary, ghost) | 🔴 Alta |
| `Input` | Input con label, error, validación | 🔴 Alta |
| `Modal` | Modal reutilizable con portal | 🔴 Alta |
| `Toast` | Notificaciones toast | 🔴 Alta |
| `Avatar` | Avatar de usuario con fallback | 🔴 Alta |
| `Skeleton` | Loading skeletons | 🟡 Media |
| `Pagination` | Paginación con números | 🟡 Media |
| `SearchBar` | Barra de búsqueda con autocompletado | 🟡 Media |
| `Dropdown` | Menú desplegable | 🟡 Media |
| `Tabs` | Tabs para navegación secundaria | 🟡 Media |
| `EmptyState` | Estado vacío con ilustración | 🟢 Baja |

---

## 🎨 Sistema de Diseño

### Paleta de Colores
```css
/* Colores principales - tema RPG azul */
--color-primary-50:  #E8F4FD;
--color-primary-100: #B8DEF8;
--color-primary-200: #88C8F3;
--color-primary-500: #2196F3;  /* Azul principal */
--color-primary-600: #1976D2;
--color-primary-700: #1565C0;
--color-primary-900: #0D47A1;

/* Acentos */
--color-accent-gold:   #FFD700;  /* Oro para ranking */
--color-accent-green:  #4CAF50;  /* Éxito, aprobado */
--color-accent-orange: #FF9800;  /* Advertencia */
--color-accent-red:    #F44336;  /* Error, eliminar */

/* Neutrales */
--color-bg-primary:   #F5F9FF;   /* Fondo principal (claro) */
--color-bg-secondary: #FFFFFF;   /* Tarjetas */
--color-bg-dark:      #0F1923;   /* Fondo principal (oscuro) */
--color-text-primary: #1A2B3C;
--color-text-secondary: #64748B;
```

### Tipografía
```css
--font-heading: 'Outfit', sans-serif;       /* Títulos */
--font-body: 'Inter', sans-serif;           /* Texto general */
--font-pixel: 'Press Start 2P', monospace;  /* Detalles RPG */
```

### Breakpoints Responsive
```css
--bp-mobile:  480px;
--bp-tablet:  768px;
--bp-desktop: 1024px;
--bp-wide:    1280px;
```

---

## 📋 Tareas del Equipo Frontend

### 🔴 Sprint 0 — Setup Base

| # | Tarea | Responsable | Tipo | Dependencias |
|---|-------|-------------|------|--------------|
| F-001 | Inicializar proyecto Next.js con TypeScript | 1 persona | 🔵 Solo | Ninguna |
| F-002 | Configurar ESLint + Prettier + Husky | 1 persona | 🔵 Solo | F-001 |
| F-003 | Crear sistema de design tokens (variables CSS) | 1 persona | 🔵 Solo | F-001 |
| F-004 | Crear estructura de carpetas (components, layouts, hooks, utils) | 1 persona | 🔵 Solo | F-001 |
| F-005 | Configurar fuentes (Outfit, Inter, Press Start 2P) | 1 persona | 🔵 Solo | F-001 |

### 🔴 Sprint 1 — Layout + Auth + Landing

| # | Tarea | Responsable | Tipo | Dependencias |
|---|-------|-------------|------|--------------|
| F-010 | Implementar `Navbar` con responsive | 1-2 personas | 🔵 Solo | F-003 |
| F-011 | Implementar `Footer` | 1 persona | 🔵 Solo | F-003 |
| F-012 | Implementar `MobileMenu` | 1 persona | 🟢 Paralelo | F-010 |
| F-013 | Implementar UI Kit base (Button, Input, Modal, Toast) | 2 personas | 🔵 Solo | F-003 |
| F-014 | Implementar `HeroBanner` con animaciones pixel-art | 1-2 personas | 🟢 Paralelo con F-015 | F-003 |
| F-015 | Implementar `StatsPanel` | 1 persona | 🟢 Paralelo con F-014 | F-013 |
| F-016 | Implementar `ModuleCards` (6 tarjetas con hover) | 1 persona | 🟢 Paralelo con F-014 | F-013 |
| F-017 | Implementar `RecentPosts` + `FeaturedMembers` | 1 persona | 🟢 Paralelo | F-013 |
| F-018 | Implementar `LoginForm` + `RegisterForm` | 1-2 personas | 🟠 Conjunto (Backend) | F-013, **B-010** |
| F-019 | Implementar `AuthGuard` para rutas protegidas | 1 persona | 🟠 Conjunto (Backend) | F-018, **B-011** |
| F-020 | Configurar contexto de autenticación (Zustand store) | 1 persona | 🟠 Conjunto (Backend) | **B-010** |

### 🟡 Sprint 2 — Foro + Búsqueda

| # | Tarea | Responsable | Tipo | Dependencias |
|---|-------|-------------|------|--------------|
| F-030 | Implementar `CategoryList` | 1 persona | 🟠 Conjunto (Backend) | **B-020** |
| F-031 | Implementar `ThreadList` + `ThreadCard` | 1-2 personas | 🟠 Conjunto (Backend) | F-030, **B-021** |
| F-032 | Implementar `ThreadView` con respuestas | 1-2 personas | 🟠 Conjunto (Backend) | F-031, **B-022** |
| F-033 | Implementar `ReplyEditor` con Markdown | 1 persona | 🟢 Paralelo | F-013 |
| F-034 | Implementar `VoteButtons` (upvote/downvote) | 1 persona | 🟠 Conjunto (Backend) | **B-023** |
| F-035 | Implementar `SearchBar` con autocompletado | 1 persona | 🟠 Conjunto (Backend) | **B-030** |
| F-036 | Implementar página `/buscar` con resultados | 1 persona | 🟠 Conjunto (Backend) | F-035, **B-030** |

### 🟡 Sprint 3 — Materiales + Guías

| # | Tarea | Responsable | Tipo | Dependencias |
|---|-------|-------------|------|--------------|
| F-040 | Implementar `MaterialGrid` con filtros | 1-2 personas | 🟠 Conjunto (Backend) | **B-040** |
| F-041 | Implementar `FileUploader` (drag & drop) | 1 persona | 🟠 Conjunto (Backend) | **B-041** |
| F-042 | Implementar `FilePreview` (PDF, imágenes) | 1 persona | 🟢 Paralelo | F-040 |
| F-043 | Implementar listado y vista de Guías | 1-2 personas | 🟠 Conjunto (Backend) | **B-042** |
| F-044 | Implementar editor de Guías (multi-step) | 1 persona | 🟢 Paralelo | F-043 |

### 🟢 Sprint 4 — Perfil, Ranking, Profesores

| # | Tarea | Responsable | Tipo | Dependencias |
|---|-------|-------------|------|--------------|
| F-050 | Implementar perfil de usuario (vista + edición) | 1-2 personas | 🟠 Conjunto (Backend) | **B-050** |
| F-051 | Implementar página de ranking/leaderboard | 1 persona | 🟠 Conjunto (Backend) | **B-051** |
| F-052 | Implementar gamificación visual (badges, niveles) | 1 persona | 🟢 Paralelo | F-050 |
| F-053 | Implementar evaluación de profesores | 1-2 personas | 🟠 Conjunto (Backend) | **B-052** |
| F-054 | Implementar notificaciones en tiempo real | 1 persona | 🟠 Conjunto (Backend) | **B-053** |
| F-055 | Implementar panel de administración | 1-2 personas | 🟠 Conjunto (Backend) | **B-060** |

---

## 🔑 Leyenda de Tipos de Tarea

| Icono | Tipo | Significado |
|-------|------|-------------|
| 🔵 | **Solo** | Se puede hacer independientemente, sin esperar a otros equipos |
| 🟢 | **Paralelo** | Se puede hacer al mismo tiempo que otras tareas del mismo sprint |
| 🟠 | **Conjunto** | Requiere coordinación con otro equipo (se indica cuál). Necesita que la API o el modelo de datos esté listo |

> [!IMPORTANT]
> Las tareas marcadas con **B-XXX** en dependencias requieren que el equipo de Backend tenga lista esa funcionalidad (al menos el endpoint). Se recomienda acordar contratos de API (schemas JSON) antes de empezar para poder trabajar con datos mock mientras tanto.

---

## 📏 Convenciones de Código

```
frontend/
├── src/
│   ├── app/                    # App Router de Next.js (páginas)
│   │   ├── (auth)/             # Grupo de rutas de autenticación
│   │   ├── (main)/             # Grupo de rutas principales
│   │   ├── admin/              # Rutas de administración
│   │   ├── layout.tsx          # Layout raíz
│   │   └── globals.css         # Estilos globales + tokens
│   ├── components/
│   │   ├── ui/                 # UI Kit (Button, Input, Modal...)
│   │   ├── layout/             # Navbar, Footer, Sidebar...
│   │   ├── auth/               # LoginForm, RegisterForm...
│   │   ├── foro/               # ThreadCard, CategoryList...
│   │   ├── materiales/         # MaterialGrid, FileUploader...
│   │   └── shared/             # Componentes compartidos
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utilidades, API client, validaciones
│   ├── stores/                 # Zustand stores
│   ├── types/                  # Tipos TypeScript compartidos
│   └── styles/                 # CSS Modules adicionales
```

### Reglas
- **Nombre de archivos**: `PascalCase` para componentes (`ThreadCard.tsx`), `camelCase` para utils (`formatDate.ts`)
- **CSS Modules**: `ComponentName.module.css` junto al componente
- **Exports**: Named exports, no default exports (excepto páginas de Next.js)
- **Tests**: Colocación junto al componente (`ThreadCard.test.tsx`)

---

*📅 Última actualización: Julio 2026*

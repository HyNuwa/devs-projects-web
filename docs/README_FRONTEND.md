# Frontend (Next.js)

Aplicación web de DevsProject en `apps/frontend`. Consume la API descrita en [`README_BACKEND.md`](README_BACKEND.md).

## Stack

| Tecnología | Uso |
|---|---|
| Next.js 16 (App Router) + React 19 + TypeScript | Framework |
| Tailwind CSS 4 + CSS Modules | Estilos; los tokens viven en `src/styles/pixel-notebook-tokens.css` |
| Zustand | Estado global (sesión en `stores/authStore.ts`) |
| axios | Cliente HTTP con cookies (`lib/api.ts`) |
| React Hook Form + Zod | Formularios y validación |
| Radix UI | Primitivas accesibles (diálogos, menús) |
| `@lottiefiles/dotlottie-react` | Animaciones de insignias (`.lottie`) |
| Vitest + Testing Library | Tests (ver [`README_TESTING.md`](README_TESTING.md)) |

`proxy.ts` es el middleware de Next.js 16 y protege las rutas privadas del lado del servidor.

## Rutas actuales

| Ruta | Qué muestra |
|---|---|
| `/` | Portada |
| `/auth/login`, `register`, `verify-email`, `forgot-password`, `reset-password` | Cuenta |
| `/materias`, `/materias/[codigo]` | Listado de materias y página de materia |
| `/materias/[codigo]/resenar`, `/materias/[codigo]/final` | Escribir reseña de cursada y experiencia de final |
| `/resenas`, `/resenas/[id]`, `/finales`, `/finales/[id]` | Reseñas y experiencias de final |
| `/materiales`, `/materiales/[...segments]`, `/materiales/[id]`, `/materiales/nuevo` | Navegación jerárquica de recursos, detalle y subida |
| `/buscar` | Resultados de búsqueda |
| `/profile/me` | Perfil propio |
| `/admin` | Panel de administración y moderación |
| `/validacion/pixel-notebook/*` | Páginas de validación del sistema visual (no son producto) |

**Heredadas, fuera del producto:** `/foro`, `/foro/[categoria]`, `/profesores`, `/profesores/[id]` y `/ranking`, con sus componentes en `components/foro`, `components/professors` y `components/ranking`. No construir sobre ellas; se pueden borrar cuando se decida.

## Sistema visual

**En el código hoy: Pixel Notebook.** Tokens `--pn-*` (canvas crema `#fff7eb`, tinta `#1a1932`, cobalto `#0069aa`, naranja `#ff5000`) en `src/styles/pixel-notebook-tokens.css`, alias en `globals.css`. La única fuente web es Press Start 2P (`--font-pixel`); el resto usa pilas nativas. Scripts de verificación: `verify:design-tokens`, `verify:kaomoji`, `verify:assets`, `verify:prototype`.

**Hacia dónde va: el rediseño.** El canvas [DevsProject · Home](https://claude.ai/artifact/VwRuyScjfH3AjjpF2SPYaU) tiene todas las pantallas, en escritorio y mobile:

- Portada, Materias (Universidad → Facultad → Carrera → Materia), detalle de recurso y subida en popup.
- Experiencias, Eventos, Clasificados (venta y tutorías), Búsqueda.
- Mi espacio (mochila, perfil, progreso, novedades, mis aportes, configuración).
- Acceso, Moderación, Estados y errores, Ayuda (normas, puntos, FAQ, términos).

Estilo del rediseño:

- Figtree 800 para los títulos, con tracking −0.05em.
- Azul marino `#021238` y azul `#0A4DE8`, con un punto naranja.
- Página crema `#FDF3E5` con cuadrícula; tarjetas blancas con borde de 1.5 px.
- Chips pastel por tipo de recurso, y Caveat para los textos manuscritos.
- El gato como mascota; el arte está en `docs/assets/mascota/`.

Navegación: Inicio · Materias · Experiencias · Eventos · Clasificados. En mobile va una barra inferior: Inicio · Materias · Subir · Experiencias · Clasificados.

Adoptar el rediseño es un cambio planificado: pasa por OpenSpec (ver [`agents/workflow.md`](agents/workflow.md)).

## Recursos estáticos

| Carpeta | Contenido |
|---|---|
| `public/assets/pixel-notebook/`, `cards/` | Arte del sistema actual |
| `public/assets/insignias/gema/` | Insignias (`.svg` estático y `.lottie` animado). Se regeneran con `pnpm --filter frontend assets:insignias` (`scripts/insignias/generar.py`). |

## Estructura

```
apps/frontend/src/
├── app/            rutas (App Router)
├── components/     por área: auth, community, discovery, materials, subjects, profile, admin,
│                   home, layout, shared, ui, validation (+ foro, professors, ranking heredados)
├── lib/            api.ts y utilidades
├── stores/         zustand
├── styles/         tokens
├── types/          tipos compartidos
└── proxy.ts        protección de rutas
```

## Convenciones

- Componentes en `PascalCase.tsx`; utilidades en `camelCase.ts`.
- CSS Module `Componente.module.css` junto al componente cuando no alcanza con Tailwind.
- Named exports, salvo `page.tsx` y `layout.tsx`.
- Tests junto al componente (`LoginForm.test.tsx`).
- Textos de interfaz en español rioplatense (voseo), con el vocabulario de [`CONTEXT.md`](../CONTEXT.md).
- Las lecturas en segundo plano de páginas públicas usan `skipAuthRedirect` para no mandar al login a un visitante.

## Scripts

| Comando (`pnpm --filter frontend …`) | Qué hace |
|---|---|
| `dev`, `build`, `start` | Next.js |
| `lint` | ESLint |
| `test`, `test:watch` | Vitest |
| `verify:*` | Chequeos del sistema visual y de assets |
| `assets:build`, `assets:insignias` | Generar arte del sistema e insignias |

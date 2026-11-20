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
| `/materias/[codigo]/resenar`, `/materias/[codigo]/final` | Escribir o editar (`?editar=<id>`) una reseña de cursada o una experiencia de final (ver [Formularios de Experiencias](#formularios-de-experiencias)) |
| `/experiencias` | Portada de Experiencias: buscador de materias, contexto de Ubicación con chips de carrera, año y tipo (en la URL como `carrera`, `anio`, `tipo`), «Materias más comentadas» y «Recién publicadas» |
| `/experiencias/[codigo]` | Experiencias de una materia: resumen «Cómo les fue» y pestañas Reseñas / Finales con filtros en la URL |
| `/experiencias/escribir` | Elegir materia y tipo antes de ir al formulario (grupo `(focus)`, sin barra inferior). Desde «Cambiar» llega con `tipo`, `materia` y `desde=formulario` ya elegidos |
| `/resenas`, `/resenas/[id]`, `/finales`, `/finales/[id]` | Listados y detalle de reseñas y finales; el detalle suma «La materia según…» y «Con el mismo contexto». Con `?publicada=1` muestra «Publicada» una vez y saca el parámetro de la URL |
| `/materiales`, `/materiales/[...segments]`, `/materiales/[id]`, `/materiales/nuevo` | Navegación jerárquica de recursos, detalle y subida |
| `/buscar` | Resultados de búsqueda |
| `/profile/me` | Perfil propio |
| `/admin` | Panel de administración y moderación |
| `/validacion/pixel-notebook/*` | Páginas de validación del sistema visual (no son producto) |

**Heredadas, fuera del producto:** `/foro`, `/foro/[categoria]`, `/profesores`, `/profesores/[id]` y `/ranking`, con sus componentes en `components/foro`, `components/professors` y `components/ranking`. No construir sobre ellas; se pueden borrar cuando se decida.

## Formularios de Experiencias

`ReviewForm` y `ExamForm` viven en `components/experiences/forms/`. Cada uno es una sola página con secciones numeradas, no un asistente por pasos:

| Formulario | Secciones |
|---|---|
| Reseña de cursada | ¿Qué querés contar? · Contexto de la cursada · Cómo terminó · Tu experiencia · Publicación |
| Experiencia de final | ¿Qué querés contar? · La mesa · Cómo te fue · Temas que tomaron · Preparación · Tu experiencia · Publicación |

Piezas compartidas, en la misma carpeta:

- `FormSection` y `FormField`: encabezado numerado y la marca «Obligatorio» / «Opcional» de cada campo.
- `PublicationSection`: «Publicar como anónimo» (apagado por defecto y bloqueado al editar), la regla de publicación inmediata y la barra de publicar.
- `ExperiencePreview`: «Así se va a ver», al costado del formulario desde `lg`. Arma los datos con `courseReviewFacts` y `examExperienceFacts` de `components/experiences/facts.tsx`, los mismos que usa el detalle, así que una entrada se ve igual antes y después de publicarla.
- `TopicsInput`: los temas del final como chips (Enter agrega, hasta 10), con las sugerencias de `GET discovery/subjects/:code/exam-topics`.
- `NumberStepper` y `ChosenTypeAndSubject`.

Las unidades de los datos (semanas y meses de preparación, horas y minutos del examen, «Unas N horas de estudio en total») se convierten y se muestran con `components/experiences/format.ts`.

Al publicar:

- Si queda publicada, el formulario abre `/resenas/<id>?publicada=1` o `/finales/<id>?publicada=1`, y el detalle muestra «Publicada».
- Si queda en revisión previa, muestra `PriorReviewNotice`.
- La reseña conserva el diálogo de cursada probablemente duplicada.

Al editar, la página es la misma, con «Guardar cambios». A una entrada vieja le pide los datos obligatorios que le faltan («Falta: …»), y un final nunca reenvía la fecha, la franja ni la dificultad verbal heredadas.

**Borrador al tocar «Cambiar».** Antes de abrir `/experiencias/escribir?tipo=resenar|final&materia=<código>&desde=formulario`, el formulario guarda lo escrito en `sessionStorage`, en una sola entrada `experience-draft` (`forms/experience-draft.ts`). El elegidor arranca con ese tipo y esa materia, y «Continuar» lleva `?desde=formulario` al formulario siguiente, que solo entonces lee el borrador:

- Mismo tipo: recupera todos los campos.
- Otro tipo: recupera solo el relato y la elección de anónimo.
- Otra materia: descarta el profesor (o el examinador del final).

El borrador se borra al publicar y al tocar «Cancelar». Si `sessionStorage` no está disponible, solo se pierde el borrador.

**En mobile.** Debajo de `lg`, el formulario va en una columna, sin vista previa. La barra de publicar queda fija abajo (`sticky`, con `env(safe-area-inset-bottom)`) y nunca tapa el último campo. Para que `sticky` funcione, `html` y `body` usan `overflow-x: clip` en `globals.css`, no `hidden`.

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
├── components/     por área: auth, community, discovery, experiences, materials, subjects, profile,
│                   admin, home, layout, shared, ui, validation (+ foro, professors, ranking heredados)
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
- Toda reseña o final se muestra con `ExperienceCard` (`components/experiences`): listados, portada, materia y relacionadas usan la misma tarjeta. Un autor anónimo se muestra como «Anónimo» con `AnonymousMark` en el lugar del avatar, nunca con su perfil.

## Scripts

| Comando (`pnpm --filter frontend …`) | Qué hace |
|---|---|
| `dev`, `build`, `start` | Next.js |
| `lint` | ESLint |
| `test`, `test:watch` | Vitest |
| `verify:*` | Chequeos del sistema visual y de assets |
| `assets:build`, `assets:insignias` | Generar arte del sistema e insignias |

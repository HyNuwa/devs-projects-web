## Context

The frontend (Next.js 16 App Router, React 19, Tailwind v4, source-owned shadcn components in `src/components/ui/shadcn`) currently renders the Pixel Notebook system:

- `src/styles/pixel-notebook-tokens.css` declares `--pn-*`. `src/app/globals.css` maps them onto semantic roles (`--background`, `--primary`, …) exposed to Tailwind through `@theme inline`, and still declares legacy aliases (`--color-primary-50…900`, `--color-accent-*`, `--color-bg-*`, `--color-text-*`, `--font-heading`, `--font-body`, `--paper-ruled`).
- 38 files outside `globals.css` (mostly the 35 legacy CSS Modules) reference those legacy aliases or `--pn-*` directly, and about 20 use `--font-pixel` / `.font-pixel` (Press Start 2P, loaded in `layout.tsx`).
- `src/app/layout.tsx` renders `Navbar` and `Footer` around every route. `/auth/**` already sits in an `(auth)` route group, but that group has no layout of its own.
- `scripts/verify-pixel-notebook-tokens.mjs` (`pnpm verify:design-tokens`) asserts the Pixel Notebook values.

The canvas sources in `design/canvas/home/project/` are the visual reference: `Main.dc.html` (desktop header, signed out), `MenuAvatar.dc.html` (signed-in header and account menu) and `MovilInicio.dc.html` (mobile header and bottom bar). Motivation and scope are in `proposal.md`; the behavior is specified in `specs/frontend/app-shell` and `specs/frontend/visual-identity`.

## Goals / Non-Goals

**Goals:**
- One canonical token file, and no path by which old tokens keep leaking in.
- Shell variants chosen by route-group layouts, not by pathname checks inside shell components.
- A single declarative navigation config that drives the desktop menu, the bottom bar, the footer and the current-destination logic.

**Non-Goals:**
- Pixel-matching legacy pages. They only get the token remap and keep their current layouts and hard-coded hex values.
- Replacing CSS Modules with Tailwind.
- A search overlay, notifications, the mochila button or level display.

## Decisions

### 1. Tokens: `src/styles/tokens.css` with `--dp-*`, roles re-pointed
New canonical file (replacing `pixel-notebook-tokens.css`) with the canvas values:

| Token | Value | Role it feeds |
|---|---|---|
| `--dp-ink` | `#021238` | foreground, border, card outline |
| `--dp-ink-soft` | `#3D4459` | menu text, secondary text |
| `--dp-muted` | `#5a6178` (the canvas' inactive-tab gray; `#6B7286` is 4.37:1 on cream) | muted-foreground |
| `--dp-blue` | `#0261FE` | primary, ring |
| `--dp-link` | `#0A4DE8` | links, current menu item |
| `--dp-blue-tint` | `#ECF2FE` | secondary / selected backgrounds |
| `--dp-page` | `#FDF3E5` | background |
| `--dp-surface` | `#FFFFFF` | card, popover, input |
| `--dp-line` | `#E2D9C7` | subtle borders (secondary buttons, fields at rest) |
| `--dp-pink` | `#FD4F8D` | destructive/badge accent |
| `--dp-orange` | `#FA6304` | warning accent |
| `--dp-gold` | `#E9B949` | accent |
| `--dp-green` | `#187a5b` (canvas `#1F8F6B` darkened to reach 4.5:1 on white and cream) | success |
| `--dp-radius-sm/md/lg/xl/pill` | `8 / 11 / 14 / 16 / 999px` | radii |
| `--dp-outline` | `1.5px` | border width |
| `--dp-shadow-pop` | `3px 3px 0 var(--dp-ink)` | emphasized control (Subir) |
| `--dp-grid` | two 1px `rgba(2,18,56,.032)` gradients, 44px (32px below `lg`) | page background |
| `--dp-font-sans`, `--dp-font-hand` | `var(--font-figtree)`, `var(--font-caveat)` plus fallbacks | typography |

`globals.css` keeps the `@theme inline` bridge and semantic roles, but they resolve to `--dp-*`. Tailwind's radius scale maps to `--dp-radius-*` instead of forcing `0`.
*Alternative considered*: keep the token names and only change their values. Rejected because names like `--pn-cobalt` would lie about their contents, and the check could no longer tell old from new.

### 2. Codemod for legacy references instead of keeping aliases
A one-off script (`scripts/codemods/remap-legacy-tokens.mjs`, deleted after use) rewrites every legacy reference in `src/**/*.{css,tsx,ts}` to the nearest semantic role. Examples: `--color-text-primary` and `--pn-ink` → `--foreground`; `--color-text-secondary` and `--pn-muted` → `--muted-foreground`; `--color-primary-500/600/700` and `--pn-cobalt` → `--primary`; `--color-primary-50/100/200` → `--secondary`; `--color-bg-secondary` and `--pn-surface` → `--card`; `--pn-canvas` → `--background`; `--pn-line` and `--pn-border` → `--border`; `--color-accent-gold` → `--accent`; `--color-accent-red` → `--destructive`; `--font-heading`, `--font-body`, `--font-pixel` and `--pn-font-*` → `--font-sans`, except `--pn-font-mono` → `--font-mono`. The `.font-pixel` class becomes `font-sans`. The full table lives in the script. The declarations are then removed from `globals.css`.
*Alternative considered*: keep the aliases, pointed at the new values. Rejected because they would never go away and would hide unmigrated code from the check.

### 3. Fonts through `next/font/google`
Figtree (variable, 400–900) and Caveat (600, 700) are loaded in the root layout with `display: 'swap'`, exposed as `--font-figtree` and `--font-caveat`. Press Start 2P is removed. `color-scheme: light` is set on `html` so form controls ignore OS dark mode.

### 4. Shell variants through route groups
- `app/layout.tsx`: `html`/`body`, fonts, providers, `AuthInitializer`, skip link and `<main id="main-content">`, with no header or footer.
- `app/(site)/layout.tsx`: `SiteHeader` + children + `SiteFooter` + `BottomBar`, with bottom padding equal to the bar height plus `env(safe-area-inset-bottom)` below `lg`.
- `app/(focus)/layout.tsx`: `SiteHeader` + children + `SiteFooter`, no `BottomBar`. It holds `materiales/nuevo`, `materias/[codigo]/resenar` and `materias/[codigo]/final`, moved with `git mv`, so URLs don't change.
- `app/(auth)/layout.tsx`: `AccessHeader` (logo plus one complementary link: `Ingresar` when the selected segments include `register`, `Crear cuenta` otherwise, read with `useSelectedLayoutSegments`) + children.

- `app/(prototype)/layout.tsx`: only `MainContent`, for the Pixel Notebook validation prototype, which brings its own header.
- `app/not-found.tsx`: unknown URLs render outside every group, so it composes the full shell itself.

All remaining top-level routes move under `(site)`. Route groups do not change URLs, so links, `proxy.ts` matchers and tests stay valid. The move is its own commit so the diff is reviewable.
*Alternative considered*: one shell that hides parts by `usePathname()`. Rejected in grilling (P13) because every new focus screen would edit the shell.

### 5. Navigation config and current destination
`src/components/layout/navigation.ts` exports:
- `primaryDestinations`: `{ id, label, href, icon, match: string[] }` for Inicio, Materias and Experiencias. Each later change appends an entry.
- `uploadDestination` for Subir.
- `currentDestination(pathname): DestinationId | null`, a pure function. Match patterns are route patterns (`/materias/*/resenar`); the longest matching pattern wins; exact `/` matches only Inicio; `/materiales/nuevo` matches only `upload`.

Header, bottom bar and footer all render from this config. The spec's current-destination table becomes a table-driven unit test.

### 6. Header and account menu
- `SiteHeader` renders both layouts and switches with CSS (`hidden lg:flex` / `lg:hidden`), not a JS media query, to avoid hydration mismatch and layout shift.
- Desktop account menu: shadcn `DropdownMenu` (adds `@radix-ui/react-dropdown-menu`), source-owned in `ui/shadcn/dropdown-menu.tsx`. Mobile: a bottom sheet built on the existing `@radix-ui/react-dialog`. Both render one `accountMenuItems(user)` list, which filters Moderación by role (`MODERATOR | ADMIN | SUPERADMIN`).
- Mis envíos links to `/profile/me#mis-envios`. The submissions section gets `id="mis-envios"` and a heading renamed to «Mis envíos».
- Default avatar: `defaultAvatarFor(userId)` hashes the id (a simple string hash mod N) over `public/avatars/{birrete,crema,guino,max}.png`, copied from the canvas and resized to 96px (WebP).
- The search control is a `Link` to `/buscar` with `aria-label="Buscar"`.

### 7. Base components
`button`, `chip`, `field`, `input`, `breadcrumb` and `state` are restyled in place (same props and variants) so existing call sites keep working: `rounded-[var(--dp-radius-md)]`, 1.5px outlines, no offset shadow except the new `pop` variant used by Subir. Variant names don't change; only `pop` is added.

### 8. Token check replaces the Pixel Notebook check
`scripts/verify-design-tokens.mjs` (the `verify:design-tokens` script now points here; the old script is deleted) asserts the canonical values in `tokens.css`, asserts every semantic role resolves to a `--dp-*` token, and scans `src/` for the forbidden patterns (`--pn-`, `--color-primary-\d`, `--color-accent-`, `--color-bg-`, `--color-text-`, `--font-pixel`, `font-pixel`, `Press_Start_2P`). It is run by the frontend test task and prints the file and line of each violation.

### 9. Verification
- Vitest + RTL: `navigation.test.ts` (table-driven current destination), `SiteHeader.test.tsx` (signed out/in, roles, search link), `AccountMenu.test.tsx` (keyboard, Escape, focus return, sheet), `BottomBar.test.tsx`, layout tests asserting which variant renders what, `defaultAvatarFor` stability.
- Browser: agent-browser at 390, 1024 and 1440px on `/`, `/materias`, `/resenas`, `/auth/login`, `/materias/<codigo>/resenar` signed out and signed in. Screenshots go next to the canvas artboards, and axe runs on each. Evidence goes to `docs/validation/evidence/base-visual/`, with full logs in ignored artifacts per `AGENTS.md`.

## Risks / Trade-offs

- [Legacy pages look off: codemod-mapped roles on top of hard-coded hex values and square Pixel Notebook layouts] → Accepted (grilling P2). Page redesign changes fix them; the codemod at least removes broken or undefined variables.
- [Moving routes into route groups churns many paths and may break imports or tests that use relative paths] → Separate commit, run `pnpm build` and the full test suite right after the move, and keep `@/` imports.
- [Codemod maps some tints badly (e.g. `--color-primary-50` backgrounds becoming `--secondary`)] → Spot-check the worst routes in the browser pass. Wrong mappings are fixed in the table, not by hand in each file.
- [Figtree and Caveat add webfont bytes] → Only needed weights and subsets. `next/font` self-hosts and preloads them, so there is no layout shift from a fallback metric mismatch.
- [`(focus)` and `(site)` both contain a `materias/[codigo]` subtree] → Next.js allows it as long as no two groups define the same final route. The build step verifies it.

## Migration Plan

Frontend only, with no data or API changes. It deploys as a normal frontend release. To roll back, revert the change's commits: the route-group move is URL-neutral in both directions.

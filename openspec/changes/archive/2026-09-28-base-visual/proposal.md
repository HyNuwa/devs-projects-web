## Why

The approved redesign (canvas «DevsProject · Home», sources in `design/canvas/`) replaces the Pixel Notebook look, and every later change in the redesign sequence (publicación inmediata + moderación, puntos e insignias, Universidad/Facultad, Experiencias, Eventos, Clasificados) builds its screens on a shared base. Until the tokens, type, controls and application shell match the canvas, each of those changes would have to restyle the frame it sits in.

## What Changes

- **BREAKING (visual)**: Replace the Pixel Notebook tokens (`--pn-*`, legacy `--color-primary-*` aliases, `--font-pixel`) with a new canonical token set taken from the canvas: navy ink, blue primary, cream page with a faint grid, white surfaces with a 1.5px navy outline, rounded corners. Semantic roles (`--background`, `--primary`, `--border`, radius, shadows) point at the new tokens, so pages that already consume roles restyle without edits.
- Replace the type system: Figtree for all text and Caveat only for handwritten accents, both self-hosted through the framework's font loader. Press Start 2P and the serif display stack are removed. Light mode only.
- Restyle the source-owned base components (button, chip, field, input, breadcrumb, state) to the canvas.
- Rebuild the desktop header: logo, primary menu **Inicio · Materias · Experiencias**, search button to `/buscar`, `Subir material`, the UNJU/FI mark, and either `Iniciar sesión` or an avatar pill with an account menu (Mi perfil, Mis envíos, Moderación for moderators and admins, Cerrar sesión).
- Add a compact mobile header (logo, search, `Ingresar` or avatar) and a fixed bottom bar **Inicio · Materias · Subir · Experiencias** below the desktop breakpoint. The avatar menu opens as a bottom sheet on mobile. **BREAKING**: remove the hamburger menu.
- Add shell variants: a reduced header on `/auth/**` (no bottom bar, no footer), and focus screens (upload, write a reseña de cursada or experiencia de final) without the bottom bar.
- Replace the footer with a minimal one (brand, one-line description, primary destinations, `Subir material`, copyright) that no longer links to legacy routes such as Foro. The Normas link is added by the moderation change, which creates that page; there is no contact channel to link yet.
- Rewrite `apps/frontend/DESIGN.md` for the new system, adjust `PRODUCT.md`, and replace the `verify:design-tokens` check so it also fails on leftover Pixel Notebook tokens or `font-pixel` usage.
- Out of scope: the Portada and other page redesigns; Eventos and Clasificados menu items (each lands with its own change); mochila button, novedades counter and level in the header (mochila and puntos/insignias changes); a dedicated Experiencias landing (a new «Experiencias» change after Universidad/Facultad); dark mode; removing legacy routes.

## Capabilities

### New Capabilities
- `frontend/app-shell`: header, primary menu and current-destination rules, account menu, mobile header and bottom bar, footer, and the shell variants for access and focus screens.
- `frontend/visual-identity`: the canonical design tokens, typography, base control styling and the automated check that guards them.

### Modified Capabilities
- `frontend/pixel-notebook-interface`: removes "Shared light-theme application shell" and "Pixel Notebook visual roles" (superseded by the two new capabilities). Breadcrumbs, preview dialog, accessibility, motion, asset governance and artwork delivery requirements stay unchanged.

## Impact

- **Code**: `apps/frontend/src/app/layout.tsx`, `globals.css`, `styles/pixel-notebook-tokens.css` (replaced), `components/layout/*` (Navbar, Footer, new bottom bar and account menu), `components/ui/shadcn/*`, route-group layouts for `/auth/**` and focus screens, the ~20 files that use `font-pixel`, and `scripts/verify-pixel-notebook-tokens.mjs`.
- **Dependencies**: adds `@radix-ui/react-dropdown-menu`; adds Figtree and Caveat through `next/font/google`; drops Press Start 2P.
- **Visual debt accepted**: 35 legacy CSS Modules with hard-coded colors will look out of place until their pages are redesigned by later changes.
- **Assets**: default cat avatars (`av-*.png` from `design/canvas/home/project/`) move into `apps/frontend/public/`.
- **Docs**: `apps/frontend/DESIGN.md`, `apps/frontend/PRODUCT.md`; verification evidence under `docs/validation/evidence/base-visual/`.

## 1. Tokens and typography

- [ ] 1.1 Write `scripts/verify-design-tokens.mjs` first (canonical `--dp-*` values, semantic roles resolve to `--dp-*`, forbidden legacy patterns with file:line output), point `verify:design-tokens` at it and delete the Pixel Notebook script; verify it fails against the current tree, listing the legacy tokens and `font-pixel` users.
- [ ] 1.2 Create `src/styles/tokens.css` with the design.md token table, re-point the roles and `@theme inline` bridge in `globals.css` (radius scale, outline, grid page background 44px / 32px below `lg`, `color-scheme: light`), and delete `pixel-notebook-tokens.css`; verify the canonical-value part of the check passes.
- [ ] 1.3 Load Figtree (400–900) and Caveat (600/700) with `next/font/google` in the root layout, remove Press Start 2P, and map `--font-sans` / `--dp-font-hand`; verify `pnpm build` succeeds and a component test sees no `--font-pixel` variable.
- [ ] 1.4 Write and run the one-off codemod (`scripts/codemods/remap-legacy-tokens.mjs`) with the design.md mapping table over `src/**/*.{css,ts,tsx}`, replace `.font-pixel` with `font-sans`, remove the legacy alias declarations from `globals.css`, then delete the codemod; verify `pnpm verify:design-tokens` passes with zero violations and `pnpm test` stays green.

## 2. Base components

- [ ] 2.1 Restyle `ui/shadcn/button.tsx` to the canvas (radius, 1.5px outline, solid blue primary, white outlined secondary, ghost) and add the `pop` variant; verify existing button tests pass and a new test covers `pop` and 44px minimum targets.
- [ ] 2.2 Restyle `chip`, `field`, `input`, `breadcrumb` and `state` without changing their props; verify `shadcn-primitives.test.tsx`, `breadcrumb.test.tsx` and `filter-sheet.test.tsx` pass and focus rings remain visible (class assertions on `focus-visible:ring`).
- [ ] 2.3 Add source-owned `ui/shadcn/dropdown-menu.tsx` on `@radix-ui/react-dropdown-menu`; verify the package installs and a smoke test opens it with the keyboard.

## 3. Navigation model

- [ ] 3.1 Implement `components/layout/navigation.ts` (`primaryDestinations`, `uploadDestination`, `currentDestination`) test-first with a table-driven test that covers every current-destination scenario in `specs/frontend/app-shell`, including `/materias/x/resenar` → Experiencias and `/materiales/nuevo` → upload only; verify the test passes.
- [ ] 3.2 Implement `accountMenuItems(user)` and `defaultAvatarFor(userId)` test-first (Moderación only for MODERATOR/ADMIN/SUPERADMIN; same id gives the same avatar; ids spread across all four); copy the four `av-*.png` avatars into `public/avatars/` as 96px WebP; verify the tests pass.

## 4. Shell components

- [ ] 4.1 Build `SiteHeader` (desktop: logo ✦, menu, search link, Subir material, UNJU/FI mark, Iniciar sesión or avatar pill; below `lg`: logo, search, Ingresar or avatar) test-first against the header and account-affordance scenarios; verify `SiteHeader.test.tsx` covers signed-out, USER and MODERATOR and passes.
- [ ] 4.2 Build `AccountMenu` (DropdownMenu on desktop, Dialog bottom sheet below `lg`, same item list, Cerrar sesión calls logout) test-first; verify keyboard open, arrow navigation, Escape, focus return and sign-out tests pass.
- [ ] 4.3 Build `BottomBar` (Inicio · Materias · Subir · Experiencias, emphasized Subir with `pop`, current marker, safe-area padding, `lg:hidden`) test-first; verify `BottomBar.test.tsx` covers the current item and the Subir link.
- [ ] 4.4 Build `SiteFooter` (brand, one-line description, primary destinations and Subir material from the config, copyright, no legacy links) and `AccessHeader` (logo plus `Crear cuenta` or `Ingresar` by segment); verify tests assert there is no Foro link and the correct access link on login and register.
- [ ] 4.5 Add `id="mis-envios"` and the «Mis envíos» heading to the profile submissions section; verify the account-menu link resolves to that anchor in a component test.

## 5. Layouts and route groups

- [ ] 5.1 Move routes into `(site)` and the focus screens (`materiales/nuevo`, `materias/[codigo]/resenar`, `materias/[codigo]/final`) into `(focus)` with `git mv` in a dedicated commit; verify `pnpm build` produces the same URL list as before the move and `pnpm test` passes.
- [ ] 5.2 Slim `app/layout.tsx` to html/body, fonts, providers, skip link and `<main>`; add `(site)`, `(focus)` and `(auth)` layouts per design.md; remove the old `Navbar`, `Footer` and their tests; verify layout tests assert each variant's header, bottom bar and footer presence, and that the skip link is the first focusable element.

## 6. Documentation

- [ ] 6.1 Rewrite `apps/frontend/DESIGN.md` for the redesigned system (tokens with `tokens.css` as the source, Figtree/Caveat, controls, header, account menu, bottom bar, shell variants, links to the canvas and `design/canvas/`) and remove Pixel Notebook guidance from `PRODUCT.md`; verify a grep for "Pixel Notebook" in both files only finds historical mentions.

## 7. Integrated verification

- [ ] 7.1 Run frontend lint, typecheck/build, `pnpm test` and `pnpm verify:design-tokens` with full output in ignored artifacts; verify concise summaries show zero failures.
- [ ] 7.2 With agent-browser, capture `/`, `/materias`, `/resenas`, `/auth/login`, `/auth/register` and `/materias/<codigo>/resenar` at 390, 1024 and 1440px, signed out and signed in (USER and MODERATOR), and compare the header, account menu and bottom bar with the `Main`, `MenuAvatar` and `MovilInicio` artboards; verify screenshots and notes are saved in `docs/validation/evidence/base-visual/`.
- [ ] 7.3 In the browser, check keyboard-only use of the shell (skip link, menu, account menu, sheet), 200% zoom at 1440px without horizontal scroll, content not hidden behind the bottom bar, and an axe run on each captured page; verify no serious or critical axe violations remain and record the results in the evidence folder.
- [ ] 7.4 Run `graphify update .` and verify it completes.

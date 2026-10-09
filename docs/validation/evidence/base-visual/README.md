# base-visual — browser evidence (2026-09-28)

Production build (`pnpm build && pnpm start`) on `localhost:3000`, driven with agent-browser.

**Backend.** No local database was available, so a stand-in on `localhost:3001` answered only `GET /api/v1/auth/me`, with a fixed user (USER or MODERATOR) or a 401, and correct CORS headers. Every other API call returned 503. Page bodies therefore show their error states. This pass covers the shell, not page data.

## Captures

The full set (`<ruta>-<ancho>-<estado>.png` for `/`, `/materias`, `/resenas` and `/materias/IP-101/resenar` at 390, 1024 and 1440px as `visitante`, `user` and `moderador`, plus `/auth/login` and `/auth/register`, the open account menus, and the `canvas-*` reference artboards) was kept locally in the ignored `.audit-logs/base-visual-screens/`. The key views are committed here as WebP:

- Desktop header: `inicio-1440-visitante`, `inicio-1440-user`, `inicio-1024-moderador`
- Account menu: `menu-cuenta-1440-moderador` (dropdown), `menu-cuenta-390-moderador` (bottom sheet)
- Mobile: `inicio-390-visitante` (header and bottom bar), `resenar-390-user` (focus screen, no bar), `login-390-visitante` (access header), `fin-de-pagina-390-visitante` (footer clears the bar)

## Comparison with the canvas

- The desktop header (signed in and signed out), the mobile header and the bottom bar match the artboards in layout, type, colors, outlines and order.
- These differences are intentional, and each is added by a later change: Eventos and Clasificados menu items, the mochila button with its novedades counter, and the account menu's header card (carrera and level), plus its Mi mochila, Mis aportes and Configuración entries.
- Fixed during this pass: the mobile `Ingresar` became an outlined button, as in `MovilInicio`.
- Page bodies still use the pre-redesign layouts, as accepted in the proposal.

## Accessibility

- **axe** (`wcag2a`, `wcag2aa`, `wcag21aa`) on `/`, `/materias`, `/resenas` and `/materias/IP-101/resenar` at 390 and 1440px, signed in: **0 violations** (`axe/*.json`). The `color-contrast` results are "incomplete" because axe cannot resolve colors over the grid gradient. The token pairs were checked by hand: muted on cream 5.6:1, link on cream 5.9:1, white on blue 5.07:1, success on white 5.28:1, destructive on white 4.62:1. `aria-prohibited-attr` on `/resenas` comes from the legacy review-ordering group, not the shell.
- **Keyboard, 1440px**: skip link → logo → Inicio → Materias → Experiencias → Buscar → Subir material → avatar pill. Enter on the skip link focuses `#main-content`. Enter on the pill focuses Mi perfil, ArrowDown moves to Mis envíos, and Escape returns focus to the pill.
- **Keyboard, 390px**: skip link → logo → Buscar → avatar pill. The bottom sheet opens with focus inside it, and Escape returns focus to the pill.
- **200% zoom** (720 CSS px at 1440): `scrollWidth` equals the viewport width on `/`, `/materias` and `/resenas`, so there is no horizontal scroll.
- **Bottom bar**: at the end of each page the footer ends above the bar (footer bottom ≈781.6px, bar top 783px). The first pass found a 1.5px overlap because the reserve ignored the bar's border. It was fixed by reserving 62px plus the safe area.
- **Bug found and fixed**: in a real browser the avatar pill was announced as "Max , abrir menú de cuenta" (two spans), which jsdom hid. It now uses an explicit `aria-label`.

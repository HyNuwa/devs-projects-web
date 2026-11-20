## Why

Since 3a and 3b, each nivel announces what it unlocks in «Tu progreso», but nothing is unlocked yet. There is also no page where other students can see a student's nivel, insignias and contributions: the public profile is only an authenticated API by id, and nothing in the product links to it. Without that page, points and insignias are recognition that nobody else sees. This is 3c-1, the first of the three 3c changes. It stacks on `instituciones`, and 3c-2 (`privilegios-confianza`) and 3c-3 (`rankings-acotados`) build on it.

## What Changes

- **Nivel máximo alcanzado:** a new stored value per account.
  - It only goes up when the ledger recalculates the nivel, and it never goes down: not when points go down, and not under a sanción.
  - It decides the personalization unlocks. The profile keeps showing the current nivel.
  - The migration initializes it with the current nivel. The points rebuild (`rebuild-points`) also sets it to the rebuilt nivel.
- **Personalización del perfil**, edited in *Mi perfil → Perfil público* (`/profile/me`). Every option is predefined and none needs moderation. The backend rejects an option the account has not unlocked.

  | Unlocked by | What |
  |---|---|
  | Nivel 1 | 4 basic cat avatars (the current ones) |
  | Nivel 2 | 4 more cat avatars · pin 1 contribution |
  | Nivel 3 | Accent color (6 options) · pin up to 3 contributions |
  | Nivel 4 | Background: cuadriculado, hoja de apuntes or pixel |
  | Nivel 5 | Avatar frame · illustrated banner (3 options) |
  | Nivel 6 | Título, chosen from the student's insignias |
  | Nivel 7 | 3 special-edition cat avatars |
  | Nivel 8 | Exclusive profile theme |
  | Nivel 9 | Animated cat avatar |
  | Nivel 10 | Legendary frame |
  | Salvavidas (any grado) | Salvavidas frame |

  - **Avatar:** the student's own photo, or any unlocked cat. With no choice, the photo if there is one, and otherwise the cat assigned by id, as today. The chosen avatar shows where an avatar shows today: the account menu and «Tu progreso».
  - **Only on the profile:** the frame, banner, background, accent, theme and título appear only on the perfil público, never on contribution cards.
  - **Insignias destacadas:** up to 3, from any nivel.
  - **Aportes fijados:** only the student's own published contributions, and only reseñas or experiencias signed with their name.
- **Lost choices fall back on read.** No job deletes anything:
  - A choice that is no longer valid is simply not shown. That happens when the insignia behind a título, a destacada or the Salvavidas frame is lost, or when a pinned contribution is retired or deleted.
  - A destacada whose insignia changes grado shows the current grado.
- **«Mostrar mi nivel e insignias»:** a switch in the same section, on by default.
  - When it is off, the nivel, every insignia and the título disappear from the page and from the API.
  - The cosmetic choices stay visible.
  - Keeping the account out of the rankings is applied in 3c-3, which replaces the current rankings.
- **Sanciones hide nothing.** A muted or suspended account keeps its personalization and insignias, because a profile that suddenly went back to the defaults would reveal the sanción.
- **Perfil público page `/usuarios/[username]`**, public and with no sign-in needed:
  - a header with the banner, the avatar with its frame, the name, the título, «Nv. 5 · Siete vidas» and «Miembro desde» with month and year;
  - the insignias destacadas;
  - the aportes fijados;
  - a grid of every public insignia with grado and edición, without dates and never «Ojo atento»;
  - the student's published materials and signed reseñas and experiencias, paginated.

  Anonymous entries never appear on the page and never link to it. The student's declared plans never appear either.
- **Links to the profile:** the author's name links to the profile on named materials, reseñas and experiencias in the redesigned pages, and «Mi perfil» gets «Ver mi perfil público». Rankings get the link in 3c-3.
- **Art:** produced inside this change:
  - with `codex-imagegen`: the 4 nivel-2 cats, the 3 nivel-7 cats and the 3 banners;
  - in CSS: the accents, backgrounds, frames and the nivel-8 theme;
  - the nivel-9 cat is an existing cat with a subtle animation, which stays still under reduced motion.
- **Out of scope:**
  - privileges (3c-2);
  - ranking exclusion, the ranking links and the new rankings (3c-3);
  - the legacy pages that the cleanup change will delete (`/materiales/[id]`, `/ranking`, `/foro`), which keep their current avatar;
  - notifications about lost choices.

## Capabilities

### New Capabilities
- `reputation/profile-customization`: the predefined options, which nivel máximo alcanzado or insignia unlocks each one, the student's choices with their validation and fallback on read, the insignias destacadas, the aportes fijados and the chosen avatar.
- `reputation/public-profile`: the public page and API by username, what they show and hide (including the «Mostrar mi nivel e insignias» switch and sanciones), the paginated contributions, and the links from named authors.

### Modified Capabilities
- `reputation/points`:
  - **Levels:** add the nivel máximo alcanzado.
  - **Other accounts see the nivel, not the points:** add the switch.
  - **Points are rebuilt with the new rules:** the rebuild also sets the nivel máximo alcanzado.
- `reputation/badges`:
  - **Public insignias:** they respect the switch and show the destacadas first.

## Impact

- **Backend:**
  - `prisma/schema.prisma` and a migration: `User.maxLevel`, initialized from `level`, and a new `ProfileCustomization` table (one row per account, created lazily).
  - `point-ledger.ts` and `rebuild-points.ts`, for `maxLevel`.
  - A new profile customization catalog and service in `users`.
  - `GET`/`PUT /users/me/profile-customization`.
  - A public `GET /profiles/:username` and `GET /profiles/:username/contributions`.
  - `GET /users/:id` returns the same public projection.
  - `/users/me` adds the chosen cat.
- **Frontend:**
  - a «Perfil público» section in `ProfilePage`;
  - a new `/usuarios/[username]` route with its components and client;
  - avatar resolution in `AccountMenu` and `ProgressPage`;
  - author links in `CommunityDetailPage`, `CommunitySummaryCards`, `MaterialPreviewDialog` and the search rows;
  - new art under `public/avatars/` and `public/assets/perfil/`.
- **Data:** an additive migration only. `devs_project_moderacion` gets it with `migrate deploy`, without reset or seed.
- **Docs:** `README_PUNTOS_E_INSIGNIAS.md` (§4, §8, state), `CONTEXT.md` (already has the terms) and `README_DATABASE.md`.

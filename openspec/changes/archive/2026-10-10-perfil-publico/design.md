## Context

- **Points and levels (3a):** `User.level` is recalculated in `PointLedger` from `max(0, points)` and can go down. Nothing stores the highest nivel reached.
- **Insignias (3b):** they are evaluated on read (`BadgeService.evaluate`). `UsersService.publicProfile(id)` already returns the public projection: no points, no dates, no «Ojo atento». It does a throttled evaluation, at most once a minute per account and per instance.
- **The only public profile endpoint** is `GET /users/:id`. It is authenticated and takes a UUID, and no frontend page uses it.
- **Avatar:**
  - `User.avatarUrl` holds an uploaded photo, sent through `POST /users/me/avatar`.
  - Without one, `defaultAvatarFor(id)` picks one of the 4 cats in `public/avatars/` (birrete, crema, guino, max) by an FNV-1a hash.
  - `AccountMenu` and `ProgressPage` render `avatarUrl ?? defaultAvatarFor(id)`.
- **«Tu progreso»** shows each nivel's `unlocks` text from `rpg-levels.ts`.
- **Contributions:**
  - `Material` (`publicationStatus`, `isDeleted`);
  - `CourseReview` and `ExamExperience` (`publicationStatus`, `isAnonymous`). An author's delete removes the row.
  - Public reseñas live at `/resenas/[id]` and experiencias at `/finales/[id]`.
  - Materials have no standalone page in the redesign: they open in `MaterialPreviewDialog`.
- **Grilling decisions (README_PUNTOS_E_INSIGNIAS §4 and §5.2):**
  - Sanciones hide nothing.
  - Cosmetics stay visible when «Mostrar mi nivel e insignias» is off.
  - Lost insignias drop their choices.
  - Lower niveles never drop anything.

## Goals / Non-Goals

**Goals:**
- Store the nivel máximo alcanzado and keep it monotonic, in one place: the ledger.
- Keep one server-side catalog of options and unlock rules, used both to validate writes and to describe the options to the editor.
- Make every choice that can go stale (insignia lost, contribution retired) fall back on read, with no cleanup jobs or triggers.
- Provide a public, sign-in-free perfil público by username, with one projection shared by every public endpoint.

**Non-Goals:**
- Ranking exclusion and ranking links (3c-3). The current `/ranking` is replaced there, in the same release train.
- Privileges (3c-2).
- Touching the legacy pages that the cleanup change deletes (`/materiales/[id]`, `/ranking`, `/foro`, `RankingList`). They keep rendering `avatarUrl` as today.
- Notifications about lost choices.
- Uploaded banners or backgrounds.

## Decisions

### `User.maxLevel`, written by the ledger with `GREATEST`

- **Column:** `max_level INT NOT NULL DEFAULT 1`, backfilled with `UPDATE users SET max_level = level` in the migration.
- **Ledger:** where `PointLedger` already recalculates the nivel inside the locked transaction, it writes `level = $new` and `max_level = GREATEST(max_level, $new)` in the same update. That runs on every movimiento, including reversals and sanctioned accounts, but `GREATEST` keeps the value monotonic.
- **Rebuild:** `rebuild-points` sets `maxLevel = level`, the decision in README §3.3 and the points spec. This is the only path that can lower it, and it is an admin repair that needs explicit consent.
- **Alternative rejected:** deriving the maximum from the ledger history on read. The history before 3a is reconstructed, and the read would scan every movimiento.

### `ProfileCustomization`: one lazy row per account

The table is `profile_customizations`, with `user_id` as the PK, FK to `users`, `ON DELETE CASCADE`:

| Column | Type | Meaning |
|---|---|---|
| `avatar_cat` | varchar(40), null | null = photo if uploaded, else the id cat |
| `accent` | varchar(40), null | accent color |
| `background` | varchar(40), null | background |
| `frame` | varchar(40), null | frame |
| `banner` | varchar(40), null | banner |
| `theme` | varchar(40), null | theme |
| `title_badge` | varchar(40), null | slug of the insignia used as título |
| `featured_badges` | text[], default `{}` | ordered slugs, at most 3 |
| `pinned` | jsonb, default `[]` | ordered `{ "type": "MATERIAL" \| "COURSE_REVIEW" \| "EXAM_EXPERIENCE", "id": uuid }`, at most 3 |
| `show_level_and_badges` | boolean, default true | the «Mostrar mi nivel e insignias» switch |

`created_at` and `updated_at` complete the table.

- **Lazy row:** a missing row means all defaults, so no backfill is needed.
- **Why plain columns and no FK tables for pins or badges:** stale values are expected. A pin to a deleted reseña is filtered on read, and it comes back if the content is restored. FK cascades would lose the restore case and add three tables.
- **Alternative rejected:** a `ProfilePin` table with three nullable FKs.

### Option catalog in `users/profile-options.ts`

A typed constant list `{ id, kind, unlock: { level: n } | { badge: slug } }`, with:

| Kind | Ids | Unlocked by |
|---|---|---|
| cat | `birrete`, `crema`, `guino`, `max` | nivel 1 |
| cat | `gato-lentes`, `gato-bufanda`, `gato-lapiz`, `gato-mate` | nivel 2 |
| cat | `gato-pixel`, `gato-dorado`, `gato-nocturno` | nivel 7 |
| cat | `gato-animado` | nivel 9 |
| accent | `menta`, `coral`, `cielo`, `ambar`, `lavanda`, `pizarra` | nivel 3 |
| background | `cuadriculado`, `hoja`, `pixel` | nivel 4 |
| frame | `marco-clasico` | nivel 5 |
| frame | `marco-legendario` | nivel 10 |
| frame | `marco-salvavidas` | «Salvavidas» |
| banner | `banner-biblioteca`, `banner-pasillo`, `banner-atardecer` | nivel 5 |
| theme | `faro` | nivel 8 |

- **Exact values may change** when the art is produced: the cat and banner ids follow what the art shows, and the accents map to existing design tokens. The ids are frozen once the task that writes the catalog's tests lands.
- **Other limits** are `pinLimit(maxLevel)` (0, then 1 at nivel 2, then 3 at nivel 3), `TITLE_LEVEL = 6`, `MAX_FEATURED = 3`, and the ineligible insignia `ojo-atento`.
- **`isUnlocked(option, { maxLevel, heldBadges })`** is a pure function covered by unit tests. The frontend never decides unlocks. It receives each option with `unlocked` and `unlockLabel` («Nv. 5», «Insignia Salvavidas») from the API, and maps ids to CSS classes and asset paths.
- **`gato-animado`** reuses `crema.webp`, with a CSS animation (blink and tail via `transform`) that is off under `prefers-reduced-motion`.

### Customization API

- **`GET /users/me/profile-customization`** returns `{ choices, options[], limits }`, plus the account's eligible insignias (held and public, with grado) for título and destacadas.
- **`PUT /users/me/profile-customization`** replaces every choice, like `PUT /users/me/study-plans`. Validation runs in order, and any failure returns 400 with a Spanish message and writes nothing:
  1. DTO shape: known kinds, array max sizes, UUIDs, no duplicates.
  2. Every option id exists and has the right kind.
  3. Every option is unlocked for the current `maxLevel` and the held insignias as last evaluated. «Tu progreso» and the public profile evaluate on read. A write does not evaluate again, because the evaluation would also drop insignias the account no longer meets, and any lost choice falls back on read anyway.
  4. The título requires `maxLevel >= 6`. Título and destacadas must be held and public.
  5. Pins are within `pinLimit`. Each pin is the caller's own, `PUBLISHED`, not deleted and not anonymous. A violation returns the same 400, «Ese aporte no se puede fijar», whether the content is someone else's, anonymous or missing, so the error never reveals another person's anonymous entry.
- **The write** is an upsert on `profile_customizations`.
- **`/users/me` and `/auth/me`** add `avatarCat`, so the shell can resolve the avatar without a second request. The shell reads its session from `/auth/me`.
- **`GET` returns the effective choices,** not the stored ones: it drops what no longer holds, such as a lost insignia, a retired pin, or an option above a rebuilt nivel. The editor then shows what the perfil público shows, and saving it back is accepted. The editor pages through the student's contributions to pin older ones.
- **`GET`** also returns `pinnedItems`, the resolved pins with their titles, so the editor can name pins older than the first page of contributions.

### One public projection, two entry points

`PublicProfileService.build(user)` produces:

```
{ username, displayName, bio, memberSince: 'YYYY-MM', avatarUrl, avatarCat,
  customization: { accent, background, frame, banner, theme },
  level: { number, name } | null,
  title: Badge | null, featured: Badge[], badges: Badge[] | null,
  pinned: ContributionItem[] }
```

It applies every read-time fallback:
- An option that is no longer unlocked is returned as null. Only the insignia frame can lose its unlock.
- Título and destacadas only include insignias the account still holds, with their current grado, never `ojo-atento`.
- Pins are only returned while they are published, not deleted and named.
- When `show_level_and_badges = false`, `level`, `title`, `featured` and `badges` are null or empty.

Entry points:
- **`GET /profiles/:username`** is `@Public`. It looks the username up by exact match (usernames are unique as typed at registration) and returns 404 «Usuario no encontrado».
- **`GET /profiles/:username/contributions?page=1`** is `@Public`. It runs one raw `UNION ALL` over the three tables, filtered to published, not deleted and named, ordered by `created_at DESC, id`, with `LIMIT 20 OFFSET`. It returns `{ items, page, hasMore }`. Each item is `{ type, id, title, subject: { code, name }, createdAt }`: the material title, or the materia name for a reseña or experiencia.
- **`GET /users/:id`** keeps its route and auth, and returns the same projection, so the existing e2e tests and the institutions spec keep holding.
- **Sanciones:** `isMuted` and `isBanned` are never read by the projection.
- **Badge evaluation** keeps the existing throttled `publicBadges` path.

### Avatar resolution on the frontend

`avatarSrc({ id, avatarUrl, avatarCat })` lives in `components/layout/account.ts`, next to `defaultAvatarFor`:
- with a cat chosen, `/avatars/<cat>.webp` (`gato-animado` uses `crema.webp` plus an animated class);
- otherwise `avatarUrl`;
- otherwise `defaultAvatarFor(id)`.

`AccountMenu`, `ProgressPage`, the editor and the public page use it. Choosing «Mi foto» sends `avatarCat: null`. The photo upload flow is unchanged.

### Pages

- **Editor:** `/profile/me` gets a `PublicProfileEditor` section «Perfil público», between the account card and «Mi carrera».
  - It has radio groups per kind, rendered as swatches and thumbnails. Locked options are disabled, with their `unlockLabel`.
  - Título and destacadas use selects, in order, from the eligible insignias. Pins come from the student's own contributions list (`/profiles/:me/contributions`), up to `limits.pins`.
  - It has the switch, one «Guardar» that PUTs everything, and «Ver mi perfil público».
- **Public page:** `(site)/usuarios/[username]/page.tsx` renders `PublicProfilePage`, fetched client-side like the other public pages.
  - Sections follow the spec order. The banner, background, accent and theme map to CSS classes on the page root. The frames are CSS borders and gradients, with the gem tones for the legendary and Salvavidas frames.
  - A 404 renders the site's not-found state.
  - Material items open `MaterialPreviewDialog`. Reseñas link to `/resenas/[id]` and experiencias to `/finales/[id]`.
- **Author links:** an `AuthorLink` component renders `<Link href="/usuarios/<username>">` for a named author and plain «Anónimo» otherwise. The discovery API sends anonymous entries with the username `Anónimo`, so that value is never linked.
  - It is used in `CommunityDetailPage` and `CommunitySummaryCards`, which cover the reseñas and experiencias in the materia page, `/resenas` and `/finales`.
  - The redesigned material views (preview dialog and `/buscar` rows) do not show the uploader, so there is no author name to link there.

### Art

`codex-imagegen` produces the 4 nivel-2 cats and the 3 nivel-7 cats, matching the existing `birrete`/`crema` style, at 256×256 webp. It also produces the 3 banners at 1500×500 webp (3:1, shown with `object-cover`), in `public/assets/perfil/banners/`. Accents, backgrounds, frames and the `faro` theme are CSS in a `PublicProfile.module.css`, built on existing tokens.

## Risks / Trade-offs

- **The username «Anónimo» is not reserved:** registration accepts any 3–30 character username, so an account could be called «Anónimo». Its signed entries would show unlinked, like anonymous ones. Reserving that username belongs to a registration fix, outside this change.

- **Stale JSON pins:** content that is deleted and never restored leaves a dead entry until the student saves again. The trade is a little storage, and the PUT rewrites the whole list, so it gets pruned.
- **Username enumeration:** `/profiles/:username` confirms that an account exists. Usernames are already public on every signed contribution, so this exposes nothing new.
- **The insignia frame flickers with evaluation lag:** a public read may evaluate insignias at most once a minute, so a lost Salvavidas can still show its frame for up to a minute. That is accepted.
- **Legacy pages show the photo and not the chosen cat:** `/materiales/[id]` and `/ranking` render `avatarUrl` only. They are slated for deletion, so this is recorded for the cleanup change and not fixed.
- **Ranking privacy gap between branches:** with the switch off, the current `/ranking` would still list the account until 3c-3 replaces it. 3c-1 and 3c-3 ship together on stacked branches, so no release contains only 3c-1.
- **Art quality:** generated cats can drift from the existing style. The art task includes a visual comparison against `birrete.webp` and `crema.webp`, plus evidence captures.

## Migration Plan

1. The migration `profile_customization` adds `users.max_level`, backfills it from `level`, and creates `profile_customizations`. It is additive and needs no reset.
2. Dev database: `prisma migrate deploy` only. No seed and no reset.
3. Rollback: `rollback.sql` drops the table and the column, and deletes the migration row from `_prisma_migrations`. Nothing else depends on them.

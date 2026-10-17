## Why

Change 3a gave points and levels, but insignias still exist only as empty `Badge` and `UserBadge` tables and 18 gem assets that nothing uses. `README_PUNTOS_E_INSIGNIAS` §6 defines insignias as the recognition of quality (a material that helped 50 students) that points alone don't show. This is part 3b of change 3. Part 3c (profile personalization, privileges and rankings) builds on it.

## What Changes

- **Catalog:** 17 insignias of §6.2, everything except «Lupa», which needs «Sugerir correcciones» (3c). Each has a verifiable criterion, a rarity (común, rara, de temporada, edición única) and, for some, grados (bronce, plata, oro).
- **Calendar:** for Constante, Temporada de finales and Primera camada, in configuration with defaults:
  - Cuatrimestres: March–July and August–December; January and February count with the preceding one.
  - Mesas: February–March, July and December.
  - Primera camada: awarded only once its cutoff dates are configured.
- **Evaluation:** an account's insignias are recomputed from its current published, signed contributions, valid «Me sirvió» and confirmed reportes. An insignia is lost, or loses grado, when what earned it is retired or deleted. Anonymous entries never count. Seasonal insignias are earned per edición.
- **«Tu progreso»** gains an Insignias section:
  - the collection, earned and pending, with grado, edición, rarity and the earn date;
  - the three closest pending insignias with their progress («Te faltan 12 "Me sirvió"»).

  A newly earned insignia plays its gem's «entrada» animation the first time it is seen.
- **Public profile API:** `GET /users/:id` returns the account's earned insignias with grado and edición, but no dates. «Ojo atento» is never included, because it is about reporting. The public profile page comes with 3c.
- **Backfill:** the existing rebuild adds insignias retroactively, already marked seen. Seasonal ediciones count only contributions shared during their period, so no past edición is invented.
- **Out of scope:** Lupa, pinning 3 insignias on the profile, the public profile page, titles chosen from insignias (3c), and notifications (a separate plan).

## Capabilities

### New Capabilities
- `reputation/badges`: the insignia catalog and criteria, grados, ediciones and the calendar; losing insignias; how they appear in «Tu progreso» and in the public profile API.

### Modified Capabilities
<!-- None: «Tu progreso» and the public profile gain insignias through new requirements in reputation/badges. -->

## Impact

- **Backend:**
  - `prisma/schema.prisma` and a migration:
    - `Badge`: slug, rarity and sortOrder (the Primera camada window lives in configuration).
    - `UserBadge`: tier, edition, `seenAt`, and a unique key that includes the edition.
  - A badge catalog seed.
  - A `BadgeService` in the ranking module.
  - `GET /me/badges` and a «seen» endpoint.
  - `users.service.ts` (public badges).
  - `rebuild-points.ts`.
  - Calendar settings in `env.validation.ts`.
- **Frontend:** the Insignias section of «Tu progreso», with `@lottiefiles/dotlottie-react` (already installed) and the existing gems in `public/assets/insignias/gema/`.
- **Docs:** `README_PUNTOS_E_INSIGNIAS` (§6 and §11.2 decisions) and `CONTEXT.md` (already updated: Insignia, Grado, Edición).

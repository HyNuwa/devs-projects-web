# Evidence: perfil-publico (3c-1)

Browser check with agent-browser on 2026-10-10, against the dev database `devs_project_moderacion`. The migration `20261012000000_profile_customization` was applied with `prisma migrate deploy`, without reset or seed.

For the demo, the account `moderator` got two temporary changes:
- `max_level` raised to 10, so every option is unlocked;
- a signed reseña de cursada on Álgebra Lineal, so there is a contribution to pin and an author link.

Both were reverted afterwards: the reseña and the customization row were deleted, and `max_level` went back to 6.

| File | What it shows |
|---|---|
| `avatares-hoja-de-contacto.webp` | The 4 existing cats next to the 7 new ones (nivel 2 and nivel 7), generated with `codex-imagegen` and cleaned up (gaps and a watermark in `gato-dorado`, `gato-bufanda` and `gato-mate`). |
| `editor-perfil-publico-1440.webp` | *Mi perfil → Perfil público*: the switch, the options with their previews, Marco Salvavidas locked by its insignia, the título locked below nivel 6, and a pinned contribution. The account menu and the avatar card already show the chosen cat. |
| `perfil-publico-1440.webp`, `perfil-publico-390.webp` | `/usuarios/moderator` signed out: Atardecer banner, gato dorado with the legendary frame, coral accent, «hoja de apuntes» background, «Nv. 7 · Biblioteca viva», aportes fijados and contributions. |
| `perfil-publico-oculto-faro-1440.webp` | With «Mostrar mi nivel e insignias» off and the `faro` theme: no nivel shown, while the frame and the contributions stay. |
| `perfil-publico-movimiento-reducido-1440.webp` | With reduced motion: the animated cat has no animation class. Without reduced motion it does (checked by reading the class). |

The author link was checked on `/resenas/<id>`: the signed reseña shows `moderator` as a link to `/usuarios/moderator`.

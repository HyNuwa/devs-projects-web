# puntos-insignias: browser evidence

Checked on 2026-10-10 against the local API and `next dev`, as the demo student `user`, on the development database with the `badges` migration applied. `user` uploaded a published resumen through the API (normal use), which met «Primer aporte» and «Primera luz».

| Check | Width | What was done | Evidence |
|---|---|---|---|
| Insignias with reduced motion | 1440 | The headless browser reports `prefers-reduced-motion: reduce`: «Tu progreso» shows the closest insignias with progress in words («Te falta 1 cuatrimestre seguido»), the two earned ones with rarity and «Ganada · oct 2026», and the pending ones with their criterion. The new gems show still, with no animation. | `insignias-movimiento-reducido-1440` |
| Entrada animation | 1440 | With motion allowed and the two insignias unseen, the section renders 2 animated gems (canvas, marker «entrada»); on the next visit it renders none, because the first visit marked them seen. | `insignias-entrada-1440` |
| Mobile | 390 | The same section at 390 px, already seen. | `insignias-390` |

## Accessibility

axe (`wcag2a`, `wcag2aa`, `wcag21aa`) on the reduced-motion and mobile captures: 0 violations (`axe/*.json`).

# Pixel Notebook accessibility verification — 2026-09-02

## Outcome

**Partially verified — OpenSpec task 9.5 remains incomplete.**

Static foundations, the responsive shell, and dialog focus management passed.
The remaining real-data routes cannot be audited while the configured backend
database is unavailable, so this is not a final accessibility approval.

## Corrections made during the audit

- The root shell now exposes a keyboard-reachable `Saltar al contenido
  principal` link and a focusable `#main-content` target.
- The footer no longer uses `transition: all`; it lists the three animated
  properties explicitly.

## Verified evidence

- Focused automated run: `MaterialPreviewDialog.test.tsx` and
  `accessibility-foundations.test.tsx` — 2 files, 15 tests passed in 6.80 s.
- The dialog test verifies focus moves into the Radix dialog, background list
  content becomes inert, Escape/outside/explicit close paths work, and focus
  returns to the selected material trigger.
- The foundation test verifies global visible `:focus-visible` treatment,
  zoom-safe sizing, semantic error evidence, reduced-motion CSS, keyboard
  order, and a representative axe run.
- In a real browser at 390 × 844, the compact navigation exposed an `Abrir
  navegación` button, a labelled `Menú principal` dialog, a labelled close
  button, and a labelled primary navigation region.
- Source review covered the shared layout, global stylesheet, navbar,
  breadcrumbs, homepage search, material hierarchy, and preview dialog. The
  reviewed controls use semantic links/buttons, labels, non-color status
  content, visible focus styles, and `aria-live` for asynchronous feedback.

## Remaining close-out conditions

1. Restore PostgreSQL on the configured port (or use representative staging
   data) so hierarchy breadcrumbs and the preview dialog can be exercised end
   to end.
2. Complete 200% browser zoom and real-route contrast checks on homepage,
   hierarchy, review, final, and preview-dialog flows.
3. Re-run the accessibility audit on the healthy built product and close task
   9.5 only if no high-severity issue remains.

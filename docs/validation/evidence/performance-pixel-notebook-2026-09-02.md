# Pixel Notebook performance verification — 2026-09-02

## Outcome

**Blocked — OpenSpec task 9.6 remains incomplete.**

The image-loading contract was verified and one defect was corrected, but the
repository does not define numeric LCP, CLS, or image-transfer thresholds and
the configured backend database is currently unavailable. A final performance
approval would therefore be misleading.

## What was verified

- A real browser loaded `/`, `/materias`, `/materiales`, `/resenas`, and
  `/finales` at a 1280 px viewport.
- `/`, `/resenas`, and `/finales` each emitted exactly one
  `link[rel="preload"][as="image"]` for the active route hero after the fix.
  `/materias` and `/materiales` emitted no hero preload because they render no
  hero artwork.
- The three hero `srcset` values use Next Image candidates sourced from the
  approved local `.webp` files. No source PNG occurs in a default candidate.
- The homepage's 750 px optimized hero response was 37,374 bytes in the local
  server measurement. This is a transfer sanity check, not a network-profiled
  browser result.
- The footer logo remained lazy-loaded; no inactive route artwork was present
  in the initial document.

## Defect corrected during verification

`/resenas` and `/finales` initially rendered their visible LCP hero with
`loading="lazy"`, unlike the homepage. Both `next/image` instances now use
`priority`, so each active hero receives the same preload treatment while
inactive route artwork remains absent.

## Why task 9.6 cannot be closed

1. The change design and frontend design guidance require measurement, but no
   numeric LCP, CLS, or transfer budget is documented to evaluate against.
2. The in-app browser inspector used for the route checks does not expose the
   real browser Performance APIs. It can verify DOM candidates and preloads,
   but cannot truthfully produce LCP or CLS numbers.
3. The backend configured on PostgreSQL port 5433 is unavailable. Public
   discovery requests return HTTP 500, which changes the normal route content
   and would invalidate a final user-flow performance measurement.

## Validation environment note

The local frontend development compiler loaded the changed routes successfully.
However, the package manager reports a desynchronized `node_modules` and would
purge it before running checks. Direct linting then exposed missing declared
dependencies (`axe-core` and related workspace links), while direct TypeScript
checking also could not resolve declared frontend dependencies. Full command
logs are retained under `%TEMP%/devsproject-9.6-performance/`; this is an
environment dependency issue, not evidence that the priority change fails.

## Required close-out conditions

1. Restore the project database (or use a representative staging deployment).
2. Record explicit budgets for LCP, CLS, and route image transfer.
3. Run Lighthouse or Chrome DevTools against the healthy built product at
   desktop and mobile viewports, preserve the report, and update task 9.6 only
   if every documented budget passes.

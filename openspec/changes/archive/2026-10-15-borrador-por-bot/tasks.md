## 1. Schema

- [x] 1.1 Write a Vitest migration test:
  - a placement with `year` and `semester` both null is accepted;
  - one with only one of them null is rejected;
  - existing placements keep their values;
  - semester 3 is still rejected;
  - `CATALOG_PLAN_READ` exists in `ModerationEventAction`.

  Write the Prisma schema change, the SQL migration `20261020000000_optativas_and_plan_reading` and `rollback.sql`, which aborts while optativa rows exist. Verify the test passes.

## 2. Optativas in the catálogo

- [x] 2.1 Extend the carga masiva parser tests:
  - `O;;Robótica` and `o;;Robótica;6` parse as optativas;
  - `O;2;Robótica` and `O;A;Robótica` are invalid with a Spanish reason;
  - existing lines still parse.

  Implement it in `bulk-parser.ts`. Verify the tests pass.
- [x] 2.2 Write e2e tests for the catálogo API:
  - placing a materia as an optativa (`PUT` placement with `optativa: true`) stores null año and cuatrimestre;
  - moving it to an año keeps one row;
  - the duration ignores optativas;
  - the carga masiva preview marks an `O` line as optativa, and apply adds it and updates an existing placement to optativa;
  - the career detail lists optativas last by name.

  Implement it in the DTOs, `catalog.service.ts` and `catalog-bulk.service.ts`. Verify the tests pass.
- [x] 2.3 Write e2e tests for public reads:
  - the browse carrera endpoint returns optativas in their own list, after the años;
  - the carrera card counts optativas as materias but not towards años or créditos;
  - a materia's carreras show an optativa placement as optativa.

  Implement it in `catalog-browse.service.ts` and `subjects.service.ts`. Verify the tests pass.
- [x] 2.4 Write frontend tests:
  - `CareerView` shows an «Optativas» section after the last año, each optativa linking to its materia;
  - `SubjectHub` says «Optativa» for that carrera;
  - `CareerEditor` places a materia as optativa from the placement form and shows optativas in their own group.

  Implement them, including the client types in `catalog-client.ts`, `catalog-admin-client.ts`, `types/subject.ts` and `ranking-client.ts`. Verify the tests pass.

## 3. Safe fetch and HTML

- [x] 3.1 Write Vitest unit tests for the address classifier: private, loopback, link-local, CGNAT, multicast, unspecified, IPv6 ULA and IPv4-mapped IPv6 are blocked, and public v4 and v6 addresses pass. Implement it with `net.BlockList`. Verify the tests pass.
- [x] 3.2 Write Vitest tests for `safeFetch` against a local `https` server, with the address check injected:
  - `http` refused;
  - redirect to a blocked address refused;
  - a fourth redirect refused;
  - a body over the cap aborted with `PLAN_TOO_LARGE`;
  - wrong content type refused;
  - `application/octet-stream` starting with `%PDF-` accepted;
  - timeout gives `PLAN_UNREACHABLE`.

  Implement it with `node:https` and a checking `lookup`. Verify the tests pass.
- [x] 3.3 Write Vitest tests for `htmlToText` with a fixture of a facultad page:
  - scripts, styles and nav are dropped;
  - tables become rows;
  - entities are decoded;
  - PDF candidate links are absolute `https` with their text, at most 30;
  - text is capped.

  Implement it. Verify the tests pass.

## 4. Model and lectura

- [x] 4.1 Write Vitest tests for `GeminiPlanModel` with a stubbed `fetch`:
  - the request carries the key header, JSON response type, schema and no tools;
  - a PDF is sent as `inline_data`;
  - a 429 `RESOURCE_EXHAUSTED` maps to `AI_QUOTA`;
  - a missing key maps to `AI_NOT_CONFIGURED`;
  - invalid JSON is retried once, then gives `AI_FAILED`;
  - the model name comes from `GEMINI_MODEL`, defaulting to `gemini-3.8-flash`.

  Implement it. Verify the tests pass.
- [x] 4.2 Write Vitest tests for the line builder:
  - valid rows become `año;cuatrimestre;nombre[;créditos]` and `O;;nombre[;créditos]`;
  - `;` and newlines in names are replaced;
  - invalid rows become one notice;
  - duplicates by search key are dropped;
  - more than 200 rows are cut, with a notice;
  - model notices are capped.

  Implement it. Verify the tests pass.
- [x] 4.3 Write e2e tests for `POST /admin/catalog/careers/:id/plan-reading`, with fake fetcher and model:
  - an admin gets `text`, `notices` and `sources`, and the carrera's placements are unchanged;
  - a MODERATOR gets 403;
  - a published carrera or one without `planUrl` gets 409;
  - an HTML page without materias follows the chosen PDF link once and names it in a notice;
  - no materias and no link gives `PLAN_NOT_FOUND`;
  - fetch and AI errors return their codes;
  - each lectura, success or failure, writes one `CATALOG_PLAN_READ` event with its metadata;
  - the daily limit refuses once reached;
  - the 21st lectura in an hour by one admin gets 429.

  Implement the service, controller, `planReading` rate-limit policy and module wiring. Verify the tests pass.
- [x] 4.4 Add `CATALOG_PLAN_READ` to the admin-only history actions and the history `catalog` mapping. Update `history.service.spec` and verify it passes.

## 5. Frontend lectura

- [x] 5.1 Write tests for `BulkLoad`:
  - «Leer plan con IA» shows only for a carrera en borrador with a plan link, and otherwise asks to add the link;
  - while reading it shows «Leyendo el plan…» and disables the button;
  - on success it fills the text box and lists the notices and sources;
  - with text already in the box it asks before replacing it;
  - an error shows its message and keeps the existing text.

  Implement it, with `catalogAdmin.readPlan`. Verify the tests pass.
- [x] 5.2 Add the «Lectura del plan» label and its details (links, lines, notices or error) to `HistoryPanel`, with a test. Verify it passes.

## 6. Docs and checks

- [x] 6.1 Update:
  - README_DATABASE: nullable año and cuatrimestre for optativas, and the new event;
  - README_MODERACION: the lectura del plan in the catálogo history;
  - README_SECURITY: the fetcher's rules and that plan content is data;
  - `.env.example`: `API_KEY_GEMINI`, `GEMINI_MODEL`, `PLAN_READING_DAILY_LIMIT` with comments.

  Verify the docs match the specs.
- [x] 6.2 Run backend and frontend lint, typecheck and test suites through a Haiku subagent, with logs in `.audit-logs/`. Verify everything is green, except the two pre-existing tsc errors noted in 4b.
- [x] 6.3 Manual check with the real key: run the lectura on 3 real plans, one HTML page linking a PDF, one PDF with text and one scanned PDF, against a local carrera en borrador. Record the results, notices and duration in this change's `design.md` under Risks. Verify each produced a usable proposal or a clear error.
- [x] 6.4 Run `graphify update .` and verify it completes.

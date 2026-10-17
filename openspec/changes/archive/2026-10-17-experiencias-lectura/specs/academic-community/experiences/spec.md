## Purpose

Give students one place to read experiencias: the Experiencias landing and its context, the page per materia with its summary, and the related entries on every detail, all computed from the published reseñas de cursada and experiencias de final without inventing facts the platform does not collect.

## ADDED Requirements

### Requirement: Experiencias landing
The product SHALL offer `/experiencias` as the landing of the Experiencias section with, in this order: a hero with the materia search; the context panel «¿Qué estudiás?»; «Materias más comentadas»; «Tu turno» with «Escribir experiencia» and the note that one can publish as Anónimo; «Cómo leer una experiencia» with three fixed rules (each experiencia tells one concrete cursada or final, so look at its ciclo, franja and situación; dificultad is how its author lived it, not a grade; there are no professor scores, so filter by the context closest to yours); and «Recién publicadas». The hero and «Cómo leer» SHALL be static; every other section SHALL follow the landing's context.

#### Scenario: Visitor opens the landing
- **WHEN** a visitor with an ubicación opens `/experiencias`
- **THEN** the page shows the six sections in that order, and «Materias más comentadas» and «Recién publicadas» are computed for the ubicación's facultad

### Requirement: Landing context
The context panel SHALL show the universidad and facultad of the viewer's ubicación, with «Cambiar» opening the ubicación selector; chips of carrera («Todas» plus the published carreras of that facultad); chips of año («Todos» plus 1° up to the highest año of the chosen carrera, or of any carrera of the facultad when «Todas»); and a type segment «Reseñas y finales» / «Solo reseñas» / «Solo finales». Carrera, año and type SHALL be part of the URL (`carrera`, `anio`, `tipo`) so a shared link restores them; the facultad SHALL come from the viewer's own ubicación and SHALL NOT be in the URL. A signed-in student SHALL get the first carrera they declared as cursando preselected when it belongs to the ubicación's facultad, labelled «tomado de tu perfil», and no plan name or version SHALL be shown. An año chip other than «Todos» SHALL keep only materias with that año in the chosen carrera, or in any carrera of the facultad when «Todas», so optativas are left out. Without an ubicación the panel SHALL invite the viewer to choose a facultad, SHALL hide the carrera and año chips, and the sections below SHALL cover every facultad and say «todas las facultades».

#### Scenario: Signed-in student
- **WHEN** a student cursando Ingeniería Informática at FI-UNJU opens `/experiencias`
- **THEN** the panel shows «UNJU · Facultad de Ingeniería», the chip Ingeniería Informática active with «tomado de tu perfil», año «Todos», and no plan name

#### Scenario: Visitor narrows by año
- **WHEN** a visitor with ubicación FI-UNJU activates the chip 2°
- **THEN** «Materias más comentadas» and «Recién publicadas» only consider materias that have año 2 in some carrera of the facultad, and the URL contains `anio=2`

#### Scenario: Shared link
- **WHEN** a student shares `/experiencias?carrera=<id>&anio=2&tipo=finales` and a visitor with another ubicación opens it
- **THEN** the visitor sees the carrera, año and type chips restored and the sections computed for the visitor's own facultad

#### Scenario: Visitor without ubicación
- **WHEN** a visitor who never chose a facultad opens `/experiencias`
- **THEN** the panel invites them to choose one, shows no carrera or año chips, and the two sections say «todas las facultades»

### Requirement: Materia search
The hero search SHALL suggest materias only, limited to the ubicación's facultad when there is one, and choosing a suggestion SHALL open `/experiencias/<código>`. Enter SHALL open the first suggestion. When nothing matches, the search SHALL say «No encontramos esa materia en <facultad>» and offer «Buscar en todas», which repeats the search over every facultad.

#### Scenario: Student finds a materia
- **WHEN** a student with ubicación FI-UNJU types «análisis» and chooses «Análisis Matemático II»
- **THEN** the browser opens `/experiencias/<código de Análisis Matemático II>`

#### Scenario: Nothing matches in the facultad
- **WHEN** the typed text matches no materia of the ubicación's facultad
- **THEN** the search says «No encontramos esa materia en Facultad de Ingeniería» and «Buscar en todas» repeats the search without the facultad limit

### Requirement: Materias más comentadas
The section SHALL list up to six materias of the context ordered by the number of experiencias published in the last 120 days, counting only materias with at least three in that window, with ties broken by the all-time total and then by name. Each card SHALL show the materia's code and name; its carrera and año («Optativa» when it has none in that carrera), using the active carrera chip or else the first carrera by name that includes it; the total number of experiencias; «% promocionó» among the reseñas with an explicit resultado, or «aprobaron X de Y» instead when the type is «Solo finales»; the most chosen dificultad; and «Nueva hace X» from its latest publication, every figure subject to the mínimo de muestra. The subtitle SHALL name the facultad, the carrera («todas las carreras» when none) and «últimos meses», never «este cuatrimestre». «Ver todas las materias» SHALL open the carrera page when a carrera chip is active, else the facultad page. When no materia qualifies in the window, the section SHALL rank by all-time totals and say «de siempre»; when the context has no experiencias at all, it SHALL show «Todavía no hay experiencias en <facultad>» with «Escribir la primera».

#### Scenario: Active facultad
- **WHEN** a facultad has nine materias with three or more experiencias in the last 120 days
- **THEN** the section shows the six with most experiencias in that window, ties broken by all-time total and then by name

#### Scenario: Only two materias qualify
- **WHEN** a facultad has two materias with three or more experiencias in the window and others with fewer
- **THEN** the section shows those two cards only

#### Scenario: Nothing recent
- **WHEN** no materia of the context has three experiencias in the last 120 days but some have experiencias
- **THEN** the section ranks by all-time totals, still at most six, and its subtitle says «de siempre»

#### Scenario: Facultad without experiencias
- **WHEN** the context has no public experiencia at all
- **THEN** the section shows «Todavía no hay experiencias en <facultad>» with «Escribir la primera»

### Requirement: Recién publicadas
The section SHALL show the six most recently published experiencias of the context, reseñas and finales interleaved by publication date, each as an experiencia card with its type chip. With both types shown it SHALL offer «Ver todas las reseñas» (`/resenas`) and «Ver todos los finales» (`/finales`); with one type it SHALL offer the matching link only. When the context has none it SHALL show the empty card of the previous requirement plus «Ver las de todas las facultades».

#### Scenario: Mixed recent entries
- **WHEN** the last six publications of the facultad are four reseñas and two finales
- **THEN** the section shows the six in publication order, each card stating «Reseña de cursada» or «Experiencia de final»

#### Scenario: Only finals selected
- **WHEN** the type segment is «Solo finales»
- **THEN** the section shows only finales and its link is «Ver todos los finales»

### Requirement: Page per materia
`/experiencias/<código>` SHALL show the materia's experiencias with: the breadcrumb Experiencias › carrera › materia, the carrera resolved as in the materia breadcrumb of academic-structure/browsing; an eyebrow with the materia's año and cuatrimestre in that carrera («Anual» when it spans the year, «Optativa» when it has no año); the actions «Ver recursos de la materia», to `/materias/<código>`, and «Escribir experiencia»; the summary; and the tabs. An old materia code SHALL redirect permanently to the current one, and an unknown code SHALL show the not-found page. A materia without any public experiencia SHALL show «Nadie contó todavía cómo le fue en <materia>» with «Escribir la primera» instead of the summary and tabs.

#### Scenario: Materia with experiencias
- **WHEN** a visitor opens `/experiencias/<código>` of Análisis Matemático II coming from Ingeniería Informática
- **THEN** the page shows Experiencias › Ingeniería Informática › Análisis Matemático II, «1° año · 2° cuatrimestre», both actions, the summary and the tabs

#### Scenario: Old code
- **WHEN** someone opens `/experiencias/<old code>` of a renamed materia
- **THEN** they are redirected permanently to `/experiencias/<current code>`

#### Scenario: Materia without experiencias
- **WHEN** a visitor opens the page of a materia with no public reseña or final
- **THEN** the page shows «Nadie contó todavía cómo le fue en <materia>» with «Escribir la primera», and no summary or tabs

### Requirement: Materia summary
The summary SHALL be computed from every publicly visible experiencia of the materia, anonymous ones included, and SHALL show under the headline «Resumen de N experiencias»: the number of reseñas and of finales, the recomendación promedio with its count, and «aprobaron X de Y» where Y counts only finales with an explicit Aprobado or Desaprobado; «Cómo terminó la cursada» as Promoción / Regular / Libre bars over the reseñas with an explicit resultado, stating how many preferred not to answer; «Dificultad de la cursada» as a five-level histogram, stating how many did not indicate it; and «El final» with the count per formato, the average dificultad de teoría and de práctica over those who indicated them, the mesa más comentada among períodos other than «no recuerdo» with its count, and the nota promedio over finales with an explicit outcome and a grade. It SHALL NOT show a nota de promoción, a preparación típica, nor the number of professors or the duration of a final until the platform collects those facts. Every figure SHALL respect the mínimo de muestra. The same figures SHALL back the summary card of the materia hub and the «La materia según» panels of the details, so every view shows the same numbers.

#### Scenario: Full summary
- **WHEN** a materia has 34 reseñas, 29 with an explicit resultado, and 24 finales, 22 with an explicit outcome and 15 Aprobado
- **THEN** the summary says «Resumen de 58 experiencias», «34 reseñas de cursada», «24 experiencias de final», «aprobaron 15 de 22», the bars over 29 with «5 prefirieron no responder», and «El final» with formato counts, the two averages, the mesa más comentada and the nota promedio

#### Scenario: Moderated entry leaves the summary
- **WHEN** a moderator retires a reseña or its author deletes it
- **THEN** the summary, the hub card and the detail panels stop counting it

#### Scenario: Facts not yet collected
- **WHEN** any materia summary renders
- **THEN** it shows no nota de promoción, preparación típica, number of professors or duration of the final

### Requirement: Mínimo de muestra
A percentage («% promocionó», the result bars, «aprobaron X de Y») SHALL be shown only when at least five answers back it; below that the interface SHALL show counts such as «2 de 3». A most-chosen value (dificultad más elegida, mesa más comentada, formato más común) and an average of dificultad de teoría or de práctica SHALL require at least three answers; the nota promedio SHALL require at least five grades. The recomendación promedio SHALL keep showing from one reseña, always with its count. Below a minimum the figure SHALL be omitted or replaced by its counts, never shown as a percentage or average.

#### Scenario: Three reseñas
- **WHEN** a materia has three reseñas with resultado, two of them Promoción
- **THEN** the summary says «2 de 3 promocionaron» and shows no percentage bars

#### Scenario: Five reseñas
- **WHEN** a materia reaches five reseñas with resultado
- **THEN** the bars show percentages, each with its count

#### Scenario: One reseña
- **WHEN** a materia has one reseña with four stars
- **THEN** the recomendación promedio reads «4,0 / 5 · 1 reseña» and the dificultad más elegida is omitted

### Requirement: Tabs, filters, order and paging on the materia page
The page SHALL offer the tabs «Reseñas · N» and «Finales · N», Reseñas by default, with the active tab, filters and order in the URL. Reseñas SHALL filter by ciclo lectivo, franja horaria, professor, situación de cursada and resultado, and order by Más recientes, Mejor recomendadas or Menos recomendadas. Finales SHALL filter by período de examen, año, formato, professor and resultado, and order only by recency with the same date rule as `/finales`; no grade-based order SHALL exist. Each tab SHALL show ten cards and a «Ver más» that appends the next ten without leaving the page; the page number SHALL NOT be in the URL. A filter combination with no entries SHALL keep the filters, explain the empty result and offer to clear them.

#### Scenario: Student filters reseñas
- **WHEN** a student chooses franja «Tarde» and resultado «Promoción» on the Reseñas tab
- **THEN** only reseñas with that franja and resultado are listed, the URL restores the same view after reload, and the tab count stays the materia's total

#### Scenario: Finals keep recency order
- **WHEN** a student opens the Finales tab
- **THEN** the only order offered is Más recientes and no option orders by grade

#### Scenario: More than ten entries
- **WHEN** a tab has 34 entries
- **THEN** it shows ten, «Ver más» appends the next ten in place, and the URL does not change

### Requirement: Experiencia card
Every list of experiencias (landing, materia page, `/resenas`, `/finales`) SHALL use one card that shows: the author's name and avatar, or «Anónimo» with the marca de anónimo; the type («Reseña de cursada» or «Experiencia de final») and a relative publication time such as «hace 2 días»; the known context as chips (ciclo lectivo, franja, professor and situación for a reseña; mesa with año, and formato for a final); the resultado or outcome, with the grade when declared, and the dificultad; the recommendation stars with an accessible name for a reseña; a bounded excerpt; «Leer completa» to the detail; and «Reportar», which opens the same report dialog as the detail. It SHALL NOT fabricate missing facts nor show «Me sirvió».

#### Scenario: Anonymous reseña card
- **WHEN** an anonymous reseña with ciclo 2025, franja Tarde and resultado Regular is listed
- **THEN** the card shows the marca de anónimo and «Anónimo», «Reseña de cursada · hace 2 días», the chips «Ciclo 2025», «Tarde», «Regular», its stars with an accessible name, the excerpt, «Leer completa» and «Reportar»

#### Scenario: Final without optional facts
- **WHEN** a final declares only mesa, año and formato
- **THEN** the card shows those chips and no outcome, grade, professor or dificultad

### Requirement: Mismo contexto on details
A reseña detail SHALL show «Con el mismo contexto»: up to three other public reseñas of the same materia, most recent first, that share the facts the reseña declared among professor and franja horaria (both when it declared both), from any ciclo lectivo; the panel SHALL name the shared facts and SHALL NOT appear when the reseña declared neither. A final detail SHALL do the same with período de examen, ignoring «no recuerdo», and formato.

#### Scenario: Reseña with professor and franja
- **WHEN** a reseña declares Prof. A. Gómez and franja Tarde
- **THEN** the panel «Con el mismo contexto · Tarde · Prof. A. Gómez» lists up to three other reseñas of the materia with that professor and franja, from any ciclo

#### Scenario: Reseña without professor or franja
- **WHEN** a reseña declares neither professor nor franja
- **THEN** no «Con el mismo contexto» panel is shown

#### Scenario: Final that does not remember the mesa
- **WHEN** a final has período «no recuerdo» and formato Escrito
- **THEN** the panel matches other finales of the materia by formato only and names «Escrito»

### Requirement: «La materia según» panel on details
A reseña detail SHALL show «La materia según N reseñas» with the recomendación promedio, the dificultad más elegida and the result bars; a final detail SHALL show «La materia según N finales» with «aprobaron X de Y», the formato más común and the average dificultad de teoría and de práctica. Both SHALL follow the mínimo de muestra and link to `/experiencias/<código>` with «Ver todas las experiencias».

#### Scenario: Reading a reseña
- **WHEN** a visitor opens `/resenas/<id>` of a materia with 34 reseñas
- **THEN** the panel «La materia según 34 reseñas» shows the same figures as the materia summary and links to `/experiencias/<código>`

### Requirement: Writing entry point
`/experiencias/escribir` SHALL be a focus screen that asks what to tell (Reseña de cursada or Experiencia de final) and which materia, using the materia search, and SHALL continue to `/materias/<código>/resenar` or `/materias/<código>/final`, which keep asking for sign-in with a return path. «Escribir experiencia» on the landing SHALL open it; on the materia page and on a detail it SHALL open a two-option menu (Reseña de cursada / Experiencia de final) that leads straight to the form for that materia.

#### Scenario: Visitor starts from the landing
- **WHEN** a visitor activates «Escribir experiencia» on the landing, chooses Experiencia de final and the materia Física I
- **THEN** the browser opens `/materias/<código de Física I>/final`, which asks them to sign in and returns there afterwards

#### Scenario: Student starts from the materia page
- **WHEN** a student activates «Escribir experiencia» on `/experiencias/<código>` and picks Reseña de cursada
- **THEN** the browser opens `/materias/<código>/resenar`

### Requirement: Materia hub summary
The materia hub SHALL replace its reseñas and finales tabs with a summary card showing the number of reseñas and of finales, the recomendación promedio and «aprobaron X de Y», the link «Ver experiencias →» to `/experiencias/<código>` and the two write actions; its materials tab SHALL stay as it is.

#### Scenario: Hub of a materia with experiencias
- **WHEN** a visitor opens `/materias/<código>`
- **THEN** the hub shows the materials and the experiencias summary card with its link, and no reseñas or finales tab

### Requirement: Narrow viewports
Below the desktop breakpoint the landing SHALL stack its sections in one column, with the carrera, año and type chips in horizontally scrollable rows and «Materias más comentadas» as a two-column grid of compact cards; the materia page SHALL show its four figures as a 2×2 grid, the bars, the tabs «Reseñas · N» / «Finales · N», the filters as chips and an «Escribir» button. Nothing SHALL overflow horizontally at 390px wide.

#### Scenario: Landing on a phone
- **WHEN** a visitor opens `/experiencias` at 390px wide
- **THEN** the sections stack in one column, the chip rows scroll horizontally, the materias show in two columns and nothing overflows

### Requirement: Bounded states
The landing, the materia page and the writing entry point SHALL provide accessible loading, empty, error and retry states; a failed request SHALL NOT hide the static sections or the context panel, and a retry SHALL keep the context.

#### Scenario: The landing's data fails to load
- **WHEN** the request behind «Materias más comentadas» and «Recién publicadas» fails
- **THEN** those two sections show an error with a retry that keeps the carrera, año and type, and the hero, the context panel, «Tu turno» and «Cómo leer una experiencia» still render

## ADDED Requirements

### Requirement: Experiencia forms
`/materias/<código>/resenar` and `/materias/<código>/final` SHALL each be one page of numbered sections, not a multi-step wizard:
- The reseña has «¿Qué querés contar?», «Contexto de la cursada», «Cómo terminó», «Tu experiencia» and «Publicación».
- The final has «¿Qué querés contar?», «La mesa», «Cómo te fue», «Temas que tomaron», «Preparación», «Tu experiencia» and «Publicación».
- Required fields SHALL carry «Obligatorio» and optional ones «Opcional».
- The first section SHALL show the chosen type and materia with «Cambiar», which opens `/experiencias/escribir` and keeps what was typed until the entry is published or the author leaves without publishing.
- On desktop an «Así se va a ver» preview SHALL show the entry as its detail will, updating as the author types.
- The narrative SHALL show a counter out of 4,000.
- «Publicación» SHALL offer «Publicar como anónimo», off by default, explained as «Se muestra como «Anónimo» y no aparece en tu perfil. Las publicaciones anónimas no suman puntos.», and state «Se publica al instante. Si alguien la reporta y no cumple las normas, moderación puede retirarla.»

After a publication the browser SHALL open the new entry's detail with the notice «Publicada». An account in revisión previa SHALL see the existing pending notice instead, and a probable duplicate cursada SHALL keep its confirmation dialog. The edit form SHALL reuse the same page with «Guardar cambios» and the anonymity choice shown but not changeable.

#### Scenario: Student publishes a final
- **WHEN** a student fills «La mesa», «Cómo te fue» and «Tu experiencia» and activates «Publicar experiencia»
- **THEN** the browser opens `/finales/<id>` of the new entry with «Publicada»

#### Scenario: Preview follows the form
- **WHEN** a student on desktop chooses Promoción with nota 8 and franja Tarde
- **THEN** the preview shows «Promoción · 8» and «Tarde» before publishing

#### Scenario: Student changes the materia
- **WHEN** a student who typed half a reseña activates «Cambiar», picks another materia and returns
- **THEN** the form for the new materia still holds the typed values

#### Scenario: Grade field follows the outcome
- **WHEN** a student chooses «Prefiero no decir» in «Cómo te fue»
- **THEN** the form stops asking for the nota and says «Si elegís «Prefiero no decir», no se pide la nota.»

### Requirement: Topic suggestions
While a student types «Temas que tomaron», the form SHALL suggest, under «Los cargaron otros en esta materia:», topics of the same materia that appear in at least two different publicly visible experiencias de final, ordered by how many mention them and then by name, compared ignoring case and spacing, and SHALL leave out topics already added. A topic mentioned by a single experiencia SHALL NOT be suggested to anyone. Choosing a suggestion SHALL add it as a chip; Enter SHALL add the typed text.

#### Scenario: Shared topic is suggested
- **WHEN** two public finales of Análisis Matemático II mention «Series de Fourier» and one mentions «Truco del profe»
- **THEN** the suggestions include «Series de Fourier» and never «Truco del profe»

#### Scenario: Retired final stops counting
- **WHEN** one of the two finales that mention a topic is retired by moderation
- **THEN** the topic is no longer suggested

## MODIFIED Requirements

### Requirement: Materias más comentadas
The section SHALL list up to six materias of the context ordered by the number of experiencias published in the last 120 days, counting only materias with at least three in that window, with ties broken by the all-time total and then by name. Each card SHALL show:
- the materia's code and name;
- its carrera and año («Optativa» when it has none in that carrera), using the active carrera chip or else the first carrera by name that includes it;
- the total number of experiencias;
- «% promocionó» among the reseñas with an explicit resultado, or «aprobaron X de Y» instead when the type is «Solo finales»;
- the most chosen dificultad among the reseñas, or, when the type is «Solo finales», «Teoría X · Práctica Y» as the averages of the finales that declared them, each average omitted below its minimum;
- «Nueva hace X» from its latest publication.

Every figure SHALL be subject to the mínimo de muestra. The subtitle SHALL name the facultad, the carrera («todas las carreras» when none) and «últimos meses», never «este cuatrimestre». «Ver todas las materias» SHALL open the carrera page when a carrera chip is active, else the facultad page. When no materia qualifies in the window, the section SHALL rank by all-time totals and say «de siempre»; when the context has no experiencias at all, it SHALL show «Todavía no hay experiencias en <facultad>» with «Escribir la primera».

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

#### Scenario: Only finals with theory and practice
- **WHEN** the type is «Solo finales» and a materia has four finales with teoría and two with práctica
- **THEN** its card shows the teoría average and no práctica average, and never a verbal dificultad

### Requirement: Materia summary
The summary SHALL be computed from every publicly visible experiencia of the materia, anonymous ones included. Under the headline «Resumen de N experiencias» it SHALL show:
- the number of reseñas and of finales;
- the recomendación promedio with its count;
- «aprobaron X de Y», where Y counts only finales with an explicit Aprobado or Desaprobado;
- «Cómo terminó la cursada» as Promoción / Regular / Libre bars over the reseñas with an explicit resultado, stating how many preferred not to answer;
- «Nota de promoción» as «la informaron X de Y», where Y counts the reseñas with resultado Promoción, with the average nota when enough were informed;
- «Dificultad de la cursada» as a five-level histogram, stating how many did not indicate it;
- «El final», with:
  - the count per formato;
  - the average dificultad de teoría and de práctica over those who indicated them;
  - the mesa más comentada among períodos other than «no recuerdo», with its count and, when enough finales of that período declared them, the median profesores en la mesa and tiempo del examen, as in «La mesa más comentada es diciembre (9): suele haber 3 profesores y 3 horas»;
  - the nota promedio over finales with an explicit outcome and a grade;
  - «Preparación típica» as the median lead time and the median time per day over the finales that declared each;
- «Temas que más toman», with up to five topics that appear in at least two of its public finales, most mentioned first.

Every figure SHALL respect the mínimo de muestra, and a part of a sentence below its minimum SHALL be left out rather than shown. The same figures SHALL back the summary card of the materia hub and the «La materia según» panels of the details, so every view shows the same numbers.

#### Scenario: Full summary
- **WHEN** a materia has 34 reseñas, 29 with an explicit resultado, and 24 finales, 22 with an explicit outcome and 15 Aprobado
- **THEN** the summary says «Resumen de 58 experiencias», «34 reseñas de cursada», «24 experiencias de final», «aprobaron 15 de 22», the bars over 29 with «5 prefirieron no responder», and «El final» with formato counts, the two averages, the mesa más comentada and the nota promedio

#### Scenario: Moderated entry leaves the summary
- **WHEN** a moderator retires a reseña or its author deletes it
- **THEN** the summary, the hub card and the detail panels stop counting it

#### Scenario: Facts not yet collected
- **WHEN** a materia's finales and reseñas all predate this change and declare no nota de promoción, preparación, profesores en la mesa, tiempo or temas
- **THEN** the summary shows «la informaron 0 de Y» for the nota de promoción and no preparación típica, mesa medians or «Temas que más toman»

#### Scenario: Nota de promoción
- **WHEN** a materia has 11 reseñas with Promoción and 9 of them informed a nota averaging 8.2
- **THEN** the summary shows «Nota de promoción · 8,2 / 10 promedio · la informaron 9 de 11»

#### Scenario: Mesa sentence with too few answers
- **WHEN** diciembre is the mesa más comentada with 9 finales, 4 of which declared profesores en la mesa and 2 the tiempo
- **THEN** the sentence reads «La mesa más comentada es diciembre (9): suele haber 3 profesores» without hours

#### Scenario: Preparation summary
- **WHEN** five finales declared lead times of 7, 14, 21, 21 and 60 days and three declared 60 minutes per day
- **THEN** «Preparación típica» shows «3 semanas antes» and «1 h por día»

### Requirement: Mínimo de muestra
A percentage («% promocionó», the result bars, «aprobaron X de Y») SHALL be shown only when at least five answers back it; below that the interface SHALL show counts such as «2 de 3». A most-chosen value (dificultad más elegida, mesa más comentada, formato más común) and an average of dificultad de teoría or de práctica SHALL require at least three answers. The nota promedio and the average nota de promoción SHALL require at least five grades. The medians of preparación, profesores en la mesa and tiempo del examen SHALL each require at least three answers. A tema SHALL require at least two finales that mention it. The recomendación promedio SHALL keep showing from one reseña, always with its count. Below a minimum the figure SHALL be omitted or replaced by its counts, never shown as a percentage, average or median.

#### Scenario: Three reseñas
- **WHEN** a materia has three reseñas with resultado, two of them Promoción
- **THEN** the summary says «2 de 3 promocionaron» and shows no percentage bars

#### Scenario: Five reseñas
- **WHEN** a materia reaches five reseñas with resultado
- **THEN** the bars show percentages, each with its count

#### Scenario: One reseña
- **WHEN** a materia has one reseña with four stars
- **THEN** the recomendación promedio reads «4,0 / 5 · 1 reseña» and the dificultad más elegida is omitted

#### Scenario: Few promotion grades
- **WHEN** four of six reseñas with Promoción informed a nota
- **THEN** the summary says «la informaron 4 de 6» and shows no average

### Requirement: Experiencia card
Every list of experiencias (landing, materia page, `/resenas`, `/finales`) SHALL use one card that shows:
- the author's name and avatar, or «Anónimo» with the marca de anónimo;
- the type («Reseña de cursada» or «Experiencia de final») and a relative publication time such as «hace 2 días»;
- the known context as chips: ciclo lectivo, franja, professor and situación for a reseña; mesa with año, and formato for a final;
- the resultado, with its nota de promoción when declared, or the outcome with its grade;
- the dificultad of a reseña, or the teoría and práctica of a final, falling back to an older final's verbal dificultad;
- the recommendation stars with an accessible name for a reseña;
- a bounded excerpt;
- «Leer completa» to the detail;
- «Reportar», which opens the same report dialog as the detail.

It SHALL NOT fabricate missing facts nor show «Me sirvió», and it SHALL leave the mesa, tiempo, preparación and temas to the detail.

#### Scenario: Anonymous reseña card
- **WHEN** an anonymous reseña with ciclo 2025, franja Tarde and resultado Regular is listed
- **THEN** the card shows the marca de anónimo and «Anónimo», «Reseña de cursada · hace 2 días», the chips «Ciclo 2025», «Tarde», «Regular», its stars with an accessible name, the excerpt, «Leer completa» and «Reportar»

#### Scenario: Final without optional facts
- **WHEN** a final declares only mesa, año, formato and the outcome «Prefiero no decir»
- **THEN** the card shows those chips and no grade, professor or dificultad

#### Scenario: Promoted reseña card
- **WHEN** a reseña with resultado Promoción and nota 9 is listed
- **THEN** the card shows «Promoción · 9»

### Requirement: Writing entry point
`/experiencias/escribir` SHALL be a focus screen that asks what to tell (Reseña de cursada or Experiencia de final) and which materia, using the materia search, and SHALL continue to `/materias/<código>/resenar` or `/materias/<código>/final`, which keep asking for sign-in with a return path. «Escribir experiencia» on the landing SHALL open it; on the materia page and on a detail it SHALL open a two-option menu (Reseña de cursada / Experiencia de final) that leads straight to the form for that materia. When reached from a form's «Cambiar», it SHALL start with the form's type and materia selected and SHALL hand the typed values back to the form it continues to.

#### Scenario: Visitor starts from the landing
- **WHEN** a visitor activates «Escribir experiencia» on the landing, chooses Experiencia de final and the materia Física I
- **THEN** the browser opens `/materias/<código de Física I>/final`, which asks them to sign in and returns there afterwards

#### Scenario: Student starts from the materia page
- **WHEN** a student activates «Escribir experiencia» on `/experiencias/<código>` and picks Reseña de cursada
- **THEN** the browser opens `/materias/<código>/resenar`

#### Scenario: Student switches the type
- **WHEN** a student writing a reseña activates «Cambiar» and picks Experiencia de final for the same materia
- **THEN** the final form opens with the narrative they had typed

### Requirement: Narrow viewports
Below the desktop breakpoint the landing SHALL stack its sections in one column, with the carrera, año and type chips in horizontally scrollable rows and «Materias más comentadas» as a two-column grid of compact cards; the materia page SHALL show its four figures as a 2×2 grid, the bars, the tabs «Reseñas · N» / «Finales · N», the filters as chips and an «Escribir» button. Both experiencia forms SHALL show every field in one column, without the preview, with the publish button fixed at the bottom of the screen. Nothing SHALL overflow horizontally at 390px wide.

#### Scenario: Landing on a phone
- **WHEN** a visitor opens `/experiencias` at 390px wide
- **THEN** the sections stack in one column, the chip rows scroll horizontally, the materias show in two columns and nothing overflows

#### Scenario: Final form on a phone
- **WHEN** a student opens `/materias/<código>/final` at 390px wide
- **THEN** every section shows in one column, no preview renders, «Publicar experiencia» stays visible at the bottom and nothing overflows

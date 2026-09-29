# Sistema de puntos, niveles e insignias

> **Estado:** propuesta, revisión 2 (septiembre 2026). Todavía no está implementada salvo lo marcado como **ya existe**.
> **Moderación:** desde septiembre 2026 todo se publica al instante y se modera después (`docs/README_MODERACION.md`, ADR 0001). Por eso los puntos de un aporte se otorgan **al publicarse** y se revierten si se retira.
> **Relacionado:** `apps/backend/src/modules/ranking/` (`point.service.ts`, `rpg-levels.ts`, `ranking.service.ts`), modelos `PointTransaction`, `Badge`, `UserBadge`, `MaterialHelpfulness`, `CommunityReport` y `Guide` en `apps/backend/prisma/schema.prisma`, y el glosario de `CONTEXT.md`.

## 1. Objetivo y principios

Los puntos existen para **reconocer a quien ayuda a otros estudiantes**, no para que la gente compita por cantidad. Todo el sistema sigue cinco reglas:

1. **Calidad antes que cantidad.** Lo que más suma es que a otros les sirva lo que compartiste, no la cantidad que subís.
2. **Los puntos no se gastan.** Son reputación. Las recompensas se **desbloquean** por nivel o por insignia; nunca se compran.
3. **Nada de lo que se gana influye en cómo se ve el contenido.** Un material aparece más arriba porque sirvió («Me sirvió»), nunca por el nivel de quien lo subió. Por eso el nivel y las insignias se muestran en el perfil, no en las tarjetas de los aportes.
4. **Lo anónimo no deja rastro público.** Una publicación anónima no suma puntos ni insignias visibles (ver §3.4).
5. **Todo es reversible y auditable.** Cada movimiento queda en `PointTransaction` y la suma de movimientos siempre coincide con el total del usuario. Si el contenido se retira, los puntos se descuentan con un movimiento negativo.

## 2. Qué ya existe

| Pieza | Estado actual |
|---|---|
| `User.points` y `User.level` | Existen. El nivel se recalcula en `PointService.awardPoints` con la tabla de `rpg-levels.ts`. La tabla cambia (§4). |
| `PointTransaction` | Existe: `amount`, `reason` (texto libre), `referenceId`. Sin restricción de unicidad. |
| Material aprobado | +10 al aprobarse (`MATERIAL_APPROVED`). **Cambia:** con la publicación inmediata pasa a otorgarse al publicarse (`MATERIAL_PUBLISHED`). |
| Reseña de cursada | +5 al crearse (`COURSE_REVIEWED`), **también si es anónima**. Cambia (§3.4). |
| Experiencia de final | +5 al crearse (`EXAM_EXPERIENCE_SHARED`), **también si es anónima**. Cambia (§3.4). |
| Guía | +15 al crearse (`GUIDE_CREATED`). Las guías quedaron **fuera del producto** (septiembre 2026): dejan de sumar puntos. |
| `MaterialHelpfulness` | Existe, con `@@unique([userId, materialId])`: un «Me sirvió» por estudiante y material. |
| `CommunityReport` | Existe, pero solo para reseñas y experiencias. Los materiales todavía no se pueden reportar. |
| `Badge` / `UserBadge` | Existen con nombre, descripción e imagen. `UserBadge` ya tiene `@@unique([userId, badgeId])`. No guardan el criterio para ganarlas, su rareza ni su grado. |
| Ranking | `ranking.service.ts` ordena por puntos totales. Se reemplaza por rankings acotados (§7). |
| Eventos, tutorías, Clasificados | **No existen** en el esquema. Sus puntos e insignias quedan para más adelante (§10). |

## 3. Cómo se ganan puntos

### 3.1 Tabla de puntos

| Código (`reason`) | Acción | Puntos | Cuándo se otorga | Límites |
|---|---|---|---|---|
| `MATERIAL_PUBLISHED` | Material publicado | +10 | Al publicarse (si pasó por revisión previa, al aprobarse) | Uno por material · se revierte si se retira |
| `MATERIAL_PIONEER` | Primer material publicado de un tipo en una materia (ej. el primer final de Bases de Datos) | +5 | Cuando ese material llega a 3 «Me sirvió» | Uno por materia y tipo. No aplica al tipo `OTRO` |
| `HELPFUL_RECEIVED` | Otro estudiante marcó «Me sirvió» en tu material | +1 | Al marcarse | Hasta 25 por material · 20 por día por autor · 5 por mes de un mismo estudiante hacia el mismo autor |
| `COURSE_REVIEWED` | Reseña de cursada publicada con nombre | +5 | Al publicarse | Una con puntos por materia y ciclo lectivo |
| `EXAM_EXPERIENCE_SHARED` | Experiencia de final publicada con nombre | +5 | Al publicarse | Una con puntos por materia, período de examen y año |
| `REPORT_CONFIRMED` | Moderación retiró una reseña o experiencia que reportaste | +2 | Al retirarse el contenido | Solo reportes hechos antes del retiro · hasta 10 por semana |
| `CORRECTION_ACCEPTED` | Aceptaron tu corrección de materia, tipo, ciclo o profesor (§5) | +2 | Al aceptarse | Hasta 10 por semana |

Los límites de reseñas y experiencias limitan los **puntos**, no las publicaciones. Un estudiante puede publicar varias reseñas de la misma materia y ciclo si describen cursadas distintas (ver `CONTEXT.md`), pero solo la primera suma.

Cuando se supera un tope, el punto no se guarda para después: simplemente no se otorga. Las insignias cuentan todos los «Me sirvió» válidos, sin mirar los topes de puntos.

**No suman puntos:** algo que está en revisión previa (hasta que se publica), valorar o marcar «Me sirvió» en contenido ajeno, iniciar sesión todos los días ni las acciones de moderación. Moderar es una responsabilidad, no una forma de subir de nivel.

### 3.2 Qué «Me sirvió» cuentan

Un «Me sirvió» es **válido** (suma puntos y cuenta para insignias) solo si:

- Lo marca una cuenta con email verificado y sin sanciones activas.
- No lo marca el autor del material.
- El material está publicado y no fue retirado ni está oculto.

El tope de 5 puntos por mes entre un mismo estudiante y un mismo autor evita que un grupo de amigos se suba de nivel marcándose entre sí.

### 3.3 Reversión y sanciones

- **Qué es retirar.** Un aporte se considera retirado cuando moderación lo retira **o** cuando su autor lo borra. En los dos casos se revierten sus puntos.
- **Cómo se revierte.** Se registra un movimiento con el mismo `reason`, el monto en negativo y `reversesId` apuntando al movimiento original. Cada movimiento se puede revertir una sola vez.
- **Material retirado.** Se revierten `MATERIAL_PUBLISHED`, `MATERIAL_PIONEER` y todos los `HELPFUL_RECEIVED` de ese material. Si era el pionero, el bono no pasa a otro material.
- **Material editado.** Si después de publicado se cambia su materia o su tipo, se revierte `MATERIAL_PIONEER` (si lo tenía) y se vuelve a evaluar con los datos nuevos.
- **Reseña o experiencia retirada.** Se revierten sus puntos. Si moderación la **restaura**, se otorgan de nuevo (§3.5).
- **Cambio de anónima a con nombre, o al revés.** Pasar a con nombre otorga los puntos. Pasar a anónima los revierte.
- **Un rechazo no resta puntos.** Rechazar es parte normal de la revisión (duplicado, ilegible, etc.).
- **«Me sirvió» quitado.** Se revierte el punto que ese «Me sirvió» haya otorgado. Si no otorgó ninguno porque ya se había alcanzado un tope, no se revierte nada.
- **El registro no se recorta.** `User.points` es siempre la suma exacta de `PointTransaction`, aunque dé negativo. Solo al **mostrarlo** se muestra 0 como mínimo, y el nivel se calcula sobre `max(0, points)`. Así una restauración posterior no regala puntos.
- **Desbloqueos.** El nivel puede bajar si bajan los puntos, pero **los desbloqueos ya obtenidos se conservan** mientras la cuenta no tenga sanciones (§5.2).

### 3.4 Publicaciones anónimas

Una reseña o experiencia publicada como anónima **no suma puntos, no cuenta para insignias y no aparece en el historial público**. Si sumara, el nivel del autor subiría justo después de que aparece una reseña anónima, y eso permitiría adivinar quién la escribió. Esto respeta la regla de `CONTEXT.md`: lo anónimo no se muestra ni se cuenta en el perfil público.

Cuando se publica como anónima, el formulario lo avisa: «Las publicaciones anónimas no suman puntos».

### 3.5 Idempotencia

Otorgar dos veces lo mismo (por reintentos o doble clic del moderador) no debe duplicar puntos, pero una reseña restaurada sí debe poder volver a sumar. Por eso no alcanza con `@@unique([userId, reason, referenceId])`: bloquearía la restauración y, como `referenceId` puede ser nulo, no protegería esas filas.

En cambio, cada otorgamiento lleva una `idempotencyKey` única con la forma `<reason>:<referenceId>:<n>`, donde `n` es la cantidad de reversiones previas de esa misma referencia. Por ejemplo:

- Primer otorgamiento de una reseña: `COURSE_REVIEWED:<reviewId>:0`. Un reintento genera la misma clave y falla sin duplicar.
- Se retira: movimiento negativo con `reversesId` (también único).
- Se restaura: `COURSE_REVIEWED:<reviewId>:1`, que es una clave nueva.

El `referenceId` de `HELPFUL_RECEIVED` es `<materialId>:<userId de quien marcó>`, no el id del material ni el de la fila de `MaterialHelpfulness` (que cambia si se desmarca y se vuelve a marcar).

Los topes se calculan contando movimientos existentes dentro de la misma transacción que bloquea la fila del usuario (`SELECT … FOR UPDATE`), para que dos otorgamientos simultáneos no superen el tope.

## 4. Niveles y desbloqueos

La tabla de `rpg-levels.ts` **cambia**:

- **Umbrales.** Con la tabla anterior, un material bueno rinde unos 20 puntos (10 al publicarse + unos 10 «Me sirvió»). Llegar al nivel 8 (5.000) exigía unos 250 materiales buenos y el nivel 10 (12.000), unos 600: inalcanzable en una carrera. La curva nueva hace que el nivel 10 sea raro pero posible.
- **Nombres.** Los anteriores estaban todos en masculino («Viajero», «Caballero», «Maestro», «Sabio») y «Caballero del Código» no encajaba con carreras que no son de programación. Los nuevos son neutros y siguen la temática de la mascota y de *Mi mochila*.

Cada nivel **desbloquea** opciones de personalización, que se eligen en *Configuración → Perfil público*. Nada de esto afecta cómo se ve el contenido.

| Nivel | Nombre | Puntos | Se desbloquea |
|---|---|---|---|
| 1 | Primeros pasos | 0 | 4 avatares de gato básicos |
| 2 | Bigotes curiosos | 30 | 4 avatares de gato más · fijar 1 aporte destacado en tu perfil |
| 3 | De pasillo en pasillo | 100 | Color de acento del perfil (6 opciones) · fijar hasta 3 aportes · privilegio *Sugerir correcciones* (§5) |
| 4 | Mochila cargada | 250 | Fondo del perfil (cuadriculado, hoja de apuntes, pixel) |
| 5 | Siete vidas | 500 | Marco de avatar · banner ilustrado en el perfil |
| 6 | Apuntes de oro | 900 | Título visible, elegido entre tus insignias · elegible para *Invitación a moderar* (§5) |
| 7 | Biblioteca viva | 1.500 | Avatares de gato de edición especial |
| 8 | Faro de la carrera | 2.300 | Tema de perfil exclusivo |
| 9 | Memoria de la facultad | 3.300 | Gato animado en el perfil |
| 10 | Leyenda de la facultad | 4.500 | Marco legendario · mención en «Leyendas de la facultad» |

Referencia de ritmo:

- 10 materiales publicados con 20 «Me sirvió» cada uno dan 300 puntos: nivel 4.
- Llegar a nivel 5 requiere aportar de forma sostenida durante uno o dos cuatrimestres.
- Llegar a nivel 10 requiere unos 225 materiales buenos o su equivalente, lo que corresponde a quien aporta a lo largo de toda la carrera.

Los umbrales se revisan con datos reales después del primer cuatrimestre.

Algunas insignias también desbloquean cosas: por ejemplo, **Salvavidas** (cualquier grado) habilita un marco especial. Así se premia la calidad y no solo el volumen.

## 5. Privilegios de confianza

Son permisos que ayudan a mantener la calidad. Todos requieren **no haber tenido sanciones en los últimos 90 días** (ni silenciamiento ni contenido retirado por normas). Cada privilegio se basa en la señal que mejor predice si se va a usar bien: el nivel mide cuánto aportaste, no si reportás con buen criterio.

| Privilegio | Requisito | Qué permite |
|---|---|---|
| Sugerir correcciones | Nivel 3 | Proponer cambios de materia, tipo, ciclo o profesor en materiales ajenos. Moderación los acepta o rechaza, así que el riesgo es bajo. |
| Reportes prioritarios | Al menos 5 reportes confirmados y 70 % o más de reportes confirmados en los últimos 90 días | Tus reportes aparecen primero en la cola de moderación. Se pierde si la precisión baja del 70 %. |
| Invitación a moderar | Nivel 6 · cuenta con más de 6 meses · al menos 5 reportes confirmados o 10 correcciones aceptadas | Moderación puede invitarte al rol `MODERATOR`. La invitación es manual; cumplir los requisitos solo te hace elegible. |

### 5.1 Qué no se otorga nunca por nivel

- Resolver casos de moderación sin ser moderador.
- Saltar la revisión previa cuando corresponde (cuenta nueva o con un retiro reciente).
- Mejor posición en búsquedas, listados o la página de una materia.
- Distintivos en las tarjetas de tus aportes (nivel, sello o insignia junto a tu nombre).

### 5.2 Sanciones

Mientras una cuenta está silenciada (`isMuted`) o suspendida (`isBanned`): no gana puntos, sus «Me sirvió» no cuentan, se ocultan sus personalizaciones y pierde los privilegios de confianza. Al terminar la sanción recupera las personalizaciones, pero los privilegios vuelven recién después de 90 días sin sanciones.

**Estado:** el cambio de moderación (sanciones y apelaciones) solo bloquea publicar y marcar «Me sirvió» durante la sanción. Congelar los puntos, ocultar personalizaciones y quitar privilegios se implementa en el cambio de puntos e insignias. Los puntos reotorgados por una apelación aceptada se otorgan aunque haya una sanción activa.

## 6. Insignias

### 6.1 Reglas generales

- Cada insignia tiene un **criterio verificable** que se evalúa automáticamente cuando ocurre el evento que la dispara (publicación, «Me sirvió», fin de un período de mesas, etc.).
- Las insignias **no dan puntos**: son reconocimiento, no recompensas.
- Hay cuatro rarezas:
  - **Común** y **rara**: se ganan en cualquier momento.
  - **De temporada**: se repite cada año y cada vez se gana una **edición** con fecha (ej. «Mesa de diciembre 2026»).
  - **Edición única**: solo se puede ganar durante una ventana de fechas y después no vuelve a otorgarse (ej. Primera camada).
- Algunas tienen grados (bronce, plata, oro). Al subir de grado se actualiza la misma insignia; no se agrega otra.
- **Pérdida:**
  - Una insignia que depende de un solo aporte (ej. Salvavidas) se quita si ese aporte se retira.
  - Una insignia que suma varios aportes (ej. Trotamaterias) **baja de grado** o se quita solo si deja de cumplir el criterio del grado bronce.
- Las publicaciones anónimas no cuentan para ninguna insignia, y solo cuentan los «Me sirvió» válidos (§3.2).
- En el perfil público se pueden destacar hasta 3 insignias.
- Los nombres son sustantivos o expresiones neutras. Ninguno usa «/a».

### 6.2 Catálogo inicial

Todas se pueden calcular con los modelos que ya existen, salvo donde se indica.

| Código | Insignia | Criterio | Rareza | Grados |
|---|---|---|---|---|
| `FIRST_CONTRIBUTION` | Primer aporte | Primer material publicado | Común | — |
| `FIRST_HELPFUL` | Primer «Me sirvió» | Recibís tu primer «Me sirvió» válido | Común | — |
| `LIFESAVER` | Salvavidas | Un material tuyo llega a 50 «Me sirvió» (plata: 150, oro: 400) | Rara | Bronce · plata · oro |
| `SUBJECT_TROTTER` | Trotamaterias | Materiales publicados en 5 materias distintas (plata: 10, oro: 20) | Común | Bronce · plata · oro |
| `PIONEER` | Primera huella | Obtenés el bono `MATERIAL_PIONEER` 1 vez (plata: 3, oro: 8) | Rara | Bronce · plata · oro |
| `FIRST_LIGHT` | Primera luz | Primer material publicado de una materia que no tenía ninguno | Rara | — |
| `FULL_KIT` | Kit completo | En una misma materia tenés materiales publicados de 4 tipos distintos (sin contar `OTRO`) | Rara | — |
| `ARCHIVE` | Archivo histórico | Materiales publicados del mismo tipo y materia en 3 ciclos lectivos distintos | Rara | — |
| `BRIDGE` | Puente | Un material tuyo recibe «Me sirvió» de estudiantes de al menos 3 carreras distintas (según sus planes de estudio activos) | Rara | — |
| `STEADY` | Constante | Al menos un aporte publicado en 2 cuatrimestres seguidos (plata: 4, oro: 8) | Común | Bronce · plata · oro |
| `REVIEWER` | Voz de la cursada | Reseñas de cursada con nombre: 5 (plata: 15, oro: 40) | Común | Bronce · plata · oro |
| `FULL_CONTEXT` | Contexto completo | 10 reseñas con nombre que indican ciclo lectivo, profesor, franja horaria, situación de cursada y dificultad | Rara | — |
| `CHRONICLER` | Cronista de mesas | Experiencias de final con nombre en las mesas de diciembre, julio y febrero/marzo (o marzo) | Rara | — |
| `DECEMBER_BOARD` | Mesa de diciembre | Contaste con nombre una experiencia de final de la mesa de diciembre de ese año | De temporada | — |
| `FINALS_SEASON` | Temporada de finales | 3 aportes publicados durante un período de mesas (una edición por período) | De temporada | — |
| `GUARDIAN` | Ojo atento | 10 reportes confirmados por moderación | Rara | — |
| `EDITOR` | Lupa | 10 correcciones aceptadas (requiere `CorrectionSuggestion`, §9.1) | Rara | — |
| `FOUNDER` | Primera camada | Cuenta con email verificado creada durante el primer cuatrimestre de la plataforma y al menos un aporte publicado en ese período | Edición única | — |

Notas sobre criterios:

- **Constante** se mide por cuatrimestres y no por meses: con meses seguidos, las vacaciones de verano cortarían la racha de todo el mundo.
- **Mesa de diciembre** era la única insignia «de temporada» que en realidad se repite cada año. Por eso ahora hay dos rarezas separadas: de temporada (con edición) y edición única.
- **Primera huella** exige el tipo distinto de `OTRO` y los 3 «Me sirvió» del bono. Así no se gana subiendo cualquier cosa, y al lanzar la plataforma no la gana todo el mundo.
- **Primera luz** premia lo más valioso para la comunidad: la primera ayuda en una materia vacía.

### 6.3 Qué no se agrega nunca

- Insignias por rachas diarias o por iniciar sesión.
- Insignias por cantidad sola (ej. «100 materiales subidos») sin una señal de que sirvieron.
- Insignias por votar, marcar «Me sirvió» o valorar contenido ajeno.
- Insignias por moderar.

## 7. Rankings

Se reemplaza el ranking global por puntos totales (siempre ganan los mismos y desanima a los nuevos) por rankings **acotados y que se renuevan**:

- **Los que más ayudaron este mes en tu carrera:** puntos netos ganados en el mes (otorgamientos menos reversiones). Cada punto se atribuye a la carrera de la materia del aporte que lo generó. Si la materia pertenece a varias carreras, cuenta en cada una. `REPORT_CONFIRMED` y `CORRECTION_ACCEPTED` se atribuyen a la carrera del contenido reportado o corregido.
- **Más útiles de una materia este cuatrimestre:** materiales ordenados por «Me sirvió», en la página de la materia.
- **Leyendas de la facultad:** lista fija de quienes llegaron a nivel 10.

Los rankings muestran los 10 primeros y, si no estás entre ellos, tu posición. Nunca muestran cuentas sancionadas ni a quien desactivó «Mostrar mi nivel e insignias».

## 8. Cómo se ve en el producto

- **Mi mochila → «Tu progreso»:** nivel actual, puntos que faltan para el siguiente, qué desbloquea el próximo nivel, insignias ganadas y las más cercanas («te faltan 12 "Me sirvió" para Salvavidas»).
- **Perfil público:** número y nombre del nivel, hasta 3 insignias destacadas, título elegido y la personalización desbloqueada. Respeta los interruptores de privacidad de Configuración (por ejemplo, «Mostrar mi nivel e insignias»).
- **Rankings:** nombre y número de nivel («Nv. 5»).
- **Tarjetas de aportes, reseñas y experiencias:** solo el nombre del autor (o «Anónimo»). Sin nivel ni insignias (§5.1).
- **Notificaciones:** al subir de nivel, al ganar o subir de grado una insignia y cuando se revierten puntos (con el motivo, sin revelar quién reportó).
- **Página «Cómo funcionan los puntos»:** la tabla del §3.1, qué «Me sirvió» cuentan (§3.2) y los desbloqueos del §4, en lenguaje simple.

## 9. Cambios necesarios en el backend

### 9.1 Esquema (Prisma)

- **`PointTransaction`:**
  - Convertir `reason` en el enum `PointReason` con los códigos del §3.1. No hacen falta variantes `_REVERTED`.
  - Agregar `idempotencyKey` (único, §3.5) y `reversesId` (opcional y único, con relación al movimiento revertido).
  - Agregar índices por `(userId, createdAt)` para los topes y el ranking mensual, y por `(reason, referenceId)` para las reversiones.
- **`Badge`:** agregar `slug` único (el código del §6.2), `rarity` (enum `COMUN`, `RARA`, `TEMPORADA`, `EDICION_UNICA`), `availableFrom` y `availableUntil` (opcionales, para las de edición única) y `sortOrder`.
- **`UserBadge`:**
  - Agregar `tier` (opcional: bronce, plata, oro), `tierUpdatedAt`, `referenceId` (qué la originó) y `edition` (`Int`, `0` para las que no son de temporada; el año o período para las de temporada).
  - Reemplazar el `@@unique([userId, badgeId])` actual por `@@unique([userId, badgeId, edition])`. `edition` no es nulo para que la unicidad funcione en Postgres.
- **Nuevo `ProfileCustomization`** (uno por usuario): avatar elegido, color de acento, fondo, marco, banner, título (referencia a una insignia) y hasta 3 aportes fijados. El backend valida que cada opción esté desbloqueada.
- **Nuevo `CorrectionSuggestion`** (para *Sugerir correcciones*): material, campo, valor propuesto, estado y quién decidió.

### 9.2 Servicios

- `PointService.awardPoints` pasa a recibir el enum, generar la `idempotencyKey`, aplicar los topes dentro de la transacción e ignorar duplicados. Se agrega `revertPoints(reason, referenceId)`, que revierte todos los movimientos vigentes de esa referencia.
- `HELPFUL_RECEIVED` se otorga y revierte desde el servicio de «Me sirvió», validando las reglas del §3.2.
- `MATERIAL_PIONEER` se evalúa cuando un material llega a 3 «Me sirvió» y cuando se edita la materia o el tipo de un material publicado.
- Mover los puntos de reseñas y experiencias para que solo se otorguen si `isAnonymous = false`, revertirlos cuando la moderación las retira (`CommunityModerationAction` con `REMOVE`) o el autor las borra, y volver a otorgarlos con `RESTORE`.
- Se deja de otorgar `GUIDE_CREATED` (las guías quedaron fuera del producto).
- Nuevo `BadgeService.evaluate(userId, trigger)`. Se dispara con un evento de dominio **después del commit** de cada movimiento de puntos o evento relevante, no dentro de la transacción de moderación. La unicidad de `UserBadge` lo hace seguro ante reintentos.
- `ranking.service.ts` calcula los rankings del §7 a partir de `PointTransaction` y no de `User.points`.
- Tarea periódica de conciliación: verifica que `User.points` sea igual a la suma de `PointTransaction` y alerta si no coincide.

### 9.3 Migración de datos

1. Las guías existentes conservan los puntos que ya otorgaron; no se generan más.
2. Recalcular los puntos de cada usuario desde cero con las reglas nuevas: quitar los otorgados por reseñas y experiencias anónimas, y generar las `idempotencyKey`.
3. Recalcular los niveles con la tabla nueva del §4.
4. Otorgar retroactivamente las insignias cuyo criterio ya se cumple, excepto las de temporada.

La migración se despliega **junto con** la tabla de niveles nueva. Así, cuando cambia el nivel de todo el mundo a la vez, no se puede deducir quién perdió puntos por haber escrito reseñas anónimas.

## 10. Para más adelante

Estos puntos e insignias dependen de funciones que todavía no existen en el esquema. Se agregan al catálogo cuando se implementen.

| Código | Qué | Puntos o criterio | Depende de |
|---|---|---|---|
| `EVENT_PUBLISHED` | Evento publicado | +5 · hasta 4 por mes | Eventos |
| `EVENT_POPULAR` | Tu evento llegó a 20 interesados | +5 · uno por evento | Eventos |
| `TUTOR_REVIEW_RECEIVED` | Opinión positiva (4 o 5 estrellas) sobre una tutoría tuya | +3 · una por estudiante y tutoría | Tutorías |
| Insignia `HOST` | Anfitrión | Un evento tuyo llegó a 20 interesados | Eventos |
| Insignia `HELPING_HAND` | Mano amiga | 5 opiniones positivas en tus tutorías | Tutorías |
| `REPORT_CONFIRMED` en materiales | Reportes de materiales | Mismas reglas que en reseñas | Reportes de materiales |

Publicar en Clasificados no va a sumar puntos.

## 11. Decisiones y preguntas abiertas

### 11.1 Decididas en esta revisión

- **¿Un «Me sirvió» de otra carrera vale más?** No. Complica los topes y cuesta explicarlo. Ese alcance se reconoce con la insignia **Puente**.
- **¿Se muestra el nombre del nivel o el número?** Los dos en el perfil; solo el número («Nv. 5») en los rankings; ninguno en las tarjetas de aportes.
- **¿La personalización necesita moderación?** No, porque solo hay opciones predefinidas. No se permiten imágenes propias en banners ni fondos.

### 11.2 Pendientes

- Fecha exacta que cierra el primer cuatrimestre para **Primera camada**. Propuesta: fijarla en la configuración como el último día de la última mesa del primer cuatrimestre de la plataforma.
- Validar los umbrales del §4 con datos reales del primer cuatrimestre.
- ¿«Leyendas de la facultad» es una lista por facultad o una sola para toda la plataforma?
- ¿Los «Me sirvió» de cuentas nuevas (menos de 7 días) deberían contar, o es suficiente con exigir email verificado?

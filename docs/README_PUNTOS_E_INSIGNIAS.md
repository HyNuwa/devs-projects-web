# Sistema de puntos, niveles e insignias

> **Estado:** revisión 2 (septiembre 2026). Los puntos y niveles (§3 y §4) están implementados desde el cambio `puntos-libro` (3a, octubre 2026). Las insignias (§6) están implementadas desde `puntos-insignias` (3b); Lupa, desde `privilegios-confianza` (3c-2). La personalización y la página de perfil público (§4 desbloqueos, §8) están implementadas desde `perfil-publico` (3c-1). Los privilegios (§5) están implementados desde `privilegios-confianza` (3c-2). Los rankings (§7) llegan con 3c-3.
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
| `User.points` y `User.level` | Existen. El nivel se recalcula en `PointLedger` con la tabla nueva de `rpg-levels.ts` (§4). |
| `PointTransaction` | Libro de movimientos: `reason` es el enum `PointReason`, con `idempotencyKey` única y `reversesId` (§3.5). |
| Material publicado | +10 al publicarse (`MATERIAL_PUBLISHED`), o al aprobarse si pasó por revisión previa. |
| Reseña de cursada | +5 al publicarse con nombre (`COURSE_REVIEWED`); las anónimas no suman (§3.4). |
| Experiencia de final | +5 al publicarse con nombre (`EXAM_EXPERIENCE_SHARED`); las anónimas no suman (§3.4). |
| Guía | Ya no suma. Los `GUIDE_CREATED` existentes se conservan; los movimientos viejos sin motivo conocido quedaron como `LEGACY_ADJUSTMENT`. |
| `MaterialHelpfulness` | Un «Me sirvió» por estudiante y material; los válidos suman `HELPFUL_RECEIVED` con sus topes (§3.2). |
| Reportes | Desde el cambio de moderación (`Report` y casos) se reportan materiales, reseñas y experiencias. `REPORT_CONFIRMED` se otorga en los tres. |
| `Badge` / `UserBadge` | Catálogo de 17 insignias (slug, rareza, orden, gema en `/assets/insignias/gema/`); el criterio vive en `badge-catalog.ts`. `UserBadge` guarda grado, edición y si ya se vio, con `@@unique([userId, badgeId, edition])`. |
| Ranking | `ranking.service.ts` ordena por puntos totales. Se reemplaza por rankings acotados (§7). |
| Eventos, tutorías, Clasificados | **No existen** en el esquema. Sus puntos e insignias quedan para más adelante (§10). |

## 3. Cómo se ganan puntos

### 3.1 Tabla de puntos

| Código (`reason`) | Acción | Puntos | Cuándo se otorga | Límites |
|---|---|---|---|---|
| `MATERIAL_PUBLISHED` | Material publicado | +10 | Al publicarse (si pasó por revisión previa, al aprobarse) | Uno por material · se revierte si se retira |
| `MATERIAL_PIONEER` | Primer material publicado de un tipo en una materia (ej. el primer final de Bases de Datos) | +5 | Cuando ese material llega a 3 «Me sirvió» | Uno por materia y tipo. No aplica al tipo `OTRO` |
| `HELPFUL_RECEIVED` | Otro estudiante marcó «Me sirvió» en tu material | +1 | Al marcarse | Hasta 25 por material · 20 por día por autor · 5 por mes de un mismo estudiante hacia el mismo autor |
| `COURSE_REVIEWED` | Reseña de cursada publicada con nombre | +5 | Al publicarse | Una con puntos por materia y ciclo lectivo (sin ciclo cuenta como uno más) |
| `EXAM_EXPERIENCE_SHARED` | Experiencia de final publicada con nombre | +5 | Al publicarse | Una con puntos por materia, período de examen y año («no recuerdo» cuenta como uno más) |
| `REPORT_CONFIRMED` | Moderación retiró un material, reseña o experiencia que reportaste | +2 | Al retirarse el contenido | Solo reportes hechos antes del retiro · hasta 10 puntos por semana · se revierte si el retiro se anula |
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
- **Anónima o con nombre.** Se elige al publicar y no cambia al editar: un cambio posterior movería los puntos del autor en ese momento y lo señalaría. Para cambiarlo se borra y se publica de nuevo.
- **Un rechazo no resta puntos.** Rechazar es parte normal de la revisión (duplicado, ilegible, etc.).
- **«Me sirvió» quitado.** Se revierte el punto que ese «Me sirvió» haya otorgado. Si no otorgó ninguno porque ya se había alcanzado un tope, no se revierte nada.
- **El registro no se recorta.** `User.points` es siempre la suma exacta de `PointTransaction`, aunque dé negativo. Solo al **mostrarlo** se muestra 0 como mínimo, y el nivel se calcula sobre `max(0, points)`. Así una restauración posterior no regala puntos.
- **Desbloqueos.** El nivel puede bajar si bajan los puntos, pero **los desbloqueos se conservan**: los decide el *nivel máximo alcanzado*, que nunca baja (ni por reversiones ni por sanciones). El perfil muestra el nivel actual. Al migrar, el máximo se inicializa con el nivel actual.

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

Cada nivel **desbloquea** opciones de personalización, que se eligen en *Mi perfil → Perfil público* (`/profile/me`). Se ven solo en el perfil público (`/usuarios/[username]`); fuera de él solo aparece el avatar elegido. Nada de esto afecta cómo se ve el contenido.

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

Algunas insignias también desbloquean cosas: por ejemplo, **Salvavidas** (cualquier grado) habilita un marco especial. Así se premia la calidad y no solo el volumen. A diferencia de los niveles, si se pierde la insignia se pierde su desbloqueo.

Decisiones de 3c-1 (`perfil-publico`):

- **Avatar:** foto propia o cualquier gato desbloqueado; sin elección, el gato asignado por id.
- **Arte:** acentos, fondos, marcos y el tema del nivel 8 en CSS. Los 4 gatos del nivel 2, los 3 especiales del nivel 7 y los 3 banners, ilustrados. El gato animado del nivel 9 es un gato existente con una animación sutil.
- **Insignias destacadas:** desde cualquier nivel. El título, desde el nivel 6.
- **Aportes fijados:** solo propios, publicados y con nombre. Desaparecen si se retiran o borran.
- **«Mostrar mi nivel e insignias»** (encendido por defecto): apagado oculta el nivel, las insignias y el título, y saca a la cuenta de todos los rankings. Los cosméticos siguen visibles.

Cómo quedó implementado en 3c-1:

- **Nivel máximo alcanzado:** la columna `users.max_level`. La sube el libro de puntos (`PointLedger`) y nunca baja; solo `rebuild-points` la vuelve a fijar en el nivel reconstruido.
- **Elecciones:** la tabla `profile_customizations`, con una fila por cuenta que se crea al guardar por primera vez. El catálogo de opciones y sus desbloqueos vive en `apps/backend/src/modules/users/profile-options.ts`, y el backend rechaza cualquier opción bloqueada.
- **Opciones:**
  - gatos: `birrete`, `crema`, `guino` y `max` (Nv. 1); `gato-lentes`, `gato-bufanda`, `gato-lapiz` y `gato-mate` (Nv. 2); `gato-pixel`, `gato-dorado` y `gato-nocturno` (Nv. 7); `gato-animado` (Nv. 9);
  - acentos: `menta`, `coral`, `cielo`, `ambar`, `lavanda` y `pizarra` (Nv. 3);
  - fondos: `cuadriculado`, `hoja` y `pixel` (Nv. 4);
  - marcos: `marco-clasico` (Nv. 5), `marco-legendario` (Nv. 10) y `marco-salvavidas` (insignia Salvavidas);
  - banners: `banner-biblioteca`, `banner-pasillo` y `banner-atardecer` (Nv. 5);
  - tema: `faro` (Nv. 8).
- **Lo que se pierde se cae solo al leer:** si se pierde la insignia del título, de una destacada o del marco Salvavidas, o si se retira un aporte fijado, el perfil deja de mostrarlo sin borrar nada. Si el aporte se restaura, vuelve.
- **API:** `GET`/`PUT /users/me/profile-customization`, y las públicas `GET /profiles/:username` y `GET /profiles/:username/contributions`.
- **Arte:** los gatos están en `apps/frontend/public/avatars/` y los banners en `apps/frontend/public/assets/perfil/banners/`.
- **El editor no reevalúa insignias al guardar:** usa la última evaluación, la de «Tu progreso» o la del perfil público. Si reevaluara, también podría quitar insignias en medio de una edición. Una insignia ganada recién aparece en el editor después de abrir «Tu progreso».
- **Autor de un material:** las vistas rediseñadas de materiales (la vista previa y `/buscar`) no muestran quién lo subió, así que el enlace al perfil solo aparece en reseñas y experiencias. Si una vista futura muestra al autor, tiene que usar `AuthorLink`, que nunca enlaza lo anónimo.
- **«Anónimo» es un nombre reservado:** el registro y el nombre visible rechazan «Anónimo» y sus variantes (`common/validators/reserved-name.ts`), porque es como se muestra lo anónimo.
- **Pendiente para 3c-3 (`rankings-acotados`):** que el interruptor «Mostrar mi nivel e insignias» saque a la cuenta de todos los rankings, y enlazar cada nombre del ranking a su perfil con `AuthorLink`. Hasta entonces, el `/ranking` heredado todavía muestra a la cuenta, así que 3c-1 no puede salir sin 3c-3.

## 5. Privilegios de confianza

Son permisos que ayudan a mantener la calidad. Todos requieren **no haber tenido sanciones en los últimos 90 días**: cuentan el silenciamiento, la suspensión y el retiro por normas (incluido el de contenido anónimo, porque los privilegios no son públicos), contados desde el fin de la sanción o el cierre del caso. No cuentan las advertencias ni lo anulado en apelación o restaurado. La suspensión permanente no vuelve nunca. El nivel requerido se compara con el nivel máximo alcanzado. Cada privilegio se basa en la señal que mejor predice si se va a usar bien: el nivel mide cuánto aportaste, no si reportás con buen criterio.

| Privilegio | Requisito | Qué permite |
|---|---|---|
| Sugerir correcciones | Nivel 3 | Proponer cambios de materia, tipo, ciclo o profesor en materiales ajenos. Moderación los acepta o rechaza, así que el riesgo es bajo. |
| Reportes prioritarios | Al menos 5 reportes confirmados y 70 % o más de reportes confirmados en los últimos 90 días | Tus reportes aparecen primero en la cola de moderación. Se pierde si la precisión baja del 70 %. |
| Invitación a moderar | Nivel 6 · cuenta con más de 6 meses · al menos 5 reportes confirmados o 10 correcciones aceptadas | Moderación puede invitarte al rol `MODERATOR`. La invitación es manual; cumplir los requisitos solo te hace elegible. |

Decisiones de 3c-2 (`privilegios-confianza`):

- **Correcciones:** son de clasificación (materia, tipo, ciclo o profesor), un campo por sugerencia y una sola abierta por material y campo, nunca sobre lo propio. **El autor decide primero** desde «Mis envíos»: si acepta, se aplica; si rechaza, se cierra; si no responde en 7 días, pasa a la pestaña «Correcciones» de moderación. Si el material se edita o se retira antes de decidir, la sugerencia se cierra. Las aceptadas cuentan para Lupa aunque el material se retire después. Cuando lleguen las Novedades, el autor recibirá un aviso.
- **Reportes prioritarios:** ambas condiciones en los últimos 90 días, sin contar pendientes. Se evalúan al reportar y se guardan en el reporte. Ordenan después de los casos de datos personales y antes del conteo de reportes.
- **Invitación a moderar:** sin entidad propia. Una marca y un filtro «Elegible» en `/admin/usuarios`, y el admin cambia el rol. «Tu progreso» muestra los otros dos privilegios con su estado, pero no la elegibilidad.

Cómo quedó implementado en 3c-2:

- **Buena posición:** `trust/standing.ts` la calcula desde `Sanction` (silenciamientos y suspensiones no anuladas, contadas desde `liftedAt` o `endsAt`) y desde los casos con `REMOVE` no revertidos (contados desde `closedAt`), incluidos los de contenido anónimo. Los privilegios están en `trust/privileges.ts` y se muestran con `GET /users/me/privileges`.
- **Correcciones:** la tabla `correction_suggestions`, con un índice único parcial que permite una sola sugerencia abierta por material y campo. Cada estudiante puede tener como máximo 10 abiertas.
  - La fase (autor o moderación) y la obsolescencia se calculan al leer, sin tareas programadas.
  - Un material oculto preventivamente no cierra sus sugerencias: esperan sin listarse hasta que vuelve a estar publicado.
  - Aceptar usa `MaterialsService.applyClassification`, la misma validación y la misma reevaluación de Primera huella que la edición del autor.
  - `rebuild-points` también repite los `CORRECTION_ACCEPTED`.
- **Reportes prioritarios:** `Report.priority` se guarda al reportar. La cola los ordena después de los casos de datos personales; la respuesta de la cola y el detalle del caso no muestran la marca ni quién reportó.
- **Elegibles:** el filtro `eligible` y las marcas `eligible` y `canPromote` en Usuarios aparecen solo para ADMIN y SUPERADMIN, porque la buena posición cuenta retiros anónimos. «Hacer moderador» (`POST /moderation/users/:id/promote`) solo pasa de USER a MODERATOR y queda en el historial como `ROLE_CHANGED`.
- **Pantallas:** «Sugerir corrección» en la vista previa del material, «Sugerencias para tus materiales» en «Mis envíos», la pestaña `/admin/correcciones` y la tarjeta de privilegios en «Tu progreso».

### 5.1 Qué no se otorga nunca por nivel

- Resolver casos de moderación sin ser moderador.
- Saltar la revisión previa cuando corresponde (cuenta nueva o con un retiro reciente).
- Mejor posición en búsquedas, listados o la página de una materia.
- Distintivos en las tarjetas de tus aportes (nivel, sello o insignia junto a tu nombre).

### 5.2 Sanciones

Mientras una cuenta está silenciada (`isMuted`) o suspendida (`isBanned`): no gana puntos, sus «Me sirvió» no cuentan y pierde los privilegios de confianza, que vuelven recién después de 90 días sin sanciones. **La personalización y las insignias no se ocultan**: si un perfil volviera de golpe al aspecto por defecto, cualquiera deduciría la sanción (decidido en el grilling de 3c).

**Estado:** congelar los puntos está implementado desde 3a. Quitar los privilegios llega con 3c-2. Los puntos reotorgados por una apelación aceptada se otorgan aunque haya una sanción activa.

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
- En el perfil público se pueden destacar hasta 3 insignias (3c). Hasta entonces, la API del perfil público lista las insignias ganadas con grado y edición, **sin fecha** (una fecha podría coincidir con un retiro) y **nunca «Ojo atento»**, que solo ve su dueño porque habla de reportar.
- **Cuándo se evalúan:** al leerlas («Tu progreso», el perfil público y la reconstrucción de puntos), desde los datos actuales de la cuenta. La fecha «ganada» es cuándo se detectó por primera vez; se muestra con mes y año. Cuando lleguen las notificaciones habrá que evaluarlas en cada evento, con la misma función.
- **Una insignia nueva** muestra la animación «entrada» de su gema la primera vez que se ve en «Tu progreso» (no con movimiento reducido).
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
| `BRIDGE` | Puente | Un material tuyo recibe «Me sirvió» de estudiantes de al menos 3 carreras distintas (según sus planes de estudio activos, que cada estudiante declara en *Mi carrera* desde el cambio `instituciones`; cada estudiante cuenta una sola vez) | Rara | — |
| `STEADY` | Constante | Al menos un aporte publicado en 2 cuatrimestres seguidos (plata: 4, oro: 8) | Común | Bronce · plata · oro |
| `REVIEWER` | Voz de la cursada | Reseñas de cursada con nombre: 5 (plata: 15, oro: 40) | Común | Bronce · plata · oro |
| `FULL_CONTEXT` | Contexto completo | 10 reseñas con nombre que indican ciclo lectivo, profesor, franja horaria, situación de cursada y dificultad | Rara | — |
| `CHRONICLER` | Cronista de mesas | Experiencias de final con nombre en las mesas de diciembre, julio y febrero/marzo (o marzo) | Rara | — |
| `DECEMBER_BOARD` | Mesa de diciembre | Contaste con nombre una experiencia de final de la mesa de diciembre de ese año | De temporada | — |
| `FINALS_SEASON` | Temporada de finales | 3 aportes publicados durante un período de mesas (una edición por período) | De temporada | — |
| `GUARDIAN` | Ojo atento | 10 reportes confirmados por moderación | Rara | — |
| `EDITOR` | Lupa | 10 correcciones aceptadas, aunque el material se retire después (implementada en 3c-2, slug `lupa`) | Rara | — |
| `FOUNDER` | Primera camada | Cuenta con email verificado creada durante el primer cuatrimestre de la plataforma y al menos un aporte publicado en ese período | Edición única | — |

Notas sobre criterios:

- **Constante** se mide por cuatrimestres y no por meses: con meses seguidos, las vacaciones de verano cortarían la racha de todo el mundo.
- **Mesa de diciembre** era la única insignia «de temporada» que en realidad se repite cada año. Por eso ahora hay dos rarezas separadas: de temporada (con edición) y edición única.
- **Primera huella** exige el tipo distinto de `OTRO` y los 3 «Me sirvió» del bono. Así no se gana subiendo cualquier cosa, y al lanzar la plataforma no la gana todo el mundo.
- **Primera luz** premia lo más valioso para la comunidad: la primera ayuda en una materia vacía.
- **Calendario** (`badge-calendar.ts`): 1er cuatrimestre de marzo a julio y 2do de agosto a diciembre; enero y febrero cuentan en el 2do anterior. Mesas: febrero–marzo, julio y diciembre; la edición de «Temporada de finales» es `AAAAMM` del primer mes de la mesa. Días en hora de Argentina (UTC−3).
- **Ojo atento** cuenta casos con un reporte tuyo confirmado cuyo retiro sigue vigente, no los puntos (que tienen tope semanal).

### 6.3 Qué no se agrega nunca

- Insignias por rachas diarias o por iniciar sesión.
- Insignias por cantidad sola (ej. «100 materiales subidos») sin una señal de que sirvieron.
- Insignias por votar, marcar «Me sirvió» o valorar contenido ajeno.
- Insignias por moderar.

## 7. Rankings

Se reemplaza el ranking global por puntos totales (siempre ganan los mismos y desanima a los nuevos) por rankings **acotados y que se renuevan**:

- **Los que más ayudaron este mes en tu carrera:** puntos netos ganados en el mes (otorgamientos menos reversiones). Cada punto se atribuye a la carrera de la materia del aporte que lo generó. Si la materia pertenece a varias carreras, cuenta en cada una. `REPORT_CONFIRMED` y `CORRECTION_ACCEPTED` se atribuyen a la carrera del contenido reportado o corregido.
- **Más útiles de una materia este cuatrimestre:** materiales ordenados por «Me sirvió», en la página de la materia.
- **Leyendas de la facultad:** lista fija, **por facultad** (ADR 0002), de quienes alcanzaron alguna vez el nivel 10 (nivel máximo alcanzado). Alguien aparece en las facultades de sus planes de estudio activos o terminados; sin plan, no aparece.

Los rankings de personas muestran los 10 primeros y, si no estás entre ellos, tu posición; los empates comparten el puesto. Nunca muestran a quien desactivó «Mostrar mi nivel e insignias». Exclusión por sanción: el mensual excluye las sanciones activas (la lista rota y no delata a nadie); Leyendas solo excluye la suspensión permanente, porque sacar a alguien de una lista fija durante 7 días lo delataría.

Decisiones de 3c-3 (`rankings-acotados`):

- **Mensual:** mes calendario en UTC−3. Por defecto, la carrera del plan activo, con un selector.
- **Materia:** top 10 de materiales por «Me sirvió» válidos recibidos **en el cuatrimestre en curso**, sin importar cuándo se publicaron. Sin «tu posición» ni exclusiones por autor. La sección no aparece si está vacía.
- **`/ranking`:** dos pestañas, «Este mes en tu carrera» y «Leyendas de la facultad». Se eliminan el ranking global, el semanal y `/ranking/top`.
- **`/puntos`** (existe desde 3a): se actualiza con correcciones, Lupa, privilegios y desbloqueos.

## 8. Cómo se ve en el producto

- **Mi espacio → «Tu progreso»** (`/mi-espacio/progreso`, construido en 3a sin insignias): nivel actual, puntos que faltan para el siguiente, qué desbloquea el próximo nivel, insignias ganadas y las más cercanas («te faltan 12 "Me sirvió" para Salvavidas»).
- **Perfil público:** número y nombre del nivel, hasta 3 insignias destacadas, título elegido y la personalización desbloqueada. Respeta el interruptor «Mostrar mi nivel e insignias» de *Mi perfil → Perfil público*. En `/usuarios/[username]`, abierta sin iniciar sesión.
- **Rankings:** nombre y número de nivel («Nv. 5»).
- **Tarjetas de aportes, reseñas y experiencias:** solo el nombre del autor (o «Anónimo»). Sin nivel ni insignias (§5.1).
- **Notificaciones:** al subir de nivel, al ganar o subir de grado una insignia y cuando se revierten puntos (con el motivo, sin revelar quién reportó). Quedan para el plan de notificaciones; mientras tanto, «Tu progreso» muestra los movimientos con su motivo.
- **Página «Cómo funcionan los puntos»:** la tabla del §3.1, qué «Me sirvió» cuentan (§3.2) y los desbloqueos del §4, en lenguaje simple.

## 9. Cambios necesarios en el backend

### 9.1 Esquema (Prisma)

- **`PointTransaction`:**
  - Convertir `reason` en el enum `PointReason` con los códigos del §3.1. No hacen falta variantes `_REVERTED`.
  - Agregar `idempotencyKey` (único, §3.5) y `reversesId` (opcional y único, con relación al movimiento revertido).
  - Agregar índices por `(userId, createdAt)` para los topes y el ranking mensual, y por `(reason, referenceId)` para las reversiones.
- **`Badge`:** `slug` único (el código del §6.2), `rarity` (enum `COMUN`, `RARA`, `TEMPORADA`, `EDICION_UNICA`) y `sortOrder`. La ventana de Primera camada vive en la configuración (`FOUNDER_WINDOW_*`). Hecho en 3b.
- **`UserBadge`:** `tier` (bronce, plata, oro), `tierUpdatedAt`, `edition` (`Int`, `0` para las que no son de temporada; el año o `AAAAMM` de la mesa para las de temporada) y `seenAt`, con `@@unique([userId, badgeId, edition])`. Hecho en 3b.
- **Nuevo `ProfileCustomization`** (uno por usuario): avatar elegido, color de acento, fondo, marco, banner, título (referencia a una insignia) y hasta 3 aportes fijados. El backend valida que cada opción esté desbloqueada.
- **`CorrectionSuggestion`** (para *Sugerir correcciones*): material, campo, valor actual y propuesto, comentario, estado, quién decidió y por qué se cerró. Hecho en 3c-2.

### 9.2 Servicios

- `PointService.awardPoints` pasa a recibir el enum, generar la `idempotencyKey`, aplicar los topes dentro de la transacción e ignorar duplicados. Se agrega `revertPoints(reason, referenceId)`, que revierte todos los movimientos vigentes de esa referencia.
- `HELPFUL_RECEIVED` se otorga y revierte desde el servicio de «Me sirvió», validando las reglas del §3.2.
- `MATERIAL_PIONEER` se evalúa cuando un material llega a 3 «Me sirvió» y cuando se edita la materia o el tipo de un material publicado.
- Mover los puntos de reseñas y experiencias para que solo se otorguen si `isAnonymous = false`, revertirlos cuando la moderación las retira (`CommunityModerationAction` con `REMOVE`) o el autor las borra, y volver a otorgarlos con `RESTORE`.
- Se deja de otorgar `GUIDE_CREATED` (las guías quedaron fuera del producto).
- `BadgeService.evaluate(userId)` recalcula las insignias **al leerlas** («Tu progreso», perfil público, reconstrucción), fuera de las transacciones de moderación; un lock por cuenta y la unicidad de `UserBadge` lo hacen seguro ante lecturas simultáneas. Hecho en 3b.
- `ranking.service.ts` calcula los rankings del §7 a partir de `PointTransaction` y no de `User.points`.
- Tarea periódica de conciliación: verifica que `User.points` sea igual a la suma de `PointTransaction` y alerta si no coincide.

### 9.3 Migración de datos

1. Las guías existentes conservan los puntos que ya otorgaron; no se generan más.
2. Recalcular los puntos de cada usuario desde cero con las reglas nuevas: quitar los otorgados por reseñas y experiencias anónimas, y generar las `idempotencyKey`.
3. Recalcular los niveles con la tabla nueva del §4.
4. Otorgar retroactivamente las insignias cuyo criterio ya se cumple, marcadas como vistas para que no se animen todas juntas. Las de temporada solo cuentan aportes compartidos durante su período, así que no se inventan ediciones pasadas.

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

También queda para más adelante un **programa de embajadores** (por ahora, un formulario de Google enlazado desde el sitio) para quienes quieran ayudar a sumar su facultad o a moderar en ella.

## 11. Decisiones y preguntas abiertas

### 11.1 Decididas en esta revisión

- **¿Un «Me sirvió» de otra carrera vale más?** No. Complica los topes y cuesta explicarlo. Ese alcance se reconoce con la insignia **Puente**.
- **¿Se muestra el nombre del nivel o el número?** Los dos en el perfil; solo el número («Nv. 5») en los rankings; ninguno en las tarjetas de aportes.
- **¿La personalización necesita moderación?** No, porque solo hay opciones predefinidas. No se permiten imágenes propias en banners ni fondos.
- **¿Cuentan los «Me sirvió» de cuentas nuevas?** Sí: alcanza con el email verificado y sin sanciones activas. Los topes (5 por mes entre las mismas dos personas, 20 por día por autor) ya frenan a los grupos de amigos (decidido en `puntos-libro`).
- **Días y meses de los topes:** se cuentan en hora de Argentina (UTC−3).

- **Leyendas de la facultad:** una lista por facultad. La jerarquía universidad → facultad llega antes de 3c, en el cambio `instituciones` (ADR 0002).
- **Secuencia de 3c:** `instituciones` → `perfil-publico` (3c-1) → `privilegios-confianza` (3c-2) → `rankings-acotados` (3c-3), en ramas apiladas.

### 11.2 Pendientes

- Fecha exacta que cierra el primer cuatrimestre para **Primera camada**. Se configura con `FOUNDER_WINDOW_START` y `FOUNDER_WINDOW_END` (fechas ISO inclusivas); sin ambas, nadie la gana.
- Validar los umbrales del §4 con datos reales del primer cuatrimestre.

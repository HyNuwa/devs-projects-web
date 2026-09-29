# Moderación

> **Estado:** propuesta acordada (septiembre 2026). Casi nada de esto está implementado; lo que ya existe se marca en §2.
> **Decisión de fondo:** `docs/adr/0001-publicacion-inmediata-con-moderacion-posterior.md`.
> **Relacionado:** `CONTEXT.md` (glosario), `docs/README_PUNTOS_E_INSIGNIAS.md` (puntos, privilegios y sanciones).

## 1. Objetivo y principios

La moderación cuida que DevsProject sea útil y seguro sin volverse un cuello de botella. Un equipo chico no puede revisar cada cosa que se publica, así que el trabajo de moderación se concentra en lo que el sistema o la comunidad marcan como sospechoso.

1. **Se publica al instante.** Materiales, reseñas, experiencias, eventos y avisos de Clasificados se ven apenas se publican. La revisión previa es la excepción (§3.3).
2. **Reportar no es borrar.** Un reporte abre o suma a un caso. Solo varias señales independientes ocultan algo antes de que moderación decida (§4.4).
3. **Toda decisión tiene una razón escrita** y queda registrada con quién, cuándo y por qué. El autor ve la razón; nunca ve quién decidió ni quién reportó.
4. **Retirar es reversible.** Nada se borra de forma permanente por moderación: se retira y se puede restaurar.
5. **Las personas deciden; el sistema sugiere.** Las sanciones las aplica moderación. El sistema solo oculta de forma preventiva y sugiere el siguiente paso.

## 2. Qué ya existe

| Pieza | Estado actual |
|---|---|
| Roles | `VISITOR`, `USER`, `MODERATOR`, `ADMIN`, `SUPERADMIN`. |
| Materiales | Empiezan en `PENDING` y se publican al aprobarse (`APPROVE_MATERIAL`, `REJECT_MATERIAL` con motivo). **Cambia** (§3). |
| `ModerationLog` | Registra acciones sobre usuarios y materiales (`BAN_USER`, `MUTE_USER`, `REMOVE_MATERIAL`, `PROMOTE_MODERATOR`, etc.) con motivo y vencimiento. |
| `CommunityReport` | Reportes de reseñas y experiencias con 6 motivos. **No tiene estado** y no existe para materiales, eventos ni Clasificados. |
| `CommunityModerationAction` | Retirar y restaurar reseñas y experiencias, con razón obligatoria. |
| Usuario | `isBanned`, `isMuted`, `mutedUntil`. |
| Panel actual | Cola de materiales pendientes y reportes de la comunidad, con el «autor interno» visible siempre. |
| Clasificados y Eventos | Todavía no existen en el backend. |

## 3. Cómo se publica cada contenido

### 3.1 Resumen

| Contenido | Al publicar | Después |
|---|---|---|
| Material | Controles automáticos (§3.2) y se publica | Reportes |
| Reseña de cursada y experiencia de final | Se publica | Reportes |
| Evento | Se publica con el respaldo visible de quién lo organiza (§9) | Reportes |
| Aviso de Clasificados | Controles automáticos más estrictos contra spam y estafas (§3.2) y se publica | Reportes |

### 3.2 Controles automáticos antes de publicar

**Materiales:**
- Formato admitido y hasta 25 MB por archivo (ya existe).
- Archivo no vacío y que se pueda abrir.
- Materia y tipo de recurso obligatorios.
- **Duplicado exacto:** si el mismo archivo (mismo hash) ya está publicado en esa materia, se bloquea la subida y se muestra el existente.
- **Ritmo:** hasta 10 subidas por día por cuenta.

**Avisos de Clasificados:** además de los campos obligatorios, se bloquean los avisos repetidos de la misma cuenta y se marcan para revisión previa los que tienen enlaces externos sospechosos.

**Para más adelante:** detección automática de datos personales (nombres, DNI, legajos) en los archivos y escaneo de virus.

### 3.3 Revisión previa (la excepción)

Una publicación espera aprobación antes de verse solo si se cumple alguna de estas condiciones:

- La cuenta tiene **menos de 7 días** o **no verificó su email**.
- La cuenta tuvo **un retiro por normas en los últimos 90 días**.
- Los controles automáticos la marcaron como **spam o duplicado casi exacto**.
- Es un evento de un organizador con **2 o más eventos retirados**.

Mientras espera, el autor la ve en *Mis aportes* como «En revisión previa», con la razón («tu cuenta es nueva»). Si se rechaza, recibe el motivo y puede corregir y reenviar.

## 4. Reportes y casos

### 4.1 Qué se puede reportar

Todo lo publicado: materiales, reseñas, experiencias, eventos y avisos de Clasificados. Solo pueden reportar cuentas con sesión iniciada. Una misma cuenta reporta un contenido una sola vez.

### 4.2 Motivos

Los seis que ya existen, para todos los tipos: spam o contenido repetido, insultos o acoso, expone datos personales, no relacionado con la materia, información posiblemente engañosa, y otro motivo (con explicación obligatoria).

### 4.3 Casos

Todos los reportes sobre un mismo contenido se agrupan en **un caso**. Moderación resuelve casos, no reportes sueltos.

Estados del contenido y del caso:

```
Publicado → Reportado → Oculto (en revisión) → Restaurado
                     ↘                       ↘ Retirado
                       Mantenido visible
```

- **Reportado:** hay un caso abierto; el contenido sigue visible.
- **Oculto (en revisión):** se ocultó de forma preventiva (§4.4) hasta que moderación decida.
- **Mantenido visible:** moderación desestimó los reportes.
- **Retirado:** moderación lo sacó de la vista pública. Es reversible.
- **Restaurado:** vuelve a verse, sin perder su historial.

Cada reporte queda como **confirmado** (el contenido se retiró) o **desestimado** (se mantuvo visible). Esto alimenta la precisión de quien reporta, que usa el privilegio *Reportes prioritarios*.

### 4.4 Ocultamiento preventivo

El sistema oculta un contenido hasta que moderación lo revise cuando:

- recibe **3 reportes de cuentas distintas en 48 horas**, contando solo cuentas con email verificado y más de 7 días de antigüedad; o
- recibe **1 reporte por datos personales** de una cuenta con email verificado y más de 7 días de antigüedad, porque el daño es inmediato. Si lo hace una cuenta que no cumple esas condiciones, el reporte se suma al caso con prioridad alta pero no oculta el contenido.

Los reportes de cuentas con *Reportes prioritarios* valen doble para este cálculo. El autor ve su contenido como «Oculto mientras se revisa» y no se le descuentan puntos hasta que haya una decisión.

### 4.5 Cola de moderación

La cola ordena primero: ocultos preventivamente, luego casos con más reportes, luego los de reportantes con buena precisión, y dentro de cada grupo, los más viejos. Cada moderador ve solo los casos de su facultad (§8).

## 5. Decisiones sobre un caso

| Decisión | Efecto | Razón |
|---|---|---|
| Mantener visible | Desestima los reportes y cierra el caso | Opcional, interna |
| Retirar | Saca el contenido de la vista pública y de los resúmenes; revierte sus puntos (ver `README_PUNTOS_E_INSIGNIAS.md` §3.3) | **Obligatoria**, la ve el autor |
| Restaurar | Vuelve a publicar un contenido retirado y reotorga sus puntos | **Obligatoria**, interna |

**Qué ve el autor:** qué se decidió, la razón escrita, la fecha y qué puede hacer (corregir y reenviar, o apelar). **Nunca** ve el nombre del moderador ni quién reportó.

**Qué ve quien reportó:** que su reporte fue revisado. No ve la razón ni datos del autor.

**Conflicto de interés:** un moderador no puede resolver casos sobre su propio contenido.

## 6. Sanciones

### 6.1 Escalera

| Paso | Cuándo | Quién la aplica | Efecto |
|---|---|---|---|
| Advertencia | Primer retiro por normas en 90 días | `MODERATOR`: al retirar, la pantalla ofrece «Advertir también» (marcado cuando es el paso sugerido) | Solo aviso; queda en el historial |
| Silenciamiento | Segundo retiro por normas en 90 días (el panel lo **sugiere**) | `MODERATOR` | 7 días fijos (§6.3) (`isMuted`, `mutedUntil`) |
| Suspensión | Tercer retiro por normas en 90 días, o un retiro nuevo con un silenciamiento en los últimos 90 días | `MODERATOR` la **propone**; la confirma un `ADMIN` | No puede iniciar sesión (§6.4); 7 días, 30 días o permanente (`isBanned`, `bannedUntil`) |

**Excepción:** spam y cuentas falsas pueden suspenderse de entrada, sin pasar por los pasos anteriores.

El sistema **nunca** aplica una sanción solo: calcula el paso sugerido y moderación decide.

**Qué cuenta como retiro por normas:** la decisión «Retirar» sobre un caso. No cuentan el borrado que hace el propio autor, el rechazo en revisión previa, ni un retiro que después se restauró o se revirtió por apelación.

**Sanciones sin caso:** desde *Usuarios* se puede advertir o silenciar cualquier cuenta con una razón obligatoria. El paso sugerido es solo una ayuda.

**Fin de una sanción:** no hace falta ningún proceso periódico. Una cuenta está silenciada mientras `mutedUntil` sea posterior a ahora, y una suspensión temporal dura mientras `bannedUntil` lo sea. Al pasar la fecha, deja de aplicarse sola.

**Publicaciones anónimas:** desde un caso se puede sancionar al autor sin verlo. La sanción aparece en su ficha como «por un caso», con el enlace al caso, y el caso sigue mostrando «Autor oculto».

### 6.2 Efectos sobre puntos y privilegios

Mientras dura una sanción, la cuenta no gana puntos, sus «Me sirvió» no cuentan, se ocultan sus personalizaciones y pierde los privilegios de confianza (detalle en `README_PUNTOS_E_INSIGNIAS.md` §5.2).

Por ahora solo se aplica lo que la sanción bloquea directamente (publicar y «Me sirvió», §6.3). Congelar puntos, ocultar personalizaciones y quitar privilegios llega con el cambio de puntos e insignias. Los puntos que se reotorgan por una apelación aceptada se otorgan igual, porque el retiro fue un error.

### 6.3 Silenciamiento

Dura **7 días fijos**. Mientras dura, la cuenta no puede publicar, editar ni reenviar sus aportes, reportar ni marcar «Me sirvió». Puede leer, buscar, descargar y guardar. Cualquier `MODERATOR` puede **quitar el silencio** antes de tiempo.

Las acciones bloqueadas se muestran deshabilitadas con la explicación («Estás silenciado hasta el 6 oct: no podés publicar, reportar ni marcar Me sirvió»), para que nadie complete un formulario que no va a poder enviar. El servidor las rechaza igual.

### 6.4 Suspensión

- La propone un `MODERATOR` con una razón. No afecta a la cuenta hasta que un `ADMIN` la confirma o la rechaza, también con una razón.
- Duración: 7 días, 30 días o permanente.
- Al confirmarla se cierran todas las sesiones de la cuenta. El ingreso y la renovación de sesión se rechazan mostrando la razón y hasta cuándo. Mientras vence el acceso ya emitido (hasta 15 minutos), las acciones que escriben (publicar, reportar, «Me sirvió») igual verifican el estado de la cuenta.
- Sus aportes publicados **siguen visibles**. Al confirmar, el `ADMIN` puede marcar «Retirar también sus aportes publicados» (pensado para spam): se retiran con la misma razón y se revierten sus puntos.
- Solo un `ADMIN` puede levantar una suspensión antes de tiempo.

## 7. Apelaciones

- Se pueden apelar los **retiros** y las **sanciones** (advertencia, silenciamiento, suspensión). No se apelan el rechazo en revisión previa (se corrige y se reenvía) ni «Mantener visible» (quien reporta no apela).
- Se puede apelar **una vez por decisión**, dentro de los **14 días**, desde *Mis envíos* o desde el aviso de la sanción.
- Una cuenta suspendida apela desde la pantalla de ingreso: al rechazar el ingreso se muestran la razón, hasta cuándo y el formulario «Apelar esta suspensión», que exige las credenciales correctas y sirve solo para esa suspensión.
- La apelación incluye una explicación de quien apela (obligatoria).
- La revisa **otro** moderador, nunca quien tomó la decisión. Una apelación sobre una suspensión la revisa un `ADMIN`. Si no hay nadie habilitado (por ejemplo, un solo moderador), espera a un `ADMIN`.
- La respuesta es **final** y siempre lleva una razón escrita.
- Apelar no revela al autor de una publicación anónima: quien revisa ve «Autor oculto» y, si lo necesita, usa **Ver autor** con un motivo, que queda registrado (§9).
- Si se acepta un **retiro**: el contenido se restaura, los puntos se reotorgan, el retiro deja de contar para la escalera y se anula la advertencia que se haya dado junto con ese retiro.
- Si se acepta una **sanción**: se levanta en el momento y deja de contar.
- Si se rechaza, la decisión se mantiene y no hay otra apelación.

## 8. Roles y alcance

| Rol | Alcance | Puede |
|---|---|---|
| `USER` | — | Publicar, reportar, apelar |
| `MODERATOR` | **Una o más facultades asignadas** | Resolver casos, retirar y restaurar, advertir y silenciar, aprobar o rechazar la revisión previa, resolver apelaciones de otros moderadores |
| `ADMIN` | Todas las facultades | Todo lo anterior, suspender, verificar organizadores, asignar moderadores y su facultad |
| `SUPERADMIN` | Toda la plataforma | Todo lo anterior, gestionar admins y la configuración (umbrales de §4.4, límites de §3.2) |

**Quién sanciona a quién:** nadie se sanciona a sí mismo. Un `MODERATOR` no sanciona a otro `MODERATOR`, `ADMIN` ni `SUPERADMIN`: a un moderador lo sanciona un `ADMIN`, y a un `ADMIN` solo un `SUPERADMIN`. Tampoco se sanciona a una cuenta desde un caso que uno reportó.

Hoy DevsProject solo tiene la FI UNJu, así que en la práctica todos los moderadores cubren la misma facultad. La asignación por facultad evita rehacer el modelo cuando se sumen otras.

**Cómo se llega a moderar:** por invitación de un `ADMIN`. Cumplir los requisitos de *Invitación a moderar* (`README_PUNTOS_E_INSIGNIAS.md` §5) solo hace elegible.

## 9. Publicaciones anónimas en moderación

Moderación puede saber quién escribió una publicación anónima, pero **no lo ve por defecto**. En el caso aparece «Autor oculto» y un botón **Ver autor**, que pide un motivo (por ejemplo, «evaluar reincidencia para una sanción») y **queda registrado** en el historial. Así el anonimato también se protege frente a moderadores que son compañeros de cursada.

Las sanciones sobre una publicación anónima se aplican a la cuenta del autor sin revelar públicamente quién es.

## 10. Organizadores verificados (Eventos)

- Una **agrupación** (centro de estudiantes, club, cátedra, secretaría) pide la verificación desde un formulario, con un contacto oficial (mail institucional o redes).
- La verificación la aprueba un **`ADMIN`**.
- Una agrupación verificada tiene **miembros** que publican en su nombre. Los agrega la persona responsable; moderación puede quitarlos.
- Los eventos muestran quién los respalda: «Publicado por la comunidad» o «✓ Centro de Estudiantes FI · verificado».
- La verificación se puede retirar si la agrupación publica eventos que no cumplen las normas.

## 11. Historial y auditoría

Todo queda registrado, sin excepción: decisiones sobre casos, revisiones previas, sanciones, apelaciones, cambios de rol, verificaciones de organizadores y cada uso de **Ver autor**. Cada registro guarda quién, qué, sobre qué, cuándo y la razón.

El historial es de solo lectura: nadie puede editar ni borrar un registro.

## 12. Cambios necesarios

### 12.1 Esquema (Prisma)

- **Material:** el estado de publicación pasa a `PUBLISHED` por defecto; `PENDING` queda solo para la revisión previa (§3.3). Se agregan `HIDDEN` (ocultamiento preventivo) y `REMOVED` (retirado). Hash del archivo para detectar duplicados.
- **Reportes:** generalizar `CommunityReport` para cualquier contenido (materiales, reseñas, experiencias, eventos, avisos) y agregar estado del reporte (`OPEN`, `CONFIRMED`, `DISMISSED`).
- **Nuevo `ModerationCase`:** agrupa los reportes de un contenido, con estado, facultad y quién lo resolvió.
- **Nuevo `Appeal`:** decisión apelada, explicación, estado, quién la revisó y razón.
- **Nuevo `ModeratorScope`:** qué facultades cubre cada moderador. Llega con el modelo de Facultad (cambio Universidad/Facultad); hasta entonces todo moderador ve todos los casos.
- **Revelación de autor:** cada uso de «Ver autor» (moderador, publicación, motivo, fecha) se guarda como un evento `AUTHOR_REVEALED` del historial único, visible solo para `ADMIN`.
- **Advertencias:** agregar `WARN_USER` a `ModerationAction`.
- **Organizadores:** nuevos `Organization` (verificada o no) y `OrganizationMember`.

### 12.2 Pantallas afectadas

- **Subir material:** ya no dice «pasa por revisión»; dice que se publica al instante (o por qué queda en revisión previa).
- **Mis aportes:** estados nuevos (Publicado, En revisión previa, Oculto mientras se revisa, Retirado) y el botón para apelar.
- **Panel de moderación:** la pestaña *Materiales* pasa a ser una cola de **casos** (reportes y revisiones previas); se suman *Usuarios*, *Apelaciones* e *Historial* (§13).
- **Eventos:** etiqueta de respaldo en tarjetas y fichas; formulario para verificar una agrupación.
- **Normas de la comunidad:** reflejar la publicación inmediata, el ocultamiento preventivo y las apelaciones.

## 13. Panel de moderación: Usuarios e Historial

### 13.1 Ficha de un usuario

Un moderador ve:

- **Datos básicos:** usuario, carrera, antigüedad de la cuenta y si verificó el email.
- **Estado:** activo, advertido, silenciado hasta una fecha o suspendido.
- **Números:** aportes publicados, retiros por normas en los últimos 90 días y precisión de sus reportes (confirmados sobre confirmados más desestimados; se muestra solo con al menos 5 reportes resueltos, para no etiquetar a nadie por uno o dos).
- **Línea de tiempo** de decisiones sobre esa cuenta y el **paso sugerido** de la escalera (§6.1).

La lista se filtra por «Con sugerencias», «Sancionados» y «Revisión previa», y se busca por usuario. Los `ADMIN` ven además las suspensiones propuestas.

Acciones: advertir, silenciar o quitar el silencio, y **proponer** una suspensión, que confirma un `ADMIN`.

No ve el email completo ni cuáles publicaciones anónimas son de esa persona, salvo con **Ver autor** (§9).

### 13.2 Historial

- Cada `MODERATOR` ve el historial de **su facultad**, con filtros por tipo de acción, moderador, contenido y fecha.
- `ADMIN` ve el de todas las facultades.
- El registro de usos de **Ver autor** lo ven **solo los `ADMIN`**, para detectar abusos de esa función.

## 14. Plazos y conservación de datos

### 14.1 Vigencia de las sanciones para la escalera

Advertencias y silenciamientos cuentan **90 días** para calcular el paso sugerido. Después quedan en el historial, pero no suben el paso. Una suspensión no vence para la escalera.

### 14.2 Tiempo de respuesta

- **Objetivo:** 48 horas para casos con contenido oculto y 7 días para el resto.
- **Si se pasa el plazo:** el caso pasa al grupo «Vencidos», arriba de todo en la cola (los más atrasados primero) y con la marca «Vencido», y los `ADMIN` ven en el panel un aviso con la cantidad de casos vencidos (sin email por ahora, §15).
- **Contenido oculto sin revisar a los 7 días:** vuelve a verse automáticamente y queda marcado para revisión, para que un grupo no pueda dejar algo oculto indefinidamente con reportes.

### 14.3 Conservación

| Dato | Cuánto se guarda |
|---|---|
| Casos y decisiones | Mientras exista la cuenta del autor (son evidencia) |
| Reportes desestimados | 12 meses; después se borra quién reportó y queda solo el motivo |
| Registros de «Ver autor» | 2 años |

**Pendiente:** estas purgas se implementan en un cambio posterior. El historial empezó en septiembre de 2026, así que nada vence antes de septiembre de 2027. Borrar registros de «Ver autor» va a requerir una excepción controlada al historial de solo lectura.

## 15. Pendiente: notificaciones

Hoy DevsProject no tiene notificaciones. Mientras tanto, moderación avisa **dentro de la app**:

- **Sanciones:** un aviso en la barra superior mientras la sanción está activa (razón, hasta cuándo y «Apelar»), y la sección *Sanciones* en Mis envíos.
- **Retiros, rechazos y respuestas a apelaciones:** el estado y la razón en Mis envíos.
- **Casos vencidos (§14.2):** un aviso para los `ADMIN` en el panel de moderación.

Cuando se sume un sistema de notificaciones (centro de notificaciones en la app y email), estos avisos pasan a enviarse también por ahí. Los avisos dentro de la app se mantienen.

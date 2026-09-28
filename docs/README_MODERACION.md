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
- recibe **1 reporte por datos personales**, porque el daño es inmediato.

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
| Advertencia | Primer retiro por normas | Se envía junto con el aviso del retiro | Solo aviso; queda en el historial |
| Silenciamiento | Segundo retiro por normas en 90 días (el panel lo **sugiere**) | `MODERATOR` | 7 días sin poder publicar ni reportar; puede seguir leyendo y guardando (`isMuted`, `mutedUntil`) |
| Suspensión | Tercer retiro por normas en 90 días, o reincidencia después de un silenciamiento | Solo `ADMIN` | No puede iniciar sesión (`isBanned`); temporal o permanente |

**Excepción:** spam y cuentas falsas pueden suspenderse de entrada, sin pasar por los pasos anteriores.

El sistema **nunca** aplica una sanción solo: calcula el paso sugerido y moderación decide.

### 6.2 Efectos sobre puntos y privilegios

Mientras dura una sanción, la cuenta no gana puntos, sus «Me sirvió» no cuentan, se ocultan sus personalizaciones y pierde los privilegios de confianza (detalle en `README_PUNTOS_E_INSIGNIAS.md` §5.2).

## 7. Apelaciones

- Se puede apelar **una vez por decisión**, dentro de los **14 días**, desde *Mis aportes* o desde el aviso de la sanción.
- La apelación incluye una explicación de quien apela (obligatoria).
- La revisa **otro** moderador, nunca quien tomó la decisión. Una apelación sobre una suspensión la revisa un `ADMIN`.
- La respuesta es **final** y siempre lleva una razón escrita.
- Si se acepta, el contenido se restaura, los puntos se reotorgan y la sanción deja de contar para la escalera.

## 8. Roles y alcance

| Rol | Alcance | Puede |
|---|---|---|
| `USER` | — | Publicar, reportar, apelar |
| `MODERATOR` | **Una o más facultades asignadas** | Resolver casos, retirar y restaurar, advertir y silenciar, aprobar o rechazar la revisión previa, resolver apelaciones de otros moderadores |
| `ADMIN` | Todas las facultades | Todo lo anterior, suspender, verificar organizadores, asignar moderadores y su facultad |
| `SUPERADMIN` | Toda la plataforma | Todo lo anterior, gestionar admins y la configuración (umbrales de §4.4, límites de §3.2) |

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
- **Nuevo `ModeratorScope`:** qué facultades cubre cada moderador.
- **Nuevo `AuthorReveal`:** cada uso de «Ver autor» (moderador, publicación, motivo, fecha).
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
- **Números:** aportes publicados, retiros por normas en los últimos 90 días y precisión de sus reportes.
- **Línea de tiempo** de decisiones sobre esa cuenta y el **paso sugerido** de la escalera (§6.1).

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
- **Si se pasa el plazo:** el caso sube al primer lugar de la cola y se avisa a los `ADMIN`.
- **Contenido oculto sin revisar a los 7 días:** vuelve a verse automáticamente y queda marcado para revisión, para que un grupo no pueda dejar algo oculto indefinidamente con reportes.

### 14.3 Conservación

| Dato | Cuánto se guarda |
|---|---|
| Casos y decisiones | Mientras exista la cuenta del autor (son evidencia) |
| Reportes desestimados | 12 meses; después se borra quién reportó y queda solo el motivo |
| Registros de «Ver autor» | 2 años |

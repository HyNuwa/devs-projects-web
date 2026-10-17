# DevsProject Academic Resources

DevsProject helps FI-UNJU students discover and judge academic resources in the context of a materia and a specific cursada, and also serve a tool for students to share their knowledge/resources and experiences with each other.

## Language

**Materia**:
An academic unit in the FI-UNJU study plan and the primary organizing context for resources, reviews, exam experiences, and professors.
_Avoid_: Course, subject hub

**Recurso académico**:
A student-contributed file intended to support studying or preparing for an assessment in a materia.
_Avoid_: Loot, item, content asset

**Tipo de recurso**:
The academic purpose of a recurso académico, such as parcial, final, apunte, resumen, trabajo práctico, or guía de ejercicios.
_Avoid_: File type, format

**Ciclo lectivo**:
The calendar year in which a recurso académico was relevant or a reseña de cursada took place. It does not encode cuatrimestre.
_Avoid_: Curriculum year, upload year

**Contexto de cursada**:
The available academic circumstances for a recurso académico or reseña de cursada: materia, ciclo lectivo, professor, franja horaria, and—when applicable—situación de cursada. Some circumstances may be unknown without invalidating the record.
_Avoid_: Course match, commission

**Reseña de cursada**:
An authored account of one concrete cursada of a materia. Multiple reviews by the same student remain independent when they describe distinct cursadas, including within the same ciclo lectivo.
_Avoid_: Experiencia de final, professor review, merged student rating

**Experiencia de final**:
An authored account of one concrete final-exam attempt for a materia. A student may publish multiple attempts without replacing earlier experiences.
_Avoid_: Reseña de cursada, final resource, exam rating

**Franja horaria**:
The optional time band in which a cursada or final took place: mañana, tarde, or noche. It does not describe whether the student was recursing the materia.
_Avoid_: Turno, recursada

**Situación de cursada**:
The student's recurrence context for one reseña de cursada: primera cursada, primera recursada, segunda o más recursadas, or prefiero no responder.
_Avoid_: Franja horaria, turno, condición final

**Resultado de cursada**:
The required result declared in a new reseña de cursada: Promoción, Regular, or Libre.
_Avoid_: Dificultad, recomendación, nota

**Período de examen**:
The academic exam period or mesa associated with an experiencia de final, such as diciembre, julio, marzo, febrero/marzo, especial, or no recuerdo.
_Avoid_: Franja horaria, turno de mañana/tarde/noche

**Dificultad de experiencia**:
An optional verbal assessment attached to one cursada or final experience: muy baja, baja, media, alta, or muy alta. It remains separate from course recommendation stars and exam outcome.
_Avoid_: Star rating, professor score, pass probability

**Publicación anónima**:
A per-entry presentation choice that replaces the public author with “Anónimo” while preserving authenticated ownership for the author and authorized moderators. Moderators do not see the author by default: revealing it requires a stated reason and is logged. Anonymous entries earn no public points or badges.
_Avoid_: Unowned content, anonymous account, unverifiable record

**Publicación inmediata**:
The default rule for all contributed content (recursos académicos, reseñas de cursada, experiencias de final, eventos and avisos de Clasificados): it becomes public as soon as it passes automatic checks, and moderation acts afterwards through reportes. It does not assert academic correctness or contextual accuracy. See ADR 0001.
_Avoid_: Approved, verified, reviewed content

**Revisión previa**:
The exception to publicación inmediata: a moderator must approve a publication before it becomes public because its author or content is considered risky (new or unverified account, recent retiro, content flagged as spam, organizer with retired events).
_Avoid_: Aprobación para publicación, mandatory approval, verification

**Rechazo en revisión previa**:
The outcome of a revisión previa that a moderator did not approve. The publication stays private with a written reason, and its author can correct and resubmit it. It never was public, so it is distinct from a retiro.
_Avoid_: Retiro, rejection of a published item, deletion

**Revelación de autor**:
A moderator's act of seeing who wrote a publicación anónima during moderation. It requires a stated reason, is recorded, and only admins review those records.
_Avoid_: Unmasking, doxxing, author lookup

**Reporte**:
A signed-in student's claim, with one of the fixed reasons, that a publication breaks the community rules. A reporte never removes anything by itself; it opens or joins a caso de moderación and ends up confirmed or dismissed.
_Avoid_: Flag, vote, automatic removal

**Caso de moderación**:
The group of all reportes about one publication, resolved once by moderation: keep visible, retiro, or restore.
_Avoid_: Ticket, individual report

**Ocultamiento preventivo**:
A temporary, automatic hiding of a publication while its caso de moderación is pending, triggered by several independent reportes in a short time or by one reporte of exposed personal data. It is not a moderation decision and reverts if moderation keeps the publication visible.
_Avoid_: Retiro, deletion, ban

**Retiro de contenido comunitario**:
A reversible moderator decision that removes any publication from public view while preserving author, reason, actor, and date evidence. The author sees the reason, never who decided or who reported. It is distinct from permanent deletion by the author.
_Avoid_: Report, ocultamiento preventivo, publication rejection

**Sanción**:
A moderation measure on an account, applied by a person and never automatically: advertencia, silenciamiento (7 days without publishing, editing, reporting or «Me sirvió»), or suspensión (cannot sign in for 7 days, 30 days or permanently; a moderator proposes it and an admin confirms it). It ends on its own when its end date passes.
_Avoid_: Automatic penalty, strike

**Retiro por normas**:
A «Retirar» decision on a caso. It is what the escalera counts. An author deleting their own entry, a rejection in revisión previa, and a retiro later restored or overturned on appeal do not count.
_Avoid_: Strike, removal (for author deletion)

**Paso sugerido**:
The sanción the escalera proposes for an account from its retiros por normas and silenciamientos in the last 90 days. Moderation decides whether to apply it.
_Avoid_: Automatic sanction, penalty level

**Apelación**:
A single request, within 14 days, that a different moderator review a decision. Its answer is final and always has a written reason.
_Avoid_: Complaint, second report

**Organizador verificado**:
A student group, chair or institutional office whose identity an admin confirmed, so its members can publish eventos in its name with a visible backing label. Other eventos show that the community published them.
_Avoid_: Official event, approved event

**Señal de utilidad**:
A student's indication that a recurso académico helped them, presented in the interface as “Me sirvió.” It reflects usefulness, not academic correctness.
_Avoid_: Verification, trust score, star rating

# DevsProject Academic Resources

DevsProject helps FI-UNJU students discover and judge academic resources in the context of a materia and a specific cursada, and also serve a tool for students to share their knowledge/resources and experiences with each other.

It starts at FI-UNJU with the goal of adding other facultades and universidades (ADR 0002).

## Language

**Universidad**:
An institution that groups one or more facultades.
_Avoid_: Institution (when you mean a facultad), campus

**Facultad**:
An academic unit of a universidad that offers carreras. Two universidades may each have a facultad with the same name; they are different facultades. A student belongs to a facultad only through their carreras and may belong to more than one.
_Avoid_: Department, school

**Carrera**:
A degree program of one facultad, made of materias arranged by año and cuatrimestre. A student declares the carreras they study or finished; the platform does not track curriculum versions.
_Avoid_: Plan de estudios, study plan, curriculum

**Materia**:
An academic unit taught in one or more carreras of one facultad, and the primary organizing context for resources, reviews, exam experiences, and professors. A materia with the same name in two facultades is two different materias.
_Avoid_: Course, subject hub

**Ubicación**:
The universidad and facultad a person is browsing from: the facultad of their carrera when signed in, or the one a visitor chose on their device. It sets where search and rankings start, and never hides content.
_Avoid_: Campus, location filter

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
A per-entry presentation choice that replaces the public author with “Anónimo” while preserving authenticated ownership for the author and authorized moderators. Moderators do not see the author by default: revealing it requires a stated reason and is logged. It is chosen when publishing and cannot be changed by editing, so no later change in points can point at the author. Anonymous entries earn no points or badges.
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

**Alcance de moderación**:
The facultades a moderator covers, assigned by an admin. A moderator acts only on casos whose publication belongs to a materia of those facultades; a moderator without facultades sees no casos. Admins cover every facultad, and casos about publications without a facultad go only to admins.
_Avoid_: Jurisdiction, moderator region

**Organizador verificado**:
A student group, chair or institutional office whose identity an admin confirmed, so its members can publish eventos in its name with a visible backing label. Other eventos show that the community published them.
_Avoid_: Official event, approved event

**Señal de utilidad**:
A student's indication that a recurso académico helped them, presented in the interface as “Me sirvió.” It reflects usefulness, not academic correctness.
_Avoid_: Verification, trust score, star rating

**Puntos**:
A student's reputation for helping others, earned by contributions that get published and by «Me sirvió» other students give them. Points are never spent and never change how content is shown or ranked. Their total is always the exact sum of the account's movimientos de puntos, even when that sum is negative; it is shown as 0 at least.
_Avoid_: Currency, credits, karma, score of a contribution

**Movimiento de puntos**:
One recorded change in an account's points, with a fixed reason (material publicado, «Me sirvió» recibido, reporte confirmado, …), the contribution it refers to, and its amount. A reversal is a new movimiento with the negative amount that points at the one it reverses; movimientos are never edited or deleted.
_Avoid_: Balance update, point edit

**«Me sirvió» válido**:
A señal de utilidad that counts for points and badges: given by an account with a verified email and no active sanción, not by the material's author, on a material that is published. Caps limit the points it can award, never whether it counts for badges.
_Avoid_: Vote, like

**Nivel**:
A named stage of an account's progress («Primeros pasos» to «Leyenda de la facultad»), computed from its current points. The profile always shows the current nivel.
_Avoid_: Rank, tier (tiers belong to badges)

**Buena posición**:
An account with no active sanción and 90 days since its last silenciamiento, suspensión or retiro por normas ended, anonymous content included. Advertencias and anything voided on appeal or restored do not count; a permanent suspensión never clears. Every privilegio de confianza requires it.
_Avoid_: Clean record, trust score

**Privilegio de confianza**:
A permission that comes from a student's nivel máximo alcanzado or their record and requires buena posición: suggesting corrections, priority reportes, and being eligible to moderate (seen only by admins).
_Avoid_: Perk, reward

**Corrección**:
A proposal to fix one classification field of someone else's material (materia, tipo, ciclo lectivo or profesor), never its title, description or file. The material's author decides first; after 7 days without an answer, moderation does. Its author never sees who suggested it.
_Avoid_: Edit, suggestion (alone)

**Nivel máximo alcanzado**:
The highest nivel an account has ever reached. It never goes down, not even when points drop or a sanción applies, and it is what decides which personalization options are unlocked.
_Avoid_: Current nivel, peak points


**Perfil público**:
The page anyone can open about a student: name, avatar, nivel, insignias, personalización, aportes fijados and their signed contributions. Anonymous entries never appear on it or link to it. A student can hide their nivel and insignias from it, which also keeps them out of every ranking.
_Avoid_: Account page, Mi perfil (that is where the student edits it)

**Personalización del perfil**:
The predefined cosmetic choices a student makes for their perfil público (avatar, accent color, background, frame, banner, theme, título), each unlocked by nivel máximo alcanzado or by an insignia. It is never uploaded by the student, never needs moderation, and never shows on contribution cards. A sanción does not hide it, because hiding it would reveal the sanción.
_Avoid_: Reward, purchase, skin

**Título**:
An insignia the student picks to show under their name on the perfil público. It disappears on its own if the insignia is lost.
_Avoid_: Rank, nivel name

**Insignia destacada**:
One of up to three insignias a student chooses to show first on their perfil público.
_Avoid_: Pinned badge

**Aporte fijado**:
One of up to three of the student's own published contributions shown first on their perfil público: a recurso académico, or a reseña de cursada or experiencia de final published with their name. It disappears on its own if the contribution is retired or deleted.
_Avoid_: Featured content, highlighted post

**Insignia**:
A recognition of a concrete, verifiable achievement (a material that helped 50 students, reseñas in 5 materias), shown as a gem. Insignias award no points, never count anonymous entries, and are lost or lowered when the contributions behind them are retired or deleted. Some have grados; seasonal ones are earned once per edición.
_Avoid_: Achievement, trophy, medal

**Grado**:
The level of an insignia that can grow (bronce, plata, oro). Reaching a higher grado updates the same insignia; it never adds another.
_Avoid_: Tier when talking to students, nivel (that belongs to points)

**Edición**:
The dated occurrence of a seasonal insignia, such as «Mesa de diciembre 2026». Each edición is earned on its own.
_Avoid_: Version, season number

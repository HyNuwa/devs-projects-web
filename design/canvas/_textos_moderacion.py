# Ajusta los textos de los generadores a la publicacion inmediata (ADR 0001) y al nivel nuevo de Max.
import os
SP = os.environ['SP']
CAMBIOS = {
    'acciones/generar_acciones.py': [
        ('Cada archivo se publica como un material aparte. Todos pasan por revisión antes de aparecer.', 'Cada archivo se publica como un material aparte, apenas lo envíes.'),
        ('Te avisamos en «Mis envíos» cuando moderación lo apruebe. Cada aporte aprobado suma puntos a tu nivel.', 'Se publican al instante y suman 10 puntos cada uno. Si alguien reporta un problema, moderación lo revisa.'),
        ("{boton('Enviar a revisión', 'check')}", "{boton('Publicar', 'check')}"),
        ('Moderación aprobó o rechazó tu material', 'Moderación retiró o restauró algo tuyo'),
        ('Los materiales aprobados que subiste.', 'Los materiales que publicaste.'),
        ('Tu nivel sube con cada aporte aprobado.', 'Tu nivel sube con cada aporte publicado.'),
    ],
    'estados/generar_nuevas.py': [
        ('Lo que subas aparece acá con su estado: en revisión, publicado o no aprobado.', 'Lo que subas aparece acá con su estado: publicado, en revisión previa u oculto mientras se revisa.'),
        ("tarjeta_error('MIS ENVÍOS · NO APROBADO', rechazado)", "tarjeta_error('MIS APORTES · RETIRADO', rechazado)"),
        ('{ge.estado("No aprobado", ROJO_BG, ROJO_TX, "equis")}', '{ge.estado("Retirado", ROJO_BG, ROJO_TX, "equis")}'),
        ('Análisis Matemático I · enviado hace 3 días', 'Análisis Matemático I · publicado hace 3 días'),
        ('Se ven nombre y DNI en la primera página. Tapalos y volvé a enviarlo.', 'Se ven nombre y DNI en la primera página. Tapalos y volvé a subirlo, o apelá si creés que es un error.'),
    ],
    'estados/generar_movil.py': [
        ('Subilo: pasa por revisión y ayuda a la próxima camada.', 'Subilo: se publica al instante y ayuda a la próxima camada.'),
        ("ge.estado('En revisión', AMBAR_BG, AMBAR_TX, 'reloj')", "ge.estado('En revisión previa', AMBAR_BG, AMBAR_TX, 'reloj')"),
    ],
    'eventos/generar_eventos.py': [
        ('Subí el flyer, poné fecha y lugar, y listo. Moderación lo revisa antes de mostrarlo.', 'Subí el flyer, poné fecha y lugar, y listo: se publica al instante.'),
        ("'Moderación lo revisa antes de mostrarlo (suele tardar menos de un día). Te avisamos en «Mis envíos».'",
         "'Se publica al instante. Como lo publicás en nombre del Club de Programación, que está verificado, el evento muestra «✓ Organizador verificado».'"),
        ("{boton('Enviar a revisión', 'check')}", "{boton('Publicar evento', 'check')}"),
        ('6 eventos este año · 212 seguidores', '✓ Organizador verificado · 6 eventos este año · 212 seguidores'),
    ],
    'extra/generar_extra.py': [
        ("'Primer material aprobado'", "'Primer material publicado'"),
        ("'Materiales aprobados en 5 materias'", "'Materiales publicados en 5 materias'"),
        ("'3 aportes aprobados en un período de mesas'", "'3 aportes publicados en un período de mesas'"),
        ("'Material aprobado: «Parcial 1 con grafos»'", "'Material publicado: «Parcial 1 con grafos»'"),
    ],
    'extra/generar_extra2.py': [
        ("'Moderación aprobó <b>«Parcial 1 con grafos»</b>', 'Ya es público en Matemática Discreta · +10 puntos'",
         "'Se publicó <b>«Parcial 1 con grafos»</b>', 'Matemática Discreta · +10 puntos'"),
        ("'Moderación no aprobó <b>«Guía de conteo resuelta»</b>', 'Motivo: ya está publicada una guía igual en esta materia'",
         "'No se aprobó <b>«Guía de conteo resuelta»</b> en la revisión previa', 'Motivo: es un duplicado casi exacto de una guía ya publicada'"),
        ('aprobaciones, rechazos y avisos que vencen', 'retiros, apelaciones y avisos que vencen'),
        ("'En revisión': (AMBAR_BG, AMBAR_TX, 'reloj')", "'En revisión previa': (AMBAR_BG, AMBAR_TX, 'reloj')"),
        ("(1, 'En revisión', False)", "(1, 'En revisión previa', False)"),
        ("'En revisión', 'Enviado hace 2 h', None, ['Editar', 'Cancelar envío']",
         "'En revisión previa', 'Enviado hace 2 h · marcado como posible duplicado', None, ['Editar', 'Cancelar envío']"),
        ("'Retirado', 'Retirado el lunes', 'Estaba duplicado con otro resumen tuyo. Se revirtieron sus 11 puntos.', ['Ver detalle']",
         "'Retirado', 'Retirado el lunes', 'Estaba duplicado con otro resumen tuyo. Se revirtieron sus 11 puntos. Podés apelar hasta el 12 de octubre.', ['Ver detalle', 'Apelar']"),
        ("'Publicado', 'Aprobado hoy'", "'Publicado', 'Publicado hoy'"),
        ('Todo material pasa por moderación antes de publicarse. Aprobarlo no significa que esté bien resuelto: significa que se puede publicar.',
         'Se publica al instante. Que esté publicado no significa que esté bien resuelto. Si alguien lo reporta, moderación lo revisa; tres reportes, o uno por datos personales, lo ocultan hasta la revisión.'),
        ("'Cada evento pasa por moderación. La inscripción siempre la maneja quien lo organiza.'",
         "'Se publican al instante y muestran quién los respalda: «Publicado por la comunidad» o un organizador verificado. La inscripción siempre la maneja quien lo organiza.'"),
        ("('Después', 'Moderación lo revisa', 'Decide si sigue visible o se retira. Quien reportó queda en secreto.')",
         "('Después', 'Moderación lo revisa', 'Decide si sigue visible o se retira. Con tres reportes, o uno por datos personales, se oculta mientras tanto.')"),
        ('Desde «Mis aportes» podés pedir que otra persona de moderación la revise.', 'Podés apelar una vez, dentro de 14 días, desde «Mis aportes». La revisa otra persona de moderación y su respuesta es final.'),
    ],
    'espacio/generar_espacio.py': [
        ('Todo lo que subís pasa por revisión antes de publicarse.', 'Se publica al instante. Acá ves si algo quedó en revisión previa o lo retiraron.'),
        ('Materiales aprobados que Max compartió', 'Materiales que Max compartió'),
        ("estado('En revisión', AMBAR_BG, AMBAR_TX, 'reloj')", "estado('En revisión previa', AMBAR_BG, AMBAR_TX, 'reloj')"),
        ("estado('1 en revisión', AMBAR_BG, AMBAR_TX, 'reloj')", "estado('1 en revisión previa', AMBAR_BG, AMBAR_TX, 'reloj')"),
        ('Nivel 4 · 1.240 puntos', 'Nv. 5 · Siete vidas · 612 puntos'),
        ('★ Nivel 4<', '★ Nv. 5 · Siete vidas<'),
        ('Nivel 4 · Colaborador', 'Nv. 5 · Siete vidas'),
        ('1.240 / 1.500 puntos', '612 / 900 puntos'),
        ('Faltan 260 puntos para el nivel 5', 'Faltan 288 puntos para Nv. 6 · Apuntes de oro'),
    ],
}
for archivo, pares in CAMBIOS.items():
    p = os.path.join(SP, archivo)
    s = open(p, encoding='utf-8').read()
    for a, b in pares:
        n = s.count(a)
        if n == 0 and b in s:
            continue
        assert n >= 1, (archivo, a[:70])
        s = s.replace(a, b)
    open(p, 'w', encoding='utf-8').write(s)
    print('ok', archivo)

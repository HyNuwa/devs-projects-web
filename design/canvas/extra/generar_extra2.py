# Genera: panel de novedades (notificaciones) desde el boton de la mochila, pagina de novedades,
# Mis aportes (envios y publicaciones propias) y Normas de la comunidad.
# Uso: python generar_extra2.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones', 'extra'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, breadcrumb, ICONOS, ESTRELLA, TIPO, CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_acciones as ga

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA, CREMA = ga.LINEA, ga.CREMA
VERDE_BG, VERDE_TX, ROJO_BG, ROJO_TX = ga.VERDE_BG, ga.VERDE_TX, ga.ROJO_BG, ga.ROJO_TX
AMBAR_BG, AMBAR_TX = '#FDF0C8', '#8A5A00'
META = 'font-size: 11.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;'
ICONOS.setdefault('estrella', ESTRELLA)
ICONOS.setdefault('mensaje', '<path d="M4 5h16v11H9l-5 4z"></path>')
ICONOS.update({'campana': ICONOS.get('campana', '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"></path><path d="M10 20a2 2 0 0 0 4 0"></path>'),
               'lapiz2': '<path d="M4 20h4L19 9l-4-4L4 16z"></path>', 'pausa': '<path d="M9 5v14M15 5v14"></path>',
               'renovar': '<path d="M20 12a8 8 0 1 1-2.3-5.7"></path><path d="M20 4v5h-5"></path>'})

def miniatura(tipo_o_img, tam=44):
    if tipo_o_img.endswith(('.png', '.jpg', '.svg')):
        return f'<img src="{tipo_o_img}" alt="" style="width: {tam}px; height: {tam}px; flex-shrink: 0; border-radius: 11px; border: 1.5px solid {NAVY}; object-fit: cover; box-sizing: border-box;">'
    _, _, ic, f, c = TIPO[tipo_o_img]
    return ga.tile(ic, f, c, tam, 11)

# (grupo, visual, titulo_html, detalle, cuando, no_leida, accion)
NOVEDADES = [
    ('Hoy', ('ico', 'check', VERDE_BG, VERDE_TX), 'Se publicó <b>«Parcial 1 con grafos»</b>', 'Matemática Discreta · +10 puntos', 'hace 20 min', True, 'Ver material'),
    ('Hoy', ('img', 'insignia-salvavidas.svg'), 'Ganaste la insignia <b>Salvavidas</b>', 'Tu «Parcial 1 resuelto» llegó a 50 «Me sirvió»', 'hace 1 h', True, 'Ver insignia'),
    ('Hoy', ('img', 'flyer-competitiva.jpg'), 'Mañana es <b>Jornada de Programación Competitiva</b>', 'Te interesa · sábado 17:30 · FI · Aula 15', 'hace 3 h', True, 'Ver evento'),
    ('Hoy', ('ico', 'corazon', '#FED3DF', '#E01F63'), '<b>7 personas</b> marcaron «Me sirvió» en tus materiales', 'Parcial 1 resuelto (4) · Resumen de series (3)', 'hace 5 h', True, None),
    ('Esta semana', ('ico', 'equis', ROJO_BG, ROJO_TX), 'No se aprobó <b>«Guía de conteo resuelta»</b> en la revisión previa', 'Motivo: es un duplicado casi exacto de una guía ya publicada', 'ayer', False, 'Ver motivo'),
    ('Esta semana', ('ico', 'renovar', AMBAR_BG, AMBAR_TX), 'Tu aviso <b>«Calculadora Casio fx-991»</b> vence en 3 días', 'Renovalo si todavía la vendés', 'ayer', False, 'Renovar'),
    ('Esta semana', ('ico', 'doc', '#ECF2FE', BTN), 'Nuevo parcial en <b>Probabilidades y Estadística</b>', 'Una materia que cursás · «Parcial 2 con resolución»', 'martes', False, None),
    ('Esta semana', ('ico', 'bandera', '#F1EEE4', TEXT2), 'Se revirtieron <b>11 puntos</b>', 'Moderación retiró «Resumen de relaciones»: estaba duplicado', 'lunes', False, 'Ver detalle'),
    ('Antes', ('ico', 'estrella', '#F0F7C9', '#6E9400'), 'Subiste a <b>Nv. 5 · Siete vidas</b>', 'Desbloqueaste el marco de avatar y el banner del perfil', '12 sep', False, 'Personalizar'),
]

def fila_novedad(n, compacta=False):
    _, vis, tit, det, cuando, nueva, acc = n
    v = (ga.tile(vis[1], vis[2], vis[3], 42, 12) if vis[0] == 'ico' else
         f'<img src="{vis[1]}" alt="" style="width: 42px; height: 42px; flex-shrink: 0; object-fit: {"contain" if vis[1].endswith(".svg") else "cover"}; border-radius: 12px; {"" if vis[1].endswith(".svg") else "border: 1.5px solid " + NAVY + ";"} box-sizing: border-box;">')
    punto = f'<span aria-label="Sin leer" style="width: 9px; height: 9px; flex-shrink: 0; border-radius: 999px; background: {BTN}; margin-top: 6px;"></span>' if nueva else '<span style="width: 9px; flex-shrink: 0;"></span>'
    boton_acc = (f'<a href="#acc" style="display: inline-flex; margin-top: 8px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 5px 10px; font-size: 12px; font-weight: 700; color: {NAVY};">{acc}</a>'
                 if acc and not compacta else '')
    fondo = 'background: #F4F8FF;' if nueva else ''
    return (f'<div style="display: flex; gap: 12px; padding: 12px 14px; border-radius: 12px; {fondo}">{v}'
            f'<div style="min-width: 0; flex: 1;"><div style="font-size: 14px; line-height: 1.35; font-weight: 500; color: {NAVY};">{tit}</div>'
            f'<div style="margin-top: 2px; font-size: 12.5px; line-height: 1.4; font-weight: 600; color: {MUTED};">{det}</div>{boton_acc}</div>'
            f'<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0;"><span style="font-size: 11.5px; font-weight: 700; color: {MUTED}; white-space: nowrap;">{cuando}</span>{punto}</div></div>')

# ================================================================ 4a · PANEL DE NOVEDADES (se abre desde el boton de la mochila)
def p_panel():
    filas = ''.join(fila_novedad(n, True) for n in NOVEDADES[:6])
    panel = f'''  <div role="dialog" aria-label="Novedades" style="position: absolute; z-index: 5; right: 150px; top: 72px; width: 440px; background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 18px; box-shadow: 6px 6px 0 {NAVY}; overflow: hidden;">
    <span aria-hidden="true" style="position: absolute; top: -9px; right: 178px; width: 16px; height: 16px; background: #FEFEFE; border-left: 1.5px solid {NAVY}; border-top: 1.5px solid {NAVY}; transform: rotate(45deg);"></span>
    <div style="display: flex; align-items: center; gap: 10px; padding: 16px 18px 10px 18px;"><h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Novedades</h2>
      <span style="background: {PINK}; color: #FFFFFF; border-radius: 999px; padding: 1px 8px; font-size: 12px; font-weight: 800;">4</span>
      <a href="#leidas" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {BLUE};">Marcar todo como leído</a></div>
    <div style="padding: 0 18px 8px 18px; display: flex; gap: 6px;">{gx.pildora('Todas', True)}{gx.pildora('Sin leer', False, None, 4)}</div>
    <div style="padding: 4px 6px; display: flex; flex-direction: column; gap: 2px;">{filas}</div>
    <div style="display: flex; justify-content: space-between; padding: 12px 18px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
      <a href="#todas" style="font-size: 13.5px; font-weight: 800; color: {BLUE};">Ver todas las novedades</a>
      <a href="#config" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: {TEXT2};">{ico('engranaje', 14, TEXT2, 2)}Qué me avisan</a></div>
  </div>
'''
    fondo = ge.subnav('mochila') + ge.saludo_hero()
    return ge.header_logueado(False).replace('border: 1.5px solid #021238; border-radius: 12px;', 'border: 2px solid #0261FE; border-radius: 12px;', 1) + fondo + panel

# ================================================================ 4b · PAGINA DE NOVEDADES
def p_novedades():
    grupos = ''
    actual = None
    for n in NOVEDADES:
        if n[0] != actual:
            if actual is not None:
                grupos += '</div>'
            actual = n[0]
            grupos += f'<div style="{META} color: {MUTED}; padding: 18px 14px 6px 14px;">{actual}</div><div style="display: flex; flex-direction: column; gap: 4px;">'
        grupos += fila_novedad(n)
    grupos += '</div>'
    filtros = ''.join(gx.pildora(t, a, i, c) for t, a, i, c in [('Todas', True, None, None), ('Mis aportes', False, 'doc', 4), ('Insignias y nivel', False, 'estrella', 2),
                                                                   ('Mis materias', False, 'libro', 1), ('Eventos', False, 'calendario', 1), ('Clasificados', False, 'etiqueta', 1)])
    return ge.subnav('mochila') + f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;">
    <div>{eyebrow('Mi mochila')}<h1 style="margin: 12px 0 0 0; font-size: 60px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Novedades<span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 12px 0 0 0; font-size: 16.5px; font-weight: 500; color: {TEXT2};">Lo que pasó con tus aportes, tus materias y lo que seguís.</p></div>
    <div style="display: flex; gap: 10px;">{boton('Marcar todo como leído', 'check', primario=False)}{boton('Qué me avisan', 'engranaje', primario=False)}</div>
  </section>
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start;">
    <div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px;">{filtros}</div>
      <div style="margin-top: 14px; {CARD} padding: 4px 10px 12px 10px;">{grupos}</div>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 18px;">
        <div style="{META} color: {MUTED};">Esta semana</div>
        <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          {''.join(f'<div><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.04em; color: {c};">{v}</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">{t}</div></div>' for v, t, c in [('+46', 'puntos', VERDE_TX), ('21', '«Me sirvió» recibidos', '#E01F63'), ('1', 'aporte aprobado', NAVY), ('1', 'insignia nueva', NAVY)])}
        </div>
      </div>
      <div style="{CARD} padding: 18px;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800;">También por email</h3>
        <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Recibís un resumen semanal con lo importante: retiros, apelaciones y avisos que vencen. Lo cambiás en Configuración.</p>
        <a href="#config" style="margin-top: 10px; display: inline-block; font-size: 13px; font-weight: 700; color: {BLUE};">Configurar avisos →</a>
      </div>
      <div style="{ga.aviso('info', 'Nunca te avisamos quién reportó algo ni quién marcó «Me sirvió»: solo cuántas personas.')[0:0]}">{ga.aviso('candado', 'Nunca te avisamos quién reportó algo tuyo. En «Me sirvió» solo ves cuántas personas.', '#F1EEE4', NAVY)}</div>
    </aside>
  </section>
'''

# ================================================================ 5 · MIS APORTES
def estado_chip(e):
    m = {'Publicado': (VERDE_BG, VERDE_TX, 'check'), 'En revisión previa': (AMBAR_BG, AMBAR_TX, 'reloj'), 'No aprobado': (ROJO_BG, ROJO_TX, 'equis'),
         'Retirado': ('#F1EEE4', TEXT2, 'bandera'), 'Activo': (VERDE_BG, VERDE_TX, 'check'), 'Pausado': ('#F1EEE4', TEXT2, 'pausa'), 'Vendido': ('#ECF2FE', BTN, 'check'),
         'Vence en 3 días': (AMBAR_BG, AMBAR_TX, 'reloj'), 'Pasado': ('#F1EEE4', TEXT2, 'calendario')}
    return ge.estado(e, *m[e])

def p_mis_aportes():
    tabs = ''.join(
        (f'<a href="#t" style="display: inline-flex; align-items: center; gap: 7px; padding: 0 2px 11px 2px; font-size: 15px; font-weight: 800; color: {BTN}; border-bottom: 2.5px solid {BTN};">{ico(i, 16, BTN, 2.2)}{t}<span style="font-size: 12px; background: {BTN}; color: #FFFFFF; border-radius: 999px; padding: 1px 7px;">{n}</span></a>'
         if t == 'Materiales' else
         f'<a href="#t" style="display: inline-flex; align-items: center; gap: 7px; padding: 0 2px 11px 2px; font-size: 15px; font-weight: 700; color: {TEXT2};">{ico(i, 16, TEXT2, 2)}{t}<span style="font-size: 12px; color: {MUTED};">{n}</span></a>')
        for t, n, i in [('Materiales', 27, 'doc'), ('Experiencias', 7, 'pluma'), ('Clasificados', 3, 'etiqueta'), ('Eventos', 1, 'calendario')])
    resumen = ''.join(f'<a href="#f" style="display: flex; align-items: center; gap: 10px; background: #FEFEFE; border: {"2px solid " + NAVY if a else "1.5px solid #E4DCCB"}; border-radius: 12px; padding: 10px 14px; color: {NAVY};">'
                      f'<span style="font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">{n}</span>{estado_chip(e)}</a>'
                      for n, e, a in [(24, 'Publicado', False), (1, 'En revisión previa', False), (1, 'No aprobado', True), (1, 'Retirado', False)])
    filas = ''
    MATS = [('Final', 'Final de julio 2025', 'Probabilidades y Estadística', 'En revisión previa', 'Enviado hace 2 h · marcado como posible duplicado', None, ['Editar', 'Cancelar envío']),
            ('Guía de ejercicios', 'Guía de conteo resuelta', 'Matemática Discreta', 'No aprobado', 'Revisado ayer', 'Ya está publicada una guía igual en esta materia («Guía 3 de conteo», ciclo 2025). Si la tuya agrega algo distinto, contalo en la descripción y volvé a enviarla.', ['Ver la otra guía', 'Corregir y reenviar']),
            ('Resumen', 'Resumen de relaciones', 'Matemática Discreta', 'Retirado', 'Retirado el lunes', 'Estaba duplicado con otro resumen tuyo. Se revirtieron sus 11 puntos. Podés apelar hasta el 12 de octubre.', ['Ver detalle', 'Apelar']),
            ('Parcial', 'Parcial 1 con grafos', 'Matemática Discreta', 'Publicado', 'Publicado hoy', None, ['Ver', 'Editar']),
            ('Parcial', 'Parcial 1 resuelto', 'Análisis Matemático II', 'Publicado', 'mar 2025 · 64 «Me sirvió»', None, ['Ver', 'Editar']),
            ('Resumen', 'Resumen de series', 'Análisis Matemático II', 'Publicado', 'abr 2025 · 41 «Me sirvió»', None, ['Ver', 'Editar'])]
    for tipo, tit, mat, est, cuando, motivo, accs in MATS:
        bloque_motivo = (f'<div style="margin: 10px 0 0 58px; background: {"#FFF6F5" if est == "No aprobado" else "#F7F3EA"}; border: 1.5px solid {"#F2B8B5" if est == "No aprobado" else "#E4DCCB"}; border-radius: 11px; padding: 10px 12px;">'
                         f'<div style="{META} font-size: 10.5px; color: {ROJO_TX if est == "No aprobado" else TEXT2};">Motivo de moderación</div>'
                         f'<div style="margin-top: 4px; font-size: 13.5px; line-height: 1.5; font-weight: 600; color: {NAVY};">{motivo}</div></div>') if motivo else ''
        botones = ''.join(f'<a href="#a" style="display: inline-flex; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 6px 11px; font-size: 12.5px; font-weight: 700; color: {"#FFFFFF" if k == len(accs) - 1 and est == "No aprobado" else NAVY}; {"background: " + BTN + ";" if k == len(accs) - 1 and est == "No aprobado" else "background: #FFFFFF;"} white-space: nowrap;">{a}</a>'
                          for k, a in enumerate(accs))
        filas += (f'<div style="padding: 14px 16px; border-top: 1.5px solid {LINEA};"><div style="display: flex; align-items: center; gap: 14px;">{miniatura(tipo)}'
                  f'<div style="min-width: 0; flex: 1;"><div style="font-size: 15px; font-weight: 800;">{tit}</div><div style="font-size: 12.5px; font-weight: 600; color: {MUTED};">{mat} · {cuando}</div></div>'
                  f'{estado_chip(est)}<div style="display: flex; gap: 6px;">{botones}</div></div>{bloque_motivo}</div>')
    avisos = ''
    for img, tit, precio, est, accs in [('mini-calculadora.png', 'Calculadora Casio fx-991', '$ 35.000', 'Vence en 3 días', ['Renovar', 'Marcar vendido']),
                                         ('mini-libro-calculo.png', 'Cálculo de Stewart, 7ma edición', '$ 22.000', 'Pausado', ['Reactivar', 'Editar']),
                                         ('mini-arduino.png', 'Kit Arduino UNO', '$ 28.000', 'Vendido', ['Borrar'])]:
        avisos += (f'<div style="display: flex; align-items: center; gap: 12px; padding: 11px 0; border-top: 1.5px solid {LINEA};">{miniatura(img, 48)}'
                   f'<div style="min-width: 0; flex: 1;"><div style="font-size: 13.5px; font-weight: 800; line-height: 1.25;">{tit}</div><div style="font-size: 12.5px; font-weight: 700;">{precio}</div>'
                   f'<div style="margin-top: 6px; display: flex; gap: 6px; flex-wrap: wrap;">{"".join(f"<a href=\"#a\" style=\"font-size: 12px; font-weight: 700; color: {BLUE};\">{a}</a>" for a in accs)}</div></div>{estado_chip(est)}</div>')
    return ge.subnav('mochila') + f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;">
    <div>{eyebrow('Mi espacio')}<h1 style="margin: 12px 0 0 0; font-size: 60px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Mis aportes<span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 12px 0 0 0; font-size: 16.5px; font-weight: 500; color: {TEXT2};">Todo lo que subiste y publicaste, con su estado. Solo lo ves vos.</p></div>
    <div style="display: flex; gap: 10px;">{boton('Subir material', 'subir')}</div>
  </section>
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px;"><div style="display: flex; gap: 28px; border-bottom: 1.5px solid #E4DCCB;">{tabs}</div></section>
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 28px; align-items: start;">
    <div>
      <div style="display: flex; flex-wrap: wrap; gap: 10px;">{resumen}</div>
      <div style="margin-top: 14px; {CARD} overflow: hidden;">
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: {CREMA};"><span style="font-size: 13px; font-weight: 700; color: {TEXT2};">Mostrando primero lo que necesita algo de vos</span>{gx.desplegable('Materia: todas')}</div>
{filas}        <a href="#mas" style="display: flex; justify-content: center; padding: 13px; border-top: 1.5px solid {LINEA}; font-size: 14px; font-weight: 700; color: {BLUE};">Ver los 24 publicados</a>
      </div>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 16px 18px 8px 18px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between;"><h3 style="margin: 0; font-size: 17px; font-weight: 800;">Mis avisos de Clasificados</h3>{gx.link('Ver', '#cl')}</div>
        <div style="margin-top: 8px;">{avisos}</div>
      </div>
      <div style="{CARD} padding: 16px 18px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between;"><h3 style="margin: 0; font-size: 17px; font-weight: 800;">Mis eventos</h3>{gx.link('Ver', '#ev')}</div>
        <div style="margin-top: 10px; display: flex; align-items: center; gap: 12px;">{miniatura('flyer-git.jpg', 48)}<div style="min-width: 0; flex: 1;"><div style="font-size: 13.5px; font-weight: 800;">Taller: Git y GitHub desde cero</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Sáb 26 sep · 31 interesados</div></div>{estado_chip('Publicado')}</div>
      </div>
      <div style="{CARD} padding: 16px 18px;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800;">Mis experiencias</h3>
        <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.5; font-weight: 500; color: {TEXT2};">7 en total: 4 con tu nombre y 3 como anónimo. Las anónimas solo aparecen acá; nadie más puede ver que son tuyas.</p>
        <div style="margin-top: 10px; display: flex; gap: 6px;">{ge.estado('4 con nombre', '#ECF2FE', BTN, 'persona')}{ge.estado('3 anónimas', '#E5E8EF', NAVY, 'candado')}</div>
      </div>
    </aside>
  </section>
'''

# ================================================================ 6 · NORMAS DE LA COMUNIDAD
SECCIONES = [
    ('materiales', 'doc', 'Materiales', [
        ('Sí', ['Parciales, finales y recuperatorios, resueltos o no.', 'Apuntes, resúmenes y guías que hiciste vos.', 'Trabajos prácticos ya corregidos y devueltos.']),
        ('No', ['Nombres, DNI, legajos o firmas a la vista: tapalos antes de subir.', 'Libros o apuntes de otras personas completos, sin su permiso.', 'Enunciados de un examen que todavía se está tomando.'])],
     'Se publica al instante. Que esté publicado no significa que esté bien resuelto. Si alguien lo reporta, moderación lo revisa; tres reportes, o uno por datos personales, lo ocultan hasta la revisión.'),
    ('experiencias', 'pluma', 'Reseñas y experiencias', [
        ('Sí', ['Contar cómo fue la cursada o el final: ritmo, parciales, qué te sirvió.', 'Mencionar a quien da la materia para dar contexto.', 'Criticar cómo se dictó una materia, con argumentos.']),
        ('No', ['Insultos, burlas o acusaciones contra docentes o compañeros.', 'Nombres de compañeros o datos personales.', 'Inventar o exagerar para perjudicar a alguien.'])],
     'Podés publicar como anónimo: se muestra «Anónimo», no suma puntos y no aparece en tu perfil. Moderación sí sabe quién la escribió.'),
    ('clasificados', 'etiqueta', 'Clasificados y tutorías', [
        ('Sí', ['Vender, regalar o buscar cosas tuyas y útiles para estudiar.', 'Ofrecer clases para explicar una materia.']),
        ('No', ['Hacer trabajos, parciales o exámenes por otra persona.', 'Productos prohibidos, peligrosos o que no son tuyos.', 'Publicidad de negocios.'])],
     'DevsProject solo conecta estudiantes: no cobra, no interviene en pagos y no garantiza lo que se acuerda.'),
    ('eventos', 'calendario', 'Eventos', [
        ('Sí', ['Charlas, talleres, competencias, repasos y actividades de centros de estudiantes.', 'Fechas institucionales de la facultad.']),
        ('No', ['Fiestas o cursos comerciales presentados como actividades de la facultad.'])],
     'Se publican al instante y muestran quién los respalda: «Publicado por la comunidad» o un organizador verificado. La inscripción siempre la maneja quien lo organiza.'),
]

def p_normas():
    indice = ''.join(f'<a href="#{k}" style="display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; {"background: #ECF2FE;" if k == "materiales" else ""} font-size: 14px; font-weight: {800 if k == "materiales" else 700}; color: {NAVY};">{ico(i, 17, BTN if k == "materiales" else NAVY, 2)}{t}</a>'
                     for k, i, t in [('principios', 'corazon', 'Lo principal'), ('materiales', 'doc', 'Materiales'), ('experiencias', 'pluma', 'Reseñas y experiencias'),
                                     ('clasificados', 'etiqueta', 'Clasificados y tutorías'), ('eventos', 'calendario', 'Eventos'), ('convivencia', 'gente', 'Convivencia'), ('moderacion', 'escudo', 'Si algo no cumple')])
    def lista(tipo, items):
        ok = tipo == 'Sí'
        return (f'<div style="background: {VERDE_BG if ok else "#FFF3F2"}; border: 1.5px solid {"#9BD3A6" if ok else "#F2B8B5"}; border-radius: 14px; padding: 14px 16px;">'
                f'<div style="display: flex; align-items: center; gap: 8px; {META} color: {VERDE_TX if ok else ROJO_TX};">{ico("check" if ok else "equis", 15, VERDE_TX if ok else ROJO_TX, 3)}{tipo}</div>'
                + ''.join(f'<div style="margin-top: 8px; font-size: 14.5px; line-height: 1.5; font-weight: 500; color: {NAVY};">{t}</div>' for t in items) + '</div>')
    secciones = ''
    for k, ic, tit, bloques, nota in SECCIONES:
        secciones += (f'<section id="{k}" style="padding: 26px 0; border-top: 1.5px solid #E4DCCB;"><div style="display: flex; align-items: center; gap: 12px;">{ga.tile(ic, "#ECF2FE", BTN, 42, 12)}'
                      f'<h2 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.04em;">{tit}</h2></div>'
                      f'<div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">{"".join(lista(t, it) for t, it in bloques)}</div>'
                      f'<p style="margin: 14px 0 0 0; font-size: 14.5px; line-height: 1.6; font-weight: 500; color: {TEXT2}; max-width: 70ch;">{nota}</p></section>')
    principios = ''.join(f'<div style="display: flex; gap: 14px; align-items: flex-start;"><span style="font-size: 32px; line-height: 1; font-weight: 800; letter-spacing: -0.04em; color: {c}; width: 30px; flex-shrink: 0;">{n}</span>'
                         f'<div><div style="font-size: 17px; font-weight: 800;">{t}</div><div style="margin-top: 3px; font-size: 14px; line-height: 1.5; font-weight: 500; color: {TEXT2};">{d}</div></div></div>'
                         for n, t, d, c in [('1', 'Compartí lo que te hubiera servido.', 'Materiales claros, completos y de la materia correcta.', BTN),
                                            ('2', 'Criticá la cursada, no a las personas.', 'Contá qué pasó y qué harías distinto, sin insultos ni acusaciones.', PINK),
                                            ('3', 'Cuidá los datos de todos.', 'Ni tuyos ni ajenos: nombres, DNI, legajos, teléfonos.', ORANGE),
                                            ('4', 'Ayudá a aprender, no a zafar.', 'Explicar sí; hacer trabajos o exámenes por otra persona, no.', '#6E9400')])
    pasos = ''.join(f'<div style="{CARD} padding: 14px 16px;"><div style="{META} font-size: 10.5px; color: {BLUE};">{p}</div><div style="margin-top: 5px; font-size: 15px; font-weight: 800;">{t}</div>'
                    f'<div style="margin-top: 4px; font-size: 13px; line-height: 1.5; font-weight: 500; color: {TEXT2};">{d}</div></div>'
                    for p, t, d in [('Primero', 'Alguien lo reporta', 'Spam o repetido, insultos o acoso, datos personales, no relacionado, posiblemente engañoso u otro motivo.'),
                                    ('Después', 'Moderación lo revisa', 'Decide si sigue visible o se retira. Con tres reportes, o uno por datos personales, se oculta mientras tanto.'),
                                    ('Si se retira', 'Ves la razón', 'Te llega la razón y la fecha. Los puntos de ese aporte se descuentan.'),
                                    ('Si se repite', 'Silencio o suspensión', 'Primero se silencia la cuenta unos días; si continúa, se suspende.')])
    return breadcrumb(['Ayuda', 'Normas de la comunidad']) + f'''
  <section style="flex-shrink: 0; padding: 28px 64px 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 40px; align-items: end;">
    <div>{eyebrow('Normas de la comunidad · actualizadas el 28 de septiembre de 2026')}
      <h1 style="margin: 14px 0 0 0; font-size: 72px; line-height: 0.92; font-weight: 800; letter-spacing: -0.058em;">Entre estudiantes,<br><span style="color: {BLUE};">con cuidado</span><span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 16px 0 0 0; font-size: 17px; line-height: 1.55; font-weight: 500; color: {TEXT2}; max-width: 62ch;">DevsProject funciona porque cada persona comparte algo que le sirvió a otra. Estas normas cuidan eso. Son cortas a propósito: si dudás, preguntate si lo que publicás ayuda a quien viene detrás.</p>
    </div>
    <img src="gato-checklist.png" alt="" style="width: 230px; height: auto; margin-bottom: -10px;">
  </section>
  <section style="flex-shrink: 0; margin-top: 28px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 40px; align-items: start;">
    <nav aria-label="Secciones" style="{CARD} padding: 8px; display: flex; flex-direction: column; gap: 2px;">{indice}</nav>
    <div>
      <section id="principios" style="background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 18px; box-shadow: 6px 6px 0 {NAVY}; padding: 24px 28px;">
        <div style="{META} color: #45560F;">Lo principal, en cuatro frases</div>
        <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px 28px;">{principios}</div>
      </section>
      <div style="margin-top: 14px;">{secciones}</div>
      <section id="convivencia" style="padding: 26px 0; border-top: 1.5px solid #E4DCCB;"><div style="display: flex; align-items: center; gap: 12px;">{ga.tile('gente', '#ECF2FE', BTN, 42, 12)}<h2 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.04em;">Convivencia</h2></div>
        <p style="margin: 14px 0 0 0; font-size: 15.5px; line-height: 1.65; font-weight: 500; color: {TEXT2}; max-width: 70ch;">No se aceptan insultos, acoso, discriminación, spam ni contenido repetido. Tampoco se permite usar varias cuentas para sumar «Me sirvió» o puntos: esos «Me sirvió» no cuentan y la cuenta puede sancionarse.</p></section>
      <section id="moderacion" style="padding: 26px 0; border-top: 1.5px solid #E4DCCB;"><div style="display: flex; align-items: center; gap: 12px;">{ga.tile('escudo', '#ECF2FE', BTN, 42, 12)}<h2 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.04em;">Si algo no cumple</h2></div>
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">{pasos}</div>
        <div style="margin-top: 16px; display: flex; align-items: center; gap: 14px; background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 14px 18px;">{ico('mensaje', 20, BTN, 2.1)}
          <div style="font-size: 14.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};"><b style="color: {NAVY};">¿No estás de acuerdo con una decisión?</b> Podés apelar una vez, dentro de 14 días, desde «Mis aportes». La revisa otra persona de moderación y su respuesta es final.</div>
          <span style="margin-left: auto;">{boton('Ver mis aportes', 'flecha', primario=False, chico=True)}</span></div>
      </section>
    </div>
  </section>
'''

PAGINAS = [
    ('NovedadesPanel.dc.html', 'DevsProject · Novedades (panel)', p_panel, 760, 'panel'),
    ('Novedades.dc.html', 'DevsProject · Novedades', p_novedades, 1400, 'espacio'),
    ('MisAportes.dc.html', 'DevsProject · Mis aportes', p_mis_aportes, 1500, 'espacio'),
    ('Normas.dc.html', 'DevsProject · Normas de la comunidad', p_normas, 2400, 'pagina'),
]
if __name__ == '__main__':
    for archivo, titulo, fn, alto, tipo in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        if tipo == 'panel':
            html = ge.documento(titulo, alto, '', fn()).replace(ge.footer(), '')
        elif tipo == 'espacio':
            html = ge.documento(titulo, alto, ge.header_logueado(False), fn())
        else:
            html = gx.documento(titulo, alto, gx.header_logueado(''), fn())
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(html)
        print('escrito', archivo, alto)

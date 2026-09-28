# Panel de moderacion segun docs/README_MODERACION.md: Casos (material y resena anonima), Usuarios,
# Apelaciones e Historial. Reemplaza a ModeracionMateriales y ModeracionReportes.
# Uso: python generar_moderacion.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones', 'estados'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, estrellas, ICONOS, ESTRELLA, TIPO, CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_acciones as ga

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA, CREMA = ga.LINEA, ga.CREMA
VERDE_BG, VERDE_TX, ROJO_BG, ROJO_TX = ga.VERDE_BG, ga.VERDE_TX, ga.ROJO_BG, ga.ROJO_TX
AMBAR_BG, AMBAR_TX = '#FDF0C8', '#8A5A00'
VIOLETA_BG, VIOLETA_TX = '#EDE6FB', '#5B4B8A'
META = 'font-size: 11px; font-weight: 800; letter-spacing: 0.13em; text-transform: uppercase;'
ICONOS.setdefault('estrella', ESTRELLA)
ICONOS.update({'ojo-off': '<path d="M3 3l18 18"></path><path d="M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3 3.8M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1"></path>',
               'balanza': '<path d="M12 4v16M7 20h10M5 8h14"></path><path d="m5 8-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z"></path>',
               'historial': '<path d="M3 12a9 9 0 1 0 3-6.7"></path><path d="M3 4v4h4"></path><path d="M12 7v5l3 2"></path>'})

def est(texto, fondo, color, icono):
    return ge.estado(texto, fondo, color, icono)

# ================================================================ piezas comunes
def subnav(activo, rol='Tu rol: moderación · FI UNJu'):
    tabs = [('casos', 'Casos', 'bandera', '10'), ('usuarios', 'Usuarios', 'gente', None), ('apelaciones', 'Apelaciones', 'balanza', '2'), ('historial', 'Historial', 'historial', None)]
    html = ''
    for clave, texto, icono, n in tabs:
        on = clave == activo
        cuenta = (f'<span style="min-width: 20px; box-sizing: border-box; text-align: center; border-radius: 999px; padding: 1px 6px; font-size: 11.5px; font-weight: 800; '
                  f'{"background: #FFFFFF; color: " + BTN if on else "background: " + PINK + "; color: #FFFFFF"};">{n}</span>') if n else ''
        estilo = (f'background: {BTN}; border: 1.5px solid {NAVY}; color: #FFFFFF; font-weight: 800;' if on else f'color: {NAVY}; font-weight: 700;')
        html += (f'<a href="#{clave}" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 10px; padding: 8px 14px; font-size: 14px; {estilo}">'
                 f'{ico(icono, 16, "#FFFFFF" if on else NAVY, 2.1)}{texto}{cuenta}</a>')
    return f'''  <div style="flex-shrink: 0; padding: 4px 64px 0 64px;">
    <nav aria-label="Moderación" style="display: flex; align-items: center; gap: 6px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 6px 16px 6px 8px;">
      <span style="padding: 0 10px 0 8px; {META} color: {MUTED};">Moderación</span>{html}
      <span style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">{ico('escudo', 15, NAVY, 2.1)}{rol}</span>
    </nav>
  </div>
'''

def titulo(texto, sub, derecha=''):
    return f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;">
    <div><h1 style="margin: 0; font-size: 56px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">{texto}<span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 12px 0 0 0; font-size: 16px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 680px;">{sub}</p></div>
    <div style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: {MUTED};">{derecha}</div>
  </section>
'''

def tiles(datos):
    return ('<section style="flex-shrink: 0; margin-top: 20px; padding: 0 64px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">'
            + ''.join(f'<div style="{CARD} padding: 14px 18px; {"border-color: " + c + "; box-shadow: 4px 4px 0 " + c + ";" if c else ""}"><div style="font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1;">{n}</div>'
                      f'<div style="margin-top: 6px; font-size: 13px; font-weight: 800;">{a}</div><div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: {MUTED};">{b}</div></div>' for n, a, b, c in datos)
            + '</section>\n')

def fila_cola(tile_html, tit, l1, l2, derecha, sel=False):
    marco = f'background: #ECF2FE; border: 2px solid {NAVY};' if sel else 'background: #FFFFFF; border: 1.5px solid #E4DCCB;'
    return (f'<div style="{marco} border-radius: 13px; padding: 11px 13px; display: flex; gap: 12px; align-items: center;">{tile_html}'
            f'<div style="min-width: 0; flex: 1;"><div style="font-size: 14px; font-weight: 800; line-height: 1.25;">{tit}</div>'
            f'<div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: {TEXT2};">{l1}</div><div style="margin-top: 1px; font-size: 11.5px; font-weight: 600; color: {MUTED};">{l2}</div></div>'
            f'<div style="flex-shrink: 0; display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">{derecha}</div></div>')

def grupo(nombre, n, color):
    return f'<div style="display: flex; align-items: center; gap: 8px; padding: 10px 2px 2px 2px; {META} color: {color};">{nombre}<span style="color: {MUTED};">{n}</span></div>'

def cola_casos(sel):
    _, _, p_ic, p_f, p_c = TIPO['Parcial']
    _, _, r_ic, r_f, r_c = TIPO['Resumen']
    _, _, g_ic, g_f, g_c = TIPO['Guía de ejercicios']
    items = [
        grupo('Ocultos preventivamente', 2, ROJO_TX),
        fila_cola(ga.tile(p_ic, p_f, p_c, 40), 'Parcial 1 escaneado', 'Introducción a la Programación · 1 reporte', 'Datos personales', est('Quedan 31 h', ROJO_BG, ROJO_TX, 'reloj'), sel == 'material'),
        fila_cola(ga.tile('calendario', '#ECF2FE', BTN, 40), 'Reseña de cursada · Análisis II', 'Anónima · 3 reportes en 48 h', 'Insultos o acoso', est('Quedan 40 h', ROJO_BG, ROJO_TX, 'reloj'), sel == 'resena'),
        grupo('Revisión previa', 3, AMBAR_TX),
        fila_cola(ga.tile(r_ic, r_f, r_c, 40), 'Resumen unidad 1', 'Física Mecánica · @nueva.cuenta', 'Cuenta de 2 días', est('Previa', AMBAR_BG, AMBAR_TX, 'reloj')),
        fila_cola(ga.tile('etiqueta', '#FFE3EE', '#E0357A', 40), 'Vendo apuntes completos', 'Clasificados · @ofertas.fi', 'Enlace externo sospechoso', est('Previa', AMBAR_BG, AMBAR_TX, 'reloj')),
        grupo('Reportados', 5, BTN),
        fila_cola(ga.tile(g_ic, g_f, g_c, 40), 'Guía 2 de cinemática', 'Física Mecánica · 2 reportes', 'No relacionado con la materia', est('Visible', VERDE_BG, VERDE_TX, 'ojo')),
        fila_cola(ga.tile('calendario', '#ECF2FE', BTN, 40), 'Fiesta de primavera', 'Evento · por la comunidad · 1 reporte', 'Posiblemente engañoso', est('Visible', VERDE_BG, VERDE_TX, 'ojo')),
    ]
    return (f'''    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em;">Casos abiertos · 10</h2><span style="font-size: 12.5px; font-weight: 700; color: {MUTED};">Urgentes primero</span></div>
      <div style="display: flex; gap: 8px;">{gx.desplegable('Tipo: todos')}{gx.desplegable('Motivo: todos')}</div>
      {''.join(items)}
      <a href="#mas" style="align-self: center; padding-top: 4px; font-size: 13.5px; font-weight: 700; color: {BLUE};">Ver los 3 restantes</a>
    </div>
''')

def reportes_lista(reps):
    return ''.join(f'<div style="display: flex; gap: 11px; padding: 10px 0; {"border-top: 1.5px solid " + LINEA + ";" if k else ""}">{ico("bandera", 16, ROJO_TX, 2)}'
                   f'<div><div style="font-size: 13.5px; font-weight: 800;">{m}</div>{("<div style=\"margin-top: 2px; font-size: 13px; line-height: 1.45; font-weight: 500; color: " + TEXT2 + ";\">«" + e + "»</div>") if e else ""}'
                   f'<div style="margin-top: 2px; font-size: 11.5px; font-weight: 600; color: {MUTED};">{c}</div></div></div>' for k, (m, e, c) in enumerate(reps))

def decision(razon, contador, sancion_html, boton_retirar='Retirar'):
    return f'''      <div style="padding: 16px 22px 18px 22px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
        {gx.campo('Razón para el autor', ga.area(razon, contador, 58), 'obligatorio')}
        <div style="margin-top: 10px;">{sancion_html}</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px;">
          {boton('Mantener visible', 'ojo', primario=False)}
          <span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Desestima los reportes y cierra el caso.</span>
          <a href="#retirar" style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; background: {ROJO_TX}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 13px 20px; font-size: 15px; font-weight: 700; color: #FFFFFF;">{ico('equis', 15, '#FFFFFF', 2.6)}{boton_retirar}</a>
        </div>
      </div>
'''

def cabecera_caso(tile_html, tit, sub, estado_html):
    return (f'<div style="display: flex; align-items: center; gap: 14px; padding: 18px 22px; border-bottom: 1.5px solid {LINEA};">{tile_html}'
            f'<div style="min-width: 0;"><h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">{tit}</h2>'
            f'<div style="margin-top: 3px; font-size: 13px; font-weight: 600; color: {MUTED};">{sub}</div></div><span style="margin-left: auto;">{estado_html}</span></div>')

def encabezado_panel(activo, sub, datos, atajos='', rol='Tu rol: moderación · FI UNJu'):
    return gx.header_logueado('') + subnav(activo, rol) + titulo('Moderación', sub, atajos) + (tiles(datos) if datos else '')

TILES_CASOS = [('2', 'ocultos preventivamente', 'el más viejo vence en 31 h', ROJO_TX), ('3', 'en revisión previa', 'cuentas nuevas y spam', None),
               ('5', 'reportados y visibles', 'objetivo: 7 días', None), ('2', 'apelaciones', 'de decisiones de otros', None)]
ATAJOS = f"{ga.tecla('V')} mantener visible {ga.tecla('R')} retirar {ga.tecla('J')}{ga.tecla('K')} siguiente y anterior"

# ================================================================ 1 · CASO DE UN MATERIAL (oculto por datos personales)
def p_caso_material():
    _, _, p_ic, p_f, p_c = TIPO['Parcial']
    vista = (f'<div style="position: relative; height: 360px; border-radius: 12px; border: 1.5px solid #E4DCCB; background: #EFE8DA; overflow: hidden;">'
             f'<div style="position: absolute; left: 16px; top: 16px; width: 620px; transform: scale(0.45); transform-origin: top left;">{ga.hoja()}</div>'
             f'<div style="position: absolute; left: 38px; top: 64px; width: 230px; height: 26px; border: 2.5px solid {ROJO_TX}; border-radius: 6px; background: rgba(253,79,141,0.12);"></div>'
             f'<span style="position: absolute; left: 38px; top: 94px; background: {ROJO_TX}; color: #FFFFFF; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 800;">Nombre y DNI visibles según el reporte</span>'
             f'<a href="#completa" style="position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 7px; background: {NAVY}; color: #FFFFFF; border-radius: 999px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap;">{ico("expandir", 14, "#FFFFFF", 2.2)}Ver las 3 páginas</a></div>')
    sancion = ga.aviso('info', '<b>Primer retiro por normas de @tomi.g:</b> se le envía una advertencia junto con el aviso. El autor puede tapar los datos y volver a subirlo.')
    panel = f'''    <div style="{CARD} overflow: hidden;">
      {cabecera_caso(ga.tile(p_ic, p_f, p_c, 46, 13), 'Parcial 1 escaneado', '<b style="color: ' + NAVY + ';">Introducción a la Programación</b> · publicado hace 5 h · 12 «Me sirvió» antes de ocultarse', est('Oculto · quedan 31 h', ROJO_BG, ROJO_TX, 'ojo-off'))}
      <div style="padding: 18px 22px; display: grid; grid-template-columns: 300px minmax(0, 1fr); gap: 22px;">
        {vista}
        <div style="display: flex; flex-direction: column; gap: 14px;">
          <div><div style="{META} color: {MUTED};">Por qué está oculto</div><div style="margin-top: 6px; font-size: 13.5px; line-height: 1.5; font-weight: 600; color: {TEXT2};">Un reporte por datos personales alcanza para ocultarlo hasta que lo revises. Si nadie lo revisa en 7 días, vuelve a verse solo.</div></div>
          <div><div style="{META} color: {MUTED};">Reportes · 1</div><div style="margin-top: 4px;">{reportes_lista([('Expone datos personales', 'En la primera hoja se lee el nombre completo y el DNI de un compañero.', 'Estudiante con buena precisión · hace 5 h')])}</div></div>
          <div style="display: flex; align-items: center; gap: 12px; border: 1.5px solid #E4DCCB; border-radius: 12px; padding: 11px 13px;">{gx.iniciales('TG', '#FDE7D0', '#B14C06', 38)}
            <div><div style="font-size: 14px; font-weight: 800;">@tomi.g <span style="font-weight: 600; color: {MUTED};">· Ing. Informática</span></div><div style="font-size: 12px; font-weight: 600; color: {TEXT2};">14 aportes · 0 retiros en 90 días · cuenta de 1 año</div></div>
            <a href="#usuario" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {BLUE}; white-space: nowrap;">Ver ficha</a></div>
        </div>
      </div>
{decision('Se ven el nombre y el DNI de una persona en la primera página. Tapalos y volvé a subirlo.', '84 / 1000', sancion)}    </div>
'''
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 24px; align-items: start;">
{cola_casos('material')}{panel}  </section>
'''
    return encabezado_panel('casos', 'Todo se publica al instante. Acá llega lo que la comunidad reportó y lo que necesita revisión previa. Cada decisión lleva su razón y queda en el historial.', TILES_CASOS, ATAJOS) + cuerpo

# ================================================================ 2 · CASO DE UNA RESENA ANONIMA (autor oculto)
def p_caso_resena():
    publicacion = f'''<div style="background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 13px; padding: 16px 18px;">
          <div style="display: flex; align-items: center; gap: 11px;">{gx.avatar('av-birrete.png', 38)}<div><div style="font-size: 14px; font-weight: 800;">Anónimo</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">Reseña de cursada · hace 2 días</div></div></div>
          <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px;">{''.join(chip(x) for x in ['Ciclo 2025', 'Tarde', 'Prof. A. Gómez', 'Regular'])}</div>
          <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.55; font-weight: 500; color: {NAVY};">“No la cursen con Gómez: no sabe explicar y aprueba a los que le caen bien. Una vergüenza de cátedra.”</p>
        </div>'''
    autor = f'''<div style="border: 1.5px dashed #B9AE96; border-radius: 13px; padding: 14px 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">{ga.tile('ojo-off', '#F1EEE4', NAVY, 38, 11)}
            <div><div style="font-size: 14.5px; font-weight: 800;">Autor oculto</div><div style="font-size: 12.5px; font-weight: 600; color: {TEXT2};">Tuvo 1 retiro por normas en los últimos 90 días.</div></div></div>
          <div style="margin-top: 12px;">{gx.campo('Motivo para ver el autor', ga.area('Evaluar reincidencia antes de aplicar el silenciamiento sugerido.', '63 / 300', 48), 'obligatorio')}</div>
          <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px;"><span style="flex-shrink: 0; white-space: nowrap;">{boton('Ver autor', 'ojo', primario=False, chico=True)}</span><span style="font-size: 12px; font-weight: 600; color: {MUTED};">Queda registrado y lo pueden revisar los admins.</span></div>
        </div>'''
    sancion = (f'<div style="display: flex; align-items: center; gap: 12px; background: {AMBAR_BG}; border: 1.5px solid #E9C46A; border-radius: 12px; padding: 11px 14px;">{ico("alerta", 18, AMBAR_TX, 2.2)}'
               f'<div style="font-size: 13px; line-height: 1.45; font-weight: 600; color: #5C4600;"><b style="color: {NAVY};">Paso sugerido: silenciar 7 días.</b> Sería su segundo retiro en 90 días. La sanción se aplica a la cuenta sin revelar públicamente quién es.</div>'
               f'<label style="margin-left: auto; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; white-space: nowrap;">{ga.casilla(True)}Aplicar al retirar</label></div>')
    panel = f'''    <div style="{CARD} overflow: hidden;">
      {cabecera_caso(ga.tile('calendario', '#ECF2FE', BTN, 46, 13), 'Reseña de cursada · Análisis Matemático II', '3 reportes de cuentas distintas en 48 h · oculta automáticamente', est('Oculta · quedan 40 h', ROJO_BG, ROJO_TX, 'ojo-off'))}
      <div style="padding: 18px 22px; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 22px;">
        <div style="display: flex; flex-direction: column; gap: 14px;">{publicacion}{autor}</div>
        <div><div style="{META} color: {MUTED};">Reportes · 3</div><div style="margin-top: 4px;">{reportes_lista([('Insultos o acoso', 'Ataca al profesor en vez de contar cómo fue la cursada.', 'Estudiante · hace 3 h'), ('Insultos o acoso', '', 'Estudiante · hace 5 h'), ('Información posiblemente engañosa', 'Lo de que aprueba a los que le caen bien no se puede saber.', 'Estudiante · hace 1 día')])}</div></div>
      </div>
{decision('Ataca a una persona en lugar de contar la cursada. Podés volver a escribirla sin agravios.', '90 / 1000', sancion, 'Retirar y silenciar')}    </div>
'''
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 24px; align-items: start;">
{cola_casos('resena')}{panel}  </section>
'''
    return encabezado_panel('casos', 'Las publicaciones anónimas muestran «Autor oculto». Para verlo hay que escribir un motivo, y queda registrado.', TILES_CASOS, ATAJOS) + cuerpo

# ================================================================ 3 · USUARIOS
def p_usuarios():
    USU = [('JP', '#E5E8EF', '#4C5B8A', '@juan.p', 'Lic. en Sistemas · cuenta de 8 meses', est('Advertido', AMBAR_BG, AMBAR_TX, 'alerta'), 'Sugerido: silenciar 7 días', True),
           ('OF', '#FED3DF', '#E01F63', '@ofertas.fi', 'Cuenta de 1 día · sin email verificado', est('Revisión previa', AMBAR_BG, AMBAR_TX, 'reloj'), 'Posible spam', False),
           ('LR', '#F0F7C9', '#5A7A00', '@lu.rojas', 'Ing. Industrial · cuenta de 2 años', est('Silenciado · 2 días', ROJO_BG, ROJO_TX, 'candado'), 'Vence el 30 sep', False),
           ('TG', '#FDE7D0', '#B14C06', '@tomi.g', 'Ing. Informática · cuenta de 1 año', est('Activo', VERDE_BG, VERDE_TX, 'check'), '1 caso abierto', False),
           ('MV', '#D8F1E8', '#1F8F6B', '@mica.v', 'Ing. Química · cuenta de 3 años', est('Activo', VERDE_BG, VERDE_TX, 'check'), 'Reportes: 92 % de precisión', False)]
    lista = ''.join(fila_cola(gx.iniciales(i, f, c, 40), u, d, s, e, sel) for i, f, c, u, d, e, s, sel in USU)
    numeros = ''.join(f'<div style="background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 12px; padding: 11px 13px;"><div style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em; color: {c};">{n}</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">{t}</div></div>'
                      for n, t, c in [('9', 'aportes publicados', NAVY), ('1', 'retiro por normas en 90 días', ROJO_TX), ('40 %', 'precisión de sus reportes', NAVY)])
    linea = ''.join(f'<div style="display: flex; gap: 12px; padding: 11px 0; {"border-top: 1.5px solid " + LINEA + ";" if k else ""}"><span style="width: 62px; flex-shrink: 0; font-size: 12px; font-weight: 800; color: {MUTED};">{f}</span>'
                    f'<div><div style="font-size: 13.5px; font-weight: 800;">{t}</div><div style="font-size: 12.5px; line-height: 1.45; font-weight: 500; color: {TEXT2};">{d}</div></div></div>'
                    for k, (f, t, d) in enumerate([('hoy', 'Nuevo caso: reseña anónima ocultada', 'Análisis Matemático II · 3 reportes por insultos'),
                                                   ('14 sep', 'Advertencia', 'Retiro de una experiencia de final por insultos a una docente · decidió @caro.m'),
                                                   ('2 ago', 'Reporte desestimado', 'Reportó una guía de Álgebra como «spam»; se mantuvo visible'),
                                                   ('3 feb', 'Cuenta creada', 'Email verificado el mismo día')]))
    ficha = f'''    <div style="{CARD} overflow: hidden;">
      <div style="display: flex; align-items: center; gap: 16px; padding: 20px 22px; border-bottom: 1.5px solid {LINEA};">{gx.iniciales('JP', '#E5E8EF', '#4C5B8A', 60)}
        <div><h2 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">@juan.p</h2><div style="margin-top: 3px; font-size: 13px; font-weight: 600; color: {MUTED};">Lic. en Sistemas · FI UNJu · cuenta de 8 meses · j••••@gmail.com verificado</div></div>
        <span style="margin-left: auto;">{est('Advertido hasta el 13 dic', AMBAR_BG, AMBAR_TX, 'alerta')}</span></div>
      <div style="padding: 18px 22px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;">{numeros}</div>
      <div style="padding: 0 22px 8px 22px;"><div style="{META} color: {MUTED};">Línea de tiempo</div><div style="margin-top: 4px;">{linea}</div></div>
      <div style="padding: 10px 22px;">{ga.aviso('candado', 'Sus publicaciones anónimas no se listan acá. Para relacionarlas con esta cuenta hay que usar «Ver autor» desde el caso.', '#F1EEE4', NAVY)}</div>
      <div style="padding: 16px 22px 18px 22px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
        <div style="display: flex; align-items: center; gap: 12px; background: {AMBAR_BG}; border: 1.5px solid #E9C46A; border-radius: 12px; padding: 11px 14px; font-size: 13px; line-height: 1.45; font-weight: 600; color: #5C4600;">{ico('alerta', 18, AMBAR_TX, 2.2)}<span><b style="color: {NAVY};">Paso sugerido: silenciar 7 días</b> si se retira la reseña del caso abierto (sería su segundo retiro en 90 días).</span></div>
        <div style="margin-top: 14px;">{gx.campo('Razón de la sanción', ga.area('Segundo retiro por insultos en 90 días.', '38 / 1000', 50), 'obligatorio')}</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          {boton('Advertir', 'alerta', primario=False, chico=True)}{boton('Silenciar 7 días', 'candado', chico=True)}
          <a href="#suspender" style="margin-left: auto; display: inline-flex; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {ROJO_TX}; border-radius: 11px; padding: 10px 16px; font-size: 13px; font-weight: 700; color: {ROJO_TX};">{ico('equis', 13, ROJO_TX, 2.6)}Proponer suspensión</a>
        </div>
        <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: {MUTED}; text-align: right;">La suspensión la confirma un admin.</div>
      </div>
    </div>
'''
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 24px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 10px 12px; font-size: 14px; font-weight: 600; color: #9BA2B4;">{ico('lupa', 17, NAVY, 2.2)}Buscar por usuario</div>
      <div style="display: flex; gap: 6px; flex-wrap: wrap;">{gx.pildora('Con sugerencias', True, None, 2)}{gx.pildora('Sancionados', False, None, 3)}{gx.pildora('Revisión previa', False, None, 4)}</div>
      {lista}
    </div>
{ficha}  </section>
'''
    return encabezado_panel('usuarios', 'Cuentas con sanciones, sugerencias o revisión previa. El sistema sugiere el paso; la decisión es tuya.', []) + cuerpo

# ================================================================ 4 · APELACIONES
def p_apelaciones():
    _, _, r_ic, r_f, r_c = TIPO['Resumen']
    lista = (fila_cola(ga.tile(r_ic, r_f, r_c, 40), 'Resumen de lógica', 'Retiro · decidió @caro.m', 'Apelada hace 1 día · vence en 13 días', est('Nueva', '#ECF2FE', BTN, 'balanza'), True)
             + fila_cola(gx.iniciales('LR', '#F0F7C9', '#5A7A00', 40), 'Silenciamiento de @lu.rojas', 'Sanción · decidió @nico.b', 'Apelada hace 3 días', est('Nueva', '#ECF2FE', BTN, 'balanza')))
    detalle = f'''    <div style="{CARD} overflow: hidden;">
      {cabecera_caso(ga.tile(r_ic, r_f, r_c, 46, 13), 'Apelación · «Resumen de lógica»', 'Matemática Discreta · apelada por @sofi.c hace 1 día', est('Podés resolverla', VERDE_BG, VERDE_TX, 'check'))}
      <div style="padding: 18px 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 18px;">
        <div style="background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 13px; padding: 14px 16px;">
          <div style="{META} color: {MUTED};">Decisión apelada</div>
          <div style="margin-top: 8px; font-size: 15px; font-weight: 800;">Retirado el 22 de septiembre</div>
          <div style="margin-top: 4px; font-size: 13.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">«Está duplicado con otro resumen de la misma materia.»</div>
          <div style="margin-top: 8px; font-size: 12px; font-weight: 700; color: {MUTED};">Decidió @caro.m · 2 reportes por «spam o contenido repetido»</div>
        </div>
        <div style="background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 14px 16px;">
          <div style="{META} color: {BLUE};">Lo que dice quien apela</div>
          <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.55; font-weight: 500; color: {NAVY};">«No es el mismo: el otro resume la unidad 1 (conjuntos) y este la unidad 2 (lógica proposicional). Tienen título parecido pero el contenido es distinto.»</p>
        </div>
        <div style="grid-column: 1 / -1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          {''.join(f'<div style="border: 1.5px solid #E4DCCB; border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 12px;">{ga.tile(r_ic, r_f, r_c, 40)}<div><div style="font-size: 14px; font-weight: 800;">{t}</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">{d}</div></div><a href="#ver" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {BLUE};">Abrir</a></div>' for t, d in [('Resumen de lógica', 'El retirado · 6 páginas'), ('Resumen de conjuntos', 'El que se tomó como duplicado · 5 páginas')])}
        </div>
      </div>
      <div style="padding: 16px 22px 18px 22px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
        {gx.campo('Tu respuesta', ga.area('Tenés razón: cubren unidades distintas. Lo restauramos con sus puntos.', '71 / 1000', 50), 'obligatorio')}
        <div style="margin-top: 10px;">{ga.aviso('info', 'La respuesta es final. Si la aceptás, el material se restaura, se reotorgan sus puntos y el retiro deja de contar para la escalera.')}</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px;">
          {boton('Mantener la decisión', primario=False)}
          <span style="margin-left: auto;">{boton('Aceptar y restaurar', 'check')}</span>
        </div>
      </div>
    </div>
'''
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 420px minmax(0, 1fr); gap: 24px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em;">Apelaciones · 2</h2><span style="font-size: 12.5px; font-weight: 700; color: {MUTED};">Solo las de otros moderadores</span></div>
      {lista}
      {ga.aviso('escudo', 'No ves apelaciones de decisiones tuyas. Las de suspensiones las resuelve un admin.', '#F1EEE4', NAVY)}
    </div>
{detalle}  </section>
'''
    return encabezado_panel('apelaciones', 'Cada decisión se puede apelar una vez, dentro de 14 días. La revisa otra persona y su respuesta es final.', []) + cuerpo

# ================================================================ 5 · HISTORIAL (vista de admin)
def p_historial():
    def accion(t, f, c, i):
        return est(t, f, c, i)
    filas = [('28 sep 14:32', '@max', accion('Retiro', ROJO_BG, ROJO_TX, 'equis'), 'Parcial 1 escaneado · Introducción a la Programación', 'Datos personales visibles', False),
             ('28 sep 14:32', 'Sistema', accion('Advertencia', AMBAR_BG, AMBAR_TX, 'alerta'), '@tomi.g', 'Primer retiro por normas', False),
             ('28 sep 11:05', '@max', accion('Ver autor', VIOLETA_BG, VIOLETA_TX, 'ojo'), 'Reseña anónima · Análisis Matemático II', 'Evaluar reincidencia antes de silenciar', True),
             ('28 sep 11:06', '@max', accion('Silenciamiento', ROJO_BG, ROJO_TX, 'candado'), '@juan.p · 7 días', 'Segundo retiro por insultos en 90 días', False),
             ('27 sep 19:40', 'Sistema', accion('Ocultamiento', '#F1EEE4', TEXT2, 'ojo-off'), 'Reseña anónima · Análisis Matemático II', '3 reportes en 48 h', False),
             ('27 sep 16:12', '@caro.m', accion('Mantener visible', VERDE_BG, VERDE_TX, 'ojo'), 'Guía 3 de conteo · Matemática Discreta', 'No es spam: guía propia del autor', False),
             ('27 sep 10:02', '@nico.b', accion('Revisión previa', AMBAR_BG, AMBAR_TX, 'check'), 'Resumen unidad 1 · Física Mecánica', 'Aprobado: cuenta nueva, contenido correcto', False),
             ('26 sep 18:55', '@ana.admin', accion('Verificación', '#ECF2FE', BTN, 'check'), 'Club de Programación FI', 'Contacto institucional confirmado', False),
             ('26 sep 09:30', '@ana.admin', accion('Rol', '#ECF2FE', BTN, 'escudo'), '@max → moderación · FI', 'Invitación aceptada', False)]
    tabla = ''.join(f'<div style="display: grid; grid-template-columns: 110px 100px 150px minmax(0, 1.4fr) minmax(0, 1fr); gap: 14px; align-items: center; padding: 12px 16px; border-top: 1.5px solid {LINEA}; {"background: #F7F3FF;" if va else ""}">'
                    f'<span style="font-size: 12.5px; font-weight: 700; color: {MUTED}; font-variant-numeric: tabular-nums;">{f}</span><span style="font-size: 13px; font-weight: 800;">{m}</span><span>{a}</span>'
                    f'<span style="font-size: 13.5px; font-weight: 700;">{s}</span><span style="font-size: 13px; line-height: 1.4; font-weight: 500; color: {TEXT2};">{r}</span></div>'
                    for f, m, a, s, r, va in filas)
    cab = ''.join(f'<span style="{META} font-size: 10.5px; color: {MUTED};">{t}</span>' for t in ['Fecha', 'Quién', 'Acción', 'Sobre qué', 'Razón'])
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px;">
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      {gx.desplegable('Facultad: todas')}{gx.desplegable('Acción: todas')}{gx.desplegable('Quién: todos')}{gx.desplegable('Últimos 7 días')}
      <span style="display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 12px; font-size: 13.5px; font-weight: 600; color: #9BA2B4; min-width: 240px;">{ico('lupa', 15, NAVY, 2.2)}Buscar contenido o usuario</span>
      <span style="margin-left: auto;">{gx.pildora('Solo usos de «Ver autor»', False, 'ojo', 1)}</span>
    </div>
    <div style="margin-top: 14px; {CARD} overflow: hidden;">
      <div style="display: grid; grid-template-columns: 110px 100px 150px minmax(0, 1.4fr) minmax(0, 1fr); gap: 14px; padding: 12px 16px; background: {CREMA};">{cab}</div>
{tabla}
      <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-top: 1.5px solid {LINEA}; font-size: 13px; font-weight: 700; color: {MUTED};"><span>9 de 214 registros</span><a href="#mas" style="color: {BLUE};">Cargar más</a></div>
    </div>
    <div style="margin-top: 14px; display: flex; gap: 12px;">
      {ga.aviso('candado', 'Así lo ve un admin. Un moderador ve solo su facultad y no ve los usos de «Ver autor» (resaltados en violeta).', VIOLETA_BG, VIOLETA_TX)}
      {ga.aviso('info', 'El historial es de solo lectura: ningún registro se puede editar ni borrar.', '#F1EEE4', NAVY)}
    </div>
  </section>
'''
    return encabezado_panel('historial', 'Todo lo que hizo moderación y el sistema: quién, qué, sobre qué, cuándo y por qué.', [], rol='Vista de admin · todas las facultades') + cuerpo

PAGINAS = [
    ('ModeracionCasos.dc.html', 'DevsProject · Moderación · caso de un material', p_caso_material, 1300),
    ('ModeracionCasoResena.dc.html', 'DevsProject · Moderación · caso de una reseña anónima', p_caso_resena, 1300),
    ('ModeracionUsuarios.dc.html', 'DevsProject · Moderación · usuarios', p_usuarios, 1300),
    ('ModeracionApelaciones.dc.html', 'DevsProject · Moderación · apelaciones', p_apelaciones, 1200),
    ('ModeracionHistorial.dc.html', 'DevsProject · Moderación · historial', p_historial, 1100),
]
if __name__ == '__main__':
    for archivo, titulo_doc, fn, alto in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        html = gx.documento(titulo_doc, alto, '', fn()).replace('family=Caveat', ga.SERIF, 1)
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(html)
        print('escrito', archivo, alto)

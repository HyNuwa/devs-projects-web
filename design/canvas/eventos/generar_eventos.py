# Genera la seccion Eventos con la imagen (el flyer) como protagonista: listado, vista de mes,
# ficha del evento y formulario para crear uno, mas los bloques para la Portada y Mi mochila.
# No es una ticketera: la inscripcion siempre es del organizador y el cupo es informativo.
# Uso: python generar_eventos.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, breadcrumb, ICONOS, ESTRELLA, CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_acciones as ga

OUT = sys.argv[1] if __name__ == '__main__' else None
ALTOS = json.loads(sys.argv[2]) if (__name__ == '__main__' and len(sys.argv) > 2) else {}
LINEA, CREMA = ga.LINEA, ga.CREMA

ICONOS.update({
    'estrella': ESTRELLA,
    'calendario-mas': '<rect x="3.5" y="5" width="17" height="15" rx="2.5"></rect><path d="M8 3v4M16 3v4M3.5 10h17"></path><path d="M12 13v5M9.5 15.5h5"></path>',
    'lista': '<path d="M9 6h11M9 12h11M9 18h11"></path><circle cx="4.5" cy="6" r="1"></circle><circle cx="4.5" cy="12" r="1"></circle><circle cx="4.5" cy="18" r="1"></circle>',
    'recortar': '<path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path>',
})

TIPOS_EV = {
    'Competencia': ('#FED3DF', '#E01F63', 'codigo'),
    'Taller': ('#D6E5FB', BTN, 'terminal'),
    'Charla': ('#EDE6FB', '#5B4B8A', 'gente'),
    'Institucional': ('#E5E8EF', '#4C5B8A', 'calendario'),
    'Centro de estudiantes': ('#FDE7D0', '#B14C06', 'birrete'),
    'Deportes y cultura': ('#D8F1E8', '#1F8F6B', 'pulso'),
    'Tutoría grupal': ('#F0F7C9', '#6E9400', 'libro'),
}

def ev(clave, img, dia, mes, dow, tit, hora, lugar, org, tipo, n, cupo=None, alcance='FI'):
    return dict(clave=clave, img=img, dia=dia, mes=mes, dow=dow, tit=tit, hora=hora, lugar=lugar, org=org, tipo=tipo, n=n, cupo=cupo, alcance=alcance)

FUTBOL = ev('futbol', 'flyer-futbol.jpg', '25', 'SEP', 'VIE', 'Torneo de fútbol interfacultades · fecha 2', '18:00', 'Complejo deportivo UNJu', 'Deportes UNJu', 'Deportes y cultura', 64, alcance='UNJu')
GIT = ev('git', 'flyer-git.jpg', '26', 'SEP', 'SÁB', 'Taller: Git y GitHub desde cero', '10:00', 'FI · Laboratorio 3', 'Club de Programación', 'Taller', 31, 25)
MESAS = ev('mesas', None, '30', 'SEP', 'MIÉ', 'Cierra la inscripción a mesas de octubre', '23:59', 'SIU Guaraní', 'Secretaría Académica FI', 'Institucional', None)
SEMANA = ev('semana', 'flyer-semana.jpg', '5', 'OCT', 'LUN', 'Semana de la Ingeniería', '5 al 9 oct', 'FI · todo el edificio', 'Centro de Estudiantes FI', 'Centro de estudiantes', 120)
COMPETITIVA = ev('competitiva', 'flyer-competitiva.jpg', '17', 'OCT', 'SÁB', 'Jornada de Programación Competitiva', '17:30', 'FI · Aula 15', 'Club de Programación', 'Competencia', 43, 40)
IA = ev('ia', 'flyer-ia.jpg', '21', 'OCT', 'MIÉ', 'Charla: IA en la industria de la región', '18:00', 'FI · Auditorio', 'Cátedra de Sistemas Inteligentes', 'Charla', 58)
FISICA = ev('fisica', 'flyer-fisica.jpg', '24', 'OCT', 'SÁB', 'Repaso grupal de Física Mecánica', '10:00', 'FI · Aula 8', 'Tomás L. · tutor', 'Tutoría grupal', 12, 15)
MUESTRA = ev('muestra', None, '22', 'OCT', 'JUE', 'Muestra de proyectos finales de Informática', '18:30', 'FI · Hall central', 'Carrera de Ingeniería Informática', 'Charla', 35)
CONGRESO = ev('congreso', None, '29', 'OCT', 'JUE', 'Congreso estudiantil de Ciencias Económicas', '9:00', 'FCE · Aula Magna', 'Centro de Estudiantes FCE', 'Charla', 27, alcance='Cercana')

META = 'font-size: 11.5px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;'

# ================================================================ piezas
def tipo_chip(tipo, borde=False):
    f, c, ic = TIPOS_EV[tipo]
    b = f'border: 1.5px solid {c};' if borde else ''
    return (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: {f}; {b} border-radius: 999px; padding: 3px 9px; font-size: 11px; font-weight: 800; color: {c}; white-space: nowrap;">'
            f'{ico(ic, 12, c, 2.3)}{tipo}</span>')

def corazon(on=False, tam=36):
    fill = f'fill="{PINK}"' if on else 'fill="none"'
    return (f'<span aria-label="Guardar evento" style="position: absolute; right: 10px; top: 10px; width: {tam}px; height: {tam}px; box-sizing: border-box; border-radius: 999px; background: #FFFFFF; '
            f'border: 1.5px solid {NAVY}; display: flex; align-items: center; justify-content: center;">'
            f'<svg width="17" height="17" viewBox="0 0 24 24" {fill} stroke="{PINK if on else NAVY}" stroke-width="2.1" stroke-linejoin="round" aria-hidden="true">{ICONOS["corazon"]}</svg></span>')

def portada_sin_flyer(e, radio=16):
    # cuando el organizador no sube imagen: una portada tipografica con el color del tipo
    f, c, ic = TIPOS_EV[e['tipo']]
    return (f'<div style="position: absolute; inset: 0; background: {f}; background-image: linear-gradient(rgba(2,18,56,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(2,18,56,0.05) 1px, transparent 1px); '
            f'background-size: 22px 22px; padding: 18px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">'
            f'{ico(ic, 34, c, 2)}<div style="font-size: 23px; line-height: 1.02; font-weight: 800; letter-spacing: -0.04em; color: {NAVY};">{e["tit"]}</div>'
            f'<div style="{META} color: {c};">{e["dia"]} {e["mes"]} · {e["org"]}</div></div>')

def imagen(e, alto=None, radio=16, fav=False, fecha=True):
    dentro = (f'<img src="{e["img"]}" alt="Flyer de {e["tit"]}" style="position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;">' if e['img'] else portada_sin_flyer(e, radio))
    pastilla = (f'<span style="position: absolute; left: 10px; top: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 4px 10px; {META} color: {NAVY};">{e["dow"]} {e["dia"]} {e["mes"]}</span>'
                if fecha and e['img'] else '')
    tam = f'height: {alto}px;' if alto else 'aspect-ratio: 1 / 1;'
    return (f'<div style="position: relative; {tam} border: 1.5px solid {NAVY}; border-radius: {radio}px; overflow: hidden; background: #EFE8DA;">{dentro}{pastilla}{corazon(fav)}</div>')

def interesados(n, chico=True):
    if not n:
        return f'<span style="font-size: 12px; font-weight: 700; color: {MUTED};">Fecha de la facultad</span>'
    t = 18 if chico else 22
    avs = ''.join(f'<img src="{a}" alt="" style="width: {t}px; height: {t}px; box-sizing: border-box; border-radius: 999px; border: 1.5px solid #FFFFFF; margin-left: -6px;">' for a in ('av-crema.png', 'av-guino.png', 'av-birrete.png'))
    return (f'<span style="display: inline-flex; align-items: center; gap: 8px; font-size: {12 if chico else 13}px; font-weight: 700; color: {TEXT2};">'
            f'<span style="display: inline-flex; padding-left: 6px;">{avs}</span>{n} interesados</span>')

def tarjeta(e, fav=False):
    cerca = ge.estado('Facultad cercana', '#F1EEE4', TEXT2, 'pin') if e['alcance'] == 'Cercana' else ''
    return f'''      <article style="display: flex; flex-direction: column;">
        {imagen(e, fav=fav)}
        <h3 style="margin: 12px 0 0 0; font-size: 16.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{e['tit']}</h3>
        <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">{tipo_chip(e['tipo'], True)}{cerca}</div>
        <div style="margin-top: 8px; {META} color: {MUTED}; line-height: 1.5;">{e['dow']} {e['dia']} {e['mes']} · {e['hora']} · {e['lugar']}</div>
        <div style="margin-top: 8px;">{interesados(e['n'])}</div>
      </article>
'''

def boton_interes(on=False, grande=False):
    pad, fs = ('12px 18px', '15px') if grande else ('8px 12px', '13px')
    if on:
        return (f'<a href="#interes" aria-pressed="true" style="display: inline-flex; align-items: center; justify-content: center; gap: 7px; background: #FDF0C8; border: 1.5px solid {NAVY}; border-radius: 11px; padding: {pad}; font-size: {fs}; font-weight: 800; color: {NAVY}; white-space: nowrap;">'
                f'<svg width="16" height="16" viewBox="0 0 24 24" fill="#E9B949" stroke="{NAVY}" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true">{ESTRELLA}</svg>Me interesa</a>')
    return (f'<a href="#interes" aria-pressed="false" style="display: inline-flex; align-items: center; justify-content: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: {pad}; font-size: {fs}; font-weight: 700; color: {NAVY}; white-space: nowrap;">'
            f'{ico("estrella", 16, NAVY, 2)}Me interesa</a>')

def pildora(texto, activo=False, flecha=False):
    f = ico('abajo', 12, '#FFFFFF' if activo else NAVY, 2.5) if flecha else ''
    if activo:
        return f'<span style="display: inline-flex; align-items: center; gap: 6px; background: {NAVY}; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 8px 14px; {META} color: #FFFFFF;">{texto}{f}</span>'
    return f'<span style="display: inline-flex; align-items: center; gap: 6px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 8px 14px; {META} color: {NAVY};">{texto}{f}</span>'

def cabecera_eventos(vista):
    tabs = ''.join(f'<a href="#{v}" style="display: inline-flex; align-items: center; gap: 7px; padding: 0 2px 10px 2px; {META} font-size: 12.5px; '
                   f'{"color: " + BTN + "; border-bottom: 2.5px solid " + BTN + ";" if v == vista else "color: " + MUTED + ";"}">{ico(i, 15, BTN if v == vista else MUTED, 2.2)}{t}</a>'
                   for v, t, i in [('lista', 'Lista', 'lista'), ('mes', 'Mes', 'calendario')])
    chips = ''.join(pildora(t, a, f) for t, a, f in [('Mi facultad', True, True), ('Guardados', False, False), ('Hoy', False, False), ('Esta semana', False, False),
                                                       ('Fin de semana', False, False), ('Categoría', False, True), ('Horario', False, True), ('Gratis', False, False)])
    return f'''
  <section style="flex-shrink: 0; padding: 22px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;">
    <div style="padding-bottom: 14px;">
      {eyebrow('Eventos · FI UNJu y facultades cercanas')}
      <h1 style="margin: 12px 0 0 0; font-size: 68px; line-height: 0.92; font-weight: 800; letter-spacing: -0.058em;">Lo que pasa<br>en la <span style="color: {BLUE};">facu</span><span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 14px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 540px;">Charlas, talleres, competencias, fechas de la facultad y lo que organizan los centros de estudiantes.</p>
      <div style="margin-top: 18px; display: flex; gap: 10px;">{boton('Crear evento', 'mas')}{boton('Eventos que sigo', 'estrella', primario=False)}</div>
    </div>
    <img src="hero-campus.png" alt="El gato de DevsProject leyendo en la escalinata de la facultad" style="width: 470px; height: auto; margin-bottom: -6px;">
  </section>
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px;">
    <div style="display: flex; gap: 22px; border-bottom: 1.5px solid #E4DCCB;">{tabs}</div>
    <div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px;">{chips}</div>
  </section>
'''

# ================================================================ 1 · LISTADO
def p_listado():
    e = COMPETITIVA
    destacado = f'''    <article style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 16px; display: grid; grid-template-columns: 360px minmax(0, 1fr); gap: 28px; align-items: center;">
      {imagen(e, fecha=False)}
      <div style="padding-right: 12px;">
        <div style="display: flex; gap: 8px;"><span style="background: #C8FB10; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 3px 10px; {META} color: {NAVY};">Destacado</span>{tipo_chip(e['tipo'], True)}</div>
        <h2 style="margin: 14px 0 0 0; font-size: 44px; line-height: 0.96; font-weight: 800; letter-spacing: -0.05em;">{e['tit']}</h2>
        <div style="margin-top: 14px; {META} font-size: 13px; color: {TEXT2}; line-height: 1.7;">Sábado 17 de octubre · 17:30 a 20:30<br>{e['lugar']} · por {e['org']}</div>
        <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.55; font-weight: 500; color: {TEXT2}; max-width: 560px;">Tres horas de problemas en equipos de tres, con formato ICPC. Hay problemas para quienes arrancan y para quienes ya compiten.</p>
        <div style="margin-top: 18px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          {boton_interes(False, True)}
          {ga.accion('Calendario', 'calendario-mas').replace('padding: 10px 15px;', 'padding: 12px 18px;')}
          <a href="#inscripcion" style="display: inline-flex; align-items: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 12px 18px; font-size: 15px; font-weight: 800; color: #FFFFFF;">Inscribirme{ico('externo', 15, '#FFFFFF', 2.3)}</a>
          <span style="margin-left: 6px;">{interesados(e['n'], False)}</span>
        </div>
      </div>
    </article>
'''
    def grilla(titulo, sub, evs, favs=()):
        return (f'''    <div style="margin-top: 38px; display: flex; align-items: baseline; justify-content: space-between;">
      <h2 style="margin: 0; font-size: 30px; font-weight: 800; letter-spacing: -0.04em;">{titulo}</h2><span style="{META} color: {MUTED};">{sub}</span></div>
    <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 26px 20px;">
''' + ''.join(tarjeta(x, x['clave'] in favs) for x in evs) + '    </div>\n')
    cuerpo = (f'  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px;">\n{destacado}'
              + grilla('Esta semana', '25 al 30 de septiembre', [FUTBOL, GIT, MESAS, SEMANA], ('git',))
              + grilla('Octubre', '4 eventos más', [IA, MUESTRA, FISICA, CONGRESO], ('ia',))
              + f'''    <div style="margin-top: 34px; position: relative; background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 18px; padding: 24px 28px; display: flex; align-items: center; gap: 24px; overflow: hidden;">
      <div><h3 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">¿Organizás algo en la facu?</h3>
        <p style="margin: 6px 0 0 0; font-size: 14.5px; font-weight: 500; color: #45560F;">Subí el flyer, poné fecha y lugar, y listo: se publica al instante.</p></div>
      <span style="margin-left: auto; margin-right: 150px;">{boton('Crear evento', 'mas')}</span>
      <img src="gato-bocadillo.png" alt="" style="position: absolute; right: 10px; bottom: -8px; width: 150px; height: auto;">
    </div>
  </section>
''')
    return gx.header_logueado('Eventos') + cabecera_eventos('lista') + cuerpo

# ================================================================ 2 · VISTA DE MES
def p_mes():
    por_dia = {5: [SEMANA], 6: [SEMANA], 7: [SEMANA], 8: [SEMANA], 9: [SEMANA], 17: [COMPETITIVA], 21: [IA], 24: [FISICA], 29: [CONGRESO],
               14: [ev('x', None, '14', 'OCT', 'MIÉ', 'Consulta abierta de Álgebra', '', '', '', 'Tutoría grupal', 0)],
               22: [ev('x', None, '22', 'OCT', 'JUE', 'Muestra de proyectos finales', '', '', '', 'Charla', 0), ev('x', None, '22', 'OCT', 'JUE', 'Cine debate', '', '', '', 'Deportes y cultura', 0)]}
    celdas = ''.join(f'<div style="{META} color: {MUTED}; text-align: center; padding-bottom: 8px;">{d}</div>' for d in ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'])
    for d in [28, 29, 30]:
        celdas += f'<div style="height: 118px; border-radius: 12px; background: rgba(2,18,56,0.03);"></div>'
    for d in range(1, 32):
        lista = por_dia.get(d, [])
        items = ''.join(f'<div style="display: flex; gap: 5px; font-size: 11.5px; line-height: 1.25; font-weight: 700; color: {NAVY};"><span style="width: 6px; height: 6px; flex-shrink: 0; margin-top: 4px; border-radius: 999px; background: {TIPOS_EV[x["tipo"]][1]};"></span>{x["tit"]}</div>' for x in lista[:2])
        mas = f'<div style="margin-top: auto; {META} font-size: 10.5px; color: {BTN};">+{len(lista) - 2} más</div>' if len(lista) > 2 else ''
        sel = d == 17
        marco = (f'background: #FFFFFF; border: 2px solid {BTN}; box-shadow: 3px 3px 0 {NAVY};' if sel else
                 (f'background: #FFFFFF; border: 1.5px solid {NAVY};' if lista else 'background: rgba(255,255,255,0.55); border: 1.5px solid #E4DCCB;'))
        num = f'<span style="font-size: 15px; font-weight: 800; color: {BTN if sel else (NAVY if lista else MUTED)};">{d}</span>'
        miniatura = (f'<img src="{lista[0]["img"]}" alt="" style="width: 26px; height: 26px; border-radius: 7px; border: 1.5px solid {NAVY}; object-fit: cover;">'
                     if lista and lista[0]['img'] and d in (5, 17, 21, 24) else '')
        celdas += (f'<div style="position: relative; height: 118px; box-sizing: border-box; border-radius: 12px; {marco} padding: 9px 10px; display: flex; flex-direction: column; gap: 6px;">'
                   f'<div style="display: flex; align-items: center; justify-content: space-between; min-height: 26px;">{num}{miniatura}</div>{items}{mas}</div>')
    dia = [COMPETITIVA, ev('x', None, '17', 'OCT', 'SÁB', 'Feria de emprendedores UNJu', '11:00', 'Rectorado · patio', 'Secretaría de Extensión', 'Deportes y cultura', 19, alcance='UNJu')]
    filas = ''.join(f'''        <div style="display: flex; gap: 12px; padding: 14px 0; {"border-top: 1.5px solid " + LINEA + ";" if k else ""}">
          <div style="position: relative; width: 74px; height: 74px; flex-shrink: 0; border: 1.5px solid {NAVY}; border-radius: 12px; overflow: hidden;">{('<img src="' + x['img'] + '" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;">') if x['img'] else ('<div style="width: 100%; height: 100%; background: ' + TIPOS_EV[x['tipo']][0] + '; display: flex; align-items: center; justify-content: center;">' + ico(TIPOS_EV[x['tipo']][2], 28, TIPOS_EV[x['tipo']][1], 2) + '</div>')}</div>
          <div style="min-width: 0;"><div style="font-size: 15px; font-weight: 800; line-height: 1.25;">{x['tit']}</div>
            <div style="margin-top: 6px;">{tipo_chip(x['tipo'], True)}</div>
            <div style="margin-top: 6px; {META} font-size: 11px; color: {MUTED};">{x['hora']} · {x['lugar']}</div></div>
        </div>
''' for k, x in enumerate(dia))
    panel = f'''    <aside style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 20px 22px;">
      <div style="{META} color: {BTN};">Sábado</div>
      <h2 style="margin: 6px 0 0 0; font-size: 38px; line-height: 0.95; font-weight: 800; letter-spacing: -0.05em;">17 de octubre</h2>
      <div style="margin-top: 10px;">
{filas}      </div>
      <a href="#dia" style="margin-top: 10px; display: flex; justify-content: center; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 12px; {META} font-size: 12.5px; color: #FFFFFF;">Ver todo el día</a>
    </aside>
'''
    return (gx.header_logueado('Eventos') + cabecera_eventos('mes') + f'''
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 28px; align-items: start;">
    <div>
      <div style="display: flex; align-items: flex-end; gap: 14px; margin-bottom: 16px;">
        <h2 style="margin: 0; font-size: 52px; line-height: 0.9; font-weight: 800; letter-spacing: -0.05em; text-transform: uppercase;">Octubre</h2><span style="{META} color: {MUTED}; padding-bottom: 4px;">2026</span>
        <span style="margin-left: auto; display: flex; gap: 6px;">{ga.boton_icono('chev-izq', 'Mes anterior', 38)}{ga.boton_icono('chev-der', 'Mes siguiente', 38)}</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px;">{celdas}</div>
    </div>
{panel}  </section>
''')

# ================================================================ 3 · FICHA DEL EVENTO
def mapa():
    return f'''<div style="position: relative; height: 200px; border-radius: 14px; border: 1.5px solid {NAVY}; overflow: hidden; background: #F4EEDD;">
          <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path d="M-10 150 C 120 120, 220 190, 360 150 S 560 110, 620 140" fill="none" stroke="#BFD6F5" stroke-width="18"></path>
            <g stroke="#FFFFFF" stroke-width="12" fill="none"><path d="M0 60H600"></path><path d="M140 0V200"></path><path d="M330 0V200"></path><path d="M480 0V120"></path></g>
            <rect x="170" y="78" width="130" height="52" rx="6" fill="#D8F1E8" stroke="#1F8F6B" stroke-width="1.5"></rect>
            <rect x="360" y="80" width="90" height="46" rx="6" fill="#E5E8EF" stroke="#9AA3BD" stroke-width="1.5"></rect>
          </svg>
          <div style="position: absolute; left: 204px; top: 40px; display: flex; flex-direction: column; align-items: center;">
            <span style="background: {NAVY}; color: #FFFFFF; border-radius: 8px; padding: 5px 9px; font-size: 12px; font-weight: 800; white-space: nowrap;">FI · Aula 15</span>
            <svg width="26" height="32" viewBox="0 0 24 30" aria-hidden="true"><path d="M12 29s9-9.3 9-16a9 9 0 0 0-18 0c0 6.7 9 16 9 16z" fill="{PINK}" stroke="{NAVY}" stroke-width="1.6"></path><circle cx="12" cy="12.5" r="3.4" fill="#FFFFFF"></circle></svg>
          </div>
          <a href="#mapa" style="position: absolute; right: 10px; bottom: 10px; display: inline-flex; align-items: center; gap: 6px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 6px 10px; font-size: 12.5px; font-weight: 700; color: {NAVY};">Abrir en el mapa{ico('externo', 13, NAVY, 2.2)}</a>
        </div>'''

def p_detalle():
    e = COMPETITIVA
    miniaturas = ''.join(f'<div style="width: 92px; height: 92px; border-radius: 12px; overflow: hidden; border: {b};"><img src="{s}" alt="" style="width: 100%; height: 100%; object-fit: cover; {x}"></div>'
                         for s, b, x in [(e['img'], f'2.5px solid {PINK}', ''), (e['img'], f'1.5px solid {NAVY}', 'transform: scale(1.8); transform-origin: 50% 70%;'), (GIT['img'], f'1.5px solid {NAVY}', '')])
    info = ''.join(f'<div style="display: flex; gap: 10px; background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 12px; padding: 12px 14px; font-size: 13.5px; line-height: 1.45; font-weight: 600; color: {TEXT2};">{ico(i, 17, BTN, 2.1)}<span><b style="color: {NAVY};">{a}</b><br>{b}</span></div>'
                   for i, a, b in [('monitor', 'Llevá notebook', 'Una por equipo alcanza.'), ('gente', 'Equipos de 3', 'Si vas solo, te armamos equipo.'), ('codigo', 'C++, Java o Python', 'El lenguaje que quieras.'), ('reloj', 'De 17:30 a 20:30', 'Hay un corte con café.')])
    otras = ''.join(f'<div style="display: flex; align-items: center; padding: 11px 0; {"border-top: 1.5px solid " + LINEA + ";" if k else ""}"><span style="font-size: 14px; font-weight: 700;">{t}</span><a href="#ver" style="margin-left: auto; {META} color: {BTN};">Ver →</a></div>'
                    for k, t in enumerate(['Sábado 14 de noviembre · 17:30 · segunda fecha', 'Sábado 12 de diciembre · 17:30 · final del año']))
    principal = f'''    <div>
      <div style="position: relative; height: 620px; border: 1.5px solid {NAVY}; border-radius: 22px; overflow: hidden; box-shadow: 6px 6px 0 {NAVY};"><img src="{e['img']}" alt="" aria-hidden="true" style="position: absolute; inset: -40px; width: calc(100% + 80px); height: calc(100% + 80px); object-fit: cover; filter: blur(28px) saturate(1.2); opacity: 0.85;"><img src="{e['img']}" alt="Flyer de la Jornada de Programación Competitiva" style="position: relative; width: 100%; height: 100%; object-fit: contain; display: block;">
        <span style="position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); display: flex; gap: 6px;"><span style="width: 18px; height: 6px; border-radius: 99px; background: #FFFFFF;"></span><span style="width: 6px; height: 6px; border-radius: 99px; background: rgba(255,255,255,0.55);"></span><span style="width: 6px; height: 6px; border-radius: 99px; background: rgba(255,255,255,0.55);"></span></span></div>
      <div style="margin-top: 12px; display: flex; gap: 10px;">{miniaturas}</div>
      <div style="margin-top: 26px; display: flex; gap: 8px;">{tipo_chip(e['tipo'], True)}{ge.estado('Gratis', ga.VERDE_BG, ga.VERDE_TX, 'check')}</div>
      <h1 style="margin: 14px 0 0 0; font-size: 70px; line-height: 0.92; font-weight: 800; letter-spacing: -0.058em; text-transform: uppercase;">Jornada de programación <span style="color: {BLUE};">competitiva</span></h1>
      <p style="margin: 18px 0 0 0; font-size: 16.5px; line-height: 1.65; font-weight: 500; color: {TEXT2}; max-width: 720px;">Tres horas para resolver problemas en equipos de tres, con el formato de las competencias ICPC. Hay problemas para quienes recién arrancan y para quienes ya compiten. Al final repasamos las soluciones juntos.</p>
      <div style="margin-top: 18px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; max-width: 760px;">{info}</div>
      <div style="margin-top: 34px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px;">
        <div><h2 style="margin: 0 0 10px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.04em; text-transform: uppercase;">Otras fechas</h2>{otras}</div>
        <div><h2 style="margin: 0 0 10px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.04em; text-transform: uppercase;">Quién organiza</h2>
          <div style="display: flex; align-items: center; gap: 12px;">{ga.tile('codigo', '#FED3DF', '#E01F63', 48, 13)}<div><div style="font-size: 15px; font-weight: 800;">Club de Programación FI</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">✓ Organizador verificado · 6 eventos este año · 212 seguidores</div></div></div>
          <div style="margin-top: 12px;">{boton('Siguiendo', 'check', primario=False, chico=True)}</div></div>
      </div>
      <div style="margin-top: 34px;"><h2 style="margin: 0 0 12px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.04em; text-transform: uppercase;">Dónde</h2>{mapa()}
        <div style="margin-top: 10px; font-size: 13.5px; font-weight: 600; color: {TEXT2};">Facultad de Ingeniería · planta baja, al lado del laboratorio 3.</div></div>
    </div>
'''
    lateral = f'''    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 22px 22px 20px 22px;">
        <div style="{META} color: {BTN};">Esta fecha</div>
        <h2 style="margin: 6px 0 0 0; font-size: 34px; line-height: 0.95; font-weight: 800; letter-spacing: -0.05em; text-transform: uppercase;">Sábado 17 de octubre · 17:30</h2>
        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 9px;">
          <a href="#inscripcion" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 13px 16px; font-size: 15px; font-weight: 800; color: #FFFFFF;">Inscribirme{ico('externo', 16, '#FFFFFF', 2.3)}</a>
          <div style="font-size: 11.5px; font-weight: 600; color: {MUTED}; text-align: center;">Te lleva al formulario del Club de Programación.</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">{boton_interes(True)}{ga.accion('Guardar', 'marcador').replace('display: inline-flex;', 'display: flex; justify-content: center;').replace('padding: 10px 15px;', 'padding: 8px 12px; font-size: 13px;')}</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">{ga.accion('Calendario', 'calendario-mas').replace('display: inline-flex;', 'display: flex; justify-content: center;').replace('padding: 10px 15px;', 'padding: 8px 12px; font-size: 13px;')}{ga.accion('Compartir', 'compartir').replace('display: inline-flex;', 'display: flex; justify-content: center;').replace('padding: 10px 15px;', 'padding: 8px 12px; font-size: 13px;')}</div>
        </div>
        <div style="margin-top: 16px; padding-top: 14px; border-top: 1.5px solid {LINEA}; display: flex; flex-direction: column; gap: 10px;">
          {interesados(e['n'], False)}
          <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">{ico('gente', 16, BTN, 2.1)}Cupo: 40 lugares<span style="font-weight: 600; color: {MUTED};">· lo indica el organizador</span></div>
        </div>
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1.5px solid {LINEA};"><div style="{META} color: {BTN};">Dónde</div>
          <div style="margin-top: 5px; font-size: 16px; font-weight: 800; text-decoration: underline;">FI · Aula 15</div><div style="{META} font-size: 11px; color: {MUTED};">Facultad de Ingeniería · UNJu</div></div>
        <div style="margin-top: 14px; padding-top: 14px; border-top: 1.5px solid {LINEA}; display: flex; align-items: center; gap: 12px;">
          {ico('campana', 18, NAVY, 2.1)}<div><div style="font-size: 13.5px; font-weight: 800;">Recordarme</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Un día antes y una hora antes</div></div>
          <span style="margin-left: auto;">{ga.interruptor(True)}</span>
        </div>
      </div>
      <a href="#link" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 11px; {META} color: {NAVY};">{ico('enlace', 15, NAVY, 2.2)}Copiar link</a>
      <a href="#reportar" style="align-self: center; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: {TEXT2};">{ico('bandera', 14, TEXT2, 2)}Reportar evento</a>
    </aside>
'''
    return (gx.header_logueado('Eventos') + breadcrumb(['Eventos', 'Octubre', 'Jornada de Programación Competitiva'])
            + f'''
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 40px; align-items: start;">
{principal}{lateral}  </section>
''')

# ================================================================ 4 · CREAR EVENTO
def p_crear():
    e = COMPETITIVA
    subida = f'''<div style="display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 20px; align-items: start;">
          <div style="position: relative; aspect-ratio: 1 / 1; border: 2px solid {NAVY}; border-radius: 16px; overflow: hidden;"><img src="{e['img']}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            <span style="position: absolute; left: 8px; bottom: 8px; background: {NAVY}; color: #FFFFFF; border-radius: 7px; padding: 3px 8px; font-size: 11px; font-weight: 800;">Portada</span></div>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; gap: 10px;">
              <div style="width: 84px; height: 84px; border: 1.5px solid {NAVY}; border-radius: 12px; overflow: hidden;"><img src="{e['img']}" alt="" style="width: 100%; height: 100%; object-fit: cover; transform: scale(1.8); transform-origin: 50% 70%;"></div>
              <div style="width: 84px; height: 84px; box-sizing: border-box; border: 2px dashed #8FA9E6; background: #F4F8FF; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11.5px; font-weight: 800; color: {BTN};">{ico('imagen', 20, BTN, 2)}Agregar</div>
              <div style="width: 84px; height: 84px; box-sizing: border-box; border: 1.5px dashed #D9D0BE; border-radius: 12px;"></div>
            </div>
            <div style="display: flex; gap: 8px;">{boton('Recortar', 'recortar', primario=False, chico=True)}{boton('Cambiar imagen', 'subir', primario=False, chico=True)}</div>
            <p style="margin: 0; font-size: 12.5px; line-height: 1.5; font-weight: 600; color: {MUTED};">Cuadrada o vertical (4:5), hasta 3 imágenes. La primera es la portada. Si no subís ninguna, armamos una portada con el título y el color del tipo.</p>
          </div>
        </div>'''
    tipos = '<div style="display: flex; flex-wrap: wrap; gap: 7px;">' + ''.join(ga.pastilla(t, i, f, c, t == 'Competencia') for t, (f, c, i) in TIPOS_EV.items()) + '</div>'
    titulo = 'Jornada de Programación Competitiva'
    desc = 'Tres horas de problemas en equipos de tres, con formato ICPC. Hay problemas para quienes arrancan y para quienes ya compiten.'
    que = f'''<div style="display: flex; flex-direction: column; gap: 16px;">
          {gx.campo('Nombre del evento', ga.entrada(titulo, f'{len(titulo)} / 90'), 'obligatorio')}
          {gx.campo('Tipo', tipos, 'obligatorio')}
          {gx.campo('Descripción', ga.area(desc, f'{len(desc)} / 1500', 80), 'obligatorio', ayuda='Contá qué se hace, para quién es y qué hay que llevar.')}
        </div>'''
    cuando = f'''<div style="display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 16px 18px;">
          {gx.campo('Fecha', gx.selector('Sábado 17 de octubre de 2026'), 'obligatorio')}
          {gx.campo('Empieza', gx.selector('17:30'), 'obligatorio')}
          {gx.campo('Termina', gx.selector('20:30'))}
        </div>
        <div style="margin-top: 14px;">{ga.fila_ajuste('Tiene más de una fecha', 'Por ejemplo, un ciclo de talleres. Cada fecha aparece en el calendario.', ga.interruptor(True), False)}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">{gx.chip_borrable('Sáb 14 nov · 17:30')}{gx.chip_borrable('Sáb 12 dic · 17:30')}{gx.chip_sugerido('Agregar fecha')}</div>'''
    donde = f'''{gx.fila_opciones(['Presencial', 'Virtual', 'Presencial y virtual'], 'Presencial')}
        <div style="margin-top: 14px; display: grid; grid-template-columns: 1.3fr 1fr; gap: 16px 18px;">
          {gx.campo('Lugar', gx.selector('Facultad de Ingeniería · UNJu'), 'obligatorio')}
          {gx.campo('Aula o espacio', ga.entrada('Aula 15'))}
        </div>
        <div style="margin-top: 14px;">{gx.campo('¿Para quiénes es?', gx.fila_opciones(['Mi facultad', 'Toda la UNJu', 'Abierto a todos'], 'Toda la UNJu'), 'obligatorio', ayuda='Define en qué filtros aparece. Igual lo ve cualquiera que lo busque.')}</div>'''
    inscripcion = f'''<div style="display: flex; flex-direction: column; gap: 16px;">
          {gx.campo('Link de inscripción', ga.entrada('forms.gle/club-programacion-fi', prefijo='https://'), ayuda='Si hay que anotarse, pegá acá tu formulario. DevsProject no toma inscripciones ni cobra entradas.')}
          <div style="display: grid; grid-template-columns: 1fr 1.4fr; gap: 16px 18px;">
            {gx.campo('Cupo', gx.stepper('40', 'lugares'), ayuda='Informativo: lo controla el organizador.')}
            {gx.campo('Costo', gx.fila_opciones(['Gratis', 'Con costo'], 'Gratis'))}
          </div>
        </div>'''
    organiza = f'''<div style="display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 12px; border: 1.5px solid #CFC5B0; border-radius: 12px; padding: 12px 14px;">{ga.radio(False)}<img src="av-max.png" alt="" style="width: 34px; height: 34px; border-radius: 999px; border: 1.5px solid {NAVY};"><div><div style="font-size: 14px; font-weight: 800;">A mi nombre</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Max · @max</div></div></div>
          <div style="display: flex; align-items: center; gap: 12px; background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 12px; padding: 12px 14px;">{ga.radio(True)}{ga.tile('codigo', '#FED3DF', '#E01F63', 34, 10)}<div><div style="font-size: 14px; font-weight: 800;">Club de Programación FI</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Sos parte de esta agrupación</div></div><span style="margin-left: auto;">{ge.estado('Verificada', ga.VERDE_BG, ga.VERDE_TX, 'check')}</span></div>
          <a href="#agrupacion" style="font-size: 13px; font-weight: 700; color: {BLUE};">+ Publicar en nombre de otra agrupación</a>
        </div>'''
    cierre = f'''{ga.aviso('info', 'Se publica al instante. Como lo publicás en nombre del Club de Programación, que está verificado, el evento muestra «✓ Organizador verificado».')}
        <div style="margin-top: 14px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.45; font-weight: 600; color: {TEXT2};">{ga.casilla(True)}<span>Es un evento real y relacionado con la vida universitaria. No es publicidad de un negocio.</span></div>
        <div style="margin-top: 16px; display: flex; align-items: center; gap: 10px;">
          <a href="#borrador" style="font-size: 14px; font-weight: 700; color: {TEXT2};">Guardar borrador</a>
          <span style="margin-left: auto; display: flex; gap: 10px;">{boton('Cancelar', primario=False)}{boton('Publicar evento', 'check')}</span>
        </div>'''
    bloques = (gx.bloque(1, 'Imagen del evento', subida, 'Lo primero que se ve')
               + gx.bloque(2, 'Qué es', que) + gx.bloque(3, 'Cuándo', cuando) + gx.bloque(4, 'Dónde', donde)
               + gx.bloque(5, 'Inscripción y cupo', inscripcion, 'Opcional') + gx.bloque(6, 'Quién organiza', organiza) + gx.bloque(7, 'Publicación', cierre))
    previa = (f'<div style="{CARD} padding: 14px;">' + tarjeta(e).replace('<article style="display: flex; flex-direction: column;">', '<article style="display: flex; flex-direction: column;">').replace(f"{e['n']} interesados", 'Nuevo · 0 interesados') + '</div>'
              + f'''      <div style="position: relative; {CARD} padding: 18px 20px; overflow: hidden; min-height: 176px; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -0.02em;">Un buen evento…</h3>
        <div style="margin-top: 11px; display: flex; flex-direction: column; gap: 9px; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2}; max-width: 222px;">
          {''.join(f'<span style="display: flex; gap: 8px;">{ico("check", 15, ga.VERDE_TX, 2.6)}<span>{t}</span></span>' for t in ['tiene un flyer que se lee en chiquito.', 'dice para quién es.', 'aclara si hay que anotarse.'])}</div>
        <img src="gato-idea.png" alt="" style="position: absolute; right: 2px; bottom: -6px; width: 112px; height: auto;">
      </div>
''')
    return (gx.header_logueado('Eventos') + breadcrumb(['Eventos', 'Crear evento']) + f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px;">
    {eyebrow('Nuevo evento')}
    <h1 style="margin: 14px 0 0 0; font-size: 64px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em;">Publicá un <span style="color: {BLUE};">evento</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 14px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Charlas, talleres, torneos o repasos: si pasa en el ambiente universitario, va acá. Publicar es gratis.</p>
  </section>
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 14px;">
{bloques}    </div>
    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">{ico('ojo', 15, MUTED, 2)}ASÍ SE VA A VER</div>
{previa}    </aside>
  </section>
''')

# ================================================================ 5 · BLOQUES PARA PORTADA Y MOCHILA
def bloque_portada():
    tarjetas = ''.join(tarjeta(x) for x in [GIT, COMPETITIVA, IA])
    return f'''  <!-- eventos -->
  <section id="eventos" style="flex-shrink: 0; margin-top: 46px; padding: 0 64px;">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;">
      <div>
        <div style="display: inline-flex; align-items: center; gap: 9px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.17em; text-transform: uppercase; color: {BLUE};"><span style="width: 8px; height: 8px; background: {BLUE}; display: block;"></span>Eventos</div>
        <h2 style="margin: 10px 0 0 0; font-size: 31px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">Próximamente en la FI</h2>
        <p style="margin: 7px 0 0 0; font-size: 15.5px; font-weight: 500; color: {MUTED};">Charlas, talleres y fechas de la facultad. Marcá los que te interesan y te avisamos.</p>
      </div>
      <a href="#eventos" style="display: inline-flex; align-items: center; gap: 7px; font-size: 14.5px; font-weight: 700; color: {BLUE}; padding-bottom: 4px;">Ver calendario {ico('flecha', 15, BLUE, 2.4)}</a>
    </div>
    <div style="margin-top: 18px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; align-items: start;">
      <div style="position: relative; aspect-ratio: 1 / 1; box-sizing: border-box; background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 20px; overflow: hidden;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: #45560F;">ESTA SEMANA</div>
        <div style="margin-top: 8px; font-size: 52px; font-weight: 800; letter-spacing: -0.05em; line-height: 1;">4 <span style="font-size: 20px; letter-spacing: -0.02em;">eventos</span></div>
        <p style="margin: 8px 0 0 0; font-size: 13.5px; line-height: 1.45; font-weight: 600; color: #45560F; max-width: 190px;">Y el miércoles 30 cierra la inscripción a mesas.</p>
        <img src="hero-campus.png" alt="" style="position: absolute; right: -50px; bottom: -8px; width: 250px; height: auto;">
      </div>
{tarjetas}    </div>
  </section>

'''

def bloque_mochila():
    filas = ''.join(f'<a href="#evento" style="display: flex; align-items: center; gap: 12px; padding: 9px 0; {"border-top: 1.5px solid " + LINEA + ";" if k else ""} color: {NAVY};">'
                    f'<img src="{x["img"]}" alt="" style="width: 46px; height: 46px; flex-shrink: 0; border-radius: 10px; border: 1.5px solid {NAVY}; object-fit: cover;">'
                    f'<span style="min-width: 0;"><span style="display: block; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: {BTN};">{x["dow"]} {x["dia"]} {x["mes"]} · {x["hora"]}</span>'
                    f'<span style="display: block; font-size: 13.5px; font-weight: 800; line-height: 1.3;">{t}</span></span></a>'
                    for k, (x, t) in enumerate([(COMPETITIVA, 'Programación competitiva'), (IA, 'Charla de IA'), (FISICA, 'Repaso grupal de Física')]))
    return f'''      <div style="{CARD} padding: 18px 20px 12px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Próximos eventos</h2>{ico('estrella', 18, '#E9B949', 2.2)}</div>
        <p style="margin: 6px 0 0 0; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {MUTED};">Los que marcaste con «Me interesa» y los de organizadores que seguís.</p>
        <div style="margin-top: 4px;">{filas}</div>
        <a href="#calendario" style="margin-top: 4px; display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: {BLUE};">Ver calendario {ico('flecha', 14, BLUE, 2.4)}</a>
      </div>
'''

PAGINAS = [
    ('EventosListado.dc.html', 'DevsProject · Eventos', p_listado, 2000),
    ('EventosMes.dc.html', 'DevsProject · Eventos de octubre', p_mes, 1200),
    ('EventoDetalle.dc.html', 'DevsProject · Jornada de Programación Competitiva', p_detalle, 1900),
    ('CrearEvento.dc.html', 'DevsProject · Crear evento', p_crear, 2600),
]
if __name__ == '__main__':
    for archivo, titulo, fn, alto in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(gx.documento(titulo, alto, '', fn()))
        print('escrito', archivo, alto)
    p = os.path.join(OUT, 'Main.dc.html'); s = open(p, encoding='utf-8').read()
    if '<!-- eventos -->' in s:
        s = s[:s.index('  <!-- eventos -->')] + s[s.index('  <!-- experiencias -->'):]
    s = s.replace('  <!-- experiencias -->', bloque_portada() + '  <!-- experiencias -->', 1)
    open(p, 'w', encoding='utf-8').write(s)
    print('portada con bloque de eventos')

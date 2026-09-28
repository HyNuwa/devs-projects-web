# Genera las pantallas de accion que faltaban: detalle de recurso y subir material (popups sobre la
# pagina de la materia), publicar en Clasificados (venta y tutoria) y Configuracion (Mi espacio).
# Uso: python generar_acciones.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, estrellas, eyebrow, breadcrumb, monograma, estado_activo, ICONOS, ESTRELLA,
                     TIPO, TIPOS, CARD, PLAN, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2, p_materia)
import generar_experiencias as gx
import generar_espacio as ge
import generar_clasificados as gc

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

ICONOS.update({
    'descargar': '<path d="M12 4v11"></path><path d="m7 10 5 5 5-5"></path><path d="M5 20h14"></path>',
    'chev-izq': '<path d="m15 5-7 7 7 7"></path>',
    'chev-der': '<path d="m9 5 7 7-7 7"></path>',
    'menos': '<path d="M5 12h14"></path>',
    'expandir': '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"></path>',
    'externo': '<path d="M14 4h6v6"></path><path d="M20 4 11 13"></path><path d="M19 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4"></path>',
    'imagen': '<rect x="3" y="4" width="18" height="16" rx="2.5"></rect><circle cx="9" cy="10" r="2"></circle><path d="m21 16-5-5-9 9"></path>',
    'alerta': '<path d="M12 3.5 2.5 20h19z"></path><path d="M12 10v4.5M12 17.2h.01"></path>',
    'telefono': '<rect x="7" y="2.5" width="10" height="19" rx="2.5"></rect><path d="M11 18h2"></path>',
    'arroba': '<circle cx="12" cy="12" r="4"></circle><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"></path>',
    'etiqueta': '<path d="M3 12V4h8l10 10-8 8z"></path><circle cx="7.5" cy="8.5" r="1.5"></circle>',
    'camara': '<path d="M4 8h3l2-3h6l2 3h3v11H4z"></path><circle cx="12" cy="13" r="3.5"></circle>',
    'llave': '<circle cx="8" cy="15" r="4"></circle><path d="m11 12 9-9M17 6l3 3M15 8l2 2"></path>',
    'basura': '<path d="M4 7h16"></path><path d="M10 11v6M14 11v6"></path><path d="M6 7l1 13h10l1-13"></path><path d="M9 7V4h6v3"></path>',
})

LINEA = '#EFE7D8'
CREMA = '#FBF7EE'
VERDE_BG, VERDE_TX, ROJO_BG, ROJO_TX = '#E1F5E4', '#1F7A37', '#FDE2E2', '#B42318'
SERIF = 'family=Source+Serif+4:ital,wght@0,400;0,700;1,400&family=Caveat'

# ================================================================ piezas comunes
def accion(texto, icono, primario=False, color_ic=None, extra=''):
    fondo = f'background: {BTN}; color: #FFFFFF;' if primario else f'background: #FFFFFF; color: {NAVY};'
    c = color_ic or ('#FFFFFF' if primario else NAVY)
    return (f'<a href="#accion" style="display: inline-flex; align-items: center; gap: 8px; {fondo} border: 1.5px solid {NAVY}; border-radius: 11px; '
            f'padding: 10px 15px; font-size: 14px; font-weight: 700; white-space: nowrap;">{ico(icono, 17, c, 2.2)}{texto}{extra}</a>')

def boton_icono(icono, etiqueta, tam=40, color=NAVY, borde=NAVY, fondo='#FFFFFF'):
    return (f'<a href="#cerrar" aria-label="{etiqueta}" style="width: {tam}px; height: {tam}px; flex-shrink: 0; box-sizing: border-box; display: flex; align-items: center; justify-content: center; '
            f'background: {fondo}; border: 1.5px solid {borde}; border-radius: 11px;">{ico(icono, round(tam * 0.45), color, 2.3)}</a>')

def mini(icono, etiqueta):   # boton de la barra del visor
    return (f'<span role="button" aria-label="{etiqueta}" style="width: 30px; height: 30px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px;">'
            f'{ico(icono, 17, NAVY, 2.1)}</span>')

def tecla(t):
    return (f'<kbd style="display: inline-block; min-width: 12px; text-align: center; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-bottom-width: 3px; '
            f'border-radius: 6px; padding: 0 6px; font-family: inherit; font-size: 11px; font-weight: 800; color: {NAVY};">{t}</kbd>')

def separador(alto=22, margen=0):
    return f'<span aria-hidden="true" style="width: 1.5px; height: {alto}px; margin: 0 {margen}px; background: #E4DCCB; flex-shrink: 0;"></span>'

def estrellas_parcial(valor, tam=15):
    llenas, resto = int(valor), round(valor - int(valor), 2)
    html = ''
    for i in range(5):
        fill = '#E9B949' if i < llenas else ('url(#estrella-parcial)' if i == llenas and resto else '#DDD6C6')
        html += f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="{fill}" aria-hidden="true">{ESTRELLA}</svg>'
    defs = (f'<svg width="0" height="0" style="position: absolute;" aria-hidden="true"><defs><linearGradient id="estrella-parcial">'
            f'<stop offset="{resto * 100:.0f}%" stop-color="#E9B949"></stop><stop offset="{resto * 100:.0f}%" stop-color="#DDD6C6"></stop></linearGradient></defs></svg>')
    return defs + html

def entrada(valor, contador='', prefijo='', grande=False):
    pre = f'<span style="color: {MUTED}; font-weight: 600;">{prefijo}</span>' if prefijo else ''
    cont = f'<span style="margin-left: auto; padding-left: 10px; font-size: 11.5px; font-weight: 700; color: {MUTED}; white-space: nowrap;">{contador}</span>' if contador else ''
    tam, pad, peso = ('22px', '7px 14px', 800) if grande else ('14px', '10px 12px', 700)
    return (f'<div style="display: flex; align-items: center; gap: 5px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: {pad}; '
            f'font-size: {tam}; font-weight: {peso}; letter-spacing: {"-0.02em" if grande else "0"};">{pre}<span>{valor}</span>{cont}</div>')

def area(texto, contador, alto=64, apagado=False):
    return (f'<div style="position: relative; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 10px 12px 24px 12px; min-height: {alto}px; '
            f'box-sizing: border-box; font-size: 13.5px; line-height: 1.5; font-weight: 500; color: {MUTED if apagado else NAVY};">{texto}'
            f'<span style="position: absolute; right: 12px; bottom: 6px; font-size: 11px; font-weight: 700; color: {MUTED};">{contador}</span></div>')

def casilla(on=True, tam=20):
    if on:
        return (f'<span style="width: {tam}px; height: {tam}px; flex-shrink: 0; box-sizing: border-box; border-radius: 6px; background: {BTN}; border: 1.5px solid {NAVY}; '
                f'display: flex; align-items: center; justify-content: center;">{ico("check", 13, "#FFFFFF", 3)}</span>')
    return f'<span style="width: {tam}px; height: {tam}px; flex-shrink: 0; box-sizing: border-box; border-radius: 6px; background: #FFFFFF; border: 1.5px solid #B9AE96; display: block;"></span>'

def radio(on):
    if on:
        return (f'<span style="width: 18px; height: 18px; flex-shrink: 0; box-sizing: border-box; border-radius: 999px; background: {BTN}; border: 1.5px solid {NAVY}; '
                f'display: flex; align-items: center; justify-content: center;"><span style="width: 6px; height: 6px; border-radius: 999px; background: #FFFFFF;"></span></span>')
    return '<span style="width: 18px; height: 18px; flex-shrink: 0; box-sizing: border-box; border-radius: 999px; background: #FFFFFF; border: 1.5px solid #B9AE96; display: block;"></span>'

def interruptor(on=True):
    if on:
        return (f'<span role="switch" aria-checked="true" style="width: 44px; height: 26px; flex-shrink: 0; box-sizing: border-box; border-radius: 999px; background: {BTN}; '
                f'border: 1.5px solid {NAVY}; position: relative; display: block;"><span style="position: absolute; right: 3px; top: 3px; width: 17px; height: 17px; border-radius: 999px; background: #FFFFFF;"></span></span>')
    return ('<span role="switch" aria-checked="false" style="width: 44px; height: 26px; flex-shrink: 0; box-sizing: border-box; border-radius: 999px; background: #E4DCCB; '
            'border: 1.5px solid #B9AE96; position: relative; display: block;"><span style="position: absolute; left: 3px; top: 3px; width: 17px; height: 17px; box-sizing: border-box; border-radius: 999px; background: #FFFFFF; border: 1.5px solid #B9AE96;"></span></span>')

def pastilla(texto, icono, fondo, color, sel):   # opcion con color de categoria o de tipo
    if sel:
        return (f'<span style="display: inline-flex; align-items: center; gap: 6px; background: {fondo}; border: 2px solid {NAVY}; border-radius: 999px; padding: 5px 12px 5px 9px; '
                f'font-size: 12.5px; font-weight: 800; white-space: nowrap;">{ico("check", 13, NAVY, 2.8)}{texto}</span>')
    return (f'<span style="display: inline-flex; align-items: center; gap: 6px; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 999px; padding: 5.5px 12px 5.5px 9px; '
            f'font-size: 12.5px; font-weight: 700; color: {TEXT2}; white-space: nowrap;">{ico(icono, 13, color, 2.2)}{texto}</span>')

def fila_pastillas(items, activa):
    return '<div style="display: flex; flex-wrap: wrap; gap: 7px;">' + ''.join(pastilla(t, ic, f, c, t == activa) for t, ic, f, c in items) + '</div>'

def tile(icono, fondo, color, tam=38, radio_=10):
    return (f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex-shrink: 0; box-sizing: border-box; border-radius: {radio_}px; border: 1.5px solid {NAVY}; background: {fondo}; '
            f'display: flex; align-items: center; justify-content: center;">{ico(icono, round(tam * 0.47), color, 2.1)}</span>')

def aviso(icono, html, fondo='#ECF2FE', color=BTN):
    return (f'<div style="display: flex; align-items: center; gap: 10px; background: {fondo}; border-radius: 11px; padding: 10px 14px; font-size: 12.5px; line-height: 1.45; font-weight: 600; color: {TEXT2};">'
            f'{ico(icono, 17, color, 2.1)}<span>{html}</span></div>')

def popup(ancho, alto, izq, arriba, etiqueta, contenido):
    return (f'  <div aria-hidden="true" style="position: absolute; inset: 0; z-index: 10; background: rgba(2,18,56,0.56); backdrop-filter: blur(2.5px);"></div>\n'
            f'  <div role="dialog" aria-modal="true" aria-label="{etiqueta}" style="position: absolute; z-index: 11; left: {izq}px; top: {arriba}px; width: {ancho}px; height: {alto}px; '
            f'box-sizing: border-box; background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 20px; box-shadow: 8px 8px 0 {NAVY}; overflow: hidden; display: flex; flex-direction: column;">\n'
            f'{contenido}  </div>\n')

def fondo_materia():   # la pagina de la materia queda detras del popup, con sesion iniciada
    return gx.header_logueado('Materias') + p_materia()

# ================================================================ 1 · DETALLE DE RECURSO (popup)
EJ1 = [(0, 'def es_primo(n):'), (1, 'if n &lt; 2:'), (2, 'return False'), (1, 'for d in range(2, n):'),
       (2, 'if n % d == 0:'), (3, 'return False'), (1, 'return True')]
EJ2 = [(0, 'notas = [8, 5, 7, 10, 6]'), (0, 'suma = 0'), (0, 'promo = 0'), (0, 'for nota in notas:'),
       (1, 'suma = suma + nota'), (1, 'if nota &gt;= 7:'), (2, 'promo = promo + 1'), (0, 'print(suma / len(notas), promo)')]

def codigo(lineas):
    return ''.join(f'<div style="padding-left: {n * 24}px;">{t}</div>' for n, t in lineas)

def hoja():
    mano = "font-family: 'Caveat', cursive; font-size: 21px; font-weight: 600; line-height: 1.12; color: #1D3FB0;"
    rojo = "font-family: 'Caveat', cursive; font-weight: 700; color: #D6342C;"
    gris = 'color: #5A5A5A;'
    return f'''        <div style="width: 620px; flex-shrink: 0; align-self: flex-start; box-sizing: border-box; background: #FFFFFF; border: 1px solid #D9D0BE; box-shadow: 0 3px 0 rgba(2,18,56,0.08); padding: 38px 54px 60px 54px; font-family: 'Source Serif 4', Georgia, serif; color: #1B1B1B;">
          <div style="display: flex; justify-content: space-between; font-family: 'Figtree', sans-serif; font-size: 9.5px; font-weight: 700; letter-spacing: 0.12em; {gris}"><span>UNIVERSIDAD NACIONAL DE JUJUY · FACULTAD DE INGENIERÍA</span><span>TEMA A</span></div>
          <div style="margin-top: 14px; font-size: 20px; font-weight: 700;">Introducción a la Programación — Primer parcial</div>
          <div style="margin-top: 4px; font-size: 12.5px; color: #4A4A4A;">Ciclo lectivo 2025 · Duración: 2 horas · Puntaje total: 100</div>
          <div style="margin-top: 14px; display: flex; align-items: center; gap: 8px; font-size: 12.5px;">Apellido y nombre:<span style="display: inline-block; width: 200px; height: 14px; background: #1B1B1B; border-radius: 2px;"></span></div>
          <div style="margin-top: 22px; font-size: 14.5px; font-weight: 700;">Ejercicio 1 <span style="font-weight: 400; {gris}">(30 puntos)</span></div>
          <p style="margin: 6px 0 0 0; font-size: 13.5px; line-height: 1.5;">Escribí una función <i>es_primo(n)</i> que devuelva <i>True</i> si el entero <i>n</i> es primo y <i>False</i> en caso contrario.</p>
          <div style="position: relative; margin-top: 10px; padding-left: 14px; border-left: 2px solid #C9D6F5; {mano}">
            {codigo(EJ1)}
            <span style="position: absolute; right: 8px; top: 30px; {rojo} font-size: 27px; line-height: 1.1; border: 2.5px solid #D6342C; border-radius: 50%; padding: 2px 13px; transform: rotate(-8deg);">30</span>
          </div>
          <div style="margin-top: 20px; font-size: 14.5px; font-weight: 700;">Ejercicio 2 <span style="font-weight: 400; {gris}">(35 puntos)</span></div>
          <p style="margin: 6px 0 0 0; font-size: 13.5px; line-height: 1.5;">Dada una lista con las notas de un curso, mostrá el promedio y cuántos estudiantes promocionaron (nota ≥ 7).</p>
          <div style="position: relative; margin-top: 10px; padding-left: 14px; border-left: 2px solid #C9D6F5; {mano}">
            {codigo(EJ2)}
            <span style="position: absolute; right: 0; top: 40px; width: 160px; {rojo} font-size: 20px; line-height: 1.05; transform: rotate(-4deg);">← bien: el contador arranca en 0</span>
          </div>
        </div>
'''

COMENTARIOS = [
    (gx.avatar('av-guino.png', 34), 'Juli R.', 5, 'hace 2 días', 'La corrección del ejercicio 2 me salvó: explica por qué el contador tiene que arrancar en cero.'),
    (gx.iniciales('TG', '#FDE7D0', '#B14C06', 34), 'Tomás G.', 4, 'hace 1 semana', 'Sirve mucho para practicar. Ojo: en el tema B de este año cambió el ejercicio 3.'),
    (gx.avatar('av-crema.png', 34), 'Sofi C.', 5, 'hace 2 semanas', 'Muy prolijo. Estaría bueno que alguien suba también el recuperatorio.'),
]

def comentario(av, nombre, n, cuando, texto):
    return f'''        <div style="display: flex; gap: 11px; padding: 13px 0; border-bottom: 1.5px dashed {LINEA};">
          {av}
          <div style="min-width: 0;">
            <div style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 13.5px; font-weight: 800;">{nombre}</span><span style="display: flex; gap: 1px;">{estrellas(n, 11)}</span></div>
            <div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{cuando}</div>
            <p style="margin: 6px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2};">{texto}</p>
          </div>
        </div>
'''

def p_detalle():
    _, _, t_ic, t_f, t_c = TIPO['Parcial']
    cabecera = f'''    <div style="flex-shrink: 0; display: flex; align-items: center; gap: 16px; padding: 16px 18px 16px 22px; border-bottom: 1.5px solid {LINEA};">
      {tile(t_ic, t_f, t_c, 50, 14)}
      <div style="min-width: 0;">
        <div style="display: flex; align-items: center; gap: 10px;"><h2 style="margin: 0; font-size: 23px; font-weight: 800; letter-spacing: -0.03em;">Parcial 1 resuelto</h2>{ge.pastilla_tipo('Parcial', chica=True)}</div>
        <div style="margin-top: 4px; font-size: 13px; font-weight: 600; color: {MUTED};"><b style="color: {NAVY};">Introducción a la Programación</b> · Ciclo 2025 · Prof. Gómez · Turno tarde</div>
      </div>
      <div style="margin-left: auto; display: flex; align-items: center; gap: 8px;">
        {accion('Me sirvió', 'corazon', color_ic=PINK, extra=f'<span style="font-weight: 800; color: {MUTED};">42</span>')}
        {accion('Guardar', 'marcador')}
        {accion('Descargar', 'descargar', primario=True)}
        {separador(28, 4)}
        {boton_icono('equis', 'Cerrar', 42)}
      </div>
    </div>
'''
    visor = f'''    <div style="position: relative; min-width: 0; min-height: 0; display: flex; flex-direction: column; background: #EFE8DA;">
      <div style="height: 50px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 12px 0 16px; background: #F8F3E9; border-bottom: 1.5px solid #E4DCCB; font-size: 13px; font-weight: 700;">
        <span style="display: inline-flex; align-items: center; gap: 8px; min-width: 0;">{ico('doc', 16, t_c, 2)}parcial-1-2025-resuelto.pdf</span>
        <span style="display: inline-flex; align-items: center; gap: 4px;">
          {mini('chev-izq', 'Página anterior')}<span style="width: 30px; height: 26px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 7px; font-weight: 800;">1</span><span style="color: {MUTED}; padding: 0 4px;">/ 4</span>{mini('chev-der', 'Página siguiente')}
          {separador(20, 8)}
          {mini('menos', 'Alejar')}<span style="min-width: 46px; text-align: center;">100 %</span>{mini('mas', 'Acercar')}
        </span>
        <span style="display: inline-flex; align-items: center; gap: 2px;">{mini('expandir', 'Pantalla completa')}{mini('externo', 'Abrir en otra pestaña')}</span>
      </div>
      <div style="flex: 1; min-height: 0; overflow: hidden; position: relative; display: flex; justify-content: center; padding-top: 22px;">
{hoja()}        <span aria-hidden="true" style="position: absolute; right: 7px; top: 12px; width: 6px; height: 150px; border-radius: 99px; background: rgba(2,18,56,0.25);"></span>
        <span style="position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); background: {NAVY}; color: #FFFFFF; border-radius: 999px; padding: 7px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap;">Página 1 de 4</span>
      </div>
    </div>
'''
    coms = ''.join(comentario(*c) for c in COMENTARIOS)
    lateral = f'''    <aside aria-label="Valoraciones y comentarios" style="min-height: 0; display: flex; flex-direction: column; border-left: 1.5px solid {LINEA}; background: #FEFEFE;">
      <div style="padding: 16px 20px 14px 20px; border-bottom: 1.5px solid {LINEA};">
        <div style="display: flex; align-items: center; gap: 10px;">
          {gx.iniciales('LP', '#F0F7C9', '#5A7A00', 36)}
          <div><div style="font-size: 13.5px; font-weight: 800;">Subido por Lucía P.</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">hace 3 días · 1.284 descargas</div></div>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Tema A con la corrección de la cátedra. Los ejercicios 3 y 4 están en la página 3.</p>
      </div>
      <div style="padding: 14px 20px; display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid {LINEA};">
        <span style="font-size: 36px; font-weight: 800; letter-spacing: -0.04em; line-height: 1;">4,6</span>
        <div><div style="display: flex; gap: 2px;">{estrellas_parcial(4.6, 15)}</div><div style="margin-top: 4px; font-size: 12px; font-weight: 600; color: {MUTED};">12 valoraciones · 7 con comentario</div></div>
      </div>
      <div style="flex: 1; min-height: 0; overflow: hidden; position: relative; padding: 0 20px;">
        <div style="padding-top: 14px; font-size: 11.5px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">COMENTARIOS</div>
{coms}        <span aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 40px; background: linear-gradient(rgba(254,254,254,0), #FEFEFE);"></span>
      </div>
      <div style="flex-shrink: 0; padding: 14px 20px 16px 20px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
        <div style="display: flex; align-items: center; justify-content: space-between;"><span style="font-size: 13.5px; font-weight: 800;">Tu valoración</span><span style="display: flex; gap: 3px;">{estrellas(0, 22)}</span></div>
        <div style="margin-top: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 10px 12px; min-height: 58px; box-sizing: border-box; font-size: 13px; line-height: 1.45; font-weight: 500; color: {MUTED};">¿Te sirvió? Contá qué tiene de bueno o qué le falta (opcional).</div>
        <div style="margin-top: 10px; display: flex; align-items: center; justify-content: space-between; gap: 10px;"><span style="font-size: 11.5px; font-weight: 600; color: {MUTED};">Se publica con tu nombre.</span>{boton('Publicar', chico=True)}</div>
      </div>
    </aside>
'''
    pie = f'''    <div style="height: 46px; flex-shrink: 0; display: flex; align-items: center; gap: 14px; padding: 0 20px 0 22px; border-top: 1.5px solid {LINEA}; background: {CREMA}; font-size: 12.5px; font-weight: 600; color: {MUTED};">
      <span>PDF · 4 páginas · 1,8 MB · subido el 20 de septiembre de 2026</span>
      <a href="#reportar" style="margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-weight: 700; color: {TEXT2};">{ico('bandera', 14, TEXT2, 2)}Reportar</a>
      {separador(18)}
      <span style="display: inline-flex; align-items: center; gap: 6px;">{tecla('Esc')} cerrar <span style="width: 6px;"></span>{tecla('←')}{tecla('→')} otro parcial</span>
    </div>
'''
    contenido = (cabecera + f'    <div style="flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) 380px;">\n'
                 + visor + lateral + '    </div>\n' + pie)
    def lado(pos, icono, etiqueta, texto):
        return (f'  <a href="#{etiqueta}" aria-label="{etiqueta}" style="position: absolute; z-index: 11; {pos} top: 436px; width: 84px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; color: #FDF3E5;">'
                f'<span style="width: 52px; height: 52px; box-sizing: border-box; border-radius: 999px; background: #FFFFFF; border: 1.5px solid {NAVY}; display: flex; align-items: center; justify-content: center;">{ico(icono, 22, NAVY, 2.4)}</span>'
                f'<span style="font-size: 11.5px; line-height: 1.3; font-weight: 700;">{texto}</span></a>\n')
    return (fondo_materia() + popup(1200, 872, 120, 44, 'Parcial 1 resuelto', contenido)
            + lado('left: 18px;', 'chev-izq', 'Recurso anterior', 'Anterior')
            + lado('right: 18px;', 'chev-der', 'Recurso siguiente', 'Siguiente'))

# ================================================================ 2 · SUBIR MATERIAL (popup)
def fila_materia(cod, nombre, sel=False):
    estilo = f'background: #D6E5FB; border: 2px solid {NAVY};' if sel else 'border: 2px solid transparent;'
    return (f'          <div style="display: flex; align-items: center; gap: 10px; padding: 7px 10px; border-radius: 10px; {estilo}">{radio(sel)}'
            f'<span style="font-size: 10.5px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 2px 0; width: 26px; text-align: center; flex-shrink: 0;">{cod}</span>'
            f'<span style="font-size: 13.5px; font-weight: {800 if sel else 600}; line-height: 1.25;">{nombre}</span></div>\n')

def lista_materias():
    html = ''
    for anio in (1, 2):
        html += f'          <div style="padding: 12px 10px 5px 10px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.16em; color: {MUTED};">{anio}° AÑO</div>\n'
        html += ''.join(fila_materia(cod, nom, cod == '01') for a, _, cod, nom, _ in PLAN if a == anio)
    return html

TIPOS_MATERIAL = [(sing, ic, f, c) for _, sing, ic, f, c in TIPOS] + [('Otro', 'capas', '#F1EEE4', MUTED)]
DESC_MATERIAL = 'Tema A con la corrección de la cátedra. Los ejercicios 3 y 4 están en la página 3.'

def p_subir():
    _, _, p_ic, p_f, p_c = TIPO['Parcial']
    _, _, tp_ic, tp_f, tp_c = TIPO['Trabajo práctico']
    cabecera = f'''    <div style="flex-shrink: 0; display: flex; align-items: center; gap: 14px; padding: 18px 18px 16px 24px; border-bottom: 1.5px solid {LINEA};">
      {tile('subir', '#D6E5FB', BTN, 46, 13)}
      <div><h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">Subir material</h2>
        <p style="margin: 3px 0 0 0; font-size: 13.5px; font-weight: 500; color: {TEXT2};">Cada archivo se publica como un material aparte, apenas lo envíes.</p></div>
      <span style="margin-left: auto;">{boton_icono('equis', 'Cerrar', 42)}</span>
    </div>
'''
    izquierda = f'''      <div style="min-height: 0; display: flex; flex-direction: column; padding: 18px 14px 0 20px; background: {CREMA}; border-right: 1.5px solid {LINEA};">
        <div style="font-size: 14px; font-weight: 800;">1 · ¿De qué materia?</div>
        <div style="margin-top: 10px; display: flex; align-items: center; gap: 11px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 9px 12px 9px 9px;">
          {monograma('II', '#D6E5FB', BTN, 38, 13)}
          <div style="min-width: 0;"><div style="font-size: 14px; font-weight: 800;">Ingeniería Informática</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">UNJu · Facultad de Ingeniería · Plan 2023</div></div>
          <span style="margin-left: auto;">{ico('abajo', 14, NAVY, 2.4)}</span>
        </div>
        <div style="margin-top: 10px; display: flex; align-items: center; gap: 9px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px; font-size: 13.5px; font-weight: 600; color: {MUTED};">{ico('lupa', 16, NAVY, 2.2)}Buscá la materia</div>
        <div style="flex: 1; min-height: 0; overflow: hidden; position: relative; margin-top: 4px; padding-right: 10px;">
{lista_materias()}          <span aria-hidden="true" style="position: absolute; right: 0; top: 14px; width: 5px; height: 130px; border-radius: 99px; background: rgba(2,18,56,0.25);"></span>
          <span aria-hidden="true" style="position: absolute; left: 0; right: 0; bottom: 0; height: 56px; background: linear-gradient(rgba(251,247,238,0), {CREMA});"></span>
        </div>
      </div>
'''
    titulo = 'Parcial 1 resuelto'
    listo = f'''        <div style="flex-shrink: 0; border: 1.5px solid {NAVY}; border-radius: 14px; background: #FFFFFF; overflow: hidden;">
          <div style="display: flex; align-items: center; gap: 12px; padding: 10px 10px 10px 12px; background: {CREMA}; border-bottom: 1.5px solid {LINEA};">
            {tile(p_ic, p_f, p_c)}
            <div><div style="font-size: 14px; font-weight: 800;">parcial-1-2025-resuelto.pdf</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">PDF · 1,8 MB · 4 páginas</div></div>
            <span style="margin-left: auto;">{ge.estado('Subido', VERDE_BG, VERDE_TX, 'check')}</span>
            {boton_icono('equis', 'Quitar archivo', 32, MUTED, 'transparent', 'transparent')}
          </div>
          <div style="padding: 14px 16px 16px 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px 16px;">
            <div style="grid-column: 1 / -1;">{gx.campo('Tipo de material', fila_pastillas(TIPOS_MATERIAL, 'Parcial'), 'obligatorio')}</div>
            <div style="grid-column: 1 / -1;">{gx.campo('Título', entrada(titulo, f'{len(titulo)} / 200'), 'obligatorio')}</div>
            {gx.campo('Ciclo lectivo', gx.selector('2025'))}
            {gx.campo('Profesor/a', gx.selector('Prof. Gómez'))}
            {gx.campo('Turno', gx.selector('Tarde'))}
            <div style="grid-column: 1 / -1;">{gx.campo('Descripción', area(DESC_MATERIAL, f'{len(DESC_MATERIAL)} / 1000', 56))}</div>
          </div>
        </div>
'''
    subiendo = f'''        <div style="flex-shrink: 0; display: flex; align-items: center; gap: 12px; border: 1.5px solid #CFC5B0; border-radius: 14px; background: #FFFFFF; padding: 10px 14px 10px 12px;">
          {tile(tp_ic, tp_f, tp_c)}
          <div style="flex: 1; min-width: 0;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;"><span style="font-size: 14px; font-weight: 800;">tp-2-listas.docx</span><span style="font-size: 12px; font-weight: 700; color: {MUTED};">Subiendo… 64 % · 640 KB</span></div>
            <div style="margin-top: 8px; height: 6px; border-radius: 99px; background: #EDE6D6; overflow: hidden;"><div style="width: 64%; height: 100%; border-radius: 99px; background: {BTN};"></div></div>
          </div>
          <a href="#cancelar" style="font-size: 12.5px; font-weight: 700; color: {TEXT2};">Cancelar</a>
        </div>
'''
    error = f'''        <div style="flex-shrink: 0; display: flex; align-items: center; gap: 12px; border: 1.5px solid #F2B8B5; border-radius: 14px; background: #FFF6F5; padding: 10px 14px 10px 12px;">
          {tile('imagen', ROJO_BG, ROJO_TX)}
          <div style="min-width: 0;"><div style="font-size: 14px; font-weight: 800;">foto-pizarron.heic</div>
            <div style="margin-top: 2px; display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: {ROJO_TX};">{ico('alerta', 14, ROJO_TX, 2.2)}Este formato no se puede subir. Convertila a JPG o PNG.</div></div>
          <a href="#quitar" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {TEXT2};">Quitar</a>
        </div>
'''
    derecha = f'''      <div style="min-height: 0; overflow: hidden; display: flex; flex-direction: column; gap: 12px; padding: 18px 24px 16px 24px;">
        <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px;"><span style="font-size: 14px; font-weight: 800;">2 · Archivos</span><span style="font-size: 12px; font-weight: 600; color: {MUTED};">PDF, Word, PowerPoint, Excel, texto o imágenes · hasta 25 MB cada uno</span></div>
        <div style="flex-shrink: 0; display: flex; align-items: center; gap: 16px; border: 2px dashed #8FA9E6; border-radius: 14px; background: #F4F8FF; padding: 6px 16px 6px 12px;">
          <img src="gato-cargando.png" alt="" style="height: 76px; width: auto; display: block;">
          <div><div style="font-size: 16px; font-weight: 800; letter-spacing: -0.02em;">Arrastrá más archivos acá</div><div style="margin-top: 2px; font-size: 12.5px; font-weight: 500; color: {TEXT2};">Podés soltar varios a la vez: cada uno queda como un material.</div></div>
          <span style="margin-left: auto;">{boton('Elegir archivos', 'mas', primario=False, chico=True)}</span>
        </div>
{listo}{subiendo}{error}      </div>
'''
    pie = f'''    <div style="flex-shrink: 0; display: flex; align-items: center; gap: 12px; padding: 14px 20px 14px 24px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
      {ico('info', 20, BTN, 2.1)}
      <div><div style="font-size: 13.5px; font-weight: 800;">1 listo · 1 subiendo · 1 con error</div>
        <div style="margin-top: 2px; font-size: 12.5px; font-weight: 500; color: {TEXT2};">Se publican al instante y suman 10 puntos cada uno. Si alguien reporta un problema, moderación lo revisa.</div></div>
      <span style="margin-left: auto; display: flex; gap: 10px;">{boton('Cancelar', primario=False)}{boton('Publicar', 'check')}</span>
    </div>
'''
    contenido = (cabecera + '    <div style="flex: 1; min-height: 0; display: grid; grid-template-columns: 350px minmax(0, 1fr);">\n'
                 + izquierda + derecha + '    </div>\n' + pie)
    return fondo_materia() + popup(1220, 888, 110, 36, 'Subir material', contenido)

# ================================================================ 3 · PUBLICAR EN CLASIFICADOS
INTENCIONES = [
    ('vendo', 'etiqueta', '#FFE3EE', '#E0357A', 'Vendo', 'Algo que ya no usás: libros, calculadoras, componentes.'),
    ('busco', 'lupa', '#FDE7D0', '#B14C06', 'Busco', 'Algo que necesitás conseguir.'),
    ('tutoria', 'birrete', VERDE_BG, VERDE_TX, 'Ofrezco tutoría', 'Das clases de una materia que ya aprobaste.'),
    ('busco-tutor', 'gente', '#FDE7D0', '#B14C06', 'Busco tutor', 'Necesitás que alguien te explique.'),
]
CATEGORIAS = [('Libros', 'libro', '#FDE7D0', '#E2560A'), ('Calculadoras', 'tablilla', '#FDE7D0', '#E2560A'),
              ('Tecnología', 'monitor', '#D6E5FB', BTN), ('Electrónica', 'engranaje', '#D6E5FB', BTN),
              ('Universidad', 'birrete', '#D6E5FB', BTN), ('Otros', 'capas', '#F1EEE4', MUTED)]

def intenciones(activa):
    html = ''
    for clave, ic, f, c, tit, txt in INTENCIONES:
        sel = clave == activa
        marco = f'background: #D6E5FB; border: 2px solid {NAVY};' if sel else 'background: #FFFFFF; border: 1.5px solid #CFC5B0;'
        marca = (f'<span style="width: 22px; height: 22px; box-sizing: border-box; border-radius: 999px; background: {BTN}; border: 1.5px solid {NAVY}; display: flex; align-items: center; justify-content: center;">{ico("check", 13, "#FFFFFF", 3)}</span>'
                 if sel else '<span style="width: 22px; height: 22px; box-sizing: border-box; border-radius: 999px; border: 1.5px solid #CFC5B0; display: block;"></span>')
        html += (f'<div style="{marco} border-radius: 13px; padding: 13px 14px; display: flex; flex-direction: column; gap: 10px;">'
                 f'<div style="display: flex; align-items: center; justify-content: space-between;">{tile(ic, f, c, 36)}{marca}</div>'
                 f'<div><div style="font-size: 15px; font-weight: 800;">{tit}</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {TEXT2};">{txt}</div></div></div>')
    return f'<div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px;">{html}</div>'

def encabezado_publicar(ultimo):
    return breadcrumb(['Clasificados', ultimo]) + f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px;">
    {eyebrow('Nueva publicación')}
    <h1 style="margin: 14px 0 0 0; font-size: 64px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em; color: {NAVY};">Publicá en <span style="color: {BLUE};">Clasificados</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 14px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Vendé o conseguí cosas de la facu, u ofrecé tutorías. El contacto es directo entre estudiantes: DevsProject no cobra ni interviene en pagos.</p>
  </section>
'''

def pagina_publicar(ultimo, bloques, previa):
    return encabezado_publicar(ultimo) + f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 14px;">
{bloques}    </div>
    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">{ico('ojo', 15, MUTED, 2)}ASÍ SE VA A VER</div>
{previa}    </aside>
  </section>
'''

def contacto(extra=''):
    return f'''<div style="display: flex; flex-direction: column; gap: 16px;">
          {extra}{gx.campo('Cómo te contactan', gx.fila_opciones(['WhatsApp', 'Telegram', 'Email'], 'WhatsApp') + '<div style="margin-top: 10px; max-width: 320px;">' + entrada('388 412 0000', prefijo='+54 9') + '</div>', 'obligatorio')}
          <div style="display: flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 600; color: {TEXT2};">{ico('candado', 16, NAVY, 2.1)}Tu número solo lo ven estudiantes con sesión iniciada, cuando tocan «Contactar».</div>
        </div>'''

def cierre(vigencia, regla, texto_boton):
    return f'''<div style="display: flex; align-items: center; gap: 12px; background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 13px 16px;">
          {ico('reloj', 20, NAVY, 2)}
          <div style="font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2};">{vigencia}</div>
        </div>
        <div style="margin-top: 14px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.45; font-weight: 600; color: {TEXT2};">{casilla(True)}<span>{regla}</span></div>
        <div style="margin-top: 16px; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 12.5px; line-height: 1.4; font-weight: 600; color: {MUTED}; max-width: 330px;">Si alguien la reporta y no cumple las normas, moderación puede retirarla.</span>
          <span style="margin-left: auto; display: flex; gap: 10px;">{boton('Cancelar', primario=False)}{boton(texto_boton, 'check')}</span>
        </div>'''

def consejos(titulo, items, img, ancho, nota):
    filas = ''.join(f'<span style="display: flex; gap: 8px;">{ico("check", 15, VERDE_TX, 2.6)}<span>{t}</span></span>' for t in items)
    return f'''      <div style="position: relative; {CARD} padding: 18px 20px; overflow: hidden; min-height: 176px; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -0.02em;">{titulo}</h3>
        <div style="margin-top: 11px; display: flex; flex-direction: column; gap: 9px; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2}; max-width: 222px;">{filas}</div>
        <img src="{img}" alt="" style="position: absolute; right: 2px; bottom: -6px; width: {ancho}px; height: auto;">
      </div>
      <div style="display: flex; align-items: flex-start; gap: 9px; padding: 0 4px; font-size: 12.5px; line-height: 1.45; font-weight: 600; color: {MUTED};">{ico('escudo', 16, MUTED, 2)}<span>{nota}</span></div>
'''

TITULO_VENTA = 'Calculadora Casio fx-991ES Plus'
DESC_VENTA = 'La usé dos cuatrimestres y funciona perfecto. Tiene la tapa y pilas nuevas. Sirve para Análisis y Física.'

def p_publicar_venta():
    quitar = (f'<span aria-label="Quitar foto" style="position: absolute; right: 6px; top: 6px; width: 22px; height: 22px; box-sizing: border-box; border-radius: 999px; background: #FFFFFF; '
              f'border: 1.5px solid {NAVY}; display: flex; align-items: center; justify-content: center;">{ico("equis", 11, NAVY, 3)}</span>')
    def ranura(contenido, estilo):
        return f'<div style="position: relative; aspect-ratio: 1 / 1; box-sizing: border-box; border-radius: 12px; overflow: hidden; {estilo}">{contenido}</div>'
    fotos = (f'<div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px;">'
             + ranura('<img src="mini-calculadora.png" alt="Calculadora Casio sobre papel cuadriculado" style="display: block; width: 100%; height: 100%; object-fit: cover;">'
                      f'<span style="position: absolute; left: 7px; bottom: 7px; background: {NAVY}; color: #FFFFFF; border-radius: 6px; padding: 3px 7px; font-size: 10.5px; font-weight: 800;">Portada</span>' + quitar,
                      f'border: 2px solid {NAVY};')
             + ranura('<img src="mini-calculadora.png" alt="Detalle de la pantalla de la calculadora" style="display: block; width: 100%; height: 100%; object-fit: cover; transform: scale(1.9); transform-origin: 42% 30%;">' + quitar,
                      f'border: 1.5px solid {NAVY};')
             + ranura(f'<div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; font-size: 12.5px; font-weight: 800; color: {BTN};">{ico("camara", 24, BTN, 2)}Agregar fotos</div>',
                      'border: 2px dashed #8FA9E6; background: #F4F8FF;')
             + ranura('', 'border: 1.5px dashed #D9D0BE;') * 2 + '</div>'
             + f'<div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: {MUTED};">Fotos reales y con buena luz. Arrastralas para cambiar el orden.</div>')
    detalles = f'''<div style="display: flex; flex-direction: column; gap: 16px;">
          {gx.campo('Título', entrada(TITULO_VENTA, f'{len(TITULO_VENTA)} / 80'), 'obligatorio')}
          {gx.campo('Categoría', fila_pastillas(CATEGORIAS, 'Calculadoras'), 'obligatorio')}
          {gx.campo('Estado', gx.fila_opciones(['Nuevo', 'Como nuevo', 'Usado', 'Con detalles'], 'Como nuevo'), 'obligatorio')}
          {gx.campo('Materia relacionada', '<div style="max-width: 360px;">' + gx.selector('Análisis Matemático I') + '</div>', ayuda='La ve primero quien cursa esa materia.')}
          {gx.campo('Descripción', area(DESC_VENTA, f'{len(DESC_VENTA)} / 1000', 76))}
        </div>'''
    precio = f'''{gx.fila_opciones(['Precio fijo', 'Escucho ofertas', 'Lo regalo'], 'Precio fijo')}
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 14px;">
          <div style="width: 220px; flex-shrink: 0;">{entrada('35.000', prefijo='$', grande=True)}</div>
          <div style="flex: 1;">{aviso('info', f'En Clasificados hay <b style="color: {NAVY};">3 calculadoras</b> parecidas entre $ 28.000 y $ 40.000.')}</div>
        </div>'''
    entrega = gx.campo('Dónde entregás', '<div style="display: flex; gap: 8px;">' + gx.opcion('En la facultad', True) + gx.opcion('Centro de San Salvador', True) + gx.opcion('A convenir') + '</div>',
                       ayuda='Podés elegir más de uno.')
    bloques = (gx.bloque(1, '¿Qué querés publicar?', intenciones('vendo'))
               + gx.bloque(2, 'Fotos', fotos, 'Hasta 5 · la primera es la portada')
               + gx.bloque(3, 'Detalles', detalles)
               + gx.bloque(4, 'Precio', precio)
               + gx.bloque(5, 'Entrega y contacto', contacto(entrega))
               + gx.bloque(6, 'Publicación', cierre('<b style="color: #021238;">Se publica al instante y dura 30 días.</b> Desde «Mis publicaciones» la marcás como vendida, la pausás o la renovás.',
                                                    'Es algo mío, se puede vender y no es un servicio para hacer trabajos o exámenes por otra persona.', 'Publicar')))
    tarjeta = f'''      <article style="background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 11px; display: flex; gap: 12px; box-shadow: 5px 5px 0 {NAVY};">
        <div style="width: 112px; height: 112px; flex-shrink: 0; border: 1.5px solid {NAVY}; border-radius: 10px; overflow: hidden;"><img src="mini-calculadora.png" alt="" style="display: block; width: 100%; height: 100%; object-fit: cover;"></div>
        <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;"><span style="display: inline-flex; background: #FF5C9E; border-radius: 6px; padding: 3px 9px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; color: #FFFFFF;">VENDO</span>{ico('corazon', 17, '#9BA2B4', 2)}</div>
          <h3 style="margin: 7px 0 0 0; font-size: 14.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{TITULO_VENTA}</h3>
          <div style="margin-top: 4px; font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">$ 35.000</div>
          <div style="margin-top: 7px; display: flex; gap: 6px;">{chip('Calculadoras')}{chip('Como nuevo')}</div>
          <div style="margin-top: 7px; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #7A8296;"><span style="width: 7px; height: 7px; border-radius: 999px; background: #37C46B; display: block;"></span>Publicado ahora · FI UNJu</div>
        </div>
      </article>
      <div style="{CARD} padding: 14px 16px;">
        <div style="font-size: 11.5px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">AL TOCAR «CONTACTAR»</div>
        <div style="margin-top: 10px; background: {VERDE_BG}; border-radius: 12px 12px 12px 4px; padding: 10px 12px; font-size: 13px; line-height: 1.45; font-weight: 600; color: #1F3B26;">“Hola Max, vi tu {TITULO_VENTA} en DevsProject. ¿Sigue disponible?”</div>
        <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: {MUTED};">Se abre WhatsApp con este mensaje listo para enviar.</div>
      </div>
'''
    previa = tarjeta + consejos('Una buena publicación…', ['tiene fotos reales y con luz.', 'dice el estado sin vueltas.', 'aclara dónde y cuándo entregás.'],
                                'gato-etiqueta.png', 132, 'DevsProject conecta estudiantes. No interviene en pagos ni transacciones.')
    return gx.header_logueado('Clasificados') + pagina_publicar('Publicar', bloques, previa)

PRESENTACION = 'Estoy en 2° año de Informática. Aprobé Análisis I con 9: explico con ejercicios de parciales viejos y armamos juntos un plan hasta la fecha del examen.'

def p_publicar_tutoria():
    def entrada_etiquetas(chips_, placeholder):
        return (f'<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 8px 10px;">'
                + ''.join(gx.chip_borrable(c) for c in chips_) + f'<span style="font-size: 13.5px; font-weight: 600; color: {MUTED}; padding-left: 4px;">{placeholder}</span></div>')
    def sugeridas(etiqueta, items):
        return (f'<div style="margin-top: 9px; display: flex; flex-wrap: wrap; align-items: center; gap: 7px;"><span style="font-size: 12px; font-weight: 700; color: {MUTED};">{etiqueta}</span>'
                + ''.join(gx.chip_sugerido(t) for t in items) + '</div>')
    que = f'''<div style="display: flex; flex-direction: column; gap: 16px;">
          {gx.campo('Materias', entrada_etiquetas(['Análisis Matemático I', 'Álgebra Lineal'], 'Agregá otra materia…') + sugeridas('De tu plan:', ['Análisis Matemático II', 'Física Mecánica']), 'obligatorio')}
          {gx.campo('Temas', entrada_etiquetas(['Integrales', 'Límites', 'Derivadas'], 'Escribí un tema…'))}
        </div>'''
    def dia(d, sel):
        if sel:
            return f'<span style="width: 58px; display: flex; align-items: center; justify-content: center; background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 10px; padding: 8px 0; font-size: 13.5px; font-weight: 800;">{d}</span>'
        return f'<span style="width: 58px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 10px; padding: 9px 0; font-size: 13.5px; font-weight: 700; color: {TEXT2};">{d}</span>'
    dias = '<div style="display: flex; gap: 8px;">' + ''.join(dia(d, d in ('Lun', 'Mié', 'Vie')) for d in ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']) + '</div>'
    como = f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 18px;">
          {gx.campo('Modalidad', gx.fila_opciones(['Presencial', 'Virtual', 'Las dos'], 'Las dos'), 'obligatorio')}
          {gx.campo('Dónde', gx.selector('En la facultad (FI UNJu)'), ayuda='Solo para las clases presenciales.')}
          {gx.campo('Días', dias, 'obligatorio')}
          {gx.campo('Horario', gx.fila_opciones(['Mañana', 'Tarde', 'Noche'], 'Tarde'), 'obligatorio')}
        </div>'''
    precio = f'''<div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 190px; flex-shrink: 0;">{entrada('3.000', prefijo='$', grande=True)}</div>
          <div style="width: 150px; flex-shrink: 0;">{gx.selector('por hora')}</div>
          <div style="flex: 1;">{aviso('info', 'Es orientativo: lo acuerdan entre ustedes. DevsProject no cobra comisión ni procesa pagos.')}</div>
        </div>'''
    sobre = f'''{gx.campo('Presentación', area(PRESENTACION, f'{len(PRESENTACION)} / 600', 84), 'obligatorio')}
        <div style="margin-top: 12px; display: flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 600; color: {TEXT2};">{ico('persona', 16, NAVY, 2.1)}Tu carrera y año salen de tu perfil: <b style="color: {NAVY};">Ing. Informática · 2° año</b><a href="#config" style="margin-left: 4px; font-weight: 700; color: {BLUE};">Cambiar en Configuración</a></div>'''
    bloques = (gx.bloque(1, '¿Qué querés publicar?', intenciones('tutoria'))
               + gx.bloque(2, 'Qué enseñás', que)
               + gx.bloque(3, 'Cómo y cuándo', como)
               + gx.bloque(4, 'Precio orientativo', precio, 'Opcional')
               + gx.bloque(5, 'Sobre vos', sobre)
               + gx.bloque(6, 'Contacto y publicación', contacto() + '<div style="margin-top: 18px; padding-top: 18px; border-top: 1.5px dashed #E4DCCB;">'
                           + cierre('<b style="color: #021238;">Se publica al instante.</b> Cada 30 días te preguntamos si la tutoría sigue en pie; si no respondés, se pausa sola.',
                                    'Ofrezco explicar y acompañar. No hago trabajos, parciales ni exámenes por otra persona.', 'Publicar tutoría') + '</div>'))
    tutor = gc.tarjeta_tutor(dict(av='av-max.png', fondo='#D6E5FB', nombre='Max', carrera='Ing. Informática · 2° año', materia='Análisis Matemático I y Álgebra Lineal',
                                  temas=['Integrales', 'Límites', 'Derivadas'], precio='$ 3.000', modalidad='Presencial o virtual', lugar='FI UNJu',
                                  horario='Tarde · Lun, Mié y Vie', nota='Nuevo', opiniones=0, dadas=0))
    tutor = tutor.replace('· 0 opiniones · 0 tutorías', '· todavía sin opiniones')
    previa = tutor + consejos('Una buena tutoría…', ['dice qué temas cubre.', 'muestra horarios reales.', 'aclara si es presencial o virtual.'],
                              'gato-idea.png', 118, 'DevsProject conecta estudiantes. No interviene en pagos ni en lo que acuerden.')
    return gx.header_logueado('Clasificados') + pagina_publicar('Ofrecer tutoría', bloques, previa)

# ================================================================ 4 · CONFIGURACION (Mi espacio)
SECCIONES = [('perfil', 'persona', 'Perfil público'), ('estudio', 'birrete', 'Lo que estudio'), ('privacidad', 'candado', 'Privacidad'),
             ('avisos', 'campana', 'Notificaciones'), ('seguridad', 'llave', 'Seguridad y sesiones'), ('datos', 'descargar', 'Tus datos y cuenta')]
BIO = 'Estudio Informática en la FI. Subo lo que me hubiera gustado encontrar cuando empecé.'

def tarjeta_config(id_, icono, titulo, sub, contenido, derecha=''):
    s = f'<p style="margin: 3px 0 0 0; font-size: 13px; font-weight: 500; color: {MUTED};">{sub}</p>' if sub else ''
    return f'''      <section id="{id_}" style="{CARD} padding: 20px 24px 22px 24px;">
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
          {tile(icono, '#ECF2FE', BTN, 38, 11)}
          <div><h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">{titulo}</h2>{s}</div>
          <span style="margin-left: auto;">{derecha}</span>
        </div>
        {contenido}
      </section>
'''

def fila_ajuste(titulo, texto, control, borde=True):
    b = f'border-top: 1.5px solid {LINEA};' if borde else ''
    return (f'<div style="display: flex; align-items: center; gap: 16px; padding: 13px 0; {b}">'
            f'<div style="min-width: 0;"><div style="font-size: 14.5px; font-weight: 800;">{titulo}</div>'
            f'<div style="margin-top: 2px; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {MUTED};">{texto}</div></div>'
            f'<span style="margin-left: auto; flex-shrink: 0;">{control}</span></div>')

def p_configuracion():
    nav = ''
    for clave, ic, texto in SECCIONES:
        activo = clave == 'perfil'
        nav += (f'<a href="#{clave}" style="display: flex; align-items: center; gap: 11px; border-radius: 10px; padding: 10px 12px; {"background: #ECF2FE;" if activo else ""} color: {NAVY};">'
                f'{ico(ic, 18, BTN if activo else NAVY, 2)}<span style="font-size: 14px; font-weight: {800 if activo else 700};">{texto}</span></a>')
    gatos = ''.join(f'<img src="{a}" alt="" style="width: 40px; height: 40px; box-sizing: border-box; border-radius: 999px; border: {"2.5px solid " + BTN if a == "av-max.png" else "1.5px solid " + NAVY}; object-fit: cover;">'
                    for a in ('av-max.png', 'av-crema.png', 'av-birrete.png', 'av-guino.png'))
    perfil = f'''<div style="display: flex; align-items: center; gap: 18px;">
          <img src="av-max.png" alt="Foto de perfil de Max" style="width: 76px; height: 76px; border-radius: 999px; border: 1.5px solid {NAVY};">
          <div><div style="font-size: 14.5px; font-weight: 800;">Foto de perfil</div><div style="margin-top: 2px; font-size: 12.5px; font-weight: 500; color: {MUTED};">Subí una foto o elegí uno de los gatos.</div>
            <div style="margin-top: 9px; display: flex; align-items: center; gap: 8px;">{gatos}<span style="margin-left: 6px;">{boton('Subir foto', 'subir', primario=False, chico=True)}</span></div></div>
        </div>
        <div style="margin-top: 18px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 18px;">
          {gx.campo('Nombre visible', entrada('Max', '3 / 50'), None)}
          {gx.campo('Usuario', entrada('max', prefijo='devsproject.com/u/'), None, ayuda='Es la dirección de tu perfil público.')}
          <div style="grid-column: 1 / -1;">{gx.campo('Bio', area(BIO, f'{len(BIO)} / 160', 64), None)}</div>
        </div>
        <div style="margin-top: 18px; padding-top: 16px; border-top: 1.5px dashed #E4DCCB; display: flex; align-items: center; gap: 12px;">
          <span style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: #8A5A00;"><span style="width: 8px; height: 8px; border-radius: 999px; background: #E9A23B; display: block;"></span>Tenés cambios sin guardar en la bio</span>
          <span style="margin-left: auto; display: flex; gap: 10px;">{boton('Descartar', primario=False, chico=True)}{boton('Guardar cambios', 'check', chico=True)}</span>
        </div>'''
    materias = ('<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 7px;">'
                + ''.join(gx.chip_borrable(m) for m in ['Matemática Discreta', 'Teoría de la Información y la Comunicación', 'Desarrollo Sistemático de Programas', 'Probabilidades y Estadística'])
                + gx.chip_sugerido('Agregar materia') + '</div>')
    estudio = f'''<div style="display: flex; align-items: center; gap: 12px; background: {CREMA}; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 12px 16px 12px 12px;">
          {monograma('II', '#D6E5FB', BTN, 44, 14)}
          <div><div style="font-size: 15px; font-weight: 800;">Ingeniería Informática</div><div style="font-size: 12.5px; font-weight: 600; color: {MUTED};">UNJu · Facultad de Ingeniería · Plan 2023</div></div>
          <span style="margin-left: 6px;">{estado_activo('Cursando')}</span>
          <a href="#cambiar" style="margin-left: auto; font-size: 13px; font-weight: 700; color: {BLUE};">Cambiar</a>
        </div>
        <a href="#otra" style="margin-top: 10px; display: inline-flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 700; color: {BLUE};">{ico('mas', 15, BLUE, 2.4)}Agregar otra carrera</a>
        <div style="margin-top: 16px; display: grid; grid-template-columns: 200px minmax(0, 1fr); gap: 16px 20px;">
          {gx.campo('Año que cursás', gx.selector('2° año'), None)}
          {gx.campo('Materias que cursás ahora', materias, None, ayuda='Las usamos para mostrarte primero lo tuyo en Materias y Experiencias.')}
        </div>'''
    privacidad = (fila_ajuste('Publicar reseñas y experiencias como anónimo', 'Queda elegido de entrada en cada formulario. Igual lo podés cambiar en cada publicación.', interruptor(True), False)
                  + fila_ajuste('Mostrar mis aportes en mi perfil', 'Los materiales que publicaste.', interruptor(True))
                  + fila_ajuste('Mostrar mi carrera y año', 'Aparecen debajo de tu nombre en tu perfil.', interruptor(True))
                  + fila_ajuste('Mostrar mi nivel e insignias', 'Tu nivel sube con cada aporte publicado.', interruptor(False))
                  + '<div style="margin-top: 6px;">' + aviso('candado', 'Tu mochila nunca es pública. Lo que publicás como anónimo no aparece ni se cuenta en tu perfil.', '#F1EEE4', NAVY) + '</div>')
    AVISOS = [('Moderación retiró o restauró algo tuyo', True, True), ('Alguien valoró o comentó tu material', True, False),
              ('Hay materiales nuevos en tus materias', True, True), ('Tu publicación de Clasificados está por vencer', True, True),
              ('Novedades de DevsProject', False, False)]
    filas = ''.join(f'<div style="display: grid; grid-template-columns: minmax(0, 1fr) 110px 110px; align-items: center; padding: 11px 0; border-top: 1.5px solid {LINEA};">'
                    f'<span style="font-size: 14px; font-weight: 700;">{t}</span><span style="display: flex; justify-content: center;">{casilla(w)}</span><span style="display: flex; justify-content: center;">{casilla(e)}</span></div>'
                    for t, w, e in AVISOS)
    avisos = (f'<div style="display: grid; grid-template-columns: minmax(0, 1fr) 110px 110px; padding-bottom: 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; color: {MUTED};">'
              f'<span>AVISARME CUANDO…</span><span style="display: flex; align-items: center; justify-content: center; gap: 6px;">{ico("campana", 14, MUTED, 2.2)}EN LA WEB</span>'
              f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px;">{ico("arroba", 14, MUTED, 2.2)}POR EMAIL</span></div>{filas}'
              f'<div style="margin-top: 14px; padding-top: 14px; border-top: 1.5px solid {LINEA};">{gx.campo("Cómo te llegan los emails", "<div style=\"max-width: 520px;\">" + gx.fila_opciones(["Al momento", "Resumen diario", "Resumen semanal"], "Resumen semanal") + "</div>", None)}</div>')
    def sesion(icono, titulo, sub, actual):
        derecha = ge.estado('Esta sesión', VERDE_BG, VERDE_TX, 'check') if actual else f'<a href="#cerrar" style="font-size: 13px; font-weight: 700; color: {BLUE};">Cerrar</a>'
        return (f'<div style="display: flex; align-items: center; gap: 12px; padding: 10px 0;">{tile(icono, "#F1EEE4", NAVY, 36)}'
                f'<div><div style="font-size: 14px; font-weight: 800;">{titulo}</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">{sub}</div></div>'
                f'<span style="margin-left: auto;">{derecha}</span></div>')
    verificado = ge.estado('Verificado', VERDE_BG, VERDE_TX, 'check')
    seguridad = (fila_ajuste('Email', f'<span style="display: inline-flex; align-items: center; gap: 8px;">m••••@gmail.com {verificado}</span>', f'<a href="#email" style="font-size: 13px; font-weight: 700; color: {BLUE};">Cambiar</a>', False)
                 + fila_ajuste('Contraseña', 'La cambiaste hace 3 meses.', boton('Cambiar contraseña', 'llave', primario=False, chico=True))
                 + f'<div style="padding-top: 13px; border-top: 1.5px solid {LINEA};"><div style="font-size: 14.5px; font-weight: 800;">Sesiones abiertas</div>'
                 + sesion('monitor', 'Chrome en Windows', 'Activa ahora', True) + sesion('telefono', 'Chrome en Android', 'Última actividad hace 2 días', False)
                 + f'<div style="margin-top: 6px;">{boton("Cerrar las demás sesiones", "salir", primario=False, chico=True)}</div></div>')
    eliminar = (f'<a href="#eliminar" style="display: inline-flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1.5px solid {ROJO_TX}; border-radius: 11px; padding: 10px 16px; '
                f'font-size: 13px; font-weight: 700; color: {ROJO_TX};">{ico("basura", 14, ROJO_TX, 2.2)}Eliminar cuenta</a>')
    datos = (fila_ajuste('Descargar mis datos', 'Tus aportes, experiencias, publicaciones y mochila en un archivo.', boton('Pedir descarga', 'descargar', primario=False, chico=True), False)
             + fila_ajuste(f'<span style="color: {ROJO_TX};">Eliminar mi cuenta</span>', 'Se borran tu perfil y tu mochila. Te vamos a pedir que lo confirmes.', eliminar))
    guardado = ge.estado('Se guarda al instante', VERDE_BG, VERDE_TX, 'check')
    tarjetas = (tarjeta_config('perfil', 'persona', 'Perfil público', 'Lo que ve cualquiera que entra a tu perfil.', perfil, gx.link('Ver mi perfil'))
                + tarjeta_config('estudio', 'birrete', 'Lo que estudio', 'Tu carrera ordena lo que ves en toda la página.', estudio)
                + tarjeta_config('privacidad', 'candado', 'Privacidad', 'Qué se ve de vos en DevsProject.', privacidad, guardado)
                + tarjeta_config('avisos', 'campana', 'Notificaciones', 'Elegí qué te avisamos y por dónde.', avisos, guardado)
                + tarjeta_config('seguridad', 'llave', 'Seguridad y sesiones', 'Tu acceso y los dispositivos con la sesión abierta.', seguridad)
                + tarjeta_config('datos', 'descargar', 'Tus datos y cuenta', 'Una copia de todo lo tuyo, o cerrar la cuenta.', datos))
    cuerpo = ge.subnav('config') + f'''
  <section style="flex-shrink: 0; position: relative; padding: 28px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between;">
    <div>
      {eyebrow('Tu cuenta')}
      <h1 style="margin: 14px 0 0 0; font-size: 60px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Configuración<span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 12px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Tu perfil, lo que estudiás, qué se ve de vos y qué te avisamos.</p>
    </div>
    <img src="gato-engranaje.png" alt="" style="width: 172px; height: auto; margin: 0 40px -24px 0; position: relative; z-index: 1;">
  </section>
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 28px; align-items: start;">
    <nav aria-label="Secciones de configuración" style="{CARD} padding: 8px; display: flex; flex-direction: column; gap: 2px;">{nav}</nav>
    <div style="display: flex; flex-direction: column; gap: 16px;">
{tarjetas}    </div>
  </section>
'''
    return cuerpo

# ================================================================ salida
PAGINAS = [   # (archivo, titulo, fn, alto, tipo)
    ('DetalleRecurso.dc.html', 'DevsProject · Parcial 1 resuelto', p_detalle, 960, 'popup'),
    ('SubirMaterial.dc.html', 'DevsProject · Subir material', p_subir, 960, 'popup'),
    ('PublicarVenta.dc.html', 'DevsProject · Publicar en Clasificados', p_publicar_venta, 2150, 'pagina'),
    ('PublicarTutoria.dc.html', 'DevsProject · Ofrecer tutoría', p_publicar_tutoria, 2150, 'pagina'),
    ('Configuracion.dc.html', 'DevsProject · Configuración', p_configuracion, 2500, 'espacio'),
]
if __name__ == '__main__':
    for archivo, titulo, fn, alto, tipo in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        if tipo == 'espacio':
            html = ge.documento(titulo, alto, ge.header_logueado(False), fn())
        else:
            html = gx.documento(titulo, alto, '', fn(), con_pie=(tipo == 'pagina'))
        if archivo == 'DetalleRecurso.dc.html':
            html = html.replace('family=Caveat', SERIF, 1)
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(html)
        print('escrito', archivo, alto)

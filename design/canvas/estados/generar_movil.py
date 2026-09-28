# Genera la version mobile (390 px) de las pantallas principales: portada, materia, detalle de
# recurso, experiencias de una materia, clasificados y mi mochila.
# Uso: python generar_movil.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, estrellas, eyebrow, helmet, LOGO, ICONOS, ESTRELLA, TIPO, TIPOS, CARD,
                     NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_clasificados as gc
import generar_acciones as ga

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA, CREMA = ga.LINEA, ga.CREMA
VERDE_BG, VERDE_TX = ga.VERDE_BG, ga.VERDE_TX
AMBAR_BG, AMBAR_TX = '#FDF0C8', '#8A5A00'

ICONOS.update({
    'casa': '<path d="M4 11 12 4l8 7"></path><path d="M6 10v10h12V10"></path><path d="M10 20v-5h4v5"></path>',
    'puntos': '<circle cx="5" cy="12" r="1.3"></circle><circle cx="12" cy="12" r="1.3"></circle><circle cx="19" cy="12" r="1.3"></circle>',
})

def documento_movil(titulo, alto, cuerpo, serif=False):
    h = helmet().replace('</style>', gx.CSS_EXTRA + '</style>')
    if serif:
        h = h.replace('family=Caveat', ga.SERIF, 1)
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{titulo}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
{h}
<div style="width: 390px; height: {alto}px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; position: relative; background: #FDF3E5; background-image: linear-gradient(rgba(2,18,56,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(2,18,56,0.032) 1px, transparent 1px); background-size: 32px 32px; font-family: 'Figtree', system-ui, sans-serif; color: {NAVY};">
{cuerpo}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":390,"height":{alto}}}}}'>
class Component extends DCLogic {{}}
</script>
</body>
</html>
'''

# ================================================================ piezas del telefono
def barra_estado():
    c = NAVY
    return f'''  <div style="height: 44px; flex-shrink: 0; padding: 0 22px 0 28px; display: flex; align-items: center; justify-content: space-between; font-size: 15px; font-weight: 700; color: {c};">
    <span>9:41</span>
    <span style="display: flex; align-items: center; gap: 6px;">
      <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><rect x="0" y="8" width="3" height="4" rx="1" fill="{c}"></rect><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill="{c}"></rect><rect x="10" y="3" width="3" height="9" rx="1" fill="{c}"></rect><rect x="15" y="0" width="3" height="12" rx="1" fill="{c}"></rect></svg>
      <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="{c}" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M1.5 4.5a9.5 9.5 0 0 1 13 0"></path><path d="M4 7.2a6 6 0 0 1 8 0"></path><circle cx="8" cy="10" r="1" fill="{c}"></circle></svg>
      <svg width="26" height="12" viewBox="0 0 26 12" aria-hidden="true"><rect x="0.75" y="0.75" width="21.5" height="10.5" rx="3" fill="none" stroke="{c}" stroke-width="1.3" opacity="0.5"></rect><rect x="2.5" y="2.5" width="16" height="7" rx="1.6" fill="{c}"></rect><rect x="23.5" y="4" width="1.8" height="4" rx="0.9" fill="{c}" opacity="0.5"></rect></svg>
    </span>
  </div>
'''

def boton_redondo(icono, etiqueta, tam=40, badge=None):
    b = (f'<span style="position: absolute; top: -6px; right: -6px; min-width: 18px; height: 18px; box-sizing: border-box; padding: 0 5px; border-radius: 999px; background: {PINK}; '
         f'border: 2px solid #FDF3E5; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 800; color: #FFFFFF;">{badge}</span>') if badge else ''
    return (f'<a href="#{etiqueta}" aria-label="{etiqueta}" style="position: relative; width: {tam}px; height: {tam}px; flex-shrink: 0; box-sizing: border-box; display: flex; align-items: center; justify-content: center; '
            f'background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px;">{ico(icono, 19, NAVY, 2.1)}{b}</a>')

def cabecera(logueado=True):
    if logueado:
        derecha = (boton_redondo('lupa', 'Buscar') + boton_redondo('mochila', 'Mi mochila, 4 novedades', badge='4')
                   + '<img src="av-max.png" alt="Menú de Max" style="width: 40px; height: 40px; box-sizing: border-box; border-radius: 999px; border: 1.5px solid ' + NAVY + ';">')
    else:
        derecha = boton_redondo('lupa', 'Buscar') + (f'<a href="#ingresar" style="display: inline-flex; align-items: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; '
                                                     f'padding: 9px 13px; font-size: 13.5px; font-weight: 700; color: {NAVY};">Ingresar</a>')
    return f'''  <header style="height: 56px; flex-shrink: 0; padding: 0 16px; display: flex; align-items: center; justify-content: space-between;">
    <a href="#inicio" style="display: flex; align-items: center; gap: 8px;">{LOGO.replace('width="30" height="30"', 'width="25" height="25"')}<span style="font-size: 19px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">DevsProject</span></a>
    <div style="display: flex; align-items: center; gap: 8px;">{derecha}</div>
  </header>
'''

def cabecera_volver(texto, iconos=('lupa', 'compartir')):
    der = ''.join(boton_redondo(i, i) for i in iconos)
    return f'''  <header style="height: 56px; flex-shrink: 0; padding: 0 16px; display: flex; align-items: center; justify-content: space-between;">
    <a href="#volver" style="display: inline-flex; align-items: center; gap: 4px; font-size: 15px; font-weight: 700; color: {NAVY};">{ico('chev-izq', 20, NAVY, 2.4)}{texto}</a>
    <div style="display: flex; align-items: center; gap: 8px;">{der}</div>
  </header>
'''

TABS = [('inicio', 'Inicio', 'casa'), ('materias', 'Materias', 'libro'), ('subir', 'Subir', 'mas'), ('experiencias', 'Experiencias', 'pluma'), ('clasificados', 'Clasificados', 'etiqueta')]

def barra_tabs(activo=None):
    items = ''
    for clave, texto, icono in TABS:
        if clave == 'subir':
            items += (f'<a href="#subir" aria-label="Subir material" style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; margin-top: -22px; font-size: 11px; font-weight: 700; color: {NAVY};">'
                      f'<span style="width: 52px; height: 52px; box-sizing: border-box; border-radius: 16px; background: {BTN}; border: 1.5px solid {NAVY}; box-shadow: 3px 3px 0 {NAVY}; display: flex; align-items: center; justify-content: center;">{ico("mas", 24, "#FFFFFF", 2.6)}</span>{texto}</a>')
            continue
        on = clave == activo
        color = BTN if on else '#5A6178'
        marca = f'<span style="position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 26px; height: 3px; border-radius: 0 0 3px 3px; background: {BTN};"></span>' if on else ''
        items += (f'<a href="#{clave}" {"aria-current=\"page\" " if on else ""}style="position: relative; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 10px; '
                  f'font-size: 11px; font-weight: {800 if on else 600}; color: {color};">{marca}{ico(icono, 22, color, 2.1 if not on else 2.4)}{texto}</a>')
    return f'''  <nav aria-label="Secciones" style="margin-top: auto; flex-shrink: 0; background: #FEFEFE; border-top: 1.5px solid {NAVY};">
    <div style="height: 60px; display: flex; align-items: flex-start;">{items}</div>
    {indicador()}
  </nav>
'''

def indicador():
    return f'<div style="height: 22px; display: flex; align-items: center; justify-content: center;"><span style="width: 134px; height: 5px; border-radius: 99px; background: {NAVY};"></span></div>'

def seccion(texto, derecha='', margen=26):
    d = f'<a href="#ver" style="font-size: 13.5px; font-weight: 700; color: {BLUE};">{derecha}</a>' if derecha else ''
    return (f'<div style="margin-top: {margen}px; display: flex; align-items: baseline; justify-content: space-between; gap: 12px;">'
            f'<h2 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.03em;">{texto}</h2>{d}</div>')

def carrusel(items, gap=8):   # fila que se desplaza de costado: el ultimo elemento queda cortado por el borde
    return f'<div style="margin-right: -16px; display: flex; gap: {gap}px; overflow: hidden;">{items}</div>'

def pildora_tipo(sing, activo=False, n=None):
    _, s, ic, f, c = TIPO[sing]
    extra = f'<span style="font-weight: 800; color: {MUTED};">{n}</span>' if n is not None else ''
    borde = f'border: 2px solid {NAVY}; box-shadow: 2px 2px 0 {NAVY};' if activo else f'border: 1.5px solid {NAVY};'
    return (f'<span style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; background: {f}; {borde} border-radius: 999px; padding: 8px 13px 8px 10px; '
            f'font-size: 13.5px; font-weight: 800; white-space: nowrap;">{ico(ic, 15, c, 2.2)}{s}{extra}</span>')

def fila_recurso(tipo, titulo, sub, meta, util):
    _, _, ic, f, c = TIPO[tipo]
    return f'''    <div style="display: flex; align-items: center; gap: 12px; background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 11px 10px 11px 12px;">
      {ga.tile(ic, f, c, 42, 11)}
      <div style="min-width: 0; flex: 1;"><div style="font-size: 14.5px; font-weight: 800; line-height: 1.25;">{titulo}</div><div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: {MUTED};">{sub}</div>
        <div style="margin-top: 5px; display: flex; align-items: center; gap: 10px; font-size: 11.5px; font-weight: 700; color: {TEXT2};"><span style="display: inline-flex; align-items: center; gap: 4px;">{ico('corazon', 13, PINK, 2.2)}{util}</span><span style="font-weight: 600; color: {MUTED};">{meta}</span></div></div>
      {ico('chev-der', 18, MUTED, 2.2)}
    </div>
'''

def resenia(av, tipo, est, cita, chips_, res=None):
    r = gx.resultado_chip(res) if res else ''
    return f'''    <article style="{CARD} padding: 14px 15px;">
      <div style="display: flex; align-items: center; gap: 10px;">{gx.avatar(av, 36)}<div><div style="font-size: 14px; font-weight: 800;">Anónimo</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{tipo}</div></div><span style="margin-left: auto; display: flex; gap: 2px;">{estrellas(est, 12)}</span></div>
      <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">{r}{''.join(chip(x) for x in chips_)}</div>
      <p style="margin: 10px 0 0 0; font-size: 13.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">{cita}</p>
    </article>
'''

def fab(texto, icono, abajo=104):
    return (f'  <a href="#accion" style="position: absolute; z-index: 5; right: 16px; bottom: {abajo}px; display: inline-flex; align-items: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; '
            f'box-shadow: 3px 3px 0 {NAVY}; border-radius: 999px; padding: 13px 18px; font-size: 14.5px; font-weight: 800; color: #FFFFFF;">{ico(icono, 17, "#FFFFFF", 2.4)}{texto}</a>\n')

def cuerpo(html):
    return f'  <main style="flex-shrink: 0; padding: 0 16px 28px 16px;">\n{html}  </main>\n'

# ================================================================ 1 · PORTADA
def m_inicio():
    tipos = carrusel(''.join(pildora_tipo(s) for s in ['Parcial', 'Final', 'Apunte', 'Resumen', 'Trabajo práctico']))
    recientes = (fila_recurso('Parcial', 'Parcial 2 resuelto', 'Análisis Matemático I', '2025 · Prof. Gómez', 38)
                 + fila_recurso('Guía de ejercicios', 'Guía de ejercicios 3', 'Álgebra Lineal', '2024 · Prof. Ruiz', 24)
                 + fila_recurso('Final', 'Final de diciembre', 'Física Mecánica', '2024 · PDF', 21))
    def aviso_mini(img, badge, bg, titulo, precio):
        return (f'<article style="flex-shrink: 0; width: 158px; background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 8px;">'
                f'<div style="height: 110px; border: 1.5px solid {NAVY}; border-radius: 10px; overflow: hidden;"><img src="{img}" alt="" style="display: block; width: 100%; height: 100%; object-fit: cover;"></div>'
                f'<span style="margin-top: 8px; display: inline-flex; background: {bg}; border-radius: 6px; padding: 2px 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; color: #FFFFFF;">{badge}</span>'
                f'<div style="margin-top: 5px; font-size: 13px; font-weight: 800; line-height: 1.25;">{titulo}</div><div style="margin-top: 3px; font-size: 15px; font-weight: 800;">{precio}</div></article>')
    avisos = carrusel(aviso_mini('mini-calculadora.png', 'VENDO', '#FF5C9E', 'Calculadora Casio fx-991', '$ 35.000')
                      + aviso_mini('mini-libro-calculo.png', 'BUSCO', ORANGE, 'Cálculo de Stewart', 'A convenir')
                      + aviso_mini('mini-arduino.png', 'VENDO', '#FF5C9E', 'Kit Arduino UNO', '$ 28.000'), 10)
    html = f'''    <section style="position: relative; padding-top: 14px;">
      {eyebrow('Comunidad FI · UNJu')}
      <h1 style="margin: 12px 0 0 0; font-size: 46px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em;">Tu mochila<br>de <span style="color: {BLUE};">estudio</span><span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 330px;">Parciales, apuntes y experiencias para preparar tus materias. Entre todos llegamos más lejos.</p>
      <img src="hero-mochila.png" alt="El gato de DevsProject con su mochila de estudio" style="display: block; width: 330px; height: auto; margin: 8px auto 0 auto;">
    </section>
    <div style="margin-top: 6px; display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 14px; padding: 6px 6px 6px 14px;">
      {ico('lupa', 19, NAVY, 2.2)}<span style="flex: 1; font-size: 14.5px; font-weight: 600; color: #9BA2B4;">Buscá una materia o un tema</span>
      <span style="width: 40px; height: 40px; border-radius: 10px; background: {BTN}; border: 1.5px solid {NAVY}; box-sizing: border-box; display: flex; align-items: center; justify-content: center;">{ico('flecha', 18, '#FFFFFF', 2.5)}</span>
    </div>
    <div style="margin-top: 12px;">{tipos}</div>
    {seccion('Recursos recientes', 'Ver todos')}
    <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">
{recientes}    </div>
    {seccion('Cómo les fue', 'Ver todas')}
    <div style="margin-top: 12px;">
{resenia('av-crema.png', 'Experiencia de final · Análisis Matemático II', 4, '“Tomaron dos ejercicios de integrales y una demostración. Preparé con los finales viejos de la carpeta y alcanzó.”', ['Diciembre 2025', 'Mañana'], None).replace('<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">', '<div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">' + chip('Aprobado', '#F1EEE4', NAVY, 800))}    </div>
    {seccion('Entre estudiantes', 'Clasificados')}
    <div style="margin-top: 12px;">{avisos}</div>
    <div style="margin-top: 22px; position: relative; background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 18px; overflow: hidden; min-height: 150px; box-sizing: border-box;">
      <h3 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.12; max-width: 200px;">¿Tenés algo que te hubiera servido?</h3>
      <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #6A3E50; max-width: 190px;">Subilo: se publica al instante y ayuda a la próxima camada.</p>
      <div style="margin-top: 12px;">{boton('Subir material', 'subir', chico=True)}</div>
      <img src="gato-cargando.png" alt="" style="position: absolute; right: -6px; bottom: -6px; width: 130px; height: auto;">
    </div>
'''
    return barra_estado() + cabecera(False) + cuerpo(html) + barra_tabs('inicio')

# ================================================================ 2 · MATERIA
def m_materia():
    tipos = carrusel(pildora_tipo('Parcial', True, 24) + pildora_tipo('Final', n=12) + pildora_tipo('Apunte', n=18) + pildora_tipo('Resumen', n=15))
    recursos = (fila_recurso('Parcial', 'Parcial 1 resuelto', 'Ciclo 2025 · Prof. Gómez', 'PDF · 4 págs.', 42)
                + fila_recurso('Parcial', 'Parcial 2, tema B', 'Ciclo 2025 · Prof. Gómez', 'PDF · 3 págs.', 36)
                + fila_recurso('Parcial', 'Recuperatorio del parcial 1', 'Ciclo 2024 · Prof. Ruiz', 'PDF · 2 págs.', 23)
                + fila_recurso('Parcial', 'Parcial 1 con corrección', 'Ciclo 2024 · Prof. Ruiz', 'PDF · 5 págs.', 19))
    numeros = ''.join(f'<div style="flex: 1; {CARD} border-radius: 13px; padding: 10px 12px;"><div style="font-size: 22px; font-weight: 800; letter-spacing: -0.035em; color: {c};">{n}</div>'
                      f'<div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{t}</div></div>' for n, t, c in [('86', 'recursos', NAVY), ('46', 'experiencias', NAVY), ('Media', 'dificultad', BLUE)])
    html = f'''    <div style="padding-top: 4px; display: flex; align-items: center; gap: 10px;">
      <span style="font-size: 12px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 7px; padding: 3px 8px;">01</span>
      <span style="font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: {BLUE};">1° AÑO · 1° CUATRIMESTRE</span>
    </div>
    <h1 style="margin: 12px 0 0 0; font-size: 38px; line-height: 0.95; font-weight: 800; letter-spacing: -0.05em;">Introducción a la <span style="color: {BLUE};">Programación</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 10px 0 0 0; font-size: 14px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Ingeniería Informática · FI UNJu</p>
    <div style="margin-top: 14px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">{boton('Subir material', 'subir', chico=True, ancho=True)}{boton('Escribir reseña', 'pluma', primario=False, chico=True, ancho=True)}</div>
    <div style="margin-top: 12px; display: flex; gap: 8px;">{numeros}</div>
    <div style="margin-top: 20px;">{tipos}</div>
    {seccion('Parciales', 'Más útiles', 20)}
    <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">
{recursos}    </div>
    <a href="#todos" style="margin-top: 12px; display: flex; justify-content: center; font-size: 13.5px; font-weight: 700; color: {BLUE};">Ver los 24 parciales</a>
    {seccion('Cómo les fue', 'Ver las 46')}
    <div style="margin-top: 12px;">
{resenia('av-guino.png', 'Reseña de cursada', 5, '“Si nunca programaste, arrancá con las guías desde la primera semana. Los ayudantes responden rápido.”', ['Ciclo 2024', 'Tarde'], 'Regular')}    </div>
'''
    return barra_estado() + cabecera_volver('Materias') + cuerpo(html) + barra_tabs('materias')

# ================================================================ 3 · DETALLE DE RECURSO (pantalla completa)
def m_recurso():
    _, _, t_ic, t_f, t_c = TIPO['Parcial']
    visor = (f'<div style="position: relative; height: 432px; background: #EFE8DA; border-top: 1.5px solid #E4DCCB; border-bottom: 1.5px solid #E4DCCB; overflow: hidden;">'
             f'<div style="position: absolute; left: 21px; top: 16px; width: 620px; transform: scale(0.56); transform-origin: top left;">{ga.hoja()}</div>'
             f'<span style="position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); background: {NAVY}; color: #FFFFFF; border-radius: 999px; padding: 6px 13px; font-size: 12px; font-weight: 700;">1 / 4</span>'
             f'<span style="position: absolute; right: 12px; bottom: 12px; width: 36px; height: 36px; box-sizing: border-box; border-radius: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; display: flex; align-items: center; justify-content: center;">{ico("expandir", 16, NAVY, 2.2)}</span></div>')
    acciones = (f'<div style="padding: 12px 16px; display: grid; grid-template-columns: 1fr 1fr 1.3fr; gap: 8px;">'
                + ga.accion('42', 'corazon', color_ic=PINK).replace('padding: 10px 15px;', 'padding: 11px 10px; justify-content: center;')
                + ga.accion('Guardar', 'marcador').replace('padding: 10px 15px;', 'padding: 11px 10px; justify-content: center;')
                + ga.accion('Descargar', 'descargar', primario=True).replace('padding: 10px 15px;', 'padding: 11px 10px; justify-content: center;') + '</div>')
    hoja_coment = f'''  <div style="flex: 1; margin-top: 4px; background: #FEFEFE; border-top: 1.5px solid {NAVY}; border-radius: 22px 22px 0 0; box-shadow: 0 -6px 20px rgba(2,18,56,0.10); padding: 10px 16px 0 16px; display: flex; flex-direction: column;">
    <span style="align-self: center; width: 40px; height: 5px; border-radius: 99px; background: #D9D0BE;"></span>
    <div style="margin-top: 12px; display: flex; align-items: center; gap: 10px;"><span style="font-size: 17px; font-weight: 800;">Comentarios</span>
      <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 800;">{ga.estrellas_parcial(4.6, 13)}4,6</span><span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">· 12 valoraciones</span></div>
    {ga.comentario(*ga.COMENTARIOS[0]).replace('border-bottom: 1.5px dashed ' + LINEA + ';', '')}
    <div style="display: flex; align-items: center; gap: 10px; background: {CREMA}; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 10px 12px;">
      <span style="flex: 1; font-size: 13.5px; font-weight: 600; color: #9BA2B4;">Valorá y comentá…</span><span style="display: flex; gap: 2px;">{estrellas(0, 16)}</span>
    </div>
    <div style="margin-top: auto;">{indicador()}</div>
  </div>
'''
    return (barra_estado() + f'''  <header style="flex-shrink: 0; padding: 4px 16px 10px 16px; display: flex; align-items: center; gap: 12px;">
    {ga.boton_icono('equis', 'Cerrar', 40)}
    <div style="min-width: 0;"><div style="font-size: 17px; font-weight: 800; letter-spacing: -0.02em;">Parcial 1 resuelto</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Introducción a la Programación</div></div>
    <span style="margin-left: auto;">{boton_redondo('puntos', 'Más opciones')}</span>
  </header>
  <div style="flex-shrink: 0; padding: 0 16px 12px 16px; display: flex; flex-wrap: wrap; gap: 6px;">{ge.pastilla_tipo('Parcial', chica=True)}{chip('Ciclo 2025')}{chip('Prof. Gómez')}</div>
  <div style="flex-shrink: 0;">{visor}</div>
  <div style="flex-shrink: 0;">{acciones}</div>
''' + hoja_coment)

# ================================================================ 4 · EXPERIENCIAS DE UNA MATERIA
def m_experiencias():
    tiles = ''.join(f'<div style="{CARD} border-radius: 13px; background: #FDF3E5; padding: 11px 13px;"><div style="font-size: 24px; font-weight: 800; letter-spacing: -0.035em;">{n}<span style="font-size: 12px; font-weight: 700; color: {MUTED};">{u}</span></div>'
                    f'<div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{t}</div></div>'
                    for n, u, t in [('34', '', 'reseñas de cursada'), ('24', '', 'experiencias de final'), ('3,9', ' / 5', 'recomendación promedio'), ('15', ' de 22', 'aprobaron el final')])
    filtros = carrusel(''.join(gx.desplegable(t).replace('display: inline-flex;', 'flex-shrink: 0; display: inline-flex;') for t in ['Ciclo lectivo', 'Franja', 'Profesor/a', 'Situación']))
    segmentado = (f'<div style="display: grid; grid-template-columns: 1fr 1fr; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 4px; gap: 4px;">'
                  f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px; background: {BTN}; border-radius: 9px; padding: 9px 6px; font-size: 13.5px; font-weight: 800; color: #FFFFFF;">{ico("calendario", 14, "#FFFFFF", 2.2)}Cursadas <span style="opacity: 0.75;">34</span></span>'
                  f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px 6px; font-size: 13.5px; font-weight: 700;">{ico("birrete", 14, NAVY, 2.1)}Finales <span style="color: {MUTED};">24</span></span></div>')
    html = f'''    <div style="padding-top: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.14em; color: {BLUE};">EXPERIENCIAS · 1° AÑO</div>
    <h1 style="margin: 12px 0 0 0; font-size: 40px; line-height: 0.95; font-weight: 800; letter-spacing: -0.05em;">Análisis<br><span style="color: {BLUE};">Matemático II</span><span style="color: {ORANGE};">.</span></h1>
    <div style="margin-top: 16px; {CARD} padding: 14px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">{tiles}</div>
      <h3 style="margin: 16px 0 0 0; font-size: 15px; font-weight: 800;">Cómo terminó la cursada</h3>
      <div style="margin-top: 2px; font-size: 11.5px; font-weight: 600; color: {MUTED};">29 reseñas · 5 prefirieron no responder</div>
      <div style="margin-top: 12px;">{gx.barra_resultado()}</div>
    </div>
    <div style="margin-top: 18px;">{segmentado}</div>
    <div style="margin-top: 12px;">{filtros}</div>
    <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 10px;">
{resenia('av-birrete.png', 'Reseña de cursada · hace 2 días', 4, '“Los parciales son largos y toman todo lo de las guías. Arrancá con series desde la primera semana.”', ['Ciclo 2025', 'Tarde', 'Prof. A. Gómez'], 'Regular')}{resenia('av-guino.png', 'Reseña de cursada · hace 5 días', 5, '“La recursé y la segunda vez me fue mucho mejor. Los prácticos de la mañana van más despacio.”', ['Ciclo 2025', 'Mañana'], 'Promoción')}    </div>
    <div style="height: 74px;"></div>
'''
    return barra_estado() + cabecera_volver('Experiencias') + cuerpo(html) + fab('Escribir', 'pluma') + barra_tabs('experiencias')

# ================================================================ 5 · CLASIFICADOS
def m_clasificados():
    segmentado = (f'<div style="display: grid; grid-template-columns: 0.8fr 1.4fr 1.1fr; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 4px; gap: 4px;">'
                  f'<span style="display: flex; align-items: center; justify-content: center; background: {BTN}; border-radius: 9px; padding: 9px 4px; font-size: 13.5px; font-weight: 800; color: #FFFFFF;">Todo</span>'
                  f'<span style="display: flex; align-items: center; justify-content: center; padding: 9px 4px; font-size: 13.5px; font-weight: 700;">Compra y venta</span>'
                  f'<span style="display: flex; align-items: center; justify-content: center; padding: 9px 4px; font-size: 13.5px; font-weight: 700;">Tutorías</span></div>')
    cats = carrusel(''.join(f'<span style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid #E4DCCB; border-radius: 999px; padding: 7px 12px; font-size: 13px; font-weight: 700;">{ico(ic, 15, c, 2)}{t}</span>'
                            for t, ic, c in [('Libros', 'libro', '#E2560A'), ('Calculadoras', 'tablilla', '#E2560A'), ('Tecnología', 'monitor', BTN), ('Electrónica', 'engranaje', BTN)]))
    def aviso(img, badge, bg, titulo, precio, meta):
        return f'''    <article style="background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 10px; display: flex; gap: 12px;">
      <div style="width: 92px; height: 92px; flex-shrink: 0; border: 1.5px solid {NAVY}; border-radius: 10px; overflow: hidden;"><img src="{img}" alt="" style="display: block; width: 100%; height: 100%; object-fit: cover;"></div>
      <div style="flex: 1; min-width: 0; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><span style="display: inline-flex; background: {bg}; border-radius: 6px; padding: 2px 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; color: #FFFFFF;">{badge}</span>{ico('corazon', 17, '#9BA2B4', 2)}</div>
        <h3 style="margin: 6px 0 0 0; font-size: 14.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{titulo}</h3>
        <div style="margin-top: 3px; font-size: 16.5px; font-weight: 800; letter-spacing: -0.02em;">{precio}</div>
        <div style="margin-top: auto; padding-top: 4px; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: #7A8296;"><span style="width: 7px; height: 7px; border-radius: 999px; background: #37C46B; display: block;"></span>{meta}</div>
      </div>
    </article>
'''
    t = gc.TUTORES[0]
    tutor = f'''    <article style="{CARD} padding: 14px 15px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">{gc.insignia('tutoria')}{ico('corazon', 17, '#9BA2B4', 2)}</div>
      <div style="margin-top: 11px; display: flex; align-items: center; gap: 11px;"><img src="{t['av']}" alt="" style="width: 44px; height: 44px; border-radius: 999px; border: 1.5px solid {NAVY}; background: {t['fondo']};">
        <div><div style="font-size: 15px; font-weight: 800;">{t['nombre']}</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{t['carrera']}</div></div>
        <span style="margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; font-weight: 800;"><svg width="14" height="14" viewBox="0 0 24 24" fill="#E9B949" aria-hidden="true">{ESTRELLA}</svg>{t['nota']} <span style="font-weight: 600; color: {MUTED};">({t['opiniones']})</span></span></div>
      <div style="margin-top: 10px; font-size: 16.5px; font-weight: 800; letter-spacing: -0.02em;">{t['materia']}</div>
      <div style="margin-top: 7px; display: flex; flex-wrap: wrap; gap: 6px;">{''.join(chip(x, '#ECF2FE', '#2B4C8C') for x in t['temas'])}</div>
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1.5px solid {LINEA}; display: flex; align-items: center; gap: 10px; font-size: 12.5px; font-weight: 600; color: {TEXT2};"><b style="font-size: 16px; color: {NAVY};">{t['precio']}</b>/ hora · {t['modalidad']}</div>
    </article>
'''
    html = f'''    <h1 style="margin: 10px 0 0 0; font-size: 44px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Clasificados<span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 8px 0 0 0; font-size: 14.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Cosas y ayuda entre estudiantes. El contacto es directo.</p>
    <div style="margin-top: 16px;">{segmentado}</div>
    <div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 11px 14px;">{ico('lupa', 18, NAVY, 2.2)}<span style="font-size: 14px; font-weight: 600; color: #9BA2B4;">Libros, calculadoras, tutorías…</span></div>
    <div style="margin-top: 12px;">{cats}</div>
    {seccion('Recién publicado', '', 20)}
    <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 10px;">
{aviso('mini-calculadora.png', 'VENDO', '#FF5C9E', 'Calculadora Casio fx-991', '$ 35.000', 'Hace 2 h · FI UNJu')}{aviso('mini-raspberry.png', 'BUSCO', ORANGE, 'Raspberry Pi 4', 'Escucho ofertas', 'Hoy · San Salvador')}{tutor}{aviso('mini-arduino.png', 'VENDO', '#FF5C9E', 'Kit Arduino + sensores', '$ 45.000', 'Hace 1 día · FI UNJu')}    </div>
    <div style="height: 74px;"></div>
'''
    return barra_estado() + cabecera(True) + cuerpo(html) + fab('Publicar', 'mas') + barra_tabs('clasificados')

# ================================================================ 6 · MI MOCHILA
def m_mochila():
    subnav = carrusel(
        f'<span style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 8px 13px; font-size: 13.5px; font-weight: 800; color: #FFFFFF;">{ico("mochila", 15, "#FFFFFF", 2.1)}Mi mochila</span>'
        + ''.join(f'<span style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 8px 13px; font-size: 13.5px; font-weight: 700;">{ico(i, 15, NAVY, 2)}{t}</span>'
                  for i, t in [('persona', 'Mi perfil'), ('engranaje', 'Configuración')]))
    novedades = ''.join(f'<div style="display: flex; align-items: center; gap: 11px; padding: 10px 0; {"border-top: 1.5px solid " + LINEA + ";" if k else ""}">{ga.tile(ic, f, c, 34, 10)}'
                        f'<div style="min-width: 0;"><div style="font-size: 13.5px; font-weight: 800; line-height: 1.3;">{t}</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{s}</div></div></div>'
                        for k, (ic, f, c, t, s) in enumerate([('doc', '#FED3DF', '#E01F63', 'Nuevo parcial en Matemática Discreta', 'hace 1 h'),
                                                              ('check', VERDE_BG, VERDE_TX, 'Tu «Resumen unidad 2» se publicó', 'hace 3 h · +10 puntos'),
                                                              ('pluma', '#D6E5FB', BTN, '2 reseñas nuevas en Probabilidades', 'ayer'),
                                                              ('reloj', AMBAR_BG, AMBAR_TX, 'Tu publicación vence en 3 días', 'Calculadora Casio fx-991')]))
    def grupo(materia, n, filas):
        return (f'<div style="margin-top: 14px;"><div style="display: flex; align-items: baseline; justify-content: space-between;"><span style="font-size: 14px; font-weight: 800;">{materia}</span>'
                f'<span style="font-size: 12px; font-weight: 700; color: {MUTED};">{n} guardados</span></div><div style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px;">{filas}</div></div>')
    html = f'''    <h1 style="margin: 10px 0 0 0; font-size: 42px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Hola, <span style="color: {BLUE};">Max</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 8px 0 0 0; font-size: 14.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Esto es tuyo: solo lo ves vos.</p>
    <div style="margin-top: 14px;">{subnav}</div>
    <div style="margin-top: 16px; {CARD} padding: 12px 14px 4px 14px;">
      <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 17px; font-weight: 800;">Novedades</h2><span style="background: {PINK}; color: #FFFFFF; border-radius: 999px; padding: 2px 9px; font-size: 11.5px; font-weight: 800;">4</span></div>
      <div style="margin-top: 4px;">{novedades}</div>
    </div>
    {seccion('Guardados', 'Ver los 12', 24)}
    {grupo('Matemática Discreta', 3, fila_recurso('Parcial', 'Parcial 1 con grafos', 'Ciclo 2025 · Prof. Vera', 'PDF', 31) + fila_recurso('Resumen', 'Resumen de relaciones', 'Ciclo 2024', 'PDF', 18))}
    {grupo('Probabilidades y Estadística', 2, fila_recurso('Final', 'Final de julio 2025', 'Mesa de julio', 'PDF', 27))}
    {seccion('Mis envíos', 'Ver todos', 24)}
    <div style="margin-top: 12px; {CARD} padding: 4px 14px;">
      <div style="display: flex; align-items: center; gap: 10px; padding: 11px 0;"><span style="min-width: 0; flex: 1; font-size: 13.5px; font-weight: 800;">Guía de conteo resuelta</span>{ge.estado('En revisión previa', AMBAR_BG, AMBAR_TX, 'reloj')}</div>
      <div style="display: flex; align-items: center; gap: 10px; padding: 11px 0; border-top: 1.5px solid {LINEA};"><span style="min-width: 0; flex: 1; font-size: 13.5px; font-weight: 800;">Resumen unidad 2</span>{ge.estado('Publicado', VERDE_BG, VERDE_TX, 'check')}</div>
    </div>
'''
    return barra_estado() + cabecera(True) + cuerpo(html) + barra_tabs(None)

# ================================================================ salida
PAGINAS = [
    ('MovilInicio.dc.html', 'DevsProject · Inicio (mobile)', m_inicio, 1900, False),
    ('MovilMateria.dc.html', 'DevsProject · Materia (mobile)', m_materia, 1600, False),
    ('MovilRecurso.dc.html', 'DevsProject · Recurso (mobile)', m_recurso, 844, True),
    ('MovilExperiencias.dc.html', 'DevsProject · Experiencias (mobile)', m_experiencias, 1500, False),
    ('MovilClasificados.dc.html', 'DevsProject · Clasificados (mobile)', m_clasificados, 1500, False),
    ('MovilMochila.dc.html', 'DevsProject · Mi mochila (mobile)', m_mochila, 1500, False),
]
if __name__ == '__main__':
    for archivo, titulo, fn, alto, serif in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(documento_movil(titulo, alto, fn(), serif))
        print('escrito', archivo, alto)

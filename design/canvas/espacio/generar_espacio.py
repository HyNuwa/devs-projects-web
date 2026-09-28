# Genera la pestaña "Mi espacio": menu del avatar, Mi mochila (privada) y Mi perfil (publico).
import json, os, sys

SP = os.environ['SP']
sys.path.insert(0, os.path.join(SP, 'materias'))
from generar import (ico, chip, boton, estrellas, eyebrow, helmet, footer, ICONOS, TIPO, CARD,
                     NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2, LOGO)

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
AVATAR = 'av-max.png' if os.path.exists(os.path.join(OUT, 'av-max.png')) else 'av-birrete.png'

ICONOS.update({
    'mochila': '<path d="M8 6V5a4 4 0 0 1 8 0v1"></path><rect x="4.5" y="6" width="15" height="15" rx="4"></rect><path d="M8.5 13h7v4h-7z"></path>',
    'candado': '<rect x="5" y="11" width="14" height="10" rx="2.5"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>',
    'globo': '<circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18z"></path>',
    'salir': '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"></path><path d="m10 17 5-5-5-5"></path><path d="M15 12H3"></path>',
    'persona': '<circle cx="12" cy="8.5" r="3.6"></circle><path d="M4.5 20c0-3.6 3.4-6 7.5-6s7.5 2.4 7.5 6"></path>',
    'marcador': '<path d="M6 3h12v18l-6-4-6 4z"></path>',
    'carpeta': '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>',
    'enlace': '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"></path><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"></path>',
    'bandeja': '<path d="M3 13h5l1.5 3h5L16 13h5"></path><path d="M5 5h14l2 8v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"></path>',
    'check': '<path d="m5 13 4 4 10-10"></path>',
    'equis': '<path d="M6 6l12 12M18 6 6 18"></path>',
    'ojo': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"></path><circle cx="12" cy="12" r="3"></circle>',
    'compartir': '<circle cx="6" cy="12" r="2.5"></circle><circle cx="18" cy="6" r="2.5"></circle><circle cx="18" cy="18" r="2.5"></circle><path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6"></path>',
})

AMBAR_BG, AMBAR_TX, VERDE_BG, VERDE_TX, ROJO_BG, ROJO_TX = '#FDF0C8', '#8A5A00', '#E1F5E4', '#1F7A37', '#FDE2E2', '#B42318'

def pastilla_tipo(nombre, chica=False):
    _, sing, ic, f, c = TIPO[nombre]
    fs, pad = ('11px', '3px 8px 3px 6px') if chica else ('11.5px', '4px 10px 4px 7px')
    return (f'<span style="display: inline-flex; align-items: center; gap: 6px; background: {f}; border: 1.5px solid {NAVY}; border-radius: 999px; padding: {pad}; '
            f'font-size: {fs}; font-weight: 700; white-space: nowrap;">{ico(ic, 12, c, 2.2)}{sing}</span>')

def estado(texto, fondo, color, icono):
    return (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: {fondo}; border-radius: 7px; padding: 4px 9px; '
            f'font-size: 11px; font-weight: 800; color: {color}; white-space: nowrap;">{ico(icono, 12, color, 2.6)}{texto}</span>')

def titulo_seccion(texto, sub='', derecha=''):
    subh = f'<p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 500; color: {MUTED};">{sub}</p>' if sub else ''
    return f'''      <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;">
        <div><h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">{texto}</h2>{subh}</div>
        {derecha}
      </div>
'''

def link(texto):
    return f'<a href="#ver" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: {BLUE}; white-space: nowrap;">{texto} {ico("flecha", 14, BLUE, 2.4)}</a>'

# ------------------------------------------------ header con sesion iniciada
def header_logueado(menu_abierto=False):
    items = ['Inicio', 'Materias', 'Experiencias', 'Eventos', 'Clasificados']
    nav = ''.join(f'<a href="#{t.lower()}" style="color: #3D4459;">{t}</a>' for t in items)
    chip_borde = f'2px solid {BTN}' if menu_abierto else f'1.5px solid {NAVY}'
    return f'''  <header style="height: 68px; flex-shrink: 0; padding: 0 64px; display: flex; align-items: center; justify-content: space-between; gap: 28px; position: relative; z-index: 2;">
    <div style="display: flex; align-items: center; gap: 36px;">
      <a href="#inicio" style="display: flex; align-items: center; gap: 11px;">
        {LOGO}
        <span style="font-size: 23px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">DevsProject</span>
        <span style="color: {BTN}; font-size: 13px; line-height: 1;">✦</span>
      </a>
      <nav style="display: flex; align-items: center; gap: 24px; font-size: 15px; font-weight: 500;">{nav}</nav>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <button type="button" aria-label="Buscar" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: {NAVY};">{ico('lupa', 20)}</button>
      <a href="#subir" style="display: inline-flex; align-items: center; gap: 9px; background: {BTN}; border-radius: 11px; padding: 11px 18px; font-size: 14.5px; font-weight: 700; color: #FFFFFF;">{ico('subir', 17, trazo=2.3)} Subir material</a>
      <a href="#mochila" aria-label="Mi mochila, 4 novedades" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; color: {NAVY};">
        {ico('mochila', 21, NAVY, 2)}
        <span style="position: absolute; top: -7px; right: -7px; min-width: 19px; height: 19px; box-sizing: border-box; padding: 0 5px; border-radius: 999px; background: {PINK}; border: 2px solid #FDF3E5; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 800; color: #FFFFFF;">4</span>
      </a>
      <a href="#menu" aria-haspopup="menu" aria-expanded="{str(menu_abierto).lower()}" style="display: inline-flex; align-items: center; gap: 9px; background: #FFFFFF; border: {chip_borde}; border-radius: 999px; padding: 4px 12px 4px 4px; font-size: 14.5px; font-weight: 800; color: {NAVY};">
        <img src="{AVATAR}" alt="" style="width: 34px; height: 34px; border-radius: 999px; border: 1.5px solid {NAVY}; object-fit: cover;">
        Max {ico('abajo', 14, NAVY, 2.4, ' style="transform: rotate(180deg);"' if menu_abierto else '')}
      </a>
      <div style="margin-left: 10px; text-align: right; font-size: 10.5px; font-weight: 700; letter-spacing: 0.15em; line-height: 1.35; color: {NAVY};">UNJU<br>FI<div style="margin-top: 3px; height: 2px; background: {NAVY};"></div></div>
    </div>
  </header>
'''

# ------------------------------------------------ sub-navegacion "Mi espacio"
def subnav(activo):
    tabs = [('mochila', 'Mi mochila', 'mochila'), ('perfil', 'Mi perfil', 'persona'), ('config', 'Configuración', 'engranaje')]
    html = ''
    for clave, texto, icono in tabs:
        if clave == activo:
            html += (f'<a href="#{clave}" aria-current="page" style="display: inline-flex; align-items: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 8px 15px; font-size: 14px; font-weight: 800; color: #FFFFFF;">'
                     f'{ico(icono, 16, "#FFFFFF", 2.1)}{texto}</a>')
        else:
            html += (f'<a href="#{clave}" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 10px; padding: 8px 13px; font-size: 14px; font-weight: 700; color: {NAVY};">'
                     f'{ico(icono, 16, NAVY, 2)}{texto}</a>')
    if activo == 'mochila':
        nota = (f'<span style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">'
                f'{ico("candado", 15, NAVY, 2.1)}Tu mochila es privada: solo la ves vos</span>')
    elif activo == 'config':
        nota = (f'<span style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">'
                f'{ico("candado", 15, NAVY, 2.1)}Solo vos ves esta página</span>')
    else:
        nota = (f'<span style="margin-left: auto; display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 700; color: {TEXT2};">'
                f'{ico("globo", 15, NAVY, 2.1)}Tu perfil es público'
                f'<span style="display: inline-flex; align-items: center; gap: 6px; background: #F1EEE4; border-radius: 8px; padding: 5px 10px; font-size: 12.5px; font-weight: 700; color: {NAVY};">devsproject.com/u/max</span>'
                f'<a href="#copiar" style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: {BLUE};">{ico("enlace", 13, BLUE, 2.2)}Copiar</a></span>')
    return f'''  <div style="flex-shrink: 0; padding: 4px 64px 0 64px;">
    <nav aria-label="Mi espacio" style="display: flex; align-items: center; gap: 6px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 6px 16px 6px 8px;">
      <span style="padding: 0 10px 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: {MUTED};">MI ESPACIO</span>
      {html}
      {nota}
    </nav>
  </div>
'''

def documento(titulo, alto, header, cuerpo):
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{titulo}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
{helmet()}
<div style="width: 1440px; height: {alto}px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; position: relative; background: #FDF3E5; background-image: linear-gradient(rgba(2,18,56,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(2,18,56,0.032) 1px, transparent 1px); background-size: 44px 44px; font-family: 'Figtree', system-ui, sans-serif; color: {NAVY};">
{header}{cuerpo}{footer()}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":1440,"height":{alto}}}}}'>
class Component extends DCLogic {{}}
</script>
</body>
</html>
'''

# ================================================================ datos de muestra
# materias de 2° año del plan 2023 real (mas una recursada de 1°)
SIGO = [('09', 'Matemática Discreta', 2, 58), ('10', 'Teoría de la Información y la Comunicación', 0, 22),
        ('11', 'Desarrollo Sistemático de Programas', 1, 35), ('12', 'Probabilidades y Estadística', 1, 58),
        ('06', 'Análisis Matemático II', 0, 93)]

# ================================================================ MI MOCHILA
def saludo_hero():
    return f'''  <section style="flex-shrink: 0; position: relative; padding: 26px 64px 0 64px; min-height: 300px; box-sizing: border-box;">
    <div style="position: absolute; right: 60px; top: 6px; width: 600px; height: 300px; overflow: hidden;">
      <img src="hero-mochila-abierta.png" alt="Ilustración: el gato de DevsProject revisando una mochila abierta llena de apuntes, un parcial y una calculadora" style="display: block; position: absolute; left: 0; top: 0; width: 600px; height: auto;">
    </div>
    <span class="dp-hand" style="position: absolute; left: 700px; top: 34px; width: 130px; text-align: center; font-size: 20px; font-weight: 700; line-height: 1.05; transform: rotate(-5deg);">todo lo que necesitás, a mano ♥</span>
    <div style="position: relative; width: 660px;">
      {eyebrow('Mi mochila')}
      <h1 style="margin: 14px 0 0 0; font-size: 86px; line-height: 0.9; font-weight: 800; letter-spacing: -0.055em; color: {NAVY};">Buenas, <span style="color: {BLUE};">Max</span><span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 16px 0 0 0; font-size: 17.5px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 560px;">Tenés <b style="color: {NAVY};">4 novedades</b> en tus materias y <b style="color: {NAVY};">1 material en revisión</b>.</p>
      <div style="margin-top: 18px; display: flex; flex-wrap: wrap; gap: 9px;">
        <span style="display: inline-flex; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 7px 12px; font-size: 13px; font-weight: 700;">{ico('birrete', 15, BTN)}Ingeniería Informática · Plan 2023</span>
        <span style="display: inline-flex; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 7px 12px; font-size: 13px; font-weight: 700;">{ico('calendario', 15, BTN)}Cursando 2° año</span>
        <span style="display: inline-flex; align-items: center; gap: 7px; background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 7px 12px; font-size: 13px; font-weight: 700;">★ Nv. 5 · Siete vidas · 612 puntos</span>
      </div>
    </div>
  </section>
'''

def bloque_eventos():
    sys.path.insert(0, os.path.join(SP, 'eventos'))
    import generar_eventos
    return generar_eventos.bloque_mochila()

def p_mochila():
    materias = ''
    for cod, nom, nov, rec in SIGO:
        badge = (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: #FED3DF; border-radius: 6px; padding: 3px 8px; font-size: 11px; font-weight: 800; color: #B31450;">{nov} {"novedad" if nov == 1 else "novedades"}</span>'
                 if nov else f'<span style="font-size: 11px; font-weight: 700; color: {MUTED};">Al día</span>')
        materias += f'''        <a href="#materia-{cod}" style="{CARD} padding: 13px 14px; display: flex; flex-direction: column; color: {NAVY};">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">{cod}</span>{badge}
          </div>
          <span style="margin-top: 9px; font-size: 14.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{nom}</span>
          <span style="margin-top: auto; padding-top: 9px; display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: {MUTED};">{ico('doc', 12, MUTED, 2.2)}{rec} recursos</span>
        </a>
'''
    materias += f'''        <a href="#seguir" style="border: 1.5px dashed #B9AE96; border-radius: 16px; padding: 13px 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: {MUTED}; text-align: center;">
          <span style="width: 34px; height: 34px; border-radius: 999px; border: 1.5px dashed #B9AE96; display: flex; align-items: center; justify-content: center;">{ico('mas', 16, MUTED, 2.4)}</span>
          <span style="font-size: 13px; font-weight: 700;">Seguir materia</span>
        </a>
'''
    continuar = ''
    for tipo, tit, mat, cuando in [('Parcial', 'Parcial 1 resuelto', 'Probabilidades y Estadística', 'Abierto hace 2 h'),
                                   ('Guía de ejercicios', 'Guía 4: grafos', 'Matemática Discreta', 'Abierto ayer'),
                                   ('Final', 'Final de julio', 'Análisis Matemático II', 'Abierto hace 3 días')]:
        continuar += f'''          <article style="{CARD} padding: 15px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">{pastilla_tipo(tipo, True)}<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; font-weight: 600; color: {MUTED};">{ico('reloj', 12, MUTED, 2.1)}{cuando}</span></div>
            <div>
              <h3 style="margin: 0; font-size: 16px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{tit}</h3>
              <div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: {BLUE};">{mat}</div>
            </div>
            <a href="#continuar" style="margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 7px 13px; font-size: 12.5px; font-weight: 700; color: #FFFFFF;">Continuar {ico('flecha', 12, '#FFFFFF', 2.5)}</a>
          </article>
'''
    guardados_filas = ''
    for i, (tipo, tit, mat, ciclo, util, cuando) in enumerate([
            ('Resumen', 'Resumen de probabilidad condicional', 'Probabilidades y Estadística', 'Ciclo 2025', 34, 'Guardado hoy'),
            ('Parcial', 'Parcial 2 con resolución', 'Análisis Matemático II', 'Ciclo 2024', 51, 'Hace 2 días'),
            ('Apunte', 'Relaciones y funciones', 'Matemática Discreta', 'Ciclo 2025', 18, 'Hace 4 días'),
            ('Trabajo práctico', 'TP 3: invariantes de ciclo', 'Desarrollo Sistemático de Programas', 'Ciclo 2025', 9, 'Hace 1 semana'),
            ('Final', 'Final de diciembre', 'Análisis Matemático II', 'Ciclo 2024', 27, 'Hace 2 semanas')]):
        borde = 'border-top: 1.5px solid #EFE7D8;' if i else ''
        guardados_filas += f'''          <div style="display: grid; grid-template-columns: 158px minmax(0, 1fr) 150px 96px 34px; align-items: center; gap: 14px; padding: 12px 4px; {borde}">
            <span>{pastilla_tipo(tipo, True)}</span>
            <span style="min-width: 0;"><span style="display: block; font-size: 14.5px; font-weight: 800; letter-spacing: -0.015em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{tit}</span><span style="display: block; margin-top: 2px; font-size: 12px; font-weight: 700; color: {BLUE}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{mat} <span style="font-weight: 600; color: {MUTED};">· {ciclo}</span></span></span>
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700;">{ico('corazon', 14, PINK, 2.1)}{util} <span style="font-weight: 600; color: {MUTED};">Me sirvió</span></span>
            <span style="font-size: 12px; font-weight: 600; color: {MUTED};">{cuando}</span>
            <a href="#quitar" aria-label="Quitar de guardados" style="width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border: 1.5px solid {NAVY}; border-radius: 9px; background: #D6E5FB;"><svg width="14" height="14" viewBox="0 0 24 24" fill="{BTN}" stroke="{NAVY}" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">{ICONOS['marcador']}</svg></a>
          </div>
'''
    tabs_g = ''.join(
        (f'<a href="#g-{k}" aria-current="true" style="display: inline-flex; align-items: center; gap: 7px; background: {NAVY}; border-radius: 9px; padding: 7px 13px; font-size: 13px; font-weight: 800; color: #FFFFFF;">{t} <span style="opacity: 0.7;">{n}</span></a>'
         if k == 'recursos' else
         f'<a href="#g-{k}" style="display: inline-flex; align-items: center; gap: 7px; border: 1.5px solid #DCD3C0; border-radius: 9px; padding: 6px 12px; font-size: 13px; font-weight: 700; color: {NAVY};">{t} <span style="color: {MUTED};">{n}</span></a>')
        for k, t, n in [('recursos', 'Recursos', 12), ('tutores', 'Tutores', 2), ('clasificados', 'Clasificados', 4)])
    colecciones = ''
    for nom, n, fondo, color, cuando in [('Para el parcial de Probabilidades', 6, '#FED3DF', '#E01F63', 'Actualizada hoy'),
                                         ('Finales de Análisis II', 4, '#D6E5FB', BTN, 'Hace 1 semana'),
                                         ('Grafos y árboles', 3, '#F0F7C9', '#6E9400', 'Hace 2 semanas')]:
        colecciones += f'''          <a href="#coleccion" style="{CARD} padding: 15px; display: flex; flex-direction: column; gap: 10px; color: {NAVY};">
            <span style="width: 40px; height: 40px; border-radius: 11px; border: 1.5px solid {NAVY}; background: {fondo}; display: flex; align-items: center; justify-content: center;">{ico('carpeta', 20, color, 2)}</span>
            <span style="font-size: 14.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{nom}</span>
            <span style="margin-top: auto; font-size: 12px; font-weight: 600; color: {MUTED};">{n} recursos · {cuando}</span>
          </a>
'''
    colecciones += f'''          <a href="#nueva-coleccion" style="border: 1.5px dashed #B9AE96; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: {MUTED};">
            <span style="width: 40px; height: 40px; border-radius: 11px; border: 1.5px dashed #B9AE96; display: flex; align-items: center; justify-content: center;">{ico('mas', 18, MUTED, 2.4)}</span>
            <span style="font-size: 13px; font-weight: 700;">Nueva colección</span>
          </a>
'''
    novedades = ''
    for i, (icono_html, texto, sub, cuando) in enumerate([
            (pastilla_tipo('Final', True), 'Nuevo final subido', 'Análisis Matemático II', 'hace 1 h'),
            (pastilla_tipo('Resumen', True), 'Nuevo resumen subido', 'Probabilidades y Estadística', 'hace 3 h'),
            (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: #EDE6FB; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 3px 8px 3px 6px; font-size: 11px; font-weight: 700;">{ico("pluma", 12, "#5B4B8A", 2.2)}Reseña</span>', 'Nueva reseña de cursada', 'Matemática Discreta', 'ayer'),
            (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: #FED3DF; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 3px 8px 3px 6px; font-size: 11px; font-weight: 700;">{ico("corazon", 12, "#E01F63", 2.2)}Tu aporte</span>', 'Tu «Parcial 1 resuelto» le sirvió a 12 personas más', 'Análisis Matemático II', 'ayer')]):
        borde = 'border-top: 1.5px solid #EFE7D8;' if i else ''
        novedades += f'''          <div style="display: flex; flex-direction: column; gap: 6px; padding: 12px 0; {borde}">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">{icono_html}<span style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{cuando}</span></div>
            <span style="font-size: 14px; font-weight: 800; letter-spacing: -0.015em; line-height: 1.3;">{texto}</span>
            <span style="font-size: 12px; font-weight: 700; color: {BLUE};">{sub}</span>
          </div>
'''
    envios = ''
    for i, (tit, mat, est, nota) in enumerate([
            ('Resumen unidad 4', 'Probabilidades y Estadística', estado('En revisión previa', AMBAR_BG, AMBAR_TX, 'reloj'), 'Subido hace 1 h'),
            ('Guía resuelta del TP 2', 'Desarrollo Sistemático de Programas', estado('Publicado', VERDE_BG, VERDE_TX, 'check'), 'Hace 3 días · ya es público'),
            ('Fotos de la clase 5', 'Matemática Discreta', estado('No aprobado', ROJO_BG, ROJO_TX, 'equis'), 'Motivo: el archivo no se puede leer')]):
        borde = 'border-top: 1.5px solid #EFE7D8;' if i else ''
        envios += f'''          <div style="display: flex; flex-direction: column; gap: 5px; padding: 12px 0; {borde}">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;"><span style="font-size: 14px; font-weight: 800; letter-spacing: -0.015em;">{tit}</span>{est}</div>
            <span style="font-size: 12px; font-weight: 700; color: {BLUE};">{mat}</span>
            <span style="font-size: 12px; font-weight: 600; color: {MUTED};">{nota}</span>
          </div>
'''
    cuerpo = subnav('mochila') + saludo_hero() + f'''
  <section style="flex-shrink: 0; margin-top: 30px; padding: 0 64px;">
{titulo_seccion('Materias que sigo', 'Tu cursada de este cuatrimestre y una recursada.', link('Ver plan de estudios'))}
    <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px;">
{materias}    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 34px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 372px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 32px;">
      <div>
{titulo_seccion('Continuar estudiando', 'Lo último que abriste.')}
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
{continuar}        </div>
      </div>
      <div style="{CARD} padding: 18px 20px 8px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;"><h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">Guardados</h2><div style="display: flex; gap: 6px;">{tabs_g}</div></div>
          {link('Ver los 12')}
        </div>
        <div style="margin-top: 8px;">
{guardados_filas}        </div>
      </div>
      <div>
{titulo_seccion('Colecciones', 'Agrupá lo guardado por parcial, tema o materia.')}
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px;">
{colecciones}        </div>
      </div>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 18px 20px 6px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Novedades de tus materias</h2><span style="min-width: 22px; height: 22px; box-sizing: border-box; padding: 0 6px; border-radius: 999px; background: {PINK}; display: flex; align-items: center; justify-content: center; font-size: 11.5px; font-weight: 800; color: #FFFFFF;">4</span></div>
        <div style="margin-top: 4px;">
{novedades}        </div>
      </div>
{bloque_eventos()}      <div style="{CARD} padding: 18px 20px 12px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Mis envíos</h2>{link('Ver todos')}</div>
        <p style="margin: 6px 0 0 0; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {MUTED};">Se publica al instante. Acá ves si algo quedó en revisión previa o lo retiraron.</p>
        <div style="margin-top: 4px;">
{envios}        </div>
      </div>
    </aside>
  </section>
'''
    return cuerpo

# ================================================================ MI PERFIL (vista publica, vista por el dueño)
def p_perfil():
    stats = ''
    for num, lab, color in [('24', 'aportes publicados', NAVY), ('318', 'veces «Me sirvió»', '#E01F63'),
                            ('4', 'experiencias públicas', NAVY), ('2', 'tutorías activas', NAVY)]:
        stats += (f'<div style="background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 13px 15px;">'
                  f'<div style="font-size: 30px; font-weight: 800; letter-spacing: -0.04em; color: {color};">{num}</div>'
                  f'<div style="margin-top: 2px; font-size: 12.5px; font-weight: 700; color: {MUTED};">{lab}</div></div>')
    tabs = ''.join(
        (f'<a href="#t-{k}" aria-current="true" style="display: inline-flex; align-items: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 15px; font-size: 14px; font-weight: 800; color: #FFFFFF;">{ico(ic, 15, "#FFFFFF", 2.1)}{t} <span style="opacity: 0.75;">{n}</span></a>'
         if k == 'materiales' else
         f'<a href="#t-{k}" style="display: inline-flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 15px; font-size: 14px; font-weight: 700; color: {NAVY};">{ico(ic, 15, NAVY, 2)}{t} <span style="color: {MUTED};">{n}</span></a>')
        for k, t, ic, n in [('materiales', 'Materiales', 'doc', 24), ('experiencias', 'Experiencias', 'pluma', 4),
                            ('tutorias', 'Tutorías', 'birrete', 2), ('clasificados', 'Clasificados', 'marcador', 3)])
    aportes = ''
    for tipo, tit, mat, ciclo, util in [
            ('Parcial', 'Parcial 1 resuelto', 'Análisis Matemático II', 'Ciclo 2025', 64),
            ('Resumen', 'Resumen de series', 'Análisis Matemático II', 'Ciclo 2025', 41),
            ('Guía de ejercicios', 'Guía resuelta: matrices', 'Álgebra Lineal', 'Ciclo 2024', 38),
            ('Apunte', 'Punteros sin miedo', 'Estructura de Datos', 'Ciclo 2024', 29),
            ('Final', 'Final de diciembre', 'Física Mecánica', 'Ciclo 2024', 22),
            ('Trabajo práctico', 'TP 2: recursividad', 'Introducción a la Programación', 'Ciclo 2024', 17)]:
        aportes += f'''          <article style="{CARD} padding: 15px; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; justify-content: space-between;">{pastilla_tipo(tipo, True)}{ico('doc', 17, '#9BA2B4', 1.9)}</div>
            <div>
              <h3 style="margin: 0; font-size: 15.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{tit}</h3>
              <div style="margin-top: 4px; font-size: 13px; font-weight: 700; color: {BLUE};">{mat}</div>
              <div style="margin-top: 4px; font-size: 11.5px; font-weight: 600; color: #808799;">{ciclo} · PDF</div>
            </div>
            <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between;">
              <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700;">{ico('corazon', 15, PINK, 2.1)}{util} <span style="font-weight: 600; color: {MUTED};">Me sirvió</span></span>
              <a href="#recurso" style="display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 6px 11px; font-size: 12px; font-weight: 700; color: {NAVY};">Ver {ico('flecha', 12, NAVY, 2.5)}</a>
            </div>
          </article>
'''
    insignias = ''
    for nombre, ic, fondo, color, ganada in [('Primer aporte', 'subir', '#D6E5FB', BTN, True), ('10 aportes', 'doc', '#FDE7D0', '#E2560A', True),
                                             ('Le sirvió a 100', 'corazon', '#FED3DF', '#E01F63', True), ('Reseñador', 'pluma', '#EDE6FB', '#5B4B8A', True),
                                             ('50 aportes', 'doc', '#F1EEE4', '#B8AE98', False), ('Tutor destacado', 'birrete', '#F1EEE4', '#B8AE98', False)]:
        borde = f'1.5px solid {NAVY}' if ganada else '1.5px dashed #C9BFA8'
        texto = NAVY if ganada else '#9A917E'
        extra = '' if ganada else f'<span style="font-size: 10.5px; font-weight: 700; color: #9A917E;">Bloqueada</span>'
        insignias += (f'<div style="display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center;">'
                      f'<span style="width: 54px; height: 54px; border-radius: 999px; border: {borde}; background: {fondo}; display: flex; align-items: center; justify-content: center;">{ico(ic, 24, color, 2)}</span>'
                      f'<span style="font-size: 12px; font-weight: 800; line-height: 1.2; color: {texto};">{nombre}</span>{extra}</div>')
    donde = ''.join(
        f'<div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 9px 0; {"border-top: 1.5px solid #EFE7D8;" if i else ""}">'
        f'<span style="display: flex; align-items: center; gap: 10px; min-width: 0;"><span style="font-size: 11px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">{cod}</span>'
        f'<span style="font-size: 13.5px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{m}</span></span>'
        f'<span style="font-size: 12.5px; font-weight: 700; color: {MUTED}; white-space: nowrap;">{n} aportes</span></div>'
        for i, (cod, m, n) in enumerate([('06', 'Análisis Matemático II', 9), ('02', 'Álgebra Lineal', 6), ('08', 'Estructura de Datos', 4)]))
    cuerpo = subnav('perfil') + f'''
  <section style="flex-shrink: 0; margin-top: 18px; padding: 0 64px;">
    <div style="display: flex; align-items: center; gap: 12px; background: #D9E7FB; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 10px 14px 10px 16px;">
      {ico('ojo', 18, NAVY, 2)}
      <span style="font-size: 13.5px; font-weight: 600; color: {NAVY};"><b>Así ven tu perfil los demás.</b> Tus guardados y tus experiencias anónimas no aparecen acá.</span>
      <span style="margin-left: auto; display: flex; gap: 8px;">{boton('Editar perfil', 'pluma', primario=False, chico=True)}{boton('Compartir', 'compartir', chico=True)}</span>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 16px; padding: 0 64px;">
    <div style="{CARD} padding: 26px 28px; display: grid; grid-template-columns: 170px minmax(0, 1fr) 420px; gap: 30px; align-items: center; position: relative; overflow: hidden;">
      <div style="position: relative; justify-self: center;">
        <img src="{AVATAR}" alt="" style="display: block; width: 160px; height: 160px; border-radius: 999px; border: 2px solid {NAVY}; object-fit: cover;">
        <span style="position: absolute; left: 50%; bottom: -10px; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 5px; background: #C8FB10; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 5px 12px; font-size: 12.5px; font-weight: 900; white-space: nowrap;">★ Nv. 5 · Siete vidas</span>
      </div>
      <div style="min-width: 0;">
        {eyebrow('Credencial DevsProject')}
        <h1 style="margin: 12px 0 0 0; font-size: 74px; line-height: 0.9; font-weight: 800; letter-spacing: -0.055em; color: {NAVY};">Max<span style="color: {ORANGE};">.</span></h1>
        <div style="margin-top: 8px; font-size: 15px; font-weight: 700; color: {MUTED};">@max · Miembro desde marzo de 2025</div>
        <div style="margin-top: 10px; font-size: 15.5px; font-weight: 700; color: {TEXT2};">Ingeniería Informática · 2° año · Facultad de Ingeniería, UNJu</div>
        <p style="margin: 10px 0 0 0; font-size: 15px; line-height: 1.55; font-weight: 500; color: #4B5265; max-width: 520px;">Subo lo que me sirvió para aprobar. Si algo de mis resúmenes no se entiende, avisame y lo mejoro.</p>
        <div style="margin-top: 16px; max-width: 470px;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; font-size: 12.5px; font-weight: 700;"><span>Nv. 5 · Siete vidas</span><span style="color: {MUTED};">612 / 900 puntos</span></div>
          <div style="margin-top: 6px; height: 12px; border-radius: 999px; border: 1.5px solid {NAVY}; background: #FFFFFF; overflow: hidden;"><div style="width: 82.6%; height: 100%; background: {BTN};"></div></div>
          <div style="margin-top: 5px; font-size: 11.5px; font-weight: 600; color: {MUTED};">Faltan 288 puntos para Nv. 6 · Apuntes de oro</div>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">{stats}</div>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 28px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 356px; gap: 28px; align-items: start;">
    <div>
      <div style="display: flex; align-items: center; gap: 10px;">
        {tabs}
        <span style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; border: 1.5px solid #E4DCCB; border-radius: 10px; padding: 9px 13px; font-size: 13.5px; font-weight: 600;">Más útiles {ico('abajo', 13, NAVY, 2.4)}</span>
      </div>
      <p style="margin: 14px 0 0 0; font-size: 13.5px; font-weight: 500; color: {MUTED};">Materiales que Max compartió con la comunidad.</p>
      <div style="margin-top: 14px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
{aportes}      </div>
      <div style="margin-top: 16px; display: flex; justify-content: center;">{boton('Ver los 24 materiales', 'flecha', primario=False, chico=True)}</div>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 18px 20px; position: relative; overflow: hidden;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Insignias</h2><span style="font-size: 12.5px; font-weight: 700; color: {MUTED};">4 de 12</span></div>
        <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px 10px;">{insignias}</div>
      </div>
      <div style="{CARD} padding: 16px 20px 8px 20px;">
        <h2 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Donde más aporta</h2>
        {donde}
      </div>
      <div style="position: relative; background: #FFFFFF; border: 1.5px dashed {NAVY}; border-radius: 16px; padding: 16px 18px; overflow: hidden;">
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">{ico('candado', 14, MUTED, 2.2)}SOLO LO VES VOS</div>
        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 200px;">Tenés <b>3 experiencias anónimas</b>: no aparecen ni se cuentan en tu perfil público.</p>
        <a href="#mis-experiencias" style="margin-top: 8px; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; color: {BLUE};">Administrar mis experiencias {ico('flecha', 12, BLUE, 2.4)}</a>
        <img src="gato-trofeo.png" alt="" style="position: absolute; right: -14px; bottom: -12px; width: 110px; height: auto;">
      </div>
    </aside>
  </section>
'''
    return cuerpo

# ================================================================ MENU DEL AVATAR (estado abierto)
def p_menu():
    items = [('mochila', 'Mi mochila', f'<span style="background: {PINK}; color: #FFFFFF; border-radius: 999px; padding: 2px 8px; font-size: 11px; font-weight: 800;">4 novedades</span>', True),
             ('persona', 'Ver mi perfil público', '', False),
             ('doc', 'Mis aportes', f'<span style="font-size: 12.5px; font-weight: 700; color: {MUTED};">24</span>', False),
             ('bandeja', 'Mis envíos', estado('1 en revisión previa', AMBAR_BG, AMBAR_TX, 'reloj'), False),
             ('engranaje', 'Configuración', '', False)]
    filas = ''
    for ic, t, extra, activo in items:
        fondo = 'background: #ECF2FE;' if activo else ''
        filas += (f'<a href="#{t}" role="menuitem" style="display: flex; align-items: center; gap: 12px; border-radius: 10px; padding: 10px 12px; {fondo} color: {NAVY};">'
                  f'{ico(ic, 18, BTN if activo else NAVY, 2)}<span style="font-size: 14.5px; font-weight: {800 if activo else 700};">{t}</span>'
                  f'<span style="margin-left: auto;">{extra}</span></a>')
    menu = f'''  <div role="menu" aria-label="Menú de Max" style="position: absolute; right: 150px; top: 76px; width: 330px; z-index: 5; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 16px; box-shadow: 6px 6px 0 {NAVY}; padding: 10px;">
    <div style="display: flex; align-items: center; gap: 12px; padding: 8px 8px 14px 8px; border-bottom: 1.5px solid #EFE7D8;">
      <img src="{AVATAR}" alt="" style="width: 50px; height: 50px; border-radius: 999px; border: 1.5px solid {NAVY};">
      <div style="min-width: 0;">
        <div style="font-size: 17px; font-weight: 800; letter-spacing: -0.02em;">Max <span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">@max</span></div>
        <div style="font-size: 12.5px; font-weight: 600; color: {TEXT2};">Ingeniería Informática · FI UNJu</div>
        <div style="margin-top: 5px; display: inline-flex; align-items: center; gap: 5px; background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 2px 9px; font-size: 11px; font-weight: 800;">★ Nv. 5 · Siete vidas</div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 2px; padding: 8px 0; border-bottom: 1.5px solid #EFE7D8;">{filas}</div>
    <a href="#salir" role="menuitem" style="margin-top: 6px; display: flex; align-items: center; gap: 12px; border-radius: 10px; padding: 10px 12px; color: {TEXT2};">{ico('salir', 18, TEXT2, 2)}<span style="font-size: 14.5px; font-weight: 700;">Cerrar sesión</span></a>
  </div>
'''
    detras = saludo_hero()
    nota = f'''  <span class="dp-hand" style="position: absolute; right: 500px; top: 150px; width: 170px; text-align: right; font-size: 22px; font-weight: 700; line-height: 1.1; color: {NAVY}; transform: rotate(-4deg); z-index: 4;">tocás tu avatar y tenés todo lo tuyo →</span>
'''
    return subnav('mochila') + detras + menu

PAGINAS = [
    ('MenuAvatar.dc.html', 'DevsProject · Menú de usuario', lambda: header_logueado(True), p_menu, 640),
    ('Mochila.dc.html', 'DevsProject · Mi mochila', lambda: header_logueado(False), p_mochila, 1640),
    ('Perfil.dc.html', 'DevsProject · Perfil de Max', lambda: header_logueado(False), p_perfil, 1420),
]
if __name__ == '__main__':
  for archivo, titulo, fh, fb, alto in PAGINAS:
      alto = ALTOS.get(archivo, alto)
      html = documento(titulo, alto, fh(), fb())
      if archivo == 'MenuAvatar.dc.html':
          # el menu es un recorte: sin pie, solo el header, el saludo y el menu abierto
          html = html.replace(footer(), '')
      with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
          f.write(html)
      print('escrito', archivo, alto)

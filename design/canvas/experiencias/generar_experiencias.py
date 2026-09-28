# Genera la pestaña "Experiencias": portada sin sesion, recorte con sesion, experiencias de una
# materia (resumen + lista filtrable) y el formulario para escribir una experiencia.
import json, os, sys

SP = os.environ['SP']
sys.path.insert(0, os.path.join(SP, 'materias'))
from generar import (ico, chip, boton, estrellas, eyebrow, helmet, footer, header, breadcrumb, ICONOS,
                     CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2, LOGO)

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}

ICONOS.update({
    'mochila': '<path d="M8 6V5a4 4 0 0 1 8 0v1"></path><rect x="4.5" y="6" width="15" height="15" rx="4"></rect><path d="M8.5 13h7v4h-7z"></path>',
    'bandera': '<path d="M5 21V4.5C7.5 3 10 5 12.5 4S17 3 19 4.2v8.6c-2 1.2-4 .2-6.5 1.2S7.5 13 5 14.5"></path>',
    'info': '<circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 7.5h.01"></path>',
    'candado': '<rect x="5" y="11" width="14" height="10" rx="2.5"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path>',
    'ojo': '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"></path><circle cx="12" cy="12" r="3"></circle>',
    'check': '<path d="m5 13 4 4 10-10"></path>',
})

# rampa ordinal validada (validate_palette.js --ordinal, superficie #FEFEFE): Promocion -> Regular -> Libre
RAMPA = {'Promoción': '#0A3FC7', 'Regular': '#4A7BE9', 'Libre': '#90AEF1'}
SERIE = BTN   # dificultad: una sola serie, un solo tono

CSS_EXTRA = '''  .dp-tip { position: relative; }
  .dp-tip:hover::after { content: attr(data-tip); position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); white-space: nowrap; background: #021238; color: #FFFFFF; font: 700 12px/1 'Figtree', sans-serif; padding: 7px 9px; border-radius: 8px; pointer-events: none; z-index: 6; }
'''

def documento(titulo, alto, cabecera, cuerpo, con_pie=True):
    h = helmet().replace('</style>', CSS_EXTRA + '</style>')
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
<div style="width: 1440px; height: {alto}px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; position: relative; background: #FDF3E5; background-image: linear-gradient(rgba(2,18,56,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(2,18,56,0.032) 1px, transparent 1px); background-size: 44px 44px; font-family: 'Figtree', system-ui, sans-serif; color: {NAVY};">
{cabecera}{cuerpo}{footer() if con_pie else ''}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":1440,"height":{alto}}}}}'>
class Component extends DCLogic {{}}
</script>
</body>
</html>
'''

def header_logueado(activo='Experiencias'):
    items = ['Inicio', 'Materias', 'Experiencias', 'Eventos', 'Clasificados']
    nav = ''.join(
        (f'<a href="#{t.lower()}" style="color: {BLUE}; font-weight: 700; padding-bottom: 3px; border-bottom: 2px solid {BLUE};">{t}</a>'
         if t == activo else f'<a href="#{t.lower()}" style="color: #3D4459;">{t}</a>') for t in items)
    return f'''  <header style="height: 68px; flex-shrink: 0; padding: 0 64px; display: flex; align-items: center; justify-content: space-between; gap: 28px;">
    <div style="display: flex; align-items: center; gap: 36px;">
      <a href="#inicio" style="display: flex; align-items: center; gap: 11px;">{LOGO}<span style="font-size: 23px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">DevsProject</span><span style="color: {BTN}; font-size: 13px; line-height: 1;">✦</span></a>
      <nav style="display: flex; align-items: center; gap: 24px; font-size: 15px; font-weight: 500;">{nav}</nav>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <button type="button" aria-label="Buscar" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: {NAVY};">{ico('lupa', 20)}</button>
      <a href="#subir" style="display: inline-flex; align-items: center; gap: 9px; background: {BTN}; border-radius: 11px; padding: 11px 18px; font-size: 14.5px; font-weight: 700; color: #FFFFFF;">{ico('subir', 17, trazo=2.3)} Subir material</a>
      <a href="#mochila" aria-label="Mi mochila, 4 novedades" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px;">{ico('mochila', 21, NAVY, 2)}<span style="position: absolute; top: -7px; right: -7px; min-width: 19px; height: 19px; box-sizing: border-box; padding: 0 5px; border-radius: 999px; background: {PINK}; border: 2px solid #FDF3E5; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 800; color: #FFFFFF;">4</span></a>
      <a href="#menu" style="display: inline-flex; align-items: center; gap: 9px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 4px 12px 4px 4px; font-size: 14.5px; font-weight: 800; color: {NAVY};"><img src="av-max.png" alt="" style="width: 34px; height: 34px; border-radius: 999px; border: 1.5px solid {NAVY};">Max {ico('abajo', 14, NAVY, 2.4)}</a>
      <div style="margin-left: 10px; text-align: right; font-size: 10.5px; font-weight: 700; letter-spacing: 0.15em; line-height: 1.35; color: {NAVY};">UNJU<br>FI<div style="margin-top: 3px; height: 2px; background: {NAVY};"></div></div>
    </div>
  </header>
'''

def seccion(texto, sub='', derecha=''):
    s = f'<p style="margin: 5px 0 0 0; font-size: 14px; font-weight: 500; color: {MUTED};">{sub}</p>' if sub else ''
    return (f'<div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 20px;">'
            f'<div><h2 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">{texto}</h2>{s}</div>{derecha}</div>')

def link(texto, href='#ver'):
    return f'<a href="{href}" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: {BLUE}; white-space: nowrap;">{texto} {ico("flecha", 14, BLUE, 2.4)}</a>'

def pildora(texto, activo=False, icono=None, contador=None):
    ic = ico(icono, 15, '#FFFFFF' if activo else NAVY, 2.1) if icono else ''
    n = f'<span style="opacity: {0.75 if activo else 1}; color: {"#FFFFFF" if activo else MUTED};">{contador}</span>' if contador is not None else ''
    if activo:
        return f'<a href="#f" style="display: inline-flex; align-items: center; gap: 7px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 8px 14px; font-size: 13.5px; font-weight: 800; color: #FFFFFF;">{ic}{texto}{n}</a>'
    return f'<a href="#f" style="display: inline-flex; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 8px 14px; font-size: 13.5px; font-weight: 700; color: {NAVY};">{ic}{texto}{n}</a>'

def desplegable(texto):
    return (f'<span style="display: inline-flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 12px; font-size: 13.5px; font-weight: 700;">'
            f'{texto}{ico("abajo", 13, NAVY, 2.4)}</span>')

def avatar(src, tam=40):
    return f'<img src="{src}" alt="" style="width: {tam}px; height: {tam}px; border-radius: 999px; border: 1.5px solid {NAVY}; flex-shrink: 0; object-fit: cover;">'

def iniciales(ini, fondo, color, tam=40):
    return (f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex-shrink: 0; border-radius: 999px; border: 1.5px solid {NAVY}; background: {fondo}; '
            f'display: flex; align-items: center; justify-content: center; font-size: {round(tam*0.34)}px; font-weight: 800; color: {color};">{ini}</span>')

def resultado_chip(res, nota=None):
    etiqueta = f'{res} · {nota}' if nota else res
    if res in RAMPA:   # la misma muestra de color que el grafico: identidad por la muestra, texto en tinta
        return (f'<span style="display: inline-flex; align-items: center; gap: 6px; background: #F1EEE4; border-radius: 7px; padding: 5px 10px; font-size: 11.5px; font-weight: 800; color: {NAVY};">'
                f'<span style="width: 9px; height: 9px; border-radius: 3px; background: {RAMPA[res]}; display: block;"></span>{etiqueta}</span>')
    return chip(etiqueta, '#F1EEE4', NAVY, 800)

# ================================================================ datos de muestra
COMENTADAS = [
    ('06', 'Análisis Matemático II', 'Ing. Informática', '1° año', 58, 38, 'Alta', 'hace 1 h'),
    ('01', 'Introducción a la Programación', 'Ing. Informática', '1° año', 46, 52, 'Media', 'hace 3 h'),
    ('07', 'Física Mecánica', 'Ing. Informática', '1° año', 41, 21, 'Muy alta', 'ayer'),
    ('QG', 'Química General', 'Ing. Química', '1° año', 38, 34, 'Alta', 'ayer'),
    ('08', 'Estructura de Datos', 'Ing. Informática', '1° año', 37, 44, 'Alta', 'hace 2 días'),
    ('14', 'Bases de Datos', 'Ing. Informática', '2° año', 29, 63, 'Baja', 'hace 3 días'),
]
RECIENTES = [
    dict(av='av-crema.png', autor='Anónimo', tipo='Reseña de cursada', materia='Análisis Matemático II', est=4,
         texto='“Los parciales son largos: practicá con tiempo. Las guías resueltas de la comunidad me salvaron.”',
         chips=['Ciclo 2025', 'Tarde', 'Primera cursada'], res='Regular', dif='Dificultad alta'),
    dict(av='av-birrete.png', autor='Anónimo', tipo='Experiencia de final', materia='Física Mecánica', est=None,
         texto='“Final escrito: tres problemas y una pregunta de teoría. Tomaron tiro oblicuo y rozamiento.”',
         chips=['Mesa de diciembre 2024', 'Escrito'], res='Aprobado · 7', dif='Dificultad muy alta'),
    dict(av='av-guino.png', autor='Lucía P.', tipo='Reseña de cursada', materia='Bases de Datos', est=5,
         texto='“El TP integrador en grupo suma muchísimo. Si hacés las consultas de las guías, la promocionás.”',
         chips=['Ciclo 2025', 'Noche', 'Primera cursada'], res='Promoción', dif='Dificultad baja'),
]

def tarjeta_materia(cod, nom, carrera, anio, n, promo, dif, cuando):
    dif_c = {'Baja': ('#E1F5E4', '#1F7A37'), 'Media': ('#F1EEE4', TEXT2), 'Alta': ('#FDE7D0', '#B14C06'), 'Muy alta': ('#FED3DF', '#B31450')}[dif]
    return f'''        <a href="#materia-{cod}" style="{CARD} padding: 16px; display: flex; flex-direction: column; color: {NAVY};">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">{cod}</span><span style="font-size: 11.5px; font-weight: 700; color: {MUTED};">{carrera} · {anio}</span></span>
          </div>
          <span style="margin-top: 10px; font-size: 17px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.2;">{nom}</span>
          <div style="margin-top: 14px; display: flex; align-items: flex-end; gap: 18px;">
            <div><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.04em; line-height: 1;">{n}</div><div style="margin-top: 3px; font-size: 11.5px; font-weight: 700; color: {MUTED};">experiencias</div></div>
            <div><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.04em; line-height: 1;">{promo}%</div><div style="margin-top: 3px; font-size: 11.5px; font-weight: 700; color: {MUTED};">promocionó</div></div>
            <span style="margin-left: auto; align-self: center; background: {dif_c[0]}; color: {dif_c[1]}; border-radius: 7px; padding: 5px 9px; font-size: 11.5px; font-weight: 800; white-space: nowrap;">Dificultad {dif.lower()}</span>
          </div>
          <div style="margin-top: 14px; padding-top: 11px; border-top: 1.5px solid #EFE7D8; display: flex; align-items: center; justify-content: space-between; font-size: 12px; font-weight: 600; color: {MUTED};">
            <span style="display: inline-flex; align-items: center; gap: 6px;"><span style="width: 7px; height: 7px; border-radius: 999px; background: #37C46B; display: block;"></span>Nueva {cuando}</span>
            <span style="display: inline-flex; align-items: center; gap: 5px; font-weight: 700; color: {BLUE};">Ver experiencias {ico('flecha', 12, BLUE, 2.4)}</span>
          </div>
        </a>
'''

def tarjeta_reciente(e):
    est = f'<div style="margin-left: auto; display: flex; gap: 2px;">{estrellas(e["est"], 14)}</div>' if e['est'] else ''
    chips = ''.join(chip(c) for c in e['chips']) + resultado_chip(e['res']) + chip(e['dif'])
    return f'''        <article style="{CARD} padding: 17px 18px; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 11px;">
            {avatar(e['av'])}
            <div><div style="font-size: 14px; font-weight: 800;">{e['autor']}</div><div style="font-size: 11.5px; font-weight: 600; color: #7A8296;">{e['tipo']}</div></div>
            {est}
          </div>
          <h3 style="margin: 13px 0 0 0; font-size: 17px; font-weight: 800; letter-spacing: -0.025em;">{e['materia']}</h3>
          <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.5; font-weight: 500; color: #4B5265;">{e['texto']}</p>
          <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px;">{chips}</div>
          <a href="#leer" style="margin-top: auto; padding-top: 14px; align-self: flex-start; display: inline-flex; font-size: 12.5px; font-weight: 700; color: {NAVY};"><span style="display: inline-flex; align-items: center; gap: 7px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 7px 13px;">Leer más {ico('flecha', 12, NAVY, 2.5)}</span></a>
        </article>
'''

def hero(titulo_html, bajada, bloque_contexto):
    return f'''  <section style="flex-shrink: 0; position: relative; padding: 26px 64px 0 64px;">
    <div style="position: absolute; right: 56px; top: 0; width: 560px; height: 312px; overflow: hidden;">
      <img src="hero-experiencias.png" alt="Ilustración: el gato de DevsProject lee una nota en un tablero de corcho lleno de consejos de otros estudiantes" style="display: block; position: absolute; left: 0; top: 0; width: 560px; height: auto;">
    </div>
    <span class="dp-hand" style="position: absolute; left: 720px; top: 28px; width: 132px; text-align: center; font-size: 20px; font-weight: 700; line-height: 1.05; transform: rotate(-5deg);">lo que nadie te cuenta, te lo cuentan acá ♥</span>
    <div style="position: relative; width: 720px;">
      {eyebrow('Experiencias · Comunidad FI UNJu')}
      {titulo_html}
      <p style="margin: 16px 0 0 0; font-size: 17px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 560px;">{bajada}</p>
      <form style="margin-top: 22px; width: 660px; display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 14px; padding: 6px 6px 6px 18px;">
        {ico('lupa', 19, '#7E8698')}
        <input type="search" aria-label="Buscá una materia" placeholder="Buscá una materia: Análisis II, Física, Bases de Datos..." style="flex-grow: 1; min-width: 0; border: none; outline: none; background: transparent; font-family: 'Figtree', sans-serif; font-size: 15.5px; font-weight: 500; color: {NAVY}; padding: 12px 0;">
        <button type="submit" style="flex-shrink: 0; background: {BTN}; color: #FFFFFF; border: none; border-radius: 10px; padding: 13px 24px; font-family: 'Figtree', sans-serif; font-size: 15px; font-weight: 700;">Buscar</button>
      </form>
    </div>
{bloque_contexto}  </section>
'''

TITULO_H1 = (f'<h1 style="margin: 14px 0 0 0; font-size: 72px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em; color: {NAVY};">'
             f'Cómo les fue<br><span style="color: {BLUE};">a los que ya cursaron</span><span style="color: {ORANGE};">.</span></h1>')
BAJADA = 'Reseñas de cursada y experiencias de final escritas por estudiantes. Buscá tu materia y mirá cómo les fue a otros en tu mismo contexto.'

# ================================================================ 1 · PORTADA SIN SESION
def p_portada():
    carreras = ['Todas', 'Ing. Informática', 'Lic. en Sistemas', 'Analista Programador', 'Ing. Industrial', 'Ing. Química', 'Ing. de Minas']
    chips_c = ''.join(pildora(c, activo=(c == 'Todas')) for c in carreras)
    anios = ''.join(pildora(a, activo=(a == 'Todos')) for a in ['Todos', '1°', '2°', '3°', '4°', '5°'])
    contexto = f'''    <div style="position: relative; margin-top: 30px; {CARD} padding: 16px 18px; display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.02em;">¿Qué estudiás?</span>
        <span style="display: inline-flex; align-items: center; gap: 7px; background: #F1EEE4; border-radius: 9px; padding: 6px 11px; font-size: 13px; font-weight: 700;">{ico('edificio', 14, BTN)}Universidad Nacional de Jujuy · Facultad de Ingeniería</span>
        <span style="margin-left: auto; display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: {MUTED};">{ico('info', 14, MUTED, 2.1)}Lo recordamos en este dispositivo. Con tu cuenta se completa solo.</span>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="width: 64px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">CARRERA</span>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">{chips_c}</div>
      </div>
      <div style="display: flex; align-items: center; gap: 14px;">
        <span style="width: 64px; font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">AÑO</span>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">{anios}</div>
        <span style="margin-left: auto; display: flex; gap: 8px;">{pildora('Cursadas y finales', activo=True)}{pildora('Solo cursadas')}{pildora('Solo finales')}</span>
      </div>
    </div>
'''
    tarjetas = ''.join(tarjeta_materia(*m) for m in COMENTADAS)
    recientes = ''.join(tarjeta_reciente(e) for e in RECIENTES)
    lateral = f'''      <aside style="display: flex; flex-direction: column; gap: 16px;">
        <div style="position: relative; background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 20px; overflow: hidden; min-height: 250px; box-sizing: border-box; display: flex; flex-direction: column;">
          <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.16em; color: #C31B5E;">TU TURNO</div>
          <h3 style="margin: 10px 0 0 0; font-size: 23px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.08; max-width: 210px;">¿Ya la cursaste o la rendiste?</h3>
          <p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #6A3E50; max-width: 190px;">Contá cómo te fue. Podés publicar como anónimo.</p>
          <div style="margin-top: auto; padding-top: 14px;">{boton('Escribir experiencia', 'pluma', chico=True)}</div>
          <img src="gato-escribe.png" alt="" style="position: absolute; right: -18px; bottom: -8px; width: 132px; height: auto;">
        </div>
        <div style="{CARD} padding: 18px 20px;">
          <h3 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.03em;">Cómo leer una experiencia</h3>
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 11px; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2};">
            <span style="display: flex; gap: 9px;">{ico('calendario', 16, BTN)}<span>Cada una cuenta <b>una cursada concreta</b>: fijate el ciclo, la franja y si era recursada.</span></span>
            <span style="display: flex; gap: 9px;">{ico('pulso', 16, BTN)}<span>La dificultad es <b>cómo la vivió</b> quien la cursó, no una nota.</span></span>
            <span style="display: flex; gap: 9px;">{ico('persona', 16, BTN) if 'persona' in ICONOS else ico('gente', 16, BTN)}<span><b>No hay puntajes de profesores.</b> Filtrá por el contexto que se parece al tuyo.</span></span>
          </div>
        </div>
      </aside>
'''
    cuerpo = hero(TITULO_H1, BAJADA, contexto) + f'''
  <section style="flex-shrink: 0; margin-top: 36px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 28px; align-items: start;">
    <div>
      {seccion('Materias más comentadas', 'Facultad de Ingeniería · todas las carreras · este cuatrimestre', link('Ver todas las materias'))}
      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
{tarjetas}      </div>
    </div>
{lateral}  </section>

  <section style="flex-shrink: 0; margin-top: 36px; padding: 0 64px;">
    {seccion('Recién publicadas', 'Las últimas experiencias de la comunidad.', link('Ver todas'))}
    <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
{recientes}    </div>
  </section>
'''
    return header('Experiencias') + cuerpo

# ================================================================ 2 · CON SESION (recorte)
SIGO = [('09', 'Matemática Discreta', 24, 2, 46), ('10', 'Teoría de la Información y la Comunicación', 12, 0, 58),
        ('11', 'Desarrollo Sistemático de Programas', 19, 1, 37), ('12', 'Probabilidades y Estadística', 33, 1, 41),
        ('06', 'Análisis Matemático II', 58, 0, 38)]

def p_con_sesion():
    contexto = f'''    <div style="position: relative; margin-top: 30px; {CARD} padding: 16px 18px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 16px; font-weight: 800; letter-spacing: -0.02em;">Tu contexto</span>
        <span style="display: inline-flex; align-items: center; gap: 7px; background: #D6E5FB; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 6px 11px; font-size: 13px; font-weight: 800;">{ico('birrete', 14, BTN)}Ing. Informática · Plan 2023 · 2° año</span>
        <span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">tomado de tu perfil</span>
        <a href="#cambiar" style="font-size: 12.5px; font-weight: 700; color: {BLUE};">Cambiar</a>
        <span style="margin-left: auto; display: flex; gap: 8px;">{pildora('Cursadas y finales', activo=True)}{pildora('Solo cursadas')}{pildora('Solo finales')}</span>
      </div>
      <div style="margin-top: 16px; display: flex; align-items: flex-end; justify-content: space-between;">
        <div><div style="font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Tus materias</div><div style="margin-top: 3px; font-size: 13px; font-weight: 500; color: {MUTED};">Las que seguís en tu mochila, primero.</div></div>
        {link('Ver todas las de tu carrera')}
      </div>
      <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px;">
{''.join(f"""        <a href="#m-{c}" style="background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 12px 13px; display: flex; flex-direction: column; color: {NAVY};">
          <span style="display: flex; align-items: center; justify-content: space-between;"><span style="font-size: 11px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">{c}</span>{f'<span style="background: #FED3DF; border-radius: 6px; padding: 3px 7px; font-size: 10.5px; font-weight: 800; color: #B31450;">{nv} {"nueva" if nv == 1 else "nuevas"}</span>' if nv else ''}</span>
          <span style="margin-top: 8px; font-size: 14px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{nom}</span>
          <span style="margin-top: auto; padding-top: 9px; font-size: 12px; font-weight: 700; color: {MUTED};">{n} experiencias · {p}% promocionó</span>
        </a>
""" for c, nom, n, nv, p in SIGO)}      </div>
    </div>
'''
    return header_logueado() + hero(TITULO_H1, BAJADA, contexto)

# ================================================================ 3 · EXPERIENCIAS DE UNA MATERIA
def barra_resultado():
    datos = [('Promoción', 11), ('Regular', 13), ('Libre', 5)]
    total = sum(n for _, n in datos)
    segs, leyenda = '', ''
    for i, (lab, n) in enumerate(datos):
        pct = n / total * 100
        radio = 'border-radius: 0 4px 4px 0;' if i == len(datos) - 1 else ''
        segs += (f'<span class="dp-tip" data-tip="{lab}: {n} de {total} ({pct:.0f}%)" style="display: block; flex: {n} 1 0; height: 22px; background: {RAMPA[lab]}; {radio}"></span>')
        leyenda += (f'<div style="flex: {n} 1 0; min-width: 0;"><div style="display: flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 800; white-space: nowrap;">'
                    f'<span style="width: 10px; height: 10px; border-radius: 3px; background: {RAMPA[lab]}; display: block; flex-shrink: 0;"></span>{lab}</div>'
                    f'<div style="margin-top: 3px; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">{pct:.0f}%<span style="margin-left: 6px; font-size: 12px; font-weight: 600; color: {MUTED}; letter-spacing: 0;">{n}</span></div></div>')
    return f'''<div role="img" aria-label="Cómo terminó la cursada según {total} reseñas: Promoción 11, Regular 13, Libre 5.">
          <div style="display: flex; gap: 2px; background: #FEFEFE;">{segs}</div>
          <div style="margin-top: 12px; display: flex; gap: 2px;">{leyenda}</div>
        </div>'''

def barras_dificultad():
    datos = [('Muy baja', 1), ('Baja', 4), ('Media', 9), ('Alta', 13), ('Muy alta', 4)]
    maximo = max(n for _, n in datos); alto_max = 104; total = sum(n for _, n in datos)
    cols = ''
    for lab, n in datos:
        h = max(3, round(n / maximo * alto_max))
        cols += (f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px;">'
                 f'<span style="font-size: 13px; font-weight: 800;">{n}</span>'
                 f'<span class="dp-tip" data-tip="{lab}: {n} de {total}" style="display: block; width: 24px; height: {h}px; background: {SERIE}; border-radius: 4px 4px 0 0;"></span></div>')
    etiquetas = ''.join(f'<span style="flex: 1; text-align: center; font-size: 11.5px; font-weight: 700; color: {MUTED};">{lab}</span>' for lab, _ in datos)
    return f'''<div role="img" aria-label="Dificultad de la cursada según {total} reseñas: muy baja 1, baja 4, media 9, alta 13, muy alta 4.">
          <div style="height: {alto_max + 26}px; display: flex; align-items: flex-end; border-bottom: 1px solid #D8D0BF;">{cols}</div>
          <div style="margin-top: 7px; display: flex;">{etiquetas}</div>
        </div>'''

RESENIAS = [
    dict(av=('img', 'av-crema.png'), autor='Anónimo', cuando='hace 2 días', est=4, contexto=['Ciclo 2025', 'Tarde', 'Prof. A. Gómez', 'Primera cursada'], res='Regular', dif='Dificultad alta',
         texto='Los parciales son largos y toman todo lo de las guías. Arrancá con series desde la primera semana: es lo que más cuesta y después no te da el tiempo.'),
    dict(av=('ini', 'LP', '#F0F7C9', '#5A7A00'), autor='Lucía P.', cuando='hace 5 días', est=5, contexto=['Ciclo 2025', 'Mañana', 'Prof. M. Sosa', 'Primera recursada'], res='Promoción', dif='Dificultad media',
         texto='La recursé y la segunda vez me fue mucho mejor. Los prácticos de la mañana van más despacio y se entiende todo. Las consultas de los viernes valen oro.'),
    dict(av=('img', 'av-birrete.png'), autor='Anónimo', cuando='hace 2 semanas', est=3, contexto=['Ciclo 2024', 'Noche', 'Primera cursada'], res='Libre', dif='Dificultad muy alta',
         texto='Trabajo y la cursé a la noche: el ritmo es muy rápido para el tiempo que tenía. Si podés, no la cursés al mismo tiempo que Física Mecánica.'),
    dict(av=('img', 'av-guino.png'), autor='Anónimo', cuando='hace 3 semanas', est=4, contexto=['Ciclo 2024', 'Tarde', 'Prof. A. Gómez', 'Segunda o más recursadas'], res='Regular', dif='Dificultad alta',
         texto='Lo que me destrabó fue hacer los finales viejos que subió la comunidad. Con eso llegué al parcial sabiendo qué tipo de ejercicios iban a tomar.'),
]

def tarjeta_resenia(r):
    av = avatar(r['av'][1], 42) if r['av'][0] == 'img' else iniciales(r['av'][1], r['av'][2], r['av'][3], 42)
    ctx = ''.join(chip(c) for c in r['contexto'])
    return f'''        <article style="{CARD} padding: 18px 20px; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 12px;">
            {av}
            <div><div style="font-size: 14.5px; font-weight: 800;">{r['autor']}</div><div style="font-size: 12px; font-weight: 600; color: #7A8296;">Reseña de cursada · {r['cuando']}</div></div>
            <div style="margin-left: auto; text-align: right;"><div style="display: flex; gap: 2px; justify-content: flex-end;">{estrellas(r['est'], 15)}</div><div style="margin-top: 3px; font-size: 11px; font-weight: 700; color: {MUTED};">la recomienda</div></div>
          </div>
          <div style="margin-top: 14px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">CONTEXTO DE LA CURSADA</div>
          <div style="margin-top: 7px; display: flex; flex-wrap: wrap; gap: 6px;">{ctx}</div>
          <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 6px;">{resultado_chip(r['res'])}{chip(r['dif'])}</div>
          <p style="margin: 13px 0 0 0; font-size: 14.5px; line-height: 1.55; font-weight: 500; color: #4B5265;">“{r['texto']}”</p>
          <div style="margin-top: auto; padding-top: 14px; display: flex; align-items: center; justify-content: space-between;">
            <a href="#leer" style="display: inline-flex; align-items: center; gap: 7px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 7px 13px; font-size: 12.5px; font-weight: 700; color: {NAVY};">Leer completa {ico('flecha', 12, NAVY, 2.5)}</a>
            <a href="#reportar" style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: {MUTED};">{ico('bandera', 13, MUTED, 2.1)}Reportar</a>
          </div>
        </article>
'''

def p_materia():
    tiles = ''
    for num, lab in [('34', 'reseñas de cursada'), ('24', 'experiencias de final'),
                     (f'3,9 <span style="font-size: 16px; color: {MUTED};">/ 5</span>', 'recomendación promedio'),
                     ('15 <span style="font-size: 16px; color: #6B7286;">de 22</span>', 'aprobaron el final')]:
        tiles += (f'<div style="background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 13px 16px;">'
                  f'<div style="font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1.05;">{num}</div>'
                  f'<div style="margin-top: 3px; font-size: 12.5px; font-weight: 700; color: {MUTED};">{lab}</div></div>')
    final = f'''<div style="display: flex; flex-direction: column; gap: 14px;">
          <div><div style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; color: {MUTED};">FORMATO</div>
            <div style="margin-top: 7px; display: flex; flex-wrap: wrap; gap: 6px;">{chip('Escrito · 14', '#F1EEE4', NAVY, 800)}{chip('Oral · 6', '#F1EEE4', NAVY, 800)}{chip('Mixto · 4', '#F1EEE4', NAVY, 800)}</div></div>
          <div><div style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; color: {MUTED};">DIFICULTAD DEL FINAL</div>
            <div style="margin-top: 7px; display: flex; gap: 22px;">
              <div><span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">3,8</span><span style="font-size: 12px; font-weight: 700; color: {MUTED};"> / 5 teoría</span></div>
              <div><span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">2,9</span><span style="font-size: 12px; font-weight: 700; color: {MUTED};"> / 5 práctica</span></div>
            </div></div>
          <div><div style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; color: {MUTED};">PREPARACIÓN TÍPICA</div>
            <div style="margin-top: 7px; display: flex; gap: 22px;">
              <div><span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">3</span><span style="font-size: 12px; font-weight: 700; color: {MUTED};"> semanas antes</span></div>
              <div><span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">1 h</span><span style="font-size: 12px; font-weight: 700; color: {MUTED};"> por día</span></div>
            </div></div>
          <div style="font-size: 13px; line-height: 1.45; font-weight: 600; color: {TEXT2};">La mesa más comentada es <b>diciembre</b> (9): suele haber <b>3 profesores</b> y <b>3 horas</b>. Nota promedio: <b>6,4</b>.</div>
        </div>'''
    filtros = ''.join(desplegable(t) for t in ['Ciclo lectivo: todos', 'Franja: todas', 'Profesor/a: todos', 'Situación: todas', 'Resultado: todos'])
    resenias = ''.join(tarjeta_resenia(r) for r in RESENIAS)
    cuerpo = breadcrumb(['Experiencias', 'Ingeniería Informática', 'Análisis Matemático II']) + f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 32px;">
    <div>
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 5px 10px;">06</span>
        {eyebrow('Experiencias · 1° año · 2° cuatrimestre')}
      </div>
      <h1 style="margin: 14px 0 0 0; font-size: 70px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em; color: {NAVY};">Análisis<br><span style="color: {BLUE};">Matemático II</span><span style="color: {ORANGE};">.</span></h1>
    </div>
    <div style="display: flex; align-items: center; gap: 10px; padding-bottom: 6px;">
      {boton('Ver recursos de la materia', 'doc', primario=False)}
      {boton('Escribir experiencia', 'pluma')}
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px;">
    <div style="{CARD} padding: 22px 24px;">
      <div style="display: flex; align-items: baseline; justify-content: space-between;">
        <h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">Resumen de 58 experiencias</h2>
        <span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Todos los ciclos · se actualiza con cada experiencia</span>
      </div>
      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">{tiles}</div>
      <div style="margin-top: 22px; display: grid; grid-template-columns: 1.25fr 1fr 0.95fr; gap: 30px;">
        <div>
          <h3 style="margin: 0; font-size: 15.5px; font-weight: 800;">Cómo terminó la cursada</h3>
          <div style="margin-top: 3px; font-size: 12px; font-weight: 600; color: {MUTED};">29 reseñas · 5 prefirieron no responder</div>
          <div style="margin-top: 16px;">{barra_resultado()}</div>
          <div style="margin-top: 20px; padding-top: 16px; border-top: 1.5px dashed #E4DCCB;">
            <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; color: {MUTED};">NOTA DE PROMOCIÓN</div>
            <div style="margin-top: 7px;"><span style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">8,2</span><span style="font-size: 12px; font-weight: 700; color: {MUTED};"> / 10 promedio · la informaron 9 de 11</span></div>
          </div>
        </div>
        <div>
          <h3 style="margin: 0; font-size: 15.5px; font-weight: 800;">Dificultad de la cursada</h3>
          <div style="margin-top: 3px; font-size: 12px; font-weight: 600; color: {MUTED};">31 reseñas · 3 no la indicaron</div>
          <div style="margin-top: 10px;">{barras_dificultad()}</div>
        </div>
        <div style="border-left: 1.5px solid #EFE7D8; padding-left: 26px;">
          <h3 style="margin: 0; font-size: 15.5px; font-weight: 800;">El final</h3>
          <div style="margin-top: 3px; font-size: 12px; font-weight: 600; color: {MUTED};">24 experiencias de final</div>
          <div style="margin-top: 14px;">{final}</div>
        </div>
      </div>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 30px; padding: 0 64px;">
    <div style="display: flex; align-items: center; gap: 10px;">
      {pildora('Reseñas de cursada', activo=True, icono='calendario', contador=34)}
      {pildora('Experiencias de final', icono='birrete', contador=24)}
      <span style="margin-left: auto;">{desplegable('Más recientes')}</span>
    </div>
    <div style="margin-top: 14px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED}; margin-right: 4px;">FILTRAR POR CONTEXTO</span>
      {filtros}
    </div>
    <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: {MUTED};">{ico('info', 14, MUTED, 2.1)}Buscá cursadas parecidas a la tuya. En DevsProject no hay puntajes de profesores.</div>
    <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;">
{resenias}    </div>
    <div style="margin-top: 16px; display: flex; justify-content: center;">{boton('Ver las 34 reseñas', 'flecha', primario=False, chico=True)}</div>
  </section>
'''
    return header('Experiencias') + cuerpo

# ================================================================ 4 · ESCRIBIR UNA EXPERIENCIA
# Campos que todavia no existen en el esquema (van marcados en el canvas): nota de promocion,
# temas, preparacion (desde cuando y horas por dia), profesores en la mesa y tiempo del final.

def opcion(texto, activa=False, ancho=None):
    w = f'flex: 1;' if ancho is None else ''
    if activa:
        return f'<span style="{w} display: inline-flex; align-items: center; justify-content: center; gap: 7px; background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 10px; padding: 9px 12px; font-size: 13.5px; font-weight: 800; white-space: nowrap;">{ico("check", 14, BTN, 2.8)}{texto}</span>'
    return f'<span style="{w} display: inline-flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 10px; padding: 10px 12px; font-size: 13.5px; font-weight: 700; color: {TEXT2}; white-space: nowrap;">{texto}</span>'

def fila_opciones(opciones, activa):
    return '<div style="display: flex; gap: 8px;">' + ''.join(opcion(o, o == activa) for o in opciones) + '</div>'

def campo(etiqueta, contenido, marca='opcional', ayuda=''):
    tag = (f'<span style="font-size: 11px; font-weight: 800; color: #B31450;">OBLIGATORIO</span>' if marca == 'obligatorio'
           else f'<span style="font-size: 11px; font-weight: 700; color: {MUTED};">Opcional</span>' if marca else '')
    extra = f'<div style="margin-top: 7px; font-size: 12px; font-weight: 600; color: {MUTED};">{ayuda}</div>' if ayuda else ''
    return (f'<div><div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px;">'
            f'<span style="font-size: 14px; font-weight: 800;">{etiqueta}</span>{tag}</div>{contenido}{extra}</div>')

def bloque(num, titulo, contenido, sub=''):
    s = f'<span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">{sub}</span>' if sub else ''
    return f'''      <div style="{CARD} padding: 20px 22px;">
        <div style="display: flex; align-items: center; gap: 11px; margin-bottom: 16px;">
          <span style="width: 28px; height: 28px; border-radius: 999px; background: {NAVY}; color: #FFFFFF; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;">{num}</span>
          <h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em;">{titulo}</h2>{s}
        </div>
        {contenido}
      </div>
'''

def selector(texto):   # desplegable a lo ancho del campo
    return (f'<span style="display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-weight: 700;">'
            f'{texto}{ico("abajo", 13, NAVY, 2.4)}</span>')

def stepper(valor, sufijo=''):
    suf = f'<span style="font-size: 13.5px; font-weight: 700; color: {MUTED};">{sufijo}</span>' if sufijo else ''
    return (f'<span style="display: inline-flex; align-items: center; gap: 10px;">'
            f'<span style="display: inline-flex; align-items: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; overflow: hidden;">'
            f'<span aria-label="Restar" style="width: 36px; height: 38px; display: flex; align-items: center; justify-content: center; border-right: 1.5px solid #E4DCCB; font-size: 18px; font-weight: 800;">−</span>'
            f'<span style="min-width: 46px; text-align: center; font-size: 17px; font-weight: 800;">{valor}</span>'
            f'<span aria-label="Sumar" style="width: 36px; height: 38px; display: flex; align-items: center; justify-content: center; border-left: 1.5px solid #E4DCCB; font-size: 18px; font-weight: 800;">+</span>'
            f'</span>{suf}</span>')

def numero_unidad(valor, unidad, despues=''):
    d = f'<span style="font-size: 13.5px; font-weight: 700; color: {MUTED};">{despues}</span>' if despues else ''
    return (f'<span style="display: inline-flex; align-items: center; gap: 8px;">'
            f'<span style="width: 58px; text-align: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 0; font-size: 16px; font-weight: 800;">{valor}</span>'
            f'<span style="display: inline-flex; align-items: center; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-weight: 700;">{unidad}{ico("abajo", 13, NAVY, 2.4)}</span>{d}</span>')

def escala(nombre, valor):
    cajas = ''.join(
        (f'<span style="width: 38px; height: 36px; display: flex; align-items: center; justify-content: center; background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 9px; font-size: 14px; font-weight: 800;">{i}</span>'
         if i == valor else
         f'<span style="width: 38px; height: 36px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 9px; font-size: 14px; font-weight: 700; color: {TEXT2};">{i}</span>')
        for i in range(1, 6))
    return (f'<div style="display: flex; align-items: center; gap: 12px;"><span style="width: 72px; font-size: 13.5px; font-weight: 800;">{nombre}</span>'
            f'<span style="font-size: 11.5px; font-weight: 700; color: {MUTED};">fácil</span><div style="display: flex; gap: 6px;">{cajas}</div>'
            f'<span style="font-size: 11.5px; font-weight: 700; color: {MUTED};">difícil</span></div>')

def chip_borrable(texto):
    return (f'<span style="display: inline-flex; align-items: center; gap: 7px; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 5px 8px 5px 10px; font-size: 13px; font-weight: 700;">'
            f'{texto}<span aria-label="Quitar" style="font-size: 14px; font-weight: 800; color: {MUTED};">×</span></span>')

def chip_sugerido(texto):
    return (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: #FFFFFF; border: 1.5px dashed #B9AE96; border-radius: 8px; padding: 5px 10px; font-size: 12.5px; font-weight: 700; color: {TEXT2};">+ {texto}</span>')

def ideas(lista):
    return (f'<div style="display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 10px;"><span style="font-size: 12px; font-weight: 700; color: {MUTED}; align-self: center;">Ideas:</span>'
            + ''.join(chip(t, '#FFFFFF', TEXT2).replace('background: #FFFFFF;', 'background: #FFFFFF; border: 1.5px dashed #CFC5B0;') for t in lista) + '</div>')

def area_texto(texto):
    return (f'<div style="position: relative; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 13px; padding: 14px 16px 30px 16px; min-height: 110px; box-sizing: border-box; font-size: 14.5px; line-height: 1.55; font-weight: 500; color: {NAVY};">{texto}'
            f'<span style="display: inline-block; width: 2px; height: 17px; background: {BTN}; vertical-align: -3px; margin-left: 1px;"></span>'
            f'<span style="position: absolute; right: 14px; bottom: 9px; font-size: 11.5px; font-weight: 700; color: {MUTED};">{len(texto)} / 2000</span></div>'
            f'<div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: {MUTED};">Sin nombres de compañeros ni datos personales. Criticá la cursada o el examen, no a las personas.</div>')

def tipo_y_materia(activo):
    def tarjeta(clave, icono, titulo, texto):
        if clave == activo:
            return (f'<div style="background: #D6E5FB; border: 2px solid {NAVY}; border-radius: 13px; padding: 15px 16px; display: flex; gap: 12px;">{ico(icono, 22, BTN, 2)}'
                    f'<div><div style="font-size: 15px; font-weight: 800;">{titulo}</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {TEXT2};">{texto}</div></div>'
                    f'<span style="margin-left: auto; width: 22px; height: 22px; border-radius: 999px; background: {BTN}; border: 1.5px solid {NAVY}; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">{ico("check", 13, "#FFFFFF", 3)}</span></div>')
        return (f'<div style="background: #FFFFFF; border: 1.5px solid #CFC5B0; border-radius: 13px; padding: 15px 16px; display: flex; gap: 12px;">{ico(icono, 22, MUTED, 2)}'
                f'<div><div style="font-size: 15px; font-weight: 800;">{titulo}</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {TEXT2};">{texto}</div></div>'
                f'<span style="margin-left: auto; width: 22px; height: 22px; border-radius: 999px; border: 1.5px solid #CFC5B0; flex-shrink: 0;"></span></div>')
    return (f'<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">'
            + tarjeta('cursada', 'calendario', 'Reseña de cursada', 'Cómo fue cursarla: clases, parciales, cómo terminaste.')
            + tarjeta('final', 'birrete', 'Experiencia de final', 'Una mesa concreta: formato, qué tomaron, cómo te fue.')
            + f'''</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 12px; background: #F1EEE4; border-radius: 11px; padding: 11px 14px;">
          <span style="font-size: 11px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">06</span>
          <span style="font-size: 14.5px; font-weight: 800;">Análisis Matemático II</span><span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Ing. Informática · 1° año</span>
          <a href="#cambiar" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {BLUE};">Cambiar materia</a>
        </div>''')

def publicacion():
    return f'''<div style="display: flex; align-items: center; gap: 14px; background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 14px 16px;">
          <span style="width: 46px; height: 26px; border-radius: 999px; background: {BTN}; border: 1.5px solid {NAVY}; position: relative; flex-shrink: 0;"><span style="position: absolute; right: 3px; top: 3px; width: 17px; height: 17px; border-radius: 999px; background: #FFFFFF;"></span></span>
          <div><div style="font-size: 15px; font-weight: 800;">Publicar como anónimo</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.45; font-weight: 500; color: {TEXT2};">Se muestra como «Anónimo» y no se cuenta en tu perfil público. Vos y el equipo de moderación siguen sabiendo que es tuya.</div></div>
          {ico('candado', 20, NAVY, 2)}
        </div>
        <div style="margin-top: 16px; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 12.5px; line-height: 1.4; font-weight: 600; color: {MUTED}; max-width: 360px;">Se publica al instante. Si alguien la reporta y no cumple las normas, moderación puede retirarla.</span>
          <span style="margin-left: auto; display: flex; gap: 10px;">{boton('Cancelar', primario=False)}{boton('Publicar experiencia', 'check')}</span>
        </div>'''

def encabezado_escribir():
    return breadcrumb(['Experiencias', 'Análisis Matemático II', 'Escribir experiencia']) + f'''
  <section style="flex-shrink: 0; padding: 26px 64px 0 64px;">
    {eyebrow('Tu experiencia')}
    <h1 style="margin: 14px 0 0 0; font-size: 64px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em; color: {NAVY};">Contá cómo <span style="color: {BLUE};">te fue</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 14px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Te lleva tres minutos y le ahorra un cuatrimestre de dudas a alguien.</p>
  </section>
'''

def consejos(titulo, items):
    filas = ''.join(f'<span style="display: flex; gap: 8px;">{ico("check", 15, "#1F7A37", 2.6)}<span>{t}</span></span>' for t in items)
    return f'''      <div style="position: relative; {CARD} padding: 18px 20px; overflow: hidden;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -0.02em;">{titulo}</h3>
        <div style="margin-top: 11px; display: flex; flex-direction: column; gap: 9px; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2}; max-width: 240px;">{filas}</div>
        <img src="gato-escribe.png" alt="" style="position: absolute; right: -16px; bottom: -10px; width: 118px; height: auto;">
      </div>
'''

def pagina_formulario(bloques, previa):
    return encabezado_escribir() + f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 14px;">
{bloques}    </div>
    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">{ico('ojo', 15, MUTED, 2)}ASÍ SE VA A VER</div>
{previa}    </aside>
  </section>
'''

# ---------------------------------------------------------------- reseña de cursada (estado: promociono)
def p_escribir_cursada():
    texto = 'Los parciales son largos y toman todo lo de las guías. Arrancá con series desde la primera semana y no faltes a las consultas de los viernes: así la promocioné.'
    contexto = f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 22px;">
          {campo('Ciclo lectivo', selector('2025'), 'obligatorio')}
          {campo('Profesor/a', selector('Prof. A. Gómez'))}
          <div style="grid-column: span 2;">{campo('Franja horaria', fila_opciones(['Mañana', 'Tarde', 'Noche', 'No indico'], 'Tarde'))}</div>
          <div style="grid-column: span 2;">{campo('Situación de cursada', fila_opciones(['Primera cursada', 'Primera recursada', 'Segunda o más', 'Prefiero no responder'], 'Primera cursada'), 'obligatorio')}</div>
        </div>'''
    # al elegir Promocion, el campo se extiende para pedir la nota
    resultado = f'''<div>
            {fila_opciones(['Promoción', 'Regular', 'Libre'], 'Promoción')}
            <div style="position: relative; margin-top: 12px; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 14px 16px; display: flex; align-items: center; gap: 18px;">
              <span aria-hidden="true" style="position: absolute; top: -8px; left: 14%; width: 13px; height: 13px; background: #ECF2FE; border-left: 1.5px solid {NAVY}; border-top: 1.5px solid {NAVY}; transform: rotate(45deg);"></span>
              <div><div style="font-size: 14px; font-weight: 800;">¿Con qué nota promocionaste?</div><div style="margin-top: 3px; font-size: 12px; font-weight: 600; color: {MUTED};">Aparece solo si elegís Promoción.</div></div>
              {stepper('8', '/ 10')}
              <span style="margin-left: auto; font-size: 11px; font-weight: 700; color: {MUTED};">Opcional</span>
            </div>
          </div>'''
    niveles = fila_opciones(['Muy baja', 'Baja', 'Media', 'Alta', 'Muy alta'], 'Alta')
    estrellas_in = ''.join(f'<svg width="30" height="30" viewBox="0 0 24 24" fill="{"#E9B949" if i < 4 else "#FFFFFF"}" stroke="{NAVY if i < 4 else "#CFC5B0"}" stroke-width="1.4" stroke-linejoin="round" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"></path></svg>' for i in range(5))
    como = f'''<div style="display: flex; flex-direction: column; gap: 18px;">
          {campo('Resultado de la cursada', resultado, 'obligatorio')}
          {campo('¿Qué tan difícil te resultó?', niveles)}
          {campo('¿La recomendarías cursar así?', f'<div style="display: flex; align-items: center; gap: 6px;">{estrellas_in}<span style="margin-left: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">4 de 5</span></div>', 'obligatorio')}
        </div>'''
    bloques = (bloque(1, '¿Qué querés contar?', tipo_y_materia('cursada')) + bloque(2, 'Contexto de la cursada', contexto)
               + bloque(3, 'Cómo terminó', como) + bloque(4, 'Tu experiencia', ideas(['¿Qué te sirvió?', '¿Cómo son los parciales?', '¿Qué harías distinto?']) + area_texto(texto))
               + bloque(5, 'Publicación', publicacion()))
    previa = f'''      <article style="{CARD} padding: 18px 20px; box-shadow: 5px 5px 0 {NAVY};">
        <div style="display: flex; align-items: center; gap: 12px;">
          {avatar('av-crema.png', 42)}
          <div><div style="font-size: 14.5px; font-weight: 800;">Anónimo</div><div style="font-size: 12px; font-weight: 600; color: #7A8296;">Reseña de cursada · ahora</div></div>
          <div style="margin-left: auto; display: flex; gap: 2px;">{estrellas(4, 15)}</div>
        </div>
        <h3 style="margin: 13px 0 0 0; font-size: 17px; font-weight: 800; letter-spacing: -0.025em;">Análisis Matemático II</h3>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">{chip('Ciclo 2025')}{chip('Tarde')}{chip('Prof. A. Gómez')}{chip('Primera cursada')}{resultado_chip('Promoción', '8')}{chip('Dificultad alta')}</div>
        <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.55; font-weight: 500; color: #4B5265;">“{texto}”</p>
      </article>
''' + consejos('Una buena reseña...', ['cuenta qué te sirvió y qué no.', 'describe cómo son los parciales.', 'deja un consejo concreto para quien viene.'])
    return header_logueado() + pagina_formulario(bloques, previa)

# ---------------------------------------------------------------- experiencia de final
TEMAS = ['Integrales dobles', 'Series de potencias', 'Teorema de Green']

def p_escribir_final():
    texto = 'Fueron tres ejercicios y una pregunta de teoría. El de integrales dobles era casi igual a uno de los finales viejos. Corrigieron en el día y nos explicaron los errores.'
    mesa = f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 22px;">
          {campo('Período', selector('Diciembre'), 'obligatorio')}
          {campo('Año', selector('2024'), 'obligatorio')}
          <div style="grid-column: span 2;">{campo('Formato', fila_opciones(['Escrito', 'Oral', 'Mixto'], 'Escrito'), 'obligatorio')}</div>
          {campo('Profesores en la mesa', stepper('3', 'profesores'))}
          {campo('Tiempo para resolverlo', numero_unidad('3', 'horas'), ayuda='Si fue oral, cuánto duró tu examen.')}
        </div>'''
    como = f'''<div style="display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px 22px; align-items: start;">
          {campo('Resultado', fila_opciones(['Aprobado', 'Desaprobado', 'Prefiero no decir'], 'Aprobado'), 'obligatorio')}
          {campo('Nota', stepper('7', '/ 10'), 'obligatorio')}
          <div style="grid-column: span 2; margin-top: -8px; font-size: 12px; font-weight: 600; color: {MUTED};">Si elegís «Prefiero no decir», no se pide la nota.</div>
          <div style="grid-column: span 2;">{campo('Dificultad del final', '<div style="display: flex; flex-direction: column; gap: 10px;">' + escala('Teoría', 4) + escala('Práctica', 3) + '</div>')}</div>
        </div>'''
    temas = f'''<div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 13px; padding: 10px 12px;">
          {''.join(chip_borrable(t) for t in TEMAS)}
          <span style="font-size: 14px; font-weight: 500; color: {MUTED};">Escribí un tema y presioná Enter…</span>
        </div>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 7px;">
          <span style="font-size: 12px; font-weight: 700; color: {MUTED};">Los cargaron otros en esta materia:</span>
          {chip_sugerido('Integrales de línea')}{chip_sugerido('Ecuaciones diferenciales')}{chip_sugerido('Series de Fourier')}
        </div>'''
    preparacion = f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 22px;">
          {campo('¿Con cuánto tiempo empezaste a estudiar?', numero_unidad('3', 'semanas', 'antes'), None)}
          {campo('¿Cuánto le dedicabas por día?', numero_unidad('1', 'hora', 'en promedio'), None)}
        </div>
        <div style="margin-top: 14px; display: inline-flex; align-items: center; gap: 8px; background: #F0F7C9; border-radius: 9px; padding: 7px 12px; font-size: 13px; font-weight: 700;">{ico('reloj', 15, '#5A7A00', 2.2)}Unas 21 horas de estudio en total</div>'''
    bloques = (bloque(1, '¿Qué querés contar?', tipo_y_materia('final')) + bloque(2, 'La mesa', mesa)
               + bloque(3, 'Cómo te fue', como) + bloque(4, 'Temas que tomaron', temas, 'Opcional · así otros saben qué estudiar')
               + bloque(5, 'Preparación', preparacion, 'Opcional')
               + bloque(6, 'Tu experiencia', ideas(['¿Qué te preguntaron?', '¿Cómo corrigieron?', '¿Qué te hubiera servido saber?']) + area_texto(texto))
               + bloque(7, 'Publicación', publicacion()))
    dato = lambda ic, t: f'<span style="display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: {TEXT2};">{ico(ic, 15, BTN, 2.1)}{t}</span>'
    previa = f'''      <article style="{CARD} padding: 18px 20px; box-shadow: 5px 5px 0 {NAVY};">
        <div style="display: flex; align-items: center; gap: 12px;">
          {avatar('av-birrete.png', 42)}
          <div><div style="font-size: 14.5px; font-weight: 800;">Anónimo</div><div style="font-size: 12px; font-weight: 600; color: #7A8296;">Experiencia de final · ahora</div></div>
        </div>
        <h3 style="margin: 13px 0 0 0; font-size: 17px; font-weight: 800; letter-spacing: -0.025em;">Análisis Matemático II</h3>
        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">{chip('Mesa de diciembre 2024')}{chip('Escrito')}{resultado_chip('Aprobado', '7')}</div>
        <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 7px;">
          {dato('gente', 'Mesa de 3 profesores · 3 horas')}
          {dato('reloj', 'Preparación: 3 semanas, 1 h por día')}
          {dato('pulso', 'Teoría 4/5 · Práctica 3/5')}
        </div>
        <div style="margin-top: 12px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">TEMAS</div>
        <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px;">{''.join(chip(t, '#ECF2FE', '#2B4C8C') for t in TEMAS)}</div>
        <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.55; font-weight: 500; color: #4B5265;">“{texto}”</p>
      </article>
''' + consejos('Una buena experiencia de final...', ['cuenta qué temas tomaron.', 'dice cómo se preparó y cuánto le llevó.', 'avisa qué le hubiera servido saber antes.'])
    return header_logueado() + pagina_formulario(bloques, previa)

PAGINAS = [
    ('Experiencias.dc.html', 'DevsProject · Experiencias', lambda: p_portada(), 1590, True),
    ('ExperienciasConSesion.dc.html', 'DevsProject · Experiencias (con sesión)', lambda: p_con_sesion(), 700, False),
    ('ExperienciasMateria.dc.html', 'DevsProject · Experiencias de Análisis Matemático II', lambda: p_materia(), 1700, True),
    ('EscribirExperiencia.dc.html', 'DevsProject · Escribir reseña de cursada', lambda: p_escribir_cursada(), 1900, True),
    ('EscribirFinal.dc.html', 'DevsProject · Escribir experiencia de final', lambda: p_escribir_final(), 2300, True),
]

if __name__ == '__main__':
  for archivo, titulo, fn, alto, con_pie in PAGINAS:
      alto = ALTOS.get(archivo, alto)
      cuerpo = fn()
      cab, resto = cuerpo.split('</header>', 1)
      with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
          f.write(documento(titulo, alto, cab + '</header>\n', resto, con_pie))
      print('escrito', archivo, alto)

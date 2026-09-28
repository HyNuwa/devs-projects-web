# Genera: Tu progreso (nivel, puntos e insignias), el aviso de insignia ganada, el perfil publico
# personalizado, el detalle de un aviso de Clasificados y una experiencia completa.
# Las insignias son las gema de apps/frontend/public/assets/insignias/gema (copiadas como insignia-*.svg).
# Uso: python generar_extra.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, estrellas, breadcrumb, ICONOS, ESTRELLA, TIPO, CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_acciones as ga

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA, CREMA = ga.LINEA, ga.CREMA
VERDE_BG, VERDE_TX, ROJO_BG, ROJO_TX = ga.VERDE_BG, ga.VERDE_TX, ga.ROJO_BG, ga.ROJO_TX
AMBAR_BG, AMBAR_TX = '#FDF0C8', '#8A5A00'
ICONOS.setdefault('estrella', ESTRELLA)
ICONOS.setdefault('mensaje', '<path d="M4 5h16v11H9l-5 4z"></path>')
META = 'font-size: 11.5px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;'

# ================================================================ datos del sistema (docs/README_PUNTOS_E_INSIGNIAS.md)
NIVELES = [(1, 'Primeros pasos', 0, '4 avatares de gato'), (2, 'Bigotes curiosos', 30, 'Más gatos · 1 aporte fijado'),
           (3, 'De pasillo en pasillo', 100, 'Color de acento · Sugerir correcciones'), (4, 'Mochila cargada', 250, 'Fondo del perfil'),
           (5, 'Siete vidas', 500, 'Marco de avatar · banner'), (6, 'Apuntes de oro', 900, 'Título visible'),
           (7, 'Biblioteca viva', 1500, 'Gatos de edición especial'), (8, 'Faro de la carrera', 2300, 'Tema de perfil exclusivo'),
           (9, 'Memoria de la facultad', 3300, 'Gato animado'), (10, 'Leyenda de la facultad', 4500, 'Marco legendario')]
PUNTOS = 612
NIVEL = 5

# (archivo, nombre, criterio, rareza, estado)  estado: dict(ganada, grado, edicion, progreso)
INSIGNIAS = [
    ('primer-aporte', 'Primer aporte', 'Primer material publicado', 'Común', dict(ganada='mar 2025')),
    ('primer-me-sirvio', 'Primer «Me sirvió»', 'Recibís tu primer «Me sirvió» válido', 'Común', dict(ganada='mar 2025')),
    ('salvavidas', 'Salvavidas', 'Un material tuyo llega a 50 «Me sirvió»', 'Rara', dict(ganada='jun 2025', grado='Bronce', progreso=(64, 150, 'Me sirvió para plata'))),
    ('trotamaterias', 'Trotamaterias', 'Materiales publicados en 5 materias', 'Común', dict(ganada='ago 2025', grado='Bronce', progreso=(5, 10, 'materias para plata'))),
    ('primera-huella', 'Primera huella', 'Primer material de un tipo en una materia, con 3 «Me sirvió»', 'Rara', dict(ganada='abr 2025', grado='Bronce')),
    ('constante', 'Constante', 'Aportes en 2 cuatrimestres seguidos', 'Común', dict(ganada='dic 2025', grado='Bronce')),
    ('mesa-de-diciembre', 'Mesa de diciembre', 'Experiencia de final de la mesa de diciembre', 'De temporada', dict(ganada='dic 2025', edicion='2025')),
    ('primera-camada', 'Primera camada', 'Cuenta del primer cuatrimestre de la plataforma, con un aporte', 'Edición única', dict(ganada='jul 2025')),
    ('voz-de-la-cursada', 'Voz de la cursada', '5 reseñas de cursada con nombre', 'Común', dict(progreso=(3, 5, 'reseñas'))),
    ('kit-completo', 'Kit completo', '4 tipos de material en una misma materia', 'Rara', dict(progreso=(3, 4, 'tipo de material en Análisis II'))),
    ('cronista-de-mesas', 'Cronista de mesas', 'Experiencias de final en diciembre, julio y febrero/marzo', 'Rara', dict(progreso=(1, 3, 'mesas'))),
    ('temporada-de-finales', 'Temporada de finales', '3 aportes publicados en un período de mesas', 'De temporada', dict(progreso=(1, 3, 'aportes'))),
    ('primera-luz', 'Primera luz', 'Primer material de una materia que no tenía ninguno', 'Rara', dict()),
    ('archivo-historico', 'Archivo histórico', 'Mismo tipo y materia en 3 ciclos lectivos', 'Rara', dict()),
    ('puente', 'Puente', '«Me sirvió» de estudiantes de 3 carreras distintas', 'Rara', dict()),
    ('contexto-completo', 'Contexto completo', '10 reseñas con todo el contexto de cursada', 'Rara', dict()),
    ('ojo-atento', 'Ojo atento', '10 reportes confirmados por moderación', 'Rara', dict()),
    ('lupa', 'Lupa', '10 correcciones aceptadas', 'Rara', dict()),
]
RAREZA = {'Común': ('#F1EEE4', TEXT2), 'Rara': ('#EDE6FB', '#5B4B8A'), 'De temporada': ('#FDE7D0', '#B14C06'), 'Edición única': ('#D8F1E8', '#1F7A37')}
GRADO = {'Bronce': ('#F3D9C2', '#8A4B14'), 'Plata': ('#E5E8EF', '#4C5B8A'), 'Oro': ('#FDF0C8', '#8A5A00')}

def insignia_img(archivo, tam, ganada=True):
    filtro = '' if ganada else 'filter: grayscale(1); opacity: 0.32;'
    return f'<img src="insignia-{archivo}.svg" alt="" style="width: {tam}px; height: {tam}px; display: block; {filtro}">'

def pastilla(texto, fondo, color):
    return f'<span style="display: inline-flex; align-items: center; background: {fondo}; border-radius: 999px; padding: 2px 8px; font-size: 10.5px; font-weight: 800; color: {color}; white-space: nowrap;">{texto}</span>'

def barra(v, total, color=BTN, alto=8):
    pct = min(100, round(v * 100 / total))
    return (f'<div style="height: {alto}px; border-radius: 99px; background: #EDE6D6; overflow: hidden;" role="progressbar" aria-valuenow="{v}" aria-valuemax="{total}">'
            f'<div style="width: {pct}%; height: 100%; border-radius: 99px; background: {color};"></div></div>')

# ================================================================ 1 · TU PROGRESO
def p_progreso():
    n_act, nom_act, pts_act, _ = NIVELES[NIVEL - 1]
    n_sig, nom_sig, pts_sig, desbloq_sig = NIVELES[NIVEL]
    falta = pts_sig - PUNTOS
    # camino de niveles
    camino = ''
    for n, nom, pts, desb in NIVELES:
        hecho, actual = n < NIVEL, n == NIVEL
        circ = (f'background: {BTN}; color: #FFFFFF; border: 2px solid {NAVY};' if hecho else
                f'background: #C8FB10; color: {NAVY}; border: 2.5px solid {NAVY}; box-shadow: 3px 3px 0 {NAVY};' if actual else
                f'background: #FFFFFF; color: {MUTED}; border: 1.5px dashed #B9AE96;')
        dentro = ico('check', 16, '#FFFFFF', 3) if hecho else str(n)
        camino += (f'<div style="flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; position: relative;">'
                   f'<span style="width: {44 if actual else 36}px; height: {44 if actual else 36}px; box-sizing: border-box; border-radius: 999px; {circ} display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; position: relative; z-index: 1;">{dentro}</span>'
                   f'<span style="font-size: 11.5px; font-weight: {800 if actual else 700}; line-height: 1.2; color: {NAVY if n <= NIVEL else MUTED};">{nom}</span>'
                   f'<span style="font-size: 10.5px; font-weight: 600; line-height: 1.25; color: {MUTED};">{pts:,} pts'.replace(',', '.') + f'<br>{desb}</span></div>')
    hero = f'''
  <section style="flex-shrink: 0; padding: 22px 64px 0 64px;">
    {eyebrow('Mi mochila · Tu progreso')}
    <div style="margin-top: 14px; display: grid; grid-template-columns: minmax(0, 1fr) 400px; gap: 24px; align-items: stretch;">
      <div style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 24px 28px; display: flex; gap: 26px; align-items: center;">
        <div style="position: relative; width: 132px; height: 132px; flex-shrink: 0;">
          <img src="av-max.png" alt="" style="width: 132px; height: 132px; box-sizing: border-box; border-radius: 999px; border: 5px solid {ORANGE}; outline: 2px solid {NAVY};">
          <span style="position: absolute; right: -6px; bottom: 4px; background: {NAVY}; color: #C8FB10; border: 2px solid #FFFFFF; border-radius: 999px; padding: 4px 10px; font-size: 14px; font-weight: 900;">Nv. {n_act}</span>
        </div>
        <div style="min-width: 0; flex: 1;">
          <div style="{META} color: {BLUE};">Tu nivel</div>
          <h1 style="margin: 6px 0 0 0; font-size: 50px; line-height: 0.95; font-weight: 800; letter-spacing: -0.05em;">{nom_act}<span style="color: {ORANGE};">.</span></h1>
          <div style="margin-top: 14px; display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 14px; font-weight: 700; color: {TEXT2};">
            <span><b style="font-size: 26px; color: {NAVY}; letter-spacing: -0.03em; font-variant-numeric: tabular-nums;">{PUNTOS}</b> puntos</span>
            <span>Faltan <b style="color: {NAVY};">{falta}</b> para <b style="color: {NAVY};">Nv. {n_sig} · {nom_sig}</b></span>
          </div>
          <div style="margin-top: 8px;">{barra(PUNTOS - pts_act, pts_sig - pts_act, BTN, 12)}</div>
          <div style="margin-top: 7px; display: flex; justify-content: space-between; font-size: 11.5px; font-weight: 700; color: {MUTED}; font-variant-numeric: tabular-nums;"><span>{pts_act}</span><span>{pts_sig}</span></div>
        </div>
      </div>
      <div style="background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 20px 22px; display: flex; flex-direction: column; gap: 10px;">
        <div style="{META} color: #45560F;">Al llegar a Nv. {n_sig} se desbloquea</div>
        <div style="display: flex; align-items: center; gap: 12px;">{ga.tile('pluma', '#FFFFFF', BTN, 42, 12)}<div><div style="font-size: 16px; font-weight: 800;">Título visible</div><div style="font-size: 12.5px; font-weight: 600; color: #45560F;">Elegís uno de tus logros, como «Salvavidas de Análisis II».</div></div></div>
        <div style="margin-top: auto; padding-top: 8px; border-top: 1.5px dashed #B7CC6E; font-size: 12.5px; font-weight: 600; color: #45560F;">Ya tenés: marco de avatar y banner del Nv. 5 · <a href="#perfil" style="font-weight: 800; color: {BLUE};">Personalizar perfil</a></div>
      </div>
    </div>
    <div style="margin-top: 20px; {CARD} padding: 20px 22px 16px 22px;">
      <div style="display: flex; align-items: baseline; justify-content: space-between;"><h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em;">El camino</h2><a href="#como" style="font-size: 13px; font-weight: 700; color: {BLUE};">Cómo funcionan los puntos →</a></div>
      <div style="margin-top: 16px; position: relative; display: flex; gap: 6px;">
        <span aria-hidden="true" style="position: absolute; left: 5%; right: 5%; top: 20px; height: 3px; background: linear-gradient(90deg, {BTN} 0 45%, #D9D0BE 45% 100%); border-radius: 3px;"></span>
        {camino}
      </div>
    </div>
  </section>
'''
    cercanas = ''
    for arch, nom, crit, rar, est in INSIGNIAS:
        if 'progreso' in est and 'ganada' not in est:
            v, t, u = est['progreso']
            cercanas += (f'<div style="display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1.5px solid {LINEA};">{insignia_img(arch, 58, False).replace("opacity: 0.32", "opacity: 0.55")}'
                         f'<div style="flex: 1; min-width: 0;"><div style="display: flex; justify-content: space-between; gap: 8px;"><span style="font-size: 14.5px; font-weight: 800;">{nom}</span>'
                         f'<span style="font-size: 12.5px; font-weight: 800; font-variant-numeric: tabular-nums;">{v} / {t}</span></div>'
                         f'<div style="margin-top: 6px;">{barra(v, t, PINK if rar == "Rara" else BTN)}</div>'
                         f'<div style="margin-top: 5px; font-size: 12px; font-weight: 600; color: {MUTED};">{"Te falta" if t - v == 1 else "Te faltan"} {t - v} {u}</div></div></div>')
    coleccion = ''
    for arch, nom, crit, rar, est in INSIGNIAS:
        ganada = 'ganada' in est
        chips = pastilla(rar, *RAREZA[rar])
        if est.get('grado'):
            chips += pastilla(est['grado'], *GRADO[est['grado']])
        if est.get('edicion'):
            chips += pastilla('Edición ' + est['edicion'], '#FDE7D0', '#B14C06')
        pie = (f'<div style="font-size: 11px; font-weight: 700; color: {VERDE_TX};">Ganada · {est["ganada"]}</div>' if ganada else
               f'<div style="font-size: 11.5px; line-height: 1.35; font-weight: 600; color: {MUTED};">{crit}</div>')
        destacada = arch in ('salvavidas', 'trotamaterias', 'primera-camada')
        marca = f'<span style="position: absolute; top: 8px; right: 8px;" aria-label="Destacada en tu perfil">{ico("estrella", 16, "#E9B949", 2.4)}</span>' if destacada else ''
        coleccion += (f'<div style="position: relative; background: {"#FEFEFE" if ganada else "rgba(255,255,255,0.5)"}; border: 1.5px {"solid " + NAVY if ganada else "dashed #CFC5B0"}; border-radius: 16px; padding: 14px 12px; '
                      f'display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center;">{marca}{insignia_img(arch, 92, ganada)}'
                      f'<div style="font-size: 14px; font-weight: 800; line-height: 1.2; color: {NAVY if ganada else TEXT2};">{nom}</div>'
                      f'<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 4px;">{chips}</div>{pie}</div>')
    movimientos = ''.join(
        f'<div style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-top: 1.5px solid {LINEA};">'
        f'<span style="width: 54px; flex-shrink: 0; font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; color: {VERDE_TX if p > 0 else ROJO_TX};">{"+" if p > 0 else "−"}{abs(p)}</span>'
        f'<div style="min-width: 0;"><div style="font-size: 13.5px; font-weight: 700; line-height: 1.3;">{t}</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{s}</div></div></div>'
        for p, t, s in [(10, 'Material publicado: «Parcial 1 con grafos»', 'Matemática Discreta · hoy'), (7, '7 «Me sirvió» en tus materiales', 'esta semana'),
                        (5, 'Reseña de cursada publicada con nombre', 'Probabilidades y Estadística · lunes'),
                        (-11, 'Retiraron «Resumen de relaciones»', 'Motivo: estaba duplicado · se revirtieron sus puntos'), (5, 'Bono Primera huella', 'primer final de Bases de Datos con 3 «Me sirvió»')])
    filas_rank = [(1, 'av-crema.png', 'Camila R.', 6, 118, False), (2, 'av-guino.png', 'Valentina S.', 5, 97, False), (3, 'av-birrete.png', 'Tomás L.', 5, 81, False), (7, 'av-max.png', 'Vos (Max)', 5, 46, True)]
    ranking = ''.join(
        (f'<div style="text-align: center; font-size: 13px; color: {MUTED}; line-height: 1;">⋮</div>' if yo else '') +
        f'<div style="display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 10px; {"background: #ECF2FE; border: 1.5px solid " + NAVY + ";" if yo else ""}">'
        f'<span style="width: 18px; font-size: 13px; font-weight: 800; color: {MUTED}; font-variant-numeric: tabular-nums;">{pos}</span>{gx.avatar(av, 28)}'
        f'<span style="font-size: 13.5px; font-weight: {800 if yo else 700};">{nom}</span><span style="font-size: 11px; font-weight: 700; color: {MUTED};">Nv. {nv}</span>'
        f'<span style="margin-left: auto; font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums;">+{p}</span></div>'
        for pos, av, nom, nv, p, yo in filas_rank)
    destacadas = ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 11.5px; font-weight: 700;">{insignia_img(a, 64)}{n}</div>'
                         for a, n in [('salvavidas', 'Salvavidas'), ('trotamaterias', 'Trotamaterias'), ('primera-camada', 'Primera camada')])
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 28px; align-items: start;">
    <div>
      <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px;">
        <h2 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">Tus insignias <span style="font-size: 16px; color: {MUTED};">8 de 18</span></h2>
        <div style="display: flex; gap: 6px;">{gx.pildora('Todas', True)}{gx.pildora('Ganadas')}{gx.pildora('Por ganar')}</div>
      </div>
      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">{coleccion}</div>
      <p style="margin: 14px 0 0 0; font-size: 12.5px; line-height: 1.5; font-weight: 600; color: {MUTED};">Las publicaciones anónimas no suman puntos ni cuentan para insignias. Las insignias no dan puntos: son reconocimiento.</p>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 16px 18px 6px 18px;"><h3 style="margin: 0; font-size: 17px; font-weight: 800;">Las más cercanas</h3><div style="margin-top: 8px;">{cercanas}</div></div>
      <div style="{CARD} padding: 16px 18px;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><h3 style="margin: 0; font-size: 17px; font-weight: 800;">Destacadas en tu perfil</h3><a href="#elegir" style="font-size: 12.5px; font-weight: 700; color: {BLUE};">Cambiar</a></div>
        <div style="margin-top: 12px; display: flex; justify-content: space-between;">{destacadas}</div>
      </div>
      <div style="{CARD} padding: 16px 18px 8px 18px;"><h3 style="margin: 0; font-size: 17px; font-weight: 800;">Movimientos de puntos</h3><div style="margin-top: 8px;">{movimientos}</div></div>
      <div style="{CARD} padding: 16px 16px 12px 16px;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800;">Los que más ayudaron este mes</h3>
        <div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: {MUTED};">Ingeniería Informática · septiembre</div>
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 4px;">{ranking}</div>
      </div>
    </aside>
  </section>
'''
    return ge.subnav('mochila') + hero + cuerpo

# ================================================================ 2 · INSIGNIA GANADA (popup sobre Tu progreso)
def p_ganada():
    confeti = ''.join(f'<span style="position: absolute; left: {x}px; top: {y}px; width: {w}px; height: {h}px; border-radius: 2px; background: {c}; transform: rotate({r}deg);"></span>'
                      for x, y, w, h, c, r in [(150, 120, 6, 14, PINK, 20), (420, 90, 6, 14, '#C8FB10', -30), (470, 250, 8, 8, ORANGE, 0), (110, 300, 6, 14, BTN, 60),
                                               (520, 160, 6, 12, '#E9B949', 10), (90, 200, 8, 8, '#C8FB10', 0), (380, 330, 6, 14, PINK, -50), (200, 60, 6, 12, ORANGE, 35)])
    modal = f'''    <div style="position: relative; padding: 30px 34px 30px 34px; display: flex; flex-direction: column; align-items: center; text-align: center;">
      {confeti}
      <div style="{META} color: {BTN};">Nueva insignia</div>
      <div style="position: relative; margin-top: 10px; width: 240px; height: 240px; display: flex; align-items: center; justify-content: center;">
        <span aria-hidden="true" style="position: absolute; inset: -10px; border-radius: 999px; background: repeating-conic-gradient(rgba(233,185,73,0.35) 0 6deg, transparent 6deg 20deg);"></span>
        <span aria-hidden="true" style="position: absolute; inset: 14px; border-radius: 999px; border: 3px solid rgba(253,79,141,0.45);"></span>
        {insignia_img('salvavidas', 210).replace('display: block;', 'display: block; position: relative;')}
      </div>
      <h2 style="margin: 14px 0 0 0; font-size: 38px; line-height: 1; font-weight: 800; letter-spacing: -0.045em;">Salvavidas</h2>
      <div style="margin-top: 10px; display: flex; gap: 6px; justify-content: center;">{pastilla('Rara', *RAREZA['Rara'])}{pastilla('Bronce', *GRADO['Bronce'])}</div>
      <p style="margin: 12px 0 0 0; font-size: 15.5px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 380px;">Tu «Parcial 1 resuelto» de Análisis Matemático II llegó a <b style="color: {NAVY};">50 «Me sirvió»</b>. A 50 estudiantes les sirvió lo que subiste.</p>
      <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px; background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 10px 14px; font-size: 13px; font-weight: 700; color: #45560F;">{ico('check', 16, VERDE_TX, 3)}Desbloqueaste el marco especial Salvavidas para tu avatar</div>
      <div style="margin-top: 20px; display: flex; gap: 10px;">{boton('Seguir', primario=False)}{boton('Destacar en mi perfil', 'estrella')}</div>
      <div style="margin-top: 12px; font-size: 12px; font-weight: 600; color: {MUTED};">Próximo grado: plata, con 150 «Me sirvió»</div>
    </div>
'''
    return (ge.header_logueado(False) + ge.subnav('mochila') + f'<section style="padding: 30px 64px; opacity: 0.9;">{eyebrow("Mi mochila · Tu progreso")}</section>'
            + ga.popup(560, 660, 440, 80, 'Nueva insignia: Salvavidas', modal + f'    <span style="position: absolute; top: 14px; right: 14px;">{ga.boton_icono("equis", "Cerrar", 38)}</span>\n'))

# ================================================================ 3 · PERFIL PUBLICO PERSONALIZADO
def p_perfil():
    banner = f'''    <div style="position: relative; height: 200px; border: 1.5px solid {NAVY}; border-radius: 20px; overflow: hidden; background: #0A3FC7;
         background-image: radial-gradient(rgba(255,255,255,0.12) 1.5px, transparent 1.5px); background-size: 18px 18px;">
      <img src="hero-mochila-abierta.png" alt="" style="position: absolute; right: 30px; bottom: -40px; width: 470px; height: auto;">
    </div>'''
    avatar = f'''<div style="position: relative; width: 150px; height: 150px; flex-shrink: 0; margin-top: -86px;">
          <span aria-hidden="true" style="position: absolute; inset: -9px; border-radius: 999px; background: conic-gradient({ORANGE}, #FFFFFF 12%, {ORANGE} 25%, #FFFFFF 37%, {ORANGE} 50%, #FFFFFF 62%, {ORANGE} 75%, #FFFFFF 87%, {ORANGE}); border: 2px solid {NAVY};"></span>
          <img src="av-max.png" alt="Max" style="position: relative; width: 150px; height: 150px; box-sizing: border-box; border-radius: 999px; border: 4px solid {NAVY}; background: #D6E5FB;">
          <img src="insignia-salvavidas.svg" alt="Marco Salvavidas" style="position: absolute; right: -10px; bottom: -6px; width: 54px; height: 54px;">
        </div>'''
    destacadas = ''.join(f'<div style="display: flex; flex-direction: column; align-items: center; gap: 5px; width: 104px; text-align: center;">{insignia_img(a, 78)}<span style="font-size: 12.5px; font-weight: 800; line-height: 1.2;">{n}</span><span style="font-size: 10.5px; font-weight: 700; color: {MUTED};">{d}</span></div>'
                         for a, n, d in [('salvavidas', 'Salvavidas', 'Bronce'), ('trotamaterias', 'Trotamaterias', 'Bronce'), ('primera-camada', 'Primera camada', 'Edición única')])
    stats = ''.join(f'<div style="background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 12px 14px;"><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.04em; color: {c};">{n}</div><div style="font-size: 12px; font-weight: 700; color: {MUTED};">{l}</div></div>'
                    for n, l, c in [('24', 'aportes publicados', NAVY), ('318', 'veces «Me sirvió»', '#E01F63'), ('4', 'experiencias públicas', NAVY), ('8', 'insignias', NAVY)])
    fijados = ''
    for tipo, tit, mat, util in [('Parcial', 'Parcial 1 resuelto', 'Análisis Matemático II', 64), ('Resumen', 'Resumen de series', 'Análisis Matemático II', 41), ('Guía de ejercicios', 'Guía resuelta: matrices', 'Álgebra Lineal', 38)]:
        fijados += (f'<article style="{CARD} padding: 15px; display: flex; flex-direction: column; gap: 9px;"><div style="display: flex; justify-content: space-between;">{ge.pastilla_tipo(tipo, True)}{ico("marcador", 16, ORANGE, 2.2)}</div>'
                    f'<h3 style="margin: 0; font-size: 15.5px; font-weight: 800; letter-spacing: -0.02em;">{tit}</h3><div style="font-size: 13px; font-weight: 700; color: {BLUE};">{mat}</div>'
                    f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700;">{ico("corazon", 15, PINK, 2.1)}{util} Me sirvió</span></article>')
    return f'''  <section style="flex-shrink: 0; padding: 18px 64px 0 64px;">
{banner}
    <div style="padding: 0 26px; display: flex; align-items: flex-end; gap: 24px;">
      {avatar}
      <div style="flex: 1; min-width: 0; padding-top: 14px;">
        <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
          <h1 style="margin: 0; font-size: 44px; line-height: 1; font-weight: 800; letter-spacing: -0.045em;">Max</h1>
          <span style="background: {NAVY}; color: #C8FB10; border-radius: 999px; padding: 4px 11px; font-size: 13px; font-weight: 900;">Nv. 5 · Siete vidas</span>
        </div>
        <div style="margin-top: 6px; font-size: 14px; font-weight: 600; color: {TEXT2};">@max · Ingeniería Informática · 2° año · FI UNJu</div>
        <p style="margin: 8px 0 0 0; font-size: 14.5px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 560px;">Estudio Informática en la FI. Subo lo que me hubiera gustado encontrar cuando empecé.</p>
      </div>
      <div style="display: flex; gap: 8px; padding-bottom: 4px;">{boton('Compartir perfil', 'compartir', primario=False, chico=True)}</div>
    </div>
  </section>
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 28px; align-items: start;">
    <div>
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">{stats}</div>
      <div style="margin-top: 26px; display: flex; align-items: baseline; justify-content: space-between;"><h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">Aportes fijados</h2><span style="font-size: 12.5px; font-weight: 700; color: {MUTED};">Elegidos por Max · hasta 3 desde Nv. 3</span></div>
      <div style="margin-top: 14px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px;">{fijados}</div>
      <div style="margin-top: 26px; display: flex; gap: 8px;">{gx.pildora('Materiales', True, 'doc', 24)}{gx.pildora('Experiencias', False, 'pluma', 4)}{gx.pildora('Tutorías', False, 'birrete', 2)}</div>
      <p style="margin: 12px 0 0 0; font-size: 13px; font-weight: 600; color: {MUTED};">Las reseñas y experiencias anónimas no aparecen acá ni se cuentan.</p>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 18px;">
        <div style="{META} color: {MUTED};">Insignias destacadas</div>
        <div style="margin-top: 12px; display: flex; justify-content: space-between;">{destacadas}</div>
        <a href="#todas" style="margin-top: 12px; display: block; text-align: center; font-size: 13px; font-weight: 700; color: {BLUE};">Ver las 8 insignias</a>
      </div>
      <div style="background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 16px 18px;">
        <div style="{META} color: {BLUE};">Lo que ven los demás</div>
        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.5; font-weight: 600; color: {TEXT2};">El marco naranja con el sello Salvavidas y el banner son personalizaciones desbloqueadas por nivel e insignia. En las tarjetas de sus aportes solo aparece su nombre, sin nivel ni insignias.</p>
      </div>
    </aside>
  </section>
'''

# ================================================================ 4 · DETALLE DE UN AVISO DE CLASIFICADOS
def p_aviso():
    fotos = ''.join(f'<div style="width: 96px; height: 96px; border-radius: 12px; overflow: hidden; border: {b};"><img src="mini-calculadora.png" alt="" style="width: 100%; height: 100%; object-fit: cover; {x}"></div>'
                    for b, x in [(f'2.5px solid {PINK}', ''), (f'1.5px solid {NAVY}', 'transform: rotate(-12deg) scale(0.85);'), (f'1.5px solid {NAVY}', 'transform: scaleX(-1) scale(0.8);')])
    datos = ''.join(f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 11px 0; border-top: 1.5px solid {LINEA}; font-size: 14px;"><span style="font-weight: 600; color: {MUTED};">{a}</span><span style="font-weight: 800; text-align: right;">{b}</span></div>'
                    for a, b in [('Estado', 'Como nuevo'), ('Categoría', 'Calculadoras'), ('Materia relacionada', 'Análisis Matemático I'), ('Entrega', 'En la facultad o en el centro'), ('Publicado', 'hace 2 h · vence en 30 días')])
    parecidos = ''
    for img, badge, bg, tit, precio in [('mini-calculadora.png', 'VENDO', '#FF5C9E', 'Casio fx-570 usada', '$ 28.000'), ('mini-libro-calculo.png', 'VENDO', '#FF5C9E', 'Cálculo de Stewart', '$ 22.000'),
                                         ('mini-libro-fisica.png' if os.path.exists(os.path.join(OUT, 'mini-libro-fisica.png')) else 'mini-libro-calculo.png', 'BUSCO', ORANGE, 'Física Universitaria', 'Busco usado'),
                                         ('mini-notebook.png', 'VENDO', '#FF5C9E', 'Notebook ThinkPad', '$ 320.000')]:
        parecidos += (f'<article style="display: flex; flex-direction: column; gap: 7px;"><div style="position: relative; aspect-ratio: 1 / 1; border: 1.5px solid {NAVY}; border-radius: 14px; overflow: hidden;"><img src="{img}" alt="" style="width: 100%; height: 100%; object-fit: cover;">'
                      f'<span style="position: absolute; left: 8px; top: 8px; background: {bg}; border-radius: 6px; padding: 2px 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; color: #FFFFFF;">{badge}</span></div>'
                      f'<div style="font-size: 14px; font-weight: 800;">{tit}</div><div style="font-size: 15px; font-weight: 800;">{precio}</div></article>')
    return breadcrumb(['Clasificados', 'Calculadoras', 'Calculadora Casio fx-991ES Plus']) + f'''
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 390px; gap: 36px; align-items: start;">
    <div>
      <div style="position: relative; height: 520px; border: 1.5px solid {NAVY}; border-radius: 22px; overflow: hidden; box-shadow: 6px 6px 0 {NAVY}; background: #F7F1E4;">
        <div style="position: absolute; inset: 0; background-image: linear-gradient(rgba(2,18,56,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(2,18,56,0.06) 1px, transparent 1px); background-size: 22px 22px;"></div><img src="mini-calculadora.png" alt="Calculadora Casio fx-991ES Plus sobre papel cuadriculado" style="position: relative; display: block; margin: 40px auto 0 auto; width: 420px; height: 420px; object-fit: contain;">
        <span style="position: absolute; left: 16px; top: 16px; background: #FF5C9E; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 4px 12px; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; color: #FFFFFF;">VENDO</span>
        <span style="position: absolute; right: 16px; bottom: 16px; background: {NAVY}; color: #FFFFFF; border-radius: 999px; padding: 6px 12px; font-size: 12.5px; font-weight: 700;">1 / 3</span>
      </div>
      <div style="margin-top: 12px; display: flex; gap: 10px;">{fotos}</div>
      <h2 style="margin: 30px 0 0 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">Descripción</h2>
      <p style="margin: 10px 0 0 0; font-size: 16px; line-height: 1.65; font-weight: 500; color: {TEXT2}; max-width: 700px;">La usé dos cuatrimestres y funciona perfecto. Tiene la tapa y pilas nuevas. Sirve para Análisis, Física y Probabilidades: resuelve integrales numéricas, matrices y sistemas de ecuaciones. Incluye el manual.</p>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 22px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">{chip('Calculadoras')}<span style="display: flex; gap: 6px;">{ga.boton_icono('corazon', 'Guardar', 36)}{ga.boton_icono('compartir', 'Compartir', 36)}</span></div>
        <h1 style="margin: 12px 0 0 0; font-size: 34px; line-height: 1; font-weight: 800; letter-spacing: -0.045em;">Calculadora Casio fx-991ES Plus</h1>
        <div style="margin-top: 12px; font-size: 36px; font-weight: 800; letter-spacing: -0.04em;">$ 35.000 <span style="font-size: 13px; font-weight: 700; letter-spacing: 0; color: {MUTED};">precio fijo</span></div>
        <div style="margin-top: 14px;">{datos}</div>
        <a href="#contactar" style="margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 14px; font-size: 15.5px; font-weight: 800; color: #FFFFFF;">{ico('mensaje' if 'mensaje' in ICONOS else 'telefono', 18, '#FFFFFF', 2.2)}Contactar por WhatsApp</a>
        <div style="margin-top: 8px; font-size: 12px; font-weight: 600; color: {MUTED}; text-align: center;">Se abre con un mensaje listo: «Hola Nico, vi tu calculadora en DevsProject…»</div>
      </div>
      <div style="{CARD} padding: 16px 18px; display: flex; align-items: center; gap: 12px;">
        {gx.iniciales('NB', '#E5E8EF', '#4C5B8A', 48)}
        <div style="min-width: 0;"><div style="font-size: 15px; font-weight: 800;">Nico B.</div><div style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Ing. Industrial · 3° año · 3 publicaciones</div>
          <div style="margin-top: 3px; font-size: 12px; font-weight: 700; color: {VERDE_TX};">Cuenta verificada · en DevsProject desde 2025</div></div>
        <a href="#perfil" style="margin-left: auto; font-size: 13px; font-weight: 700; color: {BLUE}; white-space: nowrap;">Ver perfil</a>
      </div>
      <div style="background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 16px 18px;">
        <div style="{META} color: #45560F;">Entre estudiantes, mejor</div>
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px; font-size: 13px; line-height: 1.45; font-weight: 600; color: #45560F;">
          {''.join(f'<span style="display: flex; gap: 8px;">{ico("check", 15, VERDE_TX, 2.6)}<span>{t}</span></span>' for t in ['Encontrate en la facultad, en horario de cursada.', 'Probá la calculadora antes de pagar.', 'DevsProject no interviene en pagos: nunca pagues por adelantado a desconocidos.'])}
        </div>
      </div>
      <a href="#reportar" style="align-self: center; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: {TEXT2};">{ico('bandera', 14, TEXT2, 2)}Reportar publicación</a>
    </aside>
  </section>
  <section style="flex-shrink: 0; margin-top: 40px; padding: 0 64px 64px 64px;">
    <div style="display: flex; align-items: baseline; justify-content: space-between;"><h2 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">Parecidos en Clasificados</h2>{gx.link('Ver calculadoras')}</div>
    <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px;">{parecidos}</div>
  </section>
'''

# ================================================================ 5 · EXPERIENCIA COMPLETA
def p_experiencia():
    contexto = ''.join(f'<div style="background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 12px; padding: 10px 12px;"><div style="{META} font-size: 10px; color: {MUTED};">{a}</div><div style="margin-top: 3px; font-size: 14.5px; font-weight: 800;">{b}</div></div>'
                       for a, b in [('Ciclo lectivo', '2025'), ('Franja', 'Tarde'), ('Profesor/a', 'Prof. A. Gómez'), ('Situación', 'Primera cursada'), ('Resultado', gx.resultado_chip('Regular')), ('Dificultad', 'Alta')])
    parrafos = ['Los parciales son largos y toman todo lo de las guías. En el primero entraron series de potencias y el criterio del cociente; en el segundo, integrales dobles, cambio a polares y Green. Si llegás con las guías hechas, el parcial se parece mucho.',
                'Lo que más me costó fue el ritmo: la teoría avanza rápido y las consultas de los viernes son las que te salvan. Los ayudantes explican bien y resuelven ejercicios de parciales viejos si se los pedís.',
                'Mi consejo: arrancá con series desde la primera semana, no la dejes para la semana del parcial, y hacé los parciales viejos que están en la página de la materia. Quedé regular por un ejercicio de Green; con una semana más de práctica promocionaba.']
    texto = ''.join(f'<p style="margin: 0 0 16px 0; font-size: 17px; line-height: 1.7; font-weight: 500; color: {NAVY};">{t}</p>' for t in parrafos)
    otras = ''.join(f'''        <div style="padding: 12px 0; border-top: 1.5px solid {LINEA};">
          <div style="display: flex; align-items: center; gap: 8px;">{gx.avatar(av, 28)}<span style="font-size: 13px; font-weight: 800;">Anónimo</span><span style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{m}</span><span style="margin-left: auto; display: flex; gap: 1px;">{estrellas(n, 11)}</span></div>
          <p style="margin: 7px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2};">{c}</p>
        </div>
''' for av, m, n, c in [('av-guino.png', 'Tarde · Prof. A. Gómez · 2025', 5, '“El segundo parcial es el difícil: integrales de línea y Green. Hacé los viejos.”'),
                         ('av-crema.png', 'Tarde · Prof. A. Gómez · 2024', 3, '“Mucha teoría en poco tiempo. Las consultas son clave.”')])
    return breadcrumb(['Experiencias', 'Análisis Matemático II', 'Reseña de cursada']) + f'''
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 36px; align-items: start;">
    <article style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 30px 36px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        {gx.avatar('av-birrete.png', 54)}
        <div><div style="font-size: 17px; font-weight: 800;">Anónimo</div><div style="font-size: 13px; font-weight: 600; color: {MUTED};">Reseña de cursada · 14 de agosto de 2026</div></div>
        <div style="margin-left: auto; text-align: right;"><div style="display: flex; gap: 3px; justify-content: flex-end;">{estrellas(4, 20)}</div><div style="margin-top: 3px; font-size: 12px; font-weight: 700; color: {MUTED};">La recomienda cursar así</div></div>
      </div>
      <h1 style="margin: 22px 0 0 0; font-size: 44px; line-height: 0.98; font-weight: 800; letter-spacing: -0.05em;">Análisis Matemático II<span style="color: {ORANGE};">.</span></h1>
      <div style="margin-top: 18px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;">{contexto}</div>
      <div style="margin-top: 26px;">{texto}</div>
      <div style="margin-top: 8px; padding-top: 18px; border-top: 1.5px solid {LINEA}; display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
        <span style="font-size: 14px; font-weight: 700; color: {TEXT2};">¿Te sirvió esta reseña?</span>
        {ga.accion('Me sirvió', 'corazon', color_ic=PINK, extra=f'<span style="font-weight: 800; color: {MUTED};">18</span>')}
        {ga.accion('Compartir', 'compartir')}
        <a href="#reportar" style="margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: {TEXT2};">{ico('bandera', 14, TEXT2, 2)}Reportar</a>
      </div>
    </article>
    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 18px;">
        <div style="{META} color: {MUTED};">La materia según 34 reseñas</div>
        <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div><div style="font-size: 28px; font-weight: 800; letter-spacing: -0.04em;">3,9<span style="font-size: 13px; color: {MUTED};"> / 5</span></div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">recomendación promedio</div></div>
          <div><div style="font-size: 28px; font-weight: 800; letter-spacing: -0.04em; color: {BLUE};">Alta</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">dificultad más elegida</div></div>
        </div>
        <div style="margin-top: 14px;">{gx.barra_resultado()}</div>
        <a href="#materia" style="margin-top: 14px; display: block; font-size: 13.5px; font-weight: 700; color: {BLUE};">Ver todas las experiencias →</a>
      </div>
      <div style="{CARD} padding: 16px 18px 6px 18px;"><h3 style="margin: 0; font-size: 17px; font-weight: 800;">Con el mismo contexto</h3><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Tarde · Prof. A. Gómez</div><div style="margin-top: 6px;">
{otras}      </div></div>
      <div style="position: relative; background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 18px; overflow: hidden; min-height: 150px; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; max-width: 190px;">¿La cursaste? Contá cómo te fue.</h3>
        <div style="margin-top: 12px;">{boton('Escribir reseña', 'pluma', chico=True)}</div>
        <img src="gato-escribe.png" alt="" style="position: absolute; right: -8px; bottom: -8px; width: 120px; height: auto;">
      </div>
    </aside>
  </section>
'''

PAGINAS = [   # (archivo, titulo, fn, alto, tipo)
    ('TuProgreso.dc.html', 'DevsProject · Tu progreso', p_progreso, 2000, 'espacio'),
    ('InsigniaGanada.dc.html', 'DevsProject · Nueva insignia', p_ganada, 840, 'popup'),
    ('PerfilPersonalizado.dc.html', 'DevsProject · Perfil de Max', p_perfil, 1400, 'espacio-sin-subnav'),
    ('AvisoDetalle.dc.html', 'DevsProject · Calculadora Casio fx-991ES Plus', p_aviso, 1700, 'clasificados'),
    ('ExperienciaCompleta.dc.html', 'DevsProject · Reseña de Análisis Matemático II', p_experiencia, 1500, 'experiencias'),
]
if __name__ == '__main__':
    for archivo, titulo, fn, alto, tipo in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        if tipo in ('espacio', 'espacio-sin-subnav'):
            html = ge.documento(titulo, alto, ge.header_logueado(False), fn())
        elif tipo == 'popup':
            html = ge.documento(titulo, alto, '', fn()).replace(ge.footer() if hasattr(ge, 'footer') else '', '')
        elif tipo == 'clasificados':
            html = gx.documento(titulo, alto, gx.header_logueado('Clasificados'), fn())
        else:
            html = gx.documento(titulo, alto, gx.header_logueado('Experiencias'), fn())
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(html)
        print('escrito', archivo, alto)

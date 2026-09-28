# Genera la pagina de resultados de busqueda: una sola busqueda que encuentra materias, materiales,
# experiencias, eventos y clasificados, con los filtros que ya tiene /buscar para materiales.
# Uso: python generar_buscar.py <dir_proyecto> ['{"Buscar.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones', 'eventos'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, estrellas, monograma, ICONOS, TIPO, CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_acciones as ga
import generar_eventos as gev

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA = ga.LINEA

def m(t):   # resaltado de lo buscado
    return f'<mark style="background: #F0F7C9; color: inherit; border-radius: 3px; padding: 0 2px; box-shadow: inset 0 -2px 0 #C8FB10;">{t}</mark>'

def titulo_grupo(texto, n, link):
    return (f'<div style="display: flex; align-items: baseline; justify-content: space-between; gap: 12px;">'
            f'<h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">{texto} <span style="font-size: 15px; color: {MUTED};">{n}</span></h2>{gx.link(link)}</div>')

MATERIALES = [
    ('Parcial', f'{m("Parcial")} 1 resuelto · tema A', 'Ciclo 2025 · Prof. A. Gómez · 4 páginas', 48),
    ('Parcial', f'{m("Parcial")} 2 con corrección', 'Ciclo 2025 · Prof. A. Gómez · 3 páginas', 41),
    ('Parcial', f'Recuperatorio del {m("parcial")} 1', 'Ciclo 2024 · Prof. A. Gómez · 2 páginas', 26),
    ('Parcial', f'{m("Parcial")} 2, integrales dobles y de línea', 'Ciclo 2024 · Prof. M. Sosa · 5 páginas', 22),
    ('Guía de ejercicios', f'Ejercicios tipo {m("parcial")}: series', 'Ciclo 2025 · 12 páginas', 19),
]

def fila_material(tipo, titulo, meta, util):
    _, _, ic, f, c = TIPO[tipo]
    return f'''        <article style="display: flex; align-items: center; gap: 14px; padding: 13px 16px; border-top: 1.5px solid {LINEA};">
          {ga.tile(ic, f, c, 44, 12)}
          <div style="min-width: 0; flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px;"><h3 style="margin: 0; font-size: 15.5px; font-weight: 800; letter-spacing: -0.02em;">{titulo}</h3>{ge.pastilla_tipo(tipo, chica=True)}</div>
            <div style="margin-top: 3px; font-size: 12.5px; font-weight: 600; color: {MUTED};"><b style="color: {TEXT2};">{m("Análisis")} Matemático {m("II")}</b> · {meta}</div>
          </div>
          <span style="display: inline-flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 700;">{ico('corazon', 15, PINK, 2.2)}{util}</span>
          <a href="#ver" style="display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 7px 12px; font-size: 12.5px; font-weight: 700; color: {NAVY};">Ver {ico('flecha', 12, NAVY, 2.5)}</a>
        </article>
'''

def p_buscar():
    q = 'parcial análisis 2'
    buscador = f'''  <section style="flex-shrink: 0; padding: 26px 64px 0 64px;">
    <div style="display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 16px; padding: 8px 8px 8px 18px; box-shadow: 5px 5px 0 {NAVY};">
      {ico('lupa', 22, NAVY, 2.3)}<span style="flex: 1; font-size: 20px; font-weight: 700; letter-spacing: -0.01em;">{q}</span>
      <span aria-label="Borrar búsqueda" style="width: 32px; height: 32px; border-radius: 999px; background: #F1EEE4; display: flex; align-items: center; justify-content: center;">{ico('equis', 14, TEXT2, 2.6)}</span>
      {boton('Buscar')}
    </div>
    <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; color: {TEXT2};">
      <span>38 resultados en <b style="color: {NAVY};">Ingeniería Informática · FI UNJu</b></span>
      <a href="#toda" style="font-weight: 700; color: {BLUE};">Buscar en toda la UNJu</a>
      <span style="margin-left: auto; color: {MUTED};">Solo se muestra lo aprobado por moderación.</span>
    </div>
  </section>
'''
    tabs_datos = [('Todo', 38, 'capas'), ('Materiales', 24, 'doc'), ('Materias', 2, 'libro'), ('Experiencias', 9, 'pluma'), ('Eventos', 1, 'calendario'), ('Clasificados', 2, 'etiqueta')]
    tabs = ''.join(
        (f'<a href="#t" style="display: inline-flex; align-items: center; gap: 7px; padding: 0 2px 11px 2px; font-size: 14.5px; font-weight: 800; color: {BTN}; border-bottom: 2.5px solid {BTN};">{ico(i, 16, BTN, 2.2)}{t}<span style="font-size: 12px; background: {BTN}; color: #FFFFFF; border-radius: 999px; padding: 1px 7px;">{n}</span></a>'
         if t == 'Todo' else
         f'<a href="#t" style="display: inline-flex; align-items: center; gap: 7px; padding: 0 2px 11px 2px; font-size: 14.5px; font-weight: 700; color: {TEXT2};">{ico(i, 16, TEXT2, 2)}{t}<span style="font-size: 12px; color: {MUTED};">{n}</span></a>')
        for t, n, i in tabs_datos)
    materias = ''.join(f'''      <article style="{CARD} {"border-width: 2px; box-shadow: 4px 4px 0 " + NAVY + ";" if top else ""} padding: 16px 18px; display: flex; align-items: center; gap: 14px;">
        <span style="font-size: 13px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 6px 9px;">{cod}</span>
        <div style="min-width: 0; flex: 1;"><h3 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">{nom}</h3>
          <div style="margin-top: 3px; font-size: 12.5px; font-weight: 600; color: {MUTED};">{meta}</div></div>
        {boton('Ir a la materia', 'flecha', primario=top, chico=True)}
      </article>
''' for cod, nom, meta, top in [('06', f'{m("Análisis")} Matemático {m("II")}', '1° año · 2° cuatrimestre · 93 recursos · 24 parciales · 58 experiencias', True),
                                  ('04', f'{m("Análisis")} Matemático I', '1° año · 1° cuatrimestre · 112 recursos · Correlativa de la anterior', False)])
    filtros = ''.join([gx.desplegable('Materia: Análisis Mat. II').replace('display: inline-flex;', 'display: inline-flex; background: #ECF2FE;'),
                       gx.desplegable('Tipo: Parcial').replace('display: inline-flex;', 'display: inline-flex; background: #ECF2FE;'),
                       gx.desplegable('Profesor/a: todos'), gx.desplegable('Ciclo: todos')])
    materiales = f'''      <div style="{CARD} overflow: hidden;">
        <div style="padding: 14px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; background: {ga.CREMA};">
          <span style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; color: {MUTED}; margin-right: 4px;">FILTRAR</span>{filtros}
          <span style="margin-left: auto;">{gx.desplegable('Más relevantes')}</span>
        </div>
{''.join(fila_material(*x) for x in MATERIALES)}        <a href="#todos" style="display: flex; justify-content: center; padding: 13px; border-top: 1.5px solid {LINEA}; font-size: 14px; font-weight: 700; color: {BLUE};">Ver los 24 materiales</a>
      </div>
'''
    exp = ''.join(f'''        <div style="padding: 12px 0; {"border-top: 1.5px solid " + LINEA + ";" if k else ""}">
          <div style="display: flex; align-items: center; gap: 8px;">{gx.avatar(av, 28)}<span style="font-size: 13px; font-weight: 800;">Anónimo</span><span style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{t}</span><span style="margin-left: auto; display: flex; gap: 1px;">{estrellas(n, 11)}</span></div>
          <p style="margin: 7px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2};">{c}</p>
        </div>
''' for k, (av, t, n, c) in enumerate([('av-birrete.png', 'Reseña de cursada', 4, f'“Los {m("parciales")} son largos y toman todo lo de las guías. Arrancá con series desde la primera semana.”'),
                                          ('av-guino.png', 'Reseña de cursada', 5, f'“El segundo {m("parcial")} es el difícil: integrales de línea y Green. Hacé los viejos.”')]))
    lateral = f'''    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="{CARD} padding: 16px 18px 6px 18px;">{titulo_grupo('Experiencias', 9, 'Ver las 9')}<div style="margin-top: 4px;">
{exp}      </div></div>
      <div style="{CARD} padding: 16px 18px;">{titulo_grupo('Eventos', 1, 'Ver')}
        <div style="margin-top: 12px; display: flex; gap: 12px; align-items: center;">
          <div style="width: 70px; height: 70px; flex-shrink: 0; border: 1.5px solid {NAVY}; border-radius: 12px; background: #F0F7C9; display: flex; align-items: center; justify-content: center;">{ico('libro', 28, '#6E9400', 2)}</div>
          <div><div style="font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: {BTN};">JUE 15 OCT · 18:00</div><div style="font-size: 14px; font-weight: 800; line-height: 1.3;">Consulta abierta antes del 2° {m("parcial")} de {m("Análisis")} {m("II")}</div>
            <div style="margin-top: 3px; font-size: 12px; font-weight: 600; color: {MUTED};">FI · Aula 12 · Ayudantes de la cátedra</div></div>
        </div></div>
      <div style="{CARD} padding: 16px 18px;">{titulo_grupo('Clasificados', 2, 'Ver')}
        <div style="margin-top: 12px; display: flex; gap: 12px; align-items: center;">
          <img src="mini-libro-calculo.png" alt="" style="width: 70px; height: 70px; border: 1.5px solid {NAVY}; border-radius: 12px; object-fit: cover;">
          <div><span style="display: inline-flex; background: #FF5C9E; border-radius: 6px; padding: 2px 8px; font-size: 10px; font-weight: 800; letter-spacing: 0.06em; color: #FFFFFF;">VENDO</span>
            <div style="margin-top: 4px; font-size: 14px; font-weight: 800;">Cálculo de Stewart · sirve para {m("Análisis")} I y {m("II")}</div><div style="font-size: 15px; font-weight: 800;">$ 22.000</div></div>
        </div></div>
      <div style="position: relative; background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 18px; overflow: hidden; min-height: 150px; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; max-width: 190px;">¿Buscabas un parcial que no está?</h3>
        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #6A3E50; max-width: 180px;">Si lo tenés, subilo: el próximo que lo busque lo encuentra.</p>
        <div style="margin-top: 12px;">{boton('Subir material', 'subir', chico=True)}</div>
        <img src="gato-cargando.png" alt="" style="position: absolute; right: -6px; bottom: -6px; width: 118px; height: auto;">
      </div>
    </aside>
'''
    relacionadas = ''.join(f'<a href="#q" style="display: inline-flex; align-items: center; gap: 6px; background: #FFFFFF; border: 1.5px solid #E4DCCB; border-radius: 999px; padding: 7px 12px; font-size: 13px; font-weight: 700; color: {NAVY};">{ico("lupa", 13, MUTED, 2.2)}{t}</a>'
                           for t in ['final análisis 2', 'integrales dobles', 'teorema de Green', 'series de potencias'])
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px;"><div style="display: flex; gap: 26px; border-bottom: 1.5px solid #E4DCCB;">{tabs}</div></section>
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 14px;">
      {titulo_grupo('Materias', 2, 'Ver las 2')}
{materias}      <div style="margin-top: 14px;">{titulo_grupo('Materiales', 24, 'Ver los 24')}</div>
{materiales}      <div style="margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px;"><span style="font-size: 13px; font-weight: 700; color: {MUTED};">También buscaron:</span>{relacionadas}</div>
    </div>
{lateral}  </section>
'''
    return gx.header_logueado('') + buscador + cuerpo

if __name__ == '__main__':
    alto = ALTOS.get('Buscar.dc.html', 1500)
    with open(os.path.join(OUT, 'Buscar.dc.html'), 'w', encoding='utf-8') as f:
        f.write(gx.documento('DevsProject · Buscar «parcial análisis 2»', alto, '', p_buscar()))
    print('escrito Buscar.dc.html', alto)

# Mobile (390 px) de las secciones nuevas: Eventos, ficha de un evento, Busqueda, Subir material y
# Escribir una resena. Reutiliza las piezas de generar_movil.py.
# Uso: python generar_movil2.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones', 'estados', 'eventos'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, estrellas, ICONOS, ESTRELLA, TIPO, TIPOS, CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_acciones as ga
import generar_movil as gm
import generar_eventos as gev

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA, CREMA = ga.LINEA, ga.CREMA
META = 'font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;'

def fila_evento(e):
    img = (f'<img src="{e["img"]}" alt="" style="width: 72px; height: 72px; border-radius: 12px; border: 1.5px solid {NAVY}; object-fit: cover; flex-shrink: 0;">' if e['img'] else
           f'<div style="width: 72px; height: 72px; flex-shrink: 0; box-sizing: border-box; border-radius: 12px; border: 1.5px solid {NAVY}; background: {gev.TIPOS_EV[e["tipo"]][0]}; display: flex; align-items: center; justify-content: center;">{ico(gev.TIPOS_EV[e["tipo"]][2], 28, gev.TIPOS_EV[e["tipo"]][1], 2)}</div>')
    return (f'<div style="display: flex; gap: 12px; align-items: center; padding: 10px 0; border-top: 1.5px solid {LINEA};">{img}<div style="min-width: 0; flex: 1;">'
            f'<div style="{META} color: {BTN};">{e["dow"]} {e["dia"]} {e["mes"]} · {e["hora"]}</div><div style="margin-top: 2px; font-size: 14.5px; font-weight: 800; line-height: 1.25;">{e["tit"]}</div>'
            f'<div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: {MUTED};">{e["lugar"]}</div></div>'
            f'<span aria-label="Me interesa" style="flex-shrink: 0;">{ico("estrella", 20, NAVY, 2)}</span></div>')

# ================================================================ 1 · EVENTOS
def m_eventos():
    chips_ = gm.carrusel(''.join(gev.pildora(t, a, f).replace('display: inline-flex;', 'flex-shrink: 0; display: inline-flex;') for t, a, f in
                                 [('Mi facultad', True, True), ('Hoy', False, False), ('Fin de semana', False, False), ('Categoría', False, True), ('Gratis', False, False)]))
    seg = (f'<div style="display: grid; grid-template-columns: 1fr 1fr; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 4px; gap: 4px;">'
           f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px; background: {BTN}; border-radius: 9px; padding: 9px; font-size: 13.5px; font-weight: 800; color: #FFFFFF;">{ico("lista", 14, "#FFFFFF", 2.2)}Lista</span>'
           f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; font-size: 13.5px; font-weight: 700;">{ico("calendario", 14, NAVY, 2.1)}Mes</span></div>')
    e = gev.COMPETITIVA
    destacado = f'''    <article style="{CARD} box-shadow: 5px 5px 0 {NAVY}; overflow: hidden;">
      <div style="position: relative; height: 300px;"><img src="{e['img']}" alt="Flyer de la Jornada de Programación Competitiva" style="width: 100%; height: 100%; object-fit: cover; display: block;">
        <span style="position: absolute; left: 10px; top: 10px; background: #C8FB10; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 3px 10px; {META} color: {NAVY};">Destacado</span>{gev.corazon(False)}</div>
      <div style="padding: 14px 16px 16px 16px;">
        <h2 style="margin: 0; font-size: 22px; line-height: 1.1; font-weight: 800; letter-spacing: -0.035em;">{e['tit']}</h2>
        <div style="margin-top: 6px; {META} color: {MUTED};">Sáb 17 oct · 17:30 · FI · Aula 15</div>
        <div style="margin-top: 4px; font-size: 12.5px; font-weight: 700; color: {ga.VERDE_TX};">✓ Club de Programación · verificado</div>
        <div style="margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">{gev.boton_interes(False).replace('display: inline-flex;', 'display: flex;')}
          <a href="#insc" style="display: flex; align-items: center; justify-content: center; gap: 6px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 8px 12px; font-size: 13px; font-weight: 800; color: #FFFFFF;">Inscribirme{ico('externo', 14, '#FFFFFF', 2.3)}</a></div>
      </div>
    </article>
'''
    def mini(x):
        return (f'<article style="flex-shrink: 0; width: 158px;"><div style="position: relative; height: 158px; border: 1.5px solid {NAVY}; border-radius: 14px; overflow: hidden;"><img src="{x["img"]}" alt="" style="width: 100%; height: 100%; object-fit: cover;">'
                f'<span style="position: absolute; left: 7px; top: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 800;">{x["dow"]} {x["dia"]} {x["mes"]}</span></div>'
                f'<div style="margin-top: 7px; font-size: 13px; font-weight: 800; line-height: 1.25;">{x["tit"]}</div></article>')
    semana = gm.carrusel(''.join(mini(x) for x in [gev.FUTBOL, gev.GIT, gev.SEMANA]), 10)
    octubre = ''.join(fila_evento(x) for x in [gev.IA, gev.FISICA, gev.CONGRESO])
    html = f'''    <div style="padding-top: 8px; display: flex; align-items: flex-end; justify-content: space-between;">
      <div>{eyebrow('FI UNJu y cercanas')}<h1 style="margin: 10px 0 0 0; font-size: 42px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Eventos<span style="color: {ORANGE};">.</span></h1></div>
      <img src="hero-campus.png" alt="" style="width: 150px; height: auto; margin-bottom: -4px;">
    </div>
    <div style="margin-top: 14px;">{seg}</div>
    <div style="margin-top: 10px;">{chips_}</div>
    <div style="margin-top: 16px;">{destacado}</div>
    {gm.seccion('Esta semana', 'Ver todo', 22)}
    <div style="margin-top: 12px;">{semana}</div>
    {gm.seccion('Octubre', '', 22)}
    <div style="margin-top: 8px;">{octubre}</div>
    <div style="height: 70px;"></div>
'''
    return gm.barra_estado() + gm.cabecera(True) + gm.cuerpo(html) + gm.fab('Crear evento', 'mas') + gm.barra_tabs(None)

# ================================================================ 2 · FICHA DE UN EVENTO
def m_evento():
    e = gev.COMPETITIVA
    filas = ''.join(f'<div style="display: flex; gap: 12px; align-items: center; padding: 11px 0; border-top: 1.5px solid {LINEA};">{ga.tile(i, "#ECF2FE", BTN, 38, 11)}'
                    f'<div><div style="font-size: 14.5px; font-weight: 800;">{a}</div><div style="font-size: 12.5px; font-weight: 600; color: {MUTED};">{b}</div></div></div>'
                    for i, a, b in [('calendario', 'Sábado 17 de octubre', '17:30 a 20:30 · agregalo a tu calendario'), ('pin', 'FI · Aula 15', 'Planta baja, al lado del laboratorio 3'), ('gente', 'Cupo: 40 lugares', 'Lo indica el organizador · 43 interesados')])
    return (gm.barra_estado() + f'''  <div style="flex-shrink: 0; position: relative; height: 390px;">
    <img src="{e['img']}" alt="Flyer de la Jornada de Programación Competitiva" style="width: 100%; height: 100%; object-fit: cover; display: block;">
    <span style="position: absolute; left: 16px; top: 12px;">{gm.boton_redondo('chev-izq', 'Volver')}</span>
    <span style="position: absolute; right: 16px; top: 12px; display: flex; gap: 8px;">{gm.boton_redondo('compartir', 'Compartir')}{gm.boton_redondo('corazon', 'Guardar')}</span>
    <span style="position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%); display: flex; gap: 5px;"><span style="width: 16px; height: 6px; border-radius: 99px; background: #FFFFFF;"></span><span style="width: 6px; height: 6px; border-radius: 99px; background: rgba(255,255,255,0.6);"></span></span>
  </div>
''' + gm.cuerpo(f'''    <div style="padding-top: 16px; display: flex; gap: 6px;">{gev.tipo_chip(e['tipo'], True)}{ge.estado('Gratis', ga.VERDE_BG, ga.VERDE_TX, 'check')}</div>
    <h1 style="margin: 10px 0 0 0; font-size: 34px; line-height: 0.95; font-weight: 800; letter-spacing: -0.05em; text-transform: uppercase;">Jornada de programación <span style="color: {BLUE};">competitiva</span></h1>
    <div style="margin-top: 14px;">{filas}</div>
    <p style="margin: 14px 0 0 0; font-size: 15px; line-height: 1.6; font-weight: 500; color: {TEXT2};">Tres horas para resolver problemas en equipos de tres, con el formato ICPC. Hay problemas para quienes recién arrancan y para quienes ya compiten.</p>
    <div style="margin-top: 16px; {CARD} padding: 12px 14px; display: flex; align-items: center; gap: 12px;">{ga.tile('codigo', '#FED3DF', '#E01F63', 42, 12)}
      <div><div style="font-size: 14.5px; font-weight: 800;">Club de Programación FI</div><div style="font-size: 12px; font-weight: 700; color: {ga.VERDE_TX};">✓ Organizador verificado</div></div>
      <span style="margin-left: auto;">{boton('Siguiendo', 'check', primario=False, chico=True)}</span></div>
    <div style="margin-top: 14px; display: flex; align-items: center; gap: 12px; padding: 12px 0; border-top: 1.5px solid {LINEA};">{ico('campana', 18, NAVY, 2.1)}<div><div style="font-size: 14px; font-weight: 800;">Recordarme</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Un día antes y una hora antes</div></div><span style="margin-left: auto;">{ga.interruptor(True)}</span></div>
    <div style="height: 8px;"></div>
''') + f'''  <div style="margin-top: auto; flex-shrink: 0; background: #FEFEFE; border-top: 1.5px solid {NAVY}; padding: 12px 16px 0 16px;">
    <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 10px;">{gev.boton_interes(True, True).replace('display: inline-flex;', 'display: flex;')}
      <a href="#insc" style="display: flex; align-items: center; justify-content: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 12px; font-size: 15px; font-weight: 800; color: #FFFFFF;">Inscribirme{ico('externo', 15, '#FFFFFF', 2.3)}</a></div>
    <div style="margin-top: 6px; text-align: center; font-size: 11.5px; font-weight: 600; color: {MUTED};">Te lleva al formulario del Club de Programación</div>
    {gm.indicador()}
  </div>
''')

# ================================================================ 3 · BUSQUEDA
def m_buscar():
    m = lambda t: f'<mark style="background: #F0F7C9; color: inherit; border-radius: 3px; padding: 0 2px; box-shadow: inset 0 -2px 0 #C8FB10;">{t}</mark>'
    tabs = gm.carrusel(''.join((f'<span style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; padding: 0 2px 10px 2px; font-size: 14px; font-weight: 800; color: {BTN}; border-bottom: 2.5px solid {BTN};">{t}<span style="font-size: 11px; background: {BTN}; color: #FFFFFF; border-radius: 999px; padding: 1px 6px;">{n}</span></span>'
                                if t == 'Todo' else f'<span style="flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px; padding: 0 2px 10px 2px; font-size: 14px; font-weight: 700; color: {TEXT2};">{t}<span style="font-size: 11px; color: {MUTED};">{n}</span></span>')
                               for t, n in [('Todo', 38), ('Materiales', 24), ('Materias', 2), ('Experiencias', 9), ('Eventos', 1)]), 18)
    mats = ''.join(gm.fila_recurso('Parcial', t, f'{m("Análisis")} Matemático {m("II")}', meta, u) for t, meta, u in
                   [(f'{m("Parcial")} 1 resuelto · tema A', '2025 · Prof. A. Gómez', 48), (f'{m("Parcial")} 2 con corrección', '2025 · Prof. A. Gómez', 41), (f'Recuperatorio del {m("parcial")} 1', '2024 · Prof. A. Gómez', 26)])
    html = f'''    <div style="padding-top: 6px; display: flex; align-items: center; gap: 10px;">
      <div style="flex: 1; display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 2px solid {BTN}; border-radius: 13px; padding: 10px 12px; box-shadow: 0 0 0 3px rgba(2,97,254,0.15);">{ico('lupa', 18, NAVY, 2.2)}<span style="flex: 1; font-size: 15px; font-weight: 700;">parcial análisis 2</span>{ico('equis', 15, MUTED, 2.6)}</div>
      <a href="#cancelar" style="font-size: 14px; font-weight: 700; color: {BLUE};">Cancelar</a>
    </div>
    <div style="margin-top: 8px; font-size: 12.5px; font-weight: 600; color: {TEXT2};">38 resultados en <b style="color: {NAVY};">Ing. Informática · FI UNJu</b></div>
    <div style="margin-top: 14px; border-bottom: 1.5px solid #E4DCCB;">{tabs}</div>
    {gm.seccion('Materias', '', 18)}
    <div style="margin-top: 10px; {CARD} border-width: 2px; box-shadow: 4px 4px 0 {NAVY}; padding: 13px 14px; display: flex; align-items: center; gap: 12px;">
      <span style="font-size: 12px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 7px; padding: 4px 7px;">06</span>
      <div style="min-width: 0; flex: 1;"><div style="font-size: 16px; font-weight: 800;">{m("Análisis")} Matemático {m("II")}</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">1° año · 93 recursos · 58 experiencias</div></div>{ico('chev-der', 18, NAVY, 2.4)}
    </div>
    {gm.seccion('Materiales', 'Ver los 24', 22)}
    <div style="margin-top: 10px; display: flex; gap: 8px;">{gx.desplegable('Tipo: Parcial').replace('display: inline-flex;', 'display: inline-flex; background: #ECF2FE;')}{gx.desplegable('Ciclo')}</div>
    <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 10px;">
{mats}    </div>
    {gm.seccion('Experiencias', 'Ver las 9', 22)}
    <div style="margin-top: 10px;">
{gm.resenia('av-guino.png', 'Reseña de cursada', 5, f'“El segundo {m("parcial")} es el difícil: integrales de línea y Green. Hacé los viejos.”', ['Ciclo 2025', 'Tarde'], 'Regular')}    </div>
    <div style="margin-top: 18px; font-size: 13px; font-weight: 700; color: {MUTED};">También buscaron</div>
    <div style="margin-top: 8px; display: flex; flex-wrap: wrap; gap: 7px;">{''.join(f'<span style="display: inline-flex; align-items: center; gap: 5px; background: #FFFFFF; border: 1.5px solid #E4DCCB; border-radius: 999px; padding: 6px 11px; font-size: 12.5px; font-weight: 700;">{ico("lupa", 12, MUTED, 2.2)}{t}</span>' for t in ['final análisis 2', 'integrales dobles', 'teorema de Green'])}</div>
'''
    return gm.barra_estado() + gm.cuerpo(html) + gm.barra_tabs(None)

# ================================================================ 4 · SUBIR MATERIAL
def m_subir():
    _, _, p_ic, p_f, p_c = TIPO['Parcial']
    tipos = '<div style="display: flex; flex-wrap: wrap; gap: 7px;">' + ''.join(ga.pastilla(s, ic, f, c, s == 'Parcial') for s, ic, f, c in ga.TIPOS_MATERIAL) + '</div>'
    titulo = 'Parcial 1 resuelto'
    html = f'''    <div style="padding-top: 6px; display: flex; flex-direction: column; gap: 16px;">
      <div style="display: flex; align-items: center; gap: 12px; background: {CREMA}; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 11px 13px;">
        <span style="font-size: 11px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 6px;">01</span>
        <div style="min-width: 0; flex: 1;"><div style="font-size: 14.5px; font-weight: 800;">Introducción a la Programación</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">Ing. Informática · 1° año</div></div>
        <a href="#cambiar" style="font-size: 13px; font-weight: 700; color: {BLUE};">Cambiar</a></div>
      <div style="display: flex; align-items: center; gap: 12px; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 10px 12px; background: #FFFFFF;">{ga.tile(p_ic, p_f, p_c)}
        <div style="min-width: 0; flex: 1;"><div style="font-size: 14px; font-weight: 800;">parcial-1-resuelto.pdf</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">PDF · 1,8 MB · 4 páginas</div></div>{ge.estado('Listo', ga.VERDE_BG, ga.VERDE_TX, 'check')}</div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
        <span style="display: flex; align-items: center; justify-content: center; gap: 7px; border: 2px dashed #8FA9E6; background: #F4F8FF; border-radius: 12px; padding: 12px; font-size: 13.5px; font-weight: 800; color: {BTN};">{ico('mas', 16, BTN, 2.4)}Otro archivo</span>
        <span style="display: flex; align-items: center; justify-content: center; gap: 7px; border: 2px dashed #8FA9E6; background: #F4F8FF; border-radius: 12px; padding: 12px; font-size: 13.5px; font-weight: 800; color: {BTN};">{ico('camara', 16, BTN, 2.2)}Sacar foto</span></div>
      {gx.campo('Tipo de material', tipos, 'obligatorio')}
      {gx.campo('Título', ga.entrada(titulo, f'{len(titulo)} / 200'), 'obligatorio')}
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">{gx.campo('Ciclo', gx.selector('2025'), None)}{gx.campo('Profesor/a', gx.selector('Gómez'), None)}</div>
      {gx.campo('Descripción', ga.area('Tema A con la corrección de la cátedra.', '38 / 1000', 70))}
    </div>
    <div style="height: 8px;"></div>
'''
    return (gm.barra_estado() + f'''  <header style="flex-shrink: 0; padding: 6px 16px 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid {LINEA};">
    {ga.boton_icono('equis', 'Cerrar', 40)}<div><div style="font-size: 18px; font-weight: 800;">Subir material</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Cada archivo es un material aparte</div></div>
  </header>
''' + gm.cuerpo('<div style="height: 14px;"></div>' + html) + f'''  <div style="margin-top: auto; flex-shrink: 0; background: #FEFEFE; border-top: 1.5px solid {NAVY}; padding: 12px 16px 0 16px;">
    {boton('Publicar', 'check', ancho=True)}
    <div style="margin-top: 6px; text-align: center; font-size: 11.5px; font-weight: 600; color: {MUTED};">Se publica al instante y suma 10 puntos</div>
    {gm.indicador()}
  </div>
''')

# ================================================================ 5 · ESCRIBIR UNA RESENA
def m_escribir():
    seg = (f'<div style="display: grid; grid-template-columns: 1fr 1fr; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 4px; gap: 4px;">'
           f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px; background: {BTN}; border-radius: 9px; padding: 9px; font-size: 13.5px; font-weight: 800; color: #FFFFFF;">{ico("calendario", 14, "#FFFFFF", 2.2)}Cursada</span>'
           f'<span style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 9px; font-size: 13.5px; font-weight: 700;">{ico("birrete", 14, NAVY, 2.1)}Final</span></div>')
    def rejilla(ops, activa, cols=2):
        return f'<div style="display: grid; grid-template-columns: repeat({cols}, minmax(0, 1fr)); gap: 8px;">' + ''.join(gx.opcion(o, o == activa) for o in ops) + '</div>'
    texto = 'Los parciales son largos y toman todo lo de las guías. Arrancá con series desde la primera semana.'
    html = f'''    <div style="padding-top: 14px; display: flex; flex-direction: column; gap: 16px;">
      {seg}
      <div style="display: flex; align-items: center; gap: 10px; background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 12px; padding: 10px 12px;"><span style="font-size: 11px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 6px;">06</span><span style="font-size: 14px; font-weight: 800;">Análisis Matemático II</span><a href="#c" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {BLUE};">Cambiar</a></div>
      {gx.campo('Ciclo lectivo', gx.selector('2025'), 'obligatorio')}
      {gx.campo('Situación de cursada', rejilla(['Primera cursada', 'Primera recursada', 'Segunda o más', 'Prefiero no responder'], 'Primera cursada'), 'obligatorio')}
      {gx.campo('Resultado', rejilla(['Promoción', 'Regular', 'Libre'], 'Promoción', 3), 'obligatorio')}
      <div style="margin-top: -8px; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #F4F8FF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 10px 12px;"><span style="font-size: 13px; font-weight: 800;">¿Con qué nota?</span>{gx.stepper('8', '/ 10')}</div>
      {gx.campo('¿La recomendarías cursar así?', '<div style="display: flex; gap: 6px;">' + estrellas(4, 30) + '</div>', 'obligatorio')}
      {gx.campo('Tu experiencia', ga.area(texto, f'{len(texto)} / 2000', 110))}
      <div style="display: flex; align-items: center; gap: 12px; background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 12px 14px;">{ga.interruptor(True)}<div><div style="font-size: 14px; font-weight: 800;">Publicar como anónimo</div><div style="font-size: 12px; line-height: 1.4; font-weight: 500; color: {TEXT2};">No suma puntos ni aparece en tu perfil.</div></div></div>
    </div>
    <div style="height: 8px;"></div>
'''
    return (gm.barra_estado() + f'''  <header style="flex-shrink: 0; padding: 6px 16px 12px 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1.5px solid {LINEA};">
    {ga.boton_icono('equis', 'Cerrar', 40)}<div><div style="font-size: 18px; font-weight: 800;">Contá cómo te fue</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Te lleva tres minutos</div></div>
  </header>
''' + gm.cuerpo(html) + f'''  <div style="margin-top: auto; flex-shrink: 0; background: #FEFEFE; border-top: 1.5px solid {NAVY}; padding: 12px 16px 0 16px;">
    {boton('Publicar reseña', 'check', ancho=True)}
    {gm.indicador()}
  </div>
''')

PAGINAS = [
    ('MovilEventos.dc.html', 'DevsProject · Eventos (mobile)', m_eventos, 1700, False),
    ('MovilEvento.dc.html', 'DevsProject · Evento (mobile)', m_evento, 1300, False),
    ('MovilBuscar.dc.html', 'DevsProject · Búsqueda (mobile)', m_buscar, 1500, False),
    ('MovilSubir.dc.html', 'DevsProject · Subir material (mobile)', m_subir, 1100, False),
    ('MovilEscribir.dc.html', 'DevsProject · Escribir reseña (mobile)', m_escribir, 1300, False),
]
if __name__ == '__main__':
    for archivo, titulo, fn, alto, serif in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(gm.documento_movil(titulo, alto, fn(), serif))
        print('escrito', archivo, alto)

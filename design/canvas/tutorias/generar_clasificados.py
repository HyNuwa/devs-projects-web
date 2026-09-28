# Genera las 3 pantallas de Clasificados: vista Todo, vista Tutorias y Perfil de tutor.
# Reusa header, hero y pie de la pagina actual para que sigan siendo la misma pagina.
import json, os, re, sys

SP = os.environ['SP']
sys.path.insert(0, os.path.join(SP, 'materias'))
from generar import (ico, chip, boton, estrellas, breadcrumb, eyebrow, CARD, NAVY, BLUE, BTN,
                     ORANGE, PINK, MUTED, TEXT2, estado_activo, ICONOS)

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
BASE = open(os.path.join(SP, 'tutorias', 'base-clasificados.dc.html'), encoding='utf-8').read()

def entre(a, b):
    return BASE[BASE.index(a):BASE.index(b)]

PREFIJO = BASE[:BASE.index('  <!-- barra superior -->')]
HEADER = entre('  <!-- barra superior -->', '  <!-- hero -->')
HERO = entre('  <!-- hero -->', '  <!-- barra de filtros -->')
PIE = BASE[BASE.index('  <!-- pie -->'):BASE.index('</div>\n</x-dc>')]
COLA = BASE[BASE.index('</div>\n</x-dc>'):]
ARTICULOS = re.findall(r'<article .*?</article>', BASE, re.S)
PANEL = BASE[BASE.index('    <aside'):BASE.index('</aside>') + 8]

# el hero es el mismo en las dos vistas; solo cambia el texto para sumar tutorias
HERO = (HERO.replace('03 · Entre estudiantes', '03 · Cosas y ayuda entre estudiantes')
            .replace('Comprá, vendé o buscá cosas entre estudiantes de la facultad.',
                     'Comprá, vendé o conseguí tutorías entre estudiantes.')
            .replace('Buscá libros, calculadoras, componentes', 'Buscá libros, calculadoras, tutorías, componentes'))
PANEL = PANEL.replace('Revisá el producto<br>antes de pagar', 'Revisá el producto o el<br>perfil antes de contactar')

VERDE_BG, VERDE_TX, NARANJA_BG, NARANJA_TX = '#E1F5E4', '#1F7A37', '#FDE7D0', '#B14C06'

def insignia(tipo):
    estilos = {
        'tutoria': (VERDE_BG, VERDE_TX, 'birrete', 'OFREZCO TUTORÍA'),
        'busco-tutor': (NARANJA_BG, NARANJA_TX, 'lupa', 'BUSCO TUTOR'),
    }
    f, c, ic, t = estilos[tipo]
    return (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: {f}; border-radius: 6px; padding: 3px 8px; '
            f'font-size: 10.5px; font-weight: 800; letter-spacing: 0.05em; color: {c};">{ico(ic, 11, c, 2.6)}{t}</span>')

CORAZON = ico('corazon', 17, '#9BA2B4', 2)

def boton_fila(texto, href='#ver'):
    return (f'<a href="{href}" style="margin-top: auto; padding-top: 10px; align-self: flex-end; display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: {NAVY};">'
            f'<span style="display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 6px 11px;">{texto} {ico("flecha", 12, NAVY, 2.5)}</span></a>')

def avatar_iniciales(ini, fondo, color, tam=46):
    return (f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex-shrink: 0; border-radius: 999px; border: 1.5px solid {NAVY}; background: {fondo}; '
            f'display: flex; align-items: center; justify-content: center; font-size: {round(tam*0.32)}px; font-weight: 800; color: {color};">{ini}</span>')

# ------------------------------------------------ datos de muestra (mismos que la seccion Tutorias de la portada)
TUTORES = [
    dict(av='av-crema.png', fondo='#FDF3E5', nombre='Camila R.', carrera='Ing. Informática · 4° año', materia='Análisis Matemático I',
         temas=['Integrales', 'Límites', 'Derivadas'], precio='$ 3.000', modalidad='Presencial o virtual', lugar='FI UNJu',
         horario='Tarde · Lun, Mié y Vie', nota='4.9', opiniones=28, dadas=46),
    dict(av='av-birrete.png', fondo='#D6E5FB', nombre='Tomás L.', carrera='Ing. Industrial · 5° año', materia='Física I',
         temas=['Mecánica', 'Dinámica', 'Problemas'], precio='$ 2.500', modalidad='Presencial', lugar='FI UNJu',
         horario='Mañana · Mar y Jue', nota='4.8', opiniones=19, dadas=31),
    dict(av='av-guino.png', fondo='#FED3DF', nombre='Valentina S.', carrera='Lic. en Sistemas · 3° año', materia='Álgebra Lineal',
         temas=['Matrices', 'Sistemas', 'Espacios vectoriales'], precio='$ 3.000', modalidad='Virtual', lugar='por videollamada',
         horario='Noche · Lun a Vie', nota='5.0', opiniones=16, dadas=22),
]
PEDIDOS = [
    dict(ini='FM', fondo='#EDE6FB', color='#5B4B8A', nombre='Facundo M.', cuando='hace 3 h', titulo='Necesito ayuda con Física I',
         temas='Cinemática y dinámica', urgencia='Parcial en 2 semanas', prefiere='Prefiere presencial', dispo='Disponible a la tarde'),
    dict(ini='LP', fondo='#F0F7C9', color='#5A7A00', nombre='Lucía P.', cuando='hace 1 día', titulo='Busco quien me explique recursividad',
         temas='Introducción a la Programación', urgencia='Antes del primer parcial', prefiere='Virtual o presencial', dispo='Disponible a la noche'),
]

# ------------------------------------------------ tarjetas horizontales (vista Todo, mismo formato que las de compra/venta)
def tarjeta_tutor_fila(t):
    temas = ' · '.join(t['temas'])
    return f'''      <article style="background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 11px; display: flex; gap: 12px;">
        <div style="width: 102px; height: 102px; flex-shrink: 0; border: 1.5px solid {NAVY}; border-radius: 10px; overflow: hidden; background: {t['fondo']}; display: flex; align-items: center; justify-content: center;">
          <img src="{t['av']}" alt="" style="display: block; width: 84px; height: 84px; object-fit: contain;">
        </div>
        <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">{insignia('tutoria')}{CORAZON}</div>
          <h3 style="margin: 7px 0 0 0; font-size: 13.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22; color: {NAVY};">{t['materia']}</h3>
          <div style="margin-top: 2px; font-size: 11px; font-weight: 600; color: {MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{temas}</div>
          <div style="margin-top: 5px; font-size: 16px; font-weight: 800; letter-spacing: -0.02em; color: {NAVY};">{t['precio']} <span style="font-size: 11.5px; font-weight: 600; color: {MUTED};">/ hora</span></div>
          <div style="margin-top: 5px; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: {TEXT2};">{ico('pin', 12, BTN, 2.1)}{t['modalidad']} · {t['horario'].split(' · ')[0]}</div>
          <div style="margin-top: auto; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
            <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: {TEXT2};"><svg width="12" height="12" viewBox="0 0 24 24" fill="#E9B949" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"></path></svg>{t['nota']} <span style="font-weight: 600; color: {MUTED};">({t['opiniones']})</span></span>
            <a href="#perfil" style="display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 6px 11px; font-size: 11.5px; font-weight: 700; color: {NAVY};">Ver perfil {ico('flecha', 12, NAVY, 2.5)}</a>
          </div>
        </div>
      </article>
'''

def tarjeta_pedido_fila(p):
    return f'''      <article style="background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 11px; display: flex; gap: 12px;">
        <div style="width: 102px; height: 102px; flex-shrink: 0; border: 1.5px solid {NAVY}; border-radius: 10px; overflow: hidden; background: #FDF3E5; display: flex; align-items: center; justify-content: center;">
          <img src="gato-idea.png" alt="" style="display: block; width: 88px; height: 88px; object-fit: contain;">
        </div>
        <div style="flex-grow: 1; min-width: 0; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">{insignia('busco-tutor')}{CORAZON}</div>
          <h3 style="margin: 7px 0 0 0; font-size: 13.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22; color: {NAVY};">{p['titulo']}</h3>
          <p style="margin: 4px 0 0 0; font-size: 11.5px; line-height: 1.35; font-weight: 500; color: #4B5265;">{p['urgencia']}. Me cuesta {p['temas'].lower()}.</p>
          <div style="margin-top: 6px; display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: {MUTED};">
            <span style="width: 7px; height: 7px; border-radius: 999px; background: #37C46B; display: block;"></span>{p['nombre']} · {p['cuando']}
          </div>
          {boton_fila('Ver publicación', '#pedido')}
        </div>
      </article>
'''

# ------------------------------------------------ tarjetas verticales (vista Tutorias)
def tarjeta_tutor(t):
    temas = ''.join(chip(x, '#ECF2FE', '#2B4C8C') for x in t['temas'])
    return f'''      <article style="{CARD} padding: 17px; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; justify-content: space-between;">{insignia('tutoria')}{CORAZON}</div>
        <div style="margin-top: 13px; display: flex; align-items: center; gap: 12px;">
          <img src="{t['av']}" alt="" style="width: 52px; height: 52px; border-radius: 999px; border: 1.5px solid {NAVY}; background: {t['fondo']}; flex-shrink: 0; object-fit: cover;">
          <div style="min-width: 0;">
            <div style="font-size: 16px; font-weight: 800; letter-spacing: -0.02em;">{t['nombre']}</div>
            <div style="font-size: 12px; font-weight: 600; color: {MUTED};">{t['carrera']}</div>
          </div>
        </div>
        <h3 style="margin: 14px 0 0 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15;">{t['materia']}</h3>
        <div style="margin-top: 9px; display: flex; flex-wrap: wrap; gap: 6px;">{temas}</div>
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1.5px solid #EFE7D8; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; font-weight: 600; color: {TEXT2};">
          <span style="display: flex; align-items: center; gap: 8px;"><span style="font-size: 18px; font-weight: 800; letter-spacing: -0.02em; color: {NAVY};">{t['precio']}</span> / hora</span>
          <span style="display: flex; align-items: center; gap: 8px;">{ico('pin', 14, BTN)}{t['modalidad']} · {t['lugar']}</span>
          <span style="display: flex; align-items: center; gap: 8px;">{ico('reloj', 14, BTN)}{t['horario']}</span>
        </div>
        <div style="margin-top: 12px; display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 700;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#E9B949" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"></path></svg>
          {t['nota']} <span style="font-weight: 600; color: {MUTED};">· {t['opiniones']} opiniones · {t['dadas']} tutorías</span>
        </div>
        <a href="#perfil" style="margin-top: auto; padding-top: 15px; display: flex; font-size: 13px; font-weight: 700; color: {NAVY};">
          <span style="display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px;">Ver perfil {ico('flecha', 13, NAVY, 2.5)}</span>
        </a>
      </article>
'''

def tarjeta_pedido(p):
    return f'''      <article style="{CARD} padding: 17px; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: center; justify-content: space-between;">{insignia('busco-tutor')}{CORAZON}</div>
        <div style="margin-top: 13px; display: flex; align-items: center; gap: 12px;">
          {avatar_iniciales(p['ini'], p['fondo'], p['color'], 52)}
          <div>
            <div style="font-size: 16px; font-weight: 800; letter-spacing: -0.02em;">{p['nombre']}</div>
            <div style="display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: {MUTED};">{ico('reloj', 12, MUTED, 2.1)}{p['cuando']}</div>
          </div>
        </div>
        <h3 style="margin: 14px 0 0 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15;">{p['titulo']}</h3>
        <div style="margin-top: 6px; font-size: 13px; font-weight: 600; color: {MUTED};">{p['temas']}</div>
        <span style="margin-top: 12px; align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; background: #FED3DF; border: 1.5px solid #F2A3BF; border-radius: 8px; padding: 6px 10px; font-size: 12.5px; font-weight: 800; color: #B31450;">{ico('calendario', 14, '#B31450', 2.2)}{p['urgencia']}</span>
        <div style="margin-top: 14px; padding-top: 12px; border-top: 1.5px solid #EFE7D8; display: flex; flex-direction: column; gap: 8px; font-size: 12.5px; font-weight: 600; color: {TEXT2};">
          <span style="display: flex; align-items: center; gap: 8px;">{ico('pin', 14, BTN)}{p['prefiere']}</span>
          <span style="display: flex; align-items: center; gap: 8px;">{ico('reloj', 14, BTN)}{p['dispo']}</span>
        </div>
        <a href="#pedido" style="margin-top: auto; padding-top: 15px; display: flex; font-size: 13px; font-weight: 700; color: {NAVY};">
          <span style="display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; background: {BTN}; color: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px;">Ofrecer ayuda {ico('flecha', 13, '#FFFFFF', 2.5)}</span>
        </a>
      </article>
'''

def tarjeta_ofrecer():
    return f'''      <aside style="background: {VERDE_BG}; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; position: relative; overflow: hidden;">
        <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.16em; color: {VERDE_TX};">SUMATE COMO TUTOR</div>
        <h3 style="margin: 10px 0 0 0; font-size: 23px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.08;">¿Explicás bien una materia?</h3>
        <p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #2F5A3A; max-width: 210px;">Publicá tu tutoría: materias, horarios y un precio orientativo. Te contactan directamente.</p>
        <div style="margin-top: auto; padding-top: 16px;">{boton('Ofrecer tutorías', 'birrete', chico=True)}</div>
        <img src="gato-birrete-laptop.png" alt="" style="position: absolute; right: -18px; bottom: -8px; width: 210px; height: auto;">
      </aside>
'''

# ------------------------------------------------ barra de filtros
def selector(modo):
    def item(clave, texto, icono, borde, color_ic):
        activo = clave == modo
        if activo:
            return (f'<a href="#{clave}" aria-current="true" style="display: inline-flex; align-items: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 15px; font-size: 13.5px; font-weight: 800; color: #FFFFFF;">'
                    f'{ico(icono, 15, "#FFFFFF", 2.2)}{texto}</a>')
        return (f'<a href="#{clave}" style="display: inline-flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1.5px solid {borde}; border-radius: 10px; padding: 8px 15px; font-size: 13.5px; font-weight: 700; color: {NAVY};">'
                f'{ico(icono, 15, color_ic, 2.1)}{texto}</a>')
    return (item('todo', 'Todo', 'capas', '#CFC5B0', NAVY) +
            item('compra-venta', 'Compra y venta', 'doc', '#F4C9D8', PINK) +
            item('tutorias', 'Tutorías', 'birrete', '#A9D9B3', VERDE_TX))

SEPARADOR = '<span style="width: 1.5px; height: 26px; background: #E4DCCB; margin: 0 4px; flex-shrink: 0;"></span>'
CATEGORIAS = ''.join(
    f'<a href="#{t.lower()}" style="display: inline-flex; align-items: center; gap: 7px; padding: 8px 10px; font-size: 13.5px; font-weight: 600; color: {NAVY};">{ico(ic, 16, c, 2)}{t}</a>'
    for t, ic, c in [('Libros', 'libro', '#E2560A'), ('Calculadoras', 'tablilla', '#E2560A'), ('Tecnología', 'monitor', BTN),
                     ('Electrónica', 'engranaje', BTN), ('Universidad', 'birrete', BTN)]
) + f'<a href="#otros" style="display: inline-flex; align-items: center; gap: 7px; padding: 8px 10px; font-size: 13.5px; font-weight: 600; color: {MUTED};">•••&nbsp;Otros</a>'

def orden(texto):
    return (f'<div style="margin-left: auto; flex-shrink: 0; display: inline-flex; align-items: center; gap: 9px; border: 1.5px solid #E4DCCB; border-radius: 10px; padding: 9px 13px; font-size: 13.5px; font-weight: 600; color: {NAVY};">'
            f'{ico("capas", 15, NAVY, 2)}{texto}{ico("abajo", 13, NAVY, 2.4)}</div>')

def desplegable(etiqueta, valor):
    return (f'<label style="display: flex; flex-direction: column; gap: 4px; font-size: 10.5px; font-weight: 800; letter-spacing: 0.12em; color: {MUTED};">{etiqueta.upper()}'
            f'<span style="display: inline-flex; align-items: center; justify-content: space-between; gap: 14px; min-width: 168px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 12px; font-size: 13.5px; font-weight: 700; letter-spacing: 0; color: {NAVY};">'
            f'{valor}{ico("abajo", 13, NAVY, 2.4)}</span></label>')

def intencion(texto, icono, fondo, color, activa=False, n=None):
    num = f'<span style="font-weight: 800; opacity: 0.7;">{n}</span>' if n is not None else ''
    borde = f'2px solid {NAVY}' if activa else f'1.5px solid {color}'
    return (f'<a href="#{texto}" style="display: inline-flex; align-items: center; gap: 8px; background: {fondo if activa else "#FFFFFF"}; border: {borde}; border-radius: 10px; padding: 8px 14px; font-size: 13.5px; font-weight: 800; color: {NAVY};">'
            f'{ico(icono, 15, color, 2.2)}{texto}{num}</a>')

def barra(modo):
    if modo == 'todo':
        fila = f'{selector(modo)}{SEPARADOR}{CATEGORIAS}{orden("Más recientes")}'
        return f'''  <!-- barra de filtros -->
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px;">
    <div style="background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 9px 12px; display: flex; align-items: center; gap: 10px;">{fila}</div>
  </section>
'''
    fila1 = (f'{selector(modo)}{SEPARADOR}'
             f'{intencion("Todas", "capas", "#F1EEE4", NAVY, activa=True, n=5)}'
             f'{intencion("Ofrezco tutorías", "birrete", VERDE_BG, VERDE_TX, n=3)}'
             f'{intencion("Busco tutor", "lupa", NARANJA_BG, NARANJA_TX, n=2)}'
             f'{orden("Mejor valorados")}')
    fila2 = (desplegable('Materia', 'Todas las materias') + desplegable('Modalidad', 'Cualquiera') +
             desplegable('Disponibilidad', 'Cualquier horario') + desplegable('Precio', 'Hasta $ 5.000') +
             f'<a href="#limpiar" style="margin-left: auto; align-self: flex-end; padding: 10px 4px; font-size: 13px; font-weight: 700; color: {BLUE};">Limpiar filtros</a>')
    return f'''  <!-- barra de filtros -->
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px;">
    <div style="background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 10px 12px 14px 12px; display: flex; flex-direction: column; gap: 12px;">
      <div style="display: flex; align-items: center; gap: 10px;">{fila1}</div>
      <div style="display: flex; align-items: flex-end; gap: 12px; padding: 12px 4px 0 4px; border-top: 1.5px dashed #E4DCCB;">{fila2}</div>
    </div>
  </section>
'''

def titulo_bloque(texto, nota):
    return f'''    <div style="display: flex; align-items: center; gap: 18px;">
      <h2 style="margin: 0; font-size: 29px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">{texto}</h2>
      <span class="dp-hand" style="font-size: 20px; font-weight: 700; color: {NAVY}; transform: rotate(-3deg);">{nota}</span>
    </div>
    <div></div>
'''

# ------------------------------------------------ vista TODO
def vista_todo():
    grilla = (ARTICULOS[0] + '\n\n' + tarjeta_tutor_fila(TUTORES[0]) + '\n' + ARTICULOS[2] + '\n\n' +
              ARTICULOS[3] + '\n\n' + tarjeta_tutor_fila(TUTORES[1]) + '\n' + tarjeta_pedido_fila(PEDIDOS[0]))
    publicaciones = f'''  <!-- publicaciones -->
  <section style="flex-shrink: 0; position: relative; margin-top: 26px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 344px; column-gap: 28px; row-gap: 18px; align-items: start;">
{titulo_bloque('Publicaciones recientes', 'recién publicado →')}
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
      {grilla}
    </div>

{PANEL}

    <div class="dp-hand" style="position: absolute; right: 10px; top: -4px; width: 120px; text-align: center; font-size: 19px; font-weight: 700; line-height: 1.1; color: #021238; transform: rotate(4deg);">confianza también es comunidad ♥</div>
  </section>
'''
    banner = f'''  <!-- llamado a tutorias -->
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px;">
    <div style="position: relative; background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 18px; padding: 18px 26px 18px 196px; min-height: 100px; box-sizing: border-box; display: flex; align-items: center; gap: 22px;">
      <img src="gato-birrete-laptop.png" alt="Ilustración: el gato de DevsProject con birrete frente a una notebook" style="position: absolute; left: 16px; bottom: 0; width: 164px; height: auto;">
      <div>
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">¿Necesitás ayuda para entender un tema?</h2>
        <p style="margin: 5px 0 0 0; font-size: 14.5px; font-weight: 500; color: #6A3E50;">Encontrá estudiantes que pueden explicarte, o publicá lo que necesitás.</p>
      </div>
      <div style="margin-left: auto; display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
        {boton('Buscar tutor', 'flecha')}
        {boton('Publicar tutoría', 'birrete', primario=False)}
      </div>
      <span class="dp-hand" style="position: absolute; right: 22px; top: -30px; font-size: 19px; font-weight: 700; color: {NAVY}; transform: rotate(-4deg);">aprender también es compartir ♥</span>
    </div>
  </section>

'''
    return barra('todo') + '\n' + publicaciones + '\n' + banner

# ------------------------------------------------ vista TUTORIAS
def vista_tutorias():
    grilla = (tarjeta_tutor(TUTORES[0]) + tarjeta_tutor(TUTORES[1]) + tarjeta_pedido(PEDIDOS[0]) +
              tarjeta_tutor(TUTORES[2]) + tarjeta_pedido(PEDIDOS[1]) + tarjeta_ofrecer())
    pasos = ''.join(
        f'''        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span style="width: 28px; height: 28px; flex-shrink: 0; border-radius: 999px; border: 1.5px solid {NAVY}; background: {f}; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;">{i}</span>
          <div><div style="font-size: 13.5px; font-weight: 800;">{t}</div><div style="margin-top: 2px; font-size: 12px; line-height: 1.4; font-weight: 500; color: {MUTED};">{d}</div></div>
        </div>
''' for i, (t, d, f) in enumerate([
            ('Buscá por materia', 'O publicá lo que necesitás y que te encuentren.', '#D6E5FB'),
            ('Mirá el perfil', 'Materias, horarios, precio orientativo y opiniones.', '#FED3DF'),
            ('Contactá y acuerden', 'Coordinan directo entre ustedes, sin intermediarios.', VERDE_BG)], start=1))
    panel = f'''    <aside style="display: flex; flex-direction: column; gap: 16px;">
      <div style="background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 18px; position: relative; overflow: hidden;">
        <h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Cómo funcionan las tutorías</h2>
        <div style="margin-top: 14px; display: flex; flex-direction: column; gap: 13px;">
{pasos}        </div>
        <div style="margin-top: 14px; display: flex; align-items: flex-start; gap: 8px; font-size: 11px; line-height: 1.4; font-weight: 500; color: {MUTED};">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9BA2B4" stroke-width="2.1" stroke-linecap="round" aria-hidden="true" style="flex-shrink: 0; margin-top: 1px;"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5M12 7.5h.01"></path></svg>
          <span>DevsProject conecta estudiantes. No interviene en pagos, reservas ni en lo que acuerden.</span>
        </div>
      </div>
      <div style="background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 16px; overflow: hidden; position: relative; height: 196px;">
        <img src="hero-tutoria.png" alt="Ilustración: un gato con birrete explica en un pizarrón a otro gato que toma apuntes" style="position: absolute; left: -8px; bottom: -6px; width: 356px; height: auto;">
        <span class="dp-hand" style="position: absolute; left: 14px; top: 10px; font-size: 19px; font-weight: 700; color: {NAVY}; transform: rotate(-3deg);">como pedirle ayuda a otro jugador</span>
      </div>
    </aside>
'''
    publicaciones = f'''  <!-- tutorias -->
  <section style="flex-shrink: 0; position: relative; margin-top: 26px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 344px; column-gap: 28px; row-gap: 18px; align-items: start;">
{titulo_bloque('Tutorías entre estudiantes', 'aprender también es compartir →')}
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
{grilla}    </div>
{panel}  </section>
'''
    banner = f'''  <!-- llamado a pedir ayuda -->
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px;">
    <div style="position: relative; background: #FDE7D0; border: 1.5px solid {NAVY}; border-radius: 18px; padding: 16px 26px 16px 150px; min-height: 96px; box-sizing: border-box; display: flex; align-items: center; gap: 22px;">
      <img src="gato-idea.png" alt="" style="position: absolute; left: 20px; bottom: -4px; width: 112px; height: auto;">
      <div>
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">¿No encontrás tutor para tu materia?</h2>
        <p style="margin: 5px 0 0 0; font-size: 14.5px; font-weight: 500; color: #7A4A20;">Publicá lo que necesitás, por ejemplo “alguien que me explique integrales antes del parcial”.</p>
      </div>
      <div style="margin-left: auto; flex-shrink: 0;">{boton('Pedir ayuda', 'lupa')}</div>
    </div>
  </section>

'''
    return barra('tutorias') + '\n' + publicaciones + '\n' + banner

# ------------------------------------------------ PERFIL DE TUTOR
def vista_perfil():
    t = TUTORES[0]
    materias = [
        ('Análisis Matemático I', ['Integrales', 'Límites', 'Derivadas'], 'La cursé en 2022 · Promoción', '04'),
        ('Análisis Matemático II', ['Series', 'Integrales múltiples'], 'La cursé en 2022 · Regular', '06'),
        ('Álgebra Lineal', ['Matrices', 'Sistemas de ecuaciones'], 'La cursé en 2021 · Promoción', '02'),
    ]
    mat_html = ''.join(f'''        <div style="display: flex; align-items: center; gap: 14px; padding: 13px 0; {'border-top: 1.5px solid #EFE7D8;' if i else ''}">
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">{cod}</span>
          <div style="flex: 1; min-width: 0;">
            <div style="font-size: 15px; font-weight: 800; letter-spacing: -0.02em;">{m}</div>
            <div style="margin-top: 6px; display: flex; flex-wrap: wrap; gap: 6px;">{''.join(chip(x, '#ECF2FE', '#2B4C8C') for x in temas)}</div>
          </div>
          <span style="font-size: 12px; font-weight: 600; color: {MUTED}; white-space: nowrap;">{cursada}</span>
          <a href="#materia-{cod}" style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: {BLUE}; white-space: nowrap;">Ver materia {ico('flecha', 12, BLUE, 2.4)}</a>
        </div>
''' for i, (m, temas, cursada, cod) in enumerate(materias))
    dias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    franjas = [('Mañana', [0, 0, 0, 0, 0, 1]), ('Tarde', [1, 0, 1, 0, 1, 0]), ('Noche', [0, 1, 0, 1, 0, 0])]
    celdas = ''.join(f'<span style="font-size: 11px; font-weight: 800; letter-spacing: 0.08em; color: {MUTED}; text-align: center;">{d.upper()}</span>' for d in dias)
    filas = ''
    for fr, marcas in franjas:
        filas += f'<span style="font-size: 12.5px; font-weight: 700; color: {TEXT2}; align-self: center;">{fr}</span>'
        for mk in marcas:
            filas += (f'<span style="height: 30px; border-radius: 8px; border: 1.5px solid {NAVY if mk else "#E4DCCB"}; background: {VERDE_BG if mk else "#FFFFFF"}; '
                      f'display: flex; align-items: center; justify-content: center; color: {VERDE_TX};">{"✓" if mk else ""}</span>')
    opiniones = [
        ('av-guino.png', 5, 'Análisis Matemático I', 'hace 2 semanas', '“Me explicó límites con ejercicios de parciales viejos y por fin le encontré la vuelta. Aprobé el recuperatorio.”'),
        ('av-birrete.png', 5, 'Álgebra Lineal', 'hace 1 mes', '“Muy paciente. Si no entendés, te lo explica de otra forma hasta que sale.”'),
        ('av-crema.png', 4, 'Análisis Matemático II', 'hace 2 meses', '“Las clases virtuales funcionan bien; te comparte la pizarra y los ejercicios quedan guardados.”'),
    ]
    op_html = ''.join(f'''        <article style="{CARD} padding: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="{av}" alt="" style="width: 34px; height: 34px; border-radius: 999px; border: 1.5px solid {NAVY};">
            <div style="flex: 1;"><div style="display: flex; gap: 2px;">{estrellas(n, 13)}</div><div style="margin-top: 3px; font-size: 11.5px; font-weight: 600; color: {MUTED};">Anónimo · {cuando}</div></div>
            {chip(mat, '#ECF2FE', '#2B4C8C')}
          </div>
          <p style="margin: 11px 0 0 0; font-size: 13.5px; line-height: 1.5; font-weight: 500; color: #4B5265;">{txt}</p>
        </article>
''' for av, n, mat, cuando, txt in opiniones)
    cuerpo = breadcrumb(['Clasificados', 'Tutorías', 'Camila R.']) + f'''
  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px;">
    <div style="{CARD} padding: 24px 26px; display: flex; align-items: center; gap: 26px; position: relative;">
      <div style="position: relative; flex-shrink: 0;">
        <img src="{t['av']}" alt="" style="width: 132px; height: 132px; border-radius: 999px; border: 2px solid {NAVY}; background: {t['fondo']}; display: block;">
        <span style="position: absolute; right: 6px; bottom: 8px; width: 22px; height: 22px; border-radius: 999px; background: #37C46B; border: 3px solid #FFFFFF; box-shadow: 0 0 0 1.5px {NAVY};"></span>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 10px;">{insignia('tutoria')}{estado_activo('Disponible esta semana')}</div>
        <h1 style="margin: 10px 0 0 0; font-size: 56px; line-height: 0.95; font-weight: 800; letter-spacing: -0.05em; color: {NAVY};">Camila R<span style="color: {ORANGE};">.</span></h1>
        <div style="margin-top: 8px; font-size: 15px; font-weight: 600; color: {TEXT2};">Ingeniería Informática · 4° año · Facultad de Ingeniería, UNJu</div>
        <div style="margin-top: 12px; display: flex; align-items: center; flex-wrap: wrap; gap: 16px; font-size: 13.5px; font-weight: 700;">
          <span style="display: inline-flex; align-items: center; gap: 6px;"><svg width="17" height="17" viewBox="0 0 24 24" fill="#E9B949" aria-hidden="true"><path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"></path></svg>4.9 <span style="font-weight: 600; color: {MUTED};">· 28 opiniones</span></span>
          <span style="display: inline-flex; align-items: center; gap: 6px;">{ico('birrete', 16, BTN)}46 tutorías dadas</span>
          <span style="display: inline-flex; align-items: center; gap: 6px;">{ico('reloj', 16, BTN)}Responde en el día</span>
          <span style="display: inline-flex; align-items: center; gap: 6px;">{ico('pin', 16, BTN)}Presencial en FI UNJu o virtual</span>
        </div>
      </div>
      <div style="width: 300px; flex-shrink: 0; background: #FDF3E5; border: 1.5px solid {NAVY}; border-radius: 14px; padding: 18px;">
        <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">PRECIO ORIENTATIVO</div>
        <div style="margin-top: 4px; font-size: 32px; font-weight: 800; letter-spacing: -0.04em;">$ 3.000 <span style="font-size: 14px; font-weight: 600; color: {MUTED}; letter-spacing: 0;">/ hora</span></div>
        <div style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Grupal: $ 2.000 por persona</div>
        <div style="margin-top: 14px; display: flex; gap: 8px;">
          <a href="#contactar" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 12px 14px; font-size: 14.5px; font-weight: 800; color: #FFFFFF;">{ico('pluma', 15, '#FFFFFF', 2.3)}Contactar</a>
          <a href="#guardar" aria-label="Guardar tutor" style="width: 46px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; color: {NAVY};">{ico('corazon', 18, NAVY, 2.1)}</a>
        </div>
        <p style="margin: 10px 0 0 0; font-size: 11.5px; line-height: 1.4; font-weight: 500; color: {MUTED};">El contacto es directo entre estudiantes. DevsProject no interviene en pagos ni reservas.</p>
      </div>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 22px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 24px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <div style="{CARD} padding: 20px 22px;">
        <h2 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.03em;">Sobre mí</h2>
        <p style="margin: 10px 0 0 0; font-size: 15px; line-height: 1.6; font-weight: 500; color: #4B5265;">Doy clases de las materias de matemática del primer año desde 2023. Trabajo con ejercicios de parciales viejos y armo un resumen por tema para que te lleves. Si venís a pocos días del examen, arrancamos por lo que más toman.</p>
      </div>
      <div style="{CARD} padding: 18px 22px 8px 22px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.03em;">Materias que enseña</h2>
          <span style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Del plan de Ingeniería Informática</span>
        </div>
        <div style="margin-top: 6px;">
{mat_html}        </div>
      </div>
      <div style="{CARD} padding: 20px 22px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h2 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.03em;">Disponibilidad</h2>
          <span style="display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: {MUTED};"><span style="width: 12px; height: 12px; border-radius: 4px; background: {VERDE_BG}; border: 1.5px solid {NAVY};"></span>Disponible</span>
        </div>
        <div style="margin-top: 14px; display: grid; grid-template-columns: 76px repeat(6, minmax(0, 1fr)); gap: 7px;">
          <span></span>{celdas}{filas}
        </div>
      </div>
    </div>
    <div style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: flex-end; justify-content: space-between;">
        <div><h2 style="margin: 0; font-size: 21px; font-weight: 800; letter-spacing: -0.03em;">Opiniones</h2><div style="margin-top: 4px; font-size: 13px; font-weight: 600; color: {MUTED};">De estudiantes que tomaron clases con ella</div></div>
        <a href="#opiniones" style="display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 700; color: {BLUE};">Ver las 28 {ico('flecha', 14, BLUE, 2.4)}</a>
      </div>
{op_html}      <div style="position: relative; background: {VERDE_BG}; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 18px; overflow: hidden; min-height: 150px; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; max-width: 190px;">¿Tomaste clases con Camila?</h3>
        <p style="margin: 7px 0 0 0; font-size: 12.5px; line-height: 1.45; font-weight: 500; color: #2F5A3A; max-width: 190px;">Tu opinión ayuda a otros a elegir.</p>
        <div style="margin-top: 12px;">{boton('Dejar opinión', 'pluma', chico=True)}</div>
        <img src="hero-tutoria.png" alt="" style="position: absolute; right: -40px; bottom: -8px; width: 250px; height: auto;">
      </div>
    </div>
  </section>

'''
    return cuerpo

def pagina(titulo, alto, medio):
    pre = re.sub(r'<title>.*?</title>', f'<title>{titulo}</title>', PREFIJO, count=1)
    pre = re.sub(r'width: 1440px; height: \d+px', f'width: 1440px; height: {alto}px', pre, count=1)
    cola = re.sub(r'"\$preview":\{"width":1440,"height":\d+\}', f'"$preview":{{"width":1440,"height":{alto}}}', COLA, count=1)
    return pre + HEADER + medio + PIE + cola

VISTAS = [
    ('Clasificados.dc.html', 'DevsProject · Clasificados', lambda: HERO + vista_todo(), 1235),
    ('ClasificadosTutorias.dc.html', 'DevsProject · Clasificados · Tutorías', lambda: HERO + vista_tutorias(), 1420),
    ('PerfilTutor.dc.html', 'DevsProject · Tutoría de Camila R.', vista_perfil, 1360),
]
if __name__ == '__main__':
  for archivo, titulo, fn, alto in VISTAS:
      alto = ALTOS.get(archivo, alto)
      with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as fh:
          fh.write(pagina(titulo, alto, fn()))
      print('escrito', archivo, alto)

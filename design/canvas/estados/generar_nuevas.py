# Genera las pantallas de escritorio que faltaban: acceso (ingresar, registro, onboarding y
# recuperacion), panel de moderacion (materiales y reportes) y estados vacios, errores y 404.
# Uso: python generar_nuevas.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, header, estado_pronto, LOGO, ICONOS, TIPO, CARD, PLAN,
                     NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_espacio as ge
import generar_acciones as ga

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA, CREMA = ga.LINEA, ga.CREMA
VERDE_BG, VERDE_TX, ROJO_BG, ROJO_TX = ga.VERDE_BG, ga.VERDE_TX, ga.ROJO_BG, ga.ROJO_TX
AMBAR_BG, AMBAR_TX = '#FDF0C8', '#8A5A00'

ICONOS.update({
    'wifi-off': '<path d="M2 8.5a15 15 0 0 1 20 0"></path><path d="M5.5 12a10 10 0 0 1 13 0"></path><path d="M9 15.5a5 5 0 0 1 6 0"></path><path d="M12 19h.01"></path><path d="M3 3l18 18"></path>',
    'sobre': '<rect x="3" y="5" width="18" height="14" rx="2.5"></rect><path d="m4 7 8 6 8-6"></path>',
})

GOOGLE = ('<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">'
          '<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>'
          '<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>'
          '<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"></path>'
          '<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path></svg>')

# ================================================================ piezas de acceso
def header_minimo(derecha):
    return f'''  <header style="height: 68px; flex-shrink: 0; padding: 0 64px; display: flex; align-items: center; justify-content: space-between;">
    <a href="#inicio" style="display: flex; align-items: center; gap: 11px;">{LOGO}<span style="font-size: 23px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">DevsProject</span><span style="color: {BTN}; font-size: 13px; line-height: 1;">✦</span></a>
    <div style="display: flex; align-items: center; gap: 14px; font-size: 14px; font-weight: 600; color: {TEXT2};">{derecha}</div>
  </header>
'''

def pasos(actual):
    items = ['Tu cuenta', 'Qué estudiás', 'Listo']
    html = ''
    for i, t in enumerate(items, 1):
        if i < actual:
            circ, dentro = f'background: {BTN}; border: 1.5px solid {NAVY};', ico('check', 14, '#FFFFFF', 3)
        elif i == actual:
            circ, dentro = f'background: {NAVY}; border: 1.5px solid {NAVY}; color: #FFFFFF;', str(i)
        else:
            circ, dentro = f'background: #FFFFFF; border: 1.5px solid #CFC5B0; color: {MUTED};', str(i)
        html += (f'<span style="display: inline-flex; align-items: center; gap: 9px;"><span style="width: 28px; height: 28px; box-sizing: border-box; border-radius: 999px; {circ} '
                 f'display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800;">{dentro}</span>'
                 f'<span style="font-size: 14px; font-weight: {800 if i == actual else 700}; color: {NAVY if i <= actual else MUTED};">{t}</span></span>')
        if i < len(items):
            html += f'<span style="width: 44px; height: 2px; border-radius: 2px; background: {BTN if i < actual else "#D9D0BE"};"></span>'
    return f'<div style="display: flex; align-items: center; gap: 12px;">{html}</div>'

def regla(ok, texto):
    if ok:
        return f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; font-weight: 700; color: {VERDE_TX};">{ico("check", 13, VERDE_TX, 3)}{texto}</span>'
    return (f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: {MUTED};">'
            f'<span style="width: 12px; height: 12px; box-sizing: border-box; border: 1.5px solid #B9AE96; border-radius: 999px; display: block;"></span>{texto}</span>')

def reglas(estado):
    textos = ['8 caracteres o más', 'una mayúscula', 'una minúscula', 'un número', 'un símbolo']
    return '<div style="margin-top: 9px; display: flex; flex-wrap: wrap; gap: 6px 14px;">' + ''.join(regla(ok, t) for ok, t in zip(estado, textos)) + '</div>'

def clave(puntos=10, foco=False):
    borde = f'border: 2px solid {BTN}; box-shadow: 0 0 0 3px rgba(2,97,254,0.16);' if foco else f'border: 1.5px solid {NAVY};'
    return (f'<div style="display: flex; align-items: center; gap: 8px; background: #FFFFFF; {borde} border-radius: 10px; padding: 10px 12px; font-size: 14px; font-weight: 800; letter-spacing: 0.14em;">{"•" * puntos}'
            f'<span style="margin-left: auto; display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 700; letter-spacing: 0; color: {BLUE};">{ico("ojo", 15, BLUE, 2.1)}Mostrar</span></div>')

def vacio(texto):
    return f'<div style="background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-weight: 600; color: #9BA2B4;">{texto}</div>'

def divisor(texto='o'):
    return (f'<div style="display: flex; align-items: center; gap: 12px; font-size: 12.5px; font-weight: 700; color: {MUTED};">'
            f'<span style="flex: 1; height: 1.5px; background: {LINEA};"></span>{texto}<span style="flex: 1; height: 1.5px; background: {LINEA};"></span></div>')

def boton_google(texto='Continuar con Google'):
    return (f'<a href="#google" style="display: flex; align-items: center; justify-content: center; gap: 10px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; '
            f'padding: 12px 16px; font-size: 14.5px; font-weight: 700; color: {NAVY};">{GOOGLE}{texto}</a>')

def punto(icono, texto, fondo='#FFFFFF', color=BTN):
    return f'<div style="display: flex; align-items: center; gap: 12px; font-size: 15px; font-weight: 600; color: {TEXT2};">{ga.tile(icono, fondo, color, 34, 10)}<span>{texto}</span></div>'

def tarjeta_form(contenido, ancho=''):
    return f'<div style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 30px 32px 28px 32px; {ancho}">{contenido}</div>'

# ================================================================ 1 · INGRESAR
def p_ingresar():
    form = tarjeta_form(f'''
        <h2 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.035em;">Iniciar sesión</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 500; color: {MUTED};">Con el email y la contraseña de tu cuenta.</p>
        <div style="margin-top: 22px; display: flex; flex-direction: column; gap: 16px;">
          {gx.campo('Email', ga.entrada('max@ejemplo.com'), None)}
          <div><div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;"><span style="font-size: 14px; font-weight: 800;">Contraseña</span><a href="#olvide" style="font-size: 12.5px; font-weight: 700; color: {BLUE};">¿La olvidaste?</a></div>{clave(11, True)}</div>
          <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; color: {TEXT2};">{ga.casilla(True)}Mantener la sesión iniciada en este dispositivo</div>
          {boton('Iniciar sesión', ancho=True)}
          {divisor()}
          {boton_google()}
        </div>
        <p style="margin: 20px 0 0 0; text-align: center; font-size: 14px; font-weight: 600; color: {TEXT2};">¿Primera vez? <a href="#registro" style="font-weight: 800; color: {BLUE};">Creá tu cuenta</a></p>''')
    return f'''
  <section style="flex-shrink: 0; padding: 40px 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 470px; gap: 56px; align-items: center;">
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) 330px; align-items: end; gap: 10px;">
      <div>
        {eyebrow('Comunidad FI · UNJu')}
        <h1 style="margin: 16px 0 0 0; font-size: 86px; line-height: 0.9; font-weight: 800; letter-spacing: -0.06em;">Hola de<br><span style="color: {BLUE};">nuevo</span><span style="color: {ORANGE};">.</span></h1>
        <p style="margin: 18px 0 0 0; font-size: 18px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 400px;">Tu mochila, tus materias y lo que guardaste te están esperando.</p>
        <div style="margin-top: 26px; display: flex; flex-direction: column; gap: 12px;">
          {punto('marcador', 'Guardá materiales en tu mochila.')}
          {punto('pluma', 'Contá cómo te fue en una cursada o en un final.')}
          {punto('subir', 'Subí lo que a vos te hubiera servido.')}
        </div>
      </div>
      <img src="hero-mochila.png" alt="El gato de DevsProject con su mochila de estudio" style="width: 330px; height: auto; margin-bottom: -20px;">
    </div>
    <div>
      {form}
      <div style="margin-top: 16px; display: flex; align-items: center; justify-content: center; gap: 9px; font-size: 13px; font-weight: 600; color: {MUTED};">{ico('candado', 15, MUTED, 2.1)}Mirar materiales es libre. La cuenta sirve para subir, guardar y opinar.</div>
    </div>
  </section>
'''

# ================================================================ 2 · REGISTRO
def p_registro():
    usuario = (f'<div style="display: flex; align-items: center; gap: 4px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 10px 12px; font-size: 14px; font-weight: 700;">'
               f'<span style="color: {MUTED};">@</span>max<span style="margin-left: auto; display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 800; color: {VERDE_TX};">{ico("check", 13, VERDE_TX, 3)}Disponible</span></div>')
    form = tarjeta_form(f'''
        <h2 style="margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.035em;">Creá tu cuenta</h2>
        <p style="margin: 6px 0 0 0; font-size: 14px; font-weight: 500; color: {MUTED};">Es gratis y te lleva un minuto.</p>
        <div style="margin-top: 22px; display: flex; flex-direction: column; gap: 16px;">
          {gx.campo('Usuario', usuario, None, ayuda='De 3 a 30 caracteres. Tu perfil queda en devsproject.com/u/max')}
          {gx.campo('Email', ga.entrada('max@ejemplo.com'), None, ayuda='Te mandamos un enlace para verificarlo.')}
          {gx.campo('Contraseña', clave(9, True) + reglas([True, True, True, True, False]), None)}
          {gx.campo('Repetí la contraseña', vacio('Repetila para confirmar'), None)}
          <div style="display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 600; color: {TEXT2};">{ga.casilla(True)}<span>Leí y acepto las <a href="#normas" style="font-weight: 800; color: {BLUE};">normas de la comunidad</a>.</span></div>
          {boton('Crear cuenta y seguir', 'flecha', ancho=True)}
          {divisor()}
          {boton_google('Registrarme con Google')}
        </div>
        <p style="margin: 20px 0 0 0; text-align: center; font-size: 14px; font-weight: 600; color: {TEXT2};">¿Ya tenés cuenta? <a href="#ingresar" style="font-weight: 800; color: {BLUE};">Iniciá sesión</a></p>''')
    return f'''
  <section style="flex-shrink: 0; padding: 36px 64px 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 520px; gap: 64px; align-items: start;">
    <div style="position: relative; padding-top: 50px; align-self: stretch; display: flex; flex-direction: column;">
      {eyebrow('Paso 1 de 3')}
      <h1 style="margin: 16px 0 0 0; font-size: 80px; line-height: 0.9; font-weight: 800; letter-spacing: -0.06em;">Sumate a la<br><span style="color: {BLUE};">comunidad</span><span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 18px 0 0 0; font-size: 18px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 470px;">Más de 1.200 estudiantes de la FI ya comparten parciales, apuntes y experiencias.</p>
      <div style="margin-top: 26px; display: flex; flex-direction: column; gap: 12px;">
        {punto('candado', 'Tu mochila es privada: solo la ves vos.', '#FFFFFF', NAVY)}
        {punto('pluma', 'Podés publicar reseñas como anónimo.', '#FFFFFF', NAVY)}
        {punto('escudo', 'No mostramos tu email a nadie.', '#FFFFFF', NAVY)}
      </div>
      <img src="gato-bocadillo.png" alt="El gato de DevsProject saluda: ¡vos también podés!" style="margin-top: auto; margin-bottom: -26px; padding-top: 30px; width: 320px; height: auto; display: block;">
    </div>
    <div style="padding-bottom: 64px;">
      <div style="margin-bottom: 18px;">{pasos(1)}</div>
      {form}
    </div>
  </section>
'''

# ================================================================ 3 · ONBOARDING: ¿QUE ESTUDIAS?
CARRERAS = [('Ingeniería Informática', 'Grado · 5 años', 'codigo', '#D6E5FB', BTN, 'Plan 2023'),
            ('Licenciatura en Sistemas', 'Grado · 5 años', 'monitor', '#E5E8EF', '#4C5B8A', None),
            ('Analista Programador Universitario', 'Pregrado · 3 años', 'terminal', '#F0F7C9', '#6E9400', None),
            ('Ingeniería Industrial', 'Grado · 5 años', 'engranaje', '#FDE7D0', '#E2560A', None),
            ('Ingeniería Química', 'Grado · 5 años', 'matraz', '#FED3DF', '#E01F63', None),
            ('Ingeniería de Minas', 'Grado · 5 años', 'montania', '#D8F1E8', '#1F8F6B', None)]
CURSANDO = ('09', '10', '11', '12')

def p_onboarding():
    tarjetas = ''
    for nombre, meta, ic, f, c, plan in CARRERAS:
        sel = plan is not None
        marco = f'background: #D6E5FB; border: 2px solid {NAVY};' if sel else 'background: #FFFFFF; border: 1.5px solid #CFC5B0;'
        marca = (f'<span style="width: 22px; height: 22px; box-sizing: border-box; border-radius: 999px; background: {BTN}; border: 1.5px solid {NAVY}; display: flex; align-items: center; justify-content: center;">{ico("check", 13, "#FFFFFF", 3)}</span>'
                 if sel else '<span style="width: 22px; height: 22px; box-sizing: border-box; border-radius: 999px; border: 1.5px solid #CFC5B0; display: block;"></span>')
        etiqueta = (f'<span style="align-self: flex-start; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 7px; padding: 3px 8px; font-size: 11px; font-weight: 800;">{plan} · 49 materias</span>'
                    if plan else '<span style="align-self: flex-start;">' + estado_pronto().replace('Próximamente', 'Plan en camino') + '</span>')
        tarjetas += (f'<div style="{marco} border-radius: 13px; padding: 13px 14px; display: flex; flex-direction: column; gap: 10px;">'
                     f'<div style="display: flex; align-items: center; justify-content: space-between;">{ga.tile(ic, f, c, 38)}{marca}</div>'
                     f'<div><div style="font-size: 15px; font-weight: 800; line-height: 1.2;">{nombre}</div><div style="margin-top: 3px; font-size: 12.5px; font-weight: 600; color: {MUTED};">{meta}</div></div>{etiqueta}</div>')
    anios = '<div style="display: flex; gap: 8px; max-width: 520px;">' + ''.join(gx.opcion(f'{a}° año', a == 2) for a in range(1, 6)) + '</div>'
    materias = ''
    for a, _, cod, nom, _ in PLAN:
        if a == 2:
            on = cod in CURSANDO
            fondo = 'background: #ECF2FE; border: 1.5px solid ' + NAVY + ';' if on else 'background: #FFFFFF; border: 1.5px solid #E4DCCB;'
            materias += (f'<div style="display: flex; align-items: center; gap: 10px; {fondo} border-radius: 10px; padding: 9px 12px;">{ga.casilla(on, 18)}'
                         f'<span style="font-size: 10.5px; font-weight: 800; color: {BLUE}; background: #FFFFFF; border: 1px solid #D6E5FB; border-radius: 6px; padding: 2px 0; width: 26px; text-align: center; flex-shrink: 0;">{cod}</span>'
                         f'<span style="font-size: 13.5px; font-weight: {800 if on else 600}; line-height: 1.25;">{nom}</span></div>')
    bloques = (gx.bloque(1, 'Tu facultad', f'''<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 18px;">
          {gx.campo('Universidad', gx.selector('Universidad Nacional de Jujuy'), None)}
          {gx.campo('Facultad', gx.selector('Facultad de Ingeniería'), None)}
        </div>''')
               + gx.bloque(2, 'Tu carrera', f'''<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px;">{tarjetas}</div>
        <div style="margin-top: 16px; max-width: 420px;">{gx.campo('Plan de estudios', gx.selector('Plan 2023 (vigente)'), None, ayuda='Si empezaste con un plan anterior, elegilo acá.')}</div>''')
               + gx.bloque(3, 'Tu año y tus materias', f'''{gx.campo('Año que cursás', anios, None)}
        <div style="margin-top: 16px;">{gx.campo('Materias que cursás ahora', '<div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px;">' + materias + '</div>', None)}</div>
        <div style="margin-top: 10px; display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: {MUTED};">¿Recursás una de otro año?{gx.chip_sugerido('Buscar otra materia')}</div>''', 'Opcional'))
    mis = ''.join(f'<div style="display: flex; align-items: center; gap: 10px; padding: 10px 0; border-top: 1.5px solid {LINEA};">'
                  f'<span style="font-size: 10.5px; font-weight: 800; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 2px 0; width: 26px; text-align: center; flex-shrink: 0;">{cod}</span>'
                  f'<div style="min-width: 0;"><div style="font-size: 13.5px; font-weight: 800; line-height: 1.25;">{nom}</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">{r} recursos · {e} experiencias</div></div></div>'
                  for cod, nom, r, e in [('09', 'Matemática Discreta', 39, 24), ('10', 'Teoría de la Información y la Comunicación', 22, 12),
                                         ('11', 'Desarrollo Sistemático de Programas', 35, 18), ('12', 'Probabilidades y Estadística', 58, 31)])
    return f'''
  <section style="flex-shrink: 0; padding: 30px 64px 0 64px;">
    {pasos(2)}
    <h1 style="margin: 26px 0 0 0; font-size: 64px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em;">¿Qué <span style="color: {BLUE};">estudiás</span><span style="color: {ORANGE};">?</span></h1>
    <p style="margin: 14px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Con esto te mostramos primero tus materias, en Materias y en Experiencias. Lo cambiás cuando quieras desde Configuración.</p>
  </section>
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 14px;">
{bloques}      <div style="display: flex; align-items: center; gap: 10px; padding-top: 4px;">
        <span style="margin-left: auto; display: flex; gap: 10px;">{boton('Atrás', primario=False)}{boton('Guardar y entrar', 'flecha')}</span>
      </div>
    </div>
    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">{ico('ojo', 15, MUTED, 2)}ASÍ VAS A VER DEVSPROJECT</div>
      <div style="{CARD} padding: 18px 20px 8px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><h3 style="margin: 0; font-size: 18px; font-weight: 800; letter-spacing: -0.02em;">Tus materias</h3><span style="font-size: 12px; font-weight: 700; color: {MUTED};">2° año</span></div>
        <div style="margin-top: 10px;">{mis}</div>
      </div>
      <div style="position: relative; {CARD} padding: 18px 20px; overflow: hidden; min-height: 150px; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 17px; font-weight: 800; letter-spacing: -0.02em; max-width: 200px;">Aparecen primero en todo el sitio.</h3>
        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2}; max-width: 190px;">En Materias, en Experiencias y en tu mochila.</p>
        <img src="gato-checklist.png" alt="" style="position: absolute; right: 4px; bottom: -8px; width: 118px; height: auto;">
      </div>
    </aside>
  </section>
'''

# ================================================================ 4 · VERIFICAR Y RECUPERAR
def p_cuenta_estados():
    def tarjeta(icono, fondo, color, titulo, contenido):
        return (f'<div style="{CARD} box-shadow: 6px 6px 0 {NAVY}; padding: 28px 28px 26px 28px; display: flex; flex-direction: column;">'
                f'{ga.tile(icono, fondo, color, 56, 16)}<h2 style="margin: 18px 0 0 0; font-size: 25px; font-weight: 800; letter-spacing: -0.035em;">{titulo}</h2>{contenido}</div>')
    verificar = tarjeta('sobre', '#D6E5FB', BTN, 'Revisá tu email', f'''
        <p style="margin: 8px 0 0 0; font-size: 14.5px; line-height: 1.55; font-weight: 500; color: {TEXT2};">Te mandamos un enlace a <b style="color: {NAVY};">m••••@ejemplo.com</b> para verificar tu cuenta. Vence en 24 horas.</p>
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 10px;">
          <span style="display: flex; align-items: center; justify-content: center; gap: 8px; background: #F1EEE4; border: 1.5px solid #DCD3C0; border-radius: 11px; padding: 12px 16px; font-size: 14.5px; font-weight: 700; color: {MUTED};">{ico('reloj', 15, MUTED, 2.2)}Reenviar en 0:42</span>
          <a href="#cambiar" style="text-align: center; font-size: 13.5px; font-weight: 700; color: {BLUE};">Me equivoqué de email</a>
        </div>
        <div style="margin-top: 20px;">{ga.aviso('info', '¿No llega? Mirá en spam o en promociones. Mientras tanto podés seguir mirando todo.')}</div>''')
    olvide = tarjeta('llave', '#FDE7D0', '#B14C06', '¿Olvidaste tu contraseña?', f'''
        <p style="margin: 8px 0 0 0; font-size: 14.5px; line-height: 1.55; font-weight: 500; color: {TEXT2};">Escribí el email de tu cuenta y te mandamos un enlace para elegir una nueva.</p>
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 14px;">
          {gx.campo('Email', ga.entrada('max@ejemplo.com'), None)}
          {boton('Enviar enlace', 'sobre', ancho=True)}
          <a href="#ingresar" style="text-align: center; font-size: 13.5px; font-weight: 700; color: {BLUE};">Volver a iniciar sesión</a>
        </div>''')
    nueva = tarjeta('candado', VERDE_BG, VERDE_TX, 'Elegí una contraseña nueva', f'''
        <p style="margin: 8px 0 0 0; font-size: 14.5px; line-height: 1.55; font-weight: 500; color: {TEXT2};">Para <b style="color: {NAVY};">@max</b>. Después entrás directo.</p>
        <div style="margin-top: 20px; display: flex; flex-direction: column; gap: 14px;">
          {gx.campo('Contraseña nueva', clave(12) + reglas([True] * 5), None)}
          {gx.campo('Repetila', clave(12), None)}
          {boton('Guardar y entrar', 'check', ancho=True)}
        </div>''')
    return f'''
  <section style="flex-shrink: 0; padding: 36px 64px 0 64px;">
    {eyebrow('Acceso')}
    <h1 style="margin: 14px 0 0 0; font-size: 56px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Verificar y <span style="color: {BLUE};">recuperar</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 12px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Las tres pantallas a las que llegás desde un email. Si el enlace venció, ver «Estados y errores».</p>
  </section>
  <section style="flex-shrink: 0; margin-top: 30px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px; align-items: start;">
    {verificar}{olvide}{nueva}
  </section>
'''

# ================================================================ 5 · MODERACION
def subnav_moderacion(activo):
    tabs = [('materiales', 'Materiales', 'doc', '12'), ('reportes', 'Reportes', 'bandera', '5'), ('usuarios', 'Usuarios', 'gente', None), ('historial', 'Historial', 'reloj', None)]
    html = ''
    for clave_, texto, icono, n in tabs:
        on = clave_ == activo
        cuenta = (f'<span style="min-width: 20px; box-sizing: border-box; text-align: center; border-radius: 999px; padding: 1px 6px; font-size: 11.5px; font-weight: 800; '
                  f'{"background: #FFFFFF; color: " + BTN if on else "background: " + PINK + "; color: #FFFFFF"};">{n}</span>') if n else ''
        if on:
            html += (f'<a href="#{clave_}" aria-current="page" style="display: inline-flex; align-items: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 8px 14px; '
                     f'font-size: 14px; font-weight: 800; color: #FFFFFF;">{ico(icono, 16, "#FFFFFF", 2.1)}{texto}{cuenta}</a>')
        else:
            html += (f'<a href="#{clave_}" style="display: inline-flex; align-items: center; gap: 8px; border-radius: 10px; padding: 8px 13px; font-size: 14px; font-weight: 700; color: {NAVY};">'
                     f'{ico(icono, 16, NAVY, 2)}{texto}{cuenta}</a>')
    return f'''  <div style="flex-shrink: 0; padding: 4px 64px 0 64px;">
    <nav aria-label="Moderación" style="display: flex; align-items: center; gap: 6px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 13px; padding: 6px 16px 6px 8px;">
      <span style="padding: 0 10px 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: {MUTED};">MODERACIÓN</span>
      {html}
      <span style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">{ico('escudo', 15, NAVY, 2.1)}Tu rol: moderación · FI UNJu</span>
    </nav>
  </div>
'''

def titulo_moderacion(sub, atajos):
    tiles = [('12', 'materiales esperando', 'el más viejo, hace 2 días'), ('5', 'publicaciones reportadas', '3 con más de un reporte'),
             ('38', 'aprobados esta semana', 'por 4 moderadores'), ('4', 'rechazados esta semana', 'todos con motivo')]
    t = ''.join(f'<div style="{CARD} padding: 14px 18px;"><div style="font-size: 30px; font-weight: 800; letter-spacing: -0.04em; line-height: 1;">{n}</div>'
                f'<div style="margin-top: 6px; font-size: 13px; font-weight: 800;">{a}</div><div style="margin-top: 2px; font-size: 12px; font-weight: 600; color: {MUTED};">{b}</div></div>' for n, a, b in tiles)
    return f'''
  <section style="flex-shrink: 0; padding: 28px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 30px;">
    <div>
      <h1 style="margin: 0; font-size: 60px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">Moderación<span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 12px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 620px;">{sub}</p>
    </div>
    <div style="display: flex; align-items: center; gap: 8px; font-size: 12.5px; font-weight: 600; color: {MUTED};">{atajos}</div>
  </section>
  <section style="flex-shrink: 0; margin-top: 20px; padding: 0 64px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">{t}</section>
'''

COLA = [('Parcial', 'Parcial 1 resuelto', 'Introducción a la Programación', 'lucia.p', 'hace 2 días'),
        ('Resumen', 'Resumen unidad 4', 'Álgebra Lineal', 'tomi.g', 'hace 1 día'),
        ('Final', 'Final de diciembre 2024', 'Análisis Matemático II', 'vale.s', 'hace 20 h'),
        ('Trabajo práctico', 'TP 3: listas enlazadas', 'Estructura de Datos', 'facu.m', 'hace 6 h'),
        ('Guía de ejercicios', 'Guía 2 de cinemática', 'Física Mecánica', 'sofi.c', 'hace 3 h'),
        ('Apunte', 'Apunte de clase: grafos', 'Matemática Discreta', 'juli.r', 'hace 1 h')]

def item_lista(tile_html, titulo, linea1, linea2, derecha, sel):
    marco = f'background: #ECF2FE; border: 2px solid {NAVY};' if sel else f'background: #FFFFFF; border: 1.5px solid #E4DCCB;'
    return (f'<div style="{marco} border-radius: 13px; padding: 12px 14px; display: flex; gap: 12px; align-items: center;">{tile_html}'
            f'<div style="min-width: 0;"><div style="font-size: 14.5px; font-weight: 800; line-height: 1.25;">{titulo}</div>'
            f'<div style="margin-top: 2px; font-size: 12.5px; font-weight: 600; color: {TEXT2};">{linea1}</div>'
            f'<div style="margin-top: 1px; font-size: 11.5px; font-weight: 600; color: {MUTED};">{linea2}</div></div>'
            f'<span style="margin-left: auto; flex-shrink: 0;">{derecha}</span></div>')

def filtros_cola(items):
    return '<div style="display: flex; gap: 8px; flex-wrap: wrap;">' + ''.join(gx.desplegable(t) for t in items) + '</div>'

def p_moderacion_materiales():
    cola = ''
    for i, (tipo, tit, mat, autor, cuando) in enumerate(COLA):
        _, _, ic, f, c = TIPO[tipo]
        derecha = ge.estado('Espera 2 días', AMBAR_BG, AMBAR_TX, 'reloj') if i == 0 else ico('chev-der', 16, MUTED, 2.2)
        cola += item_lista(ga.tile(ic, f, c, 40), tit, mat, f'@{autor} · {cuando}', derecha, i == 0)
    _, _, p_ic, p_f, p_c = TIPO['Parcial']
    vista = (f'<div style="position: relative; height: 386px; border-radius: 12px; border: 1.5px solid #E4DCCB; background: #EFE8DA; overflow: hidden;">'
             f'<div style="position: absolute; left: 16px; top: 16px; width: 620px; transform: scale(0.45); transform-origin: top left;">{ga.hoja()}</div>'
             f'<a href="#completa" style="position: absolute; left: 50%; bottom: 14px; transform: translateX(-50%); display: inline-flex; align-items: center; gap: 7px; background: {NAVY}; color: #FFFFFF; '
             f'border-radius: 999px; padding: 8px 14px; font-size: 12.5px; font-weight: 700; white-space: nowrap;">{ico("expandir", 14, "#FFFFFF", 2.2)}Ver las 4 páginas</a></div>')
    checklist = ''.join(f'<div style="display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 600; color: {TEXT2};">{ga.casilla(on, 18)}{t}</div>'
                        for on, t in [(True, 'Es de esta materia.'), (True, 'Se lee bien.'), (True, 'No hay datos personales a la vista.'), (False, 'No está publicado ya.')])
    motivos = ''.join(ga.pastilla(t, 'doc', '#FFFFFF', MUTED, False).replace(f'{ico("doc", 13, MUTED, 2.2)}', '')
                      for t in ['Ya está publicado', 'No es de esta materia', 'Datos personales a la vista', 'No se lee bien', 'Otro motivo'])
    panel = f'''    <div style="{CARD} overflow: hidden;">
      <div style="display: flex; align-items: center; gap: 14px; padding: 18px 22px; border-bottom: 1.5px solid {LINEA};">
        {ga.tile(p_ic, p_f, p_c, 46, 13)}
        <div style="min-width: 0;"><div style="display: flex; align-items: center; gap: 10px;"><h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">Parcial 1 resuelto</h2>{ge.pastilla_tipo('Parcial', chica=True)}</div>
          <div style="margin-top: 3px; font-size: 13px; font-weight: 600; color: {MUTED};"><b style="color: {NAVY};">Introducción a la Programación</b> · Ciclo 2025 · Prof. Gómez · Turno tarde</div></div>
        <span style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {MUTED};">1 de 12</span>
      </div>
      <div style="padding: 18px 22px; display: grid; grid-template-columns: 310px minmax(0, 1fr); gap: 22px;">
        {vista}
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">{gx.iniciales('LP', '#F0F7C9', '#5A7A00', 44)}
            <div><div style="font-size: 14.5px; font-weight: 800;">Lucía P. <span style="font-weight: 600; color: {MUTED};">@lucia.p</span></div>
              <div style="font-size: 12.5px; font-weight: 600; color: {TEXT2};">Nivel 3 · 23 aportes aprobados · 1 rechazado</div></div></div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">{chip('parcial-1-2025-resuelto.pdf')}{chip('PDF · 1,8 MB · 4 páginas')}{chip('Subido hace 2 días')}</div>
          <div style="background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 12px; padding: 12px 14px;">
            <div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">PARECIDOS YA PUBLICADOS EN ESTA MATERIA</div>
            <div style="margin-top: 8px; display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 700;">{ico('doc', 15, p_c, 2)}Parcial 1 con corrección<span style="font-size: 12px; font-weight: 600; color: {MUTED};">Ciclo 2024 · Prof. Ruiz</span><a href="#ver" style="margin-left: auto; font-size: 12.5px; color: {BLUE};">Comparar</a></div>
          </div>
          <div><div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">ANTES DE APROBAR</div><div style="margin-top: 9px; display: flex; flex-direction: column; gap: 8px;">{checklist}</div></div>
          <p style="margin: 0; font-size: 12.5px; line-height: 1.45; font-weight: 600; color: {MUTED};">Aprobar no certifica que esté bien resuelto: solo que se puede publicar.</p>
        </div>
      </div>
      <div style="padding: 16px 22px 18px 22px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;"><span style="font-size: 14px; font-weight: 800;">Motivo para el autor</span><span style="font-size: 11px; font-weight: 800; color: #B31450;">OBLIGATORIO SI RECHAZÁS</span></div>
        <div style="display: flex; flex-wrap: wrap; gap: 7px;">{motivos}</div>
        <div style="margin-top: 10px;">{ga.area('Lo lee el autor en «Mis envíos» junto con la fecha de la decisión.', '0 / 1000', 60, apagado=True)}</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px;">
          <a href="#saltar" style="font-size: 13.5px; font-weight: 700; color: {TEXT2};">Saltar por ahora</a>
          <span style="margin-left: auto; display: flex; gap: 10px;">
            <a href="#rechazar" style="display: inline-flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1.5px solid {ROJO_TX}; border-radius: 11px; padding: 13px 20px; font-size: 15px; font-weight: 700; color: {ROJO_TX};">{ico('equis', 15, ROJO_TX, 2.6)}Rechazar</a>
            {boton('Aprobar y publicar', 'check')}
          </span>
        </div>
      </div>
    </div>
'''
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 430px minmax(0, 1fr); gap: 24px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;"><h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em;">En revisión · 12</h2><span style="font-size: 12.5px; font-weight: 700; color: {MUTED};">Más viejos primero</span></div>
      {filtros_cola(['Materia: todas', 'Tipo: todos'])}
      {cola}
      <a href="#mas" style="align-self: center; padding-top: 4px; font-size: 13.5px; font-weight: 700; color: {BLUE};">Ver los 6 restantes</a>
    </div>
{panel}  </section>
'''
    return (gx.header_logueado('') + subnav_moderacion('materiales')
            + titulo_moderacion('Lo que sube la comunidad arranca pendiente y pasa por acá. Cada decisión queda registrada con su motivo.',
                                f"{ga.tecla('A')} aprobar {ga.tecla('R')} rechazar {ga.tecla('J')}{ga.tecla('K')} siguiente y anterior") + cuerpo)

REPORTADAS = [('Reseña de cursada', 'Análisis Matemático II', 3, 'Insultos o acoso', True, True),
              ('Experiencia de final', 'Física Mecánica', 2, 'Expone datos personales', True, False),
              ('Reseña de cursada', 'Bases de Datos', 1, 'Spam o contenido repetido', True, False),
              ('Reseña de cursada', 'Álgebra Lineal', 4, 'Información posiblemente engañosa', False, False)]

def p_moderacion_reportes():
    lista = ''
    for tipo, mat, n, motivo, visible, sel in REPORTADAS:
        ic = 'calendario' if tipo.startswith('Reseña') else 'birrete'
        estado_html = (ge.estado('Sigue visible', VERDE_BG, VERDE_TX, 'ojo') if visible else ge.estado('Retirada', '#F1EEE4', TEXT2, 'equis'))
        lista += item_lista(ga.tile(ic, '#ECF2FE', BTN, 40), f'{tipo} · {mat}', f'{n} reporte{"s" if n > 1 else ""} · {motivo}', 'Último reporte hace 3 h' if sel else 'hace 1 día', estado_html, sel)
    reportes = ''.join(f'<div style="display: flex; gap: 12px; padding: 11px 0; border-top: 1.5px solid {LINEA};">{ico("bandera", 16, ROJO_TX, 2)}'
                       f'<div><div style="font-size: 13.5px; font-weight: 800;">{m}</div>{("<div style=\"margin-top: 2px; font-size: 13px; line-height: 1.45; font-weight: 500; color: " + TEXT2 + ";\">«" + e + "»</div>") if e else ""}'
                       f'<div style="margin-top: 2px; font-size: 11.5px; font-weight: 600; color: {MUTED};">Estudiante · {c}</div></div></div>'
                       for m, e, c in [('Insultos o acoso', 'Ataca al profesor en vez de contar cómo fue la cursada.', 'hace 3 h'),
                                       ('Insultos o acoso', '', 'hace 5 h'),
                                       ('Información posiblemente engañosa', 'Lo de que aprueba a los que le caen bien no se puede saber.', 'hace 1 día')])
    publicacion = f'''<div style="background: {CREMA}; border: 1.5px solid #E4DCCB; border-radius: 13px; padding: 16px 18px;">
          <div style="display: flex; align-items: center; gap: 11px;">{gx.avatar('av-birrete.png', 38)}
            <div><div style="font-size: 14px; font-weight: 800;">Anónimo</div><div style="font-size: 11.5px; font-weight: 600; color: {MUTED};">Reseña de cursada · hace 2 días</div></div>
</div>
          <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px;">{ge.estado('Publicada como Anónimo', '#E5E8EF', NAVY, 'candado')}{''.join(chip(x) for x in ['Ciclo 2025', 'Tarde', 'Prof. A. Gómez', 'Regular', 'Dificultad muy alta'])}</div>
          <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.55; font-weight: 500; color: {NAVY};">“No la cursen con Gómez: no sabe explicar y aprueba a los que le caen bien. Una vergüenza de cátedra.”</p>
        </div>'''
    interno = f'''<div style="display: flex; align-items: center; gap: 12px; border: 1.5px dashed #B9AE96; border-radius: 12px; padding: 12px 14px;">
          {gx.iniciales('JP', '#E5E8EF', '#4C5B8A', 38)}
          <div><div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">AUTOR INTERNO · SOLO MODERACIÓN</div>
            <div style="margin-top: 2px; font-size: 14px; font-weight: 800;">@juan.p <span style="font-weight: 600; color: {TEXT2};">· nivel 2 · 1 publicación retirada antes</span></div></div>
          <a href="#historial" style="margin-left: auto; flex-shrink: 0; white-space: nowrap; font-size: 12.5px; font-weight: 700; color: {BLUE};">Ver historial</a>
        </div>'''
    motivo = 'Ataca a una persona en lugar de contar la cursada. Podés volver a escribirla sin agravios.'
    panel = f'''    <div style="{CARD} overflow: hidden;">
      <div style="display: flex; align-items: center; gap: 12px; padding: 18px 22px; border-bottom: 1.5px solid {LINEA};">
        {ga.tile('calendario', '#ECF2FE', BTN, 46, 13)}
        <div><h2 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">Reseña de cursada · Análisis Matemático II</h2>
          <div style="margin-top: 3px; font-size: 13px; font-weight: 600; color: {MUTED};">3 reportes de 3 estudiantes distintos</div></div>
        <span style="margin-left: auto;">{ge.estado('Sigue visible', VERDE_BG, VERDE_TX, 'ojo')}</span>
      </div>
      <div style="padding: 18px 22px; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 22px;">
        <div style="display: flex; flex-direction: column; gap: 14px;">{publicacion}{interno}</div>
        <div><div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">LO QUE REPORTARON</div><div style="margin-top: 8px;">{reportes}</div></div>
      </div>
      <div style="padding: 16px 22px 18px 22px; border-top: 1.5px solid {LINEA}; background: {CREMA};">
        {gx.campo('Razón de la decisión', ga.area(motivo, f'{len(motivo)} / 1000', 60), 'obligatorio')}
        <div style="margin-top: 10px;">{ga.aviso('info', 'Si la retirás, deja de ser pública y no cuenta en los resúmenes. El autor ve esta razón y la fecha. Se puede restaurar.')}</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 10px;">
          {boton('Mantener visible', 'ojo', primario=False)}
          <a href="#retirar" style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; background: {ROJO_TX}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 13px 20px; font-size: 15px; font-weight: 700; color: #FFFFFF;">{ico('equis', 15, '#FFFFFF', 2.6)}Retirar de la vista pública</a>
        </div>
      </div>
      <div style="padding: 14px 22px 16px 22px; border-top: 1.5px solid {LINEA}; display: flex; align-items: center; gap: 12px;">
        <div><div style="font-size: 14px; font-weight: 800;">Cuenta de @juan.p</div><div style="font-size: 12.5px; font-weight: 600; color: {MUTED};">Solo si reincide. Queda en el historial con su motivo.</div></div>
        <span style="margin-left: auto; display: flex; gap: 8px;">{boton('Silenciar 7 días', 'reloj', primario=False, chico=True)}{boton('Suspender cuenta', 'candado', primario=False, chico=True)}</span>
      </div>
    </div>
'''
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 430px minmax(0, 1fr); gap: 24px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px;"><h2 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em;">Reportadas · 5</h2><span style="font-size: 12.5px; font-weight: 700; color: {MUTED};">Más reportes primero</span></div>
      {filtros_cola(['Tipo: todas', 'Motivo: todos', 'Estado: todas'])}
      {lista}
    </div>
{panel}  </section>
'''
    return (gx.header_logueado('') + subnav_moderacion('reportes')
            + titulo_moderacion('Reseñas y experiencias que la comunidad reportó. Moderación decide si siguen visibles; nunca se borran sin dejar rastro.',
                                f"{ga.tecla('J')}{ga.tecla('K')} siguiente y anterior") + cuerpo)

# ================================================================ 6 · ESTADOS VACIOS
def tarjeta_vacia(contexto, img, alto_img, titulo, texto, ctas, extra=''):
    return f'''    <div style="{CARD} padding: 20px 24px 24px 24px; display: flex; flex-direction: column; align-items: center; text-align: center;">
      <div style="align-self: stretch; text-align: left; font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: {MUTED};">{contexto}</div>
      <img src="{img}" alt="" style="margin-top: 8px; height: {alto_img}px; width: auto;">
      <h3 style="margin: 14px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.2; max-width: 330px;">{titulo}</h3>
      <p style="margin: 8px 0 0 0; font-size: 14px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 330px;">{texto}</p>
      {extra}
      <div style="margin-top: auto; padding-top: 18px; display: flex; gap: 10px; justify-content: center;">{ctas}</div>
    </div>
'''

def encabezado_catalogo(eyeb, h_navy, h_azul, sub):
    return f'''
  <section style="flex-shrink: 0; padding: 36px 64px 0 64px;">
    {eyebrow(eyeb)}
    <h1 style="margin: 14px 0 0 0; font-size: 60px; line-height: 0.95; font-weight: 800; letter-spacing: -0.055em;">{h_navy} <span style="color: {BLUE};">{h_azul}</span><span style="color: {ORANGE};">.</span></h1>
    <p style="margin: 12px 0 0 0; font-size: 16.5px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 760px;">{sub}</p>
  </section>
'''

def p_estados_vacios():
    sugerencias = ('<div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 7px; justify-content: center;">'
                   + ''.join(gx.chip_sugerido(t).replace('+ ', '') for t in ['Física Mecánica · parciales', 'parcial física']) + '</div>')
    tarjetas = (tarjeta_vacia('MI MOCHILA', 'gato-mochila-vacia.png', 150, 'Tu mochila está vacía',
                              'Tocá el marcador en cualquier material y lo encontrás acá, ordenado por materia.', boton('Explorar materias', 'flecha'))
                + tarjeta_vacia('BÚSQUEDA', 'gato-idea.png', 150, 'No encontramos «parcial 3 física 2021»',
                                'Probá con menos palabras o buscá dentro de la materia.', boton('¿Lo tenés? Subilo', 'subir', primario=False), sugerencias)
                + tarjeta_vacia('EXPERIENCIAS DE UNA MATERIA', 'gato-escribe.png', 150, 'Nadie contó todavía cómo le fue en Cálculo Numérico',
                                'La primera reseña es la que más ayuda a la próxima camada.', boton('Escribir la primera', 'pluma'))
                + tarjeta_vacia('RECURSOS DE UNA MATERIA', 'gato-cargando.png', 150, 'Todavía no hay finales de Bases de Datos',
                                'Si ya rendiste, subí el enunciado: le sirve a quien va a la próxima mesa.', boton('Subir un final', 'subir'))
                + tarjeta_vacia('CLASIFICADOS · CON FILTROS', 'gato-etiqueta.png', 150, 'No hay tutorías de Álgebra Lineal a la noche',
                                'Probá con otro horario o publicá que buscás tutor: te contactan a vos.', boton('Quitar filtros', primario=False) + boton('Busco tutor', 'lupa'))
                + tarjeta_vacia('MIS ENVÍOS', 'gato-checklist.png', 150, 'Todavía no subiste nada',
                                'Lo que subas aparece acá con su estado: publicado, en revisión previa u oculto mientras se revisa.', boton('Subir material', 'subir')))
    return (header('') + encabezado_catalogo('Estados vacíos', 'Cuando no hay', 'nada', 'Cada vacío dice por qué está vacío y ofrece el paso siguiente. Nunca una pantalla en blanco.')
            + f'''
  <section style="flex-shrink: 0; margin-top: 28px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px;">
{tarjetas}  </section>
''')

# ================================================================ 7 · ERRORES Y AVISOS
def tarjeta_error(contexto, cuerpo):
    return (f'    <div style="{CARD} padding: 18px 22px 22px 22px; display: flex; flex-direction: column; gap: 12px;">'
            f'<div style="font-size: 11px; font-weight: 800; letter-spacing: 0.16em; color: {MUTED};">{contexto}</div>{cuerpo}</div>\n')

def mensaje(icono, fondo, color, titulo, texto, acciones=''):
    acc = f'<div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px;">{acciones}</div>' if acciones else ''
    return (f'<div style="display: flex; gap: 14px;">{ga.tile(icono, fondo, color, 44, 12)}<div style="min-width: 0;">'
            f'<h3 style="margin: 0; font-size: 17.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.25;">{titulo}</h3>'
            f'<p style="margin: 5px 0 0 0; font-size: 13.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">{texto}</p>{acc}</div></div>')

def p_errores():
    _, _, p_ic, p_f, p_c = TIPO['Parcial']
    previa = (f'<div style="background: #EFE8DA; border-radius: 12px; padding: 22px 18px; display: flex; flex-direction: column; align-items: center; text-align: center;">'
              f'{ga.tile("doc", "#FFFFFF", MUTED, 46, 12)}<div style="margin-top: 10px; font-size: 16px; font-weight: 800;">No pudimos mostrar la vista previa</div>'
              f'<div style="margin-top: 4px; font-size: 13px; line-height: 1.45; font-weight: 500; color: {TEXT2}; max-width: 280px;">Podés reintentar o descargar el archivo para abrirlo en tu dispositivo.</div>'
              f'<div style="margin-top: 12px; display: flex; gap: 8px;">{boton("Reintentar", primario=False, chico=True)}{boton("Descargar", "descargar", chico=True)}</div></div>')
    rechazado = (f'<div style="display: flex; align-items: center; gap: 12px;">{ga.tile(p_ic, p_f, p_c, 40)}<div><div style="font-size: 14.5px; font-weight: 800;">Parcial 2 con resolución</div>'
                 f'<div style="font-size: 12px; font-weight: 600; color: {MUTED};">Análisis Matemático I · publicado hace 3 días</div></div><span style="margin-left: auto;">{ge.estado("Retirado", ROJO_BG, ROJO_TX, "equis")}</span></div>'
                 f'<div style="background: #FFF6F5; border: 1.5px solid #F2B8B5; border-radius: 12px; padding: 12px 14px;"><div style="font-size: 11px; font-weight: 800; letter-spacing: 0.14em; color: {ROJO_TX};">MOTIVO DE MODERACIÓN</div>'
                 f'<div style="margin-top: 5px; font-size: 13.5px; line-height: 1.5; font-weight: 600; color: {NAVY};">Se ven nombre y DNI en la primera página. Tapalos y volvé a subirlo, o apelá si creés que es un error.</div></div>'
                 f'<div>{boton("Subir versión corregida", "subir", chico=True)}</div>')
    silenciada = (f'<div style="background: {AMBAR_BG}; border: 1.5px solid #E9C46A; border-radius: 12px; padding: 14px 16px; display: flex; gap: 12px;">{ico("alerta", 20, AMBAR_TX, 2.2)}'
                  f'<div><div style="font-size: 15px; font-weight: 800; color: {NAVY};">No podés publicar hasta el 30 de septiembre</div>'
                  f'<div style="margin-top: 4px; font-size: 13px; line-height: 1.5; font-weight: 500; color: #5C4600;">Moderación silenció tu cuenta 7 días por insultos en una reseña. Podés seguir mirando y guardando.</div>'
                  f'<a href="#normas" style="margin-top: 8px; display: inline-block; font-size: 13px; font-weight: 700; color: {BLUE};">Leer las normas</a></div></div>'
                  f'<div style="opacity: 0.5;">{gx.campo("Tu experiencia", ga.area("Escribí cómo te fue…", "0 / 2000", 64, apagado=True), None)}</div>')
    pesado = (f'<div style="display: flex; align-items: center; gap: 12px; border: 1.5px solid #F2B8B5; border-radius: 14px; background: #FFF6F5; padding: 11px 14px;">{ga.tile("doc", ROJO_BG, ROJO_TX)}'
              f'<div><div style="font-size: 14px; font-weight: 800;">apuntes-escaneados.pdf</div><div style="margin-top: 2px; font-size: 12.5px; font-weight: 600; color: {ROJO_TX};">Pesa 31 MB y el máximo es 25 MB.</div></div>'
              f'<a href="#quitar" style="margin-left: auto; font-size: 12.5px; font-weight: 700; color: {TEXT2};">Quitar</a></div>'
              f'<p style="margin: 0; font-size: 13px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Probá comprimirlo o dividirlo por unidad: cada parte queda como un material.</p>')
    servidor = (f'<div style="display: flex; align-items: center; gap: 16px;"><img src="gato-desenchufado.png" alt="" style="width: 118px; height: auto; flex-shrink: 0;">'
                f'<div><h3 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.02em;">Algo se desenchufó</h3>'
                f'<p style="margin: 5px 0 0 0; font-size: 13.5px; line-height: 1.5; font-weight: 500; color: {TEXT2};">No pudimos cargar esta página. Probá de nuevo en un rato.</p>'
                f'<div style="margin-top: 12px;">{boton("Reintentar", chico=True)}</div></div></div>')
    offline = (f'<div style="display: flex; align-items: center; gap: 12px; background: {NAVY}; color: #FFFFFF; border-radius: 13px; padding: 13px 14px 13px 16px; box-shadow: 4px 4px 0 rgba(2,18,56,0.25);">'
               f'{ico("wifi-off", 20, "#FFFFFF", 2.1)}<div style="font-size: 13.5px; line-height: 1.4; font-weight: 600;"><b>Sin conexión.</b> Tu texto sigue acá: publicalo cuando vuelva internet.</div>'
               f'<a href="#reintentar" style="margin-left: auto; flex-shrink: 0; font-size: 13px; font-weight: 800; color: #9CC2FF;">Reintentar</a></div>'
               f'<p style="margin: 0; font-size: 13px; line-height: 1.5; font-weight: 500; color: {TEXT2};">Aviso abajo de la pantalla: no tapa el formulario ni borra lo escrito.</p>')
    tarjetas = (tarjeta_error('VISTA PREVIA · NO DISPONIBLE', previa)
                + tarjeta_error('MIS APORTES · RETIRADO', rechazado)
                + tarjeta_error('SESIÓN VENCIDA', mensaje('reloj', '#D6E5FB', BTN, 'Tu sesión venció',
                                'Iniciá sesión de nuevo para publicar. Lo que escribiste queda guardado en este dispositivo.', boton('Iniciar sesión', chico=True)))
                + tarjeta_error('CUENTA SILENCIADA', silenciada)
                + tarjeta_error('SIN PERMISO', mensaje('escudo', '#F1EEE4', NAVY, 'Esta sección es para moderación',
                                'Tu cuenta no tiene ese rol. Si creés que es un error, escribinos.', boton('Volver al inicio', primario=False, chico=True)))
                + tarjeta_error('ENLACE VENCIDO', mensaje('enlace', '#FDE7D0', '#B14C06', 'Este enlace ya no sirve',
                                'Los enlaces para verificar o recuperar la cuenta vencen a las 24 horas o cuando ya se usaron.', boton('Pedir uno nuevo', 'sobre', chico=True)))
                + tarjeta_error('SUBIR MATERIAL · ARCHIVO MUY PESADO', pesado)
                + tarjeta_error('ERROR DEL SERVIDOR', servidor)
                + tarjeta_error('SIN CONEXIÓN', offline))
    return (header('') + encabezado_catalogo('Errores y avisos', 'Cuando algo', 'falla', 'Qué pasó, qué no se perdió y qué podés hacer. Sin códigos ni culpas.')
            + f'''
  <section style="flex-shrink: 0; margin-top: 28px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; align-items: stretch;">
{tarjetas}  </section>
''')

# ================================================================ 8 · 404
def p_404():
    atajos = ''.join(f'<a href="#{t.lower()}" style="display: inline-flex; align-items: center; gap: 7px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 10px; padding: 9px 14px; font-size: 14px; font-weight: 700; color: {NAVY};">{ico(ic, 15, BTN, 2.1)}{t}</a>'
                     for t, ic in [('Materias', 'libro'), ('Experiencias', 'pluma'), ('Clasificados', 'etiqueta'), ('Inicio', 'flecha')])
    return header('') + f'''
  <section style="flex-shrink: 0; padding: 56px 64px 80px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 420px; gap: 40px; align-items: center;">
    <div>
      <div style="display: flex; align-items: center; gap: 14px;"><span style="font-size: 13px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 5px 10px;">404</span>{eyebrow('Página no encontrada')}</div>
      <h1 style="margin: 18px 0 0 0; font-size: 76px; line-height: 0.92; font-weight: 800; letter-spacing: -0.058em;">Esta página se fue<br>a rendir y <span style="color: {BLUE};">no volvió</span><span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 18px 0 0 0; font-size: 18px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 560px;">Puede que el enlace esté mal escrito o que el material ya no esté publicado.</p>
      <div style="margin-top: 28px; max-width: 640px; display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 15px; padding: 8px 8px 8px 18px;">
        {ico('lupa', 20, NAVY, 2.2)}<span style="flex: 1; font-size: 16px; font-weight: 600; color: #9BA2B4;">Buscá una materia, un parcial o un tema</span>{boton('Buscar')}
      </div>
      <div style="margin-top: 22px; display: flex; flex-wrap: wrap; align-items: center; gap: 10px;"><span style="font-size: 14px; font-weight: 700; color: {MUTED};">O andá a:</span>{atajos}</div>
    </div>
    <img src="gato-mapa.png" alt="El gato de DevsProject, perdido, mirando un mapa" style="width: 400px; height: auto;">
  </section>
'''

# ================================================================ salida
PAGINAS = [   # (archivo, titulo, cabecera, fn, alto, pie, serif)
    ('Ingresar.dc.html', 'DevsProject · Iniciar sesión',
     lambda: header_minimo(f'¿No tenés cuenta?{boton("Crear cuenta", primario=False, chico=True)}'), p_ingresar, 900, True, False),
    ('Registro.dc.html', 'DevsProject · Crear cuenta',
     lambda: header_minimo(f'¿Ya tenés cuenta?{boton("Iniciar sesión", primario=False, chico=True)}'), p_registro, 1100, True, False),
    ('Onboarding.dc.html', 'DevsProject · ¿Qué estudiás?',
     lambda: header_minimo(f'Paso 2 de 3<a href="#saltear" style="font-weight: 700; color: {BLUE};">Completar después</a>'), p_onboarding, 1500, True, False),
    ('CuentaEstados.dc.html', 'DevsProject · Verificar y recuperar',
     lambda: header_minimo(f'<a href="#ingresar" style="font-weight: 700; color: {BLUE};">Volver a iniciar sesión</a>'), p_cuenta_estados, 900, True, False),
    ('ModeracionMateriales.dc.html', 'DevsProject · Moderación de materiales', lambda: '', p_moderacion_materiales, 1300, True, True),
    ('ModeracionReportes.dc.html', 'DevsProject · Moderación de reportes', lambda: '', p_moderacion_reportes, 1300, True, False),
    ('EstadosVacios.dc.html', 'DevsProject · Estados vacíos', lambda: '', p_estados_vacios, 1300, True, False),
    ('Errores.dc.html', 'DevsProject · Errores y avisos', lambda: '', p_errores, 1400, True, False),
    ('Pagina404.dc.html', 'DevsProject · Página no encontrada', lambda: '', p_404, 900, True, False),
]
if __name__ == '__main__':
    for archivo, titulo, fc, fn, alto, pie, serif in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        html = gx.documento(titulo, alto, fc(), fn(), con_pie=pie)
        if serif:
            html = html.replace('family=Caveat', ga.SERIF, 1)
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(html)
        print('escrito', archivo, alto)

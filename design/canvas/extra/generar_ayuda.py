# Paginas informativas: Como funcionan los puntos, Preguntas frecuentes y Terminos y privacidad.
# Siguen docs/README_PUNTOS_E_INSIGNIAS.md y docs/README_MODERACION.md.
# Uso: python generar_ayuda.py <dir_proyecto> ['{"Archivo.dc.html": alto}']
import json, os, sys

SP = os.environ['SP']
for carpeta in ('materias', 'experiencias', 'espacio', 'tutorias', 'acciones', 'extra'):
    sys.path.insert(0, os.path.join(SP, carpeta))
from generar import (ico, chip, boton, eyebrow, breadcrumb, ICONOS, ESTRELLA, CARD, NAVY, BLUE, BTN, ORANGE, PINK, MUTED, TEXT2)
import generar_experiencias as gx
import generar_acciones as ga
import generar_extra as gxt

OUT = sys.argv[1]
ALTOS = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
LINEA, CREMA = ga.LINEA, ga.CREMA
VERDE_BG, VERDE_TX, ROJO_BG, ROJO_TX = ga.VERDE_BG, ga.VERDE_TX, ga.ROJO_BG, ga.ROJO_TX
META = 'font-size: 11.5px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase;'
ICONOS.setdefault('estrella', ESTRELLA)

def hero(eyeb, navy, azul, sub, img=None, ancho=210):
    im = f'<img src="{img}" alt="" style="width: {ancho}px; height: auto; margin-bottom: -8px;">' if img else ''
    return f'''
  <section style="flex-shrink: 0; padding: 28px 64px 0 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 30px;">
    <div>{eyebrow(eyeb)}
      <h1 style="margin: 14px 0 0 0; font-size: 66px; line-height: 0.93; font-weight: 800; letter-spacing: -0.057em;">{navy} <span style="color: {BLUE};">{azul}</span><span style="color: {ORANGE};">.</span></h1>
      <p style="margin: 14px 0 0 0; font-size: 17px; line-height: 1.55; font-weight: 500; color: {TEXT2}; max-width: 64ch;">{sub}</p></div>
    {im}
  </section>
'''

def h2(texto, icono):
    return f'<div style="display: flex; align-items: center; gap: 12px;">{ga.tile(icono, "#ECF2FE", BTN, 40, 12)}<h2 style="margin: 0; font-size: 27px; font-weight: 800; letter-spacing: -0.04em;">{texto}</h2></div>'

def indice(items, activo):
    return ('<nav aria-label="En esta página" style="' + CARD + ' padding: 8px; display: flex; flex-direction: column; gap: 2px;">'
            + ''.join(f'<a href="#{k}" style="display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 10px; {"background: #ECF2FE;" if k == activo else ""} font-size: 14px; font-weight: {800 if k == activo else 700}; color: {NAVY};">{ico(i, 17, BTN if k == activo else NAVY, 2)}{t}</a>'
                      for k, i, t in items) + '</nav>')

# ================================================================ 1 · COMO FUNCIONAN LOS PUNTOS
def p_puntos():
    suma = [('+10', 'Publicás un material', 'Se suma al publicarlo y se descuenta si moderación lo retira.'),
            ('+1', 'Alguien marca «Me sirvió» en tu material', 'Hasta 25 por material y 20 por día.'),
            ('+5', 'Bono «Primera huella»', 'Primer material de un tipo en una materia, cuando llega a 3 «Me sirvió».'),
            ('+5', 'Publicás una reseña o una experiencia de final con tu nombre', 'Una por materia y ciclo (o por mesa).'),
            ('+2', 'Moderación confirma un reporte tuyo', 'Hasta 10 por semana.'),
            ('+2', 'Aceptan una corrección que sugeriste', 'Hasta 10 por semana, desde el nivel 3.')]
    filas = ''.join(f'<div style="display: flex; align-items: center; gap: 16px; padding: 13px 0; border-top: 1.5px solid {LINEA};"><span style="width: 56px; flex-shrink: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.03em; color: {VERDE_TX}; font-variant-numeric: tabular-nums;">{p}</span>'
                    f'<div><div style="font-size: 15.5px; font-weight: 800;">{t}</div><div style="margin-top: 2px; font-size: 13.5px; font-weight: 500; color: {TEXT2};">{d}</div></div></div>' for p, t, d in suma)
    no = ''.join(f'<div style="display: flex; gap: 9px; font-size: 14px; line-height: 1.45; font-weight: 600; color: {NAVY};">{ico("equis", 15, ROJO_TX, 2.8)}<span>{t}</span></div>'
                 for t in ['Publicar como anónimo.', 'Marcar «Me sirvió» o valorar lo de otros.', 'Entrar todos los días.', 'Moderar.', 'Publicar en Clasificados.'])
    cuentan = ''.join(f'<div style="display: flex; gap: 9px; font-size: 14px; line-height: 1.45; font-weight: 600; color: {NAVY};">{ico("check", 15, VERDE_TX, 2.8)}<span>{t}</span></div>'
                      for t in ['Lo marca una cuenta con email verificado y sin sanciones.', 'No es tu propio «Me sirvió».', 'El material sigue publicado.', 'Una misma persona te suma como mucho 5 puntos por mes.'])
    niveles = ''.join(f'<div style="{CARD} padding: 12px 14px; {"border-width: 2px; box-shadow: 4px 4px 0 " + NAVY + "; background: #F0F7C9;" if n == 5 else ""}"><div style="display: flex; align-items: baseline; justify-content: space-between;">'
                      f'<span style="font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">Nv. {n}</span><span style="font-size: 12px; font-weight: 700; color: {MUTED}; font-variant-numeric: tabular-nums;">{p:,} pts</span></div>'.replace(',', '.')
                      + f'<div style="margin-top: 4px; font-size: 14px; font-weight: 800;">{nom}</div><div style="margin-top: 3px; font-size: 12.5px; line-height: 1.4; font-weight: 500; color: {TEXT2};">{d}</div></div>'
                      for n, nom, p, d in gxt.NIVELES)
    items = [('suma', 'mas', 'Qué suma'), ('no', 'equis', 'Qué no suma'), ('me-sirvio', 'corazon', 'Qué «Me sirvió» cuentan'), ('retiro', 'bandera', 'Si algo se retira'), ('niveles', 'estrella', 'Niveles'), ('insignias', 'check', 'Insignias')]
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 30px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 40px; align-items: start;">
    {indice(items, 'suma')}
    <div style="display: flex; flex-direction: column; gap: 34px;">
      <div style="background: #F0F7C9; border: 1.5px solid {NAVY}; border-radius: 18px; box-shadow: 6px 6px 0 {NAVY}; padding: 22px 26px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px;">
        {''.join(f'<div><div style="{META} color: #45560F;">{a}</div><div style="margin-top: 6px; font-size: 15px; line-height: 1.5; font-weight: 600; color: {NAVY};">{b}</div></div>' for a, b in [('Suma lo que sirve', 'Lo que más cuenta es que a otros les sirva lo que compartiste.'), ('No se gastan', 'Los puntos son tu reputación: desbloquean cosas, nunca se compran.'), ('No te ponen primero', 'Tu nivel no cambia el orden en que aparecen tus aportes.')])}
      </div>
      <section id="suma">{h2('Qué suma', 'mas')}<div style="margin-top: 12px;">{filas}</div></section>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
        <section id="no" style="{CARD} padding: 18px 20px;"><h3 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 800;">Qué no suma</h3><div style="display: flex; flex-direction: column; gap: 9px;">{no}</div></section>
        <section id="me-sirvio" style="{CARD} padding: 18px 20px;"><h3 style="margin: 0 0 12px 0; font-size: 19px; font-weight: 800;">Qué «Me sirvió» cuentan</h3><div style="display: flex; flex-direction: column; gap: 9px;">{cuentan}</div></section>
      </div>
      <section id="retiro">{h2('Si algo se retira', 'bandera')}
        <p style="margin: 12px 0 0 0; font-size: 15.5px; line-height: 1.65; font-weight: 500; color: {TEXT2}; max-width: 72ch;">Si moderación retira un aporte tuyo, o lo borrás vos, se descuentan los puntos que te dio, incluidos sus «Me sirvió». Si después se restaura (por ejemplo, porque ganaste una apelación), los recuperás. Nunca bajás de 0 puntos. Mientras una cuenta está silenciada o suspendida, no suma.</p></section>
      <section id="niveles">{h2('Niveles', 'estrella')}
        <p style="margin: 12px 0 0 0; font-size: 15px; line-height: 1.6; font-weight: 500; color: {TEXT2};">Cada nivel desbloquea formas de personalizar tu perfil. Si bajás de nivel, lo que ya desbloqueaste se mantiene.</p>
        <div style="margin-top: 14px; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px;">{niveles}</div></section>
      <section id="insignias" style="position: relative; {CARD} padding: 20px 24px; display: flex; align-items: center; gap: 22px; overflow: hidden;">
        <div style="display: flex; gap: 6px;">{''.join(gxt.insignia_img(a, 70) for a in ['primer-aporte', 'salvavidas', 'trotamaterias', 'mesa-de-diciembre'])}</div>
        <div><h3 style="margin: 0; font-size: 20px; font-weight: 800;">Insignias</h3><p style="margin: 6px 0 0 0; font-size: 14px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 46ch;">Reconocen logros concretos, como que un material tuyo le sirva a 50 personas. No dan puntos y lo anónimo no cuenta.</p></div>
        <span style="margin-left: auto;">{boton('Ver tu progreso', 'flecha', primario=False)}</span>
      </section>
    </div>
  </section>
'''
    return breadcrumb(['Ayuda', 'Cómo funcionan los puntos']) + hero('Ayuda', 'Cómo funcionan los', 'puntos', 'Los puntos reconocen a quien ayuda a otros estudiantes. Te contamos qué suma, qué no y qué desbloquea cada nivel.', 'gato-trofeo.png', 190) + cuerpo

# ================================================================ 2 · PREGUNTAS FRECUENTES
FAQ = [
    ('Cuenta', 'persona', [
        ('¿Necesito cuenta para ver materiales?', 'No. Mirar y descargar es libre. La cuenta sirve para subir, guardar en tu mochila, opinar y publicar.', True),
        ('¿Puedo cambiar mi carrera?', 'Sí, desde Configuración → Lo que estudio. También podés sumar otra carrera.', False)]),
    ('Materiales', 'doc', [
        ('¿Cuándo se ve lo que subo?', 'Al instante. Solo pasan por revisión previa las cuentas nuevas, las que tuvieron un retiro reciente o lo que parece spam o duplicado.', False),
        ('¿Qué pasa si subo algo con datos de otra persona?', 'Si alguien lo reporta por datos personales, se oculta hasta que moderación lo revise. Tapá nombres, DNI y legajos antes de subir.', False)]),
    ('Reseñas y experiencias', 'pluma', [
        ('¿Quién ve que una reseña anónima es mía?', 'Nadie en el sitio. Moderación puede verlo solo si escribe un motivo, y ese acceso queda registrado.', False),
        ('¿Puedo escribir varias reseñas de la misma materia?', 'Sí, una por cada cursada. Si la recursaste, contá cada vez por separado.', False)]),
    ('Moderación', 'escudo', [
        ('Me retiraron algo, ¿qué hago?', 'Vas a ver la razón en Mis aportes. Podés corregirlo y volver a subirlo, o apelar una vez dentro de 14 días.', False),
        ('¿Sé quién me reportó?', 'No. Tampoco sabés quién de moderación tomó la decisión. Así se evitan represalias.', False)]),
    ('Clasificados y eventos', 'etiqueta', [
        ('¿DevsProject cobra algo?', 'No. No cobra, no intermedia pagos y no maneja inscripciones: te conecta con otra persona o con quien organiza.', False)]),
]

def p_faq():
    bloques = ''
    for grupo, ic, preguntas in FAQ:
        items = ''
        for q, a, abierta in preguntas:
            items += (f'<div style="border-top: 1.5px solid {LINEA}; padding: 14px 4px;"><div style="display: flex; align-items: center; gap: 12px;"><span style="flex: 1; font-size: 16px; font-weight: 800;">{q}</span>'
                      f'{ico("abajo", 16, NAVY, 2.4, " style=\"transform: rotate(180deg);\"" if abierta else "")}</div>'
                      + (f'<p style="margin: 8px 0 0 0; font-size: 15px; line-height: 1.6; font-weight: 500; color: {TEXT2}; max-width: 70ch;">{a}</p>' if abierta else '') + '</div>')
        bloques += f'<section style="{CARD} padding: 16px 22px 6px 22px;"><div style="display: flex; align-items: center; gap: 10px; padding-bottom: 8px;">{ga.tile(ic, "#ECF2FE", BTN, 34, 10)}<h2 style="margin: 0; font-size: 20px; font-weight: 800;">{grupo}</h2></div>{items}</section>'
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px;">
    <div style="max-width: 760px; display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 15px; padding: 8px 8px 8px 18px;">
      {ico('lupa', 20, NAVY, 2.2)}<span style="flex: 1; font-size: 16px; font-weight: 600; color: #9BA2B4;">Buscá tu pregunta</span>{boton('Buscar')}</div>
  </section>
  <section style="flex-shrink: 0; margin-top: 26px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 14px;">{bloques}</div>
    <aside style="display: flex; flex-direction: column; gap: 14px;">
      <div style="{CARD} padding: 18px 20px;"><h3 style="margin: 0; font-size: 17px; font-weight: 800;">También te puede servir</h3>
        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 9px;">{''.join(f'<a href="#{k}" style="display: flex; align-items: center; gap: 9px; font-size: 14px; font-weight: 700; color: {BLUE};">{ico(i, 16, BLUE, 2.1)}{t}</a>' for k, i, t in [('normas', 'escudo', 'Normas de la comunidad'), ('puntos', 'estrella', 'Cómo funcionan los puntos'), ('terminos', 'doc', 'Términos y privacidad')])}</div></div>
      <div style="position: relative; background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 18px; overflow: hidden; min-height: 170px; box-sizing: border-box;">
        <h3 style="margin: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15; max-width: 190px;">¿No encontrás tu respuesta?</h3>
        <p style="margin: 8px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #6A3E50; max-width: 180px;">Escribinos y te respondemos en unos días.</p>
        <div style="margin-top: 12px;">{boton('Escribirnos', 'mensaje', chico=True)}</div>
        <img src="gato-bocadillo.png" alt="" style="position: absolute; right: -30px; bottom: -8px; width: 150px; height: auto;">
      </div>
    </aside>
  </section>
'''
    return breadcrumb(['Ayuda', 'Preguntas frecuentes']) + hero('Ayuda', 'Preguntas', 'frecuentes', 'Lo que más nos preguntan sobre cuentas, materiales, reseñas y moderación.', 'gato-idea.png', 170) + cuerpo

# ================================================================ 3 · TERMINOS Y PRIVACIDAD
def p_terminos():
    def seccion(k, t, parrafos):
        return (f'<section id="{k}" style="padding: 22px 0; border-top: 1.5px solid #E4DCCB;"><h2 style="margin: 0; font-size: 23px; font-weight: 800; letter-spacing: -0.035em;">{t}</h2>'
                + ''.join(f'<p style="margin: 10px 0 0 0; font-size: 15.5px; line-height: 1.65; font-weight: 500; color: {TEXT2}; max-width: 70ch;">{p}</p>' for p in parrafos) + '</section>')
    terminos = (seccion('que-es', 'Qué es DevsProject', ['Un espacio para que estudiantes compartan materiales, experiencias, eventos y avisos. No es parte de la universidad ni habla en su nombre.'])
                + seccion('tu-contenido', 'Lo que publicás', ['Lo que subís sigue siendo tuyo. Al publicarlo, nos permitís mostrarlo y guardarlo en DevsProject mientras esté publicado.',
                                                               'Publicá solo lo que tenés derecho a compartir: tus apuntes, exámenes ya tomados y material de otras personas solo con su permiso.'])
                + seccion('moderacion-t', 'Moderación', ['Lo que se publica puede reportarse y retirarse si no cumple las Normas de la comunidad. Siempre vas a ver la razón y podés apelar una vez.'])
                + seccion('clasificados-t', 'Clasificados y eventos', ['DevsProject no vende, no cobra ni intermedia pagos, y no garantiza lo que acuerdes con otra persona. Las inscripciones a eventos las maneja quien organiza.']))
    privacidad = (seccion('datos', 'Qué datos guardamos', ['Tu email, tu usuario, tu carrera y lo que publicás o guardás. También la actividad necesaria para que el sitio funcione, como tus sesiones abiertas.'])
                  + seccion('publico', 'Qué es público', ['Tu usuario, tu nombre visible, tu perfil y lo que publicás con tu nombre. Tu email y tu mochila nunca son públicos. Lo que publicás como anónimo no se asocia a tu perfil.'])
                  + seccion('moderacion-p', 'Qué ve moderación', ['Moderación ve lo necesario para revisar un caso. Para saber quién escribió algo anónimo tiene que dar un motivo, y ese acceso queda registrado.'])
                  + seccion('conservacion', 'Cuánto los guardamos', ['Los casos de moderación se guardan mientras exista la cuenta. Los reportes que no prosperan se anonimizan a los 12 meses y los accesos a autores anónimos se guardan 2 años.'])
                  + seccion('derechos', 'Tus derechos', ['Podés descargar una copia de tus datos y eliminar tu cuenta desde Configuración. Si tenés dudas, escribinos.']))
    items = [('terminos', 'doc', 'Términos de uso'), ('que-es', 'libro', 'Qué es DevsProject'), ('tu-contenido', 'subir', 'Lo que publicás'), ('privacidad', 'candado', 'Privacidad'),
             ('datos', 'persona', 'Qué datos guardamos'), ('publico', 'globo', 'Qué es público'), ('derechos', 'descargar', 'Tus derechos')]
    cuerpo = f'''
  <section style="flex-shrink: 0; margin-top: 18px; padding: 0 64px;">
    {ga.aviso('alerta', '<b>Borrador en lenguaje simple.</b> Antes de publicarse tiene que revisarlo alguien con conocimientos legales (por ejemplo, sobre la Ley 25.326 de protección de datos personales).', '#FDF0C8', '#8A5A00')}
  </section>
  <section style="flex-shrink: 0; margin-top: 24px; padding: 0 64px 64px 64px; display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: 40px; align-items: start;">
    {indice(items, 'terminos')}
    <div>
      <div id="terminos" style="{META} color: {BLUE};">Términos de uso</div>
      {terminos}
      <div id="privacidad" style="margin-top: 26px; {META} color: {BLUE};">Privacidad</div>
      {privacidad}
    </div>
  </section>
'''
    return breadcrumb(['Ayuda', 'Términos y privacidad']) + hero('Ayuda · actualizado el 28 de septiembre de 2026', 'Términos y', 'privacidad', 'Qué podés esperar de DevsProject y qué hacemos con tus datos, sin letra chica.') + cuerpo

PAGINAS = [
    ('AyudaPuntos.dc.html', 'DevsProject · Cómo funcionan los puntos', p_puntos, 2000),
    ('AyudaFAQ.dc.html', 'DevsProject · Preguntas frecuentes', p_faq, 1500),
    ('AyudaTerminos.dc.html', 'DevsProject · Términos y privacidad', p_terminos, 2000),
]
if __name__ == '__main__':
    for archivo, titulo, fn, alto in PAGINAS:
        alto = ALTOS.get(archivo, alto)
        with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as f:
            f.write(gx.documento(titulo, alto, gx.header_logueado(''), fn()))
        print('escrito', archivo, alto)

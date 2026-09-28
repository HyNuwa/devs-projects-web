# Genera las 5 pantallas de la navegacion de Materias como artboards .dc.html.
# Universidades > Universidad > Facultad > Carreras > Carrera > Materias > Materia
import json, os, sys

OUT = sys.argv[1] if __name__ == '__main__' else None
ALTOS = json.loads(sys.argv[2]) if (__name__ == '__main__' and len(sys.argv) > 2) else {}

NAVY, BLUE, BTN, ORANGE, PINK = '#021238', '#0A4DE8', '#0261FE', '#FA6304', '#FD4F8D'
MUTED, TEXT2 = '#6B7286', '#3F4657'

# ---------------------------------------------------------------- iconos
ICONOS = {
    'doc': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path>',
    'doclineas': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"></path><path d="M14 3v5h5"></path><path d="M9 13h6"></path><path d="M9 17h4"></path>',
    'birrete': '<path d="m12 4 10 5-10 5L2 9z"></path><path d="M6 11.5V16c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4.5"></path>',
    'libro': '<path d="M3 5.5A1.5 1.5 0 0 1 4.5 4H9a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3z"></path><path d="M21 5.5A1.5 1.5 0 0 0 19.5 4H15a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z"></path>',
    'tablilla': '<rect x="6" y="4" width="12" height="17" rx="2"></rect><path d="M9.5 2.5h5v3h-5z"></path><path d="m9 13 2 2 4-4"></path>',
    'lapiz': '<path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="m13.5 6.5 4 4"></path>',
    'edificio': '<path d="M3 21h18"></path><path d="M5 21V10"></path><path d="M19 21V10"></path><path d="M9.5 21v-6h5v6"></path><path d="M2 10 12 4l10 6"></path>',
    'pin': '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z"></path><circle cx="12" cy="10" r="2.4"></circle>',
    'chev': '<path d="m9 6 6 6-6 6"></path>',
    'flecha': '<path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path>',
    'gente': '<circle cx="9" cy="8" r="3.2"></circle><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5"></path><path d="M16.5 5.2a3.2 3.2 0 0 1 0 5.6"></path><path d="M18.5 14.4c1.7.8 2.8 2.3 2.8 4.6"></path>',
    'capas': '<path d="m12 3 9 5-9 5-9-5z"></path><path d="m3 13 9 5 9-5"></path>',
    'lupa': '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.6-3.6"></path>',
    'campana': '<path d="M6 16v-5a6 6 0 1 1 12 0v5l1.5 2h-15z"></path><path d="M10 20.5a2 2 0 0 0 4 0"></path>',
    'matraz': '<path d="M9 3h6"></path><path d="M10 3v6L4.5 18.5A1.6 1.6 0 0 0 5.9 21h12.2a1.6 1.6 0 0 0 1.4-2.5L14 9V3"></path><path d="M7.5 15h9"></path>',
    'engranaje': '<circle cx="12" cy="12" r="3.2"></circle><path d="M12 2.5v3M12 18.5v3M3.8 3.8l2.1 2.1M18.1 18.1l2.1 2.1M2.5 12h3M18.5 12h3M3.8 20.2l2.1-2.1M18.1 5.9l2.1-2.1"></path>',
    'montania': '<path d="m2.5 20 6.5-11 4 6.5 2.5-3.5 6 8z"></path><path d="m7 12.2 2 1.3 1.6-1.2"></path>',
    'codigo': '<path d="m8 8-4 4 4 4"></path><path d="m16 8 4 4-4 4"></path><path d="m13.5 5-3 14"></path>',
    'monitor': '<rect x="3" y="4" width="18" height="12" rx="2"></rect><path d="M8 20h8M12 16v4"></path>',
    'terminal': '<rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="m7 9 3 3-3 3"></path><path d="M12.5 15h4.5"></path>',
    'hoja': '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"></path><path d="M5 19 14 10"></path>',
    'barras': '<path d="M5 20V11M11 20V5M17 20v-6M3 20h18"></path>',
    'pulso': '<path d="M20.5 8.6c0 5-8.5 10.4-8.5 10.4S3.5 13.6 3.5 8.6a4.6 4.6 0 0 1 8.5-2.4 4.6 4.6 0 0 1 8.5 2.4z"></path><path d="M7 12h2.6l1.4-2.4 2 4.4 1.4-2H17"></path>',
    'corazon': '<path d="M20.5 8.6c0 5-8.5 10.4-8.5 10.4S3.5 13.6 3.5 8.6a4.6 4.6 0 0 1 8.5-2.4 4.6 4.6 0 0 1 8.5 2.4z"></path>',
    'reloj': '<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
    'calendario': '<rect x="3" y="5" width="18" height="16" rx="2.5"></rect><path d="M8 3v4M16 3v4M3 10h18"></path>',
    'subir': '<path d="M12 19V5"></path><path d="m5 12 7-7 7 7"></path>',
    'mas': '<path d="M12 5v14M5 12h14"></path>',
    'pluma': '<path d="M4 20h4L19 9l-4-4L4 16z"></path><path d="M13 21h7"></path>',
    'abajo': '<path d="m6 9 6 6 6-6"></path>',
    'mapa': '<path d="m9 4-6 2.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z"></path><path d="M9 4v13.5M15 6.5V20"></path>',
    'escudo': '<path d="M12 3 5 6v5.5c0 4.2 2.9 7.6 7 9.5 4.1-1.9 7-5.3 7-9.5V6z"></path>',
}

def ico(nombre, tam=16, color='currentColor', trazo=2.1, extra=''):
    return (f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="none" stroke="{color}" '
            f'stroke-width="{trazo}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"{extra}>'
            f'{ICONOS[nombre]}</svg>')

ESTRELLA = '<path d="m12 2.6 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3-5.8 3 1.1-6.5L2.6 9.4l6.5-.9z"></path>'
def estrellas(n, tam=15):
    return ''.join(f'<svg width="{tam}" height="{tam}" viewBox="0 0 24 24" fill="{"#E9B949" if i < n else "#DDD6C6"}" aria-hidden="true">{ESTRELLA}</svg>' for i in range(5))

# tipos de recurso con la paleta de la portada (mismo color por tipo en todo el producto)
TIPOS = [
    ('Parciales',          'Parcial',            'doc',       '#FED3DF', '#E01F63'),
    ('Finales',            'Final',              'birrete',   '#D6E5FB', '#0261FE'),
    ('Apuntes',            'Apunte',             'libro',     '#FDE7D0', '#E2560A'),
    ('Resúmenes',          'Resumen',            'doclineas', '#F0F7C9', '#6E9400'),
    ('Trabajos prácticos', 'Trabajo práctico',   'tablilla',  '#E5E8EF', '#4C5B8A'),
    ('Guías de ejercicios','Guía de ejercicios', 'lapiz',     '#D8F1E8', '#1F8F6B'),
]
TIPO = {t[1]: t for t in TIPOS}

# ---------------------------------------------------------------- piezas comunes
def helmet():
    return ('<helmet>\n'
            '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700;800;900&family=Caveat:wght@600;700&display=swap">\n'
            '<style>\n'
            "  body { margin: 0; font-family: 'Figtree', system-ui, sans-serif; background: #FDF3E5; }\n"
            f'  a {{ color: {BLUE}; text-decoration: none; }}\n'
            '  a:hover { color: #0239B4; }\n'
            "  .dp-hand { font-family: 'Caveat', 'Segoe Script', cursive; }\n"
            '</style>\n</helmet>\n')

LOGO = ('<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#021238" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
        f'{ICONOS["libro"]}</svg>')

def header(activo='Materias'):
    items = [('Inicio', '#inicio'), ('Materias', '#materias'),
             ('Experiencias', '#experiencias'), ('Eventos', '#eventos'), ('Clasificados', '#clasificados')]
    nav = ''.join(
        (f'<a href="{h}" style="color: {BLUE}; font-weight: 700; padding-bottom: 3px; border-bottom: 2px solid {BLUE};">{t}</a>'
         if t == activo else f'<a href="{h}" style="color: #3D4459;">{t}</a>')
        for t, h in items)
    return f'''  <header style="height: 68px; flex-shrink: 0; padding: 0 64px; display: flex; align-items: center; justify-content: space-between; gap: 28px;">
    <div style="display: flex; align-items: center; gap: 36px;">
      <a href="#inicio" style="display: flex; align-items: center; gap: 11px;">
        {LOGO}
        <span style="font-size: 23px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">DevsProject</span>
        <span style="color: {BTN}; font-size: 13px; line-height: 1;">✦</span>
      </a>
      <nav style="display: flex; align-items: center; gap: 24px; font-size: 15px; font-weight: 500;">{nav}</nav>
    </div>
    <div style="display: flex; align-items: center; gap: 12px;">
      <button type="button" aria-label="Buscar" style="width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; cursor: pointer; color: {NAVY};">{ico('lupa', 20)}</button>
      <a href="#ingresar" style="display: inline-flex; align-items: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 10px 19px; font-size: 14.5px; font-weight: 600; color: {NAVY};">Iniciar sesión</a>
      <a href="#subir" style="display: inline-flex; align-items: center; gap: 9px; background: {BTN}; border-radius: 11px; padding: 11px 20px; font-size: 14.5px; font-weight: 700; color: #FFFFFF;">{ico('subir', 17, trazo=2.3)} Subir material</a>
      <div style="margin-left: 14px; text-align: right; font-size: 10.5px; font-weight: 700; letter-spacing: 0.15em; line-height: 1.35; color: {NAVY};">UNJU<br>FI<div style="margin-top: 3px; height: 2px; background: {NAVY};"></div></div>
    </div>
  </header>
'''

def breadcrumb(niveles, nota=''):
    """niveles: lista de etiquetas; la ultima es la pagina actual."""
    partes = []
    for i, n in enumerate(niveles):
        actual = i == len(niveles) - 1
        if i:
            partes.append(f'<span style="display: flex; color: #A3A9B8;">{ico("chev", 14, trazo=2.4)}</span>')
        if actual:
            partes.append(f'<span aria-current="page" style="font-weight: 800; color: {NAVY};">{n}</span>')
        else:
            partes.append(f'<a href="#nivel-{i}" style="font-weight: 600; color: #4B5265;">{n}</a>')
    derecha = (f'<span class="dp-hand" style="margin-left: auto; font-size: 18px; font-weight: 700; color: {NAVY}; transform: rotate(-2deg);">{nota}</span>'
               if nota else '')
    return f'''  <div style="flex-shrink: 0; padding: 4px 64px 0 64px;">
    <nav aria-label="Ubicación" style="display: flex; align-items: center; gap: 9px; flex-wrap: wrap; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; padding: 10px 16px; font-size: 13.5px;">
      <span style="display: flex; color: {BLUE}; margin-right: 2px;">{ico('mapa', 16, trazo=2)}</span>
      {''.join(partes)}
      {derecha}
    </nav>
  </div>
'''

def eyebrow(texto):
    return (f'<div style="display: inline-flex; align-items: center; gap: 9px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.17em; text-transform: uppercase; color: {BLUE};">'
            f'<span style="width: 8px; height: 8px; background: {BLUE}; display: block;"></span>{texto}</div>')

def titulo(navy, azul, tam=64, margen=12, tag='h1'):
    return (f'<{tag} style="margin: {margen}px 0 0 0; font-size: {tam}px; line-height: 0.92; font-weight: 800; letter-spacing: -0.05em; color: {NAVY};">'
            f'{navy}<br><span style="color: {BLUE};">{azul}</span><span style="color: {ORANGE};">.</span></{tag}>')

def trazos(left, top):
    return f'''<span aria-hidden="true" style="position: absolute; left: {left}px; top: {top}px; display: block; width: 62px; height: 62px;">
          <span style="position: absolute; top: 0; left: 22px; width: 8px; height: 26px; border-radius: 4px; background: {PINK}; display: block; transform: rotate(20deg);"></span>
          <span style="position: absolute; top: 18px; left: 40px; width: 8px; height: 25px; border-radius: 4px; background: {PINK}; display: block; transform: rotate(52deg);"></span>
          <span style="position: absolute; top: 38px; left: 50px; width: 8px; height: 23px; border-radius: 4px; background: {PINK}; display: block; transform: rotate(84deg);"></span>
        </span>'''

def boton(texto, icono=None, primario=True, chico=False, ancho=False):
    pad = '10px 16px' if chico else '13px 21px'
    fs = '13px' if chico else '15px'
    fondo = f'background: {BTN}; color: #FFFFFF;' if primario else f'background: #FFFFFF; color: {NAVY};'
    ic = ico(icono, 14 if chico else 16, trazo=2.4) if icono else ''
    w = 'width: 100%; justify-content: center; box-sizing: border-box;' if ancho else ''
    return (f'<a href="#accion" style="display: inline-flex; align-items: center; gap: 9px; {fondo} border: 1.5px solid {NAVY}; '
            f'border-radius: 11px; padding: {pad}; font-size: {fs}; font-weight: 700; {w}">{ic if icono not in ("flecha",) else ""}{texto}{ic if icono == "flecha" else ""}</a>')

def chip(texto, fondo='#F1EEE4', color=TEXT2, peso=600):
    return f'<span style="background: {fondo}; border-radius: 7px; padding: 5px 10px; font-size: 11.5px; font-weight: {peso}; color: {color}; white-space: nowrap;">{texto}</span>'

def estado_pronto():
    return (f'<span style="display: inline-flex; align-items: center; gap: 6px; background: #F1EEE4; border: 1.5px solid #DCD3C0; border-radius: 7px; padding: 3px 9px; font-size: 11px; font-weight: 700; color: #6B6455;">'
            f'<span style="width: 7px; height: 7px; border-radius: 999px; background: #B8AE98; display: block;"></span>Próximamente</span>')

def estado_activo(texto='Activa'):
    return (f'<span style="display: inline-flex; align-items: center; gap: 6px; background: #E7F7E9; border: 1.5px solid #9BD3A6; border-radius: 7px; padding: 3px 9px; font-size: 11px; font-weight: 700; color: #1F7A37;">'
            f'<span style="width: 7px; height: 7px; border-radius: 999px; background: #37C46B; display: block;"></span>{texto}</span>')

def dato(icono, texto):
    return f'<span style="display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: {TEXT2};">{ico(icono, 14, BTN)}{texto}</span>'

def footer():
    links = ''.join(f'<a href="#{l.lower()}" style="color: #FFFFFF;">{l}</a>' for l in ['Materias', 'Experiencias', 'Eventos', 'Clasificados'])
    return f'''  <footer style="margin-top: auto; flex-shrink: 0; position: relative;">
    <svg viewBox="0 0 1440 46" preserveAspectRatio="none" aria-hidden="true" style="display: block; width: 100%; height: 46px;"><path d="M0,46 L0,22 C 220,-2 430,36 720,20 C 1000,6 1240,38 1440,10 L1440,46 Z" fill="#0A66FE"></path></svg>
    <div style="background: #0A66FE; padding: 4px 64px 28px 64px; display: flex; align-items: center; justify-content: space-between; gap: 28px;">
      <a href="#inicio" style="display: flex; align-items: center; gap: 10px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONOS['libro']}</svg>
        <span style="font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #FFFFFF;">DevsProject</span>
        <span style="font-size: 13.5px; font-weight: 600; color: #CFE0FF;">· Comunidad FI · UNJu</span>
      </a>
      <nav style="display: flex; align-items: center; gap: 24px; font-size: 13.5px; font-weight: 600;">{links}</nav>
      <span class="dp-hand" style="font-size: 21px; font-weight: 700; color: #FDF3E5; transform: rotate(-3deg);">compartir también es hacer facultad</span>
    </div>
  </footer>
'''

def pagina(titulo_doc, alto, cuerpo):
    return f'''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>{titulo_doc}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
{helmet()}
<div style="width: 1440px; height: {alto}px; box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column; background: #FDF3E5; background-image: linear-gradient(rgba(2,18,56,0.032) 1px, transparent 1px), linear-gradient(90deg, rgba(2,18,56,0.032) 1px, transparent 1px); background-size: 44px 44px; font-family: 'Figtree', system-ui, sans-serif; color: {NAVY};">
{header()}{cuerpo}{footer()}
</div>
</x-dc>
<script data-dc-script data-props='{{"$preview":{{"width":1440,"height":{alto}}}}}'>
class Component extends DCLogic {{}}
</script>
</body>
</html>
'''

def ilustracion(src, alt, right, top, ancho, alto, img_top=0, img_left=0, img_ancho=None):
    return f'''    <div style="position: absolute; right: {right}px; top: {top}px; width: {ancho}px; height: {alto}px; overflow: hidden;">
      <img src="{src}" alt="{alt}" style="display: block; position: absolute; top: {img_top}px; left: {img_left}px; width: {img_ancho or ancho}px; height: auto;">
    </div>
'''

def seccion_titulo(eyeb, texto, sub, derecha=''):
    return f'''    <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 24px;">
      <div>
        {eyebrow(eyeb)}
        <h2 style="margin: 10px 0 0 0; font-size: 30px; font-weight: 800; letter-spacing: -0.035em; color: {NAVY};">{texto}</h2>
        <p style="margin: 6px 0 0 0; font-size: 15px; font-weight: 500; color: {MUTED};">{sub}</p>
      </div>
      {derecha}
    </div>
'''

def ver_todo(texto):
    return f'<a href="#ver" style="display: inline-flex; align-items: center; gap: 7px; font-size: 14.5px; font-weight: 700; color: {BLUE}; padding-bottom: 4px;">{texto} {ico("flecha", 15, trazo=2.4)}</a>'

def monograma(sigla, fondo, color, tam=58, fs=17):
    return (f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex-shrink: 0; border-radius: 16px; border: 1.5px solid {NAVY}; background: {fondo}; '
            f'display: flex; align-items: center; justify-content: center; font-size: {fs}px; font-weight: 900; letter-spacing: -0.04em; color: {color};">{sigla}</span>')

def icono_caja(icono, fondo, color, tam=52, itam=24):
    return (f'<span aria-hidden="true" style="width: {tam}px; height: {tam}px; flex-shrink: 0; border-radius: 14px; border: 1.5px solid {NAVY}; background: {fondo}; '
            f'display: flex; align-items: center; justify-content: center;">{ico(icono, itam, color, 2)}</span>')

CARD = f'background: #FEFEFE; border: 1.5px solid {NAVY}; border-radius: 16px;'

# ================================================================ 1 · UNIVERSIDADES
def p_universidades():
    pasos = [('edificio', 'Universidad', 'Tu casa de estudios', '#D6E5FB', BTN),
             ('capas', 'Facultad o escuela', 'La unidad académica', '#FDE7D0', '#E2560A'),
             ('birrete', 'Carrera', 'Con su plan de estudios', '#F0F7C9', '#6E9400'),
             ('doc', 'Materia', 'Parciales, apuntes y experiencias', '#FED3DF', '#E01F63')]
    pasos_html = ''
    for i, (ic, t, d, f, c) in enumerate(pasos):
        if i:
            pasos_html += f'<span style="display: flex; color: {NAVY};">{ico("flecha", 20, trazo=2.2)}</span>'
        pasos_html += (f'<div style="flex: 1; display: flex; align-items: center; gap: 12px; {CARD} padding: 12px 14px;">'
                       f'{icono_caja(ic, f, c, 40, 19)}<div><div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">PASO {i+1}</div>'
                       f'<div style="font-size: 15px; font-weight: 800; letter-spacing: -0.02em;">{t}</div>'
                       f'<div style="font-size: 12px; font-weight: 500; color: {MUTED};">{d}</div></div></div>')

    unjupago = f'''      <article style="grid-column: span 2; {CARD} padding: 22px; display: flex; gap: 22px; position: relative; overflow: hidden;">
        {monograma('UNJu', '#D6E5FB', BLUE, 88, 26)}
        <div style="flex: 1; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 10px;">{estado_activo('Activa')} <span style="display: inline-flex; align-items: center; gap: 6px; background: #FED3DF; border-radius: 7px; padding: 4px 9px; font-size: 11px; font-weight: 800; color: #B31450;">♥ Tu comunidad</span></div>
          <h3 style="margin: 12px 0 0 0; font-size: 25px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.1;">Universidad Nacional de Jujuy</h3>
          <div style="margin-top: 7px;">{dato('pin', 'San Salvador de Jujuy')}</div>
          <div style="margin-top: 16px; display: flex; gap: 26px;">
            <div><div style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">5</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">unidades académicas</div></div>
            <div><div style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">4.5K</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">recursos</div></div>
            <div><div style="font-size: 24px; font-weight: 800; letter-spacing: -0.03em;">1.2K</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">estudiantes</div></div>
          </div>
          <div style="margin-top: 18px;">{boton('Ver facultades', 'flecha')}</div>
        </div>
        <span class="dp-hand" style="position: absolute; right: 26px; top: 20px; width: 128px; text-align: center; font-size: 20px; font-weight: 700; line-height: 1.05; transform: rotate(4deg);">acá empezó todo ☺</span>
      </article>
'''
    otras = [('UNSa', 'Universidad Nacional de Salta', 'Salta', '#FDE7D0', '#E2560A'),
             ('UNT', 'Universidad Nacional de Tucumán', 'San Miguel de Tucumán', '#F0F7C9', '#6E9400'),
             ('UNCA', 'Universidad Nacional de Catamarca', 'San Fernando del Valle de Catamarca', '#E5E8EF', '#4C5B8A')]
    tarjetas = ''
    for sig, nom, ciu, f, c in otras:
        tarjetas += f'''      <article style="{CARD} padding: 20px; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between;">{monograma(sig, f, c)}{estado_pronto()}</div>
        <h3 style="margin: 16px 0 0 0; font-size: 18px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.2;">{nom}</h3>
        <div style="margin-top: 7px;">{dato('pin', ciu)}</div>
        <p style="margin: 12px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: {MUTED};">Todavía no hay materias cargadas. Te avisamos cuando se sume.</p>
        <div style="margin-top: auto; padding-top: 16px;">{boton('Avisame', 'campana', primario=False, chico=True)}</div>
      </article>
'''
    cta = f'''      <aside style="background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; position: relative; overflow: hidden;">
        <div style="font-size: 10.5px; font-weight: 800; letter-spacing: 0.16em; color: #C31B5E;">SUMÁ LA TUYA</div>
        <h3 style="margin: 10px 0 0 0; font-size: 23px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.08;">¿No está tu universidad?</h3>
        <p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #6A3E50; max-width: 190px;">Si tu facultad quiere armar su comunidad, escribinos y la sumamos.</p>
        <div style="margin-top: auto; padding-top: 16px;">{boton('Proponer universidad', 'mas', chico=True)}</div>
        <img src="gato-cargando.png" alt="" style="position: absolute; right: -16px; bottom: -10px; width: 118px; height: auto;">
      </aside>
'''
    cuerpo = breadcrumb(['Universidades']) + f'''
  <section id="nivel-0" style="flex-shrink: 0; position: relative; padding: 30px 64px 0 64px;">
{ilustracion('hero-universidades.png', 'Ilustración: el gato de DevsProject junto a un cartel indicador con flechas que dicen universidad, facultad, carrera y materia', 58, 6, 560, 300)}
    <span class="dp-hand" style="position: absolute; left: 700px; top: 36px; width: 110px; text-align: center; font-size: 21px; font-weight: 700; line-height: 1.05; transform: rotate(-5deg);">¿por dónde empezás?</span>
    <div style="position: relative; width: 640px;">
      {eyebrow('Explorar materias')}
      <h1 style="margin: 14px 0 0 0; font-size: 84px; line-height: 0.9; font-weight: 800; letter-spacing: -0.055em; color: {NAVY}; position: relative;">Elegí tu<br><span style="color: {BLUE};">universidad</span><span style="color: {ORANGE};">.</span>{trazos(400, -8)}</h1>
      <p style="margin: 18px 0 0 0; font-size: 17px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 540px;">Encontrá tu facultad, tu carrera y cada materia con sus parciales, apuntes y experiencias de otros estudiantes.</p>
      <form style="margin-top: 22px; display: flex; align-items: center; gap: 12px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 14px; padding: 6px 6px 6px 18px;">
        {ico('lupa', 19, '#7E8698')}
        <input type="search" aria-label="Buscá universidad, facultad, carrera o materia" placeholder="Buscá universidad, facultad, carrera o materia..." style="flex-grow: 1; min-width: 0; border: none; outline: none; background: transparent; font-family: 'Figtree', sans-serif; font-size: 15.5px; font-weight: 500; color: {NAVY}; padding: 12px 0;">
        <button type="submit" style="flex-shrink: 0; background: {BTN}; color: #FFFFFF; border: none; border-radius: 10px; padding: 13px 24px; font-family: 'Figtree', sans-serif; font-size: 15px; font-weight: 700;">Buscar</button>
      </form>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 34px; padding: 0 64px;">
    <div style="display: flex; align-items: center; gap: 12px;">{pasos_html}</div>
  </section>

  <section style="flex-shrink: 0; margin-top: 40px; padding: 0 64px;">
{seccion_titulo('Universidades', 'Universidades en DevsProject', 'Arrancamos por la UNJu. Las demás se van sumando.')}
    <div style="margin-top: 22px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;">
{unjupago}{tarjetas}{cta}    </div>
  </section>
'''
    return cuerpo

# ================================================================ 2 · UNIVERSIDAD
def p_universidad():
    unidades = [
        ('Facultad', 'Facultad de Ingeniería', 'FI', 'engranaje', '#D6E5FB', BTN, True,
         '6 carreras · 4.5K recursos', 'Informática, Sistemas, Industrial, Química, Minas y APU.'),
        ('Facultad', 'Facultad de Ciencias Económicas', 'FCE', 'barras', '#FDE7D0', '#E2560A', False, '', ''),
        ('Facultad', 'Facultad de Ciencias Agrarias', 'FCA', 'hoja', '#F0F7C9', '#6E9400', False, '', ''),
        ('Facultad', 'Facultad de Humanidades y Ciencias Sociales', 'FHyCS', 'libro', '#E5E8EF', '#4C5B8A', False, '', ''),
        ('Escuela superior', 'Escuela Superior de Ciencias de la Salud', 'ESCS', 'pulso', '#FED3DF', '#E01F63', False, '', ''),
    ]
    tarjetas = ''
    for tipo, nom, sig, ic, f, c, activa, stats, desc in unidades:
        tag_tipo = chip(tipo, '#FFFFFF', NAVY, 700).replace('background: #FFFFFF;', f'background: #FFFFFF; border: 1.5px solid {NAVY};')
        if activa:
            cuerpo_t = f'''<p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: {MUTED};">{desc}</p>
        <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 14px;">{dato('capas', '6 carreras')}{dato('doc', '4.5K recursos')}{dato('gente', '1.2K estudiantes')}</div>
        <div style="margin-top: auto; padding-top: 18px;">{boton('Ver carreras', 'flecha', chico=True)}</div>'''
            estado = estado_activo('Activa')
        else:
            cuerpo_t = f'''<p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: {MUTED};">Todavía sin carreras cargadas. ¿Estudiás acá? Ayudanos a sumarla.</p>
        <div style="margin-top: auto; padding-top: 18px;">{boton('Avisame', 'campana', primario=False, chico=True)}</div>'''
            estado = estado_pronto()
        tarjetas += f'''      <article style="{CARD} padding: 20px; display: flex; flex-direction: column;">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">{icono_caja(ic, f, c)}{estado}</div>
        <div style="margin-top: 14px;">{tag_tipo}</div>
        <h3 style="margin: 9px 0 0 0; font-size: 19px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.18;">{nom}</h3>
        <div style="margin-top: 4px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; color: {BLUE};">{sig} · UNJu</div>
        {cuerpo_t}
      </article>
'''
    cta = f'''      <aside style="background: #D9E7FB; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 22px; display: flex; flex-direction: column; position: relative; overflow: hidden;">
        <h3 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.1;">¿Tu facultad<br>no está?</h3>
        <p style="margin: 10px 0 0 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #3B4C6B; max-width: 200px;">Si estudiás ahí y querés armar su comunidad, escribinos y la sumamos.</p>
        <div style="margin-top: auto; padding-top: 16px;">{boton('Sumar mi facultad', 'mas', chico=True)}</div>
        <img src="gato-checklist.png" alt="" style="position: absolute; right: -12px; bottom: -10px; width: 108px; height: auto;">
      </aside>
'''
    cuerpo = breadcrumb(['Universidades', 'Universidad Nacional de Jujuy']) + f'''
  <section id="nivel-1" style="flex-shrink: 0; position: relative; padding: 30px 64px 0 64px;">
{ilustracion('hero-campus.png', 'Ilustración: el gato de DevsProject sentado en los escalones de un edificio universitario', 60, 0, 520, 290)}
    <div style="position: relative; width: 680px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        {monograma('UNJu', '#D6E5FB', BLUE, 64, 19)}
        <div>{eyebrow('San Salvador de Jujuy')}<div style="margin-top: 7px;">{estado_activo('Activa en DevsProject')}</div></div>
      </div>
      {titulo('Universidad Nacional', 'de Jujuy', 66, 18)}
      <p style="margin: 16px 0 0 0; font-size: 17px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 540px;">Elegí tu facultad o escuela superior para ver sus carreras y el plan de estudios de cada una.</p>
      <div style="margin-top: 18px; display: flex; gap: 10px;">
        {chip('5 unidades académicas', '#FFFFFF', NAVY, 700).replace('background: #FFFFFF;', f'background: #FFFFFF; border: 1.5px solid {NAVY};')}
        {chip('4.5K recursos', '#FFFFFF', NAVY, 700).replace('background: #FFFFFF;', f'background: #FFFFFF; border: 1.5px solid {NAVY};')}
        {chip('1.2K estudiantes', '#FFFFFF', NAVY, 700).replace('background: #FFFFFF;', f'background: #FFFFFF; border: 1.5px solid {NAVY};')}
      </div>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 40px; padding: 0 64px;">
{seccion_titulo('Unidades académicas', 'Facultades y escuelas', 'La Facultad de Ingeniería ya tiene su comunidad. Las demás se van sumando.')}
    <div style="margin-top: 22px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;">
{tarjetas}{cta}    </div>
  </section>
'''
    return cuerpo

# ================================================================ 3 · FACULTAD (carreras)
def p_facultad():
    carreras = [
        ('Ingeniería Informática', 'Grado', 'codigo', '#D6E5FB', BTN, '5 años', 'Plan 2023', '49 materias', '1.240 recursos', True),
        ('Licenciatura en Sistemas', 'Grado', 'monitor', '#E5E8EF', '#4C5B8A', '5 años', None, '42 materias', '860 recursos', False),
        ('Analista Programador Universitario', 'Pregrado', 'terminal', '#F0F7C9', '#6E9400', '3 años', None, '24 materias', '540 recursos', False),
        ('Ingeniería Industrial', 'Grado', 'engranaje', '#FDE7D0', '#E2560A', '5 años', None, '46 materias', '720 recursos', False),
        ('Ingeniería Química', 'Grado', 'matraz', '#FED3DF', '#E01F63', '5 años', None, '48 materias', '610 recursos', False),
        ('Ingeniería de Minas', 'Grado', 'montania', '#D8F1E8', '#1F8F6B', '5 años', None, '45 materias', '380 recursos', False),
    ]
    tarjetas = ''
    for nom, nivel, ic, f, c, dur, plan, mat, rec, destacada in carreras:
        extra = (f'<span style="display: inline-flex; align-items: center; gap: 5px; background: #FED3DF; border-radius: 7px; padding: 4px 9px; font-size: 11px; font-weight: 800; color: #B31450;">★ Más consultada</span>'
                 if destacada else '')
        plan_html = f'<span style="font-size: 12px; font-weight: 700; color: {BLUE};">{plan} · vigente</span>' if plan else f'<span style="font-size: 12px; font-weight: 600; color: {MUTED};">Plan vigente</span>'
        borde = f'border: 2px solid {BTN};' if destacada else f'border: 1.5px solid {NAVY};'
        tarjetas += f'''      <article style="background: #FEFEFE; {borde} border-radius: 16px; padding: 20px; display: flex; flex-direction: column;{' box-shadow: 4px 4px 0 ' + NAVY + ';' if destacada else ''}">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">{icono_caja(ic, f, c)}{extra}</div>
        <div style="margin-top: 14px; display: flex; align-items: center; gap: 8px;">{chip(nivel, '#F1EEE4', TEXT2, 700)}{plan_html}</div>
        <h3 style="margin: 9px 0 0 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.15;">{nom}</h3>
        <div style="margin-top: 14px; padding-top: 13px; border-top: 1.5px solid #EFE7D8; display: flex; flex-wrap: wrap; gap: 16px;">{dato('calendario', dur)}{dato('capas', mat)}{dato('doc', rec)}</div>
        <div style="margin-top: auto; padding-top: 18px;">{boton('Ver materias', 'flecha', primario=destacada, chico=True)}</div>
      </article>
'''
    filtros = ''.join([
        f'<a href="#todas" style="display: inline-flex; align-items: center; gap: 8px; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 9px 15px; font-size: 13.5px; font-weight: 700; color: #FFFFFF;">Todas <span style="opacity: 0.75;">6</span></a>',
        f'<a href="#grado" style="display: inline-flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 9px 15px; font-size: 13.5px; font-weight: 700; color: {NAVY};">Grado <span style="color: {MUTED};">5</span></a>',
        f'<a href="#pregrado" style="display: inline-flex; align-items: center; gap: 8px; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 9px 15px; font-size: 13.5px; font-weight: 700; color: {NAVY};">Pregrado <span style="color: {MUTED};">1</span></a>',
    ])
    cuerpo = breadcrumb(['Universidades', 'UNJu', 'Facultad de Ingeniería', 'Carreras']) + f'''
  <section id="nivel-3" style="flex-shrink: 0; position: relative; padding: 30px 64px 0 64px;">
{ilustracion('hero-ingenieria.png', 'Ilustración: el gato de DevsProject con casco de obra y un plano enrollado, junto a una escuadra, un compás y un engranaje', 60, 0, 540, 290)}
    <span class="dp-hand" style="position: absolute; left: 690px; top: 28px; width: 118px; text-align: center; font-size: 20px; font-weight: 700; line-height: 1.05; transform: rotate(-5deg);">cada carrera, su plan ✎</span>
    <div style="position: relative; width: 640px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        {icono_caja('engranaje', '#D6E5FB', BTN, 58, 27)}
        <div>{eyebrow('Facultad de Ingeniería · UNJu')}<div style="margin-top: 7px; font-size: 13px; font-weight: 600; color: {MUTED};">San Salvador de Jujuy</div></div>
      </div>
      {titulo('Carreras de', 'Ingeniería', 74, 18)}
      <p style="margin: 16px 0 0 0; font-size: 17px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 520px;">Elegí tu carrera para ver su plan de estudios, materia por materia.</p>
      <div style="margin-top: 20px; display: flex; gap: 10px;">{filtros}</div>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 40px; padding: 0 64px;">
{seccion_titulo('Carreras', '6 carreras en la facultad', 'Ordenadas por cantidad de recursos compartidos.', ver_todo('Ver planes anteriores'))}
    <div style="margin-top: 22px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;">
{tarjetas}    </div>
  </section>
'''
    return cuerpo

# ================================================================ 4 · CARRERA (materias del plan)
PLAN = [  # (anio, cuatri, codigo, nombre, creditos) — Plan 2023 real (apps/backend/prisma/seed.ts)
    (1,1,'01','Introducción a la Programación',8),(1,1,'02','Álgebra Lineal',6),(1,1,'03','Organización de computadoras',6),(1,1,'04','Análisis Matemático I',8),
    (1,2,'05','Metodología de la Programación',6),(1,2,'06','Análisis Matemático II',8),(1,2,'07','Física Mecánica',6),(1,2,'08','Estructura de Datos',6),
    (2,1,'09','Matemática Discreta',6),(2,1,'10','Teoría de la Información y la Comunicación',6),(2,1,'11','Desarrollo Sistemático de Programas',6),(2,1,'12','Probabilidades y Estadística',6),
    (2,2,'13','Electricidad y Magnetismo',6),(2,2,'14','Bases de Datos',8),(2,2,'15','Programación Concurrente',6),(2,2,'16','Cálculo Numérico',6),
    (3,1,'17','Lógica Computacional',6),(3,1,'18','Sistemas Operativos I',8),(3,1,'19','Organización Empresarial y Modelos de Negocios',6),(3,1,'20','Modelado Orientado a Objetos',6),(3,1,'21','Cursos Optativos (90 horas)',4),
    (3,2,'22','Teoría de Autómatas, Lenguajes y Computación',6),(3,2,'23','Sistemas Operativos II',6),(3,2,'24','Métodos de Simulación',6),
    (4,1,'25','Formulación, Evaluación de Proyectos Informáticos y Emprendedorismo Digital',6),(4,1,'26','Calidad de Software y Testing',6),(4,1,'27','Arquitectura de Redes',8),
    (4,2,'28','Ingeniería del Conocimiento',6),(4,2,'29','Arquitectura de Computadoras Paralelas',6),(4,2,'30','Sistemas de Información',8),(4,2,'31','Cursos Optativos (180 horas)',6),(4,2,'32','Seguridad y Auditoría Informática',6),
    (5,1,'33','Ingeniería de Software I',8),(5,1,'34','Sistemas Inteligentes',6),
    (5,2,'35','Legislación, Ética y Ejercicio Profesional',4),(5,2,'36','Ingeniería de Software II',8),(5,2,'PPS','Práctica Profesional Supervisada',8),(5,2,'TF','Trabajo Final',16),
    (6,0,'37','Compiladores',6),(6,0,'38','Aplicaciones de Bases de Datos I',6),(6,0,'39','Aplicaciones de Bases de Datos II',6),(6,0,'40','Introducción al Procesamiento Digital de Imágenes',6),
    (6,0,'41','Inteligencia Artificial',6),(6,0,'42','Recuperación Avanzada de la Información',6),(6,0,'43','Desarrollo y Arquitecturas Avanzadas de Software',6),(6,0,'44','Modelado y Proceso de Negocios',6),
    (6,0,'45','Taller de Formación Profesional',4),(6,0,'46','Taller de Metodología de la Investigación Científica',4),(6,0,'47','Gestión Ambiental',4),
]
# cantidad de recursos: dato de muestra para el mockup
RECURSOS = {'01':86,'02':64,'03':41,'04':112,'05':57,'06':93,'07':48,'08':71,'09':39,'10':22,'11':35,'12':58,'13':31,'14':66,'15':29,'16':44}
ORD = {1:'1°', 2:'2°', 3:'3°', 4:'4°', 5:'5°'}

def tarjeta_materia(cod, nom, cred, destacada=False):
    rec = RECURSOS.get(cod, 0)
    borde = f'border: 2px solid {BTN}; box-shadow: 3px 3px 0 {NAVY};' if destacada else f'border: 1.5px solid {NAVY};'
    marca = (f'<span style="display: inline-flex; align-items: center; gap: 4px; background: #FED3DF; border-radius: 6px; padding: 3px 7px; font-size: 10px; font-weight: 800; color: #B31450;">★ Más recursos</span>'
             if destacada else f'<span style="display: flex; color: #A3A9B8;">{ico("flecha", 15, trazo=2.3)}</span>')
    return f'''          <a href="#materia-{cod}" style="background: #FEFEFE; {borde} border-radius: 13px; padding: 13px 14px; display: flex; flex-direction: column; color: {NAVY};">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border-radius: 6px; padding: 3px 7px;">{cod}</span>
              {marca}
            </div>
            <span style="margin-top: 9px; font-size: 14.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.22;">{nom}</span>
            <span style="margin-top: auto; padding-top: 10px; display: flex; align-items: center; gap: 12px; font-size: 11.5px; font-weight: 600; color: {MUTED};">
              <span>{cred} créditos</span><span style="display: inline-flex; align-items: center; gap: 5px;">{ico('doc', 12, MUTED, 2.2)}{rec} recursos</span>
            </span>
          </a>
'''

def p_carrera():
    def anio_abierto(a):
        filas = ''
        total = [m for m in PLAN if m[0] == a]
        cred = sum(m[4] for m in total)
        for c in (1, 2):
            ms = [m for m in total if m[1] == c]
            cards = ''.join(tarjeta_materia(m[2], m[3], m[4], destacada=(m[2] == '04')) for m in ms)
            filas += f'''        <div style="display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: 14px; align-items: stretch;">
          <div style="border-right: 1.5px dashed #CFC5B0; padding: 4px 12px 0 0;">
            <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">{c}°</div>
            <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: {MUTED};">CUATRIMESTRE</div>
          </div>
          <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;">
{cards}          </div>
        </div>
'''
        return f'''      <div style="{CARD} padding: 18px 20px 20px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px; font-weight: 800; letter-spacing: -0.035em;">{ORD[a]} año</span>
            {chip(f'{len(total)} materias')}{chip(f'{cred} créditos')}
          </div>
          <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: {MUTED};">Contraer {ico('abajo', 14, MUTED, 2.4, ' style="transform: rotate(180deg);"')}</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
{filas}        </div>
      </div>
'''
    def anio_cerrado(a, etiqueta=None):
        total = [m for m in PLAN if m[0] == a]
        cred = sum(m[4] for m in total)
        nombres = ' · '.join(m[3] for m in total[:4]) + (f' · y {len(total)-4} más' if len(total) > 4 else '')
        return f'''      <a href="#anio-{a}" style="{CARD} padding: 15px 20px; display: flex; align-items: center; gap: 18px; color: {NAVY};">
        <span style="width: 118px; flex-shrink: 0; font-size: 19px; font-weight: 800; letter-spacing: -0.03em;">{etiqueta or ORD[a] + ' año'}</span>
        <span style="display: flex; gap: 8px; flex-shrink: 0;">{chip(f'{len(total)} materias')}{chip(f'{cred} créditos')}</span>
        <span style="flex: 1; min-width: 0; font-size: 13px; font-weight: 500; color: {MUTED}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{nombres}</span>
        <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: {BLUE}; flex-shrink: 0;">Ver {ico('abajo', 14, BLUE, 2.4)}</span>
      </a>
'''
    anios = ''.join([
        f'<a href="#todos" style="display: inline-flex; align-items: center; background: {BTN}; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 9px 15px; font-size: 13.5px; font-weight: 700; color: #FFFFFF;">Todo el plan</a>',
        *[f'<a href="#a{a}" style="display: inline-flex; align-items: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 9px 15px; font-size: 13.5px; font-weight: 700; color: {NAVY};">{ORD[a]} año</a>' for a in range(1, 6)],
        f'<a href="#optativas" style="display: inline-flex; align-items: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 11px; padding: 9px 15px; font-size: 13.5px; font-weight: 700; color: {NAVY};">Optativas</a>',
    ])
    total_cred = sum(m[4] for m in PLAN if m[0] <= 5)
    resumen = f'''    <aside style="position: absolute; right: 64px; top: 30px; width: 360px; {CARD} padding: 20px;">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <span style="font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">PLAN DE ESTUDIOS</span>
        <span style="display: inline-flex; align-items: center; gap: 7px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 6px 11px; font-size: 13px; font-weight: 700;">Plan 2023 {ico('abajo', 13, NAVY, 2.4)}</span>
      </div>
      <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 18px;">
        <div><div style="font-size: 28px; font-weight: 800; letter-spacing: -0.035em;">5 años</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">duración</div></div>
        <div><div style="font-size: 28px; font-weight: 800; letter-spacing: -0.035em;">49</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">materias con optativas</div></div>
        <div><div style="font-size: 28px; font-weight: 800; letter-spacing: -0.035em;">{total_cred}</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">créditos obligatorios</div></div>
        <div><div style="font-size: 28px; font-weight: 800; letter-spacing: -0.035em; color: {BLUE};">1.240</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">recursos compartidos</div></div>
      </div>
      <div style="margin-top: 16px; padding-top: 14px; border-top: 1.5px solid #EFE7D8; display: flex; align-items: center; gap: 10px;">
        <img src="av-birrete.png" alt="" style="width: 34px; height: 34px; border-radius: 999px; border: 1.5px solid {NAVY};">
        <span style="font-size: 12.5px; line-height: 1.35; font-weight: 600; color: {TEXT2};">Plan revisado por la comunidad.<br><a href="#corregir" style="font-weight: 700;">¿Falta algo? Avisanos</a></span>
      </div>
    </aside>
'''
    cuerpo = breadcrumb(['Universidades', 'UNJu', 'Facultad de Ingeniería', 'Carreras', 'Ingeniería Informática', 'Materias']) + f'''
  <section id="nivel-5" style="flex-shrink: 0; position: relative; padding: 30px 64px 0 64px; min-height: 330px; box-sizing: border-box;">
{resumen}    <div style="position: relative; width: 820px;">
      <div style="display: flex; align-items: center; gap: 16px;">
        {icono_caja('codigo', '#D6E5FB', BTN, 58, 27)}
        <div>{eyebrow('Carrera de grado · Facultad de Ingeniería')}<div style="margin-top: 7px;">{estado_activo('Plan 2023 vigente')}</div></div>
      </div>
      <h1 style="margin: 18px 0 0 0; font-size: 74px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em; color: {NAVY}; position: relative;">Ingeniería<br><span style="color: {BLUE};">Informática</span><span style="color: {ORANGE};">.</span>{trazos(318, -6)}</h1>
      <p style="margin: 16px 0 0 0; font-size: 17px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 560px;">El plan de estudios materia por materia. Tocá una para ver sus parciales, apuntes y lo que contaron quienes ya la cursaron.</p>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 30px; padding: 0 64px;">
    <div style="display: flex; align-items: center; gap: 10px;">
      {anios}
      <form style="margin-left: auto; width: 330px; display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 2px solid {NAVY}; border-radius: 12px; padding: 5px 14px;">
        {ico('lupa', 17, '#7E8698')}
        <input type="search" aria-label="Buscá una materia del plan" placeholder="Buscá una materia del plan..." style="flex-grow: 1; min-width: 0; border: none; outline: none; background: transparent; font-family: 'Figtree', sans-serif; font-size: 14px; font-weight: 500; color: {NAVY}; padding: 7px 0;">
      </form>
    </div>
  </section>

  <section id="materias" style="flex-shrink: 0; margin-top: 22px; padding: 0 64px; display: flex; flex-direction: column; gap: 14px;">
{anio_abierto(1)}{anio_abierto(2)}{anio_cerrado(3)}{anio_cerrado(4)}{anio_cerrado(5)}{anio_cerrado(6, 'Optativas')}  </section>
'''
    return cuerpo

# ================================================================ 5 · MATERIA
def p_materia():
    conteos = {'Parciales': 24, 'Finales': 12, 'Apuntes': 18, 'Resúmenes': 15, 'Trabajos prácticos': 9, 'Guías de ejercicios': 8}
    tipos = ''
    for plural, sing, ic, f, c in TIPOS:
        activo = plural == 'Parciales'
        borde = f'border: 2px solid {NAVY}; box-shadow: 3px 3px 0 {NAVY};' if activo else f'border: 1.5px solid {NAVY};'
        tipos += f'''        <a href="#tipo-{sing}" style="background: {f}; {borde} border-radius: 13px; padding: 13px 14px; display: flex; flex-direction: column; gap: 9px; color: {NAVY};">
          <span style="display: flex; align-items: center; justify-content: space-between;">{ico(ic, 20, c, 2.1)}<span style="font-size: 22px; font-weight: 800; letter-spacing: -0.03em;">{conteos[plural]}</span></span>
          <span style="font-size: 13.5px; font-weight: 800; letter-spacing: -0.01em;">{plural}</span>
        </a>
'''
    recursos = [('Parcial', 'Parcial 1 resuelto', 'Ciclo 2025 · Prof. Gómez', 42),
                ('Parcial', 'Parcial 2, tema B', 'Ciclo 2025 · Prof. Gómez', 36),
                ('Parcial', 'Recuperatorio del parcial 1', 'Ciclo 2024 · Prof. Ruiz', 23),
                ('Parcial', 'Parcial 1 con corrección', 'Ciclo 2024 · Prof. Ruiz', 19)]
    rec_html = ''
    for tipo, tit, meta, util in recursos:
        _, sing, ic, f, c = TIPO[tipo]
        rec_html += f'''        <article style="{CARD} padding: 15px; display: flex; flex-direction: column; gap: 11px;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="display: inline-flex; align-items: center; gap: 6px; background: {f}; border: 1.5px solid {NAVY}; border-radius: 999px; padding: 4px 10px 4px 7px; font-size: 11.5px; font-weight: 700;">{ico(ic, 13, c, 2.2)}{sing}</span>
            {ico('doc', 18, '#9BA2B4', 1.9)}
          </div>
          <div>
            <h3 style="margin: 0; font-size: 15.5px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.25;">{tit}</h3>
            <div style="margin-top: 5px; display: flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 600; color: #808799;">{ico('calendario', 12, '#808799', 2)}{meta} · PDF</div>
          </div>
          <div style="margin-top: auto; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
            <span style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700;">{ico('corazon', 15, PINK, 2.1)}{util} <span style="font-weight: 600; color: {MUTED};">Me sirvió</span></span>
            <a href="#recurso" style="display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 6px 11px; font-size: 12px; font-weight: 700; color: {NAVY};">Ver {ico('flecha', 12, NAVY, 2.5)}</a>
          </div>
        </article>
'''
    resenias = [
        ('av-crema.png', 'Reseña de cursada', 4, '“Los TP te obligan a programar todas las semanas y eso es lo que después te salva en el parcial.”',
         ['Ciclo 2025', 'Promoción', 'Mañana', 'Primera cursada', 'Dificultad media']),
        ('av-guino.png', 'Reseña de cursada', 5, '“Si nunca programaste, arrancá con las guías desde la primera semana. Los ayudantes responden rápido.”',
         ['Ciclo 2024', 'Regular', 'Tarde', 'Dificultad alta']),
        ('av-birrete.png', 'Experiencia de final', 4, '“Te dan un problema para resolver en papel y después lo explicás. En mi mesa tomaron recursividad.”',
         ['Mesa de diciembre 2024', 'Aprobado', 'Dificultad media']),
    ]
    res_html = ''
    for av, tipo, est, cita, chips_ in resenias:
        res_html += f'''        <article style="{CARD} padding: 17px 18px; display: flex; flex-direction: column;">
          <div style="display: flex; align-items: center; gap: 11px;">
            <img src="{av}" alt="" style="width: 40px; height: 40px; border-radius: 999px; border: 1.5px solid {NAVY}; flex-shrink: 0;">
            <div><div style="font-size: 14px; font-weight: 800;">Anónimo</div><div style="font-size: 11.5px; font-weight: 600; color: #7A8296;">{tipo}</div></div>
            <div style="margin-left: auto; display: flex; gap: 2px;">{estrellas(est)}</div>
          </div>
          <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.5; font-weight: 500; color: #4B5265;">{cita}</p>
          <div style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 7px;">{''.join(chip(x) for x in chips_)}</div>
          <a href="#leer" style="margin-top: auto; padding-top: 14px; align-self: flex-start; display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 700; color: {NAVY};"><span style="display: inline-flex; align-items: center; gap: 7px; border: 1.5px solid {NAVY}; border-radius: 9px; padding: 7px 13px;">Leer más {ico('flecha', 12, NAVY, 2.5)}</span></a>
        </article>
'''
    lateral = f'''      <aside style="display: flex; flex-direction: column; gap: 16px;">
        <div style="{CARD} padding: 18px;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">LA MATERIA EN NÚMEROS</div>
          <div style="margin-top: 14px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 16px;">
            <div><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">86</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">recursos</div></div>
            <div><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">34</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">reseñas de cursada</div></div>
            <div><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.035em;">12</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">experiencias de final</div></div>
            <div><div style="font-size: 26px; font-weight: 800; letter-spacing: -0.035em; color: {BLUE};">Media</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">dificultad según reseñas</div></div>
          </div>
        </div>
        <div style="{CARD} padding: 18px;">
          <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.14em; color: {MUTED};">CÁTEDRA</div>
          <div style="margin-top: 12px; display: flex; flex-direction: column; gap: 11px;">
            <div style="display: flex; align-items: center; gap: 11px;"><span style="width: 36px; height: 36px; border-radius: 999px; border: 1.5px solid {NAVY}; background: #D6E5FB; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: {BLUE};">AG</span><div><div style="font-size: 14px; font-weight: 800;">Prof. A. Gómez</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Teoría · Mañana</div></div></div>
            <div style="display: flex; align-items: center; gap: 11px;"><span style="width: 36px; height: 36px; border-radius: 999px; border: 1.5px solid {NAVY}; background: #FDE7D0; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: #E2560A;">LR</span><div><div style="font-size: 14px; font-weight: 800;">Prof. L. Ruiz</div><div style="font-size: 12px; font-weight: 600; color: {MUTED};">Práctica · Tarde</div></div></div>
          </div>
        </div>
        <div style="background: #FECDDD; border: 1.5px solid {NAVY}; border-radius: 16px; padding: 18px; position: relative; overflow: hidden; min-height: 184px; box-sizing: border-box; display: flex; flex-direction: column;">
          <h3 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em; line-height: 1.12; max-width: 190px;">¿Ya la cursaste? Contá cómo te fue.</h3>
          <p style="margin: 8px 0 0 0; font-size: 12.5px; line-height: 1.45; font-weight: 500; color: #6A3E50; max-width: 180px;">Tu reseña ayuda a la próxima camada.</p>
          <div style="margin-top: auto; padding-top: 12px;">{boton('Escribir reseña', 'pluma', chico=True)}</div>
          <img src="gato-checklist.png" alt="" style="position: absolute; right: -10px; bottom: -8px; width: 104px; height: auto;">
        </div>
      </aside>
'''
    cuerpo = breadcrumb(['Universidades', 'UNJu', 'Facultad de Ingeniería', 'Carreras', 'Ingeniería Informática', 'Materias', 'Introducción a la Programación']) + f'''
  <section id="nivel-6" style="flex-shrink: 0; position: relative; padding: 30px 64px 0 64px;">
    <div style="display: flex; align-items: flex-end; justify-content: space-between; gap: 32px;">
      <div style="position: relative;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 13px; font-weight: 800; letter-spacing: 0.06em; color: {BLUE}; background: #ECF2FE; border: 1.5px solid {NAVY}; border-radius: 8px; padding: 5px 10px;">01</span>
          {eyebrow('1° año · 1° cuatrimestre · 8 créditos')}
        </div>
        <h1 style="margin: 16px 0 0 0; font-size: 70px; line-height: 0.92; font-weight: 800; letter-spacing: -0.055em; color: {NAVY}; position: relative;">Introducción a la<br><span style="color: {BLUE};">Programación</span><span style="color: {ORANGE};">.</span>{trazos(486, -6)}</h1>
        <p style="margin: 16px 0 0 0; font-size: 17px; line-height: 1.5; font-weight: 500; color: {TEXT2}; max-width: 600px;">Todo lo que la comunidad compartió para cursarla y rendirla: parciales, finales, apuntes y experiencias.</p>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0; padding-bottom: 4px;">
        <a href="#guardar" aria-label="Guardar materia" style="width: 46px; height: 46px; display: flex; align-items: center; justify-content: center; background: #FFFFFF; border: 1.5px solid {NAVY}; border-radius: 12px; color: {NAVY};">{ico('corazon', 19, NAVY, 2.1)}</a>
        {boton('Escribir reseña', 'pluma', primario=False)}
        {boton('Subir material', 'subir')}
      </div>
    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 28px; padding: 0 64px;">
    <div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px;">
{tipos}    </div>
  </section>

  <section style="flex-shrink: 0; margin-top: 34px; padding: 0 64px; display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 28px; align-items: start;">
    <div style="display: flex; flex-direction: column; gap: 32px;">
      <div>
{seccion_titulo('Recursos · filtrado', 'Parciales', '24 parciales, ordenados por los que más sirvieron.', ver_todo('Ver los 24 parciales'))}
        <div style="margin-top: 18px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;">
{rec_html}        </div>
      </div>
      <div>
{seccion_titulo('Experiencias', 'Cómo les fue', 'Reseñas de cursada y experiencias de final de la comunidad.', ver_todo('Ver las 46'))}
        <div style="margin-top: 18px; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px;">
{res_html}        </div>
      </div>
    </div>
{lateral}  </section>
'''
    return cuerpo

PAGINAS = [
    ('Universidades.dc.html',  'DevsProject · Universidades', p_universidades, 1200),
    ('Universidad.dc.html',    'DevsProject · UNJu',          p_universidad,   1160),
    ('Facultad.dc.html',       'DevsProject · Facultad de Ingeniería', p_facultad, 1160),
    ('Carrera.dc.html',        'DevsProject · Ingeniería Informática', p_carrera, 1560),
    ('Materia.dc.html',        'DevsProject · Introducción a la Programación', p_materia, 1500),
]
if __name__ == '__main__':
  for archivo, tit, fn, alto in PAGINAS:
      alto = ALTOS.get(archivo, alto)
      with open(os.path.join(OUT, archivo), 'w', encoding='utf-8') as fh:
          fh.write(pagina(tit, alto, fn()))
      print('escrito', archivo, alto)

# Genera insignias de DevsProject como SVG autocontenidos: una version animada (entrada al ganarla
# + reposo en bucle) y una estatica para listados. Estilo sticker: contorno navy y sombra desplazada.
# Uso: python generar_insignias.py <carpeta_salida>
import math, os, random, sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
NAVY, CREAM, LIME, PINK, ORANGE, BLUE, GOLD = '#021238', '#FDF3E5', '#C8FB10', '#FD4F8D', '#FA6304', '#0261FE', '#E9B949'
C = 200  # centro del viewBox 400x400

def estrella(puntas, r_ext, r_int, giro=0.0):
    pts = []
    for i in range(puntas * 2):
        r = r_ext if i % 2 == 0 else r_int
        a = math.radians(giro - 90 + i * 180 / puntas)
        pts.append(f'{C + r * math.cos(a):.1f},{C + r * math.sin(a):.1f}')
    return ' '.join(pts)

def destello(x, y, r):  # estrella de 4 puntas
    return (f'M{x},{y - r} Q{x + r * 0.18},{y - r * 0.18} {x + r},{y} Q{x + r * 0.18},{y + r * 0.18} {x},{y + r} '
            f'Q{x - r * 0.18},{y + r * 0.18} {x - r},{y} Q{x - r * 0.18},{y - r * 0.18} {x},{y - r}Z')

def icono_aporte():
    # hoja de apunte con esquina doblada + boton lima con flecha hacia arriba
    return f'''
      <g class="icono-sombra"><path d="M160 150h58l24 24v86a8 8 0 0 1-8 8h-74a8 8 0 0 1-8-8v-102a8 8 0 0 1 8-8z" fill="{NAVY}" transform="translate(5 5)"/></g>
      <path d="M160 150h58l24 24v86a8 8 0 0 1-8 8h-74a8 8 0 0 1-8-8v-102a8 8 0 0 1 8-8z" fill="{CREAM}" stroke="{NAVY}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M218 150v18a6 6 0 0 0 6 6h18" fill="#E4DCCB" stroke="{NAVY}" stroke-width="5" stroke-linejoin="round"/>
      <g stroke="{BLUE}" stroke-width="5" stroke-linecap="round"><path d="M168 186h46"/><path d="M168 202h56"/><path d="M168 218h38"/></g>
      <path d="M168 236c10-8 16 6 26-2" fill="none" stroke="{PINK}" stroke-width="4" stroke-linecap="round"/>
      <g class="icono-extra">
        <circle cx="244" cy="248" r="25" fill="{LIME}" stroke="{NAVY}" stroke-width="5"/>
        <path d="M244 260v-24M233 246l11-11 11 11" fill="none" stroke="{NAVY}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>'''

def icono_me_sirvio():
    corazon = 'M200 262c-4 0-58-34-58-72a30 30 0 0 1 58-10a30 30 0 0 1 58 10c0 38-54 72-58 72z'
    return f'''
      <g class="icono-sombra"><path d="{corazon}" fill="{NAVY}" transform="translate(5 5)"/></g>
      <path d="{corazon}" fill="{PINK}" stroke="{NAVY}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M166 186a16 16 0 0 1 20-14" fill="none" stroke="{CREAM}" stroke-width="6" stroke-linecap="round" opacity="0.9"/>
      <g class="icono-extra">
        <rect x="222" y="226" width="50" height="34" rx="12" fill="{LIME}" stroke="{NAVY}" stroke-width="5"/>
        <text x="247" y="250" text-anchor="middle" font-family="Figtree, 'Segoe UI', Arial, sans-serif" font-size="19" font-weight="900" fill="{NAVY}">+1</text>
      </g>'''

INSIGNIAS = {
    'primer-aporte': dict(titulo='Primer aporte', fondo=ORANGE, medio=LIME, frente=BLUE, abanico='#5C95FF', abanico2='#8DB6FF', icono=icono_aporte, anillo2=PINK),
    'primer-me-sirvio': dict(titulo='Primer «Me sirvió»', fondo=LIME, medio=ORANGE, frente=CREAM, abanico='#FFD3E2', abanico2='#FFE9F1', icono=icono_me_sirvio, anillo2=BLUE, contorno=PINK),
}

def capa(puntos, color, redondeo=16):
    # sombra desplazada + contorno navy redondeado + relleno redondeado del color
    return (f'<polygon points="{puntos}" fill="{NAVY}" stroke="{NAVY}" stroke-width="{redondeo + 10}" stroke-linejoin="round" transform="translate(6 7)"/>'
            f'<polygon points="{puntos}" fill="{NAVY}" stroke="{NAVY}" stroke-width="{redondeo + 10}" stroke-linejoin="round"/>'
            f'<polygon points="{puntos}" fill="{color}" stroke="{color}" stroke-width="{redondeo}" stroke-linejoin="round"/>')

def svg(clave, cfg, animada=True):
    random.seed(7)
    atras = estrella(16, 124, 115, 0)
    medio = estrella(8, 126, 103, 22.5)
    frente = estrella(8, 106, 95, 0)
    interior = estrella(8, 88, 79, 0)
    # abanico de luz detras del icono (cunas desde el centro inferior)
    cunas = ''
    for k, ang in enumerate(range(-60, 61, 30)):
        a1, a2 = math.radians(ang - 90 - 9), math.radians(ang - 90 + 9)
        r = 150
        cunas += (f'<path d="M200 235 L{200 + r * math.cos(a1):.1f} {235 + r * math.sin(a1):.1f} L{200 + r * math.cos(a2):.1f} {235 + r * math.sin(a2):.1f}Z" '
                  f'fill="{cfg["abanico"] if k % 2 == 0 else cfg["abanico2"]}"/>')
    # rayos de fondo
    rayos = ''
    for k in range(18):
        a = math.radians(k * 20)
        x1, y1 = C + 150 * math.cos(a), C + 150 * math.sin(a)
        a1, a2 = a - math.radians(1.6), a + math.radians(1.6)
        rayos += (f'<path d="M{x1:.1f} {y1:.1f} L{C + 196 * math.cos(a1):.1f} {C + 196 * math.sin(a1):.1f} L{C + 196 * math.cos(a2):.1f} {C + 196 * math.sin(a2):.1f}Z" '
                  f'fill="{GOLD}" opacity="{0.42 if k % 2 == 0 else 0.2}"/>')
    # confeti: sale del centro hacia afuera
    colores = [PINK, LIME, ORANGE, BLUE, GOLD, NAVY]
    confeti, css_conf = '', ''
    for k in range(30):
        ang = random.uniform(0, 360)
        dist = random.uniform(150, 195)
        dx, dy = dist * math.cos(math.radians(ang)), dist * math.sin(math.radians(ang))
        rot = random.randint(-280, 280)
        forma = (f'<rect x="-3" y="-7" width="6" height="14" rx="2" fill="{random.choice(colores)}"/>' if k % 3 else
                 f'<circle r="4" fill="{random.choice(colores)}"/>')
        confeti += f'<g class="confeti c{k}" transform="translate(200 200)"><g class="p">{forma}</g></g>'
        css_conf += (f'.c{k} .p{{animation: conf{k} 1.25s cubic-bezier(.15,.7,.3,1) {1.0 + random.uniform(0, 0.12):.2f}s both}}'
                     f'@keyframes conf{k}{{0%{{transform:translate({dx*0.55:.0f}px,{dy*0.55:.0f}px) rotate(0) scale(.4);opacity:0}}8%{{opacity:1}}'
                     f'70%{{opacity:1}}100%{{transform:translate({dx:.0f}px,{dy + 22:.0f}px) rotate({rot}deg) scale(1);opacity:0}}}}\n')
    destellos = ''.join(f'<path class="tw t{i}" d="{destello(x, y, r)}" fill="{col}" stroke="{NAVY}" stroke-width="2.5" stroke-linejoin="round"/>'
                        for i, (x, y, r, col) in enumerate([(92, 104, 13, LIME), (318, 90, 10, CREAM), (330, 300, 12, PINK), (78, 290, 9, GOLD)]))
    estrella_brillo = f'<path class="chispa" d="{destello(200, 124, 15)}" fill="{GOLD}" stroke="{NAVY}" stroke-width="3" stroke-linejoin="round"/>'

    css_anim = f'''
    .o {{ transform-box: view-box; transform-origin: 200px 200px; }}
    .fantasma {{ animation: fantasma .5s ease-out .1s both; }}
    @keyframes fantasma {{ 0% {{ opacity: 0; transform: scale(.55) }} 50% {{ opacity: .22 }} 100% {{ opacity: 0; transform: scale(1.05) }} }}
    .atras {{ animation: abrir-atras .55s cubic-bezier(.34,1.56,.64,1) .28s both; }}
    @keyframes abrir-atras {{ 0% {{ transform: scale(0) rotate(-120deg) }} 100% {{ transform: scale(1) rotate(0) }} }}
    .medio {{ animation: abrir-medio .55s cubic-bezier(.34,1.56,.64,1) .34s both; }}
    @keyframes abrir-medio {{ 0% {{ transform: scale(0) rotate(90deg) }} 100% {{ transform: scale(1) rotate(0) }} }}
    .frente {{ animation: abrir-frente .6s cubic-bezier(.34,1.7,.64,1) .40s both; }}
    @keyframes abrir-frente {{ 0% {{ transform: scale(0) rotate(-45deg) }} 60% {{ transform: scale(1.12) rotate(4deg) }} 100% {{ transform: scale(1) rotate(0) }} }}
    .icono {{ animation: subir .5s cubic-bezier(.3,1.45,.6,1) .66s both; }}
    @keyframes subir {{ 0% {{ transform: translateY(140px) }} 100% {{ transform: translateY(0) }} }}
    .icono-extra {{ transform-box: fill-box; transform-origin: center; animation: pop .45s cubic-bezier(.34,1.8,.64,1) 1.12s both; }}
    @keyframes pop {{ 0% {{ transform: scale(0) rotate(-25deg) }} 100% {{ transform: scale(1) rotate(0) }} }}
    .abanico {{ transform-origin: 200px 235px; animation: abanico .55s cubic-bezier(.2,.9,.3,1.2) .92s both; }}
    @keyframes abanico {{ 0% {{ transform: scaleY(0) scaleX(.3); opacity: 0 }} 100% {{ transform: none; opacity: 1 }} }}
    .anillo {{ animation: onda .75s cubic-bezier(.1,.7,.3,1) .86s both; }}
    .anillo.dos {{ animation-delay: .98s; }}
    @keyframes onda {{ 0% {{ transform: scale(.7); opacity: 0; stroke-width: 10 }} 15% {{ opacity: 1 }} 100% {{ transform: scale(1.5); opacity: 0; stroke-width: 1 }} }}
    .contorno {{ stroke-dasharray: 700; animation: dibujar .7s ease-out 1.15s both; }}
    @keyframes dibujar {{ 0% {{ stroke-dashoffset: 700 }} 100% {{ stroke-dashoffset: 0 }} }}
    .chispa {{ transform-box: fill-box; transform-origin: center; animation: chispa .5s cubic-bezier(.34,1.8,.64,1) 1.05s both, latir 2.4s ease-in-out 2.2s infinite; }}
    @keyframes chispa {{ 0% {{ transform: scale(0) rotate(-90deg) }} 100% {{ transform: scale(1) rotate(0) }} }}
    @keyframes latir {{ 0%, 100% {{ transform: scale(1) }} 50% {{ transform: scale(1.18) rotate(15deg) }} }}
    .rayos {{ animation: rayos-in .8s ease-out 1.0s both, girar 36s linear 1.8s infinite; }}
    @keyframes rayos-in {{ 0% {{ opacity: 0; transform: scale(.6) }} 100% {{ opacity: 1; transform: scale(1) }} }}
    @keyframes girar {{ to {{ transform: rotate(360deg) }} }}
    .brillo {{ animation: brillo 5s ease-in-out 1.75s infinite both; }}
    @keyframes brillo {{ 0% {{ transform: translateX(-260px) skewX(-20deg) }} 22%, 100% {{ transform: translateX(260px) skewX(-20deg) }} }}
    .flotar {{ animation: flotar 3.2s ease-in-out 2.3s infinite; }}
    @keyframes flotar {{ 0%, 100% {{ transform: translateY(0) }} 50% {{ transform: translateY(-5px) }} }}
    .tw {{ transform-box: fill-box; transform-origin: center; animation: titilar 2.6s ease-in-out infinite both; }}
    .t0 {{ animation-delay: 1.3s }} .t1 {{ animation-delay: 1.9s }} .t2 {{ animation-delay: 1.6s }} .t3 {{ animation-delay: 2.3s }}
    @keyframes titilar {{ 0%, 100% {{ transform: scale(0); opacity: 0 }} 35%, 60% {{ transform: scale(1) rotate(45deg); opacity: 1 }} }}
{css_conf}
    @media (prefers-reduced-motion: reduce) {{
      *, *::before, *::after {{ animation: none !important; }}
      .fantasma, .anillo, .confeti, .tw {{ opacity: 0 }}
    }}'''
    css_estatica = '.fantasma, .anillo, .confeti, .tw { display: none } .contorno { stroke-dasharray: none }'
    css = css_anim if animada else css_estatica
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-labelledby="t-{clave}">
  <title id="t-{clave}">Insignia de DevsProject: {cfg["titulo"]}</title>
  <defs>
    <clipPath id="clip-frente-{clave}"><polygon points="{frente}"/></clipPath>
    <linearGradient id="brillo-{clave}" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
  </defs>
  <style>{css}</style>
  <g class="o rayos">{rayos}</g>
  <circle class="o anillo" cx="200" cy="200" r="130" fill="none" stroke="{GOLD}"/>
  <circle class="o anillo dos" cx="200" cy="200" r="130" fill="none" stroke="{cfg["anillo2"]}"/>
  <polygon class="o fantasma" points="{frente}" fill="{NAVY}"/>
  {confeti}
  <g class="o flotar">
    <g class="o atras">{capa(atras, cfg["fondo"])}</g>
    <g class="o medio">{capa(medio, cfg["medio"])}</g>
    <g class="o frente">
      {capa(frente, cfg["frente"], 12)}
      <g clip-path="url(#clip-frente-{clave})">
        <g class="abanico">{cunas}</g>
        <g class="icono">{cfg["icono"]()}</g>
        <rect class="brillo" x="140" y="60" width="70" height="280" fill="url(#brillo-{clave})"/>
      </g>
      <polygon class="contorno" points="{interior}" fill="none" stroke="{cfg.get('contorno', CREAM)}" stroke-width="3.5" stroke-linejoin="round" opacity=".85"/>
      {estrella_brillo}
    </g>
  </g>
  {destellos}
</svg>
'''

for clave, cfg in INSIGNIAS.items():
    for animada, sufijo in ((True, ''), (False, '-estatica')):
        with open(os.path.join(OUT, f'{clave}{sufijo}.svg'), 'w', encoding='utf-8') as f:
            f.write(svg(clave, cfg, animada))
print('ok', sorted(os.listdir(OUT)))

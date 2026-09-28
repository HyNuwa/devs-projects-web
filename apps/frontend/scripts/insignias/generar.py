"""Genera, para cada insignia: <slug>.svg (estática) y <slug>.lottie (dotLottie).
Uso, desde apps/frontend: python scripts/insignias/generar.py [carpeta de salida]

Línea de tiempo (60 fps, 150 fotogramas), con marcadores:
  estatica  fotograma 0        la insignia terminada (lo que se ve si no se reproduce)
  entrada   fotogramas 1-99    al ganarla
  toque     fotogramas 100-149 al tocarla en el perfil
"""
import json
import math
import pathlib
import random
import sys
import zipfile

import escena
from svgpath import a_lottie

SALIDA = (pathlib.Path(sys.argv[1]) if len(sys.argv) > 1
          else pathlib.Path(__file__).resolve().parents[2] / 'public' / 'assets' / 'insignias' / 'gema')
SALIDA.mkdir(parents=True, exist_ok=True)
FPS, FIN, C = 60, 150, escena.C
CONFETI = ['#D6F23A', '#FF4F86', '#2F74FF', '#FFC93C', '#FF8A1F', '#7ED957']


# ---------------------------------------------------------------- utilidades Lottie
def rgba(h):
    r, g, b = escena.hex_rgb(h)
    return [round(r, 4), round(g, 4), round(b, 4), 1]


def fijo(v):
    return {'a': 0, 'k': v}


def anim(claves, dims=1):
    """claves: [(t, valor, 'h' opcional)]. Interpolación suave; 'h' mantiene el valor hasta la clave siguiente."""
    ks = []
    for n, c in enumerate(claves):
        t, v = c[0], c[1]
        s = v if isinstance(v, list) else [v]
        k = {'t': t, 's': s}
        if len(c) > 2 and c[2] == 'h':
            k['h'] = 1
        elif n < len(claves) - 1:
            k['o'] = {'x': [.33] * len(s), 'y': [0] * len(s)}
            k['i'] = {'x': [.67] * len(s), 'y': [1] * len(s)}
        if len(s) > 1:
            k['to'], k['ti'] = [0] * len(s), [0] * len(s)
        ks.append(k)
    return {'a': 1, 'k': ks}


def transformacion(ancla=(C, C), pos=None, escala=None, rot=None, op=None):
    pos = pos or fijo([ancla[0], ancla[1], 0])
    return {'o': op or fijo(100), 'r': rot or fijo(0), 'p': pos, 'a': fijo([ancla[0], ancla[1], 0]),
            's': escala or fijo([100, 100, 100])}


def tr_grupo(p=None, s=None, r=None, o=None):
    return {'ty': 'tr', 'p': p or fijo([0, 0]), 'a': fijo([0, 0]), 's': s or fijo([100, 100]),
            'r': r or fijo(0), 'o': o or fijo(100), 'sk': fijo(0), 'sa': fijo(0)}


def grupo(e, n=0):
    it = [{'ty': 'sh', 'nm': f'forma {k}', 'ks': fijo(f)} for k, f in enumerate(a_lottie(e['d'], e['m']))]
    if e['stroke'] and e['sw']:
        st = {'ty': 'st', 'c': fijo(rgba(e['stroke'])), 'o': fijo(100), 'w': fijo(round(e['sw'], 2)), 'lc': 2, 'lj': 2, 'ml': 4}
        if e['dash']:
            st['d'] = [{'n': 'd', 'nm': 'guion', 'v': fijo(e['dash'][0])}, {'n': 'g', 'nm': 'hueco', 'v': fijo(e['dash'][1])},
                       {'n': 'o', 'nm': 'desfase', 'v': fijo(0)}]
        it.append(st)
    f = e['fill']
    if isinstance(f, tuple):                      # degradé radial
        _, cx, cy, r, color, a0, a1 = f
        rr, gg, bb, _ = rgba(color)
        it.append({'ty': 'gf', 'o': fijo(100), 'r': 1, 't': 2, 's': fijo([cx, cy]), 'e': fijo([cx + r, cy]),
                   'h': fijo(0), 'a': fijo(0), 'g': {'p': 2, 'k': fijo([0, rr, gg, bb, 1, rr, gg, bb, 0, a0, 1, a1])}})
    elif f:
        it.append({'ty': 'fl', 'c': fijo(rgba(f)), 'o': fijo(100), 'r': 2 if e['evenodd'] else 1})
    it.append(tr_grupo(o=fijo(round(e['op'] * 100, 1))))
    return {'ty': 'gr', 'nm': f'elemento {n}', 'it': it}


def capa_formas(ind, nombre, elementos, ks, padre=None, extra=None):
    capa = {'ddd': 0, 'ind': ind, 'ty': 4, 'nm': nombre, 'sr': 1, 'ks': ks, 'ao': 0, 'ip': 0, 'op': FIN, 'st': 0, 'bm': 0,
            'shapes': [grupo(e, n) for n, e in reversed(list(enumerate(elementos)))]}
    if padre:
        capa['parent'] = padre
    if extra:
        capa.update(extra)
    return capa


# ---------------------------------------------------------------- piezas animadas
def rayos(color):
    d = []
    for k in range(16):
        a, w = math.radians(k * 22.5), math.radians(4 if k % 2 else 6)
        r1, r2 = 150, 196 if k % 2 == 0 else 180
        d.append(f'M{C + r1 * math.cos(a - w):.1f},{C + r1 * math.sin(a - w):.1f} L{C + r2 * math.cos(a):.1f},{C + r2 * math.sin(a):.1f} '
                 f'L{C + r1 * math.cos(a + w):.1f},{C + r1 * math.sin(a + w):.1f}Z')
    return [escena.el(' '.join(d), color)]


def confeti(slug):
    rnd = random.Random(slug)
    grupos = []
    for k in range(14):
        a = math.radians(k * 360 / 14 + rnd.uniform(-10, 10))
        r1, r2 = rnd.uniform(172, 196), rnd.uniform(40, 60)
        x0, y0 = C + 110 * math.cos(a), C + 110 * math.sin(a)
        x1, y1 = C + r1 * math.cos(a), C + r1 * math.sin(a)
        x2, y2 = x1 + r2 * .3 * math.cos(a), y1 + r2 * .3 * math.sin(a) + rnd.uniform(26, 44)
        color = CONFETI[k % len(CONFETI)]
        d = escena.circulo(0, 0, 5) if k % 3 == 0 else escena.rect(-3.5, -8, 7, 16, 3)
        e = escena.el(d, color)
        g = grupo(e, k)
        t0 = 14 + rnd.randint(0, 6)
        g['it'][-1] = tr_grupo(
            p=anim([(0, [x0, y0], 'h'), (1, [x0, y0], 'h'), (t0, [x0, y0]), (t0 + 26, [x1, y1]), (t0 + 58, [x2, y2])], 2),
            r=anim([(0, 0, 'h'), (t0, 0), (t0 + 58, rnd.choice([-1, 1]) * rnd.uniform(200, 420))]),
            o=anim([(0, 0, 'h'), (t0, 0, 'h'), (t0 + 1, 100, 'h'), (t0 + 40, 100), (t0 + 58, 0)]))
        grupos.append(g)
    return grupos


def destellos():
    grupos = []
    for k, (x, y, r, t0) in enumerate([(64, 92, 13, 34), (338, 116, 10, 42), (330, 300, 12, 50), (78, 292, 9, 58)]):
        g = grupo(escena.el(escena.destello(0, 0, r), '#FFFFFF' if k % 2 else '#FFD84D', escena.N, 2.5), k)
        d = k * 4
        g['it'][-1] = tr_grupo(
            p=fijo([x, y]),
            s=anim([(0, [0, 0], 'h'), (t0, [0, 0]), (t0 + 10, [100, 100]), (t0 + 26, [0, 0], 'h'),
                    (110 + d, [0, 0]), (120 + d, [110, 110]), (136 + d, [0, 0])], 2),
            r=anim([(0, 0, 'h'), (t0, 0), (t0 + 26, 90, 'h'), (110 + d, 0), (136 + d, 90)]))
        grupos.append(g)
    return grupos


def lottie(ins):
    slug = ins['slug']
    # 1 = nulo «insignia», padre de la gema, el ícono, el extra y el brillo
    nulo = {'ddd': 0, 'ind': 1, 'ty': 3, 'nm': 'insignia', 'sr': 1, 'ao': 0, 'ip': 0, 'op': FIN, 'st': 0, 'bm': 0,
            'ks': transformacion(
                escala=anim([(0, [100, 100, 100], 'h'), (1, [0, 0, 100]), (16, [112, 112, 100]), (24, [96, 96, 100]), (30, [100, 100, 100], 'h'),
                             (100, [100, 100, 100]), (106, [90, 90, 100]), (114, [108, 108, 100]), (122, [98, 98, 100]), (130, [100, 100, 100])], 3),
                rot=anim([(0, 0, 'h'), (1, -14), (24, 3), (30, 0, 'h'), (100, 0), (108, -6), (116, 5), (124, -2), (130, 0)]))}
    gema = capa_formas(7, 'gema', ins['marco'], transformacion(op=anim([(0, 100, 'h'), (1, 0), (8, 100)])), padre=1)
    icono = capa_formas(6, 'icono', ins['icono'], transformacion(
        pos=anim([(0, [C, C, 0], 'h'), (1, [C, C + 24, 0], 'h'), (14, [C, C + 24, 0]), (30, [C, C, 0], 'h'),
                  (104, [C, C, 0]), (112, [C, C - 12, 0]), (120, [C, C + 3, 0]), (126, [C, C, 0])], 3),
        escala=anim([(0, [100, 100, 100], 'h'), (1, [0, 0, 100], 'h'), (14, [0, 0, 100]), (26, [115, 115, 100]), (34, [100, 100, 100])], 3)), padre=1)
    capas = []
    if ins['extra']:
        cx, cy = ins['centro_extra']
        capas.append(capa_formas(5, 'extra', ins['extra'], transformacion(
            ancla=(cx, cy),
            escala=anim([(0, [100, 100, 100], 'h'), (1, [0, 0, 100], 'h'), (28, [0, 0, 100]), (38, [125, 125, 100]), (44, [100, 100, 100], 'h'),
                         (110, [100, 100, 100]), (118, [125, 125, 100]), (126, [100, 100, 100])], 3),
            rot=anim([(0, 0, 'h'), (1, -40, 'h'), (28, -40), (40, 0)])), padre=1))
    # brillo que cruza la gema, recortado por una máscara con la forma del octógono
    g = {'ty': 'gr', 'nm': 'franjas', 'it': [grupo(escena.el('M-50,40 L30,40 L-10,360 L-90,360Z', '#FFFFFF', op=.22), 0),
                                              grupo(escena.el('M8,40 L22,40 L-18,360 L-32,360Z', '#FFFFFF', op=.5), 1), tr_grupo()]}
    g['it'][-1] = tr_grupo(p=anim([(0, [460, 0], 'h'), (1, [-120, 0], 'h'), (40, [-120, 0]), (64, [460, 0], 'h'),
                                   (104, [-120, 0]), (128, [460, 0])], 2))
    mascara = {'inv': False, 'mode': 'a', 'nm': 'octógono', 'o': fijo(100), 'x': fijo(0),
               'pt': fijo(a_lottie(escena.poligono(escena.octogono(escena.R_BISEL)))[0])}
    brillo = {'ddd': 0, 'ind': 4, 'ty': 4, 'nm': 'brillo', 'sr': 1, 'ks': transformacion(), 'ao': 0, 'ip': 0, 'op': FIN, 'st': 0, 'bm': 0,
              'parent': 1, 'hasMask': True, 'masksProperties': [mascara], 'shapes': [g]}
    chispas = {'ddd': 0, 'ind': 2, 'ty': 4, 'nm': 'destellos', 'sr': 1, 'ks': transformacion(), 'ao': 0, 'ip': 0, 'op': FIN, 'st': 0,
               'bm': 0, 'shapes': destellos()}
    conf = {'ddd': 0, 'ind': 3, 'ty': 4, 'nm': 'confeti', 'sr': 1, 'ks': transformacion(), 'ao': 0, 'ip': 0, 'op': FIN, 'st': 0,
            'bm': 0, 'shapes': confeti(slug)}
    pulso = capa_formas(8, 'pulso', [escena.linea(escena.circulo(C, C, 165), escena.luz(ins['color'], .15), 7)], transformacion(
        escala=anim([(0, [80, 80, 100], 'h'), (10, [80, 80, 100]), (40, [132, 132, 100], 'h'), (104, [92, 92, 100]), (130, [124, 124, 100])], 3),
        op=anim([(0, 0, 'h'), (9, 0, 'h'), (10, 90), (40, 0, 'h'), (104, 0, 'h'), (105, 70), (130, 0)])))
    rayo = capa_formas(9, 'rayos', rayos('#FFD34D'), transformacion(
        escala=anim([(0, [40, 40, 100], 'h'), (8, [40, 40, 100]), (40, [128, 128, 100])], 3),
        rot=anim([(0, 0, 'h'), (8, 0), (70, 30)]),
        op=anim([(0, 0, 'h'), (8, 0, 'h'), (9, 0), (14, 85), (44, 0)])))
    capas = [chispas, brillo] + capas + [icono, gema, conf, pulso, rayo, nulo]
    return {'v': '5.12.2', 'fr': FPS, 'ip': 0, 'op': FIN, 'w': 400, 'h': 400, 'nm': ins['nombre'], 'ddd': 0, 'assets': [],
            'layers': capas,
            'markers': [{'tm': 0, 'cm': 'estatica', 'dr': 0}, {'tm': 1, 'cm': 'entrada', 'dr': 98}, {'tm': 100, 'cm': 'toque', 'dr': 49}],
            'meta': {'g': 'DevsProject · generar.py'}}


# ---------------------------------------------------------------- SVG estático (mismas curvas que el Lottie)
def d_desde_lottie(formas):
    partes = []
    for f in formas:
        v, i, o = f['v'], f['i'], f['o']
        s = [f'M{v[0][0]:.2f},{v[0][1]:.2f}']
        n = len(v)
        rango = range(n) if f['c'] else range(n - 1)
        for k in rango:
            a, b = v[k], v[(k + 1) % n]
            c1 = (a[0] + o[k][0], a[1] + o[k][1])
            c2 = (b[0] + i[(k + 1) % n][0], b[1] + i[(k + 1) % n][1])
            s.append(f'C{c1[0]:.2f},{c1[1]:.2f} {c2[0]:.2f},{c2[1]:.2f} {b[0]:.2f},{b[1]:.2f}')
        if f['c']:
            s.append('Z')
        partes.append(' '.join(s))
    return ' '.join(partes)


def svg(ins):
    defs, cuerpo = [], []
    for n, e in enumerate(ins['marco'] + ins['icono'] + ins['extra']):
        d = d_desde_lottie(a_lottie(e['d'], e['m']))
        attrs = []
        f = e['fill']
        if isinstance(f, tuple):
            _, cx, cy, r, color, a0, a1 = f
            defs.append(f'<radialGradient id="g{n}" gradientUnits="userSpaceOnUse" cx="{cx}" cy="{cy}" r="{r}">'
                        f'<stop offset="0" stop-color="{color}" stop-opacity="{a0}"/><stop offset="1" stop-color="{color}" stop-opacity="{a1}"/></radialGradient>')
            attrs.append(f'fill="url(#g{n})"')
        else:
            attrs.append(f'fill="{f or "none"}"')
            if e['evenodd']:
                attrs.append('fill-rule="evenodd"')
        if e['stroke'] and e['sw']:
            attrs.append(f'stroke="{e["stroke"]}" stroke-width="{e["sw"]:.2f}" stroke-linecap="round" stroke-linejoin="round"')
            if e['dash']:
                attrs.append(f'stroke-dasharray="{e["dash"][0]} {e["dash"][1]}"')
        if e['op'] < 1:
            attrs.append(f'opacity="{e["op"]}"')
        cuerpo.append(f'<path d="{d}" {" ".join(attrs)}/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-labelledby="t">'
            f'<title id="t">Insignia de DevsProject: {ins["nombre"]}</title><defs>{"".join(defs)}</defs>\n' + '\n'.join(cuerpo) + '\n</svg>\n')


def dotlottie(slug, datos, destino):
    manifiesto = {'version': '2', 'generator': 'DevsProject · generar.py', 'animations': [{'id': slug}]}
    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('manifest.json', json.dumps(manifiesto, ensure_ascii=False))
        z.writestr(f'a/{slug}.json', json.dumps(datos, ensure_ascii=False, separators=(',', ':')))


if __name__ == '__main__':
    for ins in escena.todas():
        datos = lottie(ins)
        (SALIDA / f'{ins["slug"]}.svg').write_text(svg(ins), encoding='utf-8', newline='\n')
        dotlottie(ins['slug'], datos, SALIDA / f'{ins["slug"]}.lottie')
        print(ins['slug'], (SALIDA / f'{ins["slug"]}.lottie').stat().st_size, (SALIDA / f'{ins["slug"]}.svg').stat().st_size)

"""Descripción de las 18 insignias: marco octogonal facetado + ícono. Todo en un lienzo de 400 × 400."""
import colorsys
import math

C = 200                      # centro del lienzo
R_TINTA, R_BISEL, R_CARA = 160, 151, 127   # contorno, borde exterior del bisel, cara interior
ESCALA_ICONO = 1.15

N = '#111846'                # tinta de contornos
BLANCO, PAPEL = '#FFFFFF', '#F7F9FF'
AZUL, AZUL_CLARO = '#2F74FF', '#CFE3FF'
LIMA, ROSA, AMARILLO, NARANJA, VERDE = '#D6F23A', '#FF4F86', '#FFC93C', '#FF8A1F', '#7ED957'


# ---------------------------------------------------------------- utilidades
def el(d, fill=None, stroke=None, sw=0, op=1.0, dash=None, evenodd=False, m=None):
    return dict(d=d, fill=fill, stroke=stroke, sw=sw, op=op, dash=dash, evenodd=evenodd, m=m)


def linea(d, color, w=8, **kw):
    return el(d, None, color, w, **kw)


def forma(d, fill, w=8, stroke=N, **kw):
    return el(d, fill, stroke if w else None, w, **kw)


def circulo(cx, cy, r):
    k = r * .5523
    return (f'M{cx},{cy - r} C{cx + k},{cy - r} {cx + r},{cy - k} {cx + r},{cy} C{cx + r},{cy + k} {cx + k},{cy + r} {cx},{cy + r} '
            f'C{cx - k},{cy + r} {cx - r},{cy + k} {cx - r},{cy} C{cx - r},{cy - k} {cx - k},{cy - r} {cx},{cy - r}Z')


def elipse(cx, cy, rx, ry):
    kx, ky = rx * .5523, ry * .5523
    return (f'M{cx},{cy - ry} C{cx + kx},{cy - ry} {cx + rx},{cy - ky} {cx + rx},{cy} C{cx + rx},{cy + ky} {cx + kx},{cy + ry} {cx},{cy + ry} '
            f'C{cx - kx},{cy + ry} {cx - rx},{cy + ky} {cx - rx},{cy} C{cx - rx},{cy - ky} {cx - kx},{cy - ry} {cx},{cy - ry}Z')


def rect(x, y, w, h, r=0):
    if not r:
        return f'M{x},{y} H{x + w} V{y + h} H{x}Z'
    return (f'M{x + r},{y} H{x + w - r} Q{x + w},{y} {x + w},{y + r} V{y + h - r} Q{x + w},{y + h} {x + w - r},{y + h} '
            f'H{x + r} Q{x},{y + h} {x},{y + h - r} V{y + r} Q{x},{y} {x + r},{y}Z')


def rotar(ang, cx, cy):
    a = math.radians(ang)
    c, s = math.cos(a), math.sin(a)
    return (c, s, -s, c, cx - c * cx + s * cy, cy - s * cx - c * cy)


def estrella5(cx, cy, r, ri=None):
    ri = ri or r * .48
    pts = []
    for k in range(10):
        a = math.radians(-90 + 36 * k)
        rr = r if k % 2 == 0 else ri
        pts.append(f'{cx + rr * math.cos(a):.2f},{cy + rr * math.sin(a):.2f}')
    return 'M' + ' L'.join(pts) + 'Z'


def destello(cx, cy, r, k=.18):
    k *= r
    return (f'M{cx},{cy - r} Q{cx + k},{cy - k} {cx + r},{cy} Q{cx + k},{cy + k} {cx},{cy + r} '
            f'Q{cx - k},{cy + k} {cx - r},{cy} Q{cx - k},{cy - k} {cx},{cy - r}Z')


# Textos en Figtree 900 ya convertidos a trazos, para no depender de la fuente al generar.
# Para sumar uno: convertirlo con fontTools (SVGPathPen + TransformPen) y agregarlo acá.
TEXTOS = {
    ('+1', 30, 258, 260): 'M249.15 258.11V244.01H253.35V258.11ZM244.20000000000002 253.16V248.96H258.3V253.16Z M266.7 260.0V245.84Q265.74 246.38 264.69 246.635Q263.64 246.89 262.5 246.77V241.73Q263.37 241.82 264.225 241.39999999999998Q265.08 240.98 265.89 240.305Q266.7 239.63 267.33 239.0H271.95V260.0Z',
    ('DIC', 24, 200, 176): 'M180.01999999999998 176.0V159.2H185.636Q188.396 159.2 190.51999999999998 160.28Q192.64399999999998 161.36 193.844 163.244Q195.04399999999998 165.128 195.04399999999998 167.6Q195.04399999999998 170.048 193.844 171.94400000000002Q192.64399999999998 173.84 190.51999999999998 174.92000000000002Q188.396 176.0 185.636 176.0ZM184.45999999999998 171.8H185.636Q186.69199999999998 171.8 187.57999999999998 171.488Q188.468 171.176 189.11599999999999 170.624Q189.76399999999998 170.072 190.12399999999997 169.304Q190.48399999999998 168.536 190.48399999999998 167.6Q190.48399999999998 166.664 190.12399999999997 165.896Q189.76399999999998 165.128 189.11599999999999 164.576Q188.468 164.024 187.57999999999998 163.712Q186.69199999999998 163.4 185.636 163.4H184.45999999999998Z M197.564 176.0V159.2H202.004V176.0Z M213.116 176.288Q210.596 176.288 208.664 175.17200000000003Q206.732 174.056 205.628 172.10000000000002Q204.524 170.144 204.524 167.6Q204.524 165.056 205.628 163.10000000000002Q206.732 161.144 208.664 160.02800000000002Q210.596 158.912 213.116 158.912Q215.06 158.912 216.62 159.584Q218.18 160.256 219.308 161.45600000000002Q220.436 162.656 221.036 164.24L216.812 165.584Q216.476 164.792 215.948 164.204Q215.42000000000002 163.61599999999999 214.71200000000002 163.30399999999997Q214.00400000000002 162.992 213.116 162.992Q211.94 162.992 211.02800000000002 163.57999999999998Q210.116 164.168 209.60000000000002 165.2Q209.084 166.232 209.084 167.6Q209.084 168.944 209.61200000000002 169.988Q210.14000000000001 171.032 211.06400000000002 171.62Q211.988 172.208 213.18800000000002 172.208Q214.124 172.208 214.808 171.88400000000001Q215.49200000000002 171.56 215.984 170.97199999999998Q216.476 170.384 216.836 169.592L221.06 170.936Q220.484 172.52 219.356 173.732Q218.228 174.944 216.644 175.61599999999999Q215.06 176.288 213.116 176.288Z',
    ('1', 30, 258, 269): 'M256.8 269.0V254.84Q255.84 255.38 254.79000000000002 255.635Q253.74 255.89 252.60000000000002 255.77V250.73Q253.47 250.82 254.325 250.39999999999998Q255.18 249.98 255.99 249.305Q256.8 248.63 257.43 248.0H262.05V269.0Z',
}


def texto(txt, alto, cx, base):
    return TEXTOS[(txt, alto, cx, base)]


def check(cx, cy, s=1, color=N, w=8):
    return linea(f'M{cx - 12 * s},{cy} L{cx - 3 * s},{cy + 9 * s} L{cx + 13 * s},{cy - 8 * s}', color, w)


def boton_check(cx, cy, r=29):
    return [forma(circulo(cx, cy, r), LIMA), check(cx, cy, r / 29)]


# ---------------------------------------------------------------- color
def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def rgb_hex(r, g, b):
    return '#' + ''.join(f'{max(0, min(255, round(v * 255))):02X}' for v in (r, g, b))


def luz(h, d):
    """Aclara (d > 0) u oscurece (d < 0) en el espacio HLS."""
    hh, l, s = colorsys.rgb_to_hls(*hex_rgb(h))
    return rgb_hex(*colorsys.hls_to_rgb(hh, max(0, min(1, l + d)), s))


# ---------------------------------------------------------------- marco facetado
def octogono(r, cx=C, cy=C):
    return [(cx + r * math.cos(math.radians(-90 + 45 * k)), cy + r * math.sin(math.radians(-90 + 45 * k))) for k in range(8)]


def poligono(pts):
    return 'M' + ' L'.join(f'{x:.2f},{y:.2f}' for x, y in pts) + 'Z'


def marco(color, linea_interior=None):
    """Contorno de tinta, bisel de 8 facetas iluminado desde arriba a la izquierda, cara con 8 sectores y línea interior."""
    out = [forma(poligono(octogono(R_TINTA)), N, 14, N)]
    ext, cara, luz_dir = octogono(R_BISEL), octogono(R_CARA), math.radians(-125)
    bisel = luz(color, .09)
    for k in range(8):
        a = math.radians(-90 + 45 * k + 22.5)
        f = math.cos(a - luz_dir)
        out.append(el(poligono([ext[k], ext[(k + 1) % 8], cara[(k + 1) % 8], cara[k]]), luz(bisel, .15 * f)))
    for k in range(8):
        a = math.radians(-90 + 45 * k + 22.5)
        f = math.cos(a - luz_dir)
        out.append(el(poligono([(C, C), cara[k], cara[(k + 1) % 8]]), luz(color, .06 * f)))
    radios = ' '.join(f'M{C},{C} L{cara[k][0]:.2f},{cara[k][1]:.2f}' for k in range(8))
    out.append(linea(radios, BLANCO, 1.6, op=.12))
    aristas = ' '.join(f'M{ext[k][0]:.2f},{ext[k][1]:.2f} L{cara[k][0]:.2f},{cara[k][1]:.2f}' for k in range(8))
    out.append(linea(aristas, BLANCO, 2, op=.35))
    out.append(linea(poligono(octogono(R_CARA)), linea_interior or BLANCO, 3.2 if linea_interior else 2.6,
                     op=1 if linea_interior else .8))
    # brillo del bisel arriba a la izquierda
    brillo = f'M{ext[6][0] + 8:.2f},{ext[6][1] - 3:.2f} L{ext[7][0] + 3:.2f},{ext[7][1] + 3:.2f} L{ext[0][0] - 2:.2f},{ext[0][1] + 8:.2f}'
    out.append(linea(brillo, BLANCO, 4, op=.55))
    return out


# ---------------------------------------------------------------- íconos: devuelven (icono, extra, centro_extra)
def i_primer_aporte():
    hoja = 'M140,130 H222 L262,170 V272 Q262,284 250,284 H140 Q128,284 128,272 V142 Q128,130 140,130Z'
    return ([forma(hoja, PAPEL), forma('M222,130 L262,170 H234 Q222,170 222,158Z', AZUL_CLARO),
             linea('M154,178 H212 M154,204 H236 M154,230 H214 M154,256 H192', AZUL)],
            [forma(circulo(258, 254, 34), LIMA), linea('M258,272 V236 M243,251 L258,236 L273,251', N)], (258, 254))


def i_primer_me_sirvio():
    corazon = ('M200,282 C150,250 116,216 116,180 C116,151 137,130 164,130 C182,130 194,140 200,153 '
               'C206,140 218,130 236,130 C263,130 284,151 284,180 C284,216 250,250 200,282Z')
    return ([forma(corazon, '#FF4D7D'), linea('M142,172 Q144,152 164,148', BLANCO, 10, op=.9)],
            [forma(rect(222, 226, 72, 46, 23), LIMA), el(texto('+1', 30, 258, 260), N)], (258, 249))


def sector(cx, cy, r1, r2, a1, a2):
    p = lambda r, a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
    (x1, y1), (x2, y2), (x3, y3), (x4, y4) = p(r2, a1), p(r2, a2), p(r1, a2), p(r1, a1)
    return f'M{x1:.2f},{y1:.2f} A{r2},{r2} 0 0 1 {x2:.2f},{y2:.2f} L{x3:.2f},{y3:.2f} A{r1},{r1} 0 0 0 {x4:.2f},{y4:.2f}Z'


def i_salvavidas():
    cx, cy = 194, 194
    aro = circulo(cx, cy, 68) + ' ' + circulo(cx, cy, 30)
    rojos = [el(sector(cx, cy, 30, 68, a - 26, a + 26), '#F2446E') for a in (-90, 0, 90, 180)]
    return ([el(aro, BLANCO, evenodd=True)] + rojos
            + [linea(circulo(cx, cy, 68), N), linea(circulo(cx, cy, 30), N),
               linea(f'M{cx - 50},{cy - 30} Q{cx - 44},{cy - 44} {cx - 30},{cy - 52}', BLANCO, 6, op=.6)],
            boton_check(258, 256), (258, 256))


def i_trotamaterias():
    return ([forma('M128,162 L168,148 L168,264 L128,278Z', BLANCO), forma('M168,148 L222,164 L222,280 L168,264Z', '#EAF2FF'),
             forma('M222,164 L270,148 L270,264 L222,280Z', '#5AA0FF'),
             linea('M138,238 Q162,214 188,236 T240,230', AZUL, 6, dash=(10, 9))],
            [forma('M244,206 C228,186 220,172 220,158 A24,24 0 0 1 268,158 C268,172 260,186 244,206Z', '#FF4F6E'),
             forma(circulo(244, 158, 9), BLANCO, 5)], (244, 176))


def i_primera_huella():
    almohadilla = 'M200,208 C232,208 256,238 252,260 C248,278 228,282 200,278 C172,282 152,278 148,260 C144,238 168,208 200,208Z'
    dedos = [(150, 192, 15, 19, -22), (180, 160, 16, 20, -8), (220, 160, 16, 20, 8), (250, 192, 15, 19, 22)]
    return ([forma(elipse(x, y, rx, ry), BLANCO, m=rotar(r, x, y)) for x, y, rx, ry, r in dedos] + [forma(almohadilla, BLANCO)],
            boton_check(262, 258), (262, 258))


def i_primera_luz():
    foco = 'M200,118 C236,118 262,145 262,180 C262,204 248,218 240,232 V246 H160 V232 C152,218 138,204 138,180 C138,145 164,118 200,118Z'
    return ([el(circulo(200, 190, 100), ('radial', 200, 190, 100, '#FFC93C', .55, 0)),
             forma(foco, '#FFC93C', 4, '#F5A516'),
             linea('M158,168 Q162,146 182,136', '#FFE9A8', 8, op=.9),
             linea('M190,246 V208 M210,246 V208', '#FF6A1F', 6), linea(circulo(190, 199, 9) + ' ' + circulo(210, 199, 9), '#FF6A1F', 6),
             forma(rect(158, 248, 84, 14, 7), '#FFF4DA', 0), forma(rect(164, 266, 72, 12, 6), '#FFC93C', 0),
             forma('M180,282 H220 L212,296 H188Z', '#F5A516', 0)],
            [], None)


def i_kit_completo():
    link = lambda cx, cy: forma(rect(cx - 17, cy - 9, 34, 18, 9), None, 7, m=rotar(-45, cx, cy))
    return ([forma(rect(128, 128, 68, 68, 14), BLANCO), forma(rect(204, 128, 68, 68, 14), '#FF4F8E'),
             forma(rect(128, 204, 68, 68, 14), '#FFA51F'), forma(rect(204, 204, 68, 68, 14), LIMA),
             linea('M144,150 H180 M144,164 H184 M144,178 H170', AZUL, 7),
             forma('M228,146 L256,162 L228,178Z', N, 3),
             forma(circulo(152, 226, 7), N, 0), forma('M138,258 L160,234 L174,248 L184,238 L200,258Z', N, 3),
             link(231, 245), link(245, 231)],
            [], None)


def i_archivo_historico():
    carpeta = lambda dx, dy, c: forma(f'M{144 + dx},{150 + dy} H{198 + dx} L{208 + dx},{162 + dy} H{250 + dx} Q{258 + dx},{162 + dy} {258 + dx},{170 + dy} V{224 + dy} H{144 + dx}Z', c)
    return ([carpeta(0, 0, '#3D8BFF'), carpeta(6, 14, '#FF5A93'), carpeta(12, 28, '#FFF3DC'),
             forma(rect(130, 206, 140, 74, 10), '#FFF8EA'), forma(rect(124, 198, 152, 18, 6), BLANCO),
             forma(rect(178, 234, 44, 18, 6), '#EFEFEF', 6)],
            [], None)


def i_puente():
    persona = lambda cx, cy, r, c: [forma(f'M{cx - r * 1.6},{cy + r * 3} Q{cx - r * 1.6},{cy + r * 1.1} {cx},{cy + r * 1.1} Q{cx + r * 1.6},{cy + r * 1.1} {cx + r * 1.6},{cy + r * 3}Z', c),
                                    forma(circulo(cx, cy, r), c)]
    return (persona(154, 164, 14, '#FF5A93') + persona(246, 164, 14, AMARILLO) + persona(200, 146, 16, VERDE)
            + [forma('M122,206 H278 V272 H252 A52,52 0 0 0 148,272 H122Z', BLANCO)],
            [], None)


def calendario(cabecera):
    return [forma(rect(124, 146, 152, 128, 14), BLANCO),
            forma('M138,146 H262 Q276,146 276,160 V186 H124 V160 Q124,146 138,146Z', cabecera),
            linea('M162,132 V156 M238,132 V156', N, 11)]


def i_constante():
    celdas = []
    for x, y, lleno in [(144, 198, 0), (185, 198, 1), (226, 198, 1), (144, 236, 0), (185, 236, 0)]:
        celdas.append(forma(rect(x, y, 30, 30, 6), LIMA if lleno else BLANCO, 6))
        if lleno:
            celdas.append(check(x + 15, y + 15, .62, N, 5.5))
    return (calendario('#3D7BFF') + celdas, [], None)


def i_voz_de_la_cursada():
    globo = 'M140,138 H260 Q276,138 276,154 V226 Q276,242 260,242 H178 L150,270 V242 H140 Q124,242 124,226 V154 Q124,138 140,138Z'
    return ([forma(globo, BLANCO)] + [el(estrella5(x, 172, 12), '#FFC21F') for x in (152, 176, 200, 224, 248)]
            + [linea('M146,204 H254 M146,224 H222', AZUL, 8)], [], None)


def i_contexto_completo():
    filas = []
    for i, y in enumerate((186, 218, 250)):
        filas += [forma(rect(144, y - 11, 22, 22, 4), LIMA, 5.5), check(155, y, .5, N, 4.5),
                  linea(f'M180,{y - 4} H{[250, 244, 236][i]}', AZUL, 7), linea(f'M180,{y + 8} H{[226, 206, 220][i]}', AZUL, 4, op=.35)]
    return ([forma(rect(128, 142, 144, 142, 12), BLANCO), forma('M174,126 H226 Q234,126 234,134 V156 H166 V134 Q166,126 174,126Z', '#3D7BFF')] + filas,
            [], None)


def i_cronista_de_mesas():
    return ([forma('M120,170 Q162,158 200,178 Q238,158 280,170 V272 Q238,260 200,280 Q162,260 120,272Z', '#FFC83D'),
             forma('M128,158 Q166,146 200,166 V268 Q166,250 128,260Z', BLANCO, 7),
             forma('M272,158 Q234,146 200,166 V268 Q234,250 272,260Z', BLANCO, 7),
             linea('M144,186 Q166,180 186,188 M144,204 Q166,198 186,206 M144,222 Q166,216 186,224 M144,240 Q162,235 180,240', AZUL, 5.5),
             linea('M214,204 Q236,196 258,198 M214,222 Q232,216 248,217', '#5AA8FF', 5.5)],
            [forma('M234,142 V184 L245,175 L256,184 V140Z', '#FF5A93', 6)], (245, 162))


def i_mesa_de_diciembre():
    rayos = ' '.join(f'M{196 + 25 * math.cos(math.radians(a)):.1f},{230 + 25 * math.sin(math.radians(a)):.1f} '
                     f'L{196 + 34 * math.cos(math.radians(a)):.1f},{230 + 34 * math.sin(math.radians(a)):.1f}' for a in range(0, 360, 45))
    return (calendario('#FF4F86') + [el(texto('DIC', 24, 200, 176), BLANCO), linea(rayos, '#FF7A1C', 5),
                                     forma(circulo(196, 230, 17), '#FFB21F', 5, '#FF7A1C')],
            boton_check(260, 258, 27), (260, 258))


def i_temporada_de_finales():
    vidrio = 'M160,146 H240 C240,186 210,194 210,202 C210,210 240,218 240,256 H160 C160,218 190,210 190,202 C190,194 160,186 160,146Z'
    return ([forma(vidrio, BLANCO),
             el('M171,160 H229 C227,180 208,190 200,196 C192,190 173,180 171,160Z', '#FFD24D'),
             el('M168,254 C172,234 194,226 200,224 C206,226 228,234 232,254Z', '#FFD24D'),
             forma(rect(144, 128, 112, 20, 7), '#3D7BFF'), forma(rect(144, 254, 112, 20, 7), '#3D7BFF')],
            boton_check(258, 254, 27), (258, 254))


def i_ojo_atento():
    return ([forma('M120,206 Q200,136 280,206 Q200,276 120,206Z', BLANCO),
             forma(circulo(200, 206, 36), '#2F6BF5', 6), el(circulo(200, 206, 17), N),
             el(circulo(189, 194, 8), BLANCO), el(circulo(212, 216, 3.5), BLANCO)],
            [forma('M236,150 L246,122 L260,128 L250,156Z', ROSA, 5), forma('M254,166 L278,150 L286,162 L262,178Z', ROSA, 5)], (258, 150))


def i_lupa():
    hoja = 'M136,132 H206 L236,162 V262 Q236,272 226,272 H136 Q126,272 126,262 V142 Q126,132 136,132Z'
    return ([forma(hoja, BLANCO), forma('M206,132 L236,162 H214 Q206,162 206,154Z', AZUL_CLARO),
             linea('M144,176 H192 M144,198 H200 M144,220 H178', AZUL, 7), linea('M144,242 H182', '#C9C2B0', 7),
             linea('M262,254 L286,278', N, 18)],
            [forma(circulo(238, 226, 36), '#CFE6FF'),
             linea('M221,226 L233,238 L256,214', '#2F6BF5', 8), linea('M216,212 Q220,198 234,194', BLANCO, 6, op=.8)], (238, 226))


def i_primera_camada():
    cabeza = '#1A2468'
    return ([forma('M140,190 L144,126 L186,158Z', cabeza), forma('M260,190 L256,126 L214,158Z', cabeza),
             forma(elipse(200, 210, 68, 60), cabeza),
             el(elipse(176, 206, 16, 17), BLANCO), el(elipse(224, 206, 16, 17), BLANCO),
             el(circulo(178, 208, 8), cabeza), el(circulo(222, 208, 8), cabeza),
             linea('M122,214 H148 M124,230 L150,225 M252,214 H278 M250,225 L276,230', BLANCO, 4)],
            [forma(circulo(258, 258, 26), '#FFD21F'), el(texto('1', 30, 258, 269), N)], (258, 258))


AZUL_M, ROSA_CLARO, ROSA_F, NARANJA_M, VERDE_M, LIMA_P, AMARILLO_M, NOCHE = (
    '#1B63F2', '#FF8ABD', '#F5559B', '#FF7F1F', '#62C92E', '#C6E85A', '#FFC526', '#1B2656')

INSIGNIAS = [
    ('primer-aporte', 'Primer aporte', AZUL_M, None, i_primer_aporte),
    ('primer-me-sirvio', 'Primer «Me sirvió»', ROSA_CLARO, None, i_primer_me_sirvio),
    ('salvavidas', 'Salvavidas', NARANJA_M, None, i_salvavidas),
    ('trotamaterias', 'Trotamaterias', '#8BD41E', None, i_trotamaterias),
    ('primera-huella', 'Primera huella', ROSA_F, None, i_primera_huella),
    ('primera-luz', 'Primera luz', NOCHE, '#F2E531', i_primera_luz),
    ('kit-completo', 'Kit completo', AZUL_M, None, i_kit_completo),
    ('archivo-historico', 'Archivo histórico', AMARILLO_M, None, i_archivo_historico),
    ('puente', 'Puente', AZUL_M, None, i_puente),
    ('constante', 'Constante', NARANJA_M, None, i_constante),
    ('voz-de-la-cursada', 'Voz de la cursada', ROSA_F, None, i_voz_de_la_cursada),
    ('contexto-completo', 'Contexto completo', VERDE_M, None, i_contexto_completo),
    ('cronista-de-mesas', 'Cronista de mesas', AZUL_M, None, i_cronista_de_mesas),
    ('mesa-de-diciembre', 'Mesa de diciembre', NARANJA_M, None, i_mesa_de_diciembre),
    ('temporada-de-finales', 'Temporada de finales', ROSA_F, None, i_temporada_de_finales),
    ('ojo-atento', 'Ojo atento', AZUL_M, None, i_ojo_atento),
    ('lupa', 'Lupa', LIMA_P, None, i_lupa),
    ('primera-camada', 'Primera camada', ROSA_F, None, i_primera_camada),
]


def escalar_icono(elementos):
    """Aplica la escala del ícono alrededor del centro (en la matriz de cada elemento)."""
    s = ESCALA_ICONO
    base = (s, 0, 0, s, C * (1 - s), C * (1 - s))
    out = []
    for e in elementos:
        m = e['m']
        if m:
            a, b, c, d, ee, f = m
            A, B, Cc, D, E, F = base
            m = (A * a + Cc * b, B * a + D * b, A * c + Cc * d, B * c + D * d, A * ee + Cc * f + E, B * ee + D * f + F)
        else:
            m = base
        out.append(dict(e, m=m, sw=e['sw'] * s))
    return out


def insignia(slug, nombre, color, linea_interior, fn):
    icono, extra, centro = fn()
    if centro:
        centro = (C + (centro[0] - C) * ESCALA_ICONO, C + (centro[1] - C) * ESCALA_ICONO)
    return dict(slug=slug, nombre=nombre, color=color, marco=marco(color, linea_interior),
                icono=escalar_icono(icono), extra=escalar_icono(extra), centro_extra=centro)


def todas():
    return [insignia(*x) for x in INSIGNIAS]

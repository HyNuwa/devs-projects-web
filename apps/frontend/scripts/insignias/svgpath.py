"""Convierte el atributo `d` de un <path> SVG en formas de Lottie ({v, i, o, c})."""
import math
import re

TOKEN = re.compile(r'[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?')
ARGS = dict(M=2, L=2, H=1, V=1, C=6, S=4, Q=4, T=2, A=7, Z=0)


def _arco(p0, rx, ry, phi, fa, fs, p1):
    """Arco elíptico SVG → lista de cúbicas (c1, c2, p). Algoritmo de SVG 1.1, apéndice F.6.5."""
    x1, y1 = p0
    x2, y2 = p1
    if rx == 0 or ry == 0 or (x1 == x2 and y1 == y2):
        return [(p0, p1, p1)]
    rx, ry = abs(rx), abs(ry)
    cp, sp = math.cos(math.radians(phi)), math.sin(math.radians(phi))
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p, y1p = cp * dx + sp * dy, -sp * dx + cp * dy
    lam = x1p ** 2 / rx ** 2 + y1p ** 2 / ry ** 2
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    k = math.sqrt(max(0, num / den)) * (-1 if fa == fs else 1)
    cxp, cyp = k * rx * y1p / ry, -k * ry * x1p / rx
    cx, cy = cp * cxp - sp * cyp + (x1 + x2) / 2, sp * cxp + cp * cyp + (y1 + y2) / 2

    def ang(ux, uy, vx, vy):
        a = math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
        return a

    t1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not fs and dt > 0:
        dt -= 2 * math.pi
    elif fs and dt < 0:
        dt += 2 * math.pi
    n = max(1, math.ceil(abs(dt) / (math.pi / 2) - 1e-9))
    d = dt / n
    alfa = 4 / 3 * math.tan(d / 4)

    def punto(t):
        x, y = rx * math.cos(t), ry * math.sin(t)
        return cp * x - sp * y + cx, sp * x + cp * y + cy

    def deriv(t):
        x, y = -rx * math.sin(t), ry * math.cos(t)
        return cp * x - sp * y, sp * x + cp * y

    out, t = [], t1
    for _ in range(n):
        a, b = punto(t), punto(t + d)
        da, db = deriv(t), deriv(t + d)
        out.append(((a[0] + alfa * da[0], a[1] + alfa * da[1]), (b[0] - alfa * db[0], b[1] - alfa * db[1]), b))
        t += d
    out[-1] = (out[-1][0], out[-1][1], p1)
    return out


def subtrayectos(d):
    """Devuelve [(inicio, [(c1, c2, p), ...], cerrado)] en coordenadas absolutas."""
    toks = TOKEN.findall(d)
    i, cmd = 0, None
    res, inicio, segs = [], None, []
    cur = (0.0, 0.0)
    ultimo_c = ultimo_q = None

    def cerrar(c):
        nonlocal segs, inicio
        if inicio is not None and (segs or c):
            res.append((inicio, segs, c))
        segs = []

    while i < len(toks):
        if re.match(r'[A-Za-z]', toks[i]):
            cmd = toks[i]
            i += 1
            if cmd in 'Zz':
                cerrar(True)
                cur = inicio
                inicio = None
                ultimo_c = ultimo_q = None
                continue
        up, rel = cmd.upper(), cmd.islower()
        a = [float(x) for x in toks[i:i + ARGS[up]]]
        i += ARGS[up]
        x0, y0 = cur
        if up == 'M':
            if inicio is not None:
                cerrar(False)
            cur = (x0 + a[0], y0 + a[1]) if rel else (a[0], a[1])
            inicio = cur
            cmd = 'l' if rel else 'L'
            ultimo_c = ultimo_q = None
            continue
        if inicio is None:
            inicio = cur
        if up == 'L':
            p = (x0 + a[0], y0 + a[1]) if rel else (a[0], a[1])
            segs.append((cur, p, p)); ultimo_c = ultimo_q = None
        elif up == 'H':
            p = (x0 + a[0] if rel else a[0], y0)
            segs.append((cur, p, p)); ultimo_c = ultimo_q = None
        elif up == 'V':
            p = (x0, y0 + a[0] if rel else a[0])
            segs.append((cur, p, p)); ultimo_c = ultimo_q = None
        elif up in 'CS':
            if up == 'C':
                c1 = (x0 + a[0], y0 + a[1]) if rel else (a[0], a[1])
                c2 = (x0 + a[2], y0 + a[3]) if rel else (a[2], a[3])
                p = (x0 + a[4], y0 + a[5]) if rel else (a[4], a[5])
            else:
                c1 = (2 * x0 - ultimo_c[0], 2 * y0 - ultimo_c[1]) if ultimo_c else cur
                c2 = (x0 + a[0], y0 + a[1]) if rel else (a[0], a[1])
                p = (x0 + a[2], y0 + a[3]) if rel else (a[2], a[3])
            segs.append((c1, c2, p)); ultimo_c, ultimo_q = c2, None
        elif up in 'QT':
            if up == 'Q':
                q = (x0 + a[0], y0 + a[1]) if rel else (a[0], a[1])
                p = (x0 + a[2], y0 + a[3]) if rel else (a[2], a[3])
            else:
                q = (2 * x0 - ultimo_q[0], 2 * y0 - ultimo_q[1]) if ultimo_q else cur
                p = (x0 + a[0], y0 + a[1]) if rel else (a[0], a[1])
            c1 = (x0 + 2 / 3 * (q[0] - x0), y0 + 2 / 3 * (q[1] - y0))
            c2 = (p[0] + 2 / 3 * (q[0] - p[0]), p[1] + 2 / 3 * (q[1] - p[1]))
            segs.append((c1, c2, p)); ultimo_q, ultimo_c = q, None
        elif up == 'A':
            p = (x0 + a[5], y0 + a[6]) if rel else (a[5], a[6])
            segs.extend(_arco(cur, a[0], a[1], a[2], int(a[3]), int(a[4]), p)); ultimo_c = ultimo_q = None
        cur = segs[-1][2]
    cerrar(False)
    return res


def a_lottie(d, m=None):
    """Lista de formas Lottie {'v','i','o','c'} para un `d` SVG. m = matriz afín (a, b, c, d, e, f) opcional."""
    def P(p):
        if not m:
            return p
        return (m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5])

    formas = []
    for inicio, segs, cerrado in subtrayectos(d):
        v = [P(inicio)]
        ent, sal = [(0, 0)], []
        for c1, c2, p in segs:
            prev = v[-1]
            c1, c2, p = P(c1), P(c2), P(p)
            sal.append((c1[0] - prev[0], c1[1] - prev[1]))
            v.append(p)
            ent.append((c2[0] - p[0], c2[1] - p[1]))
        sal.append((0, 0))
        if cerrado and len(v) > 1 and math.dist(v[0], v[-1]) < 1e-6:
            ent[0] = ent[-1]
            v, ent, sal = v[:-1], ent[:-1], sal[:-1]
        r = lambda l: [[round(x, 3), round(y, 3)] for x, y in l]
        formas.append({'v': r(v), 'i': r(ent), 'o': r(sal), 'c': cerrado})
    return formas

# Regenera generadores con los altos del canvas, mide las paginas (no los popups) y, si cambio el alto,
# vuelve a generar con el alto medido y actualiza canvas.json.
import json, os, re, subprocess, sys
SP = os.environ['SP']
PROY = os.path.join(SP, 'home', 'project')
GENS = sys.argv[1:]
FIJOS = {'DetalleRecurso.dc.html', 'SubirMaterial.dc.html', 'MovilRecurso.dc.html', 'InsigniaGanada.dc.html', 'NovedadesPanel.dc.html', 'MenuAvatar.dc.html'}

def canvas():
    return json.load(open(os.path.join(PROY, 'canvas.json'), encoding='utf-8'))

def archivos_de(gen):
    # los archivos que escribe el generador: los que imprime como "escrito X"
    return None

def correr(gen, altos):
    r = subprocess.run([sys.executable, os.path.basename(gen), PROY, json.dumps(altos)], cwd=os.path.join(SP, os.path.dirname(gen)),
                       capture_output=True, text=True, encoding='utf-8')
    if r.returncode:
        print(r.stderr[-1500:]); raise SystemExit(1)
    return re.findall(r'escrito (\S+\.dc\.html)', r.stdout)

d = canvas()
alto_canvas = {a['file']: a['h'] for a in d['artboards']}
todos = {}
for gen in GENS:
    escritos = correr(gen, alto_canvas)
    todos[gen] = [f for f in escritos if f in alto_canvas]
medir = [f for fs in todos.values() for f in fs if f not in FIJOS]
r = subprocess.run([sys.executable, os.path.join(SP, 'medir.py'), PROY] + medir, capture_output=True, text=True, encoding='utf-8')
nuevos = dict((m[0], int(m[1])) for m in re.findall(r'(\S+\.dc\.html)\s+alto natural (\d+)px', r.stdout))
cambios = {f: h for f, h in nuevos.items() if h != alto_canvas.get(f)}
print('cambios de alto:', cambios)
if cambios:
    alto_canvas.update(cambios)
    for gen in GENS:
        if any(f in cambios for f in todos[gen]):
            correr(gen, alto_canvas)
    for a in d['artboards']:
        if a['file'] in cambios:
            a['h'] = cambios[a['file']]
    json.dump(d, open(os.path.join(PROY, 'canvas.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print('listo')

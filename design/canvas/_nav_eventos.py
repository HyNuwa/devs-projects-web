# Suma "Eventos" al menu y al pie: generadores y artboards ya escritos (mobile queda con su barra).
import glob, os
fuentes = {
 'materias/generar.py': [("('Experiencias', '#experiencias'), ('Clasificados', '#clasificados')", "('Experiencias', '#experiencias'), ('Eventos', '#eventos'), ('Clasificados', '#clasificados')"),
                         ("['Materias', 'Experiencias', 'Clasificados']", "['Materias', 'Experiencias', 'Eventos', 'Clasificados']")],
 'experiencias/generar_experiencias.py': [("['Inicio', 'Materias', 'Experiencias', 'Clasificados']", "['Inicio', 'Materias', 'Experiencias', 'Eventos', 'Clasificados']")],
 'espacio/generar_espacio.py': [("['Inicio', 'Materias', 'Experiencias', 'Clasificados']", "['Inicio', 'Materias', 'Experiencias', 'Eventos', 'Clasificados']")],
}
for f, reps in fuentes.items():
    s = open(f, encoding='utf-8').read()
    for a, b in reps:
        if b not in s:
            assert a in s, (f, a); s = s.replace(a, b)
    open(f, 'w', encoding='utf-8').write(s)
nav = '<a href="#experiencias" style="color: #3D4459;">Experiencias</a>'
act = '<a href="#experiencias" style="color: #0A4DE8; font-weight: 700; padding-bottom: 3px; border-bottom: 2px solid #0A4DE8;">Experiencias</a>'
pie = '<a href="#experiencias" style="color: #FFFFFF;">Experiencias</a>'
n = 0
for f in glob.glob('home/project/*.dc.html') + ['tutorias/base-clasificados.dc.html']:
    if os.path.basename(f).startswith('Movil'): continue
    s = open(f, encoding='utf-8').read()
    if 'href="#eventos"' in s: continue
    s2 = (s.replace(nav, nav + '<a href="#eventos" style="color: #3D4459;">Eventos</a>')
           .replace(act, act + '<a href="#eventos" style="color: #3D4459;">Eventos</a>')
           .replace(pie, pie + '<a href="#eventos" style="color: #FFFFFF;">Eventos</a>'))
    if s2 != s: n += 1; open(f, 'w', encoding='utf-8').write(s2)
print('archivos con Eventos en el menu:', n)

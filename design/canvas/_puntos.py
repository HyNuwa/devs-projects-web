import re
p = r'C:\Users\Usuario\Desktop\DevProjects\Ideas\devs-project\devs-projects-web\docs\README_PUNTOS_E_INSIGNIAS.md'
s = open(p, encoding='utf-8').read()

def rep(a, b):
    global s
    c = s.count(a)
    assert c == 1, (c, a[:80])
    s = s.replace(a, b)

def borrar_linea(inicio, nuevo=None):
    global s
    i = s.index(inicio); j = s.index('\n', i)
    s = s[:i] + (nuevo if nuevo is not None else '') + (s[j:] if nuevo is not None else s[j + 1:])

rep('> **Relacionado:**', '> **Moderación:** desde septiembre 2026 todo se publica al instante y se modera después (`docs/README_MODERACION.md`, ADR 0001). Por eso los puntos de un aporte se otorgan **al publicarse** y se revierten si se retira.\n> **Relacionado:**')
rep('1. **Calidad antes que cantidad.** Se premia lo que otros usaron y aprobaron, no el simple hecho de subir o publicar.',
    '1. **Calidad antes que cantidad.** Lo que más suma es que a otros les sirva lo que compartiste, no la cantidad que subís.')
rep('| Material aprobado | +10 al aprobarse (`MATERIAL_APPROVED`). Correcto: se mantiene. |',
    '| Material aprobado | +10 al aprobarse (`MATERIAL_APPROVED`). **Cambia:** con la publicación inmediata pasa a otorgarse al publicarse (`MATERIAL_PUBLISHED`). |')
borrar_linea('| Guía | +15 al crearse', '| Guía | +15 al crearse (`GUIDE_CREATED`). Las guías quedaron **fuera del producto** (septiembre 2026): dejan de sumar puntos. |')
rep('| `MATERIAL_APPROVED` | Material aprobado por moderación | +10 | Al aprobarse | Uno por material |',
    '| `MATERIAL_PUBLISHED` | Material publicado | +10 | Al publicarse (si pasó por revisión previa, al aprobarse) | Uno por material · se revierte si se retira |')
rep('Primer material aprobado de un tipo en una materia', 'Primer material publicado de un tipo en una materia')
borrar_linea('| `GUIDE_APPROVED` |')
rep('subir algo que todavía está en revisión,', 'algo que está en revisión previa (hasta que se publica),')
rep('- El material está aprobado y no fue retirado.', '- El material está publicado y no fue retirado ni está oculto.')
rep('Se revierten `MATERIAL_APPROVED`, `MATERIAL_PIONEER`', 'Se revierten `MATERIAL_PUBLISHED`, `MATERIAL_PIONEER`')
rep('Si después de aprobado se cambia', 'Si después de publicado se cambia')
rep('(10 de aprobación + unos 10 «Me sirvió»)', '(10 al publicarse + unos 10 «Me sirvió»)')
rep('10 materiales aprobados con 20', '10 materiales publicados con 20')
rep('- Aprobar tu propio contenido o el de otros sin ser moderador.\n- Publicar sin pasar por la revisión de moderación.',
    '- Resolver casos de moderación sin ser moderador.\n- Saltar la revisión previa cuando corresponde (cuenta nueva o con un retiro reciente).')
rep('(aprobación, «Me sirvió», fin de un período de mesas, etc.)', '(publicación, «Me sirvió», fin de un período de mesas, etc.)')
for a, b in [('| Primer material aprobado |', '| Primer material publicado |'), ('Materiales aprobados en 5', 'Materiales publicados en 5'),
             ('Primer material aprobado de una materia', 'Primer material publicado de una materia'), ('tenés materiales aprobados de 4', 'tenés materiales publicados de 4'),
             ('Materiales aprobados del mismo', 'Materiales publicados del mismo'), ('aporte aprobado en 2', 'aporte publicado en 2'),
             ('3 aportes aprobados durante', '3 aportes publicados durante'), ('al menos un aporte aprobado en ese', 'al menos un aporte publicado en ese')]:
    rep(a, b)
borrar_linea('- **`Guide`:** agregar estado')
rep('de un material aprobado.', 'de un material publicado.')
rep('- Las guías pasan a sumar al aprobarse, no al crearse.\n', '- Se deja de otorgar `GUIDE_CREATED` (las guías quedaron fuera del producto).\n')
rep('| `EVENT_APPROVED` | Evento aprobado por moderación |', '| `EVENT_PUBLISHED` | Evento publicado |')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
for l in s.split('\n'):
    if re.search(r'aprob|guía|Guía|GUIDE', l):
        print(' >', l[:170])

p='espacio/generar_espacio.py'; s=open(p,encoding='utf-8').read()
a='''      <div style="{CARD} padding: 18px 20px 12px 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;"><h2 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.03em;">Mis envíos</h2>'''
if '{bloque_eventos()}' not in s:
    assert s.count(a)==1
    s=s.replace(a,'{bloque_eventos()}'+a)
    s=s.replace('def p_mochila():','''def bloque_eventos():
    sys.path.insert(0, os.path.join(SP, 'eventos'))
    import generar_eventos
    return generar_eventos.bloque_mochila()

def p_mochila():''',1)
open(p,'w',encoding='utf-8').write(s); print('ok')

p='experiencias/generar_experiencias.py'; s=open(p,encoding='utf-8').read()
i=s.index('for archivo, titulo, fn, alto, con_pie in PAGINAS:')
cola=s[i:]
print(repr(cola[-120:]))
s=s[:i]+"if __name__ == '__main__':\n"+'\n'.join(('  '+l if l.strip() else l) for l in cola.rstrip('\n').split('\n'))+'\n'
open(p,'w',encoding='utf-8').write(s)
p='espacio/generar_espacio.py'; s=open(p,encoding='utf-8').read()
i=s.index('for archivo, titulo, fh, fb, alto in PAGINAS:'); cola=s[i:]
s=s[:i]+"if __name__ == '__main__':\n"+'\n'.join(('  '+l if l.strip() else l) for l in cola.rstrip('\n').split('\n'))+'\n'
b="""    if activo == 'mochila':
        nota = (f'<span style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">'
                f'{ico("candado", 15, NAVY, 2.1)}Tu mochila es privada: solo la ves vos</span>')"""
assert s.count(b)==1
s=s.replace(b,b+"""
    elif activo == 'config':
        nota = (f'<span style="margin-left: auto; display: inline-flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; color: {TEXT2};">'
                f'{ico("candado", 15, NAVY, 2.1)}Solo vos ves esta página</span>')""")
open(p,'w',encoding='utf-8').write(s)
print('ok')

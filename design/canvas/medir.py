# Mide y fotografia artboards .dc.html con Chrome sin interfaz (reemplazo del conector de navegador).
# Uso: python medir.py <dir_proyecto> [--fijo] <archivo.dc.html> [...]
# --fijo: los archivos que siguen se fotografian con su alto declarado (popups sobre una pagina).
# Imprime el alto natural del contenido y deja <archivo>.png recortado en <dir>/_capturas/.
import os, pathlib, re, subprocess, sys
from PIL import Image
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
d = sys.argv[1]; os.makedirs(os.path.join(d, '_capturas'), exist_ok=True)
fijo = False
for f in sys.argv[2:]:
    if f == '--fijo':
        fijo = True; continue
    s = open(os.path.join(d, f), encoding='utf-8').read()
    if not fijo:
        s = re.sub(r'width: (\d+)px; height: \d+px', lambda m: f'width: {m.group(1)}px; height: auto', s, count=1)
    s = s.replace('<body>', '<body style="margin:0; background:#FF00FF;">', 1)
    prev = os.path.join(d, '_prev_' + f.replace('.dc.html', '.html'))
    open(prev, 'w', encoding='utf-8').write(s)
    png = os.path.join(d, '_capturas', f.replace('.dc.html', '.png'))
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--window-size=1440,4200', '--virtual-time-budget=8000', f'--screenshot={png}',
                    pathlib.Path(prev).resolve().as_uri()], capture_output=True, timeout=120)
    os.remove(prev)
    im = Image.open(png).convert('RGB'); w, h = im.size; px = im.load()
    alto = 0
    for y in range(h - 1, -1, -1):
        if any(px[x, y] != (255, 0, 255) for x in range(0, w, 7)):
            alto = y + 1; break
    ancho = int(re.search(r'width: (\d+)px; height:', s).group(1))
    im.crop((0, 0, min(w, ancho), alto)).save(png)
    print(f'{f:34} alto natural {alto}px  -> _capturas/{os.path.basename(png)}')

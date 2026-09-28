# Fotografia una insignia animada en varios instantes (tiempo virtual de Chrome) y arma una hoja.
import pathlib, subprocess, sys
from PIL import Image
CHROME = r'C:\Program Files\Google\Chrome\Application\chrome.exe'
svg, salida = sys.argv[1], sys.argv[2]
tiempos = [int(t) for t in sys.argv[3].split(',')]
html = pathlib.Path('_cuadro.html')
html.write_text('<html><body style="margin:0;background:#FDF3E5">' + pathlib.Path(svg).read_text(encoding='utf-8') + '<script>const t=+location.hash.slice(1);document.getAnimations().forEach(a=>{a.pause();a.currentTime=t});</script></body></html>', encoding='utf-8')
ims = []
for t in tiempos:
    png = f'_t{t}.png'
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--force-prefers-no-reduced-motion', '--hide-scrollbars', '--force-device-scale-factor=1', '--window-size=400,400',
                    '--virtual-time-budget=300', f'--screenshot={pathlib.Path(png).resolve()}', html.resolve().as_uri() + f'#{t}'], capture_output=True, timeout=60)
    ims.append(Image.open(png).convert('RGB').crop((0, 0, 400, 400)))
W = 4
out = Image.new('RGB', (W * 410 + 10, ((len(ims) + W - 1) // W) * 410 + 10), (60, 60, 60))
for k, im in enumerate(ims):
    out.paste(im, (10 + (k % W) * 410, 10 + (k // W) * 410))
out.save(salida); print(salida, tiempos)

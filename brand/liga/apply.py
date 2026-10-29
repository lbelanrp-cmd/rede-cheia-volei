"""Transforma o app padrão na versão Liga da Justiça (cores, nome, ícone)."""
import json, re, shutil, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
p = os.path.join(ROOT, "www", "index.html")
s = open(p, encoding="utf-8").read()

def rep(a, b, count=1):
    global s
    n = s.count(a)
    assert n >= 1, f"não achei: {a[:60]}"
    s = s.replace(a, b) if count == 0 else s.replace(a, b, count)

rep('<meta name="theme-color" content="#0d1420">', '<meta name="theme-color" content="#0c0b24">')
rep('<title>Rede Cheia Vôlei</title>', '<title>Liga da Justiça Vôlei</title>')
rep('--bg:#0d1420; --panel:#151f30; --panel-2:#1c2940; --line:#2a3a56;',
    '--bg:#0c0b24; --panel:#16143a; --panel-2:#1f1c4d; --line:#332f72;')
rep('--fg:#eef2f8; --muted:#8fa0bb; --accent:#ffb21f; --accent-2:#3f8cff;',
    '--fg:#f2f0ff; --muted:#a7a3d8; --accent:#7fe3ff; --accent-2:#8a5cff; --accent-3:#ff8ae6;')
rep('color:#1a1200', 'color:#120f3a', 0)
rep('rgba(13,20,32,.94)', 'rgba(12,11,36,.94)', 0)
s = s.replace('<div class="brand">Rede <span>Cheia</span></div>', '<div class="brand">Liga <span>da Justiça</span></div>')
rep('<div class="brand" id="teamName">Rede <span>Cheia</span></div>', '<div class="brand" id="teamName">Liga <span>da Justiça</span></div>')
rep('O vôlei do seu time, organizado', 'O vôlei da Liga, organizado')
rep('pelo app Rede Cheia Vôlei', 'pelo app Liga da Justiça Vôlei')
rep('placeholder="Nome do time"', 'placeholder="Nome do time" value="Liga da Justiça"')
# identidade visual extra: fundo com brilho e título em degradê
extra = '''
body{background:radial-gradient(120% 60% at 50% -10%,rgba(138,92,255,.28),transparent 60%),radial-gradient(90% 50% at 100% 110%,rgba(255,138,230,.14),transparent 60%),var(--bg);background-attachment:fixed}
.brand{background:linear-gradient(100deg,#ffffff 0%,#7fe3ff 40%,#ff8ae6 75%,#8a5cff 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
.brand span{color:transparent}
.btn.primary{background:linear-gradient(100deg,#7fe3ff,#b9a4ff 60%,#ff8ae6);border-color:transparent}
.tabs button[aria-current="page"]{color:#7fe3ff}
.team{border-top-color:var(--tc)}
'''
rep('</style>', extra + '</style>')
open(p, "w", encoding="utf-8").write(s)

c = os.path.join(ROOT, "capacitor.config.json")
cfg = json.load(open(c, encoding="utf-8"))
cfg["appId"] = "br.redecheia.ligadajustica"
cfg["appName"] = "Liga da Justiça Vôlei"
json.dump(cfg, open(c, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

src = os.path.join(ROOT, "brand", "liga", "res")
dst = os.path.join(ROOT, "resources", "android", "res")
shutil.copytree(src, dst, dirs_exist_ok=True)
print("Versão Liga da Justiça aplicada")

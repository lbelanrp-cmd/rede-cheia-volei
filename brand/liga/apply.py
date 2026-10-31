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

rep('<meta name="theme-color" content="#0d1420">', '<meta name="theme-color" content="#08080b">')
rep('<title>Rede Cheia Vôlei</title>', '<title>Liga da Justiça Vôlei</title>')
rep('--bg:#0d1420; --panel:#151f30; --panel-2:#1c2940; --line:#2a3a56;',
    '--bg:#08080b; --panel:#15131a; --panel-2:#1f1b25; --line:#3a3343;')
rep('--fg:#eef2f8; --muted:#8fa0bb; --accent:#ffb21f; --accent-2:#3f8cff;',
    '--fg:#ffffff; --muted:#b9b1c2; --accent:#e8197d; --accent-2:#2fbfa8; --accent-3:#e8197d;')
rep('color:#1a1200', 'color:#ffffff', 0)
rep('rgba(13,20,32,.97)', 'rgba(8,8,11,.97)', 0)
s = s.replace('<div class="brand">Rede <span>Cheia</span></div>', '<div class="brand">Liga <span>da Justiça</span></div>')
rep('<div class="brand" id="teamName">Rede <span>Cheia</span></div>', '<div class="brand" id="teamName">Liga <span>da Justiça</span></div>')
rep('O vôlei do seu time, organizado', 'O vôlei da Liga, organizado')
rep('pelo app Rede Cheia Vôlei', 'pelo app Liga da Justiça Vôlei')
rep('releases/download/rede-atual/RedeCheiaVolei.apk', 'releases/download/liga-atual/LigaDaJusticaVolei.apk')
rep('placeholder="Nome do time"', 'placeholder="Nome do time" value="Liga da Justiça"')
# identidade visual extra: fundo com brilho e título em degradê
extra = '''
body{background:radial-gradient(90% 45% at 0% 0%,rgba(232,25,125,.22),transparent 60%),radial-gradient(90% 45% at 100% 100%,rgba(47,191,168,.18),transparent 60%),var(--bg);background-attachment:fixed}
.brand{color:#fff;text-shadow:2px 2px 0 #e8197d,-2px -2px 0 #2fbfa8;letter-spacing:.03em}
.brand span{color:#fff}
.btn.primary{background:#e8197d;border-color:#e8197d;color:#fff}
.chip[aria-pressed="true"],.seg button[aria-pressed="true"]{background:#2fbfa8;border-color:#2fbfa8;color:#04201b}
.tabs{border-top:2px solid #e8197d}
.tabs button[aria-current="page"]{color:#2fbfa8}
.toggle.on{background:rgba(47,191,168,.15);border-color:#2fbfa8;color:#2fbfa8}
.notice{border-color:#2fbfa8}
.notice svg{color:#2fbfa8}
/* carta Diamante nas cores da Liga */
.tier-craque{--d1:#7fffe9;--d2:#e8197d;--d3:#2fbfa8;--d4:#2a0620;--m1:#ffffff;--m3:#e8197d;--ink:#ffffff;--ink2:rgba(255,255,255,.85);--glow:rgba(232,25,125,.8)}
.tier-craque .crest{background:#fff;color:#e8197d}
'''
rep('</style>', extra + '</style>')
# funções exclusivas da Liga: agenda, presença em treinos, avisos e rank
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: open(os.path.join(here, n), encoding="utf-8").read()
rep('<!--@@EXTRA_VIEWS@@-->', rd("liga.html") + rd("fin.html"))
rep('/*@@EXTRA_JS@@*/', rd("liga.js") + rd("fin.js"))
rep('</style>', rd("liga.css") + rd("fin.css") + '</style>')
fs_imp = 'from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";'
rep(fs_imp, fs_imp + '\nimport {query,where,orderBy,limit} ' + fs_imp)
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

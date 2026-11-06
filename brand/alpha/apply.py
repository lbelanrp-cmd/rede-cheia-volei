"""App AlphaBeach Vôlei: mesmas funções do app da Liga, com identidade do AlphaBeach,
cargos presidente/vice/atleta, configuração do time pelo presidente e torneio só com sorteio equilibrado."""
import json, os, re, runpy, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
os.environ["MARCA"] = "alpha"
runpy.run_path(os.path.join(ROOT, "brand", "liga", "apply.py"), run_name="__main__")

p = os.path.join(ROOT, "www", "index.html")
s = open(p, encoding="utf-8").read()
def rep(a, b, count=1):
    global s
    assert s.count(a) >= 1, f"não achei: {a[:70]}"
    s = s.replace(a, b) if count == 0 else s.replace(a, b, count)
rd = lambda n: open(os.path.join(HERE, n), encoding="utf-8").read()

rep('<meta name="theme-color" content="#08080b">', '<meta name="theme-color" content="#0a170c">')
rep('<title>Liga da Justiça Vôlei</title>', '<title>AlphaBeach Vôlei</title>')
s = s.replace('<div class="brand">Liga <span>da Justiça</span></div>', '<div class="brand">Alphabeach <span>Vôlei</span></div>')
rep('<div class="brand" id="teamName">Liga <span>da Justiça</span></div>', '<div class="brand" id="teamName">Alphabeach <span>Vôlei</span></div>')
rep('O vôlei da Liga, organizado', 'O vôlei do AlphaBeach, organizado')
rep('pelo app Liga da Justiça Vôlei', 'pelo app AlphaBeach Vôlei')
rep('releases/download/liga-atual/LigaDaJusticaVolei.apk', 'releases/download/alpha-atual/AlphaBeachVolei.apk')
rep('placeholder="Nome do time" value="Liga da Justiça"', 'placeholder="Nome do time" value="AlphaBeach Vôlei Clube"')

# cargos: só presidente, vice-presidente e atleta
s = re.sub(r'<select id="invRole"[^\n]*?</select>', '<select id="invRole" style="width:auto"><option value="atleta">Atleta</option><option value="vicepresidente" data-pres>Vice-presidente</option></select>', s, count=1)
rep('const PAPEL={presidente:"Presidente",vicepresidente:"Vice-presidente",diretoria:"Diretoria",tesoureiro:"Tesoureiro(a)",professor:"Professor",capitao:"Capitão",capita:"Capitã",atleta:"Atleta"};',
    'const PAPEL={presidente:"Presidente",vicepresidente:"Vice-presidente",atleta:"Atleta"};')
rep('const GESTORES=["presidente","vicepresidente","capitao","capita","professor"];', 'const GESTORES=["presidente","vicepresidente"];')
# financeiro: presidente e vice-presidente (o time do Alpha nasce com essa permissão)
rep('const finAcesso=()=>!!me&&(me.papel==="presidente"||me.papel==="tesoureiro");', 'const finAcesso=()=>!!me&&(me.papel==="presidente"||me.papel==="vicepresidente");')
rep('b.set(t,{nome,criadoPor:user.uid,criadoEm:serverTimestamp(),modo:6,', 'b.set(t,{nome,criadoPor:user.uid,criadoEm:serverTimestamp(),finVice:true,configOk:false,modo:6,')
# assembleias e torneios: presidente e vice-presidente
rep('const trAcesso=()=>!!me&&["presidente","vicepresidente","diretoria"].includes(me.papel);', 'const trAcesso=()=>!!me&&["presidente","vicepresidente"].includes(me.papel);')
# torneio: só sorteio equilibrado (sem atletas que saem sempre juntos)
s = re.sub(r'const JUNTOS=\[[^\]]*\];', 'const JUNTOS=[];', s, count=1)
# treinos vêm da configuração do presidente (sem os treinos da Liga)
rep('const fixos=team?.treinosFixos||FIXOS_PADRAO;', 'const fixos=team?.treinosFixos||[];')
# Pix: sem chave da Liga; presidente cadastra
rep('chave:"rosanibelan@gmail.com",recebedor:"LIGA DA JUSTICA VOLEI",cidade:"BRASIL"', 'chave:"",recebedor:"ALPHABEACH VOLEI",cidade:"SERTAOZINHO"')
s = s.replace('"LIGA DA JUSTICA VOLEI"', '"ALPHABEACH VOLEI"')
# textos
s = s.replace('notificarSistema("Novo aviso da Liga"', 'notificarSistema("Novo aviso do AlphaBeach"')
s = s.replace('deleteDoc(doc(db,"publico","liga")).catch(()=>{})', 'void 0')
s = s.replace('Pix da Liga', 'Pix do time').replace('Torneio da Liga', 'Torneio do AlphaBeach').replace('Torneio Interno Liga', 'Torneio Interno AlphaBeach').replace('atletas da Liga', 'atletas do time')
s = s.replace('O vôlei da Liga', 'O vôlei do AlphaBeach')
# abertura com o escudo
i = s.index('<!-- LIGA: abertura com a zebra do ícone -->'); j = s.index('</div>\n</div>\n', i) + len('</div>\n</div>\n')
s = s[:i] + rd("intro.html") + s[j:]
shutil.copy(os.path.join(HERE, "escudo.png"), os.path.join(ROOT, "www", "escudo.png"))
try: os.remove(os.path.join(ROOT, "www", "zebra.jpg"))
except OSError: pass
# configurar o time (presidente)
rep('<div class="modal" id="trModal" hidden>', rd("config.html") + '  <div class="modal" id="trModal" hidden>')
rep('  if(typeof trAcesso==="function"&&trAcesso())t.unshift(["torneio","Torneios","Grupos, jogos e chave"]);',
    '  if(typeof trAcesso==="function"&&trAcesso())t.unshift(["torneio","Torneios","Grupos, jogos e chave"]);\n  if(typeof cfgTime==="function"&&cfgTime())t.unshift(["config","Configurar o time","Quadras, treinos e Pix"]);')
i = s.rindex('</script>')
s = s[:i] + rd("config.js") + s[i:]
rep('</style>', rd("alpha.css") + '</style>')
open(p, "w", encoding="utf-8").write(s)

c = os.path.join(ROOT, "capacitor.config.json")
cfg = json.load(open(c, encoding="utf-8"))
cfg["appId"] = "br.redecheia.alphabeach"
cfg["appName"] = "AlphaBeach Vôlei"
cfg["plugins"] = {"LocalNotifications": {"smallIcon": "ic_stat_bola", "iconColor": "#1A4120"}}
json.dump(cfg, open(c, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
dst = os.path.join(ROOT, "resources", "android", "res")
shutil.rmtree(dst, ignore_errors=True)
shutil.copytree(os.path.join(HERE, "res"), dst)
print("Versão AlphaBeach Vôlei aplicada")

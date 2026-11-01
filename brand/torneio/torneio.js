/* ================= TORNEIO LIGA: vôlei de areia 4x4 (2 homens + 2 mulheres) ================= */
const TR={lista:[],sel:null,sub:null,ok:false,aba:"grupos",filtro:"todos",swap:null,jogo:null,manual:false,animEq:0,animGr:0,antes:null,ins:null};
const TCORES=["#e8197d","#2fbfa8","#f5c542","#3f8cff","#ff7a45","#9b6bff","#3ccf8e","#ff5a7a","#4fd6e0","#c3e64f","#ff9fd6","#b0b7c3","#e0a96d","#6be0b0","#7f8cff","#ff6b5a"];
const FASE={G:"Grupo",O:"Oitavas",Q:"Quartas",S:"Semifinal",F:"Final","3":"3º lugar"};
Object.assign(ICON,{
  torneio:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>',
  equipes:'<circle cx="8" cy="8" r="3"/><circle cx="16" cy="8" r="3"/><path d="M2 20c0-3 2.7-5 6-5s6 2 6 5M12 20c0-3 1.3-5 4-5s6 2 6 5"/>',
  jogos:'<circle cx="12" cy="12" r="9"/><path d="M12 3c-3 3-3 15 0 18M3.5 9h17M3.5 15h17"/>',
  tabela:'<path d="M4 4h6v4H4zM4 16h6v4H4zM14 10h6v4h-6z"/><path d="M10 6h2v12h-2M12 12h2"/>',
  tmais:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'});
Object.assign(LABEL,{torneio:"Torneio",equipes:"Equipes",jogos:"Jogos",tabela:"Tabela",tmais:"Mais"});
EXTRA.joga=m=>m.papel==="atleta"||m.joga===true||(!GESTORES.includes(m.papel)&&m.joga!==false);
EXTRA.tabs=()=>["torneio","equipes","jogos","tabela","tmais"];
Object.assign(EXTRA.parent,{elenco:"tmais",carta:"tmais",time:"tmais",presenca:"tmais",sorteio:"tmais",placar:"tmais"});
EXTRA.startView=()=>"torneio";
EXTRA.membroExtra=(m,pres)=>pres&&m.papel!=="atleta"?`<label class="chk joga-chk"><input type="checkbox" data-joga="${m.uid}" ${EXTRA.joga(m)?"checked":""}>Atleta</label>`:"";
$("#members").addEventListener("change",async e=>{const c=e.target.closest("[data-joga]");if(!c)return;
  try{await updateDoc(doc(db,"times",teamId,"membros",c.dataset.joga),{joga:c.checked});toast(c.checked?"Agora também é atleta":"Não é mais atleta")}catch(err){c.checked=!c.checked;toast("Não consegui alterar")}});

/* ---------- utilidades ---------- */
const trRef=id=>doc(db,"times",teamId,"torneios",id);
const trCur=()=>TR.lista.find(x=>x.id===TR.sel)||TR.lista[0]||null;
const embaralha=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const eqDe=(t,id)=>(t.equipes||[]).find(e=>e.id===id);
const forca=(e)=>e.ids.map(byId).filter(Boolean).reduce((s,p)=>s+ovr(p),0);
const media=e=>{const ps=e.ids.map(byId).filter(Boolean);return ps.length?forca(e)/ps.length:0};
const levanta=p=>p&&(p.pos==="LEV"||p.pos2==="LEV");
const minhaEq=t=>me?.carta?(t.equipes||[]).find(e=>e.ids.includes(me.carta)):null;
const dataBR=d=>d?d.split("-").reverse().join("/"):"";
const res=(t,j)=>(t.res||{})[j.id]||{sets:[],st:"ag"};
const jogoDe=(t,id)=>(t.jogos||[]).find(j=>j.id===id);
function alvo(t,j,i){const ko=j.fase!=="G";const p=ko?(+t.ptsKO||21):(+t.pts||21);return (j.melhor>1&&i===2&&t.tie15)?15:p}
function setFechado(t,j,i,s){const a=alvo(t,j,i);return (s[0]>=a||s[1]>=a)&&Math.abs(s[0]-s[1])>=2}
function contaSets(t,j,sets){let a=0,b=0;sets.forEach((s,i)=>{if(setFechado(t,j,i,s)){if(s[0]>s[1])a++;else b++}});return[a,b]}
function lado(t,j,l){const fixo=j[l];if(fixo)return fixo;const f=j["f"+l];if(!f)return null;const g=jogoDe(t,f.j);if(!g)return null;
  return f.r==="v"?vencedor(t,g):perdedor(t,g)}
function vencedor(t,j){if(j.bye)return lado(t,j,"a")||lado(t,j,"b");const r=res(t,j);if(r.st!=="fim")return null;
  const[a,b]=contaSets(t,j,r.sets||[]);if(a===b)return null;return lado(t,j,a>b?"a":"b")}
function perdedor(t,j){if(j.bye)return null;const v=vencedor(t,j);if(!v)return null;const A=lado(t,j,"a"),B=lado(t,j,"b");return v===A?B:A}
function nomeEq(t,id){return eqDe(t,id)?.nome||"A definir"}
function rotuloLado(t,j,l){const id=lado(t,j,l);if(id)return nomeEq(t,id);const f=j["f"+l];if(!f)return"—";const g=jogoDe(t,f.j);
  return (f.r==="v"?"Vencedor ":"Perdedor ")+(g?(FASE[g.fase]+(g.n?" "+g.n:"")):"")}
function statusT(t){if(!t)return"vazio";if(t.status==="mata"){const f=(t.jogos||[]).find(j=>j.fase==="F");if(f&&vencedor(t,f))return"fim"}return t.status||"inscricao"}

/* ---------- sincronização ---------- */
function syncTr(){
  if(!me||TR.sub)return;
  TR.sub=onSnapshot(collection(db,"times",teamId,"torneios"),s=>{
    const antes=trCur();
    TR.lista=s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.criadoEm?.toMillis?.()||Date.now())-(a.criadoEm?.toMillis?.()||Date.now()));
    const t=trCur();
    if(TR.ok&&t&&antes&&t.id===antes.id){
      if(!(antes.equipes||[]).length&&(t.equipes||[]).length)TR.animEq=Date.now();
      if(!(antes.grupos||[]).length&&(t.grupos||[]).length)TR.animGr=Date.now();
      if(!(antes.jogos||[]).length&&(t.jogos||[]).length&&!gestor())notify("A tabela de jogos do torneio saiu!","jogos");
      const eu=minhaEq(t);
      if(eu&&!gestor())(t.jogos||[]).forEach(j=>{const r0=res(antes,j).st,r1=res(t,j).st;const A=lado(t,j,"a"),B=lado(t,j,"b");
        if((A===eu.id||B===eu.id)&&r0==="ag"&&r1==="vivo")notify(`Seu jogo começou: ${nomeEq(t,A)} x ${nomeEq(t,B)}`,"jogos")});
      const ca=statusT(antes),cb=statusT(t);if(ca!=="fim"&&cb==="fim")notify(`Temos campeão: ${nomeEq(t,vencedor(t,t.jogos.find(j=>j.fase==="F")))}!`,"torneio");
    }
    TR.ok=true;renderTr()},e=>console.warn("torneios",e));
  unsubs.push(()=>{TR.sub&&TR.sub();TR.sub=null})}
EXTRA.render.push(()=>{syncTr();renderTr()});
EXTRA.reset.push(()=>{TR.sub=null;TR.ok=false;TR.lista=[];TR.sel=null});
EXTRA.onMark=()=>renderTr();
async function trSalva(t,patch,msg){Object.assign(t,patch);renderTr();
  try{await updateDoc(trRef(t.id),patch);if(msg)toast(msg)}catch(e){toast("Não consegui salvar: "+(e.code||e.message))}}

function renderTr(){if(!me||!team)return;renderHome();renderEquipes();renderJogos();renderTabela();renderTMais();renderPlacarJ()}

/* ---------- início ---------- */
const PASSOS=[["inscricao","Inscrição"],["equipes","Equipes"],["grupos","Grupos"],["jogos","Jogos"],["mata","Mata-mata"],["fim","Campeão"]];
function formatoTxt(t){return `Grupos: 1 set de ${t.pts||21} · ${t.setsKO>1?`Semifinal e final: melhor de 3 sets de ${t.ptsKO||21}${t.tie15?" (3º set de 15)":""}`:`Mata-mata: 1 set de ${t.ptsKO||21}`}${t.terceiro?" · Disputa de 3º lugar":""}`}
function jogoLinha(t,j,opt={}){const r=res(t,j),A=lado(t,j,"a"),B=lado(t,j,"b"),ea=eqDe(t,A),eb=eqDe(t,B);
  const[sa,sb]=contaSets(t,j,r.sets||[]);const cur=(r.sets||[])[(r.sets||[]).length-1]||[0,0];const v=vencedor(t,j);
  const eu=minhaEq(t);const meu=eu&&(eu.id===A||eu.id===B);
  const placar=r.st==="ag"?`<span class="tr-x">x</span>`:(j.melhor>1?`<span class="tr-pl"><b>${sa}</b><i>sets</i><b>${sb}</b></span>`:`<span class="tr-pl"><b>${cur[0]}</b><i>×</i><b>${cur[1]}</b></span>`);
  const det=j.melhor>1&&(r.sets||[]).length?`<small class="tr-sets">${r.sets.map(s=>s.join("–")).join(" · ")}</small>`:"";
  return `<button type="button" class="tr-jogo${r.st==="vivo"?" vivo":""}${r.st==="fim"?" fim":""}${meu?" meu":""}" data-j="${j.id}">
    <div class="tr-jtop"><span class="tr-tag">${FASE[j.fase]}${j.fase==="G"?" "+j.g:""}${j.melhor>1?" · MD3":""}</span><span>${r.st==="vivo"?'<em class="tr-live">● Ao vivo</em>':`Quadra ${j.quadra}${opt.slot?" · Rodada "+j.slot:""}`}</span></div>
    <div class="tr-jmeio">
      <span class="tr-eq${v&&v===A?" ganhou":""}" style="--c:${ea?.cor||"var(--line)"}"><i></i>${esc(A?nomeEq(t,A):rotuloLado(t,j,"a"))}</span>
      ${placar}
      <span class="tr-eq dir${v&&v===B?" ganhou":""}" style="--c:${eb?.cor||"var(--line)"}">${esc(B?nomeEq(t,B):rotuloLado(t,j,"b"))}<i></i></span>
    </div>${det}</button>`}
function renderHome(){const box=$("#trHome");if(!box)return;const t=trCur();
  if(!TR.ok){box.innerHTML=`<div class="empty">Carregando…</div>`;return}
  if(!t){box.innerHTML=`<div class="tr-hero"><span class="tr-kicker">Vôlei de areia 4x4</span><h2>Torneio da Liga</h2><p>Equipes de 2 homens e 2 mulheres, sorteadas com equilíbrio pelas cartas.</p></div>
    ${gestor()?formCriar():`<div class="empty">A comissão ainda não criou um torneio.</div>`}`;ligaCriar();return}
  const st=statusT(t),idx=PASSOS.findIndex(p=>p[0]===st);const js=(t.jogos||[]).filter(j=>!j.bye);
  const feitos=js.filter(j=>res(t,j).st==="fim").length;const vivos=js.filter(j=>res(t,j).st==="vivo");
  const prox=js.filter(j=>res(t,j).st==="ag"&&lado(t,j,"a")&&lado(t,j,"b")).sort((a,b)=>a.slot-b.slot||a.quadra-b.quadra).slice(0,4);
  const eu=minhaEq(t);const meuProx=eu&&js.filter(j=>res(t,j).st!=="fim"&&(lado(t,j,"a")===eu.id||lado(t,j,"b")===eu.id)).sort((a,b)=>a.slot-b.slot)[0];
  let acao="";
  if(gestor()){
    if(st==="inscricao")acao=`<button class="btn primary big" data-go="equipes" type="button">Escolher atletas e sortear equipes</button>`;
    if(st==="equipes")acao=`<button class="btn primary big" data-act="grupos" type="button">Sortear grupos</button><button class="btn ghost" data-go="equipes" type="button">Ajustar equipes</button>`;
    if(st==="grupos")acao=`<button class="btn primary big" data-act="jogos" type="button">Sortear jogos</button><button class="btn ghost" data-act="regrupos" type="button">Sortear grupos de novo</button>`;
    if(st==="jogos")acao=js.filter(j=>j.fase==="G").every(j=>res(t,j).st==="fim")?`<button class="btn primary big" data-act="mata" type="button">Gerar mata-mata</button>`:"";
  }
  let campeao="";
  if(st==="fim"){const f=t.jogos.find(j=>j.fase==="F"),c3=t.jogos.find(j=>j.fase==="3");const c=vencedor(t,f),v=perdedor(t,f);
    let ter=c3?vencedor(t,c3):null;
    const pod=[[v,"2º","p2"],[c,"1º","p1"],[ter,"3º","p3"]].filter(x=>x[0]);
    campeao=`<div class="tr-camp"><span class="tr-kicker">Campeão</span><h2>${esc(nomeEq(t,c))}</h2>
      <div class="tr-cards">${eqDe(t,c).ids.map(byId).filter(Boolean).map(p=>cardHTML(p,"mini")).join("")}</div>
      <div class="tr-pod">${pod.map(([id,n,cl])=>`<div class="${cl}"><b>${n}</b><span>${esc(nomeEq(t,id))}</span></div>`).join("")}</div></div>`}
  box.innerHTML=`<div class="tr-hero"><span class="tr-kicker">${dataBR(t.data)||"Torneio interno"} · ${(t.equipes||[]).length||"–"} equipes · ${t.quadras||1} quadra${(t.quadras||1)>1?"s":""}</span>
     <h2>${esc(t.nome||"Torneio")}</h2><p>${formatoTxt(t)}</p></div>
    <ol class="tr-passos">${PASSOS.map((p,i)=>`<li class="${i<idx?"ok":i===idx?"agora":""}"><i>${i<idx?"✓":i+1}</i><span>${p[1]}</span></li>`).join("")}</ol>
    ${campeao}
    ${acao?`<div class="tr-acao">${acao}</div>`:""}
    ${js.length?`<div class="tr-prog"><div class="row spread"><b>Jogos</b><small>${feitos} de ${js.length} encerrados</small></div><div class="fin-bar"><i style="width:${js.length?feitos/js.length*100:0}%"></i></div></div>`:""}
    ${eu?`<div class="tr-minha" style="--c:${eu.cor}"><span class="tr-kicker">Sua equipe</span><h3>${esc(eu.nome)}</h3>${meuProx?jogoLinha(t,meuProx,{slot:1}):'<small>Sem jogos pendentes.</small>'}</div>`:""}
    ${vivos.length?`<div class="grouplabel">Ao vivo</div><div class="lg-list">${vivos.map(j=>jogoLinha(t,j)).join("")}</div>`:""}
    ${prox.length?`<div class="grouplabel">Próximos jogos</div><div class="lg-list">${prox.map(j=>jogoLinha(t,j,{slot:1})).join("")}</div>`:""}`}
function formCriar(){const hoje=new Date();const d=`${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,"0")}-${String(hoje.getDate()).padStart(2,"0")}`;
  return `<form class="box" id="trNovo" novalidate><h3>Novo torneio</h3>
    <label class="f">Nome<input type="text" id="tnNome" maxlength="40" value="Torneio Interno Liga"></label>
    <div class="two"><label class="f">Data<input type="date" id="tnData" value="${d}"></label>
    <label class="f">Quadras<select id="tnQ"><option>1</option><option selected>2</option><option>3</option><option>4</option></select></label></div>
    <div class="two"><label class="f">Pontos na fase de grupos<select id="tnPts"><option>15</option><option selected>21</option><option>25</option></select></label>
    <label class="f">Pontos no mata-mata<select id="tnPtsKO"><option>15</option><option selected>21</option><option>25</option></select></label></div>
    <label class="chk"><input type="checkbox" id="tnMD3" checked><span>Semifinal e final em <b>melhor de 3 sets</b></span></label>
    <label class="chk"><input type="checkbox" id="tnTie"><span>3º set até 15 pontos</span></label>
    <label class="chk"><input type="checkbox" id="tnTer" checked><span>Disputa de 3º lugar</span></label>
    <p class="note">Todo set termina com 2 pontos de vantagem. Equipes de 4: 2 homens e 2 mulheres.</p>
    <div class="err" id="tnErr"></div><button class="btn primary" type="submit">Criar torneio</button></form>`}
function ligaCriar(){const f=$("#trNovo");if(!f)return;f.onsubmit=async e=>{e.preventDefault();
  const nome=$("#tnNome").value.trim()||"Torneio";const b=f.querySelector("[type=submit]");b.disabled=true;
  try{const r=doc(collection(db,"times",teamId,"torneios"));
    await setDoc(r,{nome,data:$("#tnData").value,quadras:+$("#tnQ").value,pts:+$("#tnPts").value,ptsKO:+$("#tnPtsKO").value,setsKO:$("#tnMD3").checked?3:1,tie15:$("#tnTie").checked,terceiro:$("#tnTer").checked,
      status:"inscricao",inscritos:[],equipes:[],reservas:[],grupos:[],jogos:[],res:{},criadoEm:serverTimestamp(),criadoPor:user.uid});
    TR.sel=r.id;toast("Torneio criado");go("equipes")}catch(err){$("#tnErr").textContent="Não consegui criar: "+(err.code||err.message);b.disabled=false}}}
$("#trHome").addEventListener("click",e=>{const g=e.target.closest("[data-go]");if(g)return go(g.dataset.go);
  const a=e.target.closest("[data-act]");if(a&&gestor()){const t=trCur();
    if(a.dataset.act==="grupos"||a.dataset.act==="regrupos")return abrirGrupos(t);
    if(a.dataset.act==="jogos")return sortearJogos(t);
    if(a.dataset.act==="mata")return gerarMata(t)}
  const j=e.target.closest("[data-j]");if(j)abrirJogo(j.dataset.j)});

/* ---------- inscrição e equipes ---------- */
function renderEquipes(){const box=$("#trEq");if(!box)return;const t=trCur();
  if(!t){box.innerHTML=`<h2>Equipes</h2><div class="empty">Nenhum torneio criado.</div>`;return}
  const st=statusT(t);
  if(st==="inscricao"&&gestor()){
    if(!TR.ins||TR.ins.t!==t.id)TR.ins={t:t.id,set:new Set(t.inscritos?.length?t.inscritos:players.filter(p=>p.presente).map(p=>p.id))};
    const sel=TR.ins.set;const ps=players.slice().sort((a,b)=>a.genero.localeCompare(b.genero)||ovr(b)-ovr(a));
    const M=ps.filter(p=>p.genero==="M"&&sel.has(p.id)).length,F=ps.filter(p=>p.genero==="F"&&sel.has(p.id)).length;const n=Math.min(Math.floor(M/2),Math.floor(F/2));
    const sobra=(M-2*n)+(F-2*n);
    const lista=g=>ps.filter(p=>p.genero===g).map(p=>`<label class="chk"><input type="checkbox" data-ins="${p.id}" ${sel.has(p.id)?"checked":""}><span class="av">${p.foto?`<img src="${p.foto}" alt="">`:esc(initials(p.nome))}</span><b>${esc(p.nome)}</b><em>${p.pos}${p.pos2?"/"+p.pos2:""} · ${ovr(p)}</em></label>`).join("")||'<p class="note">Ninguém.</p>';
    box.innerHTML=`<div class="lg-head"><h2>Inscrição</h2><button class="btn ghost" id="trTodos" type="button">Marcar todos</button></div>
      <p class="note">Marque quem vai jogar. Cada equipe tem 2 homens e 2 mulheres.</p>
      <div class="tr-conta"><div><b>${M}</b><span>homens</span></div><div><b>${F}</b><span>mulheres</span></div><div class="ok"><b>${n}</b><span>equipes</span></div></div>
      ${sobra>0&&n>0?`<p class="note">${sobra} atleta${sobra>1?"s":""} vai${sobra>1?"o":""} ficar de reserva (sorteado${sobra>1?"s":""}).</p>`:""}
      <div class="grouplabel">Mulheres</div><div class="box tr-ins">${lista("F")}</div>
      <div class="grouplabel">Homens</div><div class="box tr-ins">${lista("M")}</div>
      <div class="tr-acao fixo"><button class="btn primary big" id="trSortEq" type="button" ${n<2?"disabled":""}>${n<2?"Precisa de pelo menos 4 homens e 4 mulheres":`Sortear ${n} equipes`}</button></div>`;
    return}
  const eqs=t.equipes||[];
  if(!eqs.length){box.innerHTML=`<h2>Equipes</h2><div class="empty">${gestor()?"":"As equipes ainda não foram sorteadas."}</div>`;return}
  const fs=eqs.map(forca),dif=Math.max(...fs)-Math.min(...fs);const anim=Date.now()-TR.animEq<4000;const mexe=gestor()&&st==="equipes";
  const eu=minhaEq(t);
  box.innerHTML=`<div class="lg-head"><h2>Equipes</h2>${mexe?`<button class="btn ghost" id="trReEq" type="button">Sortear de novo</button>`:""}</div>
    <div class="tr-equil"><span>Equilíbrio</span><b>${dif<=8?"Excelente":dif<=16?"Bom":"Regular"}</b><small>diferença de ${dif} pontos de força entre a mais forte e a mais fraca</small></div>
    ${mexe?`<p class="note">${TR.swap?"Agora toque em outro atleta do mesmo sexo para trocar.":"Toque num atleta e depois em outro do mesmo sexo para trocá-los de equipe. Toque no nome da equipe para renomear."}</p>`:""}
    <div class="tr-eqs">${eqs.map((e,i)=>`<div class="tr-equipe${anim?" revela":""}${eu&&eu.id===e.id?" minha":""}" style="--c:${e.cor};animation-delay:${i*.35}s">
      <header><button type="button" class="tr-nome" data-ren="${e.id}" ${mexe?"":"disabled"}><i></i>${esc(e.nome)}</button><span class="tr-forca">Força <b>${media(e).toFixed(1)}</b></span></header>
      <div class="tr-cards">${e.ids.map(id=>{const p=byId(id);return p?`<div class="tr-cw${TR.swap===id?" sel":""}" data-sw="${id}">${cardHTML(p,"mini")}</div>`:""}).join("")}</div></div>`).join("")}</div>
    ${(t.reservas||[]).length?`<div class="grouplabel">Reservas</div><div class="tr-cards res">${t.reservas.map(id=>{const p=byId(id);return p?`<div class="tr-cw${TR.swap===id?" sel":""}" data-sw="${id}">${cardHTML(p,"mini")}</div>`:""}).join("")}</div>`:""}
    ${mexe?`<div class="tr-acao"><button class="btn ghost" id="trVoltaIns" type="button">Voltar à inscrição</button><button class="btn primary big" data-act2="grupos" type="button">Confirmar e sortear grupos</button></div>`:""}`}
$("#trEq").addEventListener("change",e=>{const c=e.target.closest("[data-ins]");if(!c||!TR.ins)return;c.checked?TR.ins.set.add(c.dataset.ins):TR.ins.set.delete(c.dataset.ins);renderEquipes()});
$("#trEq").addEventListener("click",async e=>{const t=trCur();if(!t||!gestor())return;
  if(e.target.closest("#trTodos")){players.forEach(p=>TR.ins.set.add(p.id));return renderEquipes()}
  if(e.target.closest("#trSortEq")||e.target.closest("#trReEq")){const ids=e.target.closest("#trSortEq")?[...TR.ins.set]:t.inscritos;return sortearEquipes(t,ids)}
  if(e.target.closest("#trVoltaIns"))return trSalva(t,{status:"inscricao",equipes:[],reservas:[]});
  if(e.target.closest("[data-act2=grupos]"))return abrirGrupos(t);
  const rn=e.target.closest("[data-ren]");if(rn){const eq=eqDe(t,rn.dataset.ren);return abrirSheet(`<h3>Nome da equipe</h3><label class="f">Nome<input type="text" id="trRenI" maxlength="24" value="${esc(eq.nome)}"></label>
      <div class="two"><button class="btn" type="button" data-x>Cancelar</button><button class="btn primary" type="button" id="trRenOk">Salvar</button></div>`,()=>{
      $("#trRenOk").onclick=()=>{const v=$("#trRenI").value.trim();if(!v)return;const eqs=t.equipes.map(x=>x.id===eq.id?{...x,nome:v}:x);fecharSheet();trSalva(t,{equipes:eqs})}})}
  const sw=e.target.closest("[data-sw]");if(!sw||statusT(t)!=="equipes")return;const id=sw.dataset.sw;
  if(!TR.swap||TR.swap===id){TR.swap=TR.swap===id?null:id;return renderEquipes()}
  const a=byId(TR.swap),b=byId(id);if(!a||!b||a.genero!==b.genero){toast("Troque atletas do mesmo sexo");TR.swap=id;return renderEquipes()}
  const troca=arr=>arr.map(x=>x===a.id?b.id:x===b.id?a.id:x);
  const eqs=t.equipes.map(x=>({...x,ids:troca(x.ids)}));const rs=troca(t.reservas||[]);TR.swap=null;trSalva(t,{equipes:eqs,reservas:rs},"Atletas trocados")});
function sortearEquipes(t,ids){
  const ps=ids.map(byId).filter(Boolean);let M=embaralha(ps.filter(p=>p.genero==="M")),F=embaralha(ps.filter(p=>p.genero==="F"));
  const n=Math.min(Math.floor(M.length/2),Math.floor(F.length/2));if(n<2){toast("Precisa de pelo menos 4 homens e 4 mulheres");return}
  const resM=M.slice(2*n),resF=F.slice(2*n);M=M.slice(0,2*n);F=F.slice(0,2*n);
  const rz=new Map(ps.map(p=>[p.id,ovr(p)+Math.random()*4]));
  const T=Array.from({length:n},()=>[]);
  const cobra=(arr,inv)=>arr.sort((x,y)=>rz.get(y.id)-rz.get(x.id)).forEach((p,i)=>{const r=Math.floor(i/n),k=i%n;let idx=r%2===0?k:n-1-k;if(inv)idx=n-1-idx;T[idx].push(p)});
  cobra(M,false);cobra(F,true);
  const nLev=ps.filter(levanta).length;
  const custo=()=>{const s=T.map(e=>e.reduce((a,p)=>a+ovr(p),0));let c=Math.max(...s)-Math.min(...s);if(nLev>=n)c+=12*T.filter(e=>!e.some(levanta)).length;return c};
  for(let it=0;it<300;it++){let best=null,bv=custo();
    for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)for(let a=0;a<4;a++)for(let b=0;b<4;b++){const pa=T[i][a],pb=T[j][b];if(!pa||!pb||pa.genero!==pb.genero)continue;
      T[i][a]=pb;T[j][b]=pa;const v=custo();T[i][a]=pa;T[j][b]=pb;if(v<bv-.01){bv=v;best=[i,j,a,b]}}
    if(!best)break;const[i,j,a,b]=best;[T[i][a],T[j][b]]=[T[j][b],T[i][a]]}
  const cores=embaralha(TCORES);
  const equipes=T.map((e,i)=>({id:"e"+(i+1),nome:"Equipe "+(i+1),cor:cores[i%cores.length],ids:e.sort((x,y)=>x.genero.localeCompare(y.genero)).map(p=>p.id)}));
  TR.animEq=Date.now();TR.swap=null;
  trSalva(t,{inscritos:ids,equipes,reservas:resM.concat(resF).map(p=>p.id),status:"equipes",grupos:[],jogos:[],res:{}},`${n} equipes sorteadas`)}

/* ---------- grupos ---------- */
function sugestaoGrupos(n){return n<=5?1:n<=8?2:n<=12?3:4}
function abrirGrupos(t){const n=(t.equipes||[]).length;const g=sugestaoGrupos(n);
  const op=(a,b,sel)=>Array.from({length:b-a+1},(_,i)=>a+i).map(v=>`<option ${v===sel?"selected":""}>${v}</option>`).join("");
  abrirSheet(`<h3>Sorteio dos grupos</h3><p class="note">${n} equipes. As mais fortes viram cabeças de chave (uma por grupo); as outras são sorteadas por potes.</p>
    <div class="two"><label class="f">Grupos<select id="tgN">${op(1,Math.max(1,Math.floor(n/2)),g)}</select></label>
    <label class="f">Classificam por grupo<select id="tgK">${op(1,4,g===1?4:2)}</select></label></div>
    <p class="note" id="tgInfo"></p>
    <div class="two"><button class="btn" type="button" data-x>Cancelar</button><button class="btn primary" type="button" id="tgOk">Sortear</button></div>`,()=>{
    const info=()=>{const G=+$("#tgN").value,K=+$("#tgK").value,Q=G*K,P=2**Math.ceil(Math.log2(Math.max(2,Q)));
      const ok=K<=Math.floor(n/G)&&Q>=2;const ini=P<=2?"direto na final":"começa nas "+({4:"semifinais",8:"quartas de final",16:"oitavas de final"}[P]||"oitavas de final");
      $("#tgInfo").textContent=ok?`${Q} equipes no mata-mata, ${ini}${P>Q?`; ${P-Q} folga${P-Q>1?"s":""} para as melhores campanhas`:""}.`:"Grupos pequenos demais para essa quantidade de classificados.";$("#tgOk").disabled=!ok};
    $("#tgN").onchange=$("#tgK").onchange=info;info();
    $("#tgOk").onclick=()=>{const G=+$("#tgN").value,K=+$("#tgK").value;fecharSheet();sortearGrupos(t,G,K)}})}
function sortearGrupos(t,G,K){
  const fz=new Map(t.equipes.map(e=>[e.id,forca(e)+Math.random()*2]));const eqs=t.equipes.slice().sort((a,b)=>fz.get(b.id)-fz.get(a.id));
  const grupos=Array.from({length:G},(_,i)=>({nome:"ABCDEFGH"[i],eq:[]}));
  for(let p=0;p<eqs.length;p+=G){const pote=eqs.slice(p,p+G);const ordem=embaralha(grupos.filter(g=>g.eq.length===Math.floor(p/G)));
    (p===0?pote:embaralha(pote)).forEach((e,i)=>{const g=ordem[i]||grupos.slice().sort((a,b)=>a.eq.length-b.eq.length)[0];g.eq.push(e.id)})}
  TR.animGr=Date.now();TR.aba="grupos";
  trSalva(t,{grupos,classif:K,status:"grupos",jogos:[],res:{}},"Grupos sorteados");go("tabela")}

/* ---------- jogos ---------- */
function roundRobin(ids){const a=embaralha(ids);if(a.length%2)a.push(null);const n=a.length,rodadas=[];
  for(let r=0;r<n-1;r++){const jg=[];for(let i=0;i<n/2;i++){const x=a[i],y=a[n-1-i];if(x&&y)jg.push(r%2?[y,x]:[x,y])}rodadas.push(embaralha(jg));a.splice(1,0,a.pop())}
  return embaralha(rodadas)}
function agenda(lista,Q,slot0,ultimo){let slot=slot0;const fila=lista.slice();const jogou=new Set(ultimo||[]);
  while(fila.length){slot++;const usados=new Set(),deste=[];
    for(const pass of [0,1]){for(let i=0;i<fila.length&&deste.length<Q;i++){const j=fila[i];const ts=[j.a,j.b].filter(Boolean);
      if(ts.some(x=>usados.has(x)))continue;if(pass===0&&ts.some(x=>jogou.has(x)))continue;
      deste.push(j);ts.forEach(x=>usados.add(x));fila.splice(i,1);i--}}
    if(!deste.length){deste.push(fila.shift())}
    deste.forEach((j,k)=>{j.slot=slot;j.quadra=k+1});jogou.clear();usados.forEach(x=>jogou.add(x))}
  return slot}
function sortearJogos(t){const Q=+t.quadras||1;let id=0;const lista=[];
  const porGrupo=t.grupos.map(g=>roundRobin(g.eq));const maxR=Math.max(...porGrupo.map(r=>r.length));
  for(let r=0;r<maxR;r++)embaralha(t.grupos.map((g,gi)=>[g,porGrupo[gi][r]||[]])).forEach(([g,jg])=>jg.forEach(([a,b])=>lista.push({id:"j"+(++id),fase:"G",g:g.nome,a,b,melhor:1})));
  agenda(lista,Q,0);
  trSalva(t,{jogos:lista,res:{},status:"jogos"},`${lista.length} jogos sorteados`);go("jogos")}
function classificacao(t,g){const L={};g.eq.forEach(id=>L[id]={id,J:0,V:0,D:0,PP:0,PC:0});
  const js=(t.jogos||[]).filter(j=>j.fase==="G"&&j.g===g.nome);
  js.forEach(j=>{const r=res(t,j);if(r.st!=="fim")return;const v=vencedor(t,j);if(!v)return;const A=L[j.a],B=L[j.b];if(!A||!B)return;
    A.J++;B.J++;(r.sets||[]).forEach(s=>{A.PP+=s[0];A.PC+=s[1];B.PP+=s[1];B.PC+=s[0]});if(v===j.a){A.V++;B.D++}else{B.V++;A.D++}});
  const conf=(x,y)=>{const j=js.find(j=>(j.a===x.id&&j.b===y.id)||(j.a===y.id&&j.b===x.id));const v=j&&vencedor(t,j);return v===x.id?-1:v===y.id?1:0};
  return Object.values(L).sort((x,y)=>y.V-x.V||(y.PP-y.PC)-(x.PP-x.PC)||y.PP-x.PP||conf(x,y)||g.eq.indexOf(x.id)-g.eq.indexOf(y.id))}
function ordemSementes(P){let o=[1];while(o.length<P){const m=o.length*2+1;o=o.flatMap(x=>[x,m-x])}return o}
function gerarMata(t){
  const K=t.classif||2;const tiers=[];
  t.grupos.forEach(g=>classificacao(t,g).slice(0,K).forEach((l,pos)=>{(tiers[pos]=tiers[pos]||[]).push({...l,g:g.nome,pos})}));
  const seeds=tiers.flatMap(tr=>tr.sort((x,y)=>y.V-x.V||(y.PP-y.PC)-(x.PP-x.PC)||y.PP-x.PP));
  const Q=seeds.length;if(Q<2){toast("Poucas equipes classificadas");return}
  const P=2**Math.ceil(Math.log2(Q));const ord=ordemSementes(P);
  const pares=[];for(let i=0;i<P;i+=2)pares.push([seeds[ord[i]-1]||null,seeds[ord[i+1]-1]||null]);
  // evita repetir confronto do mesmo grupo logo na primeira rodada
  for(let i=0;i<pares.length;i++){const[x,y]=pares[i];if(!x||!y||x.g!==y.g)continue;
    for(let k=0;k<pares.length;k++){if(k===i)continue;const[u,w]=pares[k];if(!w||w.pos!==y.pos)continue;
      if(w.g!==x.g&&(!u||u.g!==y.g)){pares[i][1]=w;pares[k][1]=y;break}}}
  const nomeF=n=>n===2?"F":n===4?"S":n===8?"Q":"O";
  const jogos=(t.jogos||[]).filter(j=>j.fase==="G");let id=jogos.reduce((m,j)=>Math.max(m,+j.id.slice(1)),0);
  let slot=jogos.reduce((m,j)=>Math.max(m,j.slot||0),0);const Qd=+t.quadras||1;
  let rodada=pares.map(([x,y],i)=>({id:"j"+(++id),fase:nomeF(P),n:i+1,a:x?.id||null,b:y?.id||null,bye:!x||!y,melhor:1}));
  let n=P;const todas=[];
  while(true){const md=(nomeF(n)==="S"||nomeF(n)==="F")?(+t.setsKO||1):1;rodada.forEach(j=>j.melhor=md);
    const reais=rodada.filter(j=>!j.bye);slot=agenda(reais,Qd,slot);rodada.filter(j=>j.bye).forEach(j=>{j.slot=slot;j.quadra=0});
    todas.push(...rodada);if(n===2)break;
    const prox=[];for(let i=0;i<rodada.length;i+=2)prox.push({id:"j"+(++id),fase:nomeF(n/2),n:i/2+1,fa:{j:rodada[i].id,r:"v"},fb:{j:rodada[i+1].id,r:"v"},melhor:1});
    if(n/2===2&&t.terceiro&&n>=4){const ter={id:"j"+(++id),fase:"3",fa:{j:rodada[0].id,r:"p"},fb:{j:rodada[1].id,r:"p"},melhor:1};
      slot=agenda([ter],Qd,slot);todas.push(ter)}
    rodada=prox;n/=2}
  todas.forEach(j=>{if(j.fase!=="S"&&j.fase!=="Q"&&j.fase!=="O")delete j.n});
  TR.aba="chave";trSalva(t,{jogos:jogos.concat(todas),status:"mata"},"Mata-mata gerado");go("tabela")}
function renderJogos(){const box=$("#trJogos");if(!box)return;const t=trCur();
  const js=(t?.jogos||[]).filter(j=>!j.bye);if(!js.length){$("#trJF").innerHTML="";box.innerHTML=`<div class="empty">${t?"Os jogos aparecem aqui depois do sorteio.":"Nenhum torneio criado."}</div>`;return}
  const eu=minhaEq(t);const fs=[["todos","Todos"],["vivo","Ao vivo"],["pend","A jogar"],["fim","Encerrados"]];if(eu)fs.splice(1,0,["meu","Minha equipe"]);
  t.grupos.forEach(g=>fs.push(["g"+g.nome,"Grupo "+g.nome]));if(js.some(j=>j.fase!=="G"))fs.push(["ko","Mata-mata"]);
  $("#trJF").innerHTML=fs.map(([k,n])=>`<button type="button" class="chip" data-f="${k}" aria-pressed="${TR.filtro===k}">${n}</button>`).join("");
  const f=TR.filtro;const ok=j=>{const r=res(t,j).st;if(f==="vivo")return r==="vivo";if(f==="pend")return r!=="fim";if(f==="fim")return r==="fim";
    if(f==="meu")return eu&&(lado(t,j,"a")===eu.id||lado(t,j,"b")===eu.id);if(f==="ko")return j.fase!=="G";if(f[0]==="g"&&f!=="g")return j.fase==="G"&&j.g===f.slice(1);return true};
  const lista=js.filter(ok).sort((a,b)=>a.slot-b.slot||a.quadra-b.quadra);let h="",ult=null;
  lista.forEach(j=>{if(j.slot!==ult){ult=j.slot;h+=`<div class="lg-day"><h4>Rodada ${j.slot}</h4></div>`}h+=jogoLinha(t,j)});
  box.innerHTML=h||`<div class="empty">Nenhum jogo neste filtro.</div>`}
$("#trJF").addEventListener("click",e=>{const b=e.target.closest("[data-f]");if(b){TR.filtro=b.dataset.f;renderJogos()}});
$("#trJogos").addEventListener("click",e=>{const j=e.target.closest("[data-j]");if(j)abrirJogo(j.dataset.j)});

/* ---------- placar do jogo ---------- */
function abrirJogo(jid){const t=trCur();const j=jogoDe(t,jid);if(!j)return;
  const A=lado(t,j,"a"),B=lado(t,j,"b");if(!A||!B){toast("Esse jogo ainda depende de outros resultados");return}
  TR.jogo=jid;TR.manual=false;abrirSheet(`<div id="trPlac"></div>`,()=>renderPlacarJ());}
function renderPlacarJ(){const box=$("#trPlac");if(!box||!TR.jogo)return;const t=trCur();const j=jogoDe(t,TR.jogo);if(!j)return;
  const r=res(t,j),sets=(r.sets||[]).map(s=>s.slice());const A=lado(t,j,"a"),B=lado(t,j,"b"),ea=eqDe(t,A),eb=eqDe(t,B);
  const[sa,sb]=contaSets(t,j,sets);const need=Math.ceil(j.melhor/2);const acabou=sa>=need||sb>=need;
  const atual=sets.length&&!setFechado(t,j,sets.length-1,sets[sets.length-1])?sets.length-1:null;
  const cur=atual!=null?sets[atual]:(acabou&&sets.length?sets[sets.length-1]:[0,0]);const g=gestor()&&r.st!=="fim";const iSet=atual!=null?atual:sets.length;const alv=alvo(t,j,iSet);
  const cards=e=>`<div class="tr-cards mini4">${e.ids.map(byId).filter(Boolean).map(p=>cardHTML(p,"mini")).join("")}</div>`;
  box.innerHTML=`<div class="row spread"><span class="tr-tag">${FASE[j.fase]}${j.fase==="G"?" "+j.g:""} · Quadra ${j.quadra}</span><button class="btn ghost" type="button" data-x>Fechar</button></div>
    <p class="note" style="margin:6px 0">${j.melhor>1?`Melhor de 3 · Set ${Math.min(iSet+1,3)} até ${alv}`:`1 set até ${alv}`} · vence com 2 de vantagem</p>
    <div class="tr-board">
      <div class="tr-side" style="--c:${ea.cor}"><b class="tr-n">${esc(ea.nome)}</b>${cards(ea)}<button type="button" class="tr-pts" data-p="0" ${g&&!acabou?"":"disabled"}>${cur[0]}</button>${g?`<button type="button" class="minus" data-m="0">−1</button>`:""}${j.melhor>1?`<small>Sets <b>${sa}</b></small>`:""}</div>
      <div class="tr-side" style="--c:${eb.cor}"><b class="tr-n">${esc(eb.nome)}</b>${cards(eb)}<button type="button" class="tr-pts" data-p="1" ${g&&!acabou?"":"disabled"}>${cur[1]}</button>${g?`<button type="button" class="minus" data-m="1">−1</button>`:""}${j.melhor>1?`<small>Sets <b>${sb}</b></small>`:""}</div>
    </div>
    ${sets.length?`<p class="tr-sets big">${sets.map((s,i)=>`Set ${i+1}: <b>${s[0]}–${s[1]}</b>`).join(" · ")}</p>`:""}
    ${r.st==="fim"?`<div class="banner">Vitória de ${esc(nomeEq(t,vencedor(t,j)))}</div>${gestor()?`<button class="btn ghost" type="button" id="trReabre">Corrigir resultado</button>`:""}`:""}
    ${g&&acabou?`<button class="btn primary big" type="button" id="trFim">Encerrar jogo: vitória de ${esc(sa>sb?ea.nome:eb.nome)}</button>`:""}
    ${g&&!acabou?`<details class="tr-manual"${TR.manual?" open":""}><summary>Digitar o placar</summary>
      ${Array.from({length:j.melhor},(_,i)=>`<div class="two tr-mset"><label class="f">Set ${i+1} · ${esc(ea.nome)}<input type="number" min="0" inputmode="numeric" data-ms="${i}-0" value="${sets[i]?.[0]??""}"></label><label class="f">${esc(eb.nome)}<input type="number" min="0" inputmode="numeric" data-ms="${i}-1" value="${sets[i]?.[1]??""}"></label></div>`).join("")}
      <div class="err" id="trMErr"></div><button class="btn" type="button" id="trMOk">Lançar resultado</button></details>`:""}`;}
async function salvaRes(t,j,r){t.res=t.res||{};t.res[j.id]=r;renderTr();renderPlacarJ();
  try{await updateDoc(trRef(t.id),{["res."+j.id]:r})}catch(e){toast("Sem conexão: placar não salvo")}}
$("#trSheet").addEventListener("click",e=>{if(!TR.jogo)return;const t=trCur();const j=jogoDe(t,TR.jogo);if(!j||!gestor())return;
  const r=res(t,j);const sets=(r.sets||[]).map(s=>s.slice());
  const p=e.target.closest("[data-p]"),m=e.target.closest("[data-m]");
  if(p||m){const k=+(p||m).dataset[p?"p":"m"];let i=sets.length-1;
    if(m&&i<0)return;
    if(p&&(i<0||setFechado(t,j,i,sets[i]))){sets.push([0,0]);i++}
    if(p)sets[i][k]++;else{if(sets[i][k]===0)return;sets[i][k]--;if(sets[i][0]===0&&sets[i][1]===0&&i>0)sets.pop()}
    if(sets.length===1&&sets[0][0]===0&&sets[0][1]===0)return salvaRes(t,j,{sets:[],st:"ag"});
    return salvaRes(t,j,{sets,st:"vivo"})}
  if(e.target.closest("#trFim"))return salvaRes(t,j,{sets,st:"fim"}).then(()=>{toast("Jogo encerrado");fecharSheet()});
  if(e.target.closest("#trReabre")){const dep=(t.jogos||[]).filter(x=>(x.fa?.j===j.id||x.fb?.j===j.id)&&res(t,x).st!=="ag");
    if(dep.length){toast("O próximo jogo dessa chave já começou. Zere ele antes.");return}return salvaRes(t,j,{sets,st:"vivo"})}
  if(e.target.closest("#trMOk")){const ns=[];for(let i=0;i<j.melhor;i++){const a=$(`[data-ms="${i}-0"]`).value,b=$(`[data-ms="${i}-1"]`).value;if(a===""&&b==="")continue;ns.push([+a||0,+b||0])}
    const err=$("#trMErr");if(!ns.length){err.textContent="Digite o placar.";return}
    if(!ns.every((s,i)=>setFechado(t,j,i,s))){err.textContent=`Cada set precisa chegar a ${alvo(t,j,0)} com 2 de vantagem.`;return}
    const[a,b]=contaSets(t,j,ns),need=Math.ceil(j.melhor/2);if(a<need&&b<need){err.textContent="Falta set para decidir o jogo.";return}
    return salvaRes(t,j,{sets:ns,st:"fim"}).then(()=>{toast("Resultado lançado");fecharSheet()})}});
$("#trSheet").addEventListener("toggle",e=>{if(e.target.matches?.(".tr-manual"))TR.manual=e.target.open},true);

/* ---------- tabela: grupos e chave ---------- */
function renderTabela(){const box=$("#trTab");if(!box)return;const t=trCur();
  document.querySelectorAll("#trTabAba button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.a===TR.aba));
  if(!t||!(t.grupos||[]).length){box.innerHTML=`<div class="empty">${t?"Os grupos aparecem aqui depois do sorteio.":"Nenhum torneio criado."}</div>`;return}
  const eu=minhaEq(t);
  if(TR.aba==="grupos"){const K=t.classif||2;const anim=Date.now()-TR.animGr<6000;let k=0;
    box.innerHTML=t.grupos.map(g=>{const L=classificacao(t,g);
      return `<div class="tr-grupo"><h3>Grupo ${g.nome}</h3><table class="tr-tab"><thead><tr><th>#</th><th>Equipe</th><th>J</th><th>V</th><th>D</th><th>Saldo</th><th>PP</th></tr></thead><tbody>
      ${L.map((l,i)=>{const e=eqDe(t,l.id);return `<tr class="${i<K?"cl":""}${eu&&eu.id===l.id?" eu":""}${anim?" revela":""}" style="animation-delay:${(k++)*.45}s"><td>${i+1}</td><td><span class="tr-eq" style="--c:${e.cor}"><i></i>${esc(e.nome)}</span>${g.eq[0]===l.id?'<small class="cab">cabeça de chave</small>':""}</td><td>${l.J}</td><td>${l.V}</td><td>${l.D}</td><td>${l.PP-l.PC>0?"+":""}${l.PP-l.PC}</td><td>${l.PP}</td></tr>`}).join("")}</tbody></table></div>`}).join("")+
      `<p class="note">Classificam ${K} por grupo (em verde). Desempate: vitórias, saldo de pontos, pontos feitos e confronto direto.</p>`;return}
  const ko=(t.jogos||[]).filter(j=>j.fase!=="G");
  if(!ko.length){box.innerHTML=`<div class="empty">O mata-mata é gerado quando terminar a fase de grupos.</div>`;return}
  const ordem=["O","Q","S","F"].filter(f=>ko.some(j=>j.fase===f));
  box.innerHTML=`<div class="tr-chave">${ordem.map(f=>`<div class="tr-col"><h4>${FASE[f]}</h4>${ko.filter(j=>j.fase===f).map(j=>chaveJogo(t,j)).join("")}</div>`).join("")}</div>
    ${ko.find(j=>j.fase==="3")?`<div class="tr-col ter"><h4>3º lugar</h4>${chaveJogo(t,ko.find(j=>j.fase==="3"))}</div>`:""}`}
function chaveJogo(t,j){const r=res(t,j),v=vencedor(t,j);const[sa,sb]=contaSets(t,j,r.sets||[]);const cur=(r.sets||[]).slice(-1)[0]||["",""];
  const linha=l=>{const id=lado(t,j,l),e=eqDe(t,id);const pl=j.bye?"":r.st==="ag"?"":(j.melhor>1?(l==="a"?sa:sb):cur[l==="a"?0:1]);
    return `<div class="tr-cl${v&&v===id?" v":""}" style="--c:${e?.cor||"var(--line)"}"><i></i><span>${esc(id?nomeEq(t,id):(j.bye?"Folga":rotuloLado(t,j,l)))}</span><b>${pl}</b></div>`};
  return `<button type="button" class="tr-cj${r.st==="vivo"?" vivo":""}" data-j="${j.id}" ${j.bye?"disabled":""}>${linha("a")}${linha("b")}${j.bye?'<small>passa direto</small>':`<small>Quadra ${j.quadra} · Rodada ${j.slot}${j.melhor>1?" · MD3":""}</small>`}</button>`}
$("#trTabAba").addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(b){TR.aba=b.dataset.a;renderTabela()}});
$("#trTab").addEventListener("click",e=>{const j=e.target.closest("[data-j]");if(j)abrirJogo(j.dataset.j)});

/* ---------- compartilhar ---------- */
function textoTabela(t){let s=`🏐 ${t.nome}\n`;
  (t.grupos||[]).forEach(g=>{s+=`\nGrupo ${g.nome}\n`;classificacao(t,g).forEach((l,i)=>s+=`${i+1}. ${nomeEq(t,l.id)} — ${l.V}V ${l.D}D, saldo ${l.PP-l.PC}\n`)});
  const ko=(t.jogos||[]).filter(j=>j.fase!=="G"&&!j.bye);if(ko.length){s+=`\nMata-mata\n`;ko.forEach(j=>s+=linhaJ(t,j))}
  if(statusT(t)==="fim")s+=`\n🏆 Campeão: ${nomeEq(t,vencedor(t,t.jogos.find(j=>j.fase==="F")))}\n`;return s}
function linhaJ(t,j){const r=res(t,j);const pl=r.st==="ag"?"x":(r.sets||[]).map(x=>x.join("-")).join(", ");
  return `${FASE[j.fase]}${j.fase==="G"?" "+j.g:""} · Q${j.quadra}: ${lado(t,j,"a")?nomeEq(t,lado(t,j,"a")):rotuloLado(t,j,"a")} ${pl} ${lado(t,j,"b")?nomeEq(t,lado(t,j,"b")):rotuloLado(t,j,"b")}\n`}
$("#trShareT").onclick=()=>{const t=trCur();if(t)compartilhar(textoTabela(t),"Tabela do torneio")};
$("#trShareJ").onclick=()=>{const t=trCur();if(!t)return;let s=`🏐 ${t.nome} — jogos\n`,u=null;
  (t.jogos||[]).filter(j=>!j.bye).sort((a,b)=>a.slot-b.slot||a.quadra-b.quadra).forEach(j=>{if(j.slot!==u){u=j.slot;s+=`\nRodada ${u}\n`}s+=linhaJ(t,j)});compartilhar(s,"Jogos do torneio")};

/* ---------- mais ---------- */
function renderTMais(){const box=$("#trMais");if(!box||!me)return;const t=[];
  if(jogaEu())t.push(["carta","Minha carta","Sua carta de atleta"]);
  if(gestor())t.push(["elenco","Elenco","Cartas e atributos"],["time","Time","Membros e convites"]);
  t.push(["placar","Placar livre","Placar avulso"]);
  box.innerHTML=t.map(([v,n,d])=>`<button type="button" class="lg-tile" data-v="${v}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICON[v]}</svg><b>${n}</b><span>${d}</span></button>`).join("");
  const o=$("#trOutros");if(!o)return;const cur=trCur();
  o.innerHTML=`<div class="grouplabel">Torneios</div><div class="lg-list">${TR.lista.map(x=>`<button type="button" class="tr-outro${cur&&cur.id===x.id?" on":""}" data-t="${x.id}"><b>${esc(x.nome)}</b><span>${dataBR(x.data)} · ${({inscricao:"Inscrição",equipes:"Equipes",grupos:"Grupos",jogos:"Fase de grupos",mata:"Mata-mata",fim:"Encerrado"})[statusT(x)]}</span></button>`).join("")||'<div class="empty">Nenhum torneio ainda.</div>'}</div>
    ${gestor()?`<div class="tr-acao"><button class="btn" type="button" id="trNovoBtn">Novo torneio</button>${cur?`<button class="btn danger" type="button" id="trApaga">Apagar torneio selecionado</button>`:""}</div>`:""}`}
$("#trMais").addEventListener("click",e=>{const b=e.target.closest("[data-v]");if(b)go(b.dataset.v)});
let trApagaArm=false;
$("#trOutros").addEventListener("click",async e=>{const b=e.target.closest("[data-t]");if(b){TR.sel=b.dataset.t;renderTr();return go("torneio")}
  if(e.target.closest("#trNovoBtn")){TR.sel="__novo";renderTr();return go("torneio")}
  const d=e.target.closest("#trApaga");if(d){const t=trCur();if(!t)return;
    if(!trApagaArm){trApagaArm=true;d.textContent="Toque de novo para apagar “"+t.nome+"”";setTimeout(()=>{trApagaArm=false;renderTMais()},3500);return}
    trApagaArm=false;try{await deleteDoc(trRef(t.id));TR.sel=null;toast("Torneio apagado")}catch(err){toast("Não consegui apagar")}}});
/* "Novo torneio" mostra o formulário mesmo com outros torneios existentes */
const _renderHome=renderHome;
renderHome=function(){if(TR.sel==="__novo"){const box=$("#trHome");box.innerHTML=`<div class="tr-hero"><span class="tr-kicker">Novo</span><h2>Criar torneio</h2></div>${formCriar()}<button class="btn ghost" type="button" id="trCancNovo">Cancelar</button>`;ligaCriar();
  $("#trCancNovo").onclick=()=>{TR.sel=null;renderTr()};return}return _renderHome()};

/* ---------- folha (modal) ---------- */
function abrirSheet(html,depois){$("#trSheet").innerHTML=html;$("#trModal").hidden=false;depois&&depois()}
function fecharSheet(){$("#trModal").hidden=true;$("#trSheet").innerHTML="";TR.jogo=null}
$("#trModal").addEventListener("click",e=>{if(e.target.id==="trModal"||e.target.closest("[data-x]"))fecharSheet()});

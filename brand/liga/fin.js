
/* ================= LIGA: FINANCEIRO (só presidente e tesouraria) ================= */
const FIN={inf:[],pixPub:"",subs:null,ok:false,cfg:null,lanc:[],mes:null,aba:"mens",filtro:"aberto",delArm:null,tmpFam:null,item:null,cat:null};
ICON.financeiro='<rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6 10v5M18 10v5"/>';
LABEL.financeiro="Financeiro";
EXTRA.parent.financeiro="mais";
const CFG_PADRAO=()=>({valorInd:60,valorFam:100,venc:10,familias:[],inicio:mesAtual(),chave:"rosanibelan@gmail.com",recebedor:"LIGA DA JUSTICA VOLEI",cidade:"BRASIL"});
const CAT_DESP=["Quadra / aluguel","Material esportivo","Uniforme","Arbitragem","Evento / torneio","Transporte","Outros"];
const CAT_REC=["Diária de avulso","Uniforme","Evento / torneio","Patrocínio","Doação","Outros"];
const FORMAS=["Pix","Dinheiro","Cartão","Transferência"];
const brl=v=>(+v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const num2=v=>(+v||0).toFixed(2).replace(".",",");
function parseBRL(s){s=String(s||"").trim().replace(/[R$\s]/g,"");if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");const n=parseFloat(s);return isFinite(n)?Math.round(n*100)/100:NaN}
const soma=a=>Math.round(a.reduce((t,l)=>t+(+l.valor||0),0)*100)/100;
function mesAtual(){return ymd(new Date()).slice(0,7)}
const mesAdd=(m,n)=>{const[y,mm]=m.split("-").map(Number);const d=new Date(y,mm-1+n,1);return`${d.getFullYear()}-${pad2(d.getMonth()+1)}`};
const mesNome=m=>{const[y,mm]=m.split("-").map(Number);const s=new Date(y,mm-1,1).toLocaleDateString("pt-BR",{month:"long",year:"numeric"});return s.charAt(0).toUpperCase()+s.slice(1)};
const mesSo=m=>mesNome(m).split(" ")[0];
const ddmm=s=>s?`${s.slice(8,10)}/${s.slice(5,7)}`:"";
const cfg=()=>({...CFG_PADRAO(),...(FIN.cfg||{})});
const finAcesso=()=>!!me&&(me.papel==="presidente"||me.papel==="tesoureiro"||me.financeiro===true);
const cfgRef=()=>doc(db,"times",teamId,"fin_config","geral");
const lancCol=()=>collection(db,"times",teamId,"fin_lanc");

/* ---- liga/desliga as leituras conforme a permissão ---- */
function syncFin(){
  const ok=finAcesso();
  if(ok&&!FIN.subs){
    FIN.mes=FIN.mes||mesAtual();
    const a=onSnapshot(cfgRef(),s=>{FIN.cfg=s.exists()?s.data():null;FIN.ok=true;publicarPix();renderFin()},e=>console.warn("fin cfg",e));
    const b=onSnapshot(lancCol(),s=>{FIN.lanc=s.docs.map(d=>({id:d.id,...d.data()}));renderFin()},e=>console.warn("fin lanc",e));
    let primeira=true;
    const c=onSnapshot(collection(db,"times",teamId,"pag_informes"),s=>{
      if(!primeira)s.docChanges().forEach(x=>{if(x.type!=="added"||x.doc.metadata.hasPendingWrites)return;const d=x.doc.data();
        if(d.status==="pendente"&&d.uid!==user.uid){notify(`${d.nomes||d.nome} informou o Pix de ${mesSo(d.mes).toLowerCase()}. Confira no Financeiro.`,"financeiro");
          if(typeof notificarSistema==="function")notificarSistema("Pix informado",`${d.nomes||d.nome} · ${brl(d.valor)}`,"inf-"+x.doc.id)}});
      primeira=false;FIN.inf=s.docs.map(d=>({id:d.id,...d.data()}));renderFin()},e=>console.warn("fin informes",e));
    FIN.subs=[a,b,c];unsubs.push(()=>{a();b();c()});
  }else if(!ok&&FIN.subs){
    FIN.subs.forEach(f=>f());FIN.subs=null;FIN.ok=false;FIN.cfg=null;FIN.lanc=[];
    if(view==="financeiro")go("mais");
  }
}
EXTRA.reset.push(()=>{FIN.subs=null;FIN.ok=false;FIN.cfg=null;FIN.lanc=[];FIN.mes=null;FIN.inf=[];FIN.pixPub=""});
/* dados públicos para o atleta pagar (sem valores do caixa) */
async function publicarPix(){
  const c=cfg(),pub={chave:c.chave,recebedor:c.recebedor,cidade:c.cidade,valorInd:+c.valorInd,valorFam:+c.valorFam,venc:+c.venc,inicio:c.inicio,familias:c.familias||[]};
  const k=JSON.stringify(pub);if(k===FIN.pixPub)return;FIN.pixPub=k;
  try{await setDoc(doc(db,"times",teamId,"pix","config"),pub)}catch(e){FIN.pixPub="";console.warn("pix",e)}}
const infPend=()=>FIN.inf.filter(i=>i.status==="pendente").sort((a,b)=>(a.data||"").localeCompare(b.data||""));
async function criarInformesConfirmados(cartas,nomes,mes,valor,data,lancId){
  const donos=[...new Set(cartas.map(c=>members.find(m=>m.carta===c)?.uid).filter(Boolean))];
  for(const uid of donos){try{await addDoc(collection(db,"times",teamId,"pag_informes"),{uid,nome:members.find(m=>m.uid===uid)?.nome||"",cartas,nomes,mes,valor,data,status:"confirmado",lancId,origem:"tesouraria",em:serverTimestamp()})}catch(e){console.warn(e)}}}
EXTRA.render.push(()=>{syncFin();renderFin()});

/* ---- quem paga o quê ---- */
function cobrancas(){
  const c=cfg(),mens=players.filter(p=>p.tipo==="mensal"),ids=new Set(mens.map(p=>p.id)),usados=new Set(),out=[];
  (c.familias||[]).forEach(f=>{if(ids.has(f.a)&&ids.has(f.b)&&f.a!==f.b&&!usados.has(f.a)&&!usados.has(f.b)){
    usados.add(f.a);usados.add(f.b);out.push({key:[f.a,f.b].sort().join("+"),cartas:[f.a,f.b],fam:true,valor:+c.valorFam})}});
  mens.filter(p=>!usados.has(p.id)).forEach(p=>out.push({key:p.id,cartas:[p.id],fam:false,valor:+c.valorInd}));
  out.forEach(u=>u.nomes=u.cartas.map(id=>byId(id)?.nome||"?").join(" e "));
  return out.sort((a,b)=>a.nomes.localeCompare(b.nomes))}
const pagamento=(u,m)=>FIN.lanc.find(l=>l.cat==="mensalidade"&&l.mes===m&&(l.cartas||[]).some(c=>u.cartas.includes(c)));
function situacao(u,m){
  if(pagamento(u,m))return"pago";const atual=mesAtual();
  if(m>atual)return"futuro";if(m<atual||new Date().getDate()>(+cfg().venc||10))return"atrasado";return"pendente"}
function mesesAnteriores(u,m){let n=0;for(let x=cfg().inicio;x<m;x=mesAdd(x,1))if(!pagamento(u,x))n++;return n}

/* ---- tela ---- */
function renderFin(){
  const v=$("#v-financeiro");if(!v||!me)return;
  if(!finAcesso()||!FIN.ok){$("#finLista").innerHTML=`<div class="empty">${finAcesso()?"Carregando…":"Só o presidente e a tesouraria têm acesso a esta área."}</div>`;return}
  const m=FIN.mes,c=cfg();
  $("#finMesNome").textContent=mesNome(m);
  document.querySelectorAll("#finAba button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.a===FIN.aba));
  const doMes=FIN.lanc.filter(l=>(l.data||"").slice(0,7)===m);
  const rec=soma(doMes.filter(l=>l.tipo==="receita")),desp=soma(doMes.filter(l=>l.tipo==="despesa")),saldo=Math.round((rec-desp)*100)/100;
  const fim=m+"-31",ate=FIN.lanc.filter(l=>(l.data||"")<=fim);
  const caixa=Math.round((soma(ate.filter(l=>l.tipo==="receita"))-soma(ate.filter(l=>l.tipo==="despesa")))*100)/100;
  $("#finKpis").innerHTML=`<div class="kpi in"><span>Recebido em ${mesSo(m).toLowerCase()}</span><b>${brl(rec)}</b></div>
    <div class="kpi out"><span>Despesas</span><b>${brl(desp)}</b></div>
    <div class="kpi${saldo<0?" neg":""}"><span>Saldo do mês</span><b>${brl(saldo)}</b></div>
    <div class="kpi"><span>Vencimento</span><b>Dia ${+c.venc||10}</b></div>
    <div class="kpi caixa${caixa<0?" neg":""}"><span>Em caixa</span><b>${brl(caixa)}</b></div>`;
  const us=cobrancas(),st=us.map(u=>situacao(u,m)),pagos=st.filter(s=>s==="pago").length,atr=st.filter(s=>s==="atrasado").length;
  const falta=soma(us.filter((u,i)=>st[i]!=="pago")),total=us.length||1;
  $("#finProg").innerHTML=us.length?`<div class="row"><strong>Mensalidades de ${mesSo(m).toLowerCase()}</strong><small>${pagos} de ${us.length} pagas</small></div>
    <div class="fin-bar"><i class="p" style="width:${pagos/total*100}%"></i><i class="a" style="width:${atr/total*100}%"></i><i class="e" style="width:${(us.length-pagos-atr)/total*100}%"></i></div>
    <div class="row"><small>${atr?`${atr} em atraso · `:""}Falta receber ${brl(falta)}</small><small>Esperado ${brl(soma(us))}</small></div>`:"";
  $("#finProg").hidden=!us.length;
  const lista=$("#finLista"),topo=$("#finTopo");
  if(FIN.aba==="mens"){
    const pend=infPend();
    topo.innerHTML=(pend.length?`<div class="fin-inf"><h3>Pix informados pelos atletas (${pend.length})</h3>
      ${pend.map(i=>`<div class="r" data-inf="${i.id}"><div class="w"><b>${esc(i.nomes||i.nome)}</b><span>${mesNome(i.mes)} · ${brl(i.valor)} · informado em ${ddmm(i.data)}</span></div>
        ${i.temFoto?`<button class="btn ghost" type="button" data-inf-ver>Comprovante</button>`:""}<button class="btn ghost" type="button" data-inf-no>Não achei</button><button class="btn primary" type="button" data-inf-ok>Confirmar</button></div>`).join("")}</div>`:"")+
      `<div class="lg-chips" id="finFiltro">${[["aberto","Em aberto"],["pagos","Pagos"],["todos","Todos"]].map(([k,n])=>`<button class="chip" data-f="${k}" aria-pressed="${FIN.filtro===k}" type="button">${n}</button>`).join("")}</div>`;
    if(!us.length){lista.innerHTML=`<div class="empty">Nenhum mensalista no elenco. Abra a carta do jogador no Elenco e mude o tipo para <b>Mensalista</b>.</div>`;return}
    let rows=us.map((u,i)=>({u,s:st[i]}));
    if(FIN.filtro==="aberto")rows=rows.filter(r=>r.s!=="pago");else if(FIN.filtro==="pagos")rows=rows.filter(r=>r.s==="pago");
    rows.sort((a,b)=>({atrasado:0,pendente:1,futuro:2,pago:3}[a.s]-{atrasado:0,pendente:1,futuro:2,pago:3}[b.s])||a.u.nomes.localeCompare(b.u.nomes));
    const LBL={atrasado:"Atrasado",pendente:"A pagar",futuro:"A vencer",pago:"Pago"};
    lista.innerHTML=rows.length?rows.map(({u,s})=>{const pg=pagamento(u,m),ant=mesesAnteriores(u,m);
      return `<div class="fin-row st-${s}" data-key="${u.key}"><div class="fin-avs">${u.cartas.map(id=>`<span class="rk-av">${avatar(byId(id))}</span>`).join("")}</div>
      <div class="fin-who"><b>${esc(u.nomes)}</b><span><span class="fin-st">${LBL[s]}</span> · ${u.fam?"Família":"Individual"} ${brl(u.valor)}${ant?` · <em>${ant} ${ant===1?"mês anterior":"meses anteriores"} em aberto</em>`:""}</span></div>
      ${pg?`<button type="button" class="fin-pill" data-act="ver">✓ ${ddmm(pg.data)}</button>`:infPend().some(i=>i.mes===m&&(i.cartas||[]).some(c=>u.cartas.includes(c)))?`<span class="fin-pill inf">Pix informado</span>`:`<button type="button" class="btn primary fin-rec" data-act="receber">Receber</button>`}</div>`}).join("")
      :`<div class="empty">${FIN.filtro==="aberto"?"Todo mundo pagou este mês.":"Nenhum pagamento registrado neste mês."}</div>`;
  }else{
    const tipo=FIN.aba==="desp"?"despesa":"receita",desp=tipo==="despesa";
    let ls=doMes.filter(l=>l.tipo===tipo&&(desp||l.cat!=="mensalidade"));
    const tot=soma(ls),porCat={};ls.forEach(l=>{const c=l.cat||"Outros";porCat[c]=Math.round(((porCat[c]||0)+(+l.valor||0))*100)/100});
    const cats=Object.entries(porCat).sort((x,y)=>y[1]-x[1]);if(FIN.cat&&!porCat[FIN.cat])FIN.cat=null;
    topo.innerHTML=`<button class="btn primary" type="button" id="finNovo" style="width:100%">+ ${desp?"Nova despesa":"Nova receita"}</button>`+
      (cats.length?`<div class="fin-cats${desp?"":" rec"}"><div class="row spread"><strong>${desp?"Para onde foi o dinheiro":"De onde veio o dinheiro"}</strong><small>${brl(tot)}</small></div>
      ${cats.map(([c,v])=>`<button type="button" class="fin-cat${FIN.cat===c?" on":""}" data-cat="${esc(c)}"><span>${esc(c)}</span><i><i style="width:${Math.max(4,v/cats[0][1]*100)}%"></i></i><b>${brl(v)}</b><small>${Math.round(v/(tot||1)*100)}%</small></button>`).join("")}
      ${FIN.cat?`<button type="button" class="chip" data-cat="" style="align-self:flex-start">Mostrando só ${esc(FIN.cat)} · ver todas</button>`:`<small class="note">Toque numa categoria para ver só os lançamentos dela.</small>`}</div>`:"");
    if(FIN.cat)ls=ls.filter(l=>(l.cat||"Outros")===FIN.cat);
    ls.sort((x,y)=>(y.data||"").localeCompare(x.data||""));
    lista.innerHTML=ls.length?ls.map(l=>{const n=(l.itens||[]).length,meta=[l.cat,l.para,n?`${n} ${n===1?"item":"itens"}`:"",l.temFoto?"comprovante":""].filter(Boolean);
      return `<div class="fin-lanc" data-id="${l.id}" data-act="det" role="button" tabindex="0"><div class="dt"><b>${(l.data||"").slice(8,10)}</b><span>${mesSo((l.data||m).slice(0,7)).slice(0,3)}</span></div>
      <div class="fin-who"><b>${esc(l.desc||l.cat)}</b><span>${meta.map(esc).join(" · ")}</span></div>
      <strong class="fin-val ${desp?"out":"in"}">${desp?"−":"+"}${brl(l.valor)}</strong></div>`}).join("")
      :`<div class="empty">Nenhuma ${desp?"despesa":"receita extra"} em ${mesSo(m).toLowerCase()}.</div>`;
  }
}
$("#finPrev").onclick=()=>{FIN.mes=mesAdd(FIN.mes,-1);FIN.cat=null;renderFin()};
$("#finNext").onclick=()=>{FIN.mes=mesAdd(FIN.mes,1);FIN.cat=null;renderFin()};
$("#finAba").addEventListener("click",e=>{const b=e.target.closest("button");if(b){FIN.aba=b.dataset.a;FIN.delArm=null;FIN.cat=null;renderFin()}});
$("#finTopo").addEventListener("click",async e=>{const f=e.target.closest("[data-f]");if(f){FIN.filtro=f.dataset.f;renderFin();return}
  const r=e.target.closest("[data-inf]");if(r){const i=FIN.inf.find(x=>x.id===r.dataset.inf);if(!i)return;
    if(e.target.closest("[data-inf-ver]"))return verComprovanteInf(i);
    if(e.target.closest("[data-inf-ok]"))return confirmarInf(i,e.target);
    if(e.target.closest("[data-inf-no]")){const b=e.target;if(!b.dataset.arm){b.dataset.arm="1";b.textContent="Tocar de novo";return}
      try{await updateDoc(doc(db,"times",teamId,"pag_informes",i.id),{status:"recusado",porUid:user.uid});toast("Marcado como não encontrado")}catch(x){toast("Não consegui salvar")}return}}
  const ct=e.target.closest("[data-cat]");if(ct){const c=ct.dataset.cat||null;FIN.cat=FIN.cat===c?null:c;renderFin();return}
  if(e.target.closest("#finNovo"))abrirLanc(FIN.aba==="desp"?"despesa":"receita")});
$("#finLista").addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  if(a==="receber"||a==="ver"){const u=cobrancas().find(x=>x.key===b.closest(".fin-row").dataset.key);if(!u)return;return a==="receber"?abrirReceber(u):abrirPago(u)}
  if(a==="det"){const l=FIN.lanc.find(x=>x.id===b.dataset.id);if(l)abrirDet(l)}
});

async function confirmarInf(i,b){
  b.disabled=true;
  try{const r=await addDoc(lancCol(),{criadoPor:user.uid,porNome:me.nome||"",em:serverTimestamp(),tipo:"receita",cat:"mensalidade",mes:i.mes,cartas:i.cartas,nomes:i.nomes||i.nome,valor:+i.valor,forma:"Pix",data:i.data||hoje(),obs:"Informado pelo atleta no app",desc:`Mensalidade ${mesSo(i.mes).toLowerCase()} – ${i.nomes||i.nome}`,temFoto:false,infId:i.id});
    await updateDoc(doc(db,"times",teamId,"pag_informes",i.id),{status:"confirmado",lancId:r?.id||"",porUid:user.uid});
    const outros=(i.cartas||[]).map(c=>members.find(m=>m.carta===c)?.uid).filter(u=>u&&u!==i.uid);
    if(outros.length)await criarInformesConfirmados(i.cartas.filter(c=>outros.includes(members.find(m=>m.carta===c)?.uid)),i.nomes||i.nome,i.mes,+i.valor,i.data||hoje(),r?.id||"");
    toast("Pagamento confirmado")}catch(x){b.disabled=false;toast("Não consegui confirmar: "+(x.code||x.message))}}
async function verComprovanteInf(i){
  finAbrir(`${cab("Comprovante")}<p class="note" style="margin:0">${esc(i.nomes||i.nome)} · ${mesNome(i.mes)} · ${brl(i.valor)}</p><figure class="fin-comp" id="fiComp"><figcaption>Carregando…</figcaption></figure>`);FIN.item={modo:"ver"};
  try{const d=await getDoc(doc(db,"times",teamId,"pag_comp",i.id));$("#fiComp").innerHTML=d.exists()?`<img src="${d.data().foto}" alt="Comprovante">`:"<figcaption>Sem comprovante.</figcaption>"}catch(x){$("#fiComp").innerHTML="<figcaption>Não consegui carregar.</figcaption>"}}
/* ---- janelas ---- */
const finAbrir=html=>{$("#finSheet").innerHTML=html;$("#finModal").hidden=false};
const finFechar=()=>{$("#finModal").hidden=true;FIN.item=null};
$("#finModal").addEventListener("click",e=>{if(e.target.id==="finModal"||e.target.closest("[data-x]"))finFechar()});
const optList=(arr,sel)=>arr.map(x=>`<option ${x===sel?"selected":""}>${esc(x)}</option>`).join("");
const cab=t=>`<div class="row spread"><h2>${t}</h2><button class="btn ghost" type="button" data-x>Fechar</button></div>`;

function abrirReceber(u){
  FIN.item={modo:"receber",u};
  finAbrir(`${cab("Receber mensalidade")}
    <p class="note" style="margin:0"><b>${esc(u.nomes)}</b> · ${mesNome(FIN.mes)} · ${u.fam?"Plano família":"Individual"}</p>
    <div class="two"><label class="f">Valor (R$)<input type="text" id="fiValor" inputmode="decimal" value="${num2(u.valor)}"></label>
      <label class="f">Forma<select id="fiForma">${optList(FORMAS,"Pix")}</select></label></div>
    <label class="f">Data do pagamento<input type="date" id="fiData" value="${hoje()}"></label>
    <label class="f">Observação<input type="text" id="fiObs" maxlength="120" placeholder="Opcional"></label>
    <div class="err" id="fiErr"></div>
    <button class="btn primary" type="submit" id="fiSave">Confirmar recebimento</button>`)}
function abrirPago(u){
  const pg=pagamento(u,FIN.mes);if(!pg)return;FIN.item={modo:"pago",u,pg};
  finAbrir(`${cab("Mensalidade paga")}
    <div class="fin-det"><span>Quem</span><b>${esc(pg.nomes||u.nomes)}</b><span>Referente a</span><b>${mesNome(pg.mes)}</b>
      <span>Valor</span><b>${brl(pg.valor)}</b><span>Pago em</span><b>${ddmm(pg.data)} · ${esc(pg.forma||"")}</b>
      ${pg.obs?`<span>Obs.</span><b>${esc(pg.obs)}</b>`:""}<span>Registrado por</span><b>${esc(pg.porNome||"")}</b></div>
    <button class="btn" type="button" id="fiRecibo">Enviar recibo</button>
    <button class="btn danger" type="button" id="fiDesfazer">Desfazer pagamento</button>
    <div class="err" id="fiErr"></div>`)}
const compRef=id=>doc(db,"times",teamId,"fin_comp",id);
function comprovante(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{
  const k=Math.min(1,1100/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);let q=.72,u=c.toDataURL("image/jpeg",q);while(u.length>600000&&q>.3){q-=.1;u=c.toDataURL("image/jpeg",q)}res(u)};
  img.onerror=rej;img.src=r.result};r.onerror=rej;r.readAsDataURL(file)})}
async function abrirLanc(tipo,l){
  const desp=tipo==="despesa",cats=desp?CAT_DESP:CAT_REC,v=l||{desc:"",para:"",valor:"",data:FIN.mes===mesAtual()?hoje():FIN.mes+"-01",cat:cats[0],forma:"Pix",obs:""};
  FIN.item={modo:"lanc",tipo,l:l||null,itens:(l?.itens||[]).map(i=>({...i})),foto:"",fotoOrig:""};
  finAbrir(`${cab(l?(desp?"Editar despesa":"Editar receita"):(desp?"Nova despesa":"Nova receita"))}
    <label class="f">Descrição<input type="text" id="fiDesc" maxlength="60" value="${esc(v.desc||"")}" placeholder="${desp?"Ex.: Aluguel da quadra do Furlan":"Ex.: Diária do avulso João"}"></label>
    <label class="f">${desp?"Pago a (quem recebeu)":"Recebido de"}<input type="text" id="fiPara" maxlength="60" value="${esc(v.para||"")}" placeholder="${desp?"Ex.: Quadra do Furlan, Loja Esporte Total":"Ex.: João (avulso), Patrocinador X"}"></label>
    <div class="box"><div class="row spread"><h3>Itens</h3><span class="note">opcional</span></div>
      <div class="fin-ithead" id="fiItHead" hidden><span>Item</span><span>Qtd</span><span>Valor un.</span><span></span></div>
      <div id="fiItens" class="lg-list" style="gap:6px"></div>
      <button class="btn ghost" type="button" id="fiAddIt">+ Adicionar item</button></div>
    <div class="two"><label class="f">Valor total (R$)<input type="text" id="fiValor" inputmode="decimal" value="${v.valor?num2(v.valor):""}" placeholder="0,00"></label>
      <label class="f">Data<input type="date" id="fiData" value="${esc(v.data)}"></label></div>
    <div class="two"><label class="f">Categoria<select id="fiCat">${optList(cats,v.cat)}</select></label>
      <label class="f">Forma<select id="fiForma">${optList(FORMAS,v.forma)}</select></label></div>
    <label class="f">Observação<input type="text" id="fiObs" maxlength="200" value="${esc(v.obs||"")}" placeholder="Opcional"></label>
    <div class="fin-foto"><span id="fiFotoPrev"></span>
      <label class="btn pbtn" for="fiCam"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>Foto do comprovante</label>
      <label class="btn ghost pbtn" for="fiGal">Galeria</label><button class="btn ghost" type="button" id="fiFotoRm" hidden>Remover foto</button></div>
    <input type="file" id="fiCam" accept="image/*" capture="environment" class="vh"><input type="file" id="fiGal" accept="image/*" class="vh">
    <div class="err" id="fiErr"></div>
    <button class="btn primary" type="submit" id="fiSave">${l?"Salvar alterações":(desp?"Lançar despesa":"Lançar receita")}</button>`);
  renderItens();
  if(l?.temFoto){try{const d=await getDoc(compRef(l.id));if(d.exists()&&FIN.item?.l===l){FIN.item.foto=FIN.item.fotoOrig=d.data().foto;fotoPrev()}}catch(e){}}}
function fotoPrev(){const it=FIN.item,p=$("#fiFotoPrev");if(!p)return;p.innerHTML=it.foto?`<img src="${it.foto}" alt="Comprovante">`:"";$("#fiFotoRm").hidden=!it.foto}
function renderItens(){const it=FIN.item,box=$("#fiItens");if(!box)return;
  box.innerHTML=it.itens.map((x,i)=>`<div class="fin-it"><input type="text" class="iD" value="${esc(x.d)}" placeholder="Ex.: Bola Mikasa" maxlength="50"><input type="text" class="iQ" inputmode="numeric" value="${x.q||1}" aria-label="Quantidade"><input type="text" class="iV" inputmode="decimal" value="${x.v?num2(x.v):""}" placeholder="0,00" aria-label="Valor unitário"><button type="button" class="x" data-rmit="${i}" aria-label="Remover item">✕</button></div>`).join("");
  $("#fiItHead").hidden=!it.itens.length;totalItens()}
function lerItens(){FIN.item.itens=[...document.querySelectorAll(".fin-it")].map(r=>({d:r.querySelector(".iD").value.trim(),q:Math.max(1,parseInt(r.querySelector(".iQ").value)||1),v:parseBRL(r.querySelector(".iV").value)||0}))}
function totalItens(){const it=FIN.item,v=$("#fiValor");if(!v)return;
  if(it.itens.length){v.value=num2(Math.round(it.itens.reduce((t,x)=>t+x.q*x.v,0)*100)/100);v.readOnly=true}else v.readOnly=false}
async function abrirDet(l){
  const desp=l.tipo==="despesa",itens=l.itens||[];FIN.item={modo:"det",l};
  finAbrir(`${cab(desp?"Despesa":"Receita")}
    <div class="fin-big ${desp?"out":"in"}">${desp?"−":"+"}${brl(l.valor)}</div>
    <h3 style="margin:0">${esc(l.desc||l.cat)}</h3>
    <div class="fin-det"><span>Data</span><b>${ddmm(l.data)}/${(l.data||"").slice(0,4)}</b><span>Categoria</span><b>${esc(l.cat||"")}</b>
      ${l.para?`<span>${desp?"Pago a":"Recebido de"}</span><b>${esc(l.para)}</b>`:""}<span>Forma</span><b>${esc(l.forma||"")}</b>
      ${l.obs?`<span>Obs.</span><b>${esc(l.obs)}</b>`:""}<span>Lançado por</span><b>${esc(l.porNome||"")}</b></div>
    ${itens.length?`<div style="overflow-x:auto"><table class="fin-itens"><thead><tr><th>Item</th><th>Qtd</th><th>Unit.</th><th>Total</th></tr></thead>
      <tbody>${itens.map(i=>`<tr><td>${esc(i.d)}</td><td>${i.q}</td><td>${brl(i.v)}</td><td>${brl(i.q*i.v)}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td colspan="3">Total</td><td>${brl(l.valor)}</td></tr></tfoot></table></div>`:""}
    ${l.temFoto?`<figure class="fin-comp" id="fiComp"><figcaption>Carregando comprovante…</figcaption></figure>`:`<p class="note" style="margin:0">Sem foto do comprovante.</p>`}
    <div class="row"><button class="btn" type="button" id="fiEdit">Editar</button><button class="btn danger" type="button" id="fiDel">Apagar</button></div>
    <div class="err" id="fiErr"></div>`);
  if(l.temFoto){try{const d=await getDoc(compRef(l.id));const f=$("#fiComp");if(f&&FIN.item?.l===l)f.innerHTML=d.exists()?`<img src="${d.data().foto}" alt="Comprovante"><figcaption>Comprovante</figcaption>`:"<figcaption>Comprovante não encontrado.</figcaption>"}catch(e){const f=$("#fiComp");if(f)f.innerHTML="<figcaption>Não consegui carregar o comprovante.</figcaption>"}}}
function abrirConfig(){
  const c=cfg();FIN.item={modo:"cfg"};FIN.tmpFam=(c.familias||[]).map(f=>({...f}));
  const pres=me.papel==="presidente";
  finAbrir(`${cab("Configurações")}
    <div class="two"><label class="f">Mensalidade (R$)<input type="text" id="fcInd" inputmode="decimal" value="${num2(c.valorInd)}"></label>
      <label class="f">Plano família, 2 pessoas (R$)<input type="text" id="fcFam" inputmode="decimal" value="${num2(c.valorFam)}"></label></div>
    <div class="two"><label class="f">Dia do vencimento<input type="number" id="fcVenc" min="1" max="28" value="${+c.venc||10}"></label>
      <label class="f">Controle desde<input type="month" id="fcIni" value="${c.inicio}"></label></div>
    <div class="box"><h3>Pix da Liga</h3><p class="note" style="margin:0">Usado para os atletas pagarem pelo app.</p>
      <label class="f">Chave Pix<input type="text" id="fcChave" value="${esc(c.chave||"")}" autocomplete="off"></label>
      <div class="two"><label class="f">Nome de quem recebe<input type="text" id="fcNome" maxlength="25" value="${esc(c.recebedor||"")}"></label>
        <label class="f">Cidade<input type="text" id="fcCid" maxlength="15" value="${esc(c.cidade||"")}"></label></div></div>
    <div class="box"><h3>Planos família</h3><div id="fcFams"></div>
      <div class="two"><select id="fcA"></select><select id="fcB"></select></div>
      <button class="btn" type="button" id="fcAdd">Juntar no plano família</button></div>
    ${pres?`<div class="box"><h3>Tesouraria</h3><p class="note" style="margin:0">Quem pode ver e mexer no financeiro, além de você e de quem tem o cargo Tesoureiro(a).</p>
      ${members.filter(x=>x.papel!=="presidente").map(x=>`<label class="chk"><input type="checkbox" class="fcAc" value="${x.uid}" ${x.financeiro?"checked":""}><b>${esc(x.nome)}</b><em style="color:var(--muted)">${PAPEL[x.papel]||""}</em></label>`).join("")||'<p class="note">Nenhum outro membro no time ainda.</p>'}</div>`:""}
    <div class="err" id="fiErr"></div>
    <button class="btn primary" type="submit" id="fiSave">Salvar</button>`);
  renderFams()}
function renderFams(){
  const box=$("#fcFams");if(!box)return;const nm=id=>esc(byId(id)?.nome||"?");
  box.innerHTML=FIN.tmpFam.length?FIN.tmpFam.map((f,i)=>`<div class="fin-fam"><b>${nm(f.a)} e ${nm(f.b)}</b><button class="btn ghost" type="button" data-rm="${i}">Separar</button></div>`).join(""):'<p class="note" style="margin:0">Nenhum plano família. Escolha duas pessoas abaixo.</p>';
  const usados=new Set(FIN.tmpFam.flatMap(f=>[f.a,f.b]));
  const op=players.filter(p=>p.tipo==="mensal"&&!usados.has(p.id)).sort((a,b)=>a.nome.localeCompare(b.nome)).map(p=>`<option value="${p.id}">${esc(p.nome)}</option>`).join("");
  $("#fcA").innerHTML='<option value="">Pessoa 1</option>'+op;$("#fcB").innerHTML='<option value="">Pessoa 2</option>'+op}
$("#finCfgBtn").onclick=abrirConfig;
$("#finSheet").addEventListener("click",async e=>{
  if(e.target.id==="fiAddIt"){lerItens();FIN.item.itens.push({d:"",q:1,v:0});renderItens();const r=document.querySelectorAll(".fin-it .iD");r[r.length-1]?.focus();return}
  const ri=e.target.closest("[data-rmit]");if(ri){lerItens();FIN.item.itens.splice(+ri.dataset.rmit,1);renderItens();return}
  if(e.target.id==="fiFotoRm"){FIN.item.foto="";fotoPrev();return}
  if(e.target.id==="fiEdit"){const l=FIN.item.l;return abrirLanc(l.tipo,l)}
  if(e.target.id==="fiDel"){const b=e.target;if(!b.dataset.arm){b.dataset.arm="1";b.textContent="Toque de novo para apagar";return}
    const l=FIN.item.l;try{await deleteDoc(doc(db,"times",teamId,"fin_lanc",l.id));if(l.temFoto)deleteDoc(compRef(l.id)).catch(()=>{});finFechar();toast("Lançamento apagado")}catch(x){$("#fiErr").textContent="Não consegui apagar."}return}
  const rm=e.target.closest("[data-rm]");if(rm){FIN.tmpFam.splice(+rm.dataset.rm,1);return renderFams()}
  if(e.target.id==="fcAdd"){const a=$("#fcA").value,b=$("#fcB").value;
    if(!a||!b||a===b){$("#fiErr").textContent="Escolha duas pessoas diferentes.";return}
    $("#fiErr").textContent="";FIN.tmpFam.push({a,b});return renderFams()}
  if(e.target.id==="fiRecibo"){const pg=FIN.item.pg;
    const t=`Recibo – ${document.title}\nRecebemos de ${pg.nomes} o valor de ${brl(pg.valor)} referente à mensalidade de ${mesNome(pg.mes)}.\nPago em ${ddmm(pg.data)} via ${pg.forma}.`;
    if(temNativo())compartilhar(t,"Enviar recibo");else copiar(t).then(ok=>toast(ok?"Recibo copiado":"Não consegui copiar"));return}
  if(e.target.id==="fiDesfazer"){const b=e.target;
    if(!b.dataset.arm){b.dataset.arm="1";b.textContent="Toque de novo para desfazer";return}
    try{const pid=FIN.item.pg.id;await deleteDoc(doc(db,"times",teamId,"fin_lanc",pid));
      for(const i of FIN.inf.filter(x=>x.lancId===pid))await deleteDoc(doc(db,"times",teamId,"pag_informes",i.id)).catch(()=>{});
      finFechar();toast("Pagamento desfeito")}catch(x){$("#fiErr").textContent="Não consegui desfazer."}}
});
$("#finSheet").addEventListener("input",e=>{if(e.target.closest(".fin-it")){lerItens();totalItens()}});
$("#finSheet").addEventListener("change",async e=>{if(e.target.id!=="fiCam"&&e.target.id!=="fiGal")return;const f=e.target.files[0];e.target.value="";if(!f)return;
  try{FIN.item.foto=await comprovante(f);fotoPrev()}catch(x){toast("Não consegui abrir essa foto")}});
$("#finSheet").addEventListener("submit",async e=>{
  e.preventDefault();const it=FIN.item,err=$("#fiErr"),b=$("#fiSave");if(!it)return;err.textContent="";
  const base={criadoPor:user.uid,porNome:me.nome||"",em:serverTimestamp()};
  try{
    if(it.modo==="receber"){
      const valor=parseBRL($("#fiValor").value),data=$("#fiData").value;
      if(!(valor>0)){err.textContent="Digite um valor válido.";return}if(!data){err.textContent="Escolha a data.";return}
      b.disabled=true;
      const r=await addDoc(lancCol(),{...base,tipo:"receita",cat:"mensalidade",mes:FIN.mes,cartas:it.u.cartas,nomes:it.u.nomes,valor,forma:$("#fiForma").value,data,obs:$("#fiObs").value.trim(),desc:`Mensalidade ${mesSo(FIN.mes).toLowerCase()} – ${it.u.nomes}`});
      await criarInformesConfirmados(it.u.cartas,it.u.nomes,FIN.mes,valor,data,r?.id||"");
      finFechar();toast("Recebimento registrado");
    }else if(it.modo==="lanc"){
      lerItens();const itens=it.itens.filter(x=>x.d||x.v);
      if(itens.some(x=>!x.d)){err.textContent="Dê um nome para cada item.";return}
      if(itens.some(x=>!(x.v>0))){err.textContent="Informe o valor de cada item.";return}
      const valor=itens.length?Math.round(itens.reduce((t,x)=>t+x.q*x.v,0)*100)/100:parseBRL($("#fiValor").value);
      const data=$("#fiData").value,desc=$("#fiDesc").value.trim();
      if(!desc){err.textContent="Escreva uma descrição.";return}if(!(valor>0)){err.textContent="Digite um valor válido.";return}if(!data){err.textContent="Escolha a data.";return}
      b.disabled=true;
      const dados={tipo:it.tipo,cat:$("#fiCat").value,desc,para:$("#fiPara").value.trim(),valor,data,forma:$("#fiForma").value,obs:$("#fiObs").value.trim(),itens,temFoto:!!it.foto};
      let id;
      if(it.l){await updateDoc(doc(db,"times",teamId,"fin_lanc",it.l.id),dados);id=it.l.id}
      else{const r=await addDoc(lancCol(),{...base,...dados});id=r?.id}
      if(id&&it.foto&&it.foto!==it.fotoOrig)await setDoc(compRef(id),{foto:it.foto});
      if(id&&!it.foto&&it.fotoOrig)await deleteDoc(compRef(id)).catch(()=>{});
      finFechar();toast(it.l?"Alterações salvas":(it.tipo==="despesa"?"Despesa lançada":"Receita lançada"));
    }else if(it.modo==="cfg"){
      const ind=parseBRL($("#fcInd").value),fam=parseBRL($("#fcFam").value),venc=Math.min(28,Math.max(1,parseInt($("#fcVenc").value)||10)),ini=$("#fcIni").value||mesAtual();
      if(!(ind>0)||!(fam>0)){err.textContent="Confira os valores.";return}
      b.disabled=true;
      const chave=$("#fcChave").value.trim();if(!chave){err.textContent="Informe a chave Pix.";b.disabled=false;return}
      await setDoc(cfgRef(),{valorInd:ind,valorFam:fam,venc,inicio:ini,familias:FIN.tmpFam,chave,recebedor:$("#fcNome").value.trim()||"LIGA DA JUSTICA VOLEI",cidade:$("#fcCid").value.trim()||"BRASIL"},{merge:true});
      if(me.papel==="presidente"){const bt=writeBatch(db);let n=0;
        document.querySelectorAll(".fcAc").forEach(c=>{const m=members.find(x=>x.uid===c.value);if(m&&!!m.financeiro!==c.checked){bt.update(doc(db,"times",teamId,"membros",m.uid),{financeiro:c.checked});n++}});
        if(n)await bt.commit()}
      finFechar();toast("Configuração salva");
    }
  }catch(x){b.disabled=false;err.textContent="Não consegui salvar: "+(x.code||x.message)}
});

/* ---- resumo para o WhatsApp ---- */
$("#finCopiar").onclick=()=>{
  const m=FIN.mes,doMes=FIN.lanc.filter(l=>(l.data||"").slice(0,7)===m);
  const rec=soma(doMes.filter(l=>l.tipo==="receita")),desp=soma(doMes.filter(l=>l.tipo==="despesa"));
  const us=cobrancas(),abertos=us.filter(u=>!pagamento(u,m));
  const t=`💰 ${document.title} – ${mesNome(m)}\nRecebido: ${brl(rec)}\nDespesas: ${brl(desp)}\nSaldo do mês: ${brl(rec-desp)}\n\nMensalidades: ${us.length-abertos.length} de ${us.length} pagas`+
    (abertos.length?`\nEm aberto (${brl(soma(abertos))}): ${abertos.map(u=>u.nomes).join(", ")}`:"");
  const pc={};doMes.filter(l=>l.tipo==="despesa").forEach(l=>{pc[l.cat||"Outros"]=(pc[l.cat||"Outros"]||0)+(+l.valor||0)});
  const det=Object.entries(pc).sort((a,b)=>b[1]-a[1]);
  const t2=t+(det.length?`\n\nDespesas por categoria:\n${det.map(([c,v])=>`• ${c}: ${brl(v)}`).join("\n")}`:"");
  if(temNativo())compartilhar(t2,"Enviar resumo");else copiar(t2).then(ok=>toast(ok?"Resumo copiado":"Não consegui copiar"))};

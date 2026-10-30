
/* ================= LIGA: FINANCEIRO (só presidente e tesouraria) ================= */
const FIN={subs:null,ok:false,cfg:null,lanc:[],mes:null,aba:"mens",filtro:"aberto",delArm:null,tmpFam:null,item:null};
ICON.financeiro='<rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="2.5"/><path d="M6 10v5M18 10v5"/>';
LABEL.financeiro="Financeiro";
EXTRA.parent.financeiro="mais";
const CFG_PADRAO=()=>({valorInd:60,valorFam:100,venc:10,familias:[],inicio:mesAtual()});
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
const finAcesso=()=>!!me&&(me.papel==="presidente"||me.financeiro===true);
const cfgRef=()=>doc(db,"times",teamId,"fin_config","geral");
const lancCol=()=>collection(db,"times",teamId,"fin_lanc");

/* ---- liga/desliga as leituras conforme a permissão ---- */
function syncFin(){
  const ok=finAcesso();
  if(ok&&!FIN.subs){
    FIN.mes=FIN.mes||mesAtual();
    const a=onSnapshot(cfgRef(),s=>{FIN.cfg=s.exists()?s.data():null;FIN.ok=true;renderFin()},e=>console.warn("fin cfg",e));
    const b=onSnapshot(lancCol(),s=>{FIN.lanc=s.docs.map(d=>({id:d.id,...d.data()}));renderFin()},e=>console.warn("fin lanc",e));
    FIN.subs=[a,b];unsubs.push(()=>{a();b()});
  }else if(!ok&&FIN.subs){
    FIN.subs.forEach(f=>f());FIN.subs=null;FIN.ok=false;FIN.cfg=null;FIN.lanc=[];
    if(view==="financeiro")go("mais");
  }
}
EXTRA.reset.push(()=>{FIN.subs=null;FIN.ok=false;FIN.cfg=null;FIN.lanc=[];FIN.mes=null});
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
    topo.innerHTML=`<div class="lg-chips" id="finFiltro">${[["aberto","Em aberto"],["pagos","Pagos"],["todos","Todos"]].map(([k,n])=>`<button class="chip" data-f="${k}" aria-pressed="${FIN.filtro===k}" type="button">${n}</button>`).join("")}</div>`;
    if(!us.length){lista.innerHTML=`<div class="empty">Nenhum mensalista no elenco. Abra a carta do jogador no Elenco e mude o tipo para <b>Mensalista</b>.</div>`;return}
    let rows=us.map((u,i)=>({u,s:st[i]}));
    if(FIN.filtro==="aberto")rows=rows.filter(r=>r.s!=="pago");else if(FIN.filtro==="pagos")rows=rows.filter(r=>r.s==="pago");
    rows.sort((a,b)=>({atrasado:0,pendente:1,futuro:2,pago:3}[a.s]-{atrasado:0,pendente:1,futuro:2,pago:3}[b.s])||a.u.nomes.localeCompare(b.u.nomes));
    const LBL={atrasado:"Atrasado",pendente:"A pagar",futuro:"A vencer",pago:"Pago"};
    lista.innerHTML=rows.length?rows.map(({u,s})=>{const pg=pagamento(u,m),ant=mesesAnteriores(u,m);
      return `<div class="fin-row st-${s}" data-key="${u.key}"><div class="fin-avs">${u.cartas.map(id=>`<span class="rk-av">${avatar(byId(id))}</span>`).join("")}</div>
      <div class="fin-who"><b>${esc(u.nomes)}</b><span><span class="fin-st">${LBL[s]}</span> · ${u.fam?"Família":"Individual"} ${brl(u.valor)}${ant?` · <em>${ant} ${ant===1?"mês anterior":"meses anteriores"} em aberto</em>`:""}</span></div>
      ${pg?`<button type="button" class="fin-pill" data-act="ver">✓ ${ddmm(pg.data)}</button>`:`<button type="button" class="btn primary fin-rec" data-act="receber">Receber</button>`}</div>`}).join("")
      :`<div class="empty">${FIN.filtro==="aberto"?"Todo mundo pagou este mês.":"Nenhum pagamento registrado neste mês."}</div>`;
  }else{
    const tipo=FIN.aba==="desp"?"despesa":"receita";
    topo.innerHTML=`<button class="btn primary" type="button" id="finNovo" style="width:100%">+ ${tipo==="despesa"?"Nova despesa":"Nova receita"}</button>`;
    const ls=doMes.filter(l=>l.tipo===tipo&&(tipo==="despesa"||l.cat!=="mensalidade")).sort((a,b)=>(b.data||"").localeCompare(a.data||""));
    lista.innerHTML=ls.length?ls.map(l=>`<div class="fin-lanc" data-id="${l.id}"><div class="dt"><b>${(l.data||"").slice(8,10)}</b><span>${mesSo((l.data||m).slice(0,7)).slice(0,3)}</span></div>
      <div class="fin-who"><b>${esc(l.desc||l.cat)}</b><span>${esc(l.cat||"")}${l.forma?" · "+esc(l.forma):""}${l.porNome?" · por "+esc(l.porNome):""}</span></div>
      <strong class="fin-val ${tipo==="despesa"?"out":"in"}">${tipo==="despesa"?"−":"+"}${brl(l.valor)}</strong>
      <button type="button" class="x${FIN.delArm===l.id?" arm":""}" data-act="del">${FIN.delArm===l.id?"Apagar?":"✕"}</button></div>`).join("")
      :`<div class="empty">Nenhuma ${tipo==="despesa"?"despesa":"receita extra"} em ${mesSo(m).toLowerCase()}.</div>`;
  }
}
$("#finPrev").onclick=()=>{FIN.mes=mesAdd(FIN.mes,-1);renderFin()};
$("#finNext").onclick=()=>{FIN.mes=mesAdd(FIN.mes,1);renderFin()};
$("#finAba").addEventListener("click",e=>{const b=e.target.closest("button");if(b){FIN.aba=b.dataset.a;FIN.delArm=null;renderFin()}});
$("#finTopo").addEventListener("click",e=>{const f=e.target.closest("[data-f]");if(f){FIN.filtro=f.dataset.f;renderFin();return}
  if(e.target.closest("#finNovo"))abrirLanc(FIN.aba==="desp"?"despesa":"receita")});
$("#finLista").addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b)return;const a=b.dataset.act;
  if(a==="receber"||a==="ver"){const u=cobrancas().find(x=>x.key===b.closest(".fin-row").dataset.key);if(!u)return;return a==="receber"?abrirReceber(u):abrirPago(u)}
  if(a==="del"){const id=b.closest(".fin-lanc").dataset.id;
    if(FIN.delArm!==id){FIN.delArm=id;renderFin();setTimeout(()=>{if(FIN.delArm===id){FIN.delArm=null;renderFin()}},3500);return}
    FIN.delArm=null;try{await deleteDoc(doc(db,"times",teamId,"fin_lanc",id));toast("Lançamento apagado")}catch(x){toast("Não consegui apagar")}}
});

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
    <button class="btn" type="button" id="fiRecibo">Copiar recibo para o WhatsApp</button>
    <button class="btn danger" type="button" id="fiDesfazer">Desfazer pagamento</button>
    <div class="err" id="fiErr"></div>`)}
function abrirLanc(tipo){
  FIN.item={modo:"lanc",tipo};const cats=tipo==="despesa"?CAT_DESP:CAT_REC;
  const dataPadrao=FIN.mes===mesAtual()?hoje():FIN.mes+"-01";
  finAbrir(`${cab(tipo==="despesa"?"Nova despesa":"Nova receita")}
    <label class="f">Descrição<input type="text" id="fiDesc" maxlength="60" placeholder="${tipo==="despesa"?"Ex.: Aluguel da quadra do Furlan":"Ex.: Diária do avulso João"}"></label>
    <div class="two"><label class="f">Valor (R$)<input type="text" id="fiValor" inputmode="decimal" placeholder="0,00"></label>
      <label class="f">Data<input type="date" id="fiData" value="${dataPadrao}"></label></div>
    <div class="two"><label class="f">Categoria<select id="fiCat">${optList(cats,cats[0])}</select></label>
      <label class="f">Forma<select id="fiForma">${optList(FORMAS,"Pix")}</select></label></div>
    <div class="err" id="fiErr"></div>
    <button class="btn primary" type="submit" id="fiSave">${tipo==="despesa"?"Lançar despesa":"Lançar receita"}</button>`)}
function abrirConfig(){
  const c=cfg();FIN.item={modo:"cfg"};FIN.tmpFam=(c.familias||[]).map(f=>({...f}));
  const pres=me.papel==="presidente";
  finAbrir(`${cab("Configurações")}
    <div class="two"><label class="f">Mensalidade (R$)<input type="text" id="fcInd" inputmode="decimal" value="${num2(c.valorInd)}"></label>
      <label class="f">Plano família, 2 pessoas (R$)<input type="text" id="fcFam" inputmode="decimal" value="${num2(c.valorFam)}"></label></div>
    <div class="two"><label class="f">Dia do vencimento<input type="number" id="fcVenc" min="1" max="28" value="${+c.venc||10}"></label>
      <label class="f">Controle desde<input type="month" id="fcIni" value="${c.inicio}"></label></div>
    <div class="box"><h3>Planos família</h3><div id="fcFams"></div>
      <div class="two"><select id="fcA"></select><select id="fcB"></select></div>
      <button class="btn" type="button" id="fcAdd">Juntar no plano família</button></div>
    ${pres?`<div class="box"><h3>Tesouraria</h3><p class="note" style="margin:0">Quem pode ver e mexer no financeiro, além de você.</p>
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
  const rm=e.target.closest("[data-rm]");if(rm){FIN.tmpFam.splice(+rm.dataset.rm,1);return renderFams()}
  if(e.target.id==="fcAdd"){const a=$("#fcA").value,b=$("#fcB").value;
    if(!a||!b||a===b){$("#fiErr").textContent="Escolha duas pessoas diferentes.";return}
    $("#fiErr").textContent="";FIN.tmpFam.push({a,b});return renderFams()}
  if(e.target.id==="fiRecibo"){const pg=FIN.item.pg;
    const t=`Recibo – ${document.title}\nRecebemos de ${pg.nomes} o valor de ${brl(pg.valor)} referente à mensalidade de ${mesNome(pg.mes)}.\nPago em ${ddmm(pg.data)} via ${pg.forma}.`;
    navigator.clipboard?.writeText(t).then(()=>toast("Recibo copiado"),()=>toast("Não consegui copiar"));return}
  if(e.target.id==="fiDesfazer"){const b=e.target;
    if(!b.dataset.arm){b.dataset.arm="1";b.textContent="Toque de novo para desfazer";return}
    try{await deleteDoc(doc(db,"times",teamId,"fin_lanc",FIN.item.pg.id));finFechar();toast("Pagamento desfeito")}catch(x){$("#fiErr").textContent="Não consegui desfazer."}}
});
$("#finSheet").addEventListener("submit",async e=>{
  e.preventDefault();const it=FIN.item,err=$("#fiErr"),b=$("#fiSave");if(!it)return;err.textContent="";
  const base={criadoPor:user.uid,porNome:me.nome||"",em:serverTimestamp()};
  try{
    if(it.modo==="receber"){
      const valor=parseBRL($("#fiValor").value),data=$("#fiData").value;
      if(!(valor>0)){err.textContent="Digite um valor válido.";return}if(!data){err.textContent="Escolha a data.";return}
      b.disabled=true;
      await addDoc(lancCol(),{...base,tipo:"receita",cat:"mensalidade",mes:FIN.mes,cartas:it.u.cartas,nomes:it.u.nomes,valor,forma:$("#fiForma").value,data,obs:$("#fiObs").value.trim(),desc:`Mensalidade ${mesSo(FIN.mes).toLowerCase()} – ${it.u.nomes}`});
      finFechar();toast("Recebimento registrado");
    }else if(it.modo==="lanc"){
      const valor=parseBRL($("#fiValor").value),data=$("#fiData").value,desc=$("#fiDesc").value.trim();
      if(!desc){err.textContent="Escreva uma descrição.";return}if(!(valor>0)){err.textContent="Digite um valor válido.";return}if(!data){err.textContent="Escolha a data.";return}
      b.disabled=true;
      await addDoc(lancCol(),{...base,tipo:it.tipo,cat:$("#fiCat").value,desc,valor,data,forma:$("#fiForma").value});
      finFechar();toast(it.tipo==="despesa"?"Despesa lançada":"Receita lançada");
    }else if(it.modo==="cfg"){
      const ind=parseBRL($("#fcInd").value),fam=parseBRL($("#fcFam").value),venc=Math.min(28,Math.max(1,parseInt($("#fcVenc").value)||10)),ini=$("#fcIni").value||mesAtual();
      if(!(ind>0)||!(fam>0)){err.textContent="Confira os valores.";return}
      b.disabled=true;
      await setDoc(cfgRef(),{valorInd:ind,valorFam:fam,venc,inicio:ini,familias:FIN.tmpFam},{merge:true});
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
  navigator.clipboard?.writeText(t).then(()=>toast("Resumo copiado"),()=>toast("Não consegui copiar"))};

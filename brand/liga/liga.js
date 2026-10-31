/* ================= LIGA DA JUSTIÇA: agenda, presença em treinos, avisos e rank ================= */
const LG={assemb:[],subA:null,migr:new Set(),agenda:[],conf:[],avisos:[],ok:{ag:false,av:false},filtro:"todos",passado:false,aberto:new Set(),
  rankAba:"freq",rankPer:"30",delArm:null,form:null,lastView:null,prevSeen:0};
const FIXOS_PADRAO=[
  {dow:1,local:"Quadra do Furlan",ini:"19:00",fim:"22:00"},
  {dow:3,local:"Poliesportivo do Jamaica",ini:"19:00",fim:"21:40"},
  {dow:6,local:"Pé na Areia",ini:"08:00",fim:"12:00",obs:"Pode se estender até as 13:00."},
  {dow:0,local:"Patinódromo",ini:"08:00",fim:"12:00"}];
const TIPOS={treino:{n:"Treino",c:"var(--accent-2)"},evento:{n:"Evento",c:"var(--accent)"},assembleia:{n:"Assembleia",c:"#f5c542"}};
const IC_PIN='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>';
Object.assign(ICON,{
  agenda:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  rank:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3a3 3 0 0 1-3 4M7 5H4a3 3 0 0 0 3 4"/>',
  avisos:'<path d="M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1z"/><path d="M16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14"/>',
  mais:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/>'});
Object.assign(LABEL,{agenda:"Agenda",rank:"Rank",avisos:"Avisos",mais:"Mais"});
// atleta + cargo: quem tem cargo também pode jogar (marcação "Também é atleta")
EXTRA.joga=m=>m.papel==="atleta"||m.joga===true||(!GESTORES.includes(m.papel)&&m.joga!==false);
EXTRA.tabs=g=>{const j=me&&EXTRA.joga(me);return g?(j?["agenda","elenco","carta","rank","avisos","mais"]:["agenda","elenco","rank","avisos","mais"]):(j?["agenda","carta","rank","avisos","mais"]:["agenda","rank","avisos","mais"])};
EXTRA.membroExtra=(m,pres)=>pres&&m.papel!=="atleta"?`<label class="chk joga-chk"><input type="checkbox" data-joga="${m.uid}" ${EXTRA.joga(m)?"checked":""}>Atleta</label>`:"";
$("#members").addEventListener("change",async e=>{const c=e.target.closest("[data-joga]");if(!c)return;
  try{await updateDoc(doc(db,"times",teamId,"membros",c.dataset.joga),{joga:c.checked});toast(c.checked?"Agora também é atleta":"Não é mais atleta")}catch(err){c.checked=!c.checked;toast("Não consegui alterar")}});
const invJogaVer=()=>{const l=$("#invJogaL");if(l)l.hidden=$("#invRole").value==="atleta"};
$("#invRole").addEventListener("change",invJogaVer);
Object.assign(EXTRA.parent,{presenca:"mais",sorteio:"mais",placar:"mais",time:"mais"});
EXTRA.startView=()=>(!gestor()&&EXTRA.joga(me)&&!me.carta)?"carta":"agenda";

/* ---- datas ---- */
const pad2=n=>String(n).padStart(2,"0");
const ymd=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const pdate=s=>{const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
const addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const hoje=()=>ymd(new Date());
const agoraHM=()=>{const d=new Date();return pad2(d.getHours())+":"+pad2(d.getMinutes())};
function diaLabel(s){
  const t=new Date();if(s===ymd(t))return"Hoje";if(s===ymd(addDays(t,1)))return"Amanhã";if(s===ymd(addDays(t,-1)))return"Ontem";
  const l=pdate(s).toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"short"}).replace(".","");
  return l.charAt(0).toUpperCase()+l.slice(1)}
function quando(ms){
  const d=(Date.now()-ms)/1000;if(d<60)return"agora";if(d<3600)return`há ${Math.floor(d/60)} min`;if(d<86400)return`há ${Math.floor(d/3600)} h`;
  const dt=new Date(ms);if(ymd(dt)===ymd(addDays(new Date(),-1)))return"ontem";
  return dt.toLocaleDateString("pt-BR",{day:"2-digit",month:"short"}).replace(".","")}

/* ---- agenda: treinos fixos + itens criados ---- */
function instancias(){
  const fixos=team?.treinosFixos||FIXOS_PADRAO;const map=new Map();
  const fim=addDays(new Date(),42);
  for(let d=addDays(new Date(),-35);d<=fim;d=addDays(d,1)){
    const f=fixos.find(x=>x.dow===d.getDay());if(!f)continue;const id="fx-"+ymd(d);
    map.set(id,{id,tipo:"treino",titulo:"Treino",data:ymd(d),ini:f.ini,fim:f.fim,local:f.local,obs:f.obs||"",fixo:true})}
  LG.agenda.forEach(a=>{
    if(a.tipo==="assembleia")return;
    if(map.has(a.id))map.set(a.id,{...map.get(a.id),...a,fixo:true});
    else if(a.data)map.set(a.id,{titulo:TIPOS[a.tipo]?.n||"",...a,fixo:a.id.startsWith("fx-")})});
  if(verAssemb())LG.assemb.forEach(a=>{if(a.data)map.set("as-"+a.id,{titulo:"Assembleia",...a,tipo:"assembleia",col:"assembleias",fixo:false})});
  return[...map.values()].sort((a,b)=>(a.data+(a.ini||"")).localeCompare(b.data+(b.ini||"")))}
const verAssemb=()=>!!me&&(gestor()||me.papel==="tesoureiro"||me.papel==="diretoria");
const agRef=id=>doc(db,"times",teamId,"agenda",id);
const colDe=tipo=>tipo==="assembleia"?"assembleias":"agenda";
const itemRef=it=>doc(db,"times",teamId,it.col==="assembleias"?"assembleias":"agenda",it.id);
const baseItem=(it,extra)=>({tipo:it.tipo,data:it.data,titulo:it.titulo||"",ini:it.ini||"",fim:it.fim||"",local:it.local||"",obs:it.obs||"",...extra});
const confDe=id=>LG.conf.filter(c=>c.inst===id);
const minhaConf=id=>LG.conf.find(c=>c.inst===id&&c.uid===user.uid);
const avatar=p=>p?.foto?`<img src="${p.foto}" alt="">`:esc(initials(p?.nome||"?"));

function itemHTML(it){
  const T=TIPOS[it.tipo]||TIPOS.evento,t=hoje(),g=gestor(),futuro=it.data>=t,off=!!it.cancelado;
  const agora=it.data===t&&!off&&it.ini&&agoraHM()>=it.ini&&(!it.fim||agoraHM()<=it.fim);
  let h=`<article class="ev${off?" is-off":""}" style="--tc:${T.c}" data-id="${esc(it.id)}">
   <div class="ev-time"><b>${esc(it.ini||"--:--")}</b>${it.fim?`<span>até ${esc(it.fim)}</span>`:""}</div>
   <div class="ev-body">
    <div class="ev-top"><span class="ev-tag">${T.n}</span>${agora?'<span class="ev-pill now">Agora</span>':""}${off?'<span class="ev-pill off">Cancelado</span>':""}</div>
    <h3>${esc(it.titulo||T.n)}</h3>
    ${it.local?`<p class="ev-loc">${IC_PIN}${esc(it.local)}</p>`:""}
    ${it.obs?`<p class="ev-obs">${esc(it.obs)}</p>`:""}`;
  if(it.tipo==="treino"&&!off){
    const cs=confDe(it.id),vao=cs.filter(c=>c.vai),nao=cs.filter(c=>!c.vai),mine=minhaConf(it.id);
    if(futuro){
      h+=`<div class="ev-rsvp">
        <button type="button" class="btn yes" data-act="vou" aria-pressed="${mine?.vai===true}">✓ Vou</button>
        <button type="button" class="btn no" data-act="nao" aria-pressed="${mine?.vai===false}">Não vou</button>
        <button type="button" class="ev-who" data-act="who">${vao.length} ${vao.length===1?"vai":"vão"} · ${nao.length} não</button></div>`;
    }else if(cs.length){
      h+=`<div class="ev-rsvp"><button type="button" class="ev-who" data-act="who">${vao.length} confirmaram · ${nao.length} avisaram que não iam</button></div>`}
    if(LG.aberto.has(it.id)&&cs.length)
      h+=`<div class="ev-names">${vao.map(c=>`<span class="ok">${esc(c.nome)}</span>`).join("")}${nao.map(c=>`<span class="no">${esc(c.nome)}</span>`).join("")}</div>`;
    if(it.chamadaFeita&&!g&&me.carta){const fui=(it.chamada||[]).includes(me.carta);
      h+=`<p class="ev-res ${fui?"ok":"bad"}">${fui?"✓ Você esteve presente":"Você faltou neste treino"}</p>`}
  }
  if(g){
    h+=`<div class="ev-acts">`;
    if(it.tipo==="treino"&&!off&&it.data<=t)
      h+=`<button type="button" class="btn ${it.chamadaFeita?"":"primary"}" data-act="chamada">${it.chamadaFeita?`Chamada: ${(it.chamada||[]).length} presentes`:"Fazer chamada"}</button>`;
    h+=`<button type="button" class="btn ghost" data-act="edit">Editar</button>
        <button type="button" class="btn ghost" data-act="cancel">${off?"Reativar":"Cancelar"}</button>`;
    if(!it.fixo)h+=`<button type="button" class="btn danger" data-act="del">${LG.delArm===it.id?"Toque de novo para excluir":"Excluir"}</button>`;
    h+=`</div>`}
  return h+`</div></article>`}

function renderAgenda(){
  const box=$("#lgAgendaList");if(!box||!me)return;
  $("#lgNovo").hidden=!gestor();
  if(LG.filtro==="assembleia"&&!verAssemb())LG.filtro="todos";
  document.querySelectorAll("#lgFiltro .chip").forEach(b=>{b.setAttribute("aria-pressed",b.dataset.f===LG.filtro);if(b.dataset.f==="assembleia")b.hidden=!verAssemb()});
  const t=hoje();let it=instancias();
  it=LG.passado?it.filter(i=>i.data<t).reverse():it.filter(i=>i.data>=t&&i.data<=ymd(addDays(new Date(),21)));
  if(LG.filtro!=="todos")it=it.filter(i=>i.tipo===LG.filtro);
  $("#lgPassado").textContent=LG.passado?"Voltar para os próximos":"Ver anteriores";
  if(!it.length){box.innerHTML=`<div class="empty">${LG.passado?"Nada nas últimas semanas.":"Nada marcado nas próximas semanas."}</div>`;return}
  const grupos=[];it.forEach(i=>{const g=grupos[grupos.length-1];if(g&&g.d===i.data)g.l.push(i);else grupos.push({d:i.data,l:[i]})});
  box.innerHTML=grupos.map(g=>`<section class="lg-day${g.d===t?" is-today":""}"><h4>${diaLabel(g.d)}</h4>${g.l.map(itemHTML).join("")}</section>`).join("")}

async function confirmar(it,vai){
  if(it.data<hoje()||it.cancelado)return;
  const ref=doc(db,"times",teamId,"confirmacoes",`${it.id}_${user.uid}`),cur=minhaConf(it.id);
  try{
    if(cur&&cur.vai===vai)await deleteDoc(ref);
    else await setDoc(ref,{inst:it.id,data:it.data,uid:user.uid,carta:me.carta||null,nome:(me.carta&&byId(me.carta)?.nome)||me.nome||"Atleta",vai,em:serverTimestamp()});
  }catch(e){toast("Não consegui salvar sua resposta")}}

$("#lgFiltro").addEventListener("click",e=>{const b=e.target.closest(".chip");if(!b)return;LG.filtro=b.dataset.f;renderAgenda()});
$("#lgPassado").onclick=()=>{LG.passado=!LG.passado;renderAgenda();window.scrollTo(0,0)};
$("#lgNovo").onclick=()=>abrirForm(null);
$("#lgAgendaList").addEventListener("click",async e=>{
  const b=e.target.closest("[data-act]");if(!b)return;
  const id=b.closest(".ev").dataset.id,it=instancias().find(i=>i.id===id);if(!it)return;const a=b.dataset.act;
  if(a==="vou"||a==="nao")return confirmar(it,a==="vou");
  if(a==="who"){LG.aberto.has(id)?LG.aberto.delete(id):LG.aberto.add(id);return renderAgenda()}
  if(!gestor())return;
  if(a==="edit")return abrirForm(it);
  if(a==="chamada")return abrirChamada(it);
  if(a==="cancel"){try{await setDoc(itemRef(it),baseItem(it,{cancelado:!it.cancelado}),{merge:true});toast(it.cancelado?"Reativado":"Cancelado. O time vai ser avisado.")}catch(err){toast("Não consegui salvar")}return}
  if(a==="del"){
    if(LG.delArm!==id){LG.delArm=id;renderAgenda();setTimeout(()=>{if(LG.delArm===id){LG.delArm=null;renderAgenda()}},3500);return}
    LG.delArm=null;try{await deleteDoc(itemRef(it));toast("Excluído da agenda")}catch(err){toast("Não consegui excluir")}}
});

/* ---- formulário de treino/evento/assembleia ---- */
function abrirSheet(html,mode){$("#lgSheet").innerHTML=html;$("#lgSheet").dataset.mode=mode;$("#lgModal").hidden=false}
const fecharSheet=()=>{$("#lgModal").hidden=true;LG.form=null};
$("#lgModal").addEventListener("click",e=>{if(e.target.id==="lgModal"||e.target.closest("[data-x]"))fecharSheet()});
function abrirForm(it){
  const novo=!it,fx=!!it?.fixo;
  const v=it||{tipo:LG.filtro!=="todos"?LG.filtro:"evento",titulo:"",data:hoje(),ini:"19:00",fim:"",local:"",obs:""};
  LG.form=it;
  abrirSheet(`<div class="row spread"><h2>${novo?"Adicionar à agenda":fx?"Editar treino":"Editar"}</h2><button class="btn ghost" type="button" data-x>Fechar</button></div>
    ${fx?`<p class="note" style="margin:0">Muda só o treino de ${diaLabel(v.data).toLowerCase()}. Os outros continuam no horário normal.</p>`:""}
    <label class="f">Tipo<select id="lgTipo" ${fx?"disabled":""}>${Object.entries(TIPOS).filter(([k])=>k!=="assembleia"||verAssemb()).map(([k,o])=>`<option value="${k}" ${k===v.tipo?"selected":""}>${o.n}</option>`).join("")}</select></label>
    <label class="f">Título<input type="text" id="lgTit" maxlength="50" value="${esc(v.titulo||"")}" placeholder="Ex.: Assembleia geral, Torneio de verão"></label>
    <div class="two"><label class="f">Data<input type="date" id="lgData" value="${esc(v.data)}" ${fx?"disabled":""}></label>
      <label class="f">Local<input type="text" id="lgLocal" maxlength="60" value="${esc(v.local||"")}" placeholder="Onde vai ser"></label></div>
    <div class="two"><label class="f">Início<input type="time" id="lgIni" value="${esc(v.ini||"")}"></label>
      <label class="f">Término<input type="time" id="lgFim" value="${esc(v.fim||"")}"></label></div>
    <label class="f">Observação<textarea id="lgObs" rows="3" maxlength="300" placeholder="Opcional">${esc(v.obs||"")}</textarea></label>
    <div class="err" id="lgErr"></div>
    <button class="btn primary" type="submit" id="lgSave">${novo?"Adicionar à agenda":"Salvar"}</button>`,"form")}

/* ---- chamada do treino ---- */
function abrirChamada(it){
  const cs=confDe(it.id),vai=new Set(cs.filter(c=>c.vai&&c.carta).map(c=>c.carta));
  const marc=new Set(it.chamadaFeita?(it.chamada||[]):[...vai]);
  const lista=[...players].sort((a,b)=>(vai.has(b.id)-vai.has(a.id))||String(a.nome).localeCompare(b.nome));
  LG.form=it;
  abrirSheet(`<div class="row spread"><h2>Chamada</h2><button class="btn ghost" type="button" data-x>Fechar</button></div>
    <p class="note" style="margin:0">${diaLabel(it.data)} · ${esc(it.local||"")}. Marque quem esteve no treino. Quem confirmou já vem marcado.</p>
    <div class="row spread"><span class="lg-count" id="lgCnt"></span><button class="btn ghost" type="button" id="lgTodos">Marcar todos</button></div>
    <div>${lista.map(p=>`<label class="chk"><input type="checkbox" value="${p.id}" ${marc.has(p.id)?"checked":""}><span class="av">${avatar(p)}</span><b>${esc(p.nome)}</b>${vai.has(p.id)?"<em>Confirmou</em>":""}</label>`).join("")||'<p class="note">Nenhum jogador no elenco ainda.</p>'}</div>
    <div class="err" id="lgErr"></div>
    <button class="btn primary" type="submit" id="lgSave">Salvar chamada</button>`,"chamada");
  contarChamada()}
function contarChamada(){const n=$("#lgSheet").querySelectorAll(".chk input:checked").length;const c=$("#lgCnt");if(c)c.textContent=`${n} ${n===1?"presente":"presentes"}`}
$("#lgSheet").addEventListener("change",()=>{if($("#lgSheet").dataset.mode==="chamada")contarChamada()});
$("#lgSheet").addEventListener("click",e=>{if(e.target.id==="lgTodos"){$("#lgSheet").querySelectorAll(".chk input").forEach(i=>i.checked=true);contarChamada()}});

$("#lgSheet").addEventListener("submit",async e=>{
  e.preventDefault();const it=LG.form,b=$("#lgSave"),err=$("#lgErr");err.textContent="";
  if($("#lgSheet").dataset.mode==="chamada"){
    const ids=[...$("#lgSheet").querySelectorAll(".chk input:checked")].map(i=>i.value);b.disabled=true;
    try{await setDoc(agRef(it.id),baseItem(it,{chamada:ids,chamadaFeita:true,chamadaEm:serverTimestamp()}),{merge:true});fecharSheet();toast("Chamada salva")}
    catch(x){b.disabled=false;err.textContent="Não consegui salvar: "+(x.code||x.message)}
    return}
  const tipo=it?.fixo?"treino":$("#lgTipo").value;
  const d={tipo,titulo:$("#lgTit").value.trim()||TIPOS[tipo].n,data:it?.fixo?it.data:$("#lgData").value,ini:$("#lgIni").value,fim:$("#lgFim").value,local:$("#lgLocal").value.trim(),obs:$("#lgObs").value.trim()};
  if(!d.data){err.textContent="Escolha a data.";return}
  if(!d.ini){err.textContent="Informe o horário de início.";return}
  if(d.fim&&d.fim<=d.ini){err.textContent="O término precisa ser depois do início.";return}
  b.disabled=true;
  try{
    if(!it)await addDoc(collection(db,"times",teamId,colDe(d.tipo)),{...d,cancelado:false,criadoPor:user.uid,em:serverTimestamp()});
    else if(colDe(d.tipo)===(it.col||"agenda"))await setDoc(itemRef(it),d,{merge:true});
    else{await setDoc(doc(db,"times",teamId,colDe(d.tipo),it.id),{...baseItem(it,{}),...d,cancelado:!!it.cancelado,criadoPor:it.criadoPor||user.uid});await deleteDoc(itemRef(it))}
    fecharSheet();toast(it?"Salvo":"Adicionado à agenda")}
  catch(x){b.disabled=false;err.textContent="Não consegui salvar: "+(x.code||x.message)}
});

/* ---- rank ---- */
function renderRank(){
  const body=$("#lgRankBody");if(!body||!me)return;
  document.querySelectorAll("#lgRankAba button").forEach(b=>b.setAttribute("aria-pressed",b.dataset.a===LG.rankAba));
  document.querySelectorAll("#lgRankPer .chip").forEach(b=>b.setAttribute("aria-pressed",b.dataset.p===LG.rankPer));
  $("#lgRankPer").hidden=LG.rankAba!=="freq";
  let rows=[],nota="";
  if(LG.rankAba==="freq"){
    const t=hoje(),lim=LG.rankPer==="30"?ymd(addDays(new Date(),-30)):"0000-00-00";
    const ch=LG.agenda.filter(a=>a.chamadaFeita&&!a.cancelado&&a.data>=lim&&a.data<=t);
    if(!ch.length){body.innerHTML=`<div class="empty">A frequência aparece depois que a comissão fizer a primeira chamada de treino${LG.rankPer==="30"?" nos últimos 30 dias":""}.</div>`;return}
    rows=players.map(p=>{const n=ch.filter(c=>(c.chamada||[]).includes(p.id)).length,pct=Math.round(n/ch.length*100);
      return{p,v:n,pct,lab:pct+"%",sub:`${n} de ${ch.length} ${ch.length===1?"treino":"treinos"}`}})
      .sort((a,b)=>b.v-a.v||String(a.p.nome).localeCompare(b.p.nome));
    nota=`Baseado na chamada de ${ch.length} ${ch.length===1?"treino":"treinos"}.`;
  }else{
    rows=players.filter(p=>p.avaliado!==false).map(p=>{const o=ovr(p);return{p,v:o,pct:o,lab:String(o),sub:`${POSN[p.pos]||p.pos} · ${TIERN[tier(o)]}`}})
      .sort((a,b)=>b.v-a.v||String(a.p.nome).localeCompare(b.p.nome));
    const pend=players.filter(p=>p.avaliado===false).length;
    if(pend)nota=`${pend} ${pend===1?"carta aguardando":"cartas aguardando"} avaliação da comissão.`;
    if(!rows.length){body.innerHTML=`<div class="empty">Nenhuma carta avaliada ainda.</div>`;return}
  }
  let pos=0,last=null;rows.forEach((r,i)=>{if(r.v!==last){pos=i+1;last=r.v}r.pos=pos});
  const eu=r=>r.p.id===me.carta;let h="";
  if(rows.length>=3){
    const ord=[[rows[1],2],[rows[0],1],[rows[2],3]];
    h+=`<div class="podium">${ord.map(([r,k])=>`<div class="pd p${k}${eu(r)?" is-me":""}"><div class="av">${avatar(r.p)}</div><b>${esc(r.p.nome)}</b><small>${r.lab}</small><div class="base">${r.pos}º</div></div>`).join("")}</div>`}
  const rest=rows.length>=3?rows.slice(3):rows;
  if(rest.length)h+=`<div class="rk-list">${rest.map(r=>`<div class="rk${eu(r)?" is-me":""}"><span class="rk-pos">${r.pos}</span><span class="rk-av">${avatar(r.p)}</span>
    <div class="rk-who"><b>${esc(r.p.nome)}${eu(r)?" (você)":""}</b><span>${esc(r.sub)}</span><i class="rk-bar"><i style="width:${r.pct}%"></i></i></div><strong class="rk-val">${r.lab}</strong></div>`).join("")}</div>`;
  if(nota)h+=`<p class="rk-note">${nota}</p>`;
  body.innerHTML=h}
$("#lgRankAba").addEventListener("click",e=>{const b=e.target.closest("button");if(b){LG.rankAba=b.dataset.a;renderRank()}});
$("#lgRankPer").addEventListener("click",e=>{const b=e.target.closest(".chip");if(b){LG.rankPer=b.dataset.p;renderRank()}});

/* ---- avisos ---- */
const seenKeyAv=()=>`lg_av_${teamId}_${user.uid}`;
function getSeen(){try{return+localStorage.getItem(seenKeyAv())||0}catch(e){return 0}}
function marcarVisto(){const n=LG.avisos[0]?.ms||0;try{localStorage.setItem(seenKeyAv(),String(Math.max(n,getSeen())))}catch(e){}badges.avisos=false}
function renderAvisos(){
  const box=$("#lgAvisos");if(!box||!me)return;$("#lgAvisoForm").hidden=!gestor();
  if(!LG.avisos.length){box.innerHTML=`<div class="empty">${gestor()?"Nenhum aviso ainda. Escreva o primeiro acima.":"Nenhum aviso por enquanto."}</div>`;return}
  box.innerHTML=LG.avisos.map(a=>`<article class="avs${a.ms>LG.prevSeen&&a.autorUid!==user.uid?" is-new":""}" data-id="${a.id}">
    <header><h3>${a.ms>LG.prevSeen&&a.autorUid!==user.uid?'<span class="new">Novo</span>':""}${esc(a.titulo)}</h3><time>${quando(a.ms)}</time></header>
    ${a.texto?`<p>${esc(a.texto)}</p>`:""}
    <footer><span>${esc(a.autor||"Comissão")}</span>${gestor()?`<button type="button" class="btn ghost" data-del>${LG.delArm===a.id?"Toque de novo para apagar":"Apagar"}</button>`:""}</footer></article>`).join("")}
$("#lgAvisoForm").addEventListener("submit",async e=>{
  e.preventDefault();const t=$("#lgAvTit").value.trim(),x=$("#lgAvTxt").value.trim(),b=$("#lgAvPub");$("#lgAvErr").textContent="";
  if(!t){$("#lgAvErr").textContent="Escreva um título.";return}
  b.disabled=true;
  try{await addDoc(collection(db,"times",teamId,"avisos"),{titulo:t,texto:x,autor:`${me.nome||"Comissão"} · ${PAPEL[me.papel]||""}`,autorUid:user.uid,em:serverTimestamp()});
    $("#lgAvTit").value="";$("#lgAvTxt").value="";toast("Aviso publicado")}
  catch(err){$("#lgAvErr").textContent="Não consegui publicar: "+(err.code||err.message)}
  b.disabled=false});
$("#lgAvisos").addEventListener("click",async e=>{
  const b=e.target.closest("[data-del]");if(!b||!gestor())return;const id=b.closest(".avs").dataset.id;
  if(LG.delArm!==id){LG.delArm=id;renderAvisos();setTimeout(()=>{if(LG.delArm===id){LG.delArm=null;renderAvisos()}},3500);return}
  LG.delArm=null;try{await deleteDoc(doc(db,"times",teamId,"avisos",id));toast("Aviso apagado")}catch(err){toast("Não consegui apagar")}});

/* ---- aba Mais ---- */
function renderMais(){
  const box=$("#lgMais");if(!box||!me)return;
  const t=[["presenca","Lista do jogo","Confirmados para o jogo"],["sorteio","Sorteio","Times equilibrados"],["placar","Placar","Pontos e sets"]];
  if(me.carta)t.unshift(["pagar","Mensalidade","Pagar com Pix"]);
  if(gestor())t.push(["time","Time","Membros e convites"]);
  if(typeof finAcesso==="function"&&finAcesso())t.unshift(["financeiro","Financeiro","Mensalidades e despesas"]);
  box.innerHTML=t.map(([v,n,d])=>`<button type="button" class="lg-tile${v==="financeiro"?" fin":""}" data-v="${v}">${badges[v]?'<span class="dot"></span>':""}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${ICON[v]}</svg><b>${n}</b><span>${d}</span></button>`).join("")}
$("#lgMais").addEventListener("click",e=>{const b=e.target.closest("[data-v]");if(b)go(b.dataset.v)});

/* ---- ligação com o app ---- */
EXTRA.onMark=()=>{
  if(view==="avisos"&&LG.lastView!=="avisos"){LG.prevSeen=getSeen();marcarVisto();renderAvisos()}
  LG.lastView=view;renderMais()};
/* ---- assembleias: coleção própria, só diretoria (presidente, capitães, professor e tesouraria) ---- */
function syncAssemb(){
  const ok=verAssemb();
  if(ok&&!LG.subA){let primeira=true;
    const u=onSnapshot(collection(db,"times",teamId,"assembleias"),s=>{
      if(!primeira)s.docChanges().forEach(c=>{if(c.doc.metadata.hasPendingWrites||c.type!=="added")return;const a=c.doc.data();
        if(a.criadoPor!==user.uid&&a.data>=hoje())notify(`Assembleia na agenda: ${a.titulo} · ${diaLabel(a.data)}`,"agenda")});
      primeira=false;LG.assemb=s.docs.map(d=>({id:d.id,...d.data()}));renderAgenda();lembretesDepois()},e=>console.warn("assembleias",e));
    LG.subA=u;unsubs.push(()=>{u();LG.subA=null})}
  else if(!ok&&LG.subA){LG.subA();LG.subA=null;LG.assemb=[]}}
async function migrarAssembleias(){
  if(!gestor())return;
  for(const a of LG.agenda.filter(x=>x.tipo==="assembleia"&&!LG.migr.has(x.id))){LG.migr.add(a.id);
    try{const {id,...dados}=a;await setDoc(doc(db,"times",teamId,"assembleias",id),dados);await deleteDoc(agRef(id))}catch(e){console.warn("migrar",e)}}}

/* ---- lembretes no celular (notificações do Android) ---- */
const LN=(m,o)=>plug("LocalNotifications",m,o);
const nId=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))|0;return Math.abs(h)%2000000000+1};
let lembT=null;const lembretesDepois=()=>{clearTimeout(lembT);lembT=setTimeout(agendarLembretes,2500)};
async function permNotif(){
  try{const p=await LN("checkPermissions");if(p.display==="granted")return true;
    if(LG.pediuNotif)return false;LG.pediuNotif=true;const r=await LN("requestPermissions");return r.display==="granted"}catch(e){return false}}
async function agendarLembretes(){
  if(!temNativo()||!me||!teamId)return;
  const agora=Date.now(),lim=agora+14*864e5,lista=[];
  instancias().filter(i=>!i.cancelado&&i.data&&i.ini).forEach(i=>{
    const ini=pdate(i.data);const[h,mi]=i.ini.split(":").map(Number);ini.setHours(h,mi,0,0);const t=ini.getTime();if(t>lim)return;
    const T=TIPOS[i.tipo]||TIPOS.evento,onde=i.local?` · ${i.local}`:"";
    const add=(quando,chave,titulo,corpo)=>{if(quando>agora+60000)lista.push({id:nId(i.id+chave),title:titulo,body:corpo,schedule:{at:new Date(quando).toISOString(),allowWhileIdle:true},extra:{tela:"agenda"}})};
    add(t-2*3600e3,"2h",`${T.n} às ${i.ini}`,`${i.titulo||T.n}${onde}`);
    if(i.tipo!=="treino"){const v=pdate(i.data);v.setDate(v.getDate()-1);v.setHours(19,0,0,0);add(v.getTime(),"vespera",`Amanhã: ${i.titulo||T.n}`,`${i.ini}${onde}`)}});
  lista.sort((a,b)=>a.schedule.at.localeCompare(b.schedule.at));const sel=lista.slice(0,48);
  const assin=JSON.stringify(sel.map(n=>[n.id,n.schedule.at,n.title,n.body]));
  let antes="";try{antes=localStorage.getItem("lg_lemb")||""}catch(e){}
  if(assin===antes)return;
  if(!(await permNotif()))return;
  try{const old=JSON.parse(antes||"[]").map(x=>({id:x[0]}));if(old.length)await LN("cancel",{notifications:old});
    if(sel.length)await LN("schedule",{notifications:sel});localStorage.setItem("lg_lemb",assin)}catch(e){console.warn("lembretes",e)}}
async function notificarSistema(titulo,corpo,chave){
  if(!temNativo()||!document.hidden||!(await permNotif()))return;
  try{await LN("schedule",{notifications:[{id:nId(chave),title:titulo,body:corpo,schedule:{at:new Date(Date.now()+1500).toISOString(),allowWhileIdle:true}}]})}catch(e){}}

EXTRA.render.push(()=>{syncAssemb();renderAgenda();renderRank();renderAvisos();renderMais()});
EXTRA.reset.push(()=>{LG.agenda=[];LG.assemb=[];LG.subA=null;LG.conf=[];LG.avisos=[];LG.ok={ag:false,av:false};LG.lastView=null;LG.aberto.clear()});
EXTRA.start.push(()=>{
  LG.ok={ag:false,av:false};
  const falha=nome=>e=>{console.warn(nome,e);if(e.code==="permission-denied")toast("Sem permissão para ler "+nome)};
  unsubs.push(onSnapshot(collection(db,"times",teamId,"agenda"),s=>{
    const prev=new Map(LG.agenda.map(a=>[a.id,a]));
    if(LG.ok.ag)s.docChanges().forEach(c=>{
      if(c.doc.metadata.hasPendingWrites||c.type==="removed")return;
      const a={id:c.doc.id,...c.doc.data()},old=prev.get(a.id);if(!a.data||a.data<hoje())return;
      if(c.type==="added"&&!a.id.startsWith("fx-")&&a.criadoPor!==user.uid)
        notify(`${TIPOS[a.tipo]?.n||"Evento"} na agenda: ${a.titulo} · ${diaLabel(a.data)}`,"agenda");
      else if(a.cancelado&&!old?.cancelado)notify(`${a.titulo||"Treino"} de ${diaLabel(a.data).toLowerCase()} foi cancelado.`,"agenda");
    });
    LG.agenda=s.docs.map(d=>({id:d.id,...d.data()}));LG.ok.ag=true;renderAgenda();renderRank();migrarAssembleias();lembretesDepois()},falha("a agenda")));
  unsubs.push(onSnapshot(query(collection(db,"times",teamId,"confirmacoes"),where("data",">=",ymd(addDays(new Date(),-40)))),s=>{
    LG.conf=s.docs.map(d=>d.data());renderAgenda()},falha("as confirmações")));
  unsubs.push(onSnapshot(query(collection(db,"times",teamId,"avisos"),orderBy("em","desc"),limit(40)),s=>{
    const prev=new Set(LG.avisos.map(a=>a.id));
    LG.avisos=s.docs.map(d=>{const x=d.data({serverTimestamps:"estimate"});return{id:d.id,...x,ms:x.em?.toMillis?.()||Date.now()}});
    if(LG.ok.av)LG.avisos.filter(a=>!prev.has(a.id)&&a.autorUid!==user.uid).forEach(a=>{notify(`Novo aviso: ${a.titulo}`,"avisos");notificarSistema("Novo aviso da Liga",a.titulo,"aviso-"+a.id)});
    else if(view!=="avisos"&&LG.avisos[0]&&LG.avisos[0].ms>getSeen()&&LG.avisos[0].autorUid!==user.uid){badges.avisos=true;markTab()}
    LG.ok.av=true;if(view==="avisos")marcarVisto();renderAvisos()},falha("os avisos")));
  // atualiza o selo "Agora" e o "há x min" a cada minuto
  const tk=setInterval(()=>{if(!document.hidden){renderAgenda();renderAvisos()}},60000);unsubs.push(()=>clearInterval(tk));
});

/* ================= ALPHA: configuração do time pelo presidente (quadras, treinos, Pix e mensalidade) ================= */
const CF={quadras:null,treinos:null,aberto:false};
const DIAS=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
ICON.config='<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>';
LABEL.config="Configurar o time";EXTRA.parent.config="mais";
const cfgTime=()=>!!me&&me.papel==="presidente";
const novoIdCf=()=>Math.random().toString(36).slice(2,8);
function cfCarrega(){
  CF.quadras=(team?.quadras||[]).map(q=>({...q}));
  CF.treinos=(team?.treinosFixos||[]).map(t=>({...t}));
  if(!CF.quadras.length)CF.quadras=[{id:novoIdCf(),nome:"",end:""}];
}
function renderConfig(){const box=$("#cfBody");if(!box||!me)return;
  if(!cfgTime()){box.innerHTML=`<div class="empty">Só o presidente configura o time.</div>`;return}
  if(!CF.quadras)cfCarrega();
  const c=typeof cfg==="function"?cfg():{};
  const opQ=sel=>CF.quadras.map(q=>`<option value="${q.id}" ${q.id===sel?"selected":""}>${esc(q.nome||"Quadra sem nome")}</option>`).join("");
  box.innerHTML=`
    ${team?.configOk?"":`<div class="cf-boas"><b>Bem-vindo, presidente!</b><span>Cadastre as quadras, os treinos e o Pix. Dá para mudar tudo depois em Mais › Configurar o time.</span></div>`}
    <div class="box cf-sec"><h3><i>1</i>Quadras</h3>
      ${CF.quadras.map((q,i)=>`<div class="cf-quadra" data-q="${q.id}">
        <label class="f">Nome da quadra<input type="text" data-qn="${q.id}" maxlength="40" value="${esc(q.nome||"")}" placeholder="Ex.: Arena Beach"></label>
        <label class="f">Endereço<input type="text" data-qe="${q.id}" maxlength="120" value="${esc(q.end||"")}" placeholder="Rua, número, bairro"></label>
        ${CF.quadras.length>1?`<button class="btn ghost cf-x" type="button" data-qx="${q.id}">Remover quadra</button>`:""}</div>`).join("")}
      <button class="btn" type="button" id="cfAddQ">+ Adicionar quadra</button></div>
    <div class="box cf-sec"><h3><i>2</i>Treinos da semana</h3>
      ${CF.treinos.length?CF.treinos.map((t,i)=>`<div class="cf-treino">
        <div class="two"><label class="f">Dia<select data-td="${i}">${DIAS.map((d,k)=>`<option value="${k}" ${+t.dow===k?"selected":""}>${d}</option>`).join("")}</select></label>
        <label class="f">Quadra<select data-tq="${i}">${opQ(t.qid)}</select></label></div>
        <div class="two"><label class="f">Começa<input type="time" data-ti="${i}" value="${t.ini||"19:00"}"></label><label class="f">Termina<input type="time" data-tf="${i}" value="${t.fim||"21:00"}"></label></div>
        <button class="btn ghost cf-x" type="button" data-tx="${i}">Remover treino</button></div>`).join(""):`<p class="note">Nenhum treino cadastrado ainda.</p>`}
      <button class="btn" type="button" id="cfAddT">+ Adicionar treino</button></div>
    <div class="box cf-sec"><h3><i>3</i>Pix e mensalidade</h3>
      <label class="f">Chave Pix<input type="text" id="cfChave" autocomplete="off" value="${esc(c.chave||"")}" placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória"></label>
      <div class="two"><label class="f">Nome de quem recebe<input type="text" id="cfNome" maxlength="25" value="${esc(c.recebedor||"")}" placeholder="Como aparece no banco"></label>
      <label class="f">Cidade<input type="text" id="cfCid" maxlength="15" value="${esc(c.cidade||"")}"></label></div>
      <div class="two"><label class="f">Mensalidade (R$)<input type="text" id="cfVal" inputmode="decimal" value="${c.valorInd?num2(c.valorInd):""}" placeholder="60,00"></label>
      <label class="f">Vencimento (dia)<input type="number" id="cfVenc" min="1" max="28" value="${+c.venc||10}"></label></div>
      <label class="f">Plano família para 2 pessoas (R$, opcional)<input type="text" id="cfFam" inputmode="decimal" value="${c.valorFam?num2(c.valorFam):""}" placeholder="Deixe em branco se não tiver"></label>
      <p class="note" style="margin:0">O app gera o QR Code e o Pix copia e cola com o valor de cada atleta.</p></div>
    <div class="err" id="cfErr"></div>
    <div class="tr-acao fixo"><button class="btn primary big" type="button" id="cfSalva">Salvar configuração</button></div>`;
}
function cfLe(){
  document.querySelectorAll("[data-qn]").forEach(i=>{const q=CF.quadras.find(x=>x.id===i.dataset.qn);if(q)q.nome=i.value.trim()});
  document.querySelectorAll("[data-qe]").forEach(i=>{const q=CF.quadras.find(x=>x.id===i.dataset.qe);if(q)q.end=i.value.trim()});
  CF.treinos.forEach((t,i)=>{const g=k=>document.querySelector(`[data-${k}="${i}"]`);if(!g("td"))return;t.dow=+g("td").value;t.qid=g("tq").value;t.ini=g("ti").value;t.fim=g("tf").value});
}
$("#cfBody").addEventListener("click",async e=>{if(!cfgTime())return;
  if(e.target.closest("#cfAddQ")){cfLe();CF.quadras.push({id:novoIdCf(),nome:"",end:""});return renderConfig()}
  const qx=e.target.closest("[data-qx]");if(qx){cfLe();CF.quadras=CF.quadras.filter(q=>q.id!==qx.dataset.qx);CF.treinos.forEach(t=>{if(t.qid===qx.dataset.qx)t.qid=CF.quadras[0]?.id});return renderConfig()}
  if(e.target.closest("#cfAddT")){cfLe();CF.treinos.push({dow:1,qid:CF.quadras[0]?.id,ini:"19:00",fim:"21:00"});return renderConfig()}
  const tx=e.target.closest("[data-tx]");if(tx){cfLe();CF.treinos.splice(+tx.dataset.tx,1);return renderConfig()}
  if(!e.target.closest("#cfSalva"))return;
  cfLe();const err=$("#cfErr");err.textContent="";
  const qs=CF.quadras.filter(q=>q.nome);if(!qs.length){err.textContent="Cadastre pelo menos uma quadra com nome.";return}
  if(CF.treinos.some(t=>!t.ini||!t.fim)){err.textContent="Preencha o horário de começo e fim de cada treino.";return}
  const chave=$("#cfChave").value.trim(),val=parseBRL($("#cfVal").value),fam=$("#cfFam").value.trim()?parseBRL($("#cfFam").value):0;
  if(!chave){err.textContent="Informe a chave Pix.";return}
  if(!(val>0)){err.textContent="Informe o valor da mensalidade.";return}
  const venc=Math.min(28,Math.max(1,parseInt($("#cfVenc").value)||10));
  const fixos=CF.treinos.map(t=>{const q=qs.find(x=>x.id===t.qid)||qs[0];return{dow:+t.dow,qid:q.id,local:q.nome,end:q.end||"",ini:t.ini,fim:t.fim,obs:q.end?("Endereço: "+q.end):""}}).sort((a,b)=>((a.dow+6)%7)-((b.dow+6)%7)||a.ini.localeCompare(b.ini));
  const b=$("#cfSalva");b.disabled=true;
  try{
    await updateDoc(teamRef(),{quadras:qs,treinosFixos:fixos,configOk:true});
    await setDoc(cfgRef(),{...cfg(),chave,recebedor:($("#cfNome").value.trim()||team?.nome||"").toUpperCase().slice(0,25),cidade:($("#cfCid").value.trim()||"BRASIL").toUpperCase().slice(0,15),valorInd:val,valorFam:fam,venc},{merge:true});
    team.quadras=qs;team.treinosFixos=fixos;team.configOk=true;CF.quadras=null;toast("Configuração salva");go("agenda")}
  catch(x){err.textContent="Não consegui salvar: "+(x.code||x.message);b.disabled=false}});
EXTRA.render.push(()=>{if(view==="config")renderConfig();
  if(cfgTime()&&team&&!team.configOk&&!CF.aberto){CF.aberto=true;setTimeout(()=>go("config"),400)}});
EXTRA.reset.push(()=>{CF.quadras=null;CF.treinos=null;CF.aberto=false});
{const ant=EXTRA.onMark;EXTRA.onMark=()=>{ant&&ant();if(view==="config"){CF.quadras=null;renderConfig()}}}

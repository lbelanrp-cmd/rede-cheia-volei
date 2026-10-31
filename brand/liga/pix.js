
/* ================= LIGA: PAGAR MENSALIDADE COM PIX ================= */
const PAG={sub:null,ok:false,pix:null,meus:[],sel:null,foto:""};
ICON.pagar='<path d="M12 3 4 11l8 8 8-8z"/><path d="M8.5 11 12 14.5 15.5 11"/>';
LABEL.pagar="Mensalidade";
EXTRA.parent.pagar="mais";
const pixRef=()=>doc(db,"times",teamId,"pix","config");
/* Pix "copia e cola" (padrão BR Code do Banco Central) */
function crc16(s){let c=0xFFFF;for(let i=0;i<s.length;i++){c^=s.charCodeAt(i)<<8;for(let j=0;j<8;j++)c=(c&0x8000)?((c<<1)^0x1021)&0xFFFF:(c<<1)&0xFFFF}return c.toString(16).toUpperCase().padStart(4,"0")}
const semAcento=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^A-Za-z0-9 ]/g,"").toUpperCase().trim();
const tlv=(id,v)=>id+String(v.length).padStart(2,"0")+v;
function pixPayload({chave,nome,cidade,valor,txid}){
  const mai=tlv("00","br.gov.bcb.pix")+tlv("01",String(chave).trim());
  let p=tlv("00","01")+tlv("26",mai)+tlv("52","0000")+tlv("53","986")+(valor>0?tlv("54",(+valor).toFixed(2)):"")+tlv("58","BR")+
    tlv("59",semAcento(nome).slice(0,25)||"LIGA")+tlv("60",semAcento(cidade).slice(0,15)||"BRASIL")+tlv("62",tlv("05",String(txid||"").replace(/[^A-Za-z0-9]/g,"").slice(0,25)||"***"));
  p+="6304";return p+crc16(p)}

function syncPag(){
  if(!me||PAG.sub)return;
  const a=onSnapshot(pixRef(),s=>{PAG.pix=s.exists()?s.data():null;renderPag();renderMais()},e=>console.warn("pix",e));
  const b=onSnapshot(query(collection(db,"times",teamId,"pag_informes"),where("uid","==",user.uid)),s=>{
    const antes=new Map(PAG.meus.map(x=>[x.id,x.status]));PAG.meus=s.docs.map(d=>({id:d.id,...d.data()}));
    if(PAG.ok)PAG.meus.forEach(x=>{const st=antes.get(x.id);
      if(st==="pendente"&&x.status==="confirmado")notify(`Pagamento de ${mesNome(x.mes).toLowerCase()} confirmado pela tesouraria.`,"pagar");
      if(st==="pendente"&&x.status==="recusado")notify(`A tesouraria não encontrou o Pix de ${mesNome(x.mes).toLowerCase()}. Fale com ela.`,"pagar")});
    PAG.ok=true;renderPag()},e=>console.warn("informes",e));
  PAG.sub=[a,b];unsubs.push(()=>{a();b();PAG.sub=null})}
EXTRA.render.push(()=>{syncPag();renderPag()});
EXTRA.reset.push(()=>{PAG.sub=null;PAG.ok=false;PAG.pix=null;PAG.meus=[]});

function minhaCobranca(){
  const c=PAG.pix||{},eu=me.carta;if(!eu)return null;const f=(c.familias||[]).find(x=>x.a===eu||x.b===eu);
  if(f){const outro=f.a===eu?f.b:f.a;return{cartas:[eu,outro],fam:true,valor:+(c.valorFam||100),nomes:[byId(eu)?.nome,byId(outro)?.nome].filter(Boolean).join(" e "),outro:byId(outro)?.nome||""}}
  return{cartas:[eu],fam:false,valor:+(c.valorInd||60),nomes:byId(eu)?.nome||me.nome||""}}
function statusMes(m){const i=PAG.meus.filter(x=>x.mes===m);
  if(i.some(x=>x.status==="confirmado"))return"pago";if(i.some(x=>x.status==="pendente"))return"analise";
  const atual=mesAtual();if(m<atual||(m===atual&&new Date().getDate()>(+(PAG.pix?.venc)||10)))return"atrasado";return"pendente"}
function renderPag(){
  const box=$("#pagBody");if(!box||!me)return;
  const p=me.carta&&byId(me.carta);
  if(!p){box.innerHTML=`<div class="empty">Crie a sua carta primeiro, na aba Carta.</div>`;return}
  if(p.tipo!=="mensal"){box.innerHTML=`<div class="empty">Você está como <b>avulso</b>. Se você é mensalista, peça para a comissão mudar o tipo na sua carta.</div>`;return}
  if(!PAG.pix?.chave){box.innerHTML=`<div class="empty">A tesouraria ainda não configurou o Pix da Liga.</div>`;return}
  const cob=minhaCobranca(),atual=mesAtual();let ini=PAG.pix.inicio||atual;if(ini<mesAdd(atual,-5))ini=mesAdd(atual,-5);
  const meses=[];for(let x=ini;x<=atual;x=mesAdd(x,1))meses.push(x);meses.reverse();
  const LBL={pago:"✓ Pago",analise:"Em análise",atrasado:"Atrasado",pendente:"A pagar"};
  box.innerHTML=`<div class="pag-resumo"><span>Sua mensalidade</span><b>${brl(cob.valor)}</b>
      <small>${cob.fam?`Plano família com ${esc(cob.outro)}`:"Individual"} · vence todo dia ${+(PAG.pix.venc)||10}</small></div>
    ${meses.map(m=>{const s=statusMes(m);return `<div class="pag-mes st-${s==="pago"?"pago":s==="analise"?"analise":s==="atrasado"?"atrasado":"pendente"}">
      <div class="q"><b>${mesNome(m)}</b><span>${s==="analise"?"Você informou o pagamento. A tesouraria vai conferir.":s==="pago"?"Pagamento confirmado.":brl(cob.valor)}</span></div>
      ${s==="pago"||s==="analise"?`<span class="pag-pill">${LBL[s]}</span>`:`<button class="btn primary" type="button" data-pagar="${m}">Pagar com Pix</button>`}</div>`}).join("")}`}
$("#pagBody").addEventListener("click",e=>{const b=e.target.closest("[data-pagar]");if(b)abrirPagar(b.dataset.pagar)});

function abrirPagar(m){
  const cob=minhaCobranca(),pix=PAG.pix;if(!cob||!pix)return;
  const txid=("LJ"+m.replace("-","")+String(me.carta).replace(/[^A-Za-z0-9]/g,"")).slice(0,25);
  const code=pixPayload({chave:pix.chave,nome:pix.recebedor||"LIGA DA JUSTICA VOLEI",cidade:pix.cidade||"BRASIL",valor:cob.valor,txid});
  let qrImg="";try{const q=qrcode(0,"M");q.addData(code);q.make();qrImg=q.createDataURL(6,2)}catch(x){}
  PAG.sel={m,cob,code};PAG.foto="";
  $("#pagSheet").innerHTML=`<div class="row spread"><h2>Pagar com Pix</h2><button class="btn ghost" type="button" data-x>Fechar</button></div>
    <p class="note" style="margin:0;text-align:center">Mensalidade de ${mesNome(m)}${cob.fam?` · plano família (${esc(cob.nomes)})`:""}</p>
    <div class="pag-valor">${brl(cob.valor)}</div>
    ${qrImg?`<div class="pag-qr"><img src="${qrImg}" alt="QR Code do Pix"></div>`:""}
    <button class="btn primary" type="button" id="pgCopiar">Copiar código Pix (copia e cola)</button>
    <div class="pag-code" id="pgCode">${esc(code)}</div>
    <ol class="pag-passos"><li>Abra o app do seu banco e escolha <b>Pix › Copia e Cola</b> (ou ler QR Code de outro celular).</li>
      <li>Cole o código. O valor já vem preenchido.</li><li>Confira o nome de quem recebe e confirme.</li></ol>
    <p class="note" style="margin:0">Chave Pix da Liga: <b>${esc(pix.chave)}</b> <button class="btn ghost" type="button" id="pgChave" style="padding:4px 8px;font-size:12px">Copiar chave</button></p>
    <div class="box"><h3>Já pagou?</h3><p class="note" style="margin:0">Mande o comprovante (opcional) e avise a tesouraria.</p>
      <div class="fin-foto"><span id="pgFotoPrev"></span>
        <label class="btn pbtn" for="pgCam">Foto do comprovante</label><label class="btn ghost pbtn" for="pgGal">Galeria</label></div>
      <input type="file" id="pgCam" accept="image/*" capture="environment" class="vh"><input type="file" id="pgGal" accept="image/*" class="vh">
      <div class="err" id="pgErr"></div>
      <button class="btn primary" type="submit" id="pgSave">Já paguei, avisar a tesouraria</button></div>`;
  $("#pagModal").hidden=false}
const fecharPag=()=>{$("#pagModal").hidden=true;PAG.sel=null};
$("#pagModal").addEventListener("click",async e=>{
  if(e.target.id==="pagModal"||e.target.closest("[data-x]"))return fecharPag();
  if(e.target.id==="pgCopiar")return toast(await copiar(PAG.sel.code)?"Código Pix copiado. Cole no app do banco.":"Não consegui copiar. Segure o código e copie.");
  if(e.target.id==="pgChave")return toast(await copiar(PAG.pix.chave)?"Chave Pix copiada":"Não consegui copiar")});
$("#pagSheet").addEventListener("change",async e=>{if(e.target.id!=="pgCam"&&e.target.id!=="pgGal")return;const f=e.target.files[0];e.target.value="";if(!f)return;
  try{PAG.foto=await comprovante(f);$("#pgFotoPrev").innerHTML=`<img src="${PAG.foto}" alt="Comprovante">`}catch(x){toast("Não consegui abrir essa foto")}});
$("#pagSheet").addEventListener("submit",async e=>{
  e.preventDefault();const s=PAG.sel;if(!s)return;const b=$("#pgSave");b.disabled=true;$("#pgErr").textContent="";
  try{const ref=doc(collection(db,"times",teamId,"pag_informes"));const bt=writeBatch(db);
    bt.set(ref,{uid:user.uid,nome:me.nome||"",cartas:s.cob.cartas,nomes:s.cob.nomes,mes:s.m,valor:s.cob.valor,data:hoje(),status:"pendente",temFoto:!!PAG.foto,em:serverTimestamp()});
    if(PAG.foto)bt.set(doc(db,"times",teamId,"pag_comp",ref.id),{foto:PAG.foto});
    await bt.commit();fecharPag();toast("Pronto! A tesouraria vai conferir o seu Pix.")}
  catch(x){b.disabled=false;$("#pgErr").textContent="Não consegui enviar: "+(x.code||x.message)}});

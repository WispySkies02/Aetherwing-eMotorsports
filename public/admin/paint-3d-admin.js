(() => {
  'use strict';
  const root=document.querySelector('[data-panel="3d"]');
  if(!root)return;
  const $=q=>root.querySelector(q);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ids=['nrrs-toyota','oreilly-chevy','sunoco-truck'];
  const bodyNames={'nrrs-toyota':'NRRS / D1 Toyota','oreilly-chevy':'O’Reilly Chevy body (Dodge graphics okay)','sunoco-truck':'Sunoco RAM Truck'};
  const api=()=>window.AetherwingPaintAdmin;
  const MAX_PNG_BYTES=16*1024*1024; // Keep in sync with the upload function (16 MiB).
  const available=p=>!(p.leagues||[]).some(l=>['iracing','uarl-open','uarl-d2'].includes(l));
  function suggested(p){
    const league=p.leagues?.[0]||'';
    if((league==='nrrs'||league==='uarl-d1')&&/BBR D1 Toyota/i.test(p.body||''))return 'nrrs-toyota';
    if(league==='kmart'&&/BBR D2 Chevy/i.test(p.body||''))return 'oreilly-chevy';
    if(league==='sunoco-truck'&&/CWS15 RAM/i.test(p.body||''))return 'sunoco-truck';
    return '';
  }
  const supported=p=>available(p)&&ids.includes(p.bodyModel||suggested(p));
  const texture=p=>p.textureKey||p.liveryTexture;
  const status=p=>!available(p)?'unsupported':!supported(p)?'body':!texture(p)?'missing':'ready';
  const names={unsupported:'3D BODY NEEDED',body:'ASSIGN 3D BODY',missing:'PNG REQUIRED',ready:'3D READY'};
  let busy='';
  function showStatus(message,isError=false){
    const el=$('[data-3d-count]'); if(!el)return;
    el.textContent=message;
    el.style.color=isError?'#ff9090':'';
  }
  function render(){
    const paints=api()?.getPaints?.()||[];
    const term=($('[data-3d-search]')?.value||'').toLowerCase().trim();
    const filter=$('[data-3d-filter]')?.value||'all';
    const matches=paints.filter(p=>{
      const state=status(p);
      const match=!term||[p.sponsor,p.slug,p.driver,p.leagueName,p.body,p.manufacturer].join(' ').toLowerCase().includes(term);
      return match&&(filter==='all'||filter===state||(filter==='missing'&&['missing','body'].includes(state)));
    });
    const ready=paints.filter(p=>status(p)==='ready').length,missing=paints.filter(p=>status(p)==='missing').length,unavailable=paints.filter(p=>status(p)==='unsupported').length;
    if(!busy)showStatus(`${ready} READY  ·  ${missing} NEED PNG  ·  ${unavailable} WITHOUT MATCHING 3D GEOMETRY  ·  ${paints.length} TOTAL`);
    $('[data-3d-list]').innerHTML=matches.map(p=>{
      const state=status(p),enabled=available(p),selected=p.bodyModel||suggested(p);
      return `<article class="aw3d-card" data-3d-row="${esc(p.slug)}" data-status="${state}">
        <div class="aw3d-identity"><img src="${esc(p.image||'')}" alt="" loading="lazy"><div><strong>${esc(p.sponsor)}</strong><small>${esc(p.leagueName||p.leagues?.[0]||'')} · #${esc(p.number||'—')} · ${esc(p.manufacturer||'')}</small><code>${esc(p.slug)}</code></div></div>
        <span class="aw3d-status" data-3d-state>${names[state]}</span>
        <div class="aw3d-actions"><label>Body model <select data-3d-body ${!enabled?'disabled':''}><option value="">— No matching body —</option>${ids.map(id=>`<option value="${id}" ${selected===id?'selected':''}>${esc(bodyNames[id])}</option>`).join('')}</select></label>
        <label>Flat livery PNG <input type="file" accept="image/png,.png" data-3d-file ${!enabled?'disabled':''}></label>
        <button class="primary" type="button" data-3d-save ${!enabled?'disabled':''}>Upload &amp; save 3D</button>
        ${texture(p)?'<button class="secondary" type="button" data-3d-clear>Clear texture</button>':''}
        </div><p class="aw3d-help" data-3d-help>${state==='unsupported'?'This division needs its own verified geometry and UV template; it stays in 2D.':state==='body'?'Choose a compatible body to enable 3D for this paint.':state==='missing'?'Upload the original flat paint PNG. Static car renders cannot be used as 3D textures.':'Ready: texture and compatible body are assigned.'}</p>
      </article>`;
    }).join('')||'<p>No paints match the search or status filter.</p>';
  }
  // Phone connections drop requests now and then; Safari reports that as
  // "Load failed". Every upload step is safe to repeat, so a dropped or
  // briefly unavailable request is retried before the upload gives up.
  const RETRY_DELAYS=[800,2000,4500];
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const transient=status=>[429,502,503,504].includes(status);
  async function withRetry(step,attempt){
    for(let tryNo=0;;tryNo++){
      try{return await attempt();}
      catch(err){
        const retryable=err?.retryable||err instanceof TypeError;
        if(!retryable)throw err;
        if(tryNo>=RETRY_DELAYS.length)throw Error(`Upload stopped while ${step}: ${err.retryable?err.message:'the connection dropped'}. Check the connection and press Upload & save 3D again.`);
        showStatus(`Connection hiccup while ${step} — retrying (${tryNo+1}/${RETRY_DELAYS.length})…`);
        await wait(RETRY_DELAYS[tryNo]);
      }
    }
  }
  function postChunk(body,step){
    return withRetry(step,async()=>{
      const jwt=await api().getToken();
      const response=await fetch('/.netlify/functions/paint-3d-upload',{
        method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${jwt}`},body:JSON.stringify(body)
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok){const err=Error(data.error||`Texture upload failed (${response.status})`);err.retryable=transient(response.status);throw err;}
      return data;
    });
  }
  function encodeBytes(bytes){
    let value='';for(let i=0;i<bytes.length;i+=8192)value+=String.fromCharCode(...bytes.subarray(i,i+8192));
    return btoa(value);
  }
  async function uploadPng(file,slug){
    if(!file||file.type!=='image/png'||!file.name.toLowerCase().endsWith('.png'))throw Error('Choose an actual PNG file, not a JPEG or finished car screenshot.');
    if(file.size>MAX_PNG_BYTES||file.size<100)throw Error('PNG must be between 100 bytes and 16 MB (16 MiB).');
    if(location.hostname==='localhost'||location.hostname==='127.0.0.1'){
      const url=URL.createObjectURL(file);
      // Local preview mode does not write to production Netlify Blobs.
      return {textureKey:'',liveryTexture:url,preview:true};
    }
    const start=await postChunk({action:'start',bytes:file.size},'starting the upload');
    for(let i=0;i<start.count;i++){
      const buffer=await file.slice(i*start.chunkSize,(i+1)*start.chunkSize).arrayBuffer();
      await postChunk({action:'chunk',id:start.id,index:i,data:encodeBytes(new Uint8Array(buffer))},`sending piece ${i+1} of ${start.count}`);
      showStatus(`Uploading ${slug}: ${i+1}/${start.count} chunks…`);
    }
    const result=await postChunk({action:'finish',id:start.id},'finishing the upload');
    return {textureKey:result.key,liveryTexture:''};
  }
  async function save(row,clear=false){
    const slug=row.dataset['3dRow'];
    const current=api().getPaints().find(p=>p.slug===slug);
    if(!current)return;
    const bodyModel=row.querySelector('[data-3d-body]').value;
    const input=row.querySelector('[data-3d-file]');
    const file=!clear&&input.files?.[0];
    if(!clear&&!bodyModel)throw Error('Choose a compatible body model first.');
    let reference={textureKey:clear?'':current.textureKey||'',liveryTexture:clear?'':current.liveryTexture||''};
    if(file)reference=await uploadPng(file,slug);
    busy=slug;
    showStatus(`Saving ${slug}…`);
    const payload={slug,bodyModel, ...reference, clearTexture:clear};
    await withRetry('saving the 3D settings',()=>api().request('save3dSettings',payload));
    busy='';
    render();
    showStatus(`${slug}: ${clear?'texture cleared':'3D settings saved and published'} · Refresh the Paint Booth to see the update.`);
  }
  $('[data-3d-list]').addEventListener('click',async e=>{
    const button=e.target instanceof Element?e.target.closest('[data-3d-save],[data-3d-clear]'):null;
    if(!button||busy)return;
    const row=button.closest('[data-3d-row]');if(!row)return;
    busy=row.dataset['3dRow'];button.disabled=true;
    try{await save(row,button.hasAttribute('data-3d-clear'));}catch(err){busy='';button.disabled=false;showStatus(err.message,true);}
  });
  $('[data-3d-search]').addEventListener('input',render);
  $('[data-3d-filter]').addEventListener('change',render);
  $('[data-3d-refresh]').addEventListener('click',async()=>{try{await api().refresh();render();}catch(err){showStatus(err.message,true);}});
  window.addEventListener('aetherwing:paint-admin-refresh',render);
  document.querySelector('[data-admin-paint-tab="3d"]')?.addEventListener('click',render);
  render();
})();

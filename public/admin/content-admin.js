(() => {
  'use strict';
  const local = ['localhost','127.0.0.1'].includes(location.hostname);
  const endpoint = '/.netlify/functions/site-admin';
  const modules = {
    schedule: { title:'Schedule Manager', sections:[['schedule-events','Race calendar']] },
    results: { title:'Results & Milestones', sections:[['results','Latest results'],['wins','Win archive'],['standings','Standings snapshots'],['milestones','Milestones']] },
    roster: { title:'Roster Manager', sections:[['roster-profiles','Roster cards'],['drivers','Program entries'],['driver-profiles','Driver profile pages & stats'],['charters','Charter allocations'],['iracing-garage','iRacing factory entries']] },
    news: { title:'Team Wire', sections:[['news','Stories & featured homepage headline']] }
  };
  let registry = { revision:0, published:{}, drafts:{}, history:[] }, seeds = {}, key='', data=null, index=0, dirty=false, loaded=false, busy=false;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = (s) => s.replace(/([A-Z])/g,' $1').replace(/[-_]/g,' ').replace(/^./,(c)=>c.toUpperCase());
  const status = (message) => { $('[data-content-status]').textContent=message; };
  const account = () => window.netlifyIdentity?.currentUser();
  const authorized = () => local || (account()?.app_metadata?.roles || account()?.app_metadata?.authorization?.roles || []).includes('admin');
  const base = (name) => registry.drafts[name] ?? registry.published[name] ?? seeds[name];
  async function api(action, payload={}) {
    if (local) {
      if (!action) return {registry,seeds};
      if (action==='saveDraft') registry.drafts[payload.dataset]=structuredClone(payload.data);
      if (action==='discardDraft') delete registry.drafts[payload.dataset];
      if (action==='publish') { registry.published[payload.dataset]=registry.drafts[payload.dataset]; delete registry.drafts[payload.dataset]; }
      registry.revision++;
      localStorage.setItem('aetherwing-site-admin',JSON.stringify(registry));
      return { registry, publication:action==='publish'||action==='rebuild'?{queued:false,message:'Local test only; no public deployment was changed.'}:null };
    }
    const jwt=await account()?.jwt();
    if (!jwt) throw new Error('Sign in with an invited administrator account.');
    const response=await fetch(endpoint,{method:action?'POST':'GET',headers:{authorization:`Bearer ${jwt}`,'content-type':'application/json'},...(action?{body:JSON.stringify({action,revision:registry.revision,...payload})}:{})});
    const body=await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(body.error || `Site editor returned ${response.status}.`);
    return body;
  }
  async function load() {
    if (!authorized()) throw new Error('Main-site editors require the admin role.');
    if (local) {
      seeds=await fetch('/data/site-admin-seed.json').then((r)=>r.json());
      try { registry=JSON.parse(localStorage.getItem('aetherwing-site-admin')||'null')||registry; } catch {}
    } else { const result=await api(); registry=result.registry; seeds=result.seeds; status(result.publishConfigured?'Ready. Save a draft before publishing.':'Draft editing is ready. Configure the main-site build hook before publishing.'); }
    loaded=true;
  }
  function blank(value) {
    if (Array.isArray(value)) return value.length ? [blank(value[0])] : [];
    if (value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,blank(v)]));
    return typeof value==='boolean'?false:typeof value==='number'?0:'';
  }
  function valueAt(root, path) { return path.reduce((v,k)=>v?.[k],root); }
  function assign(root,path,value) { let obj=root; for(const k of path.slice(0,-1)) obj=obj[k]; obj[path.at(-1)]=value; }
  const current = () => Array.isArray(data)?data[index]:data;
  function arrayTemplate(name) {
    let found;
    function visit(value) {
      if (!value || typeof value!=='object' || found) return;
      for (const [k,v] of Object.entries(value)) {
        if (k===name && Array.isArray(v) && v[0] && typeof v[0]==='object') { found=v[0];return; }
        visit(v);
      }
    }
    visit(seeds[key]);return found;
  }
  function commit() {
    if (!current()) return;
    $('[data-content-fields]').querySelectorAll('[data-field-path]').forEach((field)=>{
      const path=JSON.parse(field.dataset.fieldPath), type=field.dataset.fieldType;
      let value=type==='boolean'?field.checked:type==='number'?Number(field.value):type==='lines'?field.value.split('\n').filter((v)=>v.trim()):field.value;
      if (type==='nullable' && !value) value=null;
      assign(current(),path,value);
    });
  }
  function fields(value,path=[]) {
    return Object.entries(value).map(([k,v])=>{
      const p=[...path,k], attr=`data-field-path="${esc(JSON.stringify(p))}"`;
      if (Array.isArray(v) && (v.some((x)=>x && typeof x==='object') || arrayTemplate(k))) return `<fieldset><legend>${esc(label(k))}</legend>${v.map((item,i)=>`<details open><summary>${esc(label(k))} ${i+1}</summary>${fields(item,[...p,i])}<button type="button" data-array-remove="${esc(JSON.stringify([...p,i]))}">Remove ${esc(label(k))} ${i+1}</button></details>`).join('')}<button type="button" data-array-add="${esc(JSON.stringify(p))}">Add ${esc(label(k))}</button></fieldset>`;
      if (v && typeof v==='object') return `<fieldset><legend>${esc(label(k))}</legend>${fields(v,p)}</fieldset>`;
      if (typeof v==='boolean') return `<label class="content-check"><input type="checkbox" ${attr} data-field-type="boolean" ${v?'checked':''}>${esc(label(k))}</label>`;
      if (k==='league' && key==='schedule-events') return `<label>${esc(label(k))}<select ${attr} data-field-type="string">${[['nrrs','NRRS'],['uarl-d1','UARL D1'],['uarl-d2','UARL D2'],['open','UARL Open'],['kmart','Kmart'],['sunoco','Sunoco'],['iracing','iRacing']].map(([id,name])=>`<option value="${id}" ${id===v?'selected':''}>${name}</option>`).join('')}</select></label>`;
      if (Array.isArray(v) || String(v||'').length>120 || ['summary','description','intro','bio','text','note','message'].includes(k)) return `<label>${esc(label(k))}${Array.isArray(v)?'<small>One item per line</small>':''}<textarea rows="${Array.isArray(v)?4:5}" ${attr} data-field-type="${Array.isArray(v)?'lines':'string'}">${esc(Array.isArray(v)?v.join('\n'):v)}</textarea></label>`;
      return `<label>${esc(label(k))}<input ${attr} data-field-type="${typeof v==='number'?'number':v===null?'nullable':'string'}" type="${typeof v==='number'?'number':['dateIso','endDate'].includes(k)||(k==='date'&&key==='schedule-events')?'date':'text'}" ${typeof v==='number'?'step="any"':''} value="${esc(v)}"></label>`;
    }).join('');
  }
  function title(row,i) { return row.title||row.name||row.displayName||row.label||row.track||row.driver||row.id||row.slug||`Entry ${i+1}`; }
  function renderList() {
    const search=$('[data-content-search]').value.toLowerCase();
    $('[data-content-list]').innerHTML=Array.isArray(data)?data.map((r,i)=>({r,i})).filter(({r})=>JSON.stringify(r).toLowerCase().includes(search)).map(({r,i})=>`<button type="button" data-entry="${i}" aria-pressed="${i===index}"><strong>${esc(title(r,i))}</strong><small>${esc([r.leagueName||r.competition||r.category||'',r.date||r.numbers||r.slug||''].filter(Boolean).join(' · '))}</small></button>`).join(''):'<p>This section is one complete record. Edit its fields on the right.</p>';
    $('[data-content-add]').hidden=!Array.isArray(data);
    $('[data-content-remove]').hidden=!Array.isArray(data)||!data.length;
  }
  function featureSelectedStory() {
    if (key!=='news' || !current()) return;
    commit();data.forEach((story,i)=>{story.featured=i===index;});dirty=true;render();status('This story is selected as the featured headline. Save the section draft, then publish.');
  }
  function render() {
    renderList();
    const row=current();
    $('[data-content-fields]').innerHTML=row?fields(row):'<p>No entries. Choose Add entry to start.</p>';
    if (key==='news' && row) {
      const button=document.createElement('button');button.type='button';button.textContent='Make this the featured homepage story';button.addEventListener('click',featureSelectedStory);$('[data-content-fields]').prepend(button);
    }
  }
  function chooseDataset(name) {
    key=name; data=structuredClone(base(key)); index=0; dirty=false;
    if (key==='schedule-events') data=data.map((r)=>({offWeek:false,tbd:false,specialTag:'',round:'',...r}));
    render();
    status(`${registry.drafts[key]?'Private saved draft':registry.published[key]?'Published content':'Bundled baseline'} · Revision ${registry.revision}. ${key==='roster-profiles'?'Keep slugs consistent across roster cards, program entries, and profile pages.':''}`);
  }
  async function openModule(name) {
    if (busy) return;
    if (dirty && !confirm('Leave unsaved changes in this section?')) return;
    $('[data-content-editor]').hidden=false;
    $('[data-content-title]').textContent=modules[name].title;
    try {
      if (!loaded) await load();
      $('[data-content-dataset]').innerHTML=modules[name].sections.map(([id,title])=>`<option value="${id}">${esc(title)}</option>`).join('');
      chooseDataset(modules[name].sections[0][0]);
      $('[data-content-editor]').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
    } catch(error) { status(error.message); }
  }
  document.querySelectorAll('[data-content-module]').forEach((button)=>button.addEventListener('click',()=>openModule(button.dataset.contentModule)));
  $('[data-content-dataset]').addEventListener('change',(event)=>{ if(dirty&&!confirm('Leave unsaved section changes?')) {event.target.value=key;return;} chooseDataset(event.target.value); });
  $('[data-content-search]').addEventListener('input',renderList);
  $('[data-content-list]').addEventListener('click',(event)=>{const button=event.target.closest('[data-entry]');if(button){commit();index=Number(button.dataset.entry);render();}});
  $('[data-content-form]').addEventListener('input',()=>{dirty=true;});
  $('[data-content-fields]').addEventListener('click',(event)=>{
    const button=event.target.closest('[data-array-add],[data-array-remove]');if(!button)return;
    commit();
    if(button.dataset.arrayAdd){const path=JSON.parse(button.dataset.arrayAdd),arr=valueAt(current(),path);const template=arr[0]||arrayTemplate(path.at(-1))||{};arr.push(blank(template));}
    else {const path=JSON.parse(button.dataset.arrayRemove);valueAt(current(),path.slice(0,-1)).splice(Number(path.at(-1)),1);}
    dirty=true;render();
  });
  $('[data-content-add]').addEventListener('click',()=>{if(!Array.isArray(data))return;commit();data.push(blank(seeds[key][0]));index=data.length-1;dirty=true;render();});
  $('[data-content-remove]').addEventListener('click',()=>{if(!Array.isArray(data)||!confirm('Remove this entry from the section draft? It stays public until you publish.'))return;commit();data.splice(index,1);index=Math.max(0,index-1);dirty=true;render();});
  async function action(name) {
    if(!loaded||!key)throw new Error('Open an editor first.');
    if(busy)throw new Error('A save is already in progress.');
    busy=true;
    $('[data-content-editor]').inert=true;
    try {
      const response=await api(name,{dataset:key,...(name==='saveDraft'?{data}: {})});
      registry=response.registry;dirty=false;
      status(response.publication?.message||(name==='saveDraft'?'Section draft saved. Nothing public changed.':'Section updated.'));
    } finally { busy=false; $('[data-content-editor]').inert=false; }
  }
  $('[data-content-form]').addEventListener('submit',async(event)=>{event.preventDefault();commit();try{await action('saveDraft');}catch(error){status(error.message);}});
  $('[data-content-publish]').addEventListener('click',async()=>{
    if(dirty)return status('Save your current section draft before publishing.');
    if(!registry.drafts[key])return status('Save a section draft first.');
    if(!confirm('Publish the saved section draft and rebuild the public site?'))return;
    try{await action('publish');}catch(error){status(error.message);}
  });
  $('[data-content-discard]').addEventListener('click',async()=>{if(!confirm('Discard this saved section draft and return to published content?'))return;try{await action('discardDraft');chooseDataset(key);status('Draft discarded. Published content is unchanged.');}catch(error){status(error.message);}});
  $('[data-content-refresh]').addEventListener('click',async()=>{if(dirty&&!confirm('Replace unsaved changes with saved data?'))return;try{await load();chooseDataset(key);}catch(error){status(error.message);}});
  $('[data-content-rebuild]').addEventListener('click',async()=>{try{const result=await api('rebuild');status(result.publication.message);}catch(error){status(error.message);}});
  $('[data-content-export]').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(registry,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aetherwing-site-content-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  window.addEventListener('beforeunload',(event)=>{if(dirty){event.preventDefault();event.returnValue='';}});
  window.netlifyIdentity?.on('logout',()=>{loaded=false;data=null;key='';dirty=false;seeds={};registry={revision:0,published:{},drafts:{},history:[]};$('[data-content-editor]').hidden=true;$('[data-content-fields]').replaceChildren();});
})();

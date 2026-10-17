import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

const root=new URL('../',import.meta.url);
const {seeds}=createRequire(import.meta.url)('../netlify/lib/_content.cjs');
const html=fs.readFileSync(new URL('public/admin/index.html',root),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`public/admin/${name}`,root),'utf8'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
const waitFor=async(predicate,label)=>{
  for(let attempt=0;attempt<100;attempt++){if(predicate())return;await tick();}
  assert.fail(label);
};
async function editor(url='http://localhost/admin/',stored=null,historyState=null){
  const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={};
  let user=null;
  w.structuredClone=structuredClone;w.confirm=()=>true;w.scrollTo=()=>{};
  w.HTMLElement.prototype.scrollIntoView=()=>{};
  w.matchMedia=()=>({matches:true,addEventListener:()=>{}});
  if(stored)w.localStorage.setItem('aetherwing-site-admin',JSON.stringify(stored));
  if(historyState)w.history.replaceState(historyState,'');
  const seed=seeds();
  w.fetch=async(input)=>{
    const path=new URL(String(input),url).pathname;
    if(path==='/data/site-admin-seed.json')return Response.json(seed);
    if(path==='/.netlify/functions/site-admin')return Response.json({registry:{revision:0,published:{},drafts:{},history:[]},seeds:seed,publishConfigured:false});
    if(path==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});
    assert.ok(path.startsWith('/data/'),'No external services may be called');
    return new Response(fs.readFileSync(new URL(`public${path}`,root),'utf8'));
  };
  if(!url.startsWith('http://localhost'))w.netlifyIdentity={on:(name,fn)=>{callbacks[name]=fn;},currentUser:()=>user,close:()=>{},open:()=>{},logout:()=>{}};
  scripts.forEach(script=>w.eval(script));
  await tick();
  const login=async()=>{
    if(w.netlifyIdentity){user={email:'fixture@example.test',app_metadata:{roles:['admin']},jwt:async()=>'fixture'};callbacks.login(user);}
    else $('[data-login]').click();
    await tick();
  };
  return {w,$,login,close:()=>w.close()};
}
const field=(w,path)=>[...w.document.querySelectorAll('[data-field-path]')].find(el=>el.dataset.fieldPath===JSON.stringify(path));
const change=(w,element,value)=>{element.value=value;element.dispatchEvent(new w.Event('input',{bubbles:true}));};

// A link loaded before authentication must be restored after sign-in, including
// recovery hashes. All sections expose actual hrefs for bookmarks/new tabs.
for(const url of ['http://localhost/admin/?section=drivers','https://aetherwing.net/admin/?section=drivers#recovery_token=fixture']){
  const e=await editor(url);try{
    assert.equal(e.$('[data-workspace]').hidden,true);
    await e.login();await waitFor(()=>!e.$('[data-content-editor]').hidden,'Assignments deep link must open after sign-in');
    assert.equal(e.$('[data-content-dataset]').value,'drivers');
    assert.equal(e.$('[data-admin-dataset="drivers"]').getAttribute('aria-current'),'page');
    if(url.includes('#'))assert.equal(e.w.location.hash,'#recovery_token=fixture');
    for(const link of e.w.document.querySelectorAll('[data-admin-tabs] a')){
      const section=link.dataset.adminDataset||(link.dataset.adminPaintTab?`paint-${link.dataset.adminPaintTab}`:link.dataset.adminTab);
      assert.equal(new URL(link.href).searchParams.get('section'),section==='overview'?null:section);
    }
    const original=e.w.location.href;
    const modified=new e.w.MouseEvent('click',{bubbles:true,cancelable:true,ctrlKey:true});
    e.$('[data-admin-dataset="wins"]').dispatchEvent(modified);
    assert.equal(modified.defaultPrevented,false,'Modified clicks must retain browser new-tab behavior');
    assert.equal(e.w.location.href,original);
  }finally{e.close();}
}

const e=await editor('http://localhost/admin/?section=standings');
try{
  await e.login();await waitFor(()=>e.$('[data-content-dataset]').value==='standings','Initial Standings link');
  e.$('[data-admin-dataset="drivers"]').click();await tick();
  e.$('[data-admin-dataset="wins"]').click();await tick();
  e.w.history.back();await waitFor(()=>e.$('[data-content-dataset]').value==='drivers','Back restores the previous editor');
  e.w.history.forward();await waitFor(()=>e.$('[data-content-dataset]').value==='wins','Forward restores the next editor');
  change(e.w,field(e.w,['track']),'UNSAVED FIXTURE');
  let prompts=0;e.w.confirm=()=>{prompts++;return false;};
  e.$('[data-admin-dataset="drivers"]').click();await tick();
  assert.equal(new URL(e.w.location).searchParams.get('section'),'wins','Cancelled link keeps the current URL');
  e.w.history.back();await tick();await tick();
  assert.equal(new URL(e.w.location).searchParams.get('section'),'wins','Cancelled Back restores the current history entry');
  assert.equal(field(e.w,['track']).value,'UNSAVED FIXTURE');
  e.$('[data-admin-dataset="wins"]').click();await tick();
  assert.equal(field(e.w,['track']).value,'UNSAVED FIXTURE','Reselecting current section must preserve edits');
  assert.equal(prompts,2,'Cancelled link and Back must both retain the unsaved guard');
  e.w.confirm=()=>true;e.w.history.back();await waitFor(()=>e.$('[data-content-dataset]').value==='drivers','Accepted Back opens the requested editor');
  for(const section of ['feature','add','library','3d']){
    e.$(`[data-admin-paint-tab="${section}"]`).click();await tick();
    assert.equal(e.$(`[data-panel="${section}"]`).hidden,false);
    assert.equal(new URL(e.w.location).searchParams.get('section'),`paint-${section}`);
  }
  e.$('[data-admin-paint-tab="library"]').click();await tick();
  e.$('[data-edit-paint]').click();await tick();
  assert.equal(new URL(e.w.location).searchParams.get('section'),'paint-add','Library edit action updates the section link');
  e.$('[data-admin-tab="theme-preview"]').click();await tick();
  assert.equal(e.$('[data-admin-theme-preview]').hidden,false);
  assert.equal(new URL(e.w.location).searchParams.get('section'),'theme-preview');
  e.$('[data-admin-tab="overview"]').click();await tick();
  assert.equal(e.w.location.search,'');
  assert.equal(e.$('[data-admin-overview]').hidden,false);
}finally{e.close();}
for(const section of ['paint-feature','paint-add','paint-library','paint-3d','theme-preview','not-a-section']){
  const reloaded=await editor(`http://localhost/admin/?section=${section}`,null,{adminIndex:8});try{
    await reloaded.login();
    assert.equal(reloaded.w.history.state.adminIndex,8,'Reload must preserve the history position used by unsaved Back/Forward guards');
    assert.equal(reloaded.$(section.startsWith('paint-')?`[data-panel="${section.slice(6)}"]`:section==='theme-preview'?'[data-admin-theme-preview]':'[data-admin-overview]').hidden,false,`${section} restores on reload`);
    if(section==='not-a-section')assert.equal(reloaded.w.location.search,'','Invalid sections normalize to Overview');
  }finally{reloaded.close();}
}

// Keep legacy backup fixtures to reproduce the URL-overridden-by-upload bug.
const legacy='data:image/png;base64,bGVnYWN5';
const drivers=seeds().drivers.map(row=>({...row,numberImage:'https://example.test/old.png',numberImageBackup:legacy}));
const art=await editor('http://localhost/admin/?section=drivers',{revision:0,published:{drivers},drafts:{},history:[]});
try{
  const {w,$}=art;await art.login();await waitFor(()=>$('[data-number-image-url]'),'Artwork editor loads');
  assert.equal($('[data-number-image-source]').textContent,'Current source: uploaded file');
  change(w,$('[data-number-image-url]'),'https://example.test/new.png');
  assert.equal($('[data-number-image-source]').textContent,'Current source: uploaded file','Pasting alone must not change the active image');
  $('[data-number-image-use-url]').click();
  assert.equal($('[data-number-image-source]').textContent,'Current source: image link');
  assert.equal($('img.driver-number-preview').getAttribute('src'),'https://example.test/new.png');
  const save=async()=>{
    $('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await tick();
    return JSON.parse(w.localStorage.getItem('aetherwing-site-admin')).drafts.drivers;
  };
  let saved=await save();assert.equal(saved[0].numberImage,'https://example.test/new.png');assert.equal(saved[0].numberImageBackup,'','URL replacement must clear the legacy overriding upload');
  for(const invalid of ['','javascript:alert(1)','data:image/png;base64,AAAA','http://example.test/art.png','//example.test/art.png','https://user:pass@example.test/art.png']){
    change(w,$('[data-number-image-url]'),invalid);$('[data-number-image-use-url]').click();
    assert.match($('[data-number-image-feedback]').textContent,/Enter a direct HTTPS/);
    assert.equal($('img.driver-number-preview').getAttribute('src'),'https://example.test/new.png');
  }
  change(w,$('[data-number-image-url]'),' HTTPS://EXAMPLE.TEST/new.png ');$('[data-number-image-use-url]').click();
  assert.equal($('img.driver-number-preview').getAttribute('src'),'https://example.test/new.png','Normalize pasted HTTPS URLs to the server-supported form');
  const uploaded='data:image/webp;base64,dXBsb2Fk';
  // Stub only browser image decoding/canvas; run the actual upload handler,
  // optimization pipeline, editor, and storage with a file selection event.
  w.URL.createObjectURL=()=> 'blob:fixture';w.URL.revokeObjectURL=()=>{};
  w.Image=class{naturalWidth=2;naturalHeight=2;set src(value){queueMicrotask(()=>this.onload());}};
  w.HTMLCanvasElement.prototype.getContext=()=>({drawImage:()=>{},getImageData:()=>({data:new Uint8ClampedArray(16).fill(255)})});
  w.HTMLCanvasElement.prototype.toDataURL=()=>uploaded;
  const upload=async(type='image/png')=>{
    Object.defineProperty($('[data-number-image-upload]'),'files',{configurable:true,value:[new w.File(['fixture'],'number.png',{type})]});
    $('[data-number-image-upload]').dispatchEvent(new w.Event('change',{bubbles:true}));await tick();
  };
  await upload();saved=await save();
  assert.equal(saved[0].numberImage,uploaded);assert.equal(saved[0].numberImageBackup,'','New uploads must store a single optimized copy');
  assert.equal($('[data-number-image-source]').textContent,'Current source: uploaded file');
  await upload('text/plain');assert.match($('[data-number-image-feedback]').textContent,/Choose a PNG/);
  assert.equal($('img.driver-number-preview').getAttribute('src'),uploaded,'Rejected file must preserve the selected art');
  $('[data-number-image-remove]').click();saved=await save();
  assert.equal(saved[0].numberImage,'');assert.equal(saved[0].numberImageBackup,'');
  assert.equal($('img.driver-number-preview'),null);
  const sharedIndex=saved.findIndex(row=>row.competitionId==='kmart'&&String(row.number)==='29');
  assert.ok(sharedIndex>=0);$(`[data-entry="${sharedIndex}"]`).click();
  change(w,$('[data-number-image-url]'),'https://example.test/shared29.png');$('[data-number-image-use-url]').click();
  saved=await save();const shared=saved.filter(row=>row.competitionId==='kmart'&&String(row.number)==='29');
  assert.equal(shared.length,3);assert.ok(shared.every(row=>row.numberImage==='https://example.test/shared29.png'&&row.numberImageBackup===''));
  await upload();saved=await save();assert.ok(saved.filter(row=>row.competitionId==='kmart'&&String(row.number)==='29').every(row=>row.numberImage===uploaded&&!row.numberImageBackup));
  $('[data-number-image-remove]').click();saved=await save();assert.ok(saved.filter(row=>row.competitionId==='kmart'&&String(row.number)==='29').every(row=>!row.numberImage&&!row.numberImageBackup));
}finally{art.close();}
// Public roster hydration must honor explicit replacement/removal instead of
// resurrecting cached legacy artwork after the Admin publication succeeds.
const lineupSource=fs.readFileSync(new URL('src/components/DriverLineup.astro',root),'utf8').match(/<script define:vars[^>]*>([\s\S]*?)<\/script>/)[1];
const publicPage=new JSDOM('<section data-lineup><div data-lineup-filters></div><div data-lineup-program></div><div data-lineup-grid></div></section>',{url:'https://aetherwing.net/drivers/',runScripts:'outside-only'});
try{
  const w=publicPage.window,entry=drivers[0],profiles=seeds()['roster-profiles'];
  w.matchMedia=()=>({matches:false});w.fetch=()=>new Promise(()=>{});
  w.eval(`const entries=${JSON.stringify([entry])},people=${JSON.stringify(profiles)},boards=[],profileSlugs=${JSON.stringify(profiles.map(p=>p.slug))};\n${lineupSource}`);
  const publishArtwork=(numberImage,numberImageBackup)=>w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{drivers:[{...entry,numberImage,numberImageBackup}]}}));
  const image=()=>w.document.querySelector('.aw-lineup__number img');
  publishArtwork(entry.numberImage,legacy);assert.equal(image().getAttribute('src'),legacy);
  publishArtwork('https://example.test/replacement.png','');assert.equal(image().getAttribute('src'),'https://example.test/replacement.png','Published URL must replace the cached upload on the public roster');
  w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{drivers:[{id:entry.id,profile:entry.profile,competitionId:entry.competitionId,number:entry.number}]}}));
  assert.equal(image().getAttribute('src'),'https://example.test/replacement.png','Partial payloads must preserve the current published artwork');
  publishArtwork('','');assert.equal(image(),null,'Explicit removal must clear cached public artwork');
}finally{publicPage.window.close();}
console.log('PASS: Admin section links, sign-in/reload/history restoration, unsaved guards, and explicit file/URL number-art replacement, removal, validation, and shared assignment persistence. No live content changed.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

// Real Admin UI + authenticated handler with isolated, in-memory persistence.
// No Identity, storage, CDN, deployment hook or production endpoint is contacted.
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url);
const content=require('../netlify/lib/_content.cjs'),seed=content.seeds();
const siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const clone=structuredClone,tick=()=>new Promise(resolve=>setTimeout(resolve,10));
const html=fs.readFileSync(new URL('public/admin/index.html',root),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`public/admin/${name}`,root),'utf8'));
const metadataKeys=['manufacturer','chaseLocked','regularSeasonChampion'];
const metadata=row=>Object.fromEntries(metadataKeys.filter(key=>Object.hasOwn(row,key)).map(key=>[key,row[key]]));
const row=(driver,number,points)=>({position:'P1',driver,number:String(number),points,delta:'LEADER',positionChange:0,chaseEligible:true,highlight:false});
function fixtures(){
 const published=clone(seed),nrrs=clone(seed.standings.find(board=>board.id==='nrrs'));
 Object.assign(nrrs,{title:'Metadata Fixture nrrs',status:'REGULAR SEASON',subtitle:'Regular-season metadata fixture',chaseActive:false,autoPoints:false,cutoffAfter:5,rows:[row('Hailey','32',500),row('Will','94',490),row('Original Driver','88',480)],chaseRows:[row('Wispy','32',2100),row('Will','94',2090)]});
 nrrs.rows[0].chaseEligible=false;nrrs.chaseRows[0].chaseEligible=false;
 const generic=(id,league=id)=>({...clone(nrrs),id,league,title:`Metadata Fixture ${id}`,rows:[row('Fixture Alpha','88',100),row('Fixture Beta','89',90)],chaseRows:[]});
 const kmart=generic('kmart');kmart.ptEntry={number:'29',label:'Shared entry fixture',drivers:[{driver:'Clutch',points:20},{driver:'Eazy',points:10}]};
 kmart.rows[0].regularSeasonChampion=true;
 const sunoco=clone(seed.standings.find(board=>board.id==='sunoco'));
 const hailey=sunoco.rows.find(entry=>entry.driver==='Hailey'||entry.driver==='Wispy');assert.ok(hailey,'Sunoco fixture needs the existing Hailey regular row');
 Object.assign(hailey,{manufacturer:'RAM',chaseLocked:false,regularSeasonChampion:false});
 const will=sunoco.rows.find(entry=>entry.driver==='Will');assert.ok(will);
 sunoco.chaseRows=[{...clone(hailey),manufacturer:'Ford',chaseLocked:true,regularSeasonChampion:true,points:120},{...clone(will),points:110}];
 Object.assign(sunoco,{title:'Metadata Fixture sunoco',chaseActive:true,autoPoints:false});
 published.standings=[nrrs,generic('uarl'),generic('uarl-d1'),kmart,sunoco];
 // The explicit make chosen in the UI must win over both this newer Ford
 // result and the legacy number map (#32 Toyota).
 const template=clone(seed.results.find(race=>race.league==='nrrs'));
 published.results=[{...template,scheduleId:'metadata-fixture-result',date:'2099-01-02',title:'Metadata fixture result',pointsSource:'manual',entries:[{...template.entries[0],assignmentId:'wispy-nrrs',driver:'Hailey',number:'32',manufacturer:'Ford',racePoints:17}]}];
 delete published.results[0].standingsMode;
 return published;
}
function backend(customize=()=>{}){
 const initial=fixtures();customize(initial);let stored={version:1,revision:5,published:clone(initial),drafts:{},history:[]};
 const actions=[],module={exports:{}};
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('netlify/lib/_site-admin.cjs',root),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'metadata-etag'}),write:async(next,etag)=>{assert.equal(etag,'metadata-etag');stored=clone(next);}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Metadata tests must never contact a live service or deploy'));
 return {initial,actions,get stored(){return clone(stored);},async request(method,body){if(body)actions.push(JSON.parse(body));const response=await module.exports.handler({httpMethod:method,body},{clientContext:{user:{email:'standings-fixture@example.test',app_metadata:{roles:['admin']}}}});return new Response(response.body,{status:response.statusCode,headers:response.headers});}};
}
async function editor(server){
 const dom=new JSDOM(html,{url:'https://aetherwing.net/admin/?section=standings',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={},errors=[],draws=[];let actor=null;
 Object.assign(w,{structuredClone,AbortSignal,AbortController,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener(){}});w.confirm=()=>true;w.addEventListener('error',event=>errors.push(event.message));
 w.netlifyIdentity={currentUser:()=>actor,on:(event,fn)=>{(callbacks[event]??=[]).push(fn);},close(){},open(){},logout(){}};
 w.fetch=async(input,options={})=>{const url=new URL(String(input),w.location.href);assert.equal(url.origin,w.location.origin,'Every UI request stays inside the isolated mock');if(url.pathname==='/.netlify/functions/site-admin')return server.request(options.method||'GET',options.body);if(url.pathname==='/api/site-content')return Response.json({revision:server.stored.revision,datasets:require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(server.stored.published)});if(url.pathname==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});assert.ok(url.pathname.startsWith('/data/'),`Unexpected fixture request: ${url.pathname}`);return new Response(fs.readFileSync(new URL(`public${url.pathname}`,root),'utf8'));};
 // Inspect the actual PNG drawing path without adding a native Canvas package.
 // Raster/export controls are covered by separate browser checks.
 class FixtureImage{constructor(){this.naturalWidth=240;this.naturalHeight=100;this.width=240;this.height=100;}set src(value){this._src=String(value);queueMicrotask(()=>this.onload?.());}get src(){return this._src;}}
 w.Image=FixtureImage;let objectUrl=0;w.URL.createObjectURL=()=>`blob:metadata-fixture-${++objectUrl}`;w.URL.revokeObjectURL=()=>{};
 const gradient=()=>({addColorStop(){}});
 w.HTMLCanvasElement.prototype.getContext=function(){const state={canvas:this,measureText:text=>({width:String(text).length*9}),createLinearGradient:gradient,createRadialGradient:gradient,fillText:(text,...args)=>draws.push({kind:'text',text:String(text),args}),drawImage:(image,...args)=>draws.push({kind:'image',src:image.src,args})};return new Proxy(state,{get(target,name){return name in target?target[name]:(target[name]=()=>{});}});};
 w.HTMLCanvasElement.prototype.toBlob=function(fn,type){fn(new w.Blob(['isolated-canvas-fixture'],{type}));};
 scripts.forEach(script=>w.eval(script));await tick();actor={email:'standings-fixture@example.test',app_metadata:{roles:['admin']},jwt:async()=>'metadata-fixture-token'};(callbacks.login||[]).forEach(fn=>fn(actor));
 const wait=async(predicate,message)=>{for(let i=0;i<350;i++){if(predicate())return;await tick();}assert.fail(`${message}: ${$('[data-content-status]')?.textContent} | ${$('[data-content-save-feedback]')?.textContent}`);};
 await wait(()=>!$('[data-content-editor]').hidden&&$('[data-content-dataset]').value==='standings','Authenticated Standings editor');
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(el=>el.dataset.fieldPath===JSON.stringify(path));
 const set=(path,value)=>{const control=field(path);assert.ok(control,`Missing editable field ${JSON.stringify(path)}`);if(control.type==='checkbox')control.checked=Boolean(value);else control.value=String(value);control.dispatchEvent(new w.Event('input',{bubbles:true}));control.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const choose=id=>{const button=[...w.document.querySelectorAll('[data-entry]')].find(button=>button.textContent.includes(`Metadata Fixture ${id}`));assert.ok(button,`${id} board is present`);button.click();};
 const rows=list=>{
  const controls=[...w.document.querySelectorAll('[data-field-path]')].map(el=>({el,path:JSON.parse(el.dataset.fieldPath)}));
  const names=controls.filter(({path})=>path.length===3&&path[0]===list&&path[2]==='driver').map(({el,path})=>({index:path[1],driver:el.value}));
  if(names.length)return names;
  // Sunoco imports own Chase names/points; its details editor exposes metadata
  // with the imported driver in each visible summary, rather than editable names.
  return controls.filter(({path})=>path.length===3&&path[0]===list&&path[2]==='manufacturer').map(({el,path})=>({index:path[1],driver:el.closest('details')?.querySelector('summary span')?.textContent.split(' · #')[0]||''}));
 };
 const indexOf=(list,driver)=>{const aliases=name=>String(name).toLowerCase().replace(/[^a-z0-9]/g,'').replace(/^(wispy|aokikoto|haileybell)$/,'hailey');const match=rows(list).find(row=>aliases(row.driver)===aliases(driver));assert.ok(match,`${driver} exists in ${list}: ${JSON.stringify(rows(list))}; board=${field(['id'])?.value}`);return match.index;};
 const read=(list,driver)=>{const index=indexOf(list,driver);return {driver:field([list,index,'driver'])?.value??rows(list).find(row=>row.index===index)?.driver,points:field([list,index,'points'])?Number(field([list,index,'points']).value):undefined,manufacturer:field([list,index,'manufacturer'])?.value,chaseLocked:field([list,index,'chaseLocked'])?.checked,regularSeasonChampion:field([list,index,'regularSeasonChampion'])?.checked};};
 const save=async()=>{$('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!$('[data-content-editor]').inert&&/^PRIVATE DRAFT SAVED/.test($('[data-content-save-feedback]').textContent),'Private standings draft saved');};
 const publish=async()=>{$('[data-content-publish]').click();await wait(()=>!$('[data-content-editor]').inert&&/^PUBLISHED ·/.test($('[data-content-save-feedback]').textContent),'Standings publication verified');};
 const importRows=(csv,chase=false)=>{const prefix=chase?'data-sunoco-chase-import':'data-standings-import';$(`[${prefix}-text]`).value=csv;$(`[${prefix}-preview-button]`).click();assert.match($(`[${prefix}-preview]`).textContent,/ROWS READY/);$(`[${prefix}-apply]`).click();};
 const png=async()=>{const previous=$('[data-standings-export-preview] img')?.getAttribute('src');draws.length=0;$('[data-standings-export]').click();await wait(()=>!$('[data-standings-export]').disabled&&!!$('[data-standings-export-preview] img')&&$('[data-standings-export-preview] img').getAttribute('src')!==previous,'A fresh PNG drawing completed');return clone(draws);};
 return {w,$,field,set,choose,rows,indexOf,read,save,publish,importRows,png,wait,errors,close:()=>w.close()};
}
const optionsByBoard={nrrs:['Ford','Chevrolet','Toyota','Cadillac'],uarl:['Ford','Chevrolet','Toyota','Cadillac'],'uarl-d1':['Ford','Chevrolet','Toyota','Cadillac'],kmart:['Ford','Chevrolet','Toyota','Dodge'],sunoco:['Ford','Chevrolet','Toyota','RAM']};
const assertOptions=(select,expected)=>{assert.ok(select,'Manufacturer is an editable select');assert.equal(select.tagName,'SELECT');assert.equal(select.options[0].value,'','Legacy rows retain an Auto/Not set option');assert.match(select.options[0].textContent,/auto|not set/i);assert.deepEqual([...select.options].filter(option=>option.value).map(option=>option.value).sort(),[...expected].sort());assert.equal([...select.options].find(option=>option.value==='Chevrolet').textContent.trim(),'Chevy','Chevy is the displayed label, Chevrolet is stored');};
const unhandled=[],onUnhandled=error=>unhandled.push(error?.message||String(error));process.on('unhandledRejection',onUnhandled);
try{
 // Legacy missing fields get controls in every supported view, without any
 // lock/champion inferred from points, cutoff positions or Chase membership.
 {
  const server=backend(),e=await editor(server);try{
   for(const [id,choices] of Object.entries(optionsByBoard)){
    e.choose(id);assertOptions(e.field(['rows',0,'manufacturer']),choices);
    assert.ok(e.field(['rows',0,'manufacturer']).hasAttribute('data-standing-manufacturer'));
    assert.ok(e.field(['rows',0,'chaseLocked']).hasAttribute('data-standing-chase-locked'));
    assert.ok(e.field(['rows',0,'regularSeasonChampion']).hasAttribute('data-standing-season-champion'));
    if(id!=='kmart')assert.equal(e.field(['rows',0,'regularSeasonChampion']).checked,false,'Leading a board does not automatically make a regular-season champion');
    if(id==='nrrs'){assertOptions(e.field(['chaseRows',0,'manufacturer']),choices);assert.equal(e.field(['rows',0,'chaseLocked']).checked,false);assert.equal(e.field(['chaseRows',0,'chaseLocked']).checked,false);}
    if(id==='kmart'){assertOptions(e.field(['ptEntry','drivers',0,'manufacturer']),choices);e.set(['ptEntry','drivers',0,'manufacturer'],'Chevrolet');}
   }
   e.choose('kmart');assert.equal(e.field(['ptEntry','drivers',0,'manufacturer']).value,'Chevrolet');await e.save();assert.equal(server.stored.drafts.standings.find(board=>board.id==='kmart').ptEntry.drivers[0].manufacturer,'Chevrolet');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Shared-car/PT metadata belongs to that entry even when the same named
 // driver also appears in the regular and Chase standings with another make.
 {
  const server=backend(published=>{const board=published.standings.find(board=>board.id==='kmart');board.rows[0].manufacturer='Ford';board.chaseRows=[{...clone(board.rows[0]),manufacturer:'Ford'}];board.ptEntry.drivers=[{driver:board.rows[0].driver,points:20,manufacturer:'Dodge'}];}),e=await editor(server);try{
   e.choose('kmart');assert.equal(e.read('rows','Fixture Alpha').manufacturer,'Ford');assert.equal(e.read('chaseRows','Fixture Alpha').manufacturer,'Ford');assert.equal(e.field(['ptEntry','drivers',0,'manufacturer']).value,'Dodge');
   assert.equal(e.field(['ptEntry','drivers',0,'chaseLocked']),undefined,'PT entries do not expose Chase-lock controls');assert.equal(e.field(['ptEntry','drivers',0,'regularSeasonChampion']),undefined,'PT entries do not expose regular-season champion controls');
   e.set(['ptEntry','drivers',0,'manufacturer'],'Toyota');assert.equal(e.read('rows','Fixture Alpha').manufacturer,'Ford','Changing a shared-car make does not change the same driver’s regular-car make');assert.equal(e.read('chaseRows','Fixture Alpha').manufacturer,'Ford','Changing a shared-car make does not change the same driver’s Chase-car make');
   const drawing=await e.png(),icons=drawing.filter(call=>call.kind==='image').map(call=>call.src);assert.ok(icons.some(src=>src.endsWith('/toyota.png')),'PNG PT card shows its own Toyota make');assert.ok(icons.some(src=>src.endsWith('/ford.png')),'PNG regular/Chase driver retains Ford');assert.ok(!icons.some(src=>src.endsWith('/dodge-kmart.png')),'PT make overrides its #29 legacy Dodge inference');
   await e.publish();const published=server.stored.published.standings,board=published.find(board=>board.id==='kmart');assert.equal(board.rows[0].manufacturer,'Ford');assert.equal(board.chaseRows[0].manufacturer,'Ford');assert.equal(board.ptEntry.drivers[0].manufacturer,'Toyota','PT make persists independently through publication');
   const source=fs.readFileSync(new URL('src/pages/championships/index.astro',root),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];assert.ok(source,'Public Championships has its live renderer');
   for(const preloaded of [false,true]){
    const page=new JSDOM('<div data-standings-root></div>',{runScripts:'outside-only'}),datasets={standings:published,results:server.stored.published.results};try{
     if(preloaded)page.window.__AETHERWING_CONTENT__=datasets;page.window.eval(source);if(!preloaded)page.window.dispatchEvent(new page.window.CustomEvent('aetherwing:content',{detail:datasets}));
     const rendered=page.window.document.querySelector('[data-board="kmart"]');assert.ok(rendered);assert.equal(rendered.querySelector('.standings-pt__driver img')?.getAttribute('alt'),'Toyota','Public PT card uses its own make instead of the same named regular driver');assert.equal(rendered.querySelector('.standings-board__rows img')?.getAttribute('alt'),'Ford','Public regular row retains its separate Ford make');
    }finally{page.window.close();}
   }
   assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Same-driver aliases synchronize across regular/Chase rows. Champion
 // selection is exclusive within one board, never across different leagues.
 {
  const server=backend();let e=await editor(server);try{
   e.choose('nrrs');let hailey=e.indexOf('rows','Hailey');e.set(['rows',hailey,'manufacturer'],'Cadillac');e.set(['rows',hailey,'chaseLocked'],true);e.set(['rows',hailey,'regularSeasonChampion'],true);
   assert.equal(e.read('chaseRows','Wispy').manufacturer,'Cadillac');assert.equal(e.read('chaseRows','Wispy').chaseLocked,true);assert.equal(e.read('chaseRows','Wispy').regularSeasonChampion,true);
   const will=e.indexOf('chaseRows','Will');e.set(['chaseRows',will,'regularSeasonChampion'],true);
   assert.equal(e.read('rows','Will').regularSeasonChampion,true);assert.equal(e.read('rows','Hailey').regularSeasonChampion,false);assert.equal(e.read('chaseRows','Wispy').regularSeasonChampion,false);
   e.set(['rows',e.indexOf('rows','Hailey'),'regularSeasonChampion'],true);
   await e.save();const draft=server.stored.drafts.standings;assert.equal(draft.find(board=>board.id==='kmart').rows[0].regularSeasonChampion,true,'Another league keeps its chosen champion');assert.deepEqual(server.stored.published.standings,server.initial.standings,'Private metadata draft is not public');
   await e.publish();const published=server.stored.published.standings.find(board=>board.id==='nrrs');assert.deepEqual(metadata(published.rows.find(row=>row.driver==='Hailey')),{manufacturer:'Cadillac',chaseLocked:true,regularSeasonChampion:true});assert.equal(published.chaseActive,false);assert.equal(published.rows.find(row=>row.driver==='Hailey').chaseEligible,false,'A manual lock badge does not change qualification eligibility');assert.equal(published.rows.find(row=>row.driver==='Hailey').points,500,'Manual metadata does not alter championship points');
   e.close();e=await editor(server);e.choose('nrrs');assert.equal(e.read('rows','Hailey').manufacturer,'Cadillac');assert.equal(e.read('chaseRows','Wispy').chaseLocked,true);assert.equal(e.read('rows','Hailey').regularSeasonChampion,true);
   e.set(['chaseRows',e.indexOf('chaseRows','Wispy'),'chaseLocked'],false);assert.equal(e.read('rows','Hailey').chaseLocked,false,'Unchecking in Chase view clears the matching regular-row flag');
   await e.publish();assert.equal(server.stored.published.standings.find(board=>board.id==='nrrs').rows.find(row=>row.driver==='Hailey').chaseLocked,false);assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Chase-only metadata is inherited when the regular row has no property;
 // explicit regular false/blank below is a deliberate override, not absence.
 {
  const server=backend(published=>{const board=published.standings.find(board=>board.id==='nrrs');Object.assign(board.chaseRows[0],{manufacturer:'Toyota',chaseLocked:true,regularSeasonChampion:true});}),e=await editor(server);try{
   e.choose('nrrs');assert.deepEqual(metadata(e.read('rows','Hailey')),{manufacturer:'Toyota',chaseLocked:true,regularSeasonChampion:true},'Absent regular fields inherit the canonical driver’s saved Chase metadata');
   await e.save();const board=server.stored.drafts.standings.find(board=>board.id==='nrrs');assert.deepEqual(metadata(board.rows.find(row=>row.driver==='Hailey')),{manufacturer:'Toyota',chaseLocked:true,regularSeasonChampion:true});assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // CSV preserves explicit metadata only for the same canonical driver. A
 // replacement sharing a number does not inherit a departing driver's status.
 {
  const server=backend(published=>{const board=published.standings.find(board=>board.id==='nrrs');board.chaseRows.push({...clone(board.rows[2]),manufacturer:'Ford',chaseLocked:true,regularSeasonChampion:false});}),e=await editor(server);try{
   e.choose('nrrs');e.set(['rows',e.indexOf('rows','Hailey'),'manufacturer'],'Cadillac');e.set(['rows',e.indexOf('rows','Hailey'),'chaseLocked'],true);e.set(['rows',e.indexOf('rows','Hailey'),'regularSeasonChampion'],true);
   e.set(['rows',e.indexOf('rows','Original Driver'),'manufacturer'],'Ford');e.set(['rows',e.indexOf('rows','Original Driver'),'chaseLocked'],true);
   e.importRows('Position,Number,Driver,Points,Gap\n1,32,Wispy,601,LEADER\n2,94,Will,600,-1\n3,88,Replacement Driver,599,-2');
   assert.equal(e.read('rows','Hailey').manufacturer,'Cadillac');assert.equal(e.read('rows','Hailey').chaseLocked,true);assert.equal(e.read('rows','Hailey').regularSeasonChampion,true);assert.equal(e.read('rows','Hailey').points,601);
   const replacement=e.read('rows','Replacement Driver');assert.equal(replacement.manufacturer,'');assert.equal(replacement.chaseLocked,false);assert.equal(replacement.regularSeasonChampion,false,'A same-number replacement does not become the prior driver’s champion');
   for(const [alias,points] of [['Áokikoto',602],['Ｗｉｓｐｙ',603]]){
    e.importRows(`Position,Number,Driver,Points,Gap\n1,32,${alias},${points},LEADER\n2,94,Will,600,-${points-600}\n3,88,Replacement Driver,599,-${points-599}`);
    assert.equal(e.rows('rows').length,3,`${alias}: normalized aliases update the existing driver instead of creating a duplicate`);
    const imported=e.read('rows','Hailey');assert.equal(imported.driver,'Hailey',`${alias}: preserve the matched canonical driver name`);assert.equal(imported.points,points);assert.deepEqual(metadata(imported),{manufacturer:'Cadillac',chaseLocked:true,regularSeasonChampion:true},`${alias}: Unicode-normalized aliases retain Hailey’s explicit manual metadata`);
   }
   const add=[...e.w.document.querySelectorAll('[data-array-add]')].find(button=>button.dataset.arrayAdd==='["rows"]');assert.ok(add);add.click();
   const index=e.rows('rows').at(-1).index;assertOptions(e.field(['rows',index,'manufacturer']),optionsByBoard.nrrs);assert.equal(e.field(['rows',index,'chaseLocked']).checked,false);assert.equal(e.field(['rows',index,'regularSeasonChampion']).checked,false);
   e.set(['rows',index,'driver'],'Brand New Driver');e.set(['rows',index,'number'],'99');e.set(['rows',index,'points'],42);e.set(['rows',index,'manufacturer'],'Chevrolet');await e.save();assert.equal(server.stored.drafts.standings.find(board=>board.id==='nrrs').rows.find(row=>row.driver==='Brand New Driver').manufacturer,'Chevrolet');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Explicit false and blank on regular Sunoco rows beat older Chase metadata.
 {
  const server=backend(),e=await editor(server);try{
   e.choose('sunoco');e.importRows('Position,Number,Driver,Points,Gap\n1,54,Wispy,121,LEADER\n2,42,Will,111,-10',true);
   assert.equal(e.read('chaseRows','Hailey').manufacturer,'RAM');assert.equal(e.read('chaseRows','Hailey').chaseLocked,false);assert.equal(e.read('chaseRows','Hailey').regularSeasonChampion,false);
   e.set(['rows',e.indexOf('rows','Hailey'),'manufacturer'],'');e.importRows('Position,Number,Driver,Points,Gap\n1,54,Hailey,130,LEADER\n2,42,Will,119,-11',true);assert.equal(e.read('chaseRows','Hailey').manufacturer,'','Cleared regular make stays Auto instead of reviving the stale Chase make');
   e.$('[data-sunoco-chase-recalc]').click();assert.equal(e.read('chaseRows','Hailey').chaseLocked,false);assert.equal(e.read('chaseRows','Hailey').regularSeasonChampion,false);await e.publish();assert.equal(server.stored.published.standings.find(board=>board.id==='sunoco').chaseRows.find(row=>/hailey|wispy/i.test(row.driver)).chaseLocked,false);assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Recalculation/result advancement retains the manual fields. The PNG path
 // shows manual statuses outside the Chase and honors an explicit make before
 // newer results and number-map defaults. Auto keeps the original inference.
 {
  const server=backend(),e=await editor(server);try{
   e.choose('nrrs');e.set(['rows',e.indexOf('rows','Hailey'),'manufacturer'],'Cadillac');e.set(['rows',e.indexOf('rows','Hailey'),'chaseLocked'],true);e.set(['rows',e.indexOf('rows','Hailey'),'regularSeasonChampion'],true);
   const manual=e.read('rows','Hailey');e.$('[data-standings-recalc]').click();assert.deepEqual(metadata(e.read('rows','Hailey')),metadata(manual));
   e.set(['autoPoints'],true);e.$('[data-standings-apply-results]').click();assert.equal(e.read('rows','Hailey').points,517);assert.deepEqual(metadata(e.read('rows','Hailey')),metadata(manual),'Auto points preserve explicit manual status and make');
   const drawing=await e.png(),texts=drawing.filter(call=>call.kind==='text').map(call=>call.text).join(' ').toUpperCase().replace(/-/g,' ');
   assert.match(texts,/CHASE (?:SPOT )?LOCKED|LOCKED (?:INTO |INTO THE )?CHASE/);assert.match(texts,/REGULAR SEASON CHAMPION/);
   const icons=drawing.filter(call=>call.kind==='image').map(call=>call.src);assert.ok(icons.some(src=>src.endsWith('/cadillac.png')),'PNG uses the explicit Cadillac logo');assert.ok(!icons.some(src=>src.endsWith('/ford.png')),'A conflicting newer Ford result does not override the manual make');
   e.set(['rows',e.indexOf('rows','Hailey'),'manufacturer'],'');const automatic=await e.png();assert.ok(automatic.some(call=>call.kind==='image'&&call.src.endsWith('/ford.png')),'Choosing Auto restores latest-result manufacturer inference');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 assert.deepEqual(unhandled,[],'Metadata errors must remain handled inside the isolated editor');
 console.log('PASS: authenticated manufacturer/manual-status controls, league-specific Chevy/canonical values, regular/Chase alias sync, board-only champion selection, private/published/reloaded parity, safe CSV identity matching, fresh rows, Sunoco explicit-false/blank precedence, auto-points retention and PNG labels/make precedence. No live writes.');
}finally{process.off('unhandledRejection',onUnhandled);}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

// Exercise the shipped Admin controls and authenticated persistence handler.
// Everything, including the public verification request, stays in memory.
const require=createRequire(import.meta.url),root=new URL('../',import.meta.url);
const content=require('../netlify/lib/_content.cjs'),seed=content.seeds();
const siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const html=fs.readFileSync(new URL('public/admin/index.html',root),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`public/admin/${name}`,root),'utf8'));
const clone=structuredClone,tick=()=>new Promise(resolve=>setTimeout(resolve,10));
const sourcePaths=['src/data/standings.json','public/data/standings.json'].filter(path=>fs.existsSync(new URL(path,root)));
const sourceBefore=sourcePaths.map(path=>fs.readFileSync(new URL(path,root),'utf8'));
const metadata=row=>({driver:row.driver,number:row.number,points:row.points,manufacturer:row.manufacturer,chaseLocked:row.chaseLocked,regularSeasonChampion:row.regularSeasonChampion,highlight:row.highlight});
const evidence=boards=>boards.map(board=>({id:board.id,rows:board.rows.map(metadata),...(Array.isArray(board.chaseRows)?{chaseRows:board.chaseRows.map(metadata)}:{})}));

function fixtures(){
 const published=clone(seed);
 published.standings.forEach(board=>{
  board.title=`Homepage Fixture ${board.id}`;delete board.featuredOnHome;delete board.homeTable;
  for(const row of [...board.rows,...(board.chaseRows||[])])Object.assign(row,{manufacturer:'Toyota',chaseLocked:false,regularSeasonChampion:false});
 });
 // Include an empty, separately maintained Chase table: it is a valid choice,
 // and must not silently be converted into regular standings in the editor.
 published.standings.find(board=>board.id==='kmart').chaseRows=[];
 return published;
}
function backend(customize=()=>{}){
 const initial=fixtures();customize(initial);let stored={version:1,revision:7,published:clone(initial),drafts:{},history:[]};
 const actions=[],module={exports:{}};
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('netlify/lib/_site-admin.cjs',root),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'home-standings-etag'}),write:async(next,etag)=>{assert.equal(etag,'home-standings-etag');stored=clone(next);}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('No live service or deployment may be called'));
 return {initial,actions,get stored(){return clone(stored);},async request(method,body){if(body)actions.push(JSON.parse(body));const response=await module.exports.handler({httpMethod:method,body},{clientContext:{user:{email:'home-standings@example.test',app_metadata:{roles:['admin']}}}});return new Response(response.body,{status:response.statusCode,headers:response.headers});}};
}
async function editor(server){
 const dom=new JSDOM(html,{url:'https://aetherwing.net/admin/?section=standings',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={},errors=[];let actor=null;
 Object.assign(w,{structuredClone,AbortSignal,AbortController,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener(){}});w.confirm=()=>true;w.addEventListener('error',event=>errors.push(event.message));
 w.netlifyIdentity={currentUser:()=>actor,on:(event,fn)=>{(callbacks[event]??=[]).push(fn);},close(){},open(){},logout(){}};
 w.fetch=async(input,options={})=>{const url=new URL(String(input),w.location.href);assert.equal(url.origin,w.location.origin,'All requests remain isolated');if(url.pathname==='/.netlify/functions/site-admin')return server.request(options.method||'GET',options.body);if(url.pathname==='/api/site-content')return Response.json({revision:server.stored.revision,datasets:require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(server.stored.published)});if(url.pathname==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});assert.ok(url.pathname.startsWith('/data/'),`Unexpected request: ${url.pathname}`);return new Response(fs.readFileSync(new URL(`public${url.pathname}`,root),'utf8'));};
 scripts.forEach(script=>w.eval(script));await tick();actor={email:'home-standings@example.test',app_metadata:{roles:['admin']},jwt:async()=>'isolated-home-standings-token'};(callbacks.login||[]).forEach(fn=>fn(actor));
 const wait=async(predicate,message)=>{for(let i=0;i<350;i++){if(predicate())return;await tick();}assert.fail(`${message}: ${$('[data-content-status]')?.textContent} | ${$('[data-content-save-feedback]')?.textContent}`);};
 await wait(()=>!$('[data-content-editor]').hidden&&$('[data-content-dataset]').value==='standings','Authenticated Standings editor');
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(el=>el.dataset.fieldPath===JSON.stringify(path));
 const set=(path,value)=>{const control=field(path);assert.ok(control,`Missing control ${JSON.stringify(path)}`);if(control.type==='checkbox')control.checked=Boolean(value);else control.value=String(value);control.dispatchEvent(new w.Event('input',{bubbles:true}));control.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const choose=id=>{const button=[...w.document.querySelectorAll('[data-entry]')].find(button=>button.textContent.includes(`Homepage Fixture ${id}`));assert.ok(button,`${id} board is available`);button.click();};
 const save=async()=>{$('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!$('[data-content-editor]').inert&&/^PRIVATE DRAFT SAVED/.test($('[data-content-save-feedback]').textContent),'Private draft saved');};
 const publish=async()=>{$('[data-content-publish]').click();await wait(()=>!$('[data-content-editor]').inert&&/^PUBLISHED ·/.test($('[data-content-save-feedback]').textContent),'Publication verified');};
 const importRows=(csv,chase=false)=>{const prefix=chase?'data-sunoco-chase-import':'data-standings-import';$(`[${prefix}-text]`).value=csv;$(`[${prefix}-preview-button]`).click();assert.match($(`[${prefix}-preview]`).textContent,/ROWS READY/);$(`[${prefix}-apply]`).click();};
 return {w,$,field,set,choose,save,publish,importRows,errors,close:()=>w.close()};
}
const selected=boards=>boards.filter(board=>board.featuredOnHome===true).map(board=>board.id);
const unhandled=[],onUnhandled=error=>unhandled.push(error?.message||String(error));process.on('unhandledRejection',onUnhandled);
try{
 // Rendering optional controls never writes defaults or turns the NRRS
 // fallback into an explicit selection that could conflict with another board.
 {
  const server=backend(),e=await editor(server);try{
   for(const board of server.initial.standings){
    e.choose(board.id);const feature=e.$('[data-home-standings-feature]');assert.ok(feature);assert.equal(feature.type,'checkbox');assert.equal(feature.dataset.fieldPath,'["featuredOnHome"]');assert.equal(feature.checked,false);
    assert.match(feature.closest('label').textContent,/without an explicit selection[\s\S]*NRRS/i);assert.match(feature.closest('label').textContent,/first highlighted driver[\s\S]*points leader/i);
    const table=e.$('[data-home-standings-table]');assert.equal(Boolean(table),Array.isArray(board.chaseRows),'Only boards with a separate Chase array expose the table choice');
    if(table){assert.equal(table.dataset.fieldPath,'["homeTable"]');assert.equal(table.value,'regular');assert.deepEqual([...table.options].map(option=>option.value),['regular','chase']);}
   }
   assert.deepEqual(server.stored.published,server.initial);assert.deepEqual(server.stored.drafts,{});assert.deepEqual(server.actions,[],'Merely viewing controls makes no server writes');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // A pre-existing explicit selection wins over fallback. Selection is unique,
 // private until published, then survives a fresh authenticated editor load.
 {
  const server=backend(data=>{data.standings.find(board=>board.id==='kmart').featuredOnHome=true;}),before=evidence(server.initial.standings);let e=await editor(server);try{
   e.choose('nrrs');assert.equal(e.field(['featuredOnHome']).checked,false,'NRRS fallback does not override an explicit Kmart selection');e.choose('kmart');assert.equal(e.field(['featuredOnHome']).checked,true);
   e.choose('sunoco');e.set(['featuredOnHome'],true);e.set(['homeTable'],'chase');assert.match(e.$('[data-content-save-feedback]').textContent,/UNSAVED STANDINGS SELECTION.*save a private draft or publish/);assert.match(e.$('[data-content-status]').textContent,/private draft or publish/i);
   assert.deepEqual(selected(server.stored.published.standings),['kmart'],'Unsaved selection is not public');await e.save();assert.deepEqual(selected(server.stored.drafts.standings),['sunoco']);assert.equal(server.stored.drafts.standings.find(board=>board.id==='sunoco').homeTable,'chase');assert.deepEqual(selected(server.stored.published.standings),['kmart'],'Saving a private draft keeps the public selection');assert.deepEqual(evidence(server.stored.drafts.standings),before,'Selecting a homepage table does not alter points, drivers or manual metadata');
   e.choose('kmart');assert.equal(e.field(['featuredOnHome']).checked,false);e.set(['featuredOnHome'],true);e.choose('sunoco');assert.equal(e.field(['featuredOnHome']).checked,false);assert.equal(e.field(['homeTable']).value,'chase','Changing featured leagues preserves their independent table preference');e.set(['featuredOnHome'],true);await e.publish();assert.deepEqual(selected(server.stored.published.standings),['sunoco']);assert.deepEqual(evidence(server.stored.published.standings),before);
   e.close();e=await editor(server);e.choose('sunoco');assert.equal(e.field(['featuredOnHome']).checked,true);assert.equal(e.field(['homeTable']).value,'chase');e.choose('kmart');assert.equal(e.field(['featuredOnHome']).checked,false);e.choose('sunoco');e.set(['featuredOnHome'],false);await e.publish();assert.deepEqual(selected(server.stored.published.standings),[],'Clearing the selection retains the documented NRRS fallback');assert.deepEqual(evidence(server.stored.published.standings),before);assert.deepEqual(e.errors,[]);
   assert.ok(server.actions.length>0);assert.ok(server.actions.every(action=>action.dataset==='standings'),'Only the existing Standings dataset workflow writes');
  }finally{e.close();}
 }
 // Regular CSV, Chase-only CSV and recalculation replace rows, never the board
 // preferences. Empty Chase tables remain a selectable, honest empty view.
 {
  const server=backend(),e=await editor(server);try{
   e.choose('kmart');e.set(['featuredOnHome'],true);e.set(['homeTable'],'chase');assert.equal(e.field(['homeTable']).value,'chase');e.importRows('Position,Number,Driver,Points,Gap\n1,15,Hailey,1000,LEADER\n2,24,Will,990,-10');assert.equal(e.field(['featuredOnHome']).checked,true);assert.equal(e.field(['homeTable']).value,'chase');e.$('[data-standings-recalc]').click();assert.equal(e.field(['featuredOnHome']).checked,true);assert.equal(e.field(['homeTable']).value,'chase');await e.save();let board=server.stored.drafts.standings.find(board=>board.id==='kmart');assert.equal(board.featuredOnHome,true);assert.equal(board.homeTable,'chase');assert.deepEqual(board.chaseRows,[]);assert.equal(board.rows.find(row=>row.driver==='Hailey').points,1000);
   e.choose('sunoco');e.set(['featuredOnHome'],true);e.set(['homeTable'],'chase');e.importRows('Position,Number,Driver,Points,Gap\n1,54,Hailey,130,LEADER\n2,42,Will,120,-10',true);assert.equal(e.field(['featuredOnHome']).checked,true);assert.equal(e.field(['homeTable']).value,'chase');e.$('[data-sunoco-chase-recalc]').click();e.$('[data-standings-recalc]').click();assert.equal(e.field(['featuredOnHome']).checked,true);assert.equal(e.field(['homeTable']).value,'chase');await e.publish();board=server.stored.published.standings.find(board=>board.id==='sunoco');assert.equal(board.featuredOnHome,true);assert.equal(board.homeTable,'chase');assert.equal(board.chaseRows.find(row=>/hailey|wispy/i.test(row.driver)).points,130);assert.deepEqual(selected(server.stored.published.standings),['sunoco']);assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 assert.deepEqual(sourcePaths.map(path=>fs.readFileSync(new URL(path,root),'utf8')),sourceBefore,'UI verification never rewrites canonical or generated source datasets');assert.deepEqual(unhandled,[]);
 console.log('PASS: authenticated homepage standings controls, optional defaults without implicit NRRS selection, board/table exclusivity, private draft/publication/reload parity, unchanged points/manual metadata, regular/Chase imports and recalculation preservation, and empty-Chase choice. No live writes.');
}finally{process.off('unhandledRejection',onUnhandled);}

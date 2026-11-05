import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

const require=createRequire(import.meta.url),root=new URL('../',import.meta.url),content=require('../netlify/lib/_content.cjs'),seed=content.seeds();
const siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const html=fs.readFileSync(new URL('public/admin/index.html',root),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`public/admin/${name}`,root),'utf8'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
const unhandled=[],onUnhandled=error=>unhandled.push(error?.message||String(error));process.on('unhandledRejection',onUnhandled);
const ids={other:'shift-other',before:'shift-before',start:'shift-start',off:'shift-off',window:'shift-window'};
const targetIds=[ids.start,ids.off,ids.window];
function backend({recordedEntry=false}={}){
 const published=structuredClone(seed),d1=seed['schedule-events'].find(event=>event.league==='uarl-d1'),nrrs=seed['schedule-events'].find(event=>event.league==='nrrs');
 published['schedule-events']=[
  {...nrrs,id:ids.other,date:'2026-01-03',title:'Shift Fixture NRRS',entries:[],entryListMode:'auto'},
  {...d1,id:ids.before,round:'ROUND 1',date:'2026-10-25',title:'Shift Fixture Earlier',entries:[],entryListMode:'auto'},
  {...d1,id:ids.start,round:'ROUND 2',date:'2026-11-01',title:'Shift Fixture Start',entries:[],entryListMode:'auto'},
  {...d1,id:ids.off,date:'2026-11-08',title:'Shift Fixture Off Week',offWeek:true,entries:[],entryListMode:'auto'},
  {...d1,id:ids.window,round:'ROUND 3',date:'2026-12-27',endDate:'2026-12-29',displayDate:'Dec 27–29',title:'Shift Fixture Window',entries:[],entryListMode:'auto'},
 ].map(event=>({offWeek:false,tbd:false,timePending:false,specialTag:'',round:'',...event}));
 if(recordedEntry){const historical=published['schedule-events'].find(event=>event.id===ids.other);historical.round='ROUND 99';historical.entryListMode='custom';historical.entries=[{assignmentId:'retired-calendar-fixture',driver:'Recorded Previous Driver',number:'32',entryStatus:'Raced'}];}
 let stored={version:1,revision:0,published,drafts:{},history:[]};const initial=structuredClone(published),actions=[],module={exports:{}};
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('netlify/lib/_site-admin.cjs',root),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:structuredClone(stored),etag:'shift-fixture-etag'}),write:async(next,etag)=>{assert.equal(etag,'shift-fixture-etag');stored=structuredClone(next);}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Schedule-shift tests must not contact a service or deployment hook'));
 return {get stored(){return structuredClone(stored);},initial,actions,async request(method,body){if(body)actions.push(JSON.parse(body));const result=await module.exports.handler({httpMethod:method,body},{clientContext:{user:{email:'shift-fixture@example.test',app_metadata:{roles:['admin']}}}});return new Response(result.body,{status:result.statusCode,headers:result.headers});},checkHistory(){assert.deepEqual(stored.published.results,initial.results,'Schedule changes preserve official historical results and driver numbers');assert.ok(stored.published.results.some(race=>race.league==='nrrs'&&race.entries.some(entry=>String(entry.number)==='32')),'Preserve historical NRRS #32 entries');for(const key of ['wins','standings','milestones','news'])assert.deepEqual(stored.published[key],initial[key],`${key}: bulk dates must not change other published records`);}};
}
async function editor(server){
 const dom=new JSDOM(html,{url:'https://aetherwing.net/admin/?section=schedule-events',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={},errors=[],prompts=[];let actor=null;
 Object.assign(w,{structuredClone,AbortSignal,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener(){}});w.confirm=message=>{prompts.push(String(message));return true;};w.addEventListener('error',event=>errors.push(event.message));
 w.netlifyIdentity={currentUser:()=>actor,on:(name,callback)=>{(callbacks[name]??=[]).push(callback);},close(){},open(){},logout(){}};
 w.fetch=async(input,options={})=>{const url=new URL(String(input),w.location.href);assert.equal(url.origin,w.location.origin,'No mocked Admin request may leave the fixture');if(url.pathname==='/.netlify/functions/site-admin')return server.request(options.method||'GET',options.body);if(url.pathname==='/api/site-content')return Response.json({version:1,revision:server.stored.revision,datasets:require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(server.stored.published)});if(url.pathname==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});assert.ok(url.pathname.startsWith('/data/'),`Unexpected mocked request: ${url.pathname}`);return new Response(fs.readFileSync(new URL(`public${url.pathname}`,root),'utf8'));};
 scripts.forEach(script=>w.eval(script));await tick();actor={email:'shift-fixture@example.test',app_metadata:{roles:['admin']},jwt:async()=>'shift-fixture-token'};(callbacks.login||[]).forEach(fn=>fn(actor));
 const wait=async(predicate,label)=>{for(let i=0;i<220;i++){if(predicate())return;await tick();}assert.fail(`${label}: ${$('[data-shift-feedback]')?.textContent} | ${$('[data-content-status]')?.textContent} | ${$('[data-content-save-feedback]')?.textContent}`);};
 await wait(()=>!$('[data-content-editor]').hidden&&$('[data-content-dataset]').value==='schedule-events','Calendar after authenticated read');
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(el=>el.dataset.fieldPath===JSON.stringify(path));
 const set=(path,value)=>{const el=field(path);assert.ok(el,`Missing ${JSON.stringify(path)} field`);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const visible=selector=>{const el=$(selector);return !!el&&!el.closest('[hidden]');};
 const select=title=>{const button=[...w.document.querySelectorAll('[data-entry]')].find(button=>button.textContent.includes(title));assert.ok(button,`${title} entry exists`);button.click();};
 const openTool=()=>{const tool=$('[data-schedule-shift]');if(tool.classList.contains('adm-folded'))tool.firstElementChild.click();assert.equal(tool.classList.contains('adm-folded'),false);};
 const chooseStart=()=>{openTool();const league=$('[data-shift-league]');league.value='uarl-d1';league.dispatchEvent(new w.Event('change',{bubbles:true}));const option=[...$('[data-shift-start]').options].find(option=>option.textContent.includes('Shift Fixture Start'));assert.ok(option,'D1 start appears in the shift helper');$('[data-shift-start]').value=option.value;$('[data-shift-start]').dispatchEvent(new w.Event('change',{bubbles:true}));};
 const preview=days=>{chooseStart();$(`[data-shift-preview="${days}"]`).click();assert.equal(visible('[data-shift-preview-panel]'),true);assert.ok($('[data-shift-preview-summary]').textContent.includes('3 events'));assert.equal($('[data-shift-feedback]').getAttribute('role'),'status');};
 const apply=()=>{$('[data-shift-apply]').click();};
 const save=async()=>{$('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!$('[data-content-editor]').inert&&/^PRIVATE DRAFT SAVED/.test($('[data-content-save-feedback]').textContent),'Save schedule draft');};
 const publish=async()=>{$('[data-content-publish]').click();await wait(()=>!$('[data-content-editor]').inert&&/^PUBLISHED ·/.test($('[data-content-save-feedback]').textContent),'Publish fixture schedule');};
 const feedback=()=>{assert.ok(visible('[data-shift-feedback]'),'Shift feedback is local and visible');return $('[data-shift-feedback]');};
 return {w,$,wait,field,set,visible,select,openTool,chooseStart,preview,apply,save,publish,feedback,errors,prompts,close:()=>w.close()};
}
const byId=(rows,id)=>rows.find(row=>row.id===id);
const dateState=row=>({date:row.date,endDate:row.endDate,displayDate:row.displayDate});
function assertUnchangedOutsideRange(server,rows){for(const id of [ids.other,ids.before])assert.deepEqual(byId(rows,id),byId(server.initial['schedule-events'],id),`${id}: other leagues and earlier D1 dates stay untouched`);}

try{
 for(const [days,start,off,windowStart,windowEnd] of [[7,'2026-11-08','2026-11-15','2027-01-03','2027-01-05'],[-7,'2026-10-25','2026-11-01','2026-12-20','2026-12-22']]){
  const server=backend(),e=await editor(server);try{
   assert.equal(e.field(['league']).value,'nrrs','The unrelated NRRS editor starts selected');const originalCurrentDate=e.field(['date']).value;
   e.preview(days);assert.equal(e.field(['date']).value,originalCurrentDate,'Preview never changes the current date');assert.deepEqual(server.stored.published,server.initial,'Preview changes no published record');assert.equal(server.actions.length,0);
   e.apply();assert.equal(e.field(['league']).value,'uarl-d1','Apply selects the first affected helper event, not the unrelated previously open NRRS record');assert.equal(e.field(['date']).value,start);
   assert.equal(e.feedback().dataset.state,'success');assert.match(e.feedback().textContent,/3.*(?:moved|shift)|(?:moved|shift).*3/i);assert.match(e.$('[data-content-save-feedback]').textContent,/UNSAVED|save|publish/i);
   assert.equal(e.visible('[data-shift-preview-panel]'),false);assert.equal(e.visible('[data-shift-result]'),true);assert.equal(e.visible('[data-shift-undo]'),true);assert.equal(e.$('[data-shift-result]').closest('[data-shift-preview-panel]'),null,'Undo does not live inside the hidden preview');assert.equal(e.$('[data-schedule-shift]').classList.contains('adm-folded'),false);
   await e.save();const draft=server.stored.drafts['schedule-events'];assert.equal(byId(draft,ids.start).date,start);assert.equal(byId(draft,ids.off).date,off);assert.equal(byId(draft,ids.off).offWeek,true,'Off weeks move with the series');assert.equal(byId(draft,ids.window).date,windowStart);assert.equal(byId(draft,ids.window).endDate,windowEnd);assert.notEqual(byId(draft,ids.window).displayDate,'Dec 27–29','Window label follows shifted dates');assertUnchangedOutsideRange(server,draft);for(const id of targetIds)assert.equal(byId(draft,id).time,byId(server.initial['schedule-events'],id).time,'A calendar week shift preserves the local clock time across DST');
   assert.equal(e.visible('[data-shift-undo]'),false,'Successful draft save retires the in-memory Undo');e.$('[data-shift-undo]').click();assert.equal(e.field(['date']).value,start,'Hidden stale Undo cannot revert the saved shift');
   await e.publish();assert.equal(e.visible('[data-shift-undo]'),false);assert.equal(byId(server.stored.published['schedule-events'],ids.start).date,start);server.checkHistory();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Preview and canceled confirmation cannot quietly mutate the Calendar draft.
 {
  const server=backend(),e=await editor(server);try{
   e.preview(7);await e.save();assert.deepEqual(server.stored.drafts['schedule-events'],server.initial['schedule-events'],'Saving after Preview alone preserves every original date and field');assert.equal(e.visible('[data-shift-undo]'),false);
   e.preview(7);e.w.confirm=()=>false;e.apply();await e.save();assert.deepEqual(server.stored.drafts['schedule-events'],server.initial['schedule-events'],'Canceling Apply confirmation leaves all dates untouched');server.checkHistory();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // A date manually edited after Apply is newer than the stored Undo request.
 {
  const server=backend(),e=await editor(server);try{
   e.preview(7);e.apply();e.set(['date'],'2026-11-10');e.$('[data-shift-undo]').click();assert.equal(e.feedback().dataset.state,'error');assert.equal(e.field(['date']).value,'2026-11-10','Undo cannot clobber a newer manual date');await e.save();const rows=server.stored.drafts['schedule-events'];assert.equal(byId(rows,ids.start).date,'2026-11-10');assert.equal(byId(rows,ids.off).date,'2026-11-15');assert.equal(byId(rows,ids.window).date,'2027-01-03','A blocked Undo does not partially revert other dates');server.checkHistory();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Undo restores only the shifted date fields, preserving intervening text/time edits.
 {
  const server=backend(),e=await editor(server);try{
   e.preview(7);e.apply();e.set(['title'],'Manual title after shift');e.set(['time'],'9:15 PM ET');e.$('[data-shift-undo]').click();assert.equal(e.field(['date']).value,'2026-11-01');assert.equal(e.field(['title']).value,'Manual title after shift');assert.equal(e.field(['time']).value,'9:15 PM ET');assert.equal(e.visible('[data-shift-undo]'),false);
   await e.save();const rows=server.stored.drafts['schedule-events'];for(const id of targetIds)assert.deepEqual(dateState(byId(rows,id)),dateState(byId(server.initial['schedule-events'],id)),'Undo restores original temporal fields only');assert.equal(byId(rows,ids.start).title,'Manual title after shift');assert.equal(byId(rows,ids.start).time,'9:15 PM ET');server.checkHistory();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Text typed between preview and Apply is committed rather than overwritten.
 {
  const server=backend(),e=await editor(server);try{
   e.select('Shift Fixture Start');e.preview(7);e.set(['title'],'Manual title before Apply');e.apply();assert.equal(e.field(['date']).value,'2026-11-08');assert.equal(e.field(['title']).value,'Manual title before Apply');await e.save();assert.equal(byId(server.stored.drafts['schedule-events'],ids.start).title,'Manual title before Apply');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // A changed date or series invalidates an old preview, preserving manual edits.
 for(const changed of ['date','league']){
  const server=backend(),e=await editor(server);try{
   e.select('Shift Fixture Start');e.preview(7);e.set([changed],changed==='date'?'2026-11-03':'nrrs');e.apply();assert.equal(e.feedback().dataset.state,'error');assert.match(e.feedback().textContent,/preview|chang|again/i);assert.equal(e.field(['date']).value,changed==='date'?'2026-11-03':'2026-11-01');await e.save();const rows=server.stored.drafts['schedule-events'];for(const id of [ids.off,ids.window])assert.deepEqual(dateState(byId(rows,id)),dateState(byId(server.initial['schedule-events'],id)),'A stale preview cannot shift the other events');assert.equal(byId(rows,ids.start)[changed],changed==='date'?'2026-11-03':'nrrs');server.checkHistory();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Undo cannot cross a dataset switch or a persisted/reloaded snapshot.
 {
  const server=backend();let e=await editor(server);try{
   e.preview(7);e.apply();e.$('[data-admin-dataset="partners"]').click();await e.wait(()=>e.$('[data-content-dataset]').value==='partners','Switch away from Calendar');e.$('[data-admin-dataset="schedule-events"]').click();await e.wait(()=>e.$('[data-content-dataset]').value==='schedule-events','Return to Calendar');assert.equal(e.visible('[data-shift-undo]'),false,'Leaving Calendar clears prior date references');e.$('[data-shift-undo]').click();assert.equal(e.field(['date']).value,byId(server.initial['schedule-events'],ids.other).date);
   e.preview(7);e.apply();await e.save();e.close();e=await editor(server);assert.equal(e.visible('[data-shift-undo]'),false,'A reloaded saved draft never revives old Undo references');e.select('Shift Fixture Start');assert.equal(e.field(['date']).value,'2026-11-08');await e.publish();server.checkHistory();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Opening/committing an approved old custom Calendar entry must not let
 // the browser silently select the first current driver for an unknown ID.
 {
  const server=backend({recordedEntry:true});let e=await editor(server);try{
   const recorded=byId(server.initial['schedule-events'],ids.other).entries[0];assert.ok(seed.drivers.every(driver=>driver.id!==recorded.assignmentId),'The recorded assignment is deliberately absent from the active roster');assert.ok(!server.initial.results.some(race=>race.league==='nrrs'&&String(race.round||'').match(/\d+/)?.[0]==='99'),'Approval comes from this published Calendar event, not an existing global result');
   assert.equal(e.field(['title']).value,'Shift Fixture NRRS','The historical Calendar event is actually selected');
   const picker=e.field(['entries',0,'assignmentId']);assert.equal(picker.value,recorded.assignmentId);assert.match(picker.selectedOptions[0].textContent,/Recorded entry/,'Missing active assignments retain an explicit selected recorded option');
   picker.dispatchEvent(new e.w.Event('change',{bubbles:true}));assert.equal(e.field(['entries',0,'driver']).value,recorded.driver,'A same-value change must keep the recorded driver name');assert.equal(e.field(['entries',0,'number']).value,'32','A same-value change must keep the recorded historical number');
   e.preview(7);e.apply();assert.equal(e.field(['league']).value,'uarl-d1');await e.save();assert.deepEqual(byId(server.stored.drafts['schedule-events'],ids.other).entries,[recorded],'Committing the unrelated historical editor during Preview must not coerce its ID to the first current driver');await e.publish();assert.deepEqual(byId(server.stored.published['schedule-events'],ids.other).entries,[recorded],'Publishing a D1 date shift retains the approved old ID, name and number');
   e.close();e=await editor(server);e.select('Shift Fixture NRRS');assert.equal(e.field(['entries',0,'assignmentId']).value,recorded.assignmentId,'Reload keeps the recorded option selected');assert.equal(e.field(['entries',0,'number']).value,'32');server.checkHistory();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 assert.deepEqual(unhandled,[],'Shift errors must remain visible and handled');
 console.log('PASS: authenticated mocked UARL D1 preview/+7/-7/Apply/Undo, mismatched original editor, off weeks/DST/year windows, local feedback, stale preview guards, preserved manual edits, persistence/switch/reload invalidation and untouched historical NRRS #32 results. No live writes or deployments.');
}finally{process.off('unhandledRejection',onUnhandled);}

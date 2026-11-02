import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url),siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const root=new URL('../',import.meta.url),content=require('../netlify/lib/_content.cjs'),seed=content.seeds();
const page=fs.readFileSync(new URL('public/admin/index.html',root),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`public/admin/${name}`,root),'utf8'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,20));
const historyKeys=['results','wins','standings','milestones','news','driver-portfolios'];
function backend(published=seed){
 let stored={version:1,revision:0,published:structuredClone(published),drafts:{},history:[]};
 const histories=Object.fromEntries(historyKeys.map(key=>[key,structuredClone(stored.published[key])]));
 const module={exports:{}},actions=[];
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('netlify/lib/_site-admin.cjs',root),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:structuredClone(stored),etag:'mock-etag'}),write:async(next,etag)=>{assert.equal(etag,'mock-etag');stored=structuredClone(next);}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('No external request or build hook may run'));
 const actor={clientContext:{user:{email:'alliance-fixture@example.test',app_metadata:{roles:['admin']}}}};
 return {get stored(){return structuredClone(stored);},actions,assertHistory(){for(const key of historyKeys)assert.deepEqual(stored.published[key],histories[key],`${key}: alliance UI must preserve historical content`);},async request(method='GET',body){
  if(body)actions.push(JSON.parse(body));
  const response=await module.exports.handler({httpMethod:method,body},actor);return new Response(response.body,{status:response.statusCode,headers:response.headers});
 }};
}
async function editor(server,section='alliances'){
 const dom=new JSDOM(page,{url:`https://aetherwing.net/admin/?section=${section}`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={},prompts=[];let user=null;
 Object.assign(w,{structuredClone,AbortSignal,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener:()=>{}});w.confirm=message=>{prompts.push(message);return true;};
 w.netlifyIdentity={on:(name,fn)=>{callbacks[name]=fn;},currentUser:()=>user,close:()=>{},open:()=>{},logout:()=>{}};
 w.fetch=async(input,options={})=>{
  const url=new URL(String(input),w.location.href),p=url.pathname;
  if(p==='/.netlify/functions/site-admin')return server.request(options.method||'GET',options.body);
  if(p==='/api/site-content')return Response.json({version:1,revision:server.stored.revision,datasets:require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(server.stored.published)});
  if(p==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});
  if(p==='/data/site-admin-seed.json')return Response.json(seed);
  assert.equal(url.origin,w.location.origin,'No requests may leave the mocked application');assert.ok(p.startsWith('/data/'),`Unexpected mock request: ${p}`);
  return new Response(fs.readFileSync(new URL(`public${p}`,root),'utf8'));
 };
 scripts.forEach(script=>w.eval(script));await tick();
 assert.equal($('[data-workspace]').hidden,true,'The deep-linked editor still requires sign-in');
 user={email:'alliance-fixture@example.test',app_metadata:{roles:['admin']},jwt:async()=>'mock-token'};callbacks.login(user);await tick();
 const wait=async(predicate,label)=>{for(let i=0;i<150;i++){if(predicate())return;await tick();}assert.fail(`${label}: ${$('[data-content-status]').textContent}`);};
 await wait(()=>!$('[data-content-editor]').hidden&&$('[data-content-dataset]').value===section,'Restore requested dataset after sign-in');
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(el=>el.dataset.fieldPath===JSON.stringify(path));
 const set=(path,value)=>{const el=field(path);assert.ok(el,`Missing ${path} field`);if(el.type==='checkbox')el.checked=value;else el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));if(el.tagName==='SELECT')el.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const open=async name=>{$(`[data-admin-dataset="${name}"]`).click();await wait(()=>$('[data-content-dataset]').value===name,`Open ${name}`);};
 const select=index=>{$(`[data-entry="${index}"]`).click();};
 const save=async()=>{$('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!$('[data-content-editor]').inert,'Save finished');assert.match($('[data-content-save-feedback]').textContent,/^PRIVATE DRAFT SAVED/);};
 const publish=async(success=true)=>{$('[data-content-publish]').click();await wait(()=>!$('[data-content-editor]').inert,'Publish finished');assert.match($('[data-content-save-feedback]').textContent,success?/^PUBLISHED · revision \d+ · public feed verified/:/^PUBLISH NOT CONFIRMED/);};
 return {w,$,field,set,open,select,save,publish,wait,prompts,close:()=>w.close()};
}

const server=backend();let e=await editor(server);
try{
 assert.equal(e.$('[data-admin-dataset="alliances"]').getAttribute('aria-current'),'page');assert.equal(new URL(e.w.location).searchParams.get('section'),'alliances');
 assert.equal(e.$('[data-content-add]').textContent,'Add alliance');
 e.$('[data-content-add]').click();e.set(['name'],'Fixture Racing');e.set(['shortName'],'Fixture');await e.save();
 const added=server.stored.drafts.alliances.at(-1);assert.deepEqual(added,{id:'fixture-racing',name:'Fixture Racing',shortName:'Fixture'});
 assert.equal(server.stored.published.alliances.length,seed.alliances.length,'Saving an alliance draft does not publish it');
 e.close();e=await editor(server);e.select(server.stored.drafts.alliances.length-1);assert.equal(e.field(['name']).value,'Fixture Racing','Saved draft survives a fresh editor');
 await e.publish();assert.equal(server.stored.drafts.alliances,undefined);
 e.set(['name'],'Renamed Fixture Racing');await e.publish();assert.equal(server.stored.published.alliances.at(-1).id,added.id,'Rename preserves stable linked ID');assert.equal(server.stored.published.alliances.at(-1).name,'Renamed Fixture Racing');
 // New and existing current records expose the same editable named-alliance selector.
 for(const [dataset,category] of [['drivers','affiliation'],['roster-profiles','affiliation'],['competitions','type']]){
  await e.open(dataset);e.select(0);e.set([category],'alliance');
  const choice=e.field(['allianceId']);assert.ok(choice,`${dataset}: category change exposes alliance selector`);
  assert.ok([...choice.options].some(option=>option.value===added.id&&option.textContent==='Renamed Fixture Racing'));
  e.set(['allianceId'],added.id);await e.save();assert.equal(server.stored.drafts[dataset][0].allianceId,added.id);await e.publish();assert.equal(server.stored.published[dataset][0].allianceId,added.id);
 }
 await e.open('alliances');e.select(server.stored.published.alliances.findIndex(row=>row.id===added.id));e.$('[data-content-remove]').click();
 await e.publish(false);assert.match(e.$('[data-content-status]').textContent,/still used|Reassign|clear/i);assert.ok(server.stored.published.alliances.some(row=>row.id===added.id),'Failed linked deletion keeps public alliance');
 assert.ok(!e.$('[data-content-list]').textContent.includes('Renamed Fixture Racing'),'Unsaved removal stays in the editor after a rejected publish');
 e.w.confirm=message=>{e.prompts.push(message);return !message.includes('Leave unsaved');};e.$('[data-admin-dataset="drivers"]').click();await tick();
 assert.equal(e.$('[data-content-dataset]').value,'alliances','Rejected publish preserves unsaved state and tab-exit guard');assert.ok(e.prompts.some(message=>message.includes('Leave unsaved')));
 e.w.confirm=()=>true;e.$('[data-content-refresh]').click();await e.wait(()=>e.$('[data-content-list]').textContent.includes('Renamed Fixture Racing'),'Refresh restores the retained public alliance');
 for(const [dataset,category] of [['drivers','affiliation'],['roster-profiles','affiliation'],['competitions','type']]){
  await e.open(dataset);e.select(0);assert.equal(e.field(['allianceId']).value,added.id);e.set([category],'aetherwing');assert.equal(e.field(['allianceId']),undefined,'Direct Aetherwing records hide the named-alliance selector');await e.publish();assert.equal(server.stored.published[dataset][0].allianceId,'','Changing category clears the alliance reference');
 }
 await e.open('alliances');e.select(server.stored.published.alliances.findIndex(row=>row.id===added.id));e.$('[data-content-remove]').click();await e.publish();assert.ok(!server.stored.published.alliances.some(row=>row.id===added.id),'Unused alliance removal succeeds');server.assertHistory();
}finally{e.close();}

// An explicitly empty list is persisted, shown honestly and remains editable.
const cleared=structuredClone(seed);
for(const dataset of ['drivers','roster-profiles','competitions'])cleared[dataset]=cleared[dataset].map(row=>({...row,...(Object.hasOwn(row,'affiliation')?{affiliation:'aetherwing'}:{}),...(Object.hasOwn(row,'type')?{type:'aetherwing'}:{}),allianceId:''}));
const emptyServer=backend(cleared);e=await editor(emptyServer);
try{
 e.select(0);e.$('[data-content-remove]').click();await e.publish();assert.deepEqual(emptyServer.stored.published.alliances,[]);
 e.close();e=await editor(emptyServer);assert.equal(e.$('[data-content-list]').querySelectorAll('[data-entry]').length,0,'Reload does not resurrect StarClutch after an empty publication');
 assert.equal(e.$('[data-content-add]').textContent,'Add alliance');e.$('[data-content-add]').click();e.set(['name'],'Fresh Racing');e.set(['shortName'],'Fresh');await e.publish();assert.deepEqual(emptyServer.stored.published.alliances,[{id:'fresh-racing',name:'Fresh Racing',shortName:'Fresh'}]);
 for(const [dataset,category] of [['drivers','affiliation'],['roster-profiles','affiliation'],['competitions','type']]){
  await e.open(dataset);e.$('[data-content-add]').click();e.set([category],'alliance');assert.ok(e.field(['allianceId']),`${dataset}: new records also gain an alliance selector`);assert.deepEqual([...e.field(['allianceId']).options].filter(option=>option.value).map(option=>option.value),['fresh-racing'],'Deleted alliances stay out of every current selector');
  e.set(['allianceId'],'fresh-racing');assert.equal(e.field(['allianceId']).value,'fresh-racing');
  // These intentionally unfinished fixture records are discarded without saving.
  e.$('[data-content-refresh]').click();await tick();
 }
 emptyServer.assertHistory();
}finally{e.close();}
console.log('PASS: authenticated alliance editor deep link, add/auto-ID/draft/reload/publish/rename, current driver/profile/program selectors, clear links, failed-removal dirty guard, empty/recreate and preserved history. All storage/auth are mocked.');

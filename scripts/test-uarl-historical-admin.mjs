import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

// Exercise the real Admin form and authenticated handler. Identity, persistence,
// publication verification and every network endpoint are local test fixtures.
const require=createRequire(import.meta.url),siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const content=require('../netlify/lib/_content.cjs'),seed=content.seeds(),clone=structuredClone;
const html=fs.readFileSync(new URL('../public/admin/index.html',import.meta.url),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`../public/admin/${name}`,import.meta.url),'utf8'));
const archived={scheduleId:'uarl-d1-historical-admin-fixture',league:'uarl-d1',leagueName:'UARL Division 1',round:'ROUND 77',date:'2026-09-13',title:'Fixture approved historical D1 result',track:'Fixture Raceway',status:'Completed',specialTag:'',featured:false,headline:'Approved historical entry snapshot',headlineAccent:'',summary:'Original approved result summary.',pointsSource:'official-recap',coverage:'team-only',standingsMode:'record-only',sourceUrl:'/news/approved-d1-history-fixture/',sourceNote:'Isolated fixture representing a previously approved CMS result.',entries:[
 {assignmentId:'wispy-uarl-d1',driver:'Hailey',number:'28',manufacturer:'Toyota',start:1,stage1Finish:2,stage1Points:4,stage2Finish:3,stage2Points:3,finish:4,finishPoints:40,bonusPoints:0,racePoints:47,featuredDriver:true,chaseDriver:false},
 {assignmentId:'rocky-uarl-d1',driver:'Rocky',number:'46',manufacturer:'Toyota',start:2,stage1Finish:1,stage1Points:5,stage2Finish:2,stage2Points:4,finish:2,finishPoints:45,bonusPoints:0,racePoints:54,featuredDriver:false,chaseDriver:false},
 {assignmentId:'burgertown-uarl-d1',driver:'BurgerTown2Good',number:'32',manufacturer:'Toyota',start:3,stage1Finish:3,stage1Points:3,stage2Finish:1,stage2Points:5,finish:3,finishPoints:42,bonusPoints:0,racePoints:50,featuredDriver:false,chaseDriver:false}
]};
assert.ok(!seed.results.some(race=>race.scheduleId===archived.scheduleId),'The historical result comes from approved mock CMS history, not a bundled source fixture');
assert.deepEqual(seed.drivers.filter(driver=>driver.competitionId==='uarl-d1').map(driver=>[driver.id,driver.number]),[['will-uarl-d1','33']]);
for(const entry of archived.entries)assert.ok(!seed.drivers.some(driver=>driver.id===entry.assignmentId),'The test must use genuinely retired assignment IDs');

function backend(){
 let stored={version:1,revision:500,published:{...clone(seed),results:[clone(archived),...clone(seed.results)]},drafts:{},history:[]},writes=0;
 const module={exports:{}};
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('../netlify/lib/_site-admin.cjs',import.meta.url),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'historical-admin-etag'}),write:async(next,etag)=>{assert.equal(etag,'historical-admin-etag');stored=clone(next);writes++;}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Historical Admin tests cannot call a live service or deploy'));
 const actor={clientContext:{user:{email:'historical-admin@example.test',app_metadata:{roles:['admin']}}}};
 return {get stored(){return clone(stored);},get writes(){return writes;},async request(method='GET',body){const response=await module.exports.handler({httpMethod:method,body},actor);return new Response(response.body,{status:response.statusCode,headers:response.headers});}};
}

const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function editor(server){
 const dom=new JSDOM(html,{url:'https://aetherwing.net/admin/?section=results',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={},errors=[];let user=null;
 Object.assign(w,{structuredClone,AbortController,AbortSignal,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener(){}});w.confirm=()=>true;w.addEventListener('error',event=>errors.push(event.message));
 w.netlifyIdentity={on:(name,fn)=>{(callbacks[name]??=[]).push(fn);},currentUser:()=>user,close(){},open(){},logout(){}};
 w.fetch=async(input,options={})=>{
  const url=new URL(String(input),w.location.href),path=url.pathname;
  assert.equal(url.origin,w.location.origin,'No requests may leave the mock application');
  if(path==='/.netlify/functions/site-admin')return server.request(options.method||'GET',options.body);
  if(path==='/api/site-content')return Response.json({revision:server.stored.revision,datasets:require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(clone(server.stored.published))});
  if(path==='/data/site-admin-seed.json')return Response.json(seed);
  if(path==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});
  assert.ok(path.startsWith('/data/'),`Unexpected mock path ${path}`);
  return new Response(fs.readFileSync(new URL(`../public${path}`,import.meta.url),'utf8'));
 };
 scripts.forEach(script=>w.eval(script));await tick();assert.equal($('[data-workspace]').hidden,true,'Historical editing still requires sign-in');
 user={id:'fixture-historical-admin',email:'historical-admin@example.test',app_metadata:{roles:['admin']},jwt:async()=>'fixture-jwt'};for(const callback of callbacks.login||[])callback(user);
 const wait=async(predicate,label)=>{for(let i=0;i<200;i++){if(predicate())return;await tick();}assert.fail(`${label}: ${$('[data-content-status]').textContent}`);};
 await wait(()=>!$('[data-content-editor]').hidden&&$('[data-content-dataset]').value==='results','Authenticated Results editor');
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(node=>node.dataset.fieldPath===JSON.stringify(path));
 const choose=()=>{const button=[...w.document.querySelectorAll('[data-entry]')].find(node=>node.textContent.includes(archived.title));assert.ok(button,'Approved mock historical result is selectable');button.click();assert.equal(field(['scheduleId']).value,archived.scheduleId);};
 const set=(path,value)=>{const node=field(path);assert.ok(node,`Missing ${path}`);node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const open=async name=>{$(`[data-admin-dataset="${name}"]`).click();await wait(()=>$('[data-content-dataset]').value===name,`Open ${name}`);};
 const save=async()=>{$('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!$('[data-content-editor]').inert&&/^PRIVATE DRAFT SAVED/.test($('[data-content-save-feedback]').textContent),'Save historical private draft');};
 const publish=async()=>{$('[data-content-publish]').click();await wait(()=>!$('[data-content-editor]').inert&&/^PUBLISHED ·/.test($('[data-content-save-feedback]').textContent),'Publish historical prose edit');};
 return {w,$,field,choose,set,open,save,publish,errors,close:()=>w.close()};
}
const find=rows=>rows.find(race=>race.scheduleId===archived.scheduleId);
const unhandled=[],onUnhandled=error=>unhandled.push(error?.message||String(error));process.on('unhandledRejection',onUnhandled);
const server=backend();let e;
try{
 e=await editor(server);e.choose();
 for(const [index,entry]of archived.entries.entries()){
  const choice=e.field(['entries',index,'assignmentId']);
  assert.equal(choice.value,entry.assignmentId);assert.match(choice.selectedOptions[0].textContent,/Recorded entry/);
  assert.ok([...choice.options].some(option=>option.value==='will-uarl-d1'&&option.textContent.includes('#33')),'The current roster contains Will #33, not the historical drivers');
  assert.equal(e.field(['entries',index,'driver']).readOnly,true,'A recorded driver identity remains linked');
  assert.equal(e.field(['entries',index,'number']).readOnly,true,'A recorded car number remains linked');
  choice.dispatchEvent(new e.w.Event('change',{bubbles:true}));
  assert.equal(e.field(['entries',index,'driver']).value,entry.driver,'An unchanged picker event does not clear the name');
  assert.equal(e.field(['entries',index,'number']).value,entry.number,'An unchanged picker event does not clear the number');
 }
 e.set(['summary'],'Unrelated approved prose correction.');await e.save();
 assert.deepEqual(find(server.stored.drafts.results).entries,archived.entries,'Draft commit preserves every historical entry field');
 assert.equal(find(server.stored.published.results).summary,archived.summary,'Private draft does not publish prose');
 await e.open('drivers');assert.ok(e.$('[data-content-list]').textContent.includes('Will'));
 await e.open('results');e.choose();assert.equal(e.field(['entries',0,'assignmentId']).value,'wispy-uarl-d1','Switching sections restores the recorded draft option');
 await e.publish();assert.deepEqual(find(server.stored.published.results).entries,archived.entries,'Publication preserves old IDs/names/numbers/manufacturers/start/stages/points');
 assert.equal(find(server.stored.published.results).summary,'Unrelated approved prose correction.');assert.deepEqual(e.errors,[]);
 e.close();e=await editor(server);e.choose();
 assert.equal(e.field(['entries',0,'assignmentId']).value,'wispy-uarl-d1','Reload retains Hailey #28 rather than Will #33 or External');
 assert.equal(e.field(['entries',0,'manufacturer']).value,'Toyota');
 e.set(['summary'],'Second unrelated approved prose correction.');
 const other=[...e.w.document.querySelectorAll('[data-entry]')].find(node=>!node.textContent.includes(archived.title));assert.ok(other);other.click();e.choose();
 assert.equal(e.field(['entries',0,'assignmentId']).value,'wispy-uarl-d1','Committing while switching result records keeps the old link');
 await e.save();await e.publish();assert.deepEqual(find(server.stored.published.results).entries,archived.entries);
 // Deliberately choosing External still unlinks the snapshot and makes its
 // manual driver/number controls editable. Discard this unsaved test edit.
 const choice=e.field(['entries',0,'assignmentId']);choice.value='';choice.dispatchEvent(new e.w.Event('change',{bubbles:true}));
 assert.equal(e.field(['entries',0,'driver']).readOnly,false);assert.equal(e.field(['entries',0,'number']).readOnly,false);
 assert.equal(e.field(['entries',0,'assignmentId']).value,'');e.$('[data-content-refresh]').click();await tick();e.choose();
 assert.equal(e.field(['entries',0,'assignmentId']).value,'wispy-uarl-d1');assert.deepEqual(e.errors,[]);
 // Approval belongs to that exact recorded race. A copied old ID in a new
 // race must still fail the real server validator without any storage write.
 const before=server.stored,writes=server.writes,copy={...clone(archived),scheduleId:'uarl-d1-unapproved-new-fixture',date:'2026-09-14',round:'ROUND 78',title:'Unapproved new race fixture'};
 const response=await server.request('POST',JSON.stringify({action:'saveDraft',dataset:'results',revision:before.revision,data:[copy,...before.published.results]})),failure=await response.json();
 assert.equal(response.status,400);assert.match(failure.error,/not assigned|Driver Roster/);assert.equal(server.writes,writes);assert.deepEqual(server.stored,before);
 assert.deepEqual(server.stored.published.drivers,seed.drivers,'Historical editing never changes current Will #33 or other assignments');
 assert.deepEqual(unhandled,[]);
 console.log('PASS: authenticated historical D1 result picker retains retired Hailey28/Rocky46/Burger32 IDs, readonly linked identities and all archived measurements through prose edits/draft/switch/publish/reload; explicit External stays editable and new-race stale IDs remain rejected. No live writes.');
}finally{e?.close();process.off('unhandledRejection',onUnhandled);}

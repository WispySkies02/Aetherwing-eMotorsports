import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import * as profileAssignments from '../src/lib/profile-assignments.mjs';
import {applyPublication} from '../src/lib/published-content.mjs';

// Real authenticated handler and Admin form; Identity, persistence, publication
// and every request are isolated fixtures. No credentials or live CMS writes.
const require=createRequire(import.meta.url),siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const content=require('../netlify/lib/_content.cjs'),seed=content.seeds(),clone=structuredClone;
const html=fs.readFileSync(new URL('../public/admin/index.html',import.meta.url),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`../public/admin/${name}`,import.meta.url),'utf8'));
const source=scripts.at(-1),mirrorSource=source.split('// BEGIN PROFILE_ASSIGNMENTS_MIRROR')[1]?.split('// END PROFILE_ASSIGNMENTS_MIRROR')[0];
assert.ok(mirrorSource,'The classic Admin has an explicit testable helper mirror');
const mirror=new Function(`${mirrorSource};return profileAssignmentContent;`)();
const originalProfile=clone(seed['driver-profiles'].find(row=>row.slug==='hailey'));
assert.ok(originalProfile?.stats.length,'The fixture contains the existing career figures');
const legacy={...clone(originalProfile),slug:'wispy'};delete legacy.profileAssignments;
const ssrLine=fs.readFileSync(new URL('../src/lib/site-content.mjs',import.meta.url),'utf8').split('\n').find(line=>line.startsWith('export const driverProfiles = '));
assert.ok(ssrLine,'SSR exports the reconciled driver profile collection');
const ssr=rows=>new Function('choose','profilesSeed','reconcileProfileAssignments',`${ssrLine.replace('export const','const')}\nreturn driverProfiles;`)((name,fallback)=>rows??fallback,seed['driver-profiles'],profileAssignments.reconcileProfileAssignments);
for(const rows of [[{...legacy,slug:'hailey'}],[{...originalProfile,profileAssignments:[]}],[{...originalProfile,profileAssignments:[{...profileAssignments.approvedHaileyProfileAssignment,team:'Approved later team',number:'128'}]}],[{...originalProfile,profileAssignments:null}],[{slug:'other',profileAssignments:[]}],[]]){
 assert.deepEqual(mirror.reconcileProfileAssignments(clone(rows)),profileAssignments.reconcileProfileAssignments(clone(rows)),'Classic/offline and module reconciliation agree');
 assert.deepEqual(ssr(clone(rows)),profileAssignments.reconcileProfileAssignments(clone(rows)),'The actual SSR export honors missing, empty, custom and removed profile records');
}
assert.deepEqual(ssr([legacy]),profileAssignments.reconcileProfileAssignments([{...legacy,slug:'hailey'}]),'SSR normalizes the historical slug before adding a missing approved program');

function backend({publishedProfiles=[legacy],draftProfiles=[legacy]}={}){
 let stored={version:1,revision:700,published:{...clone(seed),'driver-profiles':clone(publishedProfiles)},drafts:draftProfiles===null?{}:{'driver-profiles':clone(draftProfiles)},history:[]},writes=0;
 const module={exports:{}};
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('../netlify/lib/_site-admin.cjs',import.meta.url),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'profile-assignments-fixture'}),write:async(next,etag)=>{assert.equal(etag,'profile-assignments-fixture');stored=clone(next);writes++;}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Profile tests cannot call external services or deployment hooks'));
 const actor={clientContext:{user:{email:'profile-admin@example.test',app_metadata:{roles:['admin']}}}};
 return {get stored(){return clone(stored);},get writes(){return writes;},async request(method='GET',body){const response=await module.exports.handler({httpMethod:method,body},actor);return new Response(response.body,{status:response.statusCode,headers:response.headers});}};
}

const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
async function editor(server){
 const dom=new JSDOM(html,{url:'https://aetherwing.net/admin/?section=driver-profiles',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={},errors=[];let user=null;
 Object.assign(w,{structuredClone,AbortController,AbortSignal,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener(){}});w.confirm=()=>true;w.addEventListener('error',event=>errors.push(event.message));
 w.netlifyIdentity={on:(name,fn)=>{(callbacks[name]??=[]).push(fn);},currentUser:()=>user,close(){},open(){},logout(){}};
 w.fetch=async(input,options={})=>{
  const url=new URL(String(input),w.location.href),path=url.pathname;assert.equal(url.origin,w.location.origin,'All Admin requests remain in the mock application');
  if(path==='/.netlify/functions/site-admin')return server.request(options.method||'GET',options.body);
  if(path==='/api/site-content')return Response.json({revision:server.stored.revision,datasets:require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(clone(server.stored.published))});
  if(path==='/data/site-admin-seed.json')return Response.json(seed);
  if(path==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});
  assert.ok(path.startsWith('/data/'),`Unexpected fixture request ${path}`);
  return new Response(fs.readFileSync(new URL(`../public${path}`,import.meta.url),'utf8'));
 };
 scripts.forEach(script=>w.eval(script));await tick();assert.equal($('[data-workspace]').hidden,true,'Program edits require authentication');
 user={id:'fixture-profile-admin',email:'profile-admin@example.test',app_metadata:{roles:['admin']},jwt:async()=>'fixture-jwt'};for(const callback of callbacks.login||[])callback(user);
 const wait=async(predicate,label)=>{for(let i=0;i<200;i++){if(predicate())return;await tick();}assert.fail(`${label}: ${$('[data-content-status]').textContent} / ${$('[data-content-save-feedback]').textContent}`);};
 await wait(()=>!$('[data-content-editor]').hidden&&$('[data-content-dataset]').value==='driver-profiles','Authenticated Driver Profiles editor');
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(node=>node.dataset.fieldPath===JSON.stringify(path));
 const set=(path,value)=>{const node=field(path);assert.ok(node,`Missing field ${path}`);if(node.type==='checkbox')node.checked=value;else node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));if(node.tagName==='SELECT')node.dispatchEvent(new w.Event('change',{bubbles:true}));};
 const open=async name=>{$(`[data-admin-dataset="${name}"]`).click();await wait(()=>$('[data-content-dataset]').value===name,`Open ${name}`);};
 const save=async()=>{$('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!$('[data-content-editor]').inert&&/^PRIVATE DRAFT SAVED/.test($('[data-content-save-feedback]').textContent),'Save private profile draft');};
 const publish=async()=>{$('[data-content-publish]').click();await wait(()=>!$('[data-content-editor]').inert&&/^PUBLISHED ·/.test($('[data-content-save-feedback]').textContent),'Publish mock profile');};
 const arrayButton=(selector,path)=>[...w.document.querySelectorAll(`[${selector}]`)].find(node=>node.getAttribute(selector)===JSON.stringify(path));
 return {w,$,field,set,open,save,publish,arrayButton,errors,close:()=>w.close()};
}

const find=rows=>rows.find(row=>row.slug==='hailey'),programPath=['profileAssignments',0],unhandled=[],onUnhandled=error=>unhandled.push(error?.message||String(error));process.on('unhandledRejection',onUnhandled);
const server=backend();let e;
try{
 const initialResponse=await server.request(),initial=await initialResponse.json();assert.equal(initialResponse.status,200);
 assert.deepEqual(find(initial.registry.published['driver-profiles']).profileAssignments,[profileAssignments.approvedHaileyProfileAssignment]);
 assert.deepEqual(find(initial.registry.drafts['driver-profiles']).profileAssignments,[profileAssignments.approvedHaileyProfileAssignment],'Authenticated legacy private drafts receive the same approved missing-field default');
 assert.equal(server.writes,0,'Reading a legacy registry never writes a migration to storage');
 const teamBefore=Object.fromEntries(['drivers','charters','competitions','roster-profiles','standings'].map(name=>[name,clone(initial.registry.published[name])]));
 e=await editor(server);assert.equal(e.field(['slug']).value,'hailey');assert.equal(e.field([...programPath,'team']).value,'Goat Whitlock Motorsports');assert.equal(e.field([...programPath,'number']).value,'28');
 assert.ok(!e.field([...programPath,'id']),'Internal program IDs do not become a required form task');assert.equal(e.field([...programPath,'competition']).readOnly,true);
 assert.match(e.$('[data-content-fields]').textContent,/do not change Aetherwing assignments, team counts, or charters/);
 e.set([...programPath,'team'],'Fixture approved external team');e.set([...programPath,'number'],'128');await e.save();
 const edited={...profileAssignments.approvedHaileyProfileAssignment,team:'Fixture approved external team',number:'128'};
 assert.deepEqual(find(server.stored.drafts['driver-profiles']).profileAssignments,[edited]);
 assert.deepEqual(find(server.stored.published['driver-profiles']).profileAssignments,[profileAssignments.approvedHaileyProfileAssignment],'Saving a draft does not expose the edit publicly');
 assert.deepEqual(find(server.stored.drafts['driver-profiles']).stats,originalProfile.stats);
 await e.open('drivers');await e.open('driver-profiles');assert.equal(e.field([...programPath,'team']).value,edited.team,'Changing tabs restores the private profile draft');
 e.close();e=await editor(server);assert.equal(e.field([...programPath,'number']).value,'128','Fresh sign-in restores the saved draft');
 await e.publish();assert.deepEqual(find(server.stored.published['driver-profiles']).profileAssignments,[edited]);assert.ok(!Object.hasOwn(server.stored.drafts,'driver-profiles'));
 assert.deepEqual(find(server.stored.published['driver-profiles']).stats,originalProfile.stats,'Program edits leave the dated-source-pending career values unchanged');
 e.close();e=await editor(server);assert.equal(e.field([...programPath,'team']).value,edited.team,'Published profile survives full reload');
 e.arrayButton('data-array-remove',programPath).click();assert.ok(!e.field([...programPath,'team']));await e.save();assert.deepEqual(find(server.stored.drafts['driver-profiles']).profileAssignments,[]);await e.publish();
 e.close();e=await editor(server);assert.ok(!e.field([...programPath,'team']),'An explicitly emptied program list is not defaulted after publication/reload');
 const add=e.arrayButton('data-array-add',['profileAssignments']);assert.ok(add,'The user can add another profile-only program after clearing the list');add.click();
 for(const name of ['competitionId','competition','number','team','status','active'])assert.ok(e.field([...programPath,name]),`Add creates a ${name} control`);
 assert.ok(!e.field([...programPath,'id']));assert.equal(e.field([...programPath,'active']).checked,true,'A deliberately added ride starts enabled');assert.equal(e.field([...programPath,'status']).value,'Active');
 e.set([...programPath,'competitionId'],'kmart');assert.equal(e.field([...programPath,'competition']).value,seed.competitions.find(row=>row.id==='kmart').name,'One league choice automatically sets its public name');
 for(const [name,value]of Object.entries({team:'Second fixture team',number:'228',active:false}))e.set([...programPath,name],value);
 await e.save();await e.publish();
 const savedProgram=find(server.stored.published['driver-profiles']).profileAssignments[0];assert.match(savedProgram.id,/^hailey-program-\d+$/,'New rides receive an internal ID automatically');assert.equal(savedProgram.competitionId,'kmart');assert.equal(savedProgram.competition,e.field([...programPath,'competition']).value);
 assert.equal(find(server.stored.published['driver-profiles']).profileAssignments[0].active,false,'Inactive profile records remain editable without becoming active team assignments');
 assert.deepEqual(profileAssignments.profileAssignmentsFor(find(server.stored.published['driver-profiles'])),[]);
 for(const [name,records]of Object.entries(teamBefore))assert.deepEqual(server.stored.published[name],records,`${name} is unchanged by profile-only publication`);
 assert.deepEqual(server.stored.published.drivers.filter(row=>row.competitionId==='uarl-d1').map(row=>[row.id,row.number]),[['will-uarl-d1','33']],'GWM Hailey #28 is not an Aetherwing D1 team record');
 // New profile records start without an accidental copied blank GWM record.
 e.$('[data-content-add]').click();assert.ok(!e.field([...programPath,'team']));assert.ok(e.arrayButton('data-array-add',['profileAssignments']));
 assert.deepEqual(e.errors,[]);e.close();e=null;
 // Removed profile records stay removed even when old defaults exist in seeds.
 const other={...clone(originalProfile),slug:'fixture-other',displayName:'Fixture Other',profileAssignments:[]},removed=backend({publishedProfiles:[other],draftProfiles:[other]});
 const removedRead=await(await removed.request()).json();assert.ok(!find(removedRead.registry.published['driver-profiles']));assert.ok(!find(removedRead.registry.drafts['driver-profiles']));assert.equal(removed.writes,0);
 // A cached publication and a live snapshot use the same missing/empty rules.
 const publicDom=new JSDOM('<main data-live-region="driver-profiles"></main>'),events=[];publicDom.window.addEventListener('aetherwing:content',event=>events.push(event.detail));
 for(const state of ['cached','published'])for(const rows of [[legacy],[{...originalProfile,profileAssignments:[]}],[other]]){
  applyPublication({state,savedAt:'2026-11-15T00:00:00Z',datasets:{'driver-profiles':rows}},{drivers:clone(seed.drivers)},{document:publicDom.window.document,window:publicDom.window});
  const expected=profileAssignments.reconcileProfileAssignments(rows.map(row=>row.slug==='wispy'?{...row,slug:'hailey'}:row));assert.deepEqual(events.at(-1)['driver-profiles'],expected);assert.deepEqual(events.at(-1).drivers,seed.drivers);
 }
 const oldBoard={id:'kmart',league:'kmart',subtitle:'After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble',lastResultDate:'2026-10-26',rows:[{driver:'Hailey',number:'15',points:678,delta:'+408',position:'P1',positionChange:1,chaseLocked:true,regularSeasonChampion:false}]},originalBoard=clone(oldBoard);
 for(const state of ['cached','published']){
  applyPublication({state,savedAt:'2026-11-15T00:00:00Z',datasets:{standings:[oldBoard]}},{},{document:publicDom.window.document,window:publicDom.window});
  const repaired=events.at(-1).standings[0];assert.equal(repaired.subtitle,'After Round 12 of 23 · Mexico City · Nov. 9, 2026 · Chase Bubble');assert.deepEqual({...repaired,subtitle:oldBoard.subtitle},originalBoard,'Caption repair preserves published scores, movement, flags and scoring cursor');
 }
 assert.deepEqual(oldBoard,originalBoard,'Cached/live caption repair does not mutate a stored snapshot');
 publicDom.window.close();assert.deepEqual(unhandled,[]);
 console.log('PASS: profile-only programs reconcile legacy SSR/public/Admin reads, edit/save private draft/switch/publish/reload, retain explicit empty lists, support re-add and inactive records, preserve career figures and all team roster/charter/count inputs. Actual handler + mocked authenticated Admin; no live writes.');
}finally{e?.close();process.off('unhandledRejection',onUnhandled);}

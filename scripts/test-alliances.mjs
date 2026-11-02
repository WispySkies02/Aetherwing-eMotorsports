import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {defaultAlliances,allianceIdFor,allianceFor,allianceName} from '../src/lib/alliances.mjs';
const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs'),siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const seed=content.seeds(),extra={id:'fixture-racing',name:'Fixture Racing',shortName:'Fixture'};
assert.equal(allianceIdFor({affiliation:'alliance'}),'starclutch-racing');
assert.equal(allianceIdFor({type:'alliance'}),'starclutch-racing');
assert.equal(allianceIdFor({affiliation:'alliance',allianceId:''}),'','An explicit cleared association never restores StarClutch');
assert.equal(allianceIdFor(null),'');assert.equal(allianceName({affiliation:'alliance'},[]),'Alliance');
assert.equal(allianceName({allianceId:extra.id},[extra]),'Fixture Racing');assert.equal(allianceName({allianceId:extra.id},[extra],true),'Fixture');
assert.equal(allianceFor({allianceId:'unknown'},defaultAlliances),null);
assert.equal(content.validate('alliances',seed.alliances),'');
assert.match(content.validate('alliances',[...seed.alliances,...seed.alliances]),/unique/);
for(const record of [{...extra,id:'Bad ID'},{...extra,id:'x'.repeat(81)},{...extra,name:''},{...extra,name:'x'.repeat(121)},{...extra,shortName:12},{...extra,name:'<img>'}])assert.notEqual(content.validate('alliances',[...seed.alliances,record]),'');
const emptyRelations={published:{drivers:[],competitions:[],'roster-profiles':[]}};
assert.equal(content.validate('alliances',[],emptyRelations),'','The catalog may be empty after all current relationships end');
assert.match(content.validate('alliances',[]),/still used.*Reassign or clear/);
const unknown={...seed.drivers[0],affiliation:'alliance',allianceId:'unknown'};
assert.match(content.validate('drivers',[unknown]),/unknown alliance/);
assert.match(content.validate('drivers',[{...unknown,allianceId:''}]),/choose a named alliance/);
const legacy=content.normalizeDriverAssignments([{id:'shared-kmart',affiliation:'alliance',allianceId:extra.id,number:'29',displayName:'Clutch / Eazy / Matty'}]);
assert.equal(legacy.length,3);assert.ok(legacy.every(row=>row.allianceId===extra.id),'Legacy split retains an explicitly chosen alliance');
assert.equal(content.normalize('alliances',[{...extra,name:' Fixture Racing ',shortName:' Fixture '}])[0].name,'Fixture Racing');

// Isolate persistence/build hooks in memory. No request reaches a live service.
let registry={version:1,revision:0,published:structuredClone(seed),drafts:{},history:[]},writes=0,hooks=0;
const module={exports:{}};
const source=fs.readFileSync(new URL('../netlify/lib/_site-admin.cjs',import.meta.url),'utf8');
new Function('require','module','exports','process','fetch',source)(name=>name==='./_content.cjs'?{
 ...content,read:async()=>({registry:structuredClone(registry),etag:'fixture-etag'}),write:async(next,etag)=>{assert.equal(etag,'fixture-etag');registry=structuredClone(next);writes++;}
}:siteRequire(name),module,module.exports,{env:{AETHERWING_BUILD_HOOK:'https://api.netlify.com/build_hooks/alliance-fixture'}},async input=>{assert.equal(String(input),'https://api.netlify.com/build_hooks/alliance-fixture');hooks++;return {ok:true};});
const actor={clientContext:{user:{email:'fixture@example.test',app_metadata:{roles:['admin']}}}};
async function action(action,dataset,data,revision=registry.revision){const result=await module.exports.handler({httpMethod:'POST',body:JSON.stringify({action,dataset,data,revision})},actor);return {status:result.statusCode,...JSON.parse(result.body)};}
async function reload(){const result=await module.exports.handler({httpMethod:'GET'},actor);assert.equal(result.statusCode,200);return JSON.parse(result.body).registry;}
const historicalKeys=['results','wins','standings','milestones','news','driver-portfolios'];
const histories=Object.fromEntries(historicalKeys.map(key=>[key,structuredClone(registry.published[key])]));
let result=await action('saveDraft','alliances',[...seed.alliances,extra]);assert.equal(result.status,200);
assert.deepEqual((await reload()).drafts.alliances.at(-1),extra);assert.deepEqual(registry.published.alliances,seed.alliances);assert.equal(hooks,0);
result=await action('discardDraft','alliances');assert.equal(result.status,200);assert.equal(registry.drafts.alliances,undefined);assert.equal(hooks,0);
result=await action('publish','alliances',[...seed.alliances,extra]);assert.equal(result.status,200);assert.equal(hooks,1);
const renamed={...extra,name:'Renamed Fixture Racing'};result=await action('publish','alliances',[...seed.alliances,renamed]);assert.equal(result.status,200);assert.equal((await reload()).published.alliances.at(-1).name,renamed.name);
result=await action('publish','alliances',seed.alliances);assert.equal(result.status,200);assert.deepEqual((await reload()).published.alliances,seed.alliances,'Unused alliances can be removed without seed resurrection');
const beforeStale=structuredClone(registry),beforeWrites=writes;
result=await action('saveDraft','alliances',[...seed.alliances,extra],registry.revision-1);assert.equal(result.status,409);assert.equal(writes,beforeWrites);assert.deepEqual(registry,beforeStale);
// A private reassignment can permit a private deletion draft, but not public deletion.
const reassign=rows=>rows.map(row=>({...row,...(Object.hasOwn(row,'affiliation')?{affiliation:'aetherwing'}:{}),...(Object.hasOwn(row,'type')?{type:'aetherwing',label:'Fixture direct program'}:{}),allianceId:''}));
const reassignedDrivers=reassign(seed.drivers),reassignedProfiles=reassign(seed['roster-profiles']),reassignedPrograms=reassign(seed.competitions);
for(const [dataset,data] of [['drivers',reassignedDrivers],['roster-profiles',reassignedProfiles],['competitions',reassignedPrograms]]){result=await action('saveDraft',dataset,data);assert.equal(result.status,200,`${dataset}: ${result.error}`);}
result=await action('saveDraft','alliances',[]);assert.equal(result.status,200);assert.deepEqual((await reload()).drafts.alliances,[]);
result=await action('publish','alliances',[]);assert.equal(result.status,400);assert.match(result.error,/still used/);assert.deepEqual(registry.published.alliances,seed.alliances,'Unpublished reassignment drafts cannot permit deleting the public alliance');
result=await action('publishAll');assert.equal(result.status,200,result.error);assert.deepEqual(registry.published.alliances,[]);assert.deepEqual(registry.drafts,{});
assert.deepEqual((await reload()).published.alliances,[],'An intentionally empty catalog survives Admin reload');
assert.deepEqual(registry.published.drivers,reassignedDrivers);assert.ok(registry.published.competitions.every(row=>row.type==='aetherwing'&&row.allianceId===''),'Explicit cleared Kmart relationship survives canonical seed repair');
for(const key of historicalKeys)assert.deepEqual(registry.published[key],histories[key],`${key}: alliance operations must preserve historical content`);
// Former profiles retain the recorded organization even after the active alliance ends.
const former=seed['roster-profiles'].find(row=>row.slug==='jaxon');
assert.equal(content.validate('roster-profiles',[former],{published:{drivers:[],alliances:[]}}),'');
assert.match(content.validate('roster-profiles',[{...former,slug:'new-person',allianceId:'unknown'}],{published:{drivers:[],alliances:[]}}),/unknown alliance/);
assert.match(content.validate('roster-profiles',[{...former,allianceId:'unknown'}],{published:{drivers:[],alliances:[]}}),/unknown alliance/);
// Create and select a new alliance after the final old entry was removed.
result=await action('publish','alliances',[extra]);assert.equal(result.status,200);
const selected={...registry.published.drivers[0],affiliation:'alliance',allianceId:extra.id};
result=await action('publish','drivers',[selected,...registry.published.drivers.slice(1)]);assert.equal(result.status,200,result.error);
result=await action('publish','alliances',[]);assert.equal(result.status,400);assert.match(result.error,/Fixture|Hailey|alliance/);
console.log('PASS: alliance models/validation, private drafts/reload/discard, create/rename/remove/empty/recreate, stale writes, in-use guards, public-vs-draft safety, atomic reassignment, former-profile history and unchanged historical collections.');

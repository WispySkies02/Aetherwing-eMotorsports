import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const root=new URL('../',import.meta.url);
const storage=new Map();
let storageDown=false, etagCounter=0, buildCount=0;
globalThis.netlifyBlobsContext=Buffer.from(JSON.stringify({siteID:'test-site',token:'fixture-token',edgeURL:'https://blobs.fixture',uncachedEdgeURL:'https://blobs.fixture'})).toString('base64');
process.env.AETHERWING_BUILD_HOOK='https://api.netlify.com/build_hooks/fixture';
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input instanceof Request?input.url:input);
  const headers=new Headers(options.headers);
  if(url.pathname==='/.netlify/identity/user') {
    const role=headers.get('authorization')?.replace('Bearer ','');
    if(role==='expired')return new Response('{}',{status:401});
    return Response.json({id:'fixture-user',email:'admin@example.test',app_metadata:{roles:role==='fake-role'?[]:[role]},user_metadata:{roles:['admin']}});
  }
  if(url.hostname==='api.netlify.com'&&url.pathname.startsWith('/build_hooks/')){buildCount++;return Response.json({ok:true});}
  if(url.hostname==='blobs.fixture') {
    if(storageDown)return new Response('Fixture storage unavailable',{status:400});
    const key=url.pathname,prior=storage.get(key);
    if(options.method?.toUpperCase()==='PUT') {
      if(headers.get('if-none-match')==='*'&&prior || headers.has('if-match')&&headers.get('if-match')!==prior?.etag)return new Response('',{status:412});
      const value=JSON.parse(options.body),etag=`fixture-${++etagCounter}`;
      storage.set(key,{value,etag});return new Response('',{status:200,headers:{etag}});
    }
    if(!prior)return new Response('Not found',{status:404});
    return Response.json(prior.value,{headers:{etag:prior.etag}});
  }
  throw new Error(`Unexpected outbound request in test: ${url.hostname}`);
};
const paintAdmin=(await import('../netlify/functions/paint-admin.mjs')).default;
const paintData=(await import('../netlify/functions/paint-data.mjs')).default;
const siteAdmin=(await import('../netlify/functions/site-admin.mjs')).default;
const siteData=(await import('../netlify/functions/site-data.mjs')).default;
async function call(handler,body,role='admin',method=body?'POST':'GET') {
  const response=await handler(new Request('https://aetherwing.net/.netlify/functions/test',{method,headers:{...(role?{authorization:`Bearer ${role}`} : {}),'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));
  return {status:response.status,body:await response.json()};
}
const paint={slug:'fixture-paint',sponsor:'Fixture Paint',leagues:['nrrs'],leagueName:'NRRS',driver:'Hailey',username:'@Aokikoto',number:'32',manufacturer:'Toyota',body:'Camry',image:'https://example.test/paint.png',schemeId:'123456789',tags:[],special:['patriotic','crownjewel'],scrAffiliate:true,dash4Cash:true,chase:true,throwback:true,specialPaint:true};
assert.equal((await call(paintAdmin,{action:'savePaint',paint},null)).status,403);
assert.equal((await call(paintAdmin,{action:'savePaint',paint},'fake-role')).status,403);
assert.equal((await call(paintAdmin,{action:'savePaint',paint},'expired')).status,403);
assert.equal((await call(paintAdmin,{action:'savePaint',paint:{...paint,image:'javascript:alert(1)'}})).status,400);
let response=await call(paintAdmin,{action:'savePaint',paint,status:'draft'});
assert.equal(response.status,200);assert.equal(response.body.registry.drafts.length,1);
assert.equal(response.body.registry.drafts[0].scrAffiliate,true);assert.ok(response.body.registry.drafts[0].special.includes('starclutch'));
assert.equal(response.body.registry.drafts[0].dash4Cash,true);assert.ok(response.body.registry.drafts[0].special.includes('dash4cash'));
assert.equal(response.body.registry.drafts[0].chase,true);assert.ok(response.body.registry.drafts[0].special.includes('chase'));
assert.equal(response.body.registry.drafts[0].throwback,true);assert.ok(response.body.registry.drafts[0].special.includes('throwback'));
assert.equal(response.body.registry.drafts[0].specialPaint,true);assert.ok(response.body.registry.drafts[0].special.includes('special'));
assert.ok(response.body.registry.drafts[0].special.includes('patriotic'));assert.ok(response.body.registry.drafts[0].special.includes('crownjewel'));
assert.equal((await call(paintAdmin)).body.registry.drafts.length,1);
assert.equal((await call(paintData,undefined,null)).body.paints.length,35);
response=await call(paintAdmin,{action:'savePaint',paint,priorSlug:paint.slug,status:'published'},'paint-admin');
assert.equal(response.status,200);
assert.equal((await call(paintData,undefined,null)).body.paints.length,36);
assert.equal((await call(paintData,undefined,null)).body.paints.find((item)=>item.slug===paint.slug).scrAffiliate,true);
assert.equal((await call(paintAdmin,{action:'savePaint',paint})).status,409);
assert.equal((await call(paintAdmin,{action:'setFeature',feature:{slugs:[paint.slug,'d1-ironmouse'],series:'NRRS',race:'Fixture 400',track:'Fixture Raceway',date:'2099-01-01'}})).status,200);
assert.deepEqual((await call(paintData,undefined,null)).body.feature.slugs,[paint.slug,'d1-ironmouse']);
assert.equal((await call(paintAdmin,{action:'savePaint',paint:{...paint,slug:'fixture-renamed'},priorSlug:paint.slug})).status,200);
assert.deepEqual((await call(paintData,undefined,null)).body.feature.slugs,['fixture-renamed','d1-ironmouse']);
assert.equal((await call(paintAdmin,{action:'archivePaint',slug:'fixture-renamed'})).status,200);
response=await call(paintData,undefined,null);assert.equal(response.body.paints.length,35);assert.deepEqual(response.body.feature.slugs,['d1-ironmouse']);
assert.equal((await call(paintAdmin,{action:'clearFeature'})).status,200);
assert.equal((await call(paintAdmin,{action:'archivePaint',slug:'fixture-renamed',archived:false})).status,200);
const seedPaint=require('../data/paint-seed.json').paints.find((item)=>item.slug==='d1-ironmouse');
const editedSeed={...seedPaint,sponsor:'Ironmouse Admin Edit',leagueName:'NRRS'};
assert.equal((await call(paintAdmin,{action:'savePaint',paint:editedSeed,priorSlug:seedPaint.slug,status:'published'})).status,200);
response=await call(paintData,undefined,null);
assert.equal(response.body.paints.length,36);
assert.equal(response.body.paints.find((item)=>item.slug===seedPaint.slug).sponsor,'Ironmouse Admin Edit');
assert.equal((await call(paintAdmin,{action:'savePaint',paint:{...editedSeed,slug:'renamed-seed'},priorSlug:seedPaint.slug,status:'published'})).status,400);
assert.equal((await call(paintAdmin,{action:'archivePaint',slug:seedPaint.slug})).status,400);
assert.equal((await call(siteAdmin,undefined,'paint-admin')).status,403);
response=await call(siteAdmin);assert.equal(response.status,200);
const seeds=response.body.seeds;
const content=require('../netlify/lib/_content.cjs');
for(const [key,data] of Object.entries(seeds))assert.equal(content.validate(key,data),'',key);
const numberArtDrivers=structuredClone(seeds.drivers);numberArtDrivers[0].numberImage='https://example.test/number-32.png';
assert.equal(content.validate('drivers',numberArtDrivers),'','Driver assignments should accept HTTPS number artwork');
numberArtDrivers[0].numberImage='data:image/webp;base64,UklGRg==';assert.equal(content.validate('drivers',numberArtDrivers),'','Driver assignments should accept uploaded WebP artwork');
numberArtDrivers[0].numberImage='javascript:alert(1)';assert.notEqual(content.validate('drivers',numberArtDrivers),'','Driver number artwork must reject unsafe URLs');
// Known scoring systems must include stage points automatically instead of relying on a hand-entered total.
const nrrsScored=content.scoreKnownRace({league:'nrrs',entries:[{driver:'Fixture',finish:5,stage1Finish:2,stage2Finish:4,bonusPoints:0,pointsEligible:true}]});
assert.deepEqual([nrrsScored.entries[0].finishPoints,nrrsScored.entries[0].stage1Points,nrrsScored.entries[0].stage2Points,nrrsScored.entries[0].racePoints],[32,9,7,48],'NRRS total must include finish + both stage awards');
const uarlScored=content.scoreKnownRace({league:'uarl-d1',entries:[{driver:'Taylor',finish:3,stage1Finish:1,stage2Finish:1,bonusPoints:3,pointsEligible:true},{driver:'Substitute',finish:1,stage1Finish:1,stage2Finish:1,bonusPoints:0,pointsEligible:false}]});
assert.deepEqual([uarlScored.entries[0].finishPoints,uarlScored.entries[0].stage1Points,uarlScored.entries[0].stage2Points,uarlScored.entries[0].racePoints],[42,5,5,55],'UARL D1 scoring must include stage points and official bonus/adjustment points');
assert.equal(uarlScored.entries[1].racePoints,0,'Ineligible UARL entries must not receive championship points');
// Regression fixtures for adding/editing UARL identities: usernames are ordinary editable profile data, not a hard-coded roster whitelist.
const identityProfiles=structuredClone(seeds['roster-profiles']);
for(const [slug,name,user] of [['jayden-fixture','Jayden','@Kanevme'],['hayden-fixture','Hayden','@fixture_hayden'],['max-fixture','Max','@fixture_max']]) identityProfiles.push({...structuredClone(seeds['roster-profiles'][0]),slug,name,handle:user,robloxDisplayName:name,robloxUsername:user,numbers:'11',programs:['UARL D1']});
assert.equal(content.validate('roster-profiles',identityProfiles),'','Roster editor must accept newly added drivers and Roblox usernames');
const portfolioFixture=structuredClone(seeds['driver-portfolios']);portfolioFixture.push({id:'jayden-fixture',profile:'jayden-fixture',name:'Jayden',handle:'@Kanevme',label:'Driver Brand / Livery Portfolio',order:99,brands:[{name:'Fixture Brand',logo:'https://example.test/fixture.png',order:1}]});
assert.equal(content.validate('driver-portfolios',portfolioFixture),'','Newly added drivers must support published personal-partner portfolios');
const partnerFixture=structuredClone(seeds.partners);partnerFixture[0].logo='data:image/webp;base64,UklGRg==';assert.equal(content.validate('partners',partnerFixture),'','Team partner logo uploads must validate through the publication API');
let revision=response.body.registry.revision;
// Regression: current unsaved form data can publish directly without a separate saveDraft request.
const directSchedule=structuredClone(seeds['schedule-events']);
directSchedule[0].title='Direct Publication Fixture';
directSchedule.push({...structuredClone(directSchedule[0]),title:'Auto-Placed Early Fixture',league:'uarl-d1',leagueName:'UARL Division 1',time:'6:00 PM ET'});
let direct=await call(siteAdmin,{action:'publish',dataset:'schedule-events',data:directSchedule,revision});
assert.equal(direct.status,200);revision=direct.body.registry.revision;
assert.equal(direct.body.publication.dataPublished,true);
const placedSchedule=(await call(siteData,undefined,null)).body.datasets['schedule-events'];
assert.equal(placedSchedule[0].title,'Auto-Placed Early Fixture','New races should be placed by date and parsed 12-hour start time');
assert.equal(placedSchedule[1].title,'Direct Publication Fixture');
assert.deepEqual([
  {date:'2099-01-01',time:'8:00 PM ET',league:'kmart',title:'Late'},
  {date:'2099-01-01',time:'11:30 AM ET',league:'sunoco',title:'Early'},
  {date:'2099-01-01',time:'8:00 PM ET',league:'nrrs',title:'League tie'}
].sort(content.compareScheduleEvents).map((event)=>event.title),['Early','League tie','Late'],'Schedule ordering should use time then league for same-day ties');
for(const [key,data] of Object.entries(seeds)) {
  const beforeDraft=(await call(siteData,undefined,null)).body.datasets[key];
  const draft=await call(siteAdmin,{action:'saveDraft',dataset:key,data,revision});assert.equal(draft.status,200,`${key} draft`);revision=draft.body.registry.revision;
  assert.deepEqual((await call(siteData,undefined,null)).body.datasets[key],beforeDraft,'Draft must remain private');
  const published=await call(siteAdmin,{action:'publish',dataset:key,revision});assert.equal(published.status,200,`${key} publish`);revision=published.body.registry.revision;
  assert.deepEqual((await call(siteData,undefined,null)).body.datasets[key],content.normalize(key,data));
}
// Multiple saved drafts publish atomically and queue only one rebuild.
for(const key of ['wins','milestones']) {
  const draft=await call(siteAdmin,{action:'saveDraft',dataset:key,data:seeds[key],revision});assert.equal(draft.status,200);revision=draft.body.registry.revision;
}
const all=await call(siteAdmin,{action:'publishAll',revision});assert.equal(all.status,200);revision=all.body.registry.revision;
assert.deepEqual(all.body.publication.datasets,['wins','milestones']);
assert.equal(Object.keys(all.body.registry.drafts).length,0);
assert.equal(buildCount,Object.keys(seeds).length+2);
assert.equal((await call(siteAdmin,{action:'saveDraft',dataset:'wins',data:seeds.wins,revision:0})).status,409);
assert.notEqual(content.validate('news',seeds.news.map((s)=>({...s,featured:false}))), '');
assert.notEqual(content.validate('roster-profiles', [{...seeds['roster-profiles'][0],name:'<script>alert(1)</script>'}]),'');
const oldConsole=console.error;console.error=()=>{};storageDown=true;
assert.equal((await call(paintAdmin)).status,500);
assert.equal((await call(siteData,undefined,null)).status,503);storageDown=false;console.error=oldConsole;
// The read-only Paint Booth must consume central publication without owning individual share routes.
const publicRegistry=(await call(paintData,undefined,null)).body;
const boothRoot=process.env.AETHERWING_PAINT_PROJECT?path.resolve(process.env.AETHERWING_PAINT_PROJECT):fileURLToPath(new URL('../../aetherwing_paint_public/',import.meta.url));
if (fs.existsSync(path.join(boothRoot,'netlify/functions/paint-data.cjs'))) {
globalThis.fetch=async(input)=>{assert.equal(String(input),'https://aetherwing.net/api/paints');return Response.json(publicRegistry);};
const boothData=require(path.join(boothRoot,'netlify/functions/paint-data.cjs'));
assert.equal((await boothData.handler({httpMethod:'GET'})).statusCode,200);
assert.ok(!fs.existsSync(path.join(boothRoot,'netlify/functions/paint-share.cjs')),'Per-paint embed routes should be removed.');
globalThis.fetch=async()=>{throw Error('Fixture outage');};console.error=()=>{};
assert.equal((await boothData.handler({httpMethod:'GET'})).statusCode,503);console.error=oldConsole;
} else console.log('Booth integration test skipped: set AETHERWING_PAINT_PROJECT to the extracted Booth project to include it.');
globalThis.fetch=nativeFetch;
for(const filename of ['paint-ops-admin.js','content-admin.js'])new vm.Script(fs.readFileSync(new URL(`public/admin/${filename}`,root),'utf8'));
console.log(`PASS: verified-login/role guards, persisted draft/publish/reload, paint feature/rename/archive, all ${Object.keys(seeds).length} content sections, private drafts, stale-write protection, safe storage errors, and the public booth proxy. Tests used mock Identity/storage, not the live account.`);

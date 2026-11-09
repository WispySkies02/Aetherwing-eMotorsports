import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {eventSlug,legacyEventSlug} from '../src/lib/schedule-events.mjs';
import {reconcileNovemberSchedule,reconcileNovemberStandings} from '../src/lib/november-racing-context.mjs';
import {reconcileCharterPlans} from '../src/lib/charter-plans.mjs';
import {appendReviewedResults} from '../src/lib/reviewed-results.mjs';
import {alliancePrograms,preserveAllianceRelationship} from '../src/lib/alliance-content.mjs';
import {reconcileTeamPartners} from '../src/lib/team-partner-content.mjs';

const require=createRequire(import.meta.url),seed=require('../netlify/lib/_content.cjs').seeds();
const event={league:'kmart',leagueName:'NASCAR Kmart Auto Parts Series',date:'2026-11-02',round:'ROUND 11',title:'MasterPro Milwaukee Mile 200',track:'Milwaukee',time:'8:30 PM ET',status:'Regular Season',specialTag:'',entries:[{assignmentId:'wispy-kmart',driver:'Hailey',number:'15',entryStatus:'Confirmed'}]};
const mexico={...event,date:'2026-11-09',round:'ROUND 12',title:'Corona Mexico 250',track:'Mexico City'};
const board={id:'kmart',league:'kmart',title:'Kmart Cup Driver Standings',subtitle:'After Round 12 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble',featuredOnHome:true,homeTable:'regular',lastResultDate:'2026-09-28',lastResultScheduleId:'2026-09-28-kmart-brembo-performance-200',autoPoints:true,autoUpdateNote:'Approved prior result',rows:[{driver:'Hailey',number:'15',position:'P1',points:810,delta:'+300',chaseLocked:true,regularSeasonChampion:false,highlight:true}],chaseRows:[]};
const clone=structuredClone;
const events=[...clone(seed['schedule-events']).filter(row=>row.league!=='kmart'||row.round!=='ROUND 11'),event,mexico];
const boards=[...clone(seed.standings).filter(row=>row.id!=='kmart'),board];
const before=clone({events,boards}),fixedEvents=reconcileNovemberSchedule(events),fixedBoards=reconcileNovemberStandings(boards);
const fixed=fixedEvents.find(row=>row===event||row.league==='kmart'&&row.date==='2026-11-02'&&row.round==='ROUND 11');
assert.deepEqual(fixed,{...event,title:'MasterPro Iowa 200',track:'Iowa Speedway'},'Only the confirmed obsolete R11 venue/name change');
assert.equal(eventSlug(event),'kmart-round-11');assert.equal(eventSlug(fixed),eventSlug(event),'The stable event route remains unchanged');
assert.equal(fixed.entries,event.entries,'Approved event entry snapshots are retained');assert.equal(fixed.time,event.time);assert.equal(fixed.round,'ROUND 11');assert.equal(fixed.date,'2026-11-02');
assert.equal(legacyEventSlug(fixed),'2026-11-02-kmart-masterpro-iowa-200','Legacy title-based alias may differ; the existing stable route is authoritative');
for(let index=0;index<events.length;index++)if(events[index]!==event)assert.equal(fixedEvents[index],events[index],'Every unrelated calendar record is unchanged');
const fixedBoard=fixedBoards.find(row=>row.id==='kmart');
assert.deepEqual(fixedBoard,{...board,subtitle:'After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble'});
assert.equal(fixedBoard.rows,board.rows);assert.equal(fixedBoard.chaseRows,board.chaseRows,'No point values, driver flags or table arrays are regenerated');
assert.equal(fixedBoard.lastResultDate,board.lastResultDate);assert.equal(fixedBoard.lastResultScheduleId,board.lastResultScheduleId,'A caption correction cannot mark a missing race as applied');
assert.equal(fixedBoard.featuredOnHome,true);assert.equal(fixedBoard.homeTable,'regular');
for(let index=0;index<boards.length;index++)if(boards[index]!==board)assert.equal(fixedBoards[index],boards[index],'Other league snapshots retain their exact records');
assert.deepEqual(reconcileNovemberSchedule(fixedEvents),fixedEvents);assert.deepEqual(reconcileNovemberStandings(fixedBoards),fixedBoards,'Repeated reads are idempotent');
assert.deepEqual({events,boards},before,'The correction does not mutate supplied publication data');

for(const changed of [
  {...event,league:'nrrs'},
  {...event,date:'2026-10-26'},
  {...event,date:'2027-11-02'},
  {...event,round:'ROUND 12'},
  {...event,eventId:'custom-later-approved-event'},
  {...event,title:'Later approved Iowa event title'},
  {...event,track:'Later approved track'},
  {...event,title:'MasterPro Iowa 200',track:'Iowa Speedway'}
])assert.equal(reconcileNovemberSchedule([changed])[0],changed,'Later edits, other identities and the older seeded date are not repaired');
for(const field of ['routeId','eventId']){
  const explicit={...event,[field]:'kmart-round-11'},next=reconcileNovemberSchedule([explicit])[0];
  assert.equal(next[field],explicit[field]);assert.equal(eventSlug(next),'kmart-round-11','An explicit stable event ID survives the venue correction');
}
for(const changed of [
  {...board,id:'another-board'},
  {...board,league:'nrrs'},
  {...board,subtitle:'After Round 12 of 23 · Mexico City · Nov. 9, 2026 · Chase Bubble'},
  {...board,subtitle:'After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble'},
  {...board,subtitle:'Later approved snapshot context'}
])assert.equal(reconcileNovemberStandings([changed])[0],changed,'Only the identified erroneous Kmart caption is repaired');
const olderSeed=seed['schedule-events'].find(row=>row.league==='kmart'&&row.round==='ROUND 11');
assert.equal(reconcileNovemberSchedule([olderSeed])[0],olderSeed,'The pure read repair does not migrate the unreviewed older seed table');
for(const value of [null,{},'invalid']){assert.equal(reconcileNovemberSchedule(value),value);assert.equal(reconcileNovemberStandings(value),value,'Invalid section shapes remain available for strict schema rejection');}
assert.deepEqual(reconcileNovemberSchedule(),[]);assert.deepEqual(reconcileNovemberStandings(),[]);

// The same narrowly scoped repairs must reach SSR, the public feed, build sync
// and authenticated Admin reads. All storage is isolated in this process.
const content=require('../netlify/lib/_content.cjs'),api=require('../netlify/lib/_site-data.cjs')._test;
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const november=JSON.parse(read('../src/data/november-2026-results.json'));
const oldResults=clone(seed.results).filter(result=>!november.approvedResultIds.includes(result.scheduleId)).map((result,index)=>({...result,featured:index===0}));
const legacyCharters=clone(seed.charters);delete legacyCharters.find(row=>row.id==='nrrs').plannedSeasons;
const oldPublished={'schedule-events':[event,mexico],standings:[board],charters:legacyCharters,results:oldResults};
const withoutFeature=({featured,...record})=>record;
const assertReviewed=(datasets)=>{
  assert.equal(datasets['schedule-events'].find(row=>row.round==='ROUND 11').title,'MasterPro Iowa 200');
  assert.equal(datasets['schedule-events'].find(row=>row.round==='ROUND 12').date,'2026-11-09');
  assert.deepEqual(datasets.standings,[{...board,subtitle:'After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble'}],'Read/build repair does not change points or applied-result bookkeeping');
  const nrrs=datasets.charters.find(row=>row.id==='nrrs');assert.deepEqual(nrrs.plannedSeasons,seed.charters.find(row=>row.id==='nrrs').plannedSeasons);
  assert.deepEqual(nrrs.fullTime,legacyCharters.find(row=>row.id==='nrrs').fullTime);assert.deepEqual(nrrs.openCharters,legacyCharters.find(row=>row.id==='nrrs').openCharters,'The 2027 plan is never made active');
  for(const id of november.approvedResultIds){assert.equal(datasets.results.filter(row=>row.scheduleId===id).length,1);assert.deepEqual(withoutFeature(datasets.results.find(row=>row.scheduleId===id)),withoutFeature(seed.results.find(row=>row.scheduleId===id)));}
  assert.deepEqual(datasets.results.filter(row=>row.featured).map(row=>row.scheduleId),['kmart-round-11'],'Iowa becomes the sole automatic Latest Result');
  for(const prior of oldResults)assert.deepEqual(withoutFeature(datasets.results.find(row=>row.scheduleId===prior.scheduleId)),withoutFeature(prior),'Existing historical results and points are not replaced or rescored');
};
const apiView=api.mergeCanonical(clone(oldPublished));assertReviewed(apiView);assertReviewed(api.mergeCanonical(clone(apiView)));

const syncSource=read('./sync-admin-content.mjs'),syncBlock=syncSource.slice(syncSource.indexOf('function ensureCoreTeamPartners'),syncSource.indexOf('function readBundledOverlay')).replaceAll('import.meta.url','scriptUrl');
const buildView=new Function('scriptUrl','alliancePrograms','preserveAllianceRelationship','reconcileTeamPartners','appendReviewedResults','reconcileNovemberSchedule','reconcileNovemberStandings','reconcileCharterPlans',`${syncBlock}\nreturn canonicalizeBuildContent;`)(new URL('./sync-admin-content.mjs',import.meta.url).href,alliancePrograms,preserveAllianceRelationship,reconcileTeamPartners,appendReviewedResults,reconcileNovemberSchedule,reconcileNovemberStandings,reconcileCharterPlans);
const buildInput={version:1,revision:123,datasets:clone(oldPublished)},buildBefore=clone(buildInput);
assertReviewed((await buildView(buildInput)).datasets);assert.deepEqual(buildInput,buildBefore,'Build preparation is pure and the test never invokes the writing sync entrypoint');

const ssrSource=read('../src/lib/site-content.mjs');
const ssrSchedule=ssrSource.slice(ssrSource.indexOf('const publishedSchedule ='),ssrSource.indexOf('export const siteSettings =')).replace('export const scheduleEvents =','const scheduleEvents =');
const ssrStandings=ssrSource.slice(ssrSource.indexOf('const publishedStandings ='),ssrSource.indexOf('export const milestones =')).replace('export const standings =','const standings =');
const ssrCharters=ssrSource.slice(ssrSource.indexOf('const normalizeCharters ='),ssrSource.indexOf('export const iracingGarage =')).replace('export const charters =','const charters =');
const ssrView=datasets=>new Function('choose','scheduleSeed','standingsSeed','chartersSeed','reconcileNovemberSchedule','reconcileNovemberStandings','reconcileCharterPlans',`${ssrSchedule}\n${ssrStandings}\n${ssrCharters}\nreturn {'schedule-events':scheduleEvents,standings,charters};`)((key,fallback)=>datasets[key]??fallback,seed['schedule-events'],seed.standings,seed.charters,reconcileNovemberSchedule,reconcileNovemberStandings,reconcileCharterPlans);
const ssr=ssrView(clone(oldPublished));
assert.deepEqual(ssr['schedule-events'],apiView['schedule-events']);assert.deepEqual(ssr.standings,apiView.standings);assert.deepEqual(ssr.charters,apiView.charters,'Generated pages use the same targeted caption and missing plan metadata');

let writes=0;const stored={version:1,revision:123,published:clone(oldPublished),drafts:{'schedule-events':[{...event,title:'Private schedule edit'}],standings:[{...board,subtitle:'Private snapshot edit'}],charters:[],results:[]},history:[]},storedBefore=clone(stored);
const module={exports:{}},adminRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
new Function('require','module','exports','process','fetch',read('../netlify/lib/_site-admin.cjs'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'november-read-fixture'}),write:async()=>{writes++;assert.fail('Read reconciliation cannot write the registry');}}:adminRequire(name),module,module.exports,{env:{}},()=>assert.fail('Read reconciliation cannot contact or deploy to a service'));
const actor={clientContext:{user:{email:'november-read@example.test',app_metadata:{roles:['admin']}}}};
const denied=await module.exports.handler({httpMethod:'GET'},{});assert.equal(denied.statusCode,403);
const response=await module.exports.handler({httpMethod:'GET'},actor);assert.equal(response.statusCode,200);const admin=JSON.parse(response.body).registry;
assertReviewed(admin.published);assert.deepEqual(admin.drafts,stored.drafts,'Read repairs do not expose or rewrite private drafts');assert.deepEqual(stored,storedBefore);assert.equal(writes,0);

for(const charters of [[],legacyCharters.filter(row=>row.id!=='nrrs'),legacyCharters.map(row=>row.id==='nrrs'?{...row,plannedSeasons:[]}:row),legacyCharters.map(row=>row.id==='nrrs'?{...row,plannedSeasons:[{year:2028,season:5,status:'planned',numbers:['47'],sourceDate:'2027-01-01',sourceNote:'Later approved plan'}]}:row)]){
  const dataset={...clone(oldPublished),charters:clone(charters)};
  for(const result of [api.mergeCanonical(clone(dataset)),(await buildView({datasets:clone(dataset)})).datasets,ssrView(clone(dataset))])assert.deepEqual(result.charters,charters,'Explicit plan clearing, later edits or board removal stay authoritative in every public/build path');
  stored.published=clone(dataset);
  const next=JSON.parse((await module.exports.handler({httpMethod:'GET'},actor)).body).registry;assert.deepEqual(next.published.charters,charters,'Admin reads do not restore explicitly removed planning data');
}
const existingIowa={...clone(seed.results.find(row=>row.scheduleId==='kmart-round-11')),scheduleId:'approved-iowa-correction',title:'Later approved Iowa result title',sourceNote:'Later approved result edit',entries:[{driver:'Hailey',number:'15',finish:4,racePoints:null,finishStatus:''}]};
stored.published={...clone(oldPublished),results:[...clone(oldResults),existingIowa]};
for(const dataset of [api.mergeCanonical(clone(stored.published)),(await buildView({datasets:clone(stored.published)})).datasets,JSON.parse((await module.exports.handler({httpMethod:'GET'},actor)).body).registry.published]){
  assert.equal(dataset.results.filter(row=>row.league==='kmart'&&row.round==='ROUND 11').length,1,'A differently linked but same approved event is not duplicated');
  assert.deepEqual(withoutFeature(dataset.results.find(row=>row.scheduleId===existingIowa.scheduleId)),withoutFeature(existingIowa),'A later same-event result remains authoritative');
}
assert.equal(writes,0);
console.log('PASS: targeted November context across public/SSR/build/Admin reads; stable routes, missing approved archive results, one Latest Result, unchanged scores/drafts/current charters, idempotence and authoritative later edits/removals.');

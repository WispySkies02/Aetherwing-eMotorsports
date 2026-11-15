import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {appendReviewedResults,sameReviewedEvent} from '../src/lib/reviewed-results.mjs';
import {reconcileNovemberStandings} from '../src/lib/november-racing-context.mjs';
import {resultFinishLabel,resultPointsLabel} from '../src/lib/result-display.mjs';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs');
const seed=content.seeds(),clone=structuredClone;
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const mexico=seed.results.find(race=>race.scheduleId==='kmart-round-12');
assert.ok(mexico,'The owner-approved November 9 result is present');
assert.deepEqual([mexico.date,mexico.round,mexico.title,mexico.track],['2026-11-09','ROUND 12','Corona Mexico 250','Mexico City']);
assert.deepEqual([mexico.pointsSource,mexico.coverage,mexico.standingsMode],['official-result','team-only','record-only']);
assert.match(mexico.sourceNote,/Owner-approved November 15, 2026/);
assert.ok(!mexico.sourceUrl,'The November 7 pre-race interview is not misrepresented as a race-result source');
assert.deepEqual(mexico.entries.map(({assignmentId,driver,number,finish})=>({assignmentId,driver,number,finish})),[
  {assignmentId:'wispy-kmart',driver:'Hailey',number:'15',finish:6},
  {assignmentId:'will-kmart',driver:'Will',number:'24',finish:1}
]);
assert.deepEqual(mexico.entries.map(entry=>entry.manufacturer),['Dodge',''],'An unreported manufacturer is not inferred for Will');
for(const entry of mexico.entries){
  for(const field of ['start','stage1Finish','stage1Points','stage2Finish','stage2Points','racePoints'])assert.equal(entry[field],null,`${entry.driver}: ${field} is unreported`);
  assert.equal(resultPointsLabel(entry.racePoints),'—');
  assert.ok(!Object.hasOwn(entry,'finishPoints')&&!Object.hasOwn(entry,'bonusPoints'));
}
assert.deepEqual(mexico.entries.map(resultFinishLabel),['P6','P1']);
assert.deepEqual(content.scoreKnownRace(mexico),mexico,'Official archive rows cannot acquire calculated points');
assert.equal(content.validate('results',seed.results),'');
assert.deepEqual(content.normalize('results',[mexico])[0].entries,mexico.entries);
const will=seed.drivers.find(assignment=>assignment.id==='will-kmart');
assert.deepEqual([will.profile,will.number,will.affiliation,will.allianceId],['will','24','alliance','starclutch-racing']);
const approvals=JSON.parse(read('../src/data/november-2026-results.json'));
assert.ok(approvals.approvedResultIds.includes(mexico.scheduleId));
assert.ok(approvals.subsequentApprovals.some(approval=>approval.sourceDate==='2026-11-15'&&approval.approvedResultIds.includes(mexico.scheduleId)));
assert.ok(approvals.pendingSources.some(source=>source.eventId==='kmart-2026-10-26'&&source.status==='awaiting-official-results'),'No missing All-Star result is invented');
const iowa=seed.results.find(race=>race.scheduleId==='kmart-round-11');
assert.deepEqual([iowa.date,iowa.track,iowa.entries[0].finish,iowa.entries[0].racePoints],['2026-11-02','Iowa Speedway',4,null]);
for(const id of ['nrrs-round-22','nrrs-round-23','nrrs-round-24','nrrs-round-25'])assert.ok(seed.results.some(race=>race.scheduleId===id),`${id}: approved NRRS history remains present`);

const oldCaption='After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble';
const newCaption='After Round 12 of 23 · Mexico City · Nov. 9, 2026 · Chase Bubble';
const board={...clone(seed.standings.find(board=>board.id==='kmart')),subtitle:oldCaption,featuredOnHome:true,
  lastResultDate:'2026-09-28',lastResultScheduleId:'2026-09-28-kmart-brembo-performance-200',
  rows:[{driver:'Hailey',number:'15',points:678,position:'P1',highlight:true,positionChange:0,chaseLocked:true,regularSeasonChampion:false},
    {driver:'Will',number:'24',points:390,position:'P2',highlight:false,positionChange:0}],
  chaseRows:[]};
const before=clone(board),corrected=reconcileNovemberStandings([board])[0];
assert.deepEqual(corrected,{...board,subtitle:newCaption});
assert.equal(corrected.rows,board.rows);assert.equal(corrected.chaseRows,board.chaseRows);
assert.deepEqual(board,before,'Caption repair does not mutate its input');
assert.equal(reconcileNovemberStandings([corrected])[0],corrected,'Corrected snapshots are idempotent');
const earlierBad='After Round 12 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble';
assert.equal(reconcileNovemberStandings([{...board,subtitle:earlierBad}])[0].subtitle,newCaption,'Both observed stages of the obsolete Iowa caption are recognized');
assert.equal(reconcileNovemberStandings([{...board,subtitle:earlierBad,rows:[{driver:'Hailey',number:'15',points:810}]}])[0].subtitle,oldCaption,'The earlier November 8 Iowa R11 correction remains distinct');
for(const changed of [
  {...board,id:'another-board'},
  {...board,league:'nrrs'},
  {...board,subtitle:'Later approved custom snapshot caption'},
  {...board,subtitle:'After Round 13 of 23 · Naval Base Coronado · Nov. 16, 2026'},
  {...board,rows:[{driver:'Hailey',number:'15',points:679}]},
  {...board,rows:[{driver:'Other driver',number:'15',points:678}]},
  {...board,rows:[{driver:'Hailey',number:'28',points:678}]},
  {...board,rows:null}
])assert.equal(reconcileNovemberStandings([changed])[0],changed,'Other identities, scores, shapes and later captions remain authoritative');
const bundledKmart=seed.standings.find(board=>board.id==='kmart');
assert.equal(reconcileNovemberStandings([bundledKmart])[0],bundledKmart,'The older September seed is not relabeled as a November snapshot');

const olderResults=clone(seed.results.filter(race=>race.scheduleId!==mexico.scheduleId));
const resultsBefore=clone(olderResults),appended=appendReviewedResults(olderResults,seed.results);
assert.deepEqual(olderResults,resultsBefore);assert.equal(appended.filter(race=>sameReviewedEvent(race,mexico)).length,1);
assert.deepEqual(appendReviewedResults(appended,seed.results),appended,'Approved record appending is idempotent');
const later={...clone(mexico),scheduleId:'later-approved-mexico-record',sourceNote:'Later approved source note',summary:'Later approved result correction'};
assert.equal(sameReviewedEvent(later,mexico),true);
assert.deepEqual(appendReviewedResults([...olderResults,later],seed.results).filter(race=>sameReviewedEvent(race,mexico)),[later],'Existing published same-event corrections win even with a different event link');
const registry={published:{standings:[clone(board)]}};
assert.equal(require('../netlify/lib/_site-admin.cjs')._test.autoAdvanceStandings(registry,[clone(mexico)],[]),false);
assert.deepEqual(registry.published.standings,[board],'Unknown archive points cannot advance totals, movement, flags or scoring cursors');

const oldPublished={standings:[clone(board)],results:clone(olderResults)};
const publicView=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(clone(oldPublished));
assert.deepEqual(publicView.standings,[corrected]);
assert.deepEqual(publicView.results.find(race=>race.scheduleId===mexico.scheduleId).entries,mexico.entries);
assert.deepEqual(publicView.results.filter(race=>race.featured).map(race=>race.scheduleId),['kmart-round-12']);
for(const prior of olderResults){
  const {featured,...record}=prior,{featured:currentFeature,...current}=publicView.results.find(race=>race.scheduleId===prior.scheduleId);
  assert.deepEqual(current,record,'All earlier archive facts survive the new automatic Latest Result');
}
const ssrSource=read('../src/lib/site-content.mjs');
const ssrStandings=ssrSource.slice(ssrSource.indexOf('const publishedStandings ='),ssrSource.indexOf('export const milestones =')).replace('export const standings =','const standings =');
const ssrView=new Function('choose','standingsSeed','reconcileNovemberStandings',`${ssrStandings}\nreturn standings;`)((key,fallback)=>oldPublished[key]??fallback,seed.standings,reconcileNovemberStandings);
assert.deepEqual(ssrView,publicView.standings,'SSR and the public API agree on the same precise caption repair');

let writes=0;
const stored={version:1,revision:15,published:clone(oldPublished),drafts:{standings:[{...clone(board),subtitle:'Private draft caption'}],results:[]},history:[]},storedBefore=clone(stored);
const module={exports:{}},adminRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
new Function('require','module','exports','process','fetch',read('../netlify/lib/_site-admin.cjs'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'november15-read-fixture'}),write:async()=>{writes++;assert.fail('Read verification must not write the registry');}}:adminRequire(name),module,module.exports,{env:{}},()=>assert.fail('Read verification must not contact or deploy to a live service'));
const actor={clientContext:{user:{email:'november15-read@example.test',app_metadata:{roles:['admin']}}}};
const response=await module.exports.handler({httpMethod:'GET'},actor);
assert.equal(response.statusCode,200);
const adminView=JSON.parse(response.body).registry;
assert.deepEqual(adminView.published.standings,publicView.standings);
assert.deepEqual(adminView.published.results.find(race=>race.scheduleId===mexico.scheduleId).entries,mexico.entries);
assert.deepEqual(adminView.drafts,stored.drafts,'Private Admin drafts remain private and unchanged');
assert.deepEqual(stored,storedBefore);assert.equal(writes,0);

console.log('PASS: approved Mexico R12 team-only results, honest unknown values, source provenance, exact 678-point caption repair across SSR/API/Admin, no scoring changes, historical preservation and later-result precedence. No live writes.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {prepareConfirmedRacingUpdates as prepareSection} from '../public/admin/racing-updates.mjs';
import {prepareConfirmedRacingUpdates} from '../src/lib/confirmed-racing-updates.mjs';
import {buildRaceFeed,upcomingRaces,eventCompleted,countdownParts,compactCountdown,nextRace,calendarFile,eventEnd} from '../src/lib/race-clock.mjs';
const require=createRequire(import.meta.url);
const reviewed=JSON.parse(fs.readFileSync(new URL('../src/data/confirmed-racing-updates.json',import.meta.url)));
const {seeds,validate,normalize}=require('../netlify/lib/_content.cjs');
const seed=seeds();
const result=id=>reviewed.results.find(r=>r.scheduleId===id);
const mart=result('kmart-round-9');
assert.deepEqual(mart.entries.map(e=>[e.driver,e.start,e.stage1Finish,e.stage2Finish,e.finish,e.racePoints]),[['Clutch',1,2,2,2,35],['Wispy',3,5,5,4,33]]);
assert.ok(mart.entries.every(e=>e.stage1Points===null&&e.stage2Points===null),'Do not infer stage awards or add them again to the owner-confirmed final totals');
assert.deepEqual(normalize('results',[mart])[0].entries.map(e=>e.racePoints),[35,33]);
assert.deepEqual(result('sunoco-2026-10-10').entries.map(e=>[e.driver,e.number,e.finishPoints,e.stage1Points,e.stage2Points,e.racePoints]),[['Will','42',55,10,10,75],['Clutch','46',35,8,8,51],['Wispy','54',34,6,6,46]]);
assert.equal(result('nrrs-round-23').entries[0].start,7);
assert.equal(result('nrrs-round-23').entries[0].stage1Finish,null);
assert.equal(result('nrrs-round-23').entries[0].stage2Finish,null);
assert.deepEqual(result('nrrs-round-23').entries.map(e=>e.driver),['Hailey'],'An absent Plarker must not get a fabricated result/DNS');
assert.equal(result('nrrs-round-22').entries[0].racePoints,41);
for(const record of reviewed.results){
  assert.equal(record.standingsMode,'record-only');
  assert.equal(validate('results',normalize('results',[record])),'');
}
const missingSource=structuredClone(mart);delete missingSource.sourceNote;
assert.notEqual(validate('results',normalize('results',[missingSource])),'');
const badPoints=structuredClone(mart);badPoints.entries[0].racePoints=-1;
assert.notEqual(validate('results',normalize('results',[badPoints])),'');
const {autoAdvanceStandings}=require('../netlify/lib/_site-admin.cjs')._test;
const registry={published:{standings:structuredClone(seed.standings)}};
const before=JSON.stringify(registry.published.standings);
assert.equal(autoAdvanceStandings(registry,reviewed.results,[]),false);
assert.equal(JSON.stringify(registry.published.standings),before,'Historical team-only results do not advance standings or modify current Chase snapshots');

// Construct the previous published shape by undoing only this release's fields.
const old=structuredClone(seed);
old['schedule-events']=old['schedule-events'].filter(e=>!(reviewed.scheduleAdditions??[]).some(a=>a.eventId===e.eventId));
for(const change of reviewed.scheduleChanges){
  const event=old['schedule-events'].find(e=>(e.routeId||e.eventId||(e.league+'-'+(e.round?.match(/\d+/)?'round-'+e.round.match(/\d+/)[0]:e.date)))===change.eventId);
  assert.ok(event,change.eventId);Object.assign(event,change.before);
  for(const field of Object.keys(change.before))if(change.before[field]===null)delete event[field];
}
old.results=old.results.filter(r=>!reviewed.results.some(record=>record.scheduleId===r.scheduleId));
const unrelated=JSON.stringify({drivers:old.drivers,standings:old.standings,roster:old['roster-profiles']});
const publication={revision:89,datasets:old};
const prepared=prepareConfirmedRacingUpdates(publication);
assert.equal(JSON.stringify({drivers:prepared.datasets.drivers,standings:prepared.datasets.standings,roster:prepared.datasets['roster-profiles']}),unrelated);
assert.deepEqual(prepareConfirmedRacingUpdates(prepared),prepared,'Reapplying a reviewed release must not shift the calendar a second week or duplicate results');
assert.equal(publication.datasets['schedule-events'].find(e=>e.league==='open'&&e.round==='ROUND 4').date,'2026-10-11','Preparation never mutates the supplied original publication');
for(const key of ['schedule-events','results'])assert.equal(validate(key,normalize(key,prepared.datasets[key]),{published:prepared.datasets}),'');
const conflict=structuredClone(publication);conflict.datasets['schedule-events'].find(e=>e.league==='open'&&e.round==='ROUND 5').date='2026-12-30';
assert.throws(()=>prepareConfirmedRacingUpdates(conflict),/changed since review/,'Protect newer Admin schedule edits');
const calendarOnly=prepareSection(publication,reviewed,'schedule-events');
assert.deepEqual(calendarOnly.datasets.results,publication.datasets.results,'Calendar review stages only Calendar, including leaving result ordering and feature flags untouched');
const resultsOnly=prepareSection(publication,reviewed,'results');
assert.deepEqual(resultsOnly.datasets['schedule-events'],publication.datasets['schedule-events'],'Result review stages only Results');
const movedManually=structuredClone(publication);
const oldPhoenix=movedManually.datasets['schedule-events'].find(e=>e.league==='sunoco'&&e.date==='2026-10-17');
Object.assign(oldPhoenix,{offWeek:true,title:'Off Week',track:'Off Week'});
assert.throws(()=>prepareConfirmedRacingUpdates(movedManually),/changed since review/,'A same-date off week must not be mistaken for Phoenix and shifted as a race');
const historical=old.results.find(r=>r.date<'2026-10-01');
assert.deepEqual(prepared.datasets.results.find(r=>r.scheduleId===historical.scheduleId).entries,historical.entries,'Earlier official entries and identities stay untouched');

const pending=prepared.datasets['schedule-events'].find(e=>e.league==='open'&&e.round==='ROUND 4');
const now=new Date('2026-10-18T19:30:00Z');
assert.equal(pending.date,'2026-10-18');assert.equal(pending.timePending,true);
assert.equal(prepared.datasets['schedule-events'].find(e=>e.league==='open'&&e.round==='ROUND 5').date,'2026-10-25');
assert.equal(prepared.datasets['schedule-events'].find(e=>e.league==='sunoco'&&e.date==='2026-10-17').offWeek,true);
assert.deepEqual(prepared.datasets['schedule-events'].filter(e=>e.league==='sunoco'&&e.date>='2026-10-24').map(e=>[e.date,e.track,e.routeId]),[['2026-10-24','Phoenix Raceway','sunoco-2026-10-17'],['2026-10-31','Atlanta Motor Speedway','sunoco-2026-10-24'],['2026-11-07','Homestead-Miami Speedway','sunoco-2026-10-31']]);
assert.equal(eventCompleted(pending,[],now),false,'An unknown later start must not be marked finished because noon passed');
assert.equal(upcomingRaces([pending],[],now).length,1);
const feed=buildRaceFeed([pending],[]);
assert.equal(nextRace(feed,now)?.timePending,true);
assert.equal(compactCountdown(pending,now),'TIME TBD');
assert.equal(countdownParts(pending,now).live,false);
assert.equal(Number.isFinite(+eventEnd(pending)),false);
assert.throws(()=>calendarFile({...pending,url:'/event/open-round-4/'}),/confirmed start time/,'Calendar export must not invent an actual start time');
assert.equal(nextRace(buildRaceFeed([pending],[{...pending,entries:[]}]),now),null,'Official results retire the pending race');

// Test the production Calendar controller with a known date / unknown time.
const calendar=fs.readFileSync(new URL('../src/components/RaceCalendar.astro',import.meta.url),'utf8');
const markup=calendar.slice(calendar.indexOf('<section'),calendar.indexOf('<script'));
const script=calendar.match(/<script define:vars[^>]*>([\s\S]*?)<\/script>/)[1];
const dom=new JSDOM(markup,{url:'https://aetherwing.net/schedule/open/',runScripts:'outside-only'});
const w=dom.window,RealDate=w.Date;
w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[+now]));}static now(){return +now;}};
w.setInterval=()=>1;
w.eval(`const initial=${JSON.stringify([pending])},initialResults=[];\n${script}`);
assert.match(w.document.querySelector('[data-calendar-hero]').textContent,/START TIME PENDING.*TIME TBD/s);
assert.ok(!w.document.querySelector('[data-calendar-hero]').textContent.includes('LIVE'),'Pending is distinct from an actual live race');
w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{'schedule-events':[{...pending,timePending:false,time:'8:00 PM ET'}]}}));
assert.match(w.document.querySelector('[data-calendar-hero]').textContent,/UPCOMING/);
assert.ok(!w.document.body.textContent.includes('NaN'));
w.close();
console.log('PASS: confirmed team scopes/totals, Sunoco scoring, historical names, safe/idempotent schedule preparation, preserved standings, and later-today pending time without a false live/completed state.');

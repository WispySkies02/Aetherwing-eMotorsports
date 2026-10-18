import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { eventStart, eventEnd, buildRaceFeed, upcomingRaces, resultForEvent } from '../src/lib/race-clock.mjs';
import { loadPublishedContent, applyPublication } from '../src/lib/published-content.mjs';
const { seeds, normalize, validate } = createRequire(import.meta.url)('../netlify/lib/_content.cjs');
const seed = seeds();
const now = new Date('2026-10-18T12:00:00Z');
const fixture = (round, extra = {}) => ({league:'uarl-d1',leagueName:'UARL D1',round:`ROUND ${round}`,title:`Race ${round}`,track:`Track ${round}`,date:'2026-10-18',time:'8:30 PM ET',...extra});
assert.equal(eventStart(fixture(1)).toISOString(),'2026-10-19T00:30:00.000Z');
assert.equal(eventStart(fixture(1,{date:'2026-11-15'})).toISOString(),'2026-11-16T01:30:00.000Z','Eastern offset follows DST');
const events = [fixture(1,{date:'2026-09-27'}),fixture(2,{status:'Cancelled'}),fixture(3,{status:'Postponed'}),fixture(4,{completed:true}),fixture(5),fixture(6,{date:'2026-10-25'}),fixture(7,{tbd:true,date:''})];
const finished = [{...fixture(5),date:'2026-10-11',title:'Previous title',track:'Previous venue',entries:[]}];
assert.equal(resultForEvent(finished,events[4]),finished[0],'A moved round retains its official result');
assert.deepEqual(upcomingRaces(events,finished,now).map(e=>e.round),['ROUND 6']);
assert.deepEqual(buildRaceFeed(events,finished).filter(e=>!e.done && eventEnd(e)>=now).map(e=>e.round),['ROUND 6']);
assert.equal(resultForEvent(finished,{...events[4],date:'2027-10-18'}),undefined,'The same round in a later season must not inherit an old result');
assert.equal(events.length,7,'History is not mutated by upcoming selection');

// Every program must hydrate schedule data even when the API omits competitions.
const source=fs.readFileSync(new URL('../src/pages/programs/[id].astro',import.meta.url),'utf8');
const script=source.match(/<script>\s*([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;$/gm,'');
for(const program of seed.competitions.filter(p=>p.id!=='uarl-d2')) {
  const league=program.id==='uarl-open'?'open':program.id==='iracing-factory'?'iracing':program.id;
  const current=fixture(4,{league,track:'Published Echo Park'});
  const datasets={'schedule-events':[{...current,date:'2026-09-27',round:'ROUND 1'},current],results:[],standings:[],drivers:[]};
  const dom=new JSDOM(`<div data-program-page data-program-id="${program.id}"><div data-program-next></div><div data-program-schedule></div><div data-program-latest></div></div><script data-program-seed type="application/json">${JSON.stringify({program,datasets})}</script>`,{runScripts:'outside-only'});
  const w=dom.window;
  w.upcomingRaces=(events,results)=>upcomingRaces(events,results,now);
  w.eventSlug=e=>`${e.league}-round-${e.round.match(/\d+/)[0]}`;
  w.setInterval=()=>1;
  w.eval(script);
  w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:datasets}));
  assert.match(w.document.querySelector('[data-program-next]').textContent,/Published Echo Park/,program.id);
  assert.equal(w.document.querySelectorAll('[data-program-schedule] article').length,1,`${program.id}: no past events`);
  const moved={...current,date:'2026-10-25',track:'Admin Updated Venue'};
  w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{'schedule-events':[moved]}}));
  assert.match(w.document.querySelector('[data-program-next]').textContent,/Admin Updated Venue/);
  w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{'schedule-events':[]}}));
  assert.equal(w.document.querySelectorAll('[data-program-schedule] article').length,0,'An empty publication clears the schedule');
  w.close();
}

const memory=new Map();
const storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
const live={revision:90,datasets:{standings:[{id:'nrrs',subtitle:'After R23',rows:[{driver:'Hailey',position:'P4',points:2190,delta:'-106',positionChange:1}]}],results:[], 'schedule-events':[]}};
const published=await loadPublishedContent({fetcher:async()=>Response.json(live),storage});
assert.equal(published.state,'published');
const fail=async()=>{throw new Error('offline');};
const cached=await loadPublishedContent({fetcher:fail,storage});
assert.equal(cached.state,'cached');assert.deepEqual(cached.datasets,live.datasets);
const bundled=await loadPublishedContent({fetcher:fail,storage:{getItem:()=>null}});
assert.equal(bundled.state,'bundled');
const invalid=await loadPublishedContent({fetcher:async()=>Response.json({datasets:{standings:{}}}),storage});
assert.equal(invalid.state,'cached','Malformed standings must not expose a half-updated snapshot');
for(const snapshot of [published,cached,bundled]) {
  const dom=new JSDOM('<html data-content-state="loading"><div data-live-region="standings"><span>Old seed</span></div></html>');
  const {window:w}=dom;
  let received;
  w.addEventListener('aetherwing:content',event=>{
    received=event.detail;
    assert.equal(w.document.documentElement.dataset.contentState,'loading','Snapshot updates precede reveal');
  });
  applyPublication(snapshot,{standings:seed.standings},{document:w.document,window:w});
  assert.equal(w.__AETHERWING_CONTENT__,received);
  assert.equal(w.document.documentElement.dataset.contentState,snapshot.state);
  const region=w.document.querySelector('[data-live-region]');
  assert.equal(region.dataset.liveState,snapshot.state);
  assert.equal(region.getAttribute('aria-busy'),'false');
  assert.equal(Boolean(region.querySelector('[data-live-note]')),snapshot.state!=='published');
  w.close();
}

const official=seed.results.filter(r=>r.pointsSource==='official-recap');
assert.equal(official.length,2);
assert.deepEqual(official.map(r=>[r.date,r.entries[0].driver,r.entries[0].number,r.entries[0].finish,r.entries[0].racePoints]),[['2026-10-13','Hailey','32',8,29],['2026-10-06','Hailey','32',4,41]]);
const normalized=normalize('results',seed.results);
assert.equal(validate('results',normalized),'');
assert.equal(normalized[0].date,'2026-10-13');
assert.equal(normalized.find(r=>r.date==='2026-10-06').entries[0].racePoints,41,'Official points survive normalization');
assert.equal(normalized[0].entries[0].start,null,'Unreported qualifying positions stay unknown');
for(const field of ['finish','racePoints']) {
  const bad=structuredClone(normalized);bad[0].entries[0][field]=null;
  assert.notEqual(validate('results',bad),'',`${field} is still required`);
}
const bad=structuredClone(normalized);bad[0].entries[0].stage1Points=-1;
assert.notEqual(validate('results',bad),'','Official provenance does not permit negative points');
const missingSource=structuredClone(normalized);delete missingSource[0].sourceUrl;
assert.notEqual(validate('results',missingSource),'','Official scoring requires a source');
const {autoAdvanceStandings}=createRequire(import.meta.url)('../netlify/lib/_site-admin.cjs')._test;
const registry={published:{standings:structuredClone(seed.standings)}};
const before=JSON.stringify(registry.published.standings);
assert.equal(autoAdvanceStandings(registry,official,[]),false,'Partial historical result imports must not advance or recalculate current standings');
assert.equal(JSON.stringify(registry.published.standings),before);
const fullArchive=structuredClone(official[0]);delete fullArchive.pointsSource;delete fullArchive.coverage;
assert.equal(autoAdvanceStandings(registry,[fullArchive],[]),false,'An archival record still must not add points if later completed with a full field');
// Real Admin controls load the reviewed recap records into an older registry,
// preserve unknowns while saving, and leave already-published standings alone.
{
  const dom=new JSDOM(fs.readFileSync(new URL('../public/admin/index.html',import.meta.url),'utf8'),{url:'http://localhost/admin/',runScripts:'outside-only',pretendToBeVisual:true});
  const w=dom.window;
  w.structuredClone=structuredClone;w.matchMedia=()=>({matches:true});
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};w.confirm=()=>true;
  const old=seed.results.filter(r=>r.pointsSource!=='official-recap');
  old.forEach((r,i)=>r.featured=i===0);
  const publishedSchedule=seed['schedule-events'].map(event=>{const recap=official.find(r=>r.league===event.league&&r.round===event.round);return recap?{...event,date:recap.date}:event;});
  w.localStorage.setItem('aetherwing-site-admin',JSON.stringify({version:1,revision:1,published:{results:old,standings:seed.standings,'schedule-events':publishedSchedule},drafts:{},history:[]}));
  w.fetch=async url=>String(url)==='/data/site-admin-seed.json'?Response.json(seed):new Response(fs.readFileSync(new URL(`../public${url}`,import.meta.url),'utf8'),{headers:{'content-type':'application/json'}});
  for(const script of ['paint-ops-admin.js','content-admin.js'])w.eval(fs.readFileSync(new URL(`../public/admin/${script}`,import.meta.url),'utf8'));
  const tick=()=>new Promise(resolve=>setTimeout(resolve,30));
  const $=selector=>w.document.querySelector(selector);
  await tick();$('[data-login]').click();$('[data-admin-dataset="results"]').click();await tick();
  const standingsBefore=JSON.stringify(JSON.parse(w.localStorage.getItem('aetherwing-site-admin')).published.standings);
  for(const race of official){
    const league=$('[data-results-league-filter]');league.value='nrrs';league.dispatchEvent(new w.Event('change',{bubbles:true}));
    const event=publishedSchedule.find(e=>e.league===race.league&&e.round===race.round);
    assert.ok(event);const select=$('[data-results-race-select]');
    select.value=[...select.options].find(option=>option.value.startsWith(race.date+'-')&&option.textContent.includes(event.track)).value;
    $('[data-results-load-race]').click();
    assert.match($('[data-content-status]').textContent,/Recap-confirmed team result loaded/);
    $('[data-content-publish]').click();await tick();
    const saved=JSON.parse(w.localStorage.getItem('aetherwing-site-admin'));
    const actual=saved.published.results.find(r=>r.scheduleId===race.scheduleId);
    assert.ok(actual,'Admin must actually publish the loaded record');
    assert.equal(actual.entries[0].racePoints,race.entries[0].racePoints);
    assert.equal(actual.entries[0].stage1Points,null,'Blank official breakdown survives commit');
    assert.equal(actual.entries[0].start,race.entries[0].start,'Unknown start remains unknown');
    assert.equal(JSON.stringify(saved.published.standings),standingsBefore,'Historical loading must not add points twice');
  }
  $('[data-results-import-text]').value='Position,driver,start,Stage_1,Stage_2\n4,Hailey,2,1,3';
  $('[data-results-import-preview-button]').click();
  $('[data-results-import-apply]').click();
  $('[data-content-publish]').click();await tick();
  const completed=JSON.parse(w.localStorage.getItem('aetherwing-site-admin')).published.results.find(r=>r.scheduleId==='nrrs-round-22');
  assert.equal(completed.pointsSource,undefined,'Explicit full-field import restores normal automatic scoring');
  assert.equal(completed.entries[0].racePoints,51,'Imported complete stage finishes use the league profile');
  assert.equal(completed.standingsMode,'record-only','Completing an archival record must not add its points again');
  assert.equal(JSON.stringify(JSON.parse(w.localStorage.getItem('aetherwing-site-admin')).published.standings),standingsBefore);
  w.close();
}
console.log('PASS: all program publications, Eastern time/DST, moved rounds, cancelled/postponed/completed races, atomic snapshots, labeled cache/fallback, and sourced October results without invented fields.');

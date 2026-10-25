import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { eventStart, eventEnd, buildRaceFeed, upcomingRaces, resultForEvent } from '../src/lib/race-clock.mjs';
import { loadPublishedContent, applyPublication } from '../src/lib/published-content.mjs';
import { appendReviewedResults, sameReviewedEvent } from '../src/lib/reviewed-results.mjs';
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
assert.equal(official.length,3);
assert.deepEqual(official.map(r=>[r.date,r.entries[0].driver,r.entries[0].number,r.entries[0].finish,r.entries[0].racePoints]),[['2026-10-20','Hailey','32',3,39],['2026-10-13','Hailey','32',8,29],['2026-10-06','Hailey','32',4,41]]);
const normalized=normalize('results',seed.results);
assert.equal(validate('results',normalized),'');
assert.equal(normalized[0].date,'2026-10-20');
assert.equal(normalized[0].entries[0].racePoints,39,'New Hampshire keeps its recap-confirmed total');
const portland=normalized.find(race=>race.scheduleId==='nrrs-round-23');
assert.equal(normalized.find(r=>r.date==='2026-10-06').entries[0].racePoints,41,'Official points survive normalization');
assert.equal(portland.entries[0].start,7,'Screenshot confirms Hailey qualified P7 at Portland');
assert.equal(portland.entries[0].stage1Finish,null,'Outside the stage top five does not establish an exact finishing position');
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
    if(race.scheduleId==='nrrs-round-24')assert.match($('[data-content-status]').textContent,/already in Race Results/,'The current featured recap is available without duplicating the event');
    else assert.match($('[data-content-status]').textContent,/Recap-confirmed team result loaded/);
    $('[data-content-publish]').click();await tick();
    const saved=JSON.parse(w.localStorage.getItem('aetherwing-site-admin'));
    const actual=saved.published.results.find(r=>r.scheduleId===race.scheduleId);
    assert.ok(actual,'Admin must actually publish the loaded record');
    assert.equal(actual.entries[0].racePoints,race.entries[0].racePoints);
    assert.equal(actual.entries[0].stage1Points,race.entries[0].stage1Points,'Confirmed zero and unknown stage awards survive commit');
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
// A September-only publication must expose all approved October records together.
{
  const {mergeCanonical}=createRequire(import.meta.url)('../netlify/lib/_site-data.cjs')._test;
  const approved=requireReview().results;
  const oldResults=structuredClone(seed.results.filter(result=>result.date<'2026-10-01'));
  const original=JSON.stringify(oldResults);
  const standings=structuredClone(seed.standings),before=JSON.stringify(standings);
  const merged=mergeCanonical({results:oldResults,standings});
  assert.equal(JSON.stringify(oldResults),original,'Read reconciliation does not mutate the stored publication');
  assert.equal(JSON.stringify(standings),before,'Archive repair cannot advance standings');
  assert.equal(merged.results.filter(result=>result.date>='2026-10-01').length,approved.length);
  assert.deepEqual(merged.results.map(result=>result.date),merged.results.map(result=>result.date).sort().reverse());
  for(const result of approved){
    const matches=merged.results.filter(row=>sameReviewedEvent(row,result));
    assert.equal(matches.length,1,result.scheduleId);
    for(let i=0;i<result.entries.length;i++)for(const key of ['driver','number','start','finish','racePoints','stage1Finish','stage2Finish'])assert.equal(matches[0].entries[i][key],result.entries[i][key],`${result.scheduleId}: preserve approved ${key}`);
    const corrected=structuredClone(matches[0]);corrected.entries[0].racePoints+=1;
    const resolved=mergeCanonical({results:[corrected]});
    assert.equal(resolved.results.filter(row=>sameReviewedEvent(row,result)).length,1);
    assert.equal(resolved.results.find(row=>sameReviewedEvent(row,result)).entries[0].racePoints,corrected.entries[0].racePoints,'A later Admin correction wins for every approved event');
  }
  assert.deepEqual(mergeCanonical(merged).results,merged.results,'Repeated reads are idempotent');
  const unsupported={...structuredClone(seed.results[0]),scheduleId:'kmart-round-10',league:'kmart',round:'ROUND 10',date:'2026-10-19'};
  assert.ok(!appendReviewedResults([], [...seed.results,unsupported]).some(result=>result.scheduleId==='kmart-round-10'),'An unapproved seed row cannot become an official result');
  assert.equal(merged.results.some(result=>result.date==='2026-10-19'),false,'October 19 stays pending official source');
}
function requireReview(){return JSON.parse(fs.readFileSync(new URL('../src/data/confirmed-racing-updates.json',import.meta.url),'utf8'));}

// The owner-supplied New Hampshire article and canonical result stay linked
// when the live registry still contains the older September-only collection.
{
  const slug='pole-position-fading-pace-bell-salvages-third-at-new-hampshire';
  const {mergeCanonical}=createRequire(import.meta.url)('../netlify/lib/_site-data.cjs')._test;
  const older={news:structuredClone(seed.news.filter(s=>s.slug!==slug)),results:structuredClone(seed.results.filter(r=>r.scheduleId!=='nrrs-round-24')),standings:structuredClone(seed.standings)};
  const beforeStandings=JSON.stringify(older.standings);
  const merged=mergeCanonical(older);
  assert.deepEqual(merged.news.filter(s=>s.featured).map(s=>s.slug),[slug]);
  assert.equal(JSON.stringify(merged.standings),beforeStandings,'A recap does not replace an Admin championship snapshot');
  const race=merged.results[0];
  assert.equal(race.scheduleId,'nrrs-round-24');
  assert.deepEqual(race.entries.map(e=>[e.driver,e.number,e.start,e.stage1Finish,e.stage2Finish,e.finish,e.racePoints,e.lapsDown]),[['Hailey','32',1,4,3,3,39,2]]);
  assert.equal(race.entries[0].stagePoints,5);
  assert.equal(race.entries[0].stage1Points,null,'Do not infer individual stage awards from a combined five-point total');
  assert.equal(race.entries[0].stage2Points,null);
  assert.equal(race.sourceUrl,`/news/${slug}/`);
  assert.equal(mergeCanonical(merged).results.filter(r=>r.scheduleId===race.scheduleId).length,1,'Release defaults are idempotent');
  const corrected=structuredClone(race);corrected.scheduleId='2026-10-20-nrrs-comcast-301';corrected.entries[0].racePoints=40;
  const preserved=mergeCanonical({news:seed.news,results:[corrected]});
  const reviewedIds=new Set(requireReview().results.map(result=>result.scheduleId));
  const approved=seed.results.filter(result=>reviewedIds.has(result.scheduleId));
  assert.equal(preserved.results.length,approved.length,'Restore the other approved results without duplicating a legacy event ID');
  assert.equal(preserved.results.filter(result=>sameReviewedEvent(result,race)).length,1);
  assert.equal(preserved.results[0].entries[0].racePoints,40,'Subsequent Admin corrections remain authoritative');
  delete corrected.round;
  assert.equal(mergeCanonical({results:[corrected]}).results.length,approved.length,'A date/venue-matched legacy record also remains authoritative');
  assert.equal(mergeCanonical({results:[corrected]}).results.find(result=>result.scheduleId===corrected.scheduleId).entries[0].racePoints,40);
  corrected.date='2027-10-20';corrected.round='ROUND 24';
  assert.equal(mergeCanonical({results:[corrected]}).results.length,approved.length+1,'A later season cannot hide the approved current-season records');
  const story=seed.news.find(s=>s.slug===slug);
  const paragraphs=story.featureBlocks.filter(b=>b.type==='prose').flatMap(b=>b.paragraphs);
  const raw=fs.readFileSync(new URL('../docs/sources/nrrs-new-hampshire-2026-10-20.md',import.meta.url),'utf8');
  const plain=value=>value.replace(/\*/g,'').replace(/\s+/g,' ').trim();
  const articleText=plain([story.summary,...paragraphs].join(' '));
  for(const paragraph of raw.split(/\r?\n\s*\r?\n/)) {
    if(/^(#|\||NRRS Town|\*\*NRRS|\*\*NEW HAMPSHIRE|\*\*CHAMPIONSHIP|---)/.test(paragraph.trim()))continue;
    assert.ok(articleText.includes(plain(paragraph)),`Preserve supplied prose: ${plain(paragraph).slice(0,70)}`);
  }
  assert.equal(story.featureBlocks.filter(b=>b.heading).length,5,'Every supplied section heading is retained');
  const chase=story.featureBlocks.find(b=>b.type==='standings');
  assert.deepEqual(chase.rows.map(r=>[r.driver,Number(r.points.replaceAll(',',''))]),[['Will',2329],['Clutch',2287],['Hailey',2229],['Trent',2192],['Outlaw',2162]]);
  const old=seed.news.find(s=>s.slug==='bells-road-course-struggles-deepen-at-portland');
  const standings=old.featureBlocks.find(b=>b.type==='standings').rows;
  const leader=standings.find(r=>r.driver==='Will');assert.equal(leader.points,'2,286');
  assert.equal(2286-Number(standings.find(r=>r.driver==='Hailey').points.replaceAll(',','')),96,'Owner corrected Portland gap is 96');
  for(const row of standings.filter(r=>r.driver!=='Will'))assert.equal(row.gap,`${2286-Number(row.points.replaceAll(',',''))} BACK`);
  assert.ok(JSON.stringify(old).includes('63 championship points'));
}
// Directory summaries use the same assignment set as an existing driver's profile.
{
  const source=fs.readFileSync(new URL('../src/components/DriverLineup.astro',import.meta.url),'utf8');
  const script=source.match(/<script define:vars=[^>]+>([\s\S]*?)<\/script>/)[1];
  const dom=new JSDOM('<section data-lineup><div data-lineup-filters></div><div data-lineup-program></div><div data-lineup-grid></div></section>',{url:'https://example.test/drivers/',runScripts:'outside-only'});
  const w=dom.window;
  Object.assign(w,{entries:structuredClone(seed.drivers),people:structuredClone(seed['roster-profiles']),boards:structuredClone(seed.charters),profileSlugs:seed['roster-profiles'].map(p=>p.slug),fetch:()=>new Promise(()=>{})});
  w.eval(script);
  const check=rows=>{
    const card=w.document.querySelector('a[href="/drivers/hailey/"]').closest('article');
    const expected=rows.filter(row=>row.profile==='hailey');
    const programs=[...new Set(expected.map(row=>row.competitionId))];
    assert.match(card.querySelector('.aw-lineup__plate > small').textContent,new RegExp(`^${programs.length} ACTIVE PROGRAMS$`));
    const rides=[...card.querySelectorAll('.aw-lineup__summary-rides > span')];
    assert.equal(rides.length,expected.length,'Each profile assignment appears in the summary');
    for(const assignment of expected)assert.ok(rides.some(ride=>ride.textContent.includes(assignment.competitionId==='uarl-d1'?'UARL D1':assignment.competition)&&ride.textContent.includes(`#${assignment.number}`)));
    assert.equal(w.document.querySelectorAll('[data-lineup-grid] article').length,8,'Factory-only entries without directory profiles do not add unapproved driver cards');
  };
  check(seed.drivers);
  const removed=seed.drivers.filter(row=>!(row.profile==='hailey'&&row.competitionId==='iracing-factory'));
  w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{drivers:removed}}));check(removed);
  const updated=structuredClone(seed.drivers);updated.find(row=>row.profile==='hailey'&&row.competitionId==='iracing-factory').number='88';
  w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{drivers:updated}}));check(updated);
  dom.window.close();
}
console.log('PASS: all program publications, derived directory assignments, Eastern time/DST, moved rounds, cancelled/postponed/completed races, atomic snapshots, labeled cache/fallback, and sourced October results without invented fields.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {eventSlug} from '../src/lib/schedule-events.mjs';
import {resultDidNotStart,resultPositionLabel,resultFinishLabel,resultPointsLabel,resultEntryStatus,resultQualifyingLabel,compareResultEntries} from '../src/lib/result-display.mjs';

const read = path => fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
const stripImports = source => source.replace(/^\s*import[^\n]+;\s*$/gm,'');
const sources = {home:read('src/pages/index.astro'),history:read('src/pages/history/index.astro'),event:read('src/pages/event/[slug].astro')};
const homeScript = stripImports(sources.home.match(/<script>([\s\S]*?)<\/script>/)[1]);
const historyScript = stripImports(sources.history.match(/<script>([\s\S]*?)<\/script>/)[1]);
const eventScript = sources.event.match(/<script define:vars=[^>]+>([\s\S]*?)<\/script>/)[1];

const archived = {pointsSource:'official-recap',coverage:'team-only',standingsMode:'record-only',status:'Completed',time:'8:30 PM ET'};
const iowa = {...archived,scheduleId:'kmart-round-11',league:'kmart',leagueName:'Kmart Auto Parts Series',round:'ROUND 11',date:'2026-11-02',title:'MasterPro Iowa 200',track:'Iowa Speedway',summary:'Approved P4 result; other measurements were not supplied.',sourceUrl:'/news/bell-eyes-championship-mexico-city/',entries:[{driver:'Hailey',number:'15',start:null,stage1Finish:null,stage1Points:null,stage2Finish:null,stage2Points:null,finish:4,racePoints:null,featuredDriver:true}]};
const homestead = {...archived,scheduleId:'nrrs-round-25',league:'nrrs',leagueName:'NRRS',round:'ROUND 25',date:'2026-10-27',title:'Homestead-Miami finale',track:'Homestead-Miami Speedway',summary:'Qualified fourth; technical issues prevented a start.',sourceUrl:'/news/hailey-bell-nrrs-season-3-review/',entries:[{driver:'Hailey',number:'32',start:null,qualifyingPosition:4,stage1Finish:null,stage1Points:null,stage2Finish:null,stage2Points:null,finish:null,finishStatus:'DNS',racePoints:null,featuredDriver:true}]};
const ordinary = {scheduleId:'fixture-ordinary',league:'nrrs',leagueName:'NRRS',date:'2026-10-20',round:'ROUND 24',title:'Ordinary completed result',track:'New Hampshire Motor Speedway',entries:[{driver:'Second',number:'2',finish:2,start:3,stage1Finish:0,stage2Finish:2,racePoints:0},{driver:'Winner',number:'1',finish:1,start:1,stage1Finish:1,stage2Finish:1,racePoints:55}]};
const results = [ordinary,homestead,iowa];

assert.equal(resultFinishLabel(iowa.entries[0]),'P4');
assert.equal(resultFinishLabel(homestead.entries[0]),'DNS');
assert.equal(resultFinishLabel({...homestead.entries[0],finish:4}),'DNS','An explicit DNS cannot become a P4 finish');
assert.equal(resultQualifyingLabel(homestead.entries[0]),'Qualified P4');
assert.equal(resultPositionLabel(homestead.entries[0].start),'—','Qualifying fourth was not an actual start');
assert.equal(resultEntryStatus(homestead.entries[0]),'DNS');
assert.equal(resultEntryStatus(iowa.entries[0]),'Raced');
for (const value of [null,undefined,NaN,'0']) assert.equal(resultPointsLabel(value),'—','Unknown points are not an inferred zero');
assert.equal(resultPointsLabel(0),'0','A supplied numeric zero remains zero');
assert.equal(resultFinishLabel({finish:0},'DNS'),'DNS','Existing compact legacy-zero treatment is preserved');
assert.equal(resultFinishLabel({finish:0},'P—'),'P—','Existing event legacy-zero treatment is preserved');
assert.deepEqual([...ordinary.entries,homestead.entries[0]].sort(compareResultEntries).map(entry=>entry.driver),['Winner','Second','Hailey']);

const homeMarkup = '<div data-latest-meta></div><h3 data-latest-title></h3><p data-latest-track></p><div data-latest-entries></div><a data-latest-event></a>';
const eventMarkup = ['data-event-series','data-event-track','data-event-summary','data-event-title','data-event-detail','data-event-entry-title','data-event-entries','data-event-head','data-event-result'].map(attribute=>`<div ${attribute}></div>`).join('');
function page(markup,url){
 const dom = new JSDOM(markup,{url,runScripts:'outside-only'});
 Object.assign(dom.window,{eventSlug,resultDidNotStart,resultPositionLabel,resultFinishLabel,resultPointsLabel,resultEntryStatus,resultQualifyingLabel,compareResultEntries});
 return dom;
}
function hydrate(dom,script,datasets,cached){
 if(cached)dom.window.__AETHERWING_CONTENT__=datasets;
 dom.window.eval(script);
 if(!cached)dom.window.dispatchEvent(new dom.window.CustomEvent('aetherwing:content',{detail:datasets}));
}

for (const cached of [false,true]) {
 const home = page(homeMarkup,'https://example.test/');
 try {
  hydrate(home,homeScript,{results},cached);
  const document = home.window.document;
  assert.equal(document.querySelector('[data-latest-title]').textContent,iowa.title,'Actual result dates select the newest result');
  assert.equal(document.querySelector('[data-latest-event]').getAttribute('href'),'/event/kmart-round-11/');
  assert.equal(document.querySelector('[data-latest-entries]').textContent,'#15 HaileyP4');
  home.window.dispatchEvent(new home.window.CustomEvent('aetherwing:content',{detail:{results:[homestead,ordinary]}}));
  assert.equal(document.querySelector('[data-latest-entries]').textContent,'#32 HaileyDNS','Homepage distinguishes DNS from qualifying P4');
 } finally { home.window.close(); }
 const history = page('<div data-results-list></div>','https://example.test/history/');
 try {
  hydrate(history,historyScript,{results},cached);
  const cards = [...history.window.document.querySelectorAll('[data-results-list] article')];
  assert.deepEqual(cards.map(card=>card.querySelector('h3').textContent),[iowa.title,homestead.title,ordinary.title]);
  assert.equal(cards[0].querySelector('strong').textContent,'#15 Hailey · P4');
  assert.equal(cards[1].querySelector('strong').textContent,'#32 Hailey · DNS');
  assert.equal(cards[1].querySelector('a').getAttribute('href'),'/event/nrrs-round-25/');
  assert.equal(cards[1].querySelectorAll('a')[1].getAttribute('href'),homestead.sourceUrl);
 } finally { history.window.close(); }
 for (const race of [iowa,homestead,ordinary]) {
  const event = page(eventMarkup,`https://example.test/event/${eventSlug(race)}/`);
  try {
   event.window.eventId=eventSlug(race);
   hydrate(event,eventScript,{results,'schedule-events':[race],drivers:[]},cached);
   const document = event.window.document,rows = [...document.querySelectorAll('.race-result-row')];
   if(race===homestead){
    assert.equal(rows[0].querySelector('b').textContent,'DNS');
    assert.equal(rows[0].querySelector('[data-result-qualifying]').textContent,'Qualified P4');
    assert.deepEqual([...rows[0].querySelectorAll(':scope > span')].map(node=>node.textContent),['—','—','—','—']);
    assert.equal(document.querySelector('[data-event-entries] small').textContent,'DNS');
    assert.ok(!rows[0].textContent.includes('DNF'));
   }else if(race===iowa){
    assert.equal(rows[0].querySelector('b').textContent,'P4');
    assert.deepEqual([...rows[0].querySelectorAll(':scope > span')].map(node=>node.textContent),['—','—','—','—']);
    assert.equal(rows[0].querySelector('[data-result-qualifying]'),null,'Unknown qualifying is not invented');
   }else{
    assert.deepEqual(rows.map(row=>row.querySelector('b').textContent),['P1','P2']);
    assert.deepEqual([...rows[1].querySelectorAll(':scope > span')].map(node=>node.textContent),['P3','—','P2','0'],'Ordinary completed results preserve supplied starts/stages/zero points');
   }
   assert.ok(!document.querySelector('[data-event-result]').textContent.includes('+0'));
  } finally { event.window.close(); }
 }
}

// The event's inline script must keep the exact semantics used during SSR.
{
 const event = page(eventMarkup,'https://example.test/event/fixture/');
 try {
  event.window.eventId='fixture'; event.window.eval(eventScript);
  for(const entry of [iowa.entries[0],homestead.entries[0],...ordinary.entries,{finish:0},{finish:null},{finishStatus:' DNS ',finish:4,qualifyingPosition:null}]){
   assert.equal(event.window.resultFinishLabel(entry,'P—'),resultFinishLabel(entry,'P—'));
   assert.equal(event.window.resultQualifyingLabel(entry),resultQualifyingLabel(entry));
   assert.equal(event.window.resultEntryStatus(entry),resultEntryStatus(entry));
   assert.equal(event.window.resultPointsLabel(entry.racePoints),resultPointsLabel(entry.racePoints));
  }
 } finally { event.window.close(); }
}
assert.match(sources.event,/resultFinishLabel\(e,'P—'\)/,'SSR uses the shared DNS-aware finish label');
assert.match(sources.event,/resultPointsLabel\(e\.racePoints\)/,'SSR keeps unknown points blank');
assert.match(sources.event,/data-result-qualifying/,'SSR qualifying remains a separate note');
console.log('PASS: archive/Home/event cached and event hydration preserves Iowa P4, Homestead DNS with separate qualifying P4, unknown measurement dashes, ordinary numeric zero, chronological Latest Result and source/event links. No live writes.');

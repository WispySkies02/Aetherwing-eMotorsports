import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

const {seeds}=createRequire(import.meta.url)('../netlify/lib/_content.cjs');
const seed=seeds();
const source=fs.readFileSync(new URL('../src/components/DriverLineup.astro',import.meta.url),'utf8');
const script=source.match(/<script define:vars=[^>]+>([\s\S]*?)<\/script>/)[1];
const current={drivers:structuredClone(seed.drivers),'roster-profiles':structuredClone(seed['roster-profiles']),charters:structuredClone(seed.charters)};
// Retain complex flexible-card coverage with an explicit historical fixture,
// rather than silently restoring the former D1 allocation to current seeds.
const legacy=JSON.parse(fs.readFileSync(new URL('./fixtures/uarl-d1-before-return.json',import.meta.url),'utf8'));
const initial={drivers:structuredClone(legacy.drivers),'roster-profiles':structuredClone(legacy['roster-profiles']),charters:structuredClone(legacy.charters)};
const before=JSON.stringify(initial),currentBefore=JSON.stringify(current);
const dom=new JSDOM('<section data-lineup><div data-lineup-filters></div><div data-lineup-program></div><div data-lineup-grid></div></section>',{url:'https://example.test/drivers/',runScripts:'outside-only'});
const w=dom.window,d=w.document;
Object.assign(w,{entries:current.drivers,people:current['roster-profiles'],boards:current.charters,profileSlugs:current['roster-profiles'].map(p=>p.slug),fetch:()=>new Promise(()=>{})});
const cards=()=>[...d.querySelectorAll('[data-lineup-grid] article')];
const summary=()=>d.querySelector('[data-lineup-program] strong').textContent;
const select=program=>{const button=d.querySelector(`[data-program="${program}"]`);assert.ok(button,`${program} filter remains available`);button.click();};
const publish=datasets=>w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:datasets}));
const check=(assigned,open,flexible)=>{
  assert.equal(summary(),`${assigned} ASSIGNED · ${open} OPEN · ${flexible} FLEXIBLE ${flexible===1?'ENTRY':'ENTRIES'}`);
  assert.equal(cards().length,assigned+open+flexible,'Every visible entry is accounted for exactly once');
  assert.equal(cards().filter(card=>!card.classList.contains('is-charter')).length,assigned,'Assigned count agrees with rendered assigned cards');
};
try{
  w.eval(script);
  assert.equal(cards().length,6,'The current directory contains only the six drivers with current assignments');
  select('uarl-d1');check(1,2,0);
  assert.deepEqual(cards().map(card=>card.dataset.number),['33','42','43'],'Current D1 has Will #33 and two unsigned entry modules');
  publish(initial);select('all');
  const allCount=cards().length;
  assert.equal(summary(),`${allCount} DRIVERS · ONE CARD EACH`);
  select('uarl-d1');check(3,1,1);
  assert.deepEqual(cards().map(card=>card.dataset.number),['28','32','46','56','62'],'The existing five D1 modules remain intact');
  select('uarl-open');check(initial.drivers.filter(row=>row.competitionId==='uarl-open').length,0,0);
  select('all');assert.equal(summary(),`${allCount} DRIVERS · ONE CARD EACH`);assert.equal(cards().length,allCount);
  select('uarl-d1');check(3,1,1);

  const inactive=structuredClone(initial.charters);inactive.find(board=>board.id==='uarl-d1').openCharters[0].active=false;
  publish({charters:inactive});check(3,1,0);
  assert.ok(cards().some(card=>card.dataset.number==='56'),'Deactivating flex retains the independent open entry');

  const multiple=structuredClone(initial.charters),board=multiple.find(board=>board.id==='uarl-d1');
  board.openCharters[0].uses.push({number:'99',label:'Temporary test use',active:true});
  publish({charters:multiple});check(3,1,1);
  assert.equal(cards().length,5,'Several uses of one displayed flex card still count as one entry');
  board.openCharters.push({id:'test-flex-2',label:'Second flexible entry',active:true,uses:[{number:'88',active:true}]});
  publish({charters:multiple});check(3,1,2);

  // An assigned charter card without a driver-assignment row is still a visible assigned entry.
  const withoutOne=initial.drivers.filter(row=>!(row.competitionId==='uarl-d1'&&String(row.number)==='46'));
  publish({drivers:withoutOne,charters:structuredClone(initial.charters)});check(3,1,1);
  assert.ok(cards().some(card=>card.dataset.number==='46'&&!card.classList.contains('is-charter')));

  // Open entries can also arrive through published assignment rows; do not count them as assigned.
  const withOpen=[...structuredClone(initial.drivers),{id:'test-open-d1',competitionId:'uarl-d1',number:'56',displayName:'Open',status:'Open charter',affiliation:'aetherwing'}];
  publish({drivers:withOpen});check(3,1,1);
  assert.equal(cards().filter(card=>card.dataset.number==='56').length,1,'An already displayed open assignment does not add a duplicate board card');

  const occupied=structuredClone(withOpen);Object.assign(occupied.at(-1),{displayName:'Approved fixture driver',status:'Full-Time'});
  publish({drivers:occupied});check(4,0,1);
  const sparse=structuredClone(initial.charters);sparse.find(board=>board.id==='uarl-d1').fullTime=sparse.find(board=>board.id==='uarl-d1').fullTime.filter(slot=>slot.number!=='56');
  publish({drivers:structuredClone(initial.drivers),charters:sparse});check(3,0,1);
  publish({charters:[...structuredClone(initial.charters),{id:'empty-test-program',label:'Empty fixture',fullTime:[],openCharters:[]}]});
  select('empty-test-program');check(0,0,0);
  assert.equal(d.querySelectorAll('.aw-lineup__empty').length,1,'An empty program keeps its existing empty state');
  select('uarl-d1');
  publish(initial);check(3,1,1);
  select('all');assert.equal(summary(),`${allCount} DRIVERS · ONE CARD EACH`);assert.equal(cards().length,allCount);
  select('uarl-d1');check(3,1,1);
  assert.equal(JSON.stringify(initial),before,'Rendering/filtering never changes roster or charter source records');
  publish(current);check(1,2,0);
  assert.deepEqual(cards().map(card=>card.dataset.number),['33','42','43'],'Restoring the current publication replaces the legacy test cards');
  select('all');assert.equal(cards().length,6);
  assert.equal(JSON.stringify(current),currentBefore,'Current roster records remain unchanged throughout the legacy fixture tests');
  console.log('PASS: current D1 1 assigned/2 open/0 flex, explicit legacy flexible-card summary counts, filter switching, inactive/multi-use flex, missing assignment cards, open assignment rows, pluralization and unchanged source records.');
}finally{dom.window.close();}

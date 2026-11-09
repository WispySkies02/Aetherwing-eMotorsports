import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {reconcileCharterPlans,plannedCharterNotes} from '../src/lib/charter-plans.mjs';

const boards=JSON.parse(fs.readFileSync(new URL('../src/data/charters.json',import.meta.url),'utf8'));
const nrrs=boards.find(board=>board.id==='nrrs'),plan=nrrs.plannedSeasons[0];
assert.deepEqual(nrrs.plannedSeasons,[{season:4,year:2027,status:'planned',numbers:['42','43','46'],sourceDate:'2026-11-08',sourceNote:'Owner-approved plan: NRRS charters for next season are planned #42 / #43 / #46.'}]);
assert.deepEqual(Object.keys(plan).sort(),['numbers','season','sourceDate','sourceNote','status','year'],'Only planning facts are supplied; no drivers, teams or active assignments');
assert.deepEqual(nrrs.fullTime.map(entry=>[entry.number,entry.driver]),[['32','Hailey'],['43','Plarker'],['54','Open']],'The 2026 NRRS full-time allocation is retained');
assert.deepEqual(nrrs.openCharters.flatMap(charter=>charter.uses.map(use=>use.number)),['62','82'],'The existing NRRS shared uses are retained');
assert.deepEqual(boards.find(board=>board.id==='uarl-d1').fullTime.map(entry=>entry.number),['28','32','46','56'],'A future NRRS plan never alters the D1 allocation');
const note='2027 · NRRS Season 4 — planned charter numbers: #42 / #43 / #46.';
assert.deepEqual(plannedCharterNotes(nrrs),[note]);
const legacy=structuredClone(boards);delete legacy.find(board=>board.id==='nrrs').plannedSeasons;
const before=structuredClone(legacy),seedBefore=structuredClone(boards),reconciled=reconcileCharterPlans(legacy,boards);
assert.deepEqual(legacy,before,'Reconciliation is pure');assert.deepEqual(boards,seedBefore,'Seed records remain unchanged');
assert.deepEqual(reconciled.find(board=>board.id==='nrrs').plannedSeasons,[plan]);
for(let index=0;index<legacy.length;index++){
  const {plannedSeasons,...after}=reconciled[index];assert.deepEqual(after,legacy[index],'Only the missing future-planning field is added');
}
assert.notEqual(reconciled.find(board=>board.id==='nrrs').plannedSeasons,nrrs.plannedSeasons,'Fallback planning is independently cloned');
assert.deepEqual(reconcileCharterPlans(reconciled,boards),reconciled,'A repeated read is idempotent');
const edited=structuredClone(boards);edited[0].plannedSeasons[0].numbers=['42','43','47'];edited[0].plannedSeasons[0].sourceNote='A later approved plan.';
assert.deepEqual(reconcileCharterPlans(edited,boards),edited,'Later Admin planning edits are authoritative');
assert.match(plannedCharterNotes(edited[0])[0],/#42 \/ #43 \/ #47/);
const removed=structuredClone(boards);removed[0].plannedSeasons=[];
assert.deepEqual(reconcileCharterPlans(removed,boards),removed,'Explicitly clearing all plans never restores the seed');assert.deepEqual(plannedCharterNotes(removed[0]),[]);
const noBoard=boards.filter(board=>board.id!=='nrrs');assert.deepEqual(reconcileCharterPlans(noBoard,boards),noBoard,'A removed board is not resurrected');
for(const value of [null,undefined,'invalid',{}]){
  const invalid=[{...nrrs,plannedSeasons:value}];assert.deepEqual(reconcileCharterPlans(invalid,boards),invalid,'Invalid present fields are not silently repaired before validation');assert.deepEqual(plannedCharterNotes(invalid[0]),[]);
}
for(const invalid of [null,{...plan,status:'active'},{...plan,status:'confirmed'},{...plan,numbers:[]},{...plan,numbers:['42','42']},{...plan,numbers:['42','<script>']},{...plan,numbers:[42]},{...plan,year:'2027'},{...plan,year:999},{...plan,year:10000},{...plan,season:0}])assert.deepEqual(plannedCharterNotes({...nrrs,plannedSeasons:[invalid]}),[],'Only a valid explicit plan is described publicly');
assert.deepEqual(plannedCharterNotes(boards.find(board=>board.id==='uarl-d1')),[]);
assert.deepEqual(plannedCharterNotes({...nrrs,id:'uarl-d1'}),[],'An NRRS plan is not presented as another program’s plan');
assert.deepEqual(reconcileCharterPlans(null,boards),null);assert.deepEqual(reconcileCharterPlans([],boards),[]);
assert.deepEqual(reconcileCharterPlans(legacy,[]),legacy,'No unrelated missing metadata is invented');
assert.deepEqual(plannedCharterNotes({...nrrs,plannedSeasons:[{...plan,year:2020}]}),['2020 · NRRS Season 4 — planned charter numbers: #42 / #43 / #46.'],'Elapsed dates never activate or reassign planned numbers');
// Exercise the actual small note controller without running or changing the
// active-entry renderer. Its filters and counts remain separate from planning.
const component=fs.readFileSync(new URL('../src/components/DriverLineup.astro',import.meta.url),'utf8');
assert.match(component,/<p class="mono muted" data-planned-charters hidden>/,'The default/all view reserves a hidden note, not another charter module');
const controller=[...component.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(script=>script.includes('renderPlanNote'));
assert.ok(controller,'The filtered planning note uses the shared helper');
const dom=new JSDOM(`<section data-lineup><div><button data-program="all" aria-pressed="true">All</button><button data-program="nrrs" aria-pressed="false">NRRS</button><button data-program="uarl-d1" aria-pressed="false">D1</button></div><p data-planned-charters hidden></p><div data-lineup-grid><article>Current entry</article></div></section><script type="application/json" data-planned-charters-seed>${JSON.stringify(boards)}</script>`,{runScripts:'outside-only'});
try{
  const w=dom.window,doc=w.document,noteNode=doc.querySelector('[data-planned-charters]');
  w.plannedCharterNotes=plannedCharterNotes;w.reconcileCharterPlans=reconcileCharterPlans;
  for(const button of doc.querySelectorAll('[data-program]'))button.addEventListener('click',()=>{for(const peer of doc.querySelectorAll('[data-program]'))peer.setAttribute('aria-pressed',String(peer===button));});
  w.eval(controller.replace(/^\s*import .*;$/gm,''));
  assert.equal(noteNode.hidden,true,'All Drivers does not show an NRRS plan');
  doc.querySelector('[data-program="nrrs"]').click();assert.equal(noteNode.hidden,false);assert.equal(noteNode.textContent,`${note} Current entries remain unchanged.`);
  assert.equal(doc.querySelectorAll('[data-lineup-grid] article').length,1,'Planning is outside active modules and their count');
  doc.querySelector('[data-program="uarl-d1"]').click();assert.equal(noteNode.hidden,true);assert.equal(noteNode.textContent,'','A different filter cannot show stale NRRS planning');
  doc.querySelector('[data-program="nrrs"]').click();
  const publish=charters=>w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{charters}}));
  publish(edited);assert.match(noteNode.textContent,/#42 \/ #43 \/ #47/,'Later approved plan edits render immediately');
  publish(removed);assert.equal(noteNode.hidden,true);assert.equal(noteNode.textContent,'','An explicit empty list clears the plan note');
  publish(noBoard);assert.equal(noteNode.hidden,true,'An explicitly removed NRRS board stays absent');
  publish(legacy);assert.equal(noteNode.hidden,false);assert.equal(noteNode.textContent,`${note} Current entries remain unchanged.`,'A legacy snapshot without planning metadata uses the approved source plan');
}finally{dom.window.close();}
console.log('PASS: approved 2027 Season 4 #42/#43/#46 plan, unchanged active allocations, additive pure legacy reconciliation, explicit later edits/removals, safe planned notes and no calendar-driven promotion.');

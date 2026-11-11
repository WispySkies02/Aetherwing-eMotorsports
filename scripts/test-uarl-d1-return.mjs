import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {currentUarlRevision,reconcileUarlAssignments,reconcileUarlCharters,reconcileUarlCompetitions,reconcileUarlProfiles,reconcileUarlReturn} from '../src/lib/uarl-d1-return.mjs';
import {applyPublication} from '../src/lib/published-content.mjs';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs'),seed=content.seeds(),clone=structuredClone;
const before=JSON.parse(fs.readFileSync(new URL('./fixtures/uarl-d1-before-return.json',import.meta.url),'utf8'));
const old={...clone(seed),...clone(before)},original=clone(old),next=reconcileUarlReturn(old);
const assignment=rows=>rows.filter(row=>row.competitionId==='uarl-d1');
const board=rows=>rows.find(row=>row.id==='uarl-d1');
assert.deepEqual(old,original,'Read reconciliation never mutates the saved publication');
assert.deepEqual(assignment(next.drivers),assignment(seed.drivers),'The old three-driver roster becomes exactly the approved Will #33 Chevrolet assignment');
assert.deepEqual(next.drivers,seed.drivers,'Source, API and cached publications keep the same primary-program ordering');
assert.deepEqual(board(next.charters),board(seed.charters));assert.deepEqual(board(next.competitions),board(seed.competitions));
for(const slug of ['hailey','will','rocky','burgertown2good'])assert.deepEqual(next['roster-profiles'].find(row=>row.slug===slug),seed['roster-profiles'].find(row=>row.slug===slug),'Known prior profile metadata migrates to the approved current scope');
assert.deepEqual(next.drivers.filter(row=>row.competitionId!=='uarl-d1'),old.drivers.filter(row=>row.competitionId!=='uarl-d1'),'Other number assignments and alliance affiliations remain identical');
for(const key of ['results','standings','schedule-events','wins','milestones','driver-profiles','driver-portfolios'])assert.deepEqual(next[key],old[key],`No historical/event/scoring/portfolio changes: ${key}`);
assert.deepEqual(next.charters.find(row=>row.id==='nrrs'),old.charters.find(row=>row.id==='nrrs'),'The separate 2027 NRRS plan is unchanged');
assert.deepEqual(board(next.charters).fullTime.map(row=>[row.number,row.driver,row.status]),[['33','Will',undefined],['42','Open','Unsigned'],['43','Open','Unsigned']]);assert.deepEqual(board(next.charters).openCharters,[]);
assert.deepEqual(reconcileUarlReturn(next),next,'A repeated read is idempotent');
assert.equal(next.drivers.find(row=>row.id==='will-uarl-d1').numberImage,'');assert.ok(!next.drivers.find(row=>row.id==='will-uarl-d1').numberImageBackup,'No retired-number bitmap is reused');
const artwork=clone(old);assignment(artwork.drivers).forEach(row=>Object.assign(row,{numberImage:'https://example.test/old-number.png',numberImageBackup:'https://example.test/old-upload.png'}));assert.equal(assignment(reconcileUarlReturn(artwork).drivers)[0].numberImage,'');
const custom={...clone(before.drivers.find(row=>row.id==='rocky-uarl-d1')),id:'custom-approved-rocky'};assert.deepEqual(reconcileUarlAssignments([custom]),[custom],'Unrelated custom assignment IDs are not swept into a legacy migration');
for(const name of ['constructor','toString','__proto__']){
 const customDriver={...clone(before.drivers.find(row=>row.id==='rocky-uarl-d1')),profile:name};assert.deepEqual(reconcileUarlAssignments([customDriver]),[customDriver],'Custom identities cannot resolve inherited object properties');
 const customBoard={id:'uarl-d1',fullTime:[{number:'99',driver:name}],openCharters:[]};assert.deepEqual(reconcileUarlCharters([customBoard]),[customBoard],'Unrelated charter identities remain safe before validation');
}

const later=clone(next);Object.assign(assignment(later.drivers)[0],{number:'34',manufacturer:'Ford',car:'Ford',displayName:'Later approved Will name'});board(later.charters).fullTime[0].number='34';board(later.charters).fullTime[1].driver='Later approved driver';board(later.competitions).machine='Later approved equipment';board(later.competitions).roster=['Later approved roster'];later['roster-profiles'].find(row=>row.slug==='will').programs=['Later approved scope'];
assert.deepEqual(reconcileUarlReturn(later),later,'Revision-marked later Admin edits are authoritative across every collection');
for(const key of ['drivers','charters','competitions','roster-profiles']){const removed={...clone(next),[key]:[]};assert.deepEqual(reconcileUarlReturn(removed)[key],[],'An explicit empty collection does not resurrect a source record');}
const removed=clone(next);removed.drivers=removed.drivers.filter(row=>row.competitionId!=='uarl-d1');removed.charters=removed.charters.filter(row=>row.id!=='uarl-d1');removed.competitions=removed.competitions.filter(row=>row.id!=='uarl-d1');assert.deepEqual(reconcileUarlReturn(removed),removed,'Removing a migrated program or assignment stays removed');
const customBio=clone(before['roster-profiles']);customBio.find(row=>row.slug==='will').bio='Later custom editorial biography.';assert.equal(reconcileUarlProfiles(customBio).find(row=>row.slug==='will').bio,'Later custom editorial biography.','Unrelated biography copy is never replaced');
for(const [key,repair] of [['drivers',reconcileUarlAssignments],['charters',reconcileUarlCharters],['competitions',reconcileUarlCompetitions],['roster-profiles',reconcileUarlProfiles]]){
 for(const value of [null,{},'invalid'])assert.equal(repair(value),value,'Malformed sections stay visible for strict validation');
 assert.deepEqual(content.normalize(key,old[key]),next[key],`Backend normalization uses the same scoped migration: ${key}`);
 assert.deepEqual(content.normalize(key,later[key]),later[key],`Later normalized edits remain authoritative: ${key}`);
 assert.equal(content.validate(key,content.normalize(key,old[key]),{published:next}),'',`Migrated ${key} passes ordinary validation`);
}

// The production API and cached client must deliver all four collections together.
const merged=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(clone(old));
for(const key of ['drivers','charters','competitions','roster-profiles']){
 const relevant=rows=>key==='drivers'?assignment(rows):key==='roster-profiles'?rows.filter(row=>['hailey','will','rocky','burgertown2good'].includes(row.slug)):rows.filter(row=>row.id==='uarl-d1');
 assert.deepEqual(relevant(merged[key]),relevant(next[key]),`Public API current records agree: ${key}`);
}
const dom=new JSDOM('<html><body></body></html>',{url:'https://example.test/'});try{for(const state of ['published','cached']){
 applyPublication({datasets:clone(old),state,revision:125},{},{document:dom.window.document,window:dom.window});const visible=dom.window.__AETHERWING_CONTENT__;
 assert.deepEqual(assignment(visible.drivers),assignment(next.drivers));assert.deepEqual(board(visible.charters),board(next.charters));assert.deepEqual(board(visible.competitions),board(next.competitions));assert.deepEqual(visible.results,old.results);assert.deepEqual(visible.standings,old.standings);
}}finally{dom.window.close();}

// The classic Admin mirror is generated from this same pure module. Exercise
// its exact source independently, rather than assuming the browser imports ESM.
const admin=fs.readFileSync(new URL('../public/admin/content-admin.js',import.meta.url),'utf8');
const mirror=admin.split('// BEGIN UARL_D1_RETURN_MIRROR')[1]?.split('// END UARL_D1_RETURN_MIRROR')[0];assert.ok(mirror,'Classic Admin includes the shared migration mirror');
const classic=new Function(`${mirror}\nreturn uarlD1Return;`)();assert.equal(classic.currentUarlRevision,currentUarlRevision);
const inherited={drivers:[{...clone(before.drivers.find(row=>row.id==='rocky-uarl-d1')),profile:'constructor'}],charters:[{id:'uarl-d1',fullTime:[{number:'99',driver:'constructor'}],openCharters:[]}]};
for(const fixture of [old,next,later,removed,{drivers:[],charters:[],competitions:[]},{drivers:[custom]},inherited])assert.deepEqual(classic.reconcileUarlReturn(clone(fixture)),reconcileUarlReturn(fixture),'The Admin mirror has identical legacy, later-edit, removal and custom-record guards');

// Authenticated handler, private drafts and persistence use only isolated storage.
let stored={version:1,revision:125,published:clone(old),drafts:{},history:[]},writes=0;const module={exports:{}},siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('../netlify/lib/_site-admin.cjs',import.meta.url),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'uarl-return-fixture'}),write:async(next,etag)=>{assert.equal(etag,'uarl-return-fixture');stored=clone(next);writes++;}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Roster fixtures never contact deployment hooks or live storage'));
const auth={clientContext:{user:{email:'roster-fixture@example.test',app_metadata:{roles:['admin']}}}};
const request=async(method,body,context=auth)=>{const response=await module.exports.handler({httpMethod:method,...(body?{body:JSON.stringify(body)}:{})},context);return {status:response.statusCode,...JSON.parse(response.body)};};
assert.equal((await request('GET',null,{})).status,403);assert.equal(writes,0);
let read=await request('GET');assert.equal(read.status,200);assert.deepEqual(assignment(read.registry.published.drivers),assignment(next.drivers));assert.equal(writes,0,'An authenticated migration read is not a live or fixture write');assert.deepEqual(stored.published,old);
const draftRows=clone(read.registry.published.drivers);Object.assign(draftRows.find(row=>row.id==='will-uarl-d1'),{number:'34',manufacturer:'Ford',car:'Ford'});
let saved=await request('POST',{action:'saveDraft',dataset:'drivers',revision:stored.revision,data:draftRows});assert.equal(saved.status,200,saved.error);assert.equal(assignment(saved.registry.drafts.drivers)[0].number,'34');assert.equal(assignment(saved.registry.published.drivers)[0].number,'33','A later private draft stays private');
read=await request('GET');assert.equal(assignment(read.registry.drafts.drivers)[0].number,'34','Reload preserves revision-marked private edits');
saved=await request('POST',{action:'publish',dataset:'drivers',revision:stored.revision});assert.equal(saved.status,200,saved.error);read=await request('GET');assert.equal(assignment(read.registry.published.drivers)[0].number,'34','Explicit later publication survives source/read reconciliation');assert.deepEqual(stored.published.results,old.results);assert.deepEqual(stored.published.standings,old.standings);assert.deepEqual(stored.published['schedule-events'],old['schedule-events']);
console.log('PASS: approved current D1 Chevrolet #33 Will / #42/#43 unsigned, exact old-record migration and Admin parity, cached/API atomic data, unmodified historical results/points/other programs/NRRS plan, immutable idempotence, explicit removals and later private/published edits. No live writes.');

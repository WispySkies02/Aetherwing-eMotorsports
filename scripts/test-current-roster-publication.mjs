import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {applyPublication} from '../src/lib/published-content.mjs';
import {reconcileCurrentAssignments,reconcileCurrentProfiles} from '../src/lib/current-driver-updates.mjs';
const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs');
const seed=content.seeds(),old=structuredClone(seed);
for(const row of old.drivers){delete row.currentRosterRevision;if(row.id==='matty-kmart')Object.assign(row,{number:'29',status:'Shared Part-Time Entry',car:'SCR #29 PT',numberImage:'https://example.test/shared29.png',numberImageBackup:'https://example.test/upload29.png'});}
for(const row of old['roster-profiles']){delete row.currentRosterRevision;if(row.slug==='matty')Object.assign(row,{handle:'@mymainisgone98',numbers:'29',feature:'Part-Time Entry',bio:'StarClutch Racing alliance driver sharing the part-time Kmart #29 entry.'});if(row.slug==='eazy')row.handle='@Eazyonthafarilla';}
const before=structuredClone(old),merge=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical;
const datasets=merge(structuredClone(old));
const matty=datasets.drivers.find(row=>row.id==='matty-kmart');
assert.deepEqual([matty.number,matty.status,matty.numberImage,matty.numberImageBackup],['3','Full-Time','','']);
assert.equal(datasets['roster-profiles'].find(row=>row.slug==='matty').handle,'@matty_campbell');
assert.equal(datasets['roster-profiles'].find(row=>row.slug==='eazy').handle,'@deadmansrisin27_');
assert.deepEqual(datasets.results.map(row=>[row.scheduleId,row.entries]),before.results.map(row=>[row.scheduleId,row.entries]),'Public current-roster reconciliation preserves every historical result');
assert.deepEqual(datasets.standings,before.standings,'No standings rewrite');
// The lightweight art endpoint bypasses mergeCanonical and must independently normalize stale records.
const module={exports:{}};
new Function('require','module','exports',fs.readFileSync(new URL('../netlify/lib/_driver-art.cjs',import.meta.url),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:{revision:10,published:old}})}:require(name),module,module.exports);
const art=JSON.parse((await module.exports.handler({httpMethod:'GET'})).body);
assert.deepEqual(art.drivers.find(row=>row.id==='matty-kmart'),{id:'matty-kmart',profile:'matty',displayName:'Matty',competitionId:'kmart',number:'3',numberImage:'',numberImageBackup:''});
// Both current public responses and labeled cached snapshots correct identities before notifying views.
const dom=new JSDOM('<html><body></body></html>',{url:'https://example.test/'});
for(const state of ['published','cached']){
 applyPublication({datasets:structuredClone(old),state,revision:10},{},{document:dom.window.document,window:dom.window});
 const visible=dom.window.__AETHERWING_CONTENT__;
 assert.equal(visible.drivers.find(row=>row.id==='matty-kmart').number,'3');
 assert.equal(visible['roster-profiles'].find(row=>row.slug==='eazy').handle,'@deadmansrisin27_');
}
dom.window.close();
// The classic Admin editor must present the same migration before Save, while future edits survive.
const admin=fs.readFileSync(new URL('../public/admin/content-admin.js',import.meta.url),'utf8');
const block=admin.slice(admin.indexOf('  const migrateCurrentRoster='),admin.indexOf('  // v2.0.11'));
const context=vm.createContext({seeds:seed});vm.runInContext(block+'\nglobalThis.roster=migrateCurrentRoster;globalThis.drivers=normalizeDriverAssignments;',context);
const adminDrivers=JSON.parse(JSON.stringify(context.drivers(old.drivers))),adminProfiles=JSON.parse(JSON.stringify(context.roster('roster-profiles',old['roster-profiles'])));
assert.deepEqual(adminDrivers.find(row=>row.id==='matty-kmart'),matty);
assert.equal(adminProfiles.find(row=>row.slug==='matty').handle,'@matty_campbell');
assert.equal(adminProfiles.find(row=>row.slug==='eazy').handle,'@deadmansrisin27_');
const later={...adminDrivers.find(row=>row.id==='matty-kmart'),number:'8',status:'Part-Time',numberImage:'https://example.test/8.png'};
assert.deepEqual(JSON.parse(JSON.stringify(context.drivers([later]))),[later],'A saved later Admin change is not reverted by the migration');
// Classic Admin must not stamp a record while leaving secondary handles or links stale.
const optionalProfiles=structuredClone(before['roster-profiles']).filter(row=>['matty','eazy'].includes(row.slug));
for(const row of optionalProfiles){
  const legacy=row.slug==='matty'?'mymainisgone98':'Eazyonthafarilla';
  Object.assign(row,{username:legacy,robloxUsername:`@${legacy}`,profileUrl:`https://www.roblox.com/user.aspx?username=${legacy}`,identityLinks:[{href:`https://www.roblox.com/users/profile?username=%40${legacy}`}],imageUrl:`https://example.test/${legacy}.png`,sourceUrl:`https://example.test/${legacy}`,signatureLogo:'data:image/png;base64,SIGNATURE'});
}
assert.deepEqual(JSON.parse(JSON.stringify(context.roster('roster-profiles',optionalProfiles))),reconcileCurrentProfiles(optionalProfiles),'Classic and shared migrations agree on optional fields, encoded identity links and preserved media/source URLs');
const optionalEazy={...before.drivers.find(row=>row.id==='eazy-sunoco'),handle:'@Eazyonthafarilla',username:'Eazyonthafarilla',robloxUrl:'https://www.roblox.com/user.aspx?username=Eazyonthafarilla'};
assert.deepEqual(JSON.parse(JSON.stringify(context.drivers([optionalEazy]))),reconcileCurrentAssignments([optionalEazy]),'Optional assignment handles migrate without changing Eazy numbers/status/art');
const laterProfile={...reconcileCurrentProfiles(optionalProfiles)[0],username:'later_approved',profileUrl:'https://example.test/later_approved'};
assert.deepEqual(JSON.parse(JSON.stringify(context.roster('roster-profiles',[laterProfile]))),[laterProfile],'Marked later profile/link edits remain authoritative');
// Art replies are keyed by both assignment and number, including partial old replies.
const lineup=fs.readFileSync(new URL('../src/components/DriverLineup.astro',import.meta.url),'utf8');
const artBlock=lineup.slice(lineup.indexOf('  const rememberPublishedArt='),lineup.indexOf('  const profileWithPublishedSignature='));
const oldArtAssignment=structuredClone(before.drivers.find(row=>row.id==='matty-kmart'));
const artContext=vm.createContext({assignments:[oldArtAssignment],publishedArtById:new Map(),publishedSignatureBySlug:new Map()});
vm.runInContext(artBlock+'\nglobalThis.remember=rememberPublishedArt;globalThis.decorate=assignmentWithPublishedArt;',artContext);
artContext.remember([{id:'matty-kmart',number:'29',numberImage:'https://example.test/old29.png',numberImageBackup:'https://example.test/old29-upload.png'}]);
const genuine3={...matty,numberImage:'https://example.test/genuine3.png',numberImageBackup:''};
artContext.assignments=[genuine3];
artContext.remember([{id:'matty-kmart',number:'3'}]);
assert.equal(artContext.decorate(genuine3).numberImage,genuine3.numberImage,'An omitted art field must not inherit the cached #29 after the number changes');
for(const stale of [{id:'matty-kmart',number:'29',numberImage:'https://example.test/stale29.png'},{id:'matty-kmart',numberImage:'https://example.test/numberless29.png',numberImageBackup:'https://example.test/numberless29-upload.png'}]){
  artContext.remember([stale]);assert.equal(artContext.decorate(genuine3).numberImage,genuine3.numberImage,'Explicit old-number and numberless legacy art cannot replace the current #3 image');
}
artContext.remember([{id:'matty-kmart',numberImage:'',numberImageBackup:''}]);
assert.equal(artContext.decorate(genuine3).numberImage,'','An explicit empty partial payload is a safe artwork removal');
artContext.remember([{id:'matty-kmart',number:'3',numberImage:genuine3.numberImage}]);
const futureArt={...genuine3,number:'7',numberImage:'https://example.test/current7.png'};
artContext.assignments=[futureArt];artContext.remember([{id:'matty-kmart',number:'7'}]);
assert.equal(artContext.decorate(futureArt).numberImage,futureArt.numberImage,'A later approved number cannot inherit the former #3 cache');
const eazyArt={...before.drivers.find(row=>row.id==='eazy-kmart'),numberImage:'https://example.test/eazy29.png'};
artContext.assignments=[eazyArt];artContext.remember([eazyArt]);artContext.remember([{id:eazyArt.id,numberImage:'',numberImageBackup:''}]);
assert.equal(artContext.decorate(eazyArt).numberImage,'','Other assignments retain their existing partial-removal behavior');
assert.deepEqual(old,before,'Integration checks do not mutate their input');
console.log('PASS: old public/CMS snapshots, art endpoint, cached hydration and classic Admin agree; history, standings and later saves remain authoritative.');

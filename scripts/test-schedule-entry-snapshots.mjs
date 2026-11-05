import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs');
const siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const seed=content.seeds(),clone=structuredClone;
const calendarKey='schedule-events',rosterId='wispy-nrrs';
const findRace=(calendar,league,round)=>calendar.find(event=>event.league===league&&event.round===`ROUND ${round}`);
const historical=clone(findRace(seed[calendarKey],'nrrs',22));
assert.equal(historical.date,'2026-10-06');assert.equal(historical.entryListMode,'custom');
assert.deepEqual(historical.entries.map(({assignmentId,driver,number})=>({assignmentId,driver,number})),[{assignmentId:rosterId,driver:'Hailey',number:'32'}]);
Object.assign(historical.entries[0],{entryStatus:'Raced',sourceNote:'Approved historical event entry.',attendanceConfirmed:true});
const currentDrivers=seed.drivers.map(row=>row.id===rosterId?{...row,number:'28'}:clone(row));
const published=clone(seed);published.drivers=currentDrivers;
published[calendarKey]=published[calendarKey].map(event=>event.league==='nrrs'&&event.round==='ROUND 22'?clone(historical):event);
// A self-contained copy of the live shift scenario, without external fixtures
// or changes to canonical data: the current number is 28, the event used 32.
findRace(published[calendarKey],'uarl-d1',7).date='2026-11-08';
const registry={version:1,revision:115,published,drafts:{},history:[]};
const validate=(rows,state=registry,context={})=>content.validate(calendarKey,rows,state,context);
const shiftD1=rows=>content.normalize(calendarKey,rows.map(event=>{
 if(event.league!=='uarl-d1'||event.date<'2026-11-08')return clone(event);
 const date=new Date(`${event.date}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+7);return {...clone(event),date:date.toISOString().slice(0,10)};
}));
const shifted=shiftD1(published[calendarKey]),before=clone(registry);
assert.equal(validate(shifted),'','An unrelated D1 shift may retain the approved NRRS #32 entry');
assert.deepEqual(registry,before,'Validation does not rewrite stored identities or its input registry');
assert.deepEqual(findRace(shifted,'nrrs',22),historical,'All historical fields and extra entry metadata remain intact');

const one=event=>[clone(event)];
const edited=(change,event=historical)=>{const copy=clone(event);change(copy);return copy;};
const rejected=(event,label,state=registry,context={})=>assert.notEqual(validate(one(event),state,context),'',label);
assert.equal(validate(one(edited(event=>{event.entries[0].entryStatus='Confirmed';event.entries[0].sourceNote='Updated attendance note.';}))),'','Nonidentity metadata remains editable');
assert.equal(validate(one(edited(event=>{event.entries[0].number='28';}))),'','An intentional update to the current roster identity remains valid');
rejected(edited(event=>{event.entries[0].number='31';}),'A new unapproved number is rejected');
rejected(edited(event=>{event.entries[0].driver='Wrong Name';}),'A new unapproved driver name is rejected');
rejected(edited(event=>{event.entries[0].assignmentId='unknown-driver';}),'A new unapproved assignment is rejected');
rejected(edited(event=>{event.entries.push(clone(event.entries[0]));}),'Recorded entries still cannot duplicate an assignment');
rejected(edited(event=>{event.entries.push({...event.entries[0],number:'28'});}),'A historical and current identity cannot duplicate one assignment');
rejected(edited(event=>{event.round='ROUND 99';}),'The old identity cannot be copied into a new round');
rejected(edited(event=>{event.league='uarl-d1';event.leagueName='UARL D1';}),'A matching round in another league cannot borrow an exception');

// Stable event IDs and rounds survive an ordinary reschedule or venue edit.
assert.equal(validate(one(edited(event=>{event.date='2027-01-05';event.title='Rescheduled approved event';event.track='Revised venue';}))),'','The same round keeps its recorded identity through a date/title change');
assert.equal(validate(one({...clone(historical),routeId:'nrrs-round-22',date:'2026-10-13'})),'','Pinning the existing round route does not create a different event');
const explicit={...clone(historical),routeId:'approved-nrrs-event'};
const explicitState={published:{drivers:currentDrivers,[calendarKey]:one(explicit)},drafts:{}};
assert.equal(validate(one({...clone(explicit),date:'2026-10-20',round:'',title:'Moved race'}),explicitState),'');
const eventId={...clone(historical),eventId:'approved-nrrs-event'};
assert.equal(validate(one(eventId),explicitState),'','Equivalent explicit routeId/eventId values identify the same event');
rejected({...clone(explicit),routeId:'new-nrrs-event'},'Changing the stable route cannot authorize an old entry',explicitState);
rejected({...clone(explicit),league:'uarl-d1',leagueName:'UARL D1'},'Explicit IDs remain scoped to their approved league',explicitState);
const roundless={...clone(historical),round:''};
const roundlessState={published:{drivers:currentDrivers,[calendarKey]:one(roundless)},drafts:{}};
assert.equal(validate(one(roundless),roundlessState),'');
rejected({...clone(roundless),date:'2026-10-13'},'A roundless date change cannot silently identify a new event as historical',roundlessState);
rejected({...clone(roundless),title:'Different event'},'Roundless events require the same approved title',roundlessState);

// Retirement and renaming must not invalidate an already recorded identity.
const retired=edited(event=>{event.entries[0].assignmentId='retired-nrrs-entry';event.entries[0].driver='Recorded Historical Name';});
const retiredState={published:{drivers:currentDrivers,[calendarKey]:one(retired)},drafts:{}};
assert.equal(validate(one(retired),retiredState),'','A published retired assignment remains a valid event snapshot');
rejected({...clone(retired),round:'ROUND 99'},'A retired assignment cannot be newly added to another event',retiredState);
const renamed=edited(event=>{event.entries[0].driver='Wispy';});
assert.equal(validate(one(renamed),{published:{drivers:currentDrivers,[calendarKey]:one(renamed)},drafts:{}}),'','Approved historical names remain valid after a current rename');

// Neither private drafts nor the caller's proposed public candidate can
// approve themselves; an explicitly empty publication also stays empty.
const privateOnly=edited(event=>{event.entries[0].number='66';});
const privateState={published:{drivers:currentDrivers,[calendarKey]:[]},drafts:{[calendarKey]:one(privateOnly)}};
rejected(privateOnly,'A private draft is not an approved snapshot',privateState);
rejected(privateOnly,'The proposed publication cannot approve itself',privateState,{published:{...privateState.published,[calendarKey]:one(privateOnly)}});
assert.equal(validate(one(historical),{published:{drivers:currentDrivers},drafts:{}}),'','A trusted bundled snapshot is available before the first calendar publication');
rejected(historical,'An explicit empty calendar does not restore trusted-seed exceptions',{published:{drivers:currentDrivers,[calendarKey]:[]},drafts:{}});
rejected(historical,'A malformed publication does not grant seed exceptions',{published:{drivers:currentDrivers,[calendarKey]:null},drafts:{}});
for(const update of [entry=>{entry.driver=['Hailey'];},entry=>{entry.number=['28'];},entry=>{entry.number=null;},entry=>{entry.assignmentId={id:rosterId};},entry=>{entry.driver='<script>';},entry=>{Object.defineProperty(entry,'__proto__',{value:'bad',enumerable:true});}])rejected(edited(event=>update(event.entries[0])),'Malformed or unsafe entries cannot use a snapshot exception');
const untrustedHtml=edited(event=>{event.entries[0].driver='<script>';});
rejected(untrustedHtml,'Even a stored unsafe value cannot bypass plain-text validation',{published:{drivers:currentDrivers,[calendarKey]:one(untrustedHtml)},drafts:{}});
for(const [field,value] of [['driver',''],['driver','   '],['assignmentId',''],['assignmentId','   ']]){
 const malformed=edited(event=>{event.entries[0][field]=value;});
 rejected(malformed,`An approved ${field} cannot be empty or whitespace`,{published:{drivers:currentDrivers,[calendarKey]:one(malformed)},drafts:{}});
}
const numberless=edited(event=>{event.round='ROUND 99';event.entries=[{assignmentId:'numberless-fixture',driver:'Numberless Driver',number:'',entryStatus:'Confirmed'}];});
assert.equal(validate(one(numberless),{published:{drivers:[...currentDrivers,{...currentDrivers[0],id:'numberless-fixture',displayName:'Numberless Driver',competitionId:'nrrs',number:''}],[calendarKey]:[]},drafts:{}}),'','A legitimate current numberless assignment may still use an empty number');

// Use the real authenticated handler and actual normalize/validate code with
// in-memory storage. No production Identity, Blobs or build hook is contacted.
let stored=clone(registry),writes=0;
const module={exports:{}};
new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('../netlify/lib/_site-admin.cjs',import.meta.url),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'schedule-snapshot-etag'}),write:async(next,etag)=>{assert.equal(etag,'schedule-snapshot-etag');stored=clone(next);writes++;}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Schedule snapshot tests must not make an external request or deploy'));
const actor={clientContext:{user:{email:'schedule-snapshot@example.test',app_metadata:{roles:['admin']}}}};
const action=async(action,data,revision=stored.revision,user=actor)=>{const result=await module.exports.handler({httpMethod:'POST',body:JSON.stringify({action,dataset:calendarKey,...(data===undefined?{}:{data}),revision})},user);return {status:result.statusCode,...JSON.parse(result.body)};};
const reload=async()=>{const result=await module.exports.handler({httpMethod:'GET'},actor);assert.equal(result.statusCode,200);return JSON.parse(result.body).registry;};
const historicalKeys=['results','wins','standings','milestones','news','drivers','roster-profiles'];
const historicalCollections=Object.fromEntries(historicalKeys.map(key=>[key,clone(stored.published[key])]));
let result=await action('saveDraft',shifted);assert.equal(result.status,200,result.error);assert.deepEqual(findRace(stored.drafts[calendarKey],'nrrs',22),historical);assert.deepEqual(stored.published[calendarKey],published[calendarKey],'Drafting does not publish the shift');
assert.deepEqual(findRace((await reload()).drafts[calendarKey],'nrrs',22),historical,'A fresh Admin read retains the draft snapshot');
result=await action('publish',shifted);assert.equal(result.status,200,result.error);assert.equal(stored.drafts[calendarKey],undefined);assert.equal(findRace(stored.published[calendarKey],'uarl-d1',7).date,'2026-11-15');assert.deepEqual(findRace(stored.published[calendarKey],'nrrs',22),historical);assert.deepEqual(findRace((await reload()).published[calendarKey],'nrrs',22),historical,'Published snapshot survives another read');
for(const key of historicalKeys)assert.deepEqual(stored.published[key],historicalCollections[key],`${key}: shifting D1 preserves existing historical data and current roster`);
const protectedState=clone(stored),writeCount=writes;
const incorrect=stored.published[calendarKey].map(event=>event.league==='nrrs'&&event.round==='ROUND 22'?edited(race=>{race.entries[0].number='31';},event):event);
result=await action('publish',incorrect);assert.equal(result.status,400);assert.match(result.error,/name and number/);assert.equal(writes,writeCount);assert.deepEqual(stored,protectedState,'A rejected new identity does not alter the saved snapshot');
result=await action('saveDraft',shifted,stored.revision-1);assert.equal(result.status,409);assert.equal(writes,writeCount);
result=await action('saveDraft',shifted,stored.revision,{clientContext:{user:{app_metadata:{roles:['paint-admin']}}}});assert.equal(result.status,403);assert.equal(writes,writeCount,'Paint-only accounts cannot edit the Calendar');
result=await action('saveDraft',stored.published[calendarKey]);assert.equal(result.status,200,result.error);result=await action('publishAll');assert.equal(result.status,200,result.error);assert.deepEqual(findRace(stored.published[calendarKey],'nrrs',22),historical,'Publishing saved drafts also preserves recorded identities');
for(const key of historicalKeys)assert.deepEqual(stored.published[key],historicalCollections[key]);
console.log('PASS: approved event-entry snapshots survive unrelated D1 shifts, drafts/publication/readback and current number/name changes; stable event/league scoping, current-roster edits, private-draft isolation, duplicate/malicious-entry rejection, auth/conflict guards and historical collections remain protected. No live writes.');

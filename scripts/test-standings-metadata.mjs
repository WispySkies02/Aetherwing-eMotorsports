import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {manufacturerChoices,normalizeManufacturer,standingIdentity,standingMetadata,standingLabels,normalizeStandingMetadata} from '../src/lib/standings-metadata.mjs';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs'),seed=content.seeds();
const siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url)),clone=structuredClone;
const normalize=boards=>content.normalize('standings',boards);
const check=boards=>content.validate('standings',normalize(boards));
const board=league=>({...clone(seed.standings[0]),id:league,league});

for(const league of ['nrrs','uarl','uarl-d1'])assert.deepEqual(manufacturerChoices(league),['Ford','Chevrolet','Toyota','Cadillac']);
assert.deepEqual(manufacturerChoices('kmart'),['Ford','Chevrolet','Toyota','Dodge']);
assert.deepEqual(manufacturerChoices('sunoco'),['Ford','Chevrolet','Toyota','RAM']);
assert.deepEqual(manufacturerChoices('open'),[]);assert.deepEqual(manufacturerChoices(),[]);
const mutableChoices=manufacturerChoices('nrrs');mutableChoices.push('Unexpected');assert.equal(manufacturerChoices('nrrs').length,4,'A caller cannot change shared choices');
for(const [input,expected] of [[' Chevy ','Chevrolet'],['CHEVROLET','Chevrolet'],['toyota','Toyota'],['ram','RAM'],['',''],['   ',''],['Honda','Honda'],[null,'']])assert.equal(normalizeManufacturer(input),expected);
for(const name of ['Hailey','Wispy','@Aokikoto','Hailey Bell'])assert.equal(standingIdentity({driver:name,number:'32'}),'hailey');
assert.equal(standingIdentity({driver:'Matty',number:'29'}),standingIdentity({driver:'@matty_campbell',number:'3'}));
assert.notEqual(standingIdentity({driver:'Hailey',number:'15'}),standingIdentity({driver:'Different Driver',number:'15'}),'Reusing a number does not reuse driver metadata');
assert.deepEqual(standingLabels({points:9999,position:'P1',chaseEligible:true}),[],'Rank and eligibility do not invent awards');
assert.deepEqual(standingLabels({chaseLocked:true,regularSeasonChampion:true}),['CHASE LOCKED','REGULAR-SEASON CHAMPION']);
assert.deepEqual(standingLabels({chaseLocked:'true',regularSeasonChampion:1}),[],'Only strict booleans produce labels');

const regular=Object.freeze({driver:'Wispy',number:'15',points:999,manufacturer:'',chaseLocked:false,regularSeasonChampion:false});
const chase=Object.freeze({driver:'Hailey Bell',number:'54',points:120,position:'P2',manufacturer:'RAM',chaseLocked:true,regularSeasonChampion:true});
const merged=standingMetadata({rows:[regular],chaseRows:[chase]},chase);
assert.deepEqual(merged,{...chase,manufacturer:'',chaseLocked:false,regularSeasonChampion:false},'Explicit regular Auto/false edits override stale Chase metadata');
assert.equal(merged.points,120);assert.equal(merged.number,'54','Metadata does not replace a Chase row identity or score');
const regularWithoutMetadata={driver:'Hailey',number:'15',points:999};
assert.deepEqual(standingMetadata({rows:[regularWithoutMetadata],chaseRows:[chase]},regularWithoutMetadata),{...regularWithoutMetadata,manufacturer:'RAM',chaseLocked:true,regularSeasonChampion:true},'Missing regular properties inherit existing Chase metadata');
assert.deepEqual(regularWithoutMetadata,{driver:'Hailey',number:'15',points:999},'Resolving metadata never edits the input');
assert.deepEqual(standingMetadata({rows:[regular]}, {...chase,driver:'Different Driver'}),{...chase,driver:'Different Driver'},'Number-only matches never transfer metadata');
const inherited=Object.assign(Object.create({manufacturer:'Ford',chaseLocked:false}),{driver:'Hailey'});
assert.equal(standingMetadata({rows:[inherited]},chase).manufacturer,'RAM','Only own regular metadata counts as an explicit edit');

assert.deepEqual(normalize(seed.standings),seed.standings,'Legacy canonical boards acquire no invented flags or changed makes');
const stale=board('sunoco');stale.rows=[{driver:'Hailey',number:'54',points:10,manufacturer:'',chaseLocked:false,regularSeasonChampion:false},{driver:'Will',number:'42',points:20,manufacturer:'Chevy',regularSeasonChampion:true}];stale.chaseRows=[{driver:'Wispy',number:'54',points:3,manufacturer:'RAM',chaseLocked:true,regularSeasonChampion:true},{driver:'Will',number:'42',points:4}];
const staleBefore=clone(stale),resolved=normalizeStandingMetadata(stale);
assert.deepEqual(stale,staleBefore,'Whole-board normalization is immutable');
assert.deepEqual(resolved.chaseRows[0],{...stale.chaseRows[0],manufacturer:'',chaseLocked:false,regularSeasonChampion:false});
assert.equal(resolved.rows[1].manufacturer,'Chevrolet');assert.equal(resolved.chaseRows[1].manufacturer,'Chevrolet');assert.equal(resolved.chaseRows[1].regularSeasonChampion,true);
assert.equal(check([stale]),'','A new regular winner is not blocked by an explicitly cleared stale Chase winner');
assert.equal(resolved.chaseRows[0].points,3);assert.equal(resolved.chaseRows[1].points,4);
const inheritedWinner=board('sunoco');inheritedWinner.rows=[{driver:'Hailey',number:'54',points:99}];inheritedWinner.chaseRows=[{driver:'Wispy',number:'54',points:12,manufacturer:'RAM',chaseLocked:true,regularSeasonChampion:true}];
const inheritedResolved=normalizeStandingMetadata(inheritedWinner);assert.equal(inheritedResolved.rows[0].regularSeasonChampion,true);assert.equal(inheritedResolved.rows[0].manufacturer,'RAM');assert.equal(inheritedResolved.rows[0].points,99);assert.equal(check([inheritedWinner]),'');

const fixture=clone(seed.standings);fixture[0].chaseActive=false;Object.assign(fixture[0].rows[0],{manufacturer:'Cadillac',chaseLocked:true,regularSeasonChampion:true});
assert.equal(check(fixture),'','A manually locked regular-season driver does not require an active Chase');
const another=(change,source=fixture)=>{const next=clone(source);change(next);return next;};
for(const [league,make] of [['nrrs','Ford'],['uarl','Cadillac'],['uarl-d1','Toyota'],['kmart','Dodge'],['sunoco','RAM']]){const item=board(league);item.rows=[{driver:'Fixture Driver',number:'1',points:1,manufacturer:make}];assert.equal(check([item]),'');item.rows[0].manufacturer='';assert.equal(check([item]),'','Blank manufacturer means Auto');}
for(const [league,make] of [['nrrs','Dodge'],['uarl','RAM'],['uarl-d1','Dodge'],['kmart','Cadillac'],['kmart','RAM'],['sunoco','Dodge']]){const item=board(league);item.rows=[{driver:'Fixture Driver',number:'1',points:1,manufacturer:make}];assert.match(check([item]),/manufacturer/);}
for(const make of [null,12,true,[],{},'x'.repeat(81)])assert.notEqual(check(another(rows=>{rows[0].rows[0].manufacturer=make;})),'','Malformed/oversized manufacturer is rejected');
for(const field of ['chaseLocked','regularSeasonChampion'])for(const value of ['yes',1,null,undefined])assert.notEqual(check(another(rows=>{rows[0].rows[0][field]=value;})),'',`${field} must stay boolean`);
assert.match(check(another(rows=>{rows[0].rows[1].regularSeasonChampion=true;})),/one regular-season champion/);
assert.match(check(another(rows=>{rows[0].rows[0].driver=' ';})),/driver name/);
const sameWinner=another(rows=>{rows[0].rows[0].driver='Hailey';rows[0].chaseRows=[{...rows[0].rows[0],driver:'Wispy',number:'Different number',points:10}];});assert.equal(check(sameWinner),'','The same canonical person may appear in regular and Chase data');
const partTime=clone(seed.standings);Object.assign(partTime.find(row=>row.league==='kmart').ptEntry.drivers[0],{manufacturer:'Chevy',chaseLocked:false,regularSeasonChampion:false});assert.equal(check(partTime),'');assert.equal(normalize(partTime).find(row=>row.league==='kmart').ptEntry.drivers[0].manufacturer,'Chevrolet');
assert.match(check(another(rows=>{rows.find(row=>row.league==='kmart').ptEntry.drivers[0].chaseLocked='yes';},partTime)),/chaseLocked/);
assert.match(check(another(rows=>{rows.find(row=>row.league==='kmart').ptEntry.drivers[0].manufacturer='RAM';},partTime)),/manufacturer/);
const legacyOther=board('open');legacyOther.rows=[{driver:'Fixture',number:'1',points:1,manufacturer:'Honda'}];assert.equal(check([legacyOther]),'','Unconfigured leagues retain bounded legacy manufacturer text');

// Merging must not erase invalid raw values and thereby turn them into saves.
for(const [field,value] of [['manufacturer','Dodge'],['manufacturer','x'.repeat(81)],['manufacturer',null],['chaseLocked','yes'],['regularSeasonChampion',1]]){
 const invalid={...clone(stale),league:'sunoco'};invalid.chaseRows[0][field]=value;
 assert.equal(normalizeStandingMetadata(invalid),invalid,'Invalid raw metadata remains unchanged for validation');assert.notEqual(check([invalid]),'');
}
const unsafe=clone(stale);unsafe.league='open';unsafe.chaseRows[0].manufacturer='<script>';assert.equal(normalizeStandingMetadata(unsafe),unsafe);assert.match(check([unsafe]),/plain text/);

// Actual authorization, normalize/validate and persistence handlers are used;
// storage and all network/build hooks are confined to this process.
let stored={version:1,revision:0,published:clone(seed),drafts:{},history:[]},writes=0;
const module={exports:{}};
new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('../netlify/lib/_site-admin.cjs',import.meta.url),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'metadata-etag'}),write:async(next,etag)=>{assert.equal(etag,'metadata-etag');stored=clone(next);writes++;}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Standings metadata tests must not contact a service or deploy'));
const actor={clientContext:{user:{email:'standings-metadata@example.test',app_metadata:{roles:['admin']}}}};
const action=async(action,dataset='standings',data,revision=stored.revision,user=actor)=>{const result=await module.exports.handler({httpMethod:'POST',body:JSON.stringify({action,dataset,...(data===undefined?{}:{data}),revision})},user);return {status:result.statusCode,...JSON.parse(result.body)};};
const reload=async()=>{const result=await module.exports.handler({httpMethod:'GET'},actor);assert.equal(result.statusCode,200);return JSON.parse(result.body).registry;};
const protectedKeys=['drivers','roster-profiles','wins','milestones','news','alliances','schedule-events'];
const protectedData=Object.fromEntries(protectedKeys.map(key=>[key,clone(stored.published[key])]));
let result=await action('saveDraft','standings',fixture);assert.equal(result.status,200,result.error);assert.deepEqual(stored.published.standings,seed.standings,'Private drafts do not change public standings');assert.equal((await reload()).drafts.standings[0].rows[0].manufacturer,'Cadillac');assert.equal(stored.drafts.standings[0].rows[0].regularSeasonChampion,true);
result=await action('publish','standings',stored.drafts.standings);assert.equal(result.status,200,result.error);assert.equal(stored.drafts.standings,undefined);const published=(await reload()).published.standings;assert.equal(published[0].chaseActive,false);assert.deepEqual(standingLabels(published[0].rows[0]),['CHASE LOCKED','REGULAR-SEASON CHAMPION']);
const feed=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(clone(stored.published));assert.equal(feed.standings[0].rows[0].manufacturer,'Cadillac');assert.equal(feed.standings[0].rows[0].chaseLocked,true);
const beforeBad=clone(stored),beforeWrites=writes;
for(const bad of [another(rows=>{rows[0].rows[0].chaseLocked='yes';},published),another(rows=>{rows[0].rows[1].regularSeasonChampion=true;},published),another(rows=>{rows[0].rows[0].manufacturer='Dodge';},published)]){result=await action('publish','standings',bad);assert.equal(result.status,400);assert.equal(writes,beforeWrites);assert.deepEqual(stored,beforeBad);}
const rawInvalid=clone(stale);rawInvalid.chaseRows[0].chaseLocked='yes';result=await action('saveDraft','standings',[rawInvalid]);assert.equal(result.status,400,'A false regular flag cannot mask an invalid incoming Chase flag');assert.equal(writes,beforeWrites);
result=await action('saveDraft','standings',fixture,stored.revision-1);assert.equal(result.status,409);result=await action('saveDraft','standings',fixture,stored.revision,{clientContext:{user:{app_metadata:{roles:['paint-admin']}}}});assert.equal(result.status,403);assert.equal(writes,beforeWrites);
const cleared=clone(stored.published.standings);Object.assign(cleared[0].rows[0],{manufacturer:'',chaseLocked:false,regularSeasonChampion:false});result=await action('saveDraft','standings',cleared);assert.equal(result.status,200,result.error);result=await action('discardDraft');assert.equal(result.status,200);assert.equal(stored.drafts.standings,undefined);assert.equal(stored.published.standings[0].rows[0].manufacturer,'Cadillac','Discarding a draft keeps published labels/make');
const points=clone(stored.published.standings);Object.assign(points[0],{autoPoints:true,lastResultDate:'2098-12-31',lastResultScheduleId:''});result=await action('publish','standings',points);assert.equal(result.status,200,result.error);const beforePoints=stored.published.standings[0].rows[0].points;
const race={...clone(seed.results[0]),scheduleId:'fixture-metadata-race',league:'nrrs',leagueName:'NRRS',title:'Metadata points fixture',track:'Fixture Raceway',date:'2099-01-01',entries:[{driver:points[0].rows[0].driver,number:points[0].rows[0].number,start:1,finish:1,stage1Finish:0,stage2Finish:0,featuredDriver:true}]};
for(const key of ['pointsSource','standingsMode','coverage','sourceNote','sourceUrl'])delete race[key];
result=await action('publish','results',[race,...stored.published.results]);assert.equal(result.status,200,result.error);const advanced=stored.published.standings[0].rows.find(row=>standingIdentity(row)===standingIdentity(points[0].rows[0]));assert.equal(advanced.points,beforePoints+40);assert.equal(advanced.manufacturer,'Cadillac');assert.equal(advanced.chaseLocked,true);assert.equal(advanced.regularSeasonChampion,true,'Auto points never revoke an explicit manual title');assert.equal(stored.published.standings[0].chaseActive,false);
result=await action('saveDraft','standings',[stale]);assert.equal(result.status,200,result.error);result=await action('publishAll');assert.equal(result.status,200,result.error);assert.equal(stored.published.standings[0].chaseRows[0].regularSeasonChampion,false);assert.equal(stored.published.standings[0].chaseRows[1].regularSeasonChampion,true,'Atomic publication uses resolved regular metadata');
for(const key of protectedKeys)assert.deepEqual(stored.published[key],protectedData[key],`${key}: metadata changes preserve unrelated source data`);
console.log('PASS: league manufacturer choices/aliases, explicit manual labels, driver-based regular/Chase mirroring, raw invalid-input guards, optional legacy data, per-board champion uniqueness, private drafts/discard/publish/readback, authorization/conflicts and metadata-preserving automatic points. No live writes.');

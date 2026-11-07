import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {homeStandings,homeStandingKey} from '../src/lib/home-standings.mjs';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs'),clone=structuredClone;
const seed=content.seeds(),normalize=boards=>content.normalize('standings',boards),validate=boards=>content.validate('standings',normalize(boards));
const nrrs={id:'nrrs',league:'nrrs',title:'NRRS approved title',subtitle:'NRRS approved snapshot',status:'THE CHASE',cutoffAfter:6,cutoffLabel:'Obsolete Top 6',rows:[{driver:'Will',number:'94',position:'P1',points:100},{driver:'Wispy',number:'32',position:'P2',points:90,highlight:true}]};
const kmart={id:'kmart',league:'kmart',title:'Kmart regular title',subtitle:'Regular Round 12',status:'REGULAR SEASON',cutoffAfter:6,cutoffLabel:'Chase cutoff · Top 6 full-time drivers',rows:[{driver:'Will',number:'24',position:'P1',points:200,delta:'+90'},{driver:'Hailey',number:'15',position:'P2',points:190,delta:'+80',highlight:true},{driver:'Different Driver',number:'15',points:180},{driver:'Hailey',number:'24',points:170}],chaseRows:[{driver:'Hailey Bell',number:'15',position:'P1',points:1001,highlight:true},{driver:'Will',number:'24',position:'P2',points:990}],chaseTitle:'Kmart Chase points',chaseSubtitle:'Chase Round 1'};
const sunoco={id:'sunoco',league:'sunoco',title:'Sunoco regular',subtitle:'Regular snapshot',status:'NOT YET ACTIVE',rows:[{driver:'Hailey',number:'54',points:261,highlight:true}],chaseRows:[{driver:'Hailey',number:'54',points:12}],chaseTitle:'Truck Chase',chaseSubtitle:'Separate Chase snapshot'};
const drivers=[
  {id:'nrrs-hailey',competitionId:'nrrs',displayName:'Hailey',profile:'hailey',number:'32',numberImage:'/nrrs-32.png'},
  {id:'wrong-driver',competitionId:'kmart',displayName:'Different Driver',number:'99',numberImage:'/wrong-driver.png'},
  {id:'wrong-league',competitionId:'sunoco',displayName:'Hailey',number:'15',numberImage:'/wrong-league.png'},
  {id:'kmart-hailey',competitionId:'kmart',displayName:'Hailey Bell',number:'15',numberImage:'/kmart-15.png'},
  {id:'kmart-will',competitionId:'kmart',displayName:'Will',number:'24',numberImage:'/kmart-24.png'},
  {id:'sunoco-hailey',competitionId:'sunoco',displayName:'Hailey',number:'54',numberImage:'/sunoco-54.png'}
];
const boards=[kmart,sunoco,nrrs],before=clone({boards,drivers});
const legacy=homeStandings(boards,drivers);
assert.equal(legacy.board,nrrs,'Legacy datasets prefer NRRS even if it is not first');assert.equal(legacy.table,'regular');assert.equal(legacy.cutoff,5);assert.equal(legacy.cutoffLabel,'Chase cutoff · Top 5');
assert.equal(legacy.title,nrrs.title);assert.equal(legacy.subtitle,nrrs.subtitle);assert.equal(legacy.status,nrrs.status);assert.equal(legacy.leader,nrrs.rows[0]);assert.equal(legacy.focusRow,nrrs.rows[1]);assert.equal(legacy.focusAssignment,drivers[0]);assert.equal(legacy.teamLabel,'Aetherwing car');
assert.equal(legacy.focusGap,'-10');
assert.notEqual(legacy.rows,nrrs.rows,'Presentation receives an independent row list');assert.deepEqual(legacy.rows,nrrs.rows);
const featured={...kmart,featuredOnHome:true},selected=homeStandings([nrrs,featured,sunoco],drivers);
assert.equal(selected.board,featured);assert.equal(selected.league,'kmart');assert.equal(selected.table,'regular');assert.equal(selected.cutoff,6);assert.equal(selected.cutoffLabel,kmart.cutoffLabel);
assert.equal(selected.focusRow,kmart.rows[1]);assert.equal(selected.leader,kmart.rows[0]);assert.equal(selected.focusAssignment,drivers[3]);assert.equal(selected.focusAssignment.numberImage,'/kmart-15.png');assert.equal(selected.teamLabel,'Highlighted driver / team car');
assert.deepEqual(selected.teamNumbers,['24','15']);assert.deepEqual(selected.teamDrivers,['will','hailey']);assert.deepEqual(selected.teamKeys,['will|24','hailey|15']);
assert.equal(homeStandingKey(kmart.rows[1]),'hailey|15');assert.equal(homeStandingKey({driver:'@Aokikoto',number:' 15 '}),'hailey|15');
assert.equal(selected.teamKeys.includes(homeStandingKey(kmart.rows[2])),false,'A rival with the same number is not a team car');
assert.equal(selected.teamKeys.includes(homeStandingKey(kmart.rows[3])),false,'Two valid driver/number pairs do not authorize their crossed combination');
assert.equal(selected.rows[0].delta,'+90','The model preserves the published cutoff delta; presentation derives leader gap independently');
assert.equal(selected.focusGap,'-10','To leader uses scores rather than the published cutoff delta');
const noCorrectArt=homeStandings([featured],drivers.filter(row=>row.id!=='kmart-hailey'));
assert.equal(noCorrectArt.focusAssignment,null,'Neither another league nor another driver can supply number artwork');assert.ok(noCorrectArt.teamKeys.includes('hailey|15'),'An explicitly highlighted row remains highlighted without matching art');
assert.equal(homeStandings([featured],drivers.map(row=>({...row,active:false}))).focusAssignment,null,'An explicitly inactive assignment is not current artwork');
for(const car of ['', '   ', null, undefined]){
  const blank=homeStandings([{...kmart,rows:[{driver:'Hailey',number:car,points:1}]}],[{competitionId:'kmart',displayName:'Hailey',number:'',numberImage:'/unknown-number.png'}]);
  assert.equal(blank.focusAssignment,null,'A missing number cannot authorize number artwork, even if an assignment is also blank');assert.deepEqual(blank.teamKeys,[],'An unknown car number does not establish an assignment match');
}
assert.equal(homeStandings([{...kmart,rows:[{driver:' ',number:'15',points:1}]}],[{competitionId:'kmart',displayName:' ',number:'15',numberImage:'/unknown-driver.png'}]).focusAssignment,null,'A missing driver identity cannot authorize number artwork');
assert.equal(homeStandings([{...kmart,rows:[{driver:'Hailey',number:'15',points:1}]}],[{competitionId:'kmart',displayName:'Different Driver',number:'15',numberImage:'/rival-15.png'}]).focusAssignment,null,'An exact number on a different driver cannot supply artwork');
const noHighlight={...kmart,featuredOnHome:true,rows:kmart.rows.map(row=>({...row,highlight:false}))};
assert.equal(homeStandings([nrrs,noHighlight],drivers).focusRow,noHighlight.rows[0],'Without an explicit highlight, the first row is the focus');
assert.equal(homeStandings([noHighlight],drivers).focusGap,'LEADER','A leading focus does not display its cutoff margin as a leader gap');
for(const rows of [[{driver:'Will',points:null,pointsPending:true}],[{driver:'Will',points:100},{driver:'Hailey',points:null,highlight:true}],[{driver:'Will',points:100},{driver:'Hailey',points:90,pointsPending:true,highlight:true}],[{driver:'Will',points:'100'},{driver:'Hailey',points:90,highlight:true}]])assert.equal(homeStandings([{...kmart,rows}]).focusGap,'—','Unpublished/pending/nonnumeric points never invent a leader gap');
for(const points of [NaN,Infinity,-Infinity,undefined])assert.equal(homeStandings([{...kmart,rows:[{driver:'Will',points:100},{driver:'Hailey',points,highlight:true}]}]).focusGap,'—','Non-finite/missing points cannot become a leader gap');
assert.equal(homeStandings([{...kmart,rows:[{driver:'Will',points:0},{driver:'Hailey',points:0,highlight:true}]}]).focusGap,'0','Zero is a valid published score');
assert.equal(homeStandings([{...kmart,rows:[{driver:'Will',points:100},{driver:'Hailey',points:0,highlight:true}]}]).focusGap,'-100','A zero-point focus has a real leader deficit');
assert.equal(homeStandings([{...nrrs,featuredOnHome:'true'},featured],drivers).board,featured,'Only a strict true flag selects a board');
assert.equal(homeStandings([{id:'fixture',league:'fixture',rows:[]}]).board.id,'fixture','The first board is a final fallback when NRRS is absent');
assert.equal(homeStandings([{...nrrs,id:'different-id'}]).league,'nrrs','League identifies legacy NRRS even if its board ID differs');

const chase=homeStandings([nrrs,{...featured,homeTable:'chase'}],drivers);
assert.equal(chase.table,'chase');assert.deepEqual(chase.rows,kmart.chaseRows);assert.equal(chase.title,`${kmart.title} · ${kmart.chaseTitle}`);assert.equal(chase.subtitle,kmart.chaseSubtitle);assert.equal(chase.status,'Chase points');assert.equal(chase.cutoff,0);assert.equal(chase.cutoffLabel,'');assert.equal(chase.focusRow.points,1001);assert.equal(chase.focusAssignment.numberImage,'/kmart-15.png');
const actualSunoco=seed.standings.find(board=>board.league==='sunoco');
assert.equal(homeStandings([{...actualSunoco,homeTable:'chase'}],seed.drivers).title,`${actualSunoco.title} · Chase Points`,'The real Sunoco Chase view retains both league identity and its separate table title');
assert.equal(homeStandings([{...kmart,homeTable:'chase',chaseTitle:kmart.title}],drivers).title,kmart.title,'An identical Chase title is not repeated');
const inactiveChase=homeStandings([{...sunoco,featuredOnHome:true,homeTable:'chase',chaseActive:false}],drivers);
assert.equal(inactiveChase.status,'Chase points','Selecting a separate points table does not claim a postseason is active');assert.equal(inactiveChase.focusRow.points,12);
const chaseFallback=homeStandings([{...nrrs,homeTable:'chase',chaseRows:[{driver:'Hailey',number:'32',points:2}]}],drivers);
assert.equal(chaseFallback.title,nrrs.title);assert.equal(chaseFallback.subtitle,nrrs.subtitle);assert.equal(chaseFallback.cutoff,0,'Even NRRS omits the regular-season cutoff on a separate Chase table');
const missingChase=homeStandings([{...nrrs,homeTable:'chase'}],drivers);assert.equal(missingChase.table,'chase');assert.deepEqual(missingChase.rows,[]);assert.equal(missingChase.focusGap,'—','An older invalid Chase selection stays visibly empty instead of showing regular points');
for(const board of [{id:'uarl',league:'uarl',title:'D1 snapshot pending',status:'PENDING',featuredOnHome:true,rows:[]},{...featured,homeTable:'chase',chaseRows:[]}]){
  const empty=homeStandings([nrrs,board],drivers);assert.equal(empty.board,board);assert.deepEqual(empty.rows,[]);assert.equal(empty.focusRow,null);assert.equal(empty.leader,null);assert.equal(empty.focusAssignment,null);assert.deepEqual(empty.teamKeys,[],'An explicit empty selection cannot silently show NRRS or regular points');
}
const uarl=homeStandings([{id:'uarl',league:'uarl',rows:[{driver:'Hailey Bell',number:'28',highlight:true,points:12}]}],[{competitionId:'uarl-d1',displayName:'Hailey',number:'28',numberImage:'/d1-28.png'}]);
assert.equal(uarl.league,'uarl-d1');assert.equal(uarl.focusAssignment.numberImage,'/d1-28.png');assert.equal(uarl.cutoff,0);
for(const [boardLeague,assignmentLeague] of [['open','uarl-open'],['iracing','iracing-factory']])assert.ok(homeStandings([{id:boardLeague,league:boardLeague,rows:[{driver:'Hailey',number:'28',points:1}]}],[{competitionId:assignmentLeague,displayName:'Hailey',number:'28'}]).focusAssignment,'Current assignment league aliases match their standings program');
for(const cutoffAfter of [undefined,0,-1,2.5,'6'])assert.equal(homeStandings([{...kmart,cutoffAfter}]).cutoff,0,'Only a positive integer enables a non-NRRS cutoff');
assert.equal(homeStandings([{...kmart,cutoffLabel:''}]).cutoffLabel,'Chase cutoff · Top 6');
const none=homeStandings();assert.equal(none.board,null);assert.equal(none.focusRow,null);assert.equal(none.leader,null);assert.equal(none.focusAssignment,null);assert.deepEqual(none.rows,[]);assert.equal(none.cutoff,0);
assert.deepEqual({boards,drivers},before,'Selecting a homepage snapshot never changes the source data');

// Strict optional schema stays backward compatible, and normalization must not
// silently convert malformed flags or a missing Chase table into valid input.
assert.equal(validate(seed.standings),'');assert.deepEqual(normalize(seed.standings),seed.standings,'Legacy boards acquire no injected homepage selection');
const fixture=clone(seed.standings),kmartIndex=fixture.findIndex(board=>board.id==='kmart');
fixture.forEach(board=>board.featuredOnHome=false);Object.assign(fixture[kmartIndex],{featuredOnHome:true,homeTable:'regular'});
assert.equal(validate(fixture),'');
const change=callback=>{const next=clone(fixture);callback(next);return next;};
for(const value of ['true','false',1,0,null,undefined,{},[]]){
  const invalid=change(rows=>rows[kmartIndex].featuredOnHome=value);
  assert.equal(normalize(invalid)[kmartIndex].featuredOnHome,value,'An invalid homepage selection is never normalized away');assert.notEqual(validate(invalid),'');
}
for(const value of ['',null,undefined,'Chase','both',1,false,{},[]])assert.notEqual(validate(change(rows=>rows[kmartIndex].homeTable=value)),'','The homepage table is a strict enum when present');
assert.match(validate(change(rows=>rows[0].featuredOnHome=true)),/at most one.*homepage/i);
for(const chaseRows of [undefined,null,{},'not a list'])assert.notEqual(validate(change(rows=>{rows[kmartIndex].homeTable='chase';rows[kmartIndex].chaseRows=chaseRows;})),'','Selecting Chase requires a real separate list');
const emptyChase=change(rows=>{rows[kmartIndex].homeTable='chase';rows[kmartIndex].chaseRows=[];});assert.equal(validate(emptyChase),'','An explicitly empty Chase table is an honest valid selection');
assert.equal(validate(change(rows=>rows.forEach(row=>row.featuredOnHome=false))),'','No selection retains legacy NRRS fallback');

// Real handlers run against an isolated mock registry; no live writes, hooks,
// source rewrites or deployment requests are possible from this fixture.
let stored={version:1,revision:0,published:clone(seed),drafts:{},history:[]},writes=0;
const module={exports:{}},adminRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('../netlify/lib/_site-admin.cjs',import.meta.url),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:clone(stored),etag:'home-standings-fixture'}),write:async(registry,etag)=>{assert.equal(etag,'home-standings-fixture');writes++;stored=clone(registry);}}:adminRequire(name),module,module.exports,{env:{}},()=>assert.fail('Homepage standings tests cannot call a network/deployment service'));
const actor={clientContext:{user:{email:'home-standings@example.test',app_metadata:{roles:['admin']}}}};
const action=async(action,data,context=actor,revision=stored.revision)=>{const response=await module.exports.handler({httpMethod:'POST',body:JSON.stringify({action,dataset:'standings',revision,...(data===undefined?{}:{data})})},context);return {status:response.statusCode,...JSON.parse(response.body)};};
const reload=async()=>JSON.parse((await module.exports.handler({httpMethod:'GET'},actor)).body).registry;
assert.equal((await action('saveDraft',fixture,{})).status,403);assert.equal(writes,0);
const originalRows=fixture.map(({id,rows,chaseRows})=>({id,rows,chaseRows}));
let result=await action('saveDraft',fixture);assert.equal(result.status,200,result.error);assert.deepEqual(stored.published.standings,seed.standings,'The homepage choice remains private until publication');
assert.equal((await reload()).drafts.standings[kmartIndex].featuredOnHome,true);assert.equal(homeStandings((await reload()).published.standings,seed.drivers).league,'nrrs');
const badCases=[change(rows=>rows[0].featuredOnHome=true),change(rows=>rows[kmartIndex].featuredOnHome='yes'),change(rows=>rows[kmartIndex].homeTable='chase')];
const beforeBad=clone(stored),beforeWrites=writes;
for(const invalid of badCases)for(const method of ['saveDraft','publish']){result=await action(method,invalid);assert.equal(result.status,400);assert.equal(writes,beforeWrites);assert.deepEqual(stored,beforeBad,'Invalid choices leave drafts, public data and revision intact');}
result=await action('publish');assert.equal(result.status,200,result.error);assert.equal(result.publication.dataPublished,true);assert.equal(result.publication.queued,false);assert.equal(stored.drafts.standings,undefined);
const published=(await reload()).published.standings,feed=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(clone(stored.published));
assert.equal(homeStandings(published,seed.drivers).league,'kmart');assert.equal(homeStandings(feed.standings,feed.drivers).board.featuredOnHome,true);
assert.deepEqual(published.map(({id,rows,chaseRows})=>({id,rows,chaseRows})),originalRows,'Saving a homepage choice does not recalculate scores, movement or manual driver labels');
for(const key of ['results','schedule-events','news','drivers','roster-profiles','wins','milestones'])assert.deepEqual(stored.published[key],seed[key],`The selection does not rewrite ${key}`);
result=await action('saveDraft',emptyChase);assert.equal(result.status,200,result.error);result=await action('publishAll');assert.equal(result.status,200,result.error);assert.equal(homeStandings((await reload()).published.standings,seed.drivers).table,'chase');assert.deepEqual(homeStandings(stored.published.standings,seed.drivers).rows,[],'An empty selected Chase table survives Save/Publish All/reload');
const cleared=clone(stored.published.standings);cleared.forEach(board=>board.featuredOnHome=false);result=await action('publish',cleared);assert.equal(result.status,200,result.error);assert.equal(homeStandings(stored.published.standings,seed.drivers).league,'nrrs');
result=await action('saveDraft',cleared,actor,0);assert.equal(result.status,409,'Stale editors retain existing revision protection');
console.log('PASS: homepage board/table selection, honest empty states, exact league/driver/number artwork and team matching, legacy cutoff, strict validation and isolated draft/publish/reload preservation.');

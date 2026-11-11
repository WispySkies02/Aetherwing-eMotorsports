import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {currentUarlRevision} from '../src/lib/uarl-d1-return.mjs';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs'),merge=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical;
const modules=process.env.ADMIN_BROWSER_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
const seed=content.seeds(),dist=path.resolve('dist'),origin='https://uarl-return.fixture.test';
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
assert.ok(fs.existsSync(path.join(dist,'drivers/index.html')),'Build the site before running this browser check');
const old=structuredClone(seed),former=[['wispy-uarl-d1','hailey','Hailey','28'],['burgertown-uarl-d1','burgertown2good','BurgerTown2Good','32'],['rocky-uarl-d1','rocky','Rocky','46']];
old.drivers=[...old.drivers.filter(row=>row.competitionId!=='uarl-d1'),...former.map(([id,profile,displayName,number])=>({id,profile,displayName,number,competition:'UARL Division 1',competitionId:'uarl-d1',status:'Full-Time',affiliation:'aetherwing',numberImage:`/__fixture/old-d1-${number}.svg`}))];
old.charters=old.charters.map(board=>board.id!=='uarl-d1'?board:{id:'uarl-d1',label:'UARL D1',seriesNote:'Aetherwing Season 6 charter allocation',fullTime:[{number:'28',driver:'Hailey',numberImage:''},{number:'32',driver:'BurgerTown2Good',numberImage:''},{number:'46',driver:'Rocky',numberImage:''},{number:'56',driver:'Open',numberImage:''}],openCharters:[{id:'uarl-d1-open-1',label:'Aetherwing Open Charter',slotLabel:'FLEXIBLE ENTRY',active:true,uses:[{number:'62',label:'Part-Time',description:'Previous flexible entry',active:true,numberImage:''}]}]});
old.competitions=old.competitions.map(program=>program.id!=='uarl-d1'?program:{id:'uarl-d1',name:'UARL Division 1',series:'L.L. Bean Cup Series',type:'aetherwing',label:'Aetherwing Program',schedule:'Sundays · 8:30 PM ET',machine:'BBR Next-Gen Toyota',platform:'Roblox / BBR Next-Gen platform',roster:['#28 Hailey','#32 BurgerTown2Good','#46 Rocky','#56 OPEN','AETHERWING FLEX ENTRY · #62 PART-TIME']});
for(const person of old['roster-profiles']){
 if(['hailey','rocky','burgertown2good','will'].includes(person.slug))delete person.currentUarlRevision;
 if(['hailey','rocky','burgertown2good'].includes(person.slug)&&!person.programs.includes('UARL D1'))person.programs.push('UARL D1');
 if(person.slug==='will')Object.assign(person,{numbers:'24 / 42',programs:['Kmart','Sunoco'],feature:'StarClutch Alliance',bio:'Aetherwing Creative Director and StarClutch Racing alliance competitor.'});
 if(person.slug==='rocky')person.bio='Full-time Aetherwing UARL Division 1 driver in the #46.';
 if(person.slug==='burgertown2good')person.bio='Full-time Aetherwing UARL Division 1 driver in the #32.';
}
// Historical fixtures are deliberately separate from current assignments.
// They are not canonical racing claims and are never written to a live store.
const round1=old['schedule-events'].find(event=>event.league==='uarl-d1'&&event.round==='ROUND 1'),round2=old['schedule-events'].find(event=>event.league==='uarl-d1'&&event.round==='ROUND 2');
assert.ok(round1&&round2);
const archived={...structuredClone(round1),scheduleId:'uarl-d1-round-1',title:`${round1.title} · historical fixture`,status:'Completed',pointsSource:'official-result',coverage:'team-only',standingsMode:'record-only',sourceNote:'Isolated test-only historical identity fixture; this is not a canonical racing claim.',featured:false,headline:'',headlineAccent:'',summary:'Isolated test-only historical identity fixture.',entries:former.map(([assignmentId,,driver,number],index)=>({assignmentId,driver,number,start:null,stage1Finish:null,stage1Points:null,stage2Finish:null,stage2Points:null,finish:index+1,racePoints:null,featuredDriver:index===0,chaseDriver:false}))};
old.results=content.normalize('results',[...old.results.filter(race=>race.scheduleId!==archived.scheduleId),archived]);
const custom={...structuredClone(round2),entryListMode:'custom',entries:former.map(([assignmentId,,driver,number])=>({assignmentId,driver,number,entryStatus:'Historical test fixture'}))};
old['schedule-events']=old['schedule-events'].map(event=>event===round2?custom:event);
const before=structuredClone(old),current=merge(structuredClone(old));
const will=current.drivers.find(row=>row.id==='will-uarl-d1');assert.ok(will,'The legacy public read must produce the confirmed Will entry');assert.equal(will.currentUarlRevision,currentUarlRevision);
const later=structuredClone(current),laterWill=later.drivers.find(row=>row.id==='will-uarl-d1');Object.assign(laterWill,{number:'34',status:'Part-Time',manufacturer:'Ford',car:'Ford'});
const laterBoard=later.charters.find(board=>board.id==='uarl-d1');laterBoard.fullTime.find(slot=>slot.driver==='Will').number='34';
Object.assign(later.competitions.find(program=>program.id==='uarl-d1'),{machine:'BBR Next-Gen Ford',roster:['#34 Will','#42 UNSIGNED','#43 UNSIGNED']});
Object.assign(later['roster-profiles'].find(person=>person.slug==='will'),{numbers:'34 / 24 / 42',bio:'Later approved UARL Division 1 #34 Ford entry. Isolated fixture edit.'});
const future=merge(structuredClone(later));assert.equal(future.drivers.find(row=>row.id==='will-uarl-d1').number,'34','A later marked publication must retain its actual edit');
const oldNumbers=['28','32','46'];
function assertHistoryData(datasets){assert.deepEqual(datasets.results.find(race=>race.scheduleId===archived.scheduleId).entries,archived.entries);assert.deepEqual(datasets['schedule-events'].find(event=>event.league==='uarl-d1'&&event.round==='ROUND 2').entries,custom.entries);}
assertHistoryData(current);assertHistoryData(future);assert.deepEqual(old,before,'Fixture reconciliation does not mutate its input');
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
let browser;

async function setup(width,{data=current,cache=null,offline=false,noJS=false}={}){
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,reducedMotion:'reduce',javaScriptEnabled:!noJS}),page=await context.newPage(),errors=[];let payload=data,fail=offline,artRequests=0;
 page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
 await context.addInitScript(({cache})=>{if(cache)localStorage.setItem('aetherwing-publication-v1',JSON.stringify({revision:10,savedAt:'2026-11-11T12:00:00Z',datasets:cache}));},{cache});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());assert.equal(request.method(),'GET','Roster browser verification must never write data');if(url.origin!==origin)return route.abort();
  if(url.pathname==='/api/site-content')return route.fulfill({status:fail?503:200,contentType:'application/json',body:JSON.stringify(fail?{error:'Publication fixture unavailable'}:{revision:120,datasets:payload})});
  if(url.pathname==='/api/driver-art'){artRequests++;return route.fulfill({contentType:'application/json',body:JSON.stringify({revision:1,drivers:old.drivers,profiles:[]})});}
  if(url.pathname.startsWith('/__fixture/old-d1-')){const number=url.pathname.match(/old-d1-(\d+)\.svg$/)?.[1];assert.ok(number);return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100"><title>Isolated legacy D1 number ${number}</title><text x="75" y="76" text-anchor="middle" font-family="sans-serif" font-size="85" fill="#ff3333">${number}</text></svg>`});}
  if(url.pathname==='/api/track-weather')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Weather fixture unavailable"}'});
  try{let file=path.resolve(dist,`.${decodeURIComponent(url.pathname)}`);assert.ok(file===dist||file.startsWith(dist+path.sep));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{return route.fulfill({status:404,body:''});}
 });
 return{context,page,errors,setData:value=>{payload=value;},setOffline:value=>{fail=value;},get artRequests(){return artRequests;}};
}
async function visit(test,path,state='published'){await test.page.goto(`${origin}${path}`,{waitUntil:'domcontentloaded'});await test.page.waitForFunction(state=>document.documentElement.dataset.contentState===state,state);}
async function press(page,selector,width){const locator=page.locator(selector);await locator.evaluate(el=>el.scrollIntoView({block:'center',inline:'center',behavior:'instant'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const point=await locator.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{x,y,hit:!!hit&&(hit===el||el.contains(hit)),actual:hit?.outerHTML.slice(0,180)};});assert.equal(point.hit,true,`Native filter target must be visible: ${JSON.stringify(point)}`);if(width<700)await page.touchscreen.tap(point.x,point.y);else{await locator.focus();await page.keyboard.press('Enter');}}
const card=(page,slug)=>page.locator('.aw-lineup__poster').filter({has:page.locator(`a[href="/drivers/${slug}/"]`)});

async function assertD1(test,width,{number='33',manufacturer='Chevrolet',state='published'}={}){
 const {page}=test;await visit(test,'/drivers/',state);await press(page,'[data-program="uarl-d1"]',width);
 const cards=page.locator('.aw-lineup__poster');assert.equal(await cards.count(),3);assert.deepEqual(await cards.evaluateAll(nodes=>nodes.map(node=>node.dataset.number)),[number,'42','43']);assert.match(await page.locator('[data-lineup-program] strong').textContent(),/1 ASSIGNED.*2 OPEN/);assert.doesNotMatch(await page.locator('[data-lineup-program] strong').textContent(),/1 FLEX/);
 assert.equal(await card(page,'will').count(),1);assert.equal(await card(page,'will').locator('h3').textContent(),'Will');assert.match(await card(page,'will').locator('.aw-lineup__number').textContent(),new RegExp(`#${number}`));assert.equal(await card(page,'will').locator('.aw-lineup__number img').count(),0,'No old D1 or other-series artwork is repurposed for the new number');
 const unsigned=cards.filter({hasNot:page.locator('a[href="/drivers/will/"]')});assert.equal(await unsigned.count(),2);assert.equal(await unsigned.locator('a[href^="/drivers/"]').count(),0,'Unsigned slots never fabricate new drivers or profile destinations');for(const entry of await unsigned.all())assert.match(await entry.locator('.aw-lineup__plate > small').textContent(),/Unsigned|Open/i);
 const data=await page.evaluate(()=>window.__AETHERWING_CONTENT__);assert.equal(data.drivers.filter(row=>row.competitionId==='uarl-d1').length,1);const currentEntry=data.drivers.find(row=>row.competitionId==='uarl-d1');assert.equal(currentEntry.displayName,'Will');assert.equal(currentEntry.number,number);assert.equal(currentEntry.manufacturer,manufacturer);assertHistoryData(data);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.locator('[data-lineup]').screenshot({path:`/tmp/uarl-d1-return-${state}-${number}-${width}.png`});
 await press(page,'[data-program="uarl-open"]',width);assert.equal(await card(page,'hailey').getAttribute('data-number'),'28');assert.equal(await card(page,'hailey').locator('.aw-lineup__number img').count(),0,'Old D1 artwork cannot spill into the separate Open28 assignment');await press(page,'[data-program="kmart"]',width);assert.equal(await card(page,'will').getAttribute('data-number'),'24');await press(page,'[data-program="sunoco"]',width);assert.equal(await card(page,'will').getAttribute('data-number'),'42');
}
async function assertProgramProfile(test,{number='33',manufacturer='Chevrolet',state='published'}={}){
 const {page}=test;await visit(test,'/programs/uarl-d1/',state);const lineup=page.locator('[data-program-lineup] .profile-assignment');assert.equal(await lineup.count(),1);assert.equal(await lineup.locator(':scope > span').textContent(),'Will');assert.equal(await lineup.locator(':scope > strong').textContent(),`#${number}`);assert.match(await page.locator('[data-program-page] .ux-lede,[data-program-page] .page-intro h1 + p').textContent(),new RegExp(manufacturer));
 await visit(test,'/drivers/will/',state);assert.equal(await page.locator('[data-profile-name]').textContent(),'Will');const d1Assignment=page.locator('[data-profile-assignments] .profile-assignment').filter({hasText:'UARL Division 1'});assert.equal(await d1Assignment.count(),1);assert.equal(await d1Assignment.locator(':scope > strong').textContent(),`#${number}`);assert.match(await page.locator('[data-profile-bio]').textContent(),new RegExp(manufacturer));const assignments=await page.locator('[data-profile-assignments] .profile-assignment').allTextContents();assert.ok(assignments.some(text=>/Kmart.*#24/i.test(text)));assert.ok(assignments.some(text=>/Sunoco.*#42/i.test(text)));
 await visit(test,'/drivers/hailey/',state);assert.equal(await page.locator('[data-profile-assignments] .profile-assignment').filter({hasText:'UARL Division 1'}).count(),0);assert.equal(await page.locator('[data-profile-assignments] .profile-assignment').filter({hasText:'UARL Open'}).locator(':scope > strong').textContent(),'#28');
}
async function assertHistoricalPages(test,state='published'){
 const {page}=test;await visit(test,'/event/uarl-d1-round-1/',state);assert.deepEqual(await page.locator('[data-event-entries] .profile-assignment > strong').allTextContents(),oldNumbers.map(number=>`#${number}`));const results=await page.locator('[data-event-result] .race-result-row > strong').allTextContents();for(const [index,number]of oldNumbers.entries())assert.match(results[index],new RegExp(`#${number} · ${former[index][2]}`));
 await visit(test,'/event/uarl-d1-round-2/',state);assert.deepEqual(await page.locator('[data-event-entries] .profile-assignment > strong').allTextContents(),oldNumbers.map(number=>`#${number}`));assert.deepEqual(await page.locator('[data-event-entries] .profile-assignment > span').allTextContents(),former.map(row=>row[2]));
 await visit(test,'/history/',state);const history=page.locator('[data-results-list] > article').filter({hasText:archived.title});assert.equal(await history.count(),1);assert.deepEqual(await history.locator(':scope > strong').allTextContents(),former.map((row,index)=>`#${row[3]} ${row[2]} · P${index+1}`));assert.equal(await history.locator('a').first().getAttribute('href'),'/event/uarl-d1-round-1/');
}

try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of (process.env.UARL_RETURN_BROWSER_WIDTHS||'1440,390,320').split(',').map(Number)){
  const test=await setup(width);
  try{await assertD1(test,width);await assertProgramProfile(test);await assertHistoricalPages(test);assert.ok(test.artRequests>0,'An old lightweight artwork response was actually exercised');assert.deepEqual(test.errors,[]);console.log(`PASS: ${width}px migrated old publication yields Will33 Chevrolet and two unsigned slots; program/profile/directory agree, other programs and historical result/custom entries retain their numbers.`);}catch(error){await test.page.screenshot({path:`/tmp/uarl-d1-return-failure-${width}.png`});throw error;}finally{await test.context.close();}
  const cached=await setup(width,{cache:old,offline:true});try{await assertD1(cached,width,{state:'cached'});await assertProgramProfile(cached,{state:'cached'});await assertHistoricalPages(cached,'cached');assert.deepEqual(cached.errors,[]);console.log(`PASS: ${width}px raw pre-return cached snapshot repairs current views while historical pages retain their original entries.`);}finally{await cached.context.close();}
  const raw=await setup(width,{data:old});try{await assertD1(raw,width);await assertProgramProfile(raw);await assertHistoricalPages(raw);assert.deepEqual(raw.errors,[]);console.log(`PASS: ${width}px raw old API payload is repaired by the actual browser path without rewriting historical event/History views.`);}finally{await raw.context.close();}
  const edited=await setup(width,{data:future});try{await assertD1(edited,width,{number:'34',manufacturer:'Ford'});await assertProgramProfile(edited,{number:'34',manufacturer:'Ford'});await edited.page.evaluate(data=>localStorage.setItem('aetherwing-publication-v1',JSON.stringify({revision:121,savedAt:'2026-11-11T13:00:00Z',datasets:data})),future);edited.setOffline(true);await assertD1(edited,width,{number:'34',manufacturer:'Ford',state:'cached'});await assertProgramProfile(edited,{number:'34',manufacturer:'Ford',state:'cached'});assert.deepEqual(edited.errors,[]);console.log(`PASS: ${width}px marked later number/manufacturer/program/profile edits survive both published reads and cached hydration.`);}finally{await edited.context.close();}
 }
 const ssr=await setup(390,{noJS:true});try{await ssr.page.goto(`${origin}/programs/uarl-d1/`,{waitUntil:'domcontentloaded'});assert.match(await ssr.page.locator('[data-program-page]').textContent(),/Chevrolet/);assert.equal(await ssr.page.locator('[data-program-lineup] .profile-assignment').count(),1);assert.equal(await ssr.page.locator('[data-program-lineup] .profile-assignment > strong').textContent(),'#33');await ssr.page.goto(`${origin}/drivers/will/`,{waitUntil:'domcontentloaded'});assert.equal(await ssr.page.locator('[data-profile-assignments] .profile-assignment').filter({hasText:'UARL Division 1'}).locator(':scope > strong').textContent(),'#33');console.log('PASS: production program/profile HTML contains the confirmed D1 return before JavaScript.');}finally{await ssr.context.close();}
}finally{await browser?.close();}

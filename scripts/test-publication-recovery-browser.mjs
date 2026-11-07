import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {buildRaceFeed,nextRace,eventEnd} from '../src/lib/race-clock.mjs';

const require=createRequire(import.meta.url),seed=require('../netlify/lib/_content.cjs').seeds();
const modules=process.env.ADMIN_BROWSER_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
const buildRoot=path.resolve('dist'),sourceRoot=path.resolve('src'),origin='https://publication.fixture.test';
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const now=new Date('2026-10-18T12:00:00Z'),cacheKey='aetherwing-publication-v1';
assert.ok(fs.existsSync(path.join(buildRoot,'index.html')),'Build the production site before this browser check');
// Match the approved R21 -> R23 fixture used by test-public-racing-browser.
// These isolated snapshots never write application data or contact a live API.
const cached={revision:80,savedAt:'2026-10-17T18:00:00.000Z',datasets:structuredClone(seed)};
const fresh={revision:90,datasets:structuredClone(seed)},board=fresh.datasets.standings.find(row=>row.id==='nrrs');
board.subtitle='Town Fair Cup · Season 3 · After R23/25 · Portland · Chase Race 4 · Oct. 13, 2026';
Object.assign(board.rows.find(row=>row.highlight),{driver:'Hailey',position:'P4',points:2190,delta:'-96',positionChange:1});
Object.assign(board.rows[0],{driver:'Will',points:2286});
const echo=structuredClone(seed['schedule-events'].find(event=>event.league==='uarl-d1'&&event.round==='ROUND 4'));
Object.assign(echo,{date:'2026-10-18',track:'Echo Park Speedway',title:'Echo Park Thunder 400'});
fresh.datasets['schedule-events']=[echo,...seed['schedule-events'].filter(event=>(event.league==='kmart'&&event.date==='2026-10-19')||(event.league==='sunoco'&&event.date==='2026-10-24')||(event.league==='open'&&event.date==='2026-10-25')).map(event=>structuredClone(event))];
fresh.datasets.results=seed.results.filter(result=>result.date<='2026-10-13').map(result=>structuredClone(result));
const feed=buildRaceFeed(fresh.datasets['schedule-events'],fresh.datasets.results,{from:'2026-10-15'}),next=nextRace(feed,now);
assert.equal(next?.track,'Echo Park Speedway','Fixture has one known upcoming event across all schedule surfaces');
const upcoming=feed.filter(event=>!event.done&&(event.timePending||eventEnd(event)>=now)).slice(0,4);
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return{promise,resolve};};
let browser;

async function fixture(width,{cache=true,responder,pagePath='/'}={}){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<700,reducedMotion:'reduce'}),page=await context.newPage();
 page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);await page.clock.install({time:now});
 const errors=[],requests=[];let active=0,maxActive=0,navigations=0;
 page.on('pageerror',error=>errors.push(error.message));page.on('framenavigated',frame=>{if(frame===page.mainFrame())navigations++;});
 await context.addInitScript(({cached,cacheKey})=>{
  if(cached)localStorage.setItem(cacheKey,JSON.stringify(cached));else localStorage.removeItem(cacheKey);
  window.__publicationDocumentNonce=Math.random();window.__publicationFrames=[];window.__publicationEvents=0;
  const observe=()=>{
   const state=document.documentElement?.dataset.contentState;if(!state||state==='loading')return;
   const q=selector=>document.querySelector(selector),snapshot=window.__AETHERWING_PUBLICATION__;
   const frame={state,revision:snapshot?.revision,publication:snapshot?.state,battle:q('[data-battle-heading]')?.textContent,context:q('[data-battle-context]')?.textContent,gap:q('[data-battle-gap]')?.textContent,tower:q('[data-tower-context]')?.textContent,chip:q('[data-race-chip]')?.dataset.scheduleState,chipHref:q('[data-race-chip]')?.getAttribute('href'),featured:q('[data-on-track-next]')?.dataset.scheduleState,track:q('[data-on-track-next] [data-next-track]')?.textContent,featureHref:q('[data-on-track-next] [data-next-link]')?.getAttribute('href'),upNext:q('[data-up-next-shell]')?.dataset.scheduleState,links:[...document.querySelectorAll('[data-up-next] a')].map(a=>a.getAttribute('href'))};
   window.__publicationFrames.push(frame);if(window.__publicationFrames.length>300)window.__publicationFrames.shift();
  };
  new MutationObserver(observe).observe(document,{subtree:true,attributes:true,childList:true,characterData:true});
  window.addEventListener('aetherwing:content',()=>{window.__publicationEvents++;queueMicrotask(observe);});
 },{cached:cache?cached:null,cacheKey});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());assert.equal(request.method(),'GET','Publication regression cannot write data');
  if(url.origin!==origin)return route.abort();
  if(url.pathname==='/api/site-content'){
   const record={url:url.pathname,index:requests.length+1,finished:false};requests.push(record);active++;maxActive=Math.max(maxActive,active);
   try{const response=await responder(record.index);return await route.fulfill({status:response.status||200,contentType:'application/json',body:JSON.stringify(response.body)});}finally{record.finished=true;active--;}
  }
  if(url.pathname==='/api/track-weather')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"weather fixture offline"}'});
  if(url.pathname==='/__publication-controller-test/')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated publication controller</title>'});
  const isSource=url.pathname.startsWith('/__publication-source/'),root=isSource?sourceRoot:buildRoot,pathname=isSource?url.pathname.slice('/__publication-source'.length):url.pathname;
  try{let file=path.resolve(root,`.${decodeURIComponent(pathname)}`);assert.ok(file===root||file.startsWith(root+path.sep));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{return route.fulfill({status:404,body:''});}
 });
 await page.goto(`${origin}${pagePath}`,{waitUntil:'domcontentloaded'});
 return{page,context,errors,requests,get maxActive(){return maxActive;},get navigations(){return navigations;}};
}

async function waitFallback(test,state){await test.page.waitForFunction(expected=>document.documentElement.dataset.contentState===expected,state);assert.equal(await test.page.locator('[data-race-chip]').getAttribute('data-schedule-state'),'unavailable');assert.equal(await test.page.locator('[data-race-chip]').getAttribute('href'),'/schedule/');
 if(await test.page.locator('[data-on-track-next]').count()){
  assert.equal(await test.page.locator('[data-on-track-next]').getAttribute('data-schedule-state'),'unavailable');assert.equal(await test.page.locator('[data-on-track-next] [data-next-track]').textContent(),'');assert.equal(await test.page.locator('[data-on-track-next] [data-next-link]').getAttribute('href'),'/schedule/');assert.equal(await test.page.locator('[data-on-track-next] [data-next-ics]').isVisible(),false,'Cached/bundled races cannot expose a calendar action');assert.equal(await test.page.locator('[data-up-next] a').count(),0);assert.equal(await test.page.locator('[data-up-next-shell]').getAttribute('data-schedule-state'),'unavailable');
  assert.match(await test.page.locator('[data-live-region="standings"] > [data-live-note]').textContent(),state==='cached'?/Cached snapshot.*Current publication could not be loaded/:/Bundled fallback.*current publication could not be loaded/);assert.equal(await test.page.locator('[data-battle-heading]').textContent(),'Hailey · P6');
 }
}

async function waitPublished(test){
 const {page}=test;await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published'&&window.__AETHERWING_PUBLICATION__?.revision===90);
 assert.equal(await page.locator('[data-race-chip]').getAttribute('data-schedule-state'),'ready');assert.equal(await page.locator('[data-race-chip]').getAttribute('href'),next.url);
 if(await page.locator('[data-on-track-next]').count()){
  assert.equal(await page.locator('[data-on-track-next]').getAttribute('data-schedule-state'),'ready');assert.equal(await page.locator('[data-on-track-next] [data-next-track]').textContent(),next.track);assert.equal(await page.locator('[data-on-track-next] [data-next-link]').getAttribute('href'),next.url);assert.deepEqual(await page.locator('[data-up-next] a').evaluateAll(nodes=>nodes.map(node=>node.getAttribute('href'))),upcoming.map(event=>event.url));assert.deepEqual(await page.locator('[data-up-next] strong').allTextContents(),upcoming.map(event=>event.track));assert.equal(await page.locator('[data-battle-heading]').textContent(),'Hailey · P4');assert.match(await page.locator('[data-battle-context]').textContent(),/R23\/25.*2,190 PTS/);assert.equal(await page.locator('[data-battle-gap]').textContent(),'-96');assert.match(await page.locator('[data-tower-context]').textContent(),/R23\/25/);
 }else{const hailey=page.locator('[data-board="nrrs"] > .standings-board__rows > .standing-row').filter({hasText:/Hailey/});assert.equal(await hailey.locator('.standing-row__points').textContent(),'2,190');assert.equal(await hailey.locator('.standing-row__position').textContent(),'P4');assert.equal(await hailey.locator('.standing-row__gap').textContent(),'-96');}
 assert.equal(await page.locator('[data-live-region="standings"] > [data-live-note]').count(),0,'Successful recovery removes stale fallback notices');
 const frames=await page.evaluate(()=>window.__publicationFrames);assert.ok(frames.some(frame=>frame.state==='published'));
 for(const frame of frames){
  if(frame.state==='published'){assert.equal(frame.revision,90);assert.equal(frame.chip,'ready');assert.equal(frame.chipHref,next.url);if(frame.battle!==undefined){assert.equal(frame.battle,'Hailey · P4');assert.match(frame.context,/R23\/25.*2,190 PTS/);assert.equal(frame.gap,'-96');assert.equal(frame.featured,'ready');assert.equal(frame.track,next.track);assert.equal(frame.featureHref,next.url);assert.equal(frame.upNext,'ready');assert.deepEqual(frame.links,upcoming.map(event=>event.url));}}
  else{assert.equal(frame.chip,'unavailable');if(frame.battle!==undefined){assert.equal(frame.featured,'unavailable');assert.equal(frame.upNext,'unavailable');assert.equal(frame.track,'');assert.deepEqual(frame.links,[]);}}
 }
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),cacheKey);assert.equal(saved.revision,90);assert.equal(saved.datasets.standings.find(board=>board.id==='nrrs').rows.find(row=>row.highlight).points,2190);assert.deepEqual(test.errors,[]);assert.equal(test.maxActive,1,'Every surface shares one in-flight request');assert.equal(test.navigations,1,'Publication recovers without a page reload');
}

async function lifecycle(page,type){await page.evaluate(type=>{if(type==='visibilitychange'){Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'});document.dispatchEvent(new Event(type));}else if(type==='pageshow')window.dispatchEvent(new PageTransitionEvent(type,{persisted:true}));else window.dispatchEvent(new Event(type));},type);}
async function burst(page){for(const type of ['online','focus','pageshow','visibilitychange'])await lifecycle(page,type);}

try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,390,320])for(const mode of ['cached','bundled','incomplete']){
  const first=deferred(),second=deferred();const test=await fixture(width,{cache:mode!=='bundled',responder:async index=>{if(index===1){await first.promise;return mode==='incomplete'?{body:{revision:89,datasets:{standings:fresh.datasets.standings}}}:{status:503,body:{error:'Temporary publication failure'}};}await second.promise;return{body:fresh};}});
  try{
   const nonce=await test.page.evaluate(()=>window.__publicationDocumentNonce);assert.equal(await test.page.locator('html').getAttribute('data-content-state'),'loading');assert.equal(await test.page.locator('[data-battle-heading]').evaluate(el=>getComputedStyle(el).visibility),'hidden','The old bundled standings remain neutral during initial loading');first.resolve();await waitFallback(test,mode==='bundled'?'bundled':'cached');
   await test.page.clock.fastForward(1600);await test.page.waitForFunction(()=>window.__publicationEvents>=1);await assertEventually(()=>test.requests.length===2,'One bounded background retry starts');await burst(test.page);assert.equal(test.requests.length,2,'Lifecycle bursts deduplicate an in-flight retry');second.resolve();await waitPublished(test);assert.equal(await test.page.evaluate(()=>window.__publicationDocumentNonce),nonce);
   await burst(test.page);await test.page.clock.fastForward(20000);await test.page.evaluate(()=>Promise.resolve());assert.equal(test.requests.length,2,'Healthy pages neither retry nor loop on lifecycle events');await test.page.screenshot({path:`/tmp/publication-recovery-${mode}-${width}.png`});console.log(`PASS: ${width}px ${mode} initial failure -> honest fallback -> atomic same-page publication recovery; single-flight and healthy idle.`);
  }catch(error){await test.page.screenshot({path:`/tmp/publication-recovery-failure-${mode}-${width}.png`});throw error;}finally{first.resolve();second.resolve();await test.context.close();}
 }
 // Exhaust the real default budget before independently exercising each way
 // an existing tab can return. Hidden events must never start a request.
 for(const [width,type]of [[1440,'online'],[390,'focus'],[320,'pageshow'],[390,'visibilitychange']]){
  let recover=false;const gate=deferred();const test=await fixture(width,{responder:async()=>{if(!recover)return{status:503,body:{error:'Offline publication fixture'}};await gate.promise;return{body:fresh};}});
  try{
   await waitFallback(test,'cached');for(const [count,delay]of [[2,1600],[3,3100]]){await test.page.clock.fastForward(delay);await assertEventually(()=>test.requests.length===count&&test.requests.every(request=>request.finished),'Retry settles before advancing its clock');await test.page.waitForFunction(expected=>window.__publicationEvents>=expected,count);}
   await test.page.clock.fastForward(20000);assert.equal(test.requests.length,3,'The default retry budget is finite');
   await test.page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});window.dispatchEvent(new Event('online'));window.dispatchEvent(new Event('focus'));document.dispatchEvent(new Event('visibilitychange'));});assert.equal(test.requests.length,3,'A hidden tab does not retry');recover=true;
   await test.page.evaluate(()=>Object.defineProperty(document,'visibilityState',{configurable:true,value:'visible'}));await lifecycle(test.page,type);await assertEventually(()=>test.requests.length===4,'Returning tab restarts its exhausted recovery budget');await burst(test.page);assert.equal(test.requests.length,4,'Returning-tab signals do not duplicate a pending recovery');gate.resolve();await waitPublished(test);await test.page.clock.fastForward(20000);assert.equal(test.requests.length,4);console.log(`PASS: ${width}px ${type} recovers after exhausted retry budget; hidden tabs stay idle and concurrent signals share one request.`);
  }finally{gate.resolve();await test.context.close();}
 }
 // This native ESM case isolates timeout cancellation from the page lifecycle.
 // The first custom fetch deliberately ignores AbortSignal and returns late.
 const test=await fixture(1440,{cache:false,pagePath:'/__publication-controller-test/',responder:async()=>{throw new Error('Controller fixture must use its supplied fetcher');}});
 try{
  const result=await test.page.evaluate(async({fresh,cached})=>{
   const {startPublicationUpdates}=await import('/__publication-source/lib/published-content.mjs');let firstResolve,calls=0,writes=[],snapshots=[];const values=new Map(),storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>{writes.push(JSON.parse(value).revision);values.set(key,value);}};
   const controller=startPublicationUpdates({timeout:40,retryDelay:10,maxAttempts:2,storage,fetcher:()=>{calls++;return calls===1?new Promise(resolve=>{firstResolve=resolve;}):Promise.resolve(Response.json(fresh));},onSnapshot:snapshot=>snapshots.push({state:snapshot.state,...(snapshot.revision===undefined?{}:{revision:snapshot.revision})})});
   await controller.ready;while(snapshots.at(-1)?.state!=='published')await new Promise(resolve=>setTimeout(resolve,10));firstResolve(Response.json({revision:cached.revision,datasets:cached.datasets}));await new Promise(resolve=>setTimeout(resolve,60));controller.stop();
   let stoppedResolve,stoppedCalls=0,stoppedWrites=0;const stopped=startPublicationUpdates({timeout:40,storage:{getItem:()=>null,setItem:()=>stoppedWrites++},fetcher:()=>new Promise(resolve=>{stoppedResolve=resolve;}),onSnapshot:()=>stoppedCalls++});stopped.stop();stoppedResolve(Response.json(fresh));await stopped.ready;await new Promise(resolve=>setTimeout(resolve,60));
   return{calls,writes,snapshots,revision:JSON.parse([...values.values()][0]).revision,stoppedCalls,stoppedWrites};
  },{fresh,cached});
  assert.equal(result.calls,2);assert.deepEqual(result.writes,[90]);assert.deepEqual(result.snapshots,[{state:'bundled'},{state:'published',revision:90}]);assert.equal(result.revision,90,'An old abort-ignoring response never replaces the latest cache');assert.equal(result.stoppedCalls,0);assert.equal(result.stoppedWrites,0);assert.deepEqual(test.errors,[]);console.log('PASS: native browser timeout and stop suppress late responses, callbacks and stale cache writes.');
 }finally{await test.context.close();}
}finally{await browser?.close();}

async function assertEventually(check,message){const deadline=Date.now()+10000;while(!check()){assert.ok(Date.now()<deadline,message);await new Promise(resolve=>setTimeout(resolve,15));}}

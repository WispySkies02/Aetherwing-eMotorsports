import assert from 'node:assert/strict';
import http from 'node:http';
import {performance} from 'node:perf_hooks';
import {JSDOM} from 'jsdom';
import {PUBLICATION_TIMEOUT,loadPublishedContent,startPublicationUpdates,applyPublication} from '../src/lib/published-content.mjs';
import {subscribeFeed} from '../src/lib/race-clock.mjs';

// Test public reads in isolation. HTTP stays on a temporary loopback server;
// every other request uses a controlled fetcher. No builds or live writes.
const tick=(ms=0)=>new Promise(resolve=>setTimeout(resolve,ms));
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};
const until=async(predicate,label,timeout=1200)=>{const end=performance.now()+timeout;while(!predicate()){assert.ok(performance.now()<end,label);await tick(5);}};
const cacheKey='aetherwing-publication-v1';
const publication=(revision,marker)=>({revision,datasets:{standings:[{id:'nrrs',subtitle:`${marker} round`,rows:[{driver:'Hailey',position:'P4',points:revision,delta:'-10'}]}],results:[],'schedule-events':[{league:'uarl-d1',leagueName:'UARL D1',round:'ROUND 1',title:`${marker} race`,track:`${marker} track`,date:'2099-11-15',time:'8:30 PM ET'}]}});
const old=publication(10,'Cached'),fresh=publication(20,'Published'),newer=publication(30,'Newer');
const cached=()=>({...structuredClone(old),savedAt:'2026-11-01T12:00:00.000Z'});
function memoryStorage(initial=null){const values=new Map(initial?[[cacheKey,JSON.stringify(initial)]]:[]),writes=[];return {values,writes,getItem:key=>values.get(key)??null,setItem:(key,value)=>{writes.push({key,value});values.set(key,value);}};}
const noStorage={getItem(){throw new Error('Storage is unavailable');},setItem(){throw new Error('Storage quota is unavailable');}};
async function page(){
 const dom=new JSDOM('<html data-content-state="loading"><body><section data-live-region="standings" aria-busy="true"><strong data-standings-probe>Bundled old round</strong></section><section data-live-region="schedule-events" aria-busy="true"><span data-schedule-probe>Loading</span><a data-calendar-probe hidden>Calendar</a></section></body></html>',{url:'https://fixture.test/',pretendToBeVisual:true});
 // Let JSDOM's natural pageshow/load finish before installing lifecycle hooks.
 await tick();const w=dom.window,document=w.document,previous=globalThis.window;globalThis.window=w;
 const events=[],schedule=[],$=selector=>document.querySelector(selector);
 w.addEventListener('aetherwing:content',event=>{$('[data-standings-probe]').textContent=event.detail.standings?.[0]?.subtitle||'No standings';});
 subscribeFeed((feed,status)=>{schedule.push({status,tracks:feed.map(event=>event.track)});$('[data-schedule-probe]').textContent=status==='ready'?feed[0]?.track||'No upcoming race':status;const link=$('[data-calendar-probe]');link.hidden=status!=='ready'||!feed.length;if(!link.hidden)link.setAttribute('href',feed[0].url);else link.removeAttribute('href');});
 w.addEventListener('aetherwing:content',event=>events.push({state:w.__AETHERWING_PUBLICATION__.state,revision:w.__AETHERWING_PUBLICATION__.revision,datasets:event.detail,standings:$('[data-standings-probe]').textContent,schedule:$('[data-schedule-probe]').textContent,calendarHidden:$('[data-calendar-probe]').hidden,calendarHref:$('[data-calendar-probe]').getAttribute('href')}));
 const apply=snapshot=>applyPublication(snapshot,{standings:publication(1,'Bundled').datasets.standings,results:[],'schedule-events':publication(1,'Bundled').datasets['schedule-events']},{document,window:w});
 return {w,document,$,events,schedule,apply,close(){dom.window.close();if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}};
}
const unhandled=[],onUnhandled=error=>unhandled.push(error?.message||String(error));process.on('unhandledRejection',onUnhandled);
try{
 assert.equal(PUBLICATION_TIMEOUT,20000,'The full response budget accommodates normal mobile/cold-start body loading beyond the previous 8 seconds');
 // Native fetch receives headers and part of the JSON immediately. The rest
 // genuinely takes nine seconds: this is not a mock that ignores an abort.
 {
  let bodyFinished=false,headersReceived=false;const timers=new Set(),text=JSON.stringify(fresh);
  const server=http.createServer((request,response)=>{assert.match(request.url,/^\/api\/site-content\?/);response.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});response.write(text.slice(0,20));const timer=setTimeout(()=>{bodyFinished=true;response.end(text.slice(20));timers.delete(timer);},9000);timers.add(timer);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`,storage=memoryStorage(cached());
  try{
   const started=performance.now();let settled=false;
   const request=loadPublishedContent({storage,fetcher:async(url,options)=>{const response=await fetch(new URL(url,origin),options);headersReceived=true;return response;}}).then(snapshot=>{settled=true;return snapshot;});
   await until(()=>headersReceived,'The native fetch exposes response headers before its body completes');await tick(8100);
   assert.equal(bodyFinished,false);assert.equal(settled,false,'At 8 seconds a valid still-loading body has not been replaced by a cached fallback');
   const actual=await request;assert.equal(actual.state,'published');assert.equal(actual.revision,20);assert.equal(bodyFinished,true);assert.ok(performance.now()-started>=8900,'The test exercised a real >8s response body');assert.equal(JSON.parse(storage.values.get(cacheKey)).revision,20);
  }finally{for(const timer of timers)clearTimeout(timer);server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 }
 // The loader does not depend on AbortSignal.timeout (older supported browser
 // APIs), and one deadline covers both obtaining headers and reading JSON.
 {
  const descriptor=Object.getOwnPropertyDescriptor(AbortSignal,'timeout');Object.defineProperty(AbortSignal,'timeout',{value:undefined,configurable:true,writable:true});
  try{assert.equal((await loadPublishedContent({storage:noStorage,fetcher:async()=>Response.json(fresh)})).state,'published');}
  finally{if(descriptor)Object.defineProperty(AbortSignal,'timeout',descriptor);else delete AbortSignal.timeout;}
  for(const phase of ['headers','body']){
   const late=deferred(),storage=memoryStorage(cached());let signal;const started=performance.now();
   const actual=await loadPublishedContent({timeout:25,storage,fetcher:async(_url,options)=>{signal=options.signal;if(phase==='headers')return late.promise;return {ok:true,json:()=>late.promise};}});
   assert.equal(actual.state,'cached',`${phase}: a hung request reaches an honest fallback`);assert.equal(signal.aborted,true,`${phase}: timed-out work is aborted`);assert.ok(performance.now()-started<600,`${phase}: the complete request is bounded`);
   late.resolve(phase==='headers'?Response.json(fresh):fresh);await tick(25);assert.equal(storage.writes.length,0,`${phase}: a late timed-out response cannot overwrite the saved snapshot`);
  }
 }
 // A timeout/cached result recovers on this page. All subscribers observe the
 // same replacement before it is revealed, and no cached event is actionable.
 {
  const p=await page(),storage=memoryStorage(cached()),late=deferred();let calls=0,firstSignal;
  const updates=startPublicationUpdates({window:p.w,document:p.document,storage,timeout:25,retryDelay:15,maxAttempts:3,onSnapshot:p.apply,fetcher:async(_url,options)=>{calls++;if(calls===1){firstSignal=options.signal;return {ok:true,json:()=>late.promise};}return Response.json(fresh);}});
  try{
   const initial=await updates.ready;assert.equal(initial.state,'cached');assert.equal(firstSignal.aborted,true);assert.equal(p.events[0].standings,'Cached round');assert.equal(p.events[0].schedule,'unavailable');assert.equal(p.events[0].calendarHidden,true);assert.equal(p.events[0].calendarHref,null);assert.ok(p.$('[data-live-region="standings"] > [data-live-note]'));
   await until(()=>p.w.__AETHERWING_PUBLICATION__?.state==='published','Automatic retry recovers the failed publication');
   const event=p.events.at(-1);assert.equal(event.revision,20);assert.equal(event.standings,'Published round');assert.equal(event.schedule,'Published track');assert.equal(event.calendarHidden,false);assert.match(event.calendarHref,/uarl-d1-round-1/);assert.equal(event.datasets,p.w.__AETHERWING_CONTENT__,'All subscribers receive the same complete object');assert.deepEqual(event.datasets.standings,fresh.datasets.standings);assert.deepEqual(event.datasets['schedule-events'],fresh.datasets['schedule-events']);
   assert.equal(p.document.documentElement.dataset.contentState,'published');assert.equal(p.document.querySelectorAll('[data-live-note]').length,0,'Recovery removes stale cached/bundled notices');for(const region of p.document.querySelectorAll('[data-live-region]')){assert.equal(region.dataset.liveState,'published');assert.equal(region.getAttribute('aria-busy'),'false');}
   assert.equal(calls,2);late.resolve(old);await tick(40);assert.equal(p.w.__AETHERWING_PUBLICATION__.revision,20);assert.equal(JSON.parse(storage.values.get(cacheKey)).revision,20,'An older first response cannot overwrite the successful recovery');
  }finally{updates.stop();p.close();}
 }
 // HTTP 200 alone cannot mark bundled fallback data as current. Every core
 // collection must be an own array, including an explicitly empty collection.
 for(const invalid of [
  {name:'empty datasets',value:()=>({})},
  {name:'standings only',value:()=>({standings:[]})},
  {name:'missing schedule',value:()=>({standings:[],results:[]})},
  {name:'missing results',value:()=>({standings:[],'schedule-events':[]})},
  {name:'malformed schedule',value:()=>({standings:[],results:[],'schedule-events':{}})},
  {name:'inherited core collections',value:()=>Object.create(fresh.datasets)},
  {name:'invalid JSON body',response:()=>new Response('{"datasets":',{headers:{'content-type':'application/json'}})},
 ]){
  const p=await page(),storage=memoryStorage(cached());let calls=0;
  const updates=startPublicationUpdates({window:p.w,document:p.document,storage,timeout:40,retryDelay:10,maxAttempts:2,onSnapshot:p.apply,fetcher:async()=>{if(++calls===1)return invalid.response?invalid.response():{ok:true,json:async()=>({revision:15,datasets:invalid.value()})};return Response.json(fresh);}});
  try{
   assert.equal((await updates.ready).state,'cached',`${invalid.name}: an incomplete/malformed response is degraded`);assert.equal(p.events[0].schedule,'unavailable');assert.equal(p.events[0].calendarHidden,true);assert.equal(p.events[0].calendarHref,null,`${invalid.name}: no bundled calendar action appears current`);
   await until(()=>p.w.__AETHERWING_PUBLICATION__?.revision===20,`${invalid.name}: retry waits for a complete snapshot`);assert.equal(p.events.at(-1).standings,'Published round');assert.equal(p.events.at(-1).schedule,'Published track');assert.equal(calls,2);assert.equal(JSON.parse(storage.values.get(cacheKey)).revision,20);
  }finally{updates.stop();p.close();}
 }
 {
  const incomplete={revision:10,datasets:{standings:old.datasets.standings},savedAt:cached().savedAt},storage=memoryStorage(incomplete);
  assert.equal((await loadPublishedContent({storage,fetcher:async()=>{throw new Error('Offline');}})).state,'bundled','An incomplete cached publication is not trusted as a complete snapshot');
  const p=await page(),empty={revision:21,datasets:{standings:[],results:[],'schedule-events':[]}};
  try{const snapshot=await loadPublishedContent({storage:noStorage,fetcher:async()=>Response.json(empty)});assert.equal(snapshot.state,'published','Explicitly empty core collections are valid');p.apply(snapshot);assert.equal(p.$('[data-standings-probe]').textContent,'No standings');assert.equal(p.$('[data-schedule-probe]').textContent,'No upcoming race');assert.equal(p.$('[data-calendar-probe]').hidden,true);assert.equal(p.$('[data-calendar-probe]').getAttribute('href'),null);assert.equal(p.document.querySelectorAll('[data-live-note]').length,0);}
  finally{p.close();}
 }
 // Cache access and quota failures do not block published reads or recovery.
 {
  const p=await page();let calls=0;const updates=startPublicationUpdates({window:p.w,document:p.document,storage:noStorage,timeout:30,retryDelay:10,maxAttempts:2,onSnapshot:p.apply,fetcher:async()=>{if(++calls===1)throw new Error('Offline');return Response.json(fresh);}});
  try{assert.equal((await updates.ready).state,'bundled');assert.equal(p.$('[data-calendar-probe]').hidden,true);assert.equal(p.$('[data-calendar-probe]').getAttribute('href'),null);await until(()=>p.w.__AETHERWING_PUBLICATION__?.state==='published','Recovery succeeds even with inaccessible storage');assert.equal(p.$('[data-standings-probe]').textContent,'Published round');assert.equal(p.$('[data-schedule-probe]').textContent,'Published track');assert.equal(calls,2);}
  finally{updates.stop();p.close();}
 }
 // Some private/storage-restricted contexts throw when merely accessing
 // localStorage. Optional/default storage must be as safe as provided storage.
 {
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('Storage access denied');}});
  try{assert.equal((await loadPublishedContent({fetcher:async()=>Response.json(fresh)})).state,'published');assert.equal((await loadPublishedContent({fetcher:async()=>{throw new Error('Offline');}})).state,'bundled');}
  finally{if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);else delete globalThis.localStorage;}
 }
 // Retries are bounded, lifecycle recovery is single-flight, and a healthy
 // publication does not turn online/visibility/pageshow into polling.
 for(const trigger of ['online','visibilitychange','pageshow','focus']){
  const p=await page(),storage=memoryStorage(cached()),gate=deferred();let calls=0,recovered=false,active=0,maxActive=0,nextPublication=fresh;
  const updates=startPublicationUpdates({window:p.w,document:p.document,storage,timeout:100,retryDelay:5,maxAttempts:3,onSnapshot:p.apply,fetcher:async()=>{calls++;active++;maxActive=Math.max(maxActive,active);try{if(!recovered)throw new Error('Offline');await gate.promise;return Response.json(nextPublication);}finally{active--;}}});
  try{
   await updates.ready;await until(()=>calls===3,'Automatic attempts reach their configured bound');await tick(40);assert.equal(calls,3,'Repeated errors do not produce an infinite retry loop');recovered=true;
   if(trigger==='visibilitychange'){Object.defineProperty(p.document,'visibilityState',{value:'hidden',configurable:true});Object.defineProperty(p.document,'hidden',{value:true,configurable:true});p.document.dispatchEvent(new p.w.Event(trigger));await tick(10);assert.equal(calls,3,'A hidden tab does not start a recovery request');Object.defineProperty(p.document,'visibilityState',{value:'visible',configurable:true});Object.defineProperty(p.document,'hidden',{value:false,configurable:true});}
   const dispatch=()=>trigger==='visibilitychange'?p.document.dispatchEvent(new p.w.Event(trigger)):p.w.dispatchEvent(new p.w.Event(trigger));
   dispatch();await until(()=>calls===4,`${trigger} recovers after the automatic attempt budget is exhausted`);for(let i=0;i<4;i++)dispatch();await tick(10);assert.equal(calls,4,'Repeated lifecycle events share one in-flight request');gate.resolve();await until(()=>p.w.__AETHERWING_PUBLICATION__?.state==='published',`${trigger} reveals the complete fresh publication`);assert.equal(maxActive,1);
   dispatch();await tick(30);assert.equal(calls,4,'Healthy lifecycle events do not refetch the publication');
   nextPublication=newer;const refresh=updates.refresh();await Promise.resolve(refresh);await until(()=>calls===5,'Explicit refresh can update a healthy publication');await until(()=>p.w.__AETHERWING_PUBLICATION__?.revision===30,'Explicit refresh reveals the newer revision');assert.equal(p.$('[data-standings-probe]').textContent,'Newer round');assert.equal(p.$('[data-schedule-probe]').textContent,'Newer track');
  }finally{gate.resolve();updates.stop();p.close();}
 }
 // Stop aborts active work and retires timer/lifecycle callbacks. A late JSON
 // completion from a stopped controller cannot reveal or persist old content.
 {
  const p=await page(),storage=memoryStorage(cached()),gate=deferred(),snapshots=[];let calls=0,signal;
  const updates=startPublicationUpdates({window:p.w,document:p.document,storage,timeout:100,retryDelay:10,maxAttempts:3,onSnapshot:snapshot=>snapshots.push(snapshot),fetcher:async(_url,options)=>{calls++;signal=options.signal;return {ok:true,json:()=>gate.promise};}});updates.ready.catch(()=>{});
  try{await until(()=>!!signal,'Initial request starts');updates.stop();assert.equal(signal.aborted,true);gate.resolve(newer);p.w.dispatchEvent(new p.w.Event('online'));p.w.dispatchEvent(new p.w.Event('pageshow'));p.w.dispatchEvent(new p.w.Event('focus'));p.document.dispatchEvent(new p.w.Event('visibilitychange'));await tick(50);assert.equal(calls,1);assert.equal(snapshots.length,0,'Stopped controllers ignore late snapshots');assert.equal(storage.writes.length,0,'Stopped work cannot replace the cached publication');}
  finally{updates.stop();p.close();}
 }
 {
  const p=await page();let calls=0;const updates=startPublicationUpdates({window:p.w,document:p.document,storage:noStorage,timeout:30,retryDelay:30,maxAttempts:3,onSnapshot:()=>{},fetcher:async()=>{calls++;throw new Error('Offline');}});
  try{await updates.ready;updates.stop();await tick(70);assert.equal(calls,1,'Stop clears a scheduled automatic retry');}finally{updates.stop();p.close();}
 }
 assert.deepEqual(unhandled,[],'Timeouts, stopped work and late responses must not produce unhandled rejections');
 console.log('PASS: real >8s streamed body within default20s budget; portable bounded fetch+JSON deadlines; atomic cached/bundled→published recovery; no obsolete schedule actions; storage failures; bounded/single-flight lifecycle retries, healthy explicit refresh, and stopped/late work isolation. No live writes.');
}finally{process.off('unhandledRejection',onUnhandled);}

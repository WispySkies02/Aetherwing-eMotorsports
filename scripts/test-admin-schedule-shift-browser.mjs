import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs');
const moduleRoot=process.env.ADMIN_BROWSER_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(moduleRoot,'playwright-core/index.mjs')));
const root=path.resolve('public'),origin='https://admin.schedule-shift.fixture.test';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const seed=content.seeds();
// Explicit editor fields make this a persisted-format fixture, rather than
// treating normal insertion of empty optional fields as a date-shift change.
const baseline=content.normalize('schedule-events',seed['schedule-events'].map(event=>({offWeek:false,tbd:false,timePending:false,specialTag:'',round:'',entryListMode:'auto',...structuredClone(event),entries:structuredClone(event.entries||[])})));

const first=baseline.find(event=>event.league==='uarl-d1'&&event.round==='ROUND 7');
assert.ok(first,'Use the D1 Round 7 entry that reproduces the remaining-season shift');
assert.ok(baseline.filter(event=>event.league==='uarl-d1'&&event.date>=first.date).length>10,'Exercise a preview taller than a phone viewport');
const shiftDate=(value,days)=>{const date=new Date(`${value}T12:00:00Z`);date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);};
const sorted=rows=>content.normalize('schedule-events',rows);
const shifted=(rows,start,days)=>sorted(rows.map(event=>event.league==='uarl-d1'&&event.date>=start?{...event,date:shiftDate(event.date,days),...(event.endDate?{endDate:shiftDate(event.endDate,days)}:{})}:structuredClone(event)));

// Exercise the non-local browser path and actual auth/API/storage implementation.
// Only Identity, Blobs and the rebuild hook are fixtures; no request may escape.
const nativeFetch=globalThis.fetch,priorBlobs=globalThis.netlifyBlobsContext,priorHook=process.env.AETHERWING_BUILD_HOOK;
globalThis.netlifyBlobsContext=Buffer.from(JSON.stringify({siteID:'schedule-shift-browser-fixture',token:'fixture-token',edgeURL:'https://blobs.fixture',uncachedEdgeURL:'https://blobs.fixture'})).toString('base64');
process.env.AETHERWING_BUILD_HOOK='https://api.netlify.com/build_hooks/schedule-shift-browser-fixture';
let initial,storage=new Map(),etag=0,buildCount=0,writeCount=0;
const stored=()=>[...storage.values()][0]?.value||initial;
globalThis.fetch=async(input,options={})=>{
 const url=new URL(input instanceof Request?input.url:input),headers=new Headers(options.headers);
 if(url.hostname==='aetherwing.net'&&url.pathname==='/.netlify/identity/user'){
  assert.equal(headers.get('authorization'),'Bearer fixture-jwt');
  return Response.json({id:'fixture-admin',email:'admin@example.test',app_metadata:{roles:['admin']}});
 }
 if(url.hostname==='api.netlify.com'&&url.pathname==='/build_hooks/schedule-shift-browser-fixture'){assert.equal(options.method,'POST');buildCount++;return Response.json({ok:true});}
 assert.equal(url.hostname,'blobs.fixture','The browser regression must never contact live storage or rebuild hooks');
 const prior=storage.get(url.pathname)||{value:initial,etag:'fixture-0'};
 if(options.method?.toUpperCase()==='PUT'){
  assert.equal(headers.get('if-match'),prior.etag,'Real conditional write guard is exercised');
  const next={value:JSON.parse(options.body),etag:`fixture-${++etag}`};storage.set(url.pathname,next);writeCount++;
  return new Response('',{status:200,headers:{etag:next.etag}});
 }
 return Response.json(prior.value,{headers:{etag:prior.etag}});
};
const admin=(await import('../netlify/functions/site-admin.mjs')).default;
const publicData=(await import('../netlify/functions/site-data.mjs')).default;
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,390,320]){
  initial={version:1,revision:10,published:{...structuredClone(seed),'schedule-events':structuredClone(baseline)},drafts:{},history:[]};
  storage=new Map();etag=0;buildCount=0;writeCount=0;
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<700,reducedMotion:'reduce'}),page=await context.newPage();
  page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
  const errors=[],dialogs=[],actions=[];let dismissMove=false;
  page.on('pageerror',error=>errors.push(error.message));
  page.on('dialog',async dialog=>{dialogs.push(dialog.message());if(dismissMove&&/^Move \d+/.test(dialog.message())){dismissMove=false;await dialog.dismiss();}else await dialog.accept();});
  await context.addInitScript(()=>{
   let user=null;const callbacks={};
   window.netlifyIdentity={currentUser:()=>user,on:(name,fn)=>{(callbacks[name]??=[]).push(fn);if(name==='init')queueMicrotask(()=>fn(user));},close(){},logout(){},open(){user={email:'admin@example.test',app_metadata:{roles:['admin']},jwt:async()=>'fixture-jwt'};(callbacks.login||[]).forEach(fn=>fn(user));}};
  });
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==origin){if(request.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Fixture preview</title>'});return route.abort();}
   if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Fixture preview</title>'});
   if(url.pathname==='/.netlify/functions/site-admin'||url.pathname==='/api/site-content'){
    const options={method:request.method(),headers:request.headers(),...(!['GET','HEAD'].includes(request.method())?{body:request.postData()}: {})};
    if(url.pathname==='/.netlify/functions/site-admin')actions.push(request.postData()?JSON.parse(request.postData()).action:'readback');
    const response=await(url.pathname==='/api/site-content'?publicData:admin)(new Request(url,options));
    return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
   }
   if(url.pathname==='/.netlify/functions/paint-admin'){
    assert.equal(request.method(),'GET','Schedule tests cannot write paints');
    return route.fulfill({contentType:'application/json',body:JSON.stringify({registry:{paints:[],drafts:[],feature:null,revisions:[]}})});
   }
   try{
    let file=path.resolve(root,`.${url.pathname}`);assert.ok(file.startsWith(root+path.sep),'Serve only checked-in public assets');
    if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');
    return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
   }catch{return route.fulfill({status:404,body:''});}
  });
  const publicBefore=(await(await publicData(new Request(`${origin}/api/site-content`))).json()).datasets['schedule-events'];
  // A direct coordinate tap is intentional: locator.tap/click retries can scroll
  // a covered Apply button into a safe position and conceal this regression.
  const raw=async(selector)=>{
   const locator=typeof selector==='string'?page.locator(selector):selector;
   await locator.waitFor({state:'visible'});
   await locator.evaluate(el=>el.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}));
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const target=await locator.evaluate(el=>{
    const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y),dock=document.querySelector('[data-adm-dock]');
    const dockRect=dock&&getComputedStyle(dock).display!=='none'?dock.getBoundingClientRect():null;
    return{x,y,top:r.top,bottom:r.bottom,hit:!!hit&&(hit===el||el.contains(hit)),hitText:hit?.textContent?.trim().slice(0,80),dockTop:dockRect?.top,clientHeight:document.documentElement.clientHeight,scrollMarginBottom:getComputedStyle(el).scrollMarginBottom,dockBottom:dockRect?.bottom,dockHeight:dockRect?.height,dockMarginBottom:dock?getComputedStyle(dock).marginBottom:null,configuredDock:getComputedStyle(document.documentElement).getPropertyValue('--adm-dock'),viewportHeight:innerHeight};
   });
   assert.ok(target.hit,`${width}px: raw control is covered: ${JSON.stringify(target)}`);
   assert.ok(target.y>0&&target.y<844,`${width}px: raw target is inside the viewport`);
   if(target.dockTop!==undefined)assert.ok(target.bottom<=target.dockTop,`${width}px: full control clears the fixed dock: ${JSON.stringify(target)}`);
   if(width<700)await page.touchscreen.tap(target.x,target.y);else await page.mouse.click(target.x,target.y);
   assert.equal(await page.evaluate(()=>document.documentElement.classList.contains('adm-sheet-open')),false,'A shift control must not activate the People/Race dock sheet');
  };
  const rows=()=>page.locator('[data-content-list] [data-entry]').evaluateAll(nodes=>nodes.map(node=>node.textContent.trim()));
  const dateInput=page.locator('[data-field-path=\'["date"]\']');
  const feedback=()=>page.locator('[data-shift-feedback]').textContent();
  const waitFeedback=word=>page.waitForFunction(value=>document.querySelector('[data-shift-feedback]')?.textContent.includes(value),word);
  const start=async(date)=>{
   const tool=page.locator('[data-schedule-shift]');
   if(await tool.evaluate(el=>el.classList.contains('adm-folded')))await raw(tool.locator(':scope > .adm-tool-head'));
   await page.locator('[data-shift-league]').selectOption('uarl-d1');
   const option=await page.locator('[data-shift-start] option').evaluateAll((nodes,title)=>nodes.find(node=>node.textContent.includes(title))?.value,first.title);
   assert.notEqual(option,undefined,'D1 starting race remains selectable');await page.locator('[data-shift-start]').selectOption(option);
   assert.match(await page.locator('[data-shift-start] option:checked').textContent(),new RegExp(new Date(`${date}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'}).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  };
  const preview=async(days,date)=>{await start(date);await raw(`[data-shift-preview="${days}"]`);await waitFeedback('Preview ready');assert.equal(await page.locator('[data-shift-preview-panel]').isVisible(),true);assert.match(await page.locator('[data-shift-preview-heading]').textContent(),days>0?/UARL D1.*\+1 week/:/UARL D1.*−1 week/);};
  const apply=async(days,date)=>{
   const count=dialogs.length;await raw('[data-shift-apply]');await waitFeedback('moved');
   assert.equal(dialogs.length,count+1,'A raw Apply opens exactly one confirmation');assert.match(dialogs.at(-1),/^Move \d+ UARL D1 events 7 days (later|earlier)/);
   assert.equal(await dateInput.inputValue(),shiftDate(date,days),'Form selects the first affected D1 event and its shifted date');
   assert.equal(await page.locator('[data-shift-preview-panel]').isVisible(),false);assert.equal(await page.locator('[data-shift-result]').isVisible(),true);assert.equal(await page.locator('[data-shift-undo]').isVisible(),true);
   assert.match(await feedback(),days>0?/7 days later/:/7 days earlier/);
  };
  const saveAndPublish=async(expected,priorPublic)=>{
   await raw('[data-content-form] button[type="submit"]');
   await page.waitForFunction(()=>!document.querySelector('[data-content-editor]').inert&&document.querySelector('[data-content-save-feedback]').textContent.startsWith('PRIVATE DRAFT'));
   assert.deepEqual(stored().drafts['schedule-events'],expected,'Private saved shift preserves exact dates and every other event field');
   assert.deepEqual(stored().published['schedule-events'],priorPublic,'Private draft never changes the public schedule');
   const builds=buildCount;await raw('[data-content-publish]');
   await page.waitForFunction(()=>!document.querySelector('[data-content-editor]').inert&&/^PUBLISHED · revision \d+ · public feed verified/.test(document.querySelector('[data-content-save-feedback]').textContent));
   assert.deepEqual(stored().published['schedule-events'],expected,'Published storage readback retains exact shifted schedule');assert.equal(buildCount,builds+1,'Only the fixture rebuild hook is queued');
   const response=await publicData(new Request(`${origin}/api/site-content`));assert.equal(response.status,200);
   const publicSchedule=(await response.json()).datasets['schedule-events'];
   assert.deepEqual(publicSchedule.filter(event=>event.league==='uarl-d1'),expected.filter(event=>event.league==='uarl-d1'),'Public D1 feed matches the confirmed shift');
   assert.deepEqual(publicSchedule.filter(event=>event.league!=='uarl-d1'),publicBefore.filter(event=>event.league!=='uarl-d1'),'Other league records remain unchanged after publication');
  };
  try{
   await page.goto(`${origin}/admin/`,{waitUntil:'domcontentloaded'});await raw('[data-login]');
   const calendar=width<900?page.locator('.adm-home [data-adm-home-open]').filter({hasText:/^Calendar$/}):page.locator('[data-admin-tabs] [data-admin-dataset="schedule-events"]');await raw(calendar);
   await page.waitForFunction(()=>document.querySelector('[data-content-dataset]').value==='schedule-events'&&!document.querySelector('[data-content-editor]').hidden);
   const originalRows=await rows();
   await preview(7,first.date);assert.deepEqual(await rows(),originalRows,'Preview does not move dates');
   await raw('[data-shift-cancel]');assert.deepEqual(await rows(),originalRows);assert.equal(await page.locator('[data-shift-preview-panel]').isVisible(),false);assert.equal(writeCount,0,'Preview and cancellation never save or publish');
   await preview(7,first.date);await apply(7,first.date);await raw('[data-shift-undo]');await waitFeedback('undone');assert.deepEqual(await rows(),originalRows,'Raw Undo restores every workspace event');assert.equal(writeCount,0);
   await preview(7,first.date);await apply(7,first.date);
   const later=shifted(baseline,first.date,7);await saveAndPublish(later,baseline);
   await page.reload({waitUntil:'domcontentloaded'});await raw('[data-login]');
   await page.waitForFunction(()=>document.querySelector('[data-content-dataset]').value==='schedule-events'&&!document.querySelector('[data-content-editor]').hidden);
   const laterRows=await rows(),laterDate=shiftDate(first.date,7);
   await preview(-7,laterDate);const writes=writeCount;dismissMove=true;await raw('[data-shift-apply]');assert.equal(writeCount,writes);assert.deepEqual(await rows(),laterRows,'Dismissing Apply leaves every workspace date unchanged');
   await apply(-7,laterDate);await raw('[data-shift-undo]');await waitFeedback('undone');assert.deepEqual(await rows(),laterRows,'Earlier-shift Undo restores the published later schedule');
   await preview(-7,laterDate);await apply(-7,laterDate);await saveAndPublish(baseline,later);
   assert.deepEqual(errors,[],'No native-browser runtime errors');assert.ok(actions.includes('saveDraft')&&actions.includes('publish')&&actions.includes('readback'));
   await page.screenshot({path:`/tmp/admin-schedule-shift-${width}.png`});
   console.log(`PASS: ${width}px ${width<700?'raw finger':'raw mouse'} hit targets clear dock; ±7-day preview/cancel/apply/Undo, first-event feedback, authenticated mock draft/publication/readback and unchanged other leagues.`);
  }catch(error){await page.screenshot({path:`/tmp/admin-schedule-shift-failure-${width}.png`});throw error;}
  finally{await context.close();}
 }
}finally{
 await browser?.close();globalThis.fetch=nativeFetch;
 if(priorBlobs===undefined)delete globalThis.netlifyBlobsContext;else globalThis.netlifyBlobsContext=priorBlobs;
 if(priorHook===undefined)delete process.env.AETHERWING_BUILD_HOOK;else process.env.AETHERWING_BUILD_HOOK=priorHook;
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

const root=new URL('../',import.meta.url),require=createRequire(import.meta.url);
const seeds=require('../netlify/lib/_content.cjs').seeds();
const html=fs.readFileSync(new URL('public/admin/index.html',root),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`public/admin/${name}`,root),'utf8'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,15));
const deferred=()=>{let resolve,reject;const promise=new Promise((ok,no)=>{resolve=ok;reject=no;});return {promise,resolve,reject};};
const unhandled=[],onUnhandled=error=>unhandled.push(error?.message||String(error));
process.on('unhandledRejection',onUnhandled);

async function editor({url='https://aetherwing.net/admin/',jwt,fastTimeout=false,ignoreAbort=false}={}){
 const dom=new JSDOM(html,{url,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,$=selector=>w.document.querySelector(selector),listeners={},requests=[],errors=[],prompts=[];
 let user=null,jwtProvider=jwt||(()=>Promise.resolve('navigation-fixture-jwt')),confirmResult=true;
 Object.assign(w,{structuredClone,AbortSignal,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener(){}});
 const timeout=w.setTimeout.bind(w);w.setTimeout=(fn,delay,...args)=>timeout(fn,fastTimeout&&delay===20000?20:delay,...args);
 w.confirm=message=>{prompts.push(String(message));return confirmResult;};w.addEventListener('error',event=>errors.push(event.message));
 w.netlifyIdentity={currentUser:()=>user,on:(name,fn)=>{(listeners[name]??=[]).push(fn);},close(){},open(){},logout:()=>logout()};
 w.fetch=async(input,options={})=>{
  const target=new URL(String(input),w.location.href);assert.equal(target.origin,w.location.origin,'No section-loading test may leave its mocked application');
  if(target.pathname==='/.netlify/functions/site-admin'){
   assert.equal(options.method||'GET','GET','Section navigation must not write CMS data');assert.equal(options.headers.authorization,'Bearer navigation-fixture-jwt');
   const pending=deferred(),request={...pending,signal:options.signal,aborted:false};requests.push(request);
   const abort=()=>{request.aborted=true;if(!ignoreAbort)pending.reject(new w.DOMException('Fixture read aborted','AbortError'));};
   if(options.signal?.aborted)abort();else options.signal?.addEventListener('abort',abort,{once:true});return pending.promise;
  }
  if(target.pathname==='/.netlify/functions/paint-admin'){assert.equal(options.method||'GET','GET','Navigation must not modify Paint Booth data');return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});}
  assert.ok(target.pathname.startsWith('/data/'),`Unexpected mocked navigation request: ${target.pathname}`);
  return new Response(fs.readFileSync(new URL(`public${target.pathname}`,root),'utf8'));
 };
 const login=()=>{user={email:'navigation-fixture@example.test',app_metadata:{roles:['admin']},jwt:()=>jwtProvider()};(listeners.login||[]).forEach(fn=>fn(user));};
 const logout=()=>{user=null;(listeners.logout||[]).forEach(fn=>fn());};
 scripts.forEach(script=>w.eval(script));await tick();login();await tick();
 const wait=async(predicate,label)=>{for(let attempt=0;attempt<200;attempt++){if(predicate())return;await tick();}assert.fail(`${label}: ${$('[data-admin-section-message]')?.textContent||$('[data-content-status]')?.textContent||''}`);};
 const response=()=>Response.json({registry:{version:1,revision:7,published:{},drafts:{},history:[]},seeds,publishConfigured:false});
 const click=name=>{const button=$(`[data-admin-dataset="${name}"]`);assert.ok(button,`${name} section link exists`);button.click();};
 const visible=selector=>{const node=$(selector);return Boolean(node&&!node.closest('[hidden]'));};
 const checkPanel=(state,name)=>{
  const panel=$('[data-admin-section-state]');assert.ok(panel,'Section feedback has its own workspace-level region');assert.equal(panel.closest('[data-content-editor]'),null,'Read failures cannot be hidden with the editor');
  assert.ok(visible('[data-admin-section-state]'),`${state}: section feedback is visible`);assert.equal(panel.dataset.state,state);assert.equal(panel.getAttribute('aria-busy'),String(state==='loading'));
  assert.ok($('[data-admin-section-title]').textContent.trim(),'The selected workspace has a readable feedback title');assert.ok($('[data-admin-section-message]').textContent.trim(),'The selected workspace has readable feedback');
  assert.equal(visible('[data-admin-section-retry]'),state==='error','Retry is available only after a read error');assert.equal(visible('[data-content-editor]'),false,'Baseline/stale editor controls are not exposed before the read succeeds');
  if(name){assert.equal(new URL(w.location.href).searchParams.get('section'),name,'Section URL changes immediately');assert.equal($(`[data-admin-dataset="${name}"]`).classList.contains('is-active'),true,'The selected section link is active immediately');}
 };
 const ready=async name=>{await wait(()=>visible('[data-content-editor]')&&$('[data-content-dataset]').value===name,`${name} editor becomes usable`);assert.equal(visible('[data-admin-section-state]'),false,'Loading/error feedback clears after a successful read');};
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(node=>node.dataset.fieldPath===JSON.stringify(path));
 return {w,$,wait,requests,errors,prompts,click,visible,checkPanel,ready,response,field,login,logout,setJWT:fn=>{jwtProvider=fn;},setConfirm:value=>{confirmResult=value;},close:()=>dom.window.close()};
}

try{
 // Homepage cards and the mobile sidebar both provide immediate feedback.
 for(const entry of ['home','sidebar']){
  const e=await editor();try{
   if(entry==='home'){const button=[...e.w.document.querySelectorAll('.adm-home [data-adm-home-open]')].find(node=>node.textContent.trim()==='Driver Portfolios');assert.ok(button,'Actual phone homepage button exists');button.click();}else{e.$('[data-adm-open="people"]').click();e.click('drivers');}
   const name=entry==='home'?'driver-portfolios':'drivers';
   await e.wait(()=>e.requests.length===1,'One pending CMS read');
   const target=name;e.checkPanel('loading',target);
   if(entry==='sidebar'){await tick();assert.equal(e.w.document.documentElement.classList.contains('adm-sheet-open'),false,'The phone sheet can close while visible loading feedback remains');}
   e.requests[0].resolve(e.response());await e.ready(target);assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // HTTP, transport and malformed success bodies surface recoverable errors.
 for(const failure of ['http','network','malformed']){
  const e=await editor();try{
   e.click('driver-portfolios');await e.wait(()=>e.requests.length===1,'Failed read starts');e.checkPanel('loading','driver-portfolios');
   if(failure==='network')e.requests[0].reject(new TypeError('Fixture connection lost'));
   else e.requests[0].resolve(failure==='http'?Response.json({error:'Fixture CMS unavailable'},{status:500}):Response.json({unexpected:'not a registry'}));
   await e.wait(()=>e.$('[data-admin-section-state]').dataset.state==='error','Read failure becomes visible');e.checkPanel('error','driver-portfolios');
   const message=e.$('[data-admin-section-message]').textContent;assert.ok(message.length>5,'The failure explains why loading did not finish');
   e.$('[data-admin-section-retry]').click();await e.wait(()=>e.requests.length===2,'Retry starts a new read');e.checkPanel('loading','driver-portfolios');e.requests[1].resolve(e.response());await e.ready('driver-portfolios');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // The same bounded deadline includes identity refresh, response and body parsing.
 for(const stage of ['jwt','fetch','body']){
  const token=deferred(),body=deferred();const e=await editor({fastTimeout:true,jwt:stage==='jwt'?()=>token.promise:undefined});try{
   e.click('drivers');e.checkPanel('loading','drivers');
   if(stage!=='jwt'){await e.wait(()=>e.requests.length===1,'Timed read begins');if(stage==='body')e.requests[0].resolve({ok:true,status:200,json:()=>body.promise});}
   await e.wait(()=>e.$('[data-admin-section-state]').dataset.state==='error',`${stage} deadline`);e.checkPanel('error','drivers');assert.match(e.$('[data-admin-section-message]').textContent,/time|long|retry|again/i);
   if(stage==='jwt')assert.equal(e.requests.length,0,'Hung identity refresh never reaches CMS fetch');
   assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Rapid choices share the read and open only the latest requested dataset.
 {
  const e=await editor();try{
   e.click('drivers');e.click('driver-portfolios');await e.wait(()=>e.requests.length===1,'Rapid choices share an initial load');e.checkPanel('loading','driver-portfolios');e.requests[0].resolve(e.response());await e.ready('driver-portfolios');await tick();assert.equal(e.requests.length,1);assert.equal(new URL(e.w.location.href).searchParams.get('section'),'driver-portfolios');
   e.click('partners');await e.ready('partners');assert.equal(e.requests.length,1,'Loaded section navigation reuses the current registry');
  }finally{e.close();}
 }
 // Returning home, paint, theme or browser Back invalidates the old destination.
 for(const destination of ['overview','paint','theme','back']){
  const e=await editor({ignoreAbort:true});try{
   e.click('drivers');await e.wait(()=>e.requests.length===1,'Read pending before navigation away');
   if(destination==='overview')e.$('[data-admin-tab="overview"]').click();
   else if(destination==='paint')e.$('[data-admin-paint-tab="library"]').click();
   else if(destination==='theme')e.$('[data-admin-tab="theme-preview"]').click();
   else {e.w.history.back();await e.wait(()=>!new URL(e.w.location.href).searchParams.has('section'),'Back returns to Home');}
   const expected=destination==='paint'?'paint-library':destination==='theme'?'theme-preview':'overview';
   e.requests[0].resolve(e.response());await tick();await tick();assert.equal(e.visible('[data-content-editor]'),false,'A stale completion cannot reopen its dataset');assert.equal(e.visible('[data-admin-section-state]'),false,'Old pending feedback does not cover the destination');
   const selected=new URL(e.w.location.href).searchParams.get('section')||'overview';assert.equal(selected,expected,'Latest non-dataset destination wins');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Logged-out reads cannot refill the next session's registry or reopen a tab.
 {
  const e=await editor({ignoreAbort:true});try{
   e.click('drivers');await e.wait(()=>e.requests.length===1,'Prior-session read begins');e.logout();await tick();assert.equal(e.visible('[data-workspace]'),false);assert.equal(e.visible('[data-admin-section-state]'),false);
   e.login();await e.wait(()=>e.requests.length===2,'Reauthentication starts a fresh read');e.requests[0].resolve(e.response());await tick();assert.equal(e.visible('[data-content-editor]'),false,'Prior-session completion cannot populate the next session');
   e.requests[1].resolve(e.response());await e.ready('drivers');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 // Loaded forms still respect existing dirty-edit and browser Back guards.
 {
  const e=await editor();try{
   e.click('drivers');await e.wait(()=>e.requests.length===1,'Dirty guard fixture read');e.requests[0].resolve(e.response());await e.ready('drivers');e.click('driver-portfolios');await e.ready('driver-portfolios');
   const name=e.field(['name']);assert.ok(name);name.value='Unsaved portfolio fixture';name.dispatchEvent(new e.w.Event('input',{bubbles:true}));e.setConfirm(false);
   e.click('drivers');await tick();assert.equal(e.$('[data-content-dataset]').value,'driver-portfolios');assert.equal(e.field(['name']).value,'Unsaved portfolio fixture');assert.equal(e.visible('[data-admin-section-state]'),false,'Canceled navigation keeps the current form');
   const before=e.prompts.length;e.w.history.back();await e.wait(()=>e.prompts.length>before,'Back asks about dirty state');await e.wait(()=>new URL(e.w.location.href).searchParams.get('section')==='driver-portfolios','Canceled Back restores its route');assert.equal(e.field(['name']).value,'Unsaved portfolio fixture');assert.equal(e.requests.length,1,'Dirty guard does not fetch or write');assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 assert.deepEqual(unhandled,[],'No navigation read rejection escapes visible recovery handling');
 console.log('PASS: Admin cards/sidebar expose immediate loading and recoverable HTTP/network/body/identity errors; shared bounded reads keep latest sections/Home/paint/theme/Back/logout choices; retries and dirty guards work without CMS writes.');
}finally{process.off('unhandledRejection',onUnhandled);}

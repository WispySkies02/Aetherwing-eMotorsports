import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),root=new URL('../',import.meta.url);
const seed=require('../netlify/lib/_content.cjs').seeds();
const modules=process.env.PAINT_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
const origin='https://admin-section.fixture.test',publicRoot=path.resolve(new URL('public/',root).pathname);
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const image='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="70"><rect width="160" height="70" fill="#28344f"/></svg>';
// Freeze Admin source at test startup; requests use the current public assets,
// without starting a build or touching authenticated production storage.
const snapshot=new Map(['index.html','admin-shell.js','content-admin.js','paint-ops-admin.js','paint-3d-admin.js','theme-preview.js','paint-ops-admin.css','paint-3d-admin.css','control-center.css','fresh-admin.css','admin-ux.css'].map(name=>[`/admin/${name}`,fs.readFileSync(path.join(publicRoot,'admin',name))]));

async function editor(browser,width){
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],reads=[],unexpected=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
 await context.addInitScript(()=>{
  let account=null;const listeners={};
  window.netlifyIdentity={currentUser:()=>account,on:(name,callback)=>{(listeners[name]??=[]).push(callback);if(name==='init')queueMicrotask(()=>callback(account));},close:()=>{},logout:()=>{},open:()=>{account={email:'section-browser@example.test',app_metadata:{roles:['admin']},jwt:async()=>'section-browser-jwt'};(listeners.login||[]).forEach(fn=>fn(account));}};
  window.__navigationHeartbeat=0;setInterval(()=>window.__navigationHeartbeat++,25);
 });
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),p=url.pathname;
  if(url.origin!==origin){if(request.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:image});return route.abort();}
  if(p==='/'&&request.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><body>Isolated theme preview fixture</body>'});
  if(p==='/.netlify/functions/site-admin'){
   assert.equal(request.method(),'GET','Section loading must not write CMS data');assert.equal(request.headers().authorization,'Bearer section-browser-jwt');
   return new Promise(resolve=>reads.push({answered:false,async respond(status=200,error='Fixture content read failed.'){assert.equal(this.answered,false,'A pending read is fulfilled once');this.answered=true;await route.fulfill({status,contentType:'application/json',body:JSON.stringify(status===200?{registry:{version:1,revision:7,published:seed,drafts:{},history:[]},seeds:seed,publishConfigured:false}:{error})});resolve();}}));
  }
  if(p==='/.netlify/functions/paint-admin'){assert.equal(request.method(),'GET','Paint registry remains read-only');return route.fulfill({contentType:'application/json',body:JSON.stringify({registry:{paints:[],drafts:[],feature:null,revisions:[]}})});}
  if(p==='/api/site-content')return route.fulfill({contentType:'application/json',body:JSON.stringify({version:1,revision:7,datasets:seed})});
  const assetPath=p==='/admin/'?'/admin/index.html':p;
  if(snapshot.has(assetPath))return route.fulfill({contentType:mime[path.extname(assetPath)]||'application/octet-stream',body:snapshot.get(assetPath)});
  let file=path.resolve(publicRoot,`.${p}`);
  if(file!==publicRoot&&!file.startsWith(publicRoot+path.sep)){unexpected.push(p);return route.abort();}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{unexpected.push(p);return route.fulfill({status:404,body:'Fixture asset not found'});}
 });
 await page.goto(`${origin}/admin/`,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('[data-workspace]').isVisible(),false,'Admin remains behind sign-in');await page.locator('[data-login]').click();await page.locator('[data-workspace]').waitFor({state:'visible'});
 const lanes={partners:'more','driver-portfolios':'more',drivers:'people','schedule-events':'race',alliances:'people'};
 const names={partners:'Partners','driver-portfolios':'Driver Portfolios',drivers:'Assignments','schedule-events':'Calendar',alliances:'Team Alliances'};
 const choose=async section=>{
  if(width>900)return page.locator(`[data-admin-tabs] [data-admin-dataset="${section}"]`).click();
  if(await page.locator('[data-admin-overview]').isVisible())return page.locator('.adm-home__links button').filter({hasText:new RegExp(`^${names[section]}$`)}).click();
  await page.locator(`[data-adm-open="${lanes[section]}"]`).click();await page.locator(`[data-admin-tabs] [data-admin-dataset="${section}"]`).click();
 };
 const home=()=>page.locator(width>900?'[data-admin-tabs] [data-admin-tab="overview"]':'[data-adm-open="overview"]').click();
 const paint=async()=>{if(width<901)await page.locator('[data-adm-open="paint"]').click();await page.locator('[data-admin-tabs] [data-admin-paint-tab="feature"]').click();};
 const state=page.locator('[data-admin-section-state]');
 const checkState=async(expected,section)=>{
  await state.waitFor({state:'visible'});await page.waitForFunction(expected=>document.querySelector('[data-admin-section-state]').dataset.state===expected,expected);
  assert.equal(await state.getAttribute('aria-busy'),String(expected==='loading'));assert.match(await page.locator('[data-admin-section-title]').textContent(),new RegExp(names[section]));assert.ok((await page.locator('[data-admin-section-message]').textContent()).trim(),'Loading/error state gives visible feedback');
  assert.equal(await page.locator('[data-content-editor]').isVisible(),false,'Unresolved content must not expose stale fields');assert.equal(await page.locator('[data-admin-section-retry]').isVisible(),expected==='error');
  assert.equal(new URL(page.url()).searchParams.get('section'),section,'The requested section is immediately bookmarkable');assert.equal(await page.locator(`[data-admin-tabs] [data-admin-dataset="${section}"]`).getAttribute('aria-current'),'page');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px ${expected}: state panel stays within the viewport`);
 };
 const read=async index=>{await page.waitForFunction(()=>window.__navigationHeartbeat>0);for(let attempt=0;attempt<150;attempt++){if(reads[index])return reads[index];await new Promise(resolve=>setTimeout(resolve,10));}assert.fail(`Expected pending Admin read ${index}`);};
 const loaded=async section=>{await page.waitForFunction(section=>!document.querySelector('[data-content-editor]').hidden&&document.querySelector('[data-content-dataset]').value===section,section);assert.equal(await state.isVisible(),false);assert.equal(await page.locator('[data-content-editor]').getAttribute('inert'),null);};
 const finish=async()=>{assert.deepEqual(errors,[],'No navigation or observer runtime errors');assert.deepEqual(unexpected,[],'Only mocked read APIs and current public assets are requested');await context.close();};
 return {page,reads,choose,home,paint,state,checkState,read,loaded,finish,close:()=>context.close()};
}

let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,390,320]){
  // A pending first read is visibly actionable. Further selections share that
  // read and only the most recently requested section may display its result.
  let e=await editor(browser,width);
  try{
   await e.choose('partners');await e.checkState('loading','partners');const pending=await e.read(0),heartbeat=await e.page.evaluate(()=>window.__navigationHeartbeat);
   await e.choose('driver-portfolios');await e.checkState('loading','driver-portfolios');assert.equal(e.reads.length,1,'Rapid selections share one initial registry read');await e.page.waitForFunction(before=>window.__navigationHeartbeat>before,heartbeat);
   await pending.respond();await e.loaded('driver-portfolios');assert.equal(new URL(e.page.url()).searchParams.get('section'),'driver-portfolios');await e.choose('drivers');await e.loaded('drivers');assert.equal(e.reads.length,1,'Loaded registry supports later sections without another initial read');await e.finish();
  }catch(error){await e.close();throw error;}

  // Read failures are visible on the current page and can be retried in place.
  e=await editor(browser,width);
  try{
   await e.choose('partners');await e.checkState('loading','partners');await (await e.read(0)).respond(500);await e.checkState('error','partners');assert.match(await e.page.locator('[data-admin-section-message]').textContent(),/Fixture content read failed/);await e.page.screenshot({path:`/tmp/admin-section-error-${width}.png`,animations:'disabled'});
   await e.page.locator('[data-admin-section-retry]').click();await e.checkState('loading','partners');await (await e.read(1)).respond();await e.loaded('partners');assert.equal(e.reads.length,2);await e.finish();
  }catch(error){await e.close();throw error;}

  // Navigating Home during a read must remain Home when that read completes.
  e=await editor(browser,width);
  try{
   await e.choose('partners');await e.checkState('loading','partners');const pending=await e.read(0);await e.home();await e.page.locator('[data-admin-overview]').waitFor({state:'visible'});assert.equal(await e.state.isVisible(),false);await pending.respond();await e.page.waitForFunction(()=>document.querySelector('[data-admin-revision]').textContent==='7');assert.equal(await e.page.locator('[data-admin-overview]').isVisible(),true);assert.equal(await e.page.locator('[data-content-editor]').isVisible(),false);assert.equal(new URL(e.page.url()).searchParams.get('section'),null);await e.finish();
  }catch(error){await e.close();throw error;}

  // Paint controls use their own read workflow and cannot be overwritten by
  // completion of a previously requested main-site content section.
  e=await editor(browser,width);
  try{
   await e.choose('partners');await e.checkState('loading','partners');const pending=await e.read(0);await e.paint();await e.page.locator('[data-panel="feature"]').waitFor({state:'visible'});assert.equal(await e.state.isVisible(),false);await pending.respond();await e.page.waitForFunction(()=>document.querySelector('[data-admin-revision]').textContent==='7');assert.equal(await e.page.locator('[data-panel="feature"]').isVisible(),true);assert.equal(await e.page.locator('[data-content-editor]').isVisible(),false);assert.equal(new URL(e.page.url()).searchParams.get('section'),'paint-feature');await e.finish();
  }catch(error){await e.close();throw error;}
  console.log(`PASS ${width}px: ${width>900?'sidebar navigation':'mobile home cards and dock'}: visible loading/error feedback, immediate URLs, one shared initial read, retry and latest-section/Home/Paint navigation without late overwrites or CMS writes.`);
 }
}finally{await browser?.close();}

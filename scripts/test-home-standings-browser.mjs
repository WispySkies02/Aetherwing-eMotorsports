import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs');
const modules=process.env.ADMIN_BROWSER_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
const origin='https://home-standings.fixture.test',publicRoot=path.resolve('public'),dist=path.resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
assert.ok(fs.existsSync(path.join(dist,'index.html')),'Build the production site before this browser check');
const baseline=structuredClone(content.seeds());
for(const board of baseline.standings){delete board.featuredOnHome;delete board.homeTable;}
const nr=baseline.standings.find(board=>board.id==='nrrs'),km=baseline.standings.find(board=>board.id==='kmart'),su=baseline.standings.find(board=>board.id==='sunoco'),d1=baseline.standings.find(board=>board.id==='uarl');
Object.assign(km.rows.find(row=>row.driver==='Hailey'),{chaseLocked:true,regularSeasonChampion:true});
Object.assign(su.rows.find(row=>row.driver==='Hailey'),{highlight:true,chaseLocked:true});
su.chaseTitle='Sunoco Chase-only points';su.chaseSubtitle='Chase-only snapshot · native browser fixture';
su.chaseRows=[{position:'P1',number:'42',driver:'Will',points:120,delta:'LEADER',positionChange:0},{position:'P2',number:'54',driver:'Hailey',points:110,delta:'-10',positionChange:1,highlight:true},{position:'P3',number:'46',driver:'Clutch',points:100,delta:'-20',positionChange:-1}];
assert.equal(d1.rows.length,0,'Use the genuine empty D1 board rather than inventing a driver');
const art=number=>`/__fixture/number-${number}.svg`;
for(const [league,number]of [['nrrs','32'],['kmart','15'],['sunoco','54']]){
 const driver=baseline.drivers.find(driver=>driver.profile==='hailey'&&driver.competitionId===league);assert.ok(driver);driver.numberImage=art(number);driver.numberImageBackup='';
}
const nativeFetch=globalThis.fetch,priorBlobs=globalThis.netlifyBlobsContext,priorHook=process.env.AETHERWING_BUILD_HOOK;
globalThis.netlifyBlobsContext=Buffer.from(JSON.stringify({siteID:'homepage-standings-browser-fixture',token:'fixture-token',edgeURL:'https://blobs.fixture',uncachedEdgeURL:'https://blobs.fixture'})).toString('base64');
process.env.AETHERWING_BUILD_HOOK='https://api.netlify.com/build_hooks/homepage-standings-browser-fixture';
let initial,storage=new Map(),etag=0,writes=0,builds=0;
const stored=()=>[...storage.values()][0]?.value||initial;
globalThis.fetch=async(input,options={})=>{
 const url=new URL(input instanceof Request?input.url:input),headers=new Headers(options.headers);
 if(url.hostname==='aetherwing.net'&&url.pathname==='/.netlify/identity/user'){assert.equal(headers.get('authorization'),'Bearer fixture-jwt');return Response.json({id:'fixture-admin',email:'admin@example.test',app_metadata:{roles:['admin']}});}
 if(url.hostname==='api.netlify.com'&&url.pathname==='/build_hooks/homepage-standings-browser-fixture'){assert.equal(options.method,'POST');builds++;return Response.json({ok:true});}
 assert.equal(url.hostname,'blobs.fixture','The browser test must never access live storage or deployment hooks');
 const old=storage.get(url.pathname)||{value:initial,etag:'fixture-0'};
 if(options.method?.toUpperCase()==='PUT'){assert.equal(headers.get('if-match'),old.etag,'Exercise the real conditional persistence guard');const next={value:JSON.parse(options.body),etag:`fixture-${++etag}`};storage.set(url.pathname,next);writes++;return new Response('',{status:200,headers:{etag:next.etag}});}
 return Response.json(old.value,{headers:{etag:old.etag}});
};
const admin=(await import('../netlify/functions/site-admin.mjs')).default,publicData=(await import('../netlify/functions/site-data.mjs')).default;
const deferred=()=>{let resolve;const promise=new Promise(done=>{resolve=done;});return{promise,resolve};};
let browser;

async function contextFor(width,{cache=null,offline=false,holdOldArt=false,noJS=false}={}){
 const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<700,reducedMotion:'reduce',javaScriptEnabled:!noJS});
 const errors=[],actions=[],pending=[],oldArtGate=deferred(),oldArtDone=deferred();let oldArtStarted=false,fail=offline,hold=false;
 context.on('page',page=>{page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());});
 await context.addInitScript(({cache})=>{
  let user=null;const listeners={};window.netlifyIdentity={currentUser:()=>user,on:(name,fn)=>{(listeners[name]??=[]).push(fn);if(name==='init')queueMicrotask(()=>fn(user));},close(){},logout(){},open(){user={email:'admin@example.test',app_metadata:{roles:['admin']},jwt:async()=>'fixture-jwt'};(listeners.login||[]).forEach(fn=>fn(user));}};
  if(location.pathname==='/'){
   if(cache)localStorage.setItem('aetherwing-publication-v1',JSON.stringify(cache));else localStorage.removeItem('aetherwing-publication-v1');
   window.__homeDocument=Math.random();window.__homeFrames=[];
   const sample=()=>{const root=document.querySelector('[data-home-standings-root]');if(!root||document.documentElement.dataset.contentState==='loading')return;const q=selector=>root.querySelector(selector),image=q('[data-battle-number] img');window.__homeFrames.push({state:document.documentElement.dataset.contentState,id:root.dataset.homeStandingsId,table:root.dataset.homeStandingsTable,cardId:q('[data-battle-heading]')?.closest('[data-home-standings-id]')?.dataset.homeStandingsId,towerId:q('[data-timing-tower]')?.dataset.homeStandingsId,towerTable:q('[data-timing-tower]')?.dataset.homeStandingsTable,heading:q('[data-battle-heading]')?.textContent,context:q('[data-battle-context]')?.textContent,gap:q('[data-battle-gap]')?.textContent,leader:q('[data-battle-leader]')?.textContent,number:image?.getAttribute('alt')||q('[data-battle-number]')?.textContent,art:image?.getAttribute('src')||'',title:q('[data-tower-title]')?.textContent,cut:q('[data-tower-cut]')?.hidden?'':q('[data-tower-cut]')?.textContent});if(window.__homeFrames.length>200)window.__homeFrames.shift();};
   new MutationObserver(sample).observe(document,{subtree:true,attributes:true,childList:true,characterData:true});window.addEventListener('aetherwing:content',()=>queueMicrotask(sample));
  }
 },{cache});
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.origin!==origin)return route.abort();
  if(url.pathname==='/.netlify/functions/site-admin'||url.pathname==='/api/site-content'){
   if(url.pathname==='/api/site-content'&&!url.searchParams.has('admin_verify')){if(fail)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Temporary publication fixture failure"}'});if(hold)await new Promise(resolve=>pending.push(resolve));}
   const options={method:request.method(),headers:request.headers(),...(!['GET','HEAD'].includes(request.method())?{body:request.postData()}: {})};if(url.pathname==='/.netlify/functions/site-admin')actions.push(request.postData()?JSON.parse(request.postData()).action:'readback');
   const response=await(url.pathname==='/api/site-content'?publicData:admin)(new Request(url,options));return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
  }
  if(url.pathname==='/.netlify/functions/paint-admin'){assert.equal(request.method(),'GET','This test cannot edit paints');return route.fulfill({contentType:'application/json',body:'{"registry":{"paints":[],"drafts":[],"feature":null,"revisions":[]}}'});}
  assert.equal(request.method(),'GET','Only the isolated Admin handler may receive writes');
  if(url.pathname.startsWith('/__fixture/number-')){
   const number=url.pathname.match(/number-(\d+)\.svg$/)?.[1];assert.ok(number);
   if(number==='32'&&holdOldArt){oldArtStarted=true;await oldArtGate.promise;try{return await route.fulfill({status:404,body:''});}catch(error){if(!/closed|interception|Invalid InterceptionId|already handled/i.test(error.message))throw error;}finally{oldArtDone.resolve();}return;}
   return route.fulfill({contentType:'image/svg+xml',body:`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100" viewBox="0 0 150 100"><title>Isolated number ${number} artwork</title><text x="75" y="76" text-anchor="middle" font-family="sans-serif" font-size="85" font-weight="bold" fill="#6dc8ff">${number}</text></svg>`});
  }
  if(url.pathname==='/api/track-weather')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Weather fixture unavailable"}'});
  if(url.pathname==='/'&&request.isNavigationRequest()&&request.frame().parentFrame())return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Admin preview fixture</title>'});
  const root=url.pathname.startsWith('/admin/')?publicRoot:dist;
  try{let file=path.resolve(root,`.${decodeURIComponent(url.pathname)}`);assert.ok(file===root||file.startsWith(root+path.sep));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{return route.fulfill({status:404,body:''});}
 });
 return{context,errors,actions,hold:()=>{hold=true;},release:()=>{hold=false;pending.splice(0).forEach(resolve=>resolve());},recover:()=>{fail=false;},failOldArt:async()=>{await eventually(()=>oldArtStarted,'Old NRRS image request is genuinely pending');oldArtGate.resolve();await oldArtDone.promise;},close:async()=>{hold=false;pending.splice(0).forEach(resolve=>resolve());oldArtGate.resolve();await context.close();}};
}

async function raw(page,selector,width){const locator=typeof selector==='string'?page.locator(selector):selector;await locator.waitFor({state:'visible'});await locator.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const point=await locator.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{x,y,hit:!!hit&&(hit===el||el.contains(hit)),actual:hit?.outerHTML.slice(0,200),checkbox:el instanceof HTMLInputElement&&el.type==='checkbox'};});assert.equal(point.hit,true,`Native control is covered at ${width}px: ${JSON.stringify(point)}`);if(width<700)await page.touchscreen.tap(point.x,point.y);else{await locator.focus();await page.keyboard.press(point.checkbox?'Space':'Enter');}}
async function chooseBoard(page,width,id){
 const index=baseline.standings.findIndex(board=>board.id===id),entry=page.locator(`[data-content-list] [data-entry="${index}"]`);
 if(!await entry.isVisible())await raw(page,'.adm-entry-toggle',width);await raw(page,entry,width);await page.waitForFunction(id=>document.querySelector('[data-field-path=\'["id"]\']')?.value===id,id);if(width<900)await page.waitForFunction(()=>document.querySelector('.adm-entry-toggle')?.getAttribute('aria-expanded')==='false');
}
async function feature(page,width,id,{table='regular',enabled=true}={}){
 await chooseBoard(page,width,id);
 const checkbox=page.locator('[data-home-standings-feature]');if(await checkbox.isChecked()!==enabled){if(width<700)await raw(page,checkbox,width);else{await checkbox.focus();await page.keyboard.press('Space');}}assert.equal(await checkbox.isChecked(),enabled);
 if(await page.locator('[data-home-standings-table]').count()){await page.locator('[data-home-standings-table]').focus();await page.keyboard.press('Home');if(table==='chase')await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');assert.equal(await page.locator('[data-home-standings-table]').inputValue(),table);}
}
async function publish(page,width){const prior=structuredClone(stored().published.standings),previousBuilds=builds;await raw(page,'[data-content-form] button[type="submit"]',width);await page.waitForFunction(()=>!document.querySelector('[data-content-editor]').inert&&document.querySelector('[data-content-save-feedback]').textContent.startsWith('PRIVATE DRAFT'));assert.deepEqual(stored().published.standings,prior,'Private homepage selection does not alter public data');assert.equal(builds,previousBuilds);await raw(page,'[data-content-publish]',width);await page.waitForFunction(()=>!document.querySelector('[data-content-editor]').inert&&/^PUBLISHED · revision \d+ · public feed verified/.test(document.querySelector('[data-content-save-feedback]').textContent));assert.equal(builds,previousBuilds+1);assert.ok(stored().published.standings.filter(board=>board.featuredOnHome===true).length<=1);}

function expectation(id,table='regular'){
 const board=baseline.standings.find(board=>board.id===id),rows=table==='chase'?board.chaseRows:board.rows,focus=rows.find(row=>row.highlight===true)||rows[0],leader=rows[0],difference=focus?Number(focus.points)-Number(leader.points):null;
 return{id,table,focus,leader,rows,gap:difference===0?'LEADER':String(difference),title:table==='chase'?`${board.title} · ${board.chaseTitle}`:board.title,subtitle:table==='chase'?board.chaseSubtitle:board.subtitle,status:table==='chase'?'Chase points':board.status,cutoff:table==='chase'?0:id==='nrrs'?5:board.cutoffAfter||0};
}
function assertFrame(frame,expected){assert.equal(frame.id,expected.id);assert.equal(frame.cardId,expected.id);assert.equal(frame.towerId,expected.id);assert.equal(frame.table,expected.table);assert.equal(frame.towerTable,expected.table);assert.equal(frame.title,expected.title);if(expected.focus){assert.equal(frame.heading,`${expected.focus.driver} · ${expected.focus.position}`);assert.match(frame.context,new RegExp(`${Number(expected.focus.points).toLocaleString('en-US')} PTS`));assert.equal(frame.leader,expected.leader.driver);assert.ok(expected.gap===frame.gap||(expected.gap==='LEADER'&&frame.gap==='0'),'To-leader value is derived from points, not a cutoff-relative delta');assert.equal(frame.number,`Number ${expected.focus.number}`);assert.equal(frame.art,art(expected.focus.number));}else{assert.equal(frame.heading,'No published standings');assert.equal(frame.art,'');assert.equal(frame.number,'—');assert.equal(frame.gap,'—');assert.equal(frame.leader,'—');assert.doesNotMatch(frame.context,/NRRS|2,087|2190|32/);}}
async function assertHome(page,id,table='regular',{state='published',oldId=null}={}){
 await page.waitForFunction(state=>document.documentElement.dataset.contentState===state,state);await page.waitForFunction(({id,table})=>document.querySelector('[data-home-standings-root]')?.dataset.homeStandingsId===id&&document.querySelector('[data-home-standings-root]')?.dataset.homeStandingsTable===table,{id,table});const expected=expectation(id,table),root=page.locator('[data-home-standings-root]');
 const current=await root.evaluate(root=>{const q=selector=>root.querySelector(selector),image=q('[data-battle-number] img');return{id:root.dataset.homeStandingsId,table:root.dataset.homeStandingsTable,cardId:q('[data-battle-heading]').closest('[data-home-standings-id]').dataset.homeStandingsId,towerId:q('[data-timing-tower]').dataset.homeStandingsId,towerTable:q('[data-timing-tower]').dataset.homeStandingsTable,title:q('[data-tower-title]').textContent,heading:q('[data-battle-heading]').textContent,context:q('[data-battle-context]').textContent,gap:q('[data-battle-gap]').textContent,leader:q('[data-battle-leader]').textContent,number:image?.getAttribute('alt')||q('[data-battle-number]').textContent,art:image?.getAttribute('src')||''};});assertFrame(current,expected);
 assert.equal(await root.locator('[data-battle-status]').textContent(),expected.status);assert.equal(await root.locator('[data-tower-status]').textContent(),expected.status);
 if(expected.focus){assert.match(await root.locator('[data-battle-context]').textContent(),new RegExp(expected.subtitle.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));if(state==='published')await root.locator('[data-battle-number] img').evaluate(image=>image.decode());assert.equal(await root.locator('[data-tower-rows] > li:not(.aw-tower__gap)').filter({hasText:expected.focus.driver}).locator('.aw-tower__num').textContent(),expected.focus.number);if(id==='kmart'){assert.match(await root.locator('[data-standing-status]').allTextContents().then(texts=>texts.join(' ')),/CHASE LOCKED.*REGULAR-SEASON CHAMPION/);assert.doesNotMatch(await root.locator('[data-tower-team-label]').textContent(),/^Aetherwing car$/);}}
 else{assert.equal(await root.locator('[data-battle-number] img').count(),0);assert.equal(await root.locator('[data-home-standings-empty]').isVisible(),true);assert.equal(await root.locator('.aw-tower__num').count(),0);}
 for(const item of await root.locator('[data-tower-rows] > li:not(.aw-tower__gap)').all()){const name=await item.locator('strong').textContent(),number=await item.locator('.aw-tower__num').textContent(),row=expected.rows.find(row=>row.driver===name&&String(row.number)===number);assert.ok(row,'Every displayed driver belongs to the selected table');const pending=row.pointsPending===true||typeof row.points!=='number',delta=pending?'—':row===expected.leader?'LEADER':String(row.points-expected.leader.points);assert.equal(await item.locator('em').textContent(),delta,'Tower gaps also use the selected points leader, not stored cutoff deltas');}
 if(expected.cutoff){assert.equal(await root.locator('[data-tower-cut]').isVisible(),true);assert.match(await root.locator('[data-tower-cut]').textContent(),new RegExp(`Top ${expected.cutoff}`));const firstOutside=root.locator('[data-tower-rows] > li.is-cut');assert.equal(await firstOutside.count(),1);assert.equal(await firstOutside.locator('.aw-tower__pos').textContent(),String(expected.cutoff+1));}else assert.equal(await root.locator('[data-tower-cut]').isVisible(),false);
 const frames=await page.evaluate(()=>window.__homeFrames);assert.ok(frames.some(frame=>frame.state===state),'The native mutation observer recorded the resolved publication');for(const frame of frames){if(frame.state===state)assertFrame(frame,expected);else if(oldId&&frame.state==='cached')assertFrame(frame,expectation(oldId));}
 assert.equal(await root.locator('[data-battle-title]').textContent(),expected.title,'The prominent heading names the full selected league/table');assert.equal(await root.locator('[data-battle-title]').isVisible(),true);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Featured standings never create page overflow');for(const element of await root.locator('[data-battle-title],[data-battle-heading],[data-battle-context],[data-battle-gap],[data-battle-leader],[data-tower-title],[data-tower-rows]>li').all())assert.equal(await element.evaluate(el=>{const css=getComputedStyle(el);return el.scrollWidth<=el.clientWidth+1||(el.hasAttribute('data-tower-title')&&css.textOverflow==='ellipsis'&&css.overflowX==='hidden'&&el.clientWidth>0);}),true,`Standings text fits; only the existing compact tower title may ellipsize: ${await element.textContent()}`);
 for(const row of await root.locator('[data-tower-rows] > li:not(.aw-tower__gap)').all())assert.equal(await row.evaluate(row=>{const box=row.getBoundingClientRect();return[...row.children].every(child=>{const r=child.getBoundingClientRect();return r.left>=box.left-1&&r.right<=box.right+1&&r.top>=box.top-1&&r.bottom<=box.bottom+1;});}),true,'Every tower field/status remains inside its row');
}

try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of (process.env.HOME_STANDINGS_BROWSER_WIDTHS||'1440,390,320').split(',').map(Number)){
  initial={version:1,revision:10,published:structuredClone(baseline),drafts:{},history:[]};storage=new Map();etag=0;writes=0;builds=0;const test=await contextFor(width),page=await test.context.newPage(),home=await test.context.newPage();
  try{
   await page.goto(`${origin}/admin/`,{waitUntil:'domcontentloaded'});await raw(page,'[data-login]',width);const tab=width<900?page.locator('.adm-home [data-adm-home-open]').filter({hasText:/^Standings$/}):page.locator('[data-admin-tabs] [data-admin-dataset="standings"]');await raw(page,tab,width);await page.waitForFunction(()=>document.querySelector('[data-content-dataset]').value==='standings'&&!document.querySelector('[data-content-editor]').hidden);
   await feature(page,width,'kmart');await raw(page,'[data-content-form] button[type="submit"]',width);await page.waitForFunction(()=>document.querySelector('[data-content-save-feedback]').textContent.startsWith('PRIVATE DRAFT'));assert.equal(stored().published.standings.some(board=>board.featuredOnHome===true),false);await page.reload({waitUntil:'domcontentloaded'});await raw(page,'[data-login]',width);await page.waitForFunction(()=>document.querySelector('[data-content-dataset]').value==='standings'&&!document.querySelector('[data-content-editor]').hidden);await chooseBoard(page,width,'kmart');assert.equal(await page.locator('[data-home-standings-feature]').isChecked(),true,'Draft homepage choice survives a fresh authenticated editor load');await publish(page,width);
   test.hold();await home.goto(origin,{waitUntil:'domcontentloaded'});assert.equal(await home.locator('html').getAttribute('data-content-state'),'loading');assert.equal(await home.locator('[data-battle-heading]').evaluate(el=>getComputedStyle(el).visibility),'hidden','Bundled NRRS never flashes before the selected publication resolves');test.release();await assertHome(home,'kmart');
   for(const [id,table]of [['sunoco','regular'],['sunoco','chase'],['uarl','regular']]){await feature(page,width,id,{table});await publish(page,width);await home.reload({waitUntil:'domcontentloaded'});await assertHome(home,id,table);}
   await feature(page,width,'uarl',{enabled:false});await publish(page,width);assert.equal(stored().published.standings.some(board=>board.featuredOnHome===true),false);await home.reload({waitUntil:'domcontentloaded'});await assertHome(home,'nrrs');
   await feature(page,width,'kmart');await publish(page,width);await home.reload({waitUntil:'domcontentloaded'});await assertHome(home,'kmart');await home.locator('[data-home-standings-root]').screenshot({path:`/tmp/home-standings-kmart-${width}.png`});
   const published=structuredClone(stored().published.standings),writeCount=writes;
   const invalid=[published.map((board,index)=>({...board,featuredOnHome:index<2})),published.map((board,index)=>index===0?{...board,featuredOnHome:'true'}:board),published.map((board,index)=>index===0?{...board,homeTable:'final'}:board),published.map((board,index)=>index===0?{...board,homeTable:'chase'}:board)];
   for(const data of invalid){const response=await admin(new Request(`${origin}/.netlify/functions/site-admin`,{method:'POST',headers:{authorization:'Bearer fixture-jwt','content-type':'application/json'},body:JSON.stringify({action:'saveDraft',dataset:'standings',revision:stored().revision,data})}));assert.equal(response.status,400,'Invalid feature/table records are rejected by the real authenticated handler');assert.ok((await response.json()).error);assert.equal(writes,writeCount,'Rejected selections never persist');}
   assert.deepEqual(stored().published.results,baseline.results,'Featuring standings never rewrites race history');assert.ok(test.actions.includes('saveDraft')&&test.actions.includes('publish'));assert.deepEqual(test.errors,[]);
  }catch(error){await page.screenshot({path:`/tmp/home-standings-admin-failure-${width}.png`});await home.screenshot({path:`/tmp/home-standings-public-failure-${width}.png`});throw error;}finally{await test.close();}
  // The cache deliberately displays the old NRRS selection while the real
  // mocked publication is Kmart. Hold its image to test a late stale error.
  const recovery=await contextFor(width,{cache:{revision:10,savedAt:'2026-11-07T12:00:00Z',datasets:baseline},offline:true,holdOldArt:true}),cachedPage=await recovery.context.newPage();
  try{await cachedPage.goto(origin,{waitUntil:'domcontentloaded'});await assertHome(cachedPage,'nrrs','regular',{state:'cached'});assert.match(await cachedPage.locator('[data-home-standings-root] [data-live-note]').first().textContent(),/Cached snapshot/);const nonce=await cachedPage.evaluate(()=>window.__homeDocument);recovery.recover();await cachedPage.evaluate(()=>window.dispatchEvent(new Event('online')));await assertHome(cachedPage,'kmart','regular',{oldId:'nrrs'});await recovery.failOldArt();await cachedPage.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await assertHome(cachedPage,'kmart','regular',{oldId:'nrrs'});assert.equal(await cachedPage.evaluate(()=>window.__homeDocument),nonce,'Cache recovery and old-image failure never reload the document');assert.deepEqual(recovery.errors,[]);console.log(`PASS: ${width}px keyboard/raw-touch Admin draft/reload/publication, unique flags/schema errors, Kmart/Sunoco regular+Chase/empty D1/default NRRS, atomic cached recovery and late artwork protection.`);}finally{await recovery.close();}
 }
 const ssr=await contextFor(390,{noJS:true}),page=await ssr.context.newPage();try{await page.goto(origin,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('[data-home-standings-root]').getAttribute('data-home-standings-id'),'nrrs');assert.equal(await page.locator('[data-home-standings-root]').getAttribute('data-home-standings-table'),'regular');assert.match(await page.locator('[data-tower-cut]').textContent(),/Top 5/);assert.match(await page.locator('[data-battle-heading]').textContent(),/Hailey.*P6/);console.log('PASS: built default homepage SSR retains NRRS and the P5 cutoff without JavaScript.');}finally{await ssr.close();}
}finally{await browser?.close();globalThis.fetch=nativeFetch;if(priorBlobs===undefined)delete globalThis.netlifyBlobsContext;else globalThis.netlifyBlobsContext=priorBlobs;if(priorHook===undefined)delete process.env.AETHERWING_BUILD_HOOK;else process.env.AETHERWING_BUILD_HOOK=priorHook;}

async function eventually(check,message){const deadline=Date.now()+10000;while(!check()){assert.ok(Date.now()<deadline,message);await new Promise(resolve=>setTimeout(resolve,20));}}

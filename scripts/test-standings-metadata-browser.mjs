import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs');
const moduleRoot=process.env.ADMIN_BROWSER_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(moduleRoot,'playwright-core/index.mjs')));
const publicRoot=path.resolve('public'),buildRoot=path.resolve('dist'),origin='https://admin.standings.fixture.test';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
assert.ok(fs.existsSync(path.join(buildRoot,'championships/index.html')),'Build the production site before this browser check');
const seed=content.seeds(),baseline=structuredClone(seed.standings);
for(const board of baseline){board.chaseActive=false;for(const row of [...(board.rows||[]),...(board.chaseRows||[])])for(const key of ['manufacturer','chaseLocked','regularSeasonChampion'])delete row[key];}
const kmart=baseline.find(board=>board.id==='kmart');
kmart.rows=[{position:'P1',number:'15',driver:'Hailey',points:600,delta:'LEADER',positionChange:0,highlight:true},{position:'P2',number:'24',driver:'Will',points:500,delta:'-100',positionChange:0},{position:'P3',number:'55',driver:'Fixture Driver',points:400,delta:'-200',positionChange:0}];
kmart.ptEntry={number:'29',title:'Fixture shared entry',status:'NOT CHASE ELIGIBLE',drivers:[{driver:'Hailey',points:40},{driver:'Will',points:30}]};
baseline.find(board=>board.id==='uarl').rows=[{position:'P1',number:'28',driver:'Hailey',points:50,delta:'LEADER',positionChange:0}];
const sunoco=baseline.find(board=>board.id==='sunoco');
sunoco.chaseRows=[{position:'P1',number:'42',driver:'Will',points:120,delta:'LEADER',positionChange:0},{position:'P2',number:'46',driver:'Clutch',points:100,delta:'-20',positionChange:0}];
const willRegular=sunoco.rows.findIndex(row=>row.driver==='Will'),willChase=0,clutchRegular=sunoco.rows.findIndex(row=>row.driver==='Clutch'),clutchChase=1;
assert.ok([willRegular,willChase,clutchRegular,clutchChase].every(index=>index>=0));
const points=board=>['rows','chaseRows'].flatMap(key=>(board[key]||[]).map(row=>[key,row.driver,row.number,row.points,row.position,row.delta]));
const nativeFetch=globalThis.fetch,priorBlobs=globalThis.netlifyBlobsContext,priorHook=process.env.AETHERWING_BUILD_HOOK;
globalThis.netlifyBlobsContext=Buffer.from(JSON.stringify({siteID:'standings-browser-fixture',token:'fixture-token',edgeURL:'https://blobs.fixture',uncachedEdgeURL:'https://blobs.fixture'})).toString('base64');
process.env.AETHERWING_BUILD_HOOK='https://api.netlify.com/build_hooks/standings-browser-fixture';
let initial,storage=new Map(),etag=0,buildCount=0,writeCount=0;
const stored=()=>[...storage.values()][0]?.value||initial;
globalThis.fetch=async(input,options={})=>{
 const url=new URL(input instanceof Request?input.url:input),headers=new Headers(options.headers);
 if(url.hostname==='aetherwing.net'&&url.pathname==='/.netlify/identity/user'){assert.equal(headers.get('authorization'),'Bearer fixture-jwt');return Response.json({id:'fixture-admin',email:'admin@example.test',app_metadata:{roles:['admin']}});}
 if(url.hostname==='api.netlify.com'&&url.pathname==='/build_hooks/standings-browser-fixture'){assert.equal(options.method,'POST');buildCount++;return Response.json({ok:true});}
 assert.equal(url.hostname,'blobs.fixture','Tests must never contact live storage or rebuild hooks');
 const prior=storage.get(url.pathname)||{value:initial,etag:'fixture-0'};
 if(options.method?.toUpperCase()==='PUT'){
  assert.equal(headers.get('if-match'),prior.etag,'Exercise the actual conditional storage write');
  const next={value:JSON.parse(options.body),etag:`fixture-${++etag}`};storage.set(url.pathname,next);writeCount++;
  return new Response('',{status:200,headers:{etag:next.etag}});
 }
 return Response.json(prior.value,{headers:{etag:prior.etag}});
};
const admin=(await import('../netlify/functions/site-admin.mjs')).default,publicData=(await import('../netlify/functions/site-data.mjs')).default;
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of (process.env.STANDINGS_BROWSER_WIDTHS||'1440,390,320').split(',').map(Number)){
  initial={version:1,revision:10,published:{...structuredClone(seed),standings:structuredClone(baseline)},drafts:{},history:[]};storage=new Map();etag=0;buildCount=0;writeCount=0;
  const context=await browser.newContext({viewport:{width,height:844},hasTouch:width<700,reducedMotion:'reduce',acceptDownloads:true}),page=await context.newPage();
  page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);
  const errors=[],actions=[];page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
  await context.addInitScript(()=>{
   let user=null;const callbacks={};
   window.netlifyIdentity={currentUser:()=>user,on:(name,fn)=>{(callbacks[name]??=[]).push(fn);if(name==='init')queueMicrotask(()=>fn(user));},close(){},logout(){},open(){user={email:'admin@example.test',app_metadata:{roles:['admin']},jwt:async()=>'fixture-jwt'};(callbacks.login||[]).forEach(fn=>fn(user));}};
   window.__standingCanvas={text:[],images:[]};
   const pointerSnapshot=(type,target)=>{const button=document.querySelector('[data-sunoco-chase-import-preview-button]'),r=button?.getBoundingClientRect();window.__standingPointers.push({type,time:Math.round(performance.now()),target:target?.outerHTML.slice(0,180),active:document.activeElement?.tagName,typing:document.documentElement.classList.contains('adm-typing'),preview:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null});if(window.__standingPointers.length>24)window.__standingPointers.shift();};
   window.__standingPointers=[];for(const type of ['pointerdown','pointerup','mousedown','mouseup','click'])document.addEventListener(type,event=>pointerSnapshot(type,event.target),true);
   document.addEventListener('focusout',event=>{if(event.target.matches?.('[data-sunoco-chase-import-text],[data-standings-import-text]')){pointerSnapshot('textarea-focusout',event.target);setTimeout(()=>pointerSnapshot('textarea-focusout-150ms',event.target),150);}},true);
   const fillText=CanvasRenderingContext2D.prototype.fillText,drawImage=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.fillText=function(value,...args){if(this.canvas.width>=1000)window.__standingCanvas.text.push(String(value));return fillText.call(this,value,...args);};
   CanvasRenderingContext2D.prototype.drawImage=function(image,...args){if(this.canvas.width>=1000)window.__standingCanvas.images.push({src:image.currentSrc||image.src||'',args});return drawImage.call(this,image,...args);};
   // Verify the supported browser-download path without opening an OS picker.
   window.showSaveFilePicker=undefined;
  });
  await context.route('**/*',async route=>{
   const request=route.request(),url=new URL(request.url());
   if(url.origin!==origin){if(request.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Fixture preview</title>'});return route.abort();}
   if(url.pathname==='/.netlify/functions/site-admin'||url.pathname==='/api/site-content'){
    const options={method:request.method(),headers:request.headers(),...(!['GET','HEAD'].includes(request.method())?{body:request.postData()}: {})};
    if(url.pathname==='/.netlify/functions/site-admin')actions.push(request.postData()?JSON.parse(request.postData()).action:'readback');
    const response=await(url.pathname==='/api/site-content'?publicData:admin)(new Request(url,options));
    return route.fulfill({status:response.status,headers:Object.fromEntries(response.headers),body:await response.text()});
   }
   if(url.pathname==='/.netlify/functions/paint-admin'){assert.equal(request.method(),'GET','This test cannot write paints');return route.fulfill({contentType:'application/json',body:JSON.stringify({registry:{paints:[],drafts:[],feature:null,revisions:[]}})});}
   const assetRoot=url.pathname.startsWith('/admin/')?publicRoot:buildRoot;
   try{let file=path.resolve(assetRoot,`.${decodeURIComponent(url.pathname)}`);assert.ok(file===assetRoot||file.startsWith(assetRoot+path.sep));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:types[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{return route.fulfill({status:404,body:''});}
  });
  const field=(group,index,key)=>page.locator(`[data-field-path='${JSON.stringify([group,index,key])}']`);
  const ptField=(index,key)=>page.locator(`[data-field-path='${JSON.stringify(['ptEntry','drivers',index,key])}']`);
  const press=async selector=>{const control=page.locator(selector);if(width>=900)return control.click();await control.evaluate(el=>el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'}));await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const point=await control.evaluate(el=>{const r=el.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,hit=document.elementFromPoint(x,y);return{x,y,hit:!!hit&&(hit===el||el.contains(hit)),hitText:hit?.outerHTML.slice(0,200),active:document.activeElement?.tagName,typing:document.documentElement.classList.contains('adm-typing')};});assert.equal(point.hit,true,`Native finger target must be unobstructed: ${JSON.stringify(point)}`);await page.touchscreen.tap(point.x,point.y);};
  const selectBoard=async id=>{const index=baseline.findIndex(board=>board.id===id),entry=page.locator(`[data-content-list] [data-entry="${index}"]`);if(!await entry.isVisible())await page.locator('.adm-entry-toggle').click();await entry.click();await page.waitForFunction(value=>document.querySelector('[data-field-path=\'["id"]\']')?.value===value,id);if(width<900)await page.waitForFunction(()=>document.querySelector('.adm-entry-toggle')?.getAttribute('aria-expanded')==='false');};
  const allowlist=async(id,values)=>{await selectBoard(id);const select=field('rows',0,'manufacturer');assert.equal(await select.getAttribute('data-standing-manufacturer')!==null,true,'Manufacturer uses the dedicated row control');assert.deepEqual(await select.locator('option').evaluateAll(nodes=>nodes.map(node=>[node.value,node.textContent.trim()])),[['','Auto / not specified'],...values.map(value=>[value,value==='Chevrolet'?'Chevy':value])]);};
  const flag=async(group,index,key,checked)=>{const input=field(group,index,key);assert.equal(await input.getAttribute(key==='chaseLocked'?'data-standing-chase-locked':'data-standing-season-champion')!==null,true);await input.setChecked(checked);};
  const csv=async text=>{await page.locator('[data-standings-import-text]').fill(text);await press('[data-standings-import-preview-button]');await page.locator('[data-standings-import-preview] .standings-import-summary').waitFor();await press('[data-standings-import-apply]');};
  const csvText=(lastName='Fixture Driver',includeNew=false)=>`Position,Number,Driver,Points,Gap\n1,15,Hailey,600,LEADER\n2,24,Will,500,-100\n3,55,${lastName},400,-200${includeNew?'\n4,93,New Driver,300,-300':''}`;
  try{
   await page.goto(`${origin}/admin/`,{waitUntil:'domcontentloaded'});await page.locator('[data-login]').click();
   const tab=width<900?page.locator('.adm-home [data-adm-home-open]').filter({hasText:/^Standings$/}):page.locator('[data-admin-tabs] [data-admin-dataset="standings"]');await tab.click();
   await page.waitForFunction(()=>document.querySelector('[data-content-dataset]').value==='standings'&&!document.querySelector('[data-content-editor]').hidden);
   await allowlist('nrrs',['Ford','Chevrolet','Toyota','Cadillac']);
   const nrrsHailey=baseline.find(board=>board.id==='nrrs').rows.findIndex(row=>row.driver==='Hailey');assert.ok(nrrsHailey>=0);
   await field('rows',nrrsHailey,'manufacturer').selectOption('Cadillac');await flag('rows',nrrsHailey,'chaseLocked',true);await flag('rows',nrrsHailey,'regularSeasonChampion',true);
   await allowlist('uarl',['Ford','Chevrolet','Toyota','Cadillac']);await allowlist('sunoco',['Ford','Chevrolet','Toyota','RAM']);
   // Editing either representation must update the same driver, not their points.
   await field('chaseRows',willChase,'manufacturer').selectOption('Ford');await flag('chaseRows',willChase,'chaseLocked',true);await flag('chaseRows',willChase,'regularSeasonChampion',true);
   assert.equal(await field('rows',willRegular,'manufacturer').inputValue(),'Ford');assert.equal(await field('rows',willRegular,'chaseLocked').isChecked(),true);assert.equal(await field('rows',willRegular,'regularSeasonChampion').isChecked(),true);
   await field('rows',willRegular,'manufacturer').selectOption('');assert.equal(await field('chaseRows',willChase,'manufacturer').inputValue(),'','An explicit Auto choice clears the counterpart’s manual manufacturer');await field('chaseRows',willChase,'manufacturer').selectOption('Ford');
   await flag('rows',willRegular,'chaseLocked',false);assert.equal(await field('chaseRows',willChase,'chaseLocked').isChecked(),false);await flag('chaseRows',willChase,'chaseLocked',true);
   await flag('rows',clutchRegular,'regularSeasonChampion',true);assert.equal(await field('chaseRows',clutchChase,'regularSeasonChampion').isChecked(),true);assert.equal(await field('rows',willRegular,'regularSeasonChampion').isChecked(),false);assert.equal(await field('chaseRows',willChase,'regularSeasonChampion').isChecked(),false);
   await page.locator('[data-sunoco-chase-import-text]').fill('Position,Number,Driver,Points,Gap\n1,42,Will,120,LEADER\n2,46,Clutch,100,-20');await press('[data-sunoco-chase-import-preview-button]');await page.locator('[data-sunoco-chase-import-preview] .standings-import-summary').waitFor();await press('[data-sunoco-chase-import-apply]');
   assert.equal(await field('chaseRows',willChase,'manufacturer').inputValue(),'Ford');assert.equal(await field('chaseRows',willChase,'chaseLocked').isChecked(),true);assert.equal(await field('chaseRows',clutchChase,'regularSeasonChampion').isChecked(),true,'Chase CSV preserves manually selected metadata');
   await allowlist('kmart',['Ford','Chevrolet','Toyota','Dodge']);
   await ptField(1,'manufacturer').selectOption('Chevrolet');assert.equal(await field('rows',1,'manufacturer').inputValue(),'','A separate PT manufacturer does not change a same-name regular entry');
   assert.equal(await field('rows',0,'chaseLocked').isChecked(),false,'No label is inferred from position, points or eligibility');assert.equal(await field('rows',0,'regularSeasonChampion').isChecked(),false);
   await field('rows',0,'manufacturer').selectOption('Ford');await flag('rows',0,'chaseLocked',true);await flag('rows',0,'regularSeasonChampion',true);
   assert.equal(await ptField(0,'manufacturer').inputValue(),'','A different-car PT entry retains Auto instead of inheriting the regular make');assert.equal(await ptField(1,'manufacturer').inputValue(),'Chevrolet');
   await field('rows',2,'manufacturer').selectOption('Chevrolet');await flag('rows',2,'chaseLocked',true);
   await csv(csvText('Fixture Driver',true));
   assert.equal(await field('rows',0,'manufacturer').inputValue(),'Ford');assert.equal(await field('rows',0,'chaseLocked').isChecked(),true);assert.equal(await field('rows',0,'regularSeasonChampion').isChecked(),true);assert.equal(await field('rows',3,'manufacturer').inputValue(),'');assert.equal(await field('rows',3,'chaseLocked').isChecked(),false,'New imported drivers get editable blank metadata');
   await field('rows',3,'manufacturer').selectOption('Toyota');await flag('rows',3,'chaseLocked',true);
   await csv(csvText('Fixture Driver',true));assert.equal(await field('rows',3,'manufacturer').inputValue(),'Toyota');assert.equal(await field('rows',3,'chaseLocked').isChecked(),true,'A later CSV preserves a new driver’s manual edits');
   await flag('rows',2,'regularSeasonChampion',true);await csv(csvText('Different Driver',true));
   assert.equal(await field('rows',2,'driver').inputValue(),'Different Driver');assert.equal(await field('rows',2,'manufacturer').inputValue(),'');assert.equal(await field('rows',2,'chaseLocked').isChecked(),false);assert.equal(await field('rows',2,'regularSeasonChampion').isChecked(),false,'Reused car numbers do not transfer another driver’s award');
   await flag('rows',0,'regularSeasonChampion',true);
   await page.locator('[data-content-form] button[type="submit"]').click();await page.waitForFunction(()=>!document.querySelector('[data-content-editor]').inert&&document.querySelector('[data-content-save-feedback]').textContent.startsWith('PRIVATE DRAFT'));
   assert.equal(buildCount,0);assert.deepEqual(stored().published.standings,baseline,'A private draft cannot alter published standings');
   const draft=structuredClone(stored().drafts.standings);assert.equal(draft.find(board=>board.id==='kmart').rows[0].manufacturer,'Ford');assert.deepEqual(points(draft.find(board=>board.id==='sunoco')),points(sunoco),'Metadata edits never guess or change Sunoco points or positions');
   await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-login]').click();await page.waitForFunction(()=>document.querySelector('[data-content-dataset]').value==='standings'&&!document.querySelector('[data-content-editor]').hidden);await selectBoard('kmart');
   assert.equal(await field('rows',0,'manufacturer').inputValue(),'Ford');assert.equal(await field('rows',0,'chaseLocked').isChecked(),true);assert.equal(await field('rows',0,'regularSeasonChampion').isChecked(),true,'Draft metadata survives a fresh authenticated page load');
   await page.locator('[data-standings-export]').click();await page.locator('[data-standings-export-save]').waitFor();
   const canvas=await page.evaluate(()=>window.__standingCanvas);assert.ok(canvas.text.some(text=>text.includes('CHASE LOCKED')));assert.ok(canvas.text.some(text=>text.includes('REGULAR-SEASON CHAMPION')),'Regular-season PNG includes manually recorded awards');assert.ok(canvas.images.some(image=>image.src.endsWith('/images/manufacturers/ford.png')),'PNG draws the explicit manufacturer instead of the old Dodge number map');assert.deepEqual(canvas.images.filter(image=>image.src.includes('/images/manufacturers/')).slice(-2).map(image=>new URL(image.src).pathname),['/images/manufacturers/dodge-kmart.png','/images/manufacturers/chevrolet.png'],'PT PNG cards independently use their car’s automatic make or explicit manufacturer');
   const downloadPromise=page.waitForEvent('download');await page.locator('[data-standings-export-save]').click();const download=await downloadPromise;assert.match(download.suggestedFilename(),/standings\.png$/);const pngPath=`/tmp/standings-metadata-${width}.png`;await download.saveAs(pngPath);assert.equal(fs.readFileSync(pngPath).subarray(0,8).toString('hex'),'89504e470d0a1a0a','The real Canvas path produces a downloadable PNG');
   await page.locator('[data-content-publish]').click();await page.waitForFunction(()=>!document.querySelector('[data-content-editor]').inert&&/^PUBLISHED · revision \d+ · public feed verified/.test(document.querySelector('[data-content-save-feedback]').textContent));assert.equal(buildCount,1);assert.equal(stored().published.standings.find(board=>board.id==='kmart').rows[0].manufacturer,'Ford');
   const published=(await(await publicData(new Request(`${origin}/api/site-content`))).json()).datasets;assert.equal(published.standings.find(board=>board.id==='kmart').rows[0].regularSeasonChampion,true);assert.deepEqual(stored().published.results,seed.results,'Historical results are never rewritten');
   const publicPage=await context.newPage();publicPage.on('pageerror',error=>errors.push(error.message));await publicPage.goto(`${origin}/championships/`,{waitUntil:'domcontentloaded'});await publicPage.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
   const publicBoard=publicPage.locator('[data-board="kmart"]'),hailey=publicBoard.locator(':scope > .standings-board__rows > .standing-row').filter({hasText:/Hailey/}).first();assert.equal(await hailey.locator('.standing-row__make img').getAttribute('alt'),'Ford');assert.deepEqual(await hailey.locator('[data-standing-status]').allTextContents(),['CHASE LOCKED','REGULAR-SEASON CHAMPION']);assert.equal(await publicBoard.locator('[data-standing-status]').filter({hasText:'REGULAR-SEASON CHAMPION'}).count(),1);
   assert.equal(await publicBoard.locator('.standings-pt__driver').filter({hasText:/Hailey/}).locator('img').getAttribute('alt'),'Dodge','A PT Auto choice resolves its own #29 instead of the regular #15 Ford');assert.equal(await publicBoard.locator('.standings-pt__driver').filter({hasText:/Will/}).locator('img').getAttribute('alt'),'Chevrolet');
   await publicPage.screenshot({path:`/tmp/standings-metadata-public-${width}.png`,fullPage:true});
   await publicPage.goto(origin,{waitUntil:'domcontentloaded'});await publicPage.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
   const towerRow=publicPage.locator('[data-tower-rows] > li').filter({hasText:/Hailey/});assert.match(await towerRow.locator('[data-standing-status]').textContent(),/CHASE LOCKED.*REGULAR-SEASON CHAMPION/);
   const overlap=await towerRow.evaluate(row=>{const r=row.getBoundingClientRect();return[...row.children].every(child=>{const c=child.getBoundingClientRect();return c.left>=r.left-1&&c.right<=r.right+1&&c.bottom<=r.bottom+1;});});assert.equal(overlap,true,'Home timing-tower metadata stays within its row on mobile');await publicPage.close();
   assert.deepEqual(errors,[],'No browser runtime errors');assert.ok(actions.includes('saveDraft')&&actions.includes('publish')&&actions.includes('readback'));assert.ok(writeCount>=2);
   console.log(`PASS: ${width}px native Admin manufacturer choices, manual awards, regular/Chase sync, CSV identity safety, draft/reload/publication/readback, public labels and real PNG export.`);
  }catch(error){console.error(JSON.stringify(await page.evaluate(()=>({snapshot:document.querySelector('[data-field-path=\'["id"]\']')?.value,status:document.querySelector('[data-content-status]')?.textContent,chaseText:document.querySelector('[data-sunoco-chase-import-text]')?.value,chasePreview:document.querySelector('[data-sunoco-chase-import-preview]')?.textContent,regularPreview:document.querySelector('[data-standings-import-preview]')?.textContent,active:document.activeElement?.outerHTML.slice(0,300),pointers:window.__standingPointers})),null,2));await page.screenshot({path:`/tmp/standings-metadata-failure-${width}.png`});throw error;}
  finally{await context.close();}
 }
}finally{
 await browser?.close();globalThis.fetch=nativeFetch;if(priorBlobs===undefined)delete globalThis.netlifyBlobsContext;else globalThis.netlifyBlobsContext=priorBlobs;if(priorHook===undefined)delete process.env.AETHERWING_BUILD_HOOK;else process.env.AETHERWING_BUILD_HOOK=priorHook;
}

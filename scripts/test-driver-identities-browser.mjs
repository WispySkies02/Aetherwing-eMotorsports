import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),seed=require('../netlify/lib/_content.cjs').seeds();
const modules=process.env.PAINT_TEST_MODULES||'/tmp/aetherwing-browser-tests/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
const old=structuredClone(seed);
for(const row of old.drivers){delete row.currentRosterRevision;if(row.competitionId==='kmart'&&['clutch','eazy','matty'].includes(row.profile))Object.assign(row,{number:'29',numberImage:'https://example.test/shared29.png',numberImageBackup:''});if(row.id==='matty-kmart')Object.assign(row,{status:'Shared Part-Time Entry',car:'SCR #29 PT'});}
for(const row of old['roster-profiles']){delete row.currentRosterRevision;if(row.slug==='matty')Object.assign(row,{handle:'@mymainisgone98',numbers:'29',feature:'Part-Time Entry',bio:'StarClutch Racing alliance driver sharing the part-time Kmart #29 entry.'});if(row.slug==='eazy')row.handle='@Eazyonthafarilla';}
const updated=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(structuredClone(old));
const root=path.resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,`.${new URL(req.url,'http://localhost').pathname}`);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,768,430,390,320]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  let fail=false,artRequests=0;
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/api/site-content'){if(fail)return route.abort();return route.fulfill({contentType:'application/json',body:JSON.stringify({revision:109,datasets:updated})});}if(u.pathname==='/api/driver-art'){artRequests++;return route.fulfill({contentType:'application/json',body:JSON.stringify({revision:108,drivers:old.drivers,profiles:[]})});}if(u.origin!==origin)return route.abort();return route.continue();});
  const card=slug=>page.locator('.aw-lineup__poster').filter({has:page.locator(`a[href="/drivers/${slug}/"]`)});
  const checkMatty=async()=>{const c=card('matty');assert.equal(await c.count(),1);assert.equal(await c.getAttribute('data-number'),'3');assert.match(await c.locator('.aw-lineup__plate > small').textContent(),/Full-Time/);assert.equal(await c.locator('.aw-lineup__plate > p').textContent(),'@matty_campbell');assert.match(await c.locator('.aw-lineup__number').textContent(),/#3/);assert.equal(await c.locator('.aw-lineup__number img').count(),0,'Stale #29 art must not appear on Matty #3');};
  await page.goto(`${origin}/drivers/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
  await checkMatty();assert.equal(await page.locator('.aw-lineup__poster').count(),6,'Current assigned-driver directory omits archived D1-only drivers');assert.equal(await card('eazy').locator('.aw-lineup__plate > p').textContent(),'@deadmansrisin27_');
  await page.locator('[data-program="kmart"]').click();await checkMatty();
  assert.equal(await card('clutch').getAttribute('data-number'),'29');assert.equal(await card('eazy').getAttribute('data-number'),'29');
  await page.locator('[data-program="sunoco"]').click();assert.equal(await card('eazy').getAttribute('data-number'),'27');assert.equal(await card('eazy').locator('.aw-lineup__plate > p').textContent(),'@deadmansrisin27_');
  for(const filter of ['uarl-d1','all','kmart','uarl-d1']){await page.locator(`[data-program="${filter}"]`).click();if(filter==='uarl-d1'){assert.equal(await page.locator('[data-lineup-program] strong').textContent(),'1 ASSIGNED · 2 OPEN · 0 FLEXIBLE ENTRIES');assert.deepEqual(await page.locator('.aw-lineup__poster').evaluateAll(cards=>cards.map(c=>c.dataset.number)),['33','42','43']);}}
  await page.locator('[data-lineup]').screenshot({path:`/tmp/current-drivers-d1-${width}.png`});
  await page.locator('[data-program="kmart"]').click();await card('matty').screenshot({path:`/tmp/current-drivers-matty-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok(artRequests>0,'Stale artwork endpoint was exercised');
  for(const [slug,handle,number] of [['matty','@matty_campbell','3'],['eazy','@deadmansrisin27_','29']]){
   await page.goto(`${origin}/drivers/${slug}/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');assert.match(await page.locator('[data-profile-identity]').textContent(),new RegExp(handle));
   if(slug==='matty'){assert.match(await page.locator('[data-profile-number]').textContent(),/#3/);assert.match(await page.locator('[data-profile-bio]').textContent(),/full-time Kmart #3/);assert.match(await page.locator('[data-profile-assignments]').textContent(),/#3Full-Time/);}
   else{assert.match(await page.locator('[data-profile-assignments]').textContent(),/#29/);assert.match(await page.locator('[data-profile-assignments]').textContent(),/#27/);}
  }
  await page.goto(`${origin}/programs/kmart/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
  const team=page.locator('[data-program-lineup]');assert.match(await team.textContent(),/Matty.*#3.*Full-Time/s);
  // Offline cached data is labeled, with current identities corrected before rendering.
  await page.evaluate(datasets=>localStorage.setItem('aetherwing-publication-v1',JSON.stringify({datasets,revision:108,savedAt:new Date().toISOString()})),old);fail=true;
  await page.goto(`${origin}/drivers/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.contentState==='cached');await checkMatty();assert.equal(await card('eazy').locator('.aw-lineup__plate > p').textContent(),'@deadmansrisin27_');
  assert.deepEqual(errors,[]);console.log(`PASS ${width}px: current Matty/Eazy identities, #3 fallback, stale art rejection, preserved #29/#27, D1 filters, profiles/program and cached hydration.`);await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),page=await context.newPage();
 await page.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
 await page.goto(`${origin}/drivers/matty/`,{waitUntil:'domcontentloaded'});
 assert.match(await page.locator('[data-profile-identity]').textContent(),/@matty_campbell/);assert.match(await page.locator('[data-profile-number]').textContent(),/#3/);assert.match(await page.locator('[data-profile-assignments]').textContent(),/#3Full-Time/);
 await page.goto(`${origin}/drivers/eazy/`,{waitUntil:'domcontentloaded'});assert.match(await page.locator('[data-profile-identity]').textContent(),/@deadmansrisin27_/);
 await context.close();console.log('PASS: initial generated profile HTML has the confirmed identities and Matty #3/full-time before JavaScript.');
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}

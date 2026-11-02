import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),seed=require('../netlify/lib/_content.cjs').seeds();
const {mergeCanonical}=require('../netlify/lib/_site-data.cjs')._test;
const fixture={id:'fixture-racing',name:'Fixture Racing',shortName:'Fixture Racing'};
const renamed={...fixture,name:'Renamed Fixture Racing',shortName:'Renamed Fixture'};
const base=structuredClone(seed);base.alliances=[...seed.alliances,fixture];
base.drivers.find(row=>row.id==='matty-kmart').allianceId=fixture.id;
base['roster-profiles'].find(row=>row.slug==='matty').allianceId=fixture.id;
Object.assign(base.competitions.find(row=>row.id==='kmart'),{type:'alliance',allianceId:fixture.id});
const initial=mergeCanonical(structuredClone(base));
assert.equal(initial.competitions.find(row=>row.id==='kmart').label,'Fixture Racing Alliance');
const historical=Object.fromEntries(['results','wins','standings','milestones','news','driver-portfolios'].map(key=>[key,JSON.stringify(initial[key])]));
const root=path.resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{let file=path.resolve(root,`.${new URL(req.url,'http://localhost').pathname}`);if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');res.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(res);}catch{res.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
const modules=process.env.PAINT_TEST_MODULES||'/tmp/aetherwing-browser-tests/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,390,320]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  let datasets=structuredClone(initial);page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>{const u=new URL(route.request().url());if(u.pathname==='/api/site-content')return route.fulfill({contentType:'application/json',body:JSON.stringify({revision:200,datasets})});if(u.pathname==='/api/driver-art')return route.fulfill({contentType:'application/json',body:JSON.stringify({revision:200,drivers:datasets.drivers,profiles:datasets['roster-profiles']})});if(u.origin!==origin)return route.abort();return route.continue();});
  const dispatch=detail=>page.evaluate(update=>window.dispatchEvent(new CustomEvent('aetherwing:content',{detail:update})),detail);
  const open=async route=>{await page.goto(`${origin}${route}`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');};
  const matty=()=>page.locator('.aw-lineup__poster').filter({has:page.locator('a[href="/drivers/matty/"]')});
  let missionBaselineWidth;
  const checkFit=async label=>{const overflow=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].map(el=>({tag:el.tagName,className:el.className,text:el.textContent?.trim().slice(0,90),rect:el.getBoundingClientRect().toJSON()})).filter(el=>el.rect.right>innerWidth+1&&el.rect.width>0).slice(0,12)}));if(overflow.scrollWidth>overflow.width)await page.screenshot({path:`/tmp/alliance-overflow-${label.replaceAll(' ','-')}-${width}.png`,animations:'disabled'});if(width===320&&label==='mission'){assert.equal(overflow.scrollWidth<=missionBaselineWidth,true,`${width}px Mission: named alliances must not increase canonical baseline overflow (${missionBaselineWidth}px): ${JSON.stringify(overflow)}`);if(missionBaselineWidth>width)console.log(`KNOWN BASELINE UI ISSUE: Mission stat labels make the canonical page ${missionBaselineWidth}px wide at ${width}px; alliance fixture stays ${overflow.scrollWidth}px wide.`);}else assert.equal(overflow.scrollWidth<=overflow.width,true,`${width}px ${label}: no horizontal page overflow: ${JSON.stringify(overflow)}`);};
  const renameOnly=()=>dispatch({alliances:datasets.alliances.map(team=>team.id===fixture.id?renamed:team)});
  const detailLabel=async()=>{const kicker=page.locator('[data-program-page] .ux-pagehead .ux-kicker');assert.equal(await kicker.locator('b').textContent(),'AEM','Program header branding is preserved');return kicker.evaluate(el=>[...el.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim());};

  // Mission's existing three-column stat labels overflow at 320px on main.
  // Preserve that baseline here; this focused alliance test must not hide a
  // regression or expand into the separate design work reserved for the user.
  if(width===320){datasets=mergeCanonical(structuredClone(seed));await open('/mission-values/');missionBaselineWidth=await page.evaluate(()=>document.documentElement.scrollWidth);datasets=structuredClone(initial);}

  await open('/drivers/');assert.equal(await matty().getAttribute('data-team-label'),'FIXTURE RACING');assert.equal(await page.locator('.aw-lineup__poster').count(),8);
  assert.equal(await matty().getAttribute('data-number'),'3');assert.equal(await matty().locator('.aw-lineup__plate > p').textContent(),'@matty_campbell');
  await renameOnly();assert.equal(await matty().getAttribute('data-team-label'),'RENAMED FIXTURE');assert.match(await page.locator('[data-lineup-intro]').textContent(),/Renamed Fixture Racing/);
  await page.locator('[data-program="kmart"]').click();assert.equal(await matty().getAttribute('data-team-label'),'RENAMED FIXTURE');await checkFit('directory');await page.screenshot({path:`/tmp/alliance-matty-${width}.png`,animations:'disabled'});
  await page.locator('[data-program="uarl-d1"]').click();assert.equal(await page.locator('[data-lineup-program] strong').textContent(),'3 ASSIGNED · 1 OPEN · 1 FLEXIBLE ENTRY');

  await open('/drivers/matty/');assert.equal(await page.locator('[data-profile-affiliation]').textContent(),'FIXTURE RACING DRIVER');assert.match(await page.locator('[data-profile-assignments]').textContent(),/FIXTURE RACING/);
  const bio=await page.locator('[data-profile-bio]').textContent();await renameOnly();assert.equal(await page.locator('[data-profile-affiliation]').textContent(),'RENAMED FIXTURE RACING DRIVER');assert.match(await page.locator('[data-profile-assignments]').textContent(),/RENAMED FIXTURE RACING/);assert.equal(await page.locator('[data-profile-bio]').textContent(),bio,'A rename does not rewrite freeform biography');await checkFit('profile');

  const programCard=()=>page.locator('[data-program-grid] .program-card').filter({has:page.locator('a[href="/programs/kmart/"]')});
  await open('/programs/');assert.equal(await programCard().locator('.eyebrow').textContent(),'Fixture Racing Alliance');await renameOnly();assert.equal(await programCard().locator('.eyebrow').textContent(),'Renamed Fixture Racing Alliance');await checkFit('program directory');
  await open('/programs/kmart/');assert.equal(await detailLabel(),'Fixture Racing Alliance');await renameOnly();assert.equal(await detailLabel(),'Renamed Fixture Racing Alliance');await checkFit('program detail');
  const homeCard=()=>page.locator('[data-home-programs] > a[href="/programs/kmart/"]');
  await open('/');assert.equal(await homeCard().locator('small').textContent(),'Fixture Racing Alliance');await renameOnly();assert.equal(await homeCard().locator('small').textContent(),'Renamed Fixture Racing Alliance');await checkFit('homepage');
  const missionCard=()=>page.locator('[data-mission-programs] .mission-program').filter({has:page.locator('a[href="/programs/kmart/"]')});
  await open('/mission-values/');assert.equal(await missionCard().locator('.eyebrow').textContent(),'Fixture Racing Alliance');await renameOnly();assert.equal(await missionCard().locator('.eyebrow').textContent(),'Renamed Fixture Racing Alliance');await checkFit('mission');

  // Simulate completed, explicit reassignments followed by removing the last alliance.
  const empty=structuredClone(initial);empty.alliances=[];
  for(const row of empty.drivers)Object.assign(row,{affiliation:'aetherwing',allianceId:''});
  for(const row of empty['roster-profiles'])Object.assign(row,{affiliation:'aetherwing',allianceId:''});
  for(const row of empty.competitions)if(row.type==='alliance')Object.assign(row,{type:'aetherwing',allianceId:'',label:'Aetherwing Program',platform:'Roblox'});
  datasets=mergeCanonical(empty);
  for(const key of Object.keys(historical))assert.equal(JSON.stringify(datasets[key]),historical[key],`${key}: removing current relationships preserves historical collections`);
  await dispatch(datasets);assert.equal(await missionCard().locator('.eyebrow').textContent(),'Aetherwing Program');
  await open('/drivers/');assert.equal(await matty().getAttribute('data-team-label'),'AETHERWING');assert.doesNotMatch(await page.locator('[data-lineup-intro]').textContent(),/StarClutch|Fixture/);await checkFit('empty alliance directory');
  await open('/drivers/matty/');assert.equal(await page.locator('[data-profile-affiliation]').textContent(),'AETHERWING DRIVER');assert.doesNotMatch(await page.locator('[data-profile-assignments]').textContent(),/StarClutch|Fixture/i);
  await open('/programs/');assert.equal(await programCard().locator('.eyebrow').textContent(),'Aetherwing Program');
  await open('/programs/kmart/');assert.equal(await detailLabel(),'Aetherwing Program');
  await open('/');assert.equal(await homeCard().locator('small').textContent(),'Aetherwing Program');assert.equal(await homeCard().evaluate(el=>el.classList.contains('is-alliance')),false);
  assert.deepEqual(errors,[],'No public runtime errors');console.log(`PASS ${width}px: named alliances on directory/profile/programs/Home/Mission; rename-only hydration; explicit empty removal; unchanged history, current driver count and layout preservation.`);
  await context.close();
 }
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

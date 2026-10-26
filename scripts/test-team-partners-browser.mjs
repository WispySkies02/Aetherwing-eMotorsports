import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url),seed=require('../netlify/lib/_content.cjs').seeds();
const {chromium}=await import(pathToFileURL(path.join(process.env.PAINT_TEST_MODULES||'/tmp/aetherwing-browser-tests/node_modules','playwright-core/index.mjs')));
const root=path.resolve('dist'),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((request,response)=>{let file=path.resolve(root,`.${new URL(request.url,'http://localhost').pathname}`);if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');response.writeHead(200,{'content-type':types[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(response);}catch{response.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,768,390,320]){
  const context=await browser.newContext({viewport:{width,height:1000}}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let fail=false;
  const old=structuredClone(seed);old.partners=seed.partners.map(partner=>({name:partner.name,role:partner.role,description:'Old generic profile',tags:partner.tags,logo:partner.logo,url:partner.url}));
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname==='/api/site-content'){if(fail)return route.abort();return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({revision:95,datasets:old})});}if(url.origin!==base)return route.abort();return route.continue();});
  const check=async()=>{
   const cards=page.locator('[data-team-partners] > .team-partner');assert.equal(await cards.count(),2);
   for(let i=0;i<seed.partners.length;i++){
    const partner=seed.partners[i],card=cards.nth(i);
    assert.equal(await card.getAttribute('href'),partner.url);
    assert.equal(await card.locator(':scope > h3').textContent(),partner.name);
    for(const text of [partner.description,partner.presenceTitle,...partner.presenceParagraphs,...partner.tags,...partner.presenceTags,partner.badge,partner.category,partner.profileLabel])assert.ok((await card.textContent()).includes(text),`${partner.name}: approved text retained`);
    assert.equal(await card.locator('.team-partner__presence p').count(),2);
    assert.equal(await card.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Partner content fits the current cards');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal page overflow');
  };
  await page.goto(`${base}/partners/`,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');await check();
  await page.locator('[data-team-partners]').screenshot({path:`/tmp/aetherwing-approved-partners-${width}.png`});
  assert.ok(await page.locator('[data-portfolio-tabs] button').count()>0,'Driver portfolios remain separate');
  assert.ok(await page.locator('[data-portfolio-body] .partner-logos').count()>0,'Portfolio rendering still works');
  const edited=structuredClone(seed);edited.partners[0].presenceTitle='Later CMS presence edit';edited.partners[0].presenceParagraphs=['A newly approved paragraph.'];edited.partners[0].description='Updated public introduction.';
  await page.evaluate(detail=>window.dispatchEvent(new CustomEvent('aetherwing:content',{detail})),edited);
  assert.match(await page.locator('[data-team-partners]').textContent(),/Later CMS presence edit.*A newly approved paragraph/s);
  assert.match(await page.locator('[data-team-partners]').textContent(),/Updated public introduction/);
  // An old saved snapshot must not replace the restored copy during a failed load.
  await page.evaluate(datasets=>localStorage.setItem('aetherwing-publication-v1',JSON.stringify({datasets,revision:94,savedAt:new Date().toISOString()})),old);
  fail=true;await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.contentState==='cached');await check();
  await page.locator('[data-team-partners] > .team-partner').last().locator(':scope > b').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('[data-team-partners] > .team-partner').last().evaluate(el=>{const r=el.querySelector('b').getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'The final partner link remains unobstructed');
  assert.deepEqual(errors,[],'No partner-page runtime errors');
  console.log(`PASS: ${width}px approved descriptions, badges, tags and presence; stale/cached hydration; later CMS edits; separate portfolios; link and content clearance.`);
  await context.close();
 }
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

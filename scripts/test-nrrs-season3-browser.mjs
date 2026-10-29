import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {storySlug,races,raceDetail} from '../src/lib/nrrs-season3-review.mjs';
const require=createRequire(import.meta.url);
const {chromium}=await import(pathToFileURL(path.join(process.env.PAINT_TEST_MODULES||'/tmp/aetherwing-browser-tests/node_modules','playwright-core/index.mjs')));
const seed=require('../netlify/lib/_content.cjs').seeds();
const older=structuredClone(seed);older.news=older.news.filter(s=>s.slug!==storySlug).map(s=>({...s,featured:s.slug==='pole-position-fading-pace-bell-salvages-third-at-new-hampshire'}));
const datasets=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(older);
const dist=path.resolve('dist'),mime={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((request,response)=>{let file=path.resolve(dist,`.${new URL(request.url,'http://localhost').pathname}`);if(file!==dist&&!file.startsWith(dist+path.sep)){response.writeHead(403).end();return;}try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(response);}catch{response.writeHead(404).end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,1024,768,430,390,360,320]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,reducedMotion:'reduce'}),page=await context.newPage();
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  let release;
  await page.route('**/*',async route=>{const url=new URL(route.request().url());if(url.pathname==='/api/site-content'){await new Promise(resolve=>{release=resolve});return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({revision:101,datasets})});}if(url.origin!==base)return route.abort();return route.continue();});
  await page.goto(`${base}/news/${storySlug}/`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>!document.querySelector('[data-s3-picker]').disabled);
  assert.equal(await page.locator('h1').textContent(),'MORE THAN JUST RUNNING LAPS');
  assert.match(await page.locator('h1').evaluate(el=>getComputedStyle(el).fontFamily),/Saira Condensed/);
  assert.match(await page.locator('.s3-prose p').first().evaluate(el=>getComputedStyle(el).fontFamily),/Inter/);
  assert.match(await page.locator('.s3-stats dd').first().evaluate(el=>getComputedStyle(el).fontFamily),/Share Tech Mono/);
  assert.match(await page.title(),/More Than Just Running Laps \| Hailey Bell NRRS Season 3/);
  assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'),'article');
  assert.equal(await page.locator('meta[property="article:published_time"]').getAttribute('content'),'2026-10-29');
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),`https://aetherwing.net/news/${storySlug}/`);
  assert.deepEqual(await page.locator('.s3-stats dd').allTextContents(),['22 / 25','5.64','8.84','12','3','0']);
  assert.equal(await page.locator('[data-s3-race]').count(),25);assert.equal(await page.locator('.s3-dot').count(),19);assert.equal(await page.locator('.s3-podium').count(),3);assert.equal(await page.locator('.s3-dns-mark').count(),3);assert.equal(await page.locator('.s3-finish-line').count(),3);
  assert.equal(await page.locator('[data-s3-section]').count(),8);
  const expected=seed.news.find(s=>s.slug===storySlug);
  for(let index=0;index<expected.sections.length;index++)assert.deepEqual(await page.locator(`[data-s3-section="${index}"] p`).allTextContents(),expected.sections[index].paragraphs,'Every approved paragraph remains intact');
  assert.equal(await page.locator('.s3-chase-table tbody tr').count(),6);
  assert.equal(await page.locator('.s3-incident > li').count(),4);
  assert.match(await page.locator('.s3-homestead').textContent(),/P4 was her qualifying position only/);
  assert.match(await page.locator('.s3-tour').textContent(),/#28 StarClutch Racing Cadillac/);
  assert.equal(await page.locator('.s3-tour a').getAttribute('href'),'/news/hailey-bell-to-step-back-from-full-time-competition-after-season-4/');
  assert.equal(await page.locator('[data-s3-feature]').getByText('[INSERT COMPONENT]',{exact:false}).count(),0);
  for(const round of races.map(race=>race.round)){
   await page.locator('[data-s3-picker]').selectOption(String(round));
   assert.equal(await page.locator('[data-s3-detail]').textContent(),raceDetail(races[round-1]));
  }
  assert.ok(release,'A delayed publication request must be pending');release();
  await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
  assert.equal(await page.locator('[data-s3-picker]').inputValue(),'25','Publication hydration preserves chart selection');
  assert.match(await page.locator('[data-s3-detail]').textContent(),/DNS — Technical Issues.*Qualified P4; did not start/);
  const selected=page.locator('[data-s3-race="25"]');await selected.focus();await page.keyboard.press('Home');
  assert.equal(await page.locator('[data-s3-picker]').inputValue(),'1');await page.keyboard.press('ArrowRight');assert.equal(await page.locator('[data-s3-picker]').inputValue(),'2');await page.keyboard.press('End');assert.equal(await page.locator('[data-s3-picker]').inputValue(),'25');
  const scroll=await page.evaluate(()=>scrollY);await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>scrollY),scroll);
  const target=page.locator('[data-s3-race="24"] .s3-hit');await target.scrollIntoViewIfNeeded();if(width<700)await target.tap();else await target.click();
  assert.equal(await page.locator('[data-s3-detail]').textContent(),'R24 · New Hampshire · P3 of 5');
  await page.locator('.s3-data summary').click();assert.equal(await page.locator('.s3-data tbody tr').count(),25);
  assert.deepEqual(await page.locator('.s3-data tbody tr td:nth-child(4)').allTextContents(),races.map(race=>String(race.fieldSize)),'All 25 verified field sizes render in the table');
  assert.match(await page.locator('.s3-data caption').textContent(),/including listed DNFs and parked entries/);
  assert.match(await page.locator('.s3-dashboard .s3-note').textContent(),/Largest field: 12 at Talladega \(R10\); smallest: 5 at New Hampshire \(R24\)/);
  await page.screenshot({path:`/tmp/nrrs-season3-debug-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px: no page overflow`);
  for(const box of await page.locator('.s3-stats > div,.s3-spotlights > div,.s3-incident > li,.s3-race-detail,.s3-prose h2,h1,.s3-tour').all())assert.equal(await box.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`${width}px: ${await box.evaluate(el=>`${el.className}: ${el.textContent.slice(0,100)} (${el.scrollWidth}/${el.clientWidth})`)} text stays inside its panel`);
  if(width<600){
   await page.locator('[data-sheet-open]').click();await page.getByRole('dialog').waitFor({state:'visible'});await page.locator('[data-sheet-close]').click();assert.equal(await page.getByRole('dialog').isVisible(),false,'Mobile More sheet opens and closes');
   assert.equal(await page.locator('.s3-stats').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),2,'Mobile statistics keep two columns');
   assert.equal(await page.locator('.s3-chart-scroll').evaluate(el=>el.scrollWidth>el.clientWidth),true,'Chart scrolls independently on mobile');
  }
  await page.locator('.s3-tour a').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.s3-tour img').naturalWidth===1563);
  const cta=await page.locator('.s3-tour a').boundingBox();const bar=await page.locator('[data-aw-dock]').boundingBox().catch(()=>null);if(bar)assert.ok(cta.y+cta.height<=bar.y,'Closing link clears bottom navigation');
  await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`/tmp/nrrs-season3-hero-${width}.png`});
  await page.locator('.s3-dashboard').screenshot({path:`/tmp/nrrs-season3-dashboard-${width}.png`});
  await page.locator('.s3-chart-scroll').evaluate(el=>{el.scrollLeft=el.scrollWidth;});
  await page.locator('[data-s3-chart-root]').screenshot({path:`/tmp/nrrs-season3-chart-${width}.png`});
  const edited=structuredClone(datasets),story=edited.news.find(s=>s.slug===storySlug);story.title='Published Season Review';story.sections[0].paragraphs[0]='Later approved editorial copy.';
  await page.evaluate(detail=>window.dispatchEvent(new CustomEvent('aetherwing:content',{detail})),edited);
  assert.equal(await page.locator('h1').textContent(),'Published Season Review');assert.match(await page.locator('[data-s3-section="0"]').textContent(),/Later approved editorial copy/);
  assert.equal(await page.locator('[data-s3-picker]').inputValue(),'24');await page.locator('[data-s3-picker]').selectOption('18');assert.match(await page.locator('[data-s3-detail]').textContent(),/DNS — Work/);
  assert.deepEqual(errors,[],'No runtime errors');console.log(`PASS: ${width}px full copy/statistics, DNS/podium chart, touch/keyboard, CMS state, metadata, mobile spacing and footer.`);
  await context.close();
 }
 const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}}),page=await context.newPage();
 await page.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());await page.goto(`${base}/news/${storySlug}/`,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('[data-s3-section]').count(),8);assert.equal(await page.locator('[data-s3-picker]').isDisabled(),true);await page.locator('.s3-data summary').click();assert.equal(await page.locator('.s3-data tbody tr').count(),25);assert.equal(await page.locator('.s3-finish-line').count(),3);
 console.log('PASS: no-JavaScript article, statistics, static chart, complete result table and footer.');await context.close();
}finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

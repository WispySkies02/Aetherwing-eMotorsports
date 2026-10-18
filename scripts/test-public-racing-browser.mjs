import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { eventEnd } from '../src/lib/race-clock.mjs';
import { eventSlug } from '../src/lib/schedule-events.mjs';
const require=createRequire(import.meta.url);
const {chromium}=await import(pathToFileURL(path.join(process.env.PAINT_TEST_MODULES||'/tmp/aetherwing-browser-tests/node_modules','playwright-core/index.mjs')));
const seed=require('../netlify/lib/_content.cjs').seeds();
const datasets=structuredClone(seed);
delete datasets.competitions; // The live API legitimately omits this dataset.
const board=datasets.standings.find(b=>b.id==='nrrs');
board.subtitle='Town Fair Cup · Season 3 · After R23/25 · Portland · Chase Race 4 · Oct. 13, 2026';
const hailey=board.rows.find(r=>r.highlight);Object.assign(hailey,{driver:'Hailey',position:'P4',points:2190,delta:'-106',positionChange:1});
Object.assign(board.rows[0],{driver:'Will',points:2296});
const uarl=datasets['schedule-events'].find(e=>e.league==='uarl-d1'&&e.round==='ROUND 4');
Object.assign(uarl,{date:'2026-10-18',track:'Echo Park Speedway',title:'Echo Park Thunder 400'});
const published={revision:90,datasets};
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const root=path.resolve('dist');
assert.ok(fs.existsSync(path.join(root,'index.html')),'Build the production site before running this browser check');
const server=http.createServer((request,response)=>{
  let file=path.join(root,decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)&&file!==root){response.writeHead(403).end();return;}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(response);}catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:740}]) {
    const context=await browser.newContext({viewport,reducedMotion:'reduce'});
    const page=await context.newPage();
    await page.clock.install({time:new Date('2026-10-18T12:00:00Z')});
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    let fail=false, delay=600;
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/api/site-content') {
        if(fail)return route.abort('failed');
        await new Promise(resolve=>setTimeout(resolve,delay));
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(published)});
      }
      if(url.origin!==base)return route.abort('failed');
      return route.continue();
    });
    await page.goto(base,{waitUntil:'domcontentloaded'});
    assert.equal(await page.locator('html').getAttribute('data-content-state'),'loading');
    assert.equal(await page.locator('[data-battle-heading]').evaluate(el=>getComputedStyle(el).visibility),'hidden','Seed R21 must not flash before publication resolves');
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.equal(await page.locator('[data-battle-heading]').textContent(),'Hailey · P4');
    assert.match(await page.locator('[data-battle-context]').textContent(),/R23\/25.*2,190 PTS/);
    assert.equal(await page.locator('[data-battle-gap]').textContent(),'-106');
    assert.match(await page.locator('[data-tower-context]').textContent(),/R23\/25/);
    assert.equal(await page.locator('[data-latest-title]').textContent(),'Portland (Chase Race 4)');
    assert.equal(await page.locator('[data-latest-event]').getAttribute('href'),'/event/nrrs-round-23/');
    assert.equal(await page.locator('[data-team-stat="rootsSince"]').textContent(),'2015');
    if(viewport.width<1100) {
      const dock=page.locator('[data-aw-dock]');assert.equal(await dock.isVisible(),true);
      for(const button of await dock.locator('a,button').all())assert.equal(await button.evaluate(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'Every bottom navigation control must be unobstructed');
      await page.locator('[data-sheet-open]').first().click();
      assert.equal(await page.locator('[data-aw-sheet]').evaluate(el=>el.open),true);
      assert.equal(await page.locator('html').evaluate(el=>getComputedStyle(el).overflow),'hidden');
      assert.ok(await page.locator('[data-sheet-groups] a').count()>8,'More sheet retains all navigation groups');
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[data-aw-sheet]').evaluate(el=>el.open),false);
      await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
      const clearance=await page.locator('.ux-footer__base').evaluate(el=>({bottom:el.getBoundingClientRect().bottom,dock:document.querySelector('[data-aw-dock]').getBoundingClientRect().top}));
      assert.ok(clearance.bottom<=clearance.dock+1,'Footer content remains above the mobile tab bar');
    }
    delay=20;
    await page.goto(`${base}/championships/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-board="nrrs"] header').textContent(),/R23\/25/);
    const row=page.locator('[data-board="nrrs"] .standing-row').filter({hasText:'Hailey'});
    assert.match(await row.textContent(),/P4.*2,190 PTS.*-106/);
    for(const program of seed.competitions.filter(p=>p.id!=='uarl-d2')) {
      await page.goto(`${base}/programs/${program.id}/`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
      assert.equal(await page.locator('[data-program-next]').getAttribute('data-live-state'),'published');
      const links=await page.locator('[data-program-schedule] article a').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
      assert.ok(links.every(link=>{const event=datasets['schedule-events'].find(e=>`/event/${eventSlug(e)}/`===link);return event && eventEnd(event)>=new Date('2026-10-18T12:00:00Z');}),`${program.id}: no finished event windows in Upcoming (ongoing multi-day events remain visible)`);
      if(program.id==='uarl-d1')assert.match(await page.locator('[data-program-next]').textContent(),/Echo Park Speedway/);
    }
    await page.goto(`${base}/schedule/uarl-d1/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-calendar-hero]').textContent(),/Echo Park Speedway/);
    await page.goto(`${base}/event/nrrs-round-23/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.equal(await page.locator('[data-event-track]').textContent(),'Portland International Raceway');
    assert.match(await page.locator('[data-event-result]').textContent(),/Hailey.*29.*Only verified team results/s);
    assert.equal(await page.locator('[data-event-result] a').getAttribute('href'),'/news/bells-road-course-struggles-deepen-at-portland/');
    await page.goto(`${base}/history/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-results-list]').textContent(),/Recap-confirmed team result/);
    for(const result of seed.results){
      const response=await page.request.get(`${base}/event/${eventSlug(result)}/`);
      assert.equal(response.status(),200,`Every historical result link must resolve: ${result.scheduleId}`);
    }
    fail=true;
    await page.goto(base,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='cached');
    assert.match(await page.locator('[data-live-region="standings"] > [data-live-note]').textContent(),/Cached snapshot/);
    assert.match(await page.locator('[data-battle-context]').textContent(),/R23\/25/);
    await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='bundled');
    assert.match(await page.locator('[data-live-region="standings"] > [data-live-note]').textContent(),/Bundled fallback/);
    assert.deepEqual(errors,[],'No browser runtime errors');
    console.log(`PASS: ${viewport.width}px publication loading, R23 snapshot, every program, schedules/results/recap links, founding label, fallback, mobile navigation and clearance.`);
    await context.close();
  }
}finally {
  await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}

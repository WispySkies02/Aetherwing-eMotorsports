import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { eventEnd } from '../src/lib/race-clock.mjs';
import { eventSlug } from '../src/lib/schedule-events.mjs';
import { createWeatherHandler } from '../netlify/lib/_track-weather.mjs';
import { nwsFixture, nwsPoint } from './fixtures/nws-weather.mjs';
const require=createRequire(import.meta.url);
const {chromium}=await import(pathToFileURL(path.join(process.env.PAINT_TEST_MODULES||'/tmp/aetherwing-browser-tests/node_modules','playwright-core/index.mjs')));
const seed=require('../netlify/lib/_content.cjs').seeds();
const reviewed=require('../src/data/confirmed-racing-updates.json');
const beforeReview=structuredClone(seed);
beforeReview['schedule-events']=beforeReview['schedule-events'].filter(e=>!(reviewed.scheduleAdditions??[]).some(a=>a.eventId===e.eventId));
for(const change of reviewed.scheduleChanges){const e=beforeReview['schedule-events'].find(e=>eventSlug(e)===change.eventId);Object.assign(e,change.before);for(const key of Object.keys(change.before))if(change.before[key]===null)delete e[key];}
beforeReview.results=beforeReview.results.filter(r=>!reviewed.results.some(record=>record.scheduleId===r.scheduleId));
const datasets=structuredClone(seed);
delete datasets.competitions; // The live API legitimately omits this dataset.
const board=datasets.standings.find(b=>b.id==='nrrs');
board.subtitle='Town Fair Cup · Season 3 · After R23/25 · Portland · Chase Race 4 · Oct. 13, 2026';
const hailey=board.rows.find(r=>r.highlight);Object.assign(hailey,{driver:'Hailey',position:'P4',points:2190,delta:'-96',positionChange:1});
Object.assign(board.rows[0],{driver:'Will',points:2286});
const uarl=datasets['schedule-events'].find(e=>e.league==='uarl-d1'&&e.round==='ROUND 4');
Object.assign(uarl,{date:'2026-10-18',track:'Echo Park Speedway',title:'Echo Park Thunder 400'});
const legacyResults=structuredClone(datasets.results.filter(result=>result.date<'2026-10-01'));
const resolvedResults=require('../netlify/lib/_site-data.cjs')._test.mergeCanonical({results:legacyResults}).results;
const published={revision:90,datasets:{...datasets,results:resolvedResults}};
const weatherNow=Date.parse('2026-10-18T12:00:00Z');
const weatherHandler=createWeatherHandler({now:()=>weatherNow,fetcher:async url=>{
  if(url.startsWith('https://api.weather.gov/points/'))return Response.json(nwsPoint);
  if(url.startsWith('https://api.weather.gov/'))return Response.json(nwsFixture(weatherNow,'sct','sct'));
  return Response.json({properties:{meta:{updated_at:'2026-10-18T12:00:00Z'},timeseries:Array.from({length:24},(_,i)=>({time:new Date(weatherNow+i*3600000).toISOString(),data:{instant:{details:{air_temperature:20,wind_speed:5}},next_1_hours:{summary:{symbol_code:'fair_day'},details:{precipitation_amount:0}}}}))}});
}});
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
    let fail=false, delay=600, weatherFail=false;
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/api/track-weather') {
        const response=weatherFail?Response.json({error:'offline'},{status:502}):await weatherHandler(new Request(url));
        return route.fulfill({status:response.status,contentType:'application/json',body:await response.text()});
      }
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
    assert.equal(await page.locator('[data-battle-gap]').textContent(),'-96');
    assert.match(await page.locator('[data-tower-context]').textContent(),/R23\/25/);
    assert.equal(await page.locator('[data-latest-title]').textContent(),'Comcast 301');
    assert.equal(await page.locator('.hub-wire__lead').getAttribute('href'),'/news/pole-position-fading-pace-bell-salvages-third-at-new-hampshire/');
    assert.equal(await page.locator('[data-latest-event]').getAttribute('href'),'/event/nrrs-round-24/');
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
    // Exercise the real built card, publication subscriber and weather renderer.
    await page.goto(`${base}/event/kmart-round-10/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    await page.locator('[data-weather-report]').waitFor({state:'visible'});
    assert.match(await page.locator('[data-track-facts]').textContent(),/TALLADEGA, AL.*2.66 mi.*16.5–33°/s);
    assert.equal(await page.locator('[data-weather-temperature]').textContent(),'68°F');
    assert.equal(await page.locator('[data-weather-forecast] time').count(),3);
    assert.equal(await page.locator('[data-weather-current-icon] svg[data-weather-icon=partly-day]').count(),1);
    assert.equal(await page.locator('[data-weather-forecast] svg[data-weather-icon=partly-day]').count(),3);
    for(const icon of await page.locator('.race-weather-icon').all())assert.equal(await icon.isVisible(),true,'Current and forecast icons render at every viewport');
    assert.match(await page.locator('[data-weather-valid]').textContent(),/CDT/);
    assert.match(await page.locator('[data-weather-issued]').textContent(),/Issued.*times local/);
    assert.match(await page.locator('[data-weather-provider]').textContent(),/National Weather Service/);
    assert.match(await page.locator('[data-weather-forecast]').textContent(),/Precip. chance 40%/);
    assert.equal(await page.locator('[data-track-source]').getAttribute('href'),'https://www.talladegasuperspeedway.com/track-facts/');
    await page.locator('.story-grid > .story-panel').first().screenshot({path:`/tmp/aetherwing-race-weekend-${viewport.width}.png`});
    const updateVenue=async track=>page.evaluate(({track,datasets})=>{
      const next=structuredClone(datasets);
      const race=next['schedule-events'].find(e=>e.league==='kmart'&&e.round==='ROUND 10');
      race.track=track;
      window.dispatchEvent(new CustomEvent('aetherwing:content',{detail:next}));
    },{track,datasets});
    await updateVenue('Charlotte Motor Speedway (Oval)');
    await page.locator('[data-weather-report]').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-event-track]').textContent(),'Charlotte Motor Speedway (Oval)');
    assert.match(await page.locator('[data-track-facts]').textContent(),/CONCORD, NC.*1.50 mi.*24°/s);
    assert.match(await page.locator('[data-weather-valid]').textContent(),/EDT/);
    await updateVenue('The Dirt Track At Charlotte');
    await page.locator('[data-weather-report]').waitFor({state:'visible'});
    assert.match(await page.locator('[data-track-facts]').textContent(),/0.40 mi.*Dirt/s);
    assert.doesNotMatch(await page.locator('[data-track-facts]').textContent(),/1.50 mi|24°/);
    await updateVenue('Silverstone');
    await page.locator('[data-weather-report]').waitFor({state:'visible'});
    assert.match(await page.locator('[data-weather-provider]').textContent(),/MET Norway.*CC BY 4.0/);
    assert.equal(await page.locator('[data-weather-current-icon] svg[data-weather-icon=partly-day]').count(),1);
    assert.match(await page.locator('[data-weather-forecast]').textContent(),/Rain 0.00 in \/ hr/);
    await updateVenue('Track TBD');
    assert.equal(await page.locator('[data-track-weather]').isVisible(),false);
    assert.equal(await page.locator('[data-track-facts]').textContent(),'');
    weatherFail=true; await updateVenue('Talladega');
    await page.locator('[data-weather-retry]').waitFor({state:'visible'});
    assert.match(await page.locator('[data-weather-status]').textContent(),/temporarily unavailable/);
    assert.match(await page.locator('[data-track-facts]').textContent(),/2.66 mi/);
    weatherFail=false; await page.locator('[data-weather-retry]').click();
    await page.locator('[data-weather-report]').waitFor({state:'visible'});
    for(const name of ['[data-track-facts] dd','[data-weather-forecast] > div']) {
      for(const cell of await page.locator(name).all())assert.equal(await cell.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`${viewport.width}px track details and forecast fit their cells`);
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Race card does not create horizontal scrolling');
    await page.locator('[data-track-source]').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('[data-track-source]').evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'Track reference remains unobstructed');
    await page.goto(`${base}/championships/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-board="nrrs"] header').textContent(),/R23\/25/);
    const row=page.locator('[data-board="nrrs"] .standing-row').filter({hasText:'Hailey'});
    assert.match(await row.textContent(),/P4.*2,190 PTS.*-96/);
    for(const program of seed.competitions.filter(p=>p.id!=='uarl-d2')) {
      await page.goto(`${base}/programs/${program.id}/`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
      assert.equal(await page.locator('[data-program-next]').getAttribute('data-live-state'),'published');
      const links=await page.locator('[data-program-schedule] article a').evaluateAll(links=>links.map(a=>a.getAttribute('href')));
      assert.ok(links.every(link=>{const event=datasets['schedule-events'].find(e=>`/event/${eventSlug(e)}/`===link);return event && (event.timePending||eventEnd(event)>=new Date('2026-10-18T12:00:00Z'));}),`${program.id}: no finished event windows in Upcoming (ongoing multi-day events remain visible)`);
      if(program.id==='uarl-d1')assert.match(await page.locator('[data-program-next]').textContent(),/Echo Park Speedway/);
    }
    await page.goto(`${base}/schedule/uarl-d1/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-calendar-hero]').textContent(),/Echo Park Speedway/);
    await page.goto(`${base}/schedule/open/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-calendar-hero]').textContent(),/START TIME PENDING.*TIME TBD/s);
    await page.goto(`${base}/event/open-round-4/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.equal(await page.locator('[data-session-state]').textContent(),'Start time pending');
    assert.equal(await page.locator('[data-session-ics]').isVisible(),false,'Unknown time cannot create a misleading calendar appointment');
    assert.ok(!(await page.locator('[data-event-clock]').textContent()).includes('NaN'));
    await page.goto(`${base}/schedule/sunoco/#full`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    const phoenix=page.locator('.aw-calendar__event').filter({hasText:'Phoenix Raceway'});
    assert.match(await phoenix.textContent(),/OCT 24.*Phoenix Raceway/s);
    assert.equal(await phoenix.getAttribute('href'),'/event/sunoco-2026-10-17/','Postponement retains the previously shared race link');
    await page.goto(`${base}/event/sunoco-2026-10-17/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-event-summary]').textContent(),/Oct 24, 2026/);
    await page.goto(`${base}/history/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    const archive=page.locator('[data-results-list] article');
    const dates=await archive.locator(':scope > span').allTextContents();
    for(const date of ['2026-10-20','2026-10-13','2026-10-10','2026-10-06','2026-10-05'])assert.ok(dates.some(text=>text.startsWith(date)),`Approved ${date} result remains visible after hydration`);
    assert.ok(!dates.some(text=>text.startsWith('2026-10-19')),'No unsupported October 19 result');
    for(const id of ['nrrs-round-22','nrrs-round-23','nrrs-round-24']) {
      const link=page.locator(`[data-results-list] a[href="/event/${id}/"]`);
      assert.equal(await link.count(),1,'The approved result links once to its event');
      await page.goto(`${base}/event/${id}/`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
      assert.ok((await page.locator('[data-event-result]').textContent()).includes('Hailey'));
      await page.goto(`${base}/history/`,{waitUntil:'domcontentloaded'});
      await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    }
    const recapSlug='pole-position-fading-pace-bell-salvages-third-at-new-hampshire';
    await page.goto(`${base}/news/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.equal(await page.locator('[data-news-list] > a').first().getAttribute('href'),`/news/${recapSlug}/`);
    await page.goto(`${base}/news/${recapSlug}/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.equal(await page.locator('h1').textContent(),'Pole Position, Fading Pace: Bell Salvages Third at New Hampshire');
    assert.equal(await page.locator('.news-feature-prose h2').count(),5,'All source headings survive live article hydration');
    assert.match(await page.locator('.news-change-grid').textContent(),/−96.*−100/s,'Owner-confirmed previous gap remains 96');
    assert.match(await page.locator('.news-standing-card__row').filter({hasText:'Hailey'}).textContent(),/2,229.*100 BACK/s);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Article remains within the viewport');
    for(const cell of await page.locator('.news-race-strip__grid > div,.news-numbers-grid > div').all())assert.equal(await cell.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,'Race facts fit their existing card layout');
    await page.locator('.news-race-strip').screenshot({path:`/tmp/aetherwing-new-hampshire-recap-${viewport.width}.png`});
    await page.goto(`${base}/event/nrrs-round-24/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-event-summary]').textContent(),/Oct 20, 2026/);
    assert.match(await page.locator('[data-event-result]').textContent(),/P3.*Hailey.*P1.*P4.*P3.*39.*two laps down/s);
    assert.equal(await page.locator('[data-event-result] a').getAttribute('href'),`/news/${recapSlug}/`);
    await page.goto(`${base}/event/nrrs-round-23/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.equal(await page.locator('[data-event-track]').textContent(),'Portland International Raceway');
    assert.match(await page.locator('[data-event-result]').textContent(),/Hailey.*29.*Only Aetherwing NRRS entries/s);
    assert.equal(await page.locator('[data-event-result] a').getAttribute('href'),'/news/bells-road-course-struggles-deepen-at-portland/');
    await page.goto(`${base}/history/`,{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
    assert.match(await page.locator('[data-results-list]').textContent(),/Official team result/);
    const mart=page.locator('[data-results-list] article').filter({hasText:'BrakeBest Brake Pads 250'});
    assert.match(await mart.textContent(),/Clutch.*P2.*Wispy.*P4/s,'Both requested SCR entries must be visible in History');
    const sunoco=page.locator('[data-results-list] article').filter({hasText:'Ecosave 250'});
    assert.match(await sunoco.textContent(),/Will.*P1.*Clutch.*P2.*Wispy.*P3/s,'All three selected Sunoco entries must remain visible');
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
    // The new control stages one reviewed section, preserves unrelated data,
    // and does not save or publish until the existing Publish action is used.
    await page.evaluate(old=>localStorage.setItem('aetherwing-site-admin',JSON.stringify({version:1,revision:1,published:old,drafts:{},history:[]})),beforeReview);
    page.on('dialog',dialog=>dialog.accept());
    await page.goto(`${base}/admin/`,{waitUntil:'domcontentloaded'});
    await page.locator('[data-login]').click();
    if(viewport.width<=900)await page.locator('[data-adm-open="race"]').click();
    await page.locator('[data-admin-dataset="schedule-events"]').click();
    await page.locator('[data-load-reviewed-racing-updates]').click();
    await page.waitForFunction(()=>document.querySelector('[data-content-status]').textContent.includes('Reviewed October update loaded'));
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aetherwing-site-admin')));
    assert.equal(saved.published['schedule-events'].find(e=>e.league==='open'&&e.round==='ROUND 4')?.date,'2026-10-11');
    await page.locator('[data-content-publish]').click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('aetherwing-site-admin')).published['schedule-events'].some(e=>e.league==='open'&&e.round==='ROUND 4'&&e.date==='2026-10-18'));
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aetherwing-site-admin')));
    assert.deepEqual(saved.published.standings,beforeReview.standings);
    assert.deepEqual(saved.published.results,beforeReview.results,'Calendar staging/publication does not consume results');
    assert.equal(saved.published['schedule-events'].find(e=>e.track==='Phoenix Raceway'&&e.league==='sunoco').date,'2026-10-24');
    if(viewport.width<=900)await page.locator('[data-adm-open="race"]').click();
    await page.locator('[data-admin-dataset="results"]').click();
    await page.locator('[data-load-reviewed-racing-updates]').click();
    await page.waitForFunction(()=>document.querySelector('[data-content-status]').textContent.includes('Reviewed October update loaded'));
    await page.locator('[data-content-publish]').click();
    await page.waitForFunction(()=>JSON.parse(localStorage.getItem('aetherwing-site-admin')).published.results.some(r=>r.scheduleId==='kmart-round-9'));
    saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('aetherwing-site-admin')));
    assert.deepEqual(saved.published.results.find(r=>r.scheduleId==='kmart-round-9').entries.map(e=>[e.driver,e.racePoints]),[['Clutch',35],['Wispy',33]]);
    assert.deepEqual(saved.published.standings,beforeReview.standings,'Reviewing/publishing archival records leaves current championship points intact');
    assert.deepEqual(errors,[],'No browser runtime errors');
    console.log(`PASS: ${viewport.width}px Race Weekend track facts/weather/retry/venue updates, publication loading, R23 snapshot, every program, schedules/results/recap links, founding label, fallback, mobile navigation and clearance.`);
    await context.close();
  }
}finally {
  await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
}

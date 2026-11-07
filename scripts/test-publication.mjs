import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventSlug, legacyEventSlug } from '../src/lib/schedule-events.mjs';
import { standingIdentity } from '../src/lib/standings-metadata.mjs';
import { mountHomeStandings } from '../src/lib/home-standings-client.mjs';
import { JSDOM } from 'jsdom';

const root=fileURLToPath(new URL('../',import.meta.url));
const scratch=fs.mkdtempSync(join(tmpdir(),'aetherwing-publication-'));
const cwd=join(scratch,'site');
let server;
let failure;
async function build(extra={}) {
  return new Promise((resolve,reject)=>{
    // Publication tests use a local fixture, never a live Netlify content feed.
    const env={...process.env,ASTRO_TELEMETRY_DISABLED:'1',AETHERWING_CONTENT_URL:'',...extra};
    delete env.NETLIFY;
    const child=spawn(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{cwd,shell:false,env});
    let output='';child.stdout.on('data',(d)=>output+=d);child.stderr.on('data',(d)=>output+=d);
    child.on('error',reject);
    child.on('exit',(code,signal)=>code===0?resolve():reject(new Error(`Publication build failed (${signal||code}):\n${output.slice(-8000)}`)));
  });
}
try {
  // Build in an isolated copy so failures cannot leave fixtures in the checkout,
  // generated Admin seed, or the developer's existing production build.
  fs.cpSync(root,cwd,{recursive:true,filter:(source)=>!['.git','node_modules','.astro','dist'].includes(relative(root,source).split(sep)[0])});
  fs.symlinkSync(join(root,'node_modules'),join(cwd,'node_modules'),'junction');
  const overlayFile=join(cwd,'src/data/admin-content.json');
  await build();
  const css=fs.readdirSync(join(cwd,'dist/_astro')).filter((file)=>file.endsWith('.css')).map((file)=>fs.readFileSync(join(cwd,'dist/_astro',file),'utf8')).join('\n');
  assert.match(css,/html\.aw-sheet-open(?:,\s*html\.aw-sheet-open\s+body)?\s*\{\s*overflow:\s*hidden\s*;?\s*\}/,'Compiled mobile menu sheet must lock page scrolling');
  assert.doesNotMatch(css,/:global\(/,'Astro-only selector syntax must not leak into browser CSS');
  // The sync script canonically adds core partners. Restore this build baseline,
  // rather than expecting an empty source overlay to survive normalization.
  const baselineOverlay=fs.readFileSync(overlayFile,'utf8');
  const {seeds,normalize}=createRequire(join(cwd,'package.json'))('./netlify/lib/_content.cjs');
  const data=seeds();
  data.alliances.push({id:'publication-fixture-alliance',name:'Publication Fixture Racing',shortName:'Fixture Racing'});
  data.drivers.find(row=>row.id==='matty-kmart').allianceId='publication-fixture-alliance';
  data['roster-profiles'].find(row=>row.slug==='matty').allianceId='publication-fixture-alliance';
  data.competitions.find(row=>row.id==='kmart').allianceId='publication-fixture-alliance';
  const event={...data['schedule-events'][0],date:'2027-02-01',title:'Publication Fixture Race',eventId:'publication-fixture-race'};
  data['schedule-events'].push(event);
  data['schedule-events'].push({...event,league:'fixture-league',leagueName:'Fixture League',eventId:'fixture-league-race'});
  const resultTemplate=data.results.find(race=>race.league==='kmart'&&race.date==='2026-09-28'&&race.entries.some(entry=>entry.assignmentId==='clutch-kmart'));
  assert.ok(resultTemplate,'Publication fixture needs a complete Kmart result');
  data.results.unshift({...resultTemplate,scheduleId:'2099-01-01-kmart-publication-fixture-result',date:'2099-01-01',title:'Publication Fixture Result',track:'Fixture Raceway',headline:'PUBLICATION FIXTURE RESULT',summary:'Publication fixture result summary.',entries:[{...resultTemplate.entries.find((entry)=>entry.assignmentId==='clutch-kmart'),finish:2,featuredDriver:true}]});
  data.results=normalize('results',data.results);
  data.wins.push({league:'NRRS',track:'Publication Fixture Win',driver:'Wispy',date:'Sep 18, 2026'});
  data.milestones.push({date:'Sep 18, 2026',title:'Publication Fixture Milestone',description:'Publication fixture milestone text.'});
  data['roster-profiles'][0].name='Publication Fixture Driver';
  const sponsorPortfolio=data['driver-portfolios'].find(portfolio=>portfolio.profile==='hailey');
  assert.ok(sponsorPortfolio?.brands.length>=4,'Sponsor regression needs logo, text-only, legacy and blank-title brands');
  sponsorPortfolio.brands[0].sponsorTitle='Publication Fixture Primary & Apparel Partner';
  sponsorPortfolio.brands[1].logo='';sponsorPortfolio.brands[1].sponsorTitle='Publication Fixture Personal Partner';
  delete sponsorPortfolio.brands[2].sponsorTitle;sponsorPortfolio.brands[3].sponsorTitle='   ';
  const nrrsAssignment=data.drivers.find(entry=>entry.competitionId==='nrrs'&&entry.profile==='hailey');
  assert.ok(nrrsAssignment,'Historical entry regression needs Hailey’s current NRRS assignment');
  const historicalEvent=data['schedule-events'].find(event=>event.league==='nrrs'&&event.date==='2026-10-06');
  assert.ok(historicalEvent,'Historical entry regression needs the October 6 NRRS event');
  historicalEvent.entryListMode='custom';
  historicalEvent.entries=[{assignmentId:nrrsAssignment.id,driver:'Hailey',number:'32',entryStatus:'Confirmed'}];
  const historicalEntries=structuredClone(historicalEvent.entries);
  // A current-season number change must not rewrite an approved older event
  // while an unrelated schedule publication passes through content sync.
  const editedNumbers=new Map([[nrrsAssignment.id,'28'],['wispy-uarl-d1','83'],['rocky-uarl-d1','84'],['burgertown-uarl-d1','85']]);
  for(const entry of data.drivers)if(editedNumbers.has(entry.id))entry.number=editedNumbers.get(entry.id);
  const nrrs=data.standings.find((board)=>board.id==='nrrs');nrrs.cutoffAfter=6;nrrs.cutoffLabel='Chase cutoff · Top 6';
  const nrrsManual=nrrs.rows.find(row=>standingIdentity(row)==='hailey');
  assert.ok(nrrsManual,'Metadata publication fixture needs Hailey’s NRRS standings row');
  nrrs.chaseActive=false;
  Object.assign(nrrsManual,{manufacturer:'Cadillac',chaseLocked:true,regularSeasonChampion:true});
  const kmartMetadata=data.standings.find(board=>board.id==='kmart'),kmartManual=kmartMetadata.rows[0];
  Object.assign(kmartManual,{manufacturer:'Ford',chaseLocked:true,regularSeasonChampion:true});
  const ptMetadata={driver:kmartManual.driver,number:kmartMetadata.ptEntry.number,points:17,manufacturer:'Toyota',chaseLocked:false,regularSeasonChampion:false};
  kmartMetadata.ptEntry.drivers.push(ptMetadata);
  const sunocoMetadata=data.standings.find(board=>board.id==='sunoco');
  const sunocoRegular=name=>sunocoMetadata.rows.find(row=>row.driver===name),sunocoChase=name=>sunocoMetadata.chaseRows.find(row=>row.driver===name);
  Object.assign(sunocoRegular('Will'),{manufacturer:'Toyota',chaseLocked:true,regularSeasonChampion:true});
  Object.assign(sunocoChase('Will'),{manufacturer:'RAM',chaseLocked:false,regularSeasonChampion:false});
  Object.assign(sunocoRegular('Clutch'),{manufacturer:'Chevrolet',chaseLocked:false,regularSeasonChampion:false});
  Object.assign(sunocoChase('Clutch'),{manufacturer:'RAM',chaseLocked:true,regularSeasonChampion:false});
  // Published manual choices are persisted independently of points/result
  // inference. Regular/Chase copies agree; a separate PT car keeps its make.
  data.standings=normalize('standings',data.standings);
  // The current release selects the Kmart Chase-clinch feature in
  // Admin, the live API and static pages. Verify published edits to that lead
  // separately from adding an unfeatured article; do not change that policy.
  const lead=data.news.find((story)=>story.featured);
  assert.ok(lead,'Seed must define the current homepage lead');
  lead.title='Publication Fixture Lead';
  data.news.unshift({...lead,slug:'publication-fixture-story',legacyRoute:'/publication-fixture-story',title:'Publication Fixture Story',dateIso:'2027-01-01',date:'January 1, 2027',featured:false});
  server=http.createServer((_request,response)=>{response.setHeader('content-type','application/json');response.end(JSON.stringify({version:1,revision:999,datasets:data}));});
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const read=(path)=>fs.readFileSync(join(cwd,'dist',path),'utf8');
  try {
    await build({AETHERWING_CONTENT_URL:`http://127.0.0.1:${server.address().port}/content`});
    assert.ok(read('schedule/index.html').includes('Publication Fixture Race'));
    const allianceProfile=new JSDOM(read('drivers/matty/index.html'));
    assert.match(allianceProfile.window.document.querySelector('[data-profile-affiliation]').textContent,/PUBLICATION FIXTURE RACING/);
    assert.match(allianceProfile.window.document.querySelector('[data-profile-assignments]').textContent,/PUBLICATION FIXTURE RACING/);
    allianceProfile.window.close();
    for(const path of ['index.html','programs/index.html','programs/kmart/index.html','mission-values/index.html'])assert.ok(read(path).includes('Publication Fixture Racing Alliance'),`${path}: published alliance relationship survives rebuild/canonical repairs`);
    for(const text of ['Publication Fixture Result','Publication Fixture Milestone','Publication Fixture Win'])assert.ok(read('history/index.html').includes(text),`History must render ${text}`);
    assert.ok(read('drivers/index.html').includes('Publication Fixture Driver'));
    const sponsorTitles=sponsorPortfolio.brands.filter(brand=>brand.sponsorTitle?.trim()).map(brand=>brand.sponsorTitle.trim());
    const profilePage=new JSDOM(read('drivers/hailey/index.html'),{runScripts:'outside-only'});
    const partnersPage=new JSDOM(read('partners/index.html'),{runScripts:'outside-only'});
    try{
      const titles=page=>Array.from(page.window.document.querySelectorAll('.driver-sponsor-title'),node=>node.textContent);
      assert.deepEqual(titles(profilePage),sponsorTitles,'Static driver profiles must render optional titles and hide blank/missing ones');
      const partnersScript=Array.from(partnersPage.window.document.scripts).find(script=>script.textContent.includes('[data-personal-partners]'));
      assert.ok(partnersScript,'Built Partners page must retain its portfolio renderer');
      partnersPage.window.eval(partnersScript.textContent);
      partnersPage.window.document.querySelector(`[data-portfolio="${sponsorPortfolio.id}"]`).click();
      assert.deepEqual(titles(partnersPage),sponsorTitles,'Built Partners page must render saved sponsor titles');
      const profileScript=fs.readFileSync(join(cwd,'src/pages/drivers/[slug].astro'),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
      assert.ok(profileScript);profilePage.window.eval(profileScript);
      const live=structuredClone(data['driver-portfolios']),updated=live.find(portfolio=>portfolio.id===sponsorPortfolio.id);
      updated.brands.forEach(brand=>{brand.sponsorTitle='';});
      updated.brands[0].sponsorTitle='Live Travel & Apparel Partner';
      for(const page of [profilePage,partnersPage]){
        const publish=()=>page.window.dispatchEvent(new page.window.CustomEvent('aetherwing:content',{detail:{'driver-portfolios':live}}));
        publish();assert.deepEqual(titles(page),['Live Travel & Apparel Partner'],'Public pages must update titles from live portfolio data');
        const box=page.window.document.querySelector('[data-profile-partners]')||page.window.document.querySelector('.partner-logos');
        assert.equal(box.children.length,updated.brands.length,'Title edits must retain every existing sponsor');
        updated.brands[0].sponsorTitle='<img src=x onerror=alert(1)>';
        publish();assert.deepEqual(titles(page),['<img src=x onerror=alert(1)>'],'Live titles must be escaped as text');
        assert.equal(box.querySelector('[onerror="alert(1)"]'),null,'Titles must never inject image markup');
        updated.brands[0].sponsorTitle='';publish();assert.deepEqual(titles(page),[],'Cleared titles must disappear without removing sponsor cards');
        updated.brands[0].sponsorTitle='Live Travel & Apparel Partner';
      }
    }finally{profilePage.window.close();partnersPage.window.close();}
    const synced=JSON.parse(fs.readFileSync(overlayFile,'utf8'));
    const findHistoricalEvent=events=>events.find(event=>event.league===historicalEvent.league&&event.date===historicalEvent.date);
    assert.equal(synced.datasets.drivers.find(entry=>entry.id===nrrsAssignment.id).number,'28','The current NRRS number change survives publication');
    assert.deepEqual(findHistoricalEvent(synced.datasets['schedule-events'])?.entries,historicalEntries,'Content sync must preserve approved historical custom entry names and numbers');
    const calendar=new JSDOM(read('schedule/index.html'),{url:'https://aetherwing.net/schedule/',runScripts:'outside-only'});
    try{
      calendar.window.setInterval=()=>0;
      const calendarScript=Array.from(calendar.window.document.scripts).find(script=>script.textContent.includes('[data-race-calendar]'));
      assert.ok(calendarScript,'Built schedule page must include its calendar renderer');
      const calendarSeed=calendarScript.textContent.match(/const initial\s*=\s*(\[[\s\S]*?\]);\s*const initialResults\s*=/)?.[1];
      assert.ok(calendarSeed,'Built calendar must embed its published schedule');
      assert.deepEqual(findHistoricalEvent(JSON.parse(calendarSeed))?.entries,historicalEntries,'Built calendar data must keep the historical #32 despite the current #28 assignment');
      calendar.window.eval(calendarScript.textContent);
      const doc=calendar.window.document,rows=()=>Array.from(doc.querySelectorAll('[data-calendar-list] .aw-calendar__event'));
      assert.ok(rows().length<=5,'Production calendar must default to at most five upcoming races');
      assert.equal(doc.querySelector('[data-calendar-toggle]').getAttribute('aria-expanded'),'false');
      doc.querySelector('[data-series="nrrs"]').click();doc.querySelector('[data-calendar-toggle]').click();
      assert.equal(rows().length,synced.datasets['schedule-events'].filter(event=>event.league==='nrrs').length,'Built calendar must expose the entire selected league');
      doc.querySelector('[data-series="kmart"]').click();
      const kmart=synced.datasets['schedule-events'].filter(event=>event.league==='kmart');
      assert.equal(rows().length,kmart.length,'Full view must follow a league change');
      assert.equal(rows().filter(row=>row.tagName==='DIV').length,kmart.filter(event=>event.offWeek).length,'Built full schedule retains off weeks without broken links');
      doc.querySelector('[data-calendar-toggle]').click();assert.ok(rows().length<=5);
    }finally{calendar.window.close();}
    for(const league of new Set(synced.datasets['schedule-events'].map(event=>event.league))){
      const path=`/schedule/${league}/`;
      const page=new JSDOM(read(`schedule/${league}/index.html`),{url:`https://aetherwing.net${path}#full`,runScripts:'outside-only'});
      try{
        page.window.setInterval=()=>0;
        const script=Array.from(page.window.document.scripts).find(script=>script.textContent.includes('[data-race-calendar]'));
        assert.ok(script);page.window.eval(script.textContent);
        const doc=page.window.document;
        assert.equal(doc.querySelector('link[rel="canonical"]').href,`https://aetherwing.net${path}`);
        assert.equal(doc.querySelector('[data-series][aria-pressed="true"]').dataset.series,league,'Built shared links must select their league');
        assert.equal(doc.querySelector('[data-calendar-toggle]').getAttribute('aria-expanded'),'true');
        assert.equal(doc.querySelectorAll('[data-calendar-list] .aw-calendar__event').length,synced.datasets['schedule-events'].filter(event=>event.league===league).length,'Direct full links must render every published entry');
      }finally{page.window.close();}
    }
    for(const [id,number] of editedNumbers) {
      const assignment=synced.datasets.drivers.find((entry)=>entry.id===id);
      assert.equal(assignment.number,number,'Content sync must retain published assignment numbers');
      const profile=new JSDOM(read(`drivers/${assignment.profile}/index.html`));
      const program=Array.from(profile.window.document.querySelectorAll('[data-profile-assignments] .profile-assignment')).find((row)=>row.querySelector('span').textContent===assignment.competition);
      assert.ok(program,`${id} program must render`);
      assert.equal(program.querySelector('strong').textContent,`#${number}`,'Production driver profiles must render the published number');
      profile.window.close();
    }
    const championships=new JSDOM(read('championships/index.html'),{runScripts:'outside-only'});
    const bothAwards=['CHASE LOCKED','REGULAR-SEASON CHAMPION'];
    const checkStandingsMetadata=(doc,mode)=>{
      const checkRow=(id,row,make,labels,chase=false)=>{
        const board=doc.querySelector(`[data-board="${id}"]`);
        const rows=Array.from(board.querySelectorAll(chase?'.standings-chase-panel .standing-row':':scope > .standings-board__rows > .standing-row'));
        const rendered=rows.find(node=>node.querySelector('strong')?.textContent.startsWith(`#${row.number} · ${row.driver}`));
        assert.ok(rendered,`${mode}: ${id} ${chase?'Chase':'regular'} ${row.driver} row renders`);
        const image=rendered.querySelector('.standing-row__make img');
        assert.equal(image?.getAttribute('alt'),make,`${mode}: published ${row.driver} manufacturer beats older result/number inference`);
        assert.equal(image?.getAttribute('src'),`/images/manufacturers/${make.toLowerCase()}.png`);
        assert.deepEqual(Array.from(rendered.querySelectorAll('[data-standing-status]'),node=>node.textContent),labels,`${mode}: manual awards remain explicit and synchronized`);
      };
      checkRow('nrrs',nrrsManual,'Cadillac',bothAwards);
      checkRow('kmart',kmartManual,'Ford',bothAwards);
      for(const chase of [false,true]){
        checkRow('sunoco',sunocoRegular('Will'),'Toyota',bothAwards,chase);
        checkRow('sunoco',sunocoRegular('Clutch'),'Chevrolet',[],chase);
      }
      const partTime=Array.from(doc.querySelectorAll('[data-board="kmart"] .standings-pt__driver')).find(node=>node.textContent.startsWith(`${ptMetadata.driver} · ${ptMetadata.points} PTS`));
      assert.ok(partTime,`${mode}: the same-name separate part-time car renders`);
      assert.equal(partTime.querySelector('img')?.getAttribute('alt'),'Toyota',`${mode}: a PT car does not inherit the regular car’s Ford manufacturer`);
      assert.equal(partTime.querySelector('img')?.getAttribute('src'),'/images/manufacturers/toyota.png');
    };
    checkStandingsMetadata(championships.window.document,'SSR');
    for(const [id,position] of [['nrrs',5],['kmart',6]]) {
      const cutoff=championships.window.document.querySelector(`[data-board="${id}"] .standings-cutoff`);
      assert.ok(cutoff,`${id} cutoff must render`);
      assert.equal(cutoff.previousElementSibling.querySelector('.standing-row__position').textContent,`P${position}`);
      assert.equal(cutoff.nextElementSibling.querySelector('.standing-row__position').textContent,`P${position+1}`);
    }
    assert.equal(championships.window.document.querySelector('[data-board="nrrs"] .standings-cutoff').textContent,'Chase cutoff · Top 5');
    const championshipScript=fs.readFileSync(join(cwd,'src/pages/championships/index.astro'),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(championshipScript,'Championship page must retain its published-data renderer');
    championships.window.eval(championshipScript);
    championships.window.dispatchEvent(new championships.window.CustomEvent('aetherwing:content',{detail:synced.datasets}));
    checkStandingsMetadata(championships.window.document,'live hydration');
    const clearedStandings=structuredClone(synced.datasets.standings);
    for(const board of clearedStandings)for(const row of [...board.rows,...(board.chaseRows||[])])Object.assign(row,{chaseLocked:false,regularSeasonChampion:false});
    championships.window.dispatchEvent(new championships.window.CustomEvent('aetherwing:content',{detail:{...synced.datasets,standings:clearedStandings}}));
    assert.equal(championships.window.document.querySelectorAll('[data-standing-status]').length,0,'Cleared manual awards disappear without points or Chase eligibility restoring them');
    championships.window.close();
    // The homepage has its own timing tower. Exercise its actual built markup
    // with an older Top 6 board, including both live-data loading orders.
    const towerScript=fs.readFileSync(join(cwd,'src/components/home/TimingTower.astro'),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(towerScript,'Homepage timing-tower script must be present');
    for(const mode of ['seed','cached','event']) {
      const home=new JSDOM(read('index.html'),{runScripts:'outside-only'});
      assert.equal(home.window.document.querySelector('[data-tower-cut]').textContent,'Chase cutoff · Top 5','Server-rendered legend must use Top 5');
      if(mode==='cached')home.window.__AETHERWING_CONTENT__=data;
      home.window.mountHomeStandings=mountHomeStandings;
      home.window.eval(towerScript.replace(/^\s*import .*;$/gm,''));
      if(mode==='event')home.window.dispatchEvent(new home.window.CustomEvent('aetherwing:content',{detail:data}));
      const tower=home.window.document.querySelector('[data-timing-tower]');
      const manualTowerRow=Array.from(tower.querySelectorAll('[data-tower-rows] > li')).find(row=>row.querySelector('strong')?.textContent===nrrsManual.driver);
      assert.ok(manualTowerRow,`${mode}: the manually awarded NRRS driver remains in the homepage tower`);
      assert.equal(manualTowerRow.querySelector('[data-standing-status]')?.textContent,bothAwards.join(' · '),`${mode}: homepage tower reflects manual awards even before Chase activation`);
      const cut=tower.querySelector('.is-cut');
      assert.equal(tower.querySelectorAll('.is-cut').length,1,`${mode}: show one cutoff line`);
      assert.equal(cut.previousElementSibling.querySelector('.aw-tower__pos').textContent,'5',`${mode}: divider must follow P5`);
      assert.equal(cut.querySelector('.aw-tower__pos').textContent,'6',`${mode}: divider must precede P6`);
      assert.equal(tower.querySelector('[data-tower-cut]').textContent,'Chase cutoff · Top 5',`${mode}: old metadata must not restore Top 6`);
      const teamAssignments=data.drivers.filter((entry)=>entry.competitionId==='nrrs'&&entry.affiliation==='aetherwing');
      const expected=nrrs.rows.filter((row,index)=>index<6||row.highlight||teamAssignments.some(entry=>String(entry.number)===String(row.number)&&standingIdentity(entry.displayName||entry.profile)===standingIdentity(row))).map((row)=>String(row.position).replace(/^P/i,''));
      assert.deepEqual(Array.from(tower.querySelectorAll('.aw-tower__pos'),(node)=>node.textContent),expected,`${mode}: retain leaders and Aetherwing cars below the cutoff`);
      home.window.close();
    }
    for(const path of ['news/index.html','news/publication-fixture-story/index.html'])assert.ok(read(path).includes('Publication Fixture Story'),`${path} must render the published story`);
    for(const path of ['index.html',`news/${lead.slug}/index.html`])assert.ok(read(path).includes('Publication Fixture Lead'),`${path} must render edits to the canonical featured story`);
    assert.ok(read('index.html').includes(`/news/${lead.slug}/`),'Homepage must still link to the canonical lead');
    // v3.0.0: the race hub also lists recent stories, so check the lead slot itself.
    const leadCard=(read('index.html').match(/<a[^>]*class="[^"]*hub-wire__lead[^"]*"[^>]*>[\s\S]*?<\/a>/)||[''])[0];
    assert.ok(leadCard.includes(`/news/${lead.slug}/`)&&!leadCard.includes('Publication Fixture Story'),'An unfeatured story must not replace the canonical homepage lead');
    for(const slug of [eventSlug(event),legacyEventSlug(event)]) {
      const html=read(`event/${slug}/index.html`);
      assert.ok(html.includes('Publication Fixture Race'),'Stable and legacy event routes must render the published race');
      assert.ok(html.includes(`https://aetherwing.net/event/${slug}/`),'Event share link must use its canonical page URL');
      assert.ok(html.includes('https://aetherwing.net/images/social/default-social.png'),'Race Weekend uses the current default social image');
    }
    for(const slug of new Set([eventSlug(historicalEvent),legacyEventSlug(historicalEvent)])){
      const page=new JSDOM(read(`event/${slug}/index.html`),{url:`https://aetherwing.net/event/${slug}/`,runScripts:'outside-only'});
      try{
        const entries=()=>Array.from(page.window.document.querySelectorAll('[data-event-entries] .profile-assignment'),row=>({driver:row.querySelector('span').textContent,number:row.querySelector('strong').textContent}));
        const expected=historicalEntries.map(entry=>({driver:entry.driver,number:`#${entry.number}`}));
        assert.deepEqual(entries(),expected,'Server-rendered Race Entries must use the approved historical custom identities');
        const script=Array.from(page.window.document.scripts).find(script=>script.textContent.includes('const applyLiveEvent='));
        assert.ok(script,'Built event page must retain its live published event renderer');
        page.window.document.querySelector('[data-event-entries]').replaceChildren();
        page.window.eval(script.textContent);
        page.window.dispatchEvent(new page.window.CustomEvent('aetherwing:content',{detail:synced.datasets}));
        assert.deepEqual(entries(),expected,'Live event hydration must preserve historical #32 instead of substituting current #28');
      }finally{page.window.close();}
    }
    console.log('PASS: rebuild rendered schedule, historical custom entries, manual standings manufacturers/awards and separate PT cars through SSR/live hydration, homepage manual awards, stable/legacy event routes and share metadata, result, win, milestone, roster edit, featured story and article route.');
  } catch(error) {
    failure=error;
  }
  // Run restoration even after an assertion fails, and preserve both errors if
  // restoration fails too. An exception in finally must not hide the first one.
  try {
    fs.writeFileSync(overlayFile,baselineOverlay);
    await build();
    assert.equal(fs.readFileSync(overlayFile,'utf8'),baselineOverlay,'Canonical build baseline must be idempotent');
    assert.ok(!fs.existsSync(join(cwd,'dist/news/publication-fixture-story')),'Rebuild must remove fixture-only articles');
    assert.ok(!fs.existsSync(join(cwd,'dist/schedule/fixture-league')),'Rebuild must remove fixture-only league routes');
    assert.ok(!read('history/index.html').includes('Publication Fixture'),'Fixture results/wins/milestones must not survive restoration');
    assert.ok(!read('index.html').includes('Publication Fixture Lead'),'Fixture feature must not survive restoration');
    assert.ok(!read('drivers/hailey/index.html').includes('Publication Fixture Primary'),'Fixture sponsor titles must not survive restoration');
    console.log('PASS: canonical baseline restored and rebuilt without fixture artifacts.');
  } catch(error) {
    failure=failure?new AggregateError([failure,error],'Publication assertions and baseline restoration both failed'):error;
  }
  if(failure)throw failure;
} finally {
  try {
    if(server?.listening)await new Promise((resolve,reject)=>server.close((error)=>error?reject(error):resolve()));
  } finally {
    fs.rmSync(scratch,{recursive:true,force:true});
  }
}

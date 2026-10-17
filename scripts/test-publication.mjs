import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventSlug, legacyEventSlug } from '../src/lib/schedule-events.mjs';
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
  const event={...data['schedule-events'][0],date:'2027-02-01',title:'Publication Fixture Race',eventId:'publication-fixture-race'};
  data['schedule-events'].push(event);
  data.results.unshift({...data.results[0],scheduleId:'2099-01-01-kmart-publication-fixture-result',date:'2099-01-01',title:'Publication Fixture Result',track:'Fixture Raceway',headline:'PUBLICATION FIXTURE RESULT',summary:'Publication fixture result summary.',entries:[{...data.results[0].entries.find((entry)=>entry.assignmentId==='clutch-kmart'),finish:2}]});
  data.results=normalize('results',data.results);
  data.wins.push({league:'NRRS',track:'Publication Fixture Win',driver:'Wispy',date:'Sep 18, 2026'});
  data.milestones.push({date:'Sep 18, 2026',title:'Publication Fixture Milestone',description:'Publication fixture milestone text.'});
  data['roster-profiles'][0].name='Publication Fixture Driver';
  const editedNumbers=new Map([['wispy-nrrs','08'],['wispy-uarl-d1','83'],['rocky-uarl-d1','84'],['burgertown-uarl-d1','85']]);
  for(const entry of data.drivers)if(editedNumbers.has(entry.id))entry.number=editedNumbers.get(entry.id);
  const nrrs=data.standings.find((board)=>board.id==='nrrs');nrrs.cutoffAfter=6;nrrs.cutoffLabel='Chase cutoff · Top 6';
  // The current release deliberately pins Portland as the featured story in
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
    for(const text of ['Publication Fixture Result','Publication Fixture Milestone','Publication Fixture Win'])assert.ok(read('history/index.html').includes(text),`History must render ${text}`);
    assert.ok(read('drivers/index.html').includes('Publication Fixture Driver'));
    const synced=JSON.parse(fs.readFileSync(overlayFile,'utf8'));
    for(const [id,number] of editedNumbers) {
      const assignment=synced.datasets.drivers.find((entry)=>entry.id===id);
      assert.equal(assignment.number,number,'Content sync must retain published assignment numbers');
      const profile=new JSDOM(read(`drivers/${assignment.profile}/index.html`));
      const program=Array.from(profile.window.document.querySelectorAll('[data-profile-assignments] .profile-assignment')).find((row)=>row.querySelector('span').textContent===assignment.competition);
      assert.ok(program,`${id} program must render`);
      assert.equal(program.querySelector('strong').textContent,`#${number}`,'Production driver profiles must render the published number');
      profile.window.close();
    }
    const championships=new JSDOM(read('championships/index.html'));
    for(const [id,position] of [['nrrs',5],['kmart',6]]) {
      const cutoff=championships.window.document.querySelector(`[data-board="${id}"] .standings-cutoff`);
      assert.ok(cutoff,`${id} cutoff must render`);
      assert.equal(cutoff.previousElementSibling.querySelector('.standing-row__position').textContent,`P${position}`);
      assert.equal(cutoff.nextElementSibling.querySelector('.standing-row__position').textContent,`P${position+1}`);
    }
    assert.equal(championships.window.document.querySelector('[data-board="nrrs"] .standings-cutoff').textContent,'Chase cutoff · Top 5');
    championships.window.close();
    // The homepage has its own timing tower. Exercise its actual built markup
    // with an older Top 6 board, including both live-data loading orders.
    const towerScript=fs.readFileSync(join(cwd,'src/components/home/TimingTower.astro'),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
    assert.ok(towerScript,'Homepage timing-tower script must be present');
    for(const mode of ['seed','cached','event']) {
      const home=new JSDOM(read('index.html'),{runScripts:'outside-only'});
      assert.equal(home.window.document.querySelector('[data-tower-cut]').textContent,'Chase cutoff · Top 5','Server-rendered legend must use Top 5');
      if(mode==='cached')home.window.__AETHERWING_CONTENT__=data;
      home.window.eval(towerScript);
      if(mode==='event')home.window.dispatchEvent(new home.window.CustomEvent('aetherwing:content',{detail:data}));
      const tower=home.window.document.querySelector('[data-timing-tower]');
      const cut=tower.querySelector('.is-cut');
      assert.equal(tower.querySelectorAll('.is-cut').length,1,`${mode}: show one cutoff line`);
      assert.equal(cut.previousElementSibling.querySelector('.aw-tower__pos').textContent,'5',`${mode}: divider must follow P5`);
      assert.equal(cut.querySelector('.aw-tower__pos').textContent,'6',`${mode}: divider must precede P6`);
      assert.equal(tower.querySelector('[data-tower-cut]').textContent,'Chase cutoff · Top 5',`${mode}: old metadata must not restore Top 6`);
      const teamNumbers=new Set(data.drivers.filter((entry)=>entry.competitionId==='nrrs'&&entry.affiliation==='aetherwing').map((entry)=>String(entry.number)));
      const expected=nrrs.rows.filter((row,index)=>index<6||row.highlight||teamNumbers.has(String(row.number))).map((row)=>String(row.position).replace(/^P/i,''));
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
    console.log('PASS: rebuild rendered schedule, stable/legacy event routes and share metadata, result, win, milestone, roster edit, featured story and article route.');
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
    assert.ok(!read('history/index.html').includes('Publication Fixture'),'Fixture results/wins/milestones must not survive restoration');
    assert.ok(!read('index.html').includes('Publication Fixture Lead'),'Fixture feature must not survive restoration');
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

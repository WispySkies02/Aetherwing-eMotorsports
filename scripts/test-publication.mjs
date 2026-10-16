import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { eventSlug, legacyEventSlug } from '../src/lib/schedule-events.mjs';

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
  assert.match(css,/html\.menu-open\s*\{\s*overflow:\s*hidden\s*;?\s*\}/,'Compiled mobile menu rule must lock page scrolling');
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
    for(const path of ['news/index.html','news/publication-fixture-story/index.html'])assert.ok(read(path).includes('Publication Fixture Story'),`${path} must render the published story`);
    for(const path of ['index.html',`news/${lead.slug}/index.html`])assert.ok(read(path).includes('Publication Fixture Lead'),`${path} must render edits to the canonical featured story`);
    assert.ok(read('index.html').includes(`/news/${lead.slug}/`),'Homepage must still link to the canonical lead');
    assert.ok(!read('index.html').includes('Publication Fixture Story'),'An unfeatured story must not replace the canonical homepage lead');
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

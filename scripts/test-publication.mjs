import fs from 'node:fs';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const {seeds}=createRequire(import.meta.url)('../netlify/lib/_content.cjs');
const overlayFile=new URL('../src/data/admin-content.json',import.meta.url);
const baselineOverlay=fs.readFileSync(overlayFile,'utf8');
const data=seeds();
data['schedule-events'].push({...data['schedule-events'][0],date:'2027-02-01',title:'Publication Fixture Race'});
data.results[0]={...data.results[0],scheduleId:'2099-01-01-nrrs-publication-fixture-result',date:'2099-01-01',title:'Publication Fixture Result',track:'Fixture Raceway',headline:'PUBLICATION FIXTURE RESULT',summary:'Publication fixture result summary.',entries:data.results[0].entries.map((entry,i)=>i?entry:{...entry,finish:2})};
data.wins.push({league:'NRRS',track:'Publication Fixture Win',driver:'Wispy',date:'Sep 18, 2026'});
data.milestones.push({date:'Sep 18, 2026',title:'Publication Fixture Milestone',description:'Publication fixture milestone text.'});
data['roster-profiles'][0].name='Publication Fixture Driver';
data.news=data.news.map((s)=>({...s,featured:false}));
data.news.unshift({...data.news[0],slug:'publication-fixture-story',title:'Publication Fixture Story',dateIso:'2027-01-01',date:'January 1, 2027',featured:true});
const server=http.createServer((_request,response)=>{response.setHeader('content-type','application/json');response.end(JSON.stringify({version:1,revision:999,datasets:data}));});
await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
const cwd=new URL('../',import.meta.url);
async function build(extra={}) {
  return new Promise((resolve,reject)=>{
    const child=spawn(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{cwd,shell:false,env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1',AETHERWING_CONTENT_URL:'',...extra}});
    let output='';child.stdout.on('data',(d)=>output+=d);child.stderr.on('data',(d)=>output+=d);child.on('error',reject);child.on('exit',(code)=>code===0?resolve():reject(new Error(output.slice(-5000))));
  });
}
try {
  await build({AETHERWING_CONTENT_URL:`http://127.0.0.1:${server.address().port}/content`});
  const read=(p)=>fs.readFileSync(new URL(`dist/${p}`,cwd),'utf8');
  assert.ok(read('schedule/index.html').includes('Publication Fixture Race'));
  assert.ok(read('wins-history/index.html').includes('Publication Fixture Result'));
  assert.ok(read('wins-history/index.html').includes('Publication Fixture Milestone'));
  assert.ok(read('wins-history/index.html').includes('Publication Fixture Win'));
  assert.ok(read('drivers/index.html').includes('Publication Fixture Driver'));
  assert.ok(read('news/index.html').includes('Publication Fixture Story'));
  assert.ok(read('index.html').includes('Publication Fixture Story'));
  assert.ok(read('news/publication-fixture-story/index.html').includes('Publication Fixture Story'));
  assert.ok(read('event/2027-02-01-nrrs-publication-fixture-race/index.html').includes('/images/social/schedule-social.png'));
  console.log('PASS: actual rebuild rendered schedule addition and share route, result, win total/archive, milestone, roster edit, featured story and its new article route.');
} finally {
  server.close();
  fs.writeFileSync(overlayFile,baselineOverlay);
  await build();
  assert.equal(fs.readFileSync(overlayFile,'utf8'),baselineOverlay);
  console.log('Baseline restored and rebuilt; no fixture edits remain in deliverables.');
}

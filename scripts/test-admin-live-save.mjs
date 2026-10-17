import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';

const require=createRequire(import.meta.url);
const content=require('../netlify/lib/_content.cjs');
const seeds=content.seeds();
// Existing publications use all these display forms, regardless of the type
// of positionChange in the first bundled row. Neither points nor other fields
// should become permissive when movement is corrected.
for(const list of ['rows','chaseRows']) {
  for(const value of [undefined,null,'','—','-','NEW','new',0,2,-3,'+2','-3','0','▲ 2','▼3']) {
    const boards=structuredClone(seeds.standings);
    if(list==='chaseRows')boards[0].chaseRows=[structuredClone(boards[0].rows[0])];
    boards[0][list][0].positionChange=value;
    assert.equal(content.validate('standings',boards),'',`${list} must accept movement ${JSON.stringify(value)}`);
  }
  for(const value of [false,{},[],NaN,Infinity,'sideways','Infinity']) {
    const boards=structuredClone(seeds.standings);
    if(list==='chaseRows')boards[0].chaseRows=[structuredClone(boards[0].rows[0])];
    boards[0][list][0].positionChange=value;
    assert.notEqual(content.validate('standings',boards),'',`${list} must reject malformed movement`);
  }
}
const invalidPoints=structuredClone(seeds.standings);invalidPoints[0].rows[0].points='2201';
assert.notEqual(content.validate('standings',invalidPoints),'','Points must remain numeric');
const invalidBoolean=structuredClone(seeds.standings);invalidBoolean[0].rows[0].highlight='yes';
assert.notEqual(content.validate('standings',invalidBoolean),'','Unrelated seed types must remain strict');

// Run the production browser path through the real Identity bridge, Admin
// handler, Blobs SDK and public handler. Only external Identity/Blobs are mocked;
// no localhost/localStorage saving or live network writes are allowed.
const boards=structuredClone(seeds.standings);
boards[0].rows[0].positionChange='';
boards[0].rows[1].positionChange='NEW';
const sunoco=boards.find((board)=>board.id==='sunoco');
sunoco.rows[0].positionChange='—';
const initial={version:1,revision:10,published:{standings:boards},drafts:{},history:[]};
const storage=new Map();let etag=0,writeFailure=false,publicStale=false;
globalThis.netlifyBlobsContext=Buffer.from(JSON.stringify({siteID:'test-site',token:'fixture-token',edgeURL:'https://blobs.fixture',uncachedEdgeURL:'https://blobs.fixture'})).toString('base64');
delete process.env.AETHERWING_BUILD_HOOK;
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input instanceof Request?input.url:input),headers=new Headers(options.headers);
  if(url.hostname==='aetherwing.net'&&url.pathname==='/.netlify/identity/user') {
    assert.equal(headers.get('authorization'),'Bearer fixture-jwt');
    return Response.json({id:'fixture-admin',app_metadata:{roles:['admin']}});
  }
  assert.equal(url.hostname,'blobs.fixture','Tests must never contact live storage or build hooks');
  const prior=storage.get(url.pathname)||{value:initial,etag:'fixture-0'};
  if(options.method?.toUpperCase()==='PUT') {
    // An acknowledged but unpersisted write must fail the real readback guard.
    // Avoid HTTP retry delays when testing the browser's error state.
    if(writeFailure)return new Response('',{status:200,headers:{etag:'unpersisted-write'}});
    if(headers.get('if-match')!==prior.etag)return new Response('',{status:412});
    const next={value:JSON.parse(options.body),etag:`fixture-${++etag}`};
    storage.set(url.pathname,next);
    return new Response('',{status:200,headers:{etag:next.etag}});
  }
  return Response.json(prior.value,{headers:{etag:prior.etag}});
};
const admin=(await import('../netlify/functions/site-admin.mjs')).default;
const publicData=(await import('../netlify/functions/site-data.mjs')).default;
const root=new URL('../',import.meta.url);
const dom=new JSDOM(fs.readFileSync(new URL('public/admin/index.html',root),'utf8'),{url:'https://aetherwing.net/admin/',runScripts:'outside-only'});
const w=dom.window;
w.structuredClone=structuredClone;w.AbortSignal=AbortSignal;w.matchMedia=()=>({matches:true});
w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};
const prompts=[],actions=[];
w.confirm=(message)=>{prompts.push(String(message));return true;};
w.netlifyIdentity={currentUser:()=>({app_metadata:{roles:['admin']},jwt:async()=>'fixture-jwt'}),on:()=>{}};
w.fetch=async(url,options={})=>{
  const target=new URL(String(url),'https://aetherwing.net');
  if(target.pathname==='/.netlify/functions/site-admin') {
    actions.push(options.body?JSON.parse(options.body).action:'readback');
    return admin(new Request(target,options));
  }
  assert.equal(target.pathname,'/api/site-content','Unexpected browser request');
  return publicStale?Response.json({revision:0,datasets:{}}):publicData(new Request(target));
};
const $=(selector)=>w.document.querySelector(selector);
const waitFor=async(predicate,label)=>{
  const deadline=Date.now()+8000;
  while(!predicate()) {
    assert.ok(Date.now()<deadline,`${label}: ${$('[data-content-status]').textContent}`);
    await new Promise(resolve=>setTimeout(resolve,15));
  }
};
const feedback=()=>$('[data-content-save-feedback]').textContent;
const field=(path)=>Array.from(w.document.querySelectorAll('[data-field-path]')).find((el)=>el.dataset.fieldPath===JSON.stringify(path));
const publicStandings=async()=>{
  const response=await publicData(new Request('https://aetherwing.net/api/site-content'));
  assert.equal(response.status,200);return (await response.json()).datasets.standings;
};
const publish=async(verified=true)=>{
  $('[data-content-publish]').click();
  await waitFor(()=>!$('[data-content-editor]').inert,'Publication must finish');
  assert.match(feedback(),verified?/^PUBLISHED · revision \d+ · public feed verified/:/^PUBLISHED TO ADMIN ONLY · public feed NOT confirmed/);
};
try {
  w.eval(fs.readFileSync(new URL('public/admin/content-admin.js',root),'utf8'));
  $('[data-admin-dataset="standings"]').click();
  await waitFor(()=>field(['rows',0,'points']),'Standings must load from the authenticated API');
  const points=boards[0].rows[0].points+37;
  const csv=['Position,number,driver,points,gap',...boards[0].rows.slice(0,3).map((row,index)=>`${index+1},${row.number},${row.driver},${points-index*10},${index?`-${index*10}`:'LEADER'}`)].join('\n');
  $('[data-standings-import-text]').value=csv;
  $('[data-standings-import-preview-button]').click();
  assert.match($('[data-standings-import-preview]').textContent,/3 ROWS READY/);
  $('[data-standings-import-apply]').click();
  await publish();
  const published=await publicStandings();
  assert.equal(published[0].rows.length,3);
  assert.equal(published[0].rows[0].points,points,'CSV changes must reach the public handler');
  assert.equal(published[0].rows[1].positionChange,'NEW','Existing NEW movement must survive a CSV without movement');
  assert.equal(published.find((board)=>board.id==='sunoco').rows[0].positionChange,'—','Another series must not block an NRRS save');
  assert.deepEqual(actions.slice(0,3),['readback','publish','readback'],'Publish must save unsaved CSV edits and read them back');
  $('[data-admin-dataset="wins"]').click();
  await waitFor(()=>$('[data-content-dataset]').value==='wins','Tab must switch after publish');
  assert.ok(!prompts.some((message)=>message.includes('Leave unsaved changes')),'Verified publication must not prompt on tab exit');
  $('[data-admin-dataset="standings"]').click();
  await waitFor(()=>field(['rows',0,'points']),'Standings must reopen');
  field(['rows',0,'points']).value=String(points+1);
  field(['rows',0,'points']).dispatchEvent(new w.Event('input',{bubbles:true}));
  $('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  await waitFor(()=>!$('[data-content-editor]').inert,'Private draft must finish');
  assert.match(feedback(),/^PRIVATE DRAFT SAVED/);
  assert.equal((await publicStandings())[0].rows[0].points,points,'A private draft must not change the public site');
  await publish();
  assert.equal((await publicStandings())[0].rows[0].points,points+1);

  // The public Championships widget must consume the saved feed in both event
  // orderings, rather than remaining on build-time standings.
  const widgetScript=fs.readFileSync(new URL('src/pages/championships/index.astro',root),'utf8').match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(widgetScript);
  for(const cached of [false,true]) {
    const page=new JSDOM('<div data-standings-root>OLD STANDINGS</div>',{runScripts:'outside-only'});
    const datasets={standings:await publicStandings()};
    if(cached)page.window.__AETHERWING_CONTENT__=datasets;
    page.window.eval(widgetScript);
    if(!cached)page.window.dispatchEvent(new page.window.CustomEvent('aetherwing:content',{detail:datasets}));
    assert.ok(page.window.document.querySelector('[data-board="nrrs"]').textContent.includes((points+1).toLocaleString('en-US')+' PTS'));
    page.window.close();
  }

  // A stale public response must not be reported as verified publication.
  publicStale=true;
  await publish(false);
  publicStale=false;
  field(['rows',0,'points']).value=String(points+2);
  field(['rows',0,'points']).dispatchEvent(new w.Event('input',{bubbles:true}));
  writeFailure=true;
  const oldConsoleError=console.error;console.error=()=>{};
  try {
    $('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
    await waitFor(()=>!$('[data-content-editor]').inert,'Failed draft must finish');
  } finally {console.error=oldConsoleError;}
  assert.match(feedback(),/^DRAFT NOT SAVED/);
  assert.equal((await publicStandings())[0].rows[0].points,points+1,'Failed storage writes must not change public standings');
  $('[data-admin-dataset="wins"]').click();
  assert.ok(prompts.some((message)=>message.includes('Leave unsaved changes')),'Real failed saves must retain the unsaved guard');
  console.log('PASS: authenticated NRRS CSV preview/apply/publish, storage readback, public standings hydration, private drafts, stale-feed detection and failed-save warnings. No live content changed.');
} finally {
  dom.window.close();globalThis.fetch=nativeFetch;
}

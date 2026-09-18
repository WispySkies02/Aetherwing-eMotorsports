import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const require=createRequire(import.meta.url);
const root=new URL('../',import.meta.url);
const storage=new Map();
let storageDown=false, etagCounter=0, buildCount=0;
globalThis.netlifyBlobsContext=Buffer.from(JSON.stringify({siteID:'test-site',token:'fixture-token',edgeURL:'https://blobs.fixture',uncachedEdgeURL:'https://blobs.fixture'})).toString('base64');
process.env.AETHERWING_BUILD_HOOK='https://api.netlify.com/build_hooks/fixture';
const nativeFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input instanceof Request?input.url:input);
  const headers=new Headers(options.headers);
  if(url.pathname==='/.netlify/identity/user') {
    const role=headers.get('authorization')?.replace('Bearer ','');
    if(role==='expired')return new Response('{}',{status:401});
    return Response.json({id:'fixture-user',email:'admin@example.test',app_metadata:{roles:role==='fake-role'?[]:[role]},user_metadata:{roles:['admin']}});
  }
  if(url.hostname==='api.netlify.com'&&url.pathname.startsWith('/build_hooks/')){buildCount++;return Response.json({ok:true});}
  if(url.hostname==='blobs.fixture') {
    if(storageDown)return new Response('Fixture storage unavailable',{status:400});
    const key=url.pathname,prior=storage.get(key);
    if(options.method?.toUpperCase()==='PUT') {
      if(headers.get('if-none-match')==='*'&&prior || headers.has('if-match')&&headers.get('if-match')!==prior?.etag)return new Response('',{status:412});
      const value=JSON.parse(options.body),etag=`fixture-${++etagCounter}`;
      storage.set(key,{value,etag});return new Response('',{status:200,headers:{etag}});
    }
    if(!prior)return new Response('Not found',{status:404});
    return Response.json(prior.value,{headers:{etag:prior.etag}});
  }
  throw new Error(`Unexpected outbound request in test: ${url.hostname}`);
};
const paintAdmin=(await import('../netlify/functions/paint-admin.mjs')).default;
const paintData=(await import('../netlify/functions/paint-data.mjs')).default;
const siteAdmin=(await import('../netlify/functions/site-admin.mjs')).default;
const siteData=(await import('../netlify/functions/site-data.mjs')).default;
async function call(handler,body,role='admin',method=body?'POST':'GET') {
  const response=await handler(new Request('https://aetherwing.net/.netlify/functions/test',{method,headers:{...(role?{authorization:`Bearer ${role}`} : {}),'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})}));
  return {status:response.status,body:await response.json()};
}
const paint={slug:'fixture-paint',sponsor:'Fixture Paint',leagues:['nrrs'],leagueName:'NRRS',driver:'Hailey',username:'Wispy (@Aokikoto)',number:'32',manufacturer:'Toyota',body:'Camry',image:'https://example.test/paint.png',schemeId:'123456789',tags:[],special:[]};
assert.equal((await call(paintAdmin,{action:'savePaint',paint},null)).status,403);
assert.equal((await call(paintAdmin,{action:'savePaint',paint},'fake-role')).status,403);
assert.equal((await call(paintAdmin,{action:'savePaint',paint},'expired')).status,403);
assert.equal((await call(paintAdmin,{action:'savePaint',paint:{...paint,image:'javascript:alert(1)'}})).status,400);
let response=await call(paintAdmin,{action:'savePaint',paint,status:'draft'});
assert.equal(response.status,200);assert.equal(response.body.registry.drafts.length,1);
assert.equal((await call(paintAdmin)).body.registry.drafts.length,1);
assert.equal((await call(paintData,undefined,null)).body.paints.length,0);
response=await call(paintAdmin,{action:'savePaint',paint,priorSlug:paint.slug,status:'published'},'paint-admin');
assert.equal(response.status,200);
assert.equal((await call(paintData,undefined,null)).body.paints.length,1);
assert.equal((await call(paintAdmin,{action:'savePaint',paint})).status,409);
assert.equal((await call(paintAdmin,{action:'setFeature',feature:{slug:paint.slug,series:'NRRS',race:'Fixture 400',track:'Fixture Raceway',date:'2099-01-01'}})).status,200);
assert.equal((await call(paintData,undefined,null)).body.feature.slug,paint.slug);
assert.equal((await call(paintAdmin,{action:'savePaint',paint:{...paint,slug:'fixture-renamed'},priorSlug:paint.slug})).status,200);
assert.equal((await call(paintData,undefined,null)).body.feature.slug,'fixture-renamed');
assert.equal((await call(paintAdmin,{action:'archivePaint',slug:'fixture-renamed'})).status,200);
response=await call(paintData,undefined,null);assert.equal(response.body.paints.length,0);assert.equal(response.body.feature,null);
assert.equal((await call(paintAdmin,{action:'archivePaint',slug:'fixture-renamed',archived:false})).status,200);
assert.equal((await call(siteAdmin,undefined,'paint-admin')).status,403);
response=await call(siteAdmin);assert.equal(response.status,200);
const seeds=response.body.seeds;
const content=require('../netlify/lib/_content.cjs');
for(const [key,data] of Object.entries(seeds))assert.equal(content.validate(key,data),'',key);
let revision=response.body.registry.revision;
for(const [key,data] of Object.entries(seeds)) {
  const draft=await call(siteAdmin,{action:'saveDraft',dataset:key,data,revision});assert.equal(draft.status,200,`${key} draft`);revision=draft.body.registry.revision;
  assert.equal((await call(siteData,undefined,null)).body.datasets[key],undefined,'Draft must remain private');
  const published=await call(siteAdmin,{action:'publish',dataset:key,revision});assert.equal(published.status,200,`${key} publish`);revision=published.body.registry.revision;
  assert.deepEqual((await call(siteData,undefined,null)).body.datasets[key],data);
}
assert.equal(buildCount,Object.keys(seeds).length);
assert.equal((await call(siteAdmin,{action:'saveDraft',dataset:'wins',data:seeds.wins,revision:0})).status,409);
assert.notEqual(content.validate('news',seeds.news.map((s)=>({...s,featured:false}))), '');
assert.notEqual(content.validate('roster-profiles', [{...seeds['roster-profiles'][0],name:'<script>alert(1)</script>'}]),'');
const oldConsole=console.error;console.error=()=>{};storageDown=true;
assert.equal((await call(paintAdmin)).status,500);
assert.equal((await call(siteData,undefined,null)).status,503);storageDown=false;console.error=oldConsole;
// Read-only Paint Booth functions must consume central publication and preserve sharing.
const publicRegistry=(await call(paintData,undefined,null)).body;
const boothRoot=process.env.AETHERWING_PAINT_PROJECT?path.resolve(process.env.AETHERWING_PAINT_PROJECT):fileURLToPath(new URL('../../aetherwing_paint_public/',import.meta.url));
if (fs.existsSync(path.join(boothRoot,'netlify/functions/paint-data.cjs'))) {
globalThis.fetch=async(input)=>{assert.equal(String(input),'https://aetherwing.net/api/paints');return Response.json(publicRegistry);};
const boothData=require(path.join(boothRoot,'netlify/functions/paint-data.cjs'));
const boothShare=require(path.join(boothRoot,'netlify/functions/paint-share.cjs'));
assert.equal((await boothData.handler({httpMethod:'GET'})).statusCode,200);
assert.equal((await boothShare.handler({httpMethod:'GET',queryStringParameters:{slug:'fixture-renamed'}})).statusCode,200);
assert.equal((await boothShare.handler({httpMethod:'GET',queryStringParameters:{slug:'missing'}})).statusCode,404);
globalThis.fetch=async()=>{throw Error('Fixture outage');};console.error=()=>{};
assert.equal((await boothData.handler({httpMethod:'GET'})).statusCode,503);console.error=oldConsole;
} else console.log('Booth integration test skipped: set AETHERWING_PAINT_PROJECT to the extracted Booth project to include it.');
globalThis.fetch=nativeFetch;
for(const filename of ['paint-ops-admin.js','content-admin.js'])new vm.Script(fs.readFileSync(new URL(`public/admin/${filename}`,root),'utf8'));
console.log('PASS: verified-login/role guards, persisted draft/publish/reload, paint feature/rename/archive, all 11 content sections, private drafts, stale-write protection, safe storage errors, public booth proxy and dynamic shares. Tests used mock Identity/storage, not the live account.');

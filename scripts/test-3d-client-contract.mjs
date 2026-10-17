import {readFileSync} from 'node:fs';
import {Script,createContext} from 'node:vm';
import assert from 'node:assert/strict';
const source=readFileSync(new URL('../public/admin/paint-3d-admin.js',import.meta.url),'utf8');
const handlers={};
const count={textContent:'',style:{}};
const list={innerHTML:'',addEventListener:(type,fn)=>handlers[type]=fn};
const search={value:'',addEventListener:()=>{}};
const filter={value:'all',addEventListener:()=>{}};
const refresh={addEventListener:()=>{}};
const root={querySelector:q=>({'[data-3d-count]':count,'[data-3d-list]':list,'[data-3d-search]':search,'[data-3d-filter]':filter,'[data-3d-refresh]':refresh}[q]||null)};
const paint={slug:'fixture-paint',sponsor:'Fixture',number:'28',leagues:['nrrs'],body:'BBR D1 Toyota',bodyModel:'nrrs-toyota',manufacturer:'Toyota',image:'example.png'};
let savedPayload=null;
const api={getPaints:()=>[paint],getToken:async()=> 'test-jwt',request:async(action,payload)=>{assert.equal(action,'save3dSettings');savedPayload=payload;return {ok:true}}};
const imageBytes=new Uint8Array(4096).fill(173);const file={type:'image/png',name:'fixture.png',size:imageBytes.length,slice:(begin,end)=>({arrayBuffer:async()=>imageBytes.slice(begin,end).buffer})};
class FakeElement{closest(q){if(q==='[data-3d-save],[data-3d-clear]')return this;if(q==='[data-3d-row]')return row;return null}}
const button=new FakeElement();button.hasAttribute=()=>false;button.disabled=false;
const row={dataset:{'3dRow':'fixture-paint'},querySelector:q=>q==='[data-3d-body]'?{value:'nrrs-toyota'}:q==='[data-3d-file]'?{files:[file]}:null};
const hash='b'.repeat(64);
const requests=[];
let dropNextChunk=false;
const fetch=async(url,options)=>{
 assert.equal(url,'/.netlify/functions/paint-3d-upload');assert.match(options.headers.authorization,/^Bearer /);
 const body=JSON.parse(options.body);requests.push(body);
 if(body.action==='start')return {ok:true,json:async()=>({id:'a'.repeat(36),count:1,chunkSize:8192})};
 if(body.action==='chunk'&&dropNextChunk){dropNextChunk=false;throw new TypeError('Load failed');}
 if(body.action==='chunk')return {ok:true,json:async()=>({ok:true,index:0})};
 if(body.action==='finish')return {ok:true,json:async()=>({ok:true,key:hash})};
 throw Error('Unexpected upload request');
};
const context=createContext({window:{AetherwingPaintAdmin:api,addEventListener:()=>{}},document:{querySelector:q=>q==='[data-panel="3d"]'?root:null},location:{hostname:'aetherwing.net'},URL,Element:FakeElement,fetch,btoa,console,TypeError,setTimeout:(fn)=>setTimeout(fn,0)});
new Script(source,{filename:'paint-3d-admin.js'}).runInContext(context);
await handlers.click({target:button});
assert.equal(requests.map(r=>r.action).join(','),'start,chunk,finish');
assert.ok(savedPayload,'Upload must call save3dSettings');
assert.equal(savedPayload.textureKey,hash,'The uploaded content hash must be sent in the textureKey field, not key');
assert.ok(!Object.hasOwn(savedPayload,'key'),'The backend does not recognize an unqualified key field');
assert.equal(savedPayload.bodyModel,'nrrs-toyota');
assert.equal(savedPayload.liveryTexture,'');
// A dropped request (Safari: "Load failed") is retried instead of ending the upload.
requests.length=0;savedPayload=null;dropNextChunk=true;button.disabled=false;
await handlers.click({target:button});
assert.equal(requests.map(r=>r.action).join(','),'start,chunk,chunk,finish','A dropped chunk is sent again');
assert.ok(savedPayload,'The upload still saves after a dropped request');
console.log('PASS: 3D Admin upload sends the correct textureKey to save3dSettings after uploading, and retries dropped requests.');

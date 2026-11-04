import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';

const require=createRequire(import.meta.url),siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const root=new URL('../',import.meta.url),content=require('../netlify/lib/_content.cjs'),seed=content.seeds();
const html=fs.readFileSync(new URL('public/admin/index.html',root),'utf8');
const scripts=['paint-ops-admin.js','admin-shell.js','content-admin.js'].map(name=>fs.readFileSync(new URL(`public/admin/${name}`,root),'utf8'));
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
const unhandled=[];
const onUnhandled=error=>unhandled.push(error?.message||String(error));
process.on('unhandledRejection',onUnhandled);

function backend(){
 const published=structuredClone(seed);
 published.partners.push({name:'Upload Fixture Partner',role:'Team Partner',featured:false,description:'Existing approved fixture description.',url:'https://example.test/partner',logo:'https://example.test/original-partner.png',tags:['Fixture'],category:'Fixture Partner'});
 published['driver-portfolios'].push({id:'upload-fixture',profile:'',name:'Upload Fixture Driver',handle:'@upload_fixture',label:'Driver Brand / Livery Portfolio',order:99,brands:[{name:'Fixture Sponsor',logo:'https://example.test/original-brand.png',order:1,sponsorTitle:'Primary Sponsor'},{name:'Second Fixture Sponsor',logo:'https://example.test/second-brand.png',order:2,sponsorTitle:'Associate Sponsor'}]});
 let stored={version:1,revision:0,published,drafts:{},history:[]};
 const historyKeys=['results','wins','standings','milestones','news','drivers','roster-profiles','alliances'],historical=Object.fromEntries(historyKeys.map(key=>[key,structuredClone(published[key])]));
 const module={exports:{}},actions=[];
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('netlify/lib/_site-admin.cjs',root),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:structuredClone(stored),etag:'upload-test-etag'}),write:async(next,etag)=>{assert.equal(etag,'upload-test-etag');stored=structuredClone(next);}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Logo upload tests must not trigger an external request or deployment'));
 const actor={clientContext:{user:{email:'logo-fixture@example.test',app_metadata:{roles:['admin']}}}};
 return {get stored(){return structuredClone(stored);},actions,assertHistorical(){for(const key of historyKeys)assert.deepEqual(stored.published[key],historical[key],`${key}: uploading sponsor artwork must not alter unrelated published data`);},async request(method='GET',body){if(body)actions.push(JSON.parse(body));const result=await module.exports.handler({httpMethod:method,body},actor);return new Response(result.body,{status:result.statusCode,headers:result.headers});}};
}

// Browser decoding and canvas are the only upload operations stubbed here.
// File selection, validation, async/race handling, DOM updates, serialization,
// authenticated handler validation and public readback all use application code.
function imageBrowser(w){
 const blobs=new Map(),plans=new Map(),pending=new Map(),decoded=[],revoked=[];let serial=0,fastTimeout=false,lastDecodedFile;
 const timer=w.setTimeout.bind(w);
 w.setTimeout=(callback,delay,...args)=>timer(callback,fastTimeout&&delay===15000?5:delay,...args);
 w.URL.createObjectURL=file=>{if(plans.get(file.name)?.blobError)throw new Error('Selected image blob could not be opened.');const url=`blob:fixture-${++serial}`;blobs.set(url,file);return url;};
 w.URL.revokeObjectURL=url=>{revoked.push(url);blobs.delete(url);};
 w.Image=class{
  naturalWidth=1200;naturalHeight=400;
  set src(url){this.file=blobs.get(url);assert.ok(this.file,'Decode must use the chosen file');const plan=plans.get(this.file.name)||{};if(plan.zeroDimensions){this.naturalWidth=0;this.naturalHeight=0;}
   const finish=()=>{lastDecodedFile=this.file;decoded.push(this.file.name);if(plan.decodeError)this.onerror?.(new Error('Corrupt image'));else this.onload?.();};
   if(plan.deferred){pending.set(this.file.name,finish);}else if(!plan.timeout)queueMicrotask(finish);
  }
 };
 w.HTMLCanvasElement.prototype.getContext=function(){if(plans.get(lastDecodedFile?.name)?.canvasUnavailable)return null;const canvas=this;return {drawImage(image){canvas.file=image.file;const plan=plans.get(canvas.file?.name)||{};if(plan.canvasError)throw new Error('Canvas drawing failed.');},getImageData:()=>({data:new Uint8ClampedArray(16).fill(255)})};};
 w.HTMLCanvasElement.prototype.toDataURL=function(){const plan=plans.get(this.file?.name)||{};if(plan.encodingError)throw new Error('Canvas encoding failed.');if(plan.tooLarge)return `data:image/webp;base64,${'A'.repeat(50010)}`;if(plan.invalidEncoding)return 'data:,';return `data:image/webp;base64,${Buffer.from(this.file?.name||'fixture').toString('base64')}`;};
 return {plans,decoded,revoked,get pending(){return pending;},set fastTimeout(value){fastTimeout=value;},release(name){const finish=pending.get(name);assert.ok(finish,`${name} should have a pending decode`);pending.delete(name);finish();},expected:name=>`data:image/webp;base64,${Buffer.from(name).toString('base64')}`};
}

async function editor(server,section){
 const dom=new JSDOM(html,{url:`https://aetherwing.net/admin/?section=${section}`,runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,$=selector=>w.document.querySelector(selector),callbacks={},errors=[];let user=null;
 Object.assign(w,{structuredClone,AbortSignal,scrollTo:()=>{}});w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:true,addEventListener:()=>{}});w.confirm=()=>true;
 w.addEventListener('error',event=>errors.push(event.message));
 w.netlifyIdentity={on:(name,fn)=>{callbacks[name]=fn;},currentUser:()=>user,close:()=>{},open:()=>{},logout:()=>{}};
 w.fetch=async(input,options={})=>{const url=new URL(String(input),w.location.href),p=url.pathname;
  if(p==='/.netlify/functions/site-admin')return server.request(options.method||'GET',options.body);
  if(p==='/api/site-content')return Response.json({version:1,revision:server.stored.revision,datasets:require('../netlify/lib/_site-data.cjs')._test.mergeCanonical(server.stored.published)});
  if(p==='/.netlify/functions/paint-admin')return Response.json({registry:{paints:[],drafts:[],feature:null,revisions:[]}});
  if(p==='/data/site-admin-seed.json')return Response.json(seed);
  assert.equal(url.origin,w.location.origin,'No upload-test requests may leave the mocked application');assert.ok(p.startsWith('/data/'),`Unexpected mock request: ${p}`);return new Response(fs.readFileSync(new URL(`public${p}`,root),'utf8'));
 };
 const images=imageBrowser(w);scripts.forEach(script=>w.eval(script));await tick();
 assert.equal($('[data-workspace]').hidden,true,'Uploads remain protected by Admin authentication');
 user={email:'logo-fixture@example.test',app_metadata:{roles:['admin']},jwt:async()=>'mock-logo-token'};callbacks.login(user);
 const wait=async(predicate,label)=>{for(let attempt=0;attempt<180;attempt++){if(predicate())return;await tick();}assert.fail(`${label}: ${$('[data-content-status]').textContent}`);};
 await wait(()=>!$('[data-content-editor]').hidden&&$('[data-content-dataset]').value===section,'Restore logo editor after sign-in');
 const fixtureIndex=()=>[...w.document.querySelectorAll('[data-entry]')].find(button=>button.textContent.includes(section==='partners'?'Upload Fixture Partner':'Upload Fixture Driver'))?.dataset.entry;
 const selectFixture=()=>{const index=fixtureIndex();assert.notEqual(index,undefined,'Fixture entry exists');$(`[data-entry="${index}"]`).click();};selectFixture();
 const field=path=>[...w.document.querySelectorAll('[data-field-path]')].find(el=>el.dataset.fieldPath===JSON.stringify(path));
 const set=(path,value)=>{const el=field(path);assert.ok(el,`Missing ${JSON.stringify(path)} field`);el.value=value;el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 const selector=section==='partners'?'[data-partner-logo-upload]':'[data-portfolio-logo-upload]';
 const picker=()=>$(`${selector}`),logoPath=section==='partners'?['logo']:['brands',0,'logo'];
 const feedback=input=>input.closest('.admin-field').querySelector('[data-logo-upload-status]');
 const upload=(name,type='image/png',plan={},input=picker())=>{images.plans.set(name,plan);const file=new w.File(['fixture bytes'],name,{type});if(plan.oversize)Object.defineProperty(file,'size',{value:5000001});Object.defineProperty(input,'files',{configurable:true,value:[file]});Object.defineProperty(input,'value',{configurable:true,writable:true,value:`C:\\fakepath\\${name}`});input.dispatchEvent(new w.Event('change',{bubbles:true}));return {input,file,status:feedback(input)};};
 const completed=async(upload,state)=>{await wait(()=>upload.status?.dataset.state===state,`${upload.file.name}: local ${state} feedback`);assert.match(upload.status.textContent,new RegExp(upload.file.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),'Feedback identifies the selected file');assert.equal(upload.input.value,'','Reset the picker so choosing the same file triggers another change');};
 const save=async()=>{$('[data-content-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await wait(()=>!$('[data-content-editor]').inert&&/^PRIVATE DRAFT SAVED/.test($('[data-content-save-feedback]').textContent),'Save private draft');if(fixtureIndex()!==undefined)selectFixture();};
 const publish=async()=>{$('[data-content-publish]').click();await wait(()=>!$('[data-content-editor]').inert&&/^PUBLISHED · revision \d+ · public feed verified/.test($('[data-content-save-feedback]').textContent),'Publish and verify mocked public feed');if(fixtureIndex()!==undefined)selectFixture();};
 const row=(state='published')=>server.stored[state][section].find(row=>section==='partners'?row.name==='Upload Fixture Partner':row.id==='upload-fixture');
 return {w,$,images,errors,section,selector,picker,logoPath,field,set,feedback,upload,completed,save,publish,row,wait,selectFixture,close:()=>w.close()};
}

try{
 for(const section of ['partners','driver-portfolios']){
  const server=backend();let e=await editor(server,section);
  try{
   const original=e.row().logo??e.row().brands[0].logo;
   // Each accepted source type uses the same stable, local feedback path.
   for(const [extension,type] of [['png','image/png'],['jpg','image/jpeg'],['webp','image/webp']]){
    const name=`${section}-selected.${extension}`,input=e.picker(),container=input.closest('.admin-field'),sibling=e.field(section==='partners'?['url']:['brands',0,'sponsorTitle']);
    const metadata=section==='partners'?'https://example.test/approved-partner':'Associate Sponsor';e.set(section==='partners'?['url']:['brands',0,'sponsorTitle'],metadata);
    const transfer=e.upload(name,type,{deferred:true});assert.ok(transfer.status,'Both upload controls need field-local feedback');assert.equal(transfer.status.getAttribute('aria-live'),'polite');assert.equal(transfer.status.dataset.state,'working','Feedback begins synchronously');assert.ok(transfer.status.textContent.includes(name),'Show filename as soon as the file is chosen');
    await e.wait(()=>e.images.pending.has(name),'Decode started');e.images.release(name);await e.completed(transfer,'success');assert.match(transfer.status.textContent,/Ready to publish/i);
    assert.equal(e.picker(),input,'Successful optimization must not replace the picker');assert.equal(input.closest('.admin-field'),container,'Keep preview and feedback in the same field');assert.equal(e.field(section==='partners'?['url']:['brands',0,'sponsorTitle']),sibling,'Preserve unrelated editable nodes');
    assert.equal(e.field(e.logoPath).value,e.images.expected(name));assert.equal(container.querySelector('.portfolio-logo-preview').getAttribute('src'),e.images.expected(name));
    await e.save();const draft=e.row('drafts');assert.equal(section==='partners'?draft.logo:draft.brands[0].logo,e.images.expected(name));assert.equal(section==='partners'?draft.url:draft.brands[0].sponsorTitle,metadata,'Logo upload preserves the other unsaved metadata');
    if(extension==='png')assert.equal(e.row().logo??e.row().brands[0].logo,original,'Saving a draft alone leaves the public logo unchanged');
    e.close();e=await editor(server,section);assert.equal(e.field(e.logoPath).value,e.images.expected(name),'Reload recovers the saved upload');await e.publish();const published=e.row();assert.equal(section==='partners'?published.logo:published.brands[0].logo,e.images.expected(name));assert.equal(section==='partners'?published.url:published.brands[0].sponsorTitle,metadata);assert.equal(server.stored.drafts[section],undefined);
    const feed=await (await e.w.fetch('/api/site-content')).json();const publicRow=feed.datasets[section].find(row=>section==='partners'?row.name==='Upload Fixture Partner':row.id==='upload-fixture');assert.equal(section==='partners'?publicRow.logo:publicRow.brands[0].logo,e.images.expected(name),'Verified public feed retains uploaded data and metadata');
   }
   // A hosted URL remains equally usable and preserves sponsor metadata.
   const hosted='https://example.test/replacement-logo.png';e.set(e.logoPath,hosted);await e.save();await e.publish();assert.equal(e.row().logo??e.row().brands[0].logo,hosted);
   const existing=e.field(e.logoPath).value;
   for(const [name,type,plan] of [
    ['wrong-type.gif','image/gif',{}],['too-large.png','image/png',{oversize:true}],['corrupt-image.jpg','image/jpeg',{decodeError:true}],['canvas-failure.png','image/png',{canvasError:true}],['canvas-unavailable.png','image/png',{canvasUnavailable:true}],['encoding-failure.webp','image/webp',{encodingError:true}],['complex-image.png','image/png',{tooLarge:true}],['invalid-encoding.png','image/png',{invalidEncoding:true}],['zero-dimensions.png','image/png',{zeroDimensions:true}],['blob-failure.png','image/png',{blobError:true}],
   ]){
    const transfer=e.upload(name,type,plan);assert.equal(transfer.status.dataset.state,'working');assert.ok(transfer.status.textContent.includes(name));await e.completed(transfer,'error');assert.ok(transfer.status.textContent.length>name.length+5,'Explain the upload failure locally');assert.equal(e.field(e.logoPath).value,existing,'A rejected file must preserve the prior stored logo');assert.equal(transfer.input.closest('.admin-field').querySelector('img').getAttribute('src'),existing,'A rejected file must preserve the prior preview');
   }
   // Decode timeout is accelerated only for this explicit browser-only fixture.
   e.images.fastTimeout=true;const timed=e.upload('never-decoded.png','image/png',{timeout:true});await e.completed(timed,'error');assert.match(timed.status.textContent,/time|long|finish/i);assert.equal(e.field(e.logoPath).value,existing);e.images.fastTimeout=false;
   // Pre-optimization exceptions must also reach the same visible error path.
   const malformed=e.field(section==='partners'?['name']:['name']),path=malformed.dataset.fieldPath;malformed.dataset.fieldPath='{invalid-json';const badCommit=e.upload('commit-error.png');await e.completed(badCommit,'error');assert.equal(e.field(e.logoPath).value,existing);malformed.dataset.fieldPath=path;
   if(section==='driver-portfolios')for(const invalid of ['not-json','["brands",999,"logo"]']){const input=e.picker(),path=input.dataset.logoPath;input.dataset.logoPath=invalid;const transfer=e.upload('missing-brand.png','image/png',{},input);await e.completed(transfer,'error');assert.equal(e.field(e.logoPath).value,existing);input.dataset.logoPath=path;}
   // Same-file retries work on the same picker after any failure.
   const retried=e.upload('corrupt-image.jpg','image/jpeg');await e.completed(retried,'success');assert.equal(e.field(e.logoPath).value,e.images.expected('corrupt-image.jpg'));

   // Saving/publishing cannot accidentally record the old logo while decoding.
   const pendingName=`${section}-pending.png`,pending=e.upload(pendingName,'image/png',{deferred:true});await e.wait(()=>e.images.pending.has(pendingName),'Pending publication fixture');const writes=server.actions.length;
   e.$('[data-content-form]').dispatchEvent(new e.w.Event('submit',{bubbles:true,cancelable:true}));await e.wait(()=>/wait.*logo|optimization.*finish/i.test(`${e.$('[data-content-status]').textContent} ${e.$('[data-content-save-feedback]').textContent}`),'Pending upload blocks draft save');assert.equal(server.actions.length,writes);
   e.$('[data-content-publish]').click();await tick();assert.equal(server.actions.length,writes,'Pending upload also blocks publication');e.images.release(pendingName);await e.completed(pending,'success');await e.save();assert.equal(e.row('drafts').logo??e.row('drafts').brands[0].logo,e.images.expected(pendingName));

   // A manually edited URL is a newer choice than the still-decoding file.
   const urlPending=e.upload('url-edited-during-upload.png','image/png',{deferred:true});await e.wait(()=>e.images.pending.has('url-edited-during-upload.png'),'URL replacement fixture');const manualUrl='https://example.test/chosen-while-loading.png';e.set(e.logoPath,manualUrl);e.images.release('url-edited-during-upload.png');await e.completed(urlPending,'error');assert.match(urlPending.status.textContent,/URL.*chang|changed.*URL/i);assert.equal(e.field(e.logoPath).value,manualUrl,'A late decode must preserve the newer URL');await e.save();assert.equal(e.row('drafts').logo??e.row('drafts').brands[0].logo,manualUrl);

   // The newest selection owns the preview/status even if the older decode ends last.
   const old=e.upload('older-logo.png','image/png',{deferred:true}),newer=e.upload('newer-logo.png','image/png',{deferred:true});await e.wait(()=>e.images.pending.has('older-logo.png')&&e.images.pending.has('newer-logo.png'),'Both decode requests started');e.images.release('newer-logo.png');await e.completed(newer,'success');await e.save();assert.equal(e.row('drafts').logo??e.row('drafts').brands[0].logo,e.images.expected('newer-logo.png'),'An obsolete pending request must not block saving the newest ready image');e.images.release('older-logo.png');await tick();assert.equal(e.field(e.logoPath).value,e.images.expected('newer-logo.png'));assert.ok(newer.status.textContent.includes('newer-logo.png'));assert.equal(newer.status.dataset.state,'success','Stale completion must not replace the latest success');
   // Entry switches cancel the previous request instead of updating an off-screen record.
   const oldValue=e.field(e.logoPath).value,switched=e.upload('switched-entry.png','image/png',{deferred:true});await e.wait(()=>e.images.pending.has('switched-entry.png'),'Switch fixture decode');e.$('[data-entry="0"]').click();const otherValue=e.field(e.logoPath).value;e.images.release('switched-entry.png');await tick();assert.equal(e.field(e.logoPath).value,otherValue,'Switching records cannot write to the newly selected record');e.selectFixture();assert.equal(e.field(e.logoPath).value,oldValue,'An off-screen request is canceled');
   // Section navigation also invalidates the original request.
   const departed=e.upload('switched-section.png','image/png',{deferred:true});await e.wait(()=>e.images.pending.has('switched-section.png'),'Section fixture decode');e.$('[data-admin-dataset="site"]').click();await e.wait(()=>e.$('[data-content-dataset]').value==='site','Switch away');e.images.release('switched-section.png');await tick();e.$(`[data-admin-dataset="${section}"]`).click();await e.wait(()=>e.$('[data-content-dataset]').value===section,'Return to logo editor');e.selectFixture();assert.notEqual(e.field(e.logoPath).value,e.images.expected('switched-section.png'),'A previous section cannot receive a stale upload');
   assert.deepEqual(e.errors,[],'Upload errors must be caught, not browser errors');server.assertHistorical();
  }finally{e.close();}
 }

 // Removing a brand/record while it decodes cannot attach its file to the next index.
 for(const section of ['partners','driver-portfolios']){
  const server=backend(),e=await editor(server,section);
  try{
   const name='removed-target.png',transfer=e.upload(name,'image/png',{deferred:true});await e.wait(()=>e.images.pending.has(name),'Removed-target decode');
   if(section==='partners')e.$('[data-content-remove]').click();else e.$('[data-array-remove=\'["brands",0]\']').click();
   const nextLogo=e.field(e.logoPath)?.value;e.images.release(name);await e.wait(()=>e.$('[data-content-status]').textContent.includes(name),'Removed target reports filename');assert.match(e.$('[data-content-status]').textContent,/chang|remov|again|cancel/i);assert.equal(e.field(e.logoPath)?.value,nextLogo,'Removed target cannot overwrite the replacement record or brand');await e.save();const draft=server.stored.drafts[section];assert.ok(!JSON.stringify(draft).includes(e.images.expected(name)));if(section==='driver-portfolios'){const row=draft.find(row=>row.id==='upload-fixture');assert.equal(row.brands.length,1);assert.equal(row.brands[0].name,'Second Fixture Sponsor');assert.equal(row.brands[0].logo,'https://example.test/second-brand.png');assert.equal(row.brands[0].sponsorTitle,'Associate Sponsor');}server.assertHistorical();assert.deepEqual(e.errors,[]);
  }finally{e.close();}
 }
 assert.deepEqual(unhandled,[],'No rejected upload promise may escape visible error handling');
 console.log('PASS: both sponsor-logo pickers show synchronous filename/status, optimize PNG/JPEG/WebP in place, retain metadata through authenticated mocked draft/publish/readback, expose validation/decode/canvas/commit/path/timeout errors, retry the same file, block pending saves, and reject stale or removed targets. No live writes or deployments.');
}finally{process.off('unhandledRejection',onUnhandled);}

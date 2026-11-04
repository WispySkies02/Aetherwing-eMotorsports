import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),root=new URL('../',import.meta.url);
const content=require('../netlify/lib/_content.cjs'),seed=content.seeds();
const siteRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
const {mergeCanonical}=require('../netlify/lib/_site-data.cjs')._test;
const modules=process.env.PAINT_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
const origin='https://logo-admin.fixture.test',publicRoot=path.resolve(new URL('public/',root).pathname);
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const previousImage='<svg xmlns="http://www.w3.org/2000/svg" width="160" height="70"><rect width="160" height="70" fill="#28344f"/></svg>';
const protectedKeys=['drivers','roster-profiles','alliances','results','wins','standings','milestones','news'];
const withoutLogo=value=>Object.fromEntries(Object.entries(value).filter(([key])=>key!=='logo'));

// Exercise application validation/draft/publication handlers with an in-memory
// store. Browser requests are intercepted; no live account, storage or hook is used.
function backend(){
 const published=structuredClone(seed);
 published.partners.push({name:'Upload Browser Partner',role:'Team Partner',featured:false,description:'Approved browser fixture copy.',url:'https://example.test/partner',logo:'https://example.test/original-partner.png',tags:['Fixture'],category:'Fixture Partner'});
 published['driver-portfolios'].push({id:'upload-browser-fixture',profile:'',name:'Upload Browser Driver',handle:'@upload_browser',label:'Driver Brand / Livery Portfolio',order:99,brands:[{name:'Browser Sponsor',logo:'https://example.test/original-brand.png',order:1,sponsorTitle:'Primary Sponsor'},{name:'Second Browser Sponsor',logo:'https://example.test/second-brand.png',order:2,sponsorTitle:'Associate Sponsor'}]});
 let stored={version:1,revision:0,published,drafts:{},history:[]};
 const initial=structuredClone(published),module={exports:{}},actions=[];
 new Function('require','module','exports','process','fetch',fs.readFileSync(new URL('netlify/lib/_site-admin.cjs',root),'utf8'))(name=>name==='./_content.cjs'?{...content,read:async()=>({registry:structuredClone(stored),etag:'logo-browser-etag'}),write:async(next,etag)=>{assert.equal(etag,'logo-browser-etag');stored=structuredClone(next);}}:siteRequire(name),module,module.exports,{env:{}},async()=>assert.fail('Browser logo tests must never call an external service or deployment hook'));
 return {get stored(){return structuredClone(stored);},initial,actions,
  async request(method,body){if(body)actions.push(JSON.parse(body));return module.exports.handler({httpMethod:method,body},{clientContext:{user:{email:'browser-fixture@example.test',app_metadata:{roles:['admin']}}}});},
  publicData:()=>({version:1,revision:stored.revision,datasets:mergeCanonical(structuredClone(stored.published))}),
  checkUnrelated(){for(const key of protectedKeys)assert.deepEqual(stored.published[key],initial[key],`${key}: logo work must not change unrelated published records`);}
 };
}

async function editor(browser,width,section,server){
 const context=await browser.newContext({viewport:{width,height:1000},hasTouch:width<700,reducedMotion:'reduce'}),page=await context.newPage(),errors=[],unexpected=[];
 page.on('pageerror',error=>errors.push(error.message));page.on('dialog',dialog=>dialog.accept());
 await context.addInitScript(()=>{
  let account=null;const listeners={};
  window.netlifyIdentity={currentUser:()=>account,on:(name,callback)=>{(listeners[name]??=[]).push(callback);if(name==='init')queueMicrotask(()=>callback(account));},close:()=>{},logout:()=>{account=null;(listeners.logout||[]).forEach(fn=>fn());},open:()=>{account={email:'browser-fixture@example.test',app_metadata:{roles:['admin']},jwt:async()=>'logo-browser-jwt'};(listeners.login||[]).forEach(fn=>fn(account));}};
 });
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url()),p=url.pathname;
  if(url.origin!==origin){
   if(request.resourceType()==='image')return route.fulfill({contentType:'image/svg+xml',body:previousImage});
   if(request.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Isolated preview fixture</body></html>'});
   return route.abort();
  }
  if(p==='/'&&request.resourceType()==='document')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body>Isolated seasonal preview fixture</body></html>'});
  if(p==='/.netlify/functions/site-admin'){
   assert.equal(request.headers().authorization,'Bearer logo-browser-jwt','The browser must use the authenticated Admin request path');
   const result=await server.request(request.method(),request.postData()||undefined);
   return route.fulfill({status:result.statusCode,headers:result.headers,body:result.body});
  }
  if(p==='/api/site-content')return route.fulfill({contentType:'application/json',body:JSON.stringify(server.publicData())});
  if(p==='/.netlify/functions/paint-admin'){
   assert.equal(request.method(),'GET','The separate Paint Booth registry remains read-only');
   return route.fulfill({contentType:'application/json',body:JSON.stringify({registry:{paints:[],drafts:[],feature:null,revisions:[]}})});
  }
  let file=path.resolve(publicRoot,`.${p}`);
  if(file!==publicRoot&&!file.startsWith(publicRoot+path.sep)){unexpected.push(p);return route.abort();}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{unexpected.push(p);return route.fulfill({status:404,body:'Fixture file not found'});}
 });
 await page.goto(`${origin}/admin/?section=${section}`,{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('[data-workspace]').isVisible(),false,'Editing remains behind the mocked sign-in gate');
 await page.locator('[data-login]').click();
 await page.waitForFunction(expected=>!document.querySelector('[data-content-editor]').hidden&&document.querySelector('[data-content-dataset]').value===expected,section);
 await page.locator('[data-entry]').filter({hasText:section==='partners'?'Upload Browser Partner':'Upload Browser Driver'}).evaluate(button=>button.click());
 await page.evaluate(()=>{
  window.__logoChangeFeedback=[];
  document.addEventListener('change',event=>{if(!event.target.matches('[data-partner-logo-upload],[data-portfolio-logo-upload]'))return;const status=event.target.closest('.admin-field').querySelector('[data-logo-upload-status]');window.__logoChangeFeedback.push({state:status?.dataset.state,text:status?.textContent});});
 });
 const selector=section==='partners'?'[data-partner-logo-upload]':'[data-portfolio-logo-upload]',logoPath=section==='partners'?['logo']:['brands',0,'logo'];
 const picker=()=>page.locator(selector).first(),valueField=()=>page.locator(`[data-field-path='${JSON.stringify(logoPath)}']`),field=()=>valueField().locator('..'),feedback=()=>field().locator('[data-logo-upload-status]');
 const fixtureRow=rows=>rows.find(row=>section==='partners'?row.name==='Upload Browser Partner':row.id==='upload-browser-fixture');
 const target=row=>section==='partners'?row:row.brands[0];
 const fixtures=await page.evaluate(()=>Object.fromEntries([['png','image/png','#4a6fff'],['jpg','image/jpeg','#e0c891'],['webp','image/webp','#29bd7a']].map(([extension,type,color])=>{const c=document.createElement('canvas');c.width=320;c.height=110;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle='#101723';ctx.font='bold 36px sans-serif';ctx.fillText(extension.toUpperCase(),24,70);return [extension,{type,data:c.toDataURL(type)}];})));
 const payload=(name,type,buffer)=>({name,mimeType:type,buffer});
 const fixture=extension=>{const {type,data}=fixtures[extension];assert.ok(data.startsWith(`data:${type};base64,`),'Input fixtures use their actual PNG/JPEG/WebP format');return payload(`native-logo.${extension}`,type,Buffer.from(data.split(',')[1],'base64'));};
 return {context,page,errors,unexpected,picker,valueField,field,feedback,fixture,payload,fixtureRow,target,
  async upload(file,state='success'){
   await picker().scrollIntoViewIfNeeded();const previous=await valueField().inputValue();
   await picker().setInputFiles(file);
   await page.waitForFunction(expected=>{const input=document.querySelector(expected.selector),status=input.closest('.admin-field').querySelector('[data-logo-upload-status]');return status.dataset.state===expected.state&&status.textContent.includes(expected.name);},{selector,state,name:file.name});
   assert.equal(await feedback().isVisible(),true,'Feedback stays beside the selected file field');
   assert.ok((await feedback().textContent()).includes(file.name),'Feedback identifies the selected filename');
   assert.equal(await picker().inputValue(),'','The file control resets so the same file can be retried');
   const captured=await page.evaluate(()=>window.__logoChangeFeedback.at(-1));assert.equal(captured.state,'working','The filename is acknowledged synchronously during the native file-change event');assert.ok(captured.text.includes(file.name));
   if(state==='success'){
    const value=await valueField().inputValue();assert.match(value,/^data:image\/webp;base64,/);assert.ok(value.length<=50000,'Existing optimized-logo cap is preserved');
    assert.ok((await feedback().textContent()).includes('Ready to publish'));
    const preview=field().locator('.portfolio-logo-preview');assert.ok(await preview.evaluate(async(img,expected)=>{await img.decode();return img.src===expected&&img.naturalWidth>0&&img.naturalHeight>0;},value),'The actual optimized output decodes as the selected preview');
    return value;
   }
   assert.equal(await valueField().inputValue(),previous,'A failed upload preserves the old image field');assert.equal(await field().locator('.portfolio-logo-preview').getAttribute('src'),previous,'A failed upload preserves the old preview');assert.equal(await picker().getAttribute('aria-invalid'),'true');return previous;
  }
 };
}

let browser;
try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,390,320])for(const section of ['partners','driver-portfolios']){
  const server=backend(),e=await editor(browser,width,section,server);
  try{
   const original=e.fixtureRow(server.initial[section]),metadata=withoutLogo(e.target(original));
   let latest;
   for(const extension of ['png','jpg','webp'])latest=await e.upload(e.fixture(extension));
   assert.equal(server.actions.length,0,'Selecting files does not publish or save automatically');
   await e.upload(e.payload('invalid.svg','image/svg+xml',Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>')),'error');assert.match(await e.feedback().textContent(),/PNG.*JPG.*WebP/);
   const corrupt=e.payload('corrupt.png','image/png',Buffer.from('not a PNG image'));
   await e.upload(corrupt,'error');await e.upload(corrupt,'error');assert.match(await e.feedback().textContent(),/could not be read|image/i);
   await e.upload(e.payload('oversized.png','image/png',Buffer.alloc(5000001)),'error');assert.match(await e.feedback().textContent(),/5 MB/);
   // Retry the same filename with a valid image after the earlier decoder error.
   const valid=e.fixture('png');latest=await e.upload({...valid,name:'corrupt.png'});
   await e.page.locator('[data-content-form] button[type="submit"]').click();
   await e.page.waitForFunction(()=>document.querySelector('[data-content-save-feedback]').textContent.startsWith('PRIVATE DRAFT SAVED'));
   const saved=e.target(e.fixtureRow(server.stored.drafts[section]));assert.ok(saved.logo===latest,'The decoded output is exactly the draft saved through Admin');assert.deepEqual(withoutLogo(saved),metadata,'Draft serialization retains sponsor identity, order, title and partner metadata');
   assert.deepEqual(server.stored.published[section],server.initial[section],'Saving a private logo draft leaves public sponsor data unchanged');
   await e.page.reload({waitUntil:'domcontentloaded'});await e.page.locator('[data-login]').click();await e.page.waitForFunction(expected=>document.querySelector('[data-content-dataset]').value===expected,section);
   await e.page.locator('[data-entry]').filter({hasText:section==='partners'?'Upload Browser Partner':'Upload Browser Driver'}).evaluate(button=>button.click());assert.ok((await e.valueField().inputValue())===latest,'Reopening the editor loads the private draft image');
   await e.page.locator('[data-content-publish]').click();await e.page.waitForFunction(()=>document.querySelector('[data-content-save-feedback]').textContent.startsWith('PUBLISHED ·'));
   const published=e.fixtureRow(server.stored.published[section]);assert.ok(e.target(published).logo===latest,'Explicit publication keeps the selected image');assert.deepEqual(withoutLogo(e.target(published)),metadata,'Explicit publication retains sponsor metadata');
   if(section==='driver-portfolios')assert.deepEqual(published.brands[1],original.brands[1],'The other sponsor remains unchanged');
   server.checkUnrelated();assert.deepEqual(e.errors,[],'No browser errors or unhandled upload rejections');assert.deepEqual(e.unexpected,[],'All requests stayed in known isolated fixtures');
   console.log(`PASS: ${width}px ${section}: native PNG/JPEG/WebP decode and WebP preview, immediate inline status, invalid/corrupt/oversize preservation, same-file retry, authenticated mocked draft/reload/publication and intact metadata.`);
  }finally{await e.context.close();}
 }
}finally{await browser?.close();}

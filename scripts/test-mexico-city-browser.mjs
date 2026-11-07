import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';

const require=createRequire(import.meta.url),seed=require('../netlify/lib/_content.cjs').seeds();
const slug='bell-eyes-championship-mexico-city',story=seed.news.find(item=>item.slug===slug);
assert.ok(story,'The approved Mexico City article must be included in the source catalog');
const canonical=`https://aetherwing.net/news/${slug}/`,origin='https://mexico-city.fixture.test',dist=path.resolve('dist');
const modules=process.env.ADMIN_BROWSER_TEST_MODULES||'/opt/codex/runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=await import(pathToFileURL(path.join(modules,'playwright-core/index.mjs')));
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
const before=new Date('2026-11-07T17:00:00Z'),start=Date.parse('2026-11-10T01:30:00Z');
const old=structuredClone(seed);old.news=old.news.filter(item=>item.slug!==slug);
const quotes=[
 'It would certainly put to rest my doubts on my performance lately and my worth as a competitor.',
 "If I don't get it this week, there's next week.",
 'Did I stay home and lean on this insurance? No. I still come out and run my races and add to this. I was right behind Will anyways, I was going to pass him regardless.',
 'Well, as race director and league owner, it did hurt that I had some issues I had to deal with. As a competitor, everything went fantastic for me, I hope that same rhythm and momentum comes with me to Mexico City.',
 "I certainly will, however I won't do any dirty work for a win.",
 'It being a road course, all I really want is to be with everyone and have battles on the track and not be a spectator that transitions in to a nobody.',
 'I appreciate everyone for all of their support, the best is still yet to come!'
];
const ordinary="Just try my best, I know I am not going to go out there and put on a spectacular performance, but if I worry about my own race and not worry about the regular season championship, I'll be fine.";
const clean=value=>String(value||'').replace(/\s+/g,' ').trim(),withoutQuotes=value=>clean(value).replace(/^["“]|["”]$/g,'');
const occurrences=(text,part)=>text.split(part).length-1;
const remaining=page=>page.locator('[data-mx-countdown-units]').evaluate(el=>{const read=name=>Number(el.querySelector(`[data-mx-unit="${name}"]`).textContent.trim());return read('days')*86400+read('hours')*3600+read('minutes')*60+read('seconds');});
const readingTime=page=>page.locator('[data-mx-reading-time]').textContent().then(text=>Number(text.match(/\d+/)?.[0]));
let browser;

async function open(width,{cache=false,native=true,noJS=false}={}){
 const context=await browser.newContext({viewport:{width,height:900},hasTouch:width<700,reducedMotion:'reduce',javaScriptEnabled:!noJS});
 if(!noJS)await context.grantPermissions(['clipboard-read','clipboard-write'],{origin});
 const page=await context.newPage(),errors=[],external=[];let release,fail=cache;
 page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
 if(!noJS){await page.clock.install({time:before});await context.addInitScript(({cache,old,native})=>{
  if(cache)localStorage.setItem('aetherwing-publication-v1',JSON.stringify({revision:80,savedAt:'2026-11-07T16:00:00Z',datasets:old}));else localStorage.clear();
  window.__mexicoShares=[];window.__mexicoShareCancel=false;
  Object.defineProperty(navigator,'share',{configurable:true,value:native?async data=>{window.__mexicoShares.push(data);if(window.__mexicoShareCancel)throw new DOMException('Share cancelled','AbortError');}:undefined});
 },{cache,old,native});}
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());assert.equal(request.method(),'GET','Article tests cannot write to live services');
  if(url.origin!==origin){if(request.resourceType()==='document'&&['x.com','twitter.com'].includes(url.hostname)){external.push(url.href);return route.fulfill({contentType:'text/html',body:'<!doctype html><title>Isolated share destination</title>'});}return route.abort();}
  if(url.pathname==='/api/site-content'){
   if(fail)return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Publication fixture temporarily unavailable"}'});
   if(!cache)await new Promise(resolve=>{release=resolve;});
   return route.fulfill({contentType:'application/json',body:JSON.stringify({revision:150,datasets:cache?seed:old})});
  }
  if(url.pathname==='/api/track-weather')return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Weather fixture unavailable"}'});
  try{let file=path.resolve(dist,`.${decodeURIComponent(url.pathname)}`);assert.ok(file.startsWith(dist+path.sep));if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{return route.fulfill({status:404,body:''});}
 });
 await page.goto(`${origin}/news/${slug}/`,{waitUntil:'domcontentloaded'});
 return{page,context,errors,external,release:()=>release?.(),recover:()=>{fail=false;},get pending(){return Boolean(release);}};
}

async function assertCopy(page){
 assert.equal(clean(await page.locator('h1').textContent()),story.title);
 const root=page.locator('[data-mx-feature]'),editorial=clean(await root.locator('[data-mx-editorial]').textContent());
 for(const section of story.sections)for(const paragraph of section.paragraphs){const approved=withoutQuotes(paragraph);assert.equal(occurrences(editorial,approved),1,`Approved copy appears once: ${approved.slice(0,90)}`);}
 const designated=root.locator('[data-mx-quote]:not([data-quote-style="inline"])');assert.equal(await designated.count(),7);assert.equal(await root.locator('[data-mx-quote][data-quote-style="featured"]').count(),3);assert.equal(await root.locator('[data-mx-quote][data-quote-style="standard"]').count(),4);assert.equal(await root.locator('[data-mx-quote][data-quote-style="inline"]').count(),1);
 assert.deepEqual(await designated.locator('p').allTextContents().then(texts=>texts.map(withoutQuotes)),quotes);assert.deepEqual(await designated.locator('cite').allTextContents().then(texts=>texts.map(text=>/Hailey Bell/.test(text))),Array(7).fill(true));assert.equal(occurrences(editorial,ordinary),1);assert.match(editorial,/"I worry about my race and do what I need to do," Bell said\. "If I worry about other stuff then that's when I mess myself up\."/);
 assert.doesNotMatch(await root.textContent(),/PULL QUOTE \d|CODEX REQUEST|FEATURED LARGE QUOTATION|NRRS.*No\. 28 Cadillac/i);
 const fields={event:'Corona Mexico 250',date:'Monday, November 9, 2026',time:'8:30 PM ET',track:'Autódromo Hermanos Rodríguez',location:'Mexico City, Mexico',series:'Kmart Auto Parts Series — Season 2',round:'Round 12',driver:'Hailey Bell',car:'No. 15 Dodge',team:'StarClutch Racing (SCR)',configuration:'2025 NASCAR layout'};
 for(const [key,value]of Object.entries(fields))assert.equal(clean(await root.locator(`[data-mx-race-field="${key}"] dd`).textContent()),value);
 const related=root.locator('[data-mx-related] a[href="/news/from-fourth-to-first-hailey-bell-kmart-chase/"]'),approvedRelated=seed.news.find(item=>item.slug==='from-fourth-to-first-hailey-bell-kmart-chase');assert.ok(approvedRelated,'The related story is an existing approved article');assert.equal(await related.isVisible(),true);assert.equal(clean(await related.locator('span').textContent()),approvedRelated.title);assert.equal(clean(await related.locator('small').textContent()),approvedRelated.date);assert.ok(fs.existsSync(path.join(dist,'news/from-fourth-to-first-hailey-bell-kmart-chase/index.html')),'The related story URL has a real built destination');
 assert.match(clean(await root.locator('[data-mx-clinch]').textContent()),/\+8\s*POINTS/i);assert.doesNotMatch(clean(await root.locator('[data-mx-clinch]').textContent()),/(?:current|existing)\s+(?:lead|gap)\s*[:=-]?\s*\+?8/i);
 const hero=page.locator('[data-mx-hero-visual]');assert.equal(await hero.count(),1);const image=hero.locator('img');
 if(await image.count()){assert.ok(story.heroImage,'A car photograph must have an approved source instead of a generic social image');assert.equal(await image.getAttribute('src'),story.heroImage);assert.match(await image.getAttribute('alt'),/Hailey|No\. 15|Hermanos Rodríguez/i);await image.evaluate(img=>img.decode());}
 else assert.match(await hero.textContent(),/Kmart Auto Parts Series/i);
 assert.match(clean(await page.locator('[data-mx-hero] figcaption').textContent()),/Hailey Bell.*No\. 15 Dodge.*StarClutch Racing/);
 const ratio=await hero.evaluate(el=>{const r=el.getBoundingClientRect();return r.width/r.height;});assert.ok(Math.abs(ratio-16/9)<.03,'Hero visual preserves the requested cinematic ratio');
 const clipped=await hero.evaluate(visual=>{const outer=visual.getBoundingClientRect();return[...visual.querySelectorAll('.mx-hero__typography > *')].flatMap(child=>{const range=document.createRange();range.selectNodeContents(child);const r=range.getBoundingClientRect();return r.top<outer.top-1||r.bottom>outer.bottom+1||r.left<outer.left-1||r.right>outer.right+1?[{text:child.textContent,child:{top:r.top,bottom:r.bottom,left:r.left,right:r.right},visual:{top:outer.top,bottom:outer.bottom,left:outer.left,right:outer.right}}]:[];});});assert.deepEqual(clipped,[],'Every fallback typography line remains inside the visible 16:9 hero');
 const minutes=await readingTime(page);assert.ok(Number.isInteger(minutes)&&minutes>0);
}

async function assertMetadata(page){
 assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),canonical);assert.equal(await page.locator('meta[property="og:url"]').getAttribute('content'),canonical);assert.equal(await page.locator('meta[property="og:type"]').getAttribute('content'),'article');assert.equal(await page.locator('meta[property="article:published_time"]').getAttribute('content'),'2026-11-07');assert.match(await page.title(),/Bell Eyes Regular-Season Championship.*Mexico City/);assert.equal(await page.locator('meta[name="description"]').getAttribute('content'),story.embedDescription);
 const ld=JSON.parse(await page.locator('[data-mx-structured-data]').textContent());assert.ok(['Article','NewsArticle'].includes(ld['@type']));assert.equal(ld.headline,story.title);assert.equal(ld.datePublished,'2026-11-07');assert.equal(typeof ld.mainEntityOfPage==='string'?ld.mainEntityOfPage:ld.mainEntityOfPage['@id'],canonical);assert.match(JSON.stringify(ld.publisher),/Aetherwing eMotorsports/);assert.equal(ld.author,undefined,'The source supplies a publisher, not an invented interview author');assert.equal(ld.timeRequired,`PT${await readingTime(page)}M`);
}

async function keyboard(page,locator){await locator.focus();await page.keyboard.press('Enter');}
async function assertControls(test,{native=true}={}){
 const {page}=test,scenario=page.locator('[data-mx-scenario]');if(!await scenario.evaluate(el=>el.open))await keyboard(page,scenario.locator('summary'));assert.equal(await scenario.evaluate(el=>el.open),true);assert.match(clean(await scenario.textContent()),/Bell must outscore StarClutch Racing teammate Will by at least (?:eight|8) points during the Corona Mexico 250 to secure the regular-season championship\./);assert.match(await scenario.textContent(),/supplied.*pre-race|pre-race.*supplied/i);
 const toc=page.locator('[data-mx-toc]');if(await toc.evaluate(el=>el.tagName==='DETAILS'&&!el.open))await keyboard(page,toc.locator('summary'));
 const links=toc.locator('a');assert.deepEqual(await links.allTextContents().then(texts=>texts.map(clean)),story.sections.slice(1).map(section=>section.heading));
 for(const link of await links.all()){const hash=await link.getAttribute('href');assert.match(hash,/^#[a-z0-9-]+$/);const id=hash.slice(1);assert.equal(await page.locator(`[id="${id}"]`).count(),1);await keyboard(page,link);await page.waitForURL(url=>url.hash===hash);assert.ok(await page.locator(`[id="${id}"]`).evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.top<innerHeight;}),'Keyboard TOC scrolls to its actual section heading');}
 const copy=page.locator('[data-mx-copy]').first();await keyboard(page,copy);await page.waitForFunction(()=>/copied/i.test(document.querySelector('[data-mx-share-status]').textContent));assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),canonical,'Copy writes the actual canonical URL to the browser clipboard');
 const share=page.locator('[data-mx-share]').first();if(native){assert.equal(await share.isVisible(),true);const count=await page.evaluate(()=>window.__mexicoShares.length);await keyboard(page,share);await page.waitForFunction(expected=>window.__mexicoShares.length===expected,count+1);assert.equal(await page.evaluate(()=>window.__mexicoShares.at(-1).url),canonical);assert.equal(await page.evaluate(()=>window.__mexicoShares.at(-1).title),await page.locator('h1').textContent());await page.evaluate(()=>window.__mexicoShareCancel=true);await keyboard(page,share);await page.evaluate(()=>window.__mexicoShareCancel=false);assert.doesNotMatch(await page.locator('[data-mx-share-status]').textContent(),/failed|error/i,'Cancelling the OS share sheet is harmless');}else assert.equal(await share.isVisible(),false,'Unsupported native sharing does not expose a dead button');
 const x=page.locator('[data-mx-x]').first(),href=new URL(await x.getAttribute('href'));assert.ok(['x.com','twitter.com'].includes(href.hostname));assert.equal(href.pathname,'/intent/tweet');assert.equal(href.searchParams.get('url'),canonical);const popupPromise=page.waitForEvent('popup');await keyboard(page,x);const popup=await popupPromise;await popup.waitForLoadState('domcontentloaded');assert.equal(new URL(popup.url()).searchParams.get('url'),canonical);assert.ok(test.external.includes(popup.url()),'X sharing opens the intended isolated destination');await popup.close();
 const footerShare=page.locator('[data-mx-feature] footer a[href="#mx-share"]');await keyboard(page,footerShare);await page.waitForURL(url=>url.hash==='#mx-share');assert.ok(await page.locator('#mx-share').evaluate(el=>{const r=el.getBoundingClientRect();return r.top>=0&&r.top<innerHeight;}),'The closing Share article control returns to the working sharing tools');
}

async function assertLayout(page,width){
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width}px article has no horizontal page overflow`);
 for(const el of await page.locator('h1,[data-mx-quote],[data-mx-race-field], [data-mx-clinch], [data-mx-countdown], [data-mx-scenario]').all())assert.equal(await el.evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`${width}px text overflows: ${clean(await el.textContent()).slice(0,90)}`);
 const footerLink=page.locator('[data-mx-feature] footer a').last();await footerLink.scrollIntoViewIfNeeded();
 if(await page.locator('[data-aw-dock]').isVisible()){await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));const link=await footerLink.boundingBox(),dock=await page.locator('[data-aw-dock]').boundingBox();assert.ok(link.y+link.height<=dock.y,'The closing News control clears mobile bottom navigation');assert.ok(await page.locator('.ux-footer__base').evaluate(el=>el.getBoundingClientRect().bottom<=document.querySelector('[data-aw-dock]').getBoundingClientRect().top+1),'The final website footer stays above the mobile dock');for(const button of await page.locator('[data-aw-dock] a,[data-aw-dock] button').all())assert.equal(await button.evaluate(el=>{const r=el.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return!!hit&&(hit===el||el.contains(hit));}),true,'Mobile navigation remains unobstructed');}
}

try{
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 for(const width of [1440,768,360,390,430]){
  const test=await open(width);
  try{
   await test.page.locator('[data-mx-feature]').waitFor();await test.page.waitForFunction(()=>document.querySelector('[data-mx-unit="seconds"]')?.textContent.trim()!=='');await assertCopy(test.page);await assertMetadata(test.page);
   const first=await remaining(test.page),expected=await test.page.evaluate(start=>Math.floor((start-Date.now())/1000),start);assert.ok(Math.abs(first-expected)<=1,'Countdown uses November 9 at 8:30 PM Eastern after the DST change');await test.page.clock.fastForward(2100);assert.ok(first-await remaining(test.page)>=2,'Seconds tick before the scheduled start');
   assert.ok(test.pending,'Hold the real publication request while testing the bundled article');test.release();await test.page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');await assertCopy(test.page);await assertControls(test);await assertLayout(test.page,width);
   await test.page.evaluate(()=>window.scrollTo(0,0));await test.page.screenshot({path:`/tmp/mexico-city-approved-hero-${width}.png`});if([1440,390].includes(width))await test.page.locator('[data-mx-hero-visual]').screenshot({path:`/tmp/mexico-city-approved-visual-${width}.png`});
   const minutes=await readingTime(test.page),edited=structuredClone(seed),updated=edited.news.find(item=>item.slug===slug);updated.title=updated.title.replace('Eyes','Considers');updated.summary=updated.summary.replace('approaches','previews');updated.sections[0].paragraphs[0]+=` ${Array(225).fill('revision').join(' ')}`;
   await test.page.evaluate(detail=>window.dispatchEvent(new CustomEvent('aetherwing:content',{detail})),edited);assert.equal(await test.page.locator('h1').textContent(),updated.title);assert.ok((await test.page.locator('[data-mx-editorial]').textContent()).includes(updated.sections[0].paragraphs[0]));assert.equal(await readingTime(test.page),minutes+1,'Reading time is recalculated from live edited copy');const liveLD=JSON.parse(await test.page.locator('[data-mx-structured-data]').textContent());assert.equal(liveLD.headline,updated.title);assert.equal(liveLD.timeRequired,`PT${minutes+1}M`);assert.equal(await test.page.locator('[data-mx-scenario]').evaluate(el=>el.open),true,'CMS hydration preserves the reader’s open scenario');await assertControls(test);await assertLayout(test.page,width);
   await test.page.evaluate(()=>window.scrollTo(0,0));await test.page.screenshot({path:`/tmp/mexico-city-hero-${width}.png`});await test.page.locator('[data-mx-clinch]').screenshot({path:`/tmp/mexico-city-clinch-${width}.png`});
   const jump=start+2000-await test.page.evaluate(()=>Date.now());await test.page.clock.fastForward(jump);assert.equal(await test.page.locator('[data-mx-countdown-units]').isVisible(),false);assert.match(await test.page.locator('[data-mx-countdown-status]').textContent(),/Scheduled start time reached/i);assert.doesNotMatch(await test.page.locator('[data-mx-countdown]').textContent(),/\bLIVE\b|underway|complete|finished|−\d|-\d/i);assert.deepEqual(test.errors,[]);
   console.log(`PASS: ${width}px full editorial copy, neutral +8 scenario, metadata, responsive hero/quotes/fields, keyboard/clipboard/native/X sharing, CMS hydration/live edits and Eastern countdown transition.`);
  }catch(error){await test.page.screenshot({path:`/tmp/mexico-city-failure-${width}.png`});throw error;}finally{test.release();await test.context.close();}
 }
 const cached=await open(390,{cache:true,native:false});
 try{await cached.page.waitForFunction(()=>document.documentElement.dataset.contentState==='cached');await assertCopy(cached.page);await assertControls(cached,{native:false});cached.recover();await cached.page.evaluate(()=>window.dispatchEvent(new Event('online')));await cached.page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');await assertCopy(cached.page);await assertControls(cached,{native:false});await cached.page.evaluate(()=>{Object.defineProperty(navigator.clipboard,'writeText',{configurable:true,value:async()=>{throw new DOMException('Clipboard denied','NotAllowedError');}});document.execCommand=()=>false;});await keyboard(cached.page,cached.page.locator('[data-mx-copy]').first());await cached.page.locator('[data-mx-copy-fallback]').waitFor({state:'visible'});const fallback=cached.page.locator('[data-mx-copy-fallback] input');assert.equal(await fallback.inputValue(),canonical);assert.equal(await fallback.evaluate(el=>el.readOnly&&el.selectionStart===0&&el.selectionEnd===el.value.length),true,'Blocked clipboard access offers the selected canonical URL for manual copying');assert.deepEqual(cached.errors,[]);console.log('PASS: cached old catalog and fresh API recovery preserve story/controls; unsupported native sharing hides safely and blocked clipboard offers manual canonical copying.');}finally{await cached.context.close();}
 const noJS=await open(390,{noJS:true});try{await assertCopy(noJS.page);await assertMetadata(noJS.page);const scenario=noJS.page.locator('[data-mx-scenario]');await scenario.locator('summary').click();assert.equal(await scenario.evaluate(el=>el.open),true);console.log('PASS: no-JavaScript complete article, race information, quotes, structured metadata and native scenario disclosure.');}finally{noJS.release();await noJS.context.close();}
}finally{await browser?.close();}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=await import(pathToFileURL(path.join(process.env.PAINT_TEST_MODULES||'/tmp/aetherwing-browser-tests/node_modules','playwright-core/index.mjs')));
const datasets=require('../netlify/lib/_content.cjs').seeds();
const stories=datasets.news.filter(story=>story.featureBlocks?.some(block=>block.type==='change-strip'));
assert.ok(stories.length>=3,'Exercise New Hampshire and both archived recap layouts');
const root=path.resolve('dist');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((request,response)=>{
  let file=path.join(root,decodeURIComponent(new URL(request.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){response.writeHead(403).end();return;}
  try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});fs.createReadStream(file).pipe(response);}catch{response.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base=`http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
  for(const width of [1920,1440,1280,1024,768,620,390,320]) {
    const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    await page.clock.install({time:new Date('2026-10-20T22:00:00Z')});
    let publish;
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.pathname==='/api/site-content'){
        await new Promise(resolve=>{publish=resolve;});
        return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({revision:93,datasets})});
      }
      if(url.origin!==base)return route.abort('failed');
      return route.continue();
    });
    for(const story of stories) {
      publish=null;
      await page.goto(`${base}/news/${story.slug}/`,{waitUntil:'domcontentloaded'});
      const check=async phase=>{
        const failures=await page.locator('.news-change-grid > div').evaluateAll(cells=>cells.flatMap((cell,index)=>{
          const bounds=cell.getBoundingClientRect(), failures=[];
          const walker=document.createTreeWalker(cell,NodeFilter.SHOW_TEXT);
          let node;
          while((node=walker.nextNode())){
            if(!node.textContent.trim())continue;
            const range=document.createRange();range.selectNodeContents(node);
            for(const rect of range.getClientRects())if(rect.width&&rect.height&&(rect.left<bounds.left-1||rect.right>bounds.right+1||rect.top<bounds.top-1||rect.bottom>bounds.bottom+1))failures.push(`Metric ${index+1}: ${node.textContent.trim()} escapes its card`);
          }
          const delta=cell.querySelector('strong'),value=cell.querySelector('b');
          if(delta&&value&&delta.getBoundingClientRect().top<value.getBoundingClientRect().bottom-1)failures.push(`Metric ${index+1}: delta overlaps the value`);
          return failures;
        }));
        assert.deepEqual(failures,[],`${width}px ${phase} ${story.slug}: movement text must remain readable within its own metric`);
        const expected=story.featureBlocks.find(block=>block.type==='change-strip').items;
        const cells=page.locator('.news-change-grid > div');assert.equal(await cells.count(),expected.length,'No phantom metrics or omitted values');
        for(let i=0;i<expected.length;i++)for(const value of [expected[i].label,expected[i].before,expected[i].after,expected[i].value,expected[i].delta].filter(Boolean))assert.ok((await cells.nth(i).textContent()).includes(value),`Retain ${value}`);
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No horizontal page overflow');
        const geometry=await page.locator('.news-article').evaluate(article=>{
          const wrap=article.querySelector(':scope > .wrap').getBoundingClientRect();
          return {wrap:wrap.width,cards:[...article.querySelectorAll('.news-stat-card')].map(card=>card.getBoundingClientRect().width),prose:[...article.querySelectorAll('.news-feature-prose')].map(p=>p.getBoundingClientRect().width)};
        });
        if(width===1920){assert.ok(geometry.wrap>=1600&&geometry.wrap<=1681,'Wide monitors should use a larger article canvas capped at 1680px');assert.ok(geometry.cards.every(w=>w>=geometry.wrap-2),'Stat cards should use the full article canvas');assert.ok(geometry.prose.every(w=>w<=1101),'Long-form text keeps a readable measure');}
      };
      await check('static');
      await page.waitForFunction(()=>document.documentElement.dataset.contentState==='loading');
      // Await only the local request callback; no outside services are involved.
      if(!publish)await page.waitForRequest(request=>new URL(request.url()).pathname==='/api/site-content');
      assert.ok(publish,'The published-content request must be pending');publish();
      await page.waitForFunction(()=>document.documentElement.dataset.contentState==='published');
      await check('published');
      if(story.slug.includes('new-hampshire')){
        await page.locator('.news-stat-card--changes').screenshot({path:`/tmp/aetherwing-movement-${width}.png`});
        if(width===1920)await page.locator('.news-standing-card__rows').screenshot({path:'/tmp/aetherwing-recap-standings-wide.png'});
        // A longer Admin edit must reflow without clipping or losing data.
        const edited=structuredClone(datasets);
        const current=edited.news.find(s=>s.slug===story.slug);
        current.featureBlocks.find(b=>b.type==='change-strip').items[1].after='+137 points ahead';
        await page.evaluate(detail=>window.dispatchEvent(new CustomEvent('aetherwing:content',{detail})),edited);
        const original=story.featureBlocks.find(b=>b.type==='change-strip').items[1].after;
        story.featureBlocks.find(b=>b.type==='change-strip').items[1].after='+137 points ahead';
        await check('edited');
        story.featureBlocks.find(b=>b.type==='change-strip').items[1].after=original;
      }
    }
    assert.deepEqual(errors,[],'No browser runtime errors');
    console.log(`PASS: ${width}px static/live recap text containment, preserved values, adaptive cards and canvas width.`);
    await context.close();
  }
} finally {await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}

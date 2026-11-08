import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
import {alliancePrograms,preserveAllianceRelationship} from '../src/lib/alliance-content.mjs';
import {reconcileTeamPartners} from '../src/lib/team-partner-content.mjs';
import {appendReviewedResults} from '../src/lib/reviewed-results.mjs';
import {reconcileNovemberSchedule,reconcileNovemberStandings} from '../src/lib/november-racing-context.mjs';
import {reconcileCharterPlans} from '../src/lib/charter-plans.mjs';

const require=createRequire(import.meta.url),content=require('../netlify/lib/_content.cjs');
const {mergeCanonical}=require('../netlify/lib/_site-data.cjs')._test;
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const slug='bell-eyes-championship-mexico-city',leadSlug='hailey-bell-nrrs-season-3-review';
const seed=content.seeds(),fresh=seed.news.find(story=>story.slug===slug);
assert.ok(fresh,'The approved article is in the shared Admin/public seed');
assert.equal(fresh.dateIso,'2026-11-07');assert.equal(fresh.featured,false);
assert.deepEqual(seed.news.filter(story=>story.featured).map(story=>story.slug),[leadSlug]);
const oldNews=seed.news.filter(story=>story.slug!==slug),stale={...fresh,contentRevision:'old',title:'Outdated pre-race draft'};
const edited=structuredClone(fresh);edited.title='Later approved Mexico City title';edited.sections[0].paragraphs[0]='Later approved interview opening.';
const find=rows=>rows.find(story=>story.slug===slug);
const assertFeature=rows=>assert.deepEqual(rows.filter(story=>story.featured).map(story=>story.slug),[leadSlug],'Adding the newest story preserves the approved NRRS lead');

// Execute the actual SSR reconciliation block without loading/writing the build overlay.
const ssrSource=read('../src/lib/site-content.mjs');
const ssrBlock=ssrSource.slice(ssrSource.indexOf('const publishedNews ='),ssrSource.indexOf('const publishedCompetitions =')).replace('export const news =','const news =');
const ssr=(rows)=>new Function('newsSeed','choose',`${ssrBlock}\nreturn {news,normalizeNewsIdentity};`)(seed.news,(_key,fallback)=>rows??fallback);
const adminSource=read('../public/admin/content-admin.js');
const adminBlock=adminSource.slice(adminSource.indexOf("    if(name==='news'&&Array.isArray(value)){"),adminSource.indexOf("    if(name==='partners'&&Array.isArray(value)){"));
const adminRows=rows=>new Function('name','value','seeds','normalizeNewsIdentity','structuredClone',`${adminBlock}\nthrow new Error('News editor did not reconcile its input.');`)('news',rows,seed,ssr(rows).normalizeNewsIdentity,structuredClone);

// Extract only the pure build transformation; importing the sync entrypoint would write files.
const syncSource=read('../scripts/sync-admin-content.mjs');
const syncBlock=syncSource.slice(syncSource.indexOf('function ensureCoreTeamPartners'),syncSource.indexOf('function readBundledOverlay')).replaceAll('import.meta.url','scriptUrl');
const buildRows=new Function('scriptUrl','alliancePrograms','preserveAllianceRelationship','reconcileTeamPartners','appendReviewedResults','reconcileNovemberSchedule','reconcileNovemberStandings','reconcileCharterPlans',`${syncBlock}\nreturn canonicalizeBuildContent;`)(new URL('./sync-admin-content.mjs',import.meta.url).href,alliancePrograms,preserveAllianceRelationship,reconcileTeamPartners,appendReviewedResults,reconcileNovemberSchedule,reconcileNovemberStandings,reconcileCharterPlans);

for(const rows of [oldNews,[],[...oldNews,stale],[...oldNews,edited]]){
  const before=structuredClone(rows),expected=find(rows)?.contentRevision===fresh.contentRevision?edited:fresh;
  for(const [name,reconciled] of [
    ['public API',mergeCanonical({news:structuredClone(rows)}).news],
    ['SSR',ssr(rows).news],
    ['Admin editor',adminRows(rows)],
    ['build sync',(await buildRows({revision:47,datasets:{news:rows}})).datasets.news]
  ]){
    assert.equal(reconciled.filter(story=>story.slug===slug).length,1,`${name}: exactly one Mexico story`);
    assert.deepEqual(find(reconciled),expected,`${name}: repair only missing/stale releases; preserve same-revision editorial edits`);
    if(name!=='build sync')assertFeature(reconciled);
    assert.deepEqual(rows,before,`${name}: reconciliation does not mutate supplied news`);
  }
}
const twice=mergeCanonical(mergeCanonical({news:structuredClone(oldNews)}));
assert.equal(twice.news.filter(story=>story.slug===slug).length,1,'Repeated publication reads cannot duplicate the story');assertFeature(twice.news);
const liveRecords={standings:seed.standings,results:seed.results,'schedule-events':seed['schedule-events']};
const baseline=mergeCanonical(structuredClone({...liveRecords,news:oldNews}));
const withArticle=mergeCanonical(structuredClone({...liveRecords,news:[...oldNews,edited]}));
for(const key of Object.keys(liveRecords))assert.deepEqual(withArticle[key],baseline[key],`Editorial release leaves ${key} unchanged`);

// Exercise authenticated draft/save/publish with the real handler and isolated in-memory storage.
let stored={revision:47,published:structuredClone({...liveRecords,news:oldNews}),drafts:{news:[...structuredClone(oldNews),structuredClone(edited)]},history:[]},writes=0;
const handlerModule={exports:{}};
const adminRequire=createRequire(new URL('../netlify/lib/_site-admin.cjs',import.meta.url));
new Function('require','module','exports','process','fetch',read('../netlify/lib/_site-admin.cjs'))(name=>{
  if(name==='./_content.cjs')return {...content,read:async()=>({registry:structuredClone(stored),etag:'fixture-etag'}),write:async registry=>{writes++;stored=structuredClone(registry);}};
  return adminRequire(name);
},handlerModule,handlerModule.exports,{env:{}},()=>assert.fail('Editorial fixture must never call a network/deployment endpoint'));
const auth={clientContext:{user:{sub:'editor-fixture',email:'editor@example.test',app_metadata:{roles:['admin']}}}};
const request=async(action,data)=>{
  const response=await handlerModule.exports.handler({httpMethod:'POST',body:JSON.stringify({action,dataset:'news',revision:stored.revision,...(data?{data}:{})})},auth);
  const result=JSON.parse(response.body);assert.equal(response.statusCode,200,result.error);return result;
};
const denied=await handlerModule.exports.handler({httpMethod:'GET'},{});assert.equal(denied.statusCode,403);assert.equal(writes,0);
const initial=JSON.parse((await handlerModule.exports.handler({httpMethod:'GET'},auth)).body);
assert.deepEqual(find(initial.registry.published.news),fresh,'Older published Admin content exposes the released story for editing');
assert.deepEqual(find(initial.registry.drafts.news),edited,'Private same-revision edits are retained separately');
assert.equal(writes,0,'An authenticated read is not a CMS write');assert.equal(find(stored.published.news),undefined);
const draft=await request('saveDraft',[...structuredClone(oldNews),structuredClone(edited)]);
assert.deepEqual(find(draft.registry.drafts.news),edited);assert.deepEqual(find(draft.registry.published.news),fresh);
assert.deepEqual(find(mergeCanonical(structuredClone(stored.published)).news),fresh,'Saving a private draft never leaks it through the public API');
const published=await request('publish');
assert.deepEqual(find(published.registry.published.news),edited);assert.equal(published.registry.drafts.news,undefined);
assert.equal(published.publication.dataPublished,true);assert.equal(published.publication.queued,false,'The test does not request deployment');
assert.deepEqual(find(mergeCanonical(structuredClone(stored.published)).news),edited,'A later explicit publication survives API reconciliation');assertFeature(published.registry.published.news);
assert.deepEqual(stored.published.standings,liveRecords.standings);assert.deepEqual(stored.published.results,liveRecords.results);assert.deepEqual(stored.published['schedule-events'],liveRecords['schedule-events']);

// SSR order must expose the newest release without displacing the selected feature.
const home=read('../src/pages/index.astro'),newsroom=read('../src/pages/news/index.astro');
const homeOrder=home.slice(home.indexOf('const leadNews='),home.indexOf('const mexicoNews='));
const order=new Function('news',`${homeOrder}\nreturn {leadNews,moreNews};`)(ssr(oldNews).news);
assert.equal(order.leadNews.slug,leadSlug);assert.equal(order.moreNews[0].slug,slug);
const card=Object.fromEntries(['slug','dateIso','date','category','title','cardSummary','embedDescription','summary'].map(key=>[key,fresh[key]]));
const scripts=source=>[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]);
const homeScript=scripts(home).find(script=>script.includes("document.querySelector('[data-home-news-seed]')"));
const newsScript=scripts(newsroom).find(script=>script.includes("document.querySelector('[data-news-release-card]')"));
assert.ok(homeScript&&newsScript,'Both existing news listings have cache-safe release hydration');
for(const cachedAtStartup of [false,true])for(const page of ['home','newsroom']){
  const seedHtml=JSON.stringify(page==='home'?{leadSlug,release:card}:card).replace(/</g,'\\u003c');
  const markup=page==='home'?`<div data-home-news><a id="original-lead" href="/news/${leadSlug}/">Original featured lead</a><a data-home-secondary-news>Old card</a></div><script type="application/json" data-home-news-seed>${seedHtml}</script>`:`<div data-news-list></div><script type="application/json" data-news-release-card>${seedHtml}</script>`;
  const dom=new JSDOM(markup,{url:'https://example.test/',runScripts:'outside-only'}),w=dom.window;
  const lead=w.document.querySelector('#original-lead');
  if(cachedAtStartup)w.__AETHERWING_CONTENT__={news:structuredClone(oldNews)};
  w.eval(page==='home'?homeScript:newsScript);
  const deliver=rows=>w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:{news:structuredClone(rows)}}));
  if(!cachedAtStartup)deliver(oldNews);
  const cards=()=>[...w.document.querySelectorAll(page==='home'?'[data-home-secondary-news]':'[data-news-list] a')];
  assert.equal(cards()[0].getAttribute('href'),`/news/${slug}/`,`${page}: old cached/feed lists retain the new release`);
  assert.equal(cards().filter(a=>a.getAttribute('href')===`/news/${slug}/`).length,1);
  if(page==='home')assert.equal(w.document.querySelector('#original-lead'),lead,'Live secondary news keeps the existing featured node and content');
  const later={...edited,title:'Later approved <Mexico> & interview',cardSummary:'Edited <summary> & context'};
  deliver([...oldNews,later]);
  assert.equal(cards()[0].querySelector(page==='home'?'h3':'h2').textContent,later.title,`${page}: incoming editorial edits are not replaced by the release seed`);
  assert.equal(cards()[0].querySelector('mexico'),null,'Incoming story text is escaped');
  if(page==='newsroom')assert.equal(cards()[0].querySelector('p').textContent,later.cardSummary);
  if(page==='home'){assert.equal(lead.textContent,'Original featured lead');assert.equal(lead.getAttribute('href'),`/news/${leadSlug}/`);}
  deliver([]);assert.equal(cards()[0].getAttribute('href'),`/news/${slug}/`,'An empty cached list keeps only the approved release fallback');
  w.close();
}
assert.match(home,/data-home-news-seed[^\n]*\.replace\(\/</);assert.match(newsroom,/data-news-release-card[^\n]*\.replace\(\/</,'JSON card seeds escape less-than characters before insertion into HTML');
console.log('PASS: Mexico City release survives older CMS/build/cache feeds; same-revision edits, private drafts, NRRS feature and historical/live records are preserved; both news listings remain current.');

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

// Integration smoke checks for the mobile app shells. All fixtures are local
// and cannot publish, log in, or write to the real site's content store.
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const app=read('src/components/global/MobileAppNavigation.astro');
const base=read('src/layouts/Base.astro');
const publicCSS=read('src/styles/mobile-app.css');
const adminHTML=read('public/admin/index.html');
const adminCSS=read('public/admin/mobile-admin.css');
const adminJS=read('public/admin/mobile-admin.js');
const publicJS=app.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(publicJS,'public mobile navigation client script present');
assert.ok(base.includes('<MobileAppNavigation />'),'mobile nav is present on all public pages');
assert.ok(base.includes("import '../styles/mobile-app.css';"),'global mobile styling imported');
assert.ok(adminHTML.includes('data-aw-admin-mobile-nav'),'Admin mobile nav mounted');
assert.ok(adminHTML.includes('data-aw-admin-mobile-dock'),'Admin publish dock mounted');
assert.ok(adminHTML.includes('/admin/mobile-admin.js'),'Admin app module loaded');
assert.ok(publicCSS.includes('@media(max-width:980px)')&&adminCSS.includes('@media(max-width:980px)'),'mobile-only UI rules');
assert.ok(publicCSS.startsWith('/* Aetherwing Mobile 2.0'),'public CSS is documented');
assert.doesNotThrow(()=>new Function(publicJS),'public navigation JS parses');
assert.doesNotThrow(()=>new Function(adminJS),'Admin navigation JS parses');

const makeDOM=html=>{
  const dom=new JSDOM(html,{url:'https://aetherwing.net/',runScripts:'outside-only',pretendToBeVisual:true});
  dom.window.matchMedia=()=>({matches:true,addListener(){},removeListener(){}});
  return dom;
};
{
  const dom=makeDOM('<div data-aw-app>'+
    '<div data-aw-app-scrim hidden></div>'+
    '<section data-aw-app-sheet hidden><button data-aw-app-close>×</button><h2 data-aw-app-sheet-title></h2>'+
    '<div data-aw-app-links="race"></div><div data-aw-app-links="more" hidden></div></section>'+
    '<nav><a href="/schedule/" data-aw-app-open="race" aria-expanded="false">Racing</a>'+
    '<a href="/programs/" data-aw-app-open="more" aria-expanded="false">More</a></nav></div>');
  const {document,MouseEvent,KeyboardEvent,CustomEvent}=dom.window;
  dom.window.eval(publicJS);
  const race=document.querySelector('[data-aw-app-open="race"]');
  race.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
  assert.equal(document.querySelector('[data-aw-app-sheet]').hidden,false,'race drawer opens');
  assert.equal(race.getAttribute('aria-expanded'),'true','drawer announces expansion');
  assert.equal(document.querySelector('[data-aw-app-links="more"]').hidden,true,'other links remain hidden');
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  assert.equal(document.querySelector('[data-aw-app-sheet]').hidden,true,'Escape closes drawer');
  dom.window.dispatchEvent(new CustomEvent('aetherwing:content',{detail:{navigation:[
    {label:'Schedule',href:'/schedule/'},{label:'Paint Booth',href:'https://paint.aetherwing.net/'},
    {label:'Bad',href:'javascript:alert(1)'}]}}));
  assert.ok(document.querySelector('[data-aw-app-links="race"] a[href="/schedule/"]'),'live schedule navigation updated');
  assert.ok(document.querySelector('[data-aw-app-links="more"] a[href="https://paint.aetherwing.net/"]'),'live Paint Booth stays linked');
  assert.equal(document.querySelector('[data-aw-app-links="more"] a[href^="javascript:"]'),null,'unsafe dynamic URL dropped');
  dom.window.close();
}
{
  const dom=makeDOM('<section data-workspace>'+
    '<nav data-admin-tabs><button data-admin-tab="overview" class="is-active"><small>00</small>Overview</button>'+
    '<button data-admin-dataset="standings"><small>04</small>Standings</button>'+
    '<button data-admin-dataset="news"><small>18</small>Team Wire</button></nav>'+
    '<form data-content-form><button type="submit">Save</button><button type="button" data-content-publish>Publish</button></form>'+
    '<p data-content-save-feedback data-state="neutral">Editor ready</p>'+
    '<div data-aw-admin-mobile-overlay hidden></div>'+
    '<section data-aw-admin-mobile-sheet hidden><button data-aw-admin-mobile-close>Close</button></section>'+
    '<h2 data-aw-admin-mobile-title></h2><div data-aw-admin-mobile-list></div>'+
    '<div data-aw-admin-mobile-dock hidden><span data-aw-admin-mobile-status></span>'+
    '<button data-aw-admin-mobile-save>Save draft</button><button data-aw-admin-mobile-publish>Publish</button></div>'+
    '<nav data-aw-admin-mobile-nav>'+
    '<button data-aw-admin-mobile-group="home"></button>'+
    '<button data-aw-admin-mobile-group="racing" aria-expanded="false"></button>'+
    '<button data-aw-admin-mobile-group="media" aria-expanded="false"></button></nav></section>');
  const {document,MouseEvent}=dom.window;
  const rail=document.querySelector('[data-admin-tabs]');
  let saves=0,publishes=0;
  const save=document.querySelector('[data-content-form] button[type="submit"]');
  document.querySelector('[data-content-form]').addEventListener('submit',e=>{e.preventDefault();saves++});
  document.querySelector('[data-content-publish]').addEventListener('click',()=>publishes++);
  for(const original of rail.querySelectorAll('button'))original.addEventListener('click',()=>{
    rail.querySelectorAll('button').forEach(b=>b.classList.remove('is-active'));
    original.classList.add('is-active');
  });
  dom.window.eval(adminJS);
  const racing=document.querySelector('[data-aw-admin-mobile-group="racing"]');
  racing.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  const choose=document.querySelector('[data-aw-admin-mobile-list] button');
  assert.equal(choose?.textContent,'Standings','sheet reflects canonical Admin tabs');
  choose.click();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(rail.querySelector('.is-active')?.dataset.adminDataset,'standings','mobile selection delegates to original editor');
  assert.equal(document.querySelector('[data-aw-admin-mobile-dock]').hidden,false,'dataset displays publish dock');
  document.querySelector('[data-aw-admin-mobile-save]').click();
  document.querySelector('[data-aw-admin-mobile-publish]').click();
  assert.equal(saves,1,'save button delegates to existing form action');
  assert.equal(publishes,1,'publish button delegates to existing publish action');
  const feedback=document.querySelector('[data-content-save-feedback]');
  feedback.textContent='PUBLISHED · public feed verified';feedback.dataset.state='success';
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.match(document.querySelector('[data-aw-admin-mobile-status]').textContent,/public feed verified/,'dock reflects real save verification');
  document.querySelector('[data-aw-admin-mobile-group="home"]').click();
  await new Promise(resolve=>setTimeout(resolve,0));
  assert.equal(document.querySelector('[data-aw-admin-mobile-dock]').hidden,true,'overview hides save controls');
  dom.window.close();
}
console.log('Mobile app shell navigation and Admin publishing delegation: PASS');

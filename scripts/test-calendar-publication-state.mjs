import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {SCHEDULE_COPY,scheduleStatus} from '../src/lib/race-clock.mjs';
import {applyPublication,loadPublishedContent} from '../src/lib/published-content.mjs';
import {eventSlug} from '../src/lib/schedule-events.mjs';

// Published CMS examples from revision 126 exercise reconciliation between two
// snapshots. These fixtures do not establish the official race calendar.
const oldEvents=[
  {league:'open',leagueName:'UARL Open',date:'2026-11-15',time:'11:30 AM ET',round:'ROUND 8',title:'Great Lakes Showdown',track:'Cedar Lake Speedway'},
  {league:'uarl-d1',leagueName:'L.L. Bean Cup Series',date:'2026-11-15',time:'8:30 PM ET',title:'The 6th Annual UARL All-Star Race',track:'USA International Speedway'},
  {league:'kmart',leagueName:'NASCAR Kmart Auto Parts Series',date:'2026-11-16',time:'8:30 PM ET',round:'ROUND 14',title:"Lowe's 600",track:'Charlotte'}
];
const currentEvents=[
  {league:'open',leagueName:'UARL Open',date:'2026-11-15',time:'11:30 AM ET',round:'ROUND 9',title:'North Country Classic',track:'ABC Raceway'},
  {league:'uarl-d1',leagueName:'L.L. Bean Cup Series',date:'2026-11-15',time:'8:30 PM ET',round:'ROUND 7',title:'British Crown 300',track:'Silverstone Circuit'},
  {league:'kmart',leagueName:'NASCAR Kmart Auto Parts Series',date:'2026-11-16',time:'8:30 PM ET',round:'ROUND 13',title:'USAA Salute to Service 250',track:'Naval Base Coronado'},
  {league:'open',leagueName:'UARL Open',date:'2026-11-01',time:'11:30 AM ET',offWeek:true,title:'OFF WEEK',track:'No race scheduled'},
  {league:'open',leagueName:'UARL Open',date:'2026-11-22',time:'11:30 AM ET',round:'ROUND 10',status:'POSTPONED',track:'Postponed fixture track'},
  {league:'open',leagueName:'UARL Open',date:'2026-11-29',time:'11:30 AM ET',round:'ROUND 11',track:'Later fixture track'}
];
const fallback={standings:[],results:[],'schedule-events':oldEvents};
const current={standings:[],results:[],'schedule-events':currentEvents};
const source=fs.readFileSync(new URL('../src/components/RaceCalendar.astro',import.meta.url),'utf8');
const markup=source.slice(source.indexOf('<section class="aw-calendar'),source.indexOf('</section>')+'</section>'.length);
const script=[...source.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match=>match[1]).find(script=>script.includes('applyLiveCalendar'));
assert.ok(script,'Exercise the actual Calendar controller');
assert.match(script,/import\s*\{scheduleStatus,SCHEDULE_COPY\}\s*from '\.\.\/lib\/race-clock\.mjs'/,'Calendar and Home share the publication availability policy');
assert.match(source,/data-calendar-seed[^\n]*\.replace\(\/</,'JSON seed text is escaped before insertion into HTML');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

function page(path='/schedule/',initialPublication){
  const seed=JSON.stringify({initial:oldEvents,initialResults:[]}).replace(/</g,'\\u003c');
  const dom=new JSDOM(`<html><head><link rel="canonical" href="https://example.test${path.split('#')[0]}"></head><body>${markup}<script type="application/json" data-calendar-seed>${seed}</script></body></html>`,{url:`https://example.test${path}`,runScripts:'outside-only'});
  const w=dom.window,NativeDate=w.Date,stamp=Date.parse('2026-11-15T15:00:00Z');
  w.Date=class extends NativeDate{constructor(...args){super(...(args.length?args:[stamp]));}static now(){return stamp;}};
  let tick;w.setInterval=callback=>{tick=callback;return 1;};
  w.SCHEDULE_COPY=SCHEDULE_COPY;w.eval(`window.scheduleStatus=${scheduleStatus.toString()};`);
  const deliver=(state,datasets=current)=>applyPublication({state,datasets:structuredClone(datasets),revision:126,savedAt:'2026-11-15T15:00:00Z'},structuredClone(fallback),{window:w,document:w.document});
  if(initialPublication)deliver(initialPublication);
  w.eval(script.replace(/^\s*import[^\n]+;\s*$/gm,''));
  const root=w.document.querySelector('[data-race-calendar]'),q=selector=>root.querySelector(selector);
  const rows=()=>[...root.querySelectorAll('[data-calendar-list] .aw-calendar__event')];
  const noActions=state=>{
    assert.equal(root.dataset.scheduleState,state);assert.equal(root.getAttribute('aria-busy'),String(state==='loading'));
    assert.equal(q('[data-calendar-toggle]').disabled,true);assert.equal(root.querySelectorAll('a[href]').length,0,'No stale event/full-calendar/ICS link is actionable before a current publication');
    assert.equal(rows().length,0);assert.equal(q('[data-calendar-recent]').textContent,'');
    assert.equal(q('[data-calendar-status]').textContent,SCHEDULE_COPY[state]);
    for(const stale of ['Cedar Lake','USA International','Charlotte'])assert.equal(root.textContent.includes(stale),false,'Loading/failure never describes a stale venue as the next race');
  };
  return {w,root,q,rows,deliver,noActions,tick:()=>tick(),close:()=>w.close()};
}

for(const path of ['/schedule/','/schedule/kmart/#full','/schedule/open/#full']){
  const p=page(path);
  try{
    p.noActions('loading');p.tick();p.noActions('loading');
    const before=p.w.location.href;p.q('[data-calendar-toggle]').click();assert.equal(p.w.location.href,before,'A disabled full-schedule action cannot expose seed rows');
    const full=p.w.location.hash==='#full';
    p.q('[data-series="uarl-d1"]').click();assert.equal(p.w.location.pathname,'/schedule/uarl-d1/');assert.equal(p.w.location.hash,full?'#full':'');p.noActions('loading');
    let release;const response=new Promise(resolve=>release=resolve);
    const loading=loadPublishedContent({timeout:1000,storage:{getItem:()=>null,setItem:()=>{}},fetcher:()=>response}).then(snapshot=>applyPublication(snapshot,fallback,{window:p.w,document:p.w.document}));
    await sleep(20);p.noActions('loading');
    release(Response.json({revision:126,datasets:current}));await loading;
    assert.equal(p.root.dataset.scheduleState,'ready');assert.equal(p.root.getAttribute('aria-busy'),'false');assert.equal(p.q('[data-calendar-toggle]').disabled,false);
    assert.match(p.q('[data-calendar-hero]').textContent,/Silverstone Circuit/);assert.equal(p.rows()[0].getAttribute('href'),'/event/uarl-d1-round-7/');
    assert.match(p.rows()[0].textContent,/8:30 PM ET/);assert.equal(p.q('[data-calendar-toggle]').getAttribute('aria-expanded'),String(full),'Successful loading retains the selected full view');
    for(const league of ['open','uarl-d1','kmart']){
      p.q(`[data-series="${league}"]`).click();const event=currentEvents.find(event=>event.league===league);
      assert.match(p.q('[data-calendar-hero]').textContent,new RegExp(event.track));
      assert.equal(p.q('[data-calendar-hero] a').getAttribute('href'),`/event/${eventSlug(event)}/`,'Calendar action uses the selected current CMS identity');
      assert.ok(p.rows().some(row=>row.getAttribute('href')===`/event/${eventSlug(event)}/`));
    }
    for(const state of ['cached','bundled']){
      const location=p.w.location.href;
      const failed=await loadPublishedContent({storage:{getItem:()=>state==='cached'?JSON.stringify({revision:125,datasets:current,savedAt:'2026-11-15T14:00:00Z'}):null,setItem:()=>assert.fail('A failed fetch cannot save a publication')},fetcher:async()=>{throw new Error('Fixture network unavailable');}});
      assert.equal(failed.state,state);applyPublication(failed,fallback,{window:p.w,document:p.w.document});p.noActions('unavailable');p.tick();p.noActions('unavailable');assert.equal(p.w.location.href,location);
      p.deliver('published');assert.equal(p.root.dataset.scheduleState,'ready');assert.match(p.q('[data-calendar-hero]').textContent,/Naval Base Coronado/);assert.equal(p.w.location.href,location,'Recovery keeps the selected program and hash');
    }
    p.q('[data-series="open"]').click();if(p.w.location.hash!=='#full')p.q('[data-calendar-toggle]').click();
    assert.equal(p.w.location.pathname,'/schedule/open/');assert.equal(p.w.location.hash,'#full');
    assert.equal(p.rows().length,currentEvents.filter(event=>event.league==='open').length,'The full schedule retains historical/off-week/postponed records');
    const offWeek=p.rows().find(row=>row.textContent.includes('OFF WEEK'));assert.equal(offWeek.tagName,'DIV');assert.equal(offWeek.hasAttribute('href'),false);
    assert.ok(p.rows().some(row=>row.textContent.includes('POSTPONED')));assert.match(p.q('[data-calendar-hero]').textContent,/ABC Raceway/);
    p.q('[data-calendar-toggle]').click();assert.equal(p.w.location.hash,'');assert.ok(!p.rows().some(row=>row.textContent.includes('POSTPONED')),'Upcoming excludes the postponed event');
    p.w.history.pushState(null,'','/schedule/kmart/#full');p.w.dispatchEvent(new p.w.PopStateEvent('popstate'));assert.equal(p.q('[data-calendar-toggle]').getAttribute('aria-expanded'),'true');assert.equal(p.q('[data-series="kmart"]').getAttribute('aria-pressed'),'true');assert.match(p.rows()[0].textContent,/Naval Base Coronado/,'Back/forward restoration renders the published selected league');
    p.deliver('published',{standings:[],results:[],'schedule-events':[]});assert.equal(p.root.dataset.scheduleState,'ready');assert.equal(p.rows().length,0);assert.match(p.q('[data-calendar-list]').textContent,/No events have been published/,'A resolved empty calendar is distinct from unavailable data');
  }finally{p.close();}
}
for(const initialState of ['published','cached','bundled']){
  const p=page('/schedule/kmart/#full',initialState);
  try{if(initialState==='published'){assert.equal(p.root.dataset.scheduleState,'ready');assert.match(p.q('[data-calendar-hero]').textContent,/Naval Base Coronado/);}else p.noActions('unavailable');}finally{p.close();}
}
const missing=page();try{missing.w.__AETHERWING_PUBLICATION__={state:'published'};missing.w.dispatchEvent(new missing.w.CustomEvent('aetherwing:content',{detail:{results:[]}}));missing.noActions('unavailable');}finally{missing.close();}
console.log('PASS: Calendar shares Home availability, hides actionable stale/cached/bundled events, supports slow published loading and recovery, and preserves current CMS IDs/time, filters, full hashes, off-weeks and empty states. No live writes.');

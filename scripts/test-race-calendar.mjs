import fs from 'node:fs';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {eventSlug} from '../src/lib/schedule-events.mjs';

const source=fs.readFileSync(new URL('../src/components/RaceCalendar.astro',import.meta.url),'utf8');
const markup=source.slice(source.indexOf('<section'),source.indexOf('<script'));
const script=source.match(/<script define:vars[^>]*>([\s\S]*?)<\/script>/)[1];
const fixture=(league,day,extra={})=>({league,leagueName:league.toUpperCase(),date:`2026-10-${String(day).padStart(2,'0')}`,time:'7:30 PM ET',title:`${league} Race ${day}`,track:`${league} Track ${day}`,round:`ROUND ${day}`,...extra});
const nrrs=[fixture('nrrs',1),fixture('nrrs',17),...Array.from({length:9},(_,i)=>fixture('nrrs',19+i)),fixture('nrrs',23,{offWeek:true,title:'Off week',round:'',time:''}),fixture('nrrs',29,{tbd:true,date:'',title:'Finale date pending'})];
const kmart=[fixture('kmart',2),...Array.from({length:7},(_,i)=>fixture('kmart',19+i))];
// Shuffle deliberately: both views must use chronological order, not source order.
const events=[...nrrs,...kmart].reverse();
const initialResults=[{league:'nrrs',date:nrrs[0].date,title:nrrs[0].title,entries:[{driver:'Fixture',number:'32',finish:1}]}];
for(const mode of ['seed','cached','event']){
  const dom=new JSDOM(markup,{url:'https://aetherwing.net/schedule/',runScripts:'outside-only'});
  const w=dom.window,$=selector=>w.document.querySelector(selector);
  try{
    const RealDate=w.Date,now=RealDate.parse('2026-10-18T12:00:00Z');
    w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
    let clockTick;w.setInterval=fn=>{clockTick=fn;return 1;};
    const payload={'schedule-events':events,results:initialResults};
    if(mode==='cached')w.__AETHERWING_CONTENT__=payload;
    w.eval(`const initial=${JSON.stringify(mode==='seed'?events:[])},initialResults=${JSON.stringify(mode==='seed'?initialResults:[])};\n${script}`);
    const publish=data=>w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:data}));
    if(mode==='event')publish(payload);
    const rows=()=>Array.from(w.document.querySelectorAll('[data-calendar-list] .aw-calendar__event'));
    const select=league=>$(`[data-series="${league}"]`).click();
    const toggle=()=> $('[data-calendar-toggle]').click();
    assert.equal(rows().length,5,`${mode}: default is next five across all programs`);
    assert.equal($('[data-calendar-toggle]').getAttribute('aria-expanded'),'false');
    select('nrrs');
    assert.equal(rows().length,5);
    assert.ok(rows().every(row=>row.querySelector('small').textContent.startsWith('NRRS')));
    assert.equal(rows()[0].querySelector('strong').textContent,'nrrs Track 19');
    assert.equal(rows()[4].querySelector('strong').textContent,'nrrs Track 23');
    const nextHero=$('[data-calendar-hero]').textContent;
    toggle();
    assert.equal($('[data-calendar-toggle]').getAttribute('aria-expanded'),'true');
    assert.equal($('[data-calendar-toggle]').textContent,'Show next 5');
    assert.match($('[data-calendar-heading]').textContent,/NRRS · FULL SCHEDULE/);
    assert.equal(rows().length,nrrs.length,`${mode}: full includes every selected-league entry`);
    assert.equal($('[data-calendar-hero]').textContent,nextHero,'Full view must retain the next-race countdown');
    assert.equal(rows()[0].querySelector('b').textContent,'RESULTS →');
    assert.equal(rows()[0].getAttribute('href'),`/event/${eventSlug(nrrs[0])}/`);
    assert.equal(rows()[1].querySelector('b').textContent,'COMPLETED');
    assert.ok(rows()[0].querySelector('span').textContent.includes('2026'),'Full dates include the year');
    const offWeek=rows().find(row=>row.querySelector('b').textContent==='OFF WEEK');
    assert.ok(offWeek);assert.equal(offWeek.tagName,'DIV','Off weeks must not link to nonexistent event pages');
    assert.match(rows().at(-1).textContent,/DATE TBD/,'Undated rounds appear last');
    const first=rows()[0];first.focus();clockTick();
    assert.equal(rows()[0],first,'Timer ticks must retain existing links and keyboard focus');
    assert.equal(w.document.activeElement,first);
    select('kmart');assert.equal(rows().length,kmart.length,'Full view follows the selected league');
    assert.ok(rows().every(row=>row.querySelector('small').textContent.startsWith('KMART')));
    select('all');assert.equal(rows().length,events.length);
    select('nrrs');toggle();assert.equal(rows().length,5,'Collapse restores next five for the current league');
    assert.ok(rows().every(row=>row.querySelector('small').textContent.startsWith('NRRS')));

    // Publishing changes to a track/time must refresh the list even if the
    // event's stable date and title did not change.
    const updated=structuredClone(events),edited=updated.find(event=>event.league==='nrrs'&&event.date==='2026-10-19');
    edited.track='Live & Updated Raceway';edited.time='9:00 PM ET';
    publish({'schedule-events':updated});
    assert.equal(rows()[0].querySelector('strong').textContent,'Live & Updated Raceway');
    assert.match(rows()[0].querySelector('em').textContent,/9:00 PM ET/);
    assert.match($('[data-calendar-hero]').textContent,/Live & Updated Raceway/);
    assert.match($('[data-calendar-hero]').textContent,/9:00 PM ET/);
    toggle();
    publish({results:[...initialResults,{league:'nrrs',date:edited.date,title:edited.title,entries:[]}]});
    assert.equal(rows().find(row=>row.querySelector('strong').textContent===edited.track).querySelector('b').textContent,'RESULTS →','Published results update full-view status immediately');
    assert.match($('[data-calendar-hero]').textContent,/nrrs Track 20/,'Results still advance the next-race hero');

    toggle();publish({'schedule-events':events.filter(event=>event.league==='nrrs'&&event.date&&event.date<'2026-10-18')});
    assert.equal(rows().length,0,'A completed season has no upcoming races');
    $('[data-calendar-open-full]').click();assert.equal(rows().length,2,'Completed-season action opens the full calendar');
    assert.equal($('[data-calendar-toggle]').getAttribute('aria-expanded'),'true');
    publish({'schedule-events':[nrrs.at(-1)]});assert.equal(rows().length,1);assert.match($('[data-calendar-hero]').textContent,/DATE TBD/);
    assert.ok(!w.document.body.textContent.includes('NaN'),'An undated-only league must not show a broken countdown');
    publish({'schedule-events':[]});assert.equal(rows().length,0);assert.match($('[data-calendar-list]').textContent,/No events have been published/);
    assert.ok(!w.document.body.textContent.includes('NaN'));
  }finally{w.close();}
}
const waitFor=async(predicate,label)=>{
  for(let attempt=0;attempt<100;attempt++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,10));}
  assert.fail(label);
};
for(const mode of ['seed','cached','event']){
  for(const [path,league,full] of [['/schedule/kmart#full','kmart',true],['/schedule/kmart/?from=fixture#full','kmart',true],['/schedule/kmart/','kmart',false],['/schedule/nrrs/#full','nrrs',true],['/schedule/#full','all',true],['/schedule/#main','all',false]]){
    const link=new URL(path,'https://aetherwing.net');
    const dom=new JSDOM(`<link rel="canonical" href="${link.origin}${link.pathname}">${markup}`,{url:link.href,runScripts:'outside-only'});
    const w=dom.window,$=selector=>w.document.querySelector(selector);
    try{
      const RealDate=w.Date,now=RealDate.parse('2026-10-18T12:00:00Z');
      w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}};
      let clockTick;w.setInterval=fn=>{clockTick=fn;return 1;};
      const payload={'schedule-events':events,results:initialResults};
      if(mode==='cached')w.__AETHERWING_CONTENT__=payload;
      w.eval(`const initial=${JSON.stringify(mode==='seed'?events:[])},initialResults=${JSON.stringify(mode==='seed'?initialResults:[])};\n${script}`);
      const publish=()=>w.dispatchEvent(new w.CustomEvent('aetherwing:content',{detail:payload}));
      if(mode==='event')publish();
      const selected=()=>$('[data-series][aria-pressed="true"]')?.dataset.series;
      const expanded=()=>$('[data-calendar-toggle]').getAttribute('aria-expanded')==='true';
      assert.equal(selected(),league,`${mode}: ${path} opens the linked league`);
      assert.equal(expanded(),full,`${mode}: fragment selects full/default view`);
      const count=w.document.querySelectorAll('[data-calendar-list] .aw-calendar__event').length;
      assert.equal(count,full?(league==='all'?events.length:events.filter(event=>event.league===league).length):5);
      const initialLength=w.history.length;clockTick();publish();
      $(`[data-series="${league}"]`).click();
      assert.equal(w.history.length,initialLength,'Clock ticks and live publications must not create navigation entries');
      assert.equal(w.location.href,link.href,'Initial loading and live hydration retain the shared URL');
      $('[data-series="nrrs"]').click();
      const beforeToggle=w.location.href;
      assert.equal(w.location.pathname,'/schedule/nrrs/');assert.equal(w.location.hash,full?'#full':'');
      assert.equal(w.location.search,link.search,'Navigating calendar views preserves query parameters');
      assert.equal($('link[rel="canonical"]').href,'https://aetherwing.net/schedule/nrrs/');
      $('[data-calendar-toggle]').click();
      const afterToggle=w.location.href;assert.equal(w.location.hash,full?'':'#full');
      w.history.back();await waitFor(()=>w.location.href===beforeToggle&&expanded()===full,'Back must restore league and view');
      assert.equal(selected(),'nrrs');
      w.history.forward();await waitFor(()=>w.location.href===afterToggle&&expanded()===!full,'Forward must restore league and view');
      // Editing only the fragment must update the existing page too.
      w.location.hash=expanded()?'':'full';
      await waitFor(()=>expanded()===full,'Changing the fragment must select the corresponding view');
      $('[data-series="all"]').click();assert.equal(w.location.pathname,'/schedule/');assert.equal(expanded(),full);
    }finally{w.close();}
  }
}
console.log('PASS: next-five/full league schedules, shareable URLs, fragment/history restoration, complete seasons, off weeks, TBD dates, stable links, focus, and seed/cached/live updates.');

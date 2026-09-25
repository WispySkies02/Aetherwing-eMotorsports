(()=>{
  const THEMES={
    'summer-end':{title:"SUMMER'S END",subtitle:'LAST LIGHT OF THE SEASON',effect:'glow',density:14,ui:'sunset'},
    'halloween-teaser':{title:'HALLOWEEN IS CREEPING IN',subtitle:'SUBTLE SPOOKY SEASON',effect:'haze',density:3,ui:'spooky-soft'},
    'halloween':{title:'SPOOKY SEASON',subtitle:'AETHERWING AFTER DARK',effect:'halloween',density:18,ui:'spooky'},
    'halloween-week':{title:'HALLOWEEN WEEK',subtitle:'FULL SEND · FULL SPOOKY',effect:'halloween',density:28,ui:'spooky-max'},
    'fall':{title:'FALL AT AETHERWING',subtitle:'COOL AIR · HOT LAPS',effect:'leaves',density:16,ui:'harvest'},
    'christmas-teaser':{title:'CHRISTMAS IS COMING',subtitle:'FIRST LIGHTS OF THE SEASON',effect:'twinkle',density:12,ui:'holiday-soft'},
    'christmas':{title:'CHRISTMAS / WINTER',subtitle:'RACE THROUGH THE HOLIDAYS',effect:'snow',density:28,ui:'holiday'},
    'christmas-week':{title:'CHRISTMAS WEEK',subtitle:'MERRY & BRIGHT · AETHERWING',effect:'snow-twinkle',density:44,ui:'holiday-max',lights:true},
    'calm-winter':{title:'WINTER RESET',subtitle:'QUIET DAYS · NEXT RACE AHEAD',effect:'snow',density:12,ui:'frost'},
    'new-year':{title:'NEW YEAR',subtitle:'NEW LAPS · SAME FIGHT',effect:'fireworks',density:5,ui:'metallic'},
    'clean-winter':{title:'CLEAN WINTER',subtitle:'COLD AIR · CLEAR FOCUS',effect:'snow',density:9,ui:'frost'},
    'valentine-teaser':{title:'VALENTINE TEASER',subtitle:'A LITTLE HEART IN THE GARAGE',effect:'petals',density:8,ui:'rose-soft'},
    'valentine':{title:"VALENTINE'S WEEK",subtitle:'LOVE THE RACE · LOVE THE TEAM',effect:'petals',density:16,ui:'rose'},
    'late-winter':{title:'LATE WINTER',subtitle:'THE THAW IS COMING',effect:'snow',density:6,ui:'thaw'},
    'spring':{title:'SPRING',subtitle:'FRESH SEASON · FRESH START',effect:'petals',density:14,ui:'spring'},
    'st-patrick':{title:"ST. PATRICK'S DAY",subtitle:'A FLASH OF GREEN',effect:'twinkle',density:12,ui:'green'},
    'easter':{title:'EASTER / SPRING',subtitle:'HOPE · RENEWAL · NEW BEGINNINGS',effect:'petals',density:18,ui:'easter'},
    'memorial-day':{title:'MEMORIAL DAY',subtitle:'REMEMBER & HONOR',effect:'twinkle',density:7,ui:'memorial'},
    'summer':{title:'SUMMER',subtitle:'LONG DAYS · FAST LAPS',effect:'glow',density:18,ui:'summer'},
    'independence-day':{title:'INDEPENDENCE DAY',subtitle:'RED · WHITE · BLUE',effect:'fireworks',density:6,ui:'patriotic'},
  };
  const pad=(value)=>String(value).padStart(2,'0');
  const dateKey=(year,month,day)=>`${year}-${pad(month)}-${pad(day)}`;
  const partsInEastern=(date=new Date())=>{
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter((p)=>p.type!=='literal').map((p)=>[p.type,p.value]));
    return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day)};
  };
  const easterSunday=(year)=>{
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(Date.UTC(year,month-1,day));
  };
  const memorialDay=(year)=>{const last=new Date(Date.UTC(year,4,31));last.setUTCDate(31-((last.getUTCDay()+6)%7));return last;};
  const thanksgiving=(year)=>{const first=new Date(Date.UTC(year,10,1));const firstThursday=1+((4-first.getUTCDay()+7)%7);return new Date(Date.UTC(year,10,firstThursday+21));};
  const between=(key,start,end)=>key>=start&&key<=end;
  function automaticTheme({year,month,day}){
    const key=dateKey(year,month,day);
    if(key===dateKey(year,12,31)||key===dateKey(year,1,1))return 'new-year';
    if(month===1&&day>=2)return 'clean-winter';
    if(month===2&&day<=7)return 'valentine-teaser';
    if(month===2&&day<=14)return 'valentine';
    if(month===2)return 'late-winter';
    if(month===3&&day===17)return 'st-patrick';
    const easter=easterSunday(year),easterStart=new Date(easter);easterStart.setUTCDate(easter.getUTCDate()-6);
    const easterStartKey=easterStart.toISOString().slice(0,10),easterKey=easter.toISOString().slice(0,10);
    if(between(key,easterStartKey,easterKey))return 'easter';
    const memorial=memorialDay(year),memorialStart=new Date(memorial);memorialStart.setUTCDate(memorial.getUTCDate()-3);
    if(between(key,memorialStart.toISOString().slice(0,10),memorial.toISOString().slice(0,10)))return 'memorial-day';
    if((month===3&&day>=1)||(month===4)||(month===5&&key<memorialStart.toISOString().slice(0,10)))return 'spring';
    if(month===5&&key>memorial.toISOString().slice(0,10))return 'summer';
    if(month===6&&day<=27)return 'summer';
    if((month===6&&day>=28)||(month===7&&day<=4))return 'independence-day';
    if((month===7&&day>=5)||(month===8&&day<=24))return 'summer';
    if(year===2026&&month===9&&day>=20&&day<=24)return 'summer-end';
    if(year!==2026&&((month===8&&day>=25)||(month===9&&day<=7)))return 'summer-end';
    if(year!==2026&&month===9&&day>=8&&day<=24)return 'standard';
    if(year===2026&&month===9&&day<20)return 'standard';
    if(month===9&&day>=25)return 'halloween-teaser';
    if(month===10&&day<=24)return 'halloween';
    if(month===10)return 'halloween-week';
    const thanks=thanksgiving(year).toISOString().slice(0,10);
    if(month===11&&key<=thanks)return 'fall';
    if(month===11)return 'christmas-teaser';
    if(month===12&&day<=17)return 'christmas';
    if(month===12&&day<=25)return 'christmas-week';
    if(month===12&&day<=30)return 'calm-winter';
    return 'standard';
  }
  function resolveTheme(){
    const forced=new URLSearchParams(location.search).get('season');
    if(forced==='off'||forced==='standard')return 'standard';
    if(forced&&Object.hasOwn(THEMES,forced))return forced;
    return automaticTheme(partsInEastern());
  }
  const palette=(theme)=>{
    const css=getComputedStyle(document.documentElement);
    return {primary:css.getPropertyValue('--season-primary').trim()||'#f3b51d',secondary:css.getPropertyValue('--season-secondary').trim()||'#12aaf5',tertiary:css.getPropertyValue('--season-tertiary').trim()||'#fff'};
  };
  const seeded=(i,salt=1)=>{const x=Math.sin((i+1)*12.9898+salt*78.233)*43758.5453;return x-Math.floor(x);};
  const styleFor=(i)=>`--x:${Math.round(seeded(i,1)*100)}%;--delay:-${(seeded(i,2)*18).toFixed(2)}s;--dur:${(12+seeded(i,3)*18).toFixed(2)}s;--size:${(3+seeded(i,4)*7).toFixed(1)}px;--drift:${Math.round((seeded(i,5)-.5)*180)}px`;
  let mountedTheme='';
  function removeAtmosphere(){document.querySelector('.aw-season-atmosphere')?.remove();mountedTheme='';}
  function mountAtmosphere(theme){
    if(!document.body||theme==='standard'){removeAtmosphere();return;}
    const meta=THEMES[theme];if(!meta||mountedTheme===theme)return;
    removeAtmosphere();
    const layer=document.createElement('div');layer.className=`aw-season-atmosphere aw-season-atmosphere--${meta.effect}`;layer.setAttribute('aria-hidden','true');
    const colors=palette(theme);layer.style.setProperty('--fx-primary',colors.primary);layer.style.setProperty('--fx-secondary',colors.secondary);layer.style.setProperty('--fx-tertiary',colors.tertiary);
    const add=(cls,count,extra='')=>{for(let i=0;i<count;i++){const el=document.createElement('i');el.className=cls;el.style.cssText=styleFor(i)+extra;layer.appendChild(el);}};
    if(meta.effect==='haze'){add('aw-fx__haze',3);}
    else if(meta.effect==='halloween'){add('aw-fx__haze',3);add('aw-fx__ember',meta.density);add('aw-fx__bat',theme==='halloween-week'?4:2);}
    else if(meta.effect==='leaves'){add('aw-fx__leaf',meta.density);}
    else if(meta.effect==='snow'){add('aw-fx__snow',meta.density);}
    else if(meta.effect==='snow-twinkle'){add('aw-fx__snow',meta.density);add('aw-fx__twinkle',12);}
    else if(meta.effect==='petals'){add('aw-fx__petal',meta.density);}
    else if(meta.effect==='glow'){add('aw-fx__glow',meta.density);}
    else if(meta.effect==='twinkle'){add('aw-fx__twinkle',meta.density);}
    else if(meta.effect==='fireworks'){
      for(let i=0;i<meta.density;i++){const el=document.createElement('i');el.className='aw-fx__burst';el.style.cssText=`--x:${12+seeded(i,8)*76}%;--y:${10+seeded(i,9)*52}%;--delay:-${(seeded(i,10)*22).toFixed(2)}s;--dur:${(8+seeded(i,11)*8).toFixed(2)}s`;layer.appendChild(el);}
    }
    if(meta.lights){
      const makeStrand=(position,count)=>{
        const strand=document.createElement('div');strand.className=`aw-fx__lights aw-fx__lights--${position}`;
        for(let i=0;i<count;i++){
          const bulb=document.createElement('b');bulb.style.setProperty('--light-delay',`${(seeded(i,20)*2.8).toFixed(2)}s`);bulb.style.setProperty('--light-lift',`${Math.round(seeded(i,21)*8)}px`);strand.appendChild(bulb);
        }
        layer.appendChild(strand);
      };
      makeStrand('top',30);makeStrand('left',18);makeStrand('right',18);
    }
    document.body.prepend(layer);mountedTheme=theme;
  }
  function apply(){
    const theme=resolveTheme();
    if(theme==='standard'){delete document.documentElement.dataset.season;delete document.documentElement.dataset.seasonUi;}else{document.documentElement.dataset.season=theme;document.documentElement.dataset.seasonUi=THEMES[theme]?.ui||theme;}
    window.__AETHERWING_SEASON__={id:theme,...(THEMES[theme]||{title:'',subtitle:'',effect:'none',density:0,ui:'default'})};
    const banner=document.querySelector('[data-season-banner]');
    if(banner){
      const info=window.__AETHERWING_SEASON__,active=theme!=='standard';
      banner.hidden=!active;banner.setAttribute('aria-label',active?`${info.title} seasonal theme`:'Seasonal theme');
      const title=banner.querySelector('[data-season-title]'),subtitle=banner.querySelector('[data-season-subtitle]');
      if(title)title.textContent=info.title||'';if(subtitle)subtitle.textContent=info.subtitle||'';
    }
    mountAtmosphere(theme);
  }
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  setInterval(apply,60*1000);
})();

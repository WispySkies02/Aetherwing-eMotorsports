(()=>{
  const THEMES={
    'new-year':{title:'NEW YEAR',subtitle:'NEW LAPS · SAME FIGHT',icon:'✨',effect:'fireworks',density:5,ui:'metallic'},
    'clean-winter':{title:'CLEAN WINTER',subtitle:'COLD AIR · CLEAR FOCUS',icon:'❄',effect:'snow',density:9,ui:'frost'},
    'valentine-teaser':{title:'VALENTINE TEASER',subtitle:'A LITTLE HEART IN THE GARAGE',icon:'♡',effect:'petals',density:8,ui:'rose-soft'},
    valentine:{title:"VALENTINE'S WEEK",subtitle:'LOVE THE RACE · LOVE THE TEAM',icon:'♥',effect:'petals',density:16,ui:'rose'},
    'late-winter':{title:'LATE WINTER',subtitle:'THE THAW IS COMING',icon:'❅',effect:'snow',density:6,ui:'thaw'},
    spring:{title:'SPRING',subtitle:'FRESH SEASON · FRESH START',icon:'✿',effect:'petals',density:14,ui:'spring'},
    'st-patrick':{title:"ST. PATRICK'S DAY",subtitle:'A FLASH OF GREEN',icon:'☘',effect:'twinkle',density:12,ui:'green'},
    easter:{title:'EASTER / SPRING',subtitle:'HOPE · RENEWAL · NEW BEGINNINGS',icon:'✝',effect:'petals',density:18,ui:'easter'},
    'memorial-day':{title:'MEMORIAL DAY',subtitle:'REMEMBER & HONOR',icon:'★',effect:'twinkle',density:7,ui:'memorial'},
    summer:{title:'SUMMER',subtitle:'LONG DAYS · FAST LAPS',icon:'☀',effect:'glow',density:18,ui:'summer'},
    'independence-day':{title:'INDEPENDENCE DAY',subtitle:'RED · WHITE · BLUE',icon:'✹',effect:'fireworks',density:6,ui:'patriotic'},
    'summer-end':{title:"SUMMER'S END",subtitle:'LAST LIGHT OF THE SEASON',icon:'◒',effect:'glow',density:14,ui:'sunset'},
    'halloween-teaser':{title:'HALLOWEEN IS CREEPING IN',subtitle:'SUBTLE SPOOKY SEASON',icon:'☾',effect:'haze',density:3,ui:'spooky-soft'},
    halloween:{title:'SPOOKY SEASON',subtitle:'AETHERWING AFTER DARK',icon:'🎃',effect:'halloween',density:18,ui:'spooky'},
    'halloween-week':{title:'HALLOWEEN WEEK',subtitle:'FULL SEND · FULL SPOOKY',icon:'🦇',effect:'halloween',density:28,ui:'spooky-max'},
    fall:{title:'FALL AT AETHERWING',subtitle:'COOL AIR · HOT LAPS',icon:'🍂',effect:'leaves',density:16,ui:'harvest'},
    'christmas-teaser':{title:'CHRISTMAS IS COMING',subtitle:'FIRST LIGHTS OF THE SEASON',icon:'💡',effect:'twinkle',density:12,ui:'holiday-soft'},
    christmas:{title:'CHRISTMAS / WINTER',subtitle:'RACE THROUGH THE HOLIDAYS',icon:'❄',effect:'snow',density:28,ui:'holiday'},
    'christmas-week':{title:'CHRISTMAS WEEK',subtitle:'MERRY & BRIGHT · AETHERWING',icon:'🎄',effect:'snow-twinkle',density:44,ui:'holiday-max',lights:true},
    'calm-winter':{title:'WINTER RESET',subtitle:'QUIET DAYS · NEXT RACE AHEAD',icon:'❅',effect:'snow',density:12,ui:'frost'},
  };

  const OBSERVANCES={
    'new-years-day':{title:"NEW YEAR'S DAY",subtitle:'THANK GOD FOR THE YEAR AHEAD · PSALM 118:24',icon:'✦',ui:'gratitude',add:'twinkle'},
    'good-friday':{title:'GOOD FRIDAY',subtitle:'IT IS FINISHED · JOHN 19:30',icon:'✝',ui:'solemn',suppress:true},
    'easter-sunday':{title:'EASTER SUNDAY',subtitle:'HE IS RISEN · MATTHEW 28:6',icon:'✝',ui:'resurrection',add:'sunrise'},
    thanksgiving:{title:'THANKSGIVING',subtitle:'IN EVERYTHING GIVE THANKS · 1 THESSALONIANS 5:18',icon:'✦',ui:'gratitude',add:'glow'},
    'christmas-eve':{title:'CHRISTMAS EVE',subtitle:'GOOD TIDINGS OF GREAT JOY · LUKE 2:10–11',icon:'★',ui:'holy-night',add:'twinkle'},
    'christmas-day':{title:'CHRISTMAS DAY',subtitle:'GLORY TO GOD IN THE HIGHEST · LUKE 2:14',icon:'✝',ui:'nativity',add:'twinkle'},
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
  const addDays=(date,days)=>{const copy=new Date(date);copy.setUTCDate(copy.getUTCDate()+days);return copy;};
  const between=(key,start,end)=>key>=start&&key<=end;
  const iso=(date)=>date.toISOString().slice(0,10);

  function automaticTheme({year,month,day}){
    const key=dateKey(year,month,day);
    if((month===12&&day===31)||(month===1&&day===1))return 'new-year';
    if(month===1)return 'clean-winter';
    if(month===2&&day<=7)return 'valentine-teaser';
    if(month===2&&day<=14)return 'valentine';
    if(month===2)return 'late-winter';
    if(month===3&&day===17)return 'st-patrick';

    const easter=easterSunday(year),easterStart=addDays(easter,-6);
    if(between(key,iso(easterStart),iso(easter)))return 'easter';

    const memorial=memorialDay(year),memorialStart=addDays(memorial,-3);
    if(between(key,iso(memorialStart),iso(memorial)))return 'memorial-day';

    if(month===3||month===4||(month===5&&key<iso(memorialStart)))return 'spring';
    if((month===5&&key>iso(memorial))||month===6||(month===7&&day>=5)||month===8||(month===9&&day<=19)){
      if((month===6&&day>=28)||(month===7&&day<=4))return 'independence-day';
      return 'summer';
    }
    if(month===9&&day>=20&&day<=24)return 'summer-end';
    if(month===9&&day>=25)return 'halloween-teaser';
    if(month===10&&day<=24)return 'halloween';
    if(month===10)return 'halloween-week';

    const thanks=thanksgiving(year);
    if(month===11&&key<=iso(thanks))return 'fall';
    if(month===11)return 'christmas-teaser';
    if(month===12&&day<=17)return 'christmas';
    if(month===12&&day<=25)return 'christmas-week';
    if(month===12&&day<=30)return 'calm-winter';
    return 'standard';
  }

  function automaticObservance({year,month,day}){
    const key=dateKey(year,month,day);
    if(month===1&&day===1)return 'new-years-day';
    const easter=easterSunday(year);
    if(key===iso(addDays(easter,-2)))return 'good-friday';
    if(key===iso(easter))return 'easter-sunday';
    if(key===iso(thanksgiving(year)))return 'thanksgiving';
    if(month===12&&day===24)return 'christmas-eve';
    if(month===12&&day===25)return 'christmas-day';
    return '';
  }

  function resolveTheme(){
    const params=new URLSearchParams(location.search),forced=params.get('season');
    if(forced==='off'||forced==='standard')return 'standard';
    if(forced&&Object.hasOwn(THEMES,forced))return forced;
    return automaticTheme(partsInEastern());
  }
  function resolveObservance(){
    const params=new URLSearchParams(location.search),forced=params.get('observance'),forcedSeason=params.get('season');
    if(forced==='off'||forced==='none')return '';
    if(forced&&Object.hasOwn(OBSERVANCES,forced))return forced;
    if(forcedSeason)return '';
    return automaticObservance(partsInEastern());
  }

  const palette=()=>{
    const css=getComputedStyle(document.documentElement);
    return {primary:css.getPropertyValue('--season-primary').trim()||'#f3b51d',secondary:css.getPropertyValue('--season-secondary').trim()||'#12aaf5',tertiary:css.getPropertyValue('--season-tertiary').trim()||'#fff'};
  };
  const seeded=(i,salt=1)=>{const x=Math.sin((i+1)*12.9898+salt*78.233)*43758.5453;return x-Math.floor(x);};
  const styleFor=(i)=>`--x:${Math.round(seeded(i,1)*100)}%;--delay:-${(seeded(i,2)*18).toFixed(2)}s;--dur:${(12+seeded(i,3)*18).toFixed(2)}s;--size:${(3+seeded(i,4)*7).toFixed(1)}px;--drift:${Math.round((seeded(i,5)-.5)*180)}px`;
  const buildHolidayTree=()=>{
    const tree=document.createElement('div');tree.className='aw-fx__tree';tree.setAttribute('aria-hidden','true');
    tree.innerHTML='<i class="aw-fx__tree-star">★</i><span class="aw-fx__tree-tier aw-fx__tree-tier--1"></span><span class="aw-fx__tree-tier aw-fx__tree-tier--2"></span><span class="aw-fx__tree-tier aw-fx__tree-tier--3"></span><span class="aw-fx__tree-trunk"></span><span class="aw-fx__tree-lights"></span>';
    const lights=tree.querySelector('.aw-fx__tree-lights');
    const points=[[50,20],[38,34],[62,35],[28,49],[49,49],[72,50],[20,65],[39,66],[60,65],[80,66],[31,80],[52,79],[71,80]];
    points.forEach(([x,y],i)=>{const bulb=document.createElement('b');bulb.style.cssText=`--tree-x:${x}%;--tree-y:${y}%;--tree-delay:-${(seeded(i,31)*2.4).toFixed(2)}s`;lights.appendChild(bulb);});
    return tree;
  };
  const addObservanceMotif=(layer,observance)=>{
    if(!observance)return;
    const spec={
      'new-years-day':['✦','✝'],
      'good-friday':['✝',''],
      'easter-sunday':['✝','☀'],
      thanksgiving:['✦','✝'],
      'christmas-eve':['★',''],
      'christmas-day':['✝','★']
    }[observance];
    if(!spec)return;
    const motif=document.createElement('div');motif.className=`aw-observance-motif aw-observance-motif--${observance}`;motif.setAttribute('aria-hidden','true');
    motif.innerHTML=`<span>${spec[0]}</span>${spec[1]?`<i>${spec[1]}</i>`:''}`;layer.appendChild(motif);
  };
  let mountedKey='';
  function removeAtmosphere(){document.querySelector('.aw-season-atmosphere')?.remove();mountedKey='';}
  function mountAtmosphere(theme,observance){
    const key=`${theme}|${observance}`;
    if(!document.body||theme==='standard'){removeAtmosphere();return;}
    const meta=THEMES[theme],obs=OBSERVANCES[observance];
    if(!meta||mountedKey===key)return;
    removeAtmosphere();
    const layer=document.createElement('div');layer.className=`aw-season-atmosphere aw-season-atmosphere--${meta.effect}`;layer.setAttribute('aria-hidden','true');
    const colors=palette();layer.style.setProperty('--fx-primary',colors.primary);layer.style.setProperty('--fx-secondary',colors.secondary);layer.style.setProperty('--fx-tertiary',colors.tertiary);
    const add=(cls,count,offset=0)=>{for(let i=0;i<count;i++){const el=document.createElement('i');el.className=cls;el.style.cssText=styleFor(i+offset);layer.appendChild(el);}};

    if(!obs?.suppress){
      if(meta.effect==='haze')add('aw-fx__haze',3);
      else if(meta.effect==='halloween'){add('aw-fx__haze',3);add('aw-fx__ember',meta.density);add('aw-fx__bat',theme==='halloween-week'?4:2);}
      else if(meta.effect==='leaves')add('aw-fx__leaf',meta.density);
      else if(meta.effect==='snow')add('aw-fx__snow',meta.density);
      else if(meta.effect==='snow-twinkle'){add('aw-fx__snow',meta.density);add('aw-fx__twinkle',12);}
      else if(meta.effect==='petals')add('aw-fx__petal',meta.density);
      else if(meta.effect==='glow')add('aw-fx__glow',meta.density);
      else if(meta.effect==='twinkle')add('aw-fx__twinkle',meta.density);
      else if(meta.effect==='fireworks'){
        for(let i=0;i<meta.density;i++){const el=document.createElement('i');el.className='aw-fx__burst';el.style.cssText=`--x:${12+seeded(i,8)*76}%;--y:${10+seeded(i,9)*52}%;--delay:-${(seeded(i,10)*22).toFixed(2)}s;--dur:${(8+seeded(i,11)*8).toFixed(2)}s`;layer.appendChild(el);}
      }
      if(obs?.add==='twinkle')add('aw-fx__twinkle',10,71);
      if(obs?.add==='glow')add('aw-fx__glow',8,83);
      if(obs?.add==='sunrise'){add('aw-fx__glow',12,101);add('aw-fx__twinkle',7,121);}
    }

    if(meta.lights){
      const makeStrand=(position,count)=>{
        const strand=document.createElement('div');strand.className=`aw-fx__lights aw-fx__lights--${position}`;
        for(let i=0;i<count;i++){const bulb=document.createElement('b');bulb.style.setProperty('--light-delay',`${(seeded(i,20)*2.8).toFixed(2)}s`);bulb.style.setProperty('--light-lift',`${Math.round(seeded(i,21)*8)}px`);strand.appendChild(bulb);}
        layer.appendChild(strand);
      };
      makeStrand('top',30);makeStrand('left',18);makeStrand('right',18);
    }
    if(theme==='christmas-week')layer.appendChild(buildHolidayTree());
    addObservanceMotif(layer,observance);
    document.body.prepend(layer);mountedKey=key;
  }

  function apply(){
    const theme=resolveTheme(),observance=resolveObservance();
    if(theme==='standard'){delete document.documentElement.dataset.season;delete document.documentElement.dataset.seasonUi;}else{document.documentElement.dataset.season=theme;document.documentElement.dataset.seasonUi=THEMES[theme]?.ui||theme;}
    if(observance){document.documentElement.dataset.observance=observance;document.documentElement.dataset.observanceUi=OBSERVANCES[observance]?.ui||observance;}else{delete document.documentElement.dataset.observance;delete document.documentElement.dataset.observanceUi;}

    window.__AETHERWING_SEASON__={id:theme,...(THEMES[theme]||{title:'',subtitle:'',icon:'',effect:'none',density:0,ui:'default'})};
    window.__AETHERWING_OBSERVANCE__=observance?{id:observance,...OBSERVANCES[observance]}:null;
    const banner=document.querySelector('[data-season-banner]');
    if(banner){
      const info=window.__AETHERWING_OBSERVANCE__||window.__AETHERWING_SEASON__,active=theme!=='standard'||Boolean(observance);
      banner.hidden=!active;banner.setAttribute('aria-label',active?`${info.title} seasonal theme`:'Seasonal theme');
      const icon=banner.querySelector('[data-season-icon]'),title=banner.querySelector('[data-season-title]'),subtitle=banner.querySelector('[data-season-subtitle]');
      if(icon)icon.textContent=info.icon||'';if(title)title.textContent=info.title||'';if(subtitle)subtitle.textContent=info.subtitle||'';
    }
    mountAtmosphere(theme,observance);
  }

  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  setInterval(apply,60*1000);
})();

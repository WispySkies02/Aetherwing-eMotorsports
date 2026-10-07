(()=>{
  const THEMES={
    'new-year':{title:'NEW YEAR',subtitle:'NEW LAPS · SAME FIGHT',icon:'✦',effect:'fireworks',density:9,ui:'metallic'},
    'clean-winter':{title:'CLEAN WINTER',subtitle:'COLD AIR · CLEAR FOCUS',icon:'❄',effect:'snow',density:16,ui:'frost'},
    'valentine-teaser':{title:'VALENTINE TEASER',subtitle:'FIRST HEARTS · FULL THEME',icon:'♡',effect:'petals',density:12,ui:'rose-soft'},
    valentine:{title:"VALENTINE'S WEEK",subtitle:'LOVE THE RACE · LOVE THE TEAM',icon:'♥',effect:'petals',density:26,ui:'rose'},
    'late-winter':{title:'LATE WINTER',subtitle:'THE THAW IS COMING',icon:'❅',effect:'snow',density:10,ui:'thaw'},
    spring:{title:'SPRING',subtitle:'FRESH SEASON · FRESH START',icon:'✿',effect:'petals',density:22,ui:'spring'},
    'st-patrick':{title:"ST. PATRICK'S DAY",subtitle:'A FLASH OF GREEN',icon:'☘',effect:'twinkle',density:18,ui:'green'},
    easter:{title:'HOLY WEEK / EASTER',subtitle:'I AM THE RESURRECTION, AND THE LIFE · JOHN 11:25',icon:'☀',effect:'petals',density:24,ui:'easter',faith:true,verse:'I AM THE RESURRECTION, AND THE LIFE',reference:'JOHN 11:25',scene:'holy-week'},
    'memorial-day':{title:'MEMORIAL DAY',subtitle:'REMEMBER & HONOR',icon:'★',effect:'twinkle',density:10,ui:'memorial'},
    summer:{title:'SUMMER',subtitle:'LONG DAYS · FAST LAPS',icon:'☀',effect:'glow',density:26,ui:'summer'},
    'independence-day':{title:'INDEPENDENCE DAY',subtitle:'RED · WHITE · BLUE',icon:'✹',effect:'fireworks',density:10,ui:'patriotic'},
    'summer-end':{title:"SUMMER'S END",subtitle:'LAST LIGHT OF THE SEASON',icon:'◒',effect:'glow',density:22,ui:'sunset'},
    'halloween-teaser':{title:'HALLOWEEN IS CREEPING IN',subtitle:'FIRST WAVE · FULL SPOOKY UI',icon:'☾',effect:'haze',density:5,ui:'spooky-soft'},
    halloween:{title:'SPOOKY SEASON',subtitle:'AETHERWING AFTER DARK',icon:'◐',effect:'halloween',density:32,ui:'spooky'},
    'halloween-week':{title:'HALLOWEEN WEEK',subtitle:'FULL SEND · FULL SPOOKY',icon:'◆',effect:'halloween',density:46,ui:'spooky-max'},
    fall:{title:'FALL AT AETHERWING',subtitle:'COOL AIR · HOT LAPS',icon:'❧',effect:'leaves',density:24,ui:'harvest'},
    'christmas-teaser':{title:'CHRISTMAS IS COMING',subtitle:'FIRST LIGHTS · FULL THEME',icon:'✦',effect:'twinkle',density:18,ui:'holiday-soft'},
    christmas:{title:'CHRISTMAS / WINTER',subtitle:'GLORY TO GOD IN THE HIGHEST · LUKE 2:14',icon:'★',effect:'snow',density:34,ui:'holiday',faith:true,verse:'GLORY TO GOD IN THE HIGHEST',reference:'LUKE 2:14',scene:'bethlehem'},
    'christmas-week':{title:'CHRISTMAS WEEK',subtitle:'GLORY TO GOD IN THE HIGHEST · LUKE 2:14',icon:'★',effect:'snow-twinkle',density:52,ui:'holiday-max',lights:true,faith:true,verse:'GLORY TO GOD IN THE HIGHEST',reference:'LUKE 2:14',scene:'bethlehem'},
    'calm-winter':{title:'WINTER RESET',subtitle:'QUIET DAYS · NEXT RACE AHEAD',icon:'❅',effect:'snow',density:18,ui:'frost'},
  };

  const OBSERVANCES={
    'new-years-day':{title:"NEW YEAR'S DAY",subtitle:'THIS IS THE DAY WHICH THE LORD HATH MADE · PSALM 118:24',icon:'✦',ui:'gratitude',add:'twinkle',faith:true,verse:'THIS IS THE DAY WHICH THE LORD HATH MADE',reference:'PSALM 118:24',motif:'gratitude'},
    'palm-sunday':{title:'PALM SUNDAY',subtitle:'HOSANNA IN THE HIGHEST · MATTHEW 21:9',icon:'❧',ui:'palm-sunday',faith:true,verse:'HOSANNA IN THE HIGHEST',reference:'MATTHEW 21:9',motif:'palms'},
    'good-friday':{title:'GOOD FRIDAY',subtitle:'IT IS FINISHED · JOHN 19:30',icon:'◌',ui:'solemn',suppress:true,faith:true,verse:'IT IS FINISHED',reference:'JOHN 19:30',motif:'thorns'},
    'easter-sunday':{title:'EASTER SUNDAY',subtitle:'HE IS NOT HERE: FOR HE IS RISEN · MATTHEW 28:6',icon:'☀',ui:'resurrection',add:'sunrise',faith:true,verse:'HE IS NOT HERE: FOR HE IS RISEN',reference:'MATTHEW 28:6',motif:'empty-tomb'},
    thanksgiving:{title:'THANKSGIVING',subtitle:'IN EVERY THING GIVE THANKS · 1 THESSALONIANS 5:18',icon:'❧',ui:'gratitude',add:'glow',faith:true,verse:'IN EVERY THING GIVE THANKS',reference:'1 THESSALONIANS 5:18',motif:'wheat'},
    'christmas-eve':{title:'CHRISTMAS EVE',subtitle:'GOOD TIDINGS OF GREAT JOY · LUKE 2:10–11',icon:'★',ui:'holy-night',add:'twinkle',faith:true,verse:'GOOD TIDINGS OF GREAT JOY',reference:'LUKE 2:10–11',motif:'bethlehem'},
    'christmas-day':{title:'CHRISTMAS DAY',subtitle:'GLORY TO GOD IN THE HIGHEST · LUKE 2:14',icon:'★',ui:'nativity',add:'twinkle',faith:true,verse:'GLORY TO GOD IN THE HIGHEST',reference:'LUKE 2:14',motif:'bethlehem'},
  };

  const pad=(value)=>String(value).padStart(2,'0');
  const dateKey=(year,month,day)=>`${year}-${pad(month)}-${pad(day)}`;
  const partsInEastern=(date=new Date())=>{
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter((p)=>p.type!=='literal').map((p)=>[p.type,p.value]));
    return {year:Number(parts.year),month:Number(parts.month),day:Number(parts.day)};
  };

  // v2.0.4 — Aetherwing Anniversary Week is a recurring Oct. 1–7 Eastern-time
  // throwback to the team's 2015 debut identity. Oct. 8 at 12:00 AM ET hands
  // control straight back to the normal seasonal calendar (Halloween in October).
  const ANNIVERSARY_TIMEZONE='America/New_York';
  const anniversaryRetroActive=(date=new Date())=>{
    const params=new URLSearchParams(location.search),forced=params.get('anniversary');
    if(forced==='off'||forced==='modern')return false;
    if(forced==='retro'||forced==='on'||forced==='throwback')return true;
    const eastern=partsInEastern(date);
    return eastern.month===10&&eastern.day>=1&&eastern.day<=7;
  };
  const nextAnniversaryBoundary=(date=new Date())=>{
    const eastern=partsInEastern(date),year=eastern.year;
    // Oct. 1 and Oct. 8 occur during EDT under current U.S. DST rules (UTC-04:00).
    const start=Date.UTC(year,9,1,4,0,0),end=Date.UTC(year,9,8,4,0,0),now=date.getTime();
    if(now<start)return start;
    if(now<end)return end;
    return Date.UTC(year+1,9,1,4,0,0);
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

    const easter=easterSunday(year),easterStart=addDays(easter,-7);
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
    if(key===iso(addDays(easter,-7)))return 'palm-sunday';
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

  // v2.0.36 — every active theme is a full 200% visual takeover.
  // Visual completeness is no longer tied to a 100/150/200 calendar ladder.
  // Motion uses a separate, deliberately small performance budget so desktop and
  // mobile keep the atmosphere without turning the site into a GPU stress test.
  function automaticIntensity(parts,theme,observance){
    return theme==='standard'?0:200;
  }
  function resolveIntensity(theme,observance){
    return theme==='standard'?0:200;
  }
  const intensityLevel=(value)=>value>0?'takeover':'off';
  const motionProfile=()=>{
    const mobile=Boolean(window.matchMedia?.('(max-width:700px)').matches);
    const lowMemory=Number(navigator.deviceMemory||0)>0&&Number(navigator.deviceMemory)<=4;
    const lowCpu=Number(navigator.hardwareConcurrency||0)>0&&Number(navigator.hardwareConcurrency)<=4;
    const constrained=mobile||lowMemory||lowCpu;
    return {mobile,constrained,scale:mobile?.34:constrained?.42:.52,cap:mobile?10:constrained?14:22};
  };
  const scaledDensity=(base)=>{
    const profile=motionProfile();
    if(!base)return 0;
    return Math.min(profile.cap,Math.max(3,Math.round(base*profile.scale)));
  };

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
  const buildPalm=(side='left')=>{
    const palm=document.createElement('div');palm.className=`aw-faith-palm aw-faith-palm--${side}`;
    palm.innerHTML='<b></b>'+Array.from({length:9},(_,i)=>`<i style="--leaf:${i}"></i>`).join('');
    return palm;
  };
  const buildFaithScene=(theme)=>{
    const scene=THEMES[theme]?.scene;if(!scene)return null;
    const wrap=document.createElement('div');wrap.className=`aw-faith-scene aw-faith-scene--${scene}`;wrap.setAttribute('aria-hidden','true');
    if(scene==='holy-week'){
      wrap.appendChild(buildPalm('left'));wrap.appendChild(buildPalm('right'));
      const dawn=document.createElement('span');dawn.className='aw-faith-dawn';wrap.appendChild(dawn);
    }
    if(scene==='bethlehem'){
      wrap.innerHTML='<span class="aw-bethlehem__star"></span><span class="aw-bethlehem__skyline"><i></i><b></b><em></em></span>';
    }
    return wrap;
  };
  const buildObservanceMotif=(observance)=>{
    const obs=OBSERVANCES[observance];if(!obs?.motif)return null;
    const motif=document.createElement('div');motif.className=`aw-observance-motif aw-observance-motif--${observance} aw-observance-motif--${obs.motif}`;motif.setAttribute('aria-hidden','true');
    if(obs.motif==='palms'){motif.appendChild(buildPalm('left'));motif.appendChild(buildPalm('right'));}
    else if(obs.motif==='thorns')motif.innerHTML='<span class="aw-thorns__ring"></span><span class="aw-thorns__shadow"></span>';
    else if(obs.motif==='empty-tomb')motif.innerHTML='<span class="aw-tomb__sun"></span><span class="aw-tomb__rays"></span><span class="aw-tomb__hill"></span><span class="aw-tomb__mouth"></span><span class="aw-tomb__stone"></span><span class="aw-tomb__lily aw-tomb__lily--1"></span><span class="aw-tomb__lily aw-tomb__lily--2"></span>';
    else if(obs.motif==='wheat')motif.innerHTML='<span class="aw-wheat__glow"></span><span class="aw-wheat__stem aw-wheat__stem--1"></span><span class="aw-wheat__stem aw-wheat__stem--2"></span><span class="aw-wheat__stem aw-wheat__stem--3"></span>';
    else if(obs.motif==='bethlehem')motif.innerHTML='<span class="aw-bethlehem__star"></span><span class="aw-bethlehem__skyline"><i></i><b></b><em></em></span>';
    else motif.innerHTML='<span class="aw-gratitude__rays"></span>';
    return motif;
  };

  let mountedKey='';
  function removeAnniversaryHud(){document.querySelector('.aw-anniversary-hud')?.remove();}
  function syncAnniversaryLogos(active){
    document.querySelectorAll('img').forEach((img)=>{
      const src=img.getAttribute('src')||'';
      const isPrimary=src.endsWith('/images/brand/aetherwing-logo.png')||img.dataset.anniversarySwapped==='true';
      if(!isPrimary)return;
      if(active){
        if(img.dataset.anniversarySwapped!=='true')img.dataset.anniversaryNormalSrc=src;
        img.dataset.anniversarySwapped='true';
        img.setAttribute('src','/images/brand/aetherwing-anniversary-2015.png');
      }else if(img.dataset.anniversarySwapped==='true'){
        img.setAttribute('src',img.dataset.anniversaryNormalSrc||'/images/brand/aetherwing-logo.png');
        delete img.dataset.anniversarySwapped;delete img.dataset.anniversaryNormalSrc;
      }
    });
  }
  function mountAnniversaryHud(active){
    syncAnniversaryLogos(active);
    if(!active){removeAnniversaryHud();return;}
    if(document.querySelector('.aw-anniversary-hud')||!document.body)return;
    const hud=document.createElement('div');hud.className='aw-anniversary-hud';hud.setAttribute('aria-hidden','true');
    hud.innerHTML='<div class="aw-anniversary-hud__bug"><b class="aw-anniversary-hud__live">2015</b><span class="aw-anniversary-hud__channel"><b>AETHERWING ANNIVERSARY WEEK</b><small>DEBUT IDENTITY THROWBACK</small></span></div><div class="aw-anniversary-hud__bar"><b class="aw-anniversary-hud__identity"><i></i>EST. 2015</b><div class="aw-anniversary-hud__ticker"><span>BELLSOUTH RACING ROOTS · AETHERWING eMOTORSPORTS · BORN TO SOAR · BUILT TO FIGHT</span></div><b class="aw-anniversary-hud__era">OCT 01–07</b></div>';
    document.body.appendChild(hud);
  }
  function removeAtmosphere(){document.querySelector('.aw-season-atmosphere')?.remove();mountedKey='';}
  function syncAtmospherePlayback(){document.querySelector('.aw-season-atmosphere')?.classList.toggle('is-paused',document.hidden);}
  function mountAtmosphere(theme,observance,intensity=100,anniversaryRetro=false){
    const key=`${theme}|${observance}|${intensity}|${anniversaryRetro?'anniversary':'seasonal'}`;
    if(!document.body||(theme==='standard'&&!anniversaryRetro)){removeAtmosphere();return;}
    const meta=anniversaryRetro?{effect:'anniversary',density:0,lights:false}:THEMES[theme],obs=OBSERVANCES[observance];
    if(!meta||mountedKey===key)return;
    removeAtmosphere();
    const layer=document.createElement('div');layer.className=`aw-season-atmosphere aw-season-atmosphere--${meta.effect} aw-season-atmosphere--intensity-${intensity}${anniversaryRetro?' aw-season-atmosphere--anniversary':''}`;layer.dataset.intensity=String(intensity);layer.setAttribute('aria-hidden','true');
    const colors=palette();layer.style.setProperty('--fx-primary',colors.primary);layer.style.setProperty('--fx-secondary',colors.secondary);layer.style.setProperty('--fx-tertiary',colors.tertiary);
    const add=(cls,count,offset=0)=>{for(let i=0;i<count;i++){const el=document.createElement('i');el.className=cls;el.style.cssText=styleFor(i+offset);layer.appendChild(el);}};
    const ambient=document.createElement('div');ambient.className='aw-fx__ambient';layer.appendChild(ambient);
    if(anniversaryRetro){const motion=document.createElement('div');motion.className='aw-fx__anniversary';motion.innerHTML='<i></i><i></i><i></i>';layer.appendChild(motion);}

    if(!obs?.suppress&&!anniversaryRetro){
      const density=scaledDensity(meta.density),profile=motionProfile();
      if(meta.effect==='haze')add('aw-fx__haze',profile.mobile?1:2);
      else if(meta.effect==='halloween'){add('aw-fx__haze',profile.mobile?1:2);add('aw-fx__ember',density);add('aw-fx__bat',profile.mobile?1:(theme==='halloween-week'?3:2));}
      else if(meta.effect==='leaves')add('aw-fx__leaf',density);
      else if(meta.effect==='snow')add('aw-fx__snow',density);
      else if(meta.effect==='snow-twinkle'){add('aw-fx__snow',density);add('aw-fx__twinkle',profile.mobile?4:6);}
      else if(meta.effect==='petals')add('aw-fx__petal',density);
      else if(meta.effect==='glow')add('aw-fx__glow',density);
      else if(meta.effect==='twinkle')add('aw-fx__twinkle',density);
      else if(meta.effect==='fireworks'){
        for(let i=0;i<density;i++){const el=document.createElement('i');el.className='aw-fx__burst';el.style.cssText=`--x:${12+seeded(i,8)*76}%;--y:${10+seeded(i,9)*52}%;--delay:-${(seeded(i,10)*22).toFixed(2)}s;--dur:${(8+seeded(i,11)*8).toFixed(2)}s`;layer.appendChild(el);}
      }
      if(obs?.add==='twinkle')add('aw-fx__twinkle',profile.mobile?3:5,71);
      if(obs?.add==='glow')add('aw-fx__glow',profile.mobile?3:5,83);
      if(obs?.add==='sunrise'){add('aw-fx__glow',profile.mobile?4:6,101);add('aw-fx__twinkle',profile.mobile?2:4,121);}
    }

    if(meta.lights&&!anniversaryRetro){
      const makeStrand=(position,count)=>{
        const strand=document.createElement('div');strand.className=`aw-fx__lights aw-fx__lights--${position}`;
        for(let i=0;i<count;i++){const bulb=document.createElement('b');bulb.style.setProperty('--light-delay',`${(seeded(i,20)*2.8).toFixed(2)}s`);bulb.style.setProperty('--light-lift',`${Math.round(seeded(i,21)*8)}px`);strand.appendChild(bulb);}
        layer.appendChild(strand);
      };
      const profile=motionProfile();makeStrand('top',profile.mobile?14:18);if(!profile.mobile){makeStrand('left',8);makeStrand('right',8);}
    }
    if(theme==='christmas-week'&&!anniversaryRetro)layer.appendChild(buildHolidayTree());
    const faithScene=!anniversaryRetro?buildFaithScene(theme):null;if(faithScene)layer.appendChild(faithScene);
    const motif=!anniversaryRetro?buildObservanceMotif(observance):null;if(motif)layer.appendChild(motif);
    document.body.prepend(layer);mountedKey=key;syncAtmospherePlayback();
  }

  function apply(){
    const theme=resolveTheme(),observance=resolveObservance(),anniversaryRetro=anniversaryRetroActive(),intensity=resolveIntensity(theme,observance),level=intensityLevel(intensity);
    if(theme==='standard'){delete document.documentElement.dataset.season;delete document.documentElement.dataset.seasonUi;delete document.documentElement.dataset.seasonIntensity;delete document.documentElement.dataset.seasonLevel;}else{document.documentElement.dataset.season=theme;document.documentElement.dataset.seasonUi=THEMES[theme]?.ui||theme;document.documentElement.dataset.seasonIntensity=String(intensity);document.documentElement.dataset.seasonLevel=level;}
    if(observance){document.documentElement.dataset.observance=observance;document.documentElement.dataset.observanceUi=OBSERVANCES[observance]?.ui||observance;}else{delete document.documentElement.dataset.observance;delete document.documentElement.dataset.observanceUi;}
    if(anniversaryRetro)document.documentElement.dataset.anniversaryRetro='true';else delete document.documentElement.dataset.anniversaryRetro;
    mountAnniversaryHud(anniversaryRetro);

    window.__AETHERWING_SEASON__={id:theme,intensity,level,...(THEMES[theme]||{title:'',subtitle:'',icon:'',effect:'none',density:0,ui:'default'})};
    window.__AETHERWING_OBSERVANCE__=observance?{id:observance,...OBSERVANCES[observance]}:null;
    window.__AETHERWING_ANNIVERSARY_RETRO__={active:anniversaryRetro,window:'October 1–7',timezone:ANNIVERSARY_TIMEZONE};
    const banner=document.querySelector('[data-season-banner]');
    if(banner){
      const retroInfo={title:'AETHERWING ANNIVERSARY WEEK',subtitle:'2015 DEBUT IDENTITY · OCTOBER 1–7',icon:'◼'};
      const info=anniversaryRetro?retroInfo:(window.__AETHERWING_OBSERVANCE__||window.__AETHERWING_SEASON__),active=anniversaryRetro||theme!=='standard'||Boolean(observance);
      banner.hidden=!active;banner.setAttribute('aria-label',anniversaryRetro?'Aetherwing Anniversary Week retro interface':active?`${info.title} seasonal theme`:'Seasonal theme');
      const icon=banner.querySelector('[data-season-icon]'),title=banner.querySelector('[data-season-title]'),subtitle=banner.querySelector('[data-season-subtitle]');
      if(icon)icon.textContent=info.icon||'';if(title)title.textContent=info.title||'';if(subtitle)subtitle.textContent=info.subtitle||'';
    }
    mountAtmosphere(theme,observance,intensity,anniversaryRetro);
  }

  document.addEventListener('visibilitychange',syncAtmospherePlayback,{passive:true});
  apply();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply,{once:true});else apply();
  setInterval(apply,60*1000);
  const anniversaryBoundaryDelay=nextAnniversaryBoundary()-Date.now();
  if(anniversaryBoundaryDelay>0&&anniversaryBoundaryDelay<2147483600)setTimeout(apply,anniversaryBoundaryDelay+75);
})();

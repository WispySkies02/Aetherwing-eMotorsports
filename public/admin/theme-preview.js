(()=>{
  const root=document.documentElement;
  const grid=document.querySelector('[data-theme-grid]');
  const observanceGrid=document.querySelector('[data-observance-grid]');
  const name=document.querySelector('[data-theme-preview-name]');
  const reset=document.querySelector('[data-theme-reset]');
  const windowEl=document.querySelector('[data-theme-window]');
  const motionEl=document.querySelector('[data-theme-motion]');
  const motionCopy=document.querySelector('[data-theme-motion-copy]');
  const uiEl=document.querySelector('[data-theme-ui]');
  const uiCopy=document.querySelector('[data-theme-ui-copy]');
  const stage=document.querySelector('[data-theme-stage]');
  const stageName=document.querySelector('[data-theme-stage-name]');
  const motionToggle=document.querySelector('[data-theme-motion-toggle]');
  const autoButton=document.querySelector('[data-theme-auto]');
  const pageSelect=document.querySelector('[data-theme-preview-page]');
  const publicFrame=document.querySelector('[data-theme-public-frame]');
  const intensityControls=document.querySelector('[data-theme-intensity-controls]');
  const openPreview=document.querySelector('[data-theme-open-preview]');
  const faithBanner=document.querySelector('[data-theme-faith-banner]');
  const faithKicker=document.querySelector('[data-theme-faith-kicker]');
  const faithVerse=document.querySelector('[data-theme-faith-verse]');
  const faithReference=document.querySelector('[data-theme-faith-reference]');
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')||null;
  let previewMode='auto';
  let selectedTheme='default';
  let selectedObservance='';
  let selectedIntensity=100;
  if(!grid||!name||!reset)return;

  const labels=Object.fromEntries([...grid.querySelectorAll('[data-theme]')].map((button)=>[button.dataset.theme,button.querySelector('b')?.textContent?.trim()||button.dataset.theme]));
  const observanceLabels=Object.fromEntries([...(observanceGrid?.querySelectorAll('[data-observance]')||[])].map((button)=>[button.dataset.observance,button.querySelector('b')?.textContent?.trim()||button.dataset.observance]));

  const META={
    default:{window:'Outside seasonal windows',motion:'None',motionCopy:'Default Aetherwing keeps the background still.',ui:'Standard race UI',uiCopy:'Normal Aetherwing panels, filters, buttons, borders, and scrollbar.',effect:'none',density:0},
    'new-year':{window:'Dec 31–Jan 1',motion:'Distant fireworks',motionCopy:'Small, occasional bursts appear high in the background instead of covering content.',ui:'Metallic event-night UI',uiCopy:'Gold/silver surfaces, crisp corners, and a slow metallic sheen on controls.',effect:'fireworks',density:9},
    'clean-winter':{window:'Jan 2–31',motion:'Sparse snowfall',motionCopy:'A few clean white flakes keep the winter atmosphere alive.',ui:'Clean frost UI',uiCopy:'Ice-blue dividers and glassy, restrained winter panels.',effect:'snow',density:16},
    'valentine-teaser':{window:'Feb 1–7',motion:'Sparse rose petals',motionCopy:'A handful of soft petals drift behind the controls.',ui:'Soft rose UI',uiCopy:'Subtle rose accents and softer corners begin without overtaking the motorsports design.',effect:'petals',density:12},
    valentine:{window:'Feb 8–14',motion:'Rose-petal takeover',motionCopy:'A richer field of rose petals and warm light gives Valentine week a clear full-site takeover while keeping content readable.',ui:'Full rose UI',uiCopy:'Deeper rose gradients, warmer glass, softer panel geometry, brighter pink edge light, and romantic race-night accents across the interface.',effect:'petals',density:26},
    'late-winter':{window:'Feb 15–end of February',motion:'Last snow flurries',motionCopy:'A few fading flakes bridge winter into spring.',ui:'Thaw UI',uiCopy:'Muted blue-gray surfaces soften as the season transitions.',effect:'snow',density:10},
    spring:{window:'Mar 1–Memorial Day weekend (except accents)',motion:'Spring-air petal field',motionCopy:'A fuller spring-air field of petals, fresh green/teal light, and brighter environmental depth makes the seasonal change obvious.',ui:'Revamped spring UI',uiCopy:'Fresh green/teal edge work, brighter garden-air highlights, softened panels, and more visible spring color throughout the interface.',effect:'petals',density:22},
    'st-patrick':{window:'Mar 17',motion:'Green shimmer',motionCopy:'Small green/gold twinkles add a one-day accent.',ui:'Green accent UI',uiCopy:'A focused emerald edge treatment without rebuilding the whole interface.',effect:'twinkle',density:18},
    easter:{window:'Palm Sunday–Easter Sunday',motion:'Palms + spring air',motionCopy:'Soft petals and palm shadows build toward Easter while sunrise light stays at the edge of the glass.',ui:'Holy Week / Easter UI',uiCopy:'Palm shadows, sunrise warmth, and an empty-tomb Easter finale create a more cinematic Holy Week treatment.',effect:'petals',density:24,faith:true,verse:'I AM THE RESURRECTION, AND THE LIFE',reference:'JOHN 11:25',scene:'holy-week'},
    'memorial-day':{window:'Friday–Memorial Day Monday',motion:'Very subtle star glints',motionCopy:'Motion stays intentionally restrained for a respectful presentation.',ui:'Memorial UI',uiCopy:'Clean red/white/blue lines and sober panel treatment; no celebratory fireworks.',effect:'twinkle',density:10},
    summer:{window:'After Memorial Day–Sep 19 (except Jul 4 window)',motion:'Summer-night glow field',motionCopy:'More visible firefly-like glow, warmer horizon light, and brighter race-day accents give summer its own unmistakable atmosphere.',ui:'Revamped summer race UI',uiCopy:'Sky-blue/gold race graphics, sunlit panel edges, energetic hovers, and stronger late-evening contrast across the site.',effect:'glow',density:26},
    'independence-day':{window:'Jun 28–Jul 4',motion:'Distant fireworks',motionCopy:'Occasional small fireworks burst behind the site instead of over the content.',ui:'Patriotic race UI',uiCopy:'Red/white/blue stripe language, crisp cards, and event-style accents.',effect:'fireworks',density:10},
    'summer-end':{window:'Sep 20–24',motion:'Warm light drift',motionCopy:'Slow firefly-like light specks sit behind the workspace.',ui:'Sunset race UI',uiCopy:'Warm gold/orange accents, brighter hover energy, and sunset-lit surfaces.',effect:'glow',density:22},
    anniversary:{window:'Every year · Oct 1–7 · Eastern Time',motion:'Static debut-era atmosphere',motionCopy:'No novelty particle effect — the throwback comes from the 2015 identity, blue/teal interface, legacy logo and era-specific site treatment.',ui:'2015 debut identity',uiCopy:'A full Anniversary Week takeover using the EST. 2015 Aetherwing mark, debut blue/teal palette, simpler mid-2010s team-site panels and BellSouth Racing heritage references.',effect:'none',density:0},
    'halloween-teaser':{window:'Sep 25–30',motion:'Low drifting haze',motionCopy:'Barely-there fog makes the page feel like dusk without distracting from forms.',ui:'Early spooky UI',uiCopy:'Sharper corners, orange/violet edges, and darker distressed control surfaces.',effect:'haze',density:5},
    halloween:{window:'Oct 1–24',motion:'Layered fog + embers + bats',motionCopy:'Layered fog, brighter embers, and distant bat silhouettes build a noticeably darker race-night atmosphere while staying behind the UI.',ui:'After-dark UI',uiCopy:'A full after-dark takeover with clipped corners, glowing orange race lines, violet shadows, distressed panels, and ember-lit controls.',effect:'halloween',density:32},
    'halloween-week':{window:'Oct 25–31',motion:'Full Halloween takeover',motionCopy:'Dense fog, stronger embers, and more distant bats push Halloween week to its maximum without blocking controls or copy.',ui:'Intensified Halloween UI',uiCopy:'Maximum Halloween treatment: brighter orange edges, deeper violet panels, hotter hover glow, and more dramatic race-night contrast.',effect:'halloween',density:46},
    fall:{window:'Nov 1–Thanksgiving',motion:'Layered falling leaves',motionCopy:'Multiple depths of slow leaves, amber dusk, and warmer panel light create a fuller late-season atmosphere.',ui:'Full harvest UI',uiCopy:'Warm paper/metal surfaces, rust and amber race lines, dusk lighting, and richer harvest contrast across cards and controls.',effect:'leaves',density:24},
    'christmas-teaser':{window:'Day after Thanksgiving–Nov 30',motion:'First-light twinkles',motionCopy:'Tiny warm points of light appear occasionally in the background.',ui:'First-lights UI',uiCopy:'Evergreen/red hints begin while the regular Aetherwing interface still dominates.',effect:'twinkle',density:18},
    christmas:{window:'Dec 1–17',motion:'Snowfall + Bethlehem nightscape',motionCopy:'Visible snowfall frames a deeper Bethlehem-at-night scene while warm star light and evergreen/gold interface accents spread across the site.',ui:'Christmas / Bethlehem UI',uiCopy:'A full deep-navy, evergreen, warm-gold Christmas takeover anchored by Bethlehem, star light, frosted panels, and faith-forward race graphics.',effect:'snow',density:34,faith:true,verse:'GLORY TO GOD IN THE HIGHEST',reference:'LUKE 2:14',scene:'bethlehem'},
    'christmas-week':{window:'Dec 18–25',motion:'Heavy snow + live lights + Bethlehem',motionCopy:'The strongest Christmas treatment adds fuller snow, brighter live light strands, the tree, and a more visible Bethlehem skyline and star.',ui:'Christmas Week / Bethlehem UI',uiCopy:'Christmas Week becomes a full race-week takeover while the Star of Bethlehem remains the visual anchor rather than generic holiday imagery.',effect:'snow-twinkle',density:52,lights:true,faith:true,verse:'GLORY TO GOD IN THE HIGHEST',reference:'LUKE 2:14',scene:'bethlehem'},
    'calm-winter':{window:'Dec 26–30',motion:'Very light snowfall',motionCopy:'Only a few slow flakes remain after Christmas.',ui:'Quiet winter UI',uiCopy:'Blue-gray frosted panels and reduced holiday color make the site feel calmer.',effect:'snow',density:18},
  };

  const OBS={
    'new-years-day':{base:'new-year',motion:'Fireworks + gratitude twinkles',motionCopy:'The New Year atmosphere stays celebratory while the message shifts to thanking God for the year ahead.',ui:'Gratitude overlay',uiCopy:'Gold event-night UI with a faith-forward New Year message.',effectAdd:'twinkle',faith:true,verse:'THIS IS THE DAY WHICH THE LORD HATH MADE',reference:'PSALM 118:24',motif:'gratitude'},
    'palm-sunday':{base:'easter',motion:'Palm shadows + soft spring air',motionCopy:'Large palm fronds sit at the outer glass edges while the spring atmosphere stays subtle behind the content.',ui:'Palm Sunday overlay',uiCopy:'Olive/palm greens and warm gold frame “Hosanna in the highest · Matthew 21:9.”',faith:true,verse:'HOSANNA IN THE HIGHEST',reference:'MATTHEW 21:9',motif:'palms'},
    'good-friday':{base:'easter',motion:'Still / intentionally quiet',motionCopy:'The normal Easter petals pause. A restrained crown-of-thorns silhouette and deep shadow replace celebratory motion.',ui:'Solemn Good Friday overlay',uiCopy:'Darkened Holy Week UI with crown-of-thorns art and “It is finished · John 19:30.”',suppress:true,faith:true,verse:'IT IS FINISHED',reference:'JOHN 19:30',motif:'thorns'},
    'easter-sunday':{base:'easter',motion:'Sunrise glow + gentle petals',motionCopy:'Dawn light rises behind an empty-tomb silhouette while soft spring petals stay at the edges.',ui:'Resurrection / empty-tomb overlay',uiCopy:'Warm sunrise, rolled stone, lilies, and “He is not here: for he is risen · Matthew 28:6” become the Easter focal point.',effectAdd:'sunrise',faith:true,verse:'HE IS NOT HERE: FOR HE IS RISEN',reference:'MATTHEW 28:6',motif:'empty-tomb'},
    thanksgiving:{base:'fall',motion:'Leaves + warm harvest glow',motionCopy:'Fall leaves continue with soft candle-warm light and wheat silhouettes at the lower edge.',ui:'Thanksgiving gratitude overlay',uiCopy:'Harvest warmth and wheat frame “In every thing give thanks · 1 Thessalonians 5:18.”',effectAdd:'glow',faith:true,verse:'IN EVERY THING GIVE THANKS',reference:'1 THESSALONIANS 5:18',motif:'wheat'},
    'christmas-eve':{base:'christmas-week',motion:'Heavy snow + live lights + Bethlehem',motionCopy:'Christmas lights and snow stay, but the Bethlehem skyline and star become the visual focus.',ui:'Holy Night / Bethlehem overlay',uiCopy:'Deep blue and gold frame “Good tidings of great joy · Luke 2:10–11.”',effectAdd:'twinkle',faith:true,verse:'GOOD TIDINGS OF GREAT JOY',reference:'LUKE 2:10–11',motif:'bethlehem'},
    'christmas-day':{base:'christmas-week',motion:'Snow + lights + Bethlehem glow',motionCopy:'The full Christmas Week atmosphere stays active while the Star of Bethlehem and warm horizon light intensify.',ui:'Christmas Day / Bethlehem overlay',uiCopy:'Bethlehem remains the focal point with “Glory to God in the highest · Luke 2:14.”',effectAdd:'twinkle',faith:true,verse:'GLORY TO GOD IN THE HIGHEST',reference:'LUKE 2:14',motif:'bethlehem'},
  };

  const pad=(n)=>String(n).padStart(2,'0');
  const key=(d)=>`${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  const addDays=(d,n)=>{const x=new Date(d);x.setUTCDate(x.getUTCDate()+n);return x;};
  const easterSunday=(year)=>{const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;return new Date(Date.UTC(year,month-1,day));};
  const memorialDay=(year)=>{const last=new Date(Date.UTC(year,4,31));last.setUTCDate(31-((last.getUTCDay()+6)%7));return last;};
  const thanksgiving=(year)=>{const first=new Date(Date.UTC(year,10,1));const firstThursday=1+((4-first.getUTCDay()+7)%7);return new Date(Date.UTC(year,10,firstThursday+21));};
  const easternToday=()=>{const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).filter((p)=>p.type!=='literal').map((p)=>[p.type,p.value]));return new Date(Date.UTC(Number(parts.year),Number(parts.month)-1,Number(parts.day)));};
  const fmt=(d,withYear=true)=>new Intl.DateTimeFormat('en-US',{timeZone:'UTC',month:'short',day:'numeric',...(withYear?{year:'numeric'}:{})}).format(d);
  const fmtRange=(start,end)=>start.getTime()===end.getTime()?fmt(start):`${fmt(start,false)}–${fmt(end)}`;
  const nextDynamic=(kind)=>{
    const now=easternToday(),year=now.getUTCFullYear();
    for(let y=year;y<=year+3;y++){
      let start,end;
      if(kind==='easter'){end=easterSunday(y);start=addDays(end,-7);}
      if(kind==='memorial-day'){end=memorialDay(y);start=addDays(end,-3);}
      if(kind==='fall'){start=new Date(Date.UTC(y,10,1));end=thanksgiving(y);}
      if(kind==='christmas-teaser'){start=addDays(thanksgiving(y),1);end=new Date(Date.UTC(y,10,30));}
      if(end&&end>=now)return `Next · ${fmtRange(start,end)}`;
    }
    return META[kind]?.window||'';
  };
  const nextObservance=(id)=>{
    const now=easternToday(),year=now.getUTCFullYear();
    for(let y=year;y<=year+3;y++){
      let date;
      if(id==='new-years-day')date=new Date(Date.UTC(y,0,1));
      if(id==='palm-sunday')date=addDays(easterSunday(y),-7);
      if(id==='good-friday')date=addDays(easterSunday(y),-2);
      if(id==='easter-sunday')date=easterSunday(y);
      if(id==='thanksgiving')date=thanksgiving(y);
      if(id==='christmas-eve')date=new Date(Date.UTC(y,11,24));
      if(id==='christmas-day')date=new Date(Date.UTC(y,11,25));
      if(date&&date>=now)return date;
    }
    return null;
  };
  const windowText=(theme)=>['easter','memorial-day','fall','christmas-teaser'].includes(theme)?nextDynamic(theme):(META[theme]?.window||'Always');

  const automaticThemeForDate=(date=easternToday())=>{
    const y=date.getUTCFullYear(),m=date.getUTCMonth()+1,d=date.getUTCDate(),today=key(date);
    if((m===12&&d===31)||(m===1&&d===1))return 'new-year';
    if(m===1)return 'clean-winter';
    if(m===2&&d<=7)return 'valentine-teaser';
    if(m===2&&d<=14)return 'valentine';
    if(m===2)return 'late-winter';
    if(m===3&&d===17)return 'st-patrick';
    const easter=easterSunday(y),easterStart=addDays(easter,-7);
    if(today>=key(easterStart)&&today<=key(easter))return 'easter';
    const memorial=memorialDay(y),memorialStart=addDays(memorial,-3);
    if(today>=key(memorialStart)&&today<=key(memorial))return 'memorial-day';
    if(m===3||m===4||(m===5&&today<key(memorialStart)))return 'spring';
    if((m===5&&today>key(memorial))||m===6||(m===7&&d>=5)||m===8||(m===9&&d<=19)){
      if((m===6&&d>=28)||(m===7&&d<=4))return 'independence-day';
      return 'summer';
    }
    if(m===9&&d>=20&&d<=24)return 'summer-end';
    if(m===9&&d>=25)return 'halloween-teaser';
    if(m===10&&d>=1&&d<=7)return 'anniversary';
    if(m===10&&d<=24)return 'halloween';
    if(m===10)return 'halloween-week';
    const thanks=thanksgiving(y);
    if(m===11&&today<=key(thanks))return 'fall';
    if(m===11)return 'christmas-teaser';
    if(m===12&&d<=17)return 'christmas';
    if(m===12&&d<=25)return 'christmas-week';
    if(m===12&&d<=30)return 'calm-winter';
    return 'default';
  };
  const automaticObservanceForDate=(date=easternToday())=>{
    const y=date.getUTCFullYear(),m=date.getUTCMonth()+1,d=date.getUTCDate(),today=key(date),easter=easterSunday(y);
    if(m===1&&d===1)return 'new-years-day';
    if(today===key(addDays(easter,-7)))return 'palm-sunday';
    if(today===key(addDays(easter,-2)))return 'good-friday';
    if(today===key(easter))return 'easter-sunday';
    if(today===key(thanksgiving(y)))return 'thanksgiving';
    if(m===12&&d===24)return 'christmas-eve';
    if(m===12&&d===25)return 'christmas-day';
    return '';
  };
  const automaticIntensityForDate=(date=easternToday(),theme=automaticThemeForDate(date),observance=automaticObservanceForDate(date))=>{
    if(theme==='default')return 100;if(observance)return 200;
    const y=date.getUTCFullYear(),m=date.getUTCMonth()+1,d=date.getUTCDate(),today=key(date);
    if(theme==='new-year'||theme==='st-patrick')return 200;
    if(theme==='valentine')return d===14?200:150;
    if(theme==='easter')return today===key(easterSunday(y))?200:150;
    if(theme==='memorial-day')return today===key(memorialDay(y))?200:150;
    if(theme==='independence-day')return m===7&&d===4?200:150;
    if(theme==='halloween-week')return d===31?200:150;
    if(theme==='fall'){const thanks=thanksgiving(y),start=addDays(thanks,-6);if(today>=key(start)&&today<=key(thanks))return today===key(thanks)?200:150;}
    if(theme==='christmas-week')return d>=24?200:150;
    return 100;
  };
  const defaultPreviewIntensity=(theme)=>{
    if(['new-year','st-patrick'].includes(theme))return 200;
    if(['valentine','easter','memorial-day','independence-day','halloween-week','christmas-week'].includes(theme))return 150;
    return 100;
  };
  const publicPreviewUrl=()=>{
    const path=pageSelect?.value||'/';
    const url=new URL(path,location.origin);
    url.searchParams.set('themePreview','1');
    if((previewMode==='theme'||previewMode==='auto')&&selectedTheme==='anniversary'){
      url.searchParams.set('anniversary','throwback');url.searchParams.set('season','off');url.searchParams.set('observance','off');
    }else{
      url.searchParams.set('anniversary','off');
      if(previewMode==='plain'){url.searchParams.set('season','off');url.searchParams.set('observance','off');}
      else if(previewMode==='theme'){url.searchParams.set('season',selectedTheme);url.searchParams.set('seasonIntensity',String(selectedIntensity));if(selectedObservance)url.searchParams.set('observance',selectedObservance);}
      else if(previewMode==='auto'){url.searchParams.set('seasonIntensity',String(selectedIntensity));}
    }
    return `${url.pathname}${url.search}`;
  };
  const refreshPublicPreview=()=>{const url=publicPreviewUrl();if(publicFrame&&publicFrame.getAttribute('src')!==url)publicFrame.setAttribute('src',url);if(openPreview)openPreview.dataset.previewUrl=url;};

  const seeded=(i,salt=1)=>{const x=Math.sin((i+1)*12.9898+salt*78.233)*43758.5453;return x-Math.floor(x);};
  const styleFor=(i)=>`--x:${Math.round(seeded(i,1)*100)}%;--delay:-${(seeded(i,2)*18).toFixed(2)}s;--dur:${(12+seeded(i,3)*18).toFixed(2)}s;--size:${(3+seeded(i,4)*7).toFixed(1)}px;--drift:${Math.round((seeded(i,5)-.5)*180)}px`;
  const buildHolidayTree=(stageMode=false)=>{
    const tree=document.createElement('div');tree.className='aw-fx__tree';tree.setAttribute('aria-hidden','true');if(stageMode)tree.classList.add('aw-fx__tree--stage');
    tree.innerHTML='<i class="aw-fx__tree-star">★</i><span class="aw-fx__tree-tier aw-fx__tree-tier--1"></span><span class="aw-fx__tree-tier aw-fx__tree-tier--2"></span><span class="aw-fx__tree-tier aw-fx__tree-tier--3"></span><span class="aw-fx__tree-trunk"></span><span class="aw-fx__tree-lights"></span>';
    const lights=tree.querySelector('.aw-fx__tree-lights');
    const points=[[50,20],[38,34],[62,35],[28,49],[49,49],[72,50],[20,65],[39,66],[60,65],[80,66],[31,80],[52,79],[71,80]];
    points.forEach(([x,y],i)=>{const bulb=document.createElement('b');bulb.style.cssText=`--tree-x:${x}%;--tree-y:${y}%;--tree-delay:-${(seeded(i+(stageMode?41:0),31)*2.4).toFixed(2)}s`;lights.appendChild(bulb);});
    return tree;
  };
  const buildPalm=(side='left')=>{const palm=document.createElement('div');palm.className=`aw-faith-palm aw-faith-palm--${side}`;palm.innerHTML='<b></b>'+Array.from({length:9},(_,i)=>`<i style="--leaf:${i}"></i>`).join('');return palm;};
  const buildFaithScene=(theme,stageMode=false)=>{
    const scene=META[theme]?.scene;if(!scene)return null;
    const wrap=document.createElement('div');wrap.className=`aw-faith-scene aw-faith-scene--${scene}`;if(stageMode)wrap.classList.add('aw-faith-scene--stage');wrap.setAttribute('aria-hidden','true');
    if(scene==='holy-week'){wrap.appendChild(buildPalm('left'));wrap.appendChild(buildPalm('right'));const dawn=document.createElement('span');dawn.className='aw-faith-dawn';wrap.appendChild(dawn);}
    if(scene==='bethlehem')wrap.innerHTML='<span class="aw-bethlehem__star"></span><span class="aw-bethlehem__skyline"><i></i><b></b><em></em></span>';
    return wrap;
  };
  const buildObservanceMotif=(observance,stageMode=false)=>{
    const obs=OBS[observance];if(!obs?.motif)return null;
    const motif=document.createElement('div');motif.className=`aw-observance-motif aw-observance-motif--${observance} aw-observance-motif--${obs.motif}`;if(stageMode)motif.classList.add('aw-observance-motif--stage');motif.setAttribute('aria-hidden','true');
    if(obs.motif==='palms'){motif.appendChild(buildPalm('left'));motif.appendChild(buildPalm('right'));}
    else if(obs.motif==='thorns')motif.innerHTML='<span class="aw-thorns__ring"></span><span class="aw-thorns__shadow"></span>';
    else if(obs.motif==='empty-tomb')motif.innerHTML='<span class="aw-tomb__sun"></span><span class="aw-tomb__rays"></span><span class="aw-tomb__hill"></span><span class="aw-tomb__mouth"></span><span class="aw-tomb__stone"></span><span class="aw-tomb__lily aw-tomb__lily--1"></span><span class="aw-tomb__lily aw-tomb__lily--2"></span>';
    else if(obs.motif==='wheat')motif.innerHTML='<span class="aw-wheat__glow"></span><span class="aw-wheat__stem aw-wheat__stem--1"></span><span class="aw-wheat__stem aw-wheat__stem--2"></span><span class="aw-wheat__stem aw-wheat__stem--3"></span>';
    else if(obs.motif==='bethlehem')motif.innerHTML='<span class="aw-bethlehem__star"></span><span class="aw-bethlehem__skyline"><i></i><b></b><em></em></span>';
    else motif.innerHTML='<span class="aw-gratitude__rays"></span>';
    return motif;
  };
  const removeFx=()=>document.querySelectorAll('.aw-admin-season-fx').forEach((node)=>node.remove());
  const buildFx=(theme,observance='',stageMode=false,intensity=selectedIntensity)=>{
    const meta=META[theme],obs=OBS[observance];if(!meta)return null;if(meta.effect==='none'&&!observance)return null;
    const layer=document.createElement('div');layer.className=`aw-season-atmosphere aw-admin-season-fx ${stageMode?'aw-admin-season-fx--stage':'aw-admin-season-fx--page'} aw-season-atmosphere--${meta.effect} aw-season-atmosphere--intensity-${intensity}`;layer.setAttribute('aria-hidden','true');
    const css=getComputedStyle(root);layer.style.setProperty('--fx-primary',css.getPropertyValue('--preview-primary').trim()||'#f3b51d');layer.style.setProperty('--fx-secondary',css.getPropertyValue('--preview-secondary').trim()||'#12aaf5');layer.style.setProperty('--fx-tertiary',css.getPropertyValue('--preview-third').trim()||'#fff');
    const factor=intensity>=200?1.9:intensity>=150?1.45:1;const rawDensity=Math.round(meta.density*factor);
    const density=stageMode?Math.min(48,Math.max(rawDensity,meta.effect==='haze'?3:12)):Math.min(84,rawDensity);
    const add=(cls,count,offset=0)=>{for(let i=0;i<count;i++){const el=document.createElement('i');el.className=cls;el.style.cssText=styleFor(i+offset+(stageMode?31:0));layer.appendChild(el);}};
    if(!obs?.suppress){
      if(meta.effect==='haze')add('aw-fx__haze',3);
      else if(meta.effect==='halloween'){add('aw-fx__haze',3);add('aw-fx__ember',density);add('aw-fx__bat',theme==='halloween-week'?4:2);}
      else if(meta.effect==='leaves')add('aw-fx__leaf',density);
      else if(meta.effect==='snow')add('aw-fx__snow',density);
      else if(meta.effect==='snow-twinkle'){add('aw-fx__snow',density);add('aw-fx__twinkle',12);}
      else if(meta.effect==='petals')add('aw-fx__petal',density);
      else if(meta.effect==='glow')add('aw-fx__glow',density);
      else if(meta.effect==='twinkle')add('aw-fx__twinkle',density);
      else if(meta.effect==='fireworks'){for(let i=0;i<density;i++){const el=document.createElement('i');el.className='aw-fx__burst';el.style.cssText=`--x:${12+seeded(i+(stageMode?19:0),8)*76}%;--y:${10+seeded(i+(stageMode?19:0),9)*52}%;--delay:-${(seeded(i+(stageMode?19:0),10)*12).toFixed(2)}s;--dur:${(6+seeded(i,11)*6).toFixed(2)}s`;layer.appendChild(el);}}
      if(obs?.effectAdd==='twinkle')add('aw-fx__twinkle',10,80);
      if(obs?.effectAdd==='glow')add('aw-fx__glow',8,90);
      if(obs?.effectAdd==='sunrise'){add('aw-fx__glow',12,100);add('aw-fx__twinkle',7,120);}
    }
    if(meta.lights){
      const makeStrand=(position,count)=>{const strand=document.createElement('div');strand.className=`aw-fx__lights aw-fx__lights--${position}`;for(let i=0;i<count;i++){const bulb=document.createElement('b');bulb.style.setProperty('--light-delay',`${(seeded(i+(stageMode?17:0),20)*2.8).toFixed(2)}s`);bulb.style.setProperty('--light-lift',`${Math.round(seeded(i+(stageMode?17:0),21)*8)}px`);strand.appendChild(bulb);}layer.appendChild(strand);};
      makeStrand('top',stageMode?18:30);makeStrand('left',stageMode?10:18);makeStrand('right',stageMode?10:18);
    }
    if(theme==='christmas-week')layer.appendChild(buildHolidayTree(stageMode));
    const faithScene=buildFaithScene(theme,stageMode);if(faithScene)layer.appendChild(faithScene);
    const motif=buildObservanceMotif(observance,stageMode);if(motif)layer.appendChild(motif);
    return layer;
  };
  const mountFx=(theme,observance='',intensity=selectedIntensity)=>{
    removeFx();
    const pageLayer=buildFx(theme,observance,false,intensity);if(pageLayer)document.body.prepend(pageLayer);
    const stageLayer=buildFx(theme,observance,true,intensity);if(stage&&stageLayer)stage.prepend(stageLayer);
  };

  function updateObservanceDates(){
    observanceGrid?.querySelectorAll('[data-observance]').forEach((button)=>{const date=nextObservance(button.dataset.observance),small=button.querySelector('[data-observance-next]');if(date&&small)small.textContent=`Next · ${fmt(date)}`;});
  }

  const select=(theme='default',observance='',mode='theme')=>{
    previewMode=mode;selectedTheme=theme;selectedObservance=observance;
    if(theme==='default')delete root.dataset.adminTheme;else root.dataset.adminTheme=theme;
    root.dataset.adminThemeIntensity=String(selectedIntensity);
    if(observance)root.dataset.adminObservance=observance;else delete root.dataset.adminObservance;
    grid.querySelectorAll('[data-theme]').forEach((button)=>{const active=button.dataset.theme===theme;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    observanceGrid?.querySelectorAll('[data-observance]').forEach((button)=>{const active=button.dataset.observance===observance;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});

    const meta=META[theme]||META.default,obs=OBS[observance];
    const auto=mode==='auto',plain=mode==='plain';
    const displayName=auto?`Auto · ${labels[theme]||theme}`:plain?'Plain Aetherwing':obs?`${observanceLabels[observance]||observance} · ${labels[theme]||theme}`:(labels[theme]||'Default Aetherwing');
    const intensityLabel=theme==='default'?'':` · ${selectedIntensity}%`;name.textContent=displayName+intensityLabel;if(stageName)stageName.textContent=displayName+intensityLabel;
    intensityControls?.querySelectorAll('[data-theme-intensity]').forEach((button)=>{const active=Number(button.dataset.themeIntensity)===selectedIntensity;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    autoButton?.classList.toggle('is-active',auto);
    const blocked=theme!=='default'&&reduceMotion?.matches&&root.dataset.adminForceMotion!=='true';if(motionToggle)motionToggle.hidden=!blocked;

    if(windowEl){const date=observance?nextObservance(observance):null;windowEl.textContent=observance&&date?`Next · ${fmt(date)}`:windowText(theme);}
    if(motionEl)motionEl.textContent=obs?.motion||meta.motion;if(motionCopy)motionCopy.textContent=obs?.motionCopy||meta.motionCopy;
    if(uiEl)uiEl.textContent=obs?.ui||meta.ui;if(uiCopy)uiCopy.textContent=obs?.uiCopy||meta.uiCopy;
    const faith=obs?.faith?obs:(meta?.faith?meta:null);
    if(faithBanner){faithBanner.hidden=!faith;if(faith){if(faithKicker)faithKicker.textContent=obs?.faith?(obs.title||'FAITH MOMENT'):(meta.title||'FAITH THEME');if(faithVerse)faithVerse.textContent=faith.verse||'';if(faithReference)faithReference.textContent=faith.reference||'';}}
    requestAnimationFrame(()=>mountFx(theme,observance,selectedIntensity));
    refreshPublicPreview();
  };

  grid.addEventListener('click',(event)=>{const button=event.target.closest('[data-theme]');if(button){const theme=button.dataset.theme;selectedIntensity=defaultPreviewIntensity(theme);select(theme,'',theme==='default'?'plain':'theme');}});
  observanceGrid?.addEventListener('click',(event)=>{const button=event.target.closest('[data-observance]');if(button){selectedIntensity=200;select(button.dataset.baseTheme||OBS[button.dataset.observance]?.base||'default',button.dataset.observance,'theme');}});
  if(motionToggle)motionToggle.addEventListener('click',()=>{root.dataset.adminForceMotion='true';motionToggle.hidden=true;mountFx(selectedTheme,selectedObservance,selectedIntensity);});
  autoButton?.addEventListener('click',()=>{delete root.dataset.adminForceMotion;const date=easternToday(),theme=automaticThemeForDate(date),observance=automaticObservanceForDate(date);selectedIntensity=automaticIntensityForDate(date,theme,observance);select(theme,observance,'auto');});
  reset.addEventListener('click',()=>{delete root.dataset.adminForceMotion;selectedIntensity=100;select('default','','plain');});
  intensityControls?.addEventListener('click',(event)=>{const button=event.target.closest('[data-theme-intensity]');if(!button)return;selectedIntensity=Number(button.dataset.themeIntensity)||100;select(selectedTheme,selectedObservance,previewMode==='plain'?'plain':'theme');});
  pageSelect?.addEventListener('change',refreshPublicPreview);
  openPreview?.addEventListener('click',()=>window.open(openPreview.dataset.previewUrl||publicPreviewUrl(),'_blank','noopener'));
  updateObservanceDates();
  {const date=easternToday(),theme=automaticThemeForDate(date),observance=automaticObservanceForDate(date);selectedIntensity=automaticIntensityForDate(date,theme,observance);select(theme,observance,'auto');}
})();

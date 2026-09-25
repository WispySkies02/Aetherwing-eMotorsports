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
  const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)')||null;
  if(!grid||!name||!reset)return;

  const labels=Object.fromEntries([...grid.querySelectorAll('[data-theme]')].map((button)=>[button.dataset.theme,button.querySelector('b')?.textContent?.trim()||button.dataset.theme]));
  const observanceLabels=Object.fromEntries([...(observanceGrid?.querySelectorAll('[data-observance]')||[])].map((button)=>[button.dataset.observance,button.querySelector('b')?.textContent?.trim()||button.dataset.observance]));

  const META={
    default:{window:'Outside seasonal windows',motion:'None',motionCopy:'Default Aetherwing keeps the background still.',ui:'Standard race UI',uiCopy:'Normal Aetherwing panels, filters, buttons, borders, and scrollbar.',effect:'none',density:0},
    'new-year':{window:'Dec 31–Jan 1',motion:'Distant fireworks',motionCopy:'Small, occasional bursts appear high in the background instead of covering content.',ui:'Metallic event-night UI',uiCopy:'Gold/silver surfaces, crisp corners, and a slow metallic sheen on controls.',effect:'fireworks',density:5},
    'clean-winter':{window:'Jan 2–31',motion:'Sparse snowfall',motionCopy:'A few clean white flakes keep the winter atmosphere alive.',ui:'Clean frost UI',uiCopy:'Ice-blue dividers and glassy, restrained winter panels.',effect:'snow',density:9},
    'valentine-teaser':{window:'Feb 1–7',motion:'Sparse rose petals',motionCopy:'A handful of soft petals drift behind the controls.',ui:'Soft rose UI',uiCopy:'Subtle rose accents and softer corners begin without overtaking the motorsports design.',effect:'petals',density:8},
    valentine:{window:'Feb 8–14',motion:'Drifting rose petals',motionCopy:'More petals drift slowly while remaining low-opacity and non-interactive.',ui:'Full rose UI',uiCopy:'Rose highlights, softer panels, rounded chips, and a warmer full takeover.',effect:'petals',density:16},
    'late-winter':{window:'Feb 15–end of February',motion:'Last snow flurries',motionCopy:'A few fading flakes bridge winter into spring.',ui:'Thaw UI',uiCopy:'Muted blue-gray surfaces soften as the season transitions.',effect:'snow',density:6},
    spring:{window:'Mar 1–Memorial Day weekend (except accents)',motion:'Drifting petals',motionCopy:'Soft petals float behind the UI to make the page feel airy and alive.',ui:'Fresh spring UI',uiCopy:'Rounder cards, green/teal edge work, airier highlights, and softer controls.',effect:'petals',density:14},
    'st-patrick':{window:'Mar 17',motion:'Green shimmer',motionCopy:'Small green/gold twinkles add a one-day accent.',ui:'Green accent UI',uiCopy:'A focused emerald edge treatment without rebuilding the whole interface.',effect:'twinkle',density:12},
    easter:{window:'Monday before Easter–Easter Sunday',motion:'Spring petals',motionCopy:'Soft petals drift behind a renewal/sunrise-inspired Easter UI.',ui:'Easter / renewal UI',uiCopy:'A cross-led Easter identity with gentle spring colors and warm sunrise accents.',effect:'petals',density:18},
    'memorial-day':{window:'Friday–Memorial Day Monday',motion:'Very subtle star glints',motionCopy:'Motion stays intentionally restrained for a respectful presentation.',ui:'Memorial UI',uiCopy:'Clean red/white/blue lines and sober panel treatment; no celebratory fireworks.',effect:'twinkle',density:7},
    summer:{window:'After Memorial Day–Sep 19 (except Jul 4 window)',motion:'Warm firefly lights',motionCopy:'Slow glowing specks create a late-evening summer atmosphere.',ui:'Summer race UI',uiCopy:'Sky-blue/gold accents, energetic hovers, and brighter race-day panels.',effect:'glow',density:18},
    'independence-day':{window:'Jun 28–Jul 4',motion:'Distant fireworks',motionCopy:'Occasional small fireworks burst behind the site instead of over the content.',ui:'Patriotic race UI',uiCopy:'Red/white/blue stripe language, crisp cards, and event-style accents.',effect:'fireworks',density:6},
    'summer-end':{window:'Sep 20–24',motion:'Warm light drift',motionCopy:'Slow firefly-like light specks sit behind the workspace.',ui:'Sunset race UI',uiCopy:'Warm gold/orange accents, brighter hover energy, and sunset-lit surfaces.',effect:'glow',density:14},
    'halloween-teaser':{window:'Sep 25–30',motion:'Low drifting haze',motionCopy:'Barely-there fog makes the page feel like dusk without distracting from forms.',ui:'Early spooky UI',uiCopy:'Sharper corners, orange/violet edges, and darker distressed control surfaces.',effect:'haze',density:3},
    halloween:{window:'Oct 1–24',motion:'Fog + embers + rare bats',motionCopy:'Slow fog, sparse embers, and an occasional distant silhouette stay behind the UI.',ui:'After-dark UI',uiCopy:'Clipped corners, stronger orange edge lines, purple accents, and ember-like hovers.',effect:'halloween',density:18},
    'halloween-week':{window:'Oct 25–31',motion:'Denser spooky atmosphere',motionCopy:'More embers and a few more distant bats, still kept behind all content.',ui:'Intensified Halloween UI',uiCopy:'The Halloween treatment gets brighter accent edges and more aggressive control highlights.',effect:'halloween',density:28},
    fall:{window:'Nov 1–Thanksgiving',motion:'Sparse falling leaves',motionCopy:'A few slow leaves cross the background at different speeds.',ui:'Harvest UI',uiCopy:'Warm paper/metal panels, softer corners, rust accents, and amber dividers.',effect:'leaves',density:16},
    'christmas-teaser':{window:'Day after Thanksgiving–Nov 30',motion:'First-light twinkles',motionCopy:'Tiny warm points of light appear occasionally in the background.',ui:'First-lights UI',uiCopy:'Evergreen/red hints begin while the regular Aetherwing interface still dominates.',effect:'twinkle',density:12},
    christmas:{window:'Dec 1–17',motion:'Light snowfall',motionCopy:'Small flakes fall slowly behind the panels with frosted edges.',ui:'Christmas / winter UI',uiCopy:'Frosted top edges, evergreen/red details, cool glass panels, and warm gold accents.',effect:'snow',density:28},
    'christmas-week':{window:'Dec 18–25',motion:'Snow + Christmas lights',motionCopy:'Fuller snowfall sits behind animated multicolor light strands around the page edges.',ui:'Merry & bright UI',uiCopy:'Bright trim, frosted surfaces, Christmas lights, and a tree cue without obscuring data.',effect:'snow-twinkle',density:44,lights:true},
    'calm-winter':{window:'Dec 26–30',motion:'Very light snowfall',motionCopy:'Only a few slow flakes remain after Christmas.',ui:'Quiet winter UI',uiCopy:'Blue-gray frosted panels and reduced holiday color make the site feel calmer.',effect:'snow',density:12},
  };

  const OBS={
    'new-years-day':{base:'new-year',motion:'Fireworks + gratitude twinkles',motionCopy:'The New Year atmosphere stays celebratory while the message shifts to thanking God for the year ahead.',ui:'Gratitude overlay',uiCopy:'Gold event-night UI with a faith-forward New Year message.',effectAdd:'twinkle'},
    'good-friday':{base:'easter',motion:'Still / intentionally quiet',motionCopy:'The normal Easter petals pause for a restrained, solemn Good Friday presentation.',ui:'Solemn cross overlay',uiCopy:'Darkened Easter UI, muted color, a cross motif, and “It is finished · John 19:30.”',suppress:true},
    'easter-sunday':{base:'easter',motion:'Petals + sunrise glow',motionCopy:'Spring petals continue with brighter sunrise light and gentle twinkles.',ui:'Resurrection overlay',uiCopy:'The cross becomes the focus with “He is risen · Matthew 28:6” and brighter renewal tones.',effectAdd:'sunrise'},
    thanksgiving:{base:'fall',motion:'Leaves + warm glow',motionCopy:'The fall atmosphere gains a soft warm glow for a gratitude-focused Thanksgiving.',ui:'Thanksgiving gratitude overlay',uiCopy:'Harvest UI with “In everything give thanks · 1 Thessalonians 5:18.”',effectAdd:'glow'},
    'christmas-eve':{base:'christmas-week',motion:'Snow + lights + star twinkles',motionCopy:'Christmas lights and snow stay, with a quieter star-lit Christmas Eve tone.',ui:'Holy Night overlay',uiCopy:'Deep blue/gold Christmas styling with “Good tidings of great joy · Luke 2:10–11.”',effectAdd:'twinkle'},
    'christmas-day':{base:'christmas-week',motion:'Snow + lights + warm twinkles',motionCopy:'The full Christmas Week atmosphere stays active while the day becomes explicitly faith-forward.',ui:'Christmas Day faith overlay',uiCopy:'Tree/lights remain, with a cross motif and “Glory to God in the highest · Luke 2:14.”',effectAdd:'twinkle'},
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
      if(kind==='easter'){end=easterSunday(y);start=addDays(end,-6);}
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
  const addObservanceMotif=(layer,observance,stageMode=false)=>{
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
    const motif=document.createElement('div');motif.className=`aw-observance-motif aw-observance-motif--${observance}`;if(stageMode)motif.classList.add('aw-observance-motif--stage');motif.setAttribute('aria-hidden','true');
    motif.innerHTML=`<span>${spec[0]}</span>${spec[1]?`<i>${spec[1]}</i>`:''}`;layer.appendChild(motif);
  };
  const removeFx=()=>document.querySelectorAll('.aw-admin-season-fx').forEach((node)=>node.remove());
  const buildFx=(theme,observance='',stageMode=false)=>{
    const meta=META[theme],obs=OBS[observance];if(!meta)return null;if(meta.effect==='none'&&!observance)return null;
    const layer=document.createElement('div');layer.className=`aw-season-atmosphere aw-admin-season-fx ${stageMode?'aw-admin-season-fx--stage':'aw-admin-season-fx--page'} aw-season-atmosphere--${meta.effect}`;layer.setAttribute('aria-hidden','true');
    const css=getComputedStyle(root);layer.style.setProperty('--fx-primary',css.getPropertyValue('--preview-primary').trim()||'#f3b51d');layer.style.setProperty('--fx-secondary',css.getPropertyValue('--preview-secondary').trim()||'#12aaf5');layer.style.setProperty('--fx-tertiary',css.getPropertyValue('--preview-third').trim()||'#fff');
    const density=stageMode?Math.max(meta.density,meta.effect==='haze'?3:12):meta.density;
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
    addObservanceMotif(layer,observance,stageMode);
    return layer;
  };
  const mountFx=(theme,observance='')=>{
    removeFx();
    const pageLayer=buildFx(theme,observance,false);if(pageLayer)document.body.prepend(pageLayer);
    const stageLayer=buildFx(theme,observance,true);if(stage&&stageLayer)stage.prepend(stageLayer);
  };

  function updateObservanceDates(){
    observanceGrid?.querySelectorAll('[data-observance]').forEach((button)=>{const date=nextObservance(button.dataset.observance),small=button.querySelector('[data-observance-next]');if(date&&small)small.textContent=`Next · ${fmt(date)}`;});
  }

  const select=(theme='default',observance='')=>{
    if(theme==='default')delete root.dataset.adminTheme;else root.dataset.adminTheme=theme;
    if(observance)root.dataset.adminObservance=observance;else delete root.dataset.adminObservance;
    grid.querySelectorAll('[data-theme]').forEach((button)=>{const active=button.dataset.theme===theme;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    observanceGrid?.querySelectorAll('[data-observance]').forEach((button)=>{const active=button.dataset.observance===observance;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});

    const meta=META[theme]||META.default,obs=OBS[observance];
    const displayName=obs?`${observanceLabels[observance]||observance} · ${labels[theme]||theme}`:(labels[theme]||'Default Aetherwing');
    name.textContent=displayName;if(stageName)stageName.textContent=displayName;
    const blocked=theme!=='default'&&reduceMotion?.matches&&root.dataset.adminForceMotion!=='true';if(motionToggle)motionToggle.hidden=!blocked;

    if(windowEl){const date=observance?nextObservance(observance):null;windowEl.textContent=observance&&date?`Next · ${fmt(date)}`:windowText(theme);}
    if(motionEl)motionEl.textContent=obs?.motion||meta.motion;if(motionCopy)motionCopy.textContent=obs?.motionCopy||meta.motionCopy;
    if(uiEl)uiEl.textContent=obs?.ui||meta.ui;if(uiCopy)uiCopy.textContent=obs?.uiCopy||meta.uiCopy;
    requestAnimationFrame(()=>mountFx(theme,observance));
  };

  grid.addEventListener('click',(event)=>{const button=event.target.closest('[data-theme]');if(button)select(button.dataset.theme,'');});
  observanceGrid?.addEventListener('click',(event)=>{const button=event.target.closest('[data-observance]');if(button)select(button.dataset.baseTheme||OBS[button.dataset.observance]?.base||'default',button.dataset.observance);});
  if(motionToggle)motionToggle.addEventListener('click',()=>{root.dataset.adminForceMotion='true';motionToggle.hidden=true;const theme=[...grid.querySelectorAll('[data-theme].is-active')][0]?.dataset.theme||'default',observance=[...(observanceGrid?.querySelectorAll('[data-observance].is-active')||[])][0]?.dataset.observance||'';mountFx(theme,observance);});
  reset.addEventListener('click',()=>{delete root.dataset.adminForceMotion;select('default','');});
  updateObservanceDates();
  select('default','');
})();

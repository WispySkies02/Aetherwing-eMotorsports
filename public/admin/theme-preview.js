(()=>{
  const root=document.documentElement;
  const grid=document.querySelector('[data-theme-grid]');
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
  const META={
    default:{window:'Outside seasonal windows',motion:'None',motionCopy:'Default Aetherwing keeps the background still.',ui:'Standard race UI',uiCopy:'Normal Aetherwing panels, filters, buttons, borders, and scrollbar.',effect:'none',density:0},
    'summer-end':{window:'Sep 20–24 (2026)',motion:'Warm light drift',motionCopy:'Slow firefly-like light specks sit behind the workspace.',ui:'Sunset race UI',uiCopy:'Warm gold/orange accents, brighter hover energy, and sunset-lit surfaces.',effect:'glow',density:14},
    'halloween-teaser':{window:'Sep 25–30',motion:'Low drifting haze',motionCopy:'Barely-there fog makes the page feel like dusk without distracting from forms.',ui:'Early spooky UI',uiCopy:'Sharper corners, orange/violet edges, and darker distressed control surfaces.',effect:'haze',density:3},
    halloween:{window:'Oct 1–24',motion:'Fog + embers + rare bats',motionCopy:'Slow fog, sparse embers, and an occasional distant silhouette stay behind the UI.',ui:'After-dark UI',uiCopy:'Clipped corners, stronger orange edge lines, purple accents, and ember-like hovers.',effect:'halloween',density:18},
    'halloween-week':{window:'Oct 25–31',motion:'Denser spooky atmosphere',motionCopy:'More embers and a few more distant bats, still kept behind all content.',ui:'Intensified Halloween UI',uiCopy:'The Halloween treatment gets brighter accent edges and more aggressive control highlights.',effect:'halloween',density:28},
    fall:{window:'Nov 1–Thanksgiving',motion:'Sparse falling leaves',motionCopy:'A few slow leaves cross the background at different speeds.',ui:'Harvest UI',uiCopy:'Warm paper/metal panels, softer corners, rust accents, and amber dividers.',effect:'leaves',density:16},
    'christmas-teaser':{window:'Day after Thanksgiving–Nov 30',motion:'First-light twinkles',motionCopy:'Tiny warm points of light appear occasionally in the background.',ui:'First-lights UI',uiCopy:'Evergreen/red hints begin while the regular Aetherwing interface still dominates.',effect:'twinkle',density:12},
    christmas:{window:'Dec 1–17',motion:'Light snowfall',motionCopy:'Small flakes fall slowly behind the panels with frosted edges.',ui:'Christmas / winter UI',uiCopy:'Frosted top edges, evergreen/red details, cool glass panels, and warm gold accents.',effect:'snow',density:28},
    'christmas-week':{window:'Dec 18–25',motion:'Snow + holiday sparkle',motionCopy:'Snow becomes a little fuller with occasional warm twinkles.',ui:'Merry & bright UI',uiCopy:'The holiday treatment gets brighter trim and subtle glow without obscuring data.',effect:'snow-twinkle',density:44},
    'calm-winter':{window:'Dec 26–30',motion:'Very light snowfall',motionCopy:'Only a few slow flakes remain after Christmas.',ui:'Quiet winter UI',uiCopy:'Blue-gray frosted panels and reduced holiday color make the site feel calmer.',effect:'snow',density:12},
    'new-year':{window:'Dec 31–Jan 1',motion:'Distant fireworks',motionCopy:'Small, occasional bursts appear high in the background instead of covering content.',ui:'Metallic event-night UI',uiCopy:'Gold/silver surfaces, crisp corners, and a slow metallic sheen on controls.',effect:'fireworks',density:5},
    'clean-winter':{window:'Jan 2–31',motion:'Sparse snowfall',motionCopy:'A few clean white flakes keep the winter atmosphere alive.',ui:'Clean frost UI',uiCopy:'Ice-blue dividers and glassy, restrained winter panels.',effect:'snow',density:9},
    'valentine-teaser':{window:'Feb 1–7',motion:'Sparse rose petals',motionCopy:'A handful of soft petals drift behind the controls.',ui:'Soft rose UI',uiCopy:'Subtle rose accents and softer corners begin without overtaking the motorsports design.',effect:'petals',density:8},
    valentine:{window:'Feb 8–14',motion:'Drifting rose petals',motionCopy:'More petals drift slowly while remaining low-opacity and non-interactive.',ui:'Full rose UI',uiCopy:'Rose highlights, softer panels, rounded chips, and a slightly warmer glow.',effect:'petals',density:16},
    'late-winter':{window:'Feb 15–28',motion:'Last snow flurries',motionCopy:'A few fading flakes bridge winter into spring.',ui:'Thaw UI',uiCopy:'Muted blue-gray surfaces soften as the season transitions.',effect:'snow',density:6},
    spring:{window:'Mar 1–May 27 (except accents)',motion:'Drifting petals',motionCopy:'Soft petals float behind the UI to make the page feel airy and alive.',ui:'Fresh spring UI',uiCopy:'Rounder cards, green/teal edge work, airier highlights, and softer controls.',effect:'petals',density:14},
    'st-patrick':{window:'Mar 17',motion:'Green shimmer',motionCopy:'Small green/gold twinkles add a one-day accent.',ui:'Green accent UI',uiCopy:'A focused emerald edge treatment without rebuilding the whole interface.',effect:'twinkle',density:12},
    easter:{window:'Easter week',motion:'Spring petals',motionCopy:'Soft pastel-tinted petals drift slowly in the background.',ui:'Easter / renewal UI',uiCopy:'Gentle spring pastels, softer cards, and warm renewal accents.',effect:'petals',density:18},
    'memorial-day':{window:'Memorial Day weekend',motion:'Very subtle star glints',motionCopy:'Motion stays intentionally restrained for a respectful presentation.',ui:'Memorial UI',uiCopy:'Clean red/white/blue lines and sober panel treatment; no celebratory fireworks.',effect:'twinkle',density:7},
    summer:{window:'Late May–Jun 27 & Jul 5–Aug 24',motion:'Warm firefly lights',motionCopy:'Slow glowing specks create a late-evening summer atmosphere.',ui:'Summer race UI',uiCopy:'Sky-blue/gold accents, energetic hovers, and brighter race-day panels.',effect:'glow',density:18},
    'independence-day':{window:'Jun 28–Jul 4',motion:'Distant fireworks',motionCopy:'Occasional small fireworks burst behind the site instead of over the content.',ui:'Patriotic race UI',uiCopy:'Red/white/blue stripe language, crisp cards, and event-style accents.',effect:'fireworks',density:6},
  };
  const seeded=(i,salt=1)=>{const x=Math.sin((i+1)*12.9898+salt*78.233)*43758.5453;return x-Math.floor(x);};
  const styleFor=(i)=>`--x:${Math.round(seeded(i,1)*100)}%;--delay:-${(seeded(i,2)*18).toFixed(2)}s;--dur:${(12+seeded(i,3)*18).toFixed(2)}s;--size:${(3+seeded(i,4)*7).toFixed(1)}px;--drift:${Math.round((seeded(i,5)-.5)*180)}px`;
  const removeFx=()=>document.querySelectorAll('.aw-admin-season-fx').forEach((node)=>node.remove());
  const buildFx=(theme,stageMode=false)=>{
    const meta=META[theme];if(!meta||meta.effect==='none')return null;
    const layer=document.createElement('div');layer.className=`aw-season-atmosphere aw-admin-season-fx ${stageMode?'aw-admin-season-fx--stage':'aw-admin-season-fx--page'} aw-season-atmosphere--${meta.effect}`;layer.setAttribute('aria-hidden','true');
    const css=getComputedStyle(root);layer.style.setProperty('--fx-primary',css.getPropertyValue('--preview-primary').trim()||'#f3b51d');layer.style.setProperty('--fx-secondary',css.getPropertyValue('--preview-secondary').trim()||'#12aaf5');layer.style.setProperty('--fx-tertiary',css.getPropertyValue('--preview-third').trim()||'#fff');
    const density=stageMode?Math.max(meta.density,meta.effect==='haze'?3:12):meta.density;
    const add=(cls,count)=>{for(let i=0;i<count;i++){const el=document.createElement('i');el.className=cls;el.style.cssText=styleFor(i+(stageMode?31:0));layer.appendChild(el);}};
    if(meta.effect==='haze')add('aw-fx__haze',3);
    else if(meta.effect==='halloween'){add('aw-fx__haze',3);add('aw-fx__ember',density);add('aw-fx__bat',theme==='halloween-week'?4:2);}
    else if(meta.effect==='leaves')add('aw-fx__leaf',density);
    else if(meta.effect==='snow')add('aw-fx__snow',density);
    else if(meta.effect==='snow-twinkle'){add('aw-fx__snow',density);add('aw-fx__twinkle',12);}
    else if(meta.effect==='petals')add('aw-fx__petal',density);
    else if(meta.effect==='glow')add('aw-fx__glow',density);
    else if(meta.effect==='twinkle')add('aw-fx__twinkle',density);
    else if(meta.effect==='fireworks'){for(let i=0;i<density;i++){const el=document.createElement('i');el.className='aw-fx__burst';el.style.cssText=`--x:${12+seeded(i+(stageMode?19:0),8)*76}%;--y:${10+seeded(i+(stageMode?19:0),9)*52}%;--delay:-${(seeded(i+(stageMode?19:0),10)*12).toFixed(2)}s;--dur:${(6+seeded(i,11)*6).toFixed(2)}s`;layer.appendChild(el);}}
    return layer;
  };
  const mountFx=(theme)=>{
    removeFx();
    const pageLayer=buildFx(theme,false);if(pageLayer)document.body.prepend(pageLayer);
    const stageLayer=buildFx(theme,true);if(stage&&stageLayer)stage.prepend(stageLayer);
  };
  const select=(theme='default')=>{
    if(theme==='default')delete root.dataset.adminTheme;else root.dataset.adminTheme=theme;
    grid.querySelectorAll('[data-theme]').forEach((button)=>{const active=button.dataset.theme===theme;button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));});
    const meta=META[theme]||META.default;
    name.textContent=labels[theme]||'Default Aetherwing';if(stageName)stageName.textContent=labels[theme]||'Default Aetherwing';
    if(motionToggle){const blocked=theme!=='default'&&reduceMotion?.matches&&root.dataset.adminForceMotion!=='true';motionToggle.hidden=!blocked;}
    if(windowEl)windowEl.textContent=meta.window;if(motionEl)motionEl.textContent=meta.motion;if(motionCopy)motionCopy.textContent=meta.motionCopy;if(uiEl)uiEl.textContent=meta.ui;if(uiCopy)uiCopy.textContent=meta.uiCopy;
    requestAnimationFrame(()=>mountFx(theme));
  };
  grid.addEventListener('click',(event)=>{const button=event.target.closest('[data-theme]');if(button)select(button.dataset.theme);});
  if(motionToggle)motionToggle.addEventListener('click',()=>{root.dataset.adminForceMotion='true';motionToggle.hidden=true;mountFx([...grid.querySelectorAll('[data-theme].is-active')][0]?.dataset.theme||'default');});
  reset.addEventListener('click',()=>{delete root.dataset.adminForceMotion;select('default');});
  select('default');
})();

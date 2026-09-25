(()=>{
  const themes={
    'summer-end':{label:'SUMMER’S END',detail:'SEP 20–24 · LAST LIGHT OF THE SEASON',window:'Sep 20–24',effect:'Warm haze, sunset edge light, soft dust on the glass.'},
    'halloween-teaser':{label:'SOMETHING’S COMING',detail:'SEP 25–30 · THE GARAGE GETS A LITTLE DARKER',window:'Sep 25–30',effect:'Faint corner cobwebs, cool grime, low fog and a dark vignette.'},
    'halloween':{label:'AETHERWING AFTER DARK',detail:'OCT 1–24 · SPOOKY SEASON',window:'Oct 1–24',effect:'Visible glass scratches, drifting fog, amber glow and subtle cobwebs.'},
    'halloween-week':{label:'HALLOWEEN WEEK',detail:'OCT 25–31 · LIGHTS OUT AFTER THE CHECKERED FLAG',window:'Oct 25–31',effect:'Heavier fog, stronger webs, orange embers and deeper edge darkness.'},
    'fall':{label:'FALL RUN',detail:'NOV 1–26 · COOL AIR · HOT LAPS',window:'Nov 1–26',effect:'Warm glass haze with slow drifting leaf flecks.'},
    'christmas-teaser':{label:'WINTER INBOUND',detail:'NOV 27–30 · FIRST FROST',window:'Nov 27–30',effect:'First frost at the edges with sparse snow.'},
    'christmas':{label:'CHRISTMAS / WINTER',detail:'DEC 1–17 · RACING THROUGH THE COLD',window:'Dec 1–17',effect:'Frosted edges, calm snowfall and cold blue glass.'},
    'christmas-week':{label:'CHRISTMAS WEEK',detail:'DEC 18–25 · MERRY CHRISTMAS FROM AETHERWING',window:'Dec 18–25',effect:'Full snow, warm holiday bokeh and brighter frost.'},
    'calm-winter':{label:'WINTER RESET',detail:'DEC 26–30 · QUIET MILES',window:'Dec 26–30',effect:'Quiet frost, light snow and a clean cold vignette.'},
    'new-year':{label:'NEW YEAR',detail:'DEC 31–JAN 1 · ANOTHER LAP AROUND THE SUN',window:'Dec 31–Jan 1',effect:'Small sparkles and metallic glints across the front glass.'},
    'clean-winter':{label:'WINTER',detail:'JAN 2–31 · CLEAN AIR · COLD TRACK',window:'Jan 2–31',effect:'Minimal frost and sparse snow with restrained cold lighting.'},
    'valentine-teaser':{label:'VALENTINE TEASER',detail:'FEB 1–7 · A LITTLE RED IN THE GARAGE',window:'Feb 1–7',effect:'Very faint rose bokeh and a soft red edge tint.'},
    'valentine':{label:'VALENTINE’S WEEK',detail:'FEB 8–14 · LOVE FOR THE RACE',window:'Feb 8–14',effect:'Rose glass glow, soft floating highlights and red accents.'},
    'late-winter':{label:'LATE WINTER',detail:'FEB 15–28 · HOLDING ON TO THE COLD',window:'Feb 15–28',effect:'Fading frost and quiet cool haze.'},
    'spring':{label:'SPRING',detail:'MAR 1–MAY 27 · NEW SEASON · SAME FIGHT',window:'Mar 1–16, Mar 18–21, Mar 29–May 27',effect:'Fresh light, subtle pollen flecks and a softer glass vignette.'},
    'st-patrick':{label:'ST. PATRICK’S DAY',detail:'MAR 17 · A LITTLE GREEN IN THE GARAGE',window:'Mar 17',effect:'Green glints and tiny drifting flecks, kept deliberately subtle.'},
    'easter':{label:'EASTER / SPRING',detail:'MAR 22–28 · HOPE · RENEWAL · SPRING',window:'Mar 22–28',effect:'Pastel light flecks and clean spring haze.'},
    'memorial':{label:'MEMORIAL DAY',detail:'MAY 28–31 · REMEMBER & HONOR',window:'May 28–31',effect:'Restrained red, white and blue edge accents with no celebratory clutter.'},
    'summer':{label:'SUMMER',detail:'JUN 1–SEP 19 · LONG DAYS · LATE RACES',window:'Jun 1–27, Jul 5–Sep 19',effect:'Warm light bloom, faint heat haze and tiny dust motes.'},
    'independence':{label:'INDEPENDENCE DAY',detail:'JUN 28–JUL 4 · RED · WHITE · BLUE',window:'Jun 28–Jul 4',effect:'Subtle red/blue sparks and crisp glass highlights.'}
  };

  const easternParts=(date=new Date())=>Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date).filter(part=>part.type!=='literal').map(part=>[part.type,part.value]));
  const scheduleFor=(date=new Date())=>{
    const parts=easternParts(date),md=Number(parts.month)*100+Number(parts.day);
    if(md>=920&&md<=924)return'summer-end';
    if(md>=925&&md<=930)return'halloween-teaser';
    if(md>=1001&&md<=1024)return'halloween';
    if(md>=1025&&md<=1031)return'halloween-week';
    if(md>=1101&&md<=1126)return'fall';
    if(md>=1127&&md<=1130)return'christmas-teaser';
    if(md>=1201&&md<=1217)return'christmas';
    if(md>=1218&&md<=1225)return'christmas-week';
    if(md>=1226&&md<=1230)return'calm-winter';
    if(md===1231||md===101)return'new-year';
    if(md>=102&&md<=131)return'clean-winter';
    if(md>=201&&md<=207)return'valentine-teaser';
    if(md>=208&&md<=214)return'valentine';
    if(md>=215&&md<=229)return'late-winter';
    if((md>=301&&md<=316)||(md>=318&&md<=321)||(md>=329&&md<=527))return'spring';
    if(md===317)return'st-patrick';
    if(md>=322&&md<=328)return'easter';
    if(md>=528&&md<=531)return'memorial';
    if((md>=601&&md<=627)||(md>=705&&md<=919))return'summer';
    if(md>=628&&md<=704)return'independence';
    return'off';
  };

  const params=new URLSearchParams(location.search),forced=params.get('season');
  const active=forced==='off'?'off':forced&&forced!=='auto'&&themes[forced]?forced:scheduleFor(new Date());
  const api={themes,scheduleFor,easternParts,active,forced:forced||'auto',hydrate(){
    const theme=themes[active],banner=document.querySelector('.aw-season-banner');
    if(!banner||!theme)return;
    banner.querySelector('[data-season-label]')?.replaceChildren(theme.label);
    banner.querySelector('[data-season-detail]')?.replaceChildren(theme.detail);
    banner.setAttribute('aria-label',`${theme.label} seasonal theme`);
  }};
  window.AetherwingSeasonal=api;
  if(!location.pathname.startsWith('/admin/')){
    if(active!=='off')document.documentElement.dataset.season=active;else delete document.documentElement.dataset.season;
    document.documentElement.dataset.seasonMode=forced&&forced!=='auto'?'preview':'auto';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>api.hydrate(),{once:true});else api.hydrate();
})();

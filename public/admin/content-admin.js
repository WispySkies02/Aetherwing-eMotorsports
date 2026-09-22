(() => {
  'use strict';
  const local = ['localhost','127.0.0.1'].includes(location.hostname);
  const endpoint = '/.netlify/functions/site-admin';
  const modules = {
    schedule: { title:'Schedule Manager', sections:[['schedule-events','Race calendar']] },
    results: { title:'Results & Milestones', sections:[['results','Race results'],['wins','Win archive'],['standings','Standings snapshots'],['milestones','Milestones']] },
    roster: { title:'Roster Manager', sections:[['drivers','Driver league assignments'],['roster-profiles','Driver directory & bios'],['driver-profiles','Driver profiles'],['charters','Charter boards'],['iracing-garage','iRacing roster'],['competitions','League details']] },
    organization: { title:'Organization', sections:[['leadership','Leadership'],['partners','Partners']] },
    news: { title:'Team Wire', sections:[['news','Stories & featured homepage headline']] }
  };
  const datasetMeta = {
    'schedule-events':{number:'01',kicker:'RACE OPERATION',title:'Calendar',description:'Add or edit every race, off-week, special event, event window, status badge, track, date, and start time. New races automatically move into chronological order when saved or published.',guide:'Choose Add Race, then complete its league, date, and start time. The Calendar places it by date, parsed 12-hour time, and league; date + league + event title determine its share route.'},
    results:{number:'02',kicker:'RACE OPERATION',title:'Race Results',description:'Choose a scheduled race, then enter one or more results using only drivers assigned to that league in the Driver Roster.',guide:'Filter the calendar by league and load the completed race. Event details stay synced to the schedule, older results remain saved, and one race can be selected as the current featured result.'},
    wins:{number:'03',kicker:'RACE OPERATION',title:'Win Archive',description:'Add, correct, or remove individual wins used by Wins & History.',guide:'One row equals one recorded win. Keep historical driver names when that is how the result was originally recorded.'},
    standings:{number:'04',kicker:'RACE OPERATION',title:'Standings',description:'Edit complete championship snapshots. Drag driver rows into display order, edit the official position label, and toggle Aetherwing highlighting per driver.',guide:'Drag standings rows to reorder them. The Position field stays independently editable so partial/team-only tables can keep positions like P1, P2, P4. Use Highlight Driver for Aetherwing emphasis.'},
    milestones:{number:'05',kicker:'RACE OPERATION',title:'Milestones',description:'Manage the timeline of major Aetherwing and driver milestones.',guide:'Use this for meaningful historical markers, not routine race results.'},
    drivers:{number:'06',kicker:'PEOPLE + PROGRAMS',title:'Driver League Assignments',description:'One row per driver per league: number, public display name, status, affiliation, car/body, and identity note.',guide:'This is the source of truth for current league assignments. Changing an assignment also drives the public roster number/program badges.'},
    'roster-profiles':{number:'07',kicker:'PEOPLE + PROGRAMS',title:'Driver Directory',description:'Edit each person’s current public identity, handle, role, affiliation, feature label, biography, and identity history.',guide:'Numbers and program badges are generated from Driver League Assignments, so those summaries are read-only here.'},
    'driver-profiles':{number:'08',kicker:'PEOPLE + PROGRAMS',title:'Driver Profiles',description:'Edit long-form profile presentation, platform-specific names, historical names, and every career-stat tile.',guide:'This controls detailed profile copy. Current Roblox/RoRacing and iRacing identities can stay distinct without creating duplicate people.'},
    charters:{number:'09',kicker:'PEOPLE + PROGRAMS',title:'Charter Boards',description:'Build each league’s charter structure: full-time seats plus any number of configurable Open Charters and number identities.',guide:'One Open Charter record equals one actual charter slot. Inside it, add one or more possible number/usage identities. You can remove #82, run only #62, add a third use, add another Open Charter, or create a Charter Board for another league later.'},
    'iracing-garage':{number:'10',kicker:'PEOPLE + PROGRAMS',title:'iRacing Roster',description:'Edit Factory Program totals and every driver/team entry shown in the iRacing garage.',guide:'Hailey’s current iRacing presentation is Hailey Bell only. Roblox usernames do not belong on current iRacing entries.'},
    competitions:{number:'11',kicker:'PEOPLE + PROGRAMS',title:'League Details',description:'Edit the public name, relationship type, schedule cadence, platform, machine, and roster summary for every active competition relationship.',guide:'This edits Aetherwing’s relationship to a league/program; it does not alter technical schedule colors or route IDs.'},
    leadership:{number:'12',kicker:'ORGANIZATION',title:'Leadership',description:'Edit current leadership names and every public role attached to each person.',guide:'Use one role per line. This feeds current leadership presentation across the handbook, mission, and contact areas.'},
    partners:{number:'13',kicker:'ORGANIZATION',title:'Partners',description:'Edit partner names, roles, descriptions, links, logo URLs, tags, and featured state.',guide:'This controls current partner presentation. Use full HTTPS URLs for both the partner website and logo.'},
    news:{number:'14',kicker:'TEAM WIRE',title:'Team Wire',description:'Edit complete stories: metadata, headline treatment, metrics, quotes, sections, paragraphs, tags, callouts, and homepage-feature status.',guide:'Exactly one story must be featured. Story slugs are public URLs; changing a slug can affect existing links unless a redirect is added in code.'}
  };
  const rosterGuides = Object.fromEntries(Object.entries(datasetMeta).map(([id,meta])=>[id,[meta.title,meta.guide]]));
  const legacyCompetitionChoices = [
    ['nrrs','NRRS'],['uarl-d1','UARL Division 1'],['uarl-open','UARL Open'],
    ['kmart','Kmart Auto Parts Series'],['sunoco','Sunoco Truck Series'],['iracing-factory','iRacing Factory Program']
  ];
  const statusChoices = ['Full-Time','Part-Time','Development','Active','Shared Part-Time Entry','Factory Driver','Team Entry','OPEN'];
  const fieldLabels = {
    'schedule-events':{league:'Series / program',leagueName:'Public series name',status:'Race / season status',title:'Event name',track:'Track / venue',date:'Start date',endDate:'End date',displayDate:'Displayed date/window',time:'Start time',round:'Round label',specialTag:'Special badge',offWeek:'Off-week / no race',tbd:'Date/time TBD'},
    results:{scheduleId:'Linked schedule race',league:'League ID',leagueName:'League / series',title:'Race name',track:'Track',date:'Race date',round:'Round',status:'Race status',specialTag:'Special badge',featured:'Current latest result',headline:'Headline line 1',headlineAccent:'Headline accent line',summary:'Race summary',entries:'Driver results',driver:'Roster driver',number:'Car number',start:'Starting position',stage1Finish:'Stage 1 finish',stage1Points:'Stage 1 points',stage2Finish:'Stage 2 finish',stage2Points:'Stage 2 points',finish:'Finishing position',racePoints:'Total race points',featuredDriver:'Featured driver'},
    wins:{league:'League / series',track:'Track / event',driver:'Recorded driver name',date:'Result date'},
    standings:{id:'Snapshot ID',title:'Public title',subtitle:'Snapshot context',league:'League key',status:'Status badge',rows:'Standings rows',position:'Official position label',number:'Car number',driver:'Driver',points:'Points',delta:'Gap / delta',positionChange:'Position change',chaseEligible:'Chase eligible',chaseStatus:'Chase label',highlight:'Highlight this driver'},
    milestones:{date:'Display date',title:'Milestone title',description:'Milestone description'},
    drivers:{id:'Assignment ID',profile:'Driver profile',displayName:'Display name in this league',number:'Car number',competition:'League name',competitionId:'League',status:'Entry status',affiliation:'Competing organization',car:'Car / body',identityNote:'Identity note'},
    'roster-profiles':{slug:'Profile ID',name:'Current display name',handle:'Current handle / username',role:'Team role',affiliation:'Primary affiliation',numbers:'Active numbers summary',programs:'Program badges',feature:'Profile tag',bio:'Biography',iracingName:'Current iRacing name',historicalIRacingName:'Historical iRacing name',robloxDisplayName:'Current Roblox display name',robloxUsername:'Roblox username',historicalRobloxDisplayName:'Historical Roblox display name'},
    'driver-profiles':{slug:'Profile ID',displayName:'Current RoRacing display name',iracingName:'Current iRacing name',subtitle:'Profile subtitle',intro:'Profile introduction',stats:'Career stat tiles',historicalIRacingName:'Historical iRacing name',robloxDisplayName:'Current Roblox display name',robloxUsername:'Roblox username',historicalRobloxDisplayName:'Historical Roblox display name'},
    charters:{id:'League / charter board ID',label:'Public series label',seriesNote:'Board note',fullTime:'Full-time charters',openCharters:'Open Charters',uses:'Number identities / uses',number:'Car number',driver:'Assigned driver',slotLabel:'Slot label',active:'Active / public',description:'Public explanation'},
    'iracing-garage':{factoryDrivers:'Factory driver count',teamEntries:'Team entry count',schemes:'Published scheme count',entries:'Garage entries',driver:'Driver / team name',number:'Car number(s)',placeholder:'Placeholder entry'},
    competitions:{id:'League ID',name:'League / program name',type:'Relationship type',label:'Public relationship label',schedule:'Usual schedule',machine:'Car / machine',platform:'Platform',roster:'Roster summary'},
    leadership:{name:'Current public name',roles:'Leadership roles'},
    partners:{name:'Partner name',role:'Relationship / role',featured:'Featured partner',description:'Public description',url:'Official website URL',logo:'Logo image URL',tags:'Partner tags'},
    news:{slug:'Story slug / URL',legacyRoute:'Legacy route',category:'Category',date:'Display date',dateIso:'Publish date',context:'Context label',kicker:'Kicker',title:'Headline',summary:'Story summary',tags:'Tags',featured:'Homepage featured story',heroGhost:'Hero ghost text',headlineMark:'Headline stat treatment',byline:'Byline',metrics:'Metric cards',quote:'Pull quote',sections:'Story sections',callout:'Closing callout'}
  };
  const fieldHelp = {
    slug:'Public identifier used in URLs. Change carefully after publication.',
    id:'Internal/public content identifier. Keep unique inside this tab.',
    profile:'Connects this league assignment to one person in the Driver Directory.',
    competitionId:'Select the active league/program. The public league name is synchronized automatically.',
    displayName:'The name shown for this specific context; it can differ by platform.',
    identityNote:'Internal/public clarification for platform or historical identity handling.',
    number:'Enter the number exactly as it should display. Multiple iRacing numbers may use “28 / 97”.',
    date:'Use the event/result date expected by this content type.',
    dateIso:'Machine-readable publication date used for sorting.',
    endDate:'Optional final day for multi-day event windows.',
    time:'Include ET when the public schedule should explicitly show Eastern Time.',
    status:'Controls the public badge/context shown with this entry.',
    specialTag:'Optional badge such as Crown Jewel, Chase Race, Championship, or Postponed.',
    featured:'Only use this when the item should receive featured treatment.',
    url:'Use the official HTTPS destination.',
    logo:'Use a direct HTTPS image URL.',
    roles:'One public role per line.',
    tags:'One tag per line in this editor.',
    bio:'Long-form public biography.',
    intro:'Opening paragraph on the detailed driver profile.',
    stats:'Each nested item is one stat tile with a label and value.',
    roster:'One roster summary item per line.',
    rows:'Each nested item is one published standings row.',
    sections:'Each nested item is a story section. Paragraphs inside it are one paragraph per line.',
    legacyRoute:'Historical route retained for redirects/reference. Leave blank only when there is no legacy URL.',
    headlineMark:'Optional structured headline/stat treatment used by featured race stories.',
    metrics:'Optional structured metric cards for a story.',
    quote:'Optional pull quote with text and attribution.',
    openCharters:'Each item is ONE actual Open Charter slot. Add or remove Open Charter items to change the actual charter count.',
    uses:'Possible identities/usages for this one Open Charter. One use = one number. Multiple uses still count as one actual charter slot and are not simultaneous.',
    highlight:'Adds Aetherwing visual emphasis to this driver on the public standings cards.',
    slotLabel:'Optional public slot label such as “4TH CHARTER” or “OPEN CHARTER 2”.',
    active:'Turn this charter or number identity on/off without deleting it.'
  };
  const fieldLabel = (name) => fieldLabels[key]?.[name] || label(name);
  const helpFor = (name) => fieldHelp[name] || '';

  let registry = { revision:0, published:{}, drafts:{}, history:[] }, seeds = {}, key='', data=null, index=0, dirty=false, loaded=false, busy=false, publishConfigured=false;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = (s) => s.replace(/([A-Z])/g,' $1').replace(/[-_]/g,' ').replace(/^./,(c)=>c.toUpperCase());
  const status = (message) => { $('[data-content-status]').textContent=message; };
  const account = () => window.netlifyIdentity?.currentUser();
  const authorized = () => local || (account()?.app_metadata?.roles || account()?.app_metadata?.authorization?.roles || []).includes('admin');
  const base = (name) => registry.drafts[name] ?? registry.published[name] ?? seeds[name];
  const competitionChoices = () => {
    const live = (base('competitions') || []).map((item)=>[item.id,item.name]).filter(([id])=>id);
    return [...new Map([...legacyCompetitionChoices,...live].map((item)=>[item[0],item])).values()];
  };
  const scheduleLeagueChoices = (currentValue='') => {
    const scheduled = (base('schedule-events') || []).map((item)=>[item.league,item.leagueName]).filter(([id])=>id);
    const values = [...new Map([...scheduled,...competitionChoices(),currentValue?[[currentValue,currentValue]]:[]].map((item)=>[item[0],item])).values()];
    return values;
  };
  const scheduleLeagueOrder=['nrrs','kmart','sunoco','uarl-d1','open','iracing','uarl-d2'];
  function scheduleTimeMinutes(value='') {
    const match=String(value).trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
    if(!match)return Number.MAX_SAFE_INTEGER;
    let hour=Number(match[1])%12;if(match[3].toUpperCase()==='PM')hour+=12;
    return hour*60+Number(match[2]||0);
  }
  function compareScheduleEvents(a,b) {
    const date=String(a?.date||'9999-12-31').localeCompare(String(b?.date||'9999-12-31'));
    if(date)return date;
    const time=scheduleTimeMinutes(a?.time)-scheduleTimeMinutes(b?.time);
    if(time)return time;
    const league=(scheduleLeagueOrder.indexOf(a?.league)===-1?scheduleLeagueOrder.length:scheduleLeagueOrder.indexOf(a?.league))-(scheduleLeagueOrder.indexOf(b?.league)===-1?scheduleLeagueOrder.length:scheduleLeagueOrder.indexOf(b?.league));
    return league||String(a?.title||'').localeCompare(String(b?.title||''));
  }
  function autoPlaceScheduleEvents() {
    if(key!=='schedule-events'||!Array.isArray(data))return false;
    const selected=current();
    data.sort(compareScheduleEvents);
    index=Math.max(0,data.indexOf(selected));
    return true;
  }
  const slugifyResultPart=(value='')=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
  const resultScheduleId=(event={})=>`${event.date||'tbd'}-${event.league||'event'}-${slugifyResultPart(event.title||event.track||'scheduled-event')}`;
  const resultLeagueId=(league='')=>league==='open'?'uarl-open':league==='iracing'?'iracing-factory':league;
  function resultRoster(league='') {
    const id=resultLeagueId(league);
    return (base('drivers')||seeds.drivers||[]).filter((driver)=>driver.competitionId===id&&String(driver.displayName||'').trim()).sort((a,b)=>String(a.number||'').localeCompare(String(b.number||''),undefined,{numeric:true}));
  }
  function isoResultDate(value='') {
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);
    const parsed=new Date(value);return Number.isNaN(parsed.getTime())?'':parsed.toISOString().slice(0,10);
  }
  function migrateResults(value) {
    if(Array.isArray(value))return value;
    if(Array.isArray(value?.races))return value.races;
    const old=value?.latestResult;if(!old)return [];
    const date=isoResultDate(old.date),schedule=(base('schedule-events')||seeds['schedule-events']||[]).find((event)=>event.league==='nrrs'&&(event.title===old.title||event.track===old.track)&&(!date||event.date===date));
    const league=schedule?.league||'nrrs',assignment=resultRoster(league).find((driver)=>String(driver.number)===String(old.number));
    return [{scheduleId:schedule?resultScheduleId(schedule):`${date||'tbd'}-${league}-${slugifyResultPart(old.title)}`,league,leagueName:schedule?.leagueName||old.series||'NRRS',title:schedule?.title||old.title||'',track:schedule?.track||old.track||'',date:schedule?.date||date,round:schedule?.round||old.round||'',status:schedule?.status||'',specialTag:schedule?.specialTag||old.specialTag||'',featured:true,headline:old.headline||'',headlineAccent:old.headlineAccent||'',summary:old.summary||'',entries:[{driver:assignment?.displayName||old.driver||'',number:String(assignment?.number||old.number||''),start:Number(old.start||0),stage1Finish:0,stage1Points:0,stage2Finish:0,stage2Points:Number(old.stagePoints||0),finish:Number(old.finish||0),racePoints:Number(old.pointsChange||0),featuredDriver:true}]}];
  }
  function compareResults(a,b){return String(b?.date||'').localeCompare(String(a?.date||''))||String(a?.league||'').localeCompare(String(b?.league||''))||String(a?.title||'').localeCompare(String(b?.title||''));}
  function updateControlCenterStatus(publication=null) {
    const drafts=Object.keys(registry.drafts||{}),published=Object.keys(registry.published||{});
    const revision=$('[data-admin-revision]'),draftCount=$('[data-admin-draft-count]'),publishedCount=$('[data-admin-published-count]'),last=$('[data-admin-last-published]');
    if(revision)revision.textContent=String(registry.revision||0);
    if(draftCount)draftCount.textContent=String(drafts.length);
    if(publishedCount)publishedCount.textContent=String(published.length);
    if(last)last.textContent=registry.lastPublication?.at?new Date(registry.lastPublication.at).toLocaleString():'None yet';
    document.querySelectorAll('[data-admin-dataset]').forEach((button)=>button.classList.toggle('has-draft',drafts.includes(button.dataset.adminDataset)));
    const overviewStatus=$('[data-admin-publish-status]');
    if(overviewStatus)overviewStatus.textContent=publication?.message || (publishConfigured?'Publishing is connected. Current changes can save and publish in one step.':'Drafts can be saved, but the site rebuild hook still needs configuration.');
    const draftStage=$('[data-publication-stage="draft"]'),dataStage=$('[data-publication-stage="data"]'),buildStage=$('[data-publication-stage="build"]');
    [draftStage,dataStage,buildStage].forEach((stage)=>stage?.classList.remove('is-ready','is-complete','is-warning'));
    if(key && (dirty || registry.drafts?.[key])) draftStage?.classList.add('is-ready');
    if(key && registry.published?.[key]) dataStage?.classList.add('is-complete');
    if(publication?.dataPublished) dataStage?.classList.add('is-complete');
    if(publication?.queued) buildStage?.classList.add('is-complete');
    else if(publication?.dataPublished || !publishConfigured) buildStage?.classList.add('is-warning');
  }
  async function adminFetch(options) {
    let response;
    for (let attempt=0; attempt<2; attempt++) {
      response=await fetch(endpoint,options);
      if (![502,503].includes(response.status) || attempt===1) return response;
      await new Promise((resolve)=>setTimeout(resolve,550));
    }
    return response;
  }
  async function api(action, payload={}) {
    if (local) {
      if (!action) return {registry,seeds};
      if (action==='saveDraft') registry.drafts[payload.dataset]=structuredClone(payload.data);
      if (action==='discardDraft') delete registry.drafts[payload.dataset];
      if (action==='publish') { registry.published[payload.dataset]=structuredClone(payload.data ?? registry.drafts[payload.dataset]); delete registry.drafts[payload.dataset]; }
      if (action==='publishAll') { Object.assign(registry.published,structuredClone(registry.drafts));registry.drafts={}; }
      registry.revision++;
      localStorage.setItem('aetherwing-site-admin',JSON.stringify(registry));
      return { registry, publication:['publish','publishAll','rebuild'].includes(action)?{queued:false,dataPublished:['publish','publishAll'].includes(action),revision:registry.revision,message:'Local test only; no public deployment was changed.'}:null };
    }
    const jwt=await account()?.jwt();
    if (!jwt) throw new Error('Sign in with an invited administrator account.');
    const response=await adminFetch({method:action?'POST':'GET',headers:{authorization:`Bearer ${jwt}`,'content-type':'application/json'},...(action?{body:JSON.stringify({action,revision:registry.revision,...payload})}:{})});
    const body=await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(body.error || `Site editor returned ${response.status}.`);
    return body;
  }
  async function load() {
    if (!authorized()) throw new Error('Main-site editors require the admin role.');
    if (local) {
      seeds=await fetch('/data/site-admin-seed.json').then((r)=>r.json());
      try { registry=JSON.parse(localStorage.getItem('aetherwing-site-admin')||'null')||registry; } catch {}
    } else { const result=await api(); registry=result.registry; seeds=result.seeds; publishConfigured=result.publishConfigured; status(result.publishConfigured?'Ready. Current changes can publish in one step.':'Draft editing is ready. Configure the main-site build hook before rebuilding the public pages.'); }
    loaded=true;
    updateControlCenterStatus();
  }
  function blank(value) {
    if (Array.isArray(value)) return value.length ? [blank(value[0])] : [];
    if (value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,blank(v)]));
    return typeof value==='boolean'?false:typeof value==='number'?0:'';
  }
  function valueAt(root, path) { return path.reduce((v,k)=>v?.[k],root); }
  function assign(root,path,value) { let obj=root; for(const k of path.slice(0,-1)) obj=obj[k]; obj[path.at(-1)]=value; }
  const current = () => Array.isArray(data)?data[index]:data;
  function migrateCharters(value) {
    if(!Array.isArray(value))return value;
    return value.map((board)=>{
      if(Array.isArray(board.openCharters))return board;
      const old=board.openCharter;
      if(!old)return {...board,openCharters:[]};
      const uses=[old.partTime,old.development].filter(Boolean).map((use)=>({...use,active:true}));
      const next={...board,openCharters:[{id:`${board.id||'league'}-open-1`,label:old.label||'Aetherwing Open Charter',slotLabel:old.slotLabel||'',active:true,uses}]};
      delete next.openCharter;return next;
    });
  }
  function arrayTemplate(name) {
    let found;
    function visit(value) {
      if (!value || typeof value!=='object' || found) return;
      for (const [k,v] of Object.entries(value)) {
        if (k===name && Array.isArray(v) && v[0] && typeof v[0]==='object') { found=v[0];return; }
        visit(v);
      }
    }
    visit(seeds[key]);return found;
  }
  function commit() {
    if (!current()) return;
    $('[data-content-fields]').querySelectorAll('[data-field-path]').forEach((field)=>{
      const path=JSON.parse(field.dataset.fieldPath), type=field.dataset.fieldType;
      let value=type==='boolean'?field.checked:type==='number'?Number(field.value):type==='lines'?field.value.split('\n').filter((v)=>v.trim()):field.value;
      if (type==='nullable' && !value) value=null;
      assign(current(),path,value);
    });
  }
  function fields(value,path=[]) {
    const shell=(pretty,control,help='',extra='')=>`<label class="admin-field ${extra}"><span class="admin-field__label">${esc(pretty)}</span>${control}${help?`<small class="admin-field__help">${esc(help)}</small>`:''}</label>`;
    return Object.entries(value).map(([k,v])=>{
      const p=[...path,k], attr=`data-field-path="${esc(JSON.stringify(p))}"`, pretty=fieldLabel(k), help=helpFor(k);
      if (key==='standings' && k==='highlight') {
        return shell(pretty,`<input type="text" readonly value="${v?'Highlighted':'Not highlighted'}">`,'Use the ☆ Highlight Driver / ★ Highlighted button above this standings row.','is-readonly');
      }
      if (key==='roster-profiles' && (k==='programs' || k==='numbers')) {
        const shown=Array.isArray(v)?v.join(' · '):String(v||'');
        return shell(pretty,`<input type="text" readonly value="${esc(shown)}">`,'Automatically generated from Driver League Assignments when the site builds.','is-readonly');
      }
      if(key==='results'&&['scheduleId','league','leagueName','title','track','date','round','status','specialTag'].includes(k)) {
        return shell(pretty,`<input ${attr} data-field-type="string" readonly value="${esc(v)}">`,'Synced automatically from the selected scheduled race.','is-readonly');
      }
      if(key==='results'&&k==='driver'&&path[0]==='entries') {
        const choices=resultRoster(current()?.league||'');
        return shell(pretty,`<select ${attr} data-field-type="string" data-result-driver-choice>${!v?'<option value="" selected disabled>Choose roster driver</option>':''}${choices.map((driver)=>`<option value="${esc(driver.displayName)}" ${driver.displayName===v?'selected':''}>#${esc(driver.number)} · ${esc(driver.displayName)}</option>`).join('')}</select>`,choices.length?'Only drivers assigned to this league in Driver League Assignments are available.':'No drivers are assigned to this league yet. Add the driver in Driver League Assignments first.');
      }
      if(key==='results'&&k==='featuredDriver') {
        return `<label class="content-check admin-toggle"><input type="checkbox" ${attr} data-field-type="boolean" data-result-featured-driver ${v?'checked':''}><span><b>${esc(pretty)}</b><small>Use this driver for the large public result card. Selecting one clears the others in this race.</small></span></label>`;
      }
      if (Array.isArray(v) && (v.some((x)=>x && typeof x==='object') || arrayTemplate(k))) {
        const standingRows=key==='standings'&&k==='rows';
        const items=v.map((item,i)=>{
          const itemPath=[...p,i], pathAttr=esc(JSON.stringify(itemPath));
          const controls=standingRows?`<div class="standings-row-controls"><span class="standings-drag-handle" aria-hidden="true">⠿</span><button type="button" data-standing-move="-1" data-standing-path="${pathAttr}" ${i===0?'disabled':''}>↑ Move</button><button type="button" data-standing-move="1" data-standing-path="${pathAttr}" ${i===v.length-1?'disabled':''}>↓ Move</button><button type="button" class="standings-highlight-toggle ${item.highlight?'is-active':''}" data-standing-highlight data-standing-path="${pathAttr}" aria-pressed="${item.highlight?'true':'false'}">${item.highlight?'★ Highlighted':'☆ Highlight Driver'}</button></div>`:'';
          const drag=standingRows?` draggable="true" data-standing-drag="${pathAttr}"`:'';
          return `<details open${drag}><summary><span>${standingRows?'DRAG · ':''}${esc(pretty)} ${i+1}</span><small>${esc(title(item,i))}</small></summary>${controls}<div class="admin-nested-fields">${fields(item,itemPath)}</div><button class="admin-array-remove" type="button" data-array-remove="${pathAttr}">Remove ${esc(pretty)} ${i+1}</button></details>`;
        }).join('');
        const note=standingRows?'Drag rows into the public display order. Position labels do not auto-renumber, so partial standings can keep official positions such as P1, P2, P4.':'Edit every nested item in this group.';
        return `<fieldset class="admin-fieldset ${standingRows?'is-standings-sortable':''}"><legend><span>${esc(pretty)}</span><small>${esc(help||note)}</small></legend><div class="admin-array" ${standingRows?'data-standings-sortable':''}>${items}</div><button class="admin-array-add" type="button" data-array-add="${esc(JSON.stringify(p))}">+ Add ${esc(pretty)} item</button></fieldset>`;
      }
      if (v && typeof v==='object') return `<fieldset class="admin-fieldset"><legend><span>${esc(pretty)}</span><small>${esc(help||'All fields in this structured block are editable.')}</small></legend><div class="admin-nested-fields">${fields(v,p)}</div></fieldset>`;
      if (typeof v==='boolean') return `<label class="content-check admin-toggle"><input type="checkbox" ${attr} data-field-type="boolean" ${v?'checked':''}><span><b>${esc(pretty)}</b>${help?`<small>${esc(help)}</small>`:''}</span></label>`;
      if (k==='league' && key==='schedule-events') return shell(pretty,`<select ${attr} data-field-type="string">${scheduleLeagueChoices(v).map(([id,name])=>`<option value="${esc(id)}" ${id===v?'selected':''}>${esc(name||id)}</option>`).join('')}</select>`,help||'Choices come from the Leagues tab plus IDs already used by the calendar.');
      if (key==='charters' && k==='id' && path.length===0) {
        const choices=(base('competitions')||seeds.competitions||[]).map((item)=>item.id).filter(Boolean);
        return shell(pretty,`<input ${attr} data-field-type="string" list="charter-league-ids" value="${esc(v)}"><datalist id="charter-league-ids">${choices.map((id)=>`<option value="${esc(id)}"></option>`).join('')}</datalist>`,help||'Use an existing League ID or type a new one for a future league.');
      }
      if (key==='drivers' && k==='profile') {
        const profiles=(base('roster-profiles')||seeds['roster-profiles']||[]).map((profile)=>[profile.slug,profile.name]);
        return shell(pretty,`<select ${attr} data-field-type="string">${profiles.map(([id,name])=>`<option value="${esc(id)}" ${id===v?'selected':''}>${esc(name)} · ${esc(id)}</option>`).join('')}</select>`,help);
      }
      if (key==='drivers' && k==='competitionId') return shell(pretty,`<select ${attr} data-field-type="string" data-competition-choice>${competitionChoices().map(([id,name])=>`<option value="${esc(id)}" ${id===v?'selected':''}>${esc(name)}</option>`).join('')}</select>`,help);
      if (key==='drivers' && k==='competition') return shell(pretty,`<input ${attr} data-field-type="string" data-competition-name readonly value="${esc(v)}">`,'Filled automatically from the League selector.','is-readonly');
      if (key==='drivers' && k==='status') return shell(pretty,`<select ${attr} data-field-type="string">${[...new Set([...statusChoices,v])].filter(Boolean).map((name)=>`<option value="${esc(name)}" ${name===v?'selected':''}>${esc(name)}</option>`).join('')}</select>`,help);
      if (key==='drivers' && k==='affiliation') return shell(pretty,`<select ${attr} data-field-type="string"><option value="aetherwing" ${v==='aetherwing'?'selected':''}>Aetherwing eMotorsports</option><option value="alliance" ${v==='alliance'?'selected':''}>StarClutch Racing Alliance</option></select>`,help);
      if (key==='competitions' && k==='type') return shell(pretty,`<select ${attr} data-field-type="string"><option value="aetherwing" ${v==='aetherwing'?'selected':''}>Aetherwing Program</option><option value="alliance" ${v==='alliance'?'selected':''}>StarClutch Racing Alliance</option></select>`,help);
      if (key==='news' && k==='category') {
        const values=[...new Set(['Race & Competition','Team & Organization','Milestones',v])].filter(Boolean);
        return shell(pretty,`<select ${attr} data-field-type="string">${values.map((name)=>`<option value="${esc(name)}" ${name===v?'selected':''}>${esc(name)}</option>`).join('')}</select>`,help);
      }
      if (key==='schedule-events' && k==='status') {
        const values=[...new Set(['Regular Season','The Chase','Championship','Crown Jewel','Special Event','All-Star','All-Star Race','Pre-Season','Schedule Break','Postponed',v])].filter(Boolean);
        return shell(pretty,`<select ${attr} data-field-type="string">${values.map((name)=>`<option value="${esc(name)}" ${name===v?'selected':''}>${esc(name)}</option>`).join('')}</select>`,help);
      }
      if (Array.isArray(v) || String(v||'').length>110 || ['summary','description','intro','bio','text','note','message','callout','identityNote'].includes(k)) {
        return shell(pretty,`<textarea rows="${Array.isArray(v)?5:6}" ${attr} data-field-type="${Array.isArray(v)?'lines':'string'}">${esc(Array.isArray(v)?v.join('\n'):v)}</textarea>`,Array.isArray(v)?(help||'One item per line.'):help,'is-wide');
      }
      const inputType=typeof v==='number'?'number':(['dateIso','endDate'].includes(k)||(k==='date'&&key==='schedule-events'))?'date':['url','logo','image'].includes(k)?'url':'text';
      return shell(pretty,`<input ${attr} data-field-type="${typeof v==='number'?'number':v===null?'nullable':'string'}" type="${inputType}" ${typeof v==='number'?'step="any"':''} value="${esc(v)}">`,help);
    }).join('');
  }
  function title(row,i) { if(key==='drivers') return `${row.displayName||row.profile||'Driver'} · ${row.competition||'Choose league'}${row.number?` · #${row.number}`:''}`; return row.title||row.name||row.displayName||row.label||row.track||row.driver||row.id||row.slug||`Entry ${i+1}`; }
  const shiftState={days:0,indexes:[],snapshot:null};
  const shiftLeagueNames={nrrs:'NRRS','uarl-d1':'UARL D1',open:'UARL Open',kmart:'Kmart',sunoco:'Sunoco',iracing:'iRacing','uarl-d2':'UARL D2'};
  function shiftIsoDate(value,days) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return value;
    const date=new Date(`${value}T12:00:00Z`);if(Number.isNaN(date.getTime()))return value;
    date.setUTCDate(date.getUTCDate()+days);return date.toISOString().slice(0,10);
  }
  function shortDate(value) {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return value||'TBD';
    return new Date(`${value}T12:00:00Z`).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'UTC'});
  }
  function eventWindow(start,end) {
    if(!start||!end)return '';
    const a=new Date(`${start}T12:00:00Z`),b=new Date(`${end}T12:00:00Z`);
    if(Number.isNaN(a)||Number.isNaN(b))return '';
    const ma=a.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'}),mb=b.toLocaleDateString('en-US',{month:'short',timeZone:'UTC'});
    if(a.getUTCFullYear()===b.getUTCFullYear()&&a.getUTCMonth()===b.getUTCMonth())return `${ma} ${a.getUTCDate()}–${b.getUTCDate()}`;
    if(a.getUTCFullYear()===b.getUTCFullYear())return `${ma} ${a.getUTCDate()}–${mb} ${b.getUTCDate()}`;
    return `${ma} ${a.getUTCDate()}, ${a.getUTCFullYear()}–${mb} ${b.getUTCDate()}, ${b.getUTCFullYear()}`;
  }
  function scheduleShiftTool(){return $('[data-schedule-shift]');}
  function populateShiftStarts(preferredIndex=null){
    const leagueSelect=$('[data-shift-league]'),startSelect=$('[data-shift-start]');if(!leagueSelect||!startSelect||!Array.isArray(data))return;
    const league=leagueSelect.value;
    const matches=data.map((event,i)=>({event,i})).filter(({event})=>event.league===league&&/^\d{4}-\d{2}-\d{2}$/.test(String(event.date||''))).sort((a,b)=>String(a.event.date).localeCompare(String(b.event.date))||a.i-b.i);
    startSelect.innerHTML=matches.map(({event,i})=>`<option value="${i}">${esc(shortDate(event.date))} · ${esc(event.title||event.track||`Entry ${i+1}`)}</option>`).join('');
    if(preferredIndex!==null&&matches.some(({i})=>i===preferredIndex))startSelect.value=String(preferredIndex);
    else {
      const today=new Date().toISOString().slice(0,10),next=matches.find(({event})=>String(event.date)>=today)||matches[0];
      if(next)startSelect.value=String(next.i);
    }
  }
  function refreshScheduleShiftTool(){
    const tool=scheduleShiftTool();if(!tool)return;
    tool.hidden=key!=='schedule-events';
    $('[data-shift-preview-panel]').hidden=true;shiftState.days=0;shiftState.indexes=[];
    if(key!=='schedule-events'||!Array.isArray(data))return;
    const currentLeague=current()?.league;
    const leagues=[...new Set(data.map((event)=>event.league).filter(Boolean))];
    const leagueSelect=$('[data-shift-league]');
    leagueSelect.innerHTML=leagues.map((league)=>`<option value="${esc(league)}">${esc(shiftLeagueNames[league]||data.find((event)=>event.league===league)?.leagueName||league)}</option>`).join('');
    if(currentLeague&&leagues.includes(currentLeague))leagueSelect.value=currentLeague;
    populateShiftStarts(index);
  }
  function previewScheduleShift(days){
    if(key!=='schedule-events'||!Array.isArray(data))return;
    commit();
    const league=$('[data-shift-league]').value,startIndex=Number($('[data-shift-start]').value),start=data[startIndex];
    if(!start||start.league!==league||!start.date)return status('Choose a valid series and starting event.');
    const indexes=data.map((event,i)=>({event,i})).filter(({event})=>event.league===league&&event.date&&String(event.date)>=String(start.date)).sort((a,b)=>String(a.event.date).localeCompare(String(b.event.date))||a.i-b.i).map(({i})=>i);
    if(!indexes.length)return status('No dated events are available to shift from that point.');
    shiftState.days=days;shiftState.indexes=indexes;
    const direction=days>0?'later':'earlier',panel=$('[data-shift-preview-panel]');
    $('[data-shift-preview-heading]').textContent=`${shiftLeagueNames[league]||start.leagueName||league} · ${days>0?'+1 week':'−1 week'}`;
    $('[data-shift-preview-summary]').textContent=`${indexes.length} event${indexes.length===1?'':'s'} will move 7 days ${direction}, starting with ${start.title||start.track}.`;
    const rows=indexes.slice(0,10).map((i)=>{const event=data[i],next=shiftIsoDate(event.date,days);return `<li><strong>${esc(event.title||event.track)}</strong><span>${esc(shortDate(event.date))} → ${esc(shortDate(next))}</span></li>`;});
    if(indexes.length>10)rows.push(`<li class="is-more"><strong>+ ${indexes.length-10} more event${indexes.length-10===1?'':'s'}</strong><span>All move by the same 7 days.</span></li>`);
    $('[data-shift-preview-list]').innerHTML=rows.join('');
    $('[data-shift-apply]').textContent=`Apply ${days>0?'+1':'−1'} Week Shift`;
    panel.hidden=false;panel.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
    status(`Preview ready. Nothing has changed yet. Review ${indexes.length} affected event${indexes.length===1?'':'s'}, then apply the shift.`);
  }
  function applyScheduleShift(){
    if(!shiftState.days||!shiftState.indexes.length)return status('Preview a schedule shift first.');
    const first=data[shiftState.indexes[0]],days=shiftState.days,direction=days>0?'later':'earlier';
    if(!confirm(`Move ${shiftState.indexes.length} ${shiftLeagueNames[first.league]||first.leagueName||first.league} event${shiftState.indexes.length===1?'':'s'} 7 days ${direction}, starting with ${first.title||first.track}?\n\nThis changes the open Calendar workspace. Use Publish current changes when the dates look right.`))return;
    const shiftedCount=shiftState.indexes.length;
    shiftState.snapshot=structuredClone(data);
    shiftState.indexes.forEach((i)=>{
      const event=data[i];event.date=shiftIsoDate(event.date,days);
      if(event.endDate)event.endDate=shiftIsoDate(event.endDate,days);
      if(event.endDate&&event.displayDate)event.displayDate=eventWindow(event.date,event.endDate);
    });
    dirty=true;render();
    const selected=index;refreshScheduleShiftTool();
    const leagueSelect=$('[data-shift-league]');if(first?.league&&[...leagueSelect.options].some((option)=>option.value===first.league)){leagueSelect.value=first.league;populateShiftStarts(selected);}
    $('[data-shift-undo]').hidden=false;
    status(`${shiftedCount} event${shiftedCount===1?'':'s'} moved 7 days ${direction} in the Calendar workspace. Review the dates, then use Publish current changes.`);
  }
  function undoScheduleShift(){
    if(!shiftState.snapshot)return status('There is no bulk shift to undo in this session.');
    data=structuredClone(shiftState.snapshot);shiftState.snapshot=null;dirty=true;render();refreshScheduleShiftTool();$('[data-shift-undo]').hidden=true;status('Last bulk week shift undone. The Schedule Manager still has unsaved changes.');
  }
  function refreshResultsRaceOptions(preferredId='') {
    const tool=$('[data-results-race-tool]');if(!tool)return;
    tool.hidden=key!=='results';if(key!=='results')return;
    const events=(base('schedule-events')||seeds['schedule-events']||[]).filter((event)=>!event.offWeek&&event.date&&event.league);
    const leagueSelect=$('[data-results-league-filter]'),raceSelect=$('[data-results-race-select]');
    const leagues=[...new Map(events.map((event)=>[event.league,event.leagueName||event.league])).entries()];
    leagueSelect.innerHTML=leagues.map(([id,name])=>`<option value="${esc(id)}">${esc(name)}</option>`).join('');
    const preferred=data?.[index]?.league;if(preferred&&leagues.some(([id])=>id===preferred))leagueSelect.value=preferred;
    const populate=()=>{
      const filtered=events.filter((event)=>event.league===leagueSelect.value).sort((a,b)=>String(b.date).localeCompare(String(a.date))||scheduleTimeMinutes(a.time)-scheduleTimeMinutes(b.time));
      raceSelect.innerHTML=filtered.map((event)=>{const id=resultScheduleId(event);return `<option value="${esc(id)}">${esc(shortDate(event.date))} · ${esc(event.title)} · ${esc(event.track)}</option>`;}).join('');
      const wanted=preferredId||data?.[index]?.scheduleId;if(wanted&&filtered.some((event)=>resultScheduleId(event)===wanted))raceSelect.value=wanted;
      $('[data-results-load-race]').disabled=!filtered.length;
    };
    leagueSelect.onchange=()=>{populate();status(`Showing scheduled races for ${leagueSelect.options[leagueSelect.selectedIndex]?.text||leagueSelect.value}.`);};
    populate();
  }
  function loadSelectedResultRace() {
    if(key!=='results'||!Array.isArray(data))return;
    commit();
    const id=$('[data-results-race-select]').value,event=(base('schedule-events')||seeds['schedule-events']||[]).find((item)=>resultScheduleId(item)===id);
    if(!event)return status('Choose a scheduled race first.');
    const existing=data.findIndex((race)=>race.scheduleId===id);
    if(existing!==-1){index=existing;render();refreshResultsRaceOptions(id);return status(`${event.title} is already in Race Results. Its saved result is open now.`);}
    const eligible=resultRoster(event.league),first=eligible[0];
    data.push({scheduleId:id,league:event.league,leagueName:event.leagueName||event.league,title:event.title||'',track:event.track||'',date:event.date||'',round:event.round||'',status:event.status||'',specialTag:event.specialTag||'',featured:data.length===0,headline:'',headlineAccent:'',summary:'',entries:[{driver:first?.displayName||'',number:String(first?.number||''),start:0,stage1Finish:0,stage1Points:0,stage2Finish:0,stage2Points:0,finish:0,racePoints:0,featuredDriver:true}]});
    data.sort(compareResults);index=data.findIndex((race)=>race.scheduleId===id);dirty=true;render();refreshResultsRaceOptions(id);
    status(`${event.title} loaded from the schedule. ${eligible.length} roster driver${eligible.length===1?' is':'s are'} eligible for this league.`);
  }
  function featureSelectedResult() {
    if(key!=='results'||!current())return;
    commit();data.forEach((race,i)=>{race.featured=i===index;});dirty=true;render();status(`${current().title} will be the current Latest Result after you publish.`);
  }
  function renderList() {
    const search=$('[data-content-search]').value.toLowerCase();
    $('[data-content-list]').innerHTML=Array.isArray(data)?data.map((r,i)=>({r,i})).filter(({r})=>JSON.stringify(r).toLowerCase().includes(search)).map(({r,i})=>`<button type="button" data-entry="${i}" aria-pressed="${i===index}"><strong>${esc(title(r,i))}</strong><small>${esc([r.leagueName||r.competition||r.category||'',r.date||r.numbers||r.slug||''].filter(Boolean).join(' · '))}</small></button>`).join(''):'<p>This section is one complete record. Edit its fields on the right.</p>';
    $('[data-content-add]').hidden=!Array.isArray(data);
    $('[data-content-add]').textContent=key==='schedule-events'?'Add race':key==='results'?'Choose race above':'Add new entry';
    $('[data-content-remove]').hidden=!Array.isArray(data)||!data.length;
  }
  function featureSelectedStory() {
    if (key!=='news' || !current()) return;
    commit();data.forEach((story,i)=>{story.featured=i===index;});dirty=true;render();status('This story is selected as the featured headline. Save the section draft, then publish.');
  }
  function render() {
    renderList();
    const guide=$('[data-content-guide]');
    if(guide){
      const copy=rosterGuides[key], meta=datasetMeta[key];
      guide.hidden=!copy;
      if(copy) {
        const count=Array.isArray(data)?`${data.length} ${data.length===1?'entry':'entries'}`:'1 structured record';
        guide.innerHTML=`<div><strong>${esc(copy[0])}</strong><p>${esc(copy[1])}</p></div><span>${esc(count)} · every visible field is editable unless marked automatic</span>`;
      }
    }
    const row=current();
    $('[data-content-fields]').innerHTML=row?fields(row):'<p>No entries. Choose Add entry to start.</p>';
    if (key==='news' && row) {
      const button=document.createElement('button');button.type='button';button.textContent='Make this the featured homepage story';button.addEventListener('click',featureSelectedStory);$('[data-content-fields]').prepend(button);
    }
    if(key==='results'&&row){
      const button=document.createElement('button');button.type='button';button.textContent=row.featured?'Current featured latest result':'Make this the current latest result';button.disabled=Boolean(row.featured);button.addEventListener('click',featureSelectedResult);$('[data-content-fields]').prepend(button);
    }
  }
  function setActiveAdminTab(selector,value) {
    document.querySelectorAll('[data-admin-tabs] button').forEach((button)=>{
      const active=selector==='dataset'?button.dataset.adminDataset===value:selector==='paint'?button.dataset.adminPaintTab===value:button.dataset.adminTab===value;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-selected',String(active));
    });
  }
  function hidePaintPanels() {
    document.querySelectorAll('[data-panel]').forEach((panel)=>{panel.hidden=true;});
  }
  function showOverview() {
    if(dirty&&!confirm('Leave unsaved changes in this tab?'))return;
    $('[data-admin-overview]').hidden=false;
    $('[data-content-editor]').hidden=true;
    hidePaintPanels();
    setActiveAdminTab('overview','overview');
    key='';data=null;dirty=false;
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function chooseDataset(name) {
    key=name; data=structuredClone(base(key)); if(key==='charters')data=migrateCharters(data); index=0; dirty=false;
    if (key==='schedule-events') data=data.map((r)=>({offWeek:false,tbd:false,specialTag:'',round:'',...r})).sort(compareScheduleEvents);
    if(key==='results')data=migrateResults(data).sort(compareResults);
    const meta=datasetMeta[key]||{number:'EDIT',kicker:'CONTENT WORKSPACE',title:label(key),description:'Edit this content section.'};
    $('[data-content-number]').textContent=meta.number;
    $('[data-content-kicker]').textContent=meta.kicker;
    $('[data-content-title]').textContent=meta.title;
    $('[data-content-description]').textContent=meta.description;
    const select=$('[data-content-dataset]');
    if(select)select.value=key;
    render();refreshScheduleShiftTool();refreshResultsRaceOptions();
    status(`${registry.drafts[key]?'PRIVATE SAVED DRAFT':registry.published[key]?'PUBLISHED OVERRIDE':'BUNDLED BASELINE'} · Revision ${registry.revision}. Save Draft never changes the public site; Publish applies this tab and queues the site rebuild.`);
    updateControlCenterStatus();
  }
  async function openDatasetTab(name) {
    if (busy) return;
    if (dirty && key!==name && !confirm('Leave unsaved changes in this tab?')) return;
    try {
      if (!loaded) await load();
      $('[data-admin-overview]').hidden=true;
      hidePaintPanels();
      $('[data-content-editor]').hidden=false;
      const select=$('[data-content-dataset]');
      select.innerHTML=Object.entries(datasetMeta).map(([id,meta])=>`<option value="${id}">${esc(meta.title)}</option>`).join('');
      chooseDataset(name);
      setActiveAdminTab('dataset',name);
      $('[data-content-editor]').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    } catch(error) { status(error.message); }
  }
  async function openModule(name) {
    const first=modules[name]?.sections?.[0]?.[0];
    if(first)await openDatasetTab(first);
  }
  function openPaintTab(name) {
    if(dirty&&!confirm('Leave unsaved changes in this content tab?'))return;
    dirty=false;
    $('[data-admin-overview]').hidden=true;
    $('[data-content-editor]').hidden=true;
    const internal=document.querySelector(`[data-tab="${name}"]`);
    if(internal)internal.click();
    setActiveAdminTab('paint',name);
    document.querySelector(`[data-panel="${name}"]`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  document.querySelectorAll('[data-content-module]').forEach((button)=>button.addEventListener('click',()=>openModule(button.dataset.contentModule)));
  document.querySelectorAll('[data-admin-dataset]').forEach((button)=>button.addEventListener('click',()=>openDatasetTab(button.dataset.adminDataset)));
  document.querySelectorAll('[data-admin-paint-tab]').forEach((button)=>button.addEventListener('click',()=>openPaintTab(button.dataset.adminPaintTab)));
  document.querySelector('[data-admin-tab="overview"]')?.addEventListener('click',showOverview);
  $('[data-content-dataset]').addEventListener('change',(event)=>{ if(dirty&&!confirm('Leave unsaved section changes?')) {event.target.value=key;return;} openDatasetTab(event.target.value); });
  $('[data-shift-league]').addEventListener('change',()=>{populateShiftStarts();$('[data-shift-preview-panel]').hidden=true;shiftState.days=0;shiftState.indexes=[];});
  $('[data-shift-start]').addEventListener('change',()=>{$('[data-shift-preview-panel]').hidden=true;shiftState.days=0;shiftState.indexes=[];});
  document.querySelectorAll('[data-shift-preview]').forEach((button)=>button.addEventListener('click',()=>previewScheduleShift(Number(button.dataset.shiftPreview))));
  $('[data-shift-cancel]').addEventListener('click',()=>{$('[data-shift-preview-panel]').hidden=true;shiftState.days=0;shiftState.indexes=[];status('Bulk schedule preview cancelled. No dates were changed.');});
  $('[data-shift-apply]').addEventListener('click',applyScheduleShift);
  $('[data-shift-undo]').addEventListener('click',undoScheduleShift);
  $('[data-results-load-race]').addEventListener('click',loadSelectedResultRace);
  $('[data-content-search]').addEventListener('input',renderList);
  $('[data-content-list]').addEventListener('click',(event)=>{const button=event.target.closest('[data-entry]');if(button){commit();index=Number(button.dataset.entry);render();if(key==='results')refreshResultsRaceOptions(current()?.scheduleId||'');}});
  $('[data-content-form]').addEventListener('input',()=>{dirty=true;});
  $('[data-content-fields]').addEventListener('change',(event)=>{
    const resultDriver=event.target.closest?.('[data-result-driver-choice]');
    if(resultDriver&&key==='results'){
      const path=JSON.parse(resultDriver.dataset.fieldPath),entry=valueAt(current(),path.slice(0,-1)),assignment=resultRoster(current()?.league||'').find((driver)=>driver.displayName===resultDriver.value);
      entry.driver=resultDriver.value;entry.number=String(assignment?.number||'');dirty=true;render();status(`${entry.driver} selected from the ${current().leagueName} roster. Car number #${entry.number} was filled automatically.`);return;
    }
    const featuredDriver=event.target.closest?.('[data-result-featured-driver]');
    if(featuredDriver&&key==='results'&&featuredDriver.checked){
      const path=JSON.parse(featuredDriver.dataset.fieldPath),chosen=Number(path[1]);commit();current().entries.forEach((entry,i)=>{entry.featuredDriver=i===chosen;});dirty=true;render();status(`${current().entries[chosen]?.driver||'Driver'} will lead the public result card.`);return;
    }
    const league=event.target.closest?.('[data-competition-choice]');
    if(!league)return;
    const name=competitionChoices().find(([id])=>id===league.value)?.[1]||league.value;
    const field=$('[data-content-fields] [data-competition-name]');
    if(field instanceof HTMLInputElement)field.value=name;
    dirty=true;
  });
  $('[data-content-fields]').addEventListener('click',(event)=>{
    const highlight=event.target.closest('[data-standing-highlight]');
    if(highlight){
      commit();
      const path=JSON.parse(highlight.dataset.standingPath),row=valueAt(current(),path);
      row.highlight=!row.highlight;dirty=true;render();status(`${row.driver||'Driver'} ${row.highlight?'will be highlighted':'highlight removed'} in this standings draft.`);
      return;
    }
    const move=event.target.closest('[data-standing-move]');
    if(move){
      commit();
      const path=JSON.parse(move.dataset.standingPath),arr=valueAt(current(),path.slice(0,-1)),from=Number(path.at(-1)),to=from+Number(move.dataset.standingMove);
      if(to>=0&&to<arr.length){const [item]=arr.splice(from,1);arr.splice(to,0,item);dirty=true;render();status('Standings display order changed. Position labels were preserved.');}
      return;
    }
    const button=event.target.closest('[data-array-add],[data-array-remove]');if(!button)return;
    commit();
    if(button.dataset.arrayAdd){const path=JSON.parse(button.dataset.arrayAdd),arr=valueAt(current(),path);const template=arr[0]||arrayTemplate(path.at(-1))||{};const added=blank(template);if(key==='results'&&path.at(-1)==='entries'){const used=new Set(arr.map((entry)=>entry.driver)),next=resultRoster(current()?.league||'').find((driver)=>!used.has(driver.displayName));if(next){added.driver=next.displayName;added.number=String(next.number||'');}added.featuredDriver=arr.length===0;}arr.push(added);}
    else {const path=JSON.parse(button.dataset.arrayRemove);valueAt(current(),path.slice(0,-1)).splice(Number(path.at(-1)),1);}
    dirty=true;render();
  });
  let standingDragPath=null;
  $('[data-content-fields]').addEventListener('dragstart',(event)=>{
    const row=event.target.closest?.('[data-standing-drag]');if(!row)return;
    commit();standingDragPath=JSON.parse(row.dataset.standingDrag);row.classList.add('is-dragging');
    if(event.dataTransfer){event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',row.dataset.standingDrag);}
  });
  $('[data-content-fields]').addEventListener('dragover',(event)=>{
    const row=event.target.closest?.('[data-standing-drag]');if(!row||!standingDragPath)return;
    event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';
    document.querySelectorAll('[data-standing-drag].is-drag-target').forEach((item)=>item.classList.remove('is-drag-target'));
    row.classList.add('is-drag-target');
  });
  $('[data-content-fields]').addEventListener('drop',(event)=>{
    const target=event.target.closest?.('[data-standing-drag]');if(!target||!standingDragPath)return;
    event.preventDefault();
    const targetPath=JSON.parse(target.dataset.standingDrag);
    if(JSON.stringify(targetPath.slice(0,-1))!==JSON.stringify(standingDragPath.slice(0,-1)))return;
    const arr=valueAt(current(),standingDragPath.slice(0,-1)),from=Number(standingDragPath.at(-1)),to=Number(targetPath.at(-1));
    if(from!==to){const [item]=arr.splice(from,1);arr.splice(to,0,item);dirty=true;}
    standingDragPath=null;render();status('Standings row moved. Official Position labels were preserved and remain editable.');
  });
  $('[data-content-fields]').addEventListener('dragend',()=>{
    standingDragPath=null;document.querySelectorAll('[data-standing-drag]').forEach((item)=>item.classList.remove('is-dragging','is-drag-target'));
  });
  $('[data-content-add]').addEventListener('click',()=>{if(!Array.isArray(data))return;if(key==='results'){refreshResultsRaceOptions();$('[data-results-race-tool]').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});return status('Filter by league, choose the completed scheduled race, then select Load race results.');}commit();data.push(blank(seeds[key][0]));index=data.length-1;dirty=true;render();if(key==='schedule-events')status('New race added. Enter its league, date, and start time; Save Draft or Publish will automatically place it in chronological order.');});
  $('[data-content-remove]').addEventListener('click',()=>{if(!Array.isArray(data)||!confirm('Remove this entry from the section draft? It stays public until you publish.'))return;commit();data.splice(index,1);index=Math.max(0,index-1);dirty=true;render();});
  async function action(name) {
    if(!loaded||!key)throw new Error('Open an editor first.');
    if(busy)throw new Error('A save is already in progress.');
    const autoPlaced=['saveDraft','publish'].includes(name)&&autoPlaceScheduleEvents();
    if(autoPlaced){render();refreshScheduleShiftTool();}
    busy=true;
    $('[data-content-editor]').inert=true;
    try {
      const response=await api(name,{dataset:key,...(['saveDraft','publish'].includes(name)?{data}: {})});
      registry=response.registry;dirty=false;
      if(name==='publish') {
        const publication=response.publication;
        status(publication?.queued
          ? `${autoPlaced?'Calendar sorted by date, start time, and league. ':''}Published revision ${publication.revision}. Public data is updated and the site rebuild is queued.`
          : `${autoPlaced?'Calendar sorted by date, start time, and league. ':''}Published revision ${publication?.revision||registry.revision}. Public data is updated, but the site rebuild was not queued: ${publication?.message||'use Publish site / retry build.'}`);
      } else status(response.publication?.message||(name==='saveDraft'?(autoPlaced?'Calendar sorted by date, start time, and league. Private draft saved; nothing public changed.':'Private draft saved. Nothing public changed.'):'Section updated.'));
      updateControlCenterStatus(response.publication);
    } finally { busy=false; $('[data-content-editor]').inert=false; }
  }
  $('[data-content-form]').addEventListener('submit',async(event)=>{event.preventDefault();commit();try{await action('saveDraft');}catch(error){status(error.message);}});
  $('[data-content-publish]').addEventListener('click',async()=>{
    commit();
    if(!confirm(`${dirty?'Save and publish the current changes':'Publish this section'} and rebuild the public site?`))return;
    try{await action('publish');}catch(error){status(error.message);}
  });
  $('[data-content-discard]').addEventListener('click',async()=>{if(!confirm('Discard this saved section draft and return to published content?'))return;try{await action('discardDraft');chooseDataset(key);status('Draft discarded. Published content is unchanged.');}catch(error){status(error.message);}});
  $('[data-content-refresh]').addEventListener('click',async()=>{if(dirty&&!confirm('Replace unsaved changes with saved data?'))return;try{await load();chooseDataset(key);}catch(error){status(error.message);}});
  $('[data-content-rebuild]').addEventListener('click',async()=>{try{const result=await api('rebuild');status(result.publication.message);updateControlCenterStatus(result.publication);}catch(error){status(error.message);}});
  $('[data-content-publish-all]')?.addEventListener('click',async()=>{
    try {
      if(!loaded)await load();
      const count=Object.keys(registry.drafts||{}).length;
      if(!count)return $('[data-admin-publish-status]').textContent='There are no saved drafts to publish.';
      if(!confirm(`Publish all ${count} saved section draft${count===1?'':'s'} in one revision and queue one site rebuild?`))return;
      const result=await api('publishAll');registry=result.registry;updateControlCenterStatus(result.publication);
      $('[data-admin-publish-status]').textContent=result.publication?.queued
        ? `Published revision ${result.publication.revision}. All saved drafts are now public and one rebuild is queued.`
        : `Published revision ${result.publication?.revision||registry.revision}. Data is public, but the rebuild was not queued: ${result.publication?.message||'retry the site build.'}`;
    } catch(error) { $('[data-admin-publish-status]').textContent=error.message; }
  });
  $('[data-content-export]').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(registry,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aetherwing-site-content-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  window.addEventListener('beforeunload',(event)=>{if(dirty){event.preventDefault();event.returnValue='';}});
  window.netlifyIdentity?.on('logout',()=>{loaded=false;data=null;key='';dirty=false;seeds={};registry={revision:0,published:{},drafts:{},history:[]};$('[data-content-editor]').hidden=true;$('[data-content-fields]').replaceChildren();});
})();

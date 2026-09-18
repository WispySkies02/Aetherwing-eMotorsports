(() => {
  'use strict';
  const local = ['localhost','127.0.0.1'].includes(location.hostname);
  const endpoint = '/.netlify/functions/site-admin';
  const modules = {
    schedule: { title:'Schedule Manager', sections:[['schedule-events','Race calendar']] },
    results: { title:'Results & Milestones', sections:[['results','Latest result'],['wins','Win archive'],['standings','Standings snapshots'],['milestones','Milestones']] },
    roster: { title:'Roster Manager', sections:[['drivers','Driver league assignments'],['roster-profiles','Driver directory & bios'],['driver-profiles','Driver profiles'],['charters','Charter boards'],['iracing-garage','iRacing roster'],['competitions','League details']] },
    organization: { title:'Organization', sections:[['leadership','Leadership'],['partners','Partners']] },
    news: { title:'Team Wire', sections:[['news','Stories & featured homepage headline']] }
  };
  const datasetMeta = {
    'schedule-events':{number:'01',kicker:'RACE OPERATION',title:'Calendar',description:'Edit every race, off-week, special event, event window, status badge, track, date, and start time. The bulk ±7-day tool is available below.',guide:'Each row is one calendar operation. Date + league + event title determine its share route, so review those three before publishing.'},
    results:{number:'02',kicker:'RACE OPERATION',title:'Latest Result',description:'Control the latest-result feature and its supporting historical result snapshot. Every number and line of result copy is editable.',guide:'Use this for the current result card/feature. Historical snapshots inside this record can be retained even after the current result changes.'},
    wins:{number:'03',kicker:'RACE OPERATION',title:'Win Archive',description:'Add, correct, or remove individual wins used by Wins & History.',guide:'One row equals one recorded win. Keep historical driver names when that is how the result was originally recorded.'},
    standings:{number:'04',kicker:'RACE OPERATION',title:'Standings',description:'Edit each published championship snapshot, including rows, points, gaps, position changes, and Chase status.',guide:'Standings are snapshots, not live timing. Publish only official numbers you want shown publicly.'},
    milestones:{number:'05',kicker:'RACE OPERATION',title:'Milestones',description:'Manage the timeline of major Aetherwing and driver milestones.',guide:'Use this for meaningful historical markers, not routine race results.'},
    drivers:{number:'06',kicker:'PEOPLE + PROGRAMS',title:'Driver League Assignments',description:'One row per driver per league: number, public display name, status, affiliation, car/body, and identity note.',guide:'This is the source of truth for current league assignments. Changing an assignment also drives the public roster number/program badges.'},
    'roster-profiles':{number:'07',kicker:'PEOPLE + PROGRAMS',title:'Driver Directory',description:'Edit each person’s current public identity, handle, role, affiliation, feature label, biography, and identity history.',guide:'Numbers and program badges are generated from Driver League Assignments, so those summaries are read-only here.'},
    'driver-profiles':{number:'08',kicker:'PEOPLE + PROGRAMS',title:'Driver Profiles',description:'Edit long-form profile presentation, platform-specific names, historical names, and every career-stat tile.',guide:'This controls detailed profile copy. Current Roblox/RoRacing and iRacing identities can stay distinct without creating duplicate people.'},
    charters:{number:'09',kicker:'PEOPLE + PROGRAMS',title:'Charter Boards',description:'Edit full-time charter entries and the shared Part-Time / Development Open Charter structures.',guide:'A shared #62/#82 module represents one actual charter. Keep the two uses nested inside the same Open Charter record.'},
    'iracing-garage':{number:'10',kicker:'PEOPLE + PROGRAMS',title:'iRacing Roster',description:'Edit Factory Program totals and every driver/team entry shown in the iRacing garage.',guide:'Hailey’s current iRacing presentation is Hailey Bell only. Roblox usernames do not belong on current iRacing entries.'},
    competitions:{number:'11',kicker:'PEOPLE + PROGRAMS',title:'League Details',description:'Edit the public name, relationship type, schedule cadence, platform, machine, and roster summary for every active competition relationship.',guide:'This edits Aetherwing’s relationship to a league/program; it does not alter technical schedule colors or route IDs.'},
    leadership:{number:'12',kicker:'ORGANIZATION',title:'Leadership',description:'Edit current leadership names and every public role attached to each person.',guide:'Use one role per line. This feeds current leadership presentation across the handbook, mission, and contact areas.'},
    partners:{number:'13',kicker:'ORGANIZATION',title:'Partners',description:'Edit partner names, roles, descriptions, links, logo URLs, tags, and featured state.',guide:'This controls current partner presentation. Use full HTTPS URLs for both the partner website and logo.'},
    news:{number:'14',kicker:'TEAM WIRE',title:'Team Wire',description:'Edit complete stories: metadata, headline treatment, metrics, quotes, sections, paragraphs, tags, callouts, and homepage-feature status.',guide:'Exactly one story must be featured. Story slugs are public URLs; changing a slug can affect existing links unless a redirect is added in code.'}
  };
  const rosterGuides = Object.fromEntries(Object.entries(datasetMeta).map(([id,meta])=>[id,[meta.title,meta.guide]]));
  const competitionChoices = [
    ['nrrs','NRRS'],['uarl-d1','UARL Division 1'],['uarl-open','UARL Open'],
    ['kmart','Kmart Auto Parts Series'],['sunoco','Sunoco Truck Series'],['iracing-factory','iRacing Factory Program']
  ];
  const statusChoices = ['Full-Time','Part-Time','Development','Active','Shared Part-Time Entry','Factory Driver','Team Entry','OPEN'];
  const fieldLabels = {
    'schedule-events':{league:'Series / program',leagueName:'Public series name',status:'Race / season status',title:'Event name',track:'Track / venue',date:'Start date',endDate:'End date',displayDate:'Displayed date/window',time:'Start time',round:'Round label',specialTag:'Special badge',offWeek:'Off-week / no race',tbd:'Date/time TBD'},
    results:{latestKnownMartinsville:'Historical Martinsville snapshot',latestResult:'Current latest result',headline:'Headline line 1',headlineAccent:'Headline accent line',stagePoints:'Total stage points'},
    wins:{league:'League / series',track:'Track / event',driver:'Recorded driver name',date:'Result date'},
    standings:{id:'Snapshot ID',title:'Public title',subtitle:'Snapshot context',league:'League key',status:'Status badge',rows:'Standings rows',position:'Position',number:'Car number',driver:'Driver',points:'Points',delta:'Gap / delta',positionChange:'Position change',chaseEligible:'Chase eligible',chaseStatus:'Chase label'},
    milestones:{date:'Display date',title:'Milestone title',description:'Milestone description'},
    drivers:{id:'Assignment ID',profile:'Driver profile',displayName:'Display name in this league',number:'Car number',competition:'League name',competitionId:'League',status:'Entry status',affiliation:'Competing organization',car:'Car / body',identityNote:'Identity note'},
    'roster-profiles':{slug:'Profile ID',name:'Current display name',handle:'Current handle / username',role:'Team role',affiliation:'Primary affiliation',numbers:'Active numbers summary',programs:'Program badges',feature:'Profile tag',bio:'Biography',iracingName:'Current iRacing name',historicalIRacingName:'Historical iRacing name',robloxDisplayName:'Current Roblox display name',robloxUsername:'Roblox username',historicalRobloxDisplayName:'Historical Roblox display name'},
    'driver-profiles':{slug:'Profile ID',displayName:'Current RoRacing display name',iracingName:'Current iRacing name',subtitle:'Profile subtitle',intro:'Profile introduction',stats:'Career stat tiles',historicalIRacingName:'Historical iRacing name',robloxDisplayName:'Current Roblox display name',robloxUsername:'Roblox username',historicalRobloxDisplayName:'Historical Roblox display name'},
    charters:{id:'Charter board ID',label:'Public series label',seriesNote:'Board note',fullTime:'Full-time charters',openCharter:'Shared Open Charter',number:'Car number',driver:'Assigned driver',slotLabel:'Slot label',partTime:'Part-Time use',development:'Development use',description:'Public explanation'},
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
    openCharter:'The Part-Time and Development identities inside this object are two uses of one shared charter, not two simultaneous slots.'
  };
  const fieldLabel = (name) => fieldLabels[key]?.[name] || label(name);
  const helpFor = (name) => fieldHelp[name] || '';

  let registry = { revision:0, published:{}, drafts:{}, history:[] }, seeds = {}, key='', data=null, index=0, dirty=false, loaded=false, busy=false;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = (s) => s.replace(/([A-Z])/g,' $1').replace(/[-_]/g,' ').replace(/^./,(c)=>c.toUpperCase());
  const status = (message) => { $('[data-content-status]').textContent=message; };
  const account = () => window.netlifyIdentity?.currentUser();
  const authorized = () => local || (account()?.app_metadata?.roles || account()?.app_metadata?.authorization?.roles || []).includes('admin');
  const base = (name) => registry.drafts[name] ?? registry.published[name] ?? seeds[name];
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
      if (action==='publish') { registry.published[payload.dataset]=registry.drafts[payload.dataset]; delete registry.drafts[payload.dataset]; }
      registry.revision++;
      localStorage.setItem('aetherwing-site-admin',JSON.stringify(registry));
      return { registry, publication:action==='publish'||action==='rebuild'?{queued:false,message:'Local test only; no public deployment was changed.'}:null };
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
    } else { const result=await api(); registry=result.registry; seeds=result.seeds; status(result.publishConfigured?'Ready. Save a draft before publishing.':'Draft editing is ready. Configure the main-site build hook before publishing.'); }
    loaded=true;
  }
  function blank(value) {
    if (Array.isArray(value)) return value.length ? [blank(value[0])] : [];
    if (value && typeof value==='object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,blank(v)]));
    return typeof value==='boolean'?false:typeof value==='number'?0:'';
  }
  function valueAt(root, path) { return path.reduce((v,k)=>v?.[k],root); }
  function assign(root,path,value) { let obj=root; for(const k of path.slice(0,-1)) obj=obj[k]; obj[path.at(-1)]=value; }
  const current = () => Array.isArray(data)?data[index]:data;
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
      if (key==='roster-profiles' && (k==='programs' || k==='numbers')) {
        const shown=Array.isArray(v)?v.join(' · '):String(v||'');
        return shell(pretty,`<input type="text" readonly value="${esc(shown)}">`,'Automatically generated from Driver League Assignments when the site builds.','is-readonly');
      }
      if (Array.isArray(v) && (v.some((x)=>x && typeof x==='object') || arrayTemplate(k))) {
        return `<fieldset class="admin-fieldset"><legend><span>${esc(pretty)}</span><small>${esc(help||'Edit every nested item in this group.')}</small></legend><div class="admin-array">${v.map((item,i)=>`<details open><summary><span>${esc(pretty)} ${i+1}</span><small>${esc(title(item,i))}</small></summary><div class="admin-nested-fields">${fields(item,[...p,i])}</div><button class="admin-array-remove" type="button" data-array-remove="${esc(JSON.stringify([...p,i]))}">Remove ${esc(pretty)} ${i+1}</button></details>`).join('')}</div><button class="admin-array-add" type="button" data-array-add="${esc(JSON.stringify(p))}">+ Add ${esc(pretty)} item</button></fieldset>`;
      }
      if (v && typeof v==='object') return `<fieldset class="admin-fieldset"><legend><span>${esc(pretty)}</span><small>${esc(help||'All fields in this structured block are editable.')}</small></legend><div class="admin-nested-fields">${fields(v,p)}</div></fieldset>`;
      if (typeof v==='boolean') return `<label class="content-check admin-toggle"><input type="checkbox" ${attr} data-field-type="boolean" ${v?'checked':''}><span><b>${esc(pretty)}</b>${help?`<small>${esc(help)}</small>`:''}</span></label>`;
      if (k==='league' && key==='schedule-events') return shell(pretty,`<select ${attr} data-field-type="string">${[['nrrs','NRRS'],['uarl-d1','UARL D1'],['uarl-d2','UARL D2 — historical/closed'],['open','UARL Open'],['kmart','Kmart'],['sunoco','Sunoco'],['iracing','iRacing']].map(([id,name])=>`<option value="${id}" ${id===v?'selected':''}>${name}</option>`).join('')}</select>`,help);
      if (key==='drivers' && k==='profile') {
        const profiles=(base('roster-profiles')||seeds['roster-profiles']||[]).map((profile)=>[profile.slug,profile.name]);
        return shell(pretty,`<select ${attr} data-field-type="string">${profiles.map(([id,name])=>`<option value="${esc(id)}" ${id===v?'selected':''}>${esc(name)} · ${esc(id)}</option>`).join('')}</select>`,help);
      }
      if (key==='drivers' && k==='competitionId') return shell(pretty,`<select ${attr} data-field-type="string" data-competition-choice>${competitionChoices.map(([id,name])=>`<option value="${id}" ${id===v?'selected':''}>${name}</option>`).join('')}</select>`,help);
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
    if(!confirm(`Move ${shiftState.indexes.length} ${shiftLeagueNames[first.league]||first.leagueName||first.league} event${shiftState.indexes.length===1?'':'s'} 7 days ${direction}, starting with ${first.title||first.track}?\n\nThis changes only the unsaved Schedule Manager draft. You must still Save section draft and Publish saved draft.`))return;
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
    status(`${shiftedCount} event${shiftedCount===1?'':'s'} moved 7 days ${direction} in the unsaved draft. Save the section draft, review it, then publish when ready.`);
  }
  function undoScheduleShift(){
    if(!shiftState.snapshot)return status('There is no bulk shift to undo in this session.');
    data=structuredClone(shiftState.snapshot);shiftState.snapshot=null;dirty=true;render();refreshScheduleShiftTool();$('[data-shift-undo]').hidden=true;status('Last bulk week shift undone. The Schedule Manager still has unsaved changes.');
  }
  function renderList() {
    const search=$('[data-content-search]').value.toLowerCase();
    $('[data-content-list]').innerHTML=Array.isArray(data)?data.map((r,i)=>({r,i})).filter(({r})=>JSON.stringify(r).toLowerCase().includes(search)).map(({r,i})=>`<button type="button" data-entry="${i}" aria-pressed="${i===index}"><strong>${esc(title(r,i))}</strong><small>${esc([r.leagueName||r.competition||r.category||'',r.date||r.numbers||r.slug||''].filter(Boolean).join(' · '))}</small></button>`).join(''):'<p>This section is one complete record. Edit its fields on the right.</p>';
    $('[data-content-add]').hidden=!Array.isArray(data);
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
    key=name; data=structuredClone(base(key)); index=0; dirty=false;
    if (key==='schedule-events') data=data.map((r)=>({offWeek:false,tbd:false,specialTag:'',round:'',...r}));
    const meta=datasetMeta[key]||{number:'EDIT',kicker:'CONTENT WORKSPACE',title:label(key),description:'Edit this content section.'};
    $('[data-content-number]').textContent=meta.number;
    $('[data-content-kicker]').textContent=meta.kicker;
    $('[data-content-title]').textContent=meta.title;
    $('[data-content-description]').textContent=meta.description;
    const select=$('[data-content-dataset]');
    if(select)select.value=key;
    render();refreshScheduleShiftTool();
    status(`${registry.drafts[key]?'PRIVATE SAVED DRAFT':registry.published[key]?'PUBLISHED OVERRIDE':'BUNDLED BASELINE'} · Revision ${registry.revision}. Save Draft never changes the public site; Publish applies this tab and queues the site rebuild.`);
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
  $('[data-content-search]').addEventListener('input',renderList);
  $('[data-content-list]').addEventListener('click',(event)=>{const button=event.target.closest('[data-entry]');if(button){commit();index=Number(button.dataset.entry);render();}});
  $('[data-content-form]').addEventListener('input',()=>{dirty=true;});
  $('[data-content-fields]').addEventListener('change',(event)=>{
    const league=event.target.closest?.('[data-competition-choice]');
    if(!league)return;
    const name=competitionChoices.find(([id])=>id===league.value)?.[1]||league.value;
    const field=$('[data-content-fields] [data-competition-name]');
    if(field instanceof HTMLInputElement)field.value=name;
    dirty=true;
  });
  $('[data-content-fields]').addEventListener('click',(event)=>{
    const button=event.target.closest('[data-array-add],[data-array-remove]');if(!button)return;
    commit();
    if(button.dataset.arrayAdd){const path=JSON.parse(button.dataset.arrayAdd),arr=valueAt(current(),path);const template=arr[0]||arrayTemplate(path.at(-1))||{};arr.push(blank(template));}
    else {const path=JSON.parse(button.dataset.arrayRemove);valueAt(current(),path.slice(0,-1)).splice(Number(path.at(-1)),1);}
    dirty=true;render();
  });
  $('[data-content-add]').addEventListener('click',()=>{if(!Array.isArray(data))return;commit();data.push(blank(seeds[key][0]));index=data.length-1;dirty=true;render();});
  $('[data-content-remove]').addEventListener('click',()=>{if(!Array.isArray(data)||!confirm('Remove this entry from the section draft? It stays public until you publish.'))return;commit();data.splice(index,1);index=Math.max(0,index-1);dirty=true;render();});
  async function action(name) {
    if(!loaded||!key)throw new Error('Open an editor first.');
    if(busy)throw new Error('A save is already in progress.');
    busy=true;
    $('[data-content-editor]').inert=true;
    try {
      const response=await api(name,{dataset:key,...(name==='saveDraft'?{data}: {})});
      registry=response.registry;dirty=false;
      status(response.publication?.message||(name==='saveDraft'?'Section draft saved. Nothing public changed.':'Section updated.'));
    } finally { busy=false; $('[data-content-editor]').inert=false; }
  }
  $('[data-content-form]').addEventListener('submit',async(event)=>{event.preventDefault();commit();try{await action('saveDraft');}catch(error){status(error.message);}});
  $('[data-content-publish]').addEventListener('click',async()=>{
    if(dirty)return status('Save your current section draft before publishing.');
    if(!registry.drafts[key])return status('Save a section draft first.');
    if(!confirm('Publish the saved section draft and rebuild the public site?'))return;
    try{await action('publish');}catch(error){status(error.message);}
  });
  $('[data-content-discard]').addEventListener('click',async()=>{if(!confirm('Discard this saved section draft and return to published content?'))return;try{await action('discardDraft');chooseDataset(key);status('Draft discarded. Published content is unchanged.');}catch(error){status(error.message);}});
  $('[data-content-refresh]').addEventListener('click',async()=>{if(dirty&&!confirm('Replace unsaved changes with saved data?'))return;try{await load();chooseDataset(key);}catch(error){status(error.message);}});
  $('[data-content-rebuild]').addEventListener('click',async()=>{try{const result=await api('rebuild');status(result.publication.message);}catch(error){status(error.message);}});
  $('[data-content-export]').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(registry,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aetherwing-site-content-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
  window.addEventListener('beforeunload',(event)=>{if(dirty){event.preventDefault();event.returnValue='';}});
  window.netlifyIdentity?.on('logout',()=>{loaded=false;data=null;key='';dirty=false;seeds={};registry={revision:0,published:{},drafts:{},history:[]};$('[data-content-editor]').hidden=true;$('[data-content-fields]').replaceChildren();});
})();

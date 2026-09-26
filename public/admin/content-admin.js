(() => {
  'use strict';
  const local = ['localhost','127.0.0.1'].includes(location.hostname);
  const endpoint = '/.netlify/functions/site-admin';
  const modules = {
    schedule: { title:'Schedule Manager', sections:[['schedule-events','Race calendar']] },
    results: { title:'Results & Milestones', sections:[['results','Race results'],['wins','Win archive'],['standings','Standings snapshots'],['milestones','Milestones']] },
    roster: { title:'Roster Manager', sections:[['drivers','Driver league assignments'],['roster-profiles','Driver directory & bios'],['driver-profiles','Driver profiles'],['charters','Charter boards'],['iracing-garage','iRacing roster'],['competitions','League details']] },
    organization: { title:'Organization', sections:[['leadership','Leadership'],['partners','Team partners'],['site','Site settings'],['navigation','Navigation'],['page-overrides','Page Content'],['driver-portfolios','Driver portfolios']] },
    news: { title:'Team Wire', sections:[['news','Stories & featured homepage headline']] }
  };
  const datasetMeta = {
    'schedule-events':{number:'01',kicker:'RACE OPERATION',title:'Calendar',description:'Add or edit every race, off-week, special event, event window, status badge, track, date, start time, and race-specific entry list. New races automatically move into chronological order when saved or published.',guide:'Choose Add Race, then complete its league, date, and start time. Entry List Mode can stay Auto (published results after the race, otherwise the league roster) or switch to Custom so you can select exactly who is expected to race. The Calendar places events by date, parsed 12-hour time, and league.'},
    results:{number:'02',kicker:'RACE OPERATION',title:'Race Results',description:'Choose a scheduled race, enter the finish and stage scoring, and let the newest completed result become Latest Result automatically.',guide:'Roster drivers can be selected directly; league opponents can be entered as external participants. Publishing a new result can advance any standings board with Auto Points enabled.'},
    wins:{number:'03',kicker:'RACE OPERATION',title:'Win Archive',description:'Add, correct, or remove individual wins used by Wins & History.',guide:'One row equals one recorded win. Keep historical driver names when that is how the result was originally recorded.'},
    standings:{number:'04',kicker:'RACE OPERATION',title:'Standings',description:'Import a league standings table, apply published race points, or make manual corrections when needed.',guide:'Paste standings from Discord/Sheets/Excel or upload CSV and preview the matches before applying. Boards marked Auto Points advance from newly published race results; the manual row editor remains available for corrections.'},
    milestones:{number:'05',kicker:'RACE OPERATION',title:'Milestones',description:'Manage the timeline of major Aetherwing and driver milestones.',guide:'Use this for meaningful historical markers, not routine race results.'},
    drivers:{number:'06',kicker:'PEOPLE + PROGRAMS',title:'Driver League Assignments',description:'One row per driver per league: number, public display name, status, affiliation, car/body, and identity note.',guide:'This is the source of truth for current league assignments. Changing an assignment also drives the public roster number/program badges.'},
    'roster-profiles':{number:'07',kicker:'PEOPLE + PROGRAMS',title:'Driver Directory',description:'Edit each person’s current public identity, handle, role, affiliation, feature label, biography, and identity history.',guide:'Numbers and program badges are generated from Driver League Assignments, so those summaries are read-only here.'},
    'driver-profiles':{number:'08',kicker:'PEOPLE + PROGRAMS',title:'Driver Profiles',description:'Edit long-form profile presentation, platform-specific names, historical names, and every career-stat tile.',guide:'This controls detailed profile copy. Current Roblox/RoRacing and iRacing identities can stay distinct without creating duplicate people.'},
    charters:{number:'09',kicker:'PEOPLE + PROGRAMS',title:'Charter Boards',description:'Build each league’s charter structure: full-time seats plus any number of configurable Open Charters and number identities.',guide:'One Open Charter record equals one actual charter slot. Inside it, add one or more possible number/usage identities. You can remove #82, run only #62, add a third use, add another Open Charter, or create a Charter Board for another league later.'},
    'iracing-garage':{number:'10',kicker:'PEOPLE + PROGRAMS',title:'iRacing Roster',description:'Edit Factory Program totals and every driver/team entry shown in the iRacing garage.',guide:'Hailey’s current iRacing presentation is Hailey Bell only. Roblox usernames do not belong on current iRacing entries.'},
    competitions:{number:'11',kicker:'PEOPLE + PROGRAMS',title:'League Details',description:'Edit the public name, relationship type, schedule cadence, platform, machine, and roster summary for every active competition relationship.',guide:'This edits Aetherwing’s relationship to a league/program; it does not alter technical schedule colors or route IDs.'},
    leadership:{number:'12',kicker:'ORGANIZATION',title:'Leadership',description:'Edit current leadership names and every public role attached to each person.',guide:'Use one role per line. This feeds current leadership presentation across the handbook, mission, and contact areas.'},
    partners:{number:'13',kicker:'ORGANIZATION',title:'Partners',description:'Edit partner names, roles, descriptions, links, logo URLs, tags, and featured state.',guide:'This controls current partner presentation. Use full HTTPS URLs for both the partner website and logo.'},
    site:{number:'14',kicker:'SITE CONTROL',title:'Site Settings',description:'Edit global organization details, public URLs, identity copy, footer text, totals, and shared sitewide presentation.',guide:'These values are reused across the site. Technical security, deployment, and design-system settings remain protected.'},
    navigation:{number:'15',kicker:'SITE CONTROL',title:'Navigation',description:'Add, rename, regroup, reorder, or remove public navigation links.',guide:'Use Home, Team, Race, or Connect as the group. External destinations must use full HTTPS URLs.'},
    'page-overrides':{number:'16',kicker:'SITE CONTROL',title:'Page Content',description:'Scan any public page, then edit its visible text, destinations, and image sources without changing code.',guide:'Choose a page and scan it. Existing structured records should still be managed in their dedicated tabs; this workspace controls presentation copy, links, and standalone images.'},
    'driver-portfolios':{number:'17',kicker:'PEOPLE + PARTNERS',title:'Driver Portfolios',description:'Create and edit every driver’s individual partner, sponsor, and livery-brand portfolio shown on the Partners page.',guide:'Add a portfolio for any driver, then add, remove, rename, reorder, or attach optional logos to that driver’s brands. Link a Driver Directory profile when one exists, or leave it as a custom / external driver.'},
    news:{number:'18',kicker:'TEAM WIRE',title:'Team Wire',description:'Edit complete stories: metadata, headline treatment, metrics, quotes, sections, paragraphs, tags, callouts, and homepage-feature status.',guide:'Exactly one story must be featured. Story slugs are public URLs; changing a slug can affect existing links unless a redirect is added in code.'}
  };
  const rosterGuides = Object.fromEntries(Object.entries(datasetMeta).map(([id,meta])=>[id,[meta.title,meta.guide]]));
  const legacyCompetitionChoices = [
    ['nrrs','NRRS'],['uarl-d1','UARL Division 1'],['uarl-open','UARL Open'],
    ['kmart','Kmart Auto Parts Series'],['sunoco','Sunoco Truck Series'],['iracing-factory','iRacing Factory Program']
  ];
  const statusChoices = ['Full-Time','Part-Time','Development','Active','Shared Part-Time Entry','Factory Driver','Team Entry','OPEN'];
  const fieldLabels = {
    'schedule-events':{league:'Series / program',leagueName:'Public series name',status:'Race / season status',title:'Event name',track:'Track / venue',date:'Start date',endDate:'End date',displayDate:'Displayed date/window',time:'Start time',round:'Round label',specialTag:'Special badge',offWeek:'Off-week / no race',tbd:'Date/time TBD',entryListMode:'Event entry list mode',entries:'Event entry list',assignmentId:'Roster driver',driver:'Driver name',number:'Car number',entryStatus:'Entry note / status'},
    results:{scheduleId:'Linked schedule race',league:'League ID',leagueName:'League / series',title:'Race name',track:'Track',date:'Race date',round:'Round',status:'Race status',specialTag:'Special badge',featured:'Automatic Latest Result',headline:'Headline line 1',headlineAccent:'Headline accent line',summary:'Race summary',entries:'Driver results',assignmentId:'Roster driver',driver:'Driver name',number:'Car number',start:'Starting position',stage1Finish:'Stage 1 finish',stage1Points:'Stage 1 points',stage2Finish:'Stage 2 finish',stage2Points:'Stage 2 points',finish:'Finishing position',finishPoints:'Finish points',bonusPoints:'Bonus / adjustment points',pointsEligible:'Championship points eligible',racePoints:'Total race points',featuredDriver:'Featured driver'},
    wins:{assignmentId:'Linked driver assignment',league:'League / series',track:'Track / event',driver:'Recorded driver name',date:'Result date'},
    standings:{id:'Snapshot ID',title:'Public title',subtitle:'Snapshot context',league:'League key',status:'Status badge',chaseActive:'League is currently in the Chase',autoPoints:'Auto Points from published results',gapMode:'Gap calculation mode',lastResultDate:'Last applied result date',lastResultScheduleId:'Last applied result ID',autoUpdateNote:'Automatic update note',rows:'Standings rows',position:'Official position label',number:'Car number',driver:'Driver',points:'Points',delta:'Gap / delta',positionChange:'Position change',chaseEligible:'Chase eligible',chaseStatus:'Chase label',highlight:'Highlight this driver'},
    milestones:{assignmentId:'Linked driver assignment',date:'Display date',title:'Milestone title',description:'Milestone description'},
    drivers:{id:'Assignment ID',profile:'Driver profile',displayName:'Display name in this league',number:'Car number',numberImage:'Number image URL',competition:'League name',competitionId:'League',status:'Entry status',affiliation:'Competing organization',car:'Car / body',identityNote:'Identity note'},
    'roster-profiles':{slug:'Profile ID',name:'Current display name',handle:'Current handle / username',role:'Team role',affiliation:'Primary affiliation',numbers:'Active numbers summary',programs:'Program badges',feature:'Profile tag',bio:'Biography',iracingName:'Current iRacing name',historicalIRacingName:'Historical iRacing name',robloxDisplayName:'Current Roblox display name',robloxUsername:'Roblox username',historicalRobloxDisplayName:'Historical Roblox display name'},
    'driver-profiles':{slug:'Profile ID',displayName:'Current RoRacing display name',iracingName:'Current iRacing name',subtitle:'Profile subtitle',intro:'Profile introduction',stats:'Career stat tiles',historicalIRacingName:'Historical iRacing name',robloxDisplayName:'Current Roblox display name',robloxUsername:'Roblox username',historicalRobloxDisplayName:'Historical Roblox display name'},
    charters:{id:'League / charter board ID',label:'Public series label',seriesNote:'Board note',fullTime:'Full-time charters',openCharters:'Open Charters',uses:'Number identities / uses',number:'Car number',numberImage:'Number image URL',driver:'Assigned driver',slotLabel:'Slot label',active:'Active / public',description:'Public explanation'},
    'iracing-garage':{factoryDrivers:'Factory driver count',teamEntries:'Team entry count',schemes:'Published scheme count',entries:'Garage entries',driver:'Driver / team name',number:'Car number(s)',placeholder:'Placeholder entry'},
    competitions:{id:'League ID',name:'League / program name',type:'Relationship type',label:'Public relationship label',schedule:'Usual schedule',machine:'Car / machine',platform:'Platform',roster:'Roster summary'},
    leadership:{name:'Current public name',roles:'Leadership roles'},
    partners:{name:'Partner name',role:'Relationship / role',featured:'Featured partner',description:'Public description',url:'Official website URL',logo:'Logo image URL',tags:'Partner tags'},
    site:{name:'Organization name',founded:'Founded year',description:'Organization description',url:'Main site URL',logo:'Main logo URL',discordUrl:'Discord invite URL',tagline:'Public tagline',footerEyebrow:'Footer eyebrow',faithEyebrow:'Faith section eyebrow',faithTitle:'Faith section headline',faithStatement:'Faith statement',faithVerse:'Faith verse reference',faithDriversLine:'Drivers page faith line',faithScheduleLine:'Schedule page faith line',faithHistoryLine:'History page faith line',faithRaceDayLine:'Race weekend faith line',legalNotice:'Footer legal notice',mobileSummary:'Mobile navigation summary',featuredPartners:'Featured partner count',verifiedWins:'Verified win count',estimatedStarts:'Estimated starts',competitionRelationships:'Competition relationship count',activeRoRacingDrivers:'Active RoRacing driver count',aetherwingDrivers:'Aetherwing driver count',allianceOnlyDrivers:'Alliance-only driver count'},
    navigation:{label:'Link label',href:'Destination URL / path',group:'Navigation group'},
    'page-overrides':{id:'Content rule ID',page:'Public page path',type:'Content type',label:'Admin label',original:'Current page value',value:'Published replacement',enabled:'Apply this replacement'},
    'driver-portfolios':{id:'Portfolio ID',profile:'Linked Driver Directory profile',name:'Driver display name',handle:'Driver handle / username',label:'Portfolio label',order:'Driver display order',brands:'Individual partners / brands',logo:'Optional logo URL'},
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
    numberImage:'Upload transparent PNG/WebP artwork or paste a direct image URL. For driver assignments it replaces the fallback number; on Charter Boards it can also brand unsigned/open charter numbers.',
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
    bonusPoints:'For NRRS/UARL auto scoring, enter only extra official bonus/adjustment points not already covered by finish or stages.',
    pointsEligible:'Turn off for an ineligible/substitute entry that should receive zero championship points.',
    sections:'Each nested item is a story section. Paragraphs inside it are one paragraph per line.',
    legacyRoute:'Historical route retained for redirects/reference. Leave blank only when there is no legacy URL.',
    headlineMark:'Optional structured headline/stat treatment used by featured race stories.',
    metrics:'Optional structured metric cards for a story.',
    quote:'Optional pull quote with text and attribution.',
    openCharters:'Each item is ONE actual Open Charter slot. Add or remove Open Charter items to change the actual charter count.',
    uses:'Possible identities/usages for this one Open Charter. One use = one number. Multiple uses still count as one actual charter slot and are not simultaneous.',
    highlight:'Adds Aetherwing visual emphasis to this driver on the public standings cards. Standings PNG exports ignore this flag and only highlight Chase drivers when League is currently in the Chase is enabled.',
    chaseActive:'Controls Chase highlighting in exported standings graphics. Turn this on only after the league has actually entered its Chase/playoff period.',
    slotLabel:'Optional public slot label such as “4TH CHARTER” or “OPEN CHARTER 2”.',
    active:'Turn this charter or number identity on/off without deleting it.',
    brands:'Add, remove, rename, reorder, or attach an optional logo to every individual driver brand.',
    entryListMode:'Auto uses the official published result after the race; before results exist it falls back to the current league roster. Choose Custom to control exactly who appears for this event.',
    entries:'The race-specific driver list. Use the roster picker, or fill it from the league roster / published result with the buttons in this block.',
    entryStatus:'Optional public note such as Confirmed, Expected, Raced, Withdrawn, or Substitute.'
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
  const normalizeDriverAssignments = (rows=[]) => rows.flatMap((entry)=>{
    if(entry?.id!=='shared-kmart' && !(entry?.competitionId==='kmart' && String(entry?.number)==='29' && /Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.displayName||'')))return [entry];
    const common={number:'29',numberImage:entry.numberImage||'',competition:entry.competition||'Kmart Auto Parts Series',competitionId:'kmart',status:entry.status||'Shared Part-Time Entry',affiliation:entry.affiliation||'alliance',car:entry.car||'SCR #29 PT'};
    return [{...common,id:'clutch-kmart',profile:'clutch',displayName:'Clutch'},{...common,id:'eazy-kmart',profile:'eazy',displayName:'Eazy'},{...common,id:'matty-kmart',profile:'matty',displayName:'Matty'}];
  });
  const base = (name) => {
    const value=name==='site'?{...(seeds[name]||{}),...(registry.published[name]||{}),...(registry.drafts[name]||{})}:(registry.drafts[name] ?? registry.published[name] ?? seeds[name]);
    return name==='drivers'?normalizeDriverAssignments(value||[]):value;
  };
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
  async function uploadedLogoData(file) {
    if(!/^image\/(png|jpeg|webp)$/.test(file?.type||''))throw new Error('Choose a PNG, JPG, or WebP logo file.');
    if(file.size>5000000)throw new Error('Logo files must be 5 MB or smaller before optimization.');
    const source=URL.createObjectURL(file);
    try {
      const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('That logo image could not be read.'));img.src=source;});
      const scale=Math.min(1,640/image.naturalWidth,260/image.naturalHeight),canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      let quality=.9,result=canvas.toDataURL('image/webp',quality);
      while(result.length>50000&&quality>.45){quality-=.1;result=canvas.toDataURL('image/webp',quality);}
      if(result.length>50000)throw new Error('This logo is still too complex after optimization. Use the Logo URL field instead.');
      return result;
    } finally { URL.revokeObjectURL(source); }
  }
  async function uploadedNumberData(file) {
    if(!/^image\/(png|jpeg|webp)$/.test(file?.type||''))throw new Error('Choose a PNG, JPG, or WebP number image. Transparent PNG or WebP works best.');
    if(file.size>5000000)throw new Error('Number image files must be 5 MB or smaller.');
    const source=URL.createObjectURL(file);
    try {
      const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('That number image could not be read.'));img.src=source;});
      const scale=Math.min(1,1000/image.naturalWidth,650/image.naturalHeight),canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
      let quality=.92,result=canvas.toDataURL('image/webp',quality);
      while(result.length>160000&&quality>.45){quality-=.08;result=canvas.toDataURL('image/webp',quality);}
      if(result.length>160000)throw new Error('This number art is too large after optimization. Please use a smaller image or an image URL.');
      return result;
    } finally { URL.revokeObjectURL(source); }
  }
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
  function autoPlaceResults() {
    if(key!=='results'||!Array.isArray(data))return false;
    const selected=current();
    data.sort(compareResults);
    data=data.map((race,i)=>({...race,featured:i===0}));
    index=Math.max(0,data.findIndex((race)=>race===selected||race.scheduleId===selected?.scheduleId));
    return true;
  }
  const slugifyResultPart=(value='')=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
  const resultScheduleId=(event={})=>`${event.date||'tbd'}-${event.league||'event'}-${slugifyResultPart(event.title||event.track||'scheduled-event')}`;
  const resultLeagueId=(league='')=>league==='open'?'uarl-open':league==='iracing'?'iracing-factory':league;
  function resultRoster(league='') {
    const id=resultLeagueId(league);
    return (base('drivers')||seeds.drivers||[]).filter((driver)=>driver.competitionId===id&&String(driver.displayName||'').trim()).sort((a,b)=>String(a.number||'').localeCompare(String(b.number||''),undefined,{numeric:true}));
  }
  function scheduleEntryFromAssignment(driver={},entryStatus='Confirmed') {
    return {assignmentId:driver.id||'',driver:driver.displayName||'',number:String(driver.number||''),entryStatus};
  }
  function normalizeScheduleEntries(event={}) {
    return (Array.isArray(event.entries)?event.entries:[]).map((entry)=>{
      const assignment=resultRoster(event.league||'').find((driver)=>driver.id===entry?.assignmentId||(driver.displayName===entry?.driver&&String(driver.number)===String(entry?.number)));
      return {assignmentId:assignment?.id||entry?.assignmentId||'',driver:assignment?.displayName||entry?.driver||'',number:String(assignment?.number||entry?.number||''),entryStatus:entry?.entryStatus||''};
    });
  }
  function scheduleRosterEntries(event={}) {
    return resultRoster(event.league||'').map((driver)=>scheduleEntryFromAssignment(driver,'Confirmed'));
  }
  function scheduleResultForEvent(event={}) {
    const raw=registry.published?.results??seeds.results??[];
    const races=migrateResults(raw);
    return races.find((race)=>race.scheduleId===resultScheduleId(event)||(race.date===event.date&&race.league===event.league&&race.title===event.title));
  }
  function scheduleResultEntries(event={}) {
    const race=scheduleResultForEvent(event);
    if(!race?.entries?.length)return [];
    return race.entries.map((entry)=>{
      const assignment=resultRoster(event.league||'').find((driver)=>driver.id===entry.assignmentId||(driver.displayName===entry.driver&&String(driver.number)===String(entry.number)));
      return {assignmentId:assignment?.id||entry.assignmentId||'',driver:assignment?.displayName||entry.driver||'',number:String(assignment?.number||entry.number||''),entryStatus:'Raced'};
    });
  }
  function isoResultDate(value='') {
    if(/^\d{4}-\d{2}-\d{2}$/.test(String(value)))return String(value);
    const parsed=new Date(value);return Number.isNaN(parsed.getTime())?'':parsed.toISOString().slice(0,10);
  }
  const uarlFinishPoints=[0,50,45,42,40,38,36,34,32,30,28,27,26,25,24,23,22];
  function stagePointsForResult(league,finish){const pos=Number(finish||0);if(league==='nrrs')return pos>=1&&pos<=5?11-pos:0;if(league==='uarl-d1')return pos>=1&&pos<=5?6-pos:0;return null;}
  function finishPointsForResult(league,finish){const pos=Number(finish||0);if(pos<1)return 0;if(league==='nrrs')return pos===1?40:Math.max(1,37-pos);if(league==='uarl-d1')return uarlFinishPoints[pos]||0;return null;}
  function scoreKnownResult(race){if(!race||!['nrrs','uarl-d1'].includes(race.league)||!Array.isArray(race.entries))return race;return {...race,entries:race.entries.map(entry=>{const stage1=stagePointsForResult(race.league,entry.stage1Finish),stage2=stagePointsForResult(race.league,entry.stage2Finish),finishPoints=finishPointsForResult(race.league,entry.finish),bonusPoints=Math.max(0,Number(entry.bonusPoints||0)||0),pointsEligible=entry.pointsEligible!==false;return {...entry,stage1Points:stage1,stage2Points:stage2,finishPoints,bonusPoints,pointsEligible,racePoints:pointsEligible?finishPoints+stage1+stage2+bonusPoints:0};})};}
  function migrateResults(value) {
    if(Array.isArray(value)||Array.isArray(value?.races))return (Array.isArray(value)?value:value.races).map((race)=>scoreKnownResult({...race,entries:(race.entries||[]).map((entry)=>{if(entry?.assignmentId==='shared-kmart'||(String(entry?.number)==='29'&&/Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.driver||'')))return{...entry,assignmentId:'',driver:'Select Clutch, Eazy, or Matty',number:'29'};const assignment=resultRoster(race.league).find((driver)=>driver.id===entry.assignmentId||(driver.displayName===entry.driver&&String(driver.number)===String(entry.number)));return{...entry,assignmentId:assignment?.id||entry.assignmentId||''};})}));
    const old=value?.latestResult;if(!old)return [];
    const date=isoResultDate(old.date),schedule=(base('schedule-events')||seeds['schedule-events']||[]).find((event)=>event.league==='nrrs'&&(event.title===old.title||event.track===old.track)&&(!date||event.date===date));
    const league=schedule?.league||'nrrs',assignment=resultRoster(league).find((driver)=>String(driver.number)===String(old.number));
    return [scoreKnownResult({scheduleId:schedule?resultScheduleId(schedule):`${date||'tbd'}-${league}-${slugifyResultPart(old.title)}`,league,leagueName:schedule?.leagueName||old.series||'NRRS',title:schedule?.title||old.title||'',track:schedule?.track||old.track||'',date:schedule?.date||date,round:schedule?.round||old.round||'',status:schedule?.status||'',specialTag:schedule?.specialTag||old.specialTag||'',featured:true,headline:old.headline||'',headlineAccent:old.headlineAccent||'',summary:old.summary||'',entries:[{assignmentId:assignment?.id||'',driver:assignment?.displayName||old.driver||'',number:String(assignment?.number||old.number||''),start:Number(old.start||0),stage1Finish:0,stage1Points:0,stage2Finish:0,stage2Points:Number(old.stagePoints||0),finish:Number(old.finish||0),racePoints:Number(old.pointsChange||0),featuredDriver:true}]})];
  }
  function compareResults(a,b){return String(b?.date||'').localeCompare(String(a?.date||''))||String(a?.league||'').localeCompare(String(b?.league||''))||String(a?.title||'').localeCompare(String(b?.title||''));}
  const standingName=(value='')=>String(value).toLowerCase().replace(/[^a-z0-9]+/g,'').replace(/^wispy$/,'hailey');
  function recalcStandingBoard(board=current()) {
    if(!board?.rows?.length)return;
    const before=new Map(board.rows.map((row,i)=>[`${standingName(row.driver)}|${String(row.number||'')}`,i+1]));
    const ranked=board.rows.filter((row)=>!row.unranked).sort((a,b)=>Number(b.points||0)-Number(a.points||0)||String(a.driver||'').localeCompare(String(b.driver||'')));
    const unranked=board.rows.filter((row)=>row.unranked);
    ranked.forEach((row,i)=>{const now=i+1,old=before.get(`${standingName(row.driver)}|${String(row.number||'')}`);row.position=`P${now}`;if(old){const move=old-now;row.positionChange=move>0?`▲${move}`:move<0?`▼${Math.abs(move)}`:'—';}});
    if(board.gapMode==='cutoff'&&Number(board.cutoffAfter)>0&&ranked.length>Number(board.cutoffAfter)){
      const cut=Number(board.cutoffAfter),lastIn=Number(ranked[cut-1]?.points||0),firstOut=Number(ranked[cut]?.points||0);
      ranked.forEach((row,i)=>{const pts=Number(row.points||0);row.delta=i<cut?`+${Math.max(0,pts-firstOut)}`:`${pts-lastIn}`;});
    }else if(ranked.length){const leader=Number(ranked[0].points||0);ranked.forEach((row,i)=>{row.delta=i===0?'LEADER':`${Number(row.points||0)-leader}`;});}
    board.rows=[...ranked,...unranked];
  }
  function splitImportLine(line,delimiter=','){
    if(delimiter==='\t')return line.split('\t').map(v=>v.trim());
    const cells=[];let cell='',quoted=false;for(let i=0;i<line.length;i++){const ch=line[i];if(ch==='"'){if(quoted&&line[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(ch===delimiter&&!quoted){cells.push(cell.trim());cell='';}else cell+=ch;}cells.push(cell.trim());return cells;
  }
  function parseStandingsImport(raw=''){
    const lines=String(raw).split(/\r?\n/).map(line=>line.trim()).filter(Boolean).filter(line=>!/^(chase cutoff|cutoff|standings|position\b)/i.test(line));
    if(!lines.length)return [];
    const delimiter=lines.some(line=>line.includes('\t'))?'\t':lines.some(line=>line.includes(','))?',':null;
    if(delimiter){
      const rows=lines.map(line=>splitImportLine(line,delimiter));
      const header=rows[0].map(v=>v.toLowerCase().replace(/[^a-z]/g,''));
      const hasHeader=header.some(v=>['position','pos','driver','name','points','pts','number','car','gap','delta'].includes(v));
      const find=(names)=>header.findIndex(v=>names.includes(v));
      let pi=find(['position','pos','rank']),ni=find(['number','car','carnumber','no']),di=find(['driver','name']),pti=find(['points','pts']),gi=find(['gap','delta']);
      const body=hasHeader?rows.slice(1):rows;
      return body.map((cells,index)=>{
        if(!hasHeader){pi=0;if(cells.length>=5){ni=1;di=2;pti=3;gi=4;}else if(cells.length===4){ni=-1;di=1;pti=2;gi=3;}else{ni=-1;di=1;pti=2;gi=-1;}}
        const pos=String(cells[pi]??index+1).replace(/^P/i,''),points=Number(String(cells[pti]??'0').replace(/,/g,''));
        return {position:/^\d+$/.test(pos)?`P${pos}`:(pos||'—'),number:ni>=0?String(cells[ni]||'').replace(/^#/,''):'',driver:String(cells[di]||'').trim(),points:Number.isFinite(points)?points:0,delta:gi>=0?String(cells[gi]||'').trim():''};
      }).filter(row=>row.driver&&Number.isFinite(row.points));
    }
    return lines.map((line,index)=>{
      const clean=line.replace(/\s+/g,' ').trim();
      const match=clean.match(/^(?:P)?(\d+|—|-)\s+(?:#?([0-9][0-9A-Za-z-]*)\s+)?(.+?)\s+([0-9][0-9,]*)\s*(LEADER|[+-]\d+|—|-)?$/i);
      if(!match)return null;
      return {position:/^\d+$/.test(match[1])?`P${match[1]}`:match[1],number:match[2]||'',driver:match[3].trim(),points:Number(match[4].replace(/,/g,'')),delta:match[5]||''};
    }).filter(Boolean);
  }
  function standingAliasMap(){
    const map=new Map();for(const profile of base('roster-profiles')||[]){const canonical=profile.name||profile.slug;for(const value of [profile.name,profile.handle,profile.robloxDisplayName,profile.robloxUsername,profile.historicalRobloxDisplayName,profile.iracingName,profile.historicalIRacingName])if(value)map.set(standingName(value),standingName(canonical));}return map;
  }
  function matchedStanding(board,row){
    const aliases=standingAliasMap(),target=aliases.get(standingName(row.driver))||standingName(row.driver);
    return (board.rows||[]).find(item=>row.number&&String(item.number||'')===String(row.number)&&(aliases.get(standingName(item.driver))||standingName(item.driver))===target)||(board.rows||[]).find(item=>(aliases.get(standingName(item.driver))||standingName(item.driver))===target)||(board.rows||[]).find(item=>row.number&&String(item.number||'')===String(row.number));
  }
  let standingsImportPreview=[];
  function drawStandingsImportPreview(rows=[]){
    const box=$('[data-standings-import-preview]');if(!box)return;
    const board=current();box.innerHTML=rows.length?`<div class="standings-import-summary"><strong>${rows.length} ROWS READY</strong><span>Review before replacing ${board?.rows?.length||0} current rows.</span></div><div class="standings-import-grid">${rows.map(row=>{const match=matchedStanding(board,row);return `<div class="${match?'is-matched':'is-new'}"><b>${esc(row.position)}</b><span>${row.number?'#'+esc(row.number)+' · ':''}${esc(row.driver)}</span><strong>${Number(row.points).toLocaleString('en-US')} PTS</strong><small>${match?'MATCHED'+(match.driver!==row.driver?' → '+esc(match.driver):''):'NEW / REVIEW'}${row.delta?' · '+esc(row.delta):''}</small></div>`;}).join('')}</div>`:'<p>Paste standings or upload a CSV, then choose Preview import.</p>';
  }
  function applyStandingsImport(){
    if(key!=='standings'||!standingsImportPreview.length)return status('Preview a standings import first.');
    commit();const board=current(),old=board.rows||[];
    board.rows=standingsImportPreview.map((row,index)=>{const match=matchedStanding({...board,rows:old},row)||{};return {...match,position:row.position||`P${index+1}`,number:row.number||match.number||'',driver:row.driver||match.driver||'',points:Number(row.points||0),delta:row.delta||match.delta||'',positionChange:match.positionChange||'—',chaseEligible:typeof match.chaseEligible==='boolean'?match.chaseEligible:index<Number(board.cutoffAfter||0),highlight:Boolean(match.highlight),...(match.note?{note:match.note}:{})};});
    if(!standingsImportPreview.some(row=>row.delta))recalcStandingBoard(board);
    dirty=true;standingsImportPreview=[];render();status(`${board.rows.length} standings rows imported. Review the board, then Publish Standings.`);
  }
  function applyPublishedResultsToStanding(){
    if(key!=='standings')return;commit();const board=current();if(board.autoPoints!==true)return status('Turn Auto Points on for this standings board first.');
    const results=[...(base('results')||[])].filter(r=>r.league===board.league&&String(r.date||'')>String(board.lastResultDate||'')).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    if(!results.length)return status('No newer published results are waiting to be applied to this board.');
    let matched=0;for(const race of results){for(const entry of race.entries||[]){const row=matchedStanding(board,entry);if(row&&Number.isFinite(Number(entry.racePoints))){row.points=Number(row.points||0)+Number(entry.racePoints||0);matched++;}}recalcStandingBoard(board);board.lastResultDate=race.date||board.lastResultDate||'';board.lastResultScheduleId=race.scheduleId||'';board.autoUpdateNote=`Applied ${race.title||race.track||'published result'} · ${race.date||''}`;}
    dirty=true;render();status(`${results.length} published result${results.length===1?'':'s'} applied (${matched} driver point updates). Review, then publish Standings.`);
  }
  const standingsLogoMap={
    nrrs:'/images/schedule-logos/nrrs.png',
    kmart:'/images/schedule-logos/kmart-regular.jpg',
    sunoco:'/images/schedule-logos/sunoco.png',
    uarl:'/images/schedule-logos/uarl-d1.png',
    'uarl-d1':'/images/schedule-logos/uarl-d1.png',
    'uarl-open':'/images/schedule-logos/open.png',
    iracing:'/images/schedule-logos/iracing.png',
    'iracing-factory':'/images/schedule-logos/iracing.png'
  };
  const standingsSeriesTitleMap={
    nrrs:'NRRS TOWN FAIR TIRE CUP SERIES',
    kmart:'NASCAR KMART AUTO PARTS SERIES',
    sunoco:'NASCAR SUNOCO TRUCK SERIES',
    uarl:'UARL L.L. BEAN CUP SERIES',
    'uarl-d1':'UARL L.L. BEAN CUP SERIES',
    'uarl-open':'UARL BANGOR SAVINGS BANK LATE MODEL SERIES'
  };
  const standingsAccentMap={
    nrrs:'#d8b968',kmart:'#df2638',sunoco:'#f0c928',uarl:'#6f8f73','uarl-d1':'#6f8f73','uarl-open':'#bd9b57'
  };
  const standingsManufacturerByNumber={
    nrrs:{
      '1':'Chevrolet','01':'Chevrolet','3':'Chevrolet','6':'Ford','7':'Chevrolet','07':'Chevrolet','8':'Chevrolet','9':'Cadillac','10':'Chevrolet','11':'Ford','13':'Toyota','14':'Ford','15':'Honda','16':'Chevrolet','17':'Ford','18':'Toyota','20':'Chevrolet','21':'Chevrolet','22':'Ford','27':'Ford','32':'Toyota','33':'Chevrolet','41':'Honda','43':'Toyota','45':'Ford','58':'Ford','60':'Ford','61':'Chevrolet','62':'Toyota','67':'Ford','71':'Chevrolet','77':'Chevrolet','94':'Chevrolet','99':'Ford'
    },
    kmart:{
      '0':'Chevrolet','05':'Chevrolet','1':'Chevrolet','5':'Chevrolet','9':'Chevrolet','10':'Chevrolet','13':'Toyota','15':'Dodge','16':'Chevrolet','18':'Toyota','20':'Toyota','21':'Chevrolet','24':'Dodge','26':'Chevrolet','29':'Dodge','34':'Dodge','45':'Chevrolet','48':'Chevrolet','50':'Toyota','51':'Toyota','54':'Toyota','55':'Toyota','56':'Toyota','61':'Chevrolet','88':'Chevrolet','91':'Chevrolet','97':'Chevrolet'
    }
  };
  const standingsDriverAliases={
    wispy:'hailey',aokikoto:'hailey',willsracingdesigns:'will',deadmansrisin27:'eazy',gostclutch24:'clutch',mattycampbell:'matty',arcticblitzzzz:'jaxon',troopersregiment214:'cod',mannygtr:'manny',frogboy4783:'frogboy',player138164:'carl',outlaw5948:'outlaw',trentplayz:'trent',retrosp4rkz:'sparklez',voidwinter:'alex',b4lalex:'alex',owenn001:'owen',montaque77:'tj',redfont:'redfont',rapperessnetioal:'chandler',stampy13:'stampy',bluelagoon1376:'nico',matts1964:'matt',tnfanracing:'tnfan'
  };
  const standingsManufacturerIconPaths={
    chevrolet:'/images/manufacturers/chevrolet.png',
    ford:'/images/manufacturers/ford.png',
    toyota:'/images/manufacturers/toyota.png',
    'dodge-kmart':'/images/manufacturers/dodge-kmart.png',
    'ram-sunoco':'/images/manufacturers/ram-sunoco.png',
    cadillac:'/images/manufacturers/cadillac.png',
    honda:'/images/manufacturers/honda.png'
  };
  let standingsExportObjectUrl='';
  const safeExportName=(value='standings')=>String(value||'standings').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')||'standings';
  const loadCanvasImage=(src)=>new Promise((resolve)=>{if(!src)return resolve(null);const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=src;});
  const standingsSeriesTitle=(board)=>standingsSeriesTitleMap[board?.league]||standingsSeriesTitleMap[board?.id]||String(board?.title||'Standings').toUpperCase();
  const normalizeStandingDriver=(value='')=>{
    const raw=String(value||'').toLowerCase().replace(/^@/,'').replace(/[^a-z0-9]/g,'');
    return standingsDriverAliases[raw]||raw;
  };
  const standingsLeagueMatches=(resultLeague,boardLeague)=>resultLeague===boardLeague||(boardLeague==='uarl'&&resultLeague==='uarl-d1');
  function latestStandingResultEntry(board,row){
    const driverKey=normalizeStandingDriver(row?.driver||row?.displayName||'');if(!driverKey)return null;
    const races=[...(base('results')||[])].filter((race)=>standingsLeagueMatches(race?.league,board?.league)).sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||'')));
    for(const race of races){
      const entry=(race.entries||[]).find((candidate)=>normalizeStandingDriver(candidate?.driver||candidate?.displayName||'')===driverKey);
      if(entry)return entry;
    }
    return null;
  }
  function standingManufacturer(board,row,fallbackNumber=''){
    const latest=latestStandingResultEntry(board,row);
    if(String(latest?.manufacturer||'').trim())return String(latest.manufacturer).trim();
    const map=standingsManufacturerByNumber[board?.league]||standingsManufacturerByNumber[board?.id]||{};
    const latestNumber=String(latest?.number||'').trim();if(latestNumber&&map[latestNumber])return map[latestNumber];
    if(String(row?.manufacturer||'').trim())return String(row.manufacturer).trim();
    const number=String(row?.number||fallbackNumber||'').trim();return map[number]||'';
  }
  function standingManufacturerIconKey(board,manufacturer=''){
    const value=String(manufacturer||'').trim().toLowerCase();if(!value)return '';
    if(value.includes('chev'))return 'chevrolet';
    if(value.includes('ford'))return 'ford';
    if(value.includes('toyota'))return 'toyota';
    if(value.includes('cadillac'))return 'cadillac';
    if(value.includes('honda'))return 'honda';
    if(value.includes('ram')||value.includes('dodge'))return board?.league==='sunoco'?'ram-sunoco':'dodge-kmart';
    return '';
  }
  async function loadStandingManufacturerIcons(){
    const entries=await Promise.all(Object.entries(standingsManufacturerIconPaths).map(async ([key,src])=>[key,await loadCanvasImage(src)]));
    return Object.fromEntries(entries);
  }
  function isChaseDriver(board,row,index){
    if(board?.chaseActive!==true)return false;
    const explicit=String(row?.chaseStatus||'').trim().toUpperCase();
    if(explicit==='CHASE')return true;
    if(explicit.includes('NOT IN CHASE')||explicit.includes('ELIMINATED'))return false;
    const cutoff=Number(board?.cutoffAfter||0);return cutoff>0&&index<cutoff&&row?.chaseEligible!==false;
  }
  function drawContained(ctx,image,x,y,width,height){
    if(!image?.naturalWidth||!image?.naturalHeight)return;
    const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;
    ctx.drawImage(image,x+(width-w)/2,y+(height-h)/2,w,h);
  }
  function fitCanvasText(ctx,text,maxWidth,size,weight='900',family='Arial Narrow, Arial, sans-serif',minSize=20){
    let px=size;ctx.font=`${weight} ${px}px ${family}`;
    while(px>minSize&&ctx.measureText(String(text||'')).width>maxWidth){px-=2;ctx.font=`${weight} ${px}px ${family}`;}
    return px;
  }
  function roundedRect(ctx,x,y,w,h,r=12){
    const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();
  }
  function paintStandingRow(ctx,row,x,y,w,h,index,board,manufacturerIcons={}){
    const chaseDriver=isChaseDriver(board,row,index),outsideCut=Number(board.cutoffAfter)>0&&index>=Number(board.cutoffAfter),manufacturer=standingManufacturer(board,row),manufacturerKey=standingManufacturerIconKey(board,manufacturer),manufacturerImage=manufacturerIcons[manufacturerKey]||null;
    ctx.save();roundedRect(ctx,x,y,w,h-6,8);ctx.fillStyle=chaseDriver?'rgba(65,54,27,.96)':outsideCut?'rgba(10,12,14,.92)':'rgba(15,19,23,.94)';ctx.fill();
    if(chaseDriver){ctx.fillStyle='#e0c891';ctx.fillRect(x,y,7,h-6);ctx.strokeStyle='rgba(224,200,145,.48)';ctx.lineWidth=1.5;roundedRect(ctx,x+.75,y+.75,w-1.5,h-7.5,8);ctx.stroke();}
    const pad=22,posX=x+pad,numX=x+112,iconX=x+194,iconW=76,iconH=38,nameX=x+(manufacturerImage?288:205),pointsX=x+w-190,deltaX=x+w-24,midY=y+(h-6)/2;
    ctx.textBaseline='middle';ctx.fillStyle=chaseDriver?'#f6f8fa':'#aeb9bf';ctx.font='900 24px Arial Narrow, Arial, sans-serif';ctx.textAlign='left';ctx.fillText(String(row.position||`P${index+1}`),posX,midY);
    ctx.fillStyle='#e0c891';ctx.font='900 25px Arial Narrow, Arial, sans-serif';ctx.fillText(row.number?`#${row.number}`:'—',numX,midY);
    if(manufacturerImage){ctx.save();ctx.globalAlpha=.98;roundedRect(ctx,iconX-4,midY-iconH/2-2,iconW+8,iconH+4,7);ctx.fillStyle='rgba(255,255,255,.035)';ctx.fill();drawContained(ctx,manufacturerImage,iconX,midY-iconH/2,iconW,iconH);ctx.restore();}
    const detail=[chaseDriver?'CHASE':'',row.note&&!/listed as wispy/i.test(String(row.note||''))?row.note:''].filter(Boolean).join(' · '),driver=String(row.driver||'—');fitCanvasText(ctx,driver,Math.max(150,pointsX-nameX-28),31,'900','Arial Narrow, Arial, sans-serif',20);ctx.fillStyle='#f6f8fa';ctx.fillText(driver.toUpperCase(),nameX,midY-(detail?8:0));
    if(detail){ctx.fillStyle=chaseDriver?'#e0c891':'#7f8b92';ctx.font='800 13px Arial, sans-serif';ctx.fillText(String(detail).toUpperCase(),nameX,midY+15);}
    ctx.textAlign='right';ctx.fillStyle='#f6f8fa';ctx.font='900 27px Arial Narrow, Arial, sans-serif';ctx.fillText(Number(row.points||0).toLocaleString('en-US'),pointsX,midY);
    ctx.fillStyle=row.delta==='LEADER'?'#e0c891':'#9ba6ac';ctx.font='900 18px Arial, sans-serif';ctx.fillText(String(row.delta||'—'),deltaX,midY);
    ctx.restore();
  }
  async function createStandingsPng(board){
    const rows=Array.isArray(board?.rows)?board.rows:[];if(!rows.length)throw new Error('This standings board has no rows to export.');
    const width=1800,margin=72,headerHeight=250,rowHeight=70,columnGap=28,columns=rows.length>16?2:1,rowsPerColumn=Math.ceil(rows.length/columns),bodyHeight=rowsPerColumn*rowHeight;
    const ptDrivers=Array.isArray(board.ptEntry?.drivers)?board.ptEntry.drivers:[],ptHeight=ptDrivers.length?170:0,footerHeight=92,height=margin+headerHeight+bodyHeight+ptHeight+footerHeight+margin;
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Canvas export is not available in this browser.');
    const leagueLogo=await loadCanvasImage(standingsLogoMap[board.league]||standingsLogoMap[board.id]||'');
    const manufacturerIcons=await loadStandingManufacturerIcons();
    const accentColor=standingsAccentMap[board.league]||standingsAccentMap[board.id]||'#e0c891',seriesTitle=standingsSeriesTitle(board);
    ctx.fillStyle='#05070a';ctx.fillRect(0,0,width,height);
    const wash=ctx.createLinearGradient(0,0,width,height);wash.addColorStop(0,'#11161b');wash.addColorStop(.5,'#080b0e');wash.addColorStop(1,'#020405');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);
    ctx.save();ctx.globalAlpha=.025;ctx.fillStyle='#ffffff';const grid=92;for(let gy=0;gy<height;gy+=grid){for(let gx=0;gx<width;gx+=grid){if(((gx/grid)+(gy/grid))%2===0)ctx.fillRect(gx,gy,grid,grid);}}ctx.restore();
    ctx.fillStyle=accentColor;ctx.fillRect(0,0,width,12);
    if(leagueLogo){roundedRect(ctx,margin,margin+22,148,132,12);ctx.fillStyle='rgba(255,255,255,.07)';ctx.fill();drawContained(ctx,leagueLogo,margin+13,margin+33,122,110);}
    const titleX=margin+(leagueLogo?178:0),titleMax=width-titleX-margin;ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle=accentColor;ctx.font='900 18px Arial, sans-serif';ctx.fillText('OFFICIAL DRIVER STANDINGS',titleX,margin+48);
    fitCanvasText(ctx,seriesTitle,titleMax,58,'900','Arial Narrow, Arial, sans-serif',30);ctx.fillStyle='#f6f8fa';ctx.fillText(seriesTitle,titleX,margin+112);
    fitCanvasText(ctx,board.subtitle||'',titleMax,25,'700','Arial, sans-serif',17);ctx.fillStyle='#a8b1b7';ctx.fillText(String(board.subtitle||''),titleX,margin+151);
    const meta=[board.status,board.chaseActive===true?'CHASE ACTIVE':''].filter(Boolean).join(' · ');if(meta){ctx.fillStyle=accentColor;ctx.font='900 16px Arial, sans-serif';ctx.fillText(String(meta).toUpperCase(),titleX,margin+184);}
    const bodyY=margin+headerHeight,colWidth=(width-margin*2-columnGap*(columns-1))/columns;
    for(let col=0;col<columns;col++){
      const x=margin+col*(colWidth+columnGap),start=col*rowsPerColumn,end=Math.min(rows.length,start+rowsPerColumn);
      for(let i=start;i<end;i++){
        const local=i-start,y=bodyY+local*rowHeight;
        if(Number(board.cutoffAfter)>0&&i===Number(board.cutoffAfter)){
          ctx.save();ctx.strokeStyle=accentColor;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x+colWidth,y-4);ctx.stroke();ctx.fillStyle=accentColor;ctx.font='900 13px Arial, sans-serif';ctx.textAlign='right';ctx.fillText(String(board.cutoffLabel||'CHASE CUTOFF').toUpperCase(),x+colWidth,y-11);ctx.restore();
        }
        paintStandingRow(ctx,rows[i],x,y,colWidth,rowHeight,i,board,manufacturerIcons);
      }
    }
    let cursorY=bodyY+bodyHeight+18;
    if(ptDrivers.length){
      roundedRect(ctx,margin,cursorY,width-margin*2,ptHeight-18,12);ctx.fillStyle='rgba(17,20,23,.95)';ctx.fill();ctx.strokeStyle='rgba(255,255,255,.16)';ctx.lineWidth=2;ctx.stroke();
      ctx.textAlign='left';ctx.fillStyle=accentColor;ctx.font='900 16px Arial, sans-serif';ctx.fillText(String(board.ptEntry.title||'PART-TIME ENTRIES').toUpperCase(),margin+24,cursorY+34);ctx.fillStyle='#8f999f';ctx.font='800 14px Arial, sans-serif';ctx.fillText(String(board.ptEntry.status||'').toUpperCase(),margin+24,cursorY+59);
      const cardGap=14,cardY=cursorY+78,cardW=(width-margin*2-48-(ptDrivers.length-1)*cardGap)/Math.max(1,ptDrivers.length);ptDrivers.forEach((driver,i)=>{const cardX=margin+24+i*(cardW+cardGap),manufacturer=standingManufacturer(board,driver,board.ptEntry.number),manufacturerKey=standingManufacturerIconKey(board,manufacturer),manufacturerImage=manufacturerIcons[manufacturerKey]||null;ctx.fillStyle='rgba(5,7,9,.92)';ctx.fillRect(cardX,cardY,cardW,62);ctx.fillStyle='#f6f8fa';ctx.font='900 20px Arial Narrow, Arial, sans-serif';fitCanvasText(ctx,`${board.ptEntry.number?'#'+board.ptEntry.number+' · ':''}${String(driver.driver||'').toUpperCase()}`,Math.max(140,cardW-(manufacturerImage?126:32)),20,'900','Arial Narrow, Arial, sans-serif',15);ctx.fillText(`${board.ptEntry.number?'#'+board.ptEntry.number+' · ':''}${String(driver.driver||'').toUpperCase()}`,cardX+16,cardY+24);ctx.fillStyle='#a9b2b7';ctx.font='900 13px Arial, sans-serif';ctx.fillText(`${Number(driver.points||0).toLocaleString('en-US')} PTS`,cardX+16,cardY+48);if(manufacturerImage){drawContained(ctx,manufacturerImage,cardX+cardW-94,cardY+15,76,32);}});
      cursorY+=ptHeight;
    }
    ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(margin,cursorY+18);ctx.lineTo(width-margin,cursorY+18);ctx.stroke();ctx.textBaseline='alphabetic';ctx.textAlign='left';ctx.fillStyle='#7f8a91';ctx.font='800 14px Arial, sans-serif';ctx.fillText(`${seriesTitle} · STANDINGS`,margin,cursorY+53);ctx.textAlign='right';ctx.fillText(`GENERATED ${new Date().toLocaleString('en-US',{dateStyle:'medium',timeStyle:'short'})}`,width-margin,cursorY+53);
    const blob=await new Promise((resolve,reject)=>canvas.toBlob((value)=>value?resolve(value):reject(new Error('PNG encoding failed.')),'image/png',1));
    return {blob,fileName:`${safeExportName(seriesTitle)}-standings.png`,width,height};
  }
  async function saveStandingsPng(blob,fileName){
    if('showSaveFilePicker' in window){
      try{const handle=await window.showSaveFilePicker({suggestedName:fileName,types:[{description:'PNG image',accept:{'image/png':['.png']}}]});const writable=await handle.createWritable();await writable.write(blob);await writable.close();status(`${fileName} saved.`);return;}catch(error){if(error?.name==='AbortError')return;}
    }
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);status(`${fileName} download started.`);
  }
  async function exportStandingsGraphic(panel){
    if(key!=='standings')return;commit();const board=current();const button=panel.querySelector('[data-standings-export]');if(button){button.disabled=true;button.textContent='Generating PNG…';}status(`Generating full ${board?.title||'standings'} graphic…`);
    try{
      const graphic=await createStandingsPng(board);if(standingsExportObjectUrl)URL.revokeObjectURL(standingsExportObjectUrl);standingsExportObjectUrl=URL.createObjectURL(graphic.blob);
      const box=panel.querySelector('[data-standings-export-preview]');box.innerHTML=`<div class="standings-export-head"><div><strong>STANDINGS GRAPHIC READY</strong><span>${graphic.width.toLocaleString('en-US')} × ${graphic.height.toLocaleString('en-US')} PNG · ${esc(graphic.fileName)}</span></div><div><button type="button" data-standings-export-save>Save PNG</button><button type="button" data-standings-export-open>Open full size</button></div></div><img src="${standingsExportObjectUrl}" alt="Preview of ${esc(board.title||'selected league')} full standings graphic">`;
      box.querySelector('[data-standings-export-save]').addEventListener('click',()=>saveStandingsPng(graphic.blob,graphic.fileName));
      box.querySelector('[data-standings-export-open]').addEventListener('click',()=>window.open(standingsExportObjectUrl,'_blank','noopener'));
      status(`Full ${board.title||'standings'} PNG generated. Preview it below or save it to your device.`);
    }catch(error){status(error?.message||'Could not generate the standings PNG.');}
    finally{if(button){button.disabled=false;button.textContent='Generate standings PNG';}}
  }
  function renderStandingsImportTool(){
    const host=$('[data-content-fields]'),board=current();if(!host||!board)return;
    const panel=document.createElement('section');panel.className='standings-import-tool';panel.innerHTML=`<div class="standings-import-head"><div><span>AUTOMATED STANDINGS</span><h3>Import / advance ${esc(board.title||board.id)}</h3><p>Paste a league table from Discord, Google Sheets, or Excel. CSV/TSV and simple position-driver-points lines are detected automatically.</p></div><strong>${board.autoPoints?'AUTO POINTS ON':'MANUAL ONLY'}</strong></div><div class="standings-import-controls"><textarea data-standings-import-text rows="6" placeholder="P1  #34  Jaxon  267  +147\nP2  #24  Will  244  +124\n…"></textarea><div class="standings-import-actions"><label>Upload CSV / TSV<input type="file" accept=".csv,.tsv,text/csv,text/tab-separated-values,text/plain" data-standings-import-file></label><button type="button" data-standings-import-preview-button>Preview import</button><button type="button" data-standings-import-apply>Apply preview</button><button type="button" data-standings-apply-results>Apply waiting race points</button><button type="button" data-standings-recalc>Recalculate order + gaps</button><button type="button" data-standings-export>Generate standings PNG</button></div></div><div data-standings-import-preview></div><div class="standings-export-preview" data-standings-export-preview></div><p class="standings-import-foot">Last applied result: ${esc(board.lastResultDate||'none')} ${board.lastResultScheduleId?`· ${esc(board.lastResultScheduleId)}`:''}. Publishing Race Results automatically advances boards with Auto Points enabled.</p>`;
    host.prepend(panel);drawStandingsImportPreview(standingsImportPreview);
    panel.querySelector('[data-standings-import-preview-button]').addEventListener('click',()=>{standingsImportPreview=parseStandingsImport(panel.querySelector('[data-standings-import-text]').value);drawStandingsImportPreview(standingsImportPreview);status(standingsImportPreview.length?`${standingsImportPreview.length} standings rows parsed. Review the matches, then Apply preview.`:'No standings rows could be parsed. Try CSV with Position, Number, Driver, Points, Gap headers.');});
    panel.querySelector('[data-standings-import-apply]').addEventListener('click',applyStandingsImport);
    panel.querySelector('[data-standings-apply-results]').addEventListener('click',applyPublishedResultsToStanding);
    panel.querySelector('[data-standings-recalc]').addEventListener('click',()=>{commit();recalcStandingBoard(board);dirty=true;render();status('Standings order, positions, movement, and gaps recalculated. Review, then publish.');});
    panel.querySelector('[data-standings-export]').addEventListener('click',()=>exportStandingsGraphic(panel));
    panel.querySelector('[data-standings-import-file]').addEventListener('change',async event=>{const file=event.target.files?.[0];if(!file)return;panel.querySelector('[data-standings-import-text]').value=await file.text();status(`${file.name} loaded. Choose Preview import.`);});
  }
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
      let next=board;
      if(!Array.isArray(board.openCharters)){
        const old=board.openCharter;
        if(!old)next={...board,openCharters:[]};
        else {const uses=[old.partTime,old.development].filter(Boolean).map((use)=>({...use,active:true}));next={...board,openCharters:[{id:`${board.id||'league'}-open-1`,label:old.label||'Aetherwing Open Charter',slotLabel:old.slotLabel||'',active:true,uses}]};delete next.openCharter;}
      }
      return {...next,fullTime:(next.fullTime||[]).map(slot=>({numberImage:'',...slot})),openCharters:(next.openCharters||[]).map(charter=>({...charter,uses:(charter.uses||[]).map(use=>({numberImage:'',...use}))}))};
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
      if(key==='results'&&path[0]==='entries'&&['nrrs','uarl-d1'].includes(current()?.league)&&['stage1Points','stage2Points','finishPoints','racePoints'].includes(k)) {
        return shell(pretty,`<input ${attr} data-field-type="number" type="number" readonly value="${esc(v)}">`,k==='racePoints'?'Automatically calculated from finish + stage points + bonus/adjustment points.':'Automatically calculated from the recorded position for this league.','is-readonly');
      }
      if(key==='results'&&k==='featured') {
        return shell(pretty,`<input type="text" readonly value="${v?'Yes · newest completed result':'No'}">`,'This is automatic. The newest dated completed result across all programs becomes Latest Result.','is-readonly');
      }
      if(key==='schedule-events'&&k==='entryListMode'&&path.length===0) {
        return shell(pretty,`<select ${attr} data-field-type="string"><option value="auto" ${v!=='custom'?'selected':''}>Auto · results after race / roster before race</option><option value="custom" ${v==='custom'?'selected':''}>Custom · only selected event entries</option></select>`,help||'Auto keeps older events useful without manual maintenance. Custom makes the public Event page use only the list below.');
      }
      if(key==='schedule-events'&&k==='assignmentId'&&path[0]==='entries') {
        const choices=resultRoster(current()?.league||'');
        return shell(pretty,`<select ${attr} data-field-type="string" data-schedule-entry-driver-choice>${!v?'<option value="" selected disabled>Choose roster driver</option>':''}${choices.map((driver)=>`<option value="${esc(driver.id)}" ${driver.id===v?'selected':''}>#${esc(driver.number)} · ${esc(driver.displayName)}</option>`).join('')}</select>`,choices.length?'Only drivers assigned to this event league are available.':'No drivers are assigned to this league yet. Add them in Driver League Assignments first.');
      }
      if(key==='schedule-events'&&['driver','number'].includes(k)&&path[0]==='entries') {
        return shell(pretty,`<input ${attr} data-field-type="string" readonly value="${esc(v)}">`,'Filled automatically from the selected Driver League Assignment.','is-readonly');
      }
      if(key==='results'&&k==='assignmentId'&&path[0]==='entries') {
        const choices=resultRoster(current()?.league||'');
        return shell(pretty,`<select ${attr} data-field-type="string" data-result-driver-choice><option value="" ${!v?'selected':''}>External / unrostered participant</option>${choices.map((driver)=>`<option value="${esc(driver.id)}" ${driver.id===v?'selected':''}>#${esc(driver.number)} · ${esc(driver.displayName)}</option>`).join('')}</select>`,choices.length?'Pick an Aetherwing/partner roster assignment, or use External for other league competitors.':'Enter league competitors as External participants.');
      }
      if(key==='results'&&['driver','number'].includes(k)&&path[0]==='entries') {
        const entry=valueAt(current(),path.slice(0,-1)),linked=Boolean(entry?.assignmentId);
        return shell(pretty,`<input ${attr} data-field-type="string" ${linked?'readonly':''} value="${esc(v)}">`,linked?'Filled automatically from the selected Driver League Assignment.':'External participant: enter the official race name and car number.',linked?'is-readonly':'');
      }
      if(key==='page-overrides'&&['id','page','type','label','original'].includes(k)) {
        return shell(pretty,`<input ${attr} data-field-type="string" readonly value="${esc(v)}">`,'Created by the page scanner so the replacement remains tied to the correct public item.','is-readonly');
      }
      if(['wins','milestones'].includes(key)&&k==='assignmentId'){
        const choices=(base('drivers')||seeds.drivers||[]).slice().sort((a,b)=>String(a.competition).localeCompare(String(b.competition))||String(a.number).localeCompare(String(b.number),undefined,{numeric:true}));
        return shell(pretty,`<select ${attr} data-field-type="string" data-history-driver-choice><option value="">No linked number artwork</option>${choices.map((driver)=>`<option value="${esc(driver.id)}" ${driver.id===v?'selected':''}>${esc(driver.competition)} · #${esc(driver.number)} · ${esc(driver.displayName)}</option>`).join('')}</select>`,'Links this record to the assignment’s current driver number artwork. Future image changes then synchronize automatically.');
      }
      if(key==='results'&&k==='featuredDriver') {
        return `<label class="content-check admin-toggle"><input type="checkbox" ${attr} data-field-type="boolean" data-result-featured-driver ${v?'checked':''}><span><b>${esc(pretty)}</b><small>Use this driver for the large public result card. Selecting one clears the others in this race.</small></span></label>`;
      }
      if(key==='partners'&&k==='logo') {
        const preview=v?`<img class="portfolio-logo-preview" src="${esc(v)}" alt="Current partner logo preview">`:'';
        return shell(pretty,`${preview}<input ${attr} data-field-type="string" type="text" value="${esc(v)}" placeholder="https://… or upload a file below"><input type="file" accept="image/png,image/jpeg,image/webp" data-partner-logo-upload>`,'Paste an HTTPS/site-relative logo URL, or upload a PNG, JPG, or WebP. The published Partners page uses this exact image.','is-wide portfolio-logo-field');
      }
      if(key==='driver-portfolios'&&k==='logo') {
        const preview=v?`<img class="portfolio-logo-preview" src="${esc(v)}" alt="Current brand logo preview">`:'';
        return shell(pretty,`${preview}<input ${attr} data-field-type="string" type="text" value="${esc(v)}" placeholder="https://… or upload a file below"><input type="file" accept="image/png,image/jpeg,image/webp" data-portfolio-logo-upload data-logo-path="${esc(JSON.stringify(p))}">`,'Paste a direct HTTPS/site-relative image URL, or choose a PNG, JPG, or WebP file. Uploaded files are optimized and stored with this portfolio.','is-wide portfolio-logo-field');
      }
      if(key==='drivers'&&k==='numberImage') {
        const preview=v?`<img class="driver-number-preview" src="${esc(v)}" alt="Current number artwork preview">`:'';
        return shell(pretty,`${preview}<input ${attr} data-field-type="string" type="text" value="${esc(v)}" placeholder="Paste an image URL or upload below"><input type="file" accept="image/png,image/jpeg,image/webp" data-number-image-upload>`,'Upload a transparent PNG or WebP, or paste an image URL. This art replaces the large text number for this league assignment when you publish.','is-wide driver-number-field');
      }
      if(key==='charters'&&k==='numberImage') {
        const preview=v?`<img class="driver-number-preview" src="${esc(v)}" alt="Current charter number artwork preview">`:'';
        return shell(pretty,`${preview}<input ${attr} data-field-type="string" type="text" value="${esc(v)}" placeholder="Paste an image URL or upload below"><input type="file" accept="image/png,image/jpeg,image/webp" data-charter-number-image-upload data-number-path="${esc(JSON.stringify(p))}">`,'Upload transparent number art for this unsigned charter/number identity. It will appear on the public roster instead of the fallback text number.','is-wide driver-number-field');
      }
      if (Array.isArray(v) && (v.some((x)=>x && typeof x==='object') || arrayTemplate(k) || (key==='schedule-events'&&k==='entries'))) {
        const standingRows=key==='standings'&&k==='rows';
        const items=v.map((item,i)=>{
          const itemPath=[...p,i], pathAttr=esc(JSON.stringify(itemPath));
          const controls=standingRows?`<div class="standings-row-controls"><span class="standings-drag-handle" aria-hidden="true">⠿</span><button type="button" data-standing-move="-1" data-standing-path="${pathAttr}" ${i===0?'disabled':''}>↑ Move</button><button type="button" data-standing-move="1" data-standing-path="${pathAttr}" ${i===v.length-1?'disabled':''}>↓ Move</button><button type="button" class="standings-highlight-toggle ${item.highlight?'is-active':''}" data-standing-highlight data-standing-path="${pathAttr}" aria-pressed="${item.highlight?'true':'false'}">${item.highlight?'★ Highlighted':'☆ Highlight Driver'}</button></div>`:'';
          const drag=standingRows?` draggable="true" data-standing-drag="${pathAttr}"`:'';
          return `<details open${drag}><summary><span>${standingRows?'DRAG · ':''}${esc(pretty)} ${i+1}</span><small>${esc(title(item,i))}</small></summary>${controls}<div class="admin-nested-fields">${fields(item,itemPath)}</div><button class="admin-array-remove" type="button" data-array-remove="${pathAttr}">Remove ${esc(pretty)} ${i+1}</button></details>`;
        }).join('');
        const eventEntries=key==='schedule-events'&&k==='entries'&&path.length===0;
        const note=standingRows?'Drag rows into the public display order. Position labels do not auto-renumber, so partial standings can keep official positions such as P1, P2, P4.':eventEntries?'Choose Custom entry mode above to make this exact list public. Auto mode uses published result drivers after the race and the league roster before the race.':'Edit every nested item in this group.';
        const actions=eventEntries?`<div class="admin-array-actions"><button class="admin-array-add" type="button" data-array-add="${esc(JSON.stringify(p))}">+ Add event entry</button><button type="button" data-event-entries-fill-roster>Fill from league roster</button><button type="button" data-event-entries-sync-result>Use published result</button><button type="button" data-event-entries-clear>Clear custom list</button></div>`:`<button class="admin-array-add" type="button" data-array-add="${esc(JSON.stringify(p))}">+ Add ${esc(pretty)} item</button>`;
        return `<fieldset class="admin-fieldset ${standingRows?'is-standings-sortable':''}"><legend><span>${esc(pretty)}</span><small>${esc(help||note)}</small></legend><div class="admin-array" ${standingRows?'data-standings-sortable':''}>${items}</div>${actions}</fieldset>`;
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
      if (key==='driver-portfolios' && k==='profile') {
        const profiles=(base('roster-profiles')||seeds['roster-profiles']||[]).map((profile)=>[profile.slug,profile.name]);
        return shell(pretty,`<select ${attr} data-field-type="string" data-portfolio-profile-choice><option value="" ${!v?'selected':''}>Custom / external driver</option>${profiles.map(([id,name])=>`<option value="${esc(id)}" ${id===v?'selected':''}>${esc(name)} · ${esc(id)}</option>`).join('')}</select>`,'Linking a profile can fill the driver name and handle automatically. Choose Custom / external driver for someone outside the Driver Directory.');
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
      const inputType=typeof v==='number'?'number':(['dateIso','endDate'].includes(k)||(k==='date'&&key==='schedule-events'))?'date':(['url','logo','image','numberImage'].includes(k)||/ImageUrl$/i.test(k))?'url':'text';
      return shell(pretty,`<input ${attr} data-field-type="${typeof v==='number'?'number':v===null?'nullable':'string'}" type="${inputType}" ${typeof v==='number'?'step="any"':''} value="${esc(v)}">`,help);
    }).join('');
  }
  function title(row,i) { if(key==='drivers') return `${row.displayName||row.profile||'Driver'} · ${row.competition||'Choose league'}${row.number?` · #${row.number}`:''}`; if(key==='driver-portfolios')return `${row.name||'New driver'} · ${(row.brands||[]).length} brand${(row.brands||[]).length===1?'':'s'}`; return row.title||row.name||row.displayName||row.label||row.track||row.driver||row.id||row.slug||`Entry ${i+1}`; }
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
    data.push(scoreKnownResult({scheduleId:id,league:event.league,leagueName:event.leagueName||event.league,title:event.title||'',track:event.track||'',date:event.date||'',round:event.round||'',status:event.status||'',specialTag:event.specialTag||'',featured:data.length===0,headline:'',headlineAccent:'',summary:'',entries:[{assignmentId:first?.id||'',driver:first?.displayName||'',number:String(first?.number||''),start:0,stage1Finish:0,stage1Points:0,stage2Finish:0,stage2Points:0,finish:0,finishPoints:0,bonusPoints:0,pointsEligible:true,racePoints:0,featuredDriver:true}]}));
    data.sort(compareResults);index=data.findIndex((race)=>race.scheduleId===id);dirty=true;render();refreshResultsRaceOptions(id);
    status(`${event.title} loaded from the schedule. ${eligible.length} roster driver${eligible.length===1?' is':'s are'} eligible for this league.`);
  }
  function featureSelectedResult() {
    if(key!=='results'||!current())return;
    commit();data.forEach((race,i)=>{race.featured=i===index;});dirty=true;render();status(`${current().title} will be the current Latest Result after you publish.`);
  }
  const pageOverrideId=(page,type,original)=>{let hash=2166136261;for(const char of `${page}|${type}|${original}`){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return `${slugifyResultPart(page==='/'?'home':page)}-${type}-${(hash>>>0).toString(36)}`;};
  function refreshPageScanTool(){const tool=$('[data-page-scan-tool]');if(tool)tool.hidden=key!=='page-overrides';}
  async function scanPublicPage(){
    if(key!=='page-overrides'||!Array.isArray(data))return;
    let page=String($('[data-page-scan-path]').value||'/').trim();if(!page.startsWith('/'))page=`/${page}`;if(!page.endsWith('/')&&!/\.[a-z0-9]+$/i.test(page))page+='/';
    status(`Scanning ${page}…`);
    const response=await fetch(`${page}${page.includes('?')?'&':'?'}adminScan=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error(`Could not load ${page} (${response.status}).`);
    const doc=new DOMParser().parseFromString(await response.text(),'text/html');doc.querySelectorAll('script,style,noscript,svg,template').forEach((node)=>node.remove());
    const found=[],seen=new Set(),add=(type,label,original)=>{const clean=String(original||'').trim();if(!clean||clean.length>700)return;const signature=`${type}|${clean}`;if(seen.has(signature))return;seen.add(signature);found.push({id:pageOverrideId(page,type,clean),page,type,label:String(label||clean).slice(0,120),original:clean,value:clean,enabled:true});};
    const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT);let node;while((node=walker.nextNode())){const value=node.nodeValue?.replace(/\s+/g,' ').trim();if(value&&value.length>1)add('text',`Text: ${value.slice(0,80)}`,value);}
    doc.querySelectorAll('a[href]').forEach((anchor)=>add('link',`Link: ${(anchor.textContent||anchor.getAttribute('aria-label')||anchor.getAttribute('href')).trim().slice(0,90)}`,anchor.getAttribute('href')));
    doc.querySelectorAll('img[src]').forEach((img)=>add('image',`Image: ${img.getAttribute('alt')||img.getAttribute('src')}`,img.getAttribute('src')));
    const existing=new Set(data.map((item)=>`${item.page}|${item.type}|${item.original}`)),added=found.filter((item)=>!existing.has(`${item.page}|${item.type}|${item.original}`));data.push(...added);data.sort((a,b)=>String(a.page).localeCompare(String(b.page))||String(a.type).localeCompare(String(b.type))||String(a.label).localeCompare(String(b.label)));index=added.length?data.findIndex((item)=>item.id===added[0].id):Math.max(0,data.findIndex((item)=>item.page===page));dirty=dirty||added.length>0;render();status(added.length?`${added.length} new editable item${added.length===1?'':'s'} imported from ${page}. Review them, then publish.`:`${page} is already fully represented in Page Content.`);
  }
  function renderList() {
    const search=$('[data-content-search]').value.toLowerCase();
    $('[data-content-list]').innerHTML=Array.isArray(data)?data.map((r,i)=>({r,i})).filter(({r})=>JSON.stringify(r).toLowerCase().includes(search)).map(({r,i})=>`<button type="button" data-entry="${i}" aria-pressed="${i===index}"><strong>${esc(title(r,i))}</strong><small>${esc([r.leagueName||r.competition||r.category||'',r.date||r.numbers||r.slug||''].filter(Boolean).join(' · '))}</small></button>`).join(''):'<p>This section is one complete record. Edit its fields on the right.</p>';
    $('[data-content-add]').hidden=!Array.isArray(data);
    $('[data-content-add]').textContent=key==='schedule-events'?'Add race':key==='results'?'Choose race above':key==='driver-portfolios'?'Add driver portfolio':'Add new entry';
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
      const note=document.createElement('div');note.className='automatic-latest-result-note';note.textContent=row.featured?'✓ This is the automatic Latest Result because it is the newest completed event.':'Latest Result is automatic; a newer completed event is currently ahead of this result.';$('[data-content-fields]').prepend(note);
    }
    if(key==='standings'&&row)renderStandingsImportTool();
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
  function hideThemePreview() {
    const panel=$('[data-admin-theme-preview]');
    if(panel)panel.hidden=true;
  }
  function showOverview() {
    if(dirty&&!confirm('Leave unsaved changes in this tab?'))return;
    $('[data-admin-overview]').hidden=false;
    $('[data-content-editor]').hidden=true;
    hidePaintPanels();
    hideThemePreview();
    setActiveAdminTab('overview','overview');
    key='';data=null;dirty=false;
    window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  function chooseDataset(name) {
    key=name; standingsImportPreview=[]; data=structuredClone(base(key)); if(key==='charters')data=migrateCharters(data); index=0; dirty=false;
    if (key==='schedule-events') data=data.map((r)=>({offWeek:false,tbd:false,specialTag:'',round:'',entryListMode:'auto',...r,entries:normalizeScheduleEntries(r)})).sort(compareScheduleEvents);
    if(key==='results'){data=migrateResults(data).sort(compareResults);data=data.map((race,i)=>({...race,featured:i===0}));}
    if(key==='drivers')data=data.map((row)=>({numberImage:'',...row}));
    if(['wins','milestones'].includes(key))data=data.map((row)=>({assignmentId:'',...row}));
    const meta=datasetMeta[key]||{number:'EDIT',kicker:'CONTENT WORKSPACE',title:label(key),description:'Edit this content section.'};
    $('[data-content-number]').textContent=meta.number;
    $('[data-content-kicker]').textContent=meta.kicker;
    $('[data-content-title]').textContent=meta.title;
    $('[data-content-description]').textContent=meta.description;
    const select=$('[data-content-dataset]');
    if(select)select.value=key;
    render();refreshScheduleShiftTool();refreshResultsRaceOptions();refreshPageScanTool();
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
      hideThemePreview();
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
    hideThemePreview();
    const internal=document.querySelector(`[data-tab="${name}"]`);
    if(internal)internal.click();
    setActiveAdminTab('paint',name);
    document.querySelector(`[data-panel="${name}"]`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  function showThemePreview() {
    if(dirty&&!confirm('Leave unsaved changes in this content tab?'))return;
    dirty=false;key='';data=null;
    $('[data-admin-overview]').hidden=true;
    $('[data-content-editor]').hidden=true;
    hidePaintPanels();
    const panel=$('[data-admin-theme-preview]');
    if(panel)panel.hidden=false;
    setActiveAdminTab('theme','theme-preview');
    panel?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  }
  document.querySelectorAll('[data-content-module]').forEach((button)=>button.addEventListener('click',()=>openModule(button.dataset.contentModule)));
  document.querySelectorAll('[data-admin-dataset]').forEach((button)=>button.addEventListener('click',()=>openDatasetTab(button.dataset.adminDataset)));
  document.querySelectorAll('[data-admin-paint-tab]').forEach((button)=>button.addEventListener('click',()=>openPaintTab(button.dataset.adminPaintTab)));
  document.querySelector('[data-admin-tab="overview"]')?.addEventListener('click',showOverview);
  document.querySelector('[data-admin-tab="theme-preview"]')?.addEventListener('click',showThemePreview);
  $('[data-content-dataset]').addEventListener('change',(event)=>{ if(dirty&&!confirm('Leave unsaved section changes?')) {event.target.value=key;return;} openDatasetTab(event.target.value); });
  $('[data-shift-league]').addEventListener('change',()=>{populateShiftStarts();$('[data-shift-preview-panel]').hidden=true;shiftState.days=0;shiftState.indexes=[];});
  $('[data-shift-start]').addEventListener('change',()=>{$('[data-shift-preview-panel]').hidden=true;shiftState.days=0;shiftState.indexes=[];});
  document.querySelectorAll('[data-shift-preview]').forEach((button)=>button.addEventListener('click',()=>previewScheduleShift(Number(button.dataset.shiftPreview))));
  $('[data-shift-cancel]').addEventListener('click',()=>{$('[data-shift-preview-panel]').hidden=true;shiftState.days=0;shiftState.indexes=[];status('Bulk schedule preview cancelled. No dates were changed.');});
  $('[data-shift-apply]').addEventListener('click',applyScheduleShift);
  $('[data-shift-undo]').addEventListener('click',undoScheduleShift);
  $('[data-results-load-race]').addEventListener('click',loadSelectedResultRace);
  $('[data-page-scan]').addEventListener('click',()=>scanPublicPage().catch((error)=>status(error.message)));
  $('[data-content-search]').addEventListener('input',renderList);
  $('[data-content-list]').addEventListener('click',(event)=>{const button=event.target.closest('[data-entry]');if(button){commit();index=Number(button.dataset.entry);render();if(key==='results')refreshResultsRaceOptions(current()?.scheduleId||'');}});
  $('[data-content-form]').addEventListener('input',()=>{dirty=true;});
  $('[data-content-fields]').addEventListener('change',async(event)=>{
    const scoreField=event.target.closest?.('[data-field-path]');
    if(scoreField&&key==='results'&&['nrrs','uarl-d1'].includes(current()?.league)){
      const path=JSON.parse(scoreField.dataset.fieldPath||'[]'),field=path.at(-1);
      if(path[0]==='entries'&&['finish','stage1Finish','stage2Finish','bonusPoints','pointsEligible'].includes(field)){
        commit();const scored=scoreKnownResult(current());Object.keys(current()).forEach(k=>delete current()[k]);Object.assign(current(),scored);dirty=true;render();status('Finish, stage, and total race points recalculated for this league.');return;
      }
    }
    const numberUpload=event.target.closest?.('[data-number-image-upload]');
    if(numberUpload&&key==='drivers'){
      const file=numberUpload.files?.[0];if(!file)return;
      commit();const selected=current();
      try{status(`Optimizing ${file.name}…`);const numberArt=await uploadedNumberData(file);if(!data.includes(selected))throw new Error('The driver assignment changed during upload. Select it and upload again.');selected.numberImage=numberArt;dirty=true;if(current()===selected)render();status(`${file.name} is attached to #${selected.number}. Publish Driver League Assignments to update the site.`);}catch(error){status(error.message);}return;
    }
    const charterNumberUpload=event.target.closest?.('[data-charter-number-image-upload]');
    if(charterNumberUpload&&key==='charters'){
      const file=charterNumberUpload.files?.[0];if(!file)return;
      commit();const selected=current(),path=JSON.parse(charterNumberUpload.dataset.numberPath),target=valueAt(selected,path.slice(0,-1));
      try{status(`Optimizing ${file.name}…`);const numberArt=await uploadedNumberData(file);if(!data.includes(selected)||!target)throw new Error('The charter entry changed during upload. Select it and upload again.');target.numberImage=numberArt;dirty=true;if(current()===selected)render();status(`${file.name} is attached to charter #${target.number||''}. Publish Charter Boards to update the roster.`);}catch(error){status(error.message);}return;
    }
    const partnerLogoUpload=event.target.closest?.('[data-partner-logo-upload]');
    if(partnerLogoUpload&&key==='partners'){
      const file=partnerLogoUpload.files?.[0];if(!file)return;
      commit();const selected=current();
      try{status(`Optimizing ${file.name}…`);const logo=await uploadedLogoData(file);if(!data.includes(selected))throw new Error('The partner entry changed during upload. Select it and upload again.');selected.logo=logo;dirty=true;if(current()===selected)render();status(`${file.name} is attached to ${selected.name}. Publish Partners to update the public page.`);}catch(error){status(error.message);}return;
    }
    const logoUpload=event.target.closest?.('[data-portfolio-logo-upload]');
    if(logoUpload&&key==='driver-portfolios'){
      const file=logoUpload.files?.[0];if(!file)return;
      commit();const selected=current(),path=JSON.parse(logoUpload.dataset.logoPath),brand=valueAt(selected,path.slice(0,-1));
      try{status(`Optimizing ${file.name}…`);const logo=await uploadedLogoData(file);if(!data.includes(selected)||!selected.brands.includes(brand))throw new Error('The portfolio changed during upload. Select the brand and upload again.');brand.logo=logo;dirty=true;if(current()===selected)render();status(`${file.name} is attached to this brand. Publish this section to show it on the Partners page.`);}catch(error){status(error.message);}return;
    }
    const scheduleEntryDriver=event.target.closest?.('[data-schedule-entry-driver-choice]');
    if(scheduleEntryDriver&&key==='schedule-events'){
      const path=JSON.parse(scheduleEntryDriver.dataset.fieldPath),entry=valueAt(current(),path.slice(0,-1)),assignment=resultRoster(current()?.league||'').find((driver)=>driver.id===scheduleEntryDriver.value);
      entry.assignmentId=scheduleEntryDriver.value;entry.driver=assignment?.displayName||'';entry.number=String(assignment?.number||'');entry.entryStatus=entry.entryStatus||'Confirmed';current().entryListMode='custom';dirty=true;render();status(`${entry.driver} added to the custom entry list for ${current().title||'this event'}.`);return;
    }
    const resultDriver=event.target.closest?.('[data-result-driver-choice]');
    if(resultDriver&&key==='results'){
      const path=JSON.parse(resultDriver.dataset.fieldPath),entry=valueAt(current(),path.slice(0,-1)),assignment=resultRoster(current()?.league||'').find((driver)=>driver.id===resultDriver.value);
      entry.assignmentId=resultDriver.value;
      if(assignment){entry.driver=assignment.displayName||'';entry.number=String(assignment.number||'');status(`${entry.driver} selected from the ${current().leagueName} roster. Name and number stay synced to this assignment.`);}else{entry.driver='';entry.number='';status('External participant selected. Enter the official driver name and car number for this race.');}
      dirty=true;render();return;
    }
    const featuredDriver=event.target.closest?.('[data-result-featured-driver]');
    if(featuredDriver&&key==='results'&&featuredDriver.checked){
      const path=JSON.parse(featuredDriver.dataset.fieldPath),chosen=Number(path[1]);commit();current().entries.forEach((entry,i)=>{entry.featuredDriver=i===chosen;});dirty=true;render();status(`${current().entries[chosen]?.driver||'Driver'} will lead the public result card.`);return;
    }
    const historyDriver=event.target.closest?.('[data-history-driver-choice]');
    if(historyDriver&&['wins','milestones'].includes(key)){
      const assignment=(base('drivers')||seeds.drivers||[]).find((driver)=>driver.id===historyDriver.value);current().assignmentId=historyDriver.value;if(key==='wins'&&assignment){current().driver=assignment.displayName;current().league=assignment.competition;}dirty=true;render();status(assignment?`${assignment.displayName}'s #${assignment.number} number artwork is now linked to this ${key==='wins'?'win':'milestone'}.`:'Driver number artwork link removed.');return;
    }
    const portfolioProfile=event.target.closest?.('[data-portfolio-profile-choice]');
    if(portfolioProfile&&key==='driver-portfolios'){
      commit();const profile=(base('roster-profiles')||seeds['roster-profiles']||[]).find((item)=>item.slug===portfolioProfile.value);
      current().profile=portfolioProfile.value;
      if(profile){current().name=profile.name||current().name;current().handle=profile.handle||current().handle;}
      dirty=true;render();status(profile?`${profile.name} is linked. Their current public name and handle were filled in.`:'This portfolio can now use a custom driver name and handle.');return;
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
    const fillRoster=event.target.closest('[data-event-entries-fill-roster]');
    if(fillRoster&&key==='schedule-events'){commit();current().entries=scheduleRosterEntries(current());current().entryListMode='custom';dirty=true;render();status(`${current().entries.length} league roster entries copied into this event. Remove anyone who is not going.`);return;}
    const syncResult=event.target.closest('[data-event-entries-sync-result]');
    if(syncResult&&key==='schedule-events'){commit();const synced=scheduleResultEntries(current());if(!synced.length)return status('No published result exists for this event yet.');current().entries=synced;current().entryListMode='custom';dirty=true;render();status(`${synced.length} actual race driver${synced.length===1?'':'s'} copied from the published result.`);return;}
    const clearEntries=event.target.closest('[data-event-entries-clear]');
    if(clearEntries&&key==='schedule-events'){commit();current().entries=[];current().entryListMode='custom';dirty=true;render();status('Custom entry list cleared. Add only the drivers you want shown, or switch Entry List Mode back to Auto.');return;}
    const button=event.target.closest('[data-array-add],[data-array-remove]');if(!button)return;
    commit();
    if(button.dataset.arrayAdd){const path=JSON.parse(button.dataset.arrayAdd),arr=valueAt(current(),path);const scheduleEntries=key==='schedule-events'&&path.at(-1)==='entries';const template=arr[0]||arrayTemplate(path.at(-1))||(scheduleEntries?{assignmentId:'',driver:'',number:'',entryStatus:''}:{});const added=blank(template);if(scheduleEntries){const used=new Set(arr.map((entry)=>entry.assignmentId)),next=resultRoster(current()?.league||'').find((driver)=>!used.has(driver.id));if(next)Object.assign(added,scheduleEntryFromAssignment(next,'Confirmed'));current().entryListMode='custom';}if(key==='results'&&path.at(-1)==='entries'){const used=new Set(arr.map((entry)=>entry.assignmentId)),next=resultRoster(current()?.league||'').find((driver)=>!used.has(driver.id));if(next){added.assignmentId=next.id;added.driver=next.displayName;added.number=String(next.number||'');}added.featuredDriver=arr.length===0;}arr.push(added);}
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
  $('[data-content-add]').addEventListener('click',()=>{if(!Array.isArray(data))return;if(key==='results'){refreshResultsRaceOptions();$('[data-results-race-tool]').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});return status('Filter by league, choose the completed scheduled race, then select Load race results.');}commit();const added=blank(seeds[key][0]);if(key==='drivers')added.numberImage='';if(['wins','milestones'].includes(key))added.assignmentId='';if(key==='driver-portfolios'){added.id=`driver-${Date.now()}`;added.label='Driver Brand / Livery Portfolio';added.order=data.length+1;}if(key==='schedule-events'){added.entryListMode='auto';added.entries=[];}data.push(added);index=data.length-1;dirty=true;render();if(key==='schedule-events')status('New race added. Enter its league, date, and start time; Save Draft or Publish will automatically place it in chronological order.');if(key==='driver-portfolios')status('New driver portfolio added. Choose a Driver Directory profile or enter a custom name, then build their brand list and add logos by URL or file upload.');});
  $('[data-content-remove]').addEventListener('click',()=>{if(!Array.isArray(data)||!confirm('Remove this entry from the section draft? It stays public until you publish.'))return;commit();data.splice(index,1);index=Math.max(0,index-1);dirty=true;render();});
  async function action(name) {
    if(!loaded||!key)throw new Error('Open an editor first.');
    if(busy)throw new Error('A save is already in progress.');
    const autoPlaced=['saveDraft','publish'].includes(name)&&autoPlaceScheduleEvents();
    const autoLatest=['saveDraft','publish'].includes(name)&&autoPlaceResults();
    if(autoPlaced||autoLatest){render();refreshScheduleShiftTool();}
    busy=true;
    $('[data-content-editor]').inert=true;
    try {
      const response=await api(name,{dataset:key,...(['saveDraft','publish'].includes(name)?{data}: {})});
      registry=response.registry;dirty=false;
      if(name==='publish') {
        const publication=response.publication;
        if(key==='navigation') status(`Published revision ${publication?.revision||registry.revision}. Navigation is live data and will update on the public site without a rebuild${publication?.queued?' (a rebuild was also queued).':'.'}`);
        else status(publication?.queued
          ? `${autoPlaced?'Calendar sorted by date, start time, and league. ':''}Published revision ${publication.revision}. Public data is updated and the site rebuild is queued.`
          : `${autoPlaced?'Calendar sorted by date, start time, and league. ':''}Published revision ${publication?.revision||registry.revision}. Public data is updated, but the site rebuild was not queued: ${publication?.message||'use Publish site / retry build.'}`);
      } else status(response.publication?.message||(name==='saveDraft'?(autoPlaced?'Calendar sorted by date, start time, and league. Private draft saved; nothing public changed.':'Private draft saved. Nothing public changed.'):'Section updated.'));
      updateControlCenterStatus(response.publication);
    } finally { busy=false; $('[data-content-editor]').inert=false; }
  }
  $('[data-content-form]').addEventListener('submit',async(event)=>{event.preventDefault();commit();try{await action('saveDraft');}catch(error){status(error.message);}});
  $('[data-content-publish]').addEventListener('click',async()=>{
    commit();
    const prompt=key==='navigation'?`${dirty?'Save and publish the current navigation changes':'Publish this navigation section'}? The public menu reads these links live.`:`${dirty?'Save and publish the current changes':'Publish this section'} and rebuild the public site?`;
    if(!confirm(prompt))return;
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

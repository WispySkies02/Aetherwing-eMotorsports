const { allianceIdFor } = require('../../src/lib/alliances.mjs');
const { reconcileCurrentAssignments, reconcileCurrentProfiles } = require('../../src/lib/current-driver-updates.mjs');
const { manufacturerChoices, normalizeManufacturer, standingIdentity, normalizeStandingMetadata } = require('../../src/lib/standings-metadata.mjs');
const fs = require('node:fs');
const path = require('node:path');
let blobsModulePromise;
async function getBlobsModule() {
  blobsModulePromise ||= import('@netlify/blobs');
  return blobsModulePromise;
}
const FILES = ['site', 'navigation', 'page-overrides', 'schedule-events', 'results', 'wins', 'standings', 'milestones', 'roster-profiles', 'driver-profiles', 'drivers', 'charters', 'iracing-garage', 'competitions', 'leadership', 'alliances', 'partners', 'livery-brands', 'driver-portfolios', 'news'];
const SCHEDULE_LEAGUE_ORDER = ['nrrs','kmart','sunoco','uarl-d1','open','iracing','uarl-d2'];
function scheduleTimeMinutes(value='') {
  const match=String(value).trim().match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i);
  if(!match)return Number.MAX_SAFE_INTEGER;
  let hour=Number(match[1])%12;if(match[3].toUpperCase()==='PM')hour+=12;
  return hour*60+Number(match[2]||0);
}
function normalizeDriverAssignments(rows=[]) {
  const normalized=(rows||[]).flatMap((entry)=>{
    if(entry?.id!=='shared-kmart' && !(entry?.competitionId==='kmart' && String(entry?.number)==='29' && /Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.displayName||''))) return [entry];
    const common={number:'29',numberImage:entry.numberImage||'',numberImageBackup:entry.numberImageBackup||'',competition:entry.competition||'Kmart Auto Parts Series',competitionId:'kmart',status:entry.status||'Shared Part-Time Entry',affiliation:entry.affiliation||'alliance',...(Object.hasOwn(entry,'allianceId')?{allianceId:entry.allianceId}:{}),car:entry.car||'SCR #29 PT'};
    return [{...common,id:'clutch-kmart',profile:'clutch',displayName:'Clutch'},{...common,id:'eazy-kmart',profile:'eazy',displayName:'Eazy'},{...common,id:'matty-kmart',profile:'matty',displayName:'Matty'}];
  });
  const updated=reconcileCurrentAssignments(normalized);
  const shared29=updated.find((entry)=>entry?.competitionId==='kmart'&&String(entry?.number)==='29'&&entry?.numberImageBackup)||updated.find((entry)=>entry?.competitionId==='kmart'&&String(entry?.number)==='29'&&entry?.numberImage);
  if(!shared29)return updated.map((entry)=>entry?.profile==='wispy'?{...entry,profile:'hailey'}:entry);
  const sharedUpload=shared29.numberImageBackup||'';
  const sharedSource=shared29.numberImage||sharedUpload;
  return updated.map((entry)=>{const canonical=entry?.profile==='wispy'?{...entry,profile:'hailey'}:entry;return canonical?.competitionId==='kmart'&&String(canonical?.number)==='29'?{...canonical,numberImage:canonical.numberImage||sharedSource,numberImageBackup:canonical.numberImageBackup||sharedUpload}:canonical;});
}
function validNumberImage(value='') {
  return !value || /^(https:\/\/|\/)/.test(value) || (/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length<=160000);
}
function validLogoImage(value='') {
  return !value || /^(https:\/\/|\/)/.test(value) || /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(value);
}
function compareScheduleEvents(a,b) {
  const date=String(a?.date||'9999-12-31').localeCompare(String(b?.date||'9999-12-31'));
  if(date)return date;
  const time=scheduleTimeMinutes(a?.time)-scheduleTimeMinutes(b?.time);
  if(time)return time;
  const rank=(league)=>{const index=SCHEDULE_LEAGUE_ORDER.indexOf(league);return index===-1?SCHEDULE_LEAGUE_ORDER.length:index;};
  return rank(a?.league)-rank(b?.league)||String(a?.title||'').localeCompare(String(b?.title||''));
}
const UARL_FINISH_POINTS=[0,50,45,42,40,38,36,34,32,30,28,27,26,25,24,23,22];
function stagePointsFor(league,finish) {
  const pos=Number(finish||0);
  if(league==='nrrs')return pos>=1&&pos<=5?11-pos:0;
  if(['kmart','uarl-d1'].includes(league))return pos>=1&&pos<=5?6-pos:0;
  return null;
}
function finishPointsFor(league,finish) {
  const pos=Number(finish||0);if(pos<1)return 0;
  if(league==='nrrs')return pos===1?40:Math.max(1,37-pos);
  if(league==='kmart')return pos===1?55:Math.max(1,37-pos);
  if(league==='uarl-d1')return UARL_FINISH_POINTS[pos]||0;
  return null;
}
function scoreKnownRace(race={}) {
  if(['official-recap','official-result'].includes(race.pointsSource)||!['nrrs','kmart','uarl-d1'].includes(race.league)||!Array.isArray(race.entries))return race;
  return {...race,entries:race.entries.map((entry)=>{
    const stage1=stagePointsFor(race.league,entry.stage1Finish),stage2=stagePointsFor(race.league,entry.stage2Finish),finishPoints=finishPointsFor(race.league,entry.finish);
    const bonusPoints=Math.max(0,Number(entry.bonusPoints||0)||0),pointsEligible=entry.pointsEligible!==false;
    return {...entry,stage1Points:stage1,stage2Points:stage2,finishPoints,bonusPoints,pointsEligible,racePoints:pointsEligible?finishPoints+stage1+stage2+bonusPoints:0};
  })};
}
function normalize(key,data) {
  if(key==='alliances'&&Array.isArray(data))return data.map(row=>row&&typeof row==='object'?{...row,...(typeof row.name==='string'?{name:row.name.trim()}:{}),...(typeof row.shortName==='string'?{shortName:row.shortName.trim()}:{})}:row);
  if(key==='schedule-events'&&Array.isArray(data))return [...data].sort(compareScheduleEvents);
  if(key==='standings'&&Array.isArray(data))return data.map(normalizeStandingMetadata);
  if(key==='drivers'&&Array.isArray(data))return normalizeDriverAssignments(data);
  if(key==='roster-profiles'&&Array.isArray(data))return reconcileCurrentProfiles(data.map((profile)=>({signatureLogo:'',...profile,slug:profile?.slug==='wispy'?'hailey':profile?.slug})));
  if(key==='driver-profiles'&&Array.isArray(data))return data.map((profile)=>profile?.slug==='wispy'?{...profile,slug:'hailey'}:profile);
  if(key==='driver-portfolios'&&Array.isArray(data))return data.map((portfolio)=>portfolio?.profile==='wispy'?{...portfolio,profile:'hailey'}:portfolio);
  if(key==='results'&&Array.isArray(data)){const sorted=[...data].map(scoreKnownRace).sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||''))||String(a?.league||'').localeCompare(String(b?.league||''))||String(a?.title||'').localeCompare(String(b?.title||'')));return sorted.map((race,index)=>({...race,featured:index===0}));}
  return data;
}
function seeds() {
  return Object.fromEntries(FILES.map((key) => {
    const filename=[path.resolve(process.cwd(),`src/data/${key}.json`),path.resolve(__dirname,`../../src/data/${key}.json`),path.resolve(__dirname,`src/data/${key}.json`)].find((p)=>fs.existsSync(p));
    if (!filename) throw new Error(`Bundled seed is missing: ${key}`);
    return [key, JSON.parse(fs.readFileSync(filename, 'utf8'))];
  }));
}
const empty = () => ({ version: 1, revision: 0, published: {}, drafts: {}, history: [] });
async function store() {
  const { getStore } = await getBlobsModule();
  return getStore({ name: 'aetherwing-site-content', consistency: 'strong' });
}
async function read() {
  const contentStore = await store();
  const entry = await contentStore.getWithMetadata('content.json', { type: 'json' });
  return { registry: entry?.data || empty(), etag: entry?.etag };
}
async function write(registry, etag) {
  const contentStore = await store();
  const result = await contentStore.setJSON('content.json', registry, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
  if (result?.modified === false) throw new Error('CONFLICT');
  // Some Netlify Blobs SDK versions incorrectly report modified:true after a failed
  // conditional write (503/500), returning an empty ETag. Never claim a save landed
  // unless the provider supplies a real new ETag and a strong read confirms the bytes.
  if (result?.modified !== true || typeof result.etag !== 'string' || !result.etag.trim()) {
    console.error('site-content: conditional write was not acknowledged with an ETag');
    throw new Error('STORAGE_WRITE_UNVERIFIED');
  }
  const confirmed = await contentStore.getWithMetadata('content.json', { type:'json', consistency:'strong' });
  if (!confirmed || confirmed.etag !== result.etag || JSON.stringify(confirmed.data) !== JSON.stringify(registry)) {
    console.error('site-content: write acknowledgement did not match read-back');
    throw new Error('STORAGE_WRITE_UNVERIFIED');
  }
}
function validate(key, data, registry={}, context={}) {
  if (!FILES.includes(key)) return 'Unknown content section.';
  const seedData=seeds(),seed=seedData[key];
  if (Array.isArray(seed) !== Array.isArray(data) || !data || typeof data !== 'object') return 'Invalid section format.';
  if (JSON.stringify(data).length > (key==='driver-portfolios'?4000000:1500000)) return 'Section is too large.';
  if (Array.isArray(data) && data.length > 1500) return 'Too many entries.';
  if (['navigation','page-overrides','roster-profiles', 'driver-profiles', 'leadership', 'partners','livery-brands','driver-portfolios', 'news'].includes(key) && !data.length) return 'Keep at least one entry in this section.';
  const rows = Array.isArray(data) ? data : [];
  function unsafe(value, depth=0) {
    if (depth>20) return true;
    if (typeof value==='string') return /[<>]/.test(value);
    if (value && typeof value==='object') return Object.entries(value).some(([k,v])=>['__proto__','prototype','constructor'].includes(k)||unsafe(v,depth+1));
    return false;
  }
  if (unsafe(data)) return 'Use plain text without HTML or angle brackets.';
  function validPositionChange(value) {
    if(value==null)return true;
    if(typeof value==='number')return Number.isFinite(value);
    if(typeof value!=='string')return false;
    const text=value.trim();
    return ['', '-', '—', 'NEW'].includes(text.toUpperCase())||/^[▲▼]\s*\d+$/.test(text)||(/^[+-]?\d+(?:\.\d+)?$/.test(text)&&Number.isFinite(Number(text)));
  }
  function structure(sample,value,fieldPath=[]) {
    // Movement is a display value, not a points total. Existing publications
    // and CSV imports mix numbers with NEW, signed strings and neutral dashes.
    // Validate this union only on regular/Chase standings rows; retain strict
    // seed types for points and every other numeric field.
    if(key==='standings'&&fieldPath.length===4&&['rows','chaseRows'].includes(fieldPath[1])&&fieldPath[3]==='positionChange') {
      return validPositionChange(value);
    }
    if (sample===null || sample===undefined || value===null) return true;
    if (Array.isArray(sample)) return Array.isArray(value) && (!sample.length || value.every((v,index)=>structure(sample[0],v,[...fieldPath,index])));
    if (typeof sample==='object') return value && typeof value==='object' && !Array.isArray(value) && Object.entries(value).every(([k,v])=>structure(sample[k],v,[...fieldPath,k]));
    return typeof sample===typeof value && (typeof value!=='number'||Number.isFinite(value));
  }
  if (!structure(seed,data)) return 'A field has the wrong type. Use numeric inputs for points and finishes, and lists for grouped entries.';
  if (key==='schedule-events' && !data.length) return 'Keep at least one calendar entry.';
  // An approved event entry records the identity used at that event. A later
  // roster number/name change must not invalidate an unrelated calendar edit.
  // Drafts and the proposed publication cannot authorize their own exceptions.
  const approvedEventEntries=new Map();
  const snapshotEventKey=(event)=>{
    if(!event||typeof event.league!=='string')return null;
    const clean=v=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
    const explicit=clean(event.routeId||event.eventId),round=String(event.round||'').match(/\d+/);
    if(explicit||round)return JSON.stringify([event.league,explicit||`${clean(event.league)}-round-${Number(round[0])}`]);
    return JSON.stringify([event.league,event.date,event.title]);
  };
  const entrySnapshot=(entry)=>entry&&typeof entry==='object'&&!Array.isArray(entry)&&typeof entry.assignmentId==='string'&&entry.assignmentId.trim()&&typeof entry.driver==='string'&&entry.driver.trim()&&(typeof entry.number==='string'||typeof entry.number==='number'&&Number.isFinite(entry.number))
    ?JSON.stringify([entry.assignmentId,entry.driver,String(entry.number)]):null;
  if(key==='schedule-events'){
    const approved=Object.hasOwn(registry.published||{},'schedule-events')?registry.published['schedule-events']:seedData['schedule-events'];
    for(const event of Array.isArray(approved)?approved:[]){
      const identity=snapshotEventKey(event);if(!identity)continue;
      const signatures=approvedEventEntries.get(identity)||new Set();
      for(const entry of Array.isArray(event.entries)?event.entries:[]){const signature=entrySnapshot(entry);if(signature)signatures.add(signature);}
      approvedEventEntries.set(identity,signatures);
    }
  }
  const required = {
    navigation:['label','href','group'],'page-overrides':['id','page','type','label','original','value'],'schedule-events':['league','leagueName','title','track','date','time'], results:['scheduleId','league','leagueName','title','track','date'],
    wins:['league','track','driver','date'], milestones:['date','title','description'],
    'roster-profiles':['slug','name','role','affiliation','numbers'],
    'driver-profiles':['slug','displayName','subtitle','intro'],
    drivers:['id','profile','displayName','competitionId','competition','number','status'], competitions:['id','name','type','label','schedule','machine','platform'],
    alliances:['id','name'], standings:['id','title','league'], charters:['id','label'], leadership:['name'], partners:['name','role','description','url','logo'],'livery-brands':['name','order'],'driver-portfolios':['id','name','label','order'], news:['slug','title','summary','dateIso','date','category','context','kicker']
  }[key] || [];
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return `Entry ${index + 1} must be an object.`;
    for (const field of required) {
      const value=row[field];
      if ((typeof value==='string'&&!value.trim()) || (typeof value==='number'&&!Number.isFinite(value)) || !['string','number'].includes(typeof value)) return `Entry ${index + 1}: complete ${field}.`;
    }
    if(key==='alliances'){
      if(typeof row.id!=='string'||row.id.length>80||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id))return `Alliance ${index+1}: use a lowercase ID containing letters, numbers and hyphens (up to 80 characters).`;
      if(typeof row.name!=='string'||row.name.trim().length>120)return `Alliance ${index+1}: name must be plain text up to 120 characters.`;
      if(row.shortName!==undefined&&(typeof row.shortName!=='string'||row.shortName.trim().length>80))return `Alliance ${index+1}: short name must be plain text up to 80 characters.`;
    }
    if (row.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) return `Entry ${index + 1}: invalid slug.`;
    if (key === 'schedule-events') {
      if (typeof row.timePending!=='undefined' && typeof row.timePending!=='boolean')return 'Start time pending must be checked or unchecked.';
      if (typeof row.offWeek!=='undefined' && typeof row.offWeek!=='boolean') return 'Off-week must be checked or unchecked.';
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.league)) return 'Use a lowercase League ID containing letters, numbers, and hyphens.';
      if (!row.tbd && (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || Number.isNaN(Date.parse(row.date)))) return 'Use a valid YYYY-MM-DD event date.';
      if (row.entryListMode && !['auto','custom'].includes(row.entryListMode)) return `Entry ${index + 1}: entry list mode must be Auto or Custom.`;
      if (row.entryListMode==='custom') {
        if (!Array.isArray(row.entries)) return `Entry ${index + 1}: custom event entries must be a list.`;
        const roster=normalizeDriverAssignments(registry.drafts?.drivers??registry.published?.drivers??seedData.drivers),leagueId=row.league==='open'?'uarl-open':row.league==='iracing'?'iracing-factory':row.league;
        const eligible=new Map(roster.filter((driver)=>driver.competitionId===leagueId).map((driver)=>[driver.id,driver]));
        const approved=approvedEventEntries.get(snapshotEventKey(row));
        const seen=new Set();
        for (const eventEntry of row.entries) {
          const assignment=eligible.get(eventEntry?.assignmentId),signature=entrySnapshot(eventEntry),recorded=signature&&approved?.has(signature);
          if(!signature)return `Entry ${index + 1}: event entries need a text assignment ID and driver name, and a text or numeric car number.`;
          if(!recorded&&!assignment)return `Entry ${index + 1}: ${eventEntry?.driver||'an event driver'} is not assigned to ${row.leagueName} in Driver League Assignments.`;
          const id=eventEntry.assignmentId,name=assignment?.displayName||eventEntry.driver;
          if(seen.has(id))return `Entry ${index + 1}: ${name} can appear only once in the event entry list.`;
          seen.add(id);
          if(!recorded&&(eventEntry.driver!==assignment.displayName||String(eventEntry.number)!==String(assignment.number||'')))return `Entry ${index + 1}: ${assignment.displayName}'s event name and number must match Driver League Assignments.`;
        }
      }
    }
    if(key==='results'){
      if(row.pointsSource==='official-result'&&(typeof row.sourceNote!=='string'||!row.sourceNote.trim()||row.coverage!=='team-only'))return `Result ${index+1}: official team results need source notes and explicit team-only coverage.`;
      if(row.pointsSource==='official-recap'&&(typeof row.sourceUrl!=='string'||!/^\/news\/[a-z0-9-]+\/$/.test(row.sourceUrl)||row.coverage!=='team-only'))return `Result ${index+1}: recap-confirmed results need a source article and explicit team-only coverage.`;
      if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||Number.isNaN(Date.parse(row.date)))return `Result ${index+1}: select a valid scheduled race.`;
      if(!Array.isArray(row.entries)||!row.entries.length)return `Result ${index+1}: add at least one roster driver result.`;
      if(row.entries.filter((entry)=>entry.featuredDriver).length!==1)return `Result ${index+1}: choose exactly one featured driver.`;
      const roster=normalizeDriverAssignments(registry.drafts?.drivers??registry.published?.drivers??seeds().drivers),leagueId=row.league==='open'?'uarl-open':row.league==='iracing'?'iracing-factory':row.league;
      const eligible=new Map(roster.filter((driver)=>driver.competitionId===leagueId).map((driver)=>[driver.id,driver]));
      // Published history retains the identity recorded for that specific race.
      // Roster exits/number changes must not make an unchanged official result
      // unpublishable. This does not authorize stale assignments in new races.
      const historical=[...seed,...(registry.published?.results||[])].filter((race)=>race.scheduleId===row.scheduleId&&race.league===row.league&&race.date===row.date);
      const archive=['official-recap','official-result'].includes(row.pointsSource)&&row.coverage==='team-only'&&row.standingsMode==='record-only';
      for(const entry of row.entries){
        const assignment=entry.assignmentId?eligible.get(entry.assignmentId):null;
        const recorded=entry.assignmentId&&historical.some((race)=>race.entries?.some((prior)=>prior.assignmentId===entry.assignmentId&&prior.driver===entry.driver&&String(prior.number)===String(entry.number)));
        if(entry.assignmentId&&!assignment&&!recorded)return `Result ${index+1}: ${entry.driver||'a driver'} is not assigned to ${row.leagueName} in the Driver Roster.`;
        if(assignment&&!recorded&&(entry.driver!==assignment.displayName||String(entry.number)!==String(assignment.number||'')))return `Result ${index+1}: ${entry.driver}'s name and car number must match the Driver Roster.`;
        if(!assignment&&!String(entry.driver||'').trim())return `Result ${index+1}: external race participants need a driver name.`;
        if(Object.hasOwn(entry,'finishStatus')&&(!archive||entry.finishStatus!=='DNS'))return `Result ${index+1}: finish status is only DNS for an official, team-only historical record.`;
        if(entry.finishStatus==='DNS'&&entry.finish!==null)return `Result ${index+1}: ${entry.driver}'s DNS needs a blank finish, not a finishing position.`;
        if(entry.finishStatus==='DNS'&&entry.start!==null)return `Result ${index+1}: ${entry.driver}'s DNS needs a blank start; record qualifying separately.`;
        if(Object.hasOwn(entry,'qualifyingPosition')&&!(archive&&entry.qualifyingPosition===null)&&(!Number.isInteger(entry.qualifyingPosition)||entry.qualifyingPosition<1))return `Result ${index+1}: ${entry.driver} needs a positive integer qualifying position or an unreported historical value.`;
        for(const field of ['start','stage1Finish','stage1Points','stage2Finish','stage2Points','finish','racePoints']){
          const unknown=entry[field]===null&&(
            ['official-recap','official-result'].includes(row.pointsSource)&&['start','stage1Finish','stage1Points','stage2Finish','stage2Points'].includes(field)
            ||archive&&(field==='racePoints'||field==='finish'&&entry.finishStatus==='DNS')
          );
          if(!unknown&&(!Number.isFinite(entry[field])||entry[field]<0))return `Result ${index+1}: ${entry.driver} needs a non-negative numeric ${field}${field==='finish'?' (or an explicit historical DNS)':''}.`;
        }
        for(const field of ['finishPoints','bonusPoints'])if(Object.hasOwn(entry,field)&&entry[field]!==null&&(!Number.isFinite(entry[field])||entry[field]<0))return `Result ${index+1}: ${entry.driver} needs a non-negative numeric ${field}.`;
      }
      if(new Set(row.entries.map((entry)=>entry.driver)).size!==row.entries.length)return `Result ${index+1}: each driver can appear only once.`;
    }
    if (key === 'news' && (!/^\d{4}-\d{2}-\d{2}$/.test(row.dateIso) || !Array.isArray(row.sections) || !Array.isArray(row.tags) || row.sections.some((s) => !s.heading || !Array.isArray(s.paragraphs)))) return 'Stories need an ISO date, tags, and sections with headings and paragraphs.';
    if (key === 'roster-profiles' && !Array.isArray(row.programs)) return 'Driver programs must be a list.';
    if (key === 'roster-profiles' && !validLogoImage(row.signatureLogo||'')) return 'Driver signature logos must be uploaded PNG/JPG/WebP data, HTTPS URLs, or site-relative paths.';
    if (key === 'driver-profiles' && !Array.isArray(row.stats)) return 'Driver stats must be a list.';
    if (key === 'standings' && (!Array.isArray(row.rows) || row.rows.some((r) => !(r?.pointsPending===true && r?.points==null) && !Number.isFinite(r?.points)) || (Array.isArray(row.chaseRows) && row.chaseRows.some((r)=>!(r?.pointsPending===true && r?.points==null) && !Number.isFinite(r?.points))))) return 'Standings rows need numeric points (or an explicit pending placeholder before the first full-roster import).';
    if(key==='standings') {
      if(Object.hasOwn(row,'featuredOnHome')&&typeof row.featuredOnHome!=='boolean')return 'Standings featuredOnHome must be a true/false value.';
      if(Object.hasOwn(row,'homeTable')&&!['regular','chase'].includes(row.homeTable))return 'Homepage standings table must be regular or chase.';
      if(row.homeTable==='chase'&&!Array.isArray(row.chaseRows))return 'Homepage Chase points need a separate Chase standings list.';
      if(row.chaseRows!=null&&!Array.isArray(row.chaseRows))return 'Chase standings rows must be a list.';
      if([...row.rows,...(row.chaseRows||[])].some((entry)=>!validPositionChange(entry?.positionChange)))return 'Standings position change must be a finite number, signed number, NEW, or a dash.';
      if(row.ptEntry?.drivers!=null&&!Array.isArray(row.ptEntry.drivers))return 'Part-time standings drivers must be a list.';
      const entries=[...row.rows,...(row.chaseRows||[]),...(row.ptEntry?.drivers||[])],allowed=manufacturerChoices(row.league||row.id),champions=new Set();
      for(const entry of entries){
        if(!entry||typeof entry!=='object'||Array.isArray(entry))return 'Standings entries must be records.';
        for(const field of ['chaseLocked','regularSeasonChampion'])if(Object.hasOwn(entry,field)&&typeof entry[field]!=='boolean')return `Standings ${field} must be a true/false value.`;
        if(Object.hasOwn(entry,'manufacturer')){
          if(typeof entry.manufacturer!=='string'||entry.manufacturer.length>80)return 'Standings manufacturer must be text up to 80 characters, or blank for Auto.';
          const make=normalizeManufacturer(entry.manufacturer);
          if(make&&allowed.length&&!allowed.includes(make))return `Standings manufacturer must be ${allowed.join(', ')}, or blank for Auto in this league.`;
        }
        if(entry.regularSeasonChampion===true){const identity=standingIdentity(entry);if(!identity)return 'A regular-season champion needs a driver name.';champions.add(identity);}
      }
      if(champions.size>1)return 'Choose at most one regular-season champion per standings board.';
    }
    if (key === 'charters') {
      if(Object.hasOwn(row,'plannedSeasons')){
        if(!Array.isArray(row.plannedSeasons))return 'Planned charter seasons must be a list.';
        const allowed=new Set(['season','year','status','numbers','sourceDate','sourceNote']);
        for(const plan of row.plannedSeasons){
          if(!plan||typeof plan!=='object'||Array.isArray(plan)||Object.keys(plan).some(field=>!allowed.has(field)))return 'Planned charter seasons contain planning metadata only, without active slots or driver assignments.';
          if(!Number.isInteger(plan.season)||plan.season<1||!Number.isInteger(plan.year)||plan.year<1000||plan.year>9999||plan.status!=='planned')return 'Planned charter seasons need a positive season, four-digit year and planned status.';
          if(!Array.isArray(plan.numbers)||!plan.numbers.length||plan.numbers.some(number=>typeof number!=='string'||!/^\d{1,3}$/.test(number))||new Set(plan.numbers).size!==plan.numbers.length)return 'Planned charter numbers must be unique one-to-three-digit text values.';
          if(typeof plan.sourceDate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(plan.sourceDate)||Number.isNaN(Date.parse(plan.sourceDate))||new Date(plan.sourceDate).toISOString().slice(0,10)!==plan.sourceDate||typeof plan.sourceNote!=='string'||!plan.sourceNote.trim())return 'Planned charter seasons need a valid ISO source date and a plain-text source note.';
        }
      }
      if (!Array.isArray(row.fullTime) || !Array.isArray(row.openCharters)) return 'Charter boards need full-time entries and an Open Charters list.';
      if (row.fullTime.some((slot)=>slot?.numberImage && !validNumberImage(slot.numberImage))) return 'Full-time charter number images must be uploaded PNG/JPG/WebP data, HTTPS URLs, or site-relative paths.';
      for (const charter of row.openCharters) {
        if (!charter || typeof charter !== 'object' || !Array.isArray(charter.uses)) return 'Every Open Charter needs a Number identities / uses list.';
        if (charter.active !== false && !charter.uses.some((use) => use?.active !== false && String(use?.number || '').trim() && String(use?.label || '').trim())) return 'Every active Open Charter needs at least one active number identity with a number and usage label.';
        if (charter.uses.some((use) => use && ('driver' in use))) return 'Open Charter number identities must stay driver-neutral. Assign permanent drivers through full-time charters instead.';
        if (charter.uses.some((use)=>use?.numberImage && !validNumberImage(use.numberImage))) return 'Open Charter number images must be uploaded PNG/JPG/WebP data, HTTPS URLs, or site-relative paths.';
      }
    }
    if (key === 'leadership' && !Array.isArray(row.roles)) return 'Leadership entries need a roles list.';
    if (key === 'partners' && (!Array.isArray(row.tags) || !/^https:\/\//.test(row.url) || !validLogoImage(row.logo))) return 'Partners need an HTTPS website URL, an uploaded/HTTPS/site-relative logo, and a tags list.';
    if (key === 'driver-portfolios') {
      if (!Array.isArray(row.brands) || !row.brands.length) return `Driver portfolio ${index + 1}: add at least one brand.`;
      if (row.brands.some((brand) => !String(brand?.name || '').trim() || !Number.isFinite(brand?.order))) return `Driver portfolio ${index + 1}: every brand needs a name and numeric display order.`;
      if (row.brands.some((brand) => brand.sponsorTitle!==undefined && typeof brand.sponsorTitle!=='string')) return `Driver portfolio ${index + 1}: sponsor titles must be plain text or left blank.`;
      if (row.brands.some((brand) => !validLogoImage(brand.logo||''))) return `Driver portfolio ${index + 1}: logos must be an uploaded PNG/JPG/WebP, HTTPS URL, or site-relative path.`;
    }
    if(key==='navigation'&&!/^(\/|https:\/\/)/.test(row.href))return `Navigation entry ${index+1}: use a site-relative path or HTTPS URL.`;
    if(key==='page-overrides'){
      if(!['text','link','image'].includes(row.type))return `Page Content entry ${index+1}: choose text, link, or image.`;
      if(!row.page.startsWith('/'))return `Page Content entry ${index+1}: page must begin with /.`;
      if(['link','image'].includes(row.type)&&!/^((https:\/\/)|\/|#)/.test(row.value))return `Page Content entry ${index+1}: link and image replacements need an HTTPS URL, site-relative path, or anchor.`;
    }
    if(key==='drivers'&&!validNumberImage(row.numberImage))return `Entry ${index+1}: number image must be an uploaded PNG/JPG/WebP, HTTPS URL, or site-relative path.`;
    if(key==='drivers'&&row.numberImageBackup&&!validNumberImage(row.numberImageBackup))return `Entry ${index+1}: uploaded number-image fallback is invalid.`;
  }
  const identity = ['news','roster-profiles','driver-profiles'].includes(key) ? 'slug' : ['page-overrides','drivers','standings','charters','competitions','driver-portfolios','alliances'].includes(key) ? 'id' : null;
  if (identity && new Set(rows.map((r) => r[identity])).size !== rows.length) return `Each ${identity} must be unique.`;
  if(['alliances','drivers','roster-profiles','competitions'].includes(key)){
    // Draft validation may use related private drafts; publication must use the
    // complete candidate PUBLIC snapshot passed by the publishing action.
    const pick=name=>context.published?context.published[name]??seedData[name]:registry.drafts?.[name]??registry.published?.[name]??seedData[name];
    const alliances=key==='alliances'?data:pick('alliances');
    const known=new Set((Array.isArray(alliances)?alliances:[]).map(alliance=>alliance.id));
    const targets=key==='alliances'?['drivers','roster-profiles','competitions']:[key];
    const currentDrivers=key==='drivers'?data:pick('drivers');
    const recordedProfiles=[...(seedData['roster-profiles']||[]),...(registry.published?.['roster-profiles']||[])];
    for(const section of targets){
      const references=section===key?data:pick(section);
      for(const row of Array.isArray(references)?references:[]){
        const label=row.displayName||row.name||row.slug||row.id||'Entry';
        if(Object.hasOwn(row,'allianceId')&&typeof row.allianceId!=='string')return `${section}: ${label} needs a text alliance ID.`;
        const id=allianceIdFor(row),isAlliance=row.affiliation==='alliance'||row.type==='alliance';
        // A former driver's recorded organization is historical context, not an
        // active relationship that should prevent retiring the alliance.
        const historicalProfile=section==='roster-profiles'&&!(currentDrivers||[]).some(driver=>driver.profile===row.slug)&&recordedProfiles.some(prior=>prior.slug===row.slug&&allianceIdFor(prior)===id);
        if(historicalProfile)continue;
        if(isAlliance&&!id)return `${section}: ${label} must choose a named alliance or change its organization before saving.`;
        if(id&&!known.has(id))return key==='alliances'
          ? `Alliance ${id} is still used by ${section}: ${label}. ${context.published?'Publish reassigned current records first, or publish all related drafts together.':'Reassign or clear its current relationship before removing the alliance.'}`
          : `${section}: ${label} refers to unknown alliance ${id}. ${context.published?'Publish the alliance first, or publish all related saved drafts together.':'Add and save that alliance first.'}`;
      }
    }
  }
  if (key==='schedule-events') {
    const clean=(v)=>String(v||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
    const eventKey=(r)=>{const explicit=clean(r.routeId||r.eventId||'');if(explicit)return explicit;const league=clean(r.league||'event')||'event',round=String(r.round||'').match(/(\d+)/);return round?`${league}-round-${Number(round[1])}`:`${league}-${clean(r.date||'tbd')||'tbd'}`;};
    if(new Set(rows.map(eventKey)).size!==rows.length)return 'Two calendar entries would have the same stable Race Weekend route. Use a unique series/round or series/date identity.';
  }
  if(key==='standings'&&rows.filter(row=>row.featuredOnHome===true).length>1)return 'Choose at most one featured homepage standings board.';
  if (key === 'news' && rows.filter((r) => r.featured).length !== 1) return 'Choose exactly one featured Team Wire story.';
  if(key==='results'){
    if(!data.length)return 'Keep at least one race result.';
    if(data.filter((race)=>race.featured).length!==1)return 'The newest completed race must be the automatic Latest Result.';
    if(new Set(data.map((race)=>race.scheduleId)).size!==data.length)return 'Each scheduled race can have only one result record.';
  }
  if(key==='site'&&(!data.name||!/^https:\/\//.test(data.url)||!/^https:\/\//.test(data.discordUrl)))return 'Site Settings needs a name, HTTPS site URL, and HTTPS Discord URL.';
  if (key === 'iracing-garage' && !Array.isArray(data.entries)) return 'The iRacing garage needs an entries list.';
  return '';
}
function json(statusCode, data) { return { statusCode, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' }, body:JSON.stringify(data) }; }
module.exports = { FILES, seeds, read, write, validate, normalize, normalizeDriverAssignments, compareScheduleEvents, scoreKnownRace, json };

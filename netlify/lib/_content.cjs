const fs = require('node:fs');
const path = require('node:path');
let blobsModulePromise;
async function getBlobsModule() {
  blobsModulePromise ||= import('@netlify/blobs');
  return blobsModulePromise;
}
const FILES = ['site', 'navigation', 'page-overrides', 'schedule-events', 'results', 'wins', 'standings', 'milestones', 'roster-profiles', 'driver-profiles', 'drivers', 'charters', 'iracing-garage', 'competitions', 'leadership', 'partners', 'livery-brands', 'driver-portfolios', 'news'];
const SCHEDULE_LEAGUE_ORDER = ['nrrs','kmart','sunoco','uarl-d1','open','iracing','uarl-d2'];
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
  const rank=(league)=>{const index=SCHEDULE_LEAGUE_ORDER.indexOf(league);return index===-1?SCHEDULE_LEAGUE_ORDER.length:index;};
  return rank(a?.league)-rank(b?.league)||String(a?.title||'').localeCompare(String(b?.title||''));
}
function normalize(key,data) {
  if(key==='schedule-events'&&Array.isArray(data))return [...data].sort(compareScheduleEvents);
  if(key==='results'&&Array.isArray(data))return [...data].sort((a,b)=>String(b?.date||'').localeCompare(String(a?.date||''))||String(a?.league||'').localeCompare(String(b?.league||''))||String(a?.title||'').localeCompare(String(b?.title||'')));
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
}
function validate(key, data, registry={}) {
  if (!FILES.includes(key)) return 'Unknown content section.';
  const seed = seeds()[key];
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
  function structure(sample,value) {
    if (sample===null || sample===undefined || value===null) return true;
    if (Array.isArray(sample)) return Array.isArray(value) && (!sample.length || value.every((v)=>structure(sample[0],v)));
    if (typeof sample==='object') return value && typeof value==='object' && !Array.isArray(value) && Object.entries(value).every(([k,v])=>structure(sample[k],v));
    return typeof sample===typeof value && (typeof value!=='number'||Number.isFinite(value));
  }
  if (!structure(seed,data)) return 'A field has the wrong type. Use numeric inputs for points and finishes, and lists for grouped entries.';
  if (key==='schedule-events' && !data.length) return 'Keep at least one calendar entry.';
  const required = {
    navigation:['label','href','group'],'page-overrides':['id','page','type','label','original','value'],'schedule-events':['league','leagueName','title','track','date','time'], results:['scheduleId','league','leagueName','title','track','date'],
    wins:['league','track','driver','date'], milestones:['date','title','description'],
    'roster-profiles':['slug','name','role','affiliation','numbers'],
    'driver-profiles':['slug','displayName','subtitle','intro'],
    drivers:['id','profile','displayName','competitionId','competition','number','status'], competitions:['id','name','type','label','schedule','machine','platform'],
    standings:['id','title','league'], charters:['id','label'], leadership:['name'], partners:['name','role','description','url','logo'],'livery-brands':['name','order'],'driver-portfolios':['id','name','label','order'], news:['slug','title','summary','dateIso','date','category','context','kicker']
  }[key] || [];
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return `Entry ${index + 1} must be an object.`;
    for (const field of required) {
      const value=row[field];
      if ((typeof value==='string'&&!value.trim()) || (typeof value==='number'&&!Number.isFinite(value)) || !['string','number'].includes(typeof value)) return `Entry ${index + 1}: complete ${field}.`;
    }
    if (row.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) return `Entry ${index + 1}: invalid slug.`;
    if (key === 'schedule-events') {
      if (typeof row.offWeek!=='undefined' && typeof row.offWeek!=='boolean') return 'Off-week must be checked or unchecked.';
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.league)) return 'Use a lowercase League ID containing letters, numbers, and hyphens.';
      if (!row.tbd && (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || Number.isNaN(Date.parse(row.date)))) return 'Use a valid YYYY-MM-DD event date.';
    }
    if(key==='results'){
      if(!/^\d{4}-\d{2}-\d{2}$/.test(row.date)||Number.isNaN(Date.parse(row.date)))return `Result ${index+1}: select a valid scheduled race.`;
      if(!Array.isArray(row.entries)||!row.entries.length)return `Result ${index+1}: add at least one roster driver result.`;
      if(row.entries.filter((entry)=>entry.featuredDriver).length!==1)return `Result ${index+1}: choose exactly one featured driver.`;
      const roster=registry.drafts?.drivers??registry.published?.drivers??seeds().drivers,leagueId=row.league==='open'?'uarl-open':row.league==='iracing'?'iracing-factory':row.league;
      const eligible=new Map(roster.filter((driver)=>driver.competitionId===leagueId).map((driver)=>[driver.id,driver]));
      for(const entry of row.entries){
        const assignment=eligible.get(entry.assignmentId);
        if(!assignment)return `Result ${index+1}: ${entry.driver||'a driver'} is not assigned to ${row.leagueName} in the Driver Roster.`;
        if(entry.driver!==assignment.displayName||String(entry.number)!==String(assignment.number||''))return `Result ${index+1}: ${entry.driver}'s name and car number must match the Driver Roster.`;
        for(const field of ['start','stage1Finish','stage1Points','stage2Finish','stage2Points','finish','racePoints'])if(!Number.isFinite(entry[field])||entry[field]<0)return `Result ${index+1}: ${entry.driver} needs a non-negative numeric ${field}.`;
      }
      if(new Set(row.entries.map((entry)=>entry.driver)).size!==row.entries.length)return `Result ${index+1}: each driver can appear only once.`;
    }
    if (key === 'news' && (!/^\d{4}-\d{2}-\d{2}$/.test(row.dateIso) || !Array.isArray(row.sections) || !Array.isArray(row.tags) || row.sections.some((s) => !s.heading || !Array.isArray(s.paragraphs)))) return 'Stories need an ISO date, tags, and sections with headings and paragraphs.';
    if (key === 'roster-profiles' && !Array.isArray(row.programs)) return 'Driver programs must be a list.';
    if (key === 'driver-profiles' && !Array.isArray(row.stats)) return 'Driver stats must be a list.';
    if (key === 'standings' && (!Array.isArray(row.rows) || row.rows.some((r) => !Number.isFinite(r.points)))) return 'Standings rows need numeric points.';
    if (key === 'charters') {
      if (!Array.isArray(row.fullTime) || !Array.isArray(row.openCharters)) return 'Charter boards need full-time entries and an Open Charters list.';
      for (const charter of row.openCharters) {
        if (!charter || typeof charter !== 'object' || !Array.isArray(charter.uses)) return 'Every Open Charter needs a Number identities / uses list.';
        if (charter.active !== false && !charter.uses.some((use) => use?.active !== false && String(use?.number || '').trim() && String(use?.label || '').trim())) return 'Every active Open Charter needs at least one active number identity with a number and usage label.';
        if (charter.uses.some((use) => use && ('driver' in use))) return 'Open Charter number identities must stay driver-neutral. Assign permanent drivers through full-time charters instead.';
      }
    }
    if (key === 'leadership' && !Array.isArray(row.roles)) return 'Leadership entries need a roles list.';
    if (key === 'partners' && (!Array.isArray(row.tags) || !/^https:\/\//.test(row.url) || !/^https:\/\//.test(row.logo))) return 'Partners need HTTPS website/logo URLs and a tags list.';
    if (key === 'driver-portfolios') {
      if (!Array.isArray(row.brands) || !row.brands.length) return `Driver portfolio ${index + 1}: add at least one brand.`;
      if (row.brands.some((brand) => !String(brand?.name || '').trim() || !Number.isFinite(brand?.order))) return `Driver portfolio ${index + 1}: every brand needs a name and numeric display order.`;
      if (row.brands.some((brand) => brand.logo && !/^(https:\/\/|\/|data:image\/(?:png|jpeg|webp);base64,)/.test(brand.logo))) return `Driver portfolio ${index + 1}: logos must be an uploaded PNG/JPG/WebP, HTTPS URL, or site-relative path.`;
    }
    if(key==='navigation'&&!/^(\/|https:\/\/)/.test(row.href))return `Navigation entry ${index+1}: use a site-relative path or HTTPS URL.`;
    if(key==='page-overrides'){
      if(!['text','link','image'].includes(row.type))return `Page Content entry ${index+1}: choose text, link, or image.`;
      if(!row.page.startsWith('/'))return `Page Content entry ${index+1}: page must begin with /.`;
      if(['link','image'].includes(row.type)&&!/^((https:\/\/)|\/|#)/.test(row.value))return `Page Content entry ${index+1}: link and image replacements need an HTTPS URL, site-relative path, or anchor.`;
    }
    if(key==='drivers'&&row.numberImage&&!(/^(https:\/\/|\/)/.test(row.numberImage)||(/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(row.numberImage)&&row.numberImage.length<=160000)))return `Entry ${index+1}: number image must be an uploaded PNG/JPG/WebP, HTTPS URL, or site-relative path.`;
  }
  const identity = ['news','roster-profiles','driver-profiles'].includes(key) ? 'slug' : ['page-overrides','drivers','standings','charters','competitions','driver-portfolios'].includes(key) ? 'id' : null;
  if (identity && new Set(rows.map((r) => r[identity])).size !== rows.length) return `Each ${identity} must be unique.`;
  if (key==='schedule-events') {
    const eventKey=(r)=>`${r.date}-${r.league}-${r.title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()}`;
    if(new Set(rows.map(eventKey)).size!==rows.length)return 'Two calendar entries would have the same share route. Change the date, league, or title.';
  }
  if (key === 'news' && rows.filter((r) => r.featured).length !== 1) return 'Choose exactly one featured Team Wire story.';
  if(key==='results'){
    if(!data.length)return 'Keep at least one race result.';
    if(data.filter((race)=>race.featured).length!==1)return 'Choose exactly one race as the current latest result.';
    if(new Set(data.map((race)=>race.scheduleId)).size!==data.length)return 'Each scheduled race can have only one result record.';
  }
  if(key==='site'&&(!data.name||!/^https:\/\//.test(data.url)||!/^https:\/\//.test(data.discordUrl)))return 'Site Settings needs a name, HTTPS site URL, and HTTPS Discord URL.';
  if (key === 'iracing-garage' && !Array.isArray(data.entries)) return 'The iRacing garage needs an entries list.';
  return '';
}
function json(statusCode, data) { return { statusCode, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' }, body:JSON.stringify(data) }; }
module.exports = { FILES, seeds, read, write, validate, normalize, compareScheduleEvents, json };

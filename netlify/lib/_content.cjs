const fs = require('node:fs');
const path = require('node:path');
let blobsModulePromise;
async function getBlobsModule() {
  blobsModulePromise ||= import('@netlify/blobs');
  return blobsModulePromise;
}
const FILES = ['schedule-events', 'results', 'wins', 'standings', 'milestones', 'roster-profiles', 'driver-profiles', 'drivers', 'charters', 'iracing-garage', 'competitions', 'news'];
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
function validate(key, data) {
  if (!FILES.includes(key)) return 'Unknown content section.';
  const seed = seeds()[key];
  if (Array.isArray(seed) !== Array.isArray(data) || !data || typeof data !== 'object') return 'Invalid section format.';
  if (JSON.stringify(data).length > 1500000) return 'Section is too large.';
  if (Array.isArray(data) && data.length > 1500) return 'Too many entries.';
  if (['roster-profiles', 'driver-profiles', 'news'].includes(key) && !data.length) return 'Keep at least one entry in this section.';
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
    'schedule-events':['league','leagueName','title','track','date','time'],
    wins:['league','track','driver','date'], milestones:['date','title','description'],
    'roster-profiles':['slug','name','role','affiliation','numbers'],
    'driver-profiles':['slug','displayName','subtitle','intro'],
    drivers:['id','profile','displayName','competitionId','competition','number','status'], competitions:['id','name','type','label','schedule','machine','platform'],
    standings:['id','title','league'], charters:['id','label'], news:['slug','title','summary','dateIso','date','category','context','kicker']
  }[key] || [];
  for (const [index, row] of rows.entries()) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return `Entry ${index + 1} must be an object.`;
    for (const field of required) if (typeof row[field] !== 'string' || !row[field].trim()) return `Entry ${index + 1}: complete ${field}.`;
    if (row.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)) return `Entry ${index + 1}: invalid slug.`;
    if (key === 'schedule-events') {
      if (typeof row.offWeek!=='undefined' && typeof row.offWeek!=='boolean') return 'Off-week must be checked or unchecked.';
      if (!['nrrs','uarl-d1','uarl-d2','open','kmart','sunoco','iracing'].includes(row.league)) return 'Select an existing schedule league to preserve its color.';
      if (!row.tbd && (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) || Number.isNaN(Date.parse(row.date)))) return 'Use a valid YYYY-MM-DD event date.';
    }
    if (key === 'news' && (!/^\d{4}-\d{2}-\d{2}$/.test(row.dateIso) || !Array.isArray(row.sections) || !Array.isArray(row.tags) || row.sections.some((s) => !s.heading || !Array.isArray(s.paragraphs)))) return 'Stories need an ISO date, tags, and sections with headings and paragraphs.';
    if (key === 'roster-profiles' && !Array.isArray(row.programs)) return 'Driver programs must be a list.';
    if (key === 'driver-profiles' && !Array.isArray(row.stats)) return 'Driver stats must be a list.';
    if (key === 'standings' && (!Array.isArray(row.rows) || row.rows.some((r) => !Number.isFinite(r.points)))) return 'Standings rows need numeric points.';
    if (key === 'charters' && (!Array.isArray(row.fullTime) || !row.openCharter?.partTime || !row.openCharter?.development)) return 'Charters need full-time entries and both Open Charter uses.';
  }
  const identity = ['news','roster-profiles','driver-profiles'].includes(key) ? 'slug' : ['drivers','standings','charters','competitions'].includes(key) ? 'id' : null;
  if (identity && new Set(rows.map((r) => r[identity])).size !== rows.length) return `Each ${identity} must be unique.`;
  if (key==='schedule-events') {
    const eventKey=(r)=>`${r.date}-${r.league}-${r.title.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase()}`;
    if(new Set(rows.map(eventKey)).size!==rows.length)return 'Two calendar entries would have the same share route. Change the date, league, or title.';
  }
  if (key === 'news' && rows.filter((r) => r.featured).length !== 1) return 'Choose exactly one featured Team Wire story.';
  if (key === 'results' && (!data.latestResult || !Number.isFinite(data.latestResult.start) || !Number.isFinite(data.latestResult.finish) || !Number.isFinite(data.latestResult.stagePoints) || !data.latestResult.title || !data.latestResult.track || !data.latestResult.driver || Number.isNaN(Date.parse(data.latestResult.date)))) return 'Latest result needs a driver, title, track, valid date, numeric start, finish, and stage points.';
  if (key === 'iracing-garage' && !Array.isArray(data.entries)) return 'The iRacing garage needs an entries list.';
  return '';
}
function json(statusCode, data) { return { statusCode, headers: { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', 'x-content-type-options':'nosniff' }, body:JSON.stringify(data) }; }
module.exports = { FILES, seeds, read, write, validate, json };

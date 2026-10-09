import fs from 'node:fs';
const target = new URL('../src/data/admin-content.json', import.meta.url);
const configured = process.env.AETHERWING_CONTENT_URL;
const endpoint = configured || (process.env.NETLIFY ? 'https://aetherwing.net/api/site-content' : '');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchPublishedContent(value) {
  let lastError;
  for (let attempt=0; attempt<4; attempt++) {
    const url = new URL(value);
    url.searchParams.set('admin_sync', `${Date.now()}-${attempt}`);
    try {
      const response = await fetch(url, {
        headers:{ accept:'application/json', 'cache-control':'no-cache' },
        signal:AbortSignal.timeout(15000)
      });
      if (response.status === 404 && !configured) return { firstDeployment:true };
      if (!response.ok) throw new Error(`Content sync returned ${response.status}.`);
      return { content:await response.json() };
    } catch (error) {
      lastError=error;
      if (attempt<3) await wait(750 * (attempt + 1));
    }
  }
  throw lastError;
}



function ensureCoreTeamPartners(rows=[],seedPartners=[]){
  const list=Array.isArray(rows)?[...rows]:[];
  for(const name of ['Palmetto Gaming','Apex Sim Racing']){
    const canonical=(seedPartners||[]).find((item)=>item?.name===name);
    if(!canonical)continue;
    const index=list.findIndex((item)=>item?.name===name);
    if(index===-1)list.push({...canonical});
    else if(name==='Palmetto Gaming'&&/hailey|personal/i.test(String(list[index]?.role||'')))list[index]={...canonical};
  }
  const order=new Map(['Palmetto Gaming','Apex Sim Racing'].map((name,index)=>[name,index]));
  return list.sort((a,b)=>(order.get(a?.name)??99)-(order.get(b?.name)??99));
}

async function canonicalizeBuildContent(payload){
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  const { seeds, normalize, normalizeDriverAssignments } = require('../netlify/lib/_content.cjs');
  const seed=seeds();
  const next={...payload,datasets:{...(payload?.datasets||{})}};
  const d=next.datasets;

  // Build-time pages must never resurrect retired roster/manufacturer data from an older
  // Admin publication. Results and standings remain fully authoritative Admin datasets.
  const canonDrivers=(rows=[])=>normalizeDriverAssignments(rows)
    .filter((entry)=>!(entry?.competitionId==='kmart'&&entry?.profile==='jaxon'))
    .map((entry)=>{
      if(entry?.competitionId!=='uarl-d1')return entry;
      const key=String(entry?.profile||entry?.displayName||'').toLowerCase();
      if(key==='hailey')return {...entry,number:'28',displayName:'Hailey'};
      if(key==='burgertown2good')return {...entry,number:'32',displayName:'BurgerTown2Good'};
      if(key==='gk3r')return {...entry,number:'42',displayName:'GK3R'};
      if(key==='rocky')return {...entry,number:'46',displayName:'Rocky'};
      return entry;
    });
  if(Array.isArray(d.drivers))d.drivers=canonDrivers(d.drivers);
  if(Array.isArray(d['roster-profiles']))d['roster-profiles']=normalize('roster-profiles',d['roster-profiles']).map((profile)=>profile?.slug==='jaxon'?{...profile,...(seed['roster-profiles']||[]).find((item)=>item.slug==='jaxon')}:profile);
  if(Array.isArray(d['driver-profiles']))d['driver-profiles']=normalize('driver-profiles',d['driver-profiles']);
  if(Array.isArray(d.charters)){
    const current=(seed.charters||[]).find((board)=>board.id==='uarl-d1');
    d.charters=d.charters.map((board)=>board?.id==='uarl-d1'&&current?{...board,fullTime:current.fullTime,openCharters:current.openCharters}:board);
  }
  if(Array.isArray(d.competitions)){
    const current=new Map((seed.competitions||[]).map((item)=>[item.id,item]));
    d.competitions=d.competitions.filter((item)=>item?.id!=='uarl-d2').map((item)=>['uarl-d1','kmart'].includes(item?.id)?current.get(item.id)||item:item);
  }
  d.partners=ensureCoreTeamPartners(Array.isArray(d.partners)?d.partners:[],seed.partners||[]);
  if(Array.isArray(d['driver-portfolios']))d['driver-portfolios']=normalize('driver-portfolios',d['driver-portfolios']);
  if(Array.isArray(d['schedule-events']))d['schedule-events']=normalize('schedule-events',d['schedule-events'].filter((event)=>event?.league!=='uarl-d2'));
  if(Array.isArray(d.results))d.results=normalize('results',d.results);
  // Do not seed-repair standings here. A published standings board is authoritative.
  return next;
}

function readBundledOverlay() {
  try {
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (parsed && parsed.datasets && typeof parsed.datasets === 'object') return parsed;
  } catch {}
  return { version:1, revision:0, datasets:{} };
}

let content = await canonicalizeBuildContent(readBundledOverlay());
if (endpoint) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Content endpoint must use HTTPS.');
  try {
    const result = await fetchPublishedContent(url);
    if (result.firstDeployment) {
      console.log('First deployment: using bundled site content.');
    } else {
      const next = result.content;
      if (!next.datasets || typeof next.datasets !== 'object') throw new Error('Invalid published content feed.');
      const { createRequire } = await import('node:module');
      const { validate } = createRequire(import.meta.url)('../netlify/lib/_content.cjs');
      for (const [key,data] of Object.entries(next.datasets)) {
        const error = validate(key,data);
        if (error) throw new Error(`${key}: ${error}`);
      }
      content = await canonicalizeBuildContent(next);
    }
  } catch (error) {
    if (configured) throw error;
    console.warn(`WARNING: Published content sync unavailable (${error?.message || error}). Continuing with bundled/last-known content.`);
  }
}
fs.writeFileSync(target, `${JSON.stringify(content,null,2)}\n`);
console.log(`Site content revision ${content.revision || 0} prepared.`);

const { read, json, normalizeDriverAssignments, seeds, normalize } = require('./_content.cjs');
function replaceFullCirclePartner(value){
  if(Array.isArray(value))return value.map(replaceFullCirclePartner);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,replaceFullCirclePartner(child)]));
  return typeof value==='string'?value.replace(/Pokémon|Pokemon/g,'Ironmouse'):value;
}
function ensurePalmettoTeamPartner(rows=[],seedPartners=[]){
  const list=Array.isArray(rows)?[...rows]:[];
  const canonical=(seedPartners||[]).find((item)=>item?.name==='Palmetto Gaming');
  if(!canonical)return list;
  const index=list.findIndex((item)=>item?.name==='Palmetto Gaming');
  if(index===-1){list.unshift(canonical);return list;}
  if(/hailey|personal/i.test(String(list[index]?.role||'')))list[index]={...canonical};
  return list;
}

function mergeCanonical(datasets){
  const seed=seeds();
  if(Array.isArray(datasets.news))datasets.news=datasets.news.map((story)=>{if(story?.slug!=='hailey-bell-to-step-back-from-full-time-competition-after-season-4')return story;const normalized=replaceFullCirclePartner(story),text=JSON.stringify(normalized);const fresh=(seed.news||[]).find((item)=>item?.slug===story.slug);if(!fresh)return normalized;if(!/FULL HEART/i.test(text)||/FULL CIRCLE/i.test(text))return fresh;return {...normalized,socialImage:(!normalized.socialImage||/full-heart-tour-2027-logo\.jpg$/i.test(normalized.socialImage))?fresh.socialImage:normalized.socialImage,articleLogo:normalized.articleLogo||fresh.articleLogo,embedDescription:normalized.embedDescription||fresh.embedDescription};});
  if(Array.isArray(datasets.news)){const scrSlug='hailey-bell-joins-starclutch-racing-nrrs-season-4',fresh=(seed.news||[]).find((story)=>story?.slug===scrSlug);datasets.news=datasets.news.map((story)=>{if(story?.slug!==scrSlug||!fresh)return story;const serialized=JSON.stringify(story);return /one of her personal partners|Hailey personal partner|relationship follows Bell/i.test(serialized)||story?.contentRevision!==fresh.contentRevision?fresh:story;});}
  if(Array.isArray(datasets.news)){const currentSlug='talladega-leaves-bell-frustrated-championship-gap-grows',fresh=(seed.news||[]).find((story)=>story?.slug===currentSlug);let hadCurrent=false;datasets.news=datasets.news.map((story)=>{if(story?.slug!==currentSlug)return story;hadCurrent=true;return fresh&&story?.contentRevision!==fresh.contentRevision?fresh:story;});if(!hadCurrent&&fresh)datasets.news.push(fresh);if(!hadCurrent)datasets.news=datasets.news.map((story)=>({...story,featured:story?.slug===currentSlug}));}
  if(Array.isArray(datasets['schedule-events'])){
    const scheduleSeedByKey=new Map((seed['schedule-events']||[]).map(e=>[`${e.date}|${e.league}|${e.title}`,e]));
    datasets['schedule-events']=datasets['schedule-events'].filter(e=>e?.league!=='uarl-d2').map(e=>{
      if(e?.league==='nrrs'&&e?.date==='2026-09-22')return {...e,title:'North Wilkesboro Speedway (Chase Race 2)',track:'North Wilkesboro Speedway',status:'The Chase',round:'ROUND 21',time:'7:30 PM ET'};
      
      if(e?.league==='iracing'&&e?.title==='Bathurst 1000'&&e?.date==='2026-10-02'){const fresh=scheduleSeedByKey.get(`${e.date}|${e.league}|${e.title}`)||{};return {...e,startAt:fresh.startAt,endAt:fresh.endAt};}
      return e;
    });
  }
  if(Array.isArray(datasets.results))datasets.results=normalize('results',datasets.results);
  // Published standings are authoritative. Historical repair migrations belong at release time,
  // never in the live read path, or fresh Admin edits can be silently replaced by bundled seeds.
  const canonDrivers=(rows=[])=>normalizeDriverAssignments(rows).filter(e=>!(e?.competitionId==='kmart'&&e?.profile==='jaxon')).map(e=>{if(e?.competitionId!=='uarl-d1')return e;const k=String(e?.profile||e?.displayName||'').toLowerCase();if(k==='hailey')return {...e,number:'28',displayName:'Hailey'};if(k==='burgertown2good')return {...e,number:'32'};if(k==='gk3r')return {...e,number:'42',displayName:'GK3R'};if(k==='rocky')return {...e,number:'46'};return e;});
  if(Array.isArray(datasets.drivers))datasets.drivers=canonDrivers(datasets.drivers);
  if(Array.isArray(datasets['roster-profiles']))datasets['roster-profiles']=normalize('roster-profiles',datasets['roster-profiles']).map(p=>p?.slug==='jaxon'?{...p,...(seed['roster-profiles']||[]).find(x=>x.slug==='jaxon')}:p);
  if(Array.isArray(datasets['driver-profiles']))datasets['driver-profiles']=normalize('driver-profiles',datasets['driver-profiles']);
  if(Array.isArray(datasets.charters)){const fresh=(seed.charters||[]).find(b=>b.id==='uarl-d1');datasets.charters=datasets.charters.map(b=>b?.id==='uarl-d1'&&fresh?{...b,fullTime:fresh.fullTime,openCharters:fresh.openCharters}:b);}
  if(Array.isArray(datasets.competitions)){const fresh=new Map((seed.competitions||[]).map(x=>[x.id,x]));datasets.competitions=datasets.competitions.filter(x=>x?.id!=='uarl-d2').map(x=>['uarl-d1','kmart'].includes(x?.id)?fresh.get(x.id)||x:x);}
  if(Array.isArray(datasets.partners))datasets.partners=ensurePalmettoTeamPartner(datasets.partners,seed.partners||[]);else datasets.partners=ensurePalmettoTeamPartner([],seed.partners||[]);
  if(Array.isArray(datasets['driver-portfolios']))datasets['driver-portfolios']=normalize('driver-portfolios',datasets['driver-portfolios']);
  return datasets;
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error:'Method not allowed.' });
  try {
    const { registry } = await read();
    const datasets=mergeCanonical({...registry.published});
    if(Array.isArray(datasets.drivers))datasets.drivers=normalizeDriverAssignments(datasets.drivers);
    if(Array.isArray(datasets.results))datasets.results=datasets.results.map((race)=>({...race,entries:(race.entries||[]).map((entry)=>entry?.assignmentId==='shared-kmart'||(String(entry?.number)==='29'&&/Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.driver||''))?{...entry,assignmentId:'',driver:'Part-Time Entry'}:entry)}));
    const response=json(200, { version:1, revision:registry.revision, datasets });
    response.headers={...response.headers,'access-control-allow-origin':'https://paint.aetherwing.net','vary':'Origin'};
    return response;
  } catch (error) {
    console.error('site-data', error);
    return json(503, { error:'Published site content is temporarily unavailable.' });
  }
};

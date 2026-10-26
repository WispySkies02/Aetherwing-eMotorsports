const { reconcileTeamPartners } = require('../../src/lib/team-partner-content.mjs');
const { read, json, normalizeDriverAssignments, seeds, normalize } = require('./_content.cjs');
const { appendReviewedResults } = require('../../src/lib/reviewed-results.mjs');
function replaceFullCirclePartner(value){
  if(Array.isArray(value))return value.map(replaceFullCirclePartner);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,replaceFullCirclePartner(child)]));
  return typeof value==='string'?value.replace(/Pokémon|Pokemon/g,'Ironmouse'):value;
}
function ensureCoreTeamPartners(rows=[],seedPartners=[]){
  return reconcileTeamPartners(rows,seedPartners,['Palmetto Gaming','Apex Sim Racing']);
}

function mergeCanonical(datasets){
  const seed=seeds();
  if(Array.isArray(datasets.news))datasets.news=datasets.news.map((story)=>{if(story?.slug!=='hailey-bell-to-step-back-from-full-time-competition-after-season-4')return story;const normalized=replaceFullCirclePartner(story),text=JSON.stringify(normalized);const fresh=(seed.news||[]).find((item)=>item?.slug===story.slug);if(!fresh)return normalized;if(!/FULL HEART/i.test(text)||/FULL CIRCLE/i.test(text))return fresh;return {...normalized,socialImage:(!normalized.socialImage||/full-heart-tour-2027-logo\.jpg$/i.test(normalized.socialImage))?fresh.socialImage:normalized.socialImage,articleLogo:normalized.articleLogo||fresh.articleLogo,embedDescription:normalized.embedDescription||fresh.embedDescription};});
  if(Array.isArray(datasets.news)){const scrSlug='hailey-bell-joins-starclutch-racing-nrrs-season-4',fresh=(seed.news||[]).find((story)=>story?.slug===scrSlug);datasets.news=datasets.news.map((story)=>{if(story?.slug!==scrSlug||!fresh)return story;const serialized=JSON.stringify(story);return /one of her personal partners|Hailey personal partner|relationship follows Bell/i.test(serialized)||story?.contentRevision!==fresh.contentRevision?fresh:story;});}
  if(Array.isArray(datasets.news)){
    // Keep the confirmed race articles visible when an older Admin snapshot has not yet been republished.
    // New Hampshire is the single featured story and homepage lead.
    const featuredSlug='pole-position-fading-pace-bell-salvages-third-at-new-hampshire';
    const raceSlugs=['talladega-leaves-bell-frustrated-championship-gap-grows','bells-road-course-struggles-deepen-at-portland',featuredSlug];
    const seedBySlug=new Map((seed.news||[]).map((story)=>[story.slug,story]));
    for(const slug of raceSlugs){
      if(!datasets.news.some((story)=>story?.slug===slug)&&seedBySlug.has(slug))datasets.news.push(seedBySlug.get(slug));
    }
    datasets.news=datasets.news.map((story)=>{
      const fresh=seedBySlug.get(story?.slug);
      const next=raceSlugs.includes(story?.slug)&&fresh&&story?.contentRevision!==fresh.contentRevision?fresh:story;
      return {...next,featured:next?.slug===featuredSlug};
    });
  }
  if(Array.isArray(datasets['schedule-events'])){
    const scheduleSeedByKey=new Map((seed['schedule-events']||[]).map(e=>[`${e.date}|${e.league}|${e.title}`,e]));
    datasets['schedule-events']=datasets['schedule-events'].filter(e=>e?.league!=='uarl-d2').map(e=>{
      if(e?.league==='nrrs'&&e?.date==='2026-09-22')return {...e,title:'North Wilkesboro Speedway (Chase Race 2)',track:'North Wilkesboro Speedway',status:'The Chase',round:'ROUND 21',time:'7:30 PM ET'};
      
      if(e?.league==='iracing'&&e?.title==='Bathurst 1000'&&e?.date==='2026-10-02'){const fresh=scheduleSeedByKey.get(`${e.date}|${e.league}|${e.title}`)||{};return {...e,startAt:fresh.startAt,endAt:fresh.endAt};}
      return e;
    });
  }
  if(Array.isArray(datasets.results)){
    datasets.results=normalize('results',appendReviewedResults(datasets.results,seed.results));
  }
  // Published standings are authoritative. Historical repair migrations belong at release time,
  // never in the live read path, or fresh Admin edits can be silently replaced by bundled seeds.
  // Keep published assignment numbers while retaining legacy identity/roster filtering.
  const canonDrivers=(rows=[])=>normalizeDriverAssignments(rows).filter(e=>!(e?.competitionId==='kmart'&&e?.profile==='jaxon')&&!(e?.competitionId==='uarl-d1'&&(e?.profile==='gk3r'||String(e?.handle||'').toLowerCase()==='@sealsntags'||String(e?.displayName||'').toLowerCase()==='gk3r'))).map(e=>{if(e?.competitionId!=='uarl-d1')return e;const k=String(e?.profile||e?.displayName||'').toLowerCase();if(k==='hailey')return {...e,displayName:'Hailey'};return e;});
  if(Array.isArray(datasets.drivers))datasets.drivers=canonDrivers(datasets.drivers);
  if(Array.isArray(datasets['roster-profiles']))datasets['roster-profiles']=normalize('roster-profiles',datasets['roster-profiles']).filter(p=>p?.slug!=='gk3r'&&String(p?.handle||'').toLowerCase()!=='@sealsntags').map(p=>p?.slug==='jaxon'?{...p,...(seed['roster-profiles']||[]).find(x=>x.slug===p.slug)}:p);
  if(Array.isArray(datasets['driver-profiles']))datasets['driver-profiles']=normalize('driver-profiles',datasets['driver-profiles']);
  if(Array.isArray(datasets.charters)){const fresh=(seed.charters||[]).find(b=>b.id==='uarl-d1');datasets.charters=datasets.charters.map(b=>b?.id==='uarl-d1'&&fresh?{...b,fullTime:fresh.fullTime,openCharters:fresh.openCharters}:b);}
  if(Array.isArray(datasets.competitions)){const fresh=new Map((seed.competitions||[]).map(x=>[x.id,x]));datasets.competitions=datasets.competitions.filter(x=>x?.id!=='uarl-d2').map(x=>['uarl-d1','kmart'].includes(x?.id)?fresh.get(x.id)||x:x);}
  if(Array.isArray(datasets.partners))datasets.partners=ensureCoreTeamPartners(datasets.partners,seed.partners||[]);else datasets.partners=ensureCoreTeamPartners([],seed.partners||[]);
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

exports._test={mergeCanonical};

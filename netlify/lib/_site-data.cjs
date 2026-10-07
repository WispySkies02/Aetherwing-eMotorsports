const { read, json, normalizeDriverAssignments, seeds, normalize } = require('./_content.cjs');
function replaceFullCirclePartner(value){
  if(Array.isArray(value))return value.map(replaceFullCirclePartner);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,child])=>[key,replaceFullCirclePartner(child)]));
  return typeof value==='string'?value.replace(/Pokémon|Pokemon/g,'Ironmouse'):value;
}
function mergeCanonical(datasets){
  const seed=seeds();
  if(Array.isArray(datasets.news))datasets.news=datasets.news.map((story)=>{if(story?.slug!=='hailey-bell-to-step-back-from-full-time-competition-after-season-4')return story;const normalized=replaceFullCirclePartner(story),text=JSON.stringify(normalized);const fresh=(seed.news||[]).find((item)=>item?.slug===story.slug);if(!fresh)return normalized;if(!/FULL HEART/i.test(text)||/FULL CIRCLE/i.test(text))return fresh;return {...normalized,socialImage:(!normalized.socialImage||/full-heart-tour-2027-logo\.jpg$/i.test(normalized.socialImage))?fresh.socialImage:normalized.socialImage,articleLogo:normalized.articleLogo||fresh.articleLogo,embedDescription:normalized.embedDescription||fresh.embedDescription};});
  if(Array.isArray(datasets.news)){const currentSlug='talladega-leaves-bell-frustrated-championship-gap-grows',fresh=(seed.news||[]).find((story)=>story?.slug===currentSlug);let hadCurrent=false;datasets.news=datasets.news.map((story)=>{if(story?.slug!==currentSlug)return story;hadCurrent=true;return fresh&&story?.contentRevision!==fresh.contentRevision?fresh:story;});if(!hadCurrent&&fresh)datasets.news.push(fresh);if(!hadCurrent)datasets.news=datasets.news.map((story)=>({...story,featured:story?.slug===currentSlug}));}
  if(Array.isArray(datasets['schedule-events'])){
    const scheduleSeedByKey=new Map((seed['schedule-events']||[]).map(e=>[`${e.date}|${e.league}|${e.title}`,e]));
    datasets['schedule-events']=datasets['schedule-events'].filter(e=>e?.league!=='uarl-d2').map(e=>{
      if(e?.league==='nrrs'&&e?.date==='2026-09-22')return {...e,title:'North Wilkesboro Speedway (Chase Race 2)',track:'North Wilkesboro Speedway',status:'The Chase',round:'ROUND 21',time:'7:30 PM ET'};
      
      if(e?.league==='iracing'&&e?.title==='Bathurst 1000'&&e?.date==='2026-10-02'){const fresh=scheduleSeedByKey.get(`${e.date}|${e.league}|${e.title}`)||{};return {...e,startAt:fresh.startAt,endAt:fresh.endAt};}
      return e;
    });
  }
  const canonicalResults=(seed.results||[]).filter(r=>(r.league==='nrrs'&&r.date==='2026-09-22')||(r.league==='kmart'&&r.date==='2026-09-28')||(r.league==='uarl-d2'&&r.date==='2026-09-12'));
  if(Array.isArray(datasets.results)){
    const live=[...datasets.results];
    for(const official of canonicalResults){
      const i=live.findIndex(r=>r?.league===official.league&&r?.date===official.date);
      if(i===-1)live.push(official);
      else if(['nrrs','kmart'].includes(official.league))live[i]={...live[i],title:official.title,track:official.track,round:official.round,status:official.status,specialTag:official.specialTag,entries:(live[i].entries||[]).length?live[i].entries:official.entries};
    }
    datasets.results=normalize('results',live);
  }
  if(Array.isArray(datasets.standings)){
    const official=(seed.standings||[]).find(b=>b.id==='nrrs'),sunocoSeed=(seed.standings||[]).find(b=>b.id==='sunoco'),kmartSeed=(seed.standings||[]).find(b=>b.id==='kmart');
    datasets.standings=datasets.standings.map(board=>{
      if(board?.id==='nrrs'&&official){const last=String(board.lastResultDate||''),looksOld=(!last&&/After R(?:20|21)\/25/i.test(board.subtitle||''))||last<'2026-09-22',staleR21=last==='2026-09-22'&&board.rows?.some(r=>r.driver==='Trent'&&Number(r.points)===2197);return looksOld||staleR21?official:board;}
      if(board?.id==='sunoco'&&sunocoSeed){const liveRows=Array.isArray(board.rows)?board.rows:[],byNumber=new Map(liveRows.map(row=>[String(row?.number||''),row])),rows=(sunocoSeed.rows||[]).map(seedRow=>{const live=byNumber.get(String(seedRow.number||''));return live?{...seedRow,...live,team:seedRow.team||live.team,manufacturer:seedRow.manufacturer||live.manufacturer}:{...seedRow};});return {...sunocoSeed,...board,title:board.title==='Sunoco Truck Series Chase'?sunocoSeed.title:board.title||sunocoSeed.title,rows,chaseRows:Array.isArray(board.chaseRows)?board.chaseRows:(sunocoSeed.chaseRows||[]),chaseActive:true};}
      if(board?.id==='kmart'&&kmartSeed){const stale=!String(board.subtitle||'').includes('After Round 8')||String(board.lastResultDate||'')<'2026-09-28'||(board.rows||[]).some(r=>r?.driver==='Jaxon')||!(board.appliedAdjustments||[]).some(a=>a?.id==='KMART_TRANSFER_JAXON_TO_HAILEY_2026');return stale?kmartSeed:board;}
      return board;
    });
  }
  const canonDrivers=(rows=[])=>normalizeDriverAssignments(rows).filter(e=>!(e?.competitionId==='kmart'&&e?.profile==='jaxon')).map(e=>{if(e?.competitionId!=='uarl-d1')return e;const k=String(e?.profile||e?.displayName||'').toLowerCase();if(k==='hailey')return {...e,number:'28',displayName:'Hailey'};if(k==='burgertown2good')return {...e,number:'32'};if(k==='gk3r')return {...e,number:'42',displayName:'GK3R'};if(k==='rocky')return {...e,number:'46'};return e;});
  if(Array.isArray(datasets.drivers))datasets.drivers=canonDrivers(datasets.drivers);
  if(Array.isArray(datasets['roster-profiles']))datasets['roster-profiles']=normalize('roster-profiles',datasets['roster-profiles']).map(p=>p?.slug==='jaxon'?{...p,...(seed['roster-profiles']||[]).find(x=>x.slug==='jaxon')}:p);
  if(Array.isArray(datasets['driver-profiles']))datasets['driver-profiles']=normalize('driver-profiles',datasets['driver-profiles']);
  if(Array.isArray(datasets.charters)){const fresh=(seed.charters||[]).find(b=>b.id==='uarl-d1');datasets.charters=datasets.charters.map(b=>b?.id==='uarl-d1'&&fresh?{...b,fullTime:fresh.fullTime,openCharters:fresh.openCharters}:b);}
  if(Array.isArray(datasets.competitions)){const fresh=new Map((seed.competitions||[]).map(x=>[x.id,x]));datasets.competitions=datasets.competitions.filter(x=>x?.id!=='uarl-d2').map(x=>['uarl-d1','kmart'].includes(x?.id)?fresh.get(x.id)||x:x);}
  if(Array.isArray(datasets.partners))datasets.partners=datasets.partners.filter(p=>p?.name!=='Palmetto Gaming');
  if(Array.isArray(datasets['driver-portfolios'])){const pal=(seed['driver-portfolios']||[]).find(p=>p.profile==='hailey');datasets['driver-portfolios']=normalize('driver-portfolios',datasets['driver-portfolios']).map(p=>p.profile==='hailey'&&pal?pal:p);if(!datasets['driver-portfolios'].some(p=>p.profile==='hailey')&&pal)datasets['driver-portfolios'].push(pal);}
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

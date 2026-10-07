const { seeds, read, write, validate, normalize, json } = require('./_content.cjs');

function normalizedName(value='') {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'').replace(/^wispy$/,'hailey');
}
function recalcBoardRows(board) {
  const previous=new Map((board.rows||[]).map((row,index)=>[`${normalizedName(row.driver)}|${String(row.number||'')}`,index+1]));
  const ranked=(board.rows||[]).filter((row)=>!row.unranked).sort((a,b)=>Number(b.points||0)-Number(a.points||0)||String(a.driver||'').localeCompare(String(b.driver||'')));
  const unranked=(board.rows||[]).filter((row)=>row.unranked);
  ranked.forEach((row,index)=>{
    const old=previous.get(`${normalizedName(row.driver)}|${String(row.number||'')}`);
    const now=index+1;
    row.position=`P${now}`;
    if(old){const move=old-now;row.positionChange=move;}
  });
  if(board.gapMode==='cutoff'&&Number(board.cutoffAfter)>0&&ranked.length>Number(board.cutoffAfter)){
    const cutoff=Number(board.cutoffAfter),lastIn=Number(ranked[cutoff-1]?.points||0),firstOut=Number(ranked[cutoff]?.points||0);
    ranked.forEach((row,index)=>{const points=Number(row.points||0);row.delta=index<cutoff?`+${Math.max(0,points-firstOut)}`:`${points-lastIn}`;});
  }else if(ranked.length){
    const leader=Number(ranked[0].points||0);ranked.forEach((row,index)=>{row.delta=index===0?'LEADER':`${Number(row.points||0)-leader}`;});
  }
  board.rows=[...ranked,...unranked];
}
function autoAdvanceStandings(registry, nextResults, priorResults=[]) {
  const source=structuredClone(registry.published.standings ?? seeds().standings);
  let changed=false;
  const entryKey=(entry)=>`${String(entry?.number||'')}|${normalizedName(entry?.driver)}`;
  const findRow=(board,entry)=>{const number=String(entry?.number||''),name=normalizedName(entry?.driver);return board.rows.find((item)=>String(item.number||'')===number&&normalizedName(item.driver)===name)||board.rows.find((item)=>normalizedName(item.driver)===name);};
  for(const board of source){
    if(board?.autoPoints!==true||!Array.isArray(board.rows)||!board.rows.length)continue;
    // If the most recently applied result is corrected and republished, apply only the point delta.
    if(board.lastResultScheduleId){
      const prior=(priorResults||[]).find((race)=>race?.league===board.league&&race?.scheduleId===board.lastResultScheduleId);
      const next=(nextResults||[]).find((race)=>race?.league===board.league&&race?.scheduleId===board.lastResultScheduleId);
      if(prior&&next){
        const priorPoints=new Map((prior.entries||[]).map((entry)=>[entryKey(entry),Number(entry.racePoints||0)]));
        let corrected=false;
        for(const entry of next.entries||[]){
          const row=findRow(board,entry);if(!row)continue;
          const before=priorPoints.get(entryKey(entry))??0,after=Number(entry.racePoints||0);if(!Number.isFinite(after)||after===before)continue;
          row.points=Number(row.points||0)+(after-before);corrected=true;
        }
        if(corrected){recalcBoardRows(board);board.autoUpdateNote=`Corrected ${next.title||next.track||'published result'} · ${next.date||''}`;changed=true;}
      }
    }
    const candidates=(nextResults||[]).filter((race)=>race?.league===board.league&&String(race.date||'')>String(board.lastResultDate||'')).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
    for(const race of candidates){
      for(const entry of race.entries||[]){
        const points=Number(entry.racePoints||0);if(!Number.isFinite(points))continue;
        const row=findRow(board,entry);if(row)row.points=Number(row.points||0)+points;
      }
      recalcBoardRows(board);
      board.lastResultDate=race.date||board.lastResultDate||'';
      board.lastResultScheduleId=race.scheduleId||'';
      board.autoUpdateNote=`Automatically advanced from ${race.title||race.track||'published result'} on ${race.date||''}.`;
      changed=true;
    }
  }
  if(changed)registry.published.standings=source;
  return changed;
}


function cascadeRemovedDriverProfiles(registry, beforeProfiles=[], afterProfiles=[]) {
  const beforeSlugs=new Set((beforeProfiles||[]).map((profile)=>String(profile?.slug||'')).filter(Boolean));
  const afterSlugs=new Set((afterProfiles||[]).map((profile)=>String(profile?.slug||'')).filter(Boolean));
  const removedSlugs=new Set([...beforeSlugs].filter((slug)=>!afterSlugs.has(slug)));
  if(!removedSlugs.size)return { removedSlugs:[], removedAssignments:0, scheduleEntries:0 };
  const seed=seeds();
  const currentDrivers=normalize('drivers',registry.published?.drivers??seed.drivers);
  const removedAssignments=currentDrivers.filter((entry)=>removedSlugs.has(String(entry?.profile||'')));
  const removedIds=new Set(removedAssignments.map((entry)=>String(entry?.id||'')).filter(Boolean));
  registry.published.drivers=normalize('drivers',currentDrivers.filter((entry)=>!removedSlugs.has(String(entry?.profile||''))));
  if(Array.isArray(registry.drafts?.drivers))registry.drafts.drivers=normalize('drivers',registry.drafts.drivers.filter((entry)=>!removedSlugs.has(String(entry?.profile||''))));
  let scheduleEntries=0;
  const cleanSchedules=(rows=[])=>rows.map((event)=>{
    if(!Array.isArray(event?.entries)||!event.entries.length)return event;
    const entries=event.entries.filter((entry)=>!removedIds.has(String(entry?.assignmentId||'')));
    scheduleEntries+=event.entries.length-entries.length;
    return entries.length===event.entries.length?event:{...event,entries};
  });
  if(Array.isArray(registry.published?.['schedule-events']))registry.published['schedule-events']=cleanSchedules(registry.published['schedule-events']);
  if(Array.isArray(registry.drafts?.['schedule-events']))registry.drafts['schedule-events']=cleanSchedules(registry.drafts['schedule-events']);
  return { removedSlugs:[...removedSlugs], removedAssignments:removedAssignments.length, scheduleEntries };
}

async function rebuild(revision) {
  const hook = process.env.AETHERWING_BUILD_HOOK;
  if (!hook) return { queued:false, message:'Live data is already published. Configure AETHERWING_BUILD_HOOK only for static rebuilds, new routes, and refreshed social metadata.' };
  const url = new URL(hook);
  if (url.protocol !== 'https:' || url.hostname !== 'api.netlify.com' || !url.pathname.startsWith('/build_hooks/')) throw new Error('Invalid build hook configuration.');
  const response = await fetch(url, {
    method:'POST',
    headers:{ 'content-type':'application/json' },
    body:JSON.stringify({
      trigger_title:`Aetherwing Admin publication${Number.isFinite(revision) ? ` · revision ${revision}` : ''}`,
      clear_cache:true
    }),
    signal:AbortSignal.timeout(10000)
  });
  if (!response.ok) throw new Error(`Rebuild request failed (${response.status}). Retry Publish site.`);
  return { queued:true, message:'Live data is published now; a static rebuild was also queued for generated HTML/routes/social metadata.' };
}

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

function migrateKnownPublished(registry){
  const seed=seeds();
  if(Array.isArray(registry.published?.news))registry.published.news=registry.published.news.map((story)=>{if(story?.slug!=='hailey-bell-to-step-back-from-full-time-competition-after-season-4')return story;const normalized=replaceFullCirclePartner(story),text=JSON.stringify(normalized);const fresh=(seed.news||[]).find((item)=>item?.slug===story.slug);if(!fresh)return normalized;if(!/FULL HEART/i.test(text)||/FULL CIRCLE/i.test(text))return fresh;return {...normalized,socialImage:(!normalized.socialImage||/full-heart-tour-2027-logo\.jpg$/i.test(normalized.socialImage))?fresh.socialImage:normalized.socialImage,articleLogo:normalized.articleLogo||fresh.articleLogo,embedDescription:normalized.embedDescription||fresh.embedDescription};});
  if(Array.isArray(registry.published?.news)){const scrSlug='hailey-bell-joins-starclutch-racing-nrrs-season-4',fresh=(seed.news||[]).find((story)=>story?.slug===scrSlug);registry.published.news=registry.published.news.map((story)=>{if(story?.slug!==scrSlug||!fresh)return story;const serialized=JSON.stringify(story);return /one of her personal partners|Hailey personal partner|relationship follows Bell/i.test(serialized)||story?.contentRevision!==fresh.contentRevision?fresh:story;});}
  if(Array.isArray(registry.published?.news)){const currentSlug='talladega-leaves-bell-frustrated-championship-gap-grows',fresh=(seed.news||[]).find((story)=>story?.slug===currentSlug);let hadCurrent=false;registry.published.news=registry.published.news.map((story)=>{if(story?.slug!==currentSlug)return story;hadCurrent=true;return fresh&&story?.contentRevision!==fresh.contentRevision?fresh:story;});if(!hadCurrent&&fresh)registry.published.news.push(fresh);if(!hadCurrent)registry.published.news=registry.published.news.map((story)=>({...story,featured:story?.slug===currentSlug}));}
  if(Array.isArray(registry.published?.['schedule-events']))registry.published['schedule-events']=registry.published['schedule-events'].filter(e=>e?.league!=='uarl-d2').map(e=>{if(e?.league==='nrrs'&&e?.date==='2026-09-22')return {...e,title:'North Wilkesboro Speedway (Chase Race 2)',track:'North Wilkesboro Speedway',status:'The Chase',round:'ROUND 21',time:'7:30 PM ET'};if(e?.league==='iracing'&&e?.title==='Bathurst 1000'&&e?.date==='2026-10-02'){const fresh=(seed['schedule-events']||[]).find(x=>x.date===e.date&&x.league===e.league&&x.title===e.title)||{};return {...e,startAt:fresh.startAt,endAt:fresh.endAt};}return e;});
  // Results and standings are now fully live-published datasets. Do not run legacy
  // seed-repair migrations here: they can overwrite a fresh Admin publication.
  if(Array.isArray(registry.published?.drivers))registry.published.drivers=normalize('drivers',registry.published.drivers).filter(e=>!(e?.competitionId==='kmart'&&e?.profile==='jaxon')).map(e=>{if(e?.competitionId!=='uarl-d1')return e;const k=String(e?.profile||e?.displayName||'').toLowerCase();if(k==='hailey')return {...e,number:'28',displayName:'Hailey'};if(k==='burgertown2good')return {...e,number:'32'};if(k==='gk3r')return {...e,number:'42',displayName:'GK3R'};if(k==='rocky')return {...e,number:'46'};return e;});
  if(Array.isArray(registry.published?.['roster-profiles']))registry.published['roster-profiles']=normalize('roster-profiles',registry.published['roster-profiles']).map(p=>p?.slug==='jaxon'?{...p,...(seed['roster-profiles']||[]).find(x=>x.slug==='jaxon')}:p);
  if(Array.isArray(registry.published?.['driver-profiles']))registry.published['driver-profiles']=normalize('driver-profiles',registry.published['driver-profiles']);
  if(Array.isArray(registry.published?.charters)){const fresh=(seed.charters||[]).find(b=>b.id==='uarl-d1');registry.published.charters=registry.published.charters.map(b=>b?.id==='uarl-d1'&&fresh?{...b,fullTime:fresh.fullTime,openCharters:fresh.openCharters}:b);}
  if(Array.isArray(registry.published?.competitions)){const fresh=new Map((seed.competitions||[]).map(x=>[x.id,x]));registry.published.competitions=registry.published.competitions.filter(x=>x?.id!=='uarl-d2').map(x=>['uarl-d1','kmart'].includes(x?.id)?fresh.get(x.id)||x:x);}
  if(Array.isArray(registry.published?.partners))registry.published.partners=ensurePalmettoTeamPartner(registry.published.partners,seed.partners||[]);
  if(Array.isArray(registry.published?.['driver-portfolios']))registry.published['driver-portfolios']=normalize('driver-portfolios',registry.published['driver-portfolios']);
  return registry;
}

exports.handler = async (event, context) => {
  try {
    const user = context?.clientContext?.user;
    const roles = user?.app_metadata?.roles || user?.app_metadata?.authorization?.roles || [];
    if (!user || !Array.isArray(roles) || !roles.includes('admin')) return json(403, { error:'The admin role is required for main-site editing.' });
    const { registry: rawRegistry, etag } = await read();
    const registry = migrateKnownPublished(rawRegistry);
    const seedData=seeds();
    const publicRosterBefore=normalize('roster-profiles',registry.published?.['roster-profiles']??seedData['roster-profiles']);
    const priorPublishedResults = normalize('results', registry.published.results ?? seedData.results);
    if (event.httpMethod === 'GET') return json(200, { registry, seeds:seeds(), publishConfigured:!!process.env.AETHERWING_BUILD_HOOK });
    if (event.httpMethod !== 'POST') return json(405, { error:'Method not allowed.' });
    let input;
    try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error:'Invalid JSON request.' }); }
    if (input.action === 'rebuild') return json(200, { registry, publication:await rebuild(registry.revision) });
    if (input.revision !== registry.revision) return json(409, { error:'Another session changed site content. Refresh before saving.' });
    const key = input.dataset;
    let publishedKeys = [];
    if (input.action === 'saveDraft') {
      const data = normalize(key, input.data);
      const error = validate(key, data, registry);
      if (error) return json(400, { error });
      registry.drafts[key] = data;
    } else if (input.action === 'discardDraft') {
      if (!(key in seeds())) return json(400, { error:'Unknown section.' });
      delete registry.drafts[key];
    } else if (input.action === 'publish') {
      const data = normalize(key, input.data ?? registry.drafts[key]);
      if (!data) return json(400, { error:'Make a change or save a draft before publishing.' });
      const error = validate(key, data, registry);
      if (error) return json(400, { error });
      registry.published[key] = data;
      delete registry.drafts[key];
      publishedKeys = [key];
    } else if (input.action === 'publishAll') {
      const entries = Object.entries(registry.drafts || {}).map(([draftKey,data])=>[draftKey,normalize(draftKey,data)]);
      if (!entries.length) return json(400, { error:'There are no saved drafts to publish.' });
      for (const [draftKey,data] of entries) {
        const error = validate(draftKey, data, registry);
        if (error) return json(400, { error:`${draftKey}: ${error}` });
      }
      for (const [draftKey,data] of entries) registry.published[draftKey] = data;
      publishedKeys = entries.map(([draftKey]) => draftKey);
      registry.drafts = {};
    } else return json(400, { error:'Unknown action.' });
    let driverRemovalCascade={ removedSlugs:[], removedAssignments:0, scheduleEntries:0 };
    if(publishedKeys.includes('roster-profiles')){
      driverRemovalCascade=cascadeRemovedDriverProfiles(registry,publicRosterBefore,registry.published['roster-profiles']);
      if(driverRemovalCascade.removedAssignments&&!publishedKeys.includes('drivers'))publishedKeys.push('drivers');
      if(driverRemovalCascade.scheduleEntries&&!publishedKeys.includes('schedule-events'))publishedKeys.push('schedule-events');
    }
    if (publishedKeys.includes('results')) {
      const nextResults=normalize('results', registry.published.results ?? seeds().results);
      if(autoAdvanceStandings(registry,nextResults,priorPublishedResults) && !publishedKeys.includes('standings'))publishedKeys.push('standings');
    }
    registry.revision += 1;
    const at = new Date().toISOString();
    registry.history = [{ action:input.action, dataset:key || null, datasets:input.action === 'publishAll' ? publishedKeys : undefined, at, by:user.email || user.sub }, ...(registry.history || [])].slice(0,100);
    if (input.action === 'publish' || input.action === 'publishAll') registry.lastPublication = { revision:registry.revision, datasets:publishedKeys, at, by:user.email || user.sub };
    await write(registry, etag);
    let publication = null;
    if (input.action === 'publish' || input.action === 'publishAll') {
      try { publication = await rebuild(registry.revision); } catch (error) { publication = { queued:false, message:error.message }; }
      publication = { ...publication, dataPublished:true, revision:registry.revision, datasets:publishedKeys, driverRemovalCascade };
    }
    return json(200, { registry, publication });
  } catch (error) {
    console.error('site-admin', error);
    return json(error.message === 'CONFLICT' ? 409 : 500, { error:error.message === 'CONFLICT' ? 'Another session saved first. Refresh before saving.' : 'Site content could not be saved. Check Netlify function logs.' });
  }
};

exports._test = { cascadeRemovedDriverProfiles };

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
    if(old){const move=old-now;row.positionChange=move>0?`▲${move}`:move<0?`▼${Math.abs(move)}`:'—';}
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

async function rebuild(revision) {
  const hook = process.env.AETHERWING_BUILD_HOOK;
  if (!hook) return { queued:false, message:'Set AETHERWING_BUILD_HOOK in the main Netlify project to publish site edits.' };
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
  return { queued:true, message:'Build queued. Public pages update when Netlify finishes the deployment.' };
}

function migrateKnownPublished(registry){
  const seed=seeds();
  if(Array.isArray(registry.published?.['schedule-events']))registry.published['schedule-events']=registry.published['schedule-events'].filter(e=>e?.league!=='uarl-d2').map(e=>e?.league==='nrrs'&&e?.date==='2026-09-22'?{...e,title:'North Wilkesboro Speedway (Chase Race 2)',track:'North Wilkesboro Speedway',status:'The Chase',round:'ROUND 21',time:'7:30 PM ET'}:e);
  if(Array.isArray(registry.published?.results)){
    const live=[...registry.published.results],officials=(seed.results||[]).filter(r=>(r.league==='nrrs'&&r.date==='2026-09-22')||(r.league==='uarl-d2'&&r.date==='2026-09-12'));
    for(const official of officials){const i=live.findIndex(r=>r?.league===official.league&&r?.date===official.date);if(i===-1)live.push(official);else if(official.league==='nrrs')live[i]={...live[i],title:official.title,track:official.track,round:official.round,status:official.status,specialTag:official.specialTag,entries:(live[i].entries||[]).length?live[i].entries:official.entries};}
    registry.published.results=normalize('results',live);
  }
  if(Array.isArray(registry.published?.standings)){
    const official=(seed.standings||[]).find(b=>b.id==='nrrs');registry.published.standings=registry.published.standings.map(board=>{if(board?.id!=='nrrs'||!official)return board;const last=String(board.lastResultDate||''),looksOld=(!last&&/After R(?:20|21)\/25/i.test(board.subtitle||''))||last<'2026-09-22',stale=last==='2026-09-22'&&board.rows?.some(r=>r.driver==='Trent'&&Number(r.points)===2197);return looksOld||stale?official:board;});
  }
  return registry;
}

exports.handler = async (event, context) => {
  try {
    const user = context?.clientContext?.user;
    const roles = user?.app_metadata?.roles || user?.app_metadata?.authorization?.roles || [];
    if (!user || !Array.isArray(roles) || !roles.includes('admin')) return json(403, { error:'The admin role is required for main-site editing.' });
    const { registry: rawRegistry, etag } = await read();
    const registry = migrateKnownPublished(rawRegistry);
    const priorPublishedResults = normalize('results', registry.published.results ?? seeds().results);
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
      publication = { ...publication, dataPublished:true, revision:registry.revision, datasets:publishedKeys };
    }
    return json(200, { registry, publication });
  } catch (error) {
    console.error('site-admin', error);
    return json(error.message === 'CONFLICT' ? 409 : 500, { error:error.message === 'CONFLICT' ? 'Another session saved first. Refresh before saving.' : 'Site content could not be saved. Check Netlify function logs.' });
  }
};

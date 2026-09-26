const { read, json, normalizeDriverAssignments, seeds, normalize } = require('./_content.cjs');
function mergeCanonical(datasets){
  const seed=seeds();
  if(Array.isArray(datasets['schedule-events'])){
    datasets['schedule-events']=datasets['schedule-events'].filter(e=>e?.league!=='uarl-d2').map(e=>{
      if(e?.league==='nrrs'&&e?.date==='2026-09-22')return {...e,title:'North Wilkesboro Speedway (Chase Race 2)',track:'North Wilkesboro Speedway',status:'The Chase',round:'ROUND 21',time:'7:30 PM ET'};
      return e;
    });
  }
  const canonicalResults=(seed.results||[]).filter(r=>(r.league==='nrrs'&&r.date==='2026-09-22')||(r.league==='uarl-d2'&&r.date==='2026-09-12'));
  if(Array.isArray(datasets.results)){
    const live=[...datasets.results];
    for(const official of canonicalResults){
      const i=live.findIndex(r=>r?.league===official.league&&r?.date===official.date);
      if(i===-1)live.push(official);
      else if(official.league==='nrrs')live[i]={...live[i],title:official.title,track:official.track,round:official.round,status:official.status,specialTag:official.specialTag,entries:(live[i].entries||[]).length?live[i].entries:official.entries};
    }
    datasets.results=normalize('results',live);
  }
  if(Array.isArray(datasets.standings)){
    const official=(seed.standings||[]).find(b=>b.id==='nrrs');
    datasets.standings=datasets.standings.map(board=>{
      if(board?.id!=='nrrs'||!official)return board;
      const last=String(board.lastResultDate||'');
      const looksOld=(!last&&/After R(?:20|21)\/25/i.test(board.subtitle||''))||last<'2026-09-22';
      const staleR21=last==='2026-09-22'&&board.rows?.some(r=>r.driver==='Trent'&&Number(r.points)===2197);
      return looksOld||staleR21?official:board;
    });
  }
  return datasets;
}
exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error:'Method not allowed.' });
  try {
    const { registry } = await read();
    const datasets=mergeCanonical({...registry.published});
    if(Array.isArray(datasets.drivers))datasets.drivers=normalizeDriverAssignments(datasets.drivers);
    if(Array.isArray(datasets.results))datasets.results=datasets.results.map((race)=>({...race,entries:(race.entries||[]).map((entry)=>entry?.assignmentId==='shared-kmart'||(String(entry?.number)==='29'&&/Clutch\s*\/\s*Eazy\s*\/\s*Matty/i.test(entry?.driver||''))?{...entry,assignmentId:'',driver:'Part-Time Entry'}:entry)}));
    return json(200, { version:1, revision:registry.revision, datasets });
  } catch (error) {
    console.error('site-data', error);
    return json(503, { error:'Published site content is temporarily unavailable.' });
  }
};

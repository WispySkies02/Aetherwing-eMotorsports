import {eventSlug} from './schedule-events.mjs';

const badKmartSubtitle='After Round 12 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble';
const correctedKmartSubtitle='After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble';
const mexicoKmartSubtitle='After Round 12 of 23 · Mexico City · Nov. 9, 2026 · Chase Bubble';

// Owner-confirmed November 2026 correction. Limit the repair to the obsolete
// event snapshot; later dates, custom titles and other seasons stay published
// exactly as edited. The stable league/round route and entry records survive.
export function reconcileNovemberSchedule(events=[]){
  if(!Array.isArray(events))return events;
  return events.map(event=>event?.league==='kmart'
    &&event.date==='2026-11-02'
    &&eventSlug(event)==='kmart-round-11'
    &&event.title==='MasterPro Milwaukee Mile 200'
    &&event.track==='Milwaukee'
    ?{...event,title:'MasterPro Iowa 200',track:'Iowa Speedway'}:event);
}

// This caption was recorded against the wrong round. Scores, manual awards,
// homepage selection and automatic-points bookkeeping are not part of this
// correction. Do not derive any missing result or points from the caption.
export function reconcileNovemberStandings(boards=[]){
  if(!Array.isArray(boards))return boards;
  return boards.map(board=>{
    if(board?.id!=='kmart'||board.league!=='kmart')return board;
    let subtitle=board.subtitle===badKmartSubtitle?correctedKmartSubtitle:board.subtitle;
    // The owner confirmed the observed 678-point snapshot is after Mexico City,
    // not Iowa. Match both its precise old caption and Hailey's published score;
    // older seed snapshots and later editorial captions remain authoritative.
    if(subtitle===correctedKmartSubtitle&&Array.isArray(board.rows)
      &&board.rows.some(row=>row?.driver==='Hailey'&&String(row.number)==='15'&&row.points===678))subtitle=mexicoKmartSubtitle;
    return subtitle===board.subtitle?board:{...board,subtitle};
  });
}

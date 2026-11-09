import {eventSlug} from './schedule-events.mjs';

const badKmartSubtitle='After Round 12 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble';
const correctedKmartSubtitle='After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble';

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
  return boards.map(board=>board?.id==='kmart'&&board.league==='kmart'&&board.subtitle===badKmartSubtitle
    ?{...board,subtitle:correctedKmartSubtitle}:board);
}

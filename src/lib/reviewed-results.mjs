import review from '../data/confirmed-racing-updates.json' with { type:'json' };

const approvedIds = new Set(review.results.map(result=>result.scheduleId));
const round = result=>String(result.round||'').match(/\d+/)?.[0];

export function sameReviewedEvent(a,b) {
  if(a.league!==b.league||String(a.date||'').slice(0,4)!==String(b.date||'').slice(0,4))return false;
  if(a.scheduleId&&a.scheduleId===b.scheduleId)return true;
  const left=round(a),right=round(b);
  if(left&&right)return Number(left)===Number(right);
  return a.date===b.date&&((a.track&&a.track===b.track)||(a.title&&a.title===b.title));
}

// Append only owner-approved archive records. Existing published rows, including
// later corrections, stay authoritative; no points or standings are recalculated.
export function appendReviewedResults(published,seed) {
  const merged=[...published];
  for(const result of seed.filter(row=>approvedIds.has(row.scheduleId))) {
    if(!merged.some(row=>sameReviewedEvent(row,result)))merged.push(structuredClone(result));
  }
  return merged;
}

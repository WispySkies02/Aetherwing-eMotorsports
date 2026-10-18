// Pure preparation shared by the Admin review button and offline release tool.
const slugify=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/&/g,' and ').replace(/[’']/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-+|-+$/g,'').toLowerCase();
const eventSlug=event=>{const explicit=slugify(event.routeId||event.eventId);if(explicit)return explicit;const league=slugify(event.league)||'event',round=String(event.round||'').match(/\d+/);return round?`${league}-round-${Number(round[0])}`:`${league}-${slugify(event.date)||'tbd'}`;};

export function prepareConfirmedRacingUpdates(publication,reviewed,section='all') {
  const source=publication.datasets??publication.published??publication;
  const datasets=structuredClone(source);
  if(!Array.isArray(datasets['schedule-events'])||!Array.isArray(datasets.results))throw new Error('A published schedule and results collection are required.');
  if(section!=='results'){
  for(const change of reviewed.scheduleChanges){
    const matches=datasets['schedule-events'].filter(event=>eventSlug(event)===change.eventId);
    if(matches.length!==1)throw new Error(`Cannot uniquely identify ${change.eventId}; review the schedule before applying.`);
    const event=matches[0];
    for(const [field,next] of Object.entries(change.after)){
      const before=change.before[field]??null;
      const current=field==='timePending'&&before===null&&!event[field]?null:event[field]??null;
      if(JSON.stringify(current)!==JSON.stringify(next)&&JSON.stringify(current)!==JSON.stringify(before))throw new Error(`${change.eventId}: ${field} changed since review; current Admin edits were preserved.`);
    }
    Object.assign(event,change.after);
  }
  for(const addition of reviewed.scheduleAdditions??[]){
    const existing=datasets['schedule-events'].find(event=>eventSlug(event)===eventSlug(addition));
    if(!existing)datasets['schedule-events'].push(structuredClone(addition));
    else if(!existing.offWeek||existing.date!==addition.date)throw new Error(`${addition.eventId}: the off-week entry changed since review.`);
  }
  datasets['schedule-events'].sort((a,b)=>String(a.date).localeCompare(String(b.date))||String(a.league).localeCompare(String(b.league)));
  }
  if(section!=='schedule-events'){
  for(const record of reviewed.results){
    const matches=datasets.results.filter(race=>race.league===record.league&&(race.scheduleId===record.scheduleId||eventSlug(race)===eventSlug(record)));
    if(matches.length>1)throw new Error(`Duplicate results for ${record.scheduleId}; review before applying.`);
    if(!matches.length){datasets.results.push(structuredClone(record));continue;}
    const previous=matches[0];
    // A release backfill can fill unknowns in the earlier recap, or retain an
    // identical published record. It cannot erase a later official correction.
    if(!['official-recap','official-result'].includes(previous.pointsSource))throw new Error(`${record.scheduleId}: an independently edited result already exists; compare it with the source manually.`);
    const entries=record.entries.map(entry=>{
      const old=previous.entries?.find(row=>row.driver===entry.driver&&String(row.number)===String(entry.number));
      if(!old)throw new Error(`${record.scheduleId}: the recorded driver/number changed; review instead of replacing it.`);
      const merged={...old,...entry};
      for(const field of ['start','stage1Finish','stage1Points','stage2Finish','stage2Points','finish','racePoints']){
        if(entry[field]==null){merged[field]=old[field]??null;continue;}
        const unknown=old[field]==null||(['start','stage1Finish','stage2Finish'].includes(field)&&old[field]===0);
        if(!unknown&&old[field]!==entry[field])throw new Error(`${record.scheduleId}: ${entry.driver}'s ${field} differs from the reviewed result.`);
      }
      return merged;
    });
    if(previous.entries.length!==entries.length)throw new Error(`${record.scheduleId}: the published participant set changed; do not delete it automatically.`);
    Object.assign(previous,structuredClone(record),{entries});
  }
  datasets.results.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
  datasets.results.forEach((race,index)=>{race.featured=index===0;});
  }
  return {...publication,datasets,preparedUpdate:reviewed.id};
}

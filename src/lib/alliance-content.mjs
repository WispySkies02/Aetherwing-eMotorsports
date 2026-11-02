import {allianceIdFor,allianceFor} from './alliances.mjs';

// Preserve an explicitly edited relationship while retaining older venue/roster repairs.
export function preserveAllianceRelationship(fresh,record){
  if(!fresh||!Object.hasOwn(record||{},'allianceId'))return fresh||record;
  return {...fresh,...Object.fromEntries(['allianceId','type','label','platform'].filter(key=>Object.hasOwn(record,key)).map(key=>[key,record[key]]))};
}
export function alliancePrograms(records=[],alliances){
  return records.map(record=>{
    if(record?.type!=='alliance')return record;
    const organization=allianceFor(record,alliances);
    return {...record,allianceId:allianceIdFor(record),label:organization?`${organization.name} Alliance`:'Alliance Program',
      platform:record.platform==='Roblox / StarClutch Racing'?'Roblox':record.platform};
  });
}

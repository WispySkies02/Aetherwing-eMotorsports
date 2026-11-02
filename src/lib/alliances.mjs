import seed from '../data/alliances.json' with {type:'json'};

export const defaultAlliances=seed;
const owns=(row,key)=>Boolean(row&&Object.prototype.hasOwnProperty.call(row,key));

// Missing IDs belong to the legacy single-alliance model. An explicitly empty
// ID means unassigned and must never silently restore the old relationship.
export function allianceIdFor(record={}){
  if(!record||typeof record!=='object')return '';
  if(owns(record,'allianceId'))return typeof record.allianceId==='string'?record.allianceId.trim():'';
  return record.affiliation==='alliance'||record.type==='alliance'?'starclutch-racing':'';
}
export function allianceFor(record,alliances=defaultAlliances){
  const id=allianceIdFor(record);
  return id&&Array.isArray(alliances)?alliances.find(alliance=>alliance?.id===id)||null:null;
}
export function allianceName(record,alliances=defaultAlliances,short=false){
  const alliance=allianceFor(record,alliances);
  return String((short&&alliance?.shortName)||alliance?.name||'Alliance');
}

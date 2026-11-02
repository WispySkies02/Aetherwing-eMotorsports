// Owner-confirmed current identities from the November 1, 2026 roster update.
// Each record is migrated once; later Admin changes retain their authority.
export const currentRosterRevision='2026-11-01-v1';

const identities={
  matty:{handle:'@matty_campbell',legacy:'mymainisgone98'},
  eazy:{handle:'@deadmansrisin27_',legacy:'Eazyonthafarilla'}
};
const has=(value,key)=>Object.prototype.hasOwnProperty.call(value,key);
const isMediaKey=key=>/(?:image|photo|avatar|logo|signature|source)/i.test(key);
const isLinkKey=key=>/(?:url|href|links?)$/i.test(key)&&!isMediaKey(key);
const urlValue=value=>typeof value==='string'&&/^(?:https?:\/\/|\/(?!\/))/i.test(value);

function identityLinks(value,identity,inLinks=false){
  const token=new RegExp(`(^|%40|[^a-z0-9_])${identity.legacy}(?=$|[^a-z0-9_])`,'gi');
  const replace=link=>link.replace(token,(_match,prefix)=>prefix+identity.handle.slice(1));
  if(Array.isArray(value))return value.map(item=>typeof item==='string'&&inLinks&&urlValue(item)?replace(item):identityLinks(item,identity,inLinks));
  if(!value||typeof value!=='object')return value;
  return Object.fromEntries(Object.entries(value).map(([key,item])=>{
    if(isMediaKey(key))return [key,item];
    const links=inLinks||isLinkKey(key);
    if(typeof item==='string'&&links&&urlValue(item))return [key,replace(item)];
    if(item&&typeof item==='object')return [key,identityLinks(item,identity,links)];
    return [key,item];
  }));
}
function currentIdentityFields(row,identity){
  const next=identityLinks(row,identity);
  for(const key of ['handle','username','robloxUsername'])if(has(row,key)&&typeof row[key]==='string'){
    next[key]=key==='handle'||row[key].trim().startsWith('@')?identity.handle:identity.handle.slice(1);
  }
  return next;
}

export function reconcileCurrentAssignments(rows=[]){
  if(!Array.isArray(rows))return [];
  const sharedArt=new Set(rows.filter(row=>row?.competitionId==='kmart'&&String(row.number)==='29'&&row.id!=='matty-kmart')
    .flatMap(row=>[row.numberImage,row.numberImageBackup]).filter(Boolean));
  return rows.map(row=>{
    if(!row||row.currentRosterRevision===currentRosterRevision)return row;
    if(row.id==='matty-kmart'){
      const next=currentIdentityFields(row,identities.matty);
      const changedNumber=String(row.number)!=='3';
      Object.assign(next,{number:'3',status:'Full-Time',currentRosterRevision});
      if(!String(row.car||'').trim()||/^SCR\s*#29\s*PT$/i.test(row.car))next.car='SCR #3';
      for(const key of ['numberImage','numberImageBackup'])if(changedNumber||sharedArt.has(row[key]))next[key]='';
      return next;
    }
    // Assignment-specific identity fields are optional; never add a handle to
    // rows that use only a display name or change Eazy's number/status/artwork.
    if(row.profile==='eazy'&&['handle','username','robloxUsername'].some(key=>has(row,key))){
      return {...currentIdentityFields(row,identities.eazy),currentRosterRevision};
    }
    return row;
  });
}

export function reconcileCurrentProfiles(rows=[]){
  if(!Array.isArray(rows))return [];
  return rows.map(row=>{
    const identity=identities[row?.slug];
    if(!identity||row.currentRosterRevision===currentRosterRevision)return row;
    const next={...currentIdentityFields(row,identity),handle:identity.handle,currentRosterRevision};
    if(row.slug==='matty')Object.assign(next,{
      numbers:'3',feature:'Full-Time Entry',
      bio:'StarClutch Racing alliance driver driving the full-time Kmart #3 entry.'
    });
    return next;
  });
}

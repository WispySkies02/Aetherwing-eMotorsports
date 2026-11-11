// Owner-confirmed November 11, 2026 return: Will #33 Chevrolet; #42/#43 unsigned.
// Only recognized pre-return records migrate. A saved revision, explicit empty
// collection or unrelated custom record is authoritative, including later edits.
export const currentUarlRevision='2026-11-11-v1';
const marked=row=>row&&Object.hasOwn(row,'currentUarlRevision');
const identity=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const formerNumbers=new Map([['hailey',['28']],['wispy',['28']],['rocky',['46','92']],['burgertown2good',['32']],['burgertown',['32']],['gk3r',['42']]]);
const formerNumber=(name,number)=>(formerNumbers.get(identity(name))||[]).includes(String(number));
const formerIds=new Set(['wispy-uarl-d1','rocky-uarl-d1','burgertown-uarl-d1','gk3r-uarl-d1']);
const formerAssignment=row=>row?.competitionId==='uarl-d1'&&formerIds.has(row.id)&&!marked(row)&&formerNumber(row.profile||row.displayName,row.number);

export function reconcileUarlAssignments(rows=[]){
  if(!Array.isArray(rows)||!rows.some(formerAssignment))return rows;
  const next=rows.filter(row=>!formerAssignment(row));
  if(!next.some(row=>row?.competitionId==='uarl-d1'&&(row.id==='will-uarl-d1'||identity(row.profile||row.displayName)==='will'))){
    // Match the source ordering so a legacy cache cannot switch Will's leading
    // program/number to a different league after initial server rendering.
    next.splice(rows.findIndex(formerAssignment),0,{id:'will-uarl-d1',profile:'will',displayName:'Will',number:'33',competition:'UARL Division 1',competitionId:'uarl-d1',status:'Active',affiliation:'aetherwing',car:'Chevrolet',manufacturer:'Chevrolet',numberImage:'',currentUarlRevision});
  }
  return next;
}

export function reconcileUarlCharters(boards=[]){
  if(!Array.isArray(boards))return boards;
  return boards.map(board=>{
    if(board?.id!=='uarl-d1'||marked(board)||!Array.isArray(board.fullTime)||!board.fullTime.some(slot=>formerNumber(slot?.driver,slot?.number)))return board;
    return {...board,seriesNote:'Aetherwing Chevrolet return · #42 and #43 unsigned',fullTime:[
      {number:'33',driver:'Will',numberImage:''},
      {number:'42',driver:'Open',status:'Unsigned',numberImage:''},
      {number:'43',driver:'Open',status:'Unsigned',numberImage:''}
    ],openCharters:[],currentUarlRevision};
  });
}

export function reconcileUarlCompetitions(rows=[]){
  if(!Array.isArray(rows))return rows;
  return rows.map(row=>{
    if(row?.id!=='uarl-d1'||marked(row)||!Array.isArray(row.roster)||!row.roster.some(entry=>/^#(?:28\s+(?:Hailey|Wispy)|32\s+BurgerTown|(?:46|92)\s+Rocky|42\s+GK3R)/i.test(String(entry))))return row;
    return {...row,machine:'BBR Next-Gen Chevrolet',roster:['#33 Will','#42 UNSIGNED','#43 UNSIGNED'],currentUarlRevision};
  });
}

export function reconcileUarlProfiles(rows=[]){
  if(!Array.isArray(rows))return rows;
  return rows.map(row=>{
    if(!row||marked(row)||!Array.isArray(row.programs))return row;
    if(['hailey','wispy','rocky','burgertown2good'].includes(row.slug)&&row.programs.includes('UARL D1')){
      const next={...row,programs:row.programs.filter(program=>program!=='UARL D1'),currentUarlRevision};
      if(['rocky','burgertown2good'].includes(row.slug)){
        next.feature='Previous UARL D1 entry';
        const number=row.slug==='rocky'?'46':'32';
        if(row.bio===`Full-time Aetherwing UARL Division 1 driver in the #${number}.`)next.bio=`Previously raced for Aetherwing in UARL Division 1 in the #${number}.`;
      }
      return next;
    }
    if(row.slug!=='will'||row.programs.includes('UARL D1'))return row;
    const numbers=[...new Set(['33',...String(row.numbers||'').split(/\s*\/\s*/).filter(Boolean)])];
    const next={...row,numbers:numbers.join(' / '),programs:['UARL D1',...row.programs],feature:'Multi-program',currentUarlRevision};
    if(row.bio==='Aetherwing Creative Director and StarClutch Racing alliance competitor.')next.bio='Aetherwing Creative Director and current UARL Division 1 #33 Chevrolet driver, alongside his StarClutch Racing alliance competition in Kmart and Sunoco.';
    return next;
  });
}

export function reconcileUarlReturn(datasets={}){
  const next={...datasets};
  for(const [key,repair] of [['drivers',reconcileUarlAssignments],['charters',reconcileUarlCharters],['competitions',reconcileUarlCompetitions],['roster-profiles',reconcileUarlProfiles]]){
    if(Array.isArray(datasets?.[key]))next[key]=repair(datasets[key]);
  }
  return next;
}

// Migrate recognized current UARL D1 snapshots while preserving later edits.
const chevroletReturnRevision='2026-11-11-v1';
export const currentUarlRevision='2026-11-26-v1';
const gmMachine='BBR Next-Gen GM · Cadillac / Chevrolet';
const chevroletRoster=['#33 Will','#42 UNSIGNED','#43 UNSIGNED'];
const gmRoster=['#28 Hailey',...chevroletRoster];
const marked=row=>row&&Object.hasOwn(row,'currentUarlRevision');
const identity=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]/g,'');
const formerNumbers=new Map([['hailey',['28']],['wispy',['28']],['rocky',['46','92']],['burgertown2good',['32']],['burgertown',['32']],['gk3r',['42']]]);
const formerNumber=(name,number)=>(formerNumbers.get(identity(name))||[]).includes(String(number));
const formerIds=new Set(['wispy-uarl-d1','rocky-uarl-d1','burgertown-uarl-d1','gk3r-uarl-d1']);
const formerAssignment=row=>row?.competitionId==='uarl-d1'&&formerIds.has(row.id)&&!isHaileyGwm(row)&&!marked(row)&&formerNumber(row.profile||row.displayName,row.number);

function isHaileyGwm(row){
  return row?.competitionId==='uarl-d1'&&['hailey','wispy'].includes(identity(row.profile||row.displayName))
    && /\b(?:gwm|great wall(?: motor)?)\b/i.test([row.car,row.manufacturer].join(' '));
}

export function activeUarlAssignments(rows){
  return rows.filter(row=>!(row?.active===false&&isHaileyGwm(row)));
}

function reconcileChevroletAssignments(rows){
  if(!rows.some(formerAssignment))return rows;
  const next=rows.filter(row=>!formerAssignment(row));
  if(!next.some(row=>row?.competitionId==='uarl-d1'&&(row.id==='will-uarl-d1'||identity(row.profile||row.displayName)==='will'))){
    // Match the source ordering so a legacy cache cannot switch Will's leading
    // program/number to a different league after initial server rendering.
    next.splice(rows.findIndex(formerAssignment),0,{id:'will-uarl-d1',profile:'will',displayName:'Will',number:'33',competition:'UARL Division 1',competitionId:'uarl-d1',status:'Active',affiliation:'aetherwing',car:'Chevrolet',manufacturer:'Chevrolet',numberImage:'',currentUarlRevision:chevroletReturnRevision});
  }
  return next;
}

export function reconcileUarlAssignments(rows=[]){
  if(!Array.isArray(rows))return rows;
  const gwmIndex=rows.findIndex(row=>isHaileyGwm(row)&&row.active!==false);
  const deactivated=rows.map(row=>isHaileyGwm(row)&&row.active!==false
    ? {...row,active:false,status:'Inactive',currentUarlRevision}
    : row);
  const next=reconcileChevroletAssignments(deactivated);
  const willIndex=next.findIndex(row=>row?.id==='will-uarl-d1'&&row.competitionId==='uarl-d1'
    && row.profile==='will'&&String(row.number)==='33'&&row.manufacturer==='Chevrolet'
    && row.active!==false&&row.currentUarlRevision===chevroletReturnRevision);
  const hasActiveHailey=next.some(row=>row?.competitionId==='uarl-d1'&&row.active!==false
    && (String(row.number)==='28'||['hailey','wispy'].includes(identity(row.profile||row.displayName))));
  if(willIndex===-1&&gwmIndex===-1)return next;
  if(willIndex!==-1)next[willIndex]={...next[willIndex],currentUarlRevision};
  if(!hasActiveHailey&&!next.some(row=>row?.id==='hailey-uarl-d1-cadillac')){
    next.splice(willIndex===-1?next.findIndex(isHaileyGwm):willIndex,0,{
      id:'hailey-uarl-d1-cadillac',profile:'hailey',displayName:'Hailey',number:'28',
      competition:'UARL Division 1',competitionId:'uarl-d1',status:'Active',
      affiliation:'aetherwing',car:'Cadillac',manufacturer:'Cadillac',numberImage:'',currentUarlRevision
    });
  }
  return next;
}

export function reconcileUarlCharters(boards=[]){
  if(!Array.isArray(boards))return boards;
  return boards.map(board=>{
    if(board?.id!=='uarl-d1'||!Array.isArray(board.fullTime))return board;
    const legacy=!marked(board)&&board.fullTime.some(slot=>formerNumber(slot?.driver,slot?.number));
    const chevroletReturn=board.currentUarlRevision===chevroletReturnRevision
      && board.fullTime.map(slot=>`${slot.number}:${slot.driver}`).join(',')==='33:Will,42:Open,43:Open'
      && !board.openCharters?.length;
    if(!legacy&&!chevroletReturn)return board;
    const slots=legacy?[
      {number:'33',driver:'Will',numberImage:''},
      {number:'42',driver:'Open',status:'Unsigned',numberImage:''},
      {number:'43',driver:'Open',status:'Unsigned',numberImage:''}
    ]:board.fullTime;
    return {...board,seriesNote:'Aetherwing GM · #28 Cadillac / #33 Chevrolet · #42 and #43 open',
      fullTime:[{number:'28',driver:'Hailey',numberImage:''},...slots],openCharters:[],currentUarlRevision};
  });
}

export function reconcileUarlCompetitions(rows=[]){
  if(!Array.isArray(rows))return rows;
  return rows.map(row=>{
    if(row?.id!=='uarl-d1'||!Array.isArray(row.roster))return row;
    const legacy=!marked(row)&&row.roster.some(entry=>/^#(?:28\s+(?:Hailey|Wispy)|32\s+BurgerTown|(?:46|92)\s+Rocky|42\s+GK3R)/i.test(String(entry)));
    const chevroletReturn=row.currentUarlRevision===chevroletReturnRevision
      && row.machine==='BBR Next-Gen Chevrolet'&&row.roster.join(',')===chevroletRoster.join(',');
    if(!legacy&&!chevroletReturn)return row;
    return {...row,machine:gmMachine,roster:gmRoster,currentUarlRevision};
  });
}

export function reconcileUarlProfiles(rows=[]){
  if(!Array.isArray(rows))return rows;
  return rows.map(row=>{
    if(!row||!Array.isArray(row.programs))return row;
    if(row.slug==='hailey'&&row.currentUarlRevision===chevroletReturnRevision&&!row.programs.includes('UARL D1')){
      return {...row,programs:[...row.programs,'UARL D1'],currentUarlRevision};
    }
    if(marked(row))return row;
    if(row.slug==='hailey'&&row.programs.includes('UARL D1')){
      return {...row,programs:[...row.programs.filter(program=>program!=='UARL D1'),'UARL D1'],currentUarlRevision};
    }
    if(['wispy','rocky','burgertown2good'].includes(row.slug)&&row.programs.includes('UARL D1')){
      const next={...row,programs:row.programs.filter(program=>program!=='UARL D1'),currentUarlRevision:chevroletReturnRevision};
      if(['rocky','burgertown2good'].includes(row.slug)){
        next.feature='Previous UARL D1 entry';
        const number=row.slug==='rocky'?'46':'32';
        if(row.bio===`Full-time Aetherwing UARL Division 1 driver in the #${number}.`)next.bio=`Previously raced for Aetherwing in UARL Division 1 in the #${number}.`;
      }
      return next;
    }
    if(row.slug!=='will'||row.programs.includes('UARL D1'))return row;
    const numbers=[...new Set(['33',...String(row.numbers||'').split(/\s*\/\s*/).filter(Boolean)])];
    const next={...row,numbers:numbers.join(' / '),programs:['UARL D1',...row.programs],feature:'Multi-program',currentUarlRevision:chevroletReturnRevision};
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

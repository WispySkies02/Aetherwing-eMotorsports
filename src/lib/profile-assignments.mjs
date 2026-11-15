// Owner-confirmed profile context only. This is never a team-roster or charter
// assignment, and must not be used to calculate directory/program counts.
export const approvedHaileyProfileAssignment=Object.freeze({
  id:'hailey-gwm-uarl-d1',
  competitionId:'uarl-d1',
  competition:'UARL Division 1',
  number:'28',
  team:'Goat Whitlock Motorsports',
  status:'Active',
  active:true
});

const fields=new Set(['id','competitionId','competition','number','team','status','active']);
const text=(value,limit)=>typeof value==='string'&&value.trim().length>0&&value.length<=limit&&!/[<>\u0000-\u001f\u007f]/.test(value);
export function validProfileAssignment(row){
  return Boolean(row&&typeof row==='object'&&!Array.isArray(row)
    &&[...fields].every(key=>Object.hasOwn(row,key))
    &&Object.keys(row).every(key=>fields.has(key))
    &&text(row.id,100)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.id)
    &&text(row.competitionId,80)&&/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.competitionId)
    &&text(row.competition,160)&&text(row.number,32)&&text(row.team,160)&&text(row.status,80)
    &&typeof row.active==='boolean');
}

export function reconcileProfileAssignments(rows=[]){
  if(!Array.isArray(rows))return [];
  return rows.map(row=>row&&typeof row==='object'&&!Array.isArray(row)&&row.slug==='hailey'&&!Object.hasOwn(row,'profileAssignments')
    ?{...row,profileAssignments:[{...approvedHaileyProfileAssignment}]}
    :row);
}

export function profileAssignmentsFor(profile){
  return profile&&Object.hasOwn(profile,'profileAssignments')&&Array.isArray(profile.profileAssignments)
    ?profile.profileAssignments.filter(row=>validProfileAssignment(row)&&row.active===true)
    :[];
}

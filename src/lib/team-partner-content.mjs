export const approvedPartnerFields=['description','badge','category','profileLabel','tags','presenceTitle','presenceParagraphs','presenceTags','contentRevision'];

export function reconcileTeamPartners(rows=[],seed=[],names=['Palmetto Gaming','Apex Sim Racing']) {
  const list=Array.isArray(rows)?[...rows]:[];
  for(const name of names){
    const canonical=seed.find(item=>item?.name===name);if(!canonical)continue;
    const index=list.findIndex(item=>item?.name===name);
    if(index===-1){list.push(structuredClone(canonical));continue;}
    let current={...list[index]};
    if(current.contentRevision!==canonical.contentRevision){
      for(const field of approvedPartnerFields)if(Object.hasOwn(canonical,field))current[field]=structuredClone(canonical[field]);
    }
    if(name==='Palmetto Gaming'&&/hailey|personal/i.test(String(current.role||'')))current.role=canonical.role;
    list[index]=current;
  }
  const order=new Map(names.map((name,index)=>[name,index]));
  return list.sort((a,b)=>(order.get(a?.name)??99)-(order.get(b?.name)??99));
}

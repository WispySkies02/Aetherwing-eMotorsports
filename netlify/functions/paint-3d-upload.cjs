const {createHash,randomUUID}=require('node:crypto');
const STORE='aetherwing-3d-textures';
const respond=(code,body)=>({statusCode:code,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'},body:JSON.stringify(body)});
exports.handler=async(event,context)=>{
  const user=context?.clientContext?.user;
  const roles=user?.app_metadata?.roles||user?.app_metadata?.authorization?.roles||user?.roles||[];
  if (!user||!Array.isArray(roles)||!roles.some(r=>['admin','paint-admin'].includes(r))) return respond(403,{error:'Admin authorization required.'});
  if(event.httpMethod!=='POST')return respond(405,{error:'POST only.'});
  try{
    const input=JSON.parse(event.body||'{}');
    const {getStore}=await import('@netlify/blobs');
    const store=getStore({name:STORE,consistency:'strong'});
    if(input.action==='start'){
      const size=Number(input.bytes);
      if(!Number.isSafeInteger(size)||size<100||size>4*1024*1024)return respond(400,{error:'PNG must be 100 bytes to 4 MB.'});
      const id=randomUUID();
      const count=Math.ceil(size/(192*1024));
      await store.setJSON(`uploads/${id}/meta`,{owner:user.id||user.email, bytes:size,count,until:Date.now()+3600000});
      return respond(200,{id,count,chunkSize:192*1024});
    }
    const id=String(input.id||'');
    if(!/^[a-f0-9-]{36}$/.test(id))return respond(400,{error:'Bad upload session.'});
    const meta=await store.get(`uploads/${id}/meta`,{type:'json'});
    if(!meta||meta.owner!==(user.id||user.email)||meta.until<Date.now())return respond(403,{error:'Upload expired. Restart it.'});
    if(input.action==='chunk'){
      const index=Number(input.index);const data=String(input.data||'');
      if(!Number.isInteger(index)||index<0||index>=meta.count||data.length>270000||!/^[a-zA-Z0-9+/]*={0,2}$/.test(data))return respond(400,{error:'Invalid PNG chunk.'});
      await store.set(`uploads/${id}/part/${index}`,data);
      return respond(200,{ok:true,index});
    }
    if(input.action==='finish'){
      const chunks=[];
      for(let i=0;i<meta.count;i++){
        const data=await store.get(`uploads/${id}/part/${i}`);
        if(!data)return respond(400,{error:`Upload incomplete: chunk ${i} missing.`});
        chunks.push(Buffer.from(data,'base64'));
      }
      const png=Buffer.concat(chunks);
      if(png.length!==meta.bytes||png.length>4*1024*1024)return respond(400,{error:'PNG size mismatch.'});
      if(!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||png.toString('ascii',12,16)!=='IHDR'||png.toString('ascii',png.length-8,png.length-4)!=='IEND')return respond(400,{error:'This file is not a valid PNG.'});
      const width=png.readUInt32BE(16),height=png.readUInt32BE(20);
      if(width<64||height<64||width>8192||height>8192)return respond(400,{error:'PNG dimensions must be between 64 and 8192 pixels.'});
      const key=createHash('sha256').update(png).digest('hex');
      await store.set(`textures/${key}`,png.buffer.slice(png.byteOffset,png.byteOffset+png.byteLength));
      return respond(200,{ok:true,key,width,height,bytes:png.length});
    }
    return respond(400,{error:'Unknown upload operation.'});
  }catch(err){console.error('paint-3d-upload',err);return respond(500,{error:'PNG upload failed. Retry.'});}
};

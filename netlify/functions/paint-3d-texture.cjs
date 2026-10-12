exports.handler=async(event)=>{
  if(event.httpMethod!=='GET')return {statusCode:405,body:'GET only.'};
  const name=String(event.queryStringParameters?.id||'').replace(/\.png$/,'');
  if(!/^[a-f0-9]{64}$/.test(name))return {statusCode:404,body:'Not found.'};
  try{
    const {getStore}=await import('@netlify/blobs');
    const store=getStore({name:'aetherwing-3d-textures',consistency:'strong'});
    const bytes=await store.get('textures/'+name,{type:'arrayBuffer'});
    if(!bytes)return {statusCode:404,body:'Not found.'};
    return {statusCode:200,isBase64Encoded:true,headers:{'content-type':'image/png','cache-control':'public,max-age=31536000,immutable','access-control-allow-origin':'*','x-content-type-options':'nosniff'},body:Buffer.from(bytes).toString('base64')};
  }catch(err){console.error('paint-3d-texture',err);return {statusCode:503,body:'Temporarily unavailable.'};}
};

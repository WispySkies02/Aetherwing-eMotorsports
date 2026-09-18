async function identityUser(request) {
  const authorization = request.headers.get('authorization') || '';
  if (!/^Bearer \S+$/.test(authorization)) return null;
  const response = await fetch('https://aetherwing.net/.netlify/identity/user', {
    headers: { authorization, accept:'application/json' }, signal:AbortSignal.timeout(8000)
  });
  if ([401,403].includes(response.status)) return null;
  if (!response.ok) throw new Error('Identity verification is temporarily unavailable.');
  return response.json();
}
async function bridge(request, handler, authenticated = false) {
  try {
    const user = authenticated ? await identityUser(request) : null;
    const event = { httpMethod:request.method, headers:Object.fromEntries(request.headers), body:['GET','HEAD'].includes(request.method)?'':await request.text() };
    const result = await handler(event, { clientContext:{user} });
    return new Response(result.body, {status:result.statusCode,headers:result.headers});
  } catch (error) {
    console.error('admin-function', error);
    return new Response(JSON.stringify({error:'The service is temporarily unavailable. Check the Netlify function logs.'}),{status:503,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store'}});
  }
}
module.exports = { bridge };

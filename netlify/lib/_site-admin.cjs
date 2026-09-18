const { seeds, read, write, validate, json } = require('./_content.cjs');
async function rebuild() {
  const hook = process.env.AETHERWING_BUILD_HOOK;
  if (!hook) return { queued:false, message:'Set AETHERWING_BUILD_HOOK in the main Netlify project to publish site edits.' };
  const url = new URL(hook);
  if (url.protocol !== 'https:' || url.hostname !== 'api.netlify.com' || !url.pathname.startsWith('/build_hooks/')) throw new Error('Invalid build hook configuration.');
  const response = await fetch(url, { method:'POST', signal:AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`Rebuild request failed (${response.status}). Retry Publish site.`);
  return { queued:true, message:'Build queued. Public pages update when Netlify finishes the deployment.' };
}
exports.handler = async (event, context) => {
  try {
    const user = context?.clientContext?.user;
    const roles = user?.app_metadata?.roles || user?.app_metadata?.authorization?.roles || [];
    if (!user || !Array.isArray(roles) || !roles.includes('admin')) return json(403, { error:'The admin role is required for main-site editing.' });
    const { registry, etag } = await read();
    if (event.httpMethod === 'GET') return json(200, { registry, seeds:seeds(), publishConfigured:!!process.env.AETHERWING_BUILD_HOOK });
    if (event.httpMethod !== 'POST') return json(405, { error:'Method not allowed.' });
    let input;
    try { input = JSON.parse(event.body || '{}'); } catch { return json(400, { error:'Invalid JSON request.' }); }
    if (input.action === 'rebuild') return json(200, { registry, publication:await rebuild() });
    if (input.revision !== registry.revision) return json(409, { error:'Another session changed site content. Refresh before saving.' });
    const key = input.dataset;
    if (input.action === 'saveDraft') {
      const error = validate(key, input.data);
      if (error) return json(400, { error });
      registry.drafts[key] = input.data;
    } else if (input.action === 'discardDraft') {
      if (!(key in seeds())) return json(400, { error:'Unknown section.' });
      delete registry.drafts[key];
    } else if (input.action === 'publish') {
      if (!process.env.AETHERWING_BUILD_HOOK) return json(409, { error:'Save drafts first. Configure AETHERWING_BUILD_HOOK before publishing to the public site.' });
      const data = registry.drafts[key];
      if (!data) return json(400, { error:'Save a draft for this section before publishing.' });
      const error = validate(key, data);
      if (error) return json(400, { error });
      registry.published[key] = data;
      delete registry.drafts[key];
    } else return json(400, { error:'Unknown action.' });
    registry.revision += 1;
    registry.history = [{ action:input.action, dataset:key, at:new Date().toISOString(), by:user.email || user.sub }, ...(registry.history || [])].slice(0,100);
    await write(registry, etag);
    let publication = null;
    if (input.action === 'publish') {
      try { publication = await rebuild(); } catch (error) { publication = { queued:false, message:error.message }; }
    }
    return json(200, { registry, publication });
  } catch (error) {
    console.error('site-admin', error);
    return json(error.message === 'CONFLICT' ? 409 : 500, { error:error.message === 'CONFLICT' ? 'Another session saved first. Refresh before saving.' : 'Site content could not be saved. Check Netlify function logs.' });
  }
};

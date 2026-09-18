const registryApi = require('./_registry.cjs');

const {
  addRevision, readRegistry, sanitizeFeature, sanitizePaint,
  seedPaints, validatePaint, writeRegistry
} = registryApi;

function respond(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

function duplicateMessage(registry, paint, priorSlug = '') {
  const pool = [...seedPaints(), ...registry.paints, ...registry.drafts]
    .filter((item) => !priorSlug || item.slug !== priorSlug);
  if (pool.some((item) => item.slug === paint.slug)) return `The slug “${paint.slug}” is already in use.`;
  if (paint.schemeId && pool.some((item) => item.schemeId && item.schemeId === paint.schemeId)) {
    return `Scheme ID ${paint.schemeId} is already assigned to another paint.`;
  }
  return '';
}

exports.handler = async (event, context) => {
  try {
    if (!['GET', 'POST'].includes(event.httpMethod)) return respond(405, { error: 'Method not allowed.' }, { allow: 'GET, POST' });

    const user = context?.clientContext?.user || null;
    const roles = user?.app_metadata?.roles || user?.app_metadata?.authorization?.roles || user?.roles || [];
    if (!user || !Array.isArray(roles) || !roles.some((role) => role === 'admin' || role === 'paint-admin')) {
      return respond(403, { error: 'An Aetherwing administrator account is required.' });
    }

    const registry = await readRegistry();
    if (event.httpMethod === 'GET') return respond(200, { registry });

    let input;
    try { input = JSON.parse(event.body || '{}'); }
    catch { return respond(400, { error: 'Invalid JSON request.' }); }

    const action = input.action;

    if (action === 'savePaint') {
      const paint = sanitizePaint(input.paint);
      const validation = validatePaint(paint);
      if (validation) return respond(400, { error: validation });
      const status = input.status === 'draft' ? 'draft' : 'published';
      const priorSlug = String(input.priorSlug || '');
      const duplicate = duplicateMessage(registry, paint, priorSlug);
      if (duplicate) return respond(409, { error: duplicate });
      registry.paints = registry.paints.filter((item) => item.slug !== priorSlug && item.slug !== paint.slug);
      registry.drafts = registry.drafts.filter((item) => item.slug !== priorSlug && item.slug !== paint.slug);
      const savedPaint = { ...paint, status, archived: false, updatedAt: new Date().toISOString() };
      (status === 'draft' ? registry.drafts : registry.paints).push(savedPaint);
      if (registry.feature?.slug === priorSlug) {
        if (status === 'draft') registry.feature=null;
        else registry.feature.slug=paint.slug;
      }
      addRevision(registry, status === 'draft' ? 'draft.saved' : 'paint.published', paint.slug, user);
    } else if (action === 'setFeature') {
      const feature = sanitizeFeature(input.feature);
      if (!feature.slug || !feature.series || !feature.race || !feature.track || !feature.date) {
        return respond(400, { error: 'Paint, series, race, track, and date are required.' });
      }
      const exists = [...seedPaints(), ...registry.paints].some((paint) => paint.slug === feature.slug && !paint.archived);
      if (!exists) return respond(404, { error: 'That paint is not published.' });
      registry.feature = feature;
      addRevision(registry, 'feature.published', feature.slug, user);
    } else if (action === 'clearFeature') {
      registry.feature = null;
      addRevision(registry, 'feature.cleared', '', user);
    } else if (action === 'archivePaint') {
      const slug = String(input.slug || '');
      const paint = registry.paints.find((item) => item.slug === slug);
      if (!paint) return respond(404, { error: 'Only paints added through Aetherwing Admin can be archived here.' });
      paint.archived = input.archived !== false;
      paint.updatedAt = new Date().toISOString();
      if (paint.archived && registry.feature?.slug === slug) registry.feature = null;
      addRevision(registry, paint.archived ? 'paint.archived' : 'paint.restored', slug, user);
    } else {
      return respond(400, { error: 'Unknown Paint Operations action.' });
    }

    const saved = await writeRegistry(registry);
    return respond(200, { ok: true, registry: saved });
  } catch (error) {
    console.error('paint-admin', error);
    return respond(error.message==='CONFLICT'?409:500, { error:error.message==='CONFLICT'?'Another session saved first. Refresh and retry.':'Paint Operations could not save that change. Check the Netlify function logs.' });
  }
};

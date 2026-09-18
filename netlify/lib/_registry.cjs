const fs = require('node:fs');
const path = require('node:path');
let blobsModulePromise;
async function getBlobsModule() {
  blobsModulePromise ||= import('@netlify/blobs');
  return blobsModulePromise;
}

const STORE_NAME = 'aetherwing-paint-ops';
const REGISTRY_KEY = 'registry.json';
const EMPTY = Object.freeze({ version: 1, paints: [], drafts: [], feature: null, revisions: [] });

function cleanRegistry(value) {
  const registry = value && typeof value === 'object' ? value : {};
  return {
    version: 1,
    paints: Array.isArray(registry.paints) ? registry.paints : [],
    drafts: Array.isArray(registry.drafts) ? registry.drafts : [],
    feature: registry.feature && typeof registry.feature === 'object' ? registry.feature : null,
    revisions: Array.isArray(registry.revisions) ? registry.revisions.slice(0, 100) : []
  };
}

async function store() {
  const { getStore } = await getBlobsModule();
  return getStore({ name: STORE_NAME, consistency: 'strong' });
}

async function readRegistry() {
  try {
    const paintStore = await store();
    const entry = await paintStore.getWithMetadata(REGISTRY_KEY, { type: 'json' });
    const registry = cleanRegistry(entry?.data);
    Object.defineProperty(registry, '_etag', { value:entry?.etag });
    return registry;
  } catch (error) {
    if (/not found|404/i.test(String(error?.message || error))) return cleanRegistry(EMPTY);
    throw error;
  }
}

async function writeRegistry(registry) {
  const value = cleanRegistry(registry);
  const paintStore = await store();
  const result = await paintStore.setJSON(REGISTRY_KEY, value, registry._etag ? { onlyIfMatch:registry._etag } : { onlyIfNew:true });
  if (result?.modified === false) throw new Error('CONFLICT');
  return value;
}

function seedPaints() {
  const filename = [path.resolve(process.cwd(),'data/paint-seed.json'),path.resolve(__dirname,'../../data/paint-seed.json'),path.resolve(__dirname,'data/paint-seed.json')].find((p)=>fs.existsSync(p));
  if (!filename) throw new Error('Bundled paint seed is missing.');
  return JSON.parse(fs.readFileSync(filename, 'utf8')).paints || [];
}

function mergedPublishedPaints(registry) {
  const base = seedPaints();
  const overrides = new Map((registry.paints || []).map((paint) => [paint.slug, paint]));
  const baseSlugs = new Set(base.map((paint) => paint.slug));
  const paints = base.map((paint) => {
    const override = overrides.get(paint.slug);
    return override ? { ...paint, ...override, source: 'seed-override' } : { ...paint, source: 'seed' };
  });
  for (const paint of registry.paints || []) {
    if (!baseSlugs.has(paint.slug)) paints.push({ ...paint, source: paint.source || 'admin' });
  }
  return paints.filter((paint) => !paint.archived && paint.status !== 'draft').map((paint) => {
    const league = Array.isArray(paint.leagues) ? paint.leagues[0] : '';
    if (league === 'iracing' && ['Nicholas Waggoner','Hailey','Wispy'].includes(paint.driver)) {
      return { ...paint, driver: 'Hailey Bell', username: '' };
    }
    if (paint.slug === 'd2-mobil1-toyota-supra') {
      return { ...paint, historical: true, programStatus: 'closed-archive' };
    }
    return paint;
  });
}

function publicRegistry(registry) {
  const now = Date.now();
  const feature = registry.feature && (!registry.feature.expiresAt || Date.parse(registry.feature.expiresAt) > now)
    ? registry.feature : null;
  return { version: 1, paints: mergedPublishedPaints(registry), feature };
}

function json(statusCode, body, headers = {}) {
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

function text(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function slug(value) {
  return text(value, 80).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-{2,}/g, '-').replace(/^-+|-+$/g, '');
}

function safeUrl(value) {
  const candidate = text(value, 1600);
  try {
    const parsed = new URL(candidate);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.toString();
  } catch {
    return '';
  }
}

function sanitizePaint(input) {
  const league = slug(Array.isArray(input?.leagues) ? input.leagues[0] : input?.league);
  return {
    slug: slug(input?.slug),
    sponsor: text(input?.sponsor, 140),
    leagues: league ? [league] : [],
    leagueName: text(input?.leagueName, 80),
    number: text(input?.number, 12),
    driver: text(input?.driver, 100),
    username: text(input?.username, 100),
    schemeId: text(input?.schemeId, 40).replace(/[^0-9]/g, ''),
    manufacturer: text(input?.manufacturer, 80),
    body: text(input?.body, 140),
    image: safeUrl(input?.image),
    note: text(input?.note, 500),
    tags: Array.isArray(input?.tags) ? input.tags.map((item) => slug(item)).filter(Boolean).slice(0, 12) : [],
    special: Array.isArray(input?.special) ? input.special.map((item) => slug(item)).filter(Boolean).slice(0, 12) : [],
    debutRace: text(input?.debutRace, 160)
  };
}

function validatePaint(paint) {
  for (const key of ['slug', 'sponsor', 'driver', 'manufacturer', 'body', 'image']) {
    if (!paint[key]) return `Missing required field: ${key}.`;
  }
  if (!paint.leagues.length) return 'Missing required field: league.';
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(paint.slug)) return 'Invalid paint slug.';
  return '';
}

function sanitizeFeature(input) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text(input?.date, 10)) ? text(input.date, 10) : '';
  let expiresAt = text(input?.expiresAt, 40);
  if (expiresAt && Number.isNaN(Date.parse(expiresAt))) expiresAt = '';
  if (!expiresAt && date) {
    const expiry = new Date(`${date}T23:59:59Z`);
    expiry.setUTCDate(expiry.getUTCDate() + 1);
    expiresAt = expiry.toISOString();
  }
  return {
    slug: slug(input?.slug), series: text(input?.series, 80), race: text(input?.race, 140),
    track: text(input?.track, 140), date, message: text(input?.message, 280), expiresAt
  };
}

function addRevision(registry, action, detail, user) {
  registry.revisions = [{ action, detail, at: new Date().toISOString(), by: user?.email || user?.id || 'administrator' }, ...(registry.revisions || [])].slice(0, 100);
}

module.exports = {
  addRevision, json, mergedPublishedPaints, publicRegistry, readRegistry, sanitizeFeature, sanitizePaint,
  seedPaints, validatePaint, writeRegistry
};

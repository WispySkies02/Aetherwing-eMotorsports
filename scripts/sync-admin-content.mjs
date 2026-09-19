import fs from 'node:fs';
const target = new URL('../src/data/admin-content.json', import.meta.url);
const configured = process.env.AETHERWING_CONTENT_URL;
const endpoint = configured || (process.env.NETLIFY ? 'https://aetherwing.net/api/site-content' : '');

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function fetchPublishedContent(value) {
  let lastError;
  for (let attempt=0; attempt<4; attempt++) {
    const url = new URL(value);
    url.searchParams.set('admin_sync', `${Date.now()}-${attempt}`);
    try {
      const response = await fetch(url, {
        headers:{ accept:'application/json', 'cache-control':'no-cache' },
        signal:AbortSignal.timeout(15000)
      });
      if (response.status === 404 && !configured) return { firstDeployment:true };
      if (!response.ok) throw new Error(`Content sync returned ${response.status}.`);
      return { content:await response.json() };
    } catch (error) {
      lastError=error;
      if (attempt<3) await wait(750 * (attempt + 1));
    }
  }
  throw lastError;
}

function readBundledOverlay() {
  try {
    const parsed = JSON.parse(fs.readFileSync(target, 'utf8'));
    if (parsed && parsed.datasets && typeof parsed.datasets === 'object') return parsed;
  } catch {}
  return { version:1, revision:0, datasets:{} };
}

let content = readBundledOverlay();
if (endpoint) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Content endpoint must use HTTPS.');
  try {
    const result = await fetchPublishedContent(url);
    if (result.firstDeployment) {
      console.log('First deployment: using bundled site content.');
    } else {
      const next = result.content;
      if (!next.datasets || typeof next.datasets !== 'object') throw new Error('Invalid published content feed.');
      const { createRequire } = await import('node:module');
      const { validate } = createRequire(import.meta.url)('../netlify/lib/_content.cjs');
      for (const [key,data] of Object.entries(next.datasets)) {
        const error = validate(key,data);
        if (error) throw new Error(`${key}: ${error}`);
      }
      content = next;
    }
  } catch (error) {
    if (configured) throw error;
    console.warn(`WARNING: Published content sync unavailable (${error?.message || error}). Continuing with bundled/last-known content.`);
  }
}
fs.writeFileSync(target, `${JSON.stringify(content,null,2)}\n`);
console.log(`Site content revision ${content.revision || 0} prepared.`);

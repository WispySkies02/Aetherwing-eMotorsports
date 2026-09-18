import fs from 'node:fs';
const target = new URL('../src/data/admin-content.json', import.meta.url);
const configured = process.env.AETHERWING_CONTENT_URL;
const endpoint = configured || (process.env.NETLIFY ? 'https://aetherwing.net/api/site-content' : '');

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
    const response = await fetch(url, { headers:{ accept:'application/json' }, signal:AbortSignal.timeout(15000) });
    if (response.status === 404 && !configured) {
      console.log('First deployment: using bundled site content.');
    } else if (!response.ok) {
      const message = `Content sync returned ${response.status}.`;
      if (configured) throw new Error(message);
      console.warn(`WARNING: ${message} Continuing with bundled/last-known content so the deployment can repair the live admin backend.`);
    } else {
      const next = await response.json();
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

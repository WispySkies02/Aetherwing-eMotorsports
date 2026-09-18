import fs from 'node:fs';
const target = new URL('../src/data/admin-content.json', import.meta.url);
const configured = process.env.AETHERWING_CONTENT_URL;
const endpoint = configured || (process.env.NETLIFY ? 'https://aetherwing.net/api/site-content' : '');
let content = { version:1, revision:0, datasets:{} };
if (endpoint) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(url.hostname)) throw new Error('Content endpoint must use HTTPS.');
  const response = await fetch(url, { headers:{ accept:'application/json' }, signal:AbortSignal.timeout(15000) });
  if (response.status === 404 && !configured) console.log('First deployment: using bundled site content.');
  else {
    if (!response.ok) throw new Error(`Content sync failed (${response.status}); retaining the last live deployment.`);
    content = await response.json();
    if (!content.datasets || typeof content.datasets !== 'object') throw new Error('Invalid published content feed.');
    const { createRequire } = await import('node:module');
    const { validate } = createRequire(import.meta.url)('../netlify/lib/_content.cjs');
    for (const [key,data] of Object.entries(content.datasets)) {
      const error = validate(key,data);
      if (error) throw new Error(`${key}: ${error}`);
    }
  }
}
fs.writeFileSync(target, `${JSON.stringify(content,null,2)}\n`);
console.log(`Site content revision ${content.revision || 0} prepared.`);

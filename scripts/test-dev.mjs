import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.ASTRO_TELEMETRY_DISABLED='1';
const {dev}=await import('astro');
const server=await dev({root:new URL('../',import.meta.url),server:{host:'127.0.0.1',port:0},logLevel:'error'});
const base=`http://127.0.0.1:${server.address.port}`;
try {
  for(const path of ['/admin/','/admin/?login=1','/admin/?section=drivers','/admin/index.html']) {
    const response=await fetch(`${base}${path}`,{redirect:'manual'});
    assert.equal(response.status,200,`${path} must serve the Admin shell without a redirect`);
    assert.match(response.headers.get('content-type'),/text\/html/);
    const html=await response.text();
    assert.ok(html.includes('<title>Aetherwing Admin — Aetherwing eMotorsports</title>'));
    assert.ok(html.includes('data-auth-gate'),'Admin authentication UI must remain intact');
    assert.ok(html.includes('/admin/content-admin.js'),'Admin scripts must retain their asset URLs');
  }
  const weather = await fetch(`${base}/api/track-weather?track=unknown`);
  assert.equal(weather.status,404);
  assert.equal((await weather.json()).error,'Unknown venue','Development serves the actual weather handler');
  assert.equal((await fetch(`${base}/api/track-weather?track=Talladega`,{method:'POST'})).status,405);
  assert.equal((await fetch(`${base}/admin/`,{method:'HEAD'})).status,200);
  for(const path of ['/admin/content-admin.js','/admin/fresh-admin.css','/','/drivers/hailey/'])assert.equal((await fetch(`${base}${path}`)).status,200,`${path} must remain accessible`);
  assert.equal((await fetch(`${base}/admin/missing-fixture-file.js`)).status,404,'Admin fallback must not swallow unknown assets');
  const leagues=[...new Set(JSON.parse(fs.readFileSync(new URL('../src/data/schedule-events.json',import.meta.url),'utf8')).map(event=>event.league))];
  for(const path of ['/schedule/',...leagues.map(league=>`/schedule/${league}/`)]){
    const response=await fetch(`${base}${path}`,{redirect:'manual'});
    assert.equal(response.status,200,`${path} must serve a real schedule page`);
    const html=await response.text();
    assert.ok(html.includes('data-race-calendar'));
    assert.ok(html.includes(`https://aetherwing.net${path}`),'League pages must retain their own canonical URL');
  }
  assert.equal((await fetch(`${base}/schedule/kmart`)).status,200,'The shared link without a trailing slash must resolve');
  assert.equal((await fetch(`${base}/schedule?from=fixture`)).status,200,'The default schedule link without a trailing slash must resolve');
  assert.equal((await fetch(`${base}/schedule/not-a-real-league/`)).status,404,'Unknown league routes must remain 404s');
  console.log('PASS: canonical Admin development URL, login query, explicit index, HEAD, assets, public pages and missing-asset 404.');
} finally {
  await server.stop();
}

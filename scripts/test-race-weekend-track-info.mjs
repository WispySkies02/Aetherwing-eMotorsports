import assert from 'node:assert/strict';
import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import { trackDetails, trackFacts } from '../src/lib/track-details.mjs';
import { mountTrackInfo, weatherCondition } from '../src/lib/track-info-client.mjs';
import { createWeatherHandler, normalizeWeather } from '../netlify/lib/_track-weather.mjs';

const now = Date.parse('2026-10-19T17:15:00Z');
const hour = 3600000;
const fixture = (clock = now) => ({ properties: {
  meta: { updated_at: new Date(clock - 15 * 60000).toISOString() },
  timeseries: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Math.floor(clock / hour) * hour + i * hour).toISOString(),
    data: { instant: { details: { air_temperature: 20 + i, wind_speed: 5 } }, next_1_hours: {
      summary: { symbol_code: i ? 'lightrain_day' : 'clearsky_day' }, details: { precipitation_amount: 2.54 }
    } }
  }))
} });
const weather = (name = 'Talladega Superspeedway') => ({ ...normalizeWeather(fixture(), now), venue: name, timeZone: trackDetails(name).timeZone });

assert.deepEqual(trackDetails(' Talladega '), trackDetails('TALLADEGA SUPERSPEEDWAY'));
assert.equal(trackDetails('Charlotte Motor Speedway (Oval)').length, '1.50 mi');
assert.equal(trackDetails('Charlotte Motor Speedway (Roval)').length, '2.32 mi');
assert.equal(trackDetails('The Dirt Track At Charlotte').length, '0.40 mi');
assert.equal(trackDetails('Charlotte Motor Speedway UNKNOWN LAYOUT'), null, 'Do not infer a layout from partial matches');
assert.equal(trackDetails('Daytona Backstretch').length, undefined, 'A backstretch layout must not inherit the full oval');
assert.equal(trackDetails('EchoPark Speedway').city, 'HAMPTON, GA');
assert.equal(trackDetails('Echo Park Speedway').lat, trackDetails('Atlanta').lat);
assert.equal(trackDetails('Bristol').timeZone, 'America/New_York');
assert.equal(trackDetails('Five Flags Speedway').timeZone, 'America/Chicago');
assert.equal(trackDetails('Mount Panorama Circuit').timeZone, 'Australia/Sydney');
assert.equal(trackFacts(null).length, 0);
assert.equal(trackFacts(trackDetails('Talladega')).find(([key]) => key === 'Banking')[1], '16.5–33°');
const catalog = JSON.parse(fs.readFileSync(new URL('../src/data/track-specifications.json', import.meta.url)));
for (const name of [...Object.keys(catalog.tracks), ...Object.keys(catalog.aliases)]) {
  const info = trackDetails(name);
  assert.ok(info, `${name}: resolvable catalog entry`);
  assert.ok(Number.isFinite(info.lat) && Math.abs(info.lat) <= 90 && Number.isFinite(info.lon) && Math.abs(info.lon) <= 180);
  assert.doesNotThrow(() => new Intl.DateTimeFormat('en-US', { timeZone: info.timeZone }));
  if (info.source) assert.equal(new URL(info.source).protocol, 'https:');
}
const schedule = JSON.parse(fs.readFileSync(new URL('../src/data/schedule-events.json', import.meta.url)));
for (const race of schedule.filter(e => !e.offWeek)) assert.ok(trackDetails(race.track), `${race.track}: published venues need location/weather coverage`);
const normalized = normalizeWeather(fixture(), now);
assert.equal(normalized.current.temperatureF, 68);
assert.equal(normalized.current.windMph, 11);
assert.ok(Math.abs(normalized.current.rainInches - .1) < .00001);
assert.deepEqual(normalized.forecast.map(p => p.temperatureF), [73, 79, 84]);
assert.equal(normalized.current.time, '2026-10-19T17:00:00.000Z');
const oldPeriods = fixture(now - 3 * hour); oldPeriods.properties.timeseries.length = 2;
assert.throws(() => normalizeWeather(oldPeriods, now), /current forecast/);
assert.throws(() => normalizeWeather(fixture(now - 25 * hour), now), /Outdated/);
const short = fixture(); short.properties.timeseries.length = 4;
assert.throws(() => normalizeWeather(short, now), /Incomplete/);
const missing = fixture(); delete missing.properties.timeseries[0].data.instant.details.air_temperature;
assert.throws(() => normalizeWeather(missing, now), /Invalid/);
assert.equal(weatherCondition('lightrainshowersandthunder_night'), 'Light rain showers & thunder');
assert.equal(weatherCondition('<script>'), 'Conditions unavailable');

let requests = 0, clock = now;
const handler = createWeatherHandler({ now: () => clock, fetcher: async (url, options) => {
  requests++;
  const u = new URL(url);
  assert.equal(u.origin, 'https://api.met.no');
  assert.equal(u.searchParams.get('lat'), '33.5669');
  assert.equal(u.searchParams.get('lon'), '-86.0661');
  assert.match(options.headers['User-Agent'], /https:\/\/aetherwing.net\//);
  return Response.json(fixture(clock));
} });
const request = (name = 'Talladega', method = 'GET') => new Request(`https://aetherwing.net/api/track-weather?track=${encodeURIComponent(name)}`, { method });
const responses = await Promise.all([handler(request()), handler(request('Talladega Superspeedway'))]);
assert.equal(requests, 1, 'Concurrent aliases share a cached upstream request');
for (const response of responses) {
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Cache-Control'), /s-maxage=600/);
  assert.equal((await response.json()).venue, 'Talladega Superspeedway');
}
clock += 11 * 60000; assert.equal((await handler(request())).status, 200); assert.equal(requests, 2, 'Expired data refreshes');
assert.equal((await handler(request('https://untrusted.example/'))).status, 404);
const rejected = await handler(request('Talladega', 'POST'));
assert.equal(rejected.status, 405); assert.equal(rejected.headers.get('Allow'), 'GET');
assert.equal(requests, 2, 'Invalid input never reaches an arbitrary upstream URL');
let providerClock = now, providerCalls = 0;
const providerCache = createWeatherHandler({ now: () => providerClock, fetcher: async () => {
  providerCalls++;
  return Response.json(fixture(providerClock), { headers: { Expires: new Date(providerClock + 2 * hour).toUTCString() } });
} });
assert.equal((await (await providerCache(request())).json()).current.temperatureF, 68);
providerClock += hour;
assert.equal((await (await providerCache(request())).json()).current.temperatureF, 70, 'Cached model selects the new current hour');
assert.equal(providerCalls, 1, 'Honor provider Expires instead of refetching too early');
providerClock += hour + 60000;
assert.equal((await providerCache(request())).status, 200);
assert.equal(providerCalls, 2, 'Refresh once provider expiry passes');

let fails = true;
const retryHandler = createWeatherHandler({ now: () => now, fetcher: async () => {
  if (fails) return new Response('offline', { status: 503 });
  return Response.json(fixture());
} });
const offline = await retryHandler(request()); assert.equal(offline.status, 502); assert.equal(offline.headers.get('Cache-Control'), 'no-store');
fails = false; assert.equal((await retryHandler(request())).status, 200, 'Failures do not poison the retry cache');
const stale = createWeatherHandler({ now: () => now, fetcher: async () => Response.json(oldPeriods) });
assert.equal((await stale(request())).status, 502, 'Do not silently serve yesterday\'s weather as current');

const markup = `<div data-race-track-info data-track="Talladega"><dl data-track-facts></dl><p data-track-note></p><a data-track-source></a><section data-track-weather><p data-weather-status></p><button data-weather-retry></button><div data-weather-report hidden><strong data-weather-temperature></strong><span data-weather-condition></span><span data-weather-wind></span><p data-weather-valid></p><div data-weather-forecast></div><p data-weather-issued></p></div></section></div>`;
const dom = new JSDOM(markup, { pretendToBeVisual: true });
const root = dom.window.document.querySelector('[data-race-track-info]');
const select = name => root.querySelector(`[data-${name}]`);
const pending = [];
const destroy = mountTrackInfo(root, { fetcher: (url, options) => new Promise(resolve => pending.push({ url, options, resolve })) });
const change = track => { root.dataset.track = track; root.dispatchEvent(new dom.window.CustomEvent('aetherwing:track')); };
const settle = () => new Promise(resolve => setTimeout(resolve, 0));
try {
  assert.match(select('track-facts').textContent, /TALLADEGA, AL.*2.66 mi/s);
  change('Charlotte Motor Speedway (Oval)');
  assert.equal(pending[0].options.signal.aborted, true);
  pending[1].resolve(Response.json(weather('Charlotte Motor Speedway'))); await settle();
  assert.match(select('weather-temperature').textContent, /68°F/);
  assert.equal(select('weather-forecast').children.length, 3);
  assert.match(select('weather-valid').textContent, /EDT/, 'Venue-local time, not the browser timezone');
  pending[0].resolve(Response.json({ ...weather(), current: { ...weather().current, temperatureF: 99 } })); await settle();
  assert.equal(select('weather-temperature').textContent, '68°F', 'Late response for Talladega cannot replace Charlotte');
  change('Charlotte Roval'); assert.match(select('track-facts').textContent, /2.32 mi/);
  pending[2].resolve(new Response('offline', { status: 502 })); await settle();
  assert.equal(select('weather-retry').hidden, false); assert.match(select('weather-status').textContent, /unavailable/);
  select('weather-retry').click(); pending[3].resolve(Response.json(weather('Charlotte Motor Speedway Roval'))); await settle();
  assert.equal(select('weather-retry').hidden, true); assert.equal(select('weather-report').hidden, false);
  const count = pending.length; change(' Charlotte Motor Speedway (Roval) '); assert.equal(pending.length, count, 'Equivalent aliases avoid redundant weather calls');
  change('Unknown new track'); assert.equal(select('track-weather').hidden, true); assert.equal(select('track-facts').children.length, 0);
  assert.equal(select('track-source').hasAttribute('href'), false, 'Do not leave another venue\'s source link');
  change('Talladega');
  change('Unknown layout'); pending[4].resolve(Response.json(weather())); await settle();
  assert.equal(select('track-weather').hidden, true); assert.equal(select('weather-report').hidden, true, 'Late request cannot reveal a previous venue');
  change('Daytona Backstretch'); assert.doesNotMatch(select('track-facts').textContent, /2.50/); assert.match(select('track-note').textContent, /not been confirmed/);
  pending[5].resolve(Response.json({ ...weather('Daytona Backstretch'), forecast: [] })); await settle();
  assert.match(select('weather-status').textContent, /unavailable/, 'Malformed feed gets readable failure and retry');
} finally { destroy(); dom.window.close(); }
console.log('PASS: venue/layout aliases, geographic coverage, timezones, weather normalization/cache/errors, retry and stale-request protection.');

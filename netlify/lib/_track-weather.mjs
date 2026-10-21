import { trackDetails } from '../../src/lib/track-details.mjs';
import { weatherProvider } from '../../src/lib/weather-provider.mjs';
import { createNwsFetcher, normalizeNwsWeather } from './_nws-weather.mjs';

const TTL = 10 * 60 * 1000;
const number = value => typeof value === 'number' && Number.isFinite(value);
const forecastPeriod = row => {
  const details = row?.data?.instant?.details;
  if (!row || !number(details?.air_temperature) || !number(details?.wind_speed)) throw new Error('Invalid weather period');
  const next = row.data.next_1_hours;
  return {
    time: row.time,
    temperatureF: Math.round(details.air_temperature * 9 / 5 + 32),
    windMph: Math.round(details.wind_speed * 2.236936),
    condition: (next ?? row.data.next_6_hours)?.summary?.symbol_code ?? 'unknown',
    rainInches: number(next?.details?.precipitation_amount) ? next.details.precipitation_amount / 25.4 : null
  };
};

export function normalizeWeather(data, now = Date.now()) {
  const issued = Date.parse(data?.properties?.meta?.updated_at);
  if (!Number.isFinite(issued) || now - issued > 24 * 60 * 60 * 1000 || issued > now + 60 * 60 * 1000) throw new Error('Outdated weather');
  const rows = data?.properties?.timeseries;
  if (!Array.isArray(rows)) throw new Error('Missing weather');
  const current = rows.findLast(row => Date.parse(row.time) <= now) ?? rows[0];
  if (!current || Math.abs(Date.parse(current.time) - now) > 90 * 60 * 1000) throw new Error('No current forecast');
  const forecast = [3, 6, 9].map(hours => rows.find(row => Date.parse(row.time) >= Date.parse(current.time) + hours * 3600000));
  if (forecast.some(row => !row)) throw new Error('Incomplete forecast');
  return { issuedAt: new Date(issued).toISOString(), current: forecastPeriod(current), forecast: forecast.map(forecastPeriod) };
}

export function createWeatherHandler({ fetcher = fetch, now = Date.now } = {}) {
  // Coordinates are catalog-owned, not arbitrary input; bounded cache also joins concurrent requests.
  const cache = new Map();
  const nws = createNwsFetcher({ fetcher, now });
  return async request => {
    const json = (data, status = 200) => Response.json(data, { status, headers: status === 200 ? {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Netlify-CDN-Cache-Control': 'public, s-maxage=600'
    } : { 'Cache-Control': 'no-store', ...(status === 405 ? { Allow: 'GET' } : {}) } });
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const venue = trackDetails(new URL(request.url).searchParams.get('track'));
    if (!venue) return json({ error: 'Unknown venue' }, 404);
    const key = `${venue.lat.toFixed(4)},${venue.lon.toFixed(4)}`;
    const provider = weatherProvider(venue);
    try {
      let entry = cache.get(key);
      if (!entry || entry.expires <= now()) {
        entry = { expires: now() + TTL };
        const pending = entry;
        entry.promise = (async () => {
          const response = provider.id === 'nws' ? await nws(key) : await fetcher(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${venue.lat.toFixed(4)}&lon=${venue.lon.toFixed(4)}`, {
            headers: { 'User-Agent': 'Aetherwing-eMotorsports/1.0 (https://aetherwing.net/)', Accept: 'application/json' },
            signal: AbortSignal.timeout(8000)
          });
          if (!response.ok) throw new Error('Weather service unavailable');
          // Respect the provider's cache expiry even when it exceeds ten minutes.
          const expires = Date.parse(response.headers.get('Expires'));
          if (Number.isFinite(expires)) pending.expires = Math.max(pending.expires, expires);
          return response.json();
        })();
        cache.set(key, entry);
      }
      // Re-select the current hour from the cached model as the clock advances.
      const weather = (provider.id === 'nws' ? normalizeNwsWeather : normalizeWeather)(await entry.promise, now());
      return json({ ...weather, provider:provider.id, venue: venue.name, timeZone: venue.timeZone });
    } catch {
      cache.delete(key);
      return json({ error: 'Weather is temporarily unavailable' }, 502);
    }
  };
}

const hour = 3600000;
const number = value => typeof value === 'number' && Number.isFinite(value);
const symbols = {
  skc:'clearsky', few:'fair', sct:'partlycloudy', bkn:'partlycloudy', ovc:'cloudy',
  wind_skc:'clearsky', wind_few:'fair', wind_sct:'partlycloudy', wind_bkn:'partlycloudy', wind_ovc:'cloudy',
  rain:'rain', rain_showers:'rainshowers', rain_showers_hi:'rainshowers',
  snow:'snow', sleet:'sleet', rain_snow:'sleet', rain_sleet:'sleet', snow_sleet:'sleet',
  fzra:'sleet', rain_fzra:'sleet', snow_fzra:'sleet',
  tsra:'rainandthunder', tsra_sct:'rainshowersandthunder', tsra_hi:'heavyrainandthunder',
  blizzard:'heavysnow', fog:'fog', haze:'fog', smoke:'fog', dust:'fog'
};

function condition(row) {
  // NWS can combine two conditions in one icon URL. Prefer hazardous precipitation.
  let codes = [];
  try {
    const url = new URL(row.icon);
    if (url.origin === 'https://api.weather.gov') codes = url.pathname.split('/').slice(4).map(part => part.split(',')[0]);
  } catch { /* Unknown conditions retain readable NWS text and a neutral icon. */ }
  const values = codes.map(code => symbols[code]).filter(Boolean);
  const symbol = values.find(value => value.includes('thunder')) ?? values.find(value => /rain|snow|sleet/.test(value)) ?? values[0];
  return symbol ? `${symbol}_${row.isDaytime ? 'day' : 'night'}` : 'unknown';
}

function forecastPeriod(row) {
  if (!number(row.temperature) || !['F','C'].includes(row.temperatureUnit)) throw new Error('Invalid NWS temperature');
  const wind = typeof row.windSpeed === 'string' ? row.windSpeed.match(/^(\d+(?:\.\d+)?)(?: to (\d+(?:\.\d+)?))? mph$/) : null;
  const calm = row.windSpeed === 'Calm';
  if (!wind && !calm) throw new Error('Invalid NWS wind');
  const chance = row.probabilityOfPrecipitation?.value;
  return {
    time:new Date(row.startTime).toISOString(),
    temperatureF:Math.round(row.temperatureUnit === 'C' ? row.temperature * 9 / 5 + 32 : row.temperature),
    windMph:calm ? 0 : Math.round((Number(wind[1]) + Number(wind[2] ?? wind[1])) / 2),
    windDescription:row.windSpeed,
    condition:condition(row),
    description:typeof row.shortForecast === 'string' ? row.shortForecast.slice(0,160) : '',
    rainInches:null,
    precipitationChance:number(chance) && chance >= 0 && chance <= 100 ? chance : null
  };
}

export function normalizeNwsWeather(data, now = Date.now()) {
  const issued = Date.parse(data?.properties?.updateTime ?? data?.properties?.generatedAt);
  if (!Number.isFinite(issued) || now - issued > 24 * hour || issued > now + hour) throw new Error('Outdated NWS forecast');
  const rows = data?.properties?.periods;
  if (!Array.isArray(rows)) throw new Error('Missing NWS forecast');
  const current = rows.find(row => Date.parse(row.startTime) <= now && Date.parse(row.endTime) > now);
  if (!current || now - Date.parse(current.startTime) > 90 * 60000) throw new Error('No current NWS forecast');
  const forecast = [3,6,9].map(hours => rows.find(row => Date.parse(row.startTime) === Date.parse(current.startTime) + hours * hour && Date.parse(row.endTime) > Date.parse(row.startTime)));
  if (forecast.some(row => !row)) throw new Error('Incomplete NWS forecast');
  return { issuedAt:new Date(issued).toISOString(), current:forecastPeriod(current), forecast:forecast.map(forecastPeriod) };
}

export function createNwsFetcher({ fetcher = fetch, now = Date.now } = {}) {
  const points = new Map();
  const get = async (url, signal) => {
    const response = await fetcher(url, {
      headers:{ 'User-Agent':'Aetherwing-eMotorsports/1.0 (https://aetherwing.net/)', Accept:'application/geo+json' },
      signal
    });
    if (!response.ok) throw new Error('NWS unavailable');
    return response;
  };
  return async key => {
    const signal = AbortSignal.timeout(8000);
    let point = points.get(key);
    if (!point || point.expires <= now()) {
      const response = await get(`https://api.weather.gov/points/${key}`, signal);
      const url = new URL((await response.json())?.properties?.forecastHourly);
      if (url.origin !== 'https://api.weather.gov' || !/^\/gridpoints\/[A-Z]{3,4}\/-?\d+,-?\d+\/forecast\/hourly$/.test(url.pathname) || url.search || url.hash || url.username || url.password) throw new Error('Invalid NWS grid');
      point = { url:url.href, expires:now() + 24 * hour };
      points.set(key, point);
    }
    return get(point.url, signal);
  };
}

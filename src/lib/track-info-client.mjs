import { trackDetails, trackFacts } from './track-details.mjs';
import { createWeatherIcon } from './weather-icons.mjs';
import { weatherProvider } from './weather-provider.mjs';

const symbols = {
  clearsky:'Clear', fair:'Mostly clear', partlycloudy:'Partly cloudy', cloudy:'Cloudy', fog:'Fog',
  lightrain:'Light rain', rain:'Rain', heavyrain:'Heavy rain', lightsleet:'Light sleet', sleet:'Sleet',
  heavysleet:'Heavy sleet', lightsnow:'Light snow', snow:'Snow', heavysnow:'Heavy snow',
  lightrainshowers:'Light rain showers', rainshowers:'Rain showers', heavyrainshowers:'Heavy rain showers',
  lightsleetshowers:'Light sleet showers', sleetshowers:'Sleet showers', heavysleetshowers:'Heavy sleet showers',
  lightsnowshowers:'Light snow showers', snowshowers:'Snow showers', heavysnowshowers:'Heavy snow showers'
};
export function weatherCondition(code = '') {
  const symbol = String(code).replace(/_(day|night|polartwilight)$/, '');
  if (symbol.endsWith('andthunder')) return `${symbols[symbol.replace(/andthunder$/, '')] ?? 'Showers'} & thunder`;
  return symbols[symbol] ?? 'Conditions unavailable';
}

export function mountTrackInfo(root, { fetcher = fetch, refreshMs = 600000 } = {}) {
  const document = root.ownerDocument, window = document.defaultView;
  const select = key => root.querySelector(`[data-${key}]`);
  const text = (key, value) => { select(key).textContent = value; };
  const element = (tag, value) => { const node = document.createElement(tag); node.textContent = value; return node; };
  let venue, requestId = 0, controller, timer, destroyed = false;
  const time = (date, full = false) => new Intl.DateTimeFormat('en-US', {
    timeZone: venue.timeZone, ...(full ? { month:'short', day:'numeric' } : { weekday:'short' }),
    hour:'numeric', minute: full ? '2-digit' : undefined, timeZoneName:'short'
  }).format(new Date(date));
  const status = message => text('weather-status', message);
  const loadWeather = async () => {
    controller?.abort();
    const id = ++requestId;
    if (!venue || destroyed) return;
    const requestController = new AbortController();
    controller = requestController;
    const timeout = window.setTimeout(() => requestController.abort(), 10000);
    select('weather-report').hidden = true;
    select('weather-retry').hidden = true;
    select('track-weather').setAttribute('aria-busy', 'true');
    status('Loading venue weather…');
    try {
      const response = await fetcher(`/api/track-weather?track=${encodeURIComponent(venue.name)}&v=2`, { signal: requestController.signal });
      if (!response.ok) throw new Error('Weather unavailable');
      const weather = await response.json();
      if (id !== requestId || destroyed) return;
      const validPeriod = period => period && Number.isFinite(Date.parse(period.time)) && Number.isFinite(period.temperatureF) && Number.isFinite(period.windMph);
      if (weather.venue !== venue.name || weather.provider !== weatherProvider(venue).id || !validPeriod(weather.current) || !Number.isFinite(Date.parse(weather.issuedAt)) || !Array.isArray(weather.forecast) || weather.forecast.length !== 3 || !weather.forecast.every(validPeriod)) throw new Error('Invalid weather');
      select('weather-current-icon').replaceChildren(createWeatherIcon(document, weather.current.condition));
      text('weather-temperature', `${weather.current.temperatureF}°F`);
      text('weather-condition', weather.current.description || weatherCondition(weather.current.condition));
      text('weather-wind', `Wind ${weather.current.windDescription || `${weather.current.windMph} mph`}`);
      text('weather-valid', `Current forecast · ${time(weather.current.time)}`);
      const periods = weather.forecast.map(period => {
        const tile = element('div', '');
        const stamp = element('time', time(period.time)); stamp.dateTime = period.time;
        tile.append(stamp, createWeatherIcon(document, period.condition), element('strong', `${period.temperatureF}°F`), element('span', period.description || weatherCondition(period.condition)));
        if (Number.isFinite(period.precipitationChance)) tile.append(element('small', `Precip. chance ${Math.round(period.precipitationChance)}%`));
        if (Number.isFinite(period.rainInches)) tile.append(element('small', `Rain ${period.rainInches.toFixed(2)} in / hr`));
        return tile;
      });
      select('weather-forecast').replaceChildren(...periods);
      text('weather-issued', `Issued ${time(weather.issuedAt, true)} · times local to venue`);
      select('weather-report').hidden = false;
      status('');
    } catch {
      if (id !== requestId || destroyed) return;
      status('Weather temporarily unavailable. Track details are still available.');
      select('weather-retry').hidden = false;
    } finally {
      window.clearTimeout(timeout);
      if (id === requestId && !destroyed) select('track-weather').setAttribute('aria-busy', 'false');
    }
  };
  const setTrack = () => {
    const next = trackDetails(root.dataset.track);
    if (venue?.name === next?.name && venue !== undefined) return;
    venue = next;
    const facts = trackFacts(venue).map(([label, value]) => {
      const row = element('div', ''); row.append(element('dt', label), element('dd', value)); return row;
    });
    select('track-facts').replaceChildren(...facts);
    text('track-note', !venue ? 'Track information will appear once the venue is confirmed.' : !venue.length ? 'Layout specifications have not been confirmed.' : 'Venue reference · league layouts may vary.');
    const source = select('track-source'); source.hidden = !venue?.source;
    if (venue?.source) source.href = venue.source; else source.removeAttribute('href');
    const provider = weatherProvider(venue), credit = select('weather-provider');
    credit.textContent = `${provider.label} ↗`; credit.href = provider.url;
    select('track-weather').hidden = !venue;
    select('weather-report').hidden = true;
    void loadWeather();
  };
  const retry = () => void loadWeather();
  root.addEventListener('aetherwing:track', setTrack);
  select('weather-retry').addEventListener('click', retry);
  setTrack();
  timer = window.setInterval(() => { if (!document.hidden) void loadWeather(); }, refreshMs);
  return () => {
    destroyed = true; ++requestId; controller?.abort(); window.clearInterval(timer);
    root.removeEventListener('aetherwing:track', setTrack); select('weather-retry').removeEventListener('click', retry);
  };
}

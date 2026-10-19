// Original, local SVG artwork. Provider condition text remains the accessible label.
const NS = 'http://www.w3.org/2000/svg';
const cloud = 'M8 23h15a5 5 0 0 0 .3-10A7.5 7.5 0 0 0 9 11a6 6 0 0 0-1 12Z';
const moon = 'M21 4a10 10 0 1 0 7 15A9 9 0 0 1 21 4Z';
const sunRays = 'M16 2v3m0 22v3M2 16h3m22 0h3M6 6l2 2m16 16 2 2M6 26l2-2M24 8l2-2';

export function weatherIconKind(code = '') {
  const symbol = String(code).replace(/_(day|night|polartwilight)$/, '');
  const night = /_night$/.test(String(code));
  const precipitation = symbol.match(/^(?:light|heavy)?(rain|sleet|snow)(?:showers)?(andthunder)?$/);
  if (precipitation) return precipitation[2] ? 'thunder' : precipitation[1];
  if (symbol === 'fog') return 'fog';
  if (symbol === 'clearsky') return night ? 'moon' : 'sun';
  if (symbol === 'fair' || symbol === 'partlycloudy') return night ? 'partly-night' : 'partly-day';
  if (symbol === 'cloudy') return 'cloud';
  return 'unknown';
}

export function createWeatherIcon(document, code) {
  const kind = weatherIconKind(code);
  const svg = document.createElementNS(NS, 'svg');
  for (const [name, value] of Object.entries({
    viewBox:'0 0 32 32', width:'32', height:'32', class:'race-weather-icon',
    fill:'none', stroke:'currentColor', 'stroke-width':'1.8',
    'stroke-linecap':'round', 'stroke-linejoin':'round', 'aria-hidden':'true', focusable:'false'
  })) svg.setAttribute(name, value);
  svg.dataset.weatherIcon = kind;
  const shape = (tag, attributes, parent = svg) => {
    const node = document.createElementNS(NS, tag);
    for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, String(value));
    parent.append(node); return node;
  };
  const sun = (parent = svg) => {
    shape('circle', { cx:16, cy:16, r:6, class:'race-weather-icon__sun' }, parent);
    shape('path', { d:sunRays, class:'race-weather-icon__sun' }, parent);
  };
  if (kind === 'sun') sun();
  else if (kind === 'moon') shape('path', { d:moon, class:'race-weather-icon__sun' });
  else if (kind.startsWith('partly-')) {
    const small = shape('g', { transform:'translate(1 -1) scale(.65)' });
    if (kind === 'partly-night') shape('path', { d:moon, class:'race-weather-icon__sun' }, small);
    else sun(small);
    shape('path', { d:'M9 25h15a5 5 0 0 0 0-10 7 7 0 0 0-13-1A5.5 5.5 0 0 0 9 25Z', class:'race-weather-icon__cloud' });
  } else if (kind !== 'unknown') {
    shape('path', { d:cloud, class:'race-weather-icon__cloud', ...(kind === 'cloud' ? {} : { transform:'translate(1 -3) scale(.94)' }) });
    if (kind === 'rain' || kind === 'sleet') shape('path', { d:kind === 'sleet' ? 'M10 23l-1 4m14-4-1 4' : 'M10 23l-1 4m8-4-1 4m8-4-1 4', class:'race-weather-icon__rain' });
    if (kind === 'snow' || kind === 'sleet') shape('path', { d:kind === 'sleet' ? 'M16 23v7m-3-5 6 3m-6 0 6-3' : 'M9 23v7m-3-5 6 3m-6 0 6-3M23 23v7m-3-5 6 3m-6 0 6-3', class:'race-weather-icon__rain' });
    if (kind === 'thunder') shape('path', { d:'m17 21-4 6h5l-2 4 7-8h-5l2-3', class:'race-weather-icon__sun' });
    if (kind === 'fog') shape('path', { d:'M5 24h22M8 28h17' });
  } else {
    shape('circle', { cx:16, cy:16, r:11 });
    shape('path', { d:'M13 12a3 3 0 1 1 4 3c-1 .5-1 1-1 3m0 4h.01' });
  }
  return svg;
}

# Race Weekend venue information

The first Race Weekend card includes location, track size, layout, surface and
banking where reference specifications are confirmed. References describe the
real-world venue; league/simulator configurations can differ. The reference link
identifies the source. Unknown venues or layouts never inherit specifications
from a partial name match.

- `src/data/schedule-track-locations.json` owns venue coordinates, cities and
  existing short-name aliases. Echo Park is the renamed Atlanta venue in Hampton,
  Georgia, rather than Denver.
- `src/data/track-specifications.json` contains sourced reference specifications
  checked October 19, 2026, and additional exact aliases. Keep Charlotte's oval,
  Roval and dirt track separate. Add a new specification only when the layout is
  known; unresolved sizes/banking remain unset. Multi-layout reference lengths
  explicitly identify their configurations. This catalog does not change races,
  official results or historical records.
- `src/lib/track-details.mjs` resolves the same catalog on the server and client.
  Venue-local IANA time zones support daylight-saving changes, including Eastern
  Bristol and Central Pensacola exceptions.

## Weather

`GET /api/track-weather?track=Talladega` runs the read-only Netlify
`track-weather` function. The Astro development server runs the same handler.
No API key or user location permission is required. Only catalog-owned
coordinates can be queried; callers cannot provide arbitrary coordinates or
upstream URLs.

U.S. tracks use the National Weather Service's hourly forecast, resolved through
`api.weather.gov/points` using catalog-owned coordinates. Point-to-grid metadata
is cached for 24 hours; forecast requests share the existing ten-minute cache.
Both calls share an eight-second timeout, and grid URLs are restricted to the
official NWS hourly forecast endpoint. No API key is needed.
The browser adds `v=2` to its weather request so the provider-aware response is
not confused with an older cached MET-only response during deployment.

International tracks retain MET Norway's Locationforecast. Provider selection
uses the catalog's city/state geography, not the browser location. The provider
link updates with the selected venue, including its required attribution.

Both sources supply forecasts, not live observations or simulator weather. The
card shows current forecast conditions, wind and three later forecast times
(+3/+6/+9 hours). NWS precipitation is labeled as a chance in percent; MET
precipitation is forecast accumulation during the next hour in inches. Unknown
precipitation values stay absent rather than being presented as zero. Times are local
to the venue; forecast issue and valid times remain visible on historical event
pages too, so current weather is not mistaken for race-day weather.

The endpoint coalesces requests and caches each coordinate for at least ten
minutes, honoring a later provider Expires time. It selects the current forecast
hour from that cached model as time advances. Netlify's shared cache lasts ten
minutes and browser caching five minutes.
The client refreshes every ten minutes while visible. Network requests time out,
malformed/outdated forecasts are rejected, and failures show a retry control
without hiding track facts. Venue changes from published Admin content clear
previous facts/weather and invalidate older requests. No Admin write or
publication behavior changes.

Local cloud shells using an outbound HTTPS proxy may need
`NODE_USE_ENV_PROXY=1` when starting Astro or running a live upstream smoke check.
Production Netlify uses its normal network access. No credentials are saved.

## Weather icons

Current and forecast conditions include local SVG icons for clear day/night,
partly cloudy day/night, overcast, rain, sleet, snow, fog and thunderstorms.
They retain the readable condition text, use the site's active accent colors,
and make no extra image requests. Unknown condition codes use a neutral icon.
Both providers use these local icons; NWS condition codes are normalized while
its original forecast descriptions remain readable alongside the artwork.

## Verification

`npm run test:all` includes venue resolution, published venue coverage, weather
conversion, cache expiry/coalescing, stale-feed rejection, retries, request races,
development routing and function packaging. Build before running
`npm run test:public:browser`; it checks the built card at 1440, 390 and 320 pixels
using deterministic weather responses and live publication venue changes.
The browser suite does not publish to the production Admin or deploy anything.

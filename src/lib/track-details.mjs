import geography from '../data/schedule-track-locations.json' with { type: 'json' };
import specifications from '../data/track-specifications.json' with { type: 'json' };

const normalize = value => String(value ?? '').trim().toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');
const aliases = new Map(Object.keys(geography.locations).map(name => [normalize(name), name]));
for (const [alias, name] of Object.entries({ ...geography.aliases, ...specifications.aliases })) aliases.set(normalize(alias), name);
const zones = {
  AL:'America/Chicago', AR:'America/Chicago', CA:'America/Los_Angeles', CO:'America/Denver',
  DE:'America/New_York', FL:'America/New_York', GA:'America/New_York', IA:'America/Chicago',
  IL:'America/Chicago', IN:'America/Indiana/Indianapolis', KS:'America/Chicago', ME:'America/New_York',
  MI:'America/Detroit', NC:'America/New_York', NH:'America/New_York', NV:'America/Los_Angeles',
  NY:'America/New_York', OH:'America/New_York', OK:'America/Chicago', OR:'America/Los_Angeles',
  PA:'America/New_York', SC:'America/New_York', TN:'America/Chicago', TX:'America/Chicago',
  VA:'America/New_York', WI:'America/Chicago', WV:'America/New_York', AZ:'America/Phoenix',
  MX:'America/Mexico_City', UK:'Europe/London', IT:'Europe/Rome', JP:'Asia/Tokyo',
  PT:'Europe/Lisbon', AU:'Australia/Sydney'
};

export function trackDetails(track) {
  const name = aliases.get(normalize(track));
  if (!name) return null; // Never infer an oval's specifications for an unknown layout.
  const location = geography.locations[name];
  if (!location) return null;
  const spec = specifications.tracks[name] ?? {};
  return { name, ...location, timeZone: spec.timeZone ?? zones[location.city.split(', ').at(-1)] ?? 'UTC', ...spec };
}

export function trackFacts(info) {
  if (!info) return [];
  return [
    ['Location', info.city], ['Track size', info.length], ['Layout', info.layout],
    ['Surface', info.surface], ['Banking', info.banking]
  ].filter(([, value]) => value);
}

export function slugify(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function eventSlug(event = {}) {
  const date = event.date || 'tbd';
  const league = event.league || 'event';
  const title = slugify(event.title || event.track || 'scheduled-event');
  return `${date}-${league}-${title}`;
}

export function eventDisplayDate(event = {}) {
  if (event.tbd) return 'TBD';
  if (event.displayDate) return String(event.displayDate);
  if (!event.date) return 'TBD';
  const [year, month, day] = String(event.date).split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  });
}

export function eventShareDescription(event = {}) {
  const pieces = [
    event.leagueName || 'Aetherwing Event',
    event.track,
    eventDisplayDate(event),
    event.time,
    event.status
  ].filter(Boolean);
  if (event.specialTag) pieces.push(event.specialTag);
  return pieces.join(' · ');
}

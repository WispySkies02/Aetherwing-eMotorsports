// Shared "what is on track next" clock for the mobile header chip, the
// navigation sheet and the homepage broadcast card. Mirrors the timing rules
// the Race Calendar uses (startAt/endAt first, then "8:30 PM ET" + the
// Eastern offset for that date, 90-minute default window, results or a
// finished window mark an event complete).
import { eventSlug, legacyEventSlug } from './schedule-events.mjs';

export const seriesLogo = {
  nrrs: '/images/schedule-logos/nrrs.png',
  kmart: '/images/schedule-logos/kmart-regular.jpg',
  sunoco: '/images/schedule-logos/sunoco.png',
  'uarl-d1': '/images/schedule-logos/uarl-d1.png',
  open: '/images/schedule-logos/open.png',
  iracing: '/images/schedule-logos/iracing.png'
};

export const seriesShort = {
  nrrs: 'NRRS',
  kmart: 'KMART',
  sunoco: 'SUNOCO',
  'uarl-d1': 'UARL D1',
  open: 'UARL OPEN',
  iracing: 'IRACING'
};

const easternOffset = (date) => {
  const probe = new Date(`${date}T12:00:00Z`);
  if (isNaN(probe)) return '-04:00';
  const zone = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', timeZoneName: 'shortOffset' })
    .formatToParts(probe).find((part) => part.type === 'timeZoneName')?.value || 'GMT-4';
  const match = zone.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  return match ? `${match[1]}${match[2].padStart(2, '0')}:${match[3] || '00'}` : '-04:00';
};

export function eventStart(event = {}) {
  // Midnight is only the date-sort key for an event with an unknown start.
  // Pending events never use it as a countdown or calendar-export time.
  if(event.timePending)return new Date(`${event.date}T00:00:00${easternOffset(event.date)}`);
  if (event.startAt) {
    const explicit = new Date(event.startAt);
    if (!isNaN(explicit)) return explicit;
  }
  const match = String(event.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hour = match ? Number(match[1]) : 12;
  if (match && match[3].toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (match && match[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
  return new Date(`${event.date}T${String(hour).padStart(2, '0')}:${match ? match[2] : '00'}:00${easternOffset(event.date)}`);
}

export function eventEnd(event = {}) {
  if(event.timePending)return new Date(NaN);
  if (event.endAt) {
    const explicit = new Date(event.endAt);
    if (!isNaN(explicit)) return explicit;
  }
  if (event.endDate) return new Date(`${event.endDate}T23:59:59Z`);
  return new Date(eventStart(event).getTime() + (Number(event.durationMinutes) || 90) * 60000);
}

// A round keeps its identity when Admin changes its date or venue.
export function resultForEvent(results = [], event = {}) {
  const round = String(event.round || '').match(/\d+/)?.[0];
  return results.find(result => result.league === event.league && (!result.date || !event.date || String(result.date).slice(0,4) === String(event.date).slice(0,4)) && (
    result.scheduleId === eventSlug(event) || result.scheduleId === legacyEventSlug(event) ||
    (round && Number(String(result.round || '').match(/\d+/)?.[0]) === Number(round)) ||
    (result.date === event.date && (result.title === event.title || result.track === event.track))
  ));
}

export function eventUnavailable(event = {}) {
  return event.cancelled === true || event.canceled === true || event.postponed === true ||
    /\b(cancelled|canceled|postponed)\b/i.test(String(event.status || ''));
}

export function eventCompleted(event, results = [], now = new Date()) {
  return event.completed === true || /\b(completed|finished)\b/i.test(String(event.status || '')) ||
    Boolean(resultForEvent(results, event)) || (!event.timePending && eventEnd(event) < now);
}

export function upcomingRaces(events = [], results = [], now = new Date()) {
  return events.filter(event => event && !event.offWeek && !eventUnavailable(event) &&
    !event.tbd && Number.isFinite(+eventStart(event)) && !eventCompleted(event, results, now))
    .sort((a, b) => eventStart(a) - eventStart(b));
}

// Compact, serialisable rows: enough to render every surface and nothing more.
export function buildRaceFeed(events = [], results = [], { from } = {}) {
  return events
    .filter((event) => event && !event.offWeek && !eventUnavailable(event) && !event.tbd && event.date && (!from || event.timePending || (event.endDate || event.date) >= from))
    .map((event) => ({
      league: event.league,
      leagueName: event.leagueName || seriesShort[event.league] || event.league,
      title: event.title || '',
      track: event.track || event.title || '',
      round: event.round || event.status || '',
      date: event.date,
      endDate: event.endDate,
      displayDate: event.displayDate,
      time: event.time || '',
      timePending: event.timePending || undefined,
      startAt: event.startAt,
      endAt: event.endAt,
      durationMinutes: event.durationMinutes,
      url: `/event/${eventSlug(event)}/`,
      done: event.completed === true || /\b(completed|finished)\b/i.test(String(event.status || '')) || Boolean(resultForEvent(results, event)) || undefined
    }))
    .sort((a, b) => eventStart(a) - eventStart(b));
}

export function nextRace(feed = [], now = new Date()) {
  const open = feed.filter((event) => !event.done && (event.timePending || eventEnd(event) >= now));
  return open.find((event) => !event.timePending && eventStart(event) <= now) || open[0] || null;
}

export function countdownParts(event, now = new Date()) {
  if(event.timePending)return {pending:true,live:false,d:0,h:0,m:0,s:0};
  const start = eventStart(event), end = eventEnd(event);
  if (start <= now && end >= now) return { live: true, d: 0, h: 0, m: 0, s: 0 };
  const ms = Math.max(0, start - now);
  return {
    live: false,
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60
  };
}

export const pad = (value) => String(value).padStart(2, '0');

export function compactCountdown(event, now = new Date()) {
  const c = countdownParts(event, now);
  if(c.pending)return 'TIME TBD';
  if (c.live) return 'LIVE';
  if (c.d > 0) return `${c.d}D ${pad(c.h)}H`;
  if (c.h > 0) return `${c.h}H ${pad(c.m)}M`;
  return `${c.m}M ${pad(c.s)}S`;
}

export function whenLabel(event) {
  if(event.timePending)return `${eventStart(event).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'America/New_York'})} · Start time pending`;
  if (event.displayDate && !/\d:\d/.test(event.time || '')) return `${event.displayDate} · ${event.time || 'Event window'}`;
  const start = eventStart(event);
  const day = start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/New_York' });
  return `${day} · ${event.time || start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York' }) + ' ET'}`;
}

// The viewer's own clock, only when it differs from Eastern Time.
export function localTimeLabel(event) {
  if(event.timePending)return '';
  if (!/\d:\d/.test(event.time || '') && !event.startAt) return '';
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!zone || zone === 'America/New_York') return '';
  const start = eventStart(event);
  const opts = { weekday: 'short', hour: 'numeric', minute: '2-digit' };
  const local = start.toLocaleString('en-US', opts);
  if (local === start.toLocaleString('en-US', { ...opts, timeZone: 'America/New_York' })) return '';
  return `${local} your time`;
}

const icsText = (value) => String(value || '').replace(/[\\;,]/g, (ch) => `\\${ch}`).replace(/\n/g, '\\n');
const icsDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function calendarFile(event, origin = 'https://aetherwing.net') {
  if(event.timePending)throw new Error('A confirmed start time is required for calendar export.');
  const url = new URL(event.url, origin).href;
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Aetherwing eMotorsports//Race Control//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${event.url.replace(/\W+/g, '-')}@aetherwing.net`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(eventStart(event))}`,
    `DTEND:${icsDate(eventEnd(event))}`,
    `SUMMARY:${icsText(`${event.leagueName} — ${event.title || event.track}`)}`,
    `LOCATION:${icsText(event.track)}`,
    `DESCRIPTION:${icsText(`Aetherwing eMotorsports race weekend. ${url}`)}`,
    `URL:${url}`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
}

// Live Admin data arrives through the `aetherwing:content` event; keep every
// surface on the same feed without each one re-deriving it.
export function readFeed() {
  const node = document.getElementById('aw-race-feed');
  try { return JSON.parse(node?.textContent || '[]'); } catch { return []; }
}

export function subscribeFeed(callback) {
  let feed = readFeed();
  callback(feed);
  const apply = (datasets) => {
    const events = datasets?.['schedule-events'];
    if (!Array.isArray(events)) return;
    const results = Array.isArray(datasets.results) ? datasets.results : [];
    const today = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10);
    feed = buildRaceFeed(events.filter((event) => event?.league !== 'uarl-d2'), results, { from: today });
    callback(feed);
  };
  window.addEventListener('aetherwing:content', (event) => apply(event.detail));
  if (window.__AETHERWING_CONTENT__) apply(window.__AETHERWING_CONTENT__);
  return () => feed;
}

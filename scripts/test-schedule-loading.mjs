// Homepage schedule surfaces (header chip, featured race, Up next) share one
// feed: nothing until the publication arrives, then only a current publication.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const listeners = [];
globalThis.window = { addEventListener: (type, fn) => { if (type === 'aetherwing:content') listeners.push(fn); } };
const { subscribeFeed, SCHEDULE_COPY } = await import('../src/lib/race-clock.mjs');
const upcoming = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
const datasets = { 'schedule-events': [{ league: 'nrrs', leagueName: 'NRRS', title: 'Published Race', track: 'Published Track', date: upcoming, time: '8:30 PM ET' }], results: [] };
const publish = (state) => { window.__AETHERWING_PUBLICATION__ = { state, datasets }; window.__AETHERWING_CONTENT__ = datasets; listeners.forEach((fn) => fn({ detail: datasets })); };

const calls = [];
subscribeFeed((feed, status) => calls.push({ status, tracks: feed.map((event) => event.track) }));
assert.deepEqual(calls.at(-1), { status: 'loading', tracks: [] }, 'Before the publication arrives no bundled event is shown');
publish('published');
assert.deepEqual(calls.at(-1), { status: 'ready', tracks: ['Published Track'] }, 'A current publication is revealed');
for (const state of ['cached', 'bundled']) {
  publish(state);
  assert.deepEqual(calls.at(-1), { status: 'unavailable', tracks: [] }, `A ${state} copy is never presented as current`);
}
assert.equal(SCHEDULE_COPY.loading, 'Loading published schedule…');
assert.equal(SCHEDULE_COPY.unavailable, 'Schedule temporarily unavailable.');

// Each surface keeps a general Schedule link and hides calendar export unless ready.
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
for (const path of ['src/components/home/OnTrackNext.astro', 'src/components/home/UpNext.astro']) {
  const source = read(path);
  assert.match(source, /data-schedule-state="loading"/, `${path} starts in the loading state`);
  assert.match(source, /href="\/schedule\/" data-schedule-link/, `${path} keeps the general Schedule link`);
}
assert.match(read('src/components/home/OnTrackNext.astro'), /q\('\[data-next-ics\]'\)\.hidden = true/, 'Add to calendar is hidden while not ready');
assert.match(read('src/components/global/SiteHeader.astro'), /data-race-chip data-schedule-state="loading"/, 'The header chip starts in the loading state');
console.log('PASS: homepage schedule surfaces wait for the publication, reveal it together, and never present cached/bundled events as current.');

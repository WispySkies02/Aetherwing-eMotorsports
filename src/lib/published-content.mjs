import {defaultAlliances} from './alliances.mjs';
import {alliancePrograms} from './alliance-content.mjs';
import { reconcileCurrentAssignments, reconcileCurrentProfiles } from './current-driver-updates.mjs';
import { reconcileUarlReturn } from './uarl-d1-return.mjs';
// One atomic publication for every public surface. A failed request can expose
// a saved snapshot, but must label it rather than silently imply it is current.
const validDatasets = datasets => Boolean(datasets && !Array.isArray(datasets) && typeof datasets === 'object' && ['standings','results','schedule-events'].every(key=>Object.hasOwn(datasets,key)&&Array.isArray(datasets[key])));

// Include the complete body in the deadline. The public snapshot contains
// uploaded artwork as well as racing data, which can take longer on a phone.
export const PUBLICATION_TIMEOUT = 20000;
const publicationKey = 'aetherwing-publication-v1';
const emptyStorage = { getItem: () => null, setItem: () => {} };
const defaultStorage = () => {
  try { return globalThis.localStorage || emptyStorage; } catch { return emptyStorage; }
};

export async function loadPublishedContent({ fetcher = fetch, storage = defaultStorage(), timeout = PUBLICATION_TIMEOUT, signal } = {}) {
  const controller = new AbortController();
  const aborted = new Promise((_, reject) => controller.signal.addEventListener('abort', () => reject(controller.signal.reason || new Error('Publication request cancelled')), { once: true }));
  const cancel = () => controller.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new Error('Publication request timed out')), timeout);
  try {
    const request = (async () => {
      const response = await fetcher(`/api/site-content?v=${Date.now()}`, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`Publication returned ${response.status}`);
      const publication = await response.json();
      if (!validDatasets(publication?.datasets)) throw new Error('Invalid publication');
      return publication;
    })();
    // The race also bounds test/custom fetchers that do not honor AbortSignal.
    const publication = await Promise.race([request, aborted]);
    const snapshot = { datasets: publication.datasets, revision: publication.revision, savedAt: new Date().toISOString() };
    try { storage.setItem(publicationKey, JSON.stringify(snapshot)); } catch {}
    return { ...snapshot, state: 'published' };
  } catch {
    try {
      const cached = JSON.parse(storage.getItem(publicationKey));
      if (validDatasets(cached?.datasets) && Number.isFinite(Date.parse(cached.savedAt))) return { ...cached, state: 'cached' };
    } catch {}
    return { datasets: {}, state: 'bundled' };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
    controller.abort();
  }
}

// A transient failure must not pin this page to a cache for the rest of its
// lifetime. Share one request, retry a bounded number of times, and recover
// when connectivity or an existing tab returns. Only complete snapshots apply.
export function startPublicationUpdates({ onSnapshot, fetcher = fetch, storage = defaultStorage(), timeout = PUBLICATION_TIMEOUT, retryDelay = 1500, maxAttempts = 3, window = globalThis.window, document = globalThis.document } = {}) {
  let stopped = false, inFlight = null, activeController = null, retryTimer = null, attempts = 0, snapshot = null;
  const limit = Math.max(1, Math.trunc(maxAttempts) || 3);
  const clearRetry = () => { clearTimeout(retryTimer); retryTimer = null; };
  const visible = () => document?.visibilityState !== 'hidden';
  const request = (reset = true) => {
    if (stopped) return Promise.resolve(snapshot);
    if (inFlight) return inFlight;
    clearRetry();
    if (reset) attempts = 0;
    attempts++;
    activeController = new AbortController();
    inFlight = loadPublishedContent({ fetcher, storage, timeout, signal: activeController.signal }).then(next => {
      if (!stopped) { snapshot = next; onSnapshot?.(next); }
      return next;
    }).finally(() => {
      inFlight = null;
      activeController = null;
      if (!stopped && snapshot?.state !== 'published' && attempts < limit) {
        retryTimer = setTimeout(() => { retryTimer = null; if (visible()) request(false); }, retryDelay * attempts);
      }
    });
    return inFlight;
  };
  const recover = () => {
    if (!stopped && visible() && snapshot?.state !== 'published') return request();
  };
  const stop = () => {
    stopped = true;
    clearRetry();
    activeController?.abort();
    window?.removeEventListener('online', recover);
    window?.removeEventListener('focus', recover);
    window?.removeEventListener('pageshow', recover);
    window?.removeEventListener('pagehide', pagehide);
    document?.removeEventListener('visibilitychange', recover);
  };
  const pagehide = event => { if (!event.persisted) stop(); };
  window?.addEventListener('online', recover);
  window?.addEventListener('focus', recover);
  window?.addEventListener('pageshow', recover);
  window?.addEventListener('pagehide', pagehide);
  document?.addEventListener('visibilitychange', recover);
  return { ready: request(), refresh: () => request(), stop };
}

export function applyPublication(snapshot, fallback, { document, window }) {
  const datasets = { ...fallback, ...snapshot.datasets };
  Object.assign(datasets,reconcileUarlReturn(datasets));
  datasets.alliances=Array.isArray(datasets.alliances)?datasets.alliances:defaultAlliances;
  if(Array.isArray(datasets.competitions))datasets.competitions=alliancePrograms(datasets.competitions,datasets.alliances);
  if(Array.isArray(datasets.drivers))datasets.drivers=reconcileCurrentAssignments(datasets.drivers);
  if(Array.isArray(datasets['roster-profiles']))datasets['roster-profiles']=reconcileCurrentProfiles(datasets['roster-profiles']);
  window.__AETHERWING_CONTENT__ = datasets;
  window.__AETHERWING_PUBLICATION__ = snapshot;
  // All subscribers render the same complete object before any region reveals it.
  window.dispatchEvent(new window.CustomEvent('aetherwing:content', { detail: datasets }));
  document.querySelectorAll('[data-live-region]').forEach(region => {
    const state = Object.hasOwn(snapshot.datasets, region.dataset.liveRegion) ? snapshot.state : 'bundled';
    region.dataset.liveState = state;
    region.setAttribute('aria-busy', 'false');
    const old = region.querySelector(':scope > [data-live-note]');
    old?.remove();
    if (state !== 'published') {
      const note = document.createElement('p');
      note.dataset.liveNote = '';
      note.className = 'live-data-note';
      note.textContent = state === 'cached' ? `Cached snapshot · saved ${new Date(snapshot.savedAt).toLocaleString()}. Current publication could not be loaded.` : 'Bundled fallback · current publication could not be loaded.';
      region.prepend(note);
    }
  });
  document.documentElement.dataset.contentState = snapshot.state;
}

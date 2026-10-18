// One atomic publication for every public surface. A failed request can expose
// a saved snapshot, but must label it rather than silently imply it is current.
const validDatasets = datasets => Boolean(datasets && !Array.isArray(datasets) && typeof datasets === 'object' && ['standings','results','schedule-events'].every(key=>!(key in datasets)||Array.isArray(datasets[key])));

export async function loadPublishedContent({ fetcher = fetch, storage = localStorage, timeout = 8000 } = {}) {
  const key = 'aetherwing-publication-v1';
  try {
    const response = await fetcher(`/api/site-content?v=${Date.now()}`, { cache: 'no-store', signal: AbortSignal.timeout(timeout) });
    if (!response.ok) throw new Error(`Publication returned ${response.status}`);
    const publication = await response.json();
    if (!validDatasets(publication?.datasets)) throw new Error('Invalid publication');
    const snapshot = { datasets: publication.datasets, revision: publication.revision, savedAt: new Date().toISOString() };
    try { storage.setItem(key, JSON.stringify(snapshot)); } catch {}
    return { ...snapshot, state: 'published' };
  } catch {
    try {
      const cached = JSON.parse(storage.getItem(key));
      if (validDatasets(cached?.datasets) && Number.isFinite(Date.parse(cached.savedAt))) return { ...cached, state: 'cached' };
    } catch {}
    return { datasets: {}, state: 'bundled' };
  }
}

export function applyPublication(snapshot, fallback, { document, window }) {
  const datasets = { ...fallback, ...snapshot.datasets };
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

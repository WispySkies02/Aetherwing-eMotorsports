(() => {
  'use strict';

  const LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);
  const EMAIL_FLOW = /^#(?:invite_token|confirmation_token|recovery_token|email_change_token)=/.test(location.hash);
  const AUTO_LOGIN = new URLSearchParams(location.search).get('login') === '1';
  const STORAGE_KEY = 'aetherwing-paint-ops';
  const ADMIN_ENDPOINT = '/.netlify/functions/paint-admin';
  const emptyRegistry = () => ({ version: 1, paints: [], drafts: [], feature: null, revisions: [] });
  const leagues = [
    ['nrrs', 'NRRS'], ['uarl-d1', 'UARL D1'], ['uarl-d2', 'UARL D2 — Closed / Historical Archive'],
    ['uarl-open', 'UARL Open'], ['kmart', 'Kmart'], ['sunoco-truck', 'Sunoco Truck Series'], ['iracing', 'iRacing']
  ];
  let seed = { paints: [] };
  let registry = emptyRegistry();
  let user = null;
  let slugTouched = false;

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const slugify = (value) => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
  const seedSlugs = () => new Set((seed.paints || []).map((paint) => paint.slug));
  function mergedPublishedPaints() {
    const overrides = new Map((registry.paints || []).map((paint) => [paint.slug, paint]));
    const baseSlugs = seedSlugs();
    const merged = (seed.paints || []).map((paint) => overrides.has(paint.slug)
      ? { ...paint, ...overrides.get(paint.slug), _origin: 'seed', _overridden: true }
      : { ...paint, _origin: 'seed', _overridden: false });
    for (const paint of registry.paints || []) {
      if (!baseSlugs.has(paint.slug)) merged.push({ ...paint, _origin: 'admin' });
    }
    return merged.filter((paint) => !paint.archived && paint.status !== 'draft');
  }
  function libraryPaints() {
    const drafts = new Map((registry.drafts || []).map((paint) => [paint.slug, paint]));
    const published = new Map((registry.paints || []).map((paint) => [paint.slug, paint]));
    const baseSlugs = seedSlugs();
    const items = (seed.paints || []).map((base) => {
      if (drafts.has(base.slug)) return { ...base, ...drafts.get(base.slug), _origin: 'seed', _overridden: true, status: 'draft' };
      if (published.has(base.slug)) {
        const value = published.get(base.slug);
        return { ...base, ...value, _origin: 'seed', _overridden: true, status: value.archived ? 'archived' : 'published' };
      }
      return { ...base, _origin: 'seed', _overridden: false, status: 'published' };
    });
    for (const paint of registry.paints || []) if (!baseSlugs.has(paint.slug)) items.push({ ...paint, _origin: 'admin', status: paint.archived ? 'archived' : 'published' });
    for (const paint of registry.drafts || []) if (!baseSlugs.has(paint.slug)) items.push({ ...paint, _origin: 'admin', status: 'draft' });
    return items;
  }
  const publicPaints = () => mergedPublishedPaints();
  const allPaints = () => {
    const map = new Map(publicPaints().map((paint) => [paint.slug, paint]));
    for (const paint of registry.drafts || []) map.set(paint.slug, paint);
    return [...map.values()];
  };

  function toast(message, isError = false) {
    const node = $('[data-toast]');
    if (!node) return;
    node.textContent = message;
    node.style.borderColor = isError ? '#ff2633' : '#18c2ff';
    node.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { node.hidden = true; }, 4200);
  }

  function localRead() {
    try { return { ...emptyRegistry(), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch { return emptyRegistry(); }
  }

  function localWrite(next, action, detail = '') {
    const revision = { action, detail, at: new Date().toISOString(), by: 'Local preview' };
    next.revisions = [revision, ...(next.revisions || [])].slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    registry = next;
    return next;
  }

  function rolesFor(account) {
    return account?.app_metadata?.roles || account?.app_metadata?.authorization?.roles || [];
  }

  function isAuthorized(account) {
    const roles = rolesFor(account);
    return roles.includes('admin') || roles.includes('paint-admin');
  }

  async function token() {
    if (LOCAL) return '';
    const current = window.netlifyIdentity?.currentUser();
    return current ? current.jwt() : '';
  }

  async function adminFetch(options = {}) {
    let response;
    for (let attempt=0; attempt<2; attempt++) {
      response=await fetch(ADMIN_ENDPOINT, options);
      if (![502,503].includes(response.status) || attempt===1) return response;
      await new Promise((resolve)=>setTimeout(resolve,550));
    }
    return response;
  }

  async function request(action, payload = {}) {
    if (LOCAL) return localAction(action, payload);
    const jwt = await token();
    const response = await adminFetch({
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${jwt}` },
      body: JSON.stringify({ action, ...payload })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Paint Operations returned ${response.status}`);
    registry = body.registry || registry;
    return body;
  }

  function duplicateError(paint, editingSlug = '') {
    const pool = allPaints().filter((item) => item.slug !== editingSlug);
    if (pool.some((item) => item.slug === paint.slug)) return `The slug “${paint.slug}” is already in use.`;
    if (paint.schemeId && pool.some((item) => item.schemeId && item.schemeId === paint.schemeId)) return `Scheme ID ${paint.schemeId} is already assigned to another paint.`;
    return '';
  }

  function localAction(action, payload) {
    const next = structuredClone(registry);
    if (action === 'savePaint') {
      const paint = payload.paint;
      const status = payload.status === 'draft' ? 'draft' : 'published';
      const priorSlug = payload.priorSlug || '';
      const editingSeed = Boolean(priorSlug && seedSlugs().has(priorSlug));
      if (editingSeed && paint.slug !== priorSlug) throw new Error('The share slug is locked for pre-existing paints so their existing links keep working.');
      const error = duplicateError(paint, priorSlug);
      if (error) throw new Error(error);
      next.paints = (next.paints || []).filter((item) => item.slug !== priorSlug && item.slug !== paint.slug);
      next.drafts = (next.drafts || []).filter((item) => item.slug !== priorSlug && item.slug !== paint.slug);
      const target = status === 'draft' ? next.drafts : next.paints;
      target.push({ ...paint, status, archived: false, source: editingSeed ? 'seed-override' : 'admin', updatedAt: new Date().toISOString() });
      return { registry: localWrite(next, status === 'draft' ? 'draft.saved' : 'paint.published', paint.slug) };
    }
    if (action === 'setFeature') {
      next.feature = payload.feature;
      return { registry: localWrite(next, 'feature.published', payload.feature.slug) };
    }
    if (action === 'clearFeature') {
      next.feature = null;
      return { registry: localWrite(next, 'feature.cleared') };
    }
    if (action === 'archivePaint') {
      if (seedSlugs().has(payload.slug)) throw new Error('Pre-existing paints stay in the permanent archive. Edit their details instead of archiving them.');
      next.paints = (next.paints || []).map((paint) => paint.slug === payload.slug ? { ...paint, archived: payload.archived !== false } : paint);
      if (next.feature?.slug === payload.slug && payload.archived !== false) next.feature = null;
      return { registry: localWrite(next, payload.archived === false ? 'paint.restored' : 'paint.archived', payload.slug) };
    }
    throw new Error('Unknown local preview action.');
  }

  async function loadRegistry() {
    if (LOCAL) {
      registry = localRead();
      return;
    }
    const jwt = await token();
    const response = await adminFetch({ headers: { accept: 'application/json', authorization: `Bearer ${jwt}` }, cache: 'no-store' });
    if (!response.ok) throw new Error(`Could not load the paint registry (${response.status}).`);
    registry = { ...emptyRegistry(), ...(await response.json()).registry };
  }

  function showWorkspace(account) {
    user = account || { email: 'Local preview' };
    $('[data-auth-gate]').hidden = true;
    $('[data-workspace]').hidden = false;
    $('[data-account]').hidden = false;
    $('[data-account-email]').textContent = user.email || 'Paint administrator';
    refreshAll();
    if (!LOCAL) loadRegistry().then(refreshAll).catch((error) => toast(error.message, true));
  }

  function showAuth() {
    user = null;
    $('[data-auth-gate]').hidden = false;
    $('[data-workspace]').hidden = true;
    $('[data-account]').hidden = true;
  }

  function chooseTab(name) {
    $$('[data-tab]').forEach((button) => {
      const active = button.dataset.tab === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $$('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== name; });
    if (name === 'add') {
      const form = $('[data-paint-form]');
      const subline = form?.querySelector('[name="username"]');
      if (!form?.dataset.editingSlug && subline instanceof HTMLInputElement && !subline.value) subline.value = '@Aokikoto';
    }
    $('[data-panel]:not([hidden])')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  function paintFromForm() {
    const form = $('[data-paint-form]');
    const data = new FormData(form);
    const tags = String(data.get('tags') || '').split(',').map((tag) => slugify(tag)).filter(Boolean);
    const scrAffiliate = data.get('scrAffiliate') === 'on';
    const special = tags.filter((tag) => ['throwback','patriotic','racewinner','concept','tribute','prized','legacy'].includes(tag));
    if (scrAffiliate && !special.includes('starclutch')) special.push('starclutch');
    return {
      slug: slugify(data.get('slug')),
      sponsor: String(data.get('sponsor') || '').trim(),
      leagues: [String(data.get('league') || '')],
      leagueName: leagues.find(([id]) => id === data.get('league'))?.[1] || String(data.get('league') || ''),
      number: String(data.get('number') || '').trim(),
      driver: String(data.get('driver') || '').trim(),
      username: String(data.get('username') || '').trim(),
      schemeId: String(data.get('schemeId') || '').trim(),
      manufacturer: String(data.get('manufacturer') || '').trim(),
      body: String(data.get('body') || '').trim(),
      image: String(data.get('image') || '').trim(),
      note: String(data.get('note') || '').trim(),
      tags,
      special,
      scrAffiliate,
      debutRace: String(data.get('debutRace') || '').trim()
    };
  }

  function validatePaint(paint, editingSlug = '') {
    const required = ['slug', 'sponsor', 'driver', 'manufacturer', 'body', 'image'];
    const missing = required.find((key) => !paint[key]);
    if (missing) return `Complete the ${missing} field first.`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(paint.slug)) return 'Use lowercase letters, numbers, and dashes for the share slug.';
    try {
      const url = new URL(paint.image);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
    } catch { return 'Enter a complete http or https render image URL.'; }
    return duplicateError(paint, editingSlug);
  }

  function paintPreview(paint) {
    const identityName = paint.driver.toLowerCase();
    const sameIdentity = ['hailey','wispy','nicholas waggoner','hailey bell'].includes(identityName);
    const isIRacing = paint.leagues?.includes('iracing');
    const identity = sameIdentity
      ? (isIRacing ? ['Hailey Bell', ''] : ['Hailey', paint.username || '@Aokikoto'])
      : [paint.driver, paint.username];
    const affiliate = paint.scrAffiliate || paint.special?.includes('starclutch');
    $('[data-paint-preview-card]').innerHTML = `<div class="preview-visual"><img src="${esc(paint.image)}" alt="Preview of ${esc(paint.sponsor)}"></div><div class="preview-body"><p class="kicker">${esc(paint.leagueName)} ${paint.number ? '· #' + esc(paint.number) : ''}</p>${affiliate ? '<span class="scr-affiliate-badge">SCR Affiliate</span>' : ''}<h3>${esc(paint.sponsor)}</h3><p>${esc(identity[0])}${identity[1] ? '<br>' + esc(identity[1]) : ''}</p>${paint.note ? `<p>${esc(paint.note)}</p>` : ''}<div class="preview-race"><strong>/${esc(paint.slug)}/</strong><span>${paint.schemeId ? 'Scheme ID ' + esc(paint.schemeId) : 'iRacing custom livery'}</span></div></div>`;
  }

  function featureFromForm() {
    const form = $('[data-feature-form]');
    const data = new FormData(form);
    const date = String(data.get('date') || '');
    const expires = date ? new Date(`${date}T23:59:59`) : null;
    if (expires) expires.setDate(expires.getDate() + 1);
    return {
      slug: String(data.get('slug') || ''), series: String(data.get('series') || '').trim(),
      race: String(data.get('race') || '').trim(), track: String(data.get('track') || '').trim(),
      date, message: String(data.get('message') || '').trim(), expiresAt: expires?.toISOString() || ''
    };
  }

  function featurePreview(feature) {
    const paint = publicPaints().find((item) => item.slug === feature.slug);
    if (!paint) {
      $('[data-feature-preview-card]').innerHTML = '<div class="preview-empty">Choose a published paint to build the race feature.</div>';
      return;
    }
    $('[data-feature-preview-card]').innerHTML = `<div class="preview-visual"><img src="${esc(paint.image)}" alt="Preview of ${esc(paint.sponsor)}"></div><div class="preview-body"><p class="kicker">Next race paint</p><h3>${esc(paint.sponsor)}</h3><p>Hailey<br>@Aokikoto</p>${feature.message ? `<p>${esc(feature.message)}</p>` : ''}<div class="preview-race"><strong>${esc([feature.race, feature.track].filter(Boolean).join(' · ') || 'Upcoming race')}</strong><span>${esc([feature.series, feature.date].filter(Boolean).join(' · ') || 'Add race details')}</span></div></div>`;
  }

  function populatePaintSelect() {
    const select = $('[data-feature-paint]');
    const current = select.value || registry.feature?.slug || '';
    const options = publicPaints().filter((paint) => !paint.archived).sort((a, b) => a.sponsor.localeCompare(b.sponsor));
    select.innerHTML = '<option value="">Choose a paint</option>' + options.map((paint) => {
      const leagueName = paint.leagueName || leagues.find(([id]) => id === paint.leagues?.[0])?.[1] || paint.leagues?.[0] || '';
      return `<option value="${esc(paint.slug)}">${esc(leagueName)} · ${paint.number ? '#' + esc(paint.number) + ' · ' : ''}${esc(paint.sponsor)}</option>`;
    }).join('');
    if (options.some((paint) => paint.slug === current)) select.value = current;
  }

  function hydrateFeature() {
    const feature = registry.feature;
    if (!feature) return;
    const form = $('[data-feature-form]');
    for (const [key, value] of Object.entries(feature)) {
      const field = form.elements.namedItem(key);
      if (field) field.value = value || '';
    }
    featurePreview(feature);
  }

  function renderLibrary() {
    const query = String($('[data-library-search]')?.value || '').toLowerCase().trim();
    const items = libraryPaints().filter((paint) => !query || [paint.sponsor, paint.slug, paint.driver, paint.leagueName, paint.leagues?.[0]].join(' ').toLowerCase().includes(query));
    const list = $('[data-library-list]');
    if (!items.length) {
      list.innerHTML = '<div class="preview-empty">No paints match this search.</div>';
      return;
    }
    list.innerHTML = items.sort((a, b) => {
      const aDate = String(a.updatedAt || '');
      const bDate = String(b.updatedAt || '');
      if (aDate || bDate) return bDate.localeCompare(aDate);
      return String(a.sponsor || '').localeCompare(String(b.sponsor || ''));
    }).map((paint) => {
      const sourceLabel = paint._origin === 'seed' ? (paint._overridden ? 'EDITED ORIGINAL' : 'ORIGINAL') : 'ADMIN';
      const archiveAction = paint._origin === 'admin' && paint.status !== 'draft'
        ? `<button type="button" data-archive-paint="${esc(paint.slug)}" data-archived="${paint.archived ? 'true' : 'false'}">${paint.archived ? 'Restore' : 'Archive'}</button>`
        : '';
      const publishAction = paint.status === 'draft' ? `<button type="button" data-publish-draft="${esc(paint.slug)}">Publish</button>` : '';
      const affiliate = paint.scrAffiliate || paint.special?.includes('starclutch');
      return `<article class="library-row" data-library-slug="${esc(paint.slug)}"><img src="${esc(paint.image)}" alt="" loading="lazy"><div><h3>${esc(paint.sponsor)} <span class="status ${esc(paint.status)}">${esc(paint.status)}</span> <span class="status source">${sourceLabel}</span>${affiliate ? ' <span class="status scr-affiliate">SCR AFFILIATE</span>' : ''}</h3><p>${esc(paint.leagueName || paint.leagues?.[0] || '')} ${paint.number ? '· #' + esc(paint.number) : ''} · /${esc(paint.slug)}/</p></div><div class="library-row__actions"><button type="button" data-edit-paint="${esc(paint.slug)}">Edit</button>${publishAction}${archiveAction}</div></article>`;
    }).join('');
  }

  function libraryPaintBySlug(slug) {
    return libraryPaints().find((paint) => paint.slug === slug) || null;
  }

  function refreshAll() {
    populatePaintSelect();
    hydrateFeature();
    renderLibrary();
  }

  function resetPaintFormForNew() {
    const form = $('[data-paint-form]');
    if (!form) return;
    form.reset();
    delete form.dataset.editingSlug;
    delete form.dataset.editingSeed;
    const slug = form.elements.namedItem('slug');
    if (slug instanceof HTMLInputElement) slug.readOnly = false;
    const username = form.elements.namedItem('username');
    if (username instanceof HTMLInputElement) username.value = '@Aokikoto';
    slugTouched = false;
    const preview = $('[data-paint-preview-card]');
    if (preview) preview.innerHTML = '<div class="preview-empty">Complete the paint details, then preview or publish it.</div>';
  }

  function fillPaintForm(paint) {
    const form = $('[data-paint-form]');
    const values = { ...paint, league: paint.leagues?.[0] || '', tags: (paint.tags || paint.special || []).filter((tag) => tag !== 'starclutch').join(', '), scrAffiliate: paint.scrAffiliate === true || paint.special?.includes('starclutch') };
    for (const [key, value] of Object.entries(values)) {
      const field = form.elements.namedItem(key);
      if (field instanceof HTMLInputElement && field.type === 'checkbox') field.checked = Boolean(value);
      else if (field) field.value = value || '';
    }
    form.dataset.editingSlug = paint.slug;
    const editingSeed = seedSlugs().has(paint.slug);
    form.dataset.editingSeed = editingSeed ? 'true' : 'false';
    const slugField = form.elements.namedItem('slug');
    if (slugField instanceof HTMLInputElement) slugField.readOnly = editingSeed;
    slugTouched = true;
    paintPreview(paint);
    chooseTab('add');
  }

  async function savePaint(status) {
    const form = $('[data-paint-form]');
    const paint = paintFromForm();
    const editingSlug = form.dataset.editingSlug || '';
    const error = validatePaint(paint, editingSlug);
    if (error) throw new Error(error);
    const result = await request('savePaint', { paint, status, priorSlug: editingSlug });
    registry = result.registry;
    form.dataset.editingSlug = paint.slug;
    refreshAll();
    return paint;
  }

  function applyLeagueIdentityDefaults() {
    const form=$('[data-paint-form]'); if(!form)return;
    const league=form.elements.namedItem('league'), driver=form.elements.namedItem('driver'), username=form.elements.namedItem('username');
    if(!(league instanceof HTMLSelectElement)||!(driver instanceof HTMLInputElement)||!(username instanceof HTMLInputElement))return;
    const identityNames=new Set(['','Hailey','Hailey Bell','Wispy','Nicholas Waggoner']);
    if(!identityNames.has(driver.value.trim()))return;
    if(league.value==='iracing'){driver.value='Hailey Bell';username.value='';}
    else {driver.value='Hailey';username.value='@Aokikoto';}
  }

  function bindForms() {
    const paintForm = $('[data-paint-form]');
    const sponsor = paintForm.elements.namedItem('sponsor');
    const slug = paintForm.elements.namedItem('slug');
    const league = paintForm.elements.namedItem('league');
    sponsor.addEventListener('input', () => { if (!slugTouched) slug.value = slugify(`${league.value}-${sponsor.value}`); });
    league.addEventListener('change', () => { if (!slugTouched) slug.value = slugify(`${league.value}-${sponsor.value}`); applyLeagueIdentityDefaults(); });
    slug.addEventListener('input', () => { slugTouched = Boolean(slug.value); });
    $('[data-paint-preview]').addEventListener('click', () => {
      const paint = paintFromForm();
      const error = validatePaint(paint, paintForm.dataset.editingSlug || '');
      if (error) return toast(error, true);
      paintPreview(paint);
    });
    $('[data-save-draft]').addEventListener('click', async () => {
      try { const paint = await savePaint('draft'); toast(`${paint.sponsor} saved as a private draft.`); }
      catch (error) { toast(error.message, true); }
    });
    paintForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try { const paint = await savePaint('published'); toast(`${paint.sponsor} is live in the Paint Booth.`); }
      catch (error) { toast(error.message, true); }
    });
    $('[data-publish-feature]').addEventListener('click', async () => {
      try {
        const paint = await savePaint('published');
        chooseTab('feature');
        $('[data-feature-paint]').value = paint.slug;
        featurePreview({ slug: paint.slug });
        toast(`${paint.sponsor} is published. Add the race details to feature it.`);
      } catch (error) { toast(error.message, true); }
    });

    const featureForm = $('[data-feature-form]');
    $('[data-feature-preview]').addEventListener('click', () => featurePreview(featureFromForm()));
    $('[data-feature-paint]').addEventListener('change', () => featurePreview(featureFromForm()));
    featureForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const feature = featureFromForm();
      if (!feature.slug || !feature.series || !feature.race || !feature.track || !feature.date) return toast('Choose a paint and complete the race details first.', true);
      try { const result = await request('setFeature', { feature }); registry = result.registry; featurePreview(feature); renderLibrary(); toast('Upcoming race feature is live.'); }
      catch (error) { toast(error.message, true); }
    });
    $('[data-feature-clear]').addEventListener('click', async () => {
      try { const result = await request('clearFeature'); registry = result.registry; featureForm.reset(); $('[data-feature-preview-card]').innerHTML = '<div class="preview-empty">Choose a paint to build the race feature.</div>'; toast('The race feature was cleared. The booth will use its normal fallback.'); }
      catch (error) { toast(error.message, true); }
    });
  }

  function bindLibrary() {
    $('[data-library-search]').addEventListener('input', renderLibrary);
    $('[data-refresh]').addEventListener('click', async () => { try { await loadRegistry(); refreshAll(); toast('Paint Operations data refreshed.'); } catch (error) { toast(error.message, true); } });
    $('[data-library-list]').addEventListener('click', async (event) => {
      const button = event.target instanceof Element ? event.target.closest('button') : null;
      if (!(button instanceof HTMLButtonElement)) return;
      const slug = button.dataset.editPaint || button.dataset.publishDraft || button.dataset.archivePaint;
      const paint = libraryPaintBySlug(slug);
      if (!paint) return;
      if (button.dataset.editPaint) return fillPaintForm(paint);
      try {
        if (button.dataset.publishDraft) {
          fillPaintForm(paint);
          await savePaint('published');
          chooseTab('library');
          toast(`${paint.sponsor} is now published.`);
        } else {
          const archived = button.dataset.archived !== 'true';
          const result = await request('archivePaint', { slug, archived });
          registry = result.registry;
          refreshAll();
          toast(`${paint.sponsor} ${archived ? 'archived' : 'restored'}.`);
        }
      } catch (error) { toast(error.message, true); }
    });
  }

  function init() {
    $('[data-league-select]').innerHTML = leagues.map(([id, name]) => `<option value="${id}">${name}</option>`).join('');
    const identitySubline = $('[data-paint-form] [name="username"]');
    if (identitySubline instanceof HTMLInputElement && !identitySubline.value) identitySubline.value = '@Aokikoto';
    $$('[data-tab]').forEach((button) => button.addEventListener('click', () => {
      if (button.dataset.tab === 'add') resetPaintFormForNew();
      chooseTab(button.dataset.tab);
    }));
    bindForms();
    bindLibrary();

    if (LOCAL) {
      $('[data-login]').textContent = 'Enter local preview';
      $('[data-auth-note]').textContent = 'Local preview stores test changes only in this browser. Production still requires an invited administrator account.';
      $('[data-login]').addEventListener('click', () => showWorkspace({ email: 'Local preview' }));
      $('[data-logout]').addEventListener('click', showAuth);
    } else if (!window.netlifyIdentity) {
      $('[data-login]').disabled = true;
      $('[data-auth-note]').textContent = window.__aetherwingIdentityLoadFailed
        ? 'The secure sign-in library could not load. Check your connection or content blocker, then reload this page.'
        : 'Secure sign-in is unavailable. Netlify Identity must be enabled on the aetherwing.net Netlify project before administrator accounts can sign in.';
    } else {
      let autoLoginOpened = false;
      const openLoginIfRequested = () => {
        if (!AUTO_LOGIN || EMAIL_FLOW || autoLoginOpened || window.netlifyIdentity.currentUser()) return;
        autoLoginOpened = true;
        window.netlifyIdentity.open('login');
      };
      window.netlifyIdentity.on('init', (account) => {
        if (account && isAuthorized(account)) showWorkspace(account);
        else {
          showAuth();
          openLoginIfRequested();
        }
      });
      window.netlifyIdentity.on('login', (account) => {
        if (!isAuthorized(account)) {
          window.netlifyIdentity.logout();
          toast('This account needs the admin or paint-admin role.', true);
          return;
        }
        if (!EMAIL_FLOW) window.netlifyIdentity.close();
        showWorkspace(account);
      });
      window.netlifyIdentity.on('logout', showAuth);
      $('[data-login]').addEventListener('click', () => window.netlifyIdentity.open('login'));
      $('[data-logout]').addEventListener('click', () => window.netlifyIdentity.logout());
    }

    (async () => {
      try {
        seed = await fetch('/data/paint-seed.json', { cache: 'no-store' }).then((response) => {
          if (!response.ok) throw new Error('Seed paint data did not load.');
          return response.json();
        });
        if (LOCAL || user) await loadRegistry();
        if (user) refreshAll();
      } catch (error) { toast(error.message, true); }
    })();
  }

  init();
})();

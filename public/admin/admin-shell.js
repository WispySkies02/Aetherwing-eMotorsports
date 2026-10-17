/* v3.0.0 — Admin shell (layout only).
   Mirrors the active workspace into the header, drives the phone dock and the
   section sheet. It never edits, saves or publishes anything: switching a tab
   is done by clicking the real [data-admin-tabs] link, so content-admin.js
   keeps every rule (unsaved-change prompts, loading, publishing). */
(() => {
  const root = document.documentElement;
  const tabs = document.querySelector('[data-admin-tabs]');
  const dock = document.querySelector('[data-adm-dock]');
  const scrim = document.querySelector('[data-adm-scrim]');
  const workspace = document.querySelector('[data-workspace]');
  const current = document.querySelector('[data-adm-current]');
  const laneName = document.querySelector('[data-adm-lane-name]');
  if (!tabs || !dock) return;

  const laneTitle = { overview: 'Control center' };
  tabs.querySelectorAll('h2[data-adm-lane]').forEach((heading) => { laneTitle[heading.dataset.admLane] = heading.textContent.trim(); });
  const dockLane = (lane) => (lane === 'news' || lane === 'site' ? 'more' : lane);
  const label = (button) => [...button.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim() || button.textContent.trim();
  const compact = window.matchMedia('(max-width: 900px)');
  let opener = null;

  const syncActive = () => {
    const active = tabs.querySelector('a.is-active,button.is-active') || tabs.querySelector('a,button');
    if (!active) return;
    const lane = active.dataset.admLane || 'overview';
    if (current) current.textContent = label(active);
    if (laneName) laneName.textContent = laneTitle[lane] || 'Control center';
    root.dataset.admLane = lane;
    dock.querySelectorAll('[data-adm-open]').forEach((button) => {
      if (button.dataset.admOpen === dockLane(lane)) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
  };

  const closeSheet = (restoreFocus = true) => {
    if (!root.classList.contains('adm-sheet-open')) return;
    root.classList.remove('adm-sheet-open');
    delete tabs.dataset.admShow;
    if (scrim) scrim.hidden = true;
    dock.querySelectorAll('[aria-expanded]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
    if (restoreFocus && opener instanceof HTMLElement) opener.focus();
  };

  const openSheet = (lane, trigger) => {
    opener = trigger;
    tabs.dataset.admShow = lane;
    root.classList.add('adm-sheet-open');
    if (scrim) scrim.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const first = tabs.querySelector(':is(a,button).is-active:not([hidden])') || [...tabs.querySelectorAll('a,button')].find((button) => button.offsetParent !== null);
    first?.focus();
  };

  dock.addEventListener('click', (event) => {
    const trigger = event.target instanceof Element ? event.target.closest('[data-adm-open]') : null;
    if (!(trigger instanceof HTMLButtonElement)) return;
    const lane = trigger.dataset.admOpen;
    if (lane === 'overview') {
      closeSheet(false);
      tabs.querySelector('[data-admin-tab="overview"]')?.click();
      return;
    }
    if (tabs.dataset.admShow === lane) closeSheet();
    else openSheet(lane, trigger);
  });

  // A tab chosen from the sheet closes it; content-admin.js handles the switch.
  tabs.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a,button')) window.setTimeout(() => closeSheet(false), 0);
  });
  scrim?.addEventListener('click', () => closeSheet());
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeSheet(); });
  compact.addEventListener('change', (query) => { if (!query.matches) closeSheet(false); });

  new MutationObserver(syncActive).observe(tabs, { subtree: true, attributes: true, attributeFilter: ['class', 'aria-selected'] });
  syncActive();

  // The dock only exists once someone is signed in (or in local preview).
  const syncDock = () => {
    const open = Boolean(workspace && !workspace.hidden);
    dock.hidden = !open;
    root.classList.toggle('adm-signed-in', open);
    if (!open) closeSheet(false);
  };
  if (workspace) new MutationObserver(syncDock).observe(workspace, { attributes: true, attributeFilter: ['hidden'] });
  syncDock();

  // Typing mode (phones): while a text field has focus the on-screen keyboard
  // takes half the screen, so the sticky header, dock and Save / Publish bar
  // step aside and give the field the room. They return when typing stops.
  const typable = (el) => el instanceof HTMLTextAreaElement
    || el instanceof HTMLSelectElement
    || (el instanceof HTMLInputElement && !['button', 'submit', 'reset', 'checkbox', 'radio', 'file', 'range', 'color', 'image', 'hidden'].includes(el.type))
    || (el instanceof HTMLElement && el.isContentEditable);
  const viewport = window.visualViewport;
  // Full-screen height with no keyboard: the tallest visual viewport seen at
  // the current width (some browsers shrink innerHeight with the keyboard,
  // so it can't be the reference). Rotating the phone starts a new baseline.
  let fullHeight = viewport ? viewport.height : window.innerHeight;
  let baseWidth = viewport ? viewport.width : window.innerWidth;
  const keyboardOpen = () => Boolean(viewport) && viewport.height < fullHeight * 0.8;
  const syncViewport = () => root.style.setProperty('--adm-vv', `${Math.round(viewport ? viewport.height : window.innerHeight)}px`);
  const setTyping = (on) => {
    root.classList.toggle('adm-typing', on && compact.matches);
    if (on) syncViewport();
  };
  document.addEventListener('focusin', (event) => { if (typable(event.target)) setTyping(true); });
  document.addEventListener('focusout', () => {
    // Moving between fields keeps typing mode; leaving them all ends it.
    window.setTimeout(() => setTyping(typable(document.activeElement)), 120);
  });
  // Tapping a field that already has focus (after the keyboard's own "hide"
  // button) reopens the keyboard without a new focus event.
  document.addEventListener('pointerdown', (event) => {
    if (typable(event.target) && event.target === document.activeElement) setTyping(true);
  });
  viewport?.addEventListener('resize', () => {
    if (Math.abs(viewport.width - baseWidth) > 1) { baseWidth = viewport.width; fullHeight = viewport.height; }
    if (viewport.height > fullHeight) fullHeight = viewport.height;
    // The keyboard's state decides while a field has focus: hidden with the
    // keyboard's own button restores the chrome, shown again steps it aside.
    if (typable(document.activeElement)) setTyping(keyboardOpen());
    else if (root.classList.contains('adm-typing')) setTyping(false);
  });
  compact.addEventListener('change', () => setTyping(typable(document.activeElement)));
  // ---- Phone editing QoL (layout only) ----
  // 1. Entry picker: the entry list folds into one "Editing: <entry>" bar.
  //    Opening it shows search + list; choosing an entry folds it again and
  //    brings the form into view. Selection itself stays in content-admin.js.
  const aside = document.querySelector('.content-layout > aside');
  const list = document.querySelector('[data-content-list]');
  const form = document.querySelector('[data-content-form]');
  if (aside && list) {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'adm-entry-toggle';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<span><small>Editing</small><b data-adm-entry-name>Choose an entry</b></span><em data-adm-entry-count></em>';
    aside.prepend(toggle);
    const setOpen = (open, focusSearch = false) => {
      aside.classList.toggle('adm-entries-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (open && focusSearch && compact.matches) aside.querySelector('[data-content-search]')?.focus({ preventScroll: true });
    };
    const syncEntry = () => {
      const entries = list.querySelectorAll('[data-entry]');
      // One-record sections render a note instead of entry buttons. A search
      // with no matches renders nothing: keep the picker open so it can be cleared.
      const single = !entries.length && Boolean(list.querySelector('p'));
      const searching = Boolean(aside.querySelector('[data-content-search]')?.value.trim());
      const noMatches = !entries.length && !single && searching;
      aside.classList.toggle('adm-entries-single', single);
      if (noMatches) setOpen(true);
      const active = list.querySelector('[data-entry][aria-pressed="true"]');
      toggle.querySelector('[data-adm-entry-name]').textContent = active?.querySelector('strong')?.textContent?.trim() || (single ? 'This section' : noMatches ? 'No matching entries' : 'Choose an entry');
      toggle.querySelector('[data-adm-entry-count]').textContent = single ? '' : noMatches ? 'Search' : `${entries.length} · Change`;
    };
    toggle.addEventListener('click', () => setOpen(!aside.classList.contains('adm-entries-open'), true));
    list.addEventListener('click', (event) => {
      if (!(event.target instanceof Element) || !event.target.closest('[data-entry]') || !compact.matches) return;
      window.setTimeout(() => {
        setOpen(false);
        form?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }, 60);
    });
    new MutationObserver(syncEntry).observe(list, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
    syncEntry();
  }

  // 2. Long guides fold to a short preview; tap to read the rest.
  const guide = document.querySelector('[data-content-guide]');
  if (guide) {
    guide.classList.add('adm-folded');
    guide.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a,button,input,select,textarea,label')) return;
      guide.classList.toggle('adm-folded');
    });
  }

  // 3. Bulk tools (schedule shift, results, CSV import, page scan) fold by
  //    tapping their heading; the choice is remembered per tool on this device.
  const remember = (key, value) => { try { localStorage.setItem(key, value); } catch {} };
  const recall = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
  document.querySelectorAll('[data-schedule-shift],[data-results-race-tool],[data-results-import-tool],[data-page-scan-tool]').forEach((tool, index) => {
    const head = tool.firstElementChild;
    if (!(head instanceof HTMLElement)) return;
    const key = `adm-tool-folded-${[...tool.attributes].find((a) => a.name.startsWith('data-'))?.name || index}`;
    head.classList.add('adm-tool-head');
    head.setAttribute('role', 'button');
    head.tabIndex = 0;
    const apply = (folded) => { tool.classList.toggle('adm-folded', folded); head.setAttribute('aria-expanded', String(!folded)); };
    // Occasional bulk tools start folded on phones; race-week imports stay open.
    const saved = recall(key);
    const foldByDefault = compact.matches && (tool.hasAttribute('data-schedule-shift') || tool.hasAttribute('data-page-scan-tool'));
    apply(saved === null ? foldByDefault : saved === '1');
    const flip = () => { const folded = !tool.classList.contains('adm-folded'); apply(folded); remember(key, folded ? '1' : '0'); };
    head.addEventListener('click', (event) => { if (!(event.target instanceof Element) || !event.target.closest('a,button,input,select,textarea')) flip(); });
    head.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); flip(); } });
  });
  // ---- Phone home screen (layout only) ----
  // Overview opens with one large card per section; each card lists that
  // section's tabs. Tapping one clicks the real [data-admin-tabs] link, so
  // content-admin.js opens it exactly as from the sidebar or sheet.
  const overview = document.querySelector('[data-admin-overview]');
  if (overview && tabs) {
    const blurbs = {
      race: 'Schedule, results, wins, standings and milestones.',
      people: 'Who races where, numbers, profiles, charters and leagues.',
      news: 'Team Wire stories, team partners and driver portfolios.',
      paint: 'Feature, edit and organise paints, plus the 3D viewer.',
      site: 'Site settings, navigation, page text and theme preview.'
    };
    const icons = {
      race: '<path d="M5 21V3.5M5 4h14v9H5"/><path class="is-fill" d="M5 4h4.7v4.5H5zM14.3 4H19v4.5h-4.7zM9.7 8.5h4.6V13H9.7z"/>',
      people: '<path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M21.5 20a6.5 6.5 0 0 0-4-6"/>',
      news: '<path d="M4 5h13v14H6a2 2 0 0 1-2-2zM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3"/>',
      paint: '<path d="M4 16.5c0-1.5 1-2.5 2.5-2.5h11c1.5 0 2.5 1 2.5 2.5V18H4zM6 14l2.2-5.2A2 2 0 0 1 10 7.5h4a2 2 0 0 1 1.8 1.3L18 14M7 18v2M17 18v2"/>',
      site: '<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'
    };
    const escHome = (value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    const home = document.createElement('section');
    home.className = 'adm-home';
    home.setAttribute('aria-label', 'Admin sections');
    const lanes = [...tabs.querySelectorAll('h2[data-adm-lane]')].map((heading) => ({
      lane: heading.dataset.admLane,
      title: heading.textContent.trim(),
      links: [...tabs.querySelectorAll(`:is(a,button)[data-adm-lane="${heading.dataset.admLane}"]`)]
    }));
    home.innerHTML = `<header class="adm-home__head"><small>Race control</small><h2>Where to?</h2></header>` + lanes.map((group, index) => `
      <article class="adm-home__card" data-adm-home-lane="${escHome(group.lane)}">
        <div class="adm-home__title"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[group.lane] || ''}</svg><span><b>${escHome(group.title)}</b><small>${escHome(blurbs[group.lane] || '')}</small></span><em>${group.links.length}</em></div>
        <div class="adm-home__links">${group.links.map((link, i) => `<button type="button" data-adm-home-open="${index}:${i}">${escHome(label(link))}</button>`).join('')}</div>
      </article>`).join('');
    home.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest('[data-adm-home-open]') : null;
      if (!button) return;
      const [laneIndex, linkIndex] = button.dataset.admHomeOpen.split(':').map(Number);
      lanes[laneIndex]?.links[linkIndex]?.click();
    });
    overview.prepend(home);
  }
})();

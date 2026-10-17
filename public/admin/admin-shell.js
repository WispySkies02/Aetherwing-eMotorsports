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
})();

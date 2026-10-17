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
})();

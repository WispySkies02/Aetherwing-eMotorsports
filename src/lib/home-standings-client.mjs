import { homeStandings, homeStandingKey } from './home-standings.mjs';
import { standingLabels, standingMetadata } from './standings-metadata.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const hasPoints = row => row?.pointsPending !== true && typeof row?.points === 'number' && Number.isFinite(row.points);
export const homePointsText = row => hasPoints(row) ? `${row.points.toLocaleString('en-US')} PTS` : 'PTS pending';
export const homeFocusHeading = model => model.focusRow ? `${model.focusRow.driver || 'Driver'}${model.focusRow.position ? ` · ${model.focusRow.position}` : ''}` : 'No published standings';
export const homeFocusContext = model => model.focusRow ? [model.subtitle,homePointsText(model.focusRow)].filter(Boolean).join(' · ') : model.subtitle || 'Standings will appear after publication.';
export const homeTowerContext = model => String(model.subtitle || '').split(' · ').find(part => /\bafter\b/i.test(part)) || (model.table === 'chase' ? 'Chase points' : '');

function movement(value) {
  if (String(value).trim().toUpperCase() === 'NEW') return {kind:'new',mark:'NEW',description:'New to the standings'};
  const raw = String(value ?? '').trim();
  const amount = /^[▲▼]/.test(raw) ? Number(raw.replace(/[^0-9]/g,'')) * (raw.startsWith('▼') ? -1 : 1) : Number(raw);
  if (!Number.isFinite(amount) || amount === 0) return {kind:'flat',mark:'–',description:'No position change'};
  return {kind:amount > 0 ? 'up' : 'down',mark:`${amount > 0 ? '▲' : '▼'}${Math.abs(amount)}`,description:`${amount > 0 ? 'Up' : 'Down'} ${Math.abs(amount)} position${Math.abs(amount) === 1 ? '' : 's'}`};
}

export function timingTowerRows(model) {
  if (!model.rows.length) return '<li class="aw-tower__gap" data-home-standings-empty style="padding:1rem 14px">No published standings for this table.</li>';
  const teamKeys = new Set(model.teamKeys), isTeam = row => row.highlight === true || teamKeys.has(homeStandingKey(row));
  const showTop = Math.max(model.cutoff + 1,6), picked = model.rows.map((row,index) => ({row,index})).filter(({row,index}) => index < showTop || isTeam(row));
  let previous = -1;
  return picked.map(({row,index}) => {
    const skipped = previous >= 0 && index - previous > 1 ? '<li class="aw-tower__gap" aria-hidden="true"><span>⋮</span></li>' : '';
    previous = index;
    const move = movement(row.positionChange), classes = [isTeam(row) ? 'is-team' : '',model.cutoff > 0 && index === model.cutoff ? 'is-cut' : ''].filter(Boolean).join(' ');
    const difference = hasPoints(row) && hasPoints(model.leader) ? row.points - model.leader.points : null;
    const gap = difference === null ? '—' : index === 0 ? 'LEADER' : difference > 0 ? `+${difference}` : String(difference);
    const labels = standingLabels(standingMetadata(model.board,row));
    const status = labels.length ? `<small class="ux-tag" data-standing-status style="grid-column:4/-1;padding:.35rem 0 .5rem 4px;white-space:normal;line-height:1.4;letter-spacing:.04em">${escapeHtml(labels.join(' · '))}</small>` : '';
    return `${skipped}<li class="${classes}"><b class="aw-tower__pos">${escapeHtml(String(row.position || `P${index + 1}`).replace(/^P/i,''))}</b><i class="is-${move.kind}"><span aria-hidden="true">${escapeHtml(move.mark)}</span><span class="aw-sr">${escapeHtml(move.description)}</span></i><span class="aw-tower__num">${escapeHtml(row.number)}</span><strong>${escapeHtml(row.driver)}</strong><em>${escapeHtml(gap)}</em>${status}</li>`;
  }).join('');
}

function showNumber(element, model) {
  if (!element) return;
  const number = String(model.focusRow?.number ?? '').trim(), label = number ? `#${number}` : '—';
  element.dataset.number = number;
  element.textContent = label;
  const assignment = model.focusAssignment, art = assignment?.numberImageBackup || assignment?.numberImage;
  if (!model.focusRow || !art) return;
  const image = element.ownerDocument.createElement('img');
  image.alt = `Number ${number}`;
  image.addEventListener('error',() => { if (element.firstElementChild === image) element.textContent = label; },{once:true});
  image.src = art;
  element.replaceChildren(image);
}

// Header, focus card, artwork and table are written synchronously from one DTO.
// No old image request may put a previous league's artwork back into the card.
export function renderHomeStandings(root, model) {
  if (!root) return;
  const set = (selector,value) => { const element = root.querySelector(selector); if (element) element.textContent = value ?? ''; };
  for (const element of [root,...root.querySelectorAll('[data-home-standings-id]')]) {
    element.dataset.homeStandingsId = model.board?.id || '';
    element.dataset.homeStandingsTable = model.table;
    element.dataset.homeStandingsLeague = model.league;
  }
  set('[data-battle-title]',model.title); set('[data-battle-status]',model.status);
  set('[data-battle-heading]',homeFocusHeading(model)); set('[data-battle-context]',homeFocusContext(model));
  set('[data-battle-gap]',model.focusGap); set('[data-battle-leader]',model.leader?.driver || '—');
  showNumber(root.querySelector('[data-battle-number]'),model);
  set('[data-tower-status]',model.status); set('[data-tower-title]',model.title); set('[data-tower-context]',homeTowerContext(model));
  const tower = root.querySelector('[data-timing-tower]');
  if (tower) {
    tower.hidden = false;
    tower.dataset.teamNumbers = model.teamNumbers.join(',');
    tower.dataset.teamKeys = model.teamKeys.join(',');
  }
  const rows = root.querySelector('[data-tower-rows]'); if (rows) rows.innerHTML = timingTowerRows(model);
  set('[data-tower-cut]',model.cutoffLabel); set('[data-tower-team-label]',model.teamLabel);
  const hasCutoff = model.cutoff > 0, hasTeam = model.teamKeys.length > 0;
  for (const selector of ['.aw-tower__cut-key','[data-tower-cut]']) { const node = root.querySelector(selector); if (node) node.hidden = !hasCutoff; }
  for (const selector of ['.aw-tower__key','[data-tower-team-label]']) { const node = root.querySelector(selector); if (node) node.hidden = !hasTeam; }
  const note = root.querySelector('.aw-tower__note'); if (note) note.hidden = !hasCutoff && !hasTeam;
}

const mounts = new WeakMap();
export function mountHomeStandings(document = globalThis.document) {
  const root = document?.querySelector('[data-home-standings-root]');
  if (!root) return null;
  if (mounts.has(root)) return mounts.get(root);
  let boards = [], drivers = [];
  try { const seed = JSON.parse(root.querySelector('[data-home-standings-seed]')?.textContent || '{}'); boards = seed.standings || []; drivers = seed.drivers || []; } catch {}
  const apply = datasets => {
    let changed = false;
    if (Array.isArray(datasets?.standings)) { boards = datasets.standings; changed = true; }
    if (Array.isArray(datasets?.drivers)) { drivers = datasets.drivers; changed = true; }
    if (changed) renderHomeStandings(root,homeStandings(boards,drivers));
  };
  const window = document.defaultView, listener = event => apply(event.detail);
  renderHomeStandings(root,homeStandings(boards,drivers));
  window.addEventListener('aetherwing:content',listener);
  const controller = {apply,stop:() => { window.removeEventListener('aetherwing:content',listener); mounts.delete(root); }};
  mounts.set(root,controller);
  if (window.__AETHERWING_CONTENT__) apply(window.__AETHERWING_CONTENT__);
  return controller;
}

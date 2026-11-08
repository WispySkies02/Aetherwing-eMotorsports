// An explicitly recorded DNS is a result status, never a finishing position.
// Missing historical measurements stay unknown; numeric zero remains a value.
export function resultDidNotStart(entry = {}) {
  return String(entry.finishStatus || '').trim().toUpperCase() === 'DNS';
}

export function resultPositionLabel(value) {
  return Number.isFinite(value) && value > 0 ? `P${value}` : '—';
}

export function resultFinishLabel(entry = {}, missing = '—') {
  if (resultDidNotStart(entry)) return 'DNS';
  const position = resultPositionLabel(entry.finish);
  return position === '—' ? missing : position;
}

export function resultPointsLabel(value) {
  return Number.isFinite(value) ? String(value) : '—';
}

export function resultEntryStatus(entry = {}) {
  return resultDidNotStart(entry) ? 'DNS' : 'Raced';
}

export function resultQualifyingLabel(entry = {}) {
  return Number.isFinite(entry.qualifyingPosition) && entry.qualifyingPosition > 0 ? `Qualified P${entry.qualifyingPosition}` : '';
}

export function compareResultEntries(a, b) {
  const rank = entry => !resultDidNotStart(entry) && Number.isFinite(entry.finish) && entry.finish > 0 ? entry.finish : Number.POSITIVE_INFINITY;
  const first = rank(a), second = rank(b);
  return first === second ? 0 : first - second;
}

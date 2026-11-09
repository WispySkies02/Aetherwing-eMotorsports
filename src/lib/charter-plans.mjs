// Future charter planning is additive metadata, never an active allocation.
// A pre-plan publication may lack this field. An explicit list (including an
// empty list), or the removal of the board itself, is an authoritative edit.
export function reconcileCharterPlans(boards, seedBoards = []) {
  if (!Array.isArray(boards)) return boards;
  const seed = Array.isArray(seedBoards) ? seedBoards.find(board => board?.id === 'nrrs') : null;
  if (!Array.isArray(seed?.plannedSeasons)) return boards;
  return boards.map(board => board?.id === 'nrrs' && !Object.hasOwn(board,'plannedSeasons')
    ? {...board,plannedSeasons:structuredClone(seed.plannedSeasons)}
    : board);
}

// Plain text for the existing public note styles. No date check, migration to
// fullTime/openCharters, driver assignment, or automatic promotion is involved.
export function plannedCharterNotes(board) {
  if (board?.id !== 'nrrs' || !Array.isArray(board.plannedSeasons)) return [];
  return board.plannedSeasons.flatMap(plan => {
    if (plan?.status !== 'planned' || !Number.isInteger(plan.year) || plan.year < 1000 || plan.year > 9999 || !Number.isInteger(plan.season) || plan.season < 1 || !Array.isArray(plan.numbers) || !plan.numbers.length) return [];
    if (plan.numbers.some(number => typeof number !== 'string' || !/^\d{1,3}$/.test(number)) || new Set(plan.numbers).size !== plan.numbers.length) return [];
    return [`${plan.year} · NRRS Season ${plan.season} — planned charter numbers: ${plan.numbers.map(number => `#${number}`).join(' / ')}.`];
  });
}

# NRRS 2027 charter planning

The owner stated on November 8, 2026: **“NRRS charters for next season is planned 42/43/46.”** This is recorded as an NRRS Season 4 / 2027 plan, not an active charter allocation or a driver announcement.

The existing NRRS record in `src/data/charters.json` now carries optional planning metadata:

```json
"plannedSeasons": [
  {
    "season": 4,
    "year": 2027,
    "status": "planned",
    "numbers": ["42", "43", "46"],
    "sourceDate": "2026-11-08",
    "sourceNote": "Owner-approved plan: NRRS charters for next season are planned #42 / #43 / #46."
  }
]
```

The source date identifies the owner's planning statement, not a race date, build date, season start or date of confirmed charter approval. No drivers, teams, manufacturers or individual assignments have been inferred for these three numbers.

Current NRRS full-time entries and shared open-charter uses remain unchanged. UARL D1, roster assignments, standings, results, historical records and paint identities are unaffected by this plan. A calendar change never promotes a plan into `fullTime`, `openCharters`, a driver assignment or an active number.

## Source and CMS behavior

`reconcileCharterPlans(boards, seedBoards)` in `src/lib/charter-plans.mjs` adds the source plan only to an existing NRRS record whose `plannedSeasons` field is absent, as a compatibility fallback for publications created before this metadata existed. It does not mutate the source or input records.

An explicit `plannedSeasons` list is authoritative. Later Admin edits remain intact. Removing its entries leaves `plannedSeasons: []`, which suppresses the note and does not restore the seed. Removing the entire NRRS board also does not restore it. An absent property denotes the legacy fallback; use an explicit empty list to remove all plans. Invalid present values remain available for ordinary validation instead of being converted into approved source metadata.

Shared server/build/client integration should apply that same rule; source reconciliation must never replace an explicitly edited list based on its source date or revision. Existing active allocation normalization remains separate.

## Public copy recommendation

Reuse an existing small note style on the NRRS program or filtered driver view:

> 2027 · NRRS Season 4 — planned charter numbers: #42 / #43 / #46.

`plannedCharterNotes(board)` returns this plain text only for a valid NRRS plan. The Driver Lineup uses its existing small note styles, showing it only when the NRRS filter is selected and adding “Current entries remain unchanged.” The default All Drivers view and other program filters hide the note. Source, cached legacy metadata and later published edits use the same helper; explicit plan removals clear the note. The note is rendered as text, separate from current entry modules and their counts. It is not another active charter card, team slot, driver card or a claim that the plan is confirmed. No new stylesheet or broader design change is introduced.

## Validation

`node scripts/test-charter-plans.mjs` checks the approved planning facts, unchanged existing allocations, pure/idempotent reconciliation, later edits and removals, honest invalid/empty handling, and the absence of automatic activation when a plan's calendar year passes. A JSDOM check also exercises the actual small Driver Lineup note controller: filter switching, later plan edits, explicit clearing/removal, legacy fallback and unchanged active-card count. Shared publishing/schema tests belong to the integration path; this helper never writes or publishes content.

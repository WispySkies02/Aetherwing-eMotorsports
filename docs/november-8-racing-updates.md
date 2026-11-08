# November 8, 2026 racing context and archive correction

This change implements the owner's November 8 update request. It does not edit live CMS storage, deploy the site, advance championship points or activate future roster plans.

## Kmart snapshot and calendar

The checked publication identified Mexico City on November 9 as `kmart-round-12`. The completed November 2 event is therefore Round 11. Its obsolete calendar title and venue were `MasterPro Milwaukee Mile 200` / `Milwaukee`, while the approved November 7 article identifies the race as the **MasterPro Iowa 200 at Iowa Speedway**.

The compatibility repair in `src/lib/november-racing-context.mjs` changes only that exact November 2 Kmart Round 11 title/venue combination and the exact known caption `After Round 12 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble`. The corrected caption uses Round 11. Dates, stable event routes, entries, scores, movement and manual awards are preserved. Later editorial changes remain authoritative. Older bundled calendar dates are not shifted wholesale.

Standings PNG exports now use the saved snapshot subtitle. `lastResultDate` and `lastResultScheduleId` remain scoring cursors; neither is changed or used to infer the snapshot caption. This prevents an older automatic-points cursor from making the current Iowa snapshot appear to describe Portland.

## Approved team-only results

The source registry now includes two cited archive records:

| Event | Approved source | Known result | Unreported details |
| --- | --- | --- | --- |
| Kmart Round 11, Iowa, November 2 | Owner-approved November 7 [Mexico City preview](/news/bell-eyes-championship-mexico-city/) | Hailey, #15 Dodge, P4 | Start, stages, race points |
| NRRS Round 25, Homestead-Miami, October 27 | Owner-approved [NRRS Season 3 review](/news/hailey-bell-nrrs-season-3-review/) and published calendar | Hailey, historical #32 Toyota, DNS after technical problems; qualified P4 | Race points |

Both use `coverage: "team-only"` and `standingsMode: "record-only"`. Unknown numeric values stay `null` and display as an em dash. Homestead has `finishStatus: "DNS"`, `start: null` and `finish: null`; `qualifyingPosition: 4` is shown separately. A qualifying position never becomes a start or finishing position. No other drivers' finishing order is inferred from these articles.

Read reconciliation adds approved records only when the same event is absent, preserving later Admin corrections. Results remain sorted newest first, with one automatic featured result: Iowa. Historical #32 is retained despite today's different NRRS assignment. No archived points are added to current standings.

Admin preserves blank official values on draft/save/reload and gives an explicit DNS choice for cited archive records. Ordinary automatically scored results retain their numeric requirements. A complete finishing-order import explicitly returns to the existing scoring workflow, clearing an old DNS designation while retaining the archive's record-only standings effect.

The October 26 Kmart All-Star remains **awaiting official results** in `src/data/november-2026-results.json`. No All-Star finishing position or points have been supplied. The previously approved October 6, 13 and 20 NRRS records remain intact.

## Future NRRS charters

The owner's proposed **2027 / NRRS Season 4 #42 / #43 / #46** charters are stored separately in `plannedSeasons`, with the November 8 statement as their source. Existing active allocations and driver assignments remain unchanged. See [the planning contract](./nrrs-2027-charter-plan.md). This metadata does not announce drivers or automatically activate when the year changes.

## Verification boundaries

Regression coverage checks source validation, public result display, Admin draft/publish/reload against isolated storage, unchanged points/cursors, saved-caption exports and planned-versus-active charter separation. Browser tests use local fixtures and do not publish test content to production. Missing All-Star results and unreported Iowa/Homestead details require an official source before they can be filled in.

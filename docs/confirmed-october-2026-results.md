# Owner-confirmed October results and calendar corrections

The team owner supplied official Discord qualifying, stage and finishing-result
screenshots and clarified the publication scope. These supersede the partial
recap-only intake described in `october-2026-racing-data-review.md`.

## Results to include

Only the requested team entries are included, even when the source shows the
whole field. Non-participation is not recorded as DNS or as zero points.

| Date / event | Driver | Start | Stage 1 | Stage 2 | Finish | Final points |
| --- | --- | --- | --- | --- | --- | --- |
| Oct 5, Kmart Martinsville | Clutch | P1 | P2 | P2 | P2 | 35 |
| Oct 5, Kmart Martinsville | Wispy | P3 | P5 | P5 | P4 | 33 |
| Oct 6, NRRS Talladega | Hailey #32 | P2 | P1 | P3 | P4 | 41 |
| Oct 10, Sunoco Charlotte oval | Will #42 | P1 | P1 | P1 | P1 | 75 |
| Oct 10, Sunoco Charlotte oval | Clutch #46 | P2 | P2 | P2 | P2 | 51 |
| Oct 10, Sunoco Charlotte oval | Wispy #54 | P3 | P3 | P3 | P3 | 46 |
| Oct 13, NRRS Portland | Hailey #32 | P7 | Outside top 5 | Outside top 5 | P8 | 29 |

- **Martinsville:** owner explicitly confirmed 35 and 33 already include stage
  points. Do not recalculate these totals from the generic Kmart profile or add
  stage awards again. Individual stage-point amounts were not supplied.
- **NRRS:** only Hailey and Plarker are eligible for inclusion in this intake.
  Plarker missed Talladega and is not in the complete Portland finishing field.
  The existing official recaps establish Hailey's 41/29 totals and Talladega's
  combined eight stage points. Exact individual Talladega stage awards and
  Portland stage finishing positions beyond the top five remain unknown.
- **Sunoco:** owner supplied the official format: finish points 55, 35, 34,
  33, 32 … 23 for P1–P14; each stage awards 10/8/6/4/2 to its top five.
  Charlotte totals are therefore 55+10+10=75, 35+8+8=51, 34+6+6=46.
  The owner explicitly confirmed Gostclutch24 is Clutch.
- Historical **Wispy** names remain recorded for Kmart/Sunoco. Their canonical
  profile identity remains Hailey. Current assignments and roster data are
  not renamed or renumbered to fit historical results.
- The Martinsville screenshots do not show Clutch's or Wispy's numbers. Those
  fields await owner confirmation rather than an assumed race-day number.

## Calendar

Use the current published schedule, not the older bundled seed, as the baseline
for these changes. Rounds and previously shared Sunoco race URLs are retained.

- NRRS R22: October 6 at Talladega, as the official DEGA 2 result establishes.
- NRRS R23: October 13 at Portland, replacing the stale Indianapolis listing.
- Sunoco October 10: **Charlotte oval**, not the Roval.
- Sunoco: October 17 off week; Phoenix October 24; Atlanta October 31;
  Homestead November 7. All races originally dated October 17 onward move
  exactly one week. The off week is a separate calendar entry.
- UARL Open: no race October 11. All remaining rounds move one week:
  Charlotte Dirt October 18, Wake County October 25, continuing through
  Bowman Gray December 13. Charlotte Dirt is still pending later October 18;
  no exact revised start time was supplied. It shows **Start time pending**,
  without a fabricated countdown, live status, completion, or calendar export.
  Clear the Calendar editor's pending-time checkbox once a real time is known.

No result is added for Bathurst, Sunoco Dover, UARL Open Sunny South, UARL D1
Charlotte/Mexico City, or iRacing Indianapolis. A statement that the team did
not race does not cancel another league's event. Pending Charlotte Dirt and
UARL D1 Echo Park do not receive results before they run.

## Safe publication preparation

`src/data/confirmed-racing-updates.json` is the reviewed, minimal release
manifest. It contains the four result records and only the approved schedule
field changes/addition. The public API never applies this manifest during a
read; later Admin work remains authoritative.

To prepare a current publication for review without writing live data:

```sh
node scripts/prepare-confirmed-racing-updates.mjs published-feed.json prepared-feed.json
```

The helper preserves unrelated datasets and historical entries, checks for
conflicts with newer Admin edits, retains Sunoco race links, and is idempotent:
applying it twice cannot duplicate results or shift the calendar another week.
It creates a separate output file and has no network or publication action.

After review/release:

1. Open Admin → Calendar → **Load reviewed October update**. Inspect the
   shifted dates, venues and off week, then publish that section.
2. Open Admin → Race Results → **Load reviewed October update**. Inspect the
   four team-only records, then publish that section.

The button stages only the current section in the editor. It does not publish,
consume other drafts, or change standings. It rejects conflicting later Admin
edits. Historical result records retain `record-only` status: existing
championship points are preserved. Team-only results cannot safely replace a
full-league standings import. The individual Race Results picker remains
available to load a single reviewed race instead.

No deployment, automatic merge, or production storage write is part of this PR.

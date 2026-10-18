# October 18, 2026 racing data review

Follow-up: the owner has now supplied official screenshots and schedule
corrections. See [the confirmed intake](confirmed-october-2026-results.md).
The original audit findings below describe the earlier published state.

## Sources and confirmed records

The public `/api/site-content` feed was inspected read-only at revision 89. It
contains five results ending September 28. Its NRRS board already shows R23,
Hailey P4, 2,190 points and a 106-point gap. Its automatic-points marker still
references September 22/R21, so backfilling history must not advance that board.

The repository's published Aetherwing recaps confirm these **team results**:

| Event | Driver / number | Start | Stages | Finish | Race points |
| --- | --- | --- | --- | --- | --- |
| October 6, NRRS R22, Talladega | Hailey / #32 | P2 | P1 / P3; 8 combined stage points reported | P4 | 41 |
| October 13, NRRS R23, Portland | Hailey / #32 | Not reported | 0 stage points; individual stage finishes not reported | P8 | 29 |

Sources:

- `/news/talladega-leaves-bell-frustrated-championship-gap-grows/`
- `/news/bells-road-course-struggles-deepen-at-portland/`

These records have `coverage: team-only` and explicit recap provenance. Unknown
fields remain null, not zero or a guessed position. Preserve the reported points:
the generic NRRS stage formula does not reproduce Talladega's reported total.
The full finishing orders are not available in either recap. Other drivers'
finishes, numbers, points and stage breakdowns have not been inferred.

Both records use `standingsMode: record-only`: publishing or correcting them
updates the results archive and latest-result card without adding points to the
already-current championship board. This remains true if a full official field
is later imported. Applying a full-field CSV replaces the recap-only scoring
mode with the normal scoring workflow, while retaining the archival safeguard.

## Publication after review

This change does **not** write to live Admin storage, deploy, merge, or replace
published results in the API read path. A stale publication must not override
later Admin work with a hardcoded seed repair.

After the PR is reviewed and released through the normal process:

1. In Admin → Race Results, select NRRS → October 6 Talladega → Load race results.
2. Review the prefilled, recap-confirmed team record and source. Publish it.
3. Select NRRS → October 13 R23 → Load race results. The older schedule may call
   this Microsoft 200 / Indianapolis. The result retains the verified Portland
   venue from the recap and links to the stable `/event/nrrs-round-23/` route.
4. Review and publish. Confirm History and Homepage Latest Result show October
   13 Portland, and that NRRS remains P4 / 2,190 / −106.
5. Check the two public result pages and recap links. Future Admin changes to
   results remain authoritative; the live feed does not resurrect seed records.

The published schedule still describes R23 as Indianapolis. The result page and
full-calendar result row display the actual recorded Portland venue, preserving
the original schedule record. A deliberate Admin correction of the calendar
record can reconcile the planning record too; no live calendar mutation was made.

## Other missing official data

The published calendar also has elapsed October windows without corresponding
result records: Bathurst (October 2), Sunoco Dover (October 3), UARL Open Sunny
South and UARL D1 Charlotte (October 4), Kmart Martinsville (October 5), Sunoco
Charlotte Roval (October 10), UARL Open Charlotte dirt and UARL D1 Mexico City
(October 11), Sunoco Phoenix (October 17), and
UARL Open Wake County (October 18). A past calendar window alone does not prove
that a race ran. No official finishing orders were located for these events;
no results were invented. UARL D1's October 18 evening event is still upcoming
at the time of the review. The iRacing Indianapolis event window (October 16–18)
is still open and is not treated as a completed race.

## Verification

- `npm run test:all`: validator, Admin API/DOM/navigation/saves, shared calendar,
  publication/cache/program regressions, development routes, isolated content
  builds/restoration, and main-site/Paint Booth function packaging.
- `ASTRO_TELEMETRY_DISABLED=1 npm run build`: production site.
- `PAINT_TEST_MODULES=/tmp/aetherwing-browser-tests/node_modules npm run test:public:browser`:
  production Chromium at 1440px, 390px and 320px, delayed/missing publications,
  R23 consistency, all programs, event/result links, More sheet and dock clearance.
- In `aetherwing-paint`: `npm run check`, `npm run test:catalog`, `npm run test:stage`
  with `PAINT_TEST_MODULES` pointing to the installed Playwright/Three packages.
  Stage checks exercise actual WebGL rendering, camera controls and PNG export
  using Chromium's software WebGL. These are not physical-device tests.

Live publication is exercised against isolated storage/mocked public feeds;
production Admin storage was not modified. The Booth is static HTML and has no
production-build command; its validator, browser suites and function packaging
cover the available release checks.

# November 15, 2026 — verified racing records

## Hailey's profile-only GWM ride

The owner-confirmed current **UARL Division 1 #28 Goat Whitlock Motorsports** ride is stored in Hailey's optional `driver-profiles.profileAssignments` list. It appears as one row on her canonical profile using the existing program-row layout. Her UARL Open #28 remains a separate team assignment and row.

This list is editable in **Admin → Driver Profiles → Hailey → Profile-only programs**. The editor provides league, team, number, status and visibility controls; internal IDs are generated when adding a row. It supports private drafts, later edits, removal and re-adding. A missing field on an older Hailey detail record receives the approved default, while an explicit empty list, inactive record, custom edit or removed detail record remains authoritative. API replies that omit the entire driver-profiles collection retain the server-rendered profile detail.

The ride is not inserted into global Driver League Assignments, charter boards, alliance records, directory program counts or the Aetherwing D1 summary. Will #33 and unsigned #42/#43 remain the only three Aetherwing D1 modules. No GWM manufacturer, full-time commitment, artwork or effective date is inferred. Existing career metrics and their date labels are unchanged.

## Home and Calendar publication consistency

The checked revision 126 CMS publication contains ABC Raceway / Open Round 9 and Silverstone / D1 Round 7 on November 15, and Naval Base Coronado / Kmart Round 13 on November 16. The deployed Calendar's embedded build seed differed from these saved records. Its old controller exposed that seed immediately and again after a bundled fallback, while Home already withheld unverified schedule actions.

The Calendar now follows Home's shared publication status. It shows a neutral loading state, enables event actions only after the published schedule resolves, and shows an unavailable state after a cached/bundled fallback. Recovery restores the selected league and `#full` view. Successful Home and Calendar views consume the same CMS entries, dates, times and stable event IDs. No schedule venue, date, time, round or historical event record is rewritten by this fix. The observed CMS rows are recorded here as the current saved publication, not independently verified official fixtures.

## Approved Mexico City result

The owner confirmed the following **November 9 Kmart Round 12** results in the November 15 review:

| Driver | Number | Finish |
| --- | --- | --- |
| Hailey | 15 | P6 |
| Will | 24 | P1 |

The public calendar checked on November 15 identifies the event as **Corona Mexico 250**, at **Mexico City**, on **2026-11-09**, with stable route `/event/kmart-round-12/`. Both the approved source assignment and the published Kmart assignment identify Will as #24 for StarClutch Racing. The existing approved preview identifies Hailey's #15 as a Dodge; Will's manufacturer is not supplied in these records.

The archive uses `pointsSource: "official-result"`, `coverage: "team-only"` and `standingsMode: "record-only"`, with the owner's November 15 confirmation recorded in `sourceNote`. The November 7 Mexico City article is a pre-race interview and is not cited as a source for the subsequent finishing order. Starting positions, stage positions, stage points and race points remain `null`; unknown values are not replaced with zero or calculated from finishing positions. No other entrants or finishing positions are inferred.

`src/data/november-2026-results.json` retains the original November 8 approval and pending All-Star source record, with a separate dated November 15 approval for `kmart-round-12`. The existing reviewed-result reconciliation appends the Mexico record only when no published record represents the same event. An existing later correction remains authoritative even when it has a different schedule ID. The normal newest-result selection makes Mexico City the Latest Result without changing the featured news article.

## Exact 678-point snapshot caption

The checked public feed has Hailey #15 on **678 points**, but still labels its Kmart snapshot:

`After Round 11 of 23 · Iowa · Nov. 2, 2026 · Chase Bubble`

The owner's review identifies this snapshot as after Mexico City, Round 12. The existing `reconcileNovemberStandings` helper corrects that exact caption to:

`After Round 12 of 23 · Mexico City · Nov. 9, 2026 · Chase Bubble`

The added guard requires the Kmart board/league identity, the exact obsolete Iowa caption and the published Hailey #15 value of 678. The earlier November 8 correction of the erroneous Iowa Round 12 caption to Iowa Round 11 is retained for other snapshots. The September bundled seed, unrelated scores, later custom captions and later event captions are not migrated by round or assumed to contain current data.

Only the caption changes. Rows, points, gaps, movement, championship flags, homepage selection, manual adjustments and automatic-points cursors are preserved. The result archive does not recalculate standings or mark the race as applied to points.

## Preservation and outstanding source needs

- The November 2 Iowa P4 record and earlier approved NRRS records remain intact.
- The October 26 Kmart All-Star still requires an official finishing order and point treatment.
- Mexico City start, stage and race-point information remains unreported.
- No new standings totals, championship clinch, roster signing, calendar shift, historical renumbering or news-feature change is inferred from these corrections.
- Verification uses local source data and isolated fixtures. No live CMS record, deployment or production write is part of this work.

## Verification and remaining limits

- Sponsor-upload unit and native browser regressions passed for team partners and driver portfolios, including real image decoding/optimization, previews, validation failures and isolated authenticated draft/publish/reload. The November 4 report was subsequently fixed and user-confirmed working. This verification does not claim an authenticated production upload was performed.
- The separate Paint Booth passed its existing validation, catalog and real Three.js/WebGL stage checks with GLB/textures, scene changes, original static-image downloads, 3D PNG export, model-failure fallback, request-race guards, search/copy/direct URLs and touch interactions. Desktop and 390/320px touch-enabled Chromium used a SwiftShader software GPU. No Paint Booth source or asset changed. A physical phone/Safari and every live model remain unverified.
- No authorized dated iRacing source snapshot was found. The existing Formula win-rate label does not establish the denominator or discipline scope of the other metrics. No source date, new total or build date has been substituted.
- Public studio branding, partner categories and future-season branding/effective dates still require the owner's approved scope and assets. Existing partner identities, livery assets and 2026 historical credits remain untouched.

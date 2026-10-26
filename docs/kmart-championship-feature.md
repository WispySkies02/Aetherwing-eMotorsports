# Kmart Season 2 championship feature

Route: `/news/from-fourth-to-first-hailey-bell-kmart-chase/`.

The owner requested a new featured story celebrating her clinched Chase berth
and the possibility of a first regular-season championship. UI authorization
applies to this new story; other site layouts are unchanged. The source is the
owner-supplied October 26 handoff and matching chart JSON. The supplied article
baseline is retained in `docs/sources/kmart-season2-feature-2026-10-26.md`.

## Content boundary

- Static snapshot dated October 26, through R10 Talladega on October 19.
- Ten completed points events, eleven checkpoints: Portland before and after
  the league-approved 310-point administrative transfer are separate stops in
  one race, not an extra race.
- 606 official points = 296 race-earned + 310 transferred; a 281-point lead.
- Chase berth secured under the supplied eligibility assumptions. Neither the
  regular-season nor overall championship is represented as clinched.
- Official/race-earned views change only Hailey's displayed chart series.
  Unknown rival values remain null; Jaxon's line ends after departure.
- The October 26 All-Star is an exhibition and excluded from the points chart.
- Future cards use the supplied schedule snapshot and link to the existing
  full Kmart calendar. They do not update the canonical schedule.
- No results, standings, wins, roster records, paint assets or partner data are
  migrated. Cumulative Talladega points are not a guessed finishing order.

`src/data/kmart-season2-chart-data.json` is the exact supplied JSON.
`src/lib/kmart-season2.mjs` derives chart values, metrics, milestones and clinch
thresholds. No chart library or framework dependency was added.

## Publishing and interaction

The news seed chooses the new feature for Home, Newsroom, Admin and the public
news feed; previous recaps remain available at their existing URLs. Published
title/prose updates preserve chart controls and selected checkpoint instead of
replacing the interactive DOM. The chart itself remains an explicitly dated
snapshot, not a live standings feed.

Native radio/checkbox/select/range controls support keyboard operation. SVG
checkpoint controls support focus, arrow keys and Home/End; equivalent select,
timeline and quick-jump controls work on touch screens. An accessible data table
and the full article remain available without JavaScript. Motion respects the
existing reduced-motion preference.

## Verification

- `npm run test:all`: includes source math, null/transfer handling, publication,
  archived recap retention and unchanged standings/results.
- `npm run build`: production rendering of the new route.
- `npm run test:kmart:browser`: 1920, 1440, 768, 390 and 320px; chart modes,
  comparison presets, driver toggles, nulls, keyboard, emulated touch, timeline,
  hydration/CMS state preservation, source labels, overflow and featured links.
  Also checks the no-JavaScript article/table fallback.
- `npm run test:public:browser` and `npm run test:news:browser`: existing public
  pages and archived recap layouts.

These browser checks use Chromium and deterministic public-feed fixtures;
physical-phone behavior and authenticated production Admin writes are separate.

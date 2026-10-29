# NRRS Season 3 postseason feature

The owner-approved October 29, 2026 handoff supplies the complete article and official 25-race results for **MORE THAN JUST RUNNING LAPS**. The feature lives at `/news/hailey-bell-nrrs-season-3-review/`, following the existing newsroom convention. It replaces Kmart as the single homepage/newsroom feature; the Kmart article and earlier recaps retain their routes and content.

The article emphasizes Bell’s dissatisfaction, technical setbacks, enjoyment of superspeedway racing and commitment to Clutch, Will and StarClutch Racing. It does not present Season 3 as a major competitive success or promise a 2027 redemption/championship.

## Content and data

- `src/data/news.json`: complete approved eight-section editorial, headline, subtitle, October 29 publication date, metadata and feature selection. Normal Admin draft/publication text updates are supported without replacing the interactive chart or resetting the selected race.
- `src/data/nrrs-season3-review.json`: owner-supplied 25-race dataset and 221 total entries. This is a dated article snapshot, separate from public standings, roster and race-result collections. No automatic migration changes those records.
- `src/lib/nrrs-season3-review.mjs`: statistics calculated from those results; DNS stays `null`. The average field size uses all 25 events; average finish uses only the 22 starts.
- All 25 individual field sizes are verified in the owner’s follow-up, counted from final finishing orders in the supplied Discord results recording, including listed DNFs and parked entries. The total (221), mean (8.84), largest field (R10 Talladega, 12) and smallest (R24 New Hampshire, 5) derive from the individual fields. DNS races remain part of field statistics without counting as Bell starts.
- R18 and R21 are work DNS; R25 is technical DNS. Homestead P4 is qualifying only, never a finish, start or DNF.
- The non-points All-Star is excluded. Chase is R20–R25, with North Wilkesboro / Talladega / Portland / New Hampshire / Homestead as supplied.

## Presentation and interaction

The page uses the existing shell and navigation with styles limited to this feature. Saira Condensed headlines, Inter body text, Share Tech Mono numbers, charcoal surfaces and the supplied blue/gold accents support a readable editorial column. Wider panels hold six primary statistics, best/worst spotlights, the top-five rate, season chart, compact track comparison, Chase table and four-step technical timeline. Mobile statistics use two columns.

No approved on-track image was supplied. The hero is an Aetherwing-branded typography treatment; it does not invent a photograph or repurpose old schedule artwork. The closing footer reuses the approved Full Heart Tour logo from its existing feature, with typography and a verified Full Heart Tour destination. Existing social-image fallback remains intact.

The server renders the full article, SVG chart and 25-row accessible table before JavaScript. The chart’s P1 axis is at the top, podiums are gold diamonds, DNS appears on its own status row, and line paths break across missed starts. Hover, tap, a race select and keyboard arrows/Home/End expose race details. Wide chart labels scroll within the panel on phones. Controls stay mounted when CMS prose updates. The page uses no animations, framework, chart library or new npm dependency.

## Verification

- `npm run test:all`: content/API/Admin/DOM, existing racing and schedule suites, new season-data calculations, publication/rebuild restoration and Netlify function packaging.
- `npm run build`: production build.
- `npm run test:nrrs:browser`: 1440, 1024, 768, 430, 390, 360 and 320px, emulated touch, keyboard navigation, full-copy preservation, numeric/heading fit, DNS details, pending-publication hydration, subsequent CMS edits, mobile navigation/closing-link clearance and no-JavaScript fallback.
- `npm run test:public:browser`: homepage/newsroom current feature and existing public racing flows.
- `npm run test:kmart:browser`: archived Kmart feature remains interactive.

Browser tests use local built output and mock publication responses; they do not write to production Admin. Mobile checks are browser emulation, not proof on a physical phone. External image/font requests are blocked in deterministic regressions. Normal PR preview automation is permitted; merge remains for review.

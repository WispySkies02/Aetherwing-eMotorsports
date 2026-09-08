# Changelog

## 0.4.0 — 2026-09-08
- Promoted `https://paint.aetherwing.net` to the canonical full Paint Booth application.
- Main-site header, footer, and navigation now link directly to the Paint Booth subdomain.
- Replaced the old main-site Paint Booth implementation with a compatibility bridge only for legacy `aetherwing.net/paint-booth#paint-...` links.
- Legacy hash links preserve the selected paint and forward to `paint.aetherwing.net/<paint-slug>/`.
- Paint data remains in the main repository for validation/source continuity; the production Paint Booth is deployed as its own Netlify project.

## v0.3.9
- Added Clutch’s #29 Sinder Dodge to the Kmart / StarClutch Racing Alliance Paint Booth garage.
- Added Scheme ID `132350921119875` and render `https://i.ibb.co/zV26LQkF/Clutch-Kmart-Sinder.png`.
- Paint Booth collection is now 35 uploaded paints; Kmart now has 5.
- Added the `kmart-clutch-sinder` deep-link/share slug.

## v0.3.8 — Full Team Wire Migration
- Migrated the exact 10-story archive currently published on `aetherwing.net/updates` into the new News page.
- Added the previously missing 100th RoRacing start and Aetherwing/NGM Driver Development stories.
- Replaced short placeholder article pages with full, structured story pages containing article sections, quick-fact rails, story-file metadata, historical-context notes, and story-to-story navigation.
- Preserved the full Martinsville Chase-clinch record, including the five-berth postseason ledger.
- Added redirects from every current Squarespace story URL to its new `/news/<slug>/` route, plus redirects from earlier rebuild slugs.
- Kept the current curated 10-story set rather than restoring stories intentionally absent from the live Team Wire.

## v0.3.7
- Paint Booth performance pass: reduced the eager thumbnail batch, tightened lazy-load margins, deferred archive image loading until the archive is approached, added image preloading for the active and adjacent paints, and avoided unnecessary active-image swaps.
- Added stronger content-visibility containment for heavy Paint Booth sections.

## v0.3.6
- Home page: removed the white logo-panel background treatment behind Palmetto Gaming and Apex Sim Racing, replacing it with a transparent/dark integrated partner-logo presentation.
- Partners page: matched the featured logo presentation to the darker integrated style for consistency.

## 0.3.5 — Driver Numbers, Full ALL Rack, Booth Lighting & Schedule Criteria

- Fixed multi-number formatting on Drivers so every number carries its own `#`; Wispy now reads `#32 / #28 / #15 / #54`.
- Changed the Paint Booth primary ALL scope from Wispy-only to the complete 34-paint uploaded collection.
- Added All Drivers / Entries selection while keeping Wispy/Nicholas available as a 33-paint identity subset.
- Moved lighting controls into the visible booth area and expanded presets to Shop, Showroom, Inspection, Night, and Neon.
- Added semantic Schedule criteria tags for Dash4Cash, Chase, Crown Jewel, Championship, All-Star, Preseason, Special Event, and Off Week.
- Fixed Kmart Michigan weather by mapping `Michigan` to Michigan International Speedway; also filled other schedule weather gaps for Portland, Silverstone, Algarve, Brands Hatch, Mount Panorama, and Suzuka.
- Reworked Paint Booth image loading: i.ibb preconnect, deferred offscreen thumbnails, low-priority rack/archive thumbnails, high-priority active-car warming, adjacent-paint prefetching, and no full rack rebuild on every paint click.

# Changelog

## 0.3.4 — Paint Picker + Shareable Schedule Events

- Fixed garage entry behavior so selecting UARL D1, UARL D2, Kmart, Sunoco, or iRacing prefers the Wispy/Nicholas driver slot when that garage contains uploaded paints instead of dropping into an unrelated pending driver first.
- Added an iPhone-first Garage → Driver → Paint quick picker to the interactive Paint Booth.
- Changed the mobile Paint Rack from a sideways hunt to a vertically scrollable full-width list.
- UARL D2 now immediately exposes Wispy's two source paints; iRacing immediately exposes Nicholas Waggoner's 12 Wispy-identity paints.
- Added share buttons to every Schedule information dock.
- Added 143 static `/event/<slug>/` share routes with event-specific Open Graph metadata and human redirects back to the exact Schedule event.
- Added `#event-...` deep-link handling that reveals, opens, scrolls to, and briefly highlights the targeted event, including completed events.
- Updated staging build marker to v0.3.4.

## 0.3.3 — Repo-root deployment + server-rendered Wispy rack

- Fixed the deployment packaging problem that could leave an older v0.2 project at the GitHub/Netlify repository root while newer source was nested inside `aetherwing-site/`.
- Release ZIP now places `package.json`, `src/`, `public/`, and the rest of the project directly at ZIP root.
- Server-renders all 33 Wispy/Nicholas identity paints in the initial Paint Rack before JavaScript runs.
- Server-renders the initial Wispy driver stall with a 33-paint READY count.
- Added `data-paint-build="0.3.3"` to the Paint Booth facility for staging verification.
- Added no-store HTML caching for `/paint-booth/*` so mobile browsers do not retain an obsolete booth shell during staging.

## 0.3.2 — Mobile Paint Booth / Full Wispy Inventory Fix — 2026-09-06

- Reworked the Paint Booth mobile breakpoint so phones enter the actual vehicle bay first instead of seeing a stacked desktop-page fallback.
- Added a dedicated mobile booth console for Garages, Drivers, Paints, and Scheme Info.
- Changed Scheme Info on mobile into a bottom-sheet dossier and collapsed it by default so it no longer covers the booth on entry.
- Added `WISPY — ALL PAINTS` as the default Paint Booth scope, exposing all 33 source paints tied to the Wispy identity: 21 direct Wispy RoRacing paints plus 12 Nicholas Waggoner iRacing paints.
- Added explicit source paint totals to every garage selector so missing/empty data is immediately visible.
- Preserved individual garage filtering while keeping the complete Wispy rack available without requiring garage-by-garage navigation.
- Added a matching `WISPY 33` filter to the Archive Terminal.
- Added regression checks for the source inventory: NRRS 9, UARL D1 1, UARL D2 2, UARL Open 1, Kmart 4, Sunoco 4, iRacing 13.
- Preserved direct `#paint-SLUG` links so a shared paint still resolves to its actual source garage.
- Kept every current driver stall visible; no liveries were invented for drivers whose renders are absent from the uploaded V23 source.

## 0.3.1 — Actual Paint Booth Layout Correction — 2026-09-06

- Replaced the Paint Booth's conventional page-hero/module composition with a full-height facility that is itself the primary page experience.
- Added an industrial spray-bay scene with ceiling light banks, perspective walls, floor/vehicle stop markings, bay telemetry, and lighting modes that alter the active vehicle environment.
- Moved garage selection into a permanent left-side Garage Rail and current roster selection into a permanent Driver Stalls wall.
- Made every current source driver visible with number, handle/role, paint count, and explicit READY or PENDING state.
- Added a complete Every Current Driver Bay overview below the immersive facility so roster slots cannot disappear just because no render exists yet.
- Preserved source integrity: no liveries were invented for drivers without uploaded paints; those stalls are intentionally marked Paint Pending.
- Moved the paint rack and controls into a physical control-bench layout below the bay and changed Scheme Information into a slide-out dossier.
- Demoted the traditional searchable paint-card collection to an Archive Terminal below the immersive booth.
- Kept all 34 source paints, deep links, Scheme IDs, Paint Share URLs, random/previous/next controls, and full-render viewing.

## 0.3.0 — Interactive Facility / Full Calendar Rebuild — 2026-09-06

- Migrated the complete September 5 Schedule source into structured JSON: 143 calendar entries total, including 126 season races, 16 iRacing special-event windows, and the Kmart off-week marker.
- Restored the Schedule's filter-reactive Next Operation behavior so All Events, individual series, UARL group/subfilters, and iRacing each retarget Race Control automatically.
- Preserved the three-month condensed schedule / full upcoming schedule behavior and live/upcoming filtering.
- Added expandable information docks to every Schedule event with competition, relationship, timing, track, phase, round/marker, and live countdown state.
- Migrated the current track-location/weather mapping and connected weather targeting to the active Next Operation.
- Migrated the complete September 6 Paint Booth source: seven garages and 34 uploaded schemes, including all 13 iRacing liveries.
- Rebuilt Paint Booth as an immersive facility with selectable garage bays, current driver slots, paint racks, Shop/Showroom/Dark lighting modes, previous/next navigation, and a global Surprise Me control.
- Added a live scheme information dock with manufacturer, body, relationship, badges, notes, Scheme ID, Paint Share URL copy, and full-render view.
- Preserved exact `#paint-SLUG` deep-link loading and the separate `paint.aetherwing.net` Paint Share project.
- Added a full searchable/filterable collection browser below the immersive booth so the visual experience never makes the archive harder to use.
- Expanded locked-fact validation for full Schedule and Paint Booth migration totals and interactive feature presence.
- Kept production DNS, `aetherwing.net`, and the separate Paint Share deployment untouched.

## 0.2.0 — Live Identity / Interactive Rebuild — 2026-09-06

- Reworked the foundation to match the current Aetherwing visual identity instead of introducing a separate redesign language.
- Added the current Aetherwing editorial/grunge texture as a local site asset and switched the shared shell to the actual Aetherwing logo.
- Matched the current font family mix, sharp panel treatment, red/gold/blue accents, alliance purple, halftone/noise layers, brush headlines, and motorsports-editorial energy.
- Rebuilt the shared desktop/mobile navigation as native accessible components without Squarespace wrapper hacks.
- Rebuilt Home around the current live hierarchy: Born to Soar / Built to Fight hero, live Race Control, team presentation, competition browser, latest result/news, Partner Network, and Follow the Flight CTA.
- Added a randomized interactive Meet the Team system with Wispy fixed and three unique current drivers selected on load.
- Rebuilt Drivers as a selectable/filterable roster browser and retained the Wispy/Nicholas Waggoner iRacing identity rule.
- Rebuilt Schedule as an interactive Race Control board with current September events, event-window support, countdowns, league filters, and UARL subfilters.
- Rebuilt Paint Booth interaction with random feature, garage filters, lightbox, Scheme ID copy, share-URL copy, and exact hash deep-link reveal/highlight behavior.
- Rebuilt Partners with the two current featured relationships and separate expandable livery-brand portfolios.
- Added curated News search/category filtering plus standalone static story routes with individual social metadata.
- Added the complete 27-win historical record book with filters, milestone presentation, and historical/current context separation.
- Reworked Mission & Values, Team Handbook, and Contact into more editorial and interactive compositions while keeping current organization facts.
- Added `/updates` → `/news` redirect for compatibility with the current live-site route.
- Updated the default 1200×630 social preview using the current Aetherwing texture and logo treatment.
- Expanded locked-fact validation to cover the 27-win archive, September schedule, local brand assets, route compatibility, and current organization structure.
- Kept `paint.aetherwing.net` outside this repository and made no production DNS changes.

## 0.1.0 — Site Foundation — 2026-09-06

- Established Astro static-site architecture.
- Added shared responsive header, accessible mobile navigation, footer, SEO metadata component, and custom 404.
- Added Aetherwing design tokens and gritty editorial base styling.
- Added preserved top-level routes.
- Added structured current team, competition, roster, schedule, partner, Paint Booth, iRacing garage, and result data.
- Added a locked-facts validation script to catch accidental regressions such as UARL D2 reverting from 6:45 PM ET or FloRacing reappearing.
- Added initial interaction prototypes.
- Added migration and final-domain-cutover checklists.
- Kept `paint.aetherwing.net` completely outside this project.

## v0.4.1
- Added page-specific Open Graph / Discord social images for Home, Drivers, Schedule, Paint Booth, Partners, News, Wins & History, Mission & Values, Team Handbook, and Contact HQ.
- Updated paint.aetherwing.net root embed image to use a dedicated Paint Booth social graphic.

## v0.4.2
- Rebuilt schedule event sharing around 143 event-specific 1200×630 image cards.
- Event Discord embeds suppress visible title/description text so the image carries the event information.
- Shared event links open the Schedule with that event's exact league/UARL division selected, then open and highlight the shared event.
- Share crawler pages stay stationary for metadata; human visitors are forwarded with JavaScript only.

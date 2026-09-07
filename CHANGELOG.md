# Changelog

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

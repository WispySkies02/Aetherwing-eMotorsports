# v0.4.23 — UARL D2 Friday Schedule

- Official UARL D2 race night moved from Mondays to Fridays at 6:45 PM ET.
- Shifted all 18 UARL D2 rounds to the Friday of the same scheduled race week, beginning Sep 18, 2026.
- Updated recurring competition metadata and project source notes to Friday.
- Regenerated all 18 D2 event-share cards under their new date-based slugs.
- Updated UARL D2 and UARL All Divisions next-five league embeds; UARL All now starts with Sep 13 Open/D1, Sep 18 D2, then Sep 20 Open/D1.
- Bumped all league-share images to v52 for cache refresh while preserving race-type badges and copy-link behavior.

# v0.4.22 — League Share Race-Type Badges

- Added compact race-type badges to the next-five league social/embed cards.
- Badge logic matches the Schedule page categories: Chase, Championship, Crown Jewel, All-Star, Special Event, Clash/Preseason, Dash4Cash/D4C Qualifier, Regular Season Finale, and Off Week where applicable.
- Multiple statuses can appear together when meaningful, such as `CHASE` + `CROWN JEWEL` on the NRRS Southern 500.
- Updated all eight league-share OG images and bumped the social-image cache revision to v51.
- Preserved the copy-link-only league sharing behavior and all existing schedule data.

# v0.4.21 — League Share Polish

- Removed the bottom-right Aetherwing text/footer watermark from league-share preview images.
- League share control now always copies the URL on desktop and mobile; it no longer opens the native mobile share sheet.
- Updated the league-share OG images and cache-busting version to v50.
- Preserved all next-five-race league/UARL-combined embed behavior from v0.4.20.

# v0.4.20 — League Share Static-Route Hotfix

- Fixed Astro prerender failure in `src/pages/schedule/share/[league].astro`.
- `getStaticPaths()` now defines its route map inside the function scope, which Astro can safely execute during static route generation.
- No schedule, standings, UARL date, share-card, or visual data changed from v0.4.19.

# v0.4.19
- UARL D1 Saturday events moved to Sundays; the Sep 9 L.L. Bean Clash remains tonight.
- Added shareable league schedule cards showing the next five races, including combined UARL All Divisions snapshots.
- Added league-share controls to the Schedule filters and static social-preview routes.

# v0.4.18 — Mobile Schedule Cockpit

- Reworked the Schedule page on phones so championship information no longer becomes a long vertical wall before the calendar.
- Converted the four schedule summary stats into a compact horizontal swipe rail on mobile.
- Added mobile-only horizontally swipeable championship cards for NRRS, Kmart, Sunoco, and UARL while preserving the full desktop Championship Tracker.
- Preserved every authoritative standings value, Kmart #29 part-time Chase ineligibility note, Sunoco Chase status, and UARL Season 6 waiting state.
- Added a visible mobile “Jump to calendar” shortcut from the Championship Tracker.
- Compressed the mobile Race Control / Next Operation module so the actual race calendar begins substantially sooner without removing next-event context.
- Desktop Schedule presentation and all schedule/result data remain unchanged.

# v0.4.17 — Pepsi 400 Post-Race Broadcast Redesign

- Rebuilt the Wins & History Latest Result package into a tighter motorsports-TV information graphic with no dead two-column parent-grid space.
- Uses Edo SZ only for the expressive Pepsi 400 event title; all position, car-number, points, and delta data in the result graphic use clean Saira Condensed / mono broadcast typography.
- Preserves the confirmed Pepsi 400 progression (P7 start, P4 Stage 2, P4 finish), NRRS Chase standing (P5, 2,055 pts, -45), and September 15 Darlington Chase opener.
- Added explicit Checkered, Regular Season Finale, and Chase Qualified status treatments plus a compact Up Next Chase module.
- Corrected the current result series label to NRRS Town Fair Tire Cup Series.
- Preserves the v0.4.16 readability pass, collapsed driver portfolios, standings, partner presentation, and all unrelated routes/data/assets.

# v0.4.16 — CSS Build Hotfix

- Fixed malformed literal `\n` escape sequences in the TV-broadcast latest-result stylesheet that caused Lightning CSS/Vite minification to fail on Netlify.
- Preserves the v0.4.15 broadcast result redesign, readability pass, dark sponsor presentation, and collapsed driver portfolios.

# Changelog

## v0.4.15 — Broadcast Results / Readability / Portfolio Cleanup
- Rebuilt Wins & History Latest Result as a readable TV-broadcast-style race information package instead of the oversized P4 poster treatment.
- Added clear start, Stage 2, finish, Chase standing, race summary, and next-race information to the latest-result package.
- Raised the site-wide explicit microtype floor so important labels and controls no longer render at 7–10px on desktop.
- Replaced white driver sponsor/livery-brand tiles with integrated dark graphite treatments and transparent logo presentation.
- Driver brand portfolios now all start collapsed; Wispy is no longer automatically expanded on page load.
- Preserves v0.4.14 standings, NRRS Chase dates, schedule data, routes, partners, and paint architecture.

## v0.4.14 — Aetherwing LIVE visual overhaul
- Site-wide visual system pass: wider canvas, stronger page hierarchy, animated/interactive panels, race-week editorial treatments, and less dead black space.
- Schedule Championship Tracker rebuilt as a full championship wall with featured NRRS postseason treatment and larger standings presentation.
- Wins & History Latest Result replaced with a dedicated Pepsi 400 post-race graphic: P7 start → P4 Stage 2 → P4 finish, Chase qualified.
- Homepage Latest Result replaced with a compact post-race ticket rather than a plain stat table.
- Drivers, News, Partners/content pages, Handbook/editorial pages, and Paint Booth bridge receive visual hierarchy and interaction upgrades.
- Preserves v0.4.13 data, standings, schedule dates, routes, partner facts, and paint architecture.

# Changelog

## v0.4.13 — Netlify Build Hotfix
- Fixed the Schedule page Astro compiler error introduced by the Kmart #29 SCR part-time standings subsection.
- Wrapped the active standings table and optional PT-entry block in a single Astro fragment so the conditional renders valid markup.
- Preserved all v0.4.12 standings positions, Chase eligibility, points, and schedule data unchanged.

## v0.4.12 — Standings Positions + Chase Eligibility
- Added confirmed Kmart standings positions: Jaxon P1, Will P2, Wispy P4.
- Added confirmed Sunoco standings positions: Will P1, Clutch P2, Eazy P4, Wispy P10.
- Added Sunoco Chase eligibility labels: Will, Clutch, and Eazy in the Chase; Wispy not in the Chase.
- Added the Kmart #29 SCR part-time entry subsection: Clutch 135 pts, Eazy 59 pts, Matty 58 pts.
- Marked #29 part-time drivers as not Chase eligible.

## v0.4.11 — Championship Tracker Readability
- Redesigned the Schedule page Championship Tracker for faster scanning and stronger desktop/mobile readability.
- Removed equal-height card stretching that created large empty black areas in short standings cards.
- Increased league headings, driver names, points, and current +/- values; added high-contrast position/car badges and colored value pills.
- Reworked UARL into a compact Season 6 waiting-state panel with D1, D2, and Open division chips.
- Preserved the authoritative NRRS, Kmart, Sunoco, and UARL standings snapshot from v0.4.10.

## v0.4.10 — Championship Tracker / NRRS Chase Schedule
- Added current team-maintained standings snapshots for NRRS, Kmart, Sunoco, and UARL.
- NRRS Chase status now appears prominently on the Schedule page: Wispy P5, 2,055 points (-45).
- Shifted all six NRRS Chase dates one week earlier, beginning with the Southern 500 at Darlington on September 15, 2026.
- UARL standings display an Awaiting Season 6 state until competition begins.

## v0.4.9

- Updated the authoritative latest NRRS result to the September 8 Pepsi 400 at Daytona International Speedway.
- Wispy: started P7, finished P4 in Stage 2, and finished P4.
- Removed stale Martinsville points/standings details from the Latest Result modules rather than carrying them into the Pepsi 400 without confirmed data.

## v0.4.8

- Updated the full site bundle to carry forward the latest schedule/share-card logic and corrected badge behavior.
- Confirmed UARL D2 uses countable rounds 1–18, with Rounds 14–17 marked as The Chase and Round 18 marked as Championship.
- Preserved the current league-badge system across share cards, including Clash, All-Star, Crown Jewel, Chase, and Championship states.
- Carried forward the cleaned schedule-logo assets already in the working site tree, including the transparent SCR and Kmart Chase logo files.

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

## v0.4.3
- Added official/user-supplied series branding to all 143 Schedule share graphics: UARL D1, UARL D2, UARL Open, Sunoco Trucks, Kmart, NRRS, iRacing, and StarClutch Racing alliance marks.
- Kmart share graphics now switch between Regular, Dash4Cash, and Chase branding based on each event.
- NRRS uses the final red Town Fair Tire Cup Series logo with black TOWN FAIR TIRE text for general races; the Pepsi 400 keeps its dedicated alternate NRRS/Town Fair Tire mark.
- Reworked event-name typography into the site's distressed Edo-style display treatment.
- Removed the subtle bottom-right Aetherwing.net watermark from event-share images.
- Preserved image-only Discord embeds and league-aware Schedule deep links/highlighting from v0.4.2.

## v0.4.5 FULL CLEAN RESTORE
- Integrated the complete v0.4.5 schedule-share readability update into a full standalone site tree.
- All 143 event cards use actual Edo SZ-rendered event names and cache-busted `-v45.jpg` OG image filenames.
- Round numbers use a large bottom-strip badge.
- Event status/criteria under the track use high-contrast badges.
- StarClutch Racing alliance branding is separated from Kmart/Sunoco series branding for readability.
- Removed stale pre-v45 event share JPEGs from the clean package.
- Added PNG favicon support with SVG fallback; validation accepts either format to prevent PNG swaps from killing Netlify builds.

## v0.4.6
- Removed the unintended rectangular white matte around SCR alliance branding while preserving the intended white sticker-shaped backing inside the SCR logo.
- Removed the unintended outside white matte from the Kmart Chase logo.
- Re-rendered affected Kmart/Sunoco event share cards and cache-busted all 143 event images to `-v46.jpg`.
- Event share links now use `?v=46` so Discord performs a fresh scrape.
- Added transparent `scr.png` and `kmart-chase.png` source assets and removed the old JPG source versions.


## v0.4.7
- Built from the user-updated v0.4.6 source ZIP so current replacement images are preserved.
- NRRS now numbers countable events with Clash and All-Star excluded; Pepsi 400 is Round 19 and labeled Regular Season Finale; Chase/Championship continue through Round 25.
- UARL D1 now numbers countable events Round 1–18 with Clash and All-Star excluded; UARL D2 is Round 1–18; UARL Open is Round 1–12.
- Added universal high-contrast Clash, All-Star, The Chase, Championship, Crown Jewel, Regular Season Finale, Dash4Cash, and Special Event share-card badges where applicable.
- Queen City 500 (UARL D1) and Goodyear Southern 300 (Kmart) are explicitly marked Crown Jewels.
- Kmart WeatherTech Championship 300 is explicitly a Championship event.
- Re-rendered all 143 share cards from the updated source logo assets with actual Edo SZ event-name typography.
- Kmart Chase and SCR assets are composited directly with their transparency; no artificial white matte is added.
- Cache-busted all event share images and copied share URLs to v47.

Current build: v0.4.24

## Paint Booth host

As of 0.4.0 the production Paint Booth is a dedicated application at `https://paint.aetherwing.net`. Main-site navigation links directly to that host. `/paint-booth/` remains only as a compatibility bridge for old hash deep links.


# Aetherwing eMotorsports — Main Website

Custom Astro rebuild of the Aetherwing eMotorsports main website.

## Status


**v0.4.24 — UARL D2 Start-Date Correction**
- UARL D2 remains Fridays at 6:45 PM ET, but the complete 18-round calendar is pulled forward one week.
- Season 6 D2 now opens Friday, Sep 11, 2026 and ends Friday, Jan 8, 2027.
- Event-share and league-share previews use the corrected dates.

**v0.4.23 — UARL D2 Friday Schedule**
- UARL D2 / NFFF Grand National Series now runs Fridays at 6:45 PM ET.
- Shifted all 18 D2 rounds from Monday to the Friday of the same race week.
- Updated site-wide competition metadata, Schedule data, event-share cards, and UARL league-share snapshots.
- UARL All Divisions share preview now reflects D2 Fridays chronologically alongside D1 and Open.

**v0.4.22 — League Share Race-Type Badges**

This version keeps the current Aetherwing visual identity while fully migrating the current Schedule and Paint Booth source data. The Schedule carries the complete 126-race season calendar plus iRacing special-event windows and expandable event docks. Paint Booth v0.3.5 keeps the immersive facility while making `ALL PAINTS` the complete 35-paint collection, improving mobile selection, moving five lighting presets into the booth itself, and optimizing remote render loading so the active car is prioritized over offscreen thumbnails. Every current source driver remains visible even when their render has not yet been supplied.

This project does **not** replace or deploy the separate Paint Share project at `paint.aetherwing.net`.

## Requirements

- Node.js 22
- npm

## Local development

```bash
npm install
npm run dev
```

Astro will print a local URL, normally `http://localhost:4321`.

## Production build

```bash
npm run build
npm run preview
```

Netlify settings are checked into `netlify.toml`:

- Build command: `npm run build`
- Publish directory: `dist`
- Production branch: `main` (set in Netlify UI)

## Deployment rule

Build and review the site on the temporary Netlify URL first. Do **not** point `aetherwing.net` to this project until the migration is approved. Do not alter the DNS record for `paint.aetherwing.net`, MX records, or unrelated TXT records.

For projects where Netlify displays its platform badge, disable it in **Project configuration → General → Powered by Netlify badge**. The Aetherwing source does not render a Netlify badge or footer credit.

## Architecture

- `src/pages/` — real public routes
- `src/layouts/` — shared HTML document layouts
- `src/components/` — reusable interface pieces
- `src/data/` — canonical structured team/competition data
- `src/styles/` — shared Aetherwing design system + page-specific styles
- `public/images/brand/` — local Aetherwing brand assets
- `public/images/textures/` — current editorial/grunge texture assets
- `public/` — static files copied as-is
- `docs/` — migration rules and project notes

## Current interactive systems

- Home: live race-control state, randomized Meet the Team presentation, selectable competition browser, expandable result detail
- Drivers: league/program filters and selectable driver profile stage
- Schedule: complete 2026–27 source calendar, live/upcoming state, filter-reactive Next Operation, countdowns, weather target, UARL subfilters, three-month condensed/full modes, and expandable event information docks
- Paint Booth: full-height industrial paint facility, dedicated mobile bay/control layout, complete 35-paint ALL rack plus Wispy identity filter, permanent seven-garage rail with source paint counts, current-driver stall wall with READY/PENDING states, iPhone Garage → Driver → Paint picker, five near-car lighting presets, previous/next/random loading, prioritized active-render loading, exact paint deep links, archive search/filtering, lightbox, Scheme ID copy, and Paint Share URL copy
- Partners: featured relationship profiles and expandable livery-brand portfolios kept separate from actual partnerships
- News: editorial filtering/search and standalone story routes with page-specific metadata
- Wins & History: filterable 27-win record book, milestones, and organization timeline
- Mission / Handbook / Contact: editorial, expandable, and purpose-driven layouts rather than repeated Squarespace cards

## Migration workflow

Use the current live Aetherwing page as the source of truth for each migration pass. Preserve content, visual identity, and working behavior, then improve the interaction and architecture rather than copying Squarespace wrappers/hacks.

Recommended sequence:

1. Foundation + shared identity
2. Home
3. Drivers
4. Schedule
5. Paint Booth
6. Partners
7. News
8. Wins & History
9. Mission & Values
10. Team Handbook
11. Contact HQ
12. 404 polish

## Versioning

Use Git rather than filename versioning. Prefer clear commits such as:

- `Match live Aetherwing editorial identity`
- `Build interactive Drivers roster browser`
- `Fix UARL D2 start time`
- `Add Wispy Home Depot Kmart paint`


## v0.3.5 repository deployment warning

This package is intentionally distributed as a **repo-root ZIP**. When updating an existing GitHub repository, the files from the ZIP must replace the repository root files (`package.json`, `src/`, `public/`, etc.). Do **not** place a new `aetherwing-site/` folder inside an older Aetherwing repository, because Netlify will continue building the older root project and ignore the nested update.

Paint Booth v0.3.9 server-renders the complete **35-paint collection** into the initial paint rack before client-side JavaScript executes. The Wispy/Nicholas identity filter still exposes its 33 paints, while Clutch now has a READY Kmart stall for the #29 Sinder Dodge. The page root includes `data-paint-build="0.3.9"` for staging verification.


## v0.3.5 interaction notes

- Mobile Paint Booth now includes a native Garage → Driver → Paint quick picker.
- Garage selection prefers a paint-ready Wispy/Nicholas stall when one exists, so UARL D2 and iRacing no longer open on an unrelated pending driver.
- Schedule event docks include share buttons. Shared URLs use `/event/<slug>/` and redirect human visitors to the exact expanded event at `/schedule#event-<slug>`.


### v0.3.5 interaction pass
- Drivers: multi-number displays now show a # on every number; Wispy order follows NRRS/UARL/Kmart/Sunoco context (#32 / #28 / #15 / #54).
- Paint Booth: ALL now means all 35 uploaded paints, with an All Drivers / Entries rack; lighting controls live in the booth and add Inspection, Night, and Neon presets.
- Schedule: event cards use semantic criteria chips (Chase, Dash4Cash, Crown Jewel, Championship, All-Star, Special Event), and weather mapping now covers Michigan, Portland, Silverstone, Suzuka, Brands Hatch, Mount Panorama, and Algarve.


### v0.3.9 Paint addition
- Added Clutch’s #29 Sinder Dodge to the Kmart / StarClutch Racing Alliance garage.
- Scheme ID: `132350921119875`
- Paint Booth deep link: `/paint-booth#paint-kmart-clutch-sinder`
- Paint Share route: `https://paint.aetherwing.net/kmart-clutch-sinder/`


Latest patch: v0.4.1 adds page-specific metadata images so major site links no longer all share the same default embed art.


### v0.4.2 schedule sharing
Each Schedule event has a dedicated `/event/<slug>/` share URL and generated image card. Discord receives the image-focused metadata page; users who click through are sent to `/schedule/` with the matching league/division filter active and the shared event opened.

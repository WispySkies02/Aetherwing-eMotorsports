# Aetherwing eMotorsports — Main Website

Custom Astro rebuild of the Aetherwing eMotorsports main website.

## Status

**v0.3.3 — Mobile Paint Booth / Full Wispy Inventory Fix**

This version keeps the current Aetherwing visual identity while fully migrating the current Schedule and Paint Booth source data. The Schedule carries the complete 126-race season calendar plus iRacing special-event windows and expandable event docks. Paint Booth v0.3.3 fixes the mobile facility layout and the incomplete Wispy paint presentation: mobile now enters the vehicle bay first with a dedicated booth control strip and bottom-sheet scheme dossier, while `WISPY — ALL PAINTS` exposes all 33 Wispy/Nicholas Waggoner identity paints across the source garages and iRacing. Every current source driver remains visible even when their render has not yet been supplied.

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
- Paint Booth: full-height industrial paint facility, dedicated mobile bay/control layout, `WISPY — ALL PAINTS` 33-paint identity rack, permanent seven-garage rail with source paint counts, current-driver stall wall with READY/PENDING states, paint control bench, Shop/Showroom/Dark lighting, previous/next/random loading, responsive scheme dossier, exact paint deep links, archive search/filtering, lightbox, Scheme ID copy, and Paint Share URL copy
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


## v0.3.3 repository deployment warning

This package is intentionally distributed as a **repo-root ZIP**. When updating an existing GitHub repository, the files from the ZIP must replace the repository root files (`package.json`, `src/`, `public/`, etc.). Do **not** place a new `aetherwing-site/` folder inside an older Aetherwing repository, because Netlify will continue building the older root project and ignore the nested update.

Paint Booth v0.3.3 also server-renders all **33 Wispy/Nicholas identity paints** into the initial paint rack. The complete rack is therefore present before client-side JavaScript executes. The page root includes `data-paint-build="0.3.3"` for staging verification.

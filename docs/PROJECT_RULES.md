# Aetherwing Netlify/GitHub Rebuild — Locked Project Rules

Date: September 6, 2026

This file is a development guardrail. The current live Squarespace page remains the page-level source of truth when each page is migrated.

## Migration identity

This is a migration + architectural redesign, **not a brand reset**.

Preserve the dark, gritty, asymmetrical motorsports/editorial identity. Avoid generic SaaS cards, glassmorphism, excessive border radius, unnecessary WebGL, and animation for animation's sake.

## Deployment safety

- Main rebuild: new GitHub repository + new Netlify project.
- `aetherwing.net` remains on Squarespace until the rebuild is fully tested and approved.
- `paint.aetherwing.net` stays on its existing separate Netlify Paint Share project.
- Do not alter production DNS during development.
- During final cutover, do not remove unrelated MX/TXT/email-verification records.
- Do not disturb the `paint.aetherwing.net` DNS record.

## Public routes to preserve

- `/`
- `/drivers/`
- `/schedule/`
- `/paint-booth/`
- `/partners/`
- `/news/`
- `/wins-history/`
- `/mission-values/`
- `/team-handbook/`
- `/contact/`
- custom 404

## Current leadership

- Wispy — Founder, Team Owner, RoRacing Coordinator, Sim Racing Coordinator
- Callornot — Team Principal, Sim Racing Coordinator
- Will — Creative Director
- Jaxon — Media Specialist

Trent is no longer part of the team. There is no Co-Owner role. Do not present Callornot as Co-Founder.

## Competition structure

Five Aetherwing programs:

1. NRRS
2. UARL Division 1
3. UARL Division 2
4. UARL Open
5. iRacing Factory Program

Two StarClutch Racing Alliance series:

1. Kmart Auto Parts Series
2. Sunoco Truck Series

Total: seven competition relationships. Kmart and Sunoco do not race under the Aetherwing banner. Use the label **STARCLUTCH RACING ALLIANCE** and a distinct purple/galaxy visual treatment.

FloRacing was intentionally removed and must not be re-added.

## Locked site stats

- 10 active RoRacing drivers
- 27 verified Aetherwing wins
- 600+ estimated racing starts
- 7 competition relationships
- Founded 2023
- 02 Featured Partners
- Drivers: 10 RoRacing drivers / 5 Aetherwing drivers / 5 alliance-only drivers

Wispy iRacing stats:

- 409 starts
- 59 wins
- 121 top-fives
- 52 poles
- 14.1% Formula win rate

Formula win rate means Formula-category iRacing competition.

## Identity rule

Wispy and Nicholas Waggoner are the same driver.

- RoRacing / Roblox: Wispy (`@Aokikoto`)
- iRacing liveries and historical iRacing results: Nicholas Waggoner

Do not create a second Wispy iRacing driver profile.

## Featured partners

Exactly two featured partners at this point:

1. Palmetto Gaming — Gaming Partner
2. Apex Sim Racing — Affiliate Partner

Palmetto Gaming is an established public-facing relationship. Do not expose private/behind-the-scenes conversations, imply an application, or claim services it does not provide. Do not expose Aetherwing's location/state through partner copy.

Driver livery brands are not automatically team partners.

## Weekly schedule times

- NRRS — Tuesday, 7:30 PM ET
- UARL D1 / L.L. Bean Cup — Sunday, 8:30 PM ET
- UARL Open — Sunday, 11:30 AM ET
- UARL D2 / NFFF Grand National — Friday, **6:45 PM ET**
  - One-race exception: the Season 6 Daytona 250 opener was postponed to **Saturday, September 12, 2026 at 7:00 PM ET**. The normal Friday 6:45 PM cadence resumes afterward.
- Kmart Auto Parts Series — Monday, 8:30 PM ET
- Sunoco Truck Series — Saturday, 8:00 PM ET
- iRacing Specials — multi-day windows, not a recurring weekly start time

UARL D2 at 6:45 PM ET is locked. Do not revert it to 8:30 PM.

Current confirmed schedule total: 126 season races, excluding off-weeks. Standard weekly iRacing series remain removed; special events remain.

Spelling rules: Silverstone Circuit; APPALACHIAN CHALLENGE; L.L. BEAN CLASH.

## Paint Booth behavior

Preserve:

- random featured paint
- league garages
- driver accordions/browser behavior
- image lightbox
- Scheme ID copy
- external render hosting/lazy loading
- historical paint preservation
- share icon copies only the URL
- no native mobile share sheet
- exact deep links

Current deep-link format:

`/paint-booth/#paint-PAINT-SLUG`

Deep links should reveal the correct hierarchy, load the image, scroll to the exact card, and briefly highlight it.

## Paint Share

The existing `paint.aetherwing.net` site remains separate. Each share route must be a real static folder containing `index.html`, not a manifest-only package. Crawlers read its Open Graph/Twitter metadata; human visitors redirect to the matching main-site Paint Booth deep link.

## Historical content

Do not rewrite archived results/articles merely because current names, relationships, or roles changed. Historical iRacing results can use Nicholas Waggoner; RoRacing uses Wispy. Archived masculine wording does not require a pronoun rewrite.

## Page migration rule

Work one live page at a time. When a page is migrated, use the **current live page/source** as the source of truth. Do not overwrite newer/manual changes with old snapshots.

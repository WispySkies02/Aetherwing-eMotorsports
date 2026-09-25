# Aetherwing eMotorsports · Fresh Site

This is a new Astro frontend built around the supplied Aetherwing grunge background. It reuses the original site's structured content and Netlify Admin storage so race data, standings, driver assignments, team partners, driver portfolios, news, and paints remain editable.

## Run

```bash
npm ci
npm run build
npm test
npm run dev
```

Netlify uses `npm run build` and publishes `dist`. The existing Admin remains at `/admin/`, using the original verified account roles and content API. Do not deploy a ZIP by itself: deploy the extracted project with its Netlify Functions and configuration.

## Public routes

Home, Race Calendar, Programs, Driver Lineup and profiles, Championships, Paint Booth gallery, Partners, Newsroom and articles, History, and event Race Weekend pages. Share-only schedule variants and their generated social-card collection were removed. Every event URL now opens a real page.

The original supplied site header is restored on desktop and mobile. Its page picker groups current routes under Team (Drivers, Paint Booth, Programs), Race (Schedule, Championships, News, History), and Connect (Partners, Discord). Previously published navigation that still points to removed legacy pages falls back to this updated menu.

## Content flow

- Static pages use `src/lib/site-content.mjs`, which applies the published Admin overlay to seed datasets at build time.
- The layout fetches `/api/site-content` after page load and dispatches `aetherwing:content` for the live calendar, lineup, standings, results, portfolios and news listing.
- Paint Booth gallery fetches `/api/paints`, falling back to the bundled paint list if the endpoint is unavailable in local preview.
- New event or story URLs still need the normal site rebuild because Astro generates those routes during the build. The existing Admin publish workflow initiates that rebuild.

## Font and Paint Booth boundary

Edo SZ remains a display font for letters, while Smile Moon supplies its numerals and fallback car numbers. The supplied Smile Moon font is bundled locally at `public/fonts/smile-moon.otf`. Driver League Assignments in Admin can accept a transparent number-art upload or image URL; uploaded artwork replaces the fallback text on driver cards, the home page, and profile headers.

The full scene viewer at `paint.aetherwing.net` is a separate project. This archive includes the main-site gallery and existing paint registry bridge, but not that viewer's frontend.

## Source integrity

Current-season roster numbers and older historical results remain as supplied. Planned next-season assignments have not replaced active data. Existing Netlify authentication/storage code remains in place. The automated Admin tests use mocked accounts and do not publish live content.

The bundled NRRS standings include the R21 North Wilkesboro Chase and non-Chase list supplied by Hailey. The Kmart board includes the driver standings visible in the Sep 21 screenshot, including its Chase cutoff and part-time entries; the screenshot did not show enough of the owner standings to transcribe them.

## Faith identity

The home page includes a deliberately low-key faith statement near the bottom of the page, after the partner network and before the footer. Site Settings can edit the eyebrow, headline, statement, and verse reference. The sitewide footer keeps the same theme visible without making it the primary brand message.

The Drivers, Race Calendar, History, and every Race Weekend page now carry their own small faith signature as well. Each page-specific line is separately editable in Site Settings so the acknowledgment of God can stay present and intentional without overtaking the motorsports content.

## Kmart standings completeness fallback

The bundled Sep. 21, 2026 Kmart Chase bubble contains all 17 full-time drivers, the top-six cutoff, and the three part-time ineligible drivers. If older published Admin data is missing rows or the part-time block, the site now keeps this complete bundled snapshot instead of replacing it with the incomplete live payload. A future complete Admin board can still supersede it.

## v1.1.8 background scope correction

The supplied Aetherwing editorial reference image is now a single full-viewport, fixed-cover background on the public site instead of a 1400px-wide repeating body texture. A dark sitewide veil keeps text and cards readable while preserving the artwork. The private `/admin/` control center intentionally uses a solid dark background with no reference image so forms, labels, tabs, and standings editing remain legible. Championship standings panels were made more opaque for the same reason.


## v1.1.9 interface fixes

- The desktop Admin workspace rail now stays below the sticky Admin header instead of sliding underneath it.
- Published Navigation data is consumed live by the public header, so changing an existing menu destination (including Paint Booth) no longer depends on the Netlify build hook.
- Summer’s End is an actual runtime theme from Sep. 20–24 Eastern: a small seasonal banner, sunset/dusk accent shift, warm page glow, and seasonal page-intro/footer accents. Preview any time with `?season=summer-end`; disable during the window with `?season=off`.


## v1.1.10 UI fixes

- Public header styles are global within the header component so live Navigation rerenders retain the proper dropdown styling instead of falling back to raw browser buttons/links.
- Race Calendar program filters now force high-contrast text in both selected and unselected states.
- Restored the custom Aetherwing page scrollbar and matching horizontal calendar-filter scrollbar.

## v1.1.12 roster / results sync

- The Kmart #29 shared part-time seat is represented by separate Clutch, Eazy, and Matty league assignments so Results can record the actual driver who ran a race while keeping the same #29 car identity.
- Legacy published #29 records that still say `Clutch / Eazy / Matty` are shown as a generic Part-Time Entry until an editor selects the actual driver in Race Results.
- Driver profiles now listen to the same live Driver Portfolios data used by the Partners page, preventing a profile from keeping an older sponsor list after a portfolio is published.
- Charter Boards accept uploaded/pasted number art for unsigned full-time charters and for each flexible Open Charter number identity. That artwork is used on the public Driver Lineup.
- The Driver Lineup includes affiliated StarClutch Racing Kmart and Sunoco rides alongside Aetherwing entries, with partner-team labeling kept distinct from Aetherwing-owned seats.


## Automatic seasonal themes

The public site now includes a permanent Eastern-Time seasonal controller at `public/seasonal-theme.js`. It automatically selects the active visual skin from the Aetherwing calendar without requiring a new deploy at each transition. The schedule covers clean winter, Valentine teaser/full Valentine, late winter, spring, St. Patrick’s Day, Easter week, Memorial Day weekend, summer, Independence Day, Summer’s End, Halloween teaser/full/Halloween week, fall through Thanksgiving, Christmas teaser/full/Christmas week, calm winter, and New Year. The 2026 Summer’s End window remains the special Sep. 20–24 launch window; later years use the established Aug. 25–Sep. 7 Summer’s End window. Holiday-dependent Easter, Memorial Day, and Thanksgiving windows are calculated for the current year.

For private public-site testing, append `?season=<theme-id>` (for example `?season=halloween`) or `?season=off`. These URL previews do not change the live calendar for other visitors.

Admin also includes tab **22 Theme Preview**. Its buttons restyle only the current Admin page in real time. Theme Preview never publishes, never writes to local storage, and resets to Default Aetherwing on reload.

## v1.1.14 build fix

Astro public seasonal-theme script reference now uses `is:inline` so Netlify/Vite leaves `/public/seasonal-theme.js` unbundled as intended.


## Seasonal experience engine (v1.1.15)

Seasonal themes now change the public site's UI language and ambient atmosphere, not only its color palette. The Eastern-Time date controller automatically activates the correct theme, while decorative motion stays behind all content and honors `prefers-reduced-motion`. Theme Preview in Admin mirrors both the UI treatment and ambient motion without publishing or persisting the preview. The Theme Preview panel also explains each theme's calendar window, motion treatment, and UI treatment in real time.

## Admin seasonal preview visibility (v1.1.16)

Theme Preview now includes a dedicated live UI + motion stage and stronger theme-specific component treatments so previews demonstrate shapes, panel textures, controls, borders, scrollbar styling, and ambient effects rather than only palette/glow changes. The full Admin page still adopts the selected preview skin. If the device requests Reduced Motion, Admin respects it by default and offers a temporary "Play Motion Anyway" control for previewing animations; the override is not persisted or published.

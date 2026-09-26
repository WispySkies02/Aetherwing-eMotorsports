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
## Christmas Week lights

The Dec 18–25 Christmas Week theme now adds animated multicolor string lights around the viewport edges in addition to snowfall and holiday sparkle. The Admin Theme Preview renders the same light frame for Christmas Week, including inside the live experience preview. Side strands collapse on narrow mobile screens to keep the UI readable.



## Seasonal calendar engine (v1.1.19)

The public site now carries the complete January-to-December seasonal system in code and selects it automatically in America/New_York time. Fixed-date windows recur every year; Palm Sunday through Easter Sunday, Good Friday, Easter Sunday, Memorial Day weekend, Thanksgiving, and the post-Thanksgiving Christmas teaser are calculated from the current year so the site can keep running without annual date edits. Summer’s End is Sep 20–24 every year, followed by the Halloween teaser Sep 25–30.

One-day faith/gratitude overlays are layered over the normal season on New Year’s Day, Palm Sunday, Good Friday, Easter Sunday, Thanksgiving, Christmas Eve, and Christmas Day. Palm Sunday adds edge-of-glass palm shadows; Good Friday intentionally pauses the Easter motion for a crown-of-thorns treatment; Easter Sunday uses an empty-tomb sunrise; Christmas keeps a Bethlehem-at-night scene and Star of Bethlehem while the one-day banners surface the matching Scripture reference.

Admin → Theme Preview is ordered January through December, gives every theme a static icon, includes a miniature light strand + tree for Christmas Week, and includes a separate Faith & Gratitude Moments preview row. The preview remains session-only: it never publishes, never writes to local storage, and a reload resets it. Moving-holiday previews calculate the next real occurrence automatically.

## v1.1.20 seasonal overlay polish

- One-day faith/gratitude observances now add visible decorative motifs to the actual public seasonal layer and to Admin Theme Preview, not only color changes and preview buttons.
- Good Friday keeps motion quiet while displaying a restrained crown-of-thorns silhouette.
- Palm Sunday uses palm branches; Good Friday uses crown-of-thorns line art; Easter Sunday uses an empty tomb and sunrise; Thanksgiving uses wheat and warm harvest light; Christmas Eve/Day intensify the Bethlehem skyline and star; New Year’s Day gets a gratitude-light treatment.
- Christmas Week now includes a decorative lit Christmas tree in the seasonal layer and Admin preview.
- Christmas light strands now render as visibly powered bulbs with stronger colored halos and staggered twinkling/chasing brightness instead of dim static dots.


## v1.1.21 · Seasonal background art + home faith spacing

- Tightens the home-page faith section so it reads as a major editorial section instead of a nearly empty full-screen hero.
- Adds theme-specific full-page background art treatments for Halloween, Fall, Christmas/Winter, Valentine, Spring, Easter, New Year, Independence Day, and supporting transitional themes.
- Uses the same background-art language inside Admin Theme Preview, so previewing a theme now includes its backdrop as well as UI, motion, icons, and observance overlays.
- Keeps content readability protected with the existing dark overlay and opaque data panels.


## v1.1.22 · Event-specific entry lists

Race Weekend pages can now show who is actually expected to compete instead of always mirroring the full league roster. In Admin → Calendar, each race has an Event entry list mode. Auto uses the published race result after the race and the current league roster before a result exists. Custom lets an editor select the exact roster drivers for that event, mark an entry note/status, fill the list from the league roster, or copy the actual starters from an already-published result. Driver names and car numbers remain roster-linked.


Admin Theme Preview v1.1.23 keeps the full visual theme picker and restores a live embedded public-page preview that updates as themes or pages are selected.


## Faith-forward seasonal moments

The automatic Eastern-Time theme controller now treats Palm Sunday through Easter Sunday as Holy Week / Easter and includes richer faith-specific visual storytelling: palm shadows on Palm Sunday, a restrained crown-of-thorns treatment on Good Friday, an empty-tomb sunrise on Easter Sunday, wheat and warm harvest light on Thanksgiving, and a Bethlehem skyline / Star of Bethlehem treatment through the Christmas season. These overlays remain decorative and non-interactive so site content stays readable.

Admin → Theme Preview includes all of these timed observances, plus a verse banner at the top whenever a faith-focused theme or observance is selected. Preview choices remain temporary and never publish site changes.


## Seasonal preview background behavior

Theme Preview now mirrors the public backdrop rules exactly. Transitional skins (Summer’s End, Halloween teaser, Christmas teaser, Valentine teaser, and late winter) retain the Aetherwing editorial art underneath their tint. Full seasonal takeovers replace that art with their own generated backdrop, including Halloween, fall, Christmas, winter, Valentine, spring, Easter, New Year, and Independence Day. Major public hero surfaces also inherit the active theme backdrop so the iframe preview does not misleadingly show the default image over a full takeover.


## Seasonal backdrop layering (v1.1.26)

Seasonal background art now lives on the fixed viewport backdrop and the animated atmosphere is a pointer-transparent front-glass layer. Large page surfaces use translucent readability veils instead of repainting an opaque copy of the backdrop, so full seasonal takeovers remain visible on the real site and in Theme Preview. The mobile home hero also no longer reserves a large empty viewport-height block above its copy.

## Mobile seasonal banner resilience (v1.1.27)

The public seasonal/observance strip now reflows into a compact two-line plaque on phones. The theme/observance name occupies the first line and the full message or Scripture reference wraps below it instead of being clipped with an ellipsis. Desktop keeps the existing single-row treatment.

## v1.1.28 mobile seasonal banner

On phones, the seasonal banner is now a slim two-line ribbon: the theme/observance name occupies the first line and the message or Scripture reference occupies the second line. Padding, icon size, type size, and row gap were reduced so the banner does not consume valuable viewport height.

## v1.1.29 results + standings workflow

- Standings Admin now accepts pasted Discord/Sheets tables or CSV/TSV uploads, previews driver matches, and can replace the current board after review.
- Boards can enable `autoPoints`; newly published results then advance matching standings rows using each driver's `racePoints`, recalculate order/movement/gaps, and remember the last applied result to avoid double-counting.
- Race Results now allow external/unrostered league competitors while keeping Aetherwing/partner roster assignments selectable and synchronized.
- Latest Result is automatic: the newest completed result across all programs is featured.
- NRRS Race 21 is corrected to North Wilkesboro Speedway, Sep. 22, 2026. The corrected standings lead is Will (2,195), with Hailey P6 on 2,087 points, 108 back.
- The closed UARL D2 program remains absent from active schedules/filters while its Sep. 12 Daytona result remains in History.
- Driver profile identity/stat data and partner portfolios listen to published Admin data; team-partner logo file uploads are supported too.


## v1.1.30 · September 25 review closeout

- Rechecked the Sep. 22 NRRS North Wilkesboro Race 21 result and corrected Chase standings. Hailey remains P6 with 2,087 points; the corrected official gap is 108 points to leader Will, not the earlier 110-point figure.
- Race Calendar completion is now result-aware: publishing a result immediately marks that event completed and rolls the shared Home/Schedule next-event UI forward, even if the normal race-time window has not yet expired.
- Results Admin now automatically calculates NRRS and UARL D1 stage points and total race points from recorded finish/stage positions. UARL D1 supports a separate bonus/adjustment field and championship-eligibility toggle so stage awards cannot silently disappear.
- Standings retains pasted-table/CSV/TSV import alongside manual editing and automatic advancement from published race points.
- Added regression guards for roster identity/usernames, driver portfolios, partner logo uploads, current iRacing figures/identity, 27-win History count, UARL D1 8:30 PM ET schedule, latest-result automation, and closed UARL D2 handling.
- Faith observance banner snippets now use the reviewed KJV wording while keeping the compact mobile banner.

### v1.1.30 public partner live-sync addendum
- Team-partner edits now re-render live on both the Partners page and homepage partner strip after Admin publish, including uploaded/data-image logo sources and external HTTPS destinations.
- Validation now protects the current-season roster from next-season #42/#46/#56 leakage and locks #62 PT / #82 Development as two identities of one shared open charter with no permanent driver assignment.

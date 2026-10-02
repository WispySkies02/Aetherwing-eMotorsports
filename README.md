## v2.0.10 — Season 4 Story Update + Team Wire Fact Grid Fix
- Updates the September 14 SCR feature with Hailey Bell's #28, PetSmart sponsorship, Palmetto Gaming SCR/Aetherwing partnership, and Aetherwing's planned #32 / #42 / #46 NRRS charters.
- Adds a visual Season 4 program-comparison module so the SCR #28 and Aetherwing NRRS program read as two connected but separate operations.
- Fixes narrow-screen quick-fact cards so values such as CONTINUES or charter strings do not split awkwardly, and odd metric counts no longer leave a fake empty tile.
- Normalizes the September 15 Darlington story from Wispy to Hailey Bell so the public Team Wire identity stays consistent after the September 14 SCR announcement.
- Migrates the known stale v2.0.9 SCR/Darlington records from older published Admin overlays while leaving later edited versions alone.

## v2.0.9 — Team Wire Feature Stories + Mobile Article Fix
- Adds the September 14 Team Wire feature announcing Hailey Bell as a StarClutch Racing driver for NRRS Season 4, while making clear that Aetherwing remains in NRRS and Bell plans to step back from full-time competition after Season 4 to focus more heavily on running and building Aetherwing eMotorsports.
- Rebuilds Team Wire article pages as visual motorsports features with headline stat panels, quick-fact metrics, tags, timelines, numbered story sections, pull quotes, and closing callouts when that data exists.
- Fixes the shared mobile article template so long headlines such as Martinsville, North Wilkesboro, and Indianapolis cannot widen the viewport or create horizontal page scrolling.
- Tightens mobile headline and summary sizing, adds hard wrapping safeguards, and keeps news tiles mobile-safe as well.
- Team Wire Admin now exposes story timelines; the new SCR announcement is merged into older published News datasets so the route is not lost during the first deployment from v2.0.8.

## v2.0.7 — Bundled Driver Art + Anniversary Paint Booth Fix
- Bundles the v2.0.6 compact interior-page Anniversary badge fix with the remaining requested Anniversary Week work.
- Adds a dedicated lightweight public `/api/driver-art` feed so uploaded driver number artwork and Driver Directory signature/wordmark logos can hydrate the Drivers grid independently of the larger site-content payload.
- Driver cards merge published number art/signature art over the normal roster data and re-render as soon as that artwork feed arrives, fixing desktop cards that stayed on giant text fallbacks.
- Keeps the ALL-tab single-art shuffle-bag behavior and league-specific assignment behavior intact.
- Extends the 2015 debut-identity Anniversary Week treatment across the main-site Paint Booth, including the throwback Aetherwing logo in the All Paints filter, blue/teal debut-era panels, filters, search, featured scheme, paint cards, and scheme-ID controls.
- Anniversary timing remains every Oct. 1–7 ET with automatic handoff back to the normal seasonal calendar on Oct. 8.
- Team → Paint Booth now routes directly to `https://paint.aetherwing.net/`; legacy published `/paint-booth/` navigation values are migrated at render time, while future Admin HTTPS destinations remain supported.

## v1.2.0 — Aetherwing Team-Site Redesign
- Rebuilds the public-facing design around a major NASCAR team-site structure while keeping Aetherwing's own identity and all existing Admin/data workflows.
- Aetherwing's red/white/silver logo now drives the interface: red is the primary team/action color, graphite/silver form the UI shell, Aether Blue is reserved for telemetry/data, and Feather Gold remains a championship/faith accent.
- New team header includes a compact race-control utility bar, a larger logo presentation, cleaner motorsports navigation, and dedicated Schedule access.
- Homepage adds a full program-logo rail, stronger team-brand hero, redesigned championship/driver/news/partner surfaces, and keeps the live Race Calendar/data hooks intact.
- Schedule filters now use the actual league/program logos for NRRS, Kmart, Sunoco, UARL D1, UARL Open, and iRacing, with an Aetherwing all-programs tile.
- Driver Lineup, Championship Battles, and Paint Booth league filters now use the same logo-led selector system for a consistent public-site experience.
- Programs, partner cards, profiles, news, history, mission/handbook surfaces, and race-control panels share one angled broadcast/team-site design language.
- Closed UARL D2 remains historical-only in active competition data; its logo is used only where historical Paint Booth entries require it.

## v1.1.51 — Resilient number uploads + driver removal cascade
- Driver number file uploads no longer fail at a post-optimization complexity ceiling; the browser keeps downscaling until the artwork is publishable while preserving aspect ratio/transparency.
- Removing a Driver Directory profile and publishing now cascades to that person's current Driver League Assignments, so the public Drivers grid/profile disappears too.
- Custom upcoming schedule-entry references tied to removed assignments are cleaned up; historical race results and wins are intentionally preserved.
- A loaded public driver profile redirects back to /drivers/ immediately if live Admin data says that profile was removed.

## v1.1.50 — Driver Directory signature upload robustness
- Complex signature uploads now downscale dimensions progressively instead of failing after quality-only compression.
- Added inline per-field signature upload status/error feedback in Driver Directory, especially useful on mobile.
- Successful uploads still convert to an optimized WebP data URL and immediately become the preview/source used by the public Drivers page after publish.

## v1.1.49 — Driver number art shuffle bag
- ALL-tab random number art now considers every configured number-image source, including older numberImage-only assignments.
- Multi-number drivers use a session shuffle bag across reloads: every available number artwork is shown once in randomized order before a new cycle begins, with immediate repeats avoided between cycles.
- Missing numbers with no image remain in the program badges only and are never promoted to giant art-stage fallback text when another uploaded/configured image exists.

## v1.1.48 — Random single-number art on ALL driver cards
- ALL-tab driver cards now show one number visual at a time, matching the clean Hailey-card treatment.
- Drivers with multiple different numbers randomly select one uploaded number image at page load/reload. The random pool only includes Admin-uploaded artwork (including legacy uploaded data images), never missing-number text or URL-only artwork.
- Drivers with only one uploaded number image always show that image; missing #42 / #46 / #27 art no longer creates giant dual-number text beside Kmart #29.
- Program badges still list every current program and car number, so roster information is unchanged.
- League-specific tabs still show that assignment's own number art or normal single-number fallback.

## v1.1.47 — public number-art delivery fix
- Uploaded driver number files now take precedence over pasted URLs on the public site.
- Kmart #29 is treated as one shared number-art identity across Clutch, Eazy, and Matty.
- ALL-tab dual-number cards can render actual uploaded number art per ride, with text fallback only when art is absent.
- Shared #29 upload/URL changes synchronize across all three Kmart #29 assignments in Admin.
- The homepage/roster-derived number art also prefers the uploaded copy.

## v1.1.46 — Number Artwork Publish Fallback
- Driver number file uploads are retained as a private/public data fallback even if an external URL is later pasted into the same Admin field.
- The Drivers page automatically retries the stored upload if the primary external URL fails to render, before falling back to text.
- Admin preview now mirrors that behavior and explains that upload and URL are alternate/primary+fallback sources rather than two required fields.
- Existing v1.1.45 card-boundary and dual-number fixes are preserved.

## v1.1.45 — Driver Card Art Boundary Fix
- Rebuilt desktop driver cards as two real layout rows: a bounded artwork stage followed by the information panel, so number art can no longer sit behind the panel.
- Single-number fitting now measures the actual padded content box before sizing visible artwork.
- Dual-number cards use container-width-relative sizing so Clutch, Eazy, and Will stay fully inside the available card width.
- Preserves the existing card design, normalized #92/#34 corrections, Hailey BELL signature placement, Matty handwritten signature treatment, and 220px mobile art stage.
- Mobile rendered screenshots were attempted at 320/375/430 but the container Chromium process cannot complete even an about:blank headless render; do not treat those visual widths as verified until deployed or tested in a working browser environment.

## v1.1.44 — Drivers card art normalization
- Normalized single-number driver artwork by visible bounds with small targeted corrections for the current #32 / #52 / #43 / #92 / #34 set.
- Added a dedicated dual-number layout for Clutch, Eazy, and Will so both numbers remain fully visible on desktop and mobile.
- Preserved Hailey and Matty signature artwork while giving each signature a clearer pocket above the info divider.
- Kept the existing card style, grid, typography, badges, and profile-link arrangement intact.

## v1.1.43 — Current Programs + Private Roblox Asset Tracking
- Restores Mission & Values and Team Handbook as current data-driven routes.
- Active counters are 4 Aetherwing Programs, 2 Alliance Series, and 6 Competition Relationships.
- UARL D2 is historical-only; current UARL D1, NRRS, iRacing, and leadership identities are normalized against stale published overlays.
- Paint Admin adds private Roblox asset/moderation tracking fields; those fields are stripped from the public Paint Booth API.
- Homepage Race Calendar rollover logic was verified: published results or elapsed event windows immediately advance the next event.

## v1.1.42 — Visible-Area Number Normalization
- Driver number artwork now fits by visible artwork area after transparent padding is trimmed, reducing size differences between tall/narrow and wide number logos.
- Mobile number stage is shorter and uses a calmer target scale while preserving the separate opaque info panel.
- Desktop poster design and signature overlap remain intact.

## v1.1.41 — Normalized Driver Number Stages
- Desktop driver cards now fit all visible number artwork to one consistent height/centerline instead of sizing primarily by PNG width.
- Existing transparent number art is tightened client-side when possible; future Admin number uploads trim transparent padding before saving.
- Mobile cards now give number art a dedicated fixed stage above an opaque information panel, so numbers never sit behind the translucent nameplate.
- Mobile multi-program chips use compact league labels while desktop keeps the full series names.

## v1.1.40 — One Driver Card in ALL
- Drivers page ALL filter now groups league assignments by actual person, so multi-program drivers appear once.
- The combined card shows every current program and car number as compact roster chips.
- Individual league filters remain assignment-specific with the correct league number/artwork.

## v1.1.39 — Prominent Driver Signature Treatment
- Driver signatures now float prominently above the roster card nameplate instead of sitting as a small logo under the name.
- Signature uploads trim transparent whitespace before optimization, fixing wide/padded wordmarks that could appear tiny or invisible.
- Driver Directory schema merging keeps the optional signature field available even when older published profile records predate the feature.

## v1.1.38 — Driver Signature Logos
- Added optional Driver Directory signature logo artwork with Admin upload/URL support.
- Public Drivers page roster cards now display a driver's signature logo when one exists.
- Driver profile hero can also surface the same signature branding asset.

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


## v1.1.31 · Standings PNG export

Admin → Standings now includes **Generate standings PNG** for the currently selected standings board. The exporter uses the current in-editor draft (including unsaved manual corrections), renders the full standings field into a branded high-resolution image, preserves Chase/cutoff context and highlighted rows, includes Kmart shared part-time standings when present, and provides an in-admin preview with **Save PNG** and **Open full size** actions. On browsers that support the File System Access API, Save PNG opens a native file picker; other browsers fall back to a normal PNG download.


## v1.1.32 Netlify validation root fix

The custom validation script now resolves and switches to the repository root from its own file location before checking required assets. This prevents Netlify working-directory differences from falsely reporting `src/pages/index.astro` (or other required files) as missing.

## v1.1.33 · League-branded standings exports

- Standings PNGs are now branded for the selected league/series rather than Aetherwing.
- Current export titles include NRRS Town Fair Tire Cup, NASCAR Kmart Auto Parts, NASCAR Sunoco Truck, and UARL L.L. Bean/Bangor Savings Bank identities.
- NRRS and Kmart manufacturer mappings are available in the standings export. The exporter prefers each driver's most recent result entry, so part-time drivers can change manufacturer automatically when they race a different entry.
- Chase highlighting is now controlled by each standings board's `chaseActive` flag. Only Chase drivers are highlighted, and only after that league has actually entered its Chase/playoff period. Kmart is currently marked as Chase Bubble (not active), while NRRS and Sunoco are active.
- Sunoco manufacturer roster mapping remains intentionally open for a later update.
## v1.1.34 · Manufacturer icon standings exports

- Standings PNG exports now render manufacturer logos instead of manufacturer text.
- Chevrolet, Ford, Toyota, Cadillac, and Honda use the approved supplied icon assets.
- Dodge is league-specific: Kmart uses the modern DODGE wordmark; Sunoco uses the RAM wordmark.
- Manufacturer identity still follows the driver’s latest result when available, preserving multi-team/PT cases such as Matty.
- Chase highlighting remains the only driver highlight and appears only when the selected league has `chaseActive: true`.



## v1.1.35 · Kmart full-standings export recovery

- Fixes a legacy live-admin override where the Kmart standings dataset can contain only StarClutch Racing rows even though the bundled Kmart points board contains the full field.
- When that specific legacy SCR-only partial board is detected, Admin rehydrates the missing Kmart full-time rows from the bundled standings baseline before rendering or exporting the standings graphic.
- Any current SCR-row values in the live override are preserved, then the repaired full field is re-ranked and gaps are recalculated.
- The recovery is intentionally narrow: it only triggers for an incomplete Kmart board made entirely of SCR car numbers (#15/#24/#29/#34), so normal standings imports or deliberate edits are not broadly overridden.
- Manufacturer icons and the Chase-only highlighting rule remain unchanged.

## v1.1.37 · Sunoco dual points + championship filters

- Sunoco now carries the full 17-driver active roster with the mapped public display names and RAM/Chevrolet/Ford manufacturer identities supplied for the series. Drivers whose current regular-season total has not yet been imported are shown as pending rather than being assigned a fake zero-point total.
- Admin → Standings gives Sunoco two independent CSV/TSV paste/upload workflows: **Regular Points** and **Chase-only Points**. Importing one no longer overwrites the other, and Chase membership on the regular table syncs from the Chase-only list once that list exists.
- The Sunoco generated standings PNG is a dual-panel graphic with **Regular Points** and **Chase Points** side by side. Manufacturer icons remain enabled and the PNG still uses Chase-only driver highlighting rather than Aetherwing/SCR team highlighting.
- Kmart standings PNG metadata is now derived from the actual Kmart schedule, so the header shows current round information (for the bundled board: Round 7 of 23 at Rockingham) instead of allowing a legacy `SCR Drivers` label to leak into the export.
- The public Championships page now has a sticky **All / NRRS / Kmart / Sunoco / UARL** league filter so visitors can open one points battle at a time. Sunoco also exposes its separate Chase-only table on the public page after those points are published.
- Older live Sunoco standings payloads are expanded against the bundled 17-driver roster at both the public-content and Admin migration layers, preventing the old partial four-row board from replacing the full roster after a deploy.

## v2.0.1 — Anniversary Week Retro Race Control

- Adds an automatic Anniversary Week retro/broadcast UI overlay on top of the v2.0 team-site redesign.
- Overlay uses Aetherwing red, graphite/steel, white/silver chrome, and blue telemetry accents so the main team logo remains visually native to the interface.
- Anniversary presentation suppresses seasonal atmosphere effects while active instead of stacking Halloween effects over the retro package.
- Anniversary banner reads `AETHERWING ANNIVERSARY WEEK · RETRO RACE CONTROL · EST. 2015`.
- Automatic cutoff is exactly `2026-10-04 12:00 AM America/New_York` (`2026-10-04T04:00:00Z`).
- At cutoff, the anniversary data attribute is removed and the existing October seasonal controller immediately exposes the normal `halloween` theme without a redeploy.
- Private QA overrides: `?anniversary=retro` forces the overlay on; `?anniversary=off` forces it off.

## v2.0.2 — Revamped Seasonal Themes + Admin Preview Parity

- Increased seasonal atmosphere density across the calendar while keeping all effects pointer-safe and behind content.
- Halloween / Halloween Week now use stronger violet-orange environmental lighting, denser fog, brighter embers, and more visible bats.
- Christmas / Christmas Week now use richer Bethlehem night lighting, fuller snow, brighter live lights, stronger evergreen/gold UI, and a more visible tree/star treatment.
- Valentine, Spring, Fall, Summer, Winter, Easter, New Year, Independence Day, St. Patrick's Day, Memorial Day, and transitional teaser themes all receive stronger unique backdrops and panel treatments.
- Admin Theme Preview metadata, stage art, picker tiles, and effect density now mirror the revamped public themes.
- Public-page previews launched from Admin force `anniversary=off` so seasonal themes remain previewable during the temporary Anniversary Retro overlay.
- Existing automatic Eastern Time calendar, faith observances, Anniversary Retro cutoff, and Halloween Oct. 4 handoff are preserved.


## v2.0.3 — Unmistakable Anniversary Retro Broadcast
- Anniversary Retro now uses an intentionally obvious 2003–2007 motorsports broadcast treatment instead of a subtle dark recolor.
- Added a fixed Aetherwing Race Network LIVE bug and bottom race-control scorebar.
- Added stronger CRT scanlines, beveled chrome controls, timing-screen panels, metallic section headers, lower-third page framing, and backlit program filters.
- The overlay still expires automatically at 12:00 AM ET on Oct. 4, 2026 and hands back to the normal Halloween theme.

## v2.0.4 — 2015 Anniversary Identity + Aetherwing Typography
- Replaces the generic 2000s broadcast Anniversary skin with a true 2015 team-identity throwback.
- Anniversary Week now recurs every year from October 1 through October 7 in America/New_York and automatically returns to the normal seasonal calendar at 12:00 AM ET on October 8.
- Uses the transparent `AETHERWING eMOTORSPORTS | EST. 2015` throwback mark throughout the public site while the anniversary overlay is active.
- Anniversary styling now uses the debut blue/teal palette, simpler mid-2010s team-site surfaces, and BellSouth Racing heritage references instead of generic CRT chrome.
- Adds an Anniversary Week picker to Admin Theme Preview; the embedded public preview can force the throwback on at any time for QA.
- Normal Aetherwing typography now uses the OFL-licensed Tomorrow family for body, interface, navigation, and display hierarchy.
- Permanent Marker provides the handwritten driver-identity voice; Share Tech Mono remains the timing/data voice. No restricted font binaries are bundled.
- No Giulia font files are embedded or redistributed.


## v2.0.5 — Header Typography Rollback
- Restored Saira Condensed for normal-site headings, navigation, buttons, and major UI labels.
- Preserved Tomorrow for body copy and Permanent Marker for driver-identity text.
- Preserved the recurring Oct. 1–7 Anniversary Week throwback identity and Admin preview behavior.

# Aetherwing Mobile 2.0 — consolidated QA

## Scope
- **Desktop (wider than 980px):** no visual redesign. The existing public header, pages and private Admin are the baseline.
- **Mobile (980px and below):** red/black/white/silver Aetherwing app shell with fixed Home / Racing / Drivers / News / More navigation, route-aware header, touch-friendly page layouts and navigation sheets.
- **Private Admin:** mobile Home / Racing / Team / Media / More workspace navigation and dedicated Save Draft / Publish dock. Underlying authenticated editing, Netlify operations and confirmation dialogs remain unchanged.
- **Separate Paint Booth:** remains its own application; the public site retains the external link.

## Automated checks
Run `npm ci && npm test && npm run build` with Node 24. The PR workflow does so.
`scripts/test-mobile-ui.mjs` checks public drawer open/close, Escape handling, live CMS links, unsafe URL rejection, Admin dataset selection, and delegation to the original Save and Publish handlers.
Static checks never claim to have tested production publishing.

## One comprehensive iPhone QA pass (deployment preview)
- [ ] Home: logo, race-week hero, team program rail, calendar, championship battle, lineup, results, news, partners, faith footer.
- [ ] Bottom tabs: Home, Racing, Drivers, News, More; verify selected state and browser Back.
- [ ] Racing sheet: open / close by overlay and ×; links to Schedule, Championships, History and Team Wire; calendar filters and event detail deep links.
- [ ] Drivers: roster filters, card image rendering, individual profiles (including Hailey's custom layout and pride details), back navigation.
- [ ] News: feed, featured article, long-form editorial layout, media/metrics, readable images.
- [ ] More: Programs, specific program detail pages, Partners, Mission & Values, Team Handbook, Paint Booth external link, private Admin.
- [ ] Public content feed: latest roster, dates and standings still populate and update.
- [ ] Admin signed out: workspace and app navigation stay hidden; authentication gate shows.
- [ ] Admin signed in: mobile group sheets reach every existing dataset and paint/theme module.
- [ ] Edit a standings value, navigate away, decline unsaved-changes warning: editor should remain; save a draft, then publish.
- [ ] Mobile Save Draft and Publish dock use the real existing handlers; verification receipt matches the original Admin message. Don't mistake a private draft for public success.
- [ ] Import standings/results CSV, check preview; export the standings PNG; ensure these tools don't introduce false dirty prompts.
- [ ] Theme preview, race schedule tools, 3D Paint module, photo upload/publish actions remain accessible.
- [ ] iPhone Safari landscape, keyboard visible, 320px width, 375px width, larger phones and 768–980px tablet widths.
- [ ] iOS home-indicator safe area, bottom sheet focus and Escape where a keyboard is attached, visual overflow.
- [ ] Seasonal overlays and Aetherwing full-takeover themes coexist with navigation.
- [ ] Reduced Motion enabled; focus indicators and touch targets remain usable.

## Desktop regression pass
- [ ] Homepage, all interior routes and original desktop header look unchanged.
- [ ] Desktop Admin sidebar, all editors, Netlify publishing and Paint Operations behave as before.
- [ ] No accidental desktop body padding, bottom navigation, color changes or mobile drawer visibility.

## Caveats
This PR is **unmerged**. Successful source/static/DOM checks and a passing Astro build do **not** replace a real iPhone Safari and authenticated Netlify publish test. No production publishing was performed by these changes.

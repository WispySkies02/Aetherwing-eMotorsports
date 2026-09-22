# Aetherwing Admin Control Center

The canonical control center is **https://aetherwing.net/admin/**. The convenience URL **https://aetherwing.net/admin/login** redirects there and automatically opens the sign-in dialog.

One login at **https://aetherwing.net/admin/** now opens a direct-tab control center. Routine content is split into dedicated tabs for Calendar, Race Results, Wins, Standings, Milestones, Driver Assignments, Driver Directory, Driver Profiles, Charters, iRacing Roster, League Details, Leadership, Partners, Site Settings, Navigation, Page Content, Livery Brands, Team Wire, Paint Feature, Paint Editor, and Paint Library. The separate Paint Booth is public-only.

Layout code, security, design-system tokens, technical track-location aliases, and build/deploy configuration remain protected code-level infrastructure. Visible navigation, identity text/images, page copy/links/images, records, and routine site data are Admin-managed.

## v0.4.43 runtime requirement

The admin backend now pins **Node 24** and **esbuild** for Netlify Functions and initializes Netlify Blobs inside each request. This specifically addresses the shared 502 startup failure that affected Schedule, Roster, and Paint Operations together. If the deployed project has an old `AWS_LAMBDA_JS_RUNTIME` override in Netlify, remove it or set it to `nodejs24.x`, then redeploy; UI-level function-runtime overrides take precedence over the repository Node setting.

## First deployment

1. Deploy this full main-site SOURCE package to the existing `aetherwing.net` Netlify project using its Git-connected build or Netlify CLI with Functions. Build command: `npm run build`; publish directory: `dist`. Do not upload just the static `dist` folder by drag-and-drop: that omits the server functions.
2. Enable Netlify Identity for the main-site project and set registration to **Invite only**.
3. Add or invite the administrator account and assign the **admin** role. This enables all main-site content tabs and Paint Operations. The optional `paint-admin` role grants Paint Operations only. Identity accounts belong to a Netlify project: an account created on the old Paint Booth project does not automatically exist on the main project. Invite it on the main project if needed; no password is included in these ZIPs.
4. Sign out and back in after changing roles so the refreshed session contains the role.
5. Create a Build hook for the main project's production branch. Store its full HTTPS URL as the private Netlify environment variable **AETHERWING_BUILD_HOOK**, available to Functions. Never paste it into frontend code or a public repository.
6. Redeploy the main project so its functions receive that environment variable. On Netlify builds the site automatically loads published content from `https://aetherwing.net/api/site-content`. Optionally set **AETHERWING_CONTENT_URL** to that same URL in the Builds scope. The very first deployment uses bundled content when that endpoint is not yet present (404).
7. Deploy the matching v44 Paint Booth SOURCE package to `paint.aetherwing.net` using a Functions-capable deployment. Its publish directory is `.`; it has no build dependency. Keep the full project, including `netlify/functions/` and `netlify.toml`.
8. Open the main `/admin/`, sign in, save a paint draft, refresh, publish it, and check the public Booth. Then save a harmless main-site section draft and publish it. Confirm the queued Netlify build succeeds and the change appears publicly. Archive/revert the test entries afterward.

The main site must deploy before the Paint Booth package so `/api/paints` is available when the Booth starts using it.

## What you can edit

- Schedule: add/edit/remove calendar entries, date/time, league, track, status, rounds, off-weeks, and special tags. League IDs and their existing colors are preserved.
- Results & Milestones: latest race result and recap/headline, verified win archive, standings snapshots and rows, and milestones.
- Paint Booth: add/edit paints, save drafts, publish, feature an upcoming race scheme, clear its feature, archive/restore added paints. The 35 original paints remain protected in the bundled collection.
- Roster: driver cards, program entries, profile pages/stats, charter allocations, and iRacing factory entries. These are linked sections: keep profile slugs and driver IDs consistent when changing them.
- Team Wire: stories, sections/paragraphs, metadata, quotes, metrics, and the featured story used by the homepage. Choose exactly one featured story.
- Site shell: identity/settings, global navigation links and groups, Paint Booth livery brands, plus scanned public-page text, links, and images.

## v0.4.60 page control and number artwork

- In **Driver League Assignments**, paste a transparent PNG/WebP/SVG URL into **Number image URL**. Leave it empty to keep the normal `#00` text treatment.
- Race Results already store the assignment ID selected by the league-restricted driver picker, so their number artwork follows automatically.
- For a historical **Win** or **Milestone**, choose **Linked driver assignment** once. That record will then reuse any future number-image change made on the assignment.
- The Drivers page, homepage/latest-result cards, Wins & History result graphic, latest victories, win archive, and milestones all support the linked artwork.
- In **Page Content**, enter a public route such as `/mission-values/`, choose **Scan page**, edit the replacement values, and publish. The scanner registers visible text, links, and images while leaving page structure and code protected.

## Saving versus publishing

Main-site editors work on an entire section, not just the selected row. You can edit several entries before publishing. Add/remove nested rows with their buttons; simple text lists use one item per line. **Publish current changes** validates, saves, and publishes the open section in one action, so a schedule shift no longer needs a separate Save Draft click first. **Save private draft** remains available when work should stay private. The Overview can publish every saved draft in one revision and queue one rebuild. Publication reports public-data storage and rebuild queuing as separate states. A failed/missing build hook leaves the newly published data safe and the last successful static pages online; use **Publish site / retry build** after fixing the hook. Paint publications are read directly and do not need a rebuild.

Main-site content uses the `aetherwing-site-content` Blobs store/key `content.json`. Paints use `aetherwing-paint-ops`/`registry.json`. Drafts and history are private; public APIs return published content only. Conditional writes reject stale concurrent saves. Export backup downloads the private main-site content registry.

## Preserve old Paint Operations entries

Before disabling the old Booth login, export `registry.json` from the old Paint Booth project's `aetherwing-paint-ops` Blobs store. Import it into the same store/key on the main project if you have added paints/features/drafts to preserve. The ZIP migration does **not** automatically transfer project-scoped Blobs or Identity accounts. After verifying migration and a main-site login/save, disable Identity on the old Booth project.

## Checks completed and remaining

The source build, baseline fact guards, all 11 editable content sections, mock Identity/storage authorization and persistence, DOM form interactions, recovery-dialog guard, public Booth reads/shares, and an actual rebuild with fixture edits were tested locally. Fixtures were removed and the baseline rebuilt. Live Identity account setup and a production Blobs save still require the deployed smoke test above; the original 502 cannot be declared resolved in production without that test. A local native function-packager check encountered Windows sandbox access restrictions, so function packaging must also be confirmed in the Netlify deployment log.

Official references: [Build hooks](https://docs.netlify.com/build/configure-builds/build-hooks/), [Environment variable scopes](https://docs.netlify.com/build/environment-variables/overview/), [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).


## v0.4.46 — original Paint Booth paints

Paint Operations now lists the bundled original paints as editable records. Saving an original paint creates a published/draft override in Netlify Blobs; the bundled seed remains intact. Original share slugs are locked so existing URLs keep working. `/api/paints` publishes the merged original + override + Admin-added registry.

## v0.4.51 Charter and Standings editing

The **Charters** tab is intentionally flexible. Each Charter Board belongs to a league/program and contains full-time seats plus zero or more Open Charters. Each Open Charter is one actual charter slot. Its **Number identities / uses** list may contain one number or several alternate uses; those alternate identities do not count as additional simultaneous charter slots.

The **Standings** tab supports drag-and-drop row ordering on desktop plus Move Up / Move Down buttons for touch/mobile use. Reordering does not rewrite the official Position field. Use **Highlight Driver** to give an Aetherwing driver the public highlighted treatment.

## v0.4.52 publication control

The Calendar and every other main-site tab can publish unsaved form changes directly. Admin first stores the authoritative public-data revision, then queues a cache-cleared site rebuild. The three-step status strip shows draft, public data, and rebuild states separately so a missing hook cannot masquerade as a completed deployment. League selectors are generated from the editable **Leagues** tab plus existing calendar IDs, allowing a future league to be added without changing Admin code.

## v0.4.53 live Schedule delivery

The public Schedule requests the published Calendar dataset directly from `/api/site-content` when the page opens. A successful **Publish current changes** therefore updates the visible Schedule after a refresh even when the Netlify build hook is missing, delayed, or failing. The schedule bundled during the last deployment remains available as an automatic fallback when the content endpoint cannot be reached. Static event social-card pages and other build-time pages still require a successful site rebuild.

## v0.4.54 SCR Affiliate paints

The Paint Editor includes an **SCR Affiliate paint** checkbox. Check it when a livery belongs to the StarClutch Racing affiliate collection. The option is saved with drafts and published paints, appears in Admin previews and Library rows, and is delivered to the public Paint Booth as `scrAffiliate: true`. Existing paints with the legacy `starclutch` classification automatically load with the checkbox selected; clearing the checkbox and saving removes that classification.

## v0.4.59 schedule-linked Race Results

- Open **Race Results**, filter the Calendar by league, select the completed race, and choose **Load race results**.
- Event identity fields are copied from the Calendar and remain read-only in Results.
- Driver pickers only show Driver League Assignments for the selected league; update Assignments first when a new or substitute driver needs to become eligible.
- Add one Driver Results item for each Aetherwing entry, choose one featured driver, and choose one race as the current Latest Result.
- Saving or publishing retains older race records instead of replacing the previous league's result.

## v0.4.58 automatic Calendar placement

Use **Add Race** in the Calendar tab, then enter its league, date, and start time. Saving a private draft or publishing automatically places the race by date, parsed 12-hour time, and league. The same ordering is enforced by the backend and public Schedule.

## v0.4.57 expanded paint classifications

Paint Operations now includes dedicated Throwback and Special Paint switches plus structured special-type checkboxes. Those classifications publish with each paint and are available to the public Paint Booth and race-day team-reveal graphic.

## v0.4.56 paint tags and multi-paint race feature

Paint Operations now has dedicated SCR Affiliate, Dash4Cash, and Chase checkboxes. The next-race editor is a multi-select: choose every paint in the upcoming SCR lineup, then publish the shared race details once.

## v0.4.55 Summer’s End overlay

The main website automatically enables **Summer’s Final Stretch** from September 18 through September 24 using the America/New_York calendar date. The overlay is decorative, does not intercept clicks, reduces its particle count on phones, and honors reduced-motion preferences. Append `?season=summer-end` to a main-site page URL to preview it outside that date window. The Admin interface and separate Paint Booth deployment are not altered by this main-site overlay.

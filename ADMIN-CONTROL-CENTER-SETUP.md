# Aetherwing Admin Control Center

The canonical control center is **https://aetherwing.net/admin/**. The convenience URL **https://aetherwing.net/admin/login** redirects there and automatically opens the sign-in dialog.

One login at **https://aetherwing.net/admin/** now contains functional editors for Schedule, Results & Milestones, Paint Booth, Roster, and Team Wire. The separate Paint Booth is public-only.

## v0.4.43 runtime requirement

The admin backend now pins **Node 24** and **esbuild** for Netlify Functions and initializes Netlify Blobs inside each request. This specifically addresses the shared 502 startup failure that affected Schedule, Roster, and Paint Operations together. If the deployed project has an old `AWS_LAMBDA_JS_RUNTIME` override in Netlify, remove it or set it to `nodejs24.x`, then redeploy; UI-level function-runtime overrides take precedence over the repository Node setting.

## First deployment

1. Deploy this full main-site SOURCE package to the existing `aetherwing.net` Netlify project using its Git-connected build or Netlify CLI with Functions. Build command: `npm run build`; publish directory: `dist`. Do not upload just the static `dist` folder by drag-and-drop: that omits the server functions.
2. Enable Netlify Identity for the main-site project and set registration to **Invite only**.
3. Add or invite the administrator account and assign the **admin** role. This enables all five workspaces. The optional `paint-admin` role grants Paint Operations only. Identity accounts belong to a Netlify project: an account created on the old Paint Booth project does not automatically exist on the main project. Invite it on the main project if needed; no password is included in these ZIPs.
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

## Saving versus publishing

Main-site editors save an entire section draft, not just the selected row. You can edit several entries before saving. Add/remove nested rows with their buttons; simple text lists use one item per line. Save the draft, then Publish saved draft. Publication stores the approved section and queues a rebuild; the public site changes only when deployment completes. A failed build leaves the last successful site online. If the build-hook request fails, use Publish site / retry build. Paint publications are read directly and do not need a rebuild.

Main-site content uses the `aetherwing-site-content` Blobs store/key `content.json`. Paints use `aetherwing-paint-ops`/`registry.json`. Drafts and history are private; public APIs return published content only. Conditional writes reject stale concurrent saves. Export backup downloads the private main-site content registry.

## Preserve old Paint Operations entries

Before disabling the old Booth login, export `registry.json` from the old Paint Booth project's `aetherwing-paint-ops` Blobs store. Import it into the same store/key on the main project if you have added paints/features/drafts to preserve. The ZIP migration does **not** automatically transfer project-scoped Blobs or Identity accounts. After verifying migration and a main-site login/save, disable Identity on the old Booth project.

## Checks completed and remaining

The source build, baseline fact guards, all 11 editable content sections, mock Identity/storage authorization and persistence, DOM form interactions, recovery-dialog guard, public Booth reads/shares, and an actual rebuild with fixture edits were tested locally. Fixtures were removed and the baseline rebuilt. Live Identity account setup and a production Blobs save still require the deployed smoke test above; the original 502 cannot be declared resolved in production without that test. A local native function-packager check encountered Windows sandbox access restrictions, so function packaging must also be confirmed in the Netlify deployment log.

Official references: [Build hooks](https://docs.netlify.com/build/configure-builds/build-hooks/), [Environment variable scopes](https://docs.netlify.com/build/environment-variables/overview/), [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/).

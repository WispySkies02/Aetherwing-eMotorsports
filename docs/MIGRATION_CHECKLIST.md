# Migration checklist

## Per-page source collection

- [ ] Capture current live source/code for the page being migrated
- [ ] Inventory current content, assets, links, interactions, metadata, and manual fixes
- [ ] Identify Squarespace-only hacks that should not survive
- [ ] Normalize repeated facts into `src/data/`
- [ ] Rebuild the page using shared components and page-specific composition

## Per-page quality gate

- [ ] Desktop layout
- [ ] iPhone/mobile layout
- [ ] Tablet/intermediate widths
- [ ] Keyboard navigation
- [ ] Touch targets
- [ ] Reduced motion
- [ ] No horizontal overflow
- [ ] No duplicate scrollbars
- [ ] Sticky elements behave correctly
- [ ] Filters/accordions/countdowns work
- [ ] Images lazy-load where appropriate
- [ ] Deep links work on direct page load
- [ ] Share/copy behavior is correct
- [ ] Internal links work
- [ ] External links are intentional
- [ ] Title/description/canonical/OG/Twitter metadata is page-specific
- [ ] 404 behavior checked
- [ ] Content facts match current source of truth

## Temporary Netlify review

- [ ] Deploy only to the new main-site Netlify project
- [ ] Keep `aetherwing.net` on Squarespace during review
- [ ] Keep `paint.aetherwing.net` on its existing separate project
- [ ] Disable **Powered by Netlify badge** in Project configuration → General if Netlify displays it
- [ ] Test Home, Drivers, Schedule, Paint Booth, Partners, News, History, Mission, Handbook, Contact, and 404 on the temporary URL
- [ ] Test at iPhone, tablet, and desktop widths

## Final domain cutover

Do this only after full-site approval on the temporary Netlify URL.

- [ ] Add `aetherwing.net` to NEW main-site Netlify project
- [ ] Add `www.aetherwing.net`
- [ ] Use the exact DNS values Netlify supplies at cutover time
- [ ] Change only website DNS records
- [ ] Preserve MX records
- [ ] Preserve unrelated TXT / verification records
- [ ] Preserve `paint.aetherwing.net`
- [ ] Verify apex domain
- [ ] Verify `www`
- [ ] Verify Paint Share
- [ ] Verify email remains intact
- [ ] Only then retire Squarespace website hosting if desired

# Approved team-partner profiles — October 26, 2026

The owner supplied a screenshot of the previously approved Palmetto Gaming and
Apex Sim Racing profiles and confirmed that the brands approved this wording.
`src/data/partners.json` restores both descriptions, public badges/categories,
profile labels, subject tags, Aetherwing-presence headlines, both paragraphs and
presence tags. The existing cards and site tokens are reused; the entire app UI
is not rolled back.

Palmetto remains a team-level Gaming Partner with the approved public
“Featured Brand” badge. Apex remains an Affiliate Partner. Published logo and
destination changes are preserved; driver portfolios and their optional titles
remain separate. No partner role is reassigned to an individual driver.

The shared reconciliation updates older profile copy using the approved content
revision across build/server reads and the public page. The Admin fallback uses
the same revision/field policy. Once a record has the current revision, later
Admin edits remain authoritative. The revision marker is retained automatically
and hidden from the content form. Old cached public data is also reconciled so
a failed feed request cannot silently restore the generic summaries.

Checks: `npm run test:all`, production build, and
`node scripts/test-team-partners-browser.mjs` at 1440/768/390/320px. Browser tests
cover all approved text, stale/cached feed data, subsequent CMS changes, separate
driver portfolios and unobstructed links. Admin tests cover private draft,
publish/readback and restoring the prior approved snapshot using mock storage.

No production Admin writes or automatic merge are performed. This correction
is a separate PR from the new Kmart championship feature.

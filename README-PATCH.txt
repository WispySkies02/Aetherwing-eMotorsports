Aetherwing v0.4.4 Schedule Embed Patch

Overlay these folders onto the CURRENT GitHub working copy.
This patch intentionally does NOT contain or alter favicon files, league-logo source files,
site data, news, Paint Booth, or any other current-repo changes.

Changes:
- 143 versioned event Open Graph images: *-v44.jpg
- Event names rendered with the actual supplied Edo SZ font at build time
- Event share metadata points at the new v44 image filenames
- Share buttons copy event URLs with ?v=44 to force Discord to re-scrape
- Existing event links still work and still open Schedule with the event's league selected

The Edo SZ font itself is NOT bundled in this patch.

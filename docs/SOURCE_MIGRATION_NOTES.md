# Source migration notes — v0.3.0

## Schedule

Source used: `Aetherwing-Schedule-Full-V10-Spelling-Audit-Fixes-2026-09-05(1).txt`

Structured migration:

- 143 total calendar entries
- 126 season races (iRacing special events and off-weeks excluded)
- 16 iRacing special-event windows
- 1 Kmart off-week marker
- 62 track-location weather targets
- 20 short-name track aliases
- UARL D2 runs Fridays at 6:45 PM ET
- Kmart/Sunoco remain StarClutch Racing alliance competition

Preserved behavior:

- league filtering
- UARL subfilters
- next-operation selection based on active filter
- off-week skipping for next actual operation
- multi-day iRacing event windows
- three-month condensed view / full upcoming view
- live/upcoming countdown state
- track-targeted weather panel

Added in v0.3.0:

- expandable event information dock on every calendar entry
- one-open-dock-at-a-time behavior
- dock countdown/live state
- relationship, phase, track, timing, and round/marker readout

## Paint Booth

Source used: `Aetherwing-Paint-Booth-Full-V23-Kmart-2005-Home-Depot-2026-09-06.html`

Structured migration:

- 7 competition garages
- 34 uploaded schemes
- 13 iRacing liveries
- current driver slots preserved even when no render is uploaded
- driver number overrides preserved
- Scheme IDs, notes, badges, images, manufacturer/body information preserved
- Paint Share URLs remain on the separate `paint.aetherwing.net` project

Added in v0.3.0:

- immersive paint-booth facility scene
- selectable garage directory
- selectable current-driver rack
- per-driver paint rack
- Paint Pending state for roster slots without a render
- Shop / Showroom / Dark lighting modes
- previous / next paint controls
- global Surprise Me control
- live scheme information dock
- full-render lightbox
- full searchable/filterable collection below the booth
- exact `#paint-SLUG` loading retained

## Deployment boundary

This repository is the future main `aetherwing.net` site only. The existing `paint.aetherwing.net` project remains separate and must not be merged, replaced, or repointed during main-site staging.

# Aetherwing Website — September 25 Review Closeout

Baseline: v1.1.29, rechecked before edits. This closeout becomes v1.1.30.

## Results and schedule
- NRRS Race 21 is North Wilkesboro on Sep. 22, 2026 with the corrected official scoring: Trent 58, Jaxon 41, Clutch 49, Outlaw 40, Will 50, Max Verstappen 47, Matty 30.
- Corrected Chase standings are Will 2,195 (leader), Trent 2,182 (-13), Clutch 2,173 (-22), Jaxon 2,130 (-65), Outlaw 2,128 (-67), Hailey 2,087 (-108). The older -110 figure came from the superseded Trent total and is not retained.
- Publishing Results now normalizes known NRRS/UARL D1 finish + stage scoring, advances Auto Points standings, and a correction to the most recently applied result adjusts only the point delta rather than double-counting it.
- Race Calendar completion is result-aware: a matching published result immediately closes that event and rolls next-event UI forward even before the nominal duration expires.
- Public Race Calendar consumes live schedule and result datasets and refreshes countdown/rollover once per second.
- UARL D2 remains absent from active drivers, competitions, schedule metadata and schedule events; the Sep. 12 Daytona D2 result remains in History data.
- UARL D1 weekly metadata remains Sunday 8:30 PM ET.

## Admin/public sync
- Driver Lineup listens to live driver assignments, roster profiles and charter boards.
- Driver profiles listen to live driver directory/profile/portfolio data, so personal sponsor portfolios are not a separate hard-coded list.
- Team-partner edits now live-sync to both the public Partners page and homepage partner strip. Partner file uploads and HTTPS/site-relative logo sources are validated by the Admin backend.
- Driver assignment number art and unsigned charter number art remain editable by URL or PNG/JPG/WebP upload.
- Regression fixtures cover adding driver directory identities/usernames and adding driver portfolios without reintroducing stale drivers into the current roster.
- Known NRRS and UARL D1 scoring is calculated from finish/stage positions; bonus/adjustment points remain an explicit field for pole/fastest-lap/other official bonuses.
- Standings Admin supports pasted CSV/TSV/text and CSV/TSV file upload with a preview step; manual row editing remains available.

## Content
- Latest Result behavior is automatic newest completed result across programs; normalization enforces exactly one featured/latest race.
- Sep. 24 North Wilkesboro Chase Race 2 story is present in Team Wire.
- Hailey iRacing profile baseline remains 409 starts / 59 wins / 121 top-fives / 52 poles / 14.1% Formula win rate.
- Current iRacing identity remains Hailey Bell; historical Nicholas Waggoner is retained on the same profile.
- History seed contains 27 verified wins.

## Presentation / roster guards
- Sep. 25–30 automatically resolves to the Halloween teaser in Eastern Time.
- Faith-observance banner snippets use the reviewed KJV wording (including “IN EVERY THING GIVE THANKS”, “THIS IS THE DAY WHICH THE LORD HATH MADE”, and “HE IS NOT HERE: FOR HE IS RISEN”).
- Standalone Paint Booth v65.1 source validator passes its 35-paint registry, live registry/reveal, navigation and script checks. True browser network/performance timing was not measured in this container.
- Current UARL/NRRS rosters are protected from proposed next-season #42/#46/#56 leakage.
- NRRS and UARL D1 each preserve #62 Part-Time + #82 Development as two identities of one shared open charter, with no permanent driver assignment.

## Validation
- `npm run validate`: pass.
- Compatibility `node scripts/validate.mjs`: pass.
- Modified JavaScript syntax checks: pass.
- Full dependency install / Astro compile could not be completed in the working container because `npm ci` timed out; Netlify remains the final production compile check.

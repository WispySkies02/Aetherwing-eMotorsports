# Confirmed current driver update — November 1, 2026

Owner-authorized changes:

- Matty: Kmart #3, Full-Time, `@matty_campbell`. Preserve the existing StarClutch Racing alliance affiliation.
- Eazy: `@deadmansrisin27_`; retain Kmart #29 and Sunoco #27.
- UARL D1 summary: `3 ASSIGNED · 1 OPEN · 1 FLEXIBLE ENTRY`, derived from the actual rendered cards, without changing #28/#32/#46/#56/#62 or charter entitlement.

The directory, program lineup, profiles, server content/art APIs, build-time content, cached public hydration and Admin use the same current identities. The one-time `currentRosterRevision` marker prevents an older CMS snapshot from restoring outdated fields while allowing subsequent saved Admin edits. The marker stays out of the Admin form. Shared #29 artwork synchronization remains for the current #29 assignments; Matty’s #3 is excluded. Number-aware artwork hydration rejects old #29 responses for his #3 card.

No approved custom #3 image was supplied or found in current source/published assignments. The previous image is shared #29 artwork, so it is cleared for Matty and the existing styled #3 fallback is used. Later genuine #3 uploads remain editable. No number artwork is fabricated.

Current profile/league metadata is updated, including paint-league usernames and driver role. Historical race results, points, standings snapshots, paint numbers/images/Scheme IDs and the other drivers’ #29 assignments are unchanged. Legacy username aliases remain supported for importing old results. Existing profile destinations `/drivers/matty/` and `/drivers/eazy/` remain valid; no external account IDs or new links are invented.

Validation includes visible-card summary partitions, active/inactive and multi-use flex, old published snapshots, legacy combined assignments, current-profile and existing-link migration, future Admin edits, cached hydration, stale artwork payloads, history preservation, desktop/mobile directory/profile/program views, publication rebuild restoration and function packaging.

Normal Netlify PR previews are expected. This change does not write to production Admin or merge automatically.

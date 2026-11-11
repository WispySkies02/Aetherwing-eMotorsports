# UARL D1 Chevrolet return — November 11, 2026

## Approved current allocation

The owner confirmed that Aetherwing eMotorsports returns to **UARL Division 1**, effective now, as a **Chevrolet** team with the following numbers:

| Number | Current assignment | Status |
| --- | --- | --- |
| 33 | Will | Active |
| 42 | No signed driver | Unsigned |
| 43 | No signed driver | Unsigned |

This replaces the previous current D1 allocation, including the separate #56 open entry and #62 flexible entry. It does not create additional slots. No full-time commitment, new season number, driver for #42 or #43, or specific Chevrolet model was approved.

## Source records

- `src/data/drivers.json`: the only current D1 assignment is `will-uarl-d1`, with profile `will`, number `33`, affiliation `aetherwing`, status `Active`, and car/manufacturer `Chevrolet`. Its number image is empty; no existing image or handle is invented or reassigned.
- `src/data/charters.json`: the D1 board has #33 Will, #42 Open/Unsigned and #43 Open/Unsigned, with an empty `openCharters` array. The existing `fullTime` property is a storage container for the regular allocation; it is not evidence of a new full-time driver commitment.
- `src/data/competitions.json`: the D1 program lists #33 Will, #42 UNSIGNED and #43 UNSIGNED. The existing Next-Gen platform context and schedule are retained; the current manufacturer is Chevrolet.
- `src/data/roster-profiles.json`: Hailey's current D1 program label is removed, while her separate UARL Open #28 remains. Will gains the D1 assignment alongside his existing Kmart and Sunoco programs. His global alliance affiliation and StarClutch alliance ID remain intact because the assignments have different affiliations. Rocky and BurgerTown2Good retain their identity records, historical numbers and historical D1 biographies, with no current program assignments in these records. Their history does not imply a new current D1 seat or global retirement.

The affected D1 assignment, board, program and four roster profiles carry `currentUarlRevision: "2026-11-11-v1"`. This identifies the owner-approved migration of earlier current D1 data. It must not become a permanent reset of later Admin changes, including intentional edits or removals after this revision has been adopted.

## Preserved records and boundaries

- Will's Kmart #24 and Sunoco #42 assignments remain StarClutch Racing alliance assignments.
- UARL Open is a separate program and remains unchanged.
- Historical race entries, results, biographies, standings and paint assets are not renumbered to match this current allocation.
- The planned NRRS Season 4 / 2027 #42, #43 and #46 allocation is a separate future plan and remains unchanged.
- Old D1 assignment rows are removed from the current assignment collection; their driver profiles and historical results remain available.
- The #42 reuse does not reactivate a departed driver or any old driver assignment associated with that number.

No result, point total, historical finishing position, driver signing for #42/#43, image, or social identity is inferred by this update. This document records the source decision and does not assert deployment or publication.

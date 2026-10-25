# October 25, 2026 non-design review

## Approved archive records

The public results feed at revision 94 included October 20 but none of the
earlier approved October records. Existing source records and the owner's
approved intake remain the authority; no finishing orders, numbers, stage
positions, or points have been invented or changed.

| Event | Source / state |
| --- | --- |
| Oct 5 Kmart Martinsville, ROUND 9 | Approved owner screenshots/corrections; `docs/confirmed-october-2026-results.md` |
| Oct 6 NRRS Talladega, ROUND 22 | Approved owner screenshots and linked Talladega recap |
| Oct 10 Sunoco Charlotte oval | Approved owner screenshots and supplied scoring format |
| Oct 13 NRRS Portland, ROUND 23 | Approved owner screenshots and linked Portland recap |
| Oct 19 Kmart Talladega, ROUND 10 (Valvoline 300) | **Pending official source.** Published schedule confirms the event listing, not participation, finishing order, or points. No result added. |
| Oct 20 NRRS New Hampshire, ROUND 24 | Approved owner recap; source preserved in `docs/sources/nrrs-new-hampshire-2026-10-20.md` |

The shared reconciliation appends only missing records identified in
`confirmed-racing-updates.json`. It preserves existing Admin corrections and
legacy event identities, avoids duplicates, distinguishes later seasons, and
does not advance standings. Build content and the public function use the same
reconciliation; History, Latest Result, and event pages retain their existing UI.

## Remaining verification boundaries

- iRacing career figures have no newly authorized dated source. The existing
  values remain unchanged; no as-of date or aggregate denominator is invented.
- Main site: package `2.0.44`; validation/build and isolated mocked Admin
  roster/schedule draft and publication checks are development evidence, not
  production account verification or deployment approval.
- Paint Booth: separate package `88.0.0`, checkout `08b75a3`. It is a static
  package with no production-build command. Its validation and browser suites
  are separate from the main site. Software WebGL/mobile viewports do not
  establish real-phone rendering or touch behavior.
- No production Admin writes, deployment-package approval, or automatic merge
  are performed. Normal PR previews are allowed by the owner's standing request.
- UI/loading-state work stays in the owner's handoff. Auretta Creative requires
  approved scope, text, artwork and destination before implementation.

## Recorded development checks

| Package / version | Candidate / scope | Check results | Approval state |
| --- | --- | --- | --- |
| Main site `2.0.44`, base `0d72fd7` | D1 `eda7d4e`, PR #39 | Full validation suite; 302-page production build; desktop/390px/320px browser checks including D1 reload | Separate review PR; not merged automatically |
| Main site `2.0.44`, base `0d72fd7` | Assignment mapping `374c90b`, PR #40 | Full validation suite; 302-page production build; directory/profile agreement at desktop/390px/320px; dynamic assignment/count regressions | Separate review PR; not merged automatically |
| Paint Booth `88.0.0`, `08b75a3` | Unchanged checkout | `npm run check`, `test:catalog`, and `test:stage` passed: desktop, 390px, 320px, and fallback page; local original downloads, actual software-WebGL controls/PNG export, failed models, request races, filters, copying, and direct URLs | Development verification only; no Booth code changes, build/deploy command, or production approval |

Paint browser tests use deterministic catalog/asset fixtures with the real viewer.
They establish application behavior in Chromium/SwiftShader, not successful
loading of every live model or physical touch behavior. Both package results
remain separate; main-site function packaging also checks the Booth proxy.

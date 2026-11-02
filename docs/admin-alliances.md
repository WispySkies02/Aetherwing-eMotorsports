# Team alliance management

Open **Admin → Roster Manager → Team Alliances**, or `/admin/?section=alliances`.

1. Choose **Add alliance**, enter the organization name and optional short name, then save a private draft or publish. A stable key is generated from a new name if left blank. Rename an existing alliance through its name, keeping the key stable.
2. In **Driver League Assignments** or **Driver Directory**, select **Alliance team** as the relationship and choose the named alliance. In **League Details**, choose **Alliance program** and its alliance. Direct Aetherwing relationships do not need an alliance selection.
3. Review freeform current biographies when changing teams. Generated organization labels on current driver cards, profiles and programs follow the selected alliance; historical prose is not rewritten.
4. To remove an alliance, first reassign its linked current drivers, profiles and programs. Publish those edits first, or save all related drafts and use the existing **Publish all** operation. Then remove the unused alliance and publish the removal. Removing an alliance never deletes race results, news, standings, paints or drivers automatically.

The alliance list may be empty, and Add alliance remains available afterward. An explicit empty list never restores StarClutch from bundled defaults. Existing StarClutch relationships are retained as the initial named record. Existing sponsor/affiliate partners remain separate.

A single-section publication is validated against the candidate **public** records, so an unpublished reassignment draft cannot accidentally permit a dangling public reference. Atomic publication can apply reassignment and alliance removal together. Recorded former-driver associations remain historical context; active assignments and programs must reference a real alliance.

Current public labels refresh from the named collection on publication and from cached snapshots. Static builds use the same lookup. Existing stale-program repairs preserve explicit alliance choices, including a deliberate switch back to Aetherwing. Program alliance labels are generated from the selected organization; general biography/history text remains editorial.

Verification covers authenticated mocked Admin CRUD/drafts/readback, empty-list recreation, linked-removal guards, public-versus-private dependencies, atomic publication, IDs and escaping, server/static/cached public labels and desktop/mobile layouts. All test organizations stay in isolated mocks or publication-test copies; no production Admin writes are performed. Main-site and Paint Booth deployments remain separate.

Existing UI follow-up: at 320px the Mission statistics labels overflow their unchanged three-column tiles (340px page width). The alliance browser check compares against the measured canonical baseline and confirms no increase; other tested pages retain strict no-overflow checks. No unrelated Mission CSS is changed.

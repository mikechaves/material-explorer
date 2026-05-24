# Future Backlog

> Deferred and long-range backlog programs that are not in the active execution queue.

_Current as of: 2026-05-24_

---

## Scope

This file is the parking lot. It should not be treated as a commitment to build everything here.
Move items into [Active Backlog](./ACTIVE_BACKLOG.md) only after they have a clear owner,
validation path, and reason to beat the current queue.

If another doc records a follow-up, finding, or proposed roadmap item, it must also appear here or in
[Active Backlog](./ACTIVE_BACKLOG.md). Otherwise it is context, not work.

## Texture And Asset Pipeline

- [ ] Move texture payloads from embedded data URLs to object storage or another asset store.
- [ ] Add reusable texture thumbnails and cache invalidation for saved material cards.
- [ ] Add per-map texture metadata such as source file name, dimensions, and compressed size.
- [ ] Support replacing texture references without rewriting the whole material library payload.
- [ ] Add optional texture format conversion targets such as WebP or AVIF when browser support and
      export compatibility are clear.

## Backend And Sync

- [ ] Build a production API service for authenticated material persistence.
- [ ] Add account-scoped material libraries with explicit export/delete behavior.
- [ ] Implement conflict resolution for multi-device edits.
- [ ] Add server-side validation parity for every frontend material rule.
- [ ] Move bulk actions to dedicated API endpoints when a real backend exists.
- [ ] Add structured audit logs for create, update, delete, import, and bulk operations.

## Preview And Export Depth

- [ ] Support imported user meshes instead of preview-only sphere/grid geometry.
- [ ] Add more preview environments only after bundle and startup budgets are protected.
- [ ] Add material delta/diff views beyond the current A/B compare toggle.
- [ ] Improve GLB export fidelity for advanced material settings and texture references.
- [ ] Evaluate WebGPU preview paths when browser support and dependency cost are justified.

## Editor Workflow

- [ ] Add richer preset organization such as folders, tags, and recently used presets.
- [ ] Add keyboard shortcut discoverability inside the command palette.
- [ ] Add draft annotations or notes for material recipes.
- [ ] Add batch texture clearing/replacement workflows for selected saved materials.
- [ ] Add compare snapshots that can persist across sessions.

## Sharing And Collaboration

- [ ] Add private share links backed by server storage.
- [ ] Add read-only public material pages.
- [ ] Add collaboration roles for shared material libraries.
- [ ] Add comment/review workflows for material candidates.
- [ ] Add share-link expiry and revocation controls.

## Platform And Distribution

- [ ] Add a lightweight documentation site for examples and material recipes.
- [ ] Add a public preset gallery only after moderation and licensing policy are clear.
- [ ] Add npm/package or SDK export helpers if external tools need programmatic access.
- [ ] Add desktop PWA polish such as install prompts and offline status.
- [ ] Evaluate Electron or native wrapper only if offline file workflows justify the maintenance cost.

## Quality, Security, And Operations

- [ ] Add visual regression coverage for the editor and sidebar once screenshots are stable enough to
      avoid noisy diffs.
- [ ] Add synthetic monitoring for the GitHub Pages deployment.
- [ ] Add browser matrix coverage beyond Chromium if usage justifies it.
- [ ] Add accessibility regression checks for expanded workflows after the active manual QA notes land.
- [ ] Add release closeout checklist once releases become more formal than beta snapshots.

## Strategic Framing

### Tier 1: Current Product Reliability

- Local-first save/import/export safety.
- Texture handling that does not surprise users with quota failures.
- Fast enough preview startup on ordinary hardware.

### Tier 2: Creator Workflow Leverage

- Better presets, history, comparisons, and batch editing.
- Stronger GLB/material export workflows.
- Clear docs for repeatable material recipes.

### Tier 3: Sync And Sharing

- Authenticated backend persistence.
- Private/public sharing.
- Multi-device and team-library workflows.

### Tier 4: Ecosystem

- Preset gallery.
- SDK/tool integrations.
- Marketplace or public distribution.

---

For current execution, see [Active Backlog](./ACTIVE_BACKLOG.md).

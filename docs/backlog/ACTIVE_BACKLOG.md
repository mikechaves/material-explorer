# Active Backlog

> Current execution queue for Material Explorer.

_Current as of: 2026-05-24_

---

## Scope

This file is the canonical backlog for work we are willing to start next. It replaces scattered
follow-up lists in audit notes, README limitations, and implementation summaries.

Rules:

- Keep this file short enough to make real priority tradeoffs.
- Add only work that has a clear owner, validation path, or decision gate.
- Move completed work to release notes, changelog entries, or a decision note instead of leaving
  `DONE` rows here.
- Keep broad wishlist or long-range ideas in [Future Backlog](./FUTURE_BACKLOG.md).
- Do not treat follow-up sections in audit docs, README limitations, backend notes, or PR comments as
  a work queue. Promote them here or park them in Future Backlog before acting.

## Current Product Posture

- Material Explorer is a local-first PBR material editor with optional HTTP sync, import/export,
  command palette workflows, draft history, guardrails, and a tested GitHub Pages deployment.
- Recent work hardened dependency security, texture storage budget feedback, texture upload
  compression/downscaling, JSON import limits, mobile layout spacing, bundle budgets, Playwright
  coverage, and audit gates.
- Texture maps still live as embedded data URLs inside saved material JSON; this is reliable enough
  for small libraries, but not a complete asset-storage strategy.
- Backend sync exists as a frontend adapter and mock API contract, not as a production persistence
  service.

## Priority Legend

- `P0`: Blocks deployability, data safety, security, or the ability to validate current product value.
- `P1`: Near-term reliability, performance, or creator-workflow leverage.
- `P2`: Useful shaping work, but not allowed to displace P0/P1 work without an explicit decision.
- `RESEARCH`: Needs a technical or product decision before implementation.

## Active Workboard

| Priority | Area                | Item                                                                | Status | Validation / Exit Criteria                                                                                                                                     |
| -------- | ------------------- | ------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Preview Performance | Deepen 3D preview/runtime code-splitting.                           | TODO   | `vendor-three-core` or total JS budget drops with no preview regressions; bundle budget script and Playwright preview smoke stay green.                        |
| P1       | Observability       | Document telemetry ingestion contract and backend endpoint example. | TODO   | `VITE_TELEMETRY_URL` payload shapes, event names, privacy expectations, and a mock/server example are documented and covered by focused tests where practical. |
| P1       | Backend Readiness   | Turn optional API sync into a verified backend contract harness.    | TODO   | Mock API contract tests cover load/save failures, scope/auth headers, malformed payloads, and local fallback behavior from a consumer perspective.             |
| P2       | Maintainability     | Continue splitting `MaterialEditor` and `Sidebar` into modules.     | TODO   | A focused extraction reduces file complexity without changing behavior; associated unit/e2e coverage follows the extracted boundaries.                         |
| P2       | Accessibility & QA  | Add focused manual QA notes for texture-heavy and mobile workflows. | TODO   | Docs capture keyboard, screen-reader, reduced-motion, and mobile checks for texture upload, save warning, import rejection, and sidebar drawer flows.          |

## Deferred

The following remain intentionally non-active:

- Production backend service implementation beyond frontend/mock contract hardening.
- Object storage for texture assets.
- Collaboration, accounts, sharing permissions, and team libraries.
- Imported custom mesh workflows beyond preview geometry exports.
- Marketplace, public SDK, or preset distribution programs.

See [Future Backlog](./FUTURE_BACKLOG.md) for the full parking lot.

## Evidence Docs

- [Backend Readiness Plan](../backend-readiness.md)
- [Full Stack Audit](../full-audit-2026-02-14.md)
- [README](../../README.md)
- [Changelog](../../CHANGELOG.md)

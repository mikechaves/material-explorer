# Material Explorer Backlog

This directory is the active planning home for Material Explorer.

Use backlog documents for current and future work. Audit findings, release notes, README limitations,
and implementation notes are supporting context only; they should not become shadow work queues.

## Source Of Truth

[Active Backlog](./ACTIVE_BACKLOG.md) and [Future Backlog](./FUTURE_BACKLOG.md) are the only
canonical work queues.

Other docs may contain decisions, evidence, QA notes, or technical context, but they must not become
shadow backlogs. If an audit, README limitation, runbook, or implementation report discovers new
work, do one of the following in the same change:

- Add near-term work to [Active Backlog](./ACTIVE_BACKLOG.md) with priority, ownerable scope, and
  validation criteria.
- Add deferred or decision-bound work to [Future Backlog](./FUTURE_BACKLOG.md).
- Mark the finding `DONE / SUPERSEDED` with a short rationale if it is no longer valid.
- Keep validation-only checklists in their local docs only when they describe how to verify a
  feature, not what to build next.

## Canonical Files

- [Active Backlog](./ACTIVE_BACKLOG.md): current product and reliability execution queue.
- [Future Backlog](./FUTURE_BACKLOG.md): deferred, long-range, or decision-bound work.

## Rules

- Keep the active queue short enough to make real priority tradeoffs.
- Move completed work into release notes, changelog entries, or decision notes instead of leaving
  `DONE` rows in the active queue.
- Do not leave roadmap commitments, follow-up tasks, or open findings only inside audit docs,
  README limitations, backend notes, or issue comments.
- Link historical docs only as evidence.
- Do not add per-doc version stamps. Use release notes and "current as of" dates for freshness.

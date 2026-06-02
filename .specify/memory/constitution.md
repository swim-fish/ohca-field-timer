<!--
Sync Impact Report
==================
Version change: (template / unversioned) → 1.0.0
Bump rationale: First ratified constitution. Initial adoption replaces the
unfilled template, defining the full principle set and governance — treated as
the 1.0.0 baseline rather than an amendment to a prior version.

Modified principles: N/A (initial definition)
Added principles:
  - I. Code Quality & Consistent Style
  - II. Test-First Development (NON-NEGOTIABLE)
  - III. User Experience Consistency
  - IV. Performance & Offline-First
  - V. Documentation Discipline (English-First + ADR)
  - VI. Subagent-Driven, Context-Efficient Workflow
Added sections:
  - Technology & Platform Constraints
  - Development Workflow & Quality Gates
Removed sections: None

Templates requiring updates:
  - ✅ .specify/templates/plan-template.md (Constitution Check gate aligns; no token edits required)
  - ✅ .specify/templates/spec-template.md (scope unaffected; reviewed, no change required)
  - ✅ .specify/templates/tasks-template.md (formatting/test/docs task types covered; reviewed, no change required)

Follow-up TODOs: None — all placeholders resolved.
-->

# OHCA Field Timer Constitution

## Core Principles

### I. Code Quality & Consistent Style

All code MUST be written in TypeScript with `strict` type-checking enabled; `any`
is prohibited except where an explicit, commented justification is provided.
Every change to source files MUST pass automated formatting and linting before it
is considered complete — formatting is enforced via `npx prettier --check` and a
project format hook that auto-formats files on write. Code that fails
`prettier --check` or the linter MUST NOT be committed or merged. Naming,
structure, and idioms in new code MUST match the surrounding code.

**Rationale**: A field-deployed emergency timer must be auditable and
maintainable under stress. Strict typing and machine-enforced style remove a
whole class of defects and review friction, keeping the codebase legible to every
contributor and reviewer.

### II. Test-First Development (NON-NEGOTIABLE)

TDD is mandatory. For every feature or bug fix the cycle is strictly:
write a failing test → confirm it fails (Red) → implement the minimum to pass
(Green) → refactor. Tests MUST exist and MUST have been observed to fail before
implementation code is written. Bug fixes MUST begin with a regression test that
reproduces the defect. No implementation task may be marked complete while its
governing tests are absent or failing.

**Rationale**: This software supports time-critical clinical decisions. Test-first
discipline is the primary guarantee of correctness and stability and prevents
silent regressions in logic that humans rely on during resuscitation.

### III. User Experience Consistency

The user-facing behavior MUST be consistent, predictable, and unambiguous across
the entire application: shared interaction patterns, terminology, color/contrast,
and timing semantics. Any change that alters UI structure, layout, visual design,
or interaction flow MUST be accompanied by an update to documentation under
`docs/ui/` describing the change and its rationale in the same change set. UI
changes MUST preserve accessibility (legibility, contrast, touch-target size)
suitable for high-stress, outdoor, single-handed field use.

**Rationale**: Operators read this interface under extreme cognitive load.
Inconsistency costs seconds that matter clinically; documenting UI decisions in
`docs/ui/` keeps design intent traceable and prevents drift.

### IV. Performance & Offline-First

The application is an offline-first Progressive Web App (PWA): it MUST be fully
functional with no network connectivity after first load, using a service worker
and local persistence. Core timer operations (start, stop, lap/event marking,
display update) MUST remain responsive — timer tick accuracy and UI feedback MUST
NOT visibly drift or stutter. Each plan MUST declare explicit, measurable
performance budgets (e.g., interaction-to-paint latency, bundle size, time-to-
interactive) and those budgets MUST be verified before release.

**Rationale**: Field use means unreliable or absent networks and a need for
instant, trustworthy feedback. Offline capability and tight performance budgets
are not optional features — they are the product's reason to exist.

### V. Documentation Discipline (English-First + ADR)

All persistent technical documentation — `docs/`, ADRs, README, API docs, and
inline code comments — MUST be written in English. Every architecturally
significant decision MUST be captured as an Architectural Decision Record (ADR).
After each `/speckit-analyze` and each `/speckit-implement` run, the ADR set MUST
be reviewed and updated to reflect any decisions, trade-offs, or changes
introduced; this update is part of completing those commands, not a follow-up.

**Rationale**: English-first docs keep the project contributable and reviewable by
a broad audience, while mandatory ADR updates after analysis and implementation
preserve a durable, honest record of *why* the system is the way it is.

### VI. Subagent-Driven, Context-Efficient Workflow

Splittable work — searching, inspection, cross-file checks, and independent
parallel tasks — MUST be delegated to subagents so the main conversation context
stays small and focused. Model selection MUST match task difficulty: simpler,
mechanical tasks use Sonnet subagents; code-quality reviews MUST use a mixed panel
of Sonnet and Opus subagents to obtain diverse perspectives and reduce blind
spots. Subagents return conclusions, not raw dumps, to the main context.

**Rationale**: Keeping the orchestrating context lean improves reliability and
cost, while a multi-model review panel surfaces issues a single reviewer would
miss — directly reinforcing the quality and testing principles above.

## Technology & Platform Constraints

- **Language**: TypeScript with `strict` mode; no untyped escape hatches without
  documented justification.
- **Application type**: Offline-first PWA with a service worker and local-first
  data persistence.
- **Deployment target**: GitHub Pages (static hosting). The build MUST produce a
  self-contained static bundle deployable to GitHub Pages, with correct base-path
  handling for the project subpath.
- **Formatting/Linting**: Prettier is the source of truth for style, enforced by
  `npx prettier --check` and an auto-format hook on file write.
- **Compatibility**: The app MUST function on modern mobile browsers and tolerate
  intermittent or absent connectivity without data loss.

## Development Workflow & Quality Gates

The following gates MUST pass before a change is considered complete or merged:

1. **Tests**: All governing tests written test-first, observed to fail, and now
   passing (Principle II).
2. **Format & Lint**: `npx prettier --check` and lint pass clean (Principle I).
3. **UI Docs**: If UI changed, `docs/ui/` updated in the same change set
   (Principle III).
4. **Performance**: Declared performance/offline budgets verified (Principle IV).
5. **ADR**: ADRs reviewed and updated after `/speckit-analyze` and
   `/speckit-implement` (Principle V).
6. **Review**: Code-quality review performed by a mixed Sonnet + Opus subagent
   panel for non-trivial changes (Principle VI).

Quality gates are non-negotiable. A change that cannot pass a gate MUST be
reworked, not waived; any deliberate exception MUST be recorded as an ADR with
explicit justification.

## Governance

This constitution supersedes all other development practices. When guidance
conflicts, the constitution wins.

**Amendments**: Changes to this constitution MUST be proposed via a documented
change (PR), explaining the motivation and impact, and MUST be accompanied by a
version bump and propagation to dependent templates (`plan-template.md`,
`spec-template.md`, `tasks-template.md`) and runtime guidance.

**Versioning policy** (semantic versioning):
- **MAJOR**: Backward-incompatible governance changes — removing or redefining a
  principle in a way that invalidates existing compliance.
- **MINOR**: Adding a new principle/section or materially expanding guidance.
- **PATCH**: Clarifications, wording, and non-semantic refinements.

**Compliance review**: Every PR and review MUST verify compliance with these
principles. Complexity that violates a principle MUST be justified in the plan's
Complexity Tracking section or rejected. Reviewers MUST treat unjustified
violations as blocking.

**Version**: 1.0.0 | **Ratified**: 2026-06-02 | **Last Amended**: 2026-06-02

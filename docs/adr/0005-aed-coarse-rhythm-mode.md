# 5. Simplified AED rhythm mode records a coarse outcome, reusing the rhythm event

Date: 2026-06-03

## Status

Accepted

## Context

"簡易 實作 AED 切換" was specified for feature 002. A pre-agreed design existed in
`docs/backlog/aed-simplified-rhythm.md`: less-trained / BLS / public-setting rescuers who
cannot classify a specific ACLS rhythm need to record only whether a shock is advised.
(An earlier literal reading of the spec had modelled this as a defibrillation **energy**
toggle; the user confirmed during planning that the rhythm-analysis simplification is the
intended interpretation, and the spec was rewritten to match.)

A clinical guardrail is non-negotiable: a coarse "shockable" decision MUST NOT be
back-mapped to a specific rhythm (e.g. inferring VF), which would fabricate data the
rescuer never observed.

## Decision

Add a **進階 ACLS ⇄ 簡易 AED** toggle to the rhythm-analysis sheet:

- 進階 ACLS keeps the existing five-rhythm picker.
- 簡易 AED shows two coarse choices recorded via `AED_OUTCOMES`
  (`可電擊 AED建議電擊` / `不可電擊 AED不建議電擊`). Choosing 建議電擊 offers a one-tap
  已電擊 confirm that logs a shock; 略過 keeps the rhythm without a shock.
- The coarse outcome is stored through the **existing `rhythm` event** (`setRhythm`),
  not a new event kind: no `schemaVersion` bump, no change to `derive.ts`, and the
  summary 心律 cell shows 可電擊 / 不可電擊 via the existing `label.split(' ')[0]` logic.
- The mode is a **standalone persisted preference** (`ohca.rhythmMode` via `prefStore`),
  separate from the versioned case state, defaulting to 進階 ACLS and surviving a new
  case / case clear (FR-015).

## Consequences

- Single-source-of-truth invariant is preserved (FR-016): AED outcomes are ordinary
  rhythm events; deleting one recomputes initial/last rhythm like any other.
- Clinical guardrail is structurally enforced — the stored value is literally the coarse
  token and is never a specific rhythm key; a unit test asserts no outcome maps to a
  rhythm.
- A new, intentionally tiny `prefStore` is added for device-level UI preferences, kept
  apart from case data so preferences and case lifecycle never entangle. It and
  `caseStore` share one `safeLocalStorage()` helper (`src/persistence/safeStorage.ts`),
  and the canonical mode list lives in `constants.ts` (`RHYTHM_MODES`) so the picker and
  the prefStore validation cannot drift.
- Realizes and supersedes `docs/backlog/aed-simplified-rhythm.md`.

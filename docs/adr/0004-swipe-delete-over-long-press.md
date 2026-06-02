# 4. Swipe-to-reveal delete replaces long-press on timeline entries

Date: 2026-06-03

## Status

Accepted

## Context

Feature 001 deleted a timeline entry with a ~550 ms long-press that armed an inline
delete button. Field feedback (feature 002 input) reported the long-press "feels bad in
the hand": it is timing-sensitive, gives no progressive feedback, and under stress or
with gloves it both mis-fires (accidental arming) and mis-misses (no arming). The
deletion path is safety-relevant — it corrects mis-taps during a live resuscitation —
so the gesture must be reliable and resistant to accidental deletion.

## Decision

Replace long-press entirely with a **horizontal swipe-to-reveal delete**:

- A horizontal drag past an activation threshold (~42 px) latches the row open,
  revealing a labelled `刪除` button; tapping it deletes. A partial swipe snaps back and
  deletes nothing — a deliberate two-step (swipe, then tap) confirm.
- Direction is locked on the first decisive move (`|dx| > |dy|` → swipe, else vertical
  scroll), so list scrolling never arms a delete.
- At most one row is armed at a time; the parent `Timeline` tracks the open row id and
  closes any other when a new one opens.
- The gesture is built from Pointer Events on the row (no new dependency); the delete
  button meets the glove-friendly touch floor (ADR-aligned with FR-006).
- The long-press code is removed completely — there is no second deletion path.

## Consequences

- More reliable, progressively-feedbacked deletion with a built-in confirm step; lower
  accidental-deletion risk than the timing-based long-press.
- jsdom lacks `PointerEvent` and pointer capture, so the test harness (`tests/setup.ts`)
  polyfills a `PointerEvent` (MouseEvent subclass carrying coordinates) and no-op pointer
  capture; without this, swipe gesture math (`dx`/`dy`) cannot be exercised in tests.
- Existing long-press tests were rewritten to the swipe interaction; no behaviour relies
  on long-press any more.
- Single deletion path keeps the interaction model consistent (constitution III).

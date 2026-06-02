# Feature Specification: Tactical HUD OHCA Field Timer

**Feature Branch**: `001-tactical-hud-timer`

**Created**: 2026-06-02

**Status**: Draft

**Input**: User description: "Implement the 'A · 戰術儀表板 Tactical HUD' design as a PWA app interface and functionality for the OHCA field timer. Design handoff bundle from Claude Design (variant-tactical + ohca-core). Project reference source: https://script.google.com/macros/s/AKfycbwdYkmDgaPUC-HkIdqI1bv-h1_kLBe1OAZuzQNoVGEf-x0rPuONakkQ2P07CnhTw_hs/exec"

## Clarifications

### Session 2026-06-02

- Q: When does the master elapsed clock start counting? → A: It auto-starts the
  moment the app is opened, and the rescuer can adjust/correct the start time
  afterward (e.g., to backfill the actual time of arrest).
- Q: When ROSC or hospital arrival is marked, does the master elapsed clock stop?
  → A: No — the clock keeps running; milestones are recorded as timeline events
  and change the status indicator only.
- Q: How long is an in-progress case retained on the device? → A: Indefinitely on
  the device until a new case is started or the record is manually cleared.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Track resuscitation elapsed time and CPR cycles (Priority: P1)

A rescuer arrives at an out-of-hospital cardiac arrest. They open the app and an
elapsed-time clock for the case is already running from the moment the app was
opened; if the arrest actually began earlier, they can adjust the start time to
backfill it. They start the CPR 2-minute cycle, and the app counts down each
cycle, visibly warning them as the cycle nears its end so the team can prepare to
switch compressors and re-check the rhythm.

**Why this priority**: The elapsed clock and CPR cycle cue are the irreducible
core of a resuscitation timer — without them the product has no reason to exist.
This story alone is a usable MVP a rescuer could rely on.

**Independent Test**: Open the app, confirm the case clock counts up in real time,
start the CPR cycle, and confirm it counts down from 2:00, warns within the final
15 seconds, and rolls into the next cycle with an incremented cycle number.

**Acceptance Scenarios**:

1. **Given** a new case, **When** the app is opened, **Then** a master elapsed
   clock counts upward in minutes:seconds from the moment of opening and the
   current time-of-day is shown.
2. **Given** a running case, **When** the rescuer adjusts the case start time,
   **Then** the elapsed clock and all event elapsed-offsets recompute against the
   new start time.
3. **Given** an active case, **When** the rescuer starts the CPR cycle, **Then** a
   2-minute countdown begins, shows the current cycle number, and a progress bar
   depletes over the cycle.
4. **Given** an active CPR cycle, **When** 15 seconds or less remain, **Then** the
   app shows a distinct visual warning prompting "prepare to switch / rhythm check".
5. **Given** a running CPR cycle, **When** the countdown reaches zero, **Then** the
   cycle restarts automatically and the cycle counter increments.

---

### User Story 2 - Log time-critical drugs and shocks with interval reminders (Priority: P1)

During the resuscitation the rescuer administers Epinephrine and Amiodarone and
delivers defibrillation shocks. With one tap each, they log a dose or shock. The
app counts down to the next recommended Epinephrine dose (every 3 minutes) and
Amiodarone dose (every 4 minutes), and when a dose becomes due it visibly pulses
to draw attention. Dose and shock counts are always visible.

**Why this priority**: Drug-interval timing and shock counting are the highest-
value clinical decision support the tool provides; mistimed adrenaline is a known
real-world failure mode this directly mitigates.

**Independent Test**: Tap Epinephrine to log a dose, confirm the count increments
and a 3-minute countdown starts; let it reach zero and confirm the tile signals
"due". Tap defibrillation, choose an energy level, and confirm the shock count
increments.

**Acceptance Scenarios**:

1. **Given** no Epinephrine logged, **When** the rescuer taps the Epinephrine
   tile, **Then** the dose count becomes 1 and a 3-minute countdown to the next
   dose begins.
2. **Given** an Epinephrine countdown reaches zero, **When** the dose is due,
   **Then** the tile visibly signals it is due (pulsing / "可給藥") until the next
   dose is logged.
3. **Given** Amiodarone has been logged, **When** the rescuer taps it again,
   **Then** the dose count increments and a 4-minute countdown restarts.
4. **Given** a shock is needed, **When** the rescuer opens the defibrillation
   action and selects an energy level (150/200/250/300/360 J), **Then** a shock is
   recorded with its energy and the shock count increments.

---

### User Story 3 - Record rhythm, airway, IV/IO access, and vital signs (Priority: P2)

The rescuer records the analyzed cardiac rhythm, the airway device placed (with
ETT tube size where relevant), and IV/IO access establishment. They enter vital
signs (blood pressure, heart rate, SpO₂, EtCO₂, temperature) using a large numeric
keypad suited to gloved hands, with mean arterial pressure derived automatically,
and commit the reading with a timestamp.

**Why this priority**: These captures complete the clinical picture and feed the
handover record, but a rescuer can still run the core timer without them, so they
rank below the timing essentials.

**Independent Test**: Record a rhythm from the picker, place an airway device,
mark IV/IO established, enter a blood pressure via the keypad, confirm MAP is
computed, and commit — then confirm each appears in the treatment record.

**Acceptance Scenarios**:

1. **Given** the rhythm action, **When** the rescuer selects a rhythm
   (VF / pVT / PEA / Asystole / ROSC), **Then** it is recorded and shockable
   rhythms are clearly marked.
2. **Given** the airway action, **When** the rescuer selects a device and, for an
   endotracheal tube, a tube size, **Then** the airway placement is recorded.
3. **Given** the vitals area, **When** the rescuer taps a field and enters a value
   on the numeric keypad, **Then** the value is captured; when systolic and
   diastolic are present, the mean arterial pressure is shown automatically.
4. **Given** at least one vital entered, **When** the rescuer commits the reading,
   **Then** a timestamped vitals entry is added to the treatment record.

---

### User Story 4 - Review a live treatment timeline and correct mistakes (Priority: P2)

Every logged action appears in a vertical, reverse-chronological treatment
timeline showing the time of day, the elapsed time into the case, an event type
label/color, and details. Summary counters (shocks, Epinephrine, Amiodarone,
initial rhythm) stay consistent with the timeline. If the rescuer logs something
in error, they can long-press the entry and delete it, and all summary numbers
update accordingly.

**Why this priority**: The timeline turns the timer into a contemporaneous record
and the delete path corrects the inevitable mis-taps under stress; valuable but
dependent on the logging stories above.

**Independent Test**: Log several actions, confirm they appear newest-first with
time-of-day, elapsed offset, and type; long-press an entry, delete it, and confirm
the corresponding summary counter decreases.

**Acceptance Scenarios**:

1. **Given** logged events, **When** viewing the timeline, **Then** entries are
   listed newest-first, each with time-of-day, elapsed offset, type tag, and any
   detail.
2. **Given** summary counters and timeline, **When** any event is present, **Then**
   the counters (shocks, Epi, Amio, initial rhythm) match the timeline contents.
3. **Given** a timeline entry, **When** the rescuer long-presses it and confirms
   delete, **Then** the entry is removed and every derived summary updates.
4. **Given** no events yet, **When** viewing the timeline, **Then** an empty-state
   message is shown.

---

### User Story 5 - Mark case milestones and start a new case (Priority: P2)

The rescuer marks return of spontaneous circulation (ROSC) and hospital arrival as
the case progresses; the overall status indicator reflects ROSC versus ongoing
CPR. When the case ends, they start a new case, which clears the record after
confirmation so the device is ready for the next patient.

**Why this priority**: Milestone marking and case reset make the tool reusable
across patients and close the resuscitation, but follow the primary timing/logging
flows.

**Independent Test**: Tap ROSC and confirm the status switches to ROSC with a
timestamp; tap hospital arrival and confirm it is recorded; tap new case, confirm
the prompt, accept, and confirm the record is cleared and the clock restarts.

**Acceptance Scenarios**:

1. **Given** an ongoing case, **When** the rescuer declares ROSC, **Then** the
   status indicator changes to ROSC, the time is recorded, and a ROSC event is
   added to the timeline.
2. **Given** an ongoing case, **When** the rescuer declares hospital arrival,
   **Then** the arrival is recorded with its time.
3. **Given** any case state, **When** the rescuer chooses new case and confirms,
   **Then** all timers, milestones, and events reset to an empty new case.

---

### User Story 6 - Work fully offline and survive interruption (Priority: P1)

A rescuer works in an area with no network. After the app has been opened once, it
launches and runs entirely offline, installable to the device home screen. If the
screen locks, the app is backgrounded, or it is accidentally reloaded mid-case,
the in-progress case (elapsed time, milestones, and all logged events) is restored
so no resuscitation data is lost.

**Why this priority**: Field use means unreliable or absent connectivity; offline
operation and crash/reload recovery are core to the product per its purpose, not
enhancements.

**Independent Test**: Load the app once, disable the network, fully reload, and
confirm it still launches and functions; log events, reload mid-case, and confirm
the case state and timeline are restored.

**Acceptance Scenarios**:

1. **Given** the app has been opened once, **When** the device has no network,
   **Then** the app still launches and all features work.
2. **Given** the app meets install criteria, **When** the user chooses to install
   it, **Then** it can be added to the home screen and launched as a standalone app.
3. **Given** an in-progress case, **When** the app is reloaded or relaunched,
   **Then** the elapsed time, milestones, and logged events are restored.

---

### Edge Cases

- A drug is administered before its interval elapses → logging is always allowed;
  the count increments and the countdown restarts from the new dose (the countdown
  is a reminder, never a lock).
- Vitals entered with only one of systolic/diastolic → the entry is accepted and
  mean arterial pressure is simply not shown.
- The case runs past 60 minutes → the elapsed clock extends to hours:minutes:seconds
  without breaking layout.
- Deleting the only/earliest rhythm event → the "initial rhythm" summary
  recalculates from the remaining rhythm events or returns to unknown.
- Rapid repeated taps on an action under stress → each tap is recorded distinctly
  and counts remain accurate.
- Long-press started but released early → no delete is triggered.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The app MUST display a master elapsed clock for the active case that
  advances in real time and is shown in minutes:seconds, extending to hours when
  the case exceeds 60 minutes, alongside the current time of day. The clock MUST
  auto-start when the app is opened, and the rescuer MUST be able to adjust the
  case start time; when adjusted, the elapsed clock and all event elapsed-offsets
  recompute against the new start time.
- **FR-002**: The app MUST provide a CPR cycle timer that counts down a 2-minute
  compression cycle, displays the current cycle number, shows progress, warns
  within the final 15 seconds, and automatically rolls into the next cycle.
- **FR-003**: The app MUST let the rescuer log an Epinephrine dose in one action,
  maintain a running dose count, count down 3 minutes to the next dose, and signal
  when a dose is due.
- **FR-004**: The app MUST let the rescuer log an Amiodarone dose in one action,
  maintain a running dose count, and count down 4 minutes to the next dose.
- **FR-005**: The app MUST let the rescuer record a defibrillation shock with a
  selectable energy level (150, 200, 250, 300, 360 J) and maintain a shock count.
- **FR-006**: The app MUST let the rescuer mark IV/IO access as established.
- **FR-007**: The app MUST let the rescuer record the analyzed cardiac rhythm
  (VF, pVT, PEA, Asystole, ROSC), clearly mark which rhythms are shockable, and
  track the initial (earliest) rhythm and the latest rhythm.
- **FR-008**: The app MUST let the rescuer record an airway device (none, OPA,
  supraglottic i-gel, endotracheal tube) and, for an endotracheal tube, a tube
  size (6.5, 7.0, 7.5, 8.0).
- **FR-009**: The app MUST let the rescuer enter vital signs — systolic and
  diastolic blood pressure, heart rate, SpO₂, EtCO₂, and temperature — using a
  large numeric keypad suited to gloved hands, and MUST derive and display mean
  arterial pressure when both blood-pressure values are present.
- **FR-010**: The app MUST allow an optional free-text ECG/4-lead note with a
  vitals entry and MUST commit vitals as a single timestamped record.
- **FR-011**: The app MUST present a treatment summary of key counters (shocks,
  Epinephrine doses, Amiodarone doses, initial rhythm) derived from logged events.
- **FR-012**: The app MUST present a vertical, reverse-chronological treatment
  timeline where each entry shows time of day, elapsed offset into the case, an
  event type indicator, and any detail.
- **FR-013**: The app MUST let the rescuer delete any timeline entry via a
  deliberate long-press gesture, and MUST keep all derived summaries consistent
  after deletion.
- **FR-014**: The app MUST let the rescuer declare ROSC and hospital arrival, each
  recorded with its time, and MUST reflect ROSC versus ongoing-CPR in the overall
  status indicator. Declaring ROSC or hospital arrival MUST NOT stop the master
  elapsed clock, which continues running.
- **FR-015**: The app MUST let the rescuer start a new case, which, after explicit
  confirmation, clears all timers, milestones, and events.
- **FR-016**: All summary values MUST be derived from the single record of logged
  events so that any addition or deletion updates the entire interface consistently.
- **FR-017**: The app MUST offer a day/night (light/dark) display mode toggle and
  default to the dark "command center" presentation.
- **FR-018**: The interface MUST follow the Tactical HUD visual design — high
  contrast, large glanceable mono-numeral timers, semantic per-action colors
  (Epinephrine red, Amiodarone teal, defibrillation orange, IV/IO amber, rhythm
  indigo, airway purple, ROSC green, arrival deep-red), and large touch targets.
- **FR-019**: The app MUST function fully offline after first load and MUST be
  installable to the device home screen as a standalone app.
- **FR-020**: The app MUST persist the in-progress case locally and restore it
  after reload, background, or relaunch with no loss of logged data. The case MUST
  be retained on the device indefinitely until a new case is started or the record
  is manually cleared.
- **FR-021**: All user-facing interface text MUST be presented in Traditional
  Chinese (zh-Hant), consistent with the reference design.

### Key Entities _(include if feature involves data)_

- **Case**: A single resuscitation episode — its start time, ROSC time (if any),
  hospital-arrival time (if any), CPR cycle state, and its collection of events.
- **Event**: A single logged action on the timeline — its timestamp, type (drug,
  shock, rhythm, airway, IV/IO, vitals, ROSC, arrival, note), a human-readable
  label, and type-specific detail (e.g., dose number, energy level, rhythm name,
  airway device/size, vitals values).
- **Vitals reading**: A timestamped set of measured values — systolic/diastolic
  blood pressure, derived mean arterial pressure, heart rate, SpO₂, EtCO₂,
  temperature, and an optional ECG note.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A rescuer can open the app and have a running case clock visible in
  under 2 seconds from launch, with no setup steps required.
- **SC-002**: A rescuer can log any single action (drug dose, shock, IV/IO, rhythm,
  airway, or a milestone) in a single tap, or in no more than two taps where a
  choice is required.
- **SC-003**: A rescuer can enter and commit a full blood-pressure reading in under
  15 seconds using the numeric keypad.
- **SC-004**: 100% of logged actions appear on the treatment timeline immediately,
  and every summary counter always matches the timeline contents.
- **SC-005**: When a dose interval elapses, the corresponding reminder becomes
  visible within 1 second of the interval expiring.
- **SC-006**: After first load, the app launches and operates with the network
  fully disabled in 100% of attempts.
- **SC-007**: After an accidental reload mid-case, the case state and all logged
  events are restored in 100% of attempts with zero data loss.
- **SC-008**: Core timer and counter displays remain visibly responsive (no stutter
  or drift perceptible to the user) throughout a continuous 60-minute case.

## Assumptions

- The chosen design is **Direction A · Tactical HUD** only; the other explored
  directions (Clinical Cards, Timeline-first) are out of scope for this feature.
- The Google Apps Script URL is provided as a **functional reference** for the
  original tool's behavior, not as a backend to integrate with. The app is a
  standalone, offline-first client with no server dependency in this feature.
- Local persistence uses on-device storage only; no patient data leaves the device
  and there is no account, login, or cloud sync in this feature. The in-progress
  case is retained indefinitely until a new case is started or manually cleared
  (see FR-020); clearing is the rescuer's responsibility for on-device privacy.
- Handover export (PDF/CSV), multi-case history, and advanced step-by-step ACLS
  algorithm guidance are explicitly **out of scope** for this feature and may be
  proposed as follow-up work.
- Drug intervals (Epinephrine 3 min, Amiodarone 4 min) and the CPR cycle length
  (2 min) follow the reference design's defaults and are not user-configurable in
  this feature.
- A single active case at a time is sufficient; there is no concurrent multi-case
  requirement.
- The primary form factor is a mobile phone held single-handed; the layout is
  responsive but optimized for phone use in the field.
- Clinical accuracy of intervals and rhythms follows the reference design; this
  feature does not introduce new clinical protocol decisions.

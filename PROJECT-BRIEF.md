# 401 Dashboard — Project Brief

*A field-first construction dashboard for the site foreman. This document is the
spec. Read it before building. Hand it to Claude Code as the starting context.*

---

## What this is (in one line)

A dashboard the **site foreman** actually wants to open — a whole-project,
capture-first tool that tracks progress, deficiencies, delays, attendance and
issues across the entire build, and drafts the emails/reports that come out of them.

## Who it's for (this is the whole strategy)

- **Primary user & buyer: the foreman**, not the company. The incumbents
  (Procore, Buildertrend, Fieldwire, etc.) are built for the *office* and merely
  endured by the field. This is built for the person in muddy boots.
- The win condition is: a foreman uses it voluntarily and tells his employer
  "pay the $15/month, this is invaluable to how I work."
- **The office gets a read-only window** into what the foreman captured — a
  daily snapshot of progress. The office *sees*, it does not *drive*. Never let
  this drift into a second product the office configures.

## The one idea everything hangs on: the shared spine

There is **one underlying data object — an "event."** A deficiency on a grid
cell, a "come to unit 403" capture, a logged delay, an attendance count — these
are the SAME object with different fields (location, timestamp, who, notes,
photos, flag, status). Every screen is a different *lens* on that one event log.
This is what keeps it one tool instead of eight modules. Build the event model
first; everything else is a view.

## Core design principles (do not violate)

1. **Capture-first.** The app opens ready to answer "what's happening on site?"
   — not on a spreadsheet grid. The fastest action (Quick Capture) is one tap:
   auto-stamps date/time, pick location, tag trade, notes + photos, optional flag.
   Must be usable one-handed, standing up, in bad light, in ~15 seconds.
2. **Graceful degradation.** Works with zero input; every document uploaded makes
   it smarter. Never a wall that says "you must upload X to continue."
3. **Easy enough for the reluctant/older/non-tech foreman.** This is THE edge.
   Simplicity beats features. If a 55-year-old who hates software can't use it
   cold, it has failed, regardless of what it can do.
4. **Single-player now, multiplayer later.** Everything works for one user (you)
   first. Features that need OTHER people entering/trusting data (e.g. another
   foreman marking your item complete) are a deliberate later phase.
5. **Draft, don't auto-send.** The app drafts emails/reports; the human hits send.

## Structure of a project (the data model)

- **Project → Floors → Units + Common areas.** Track at UNIT level, not
  room-within-unit (room-level drowns the user). Common areas are treated like
  units on their floor but get a shorter/different stage set.
- A **setup interview** generates this structure from a few questions
  (commercial/residential/mixed, new-build/reno, how the site is divided,
  which trades, current phase). Keep it to ~5 questions, then let the user edit.
- **Document intake (optional, accelerates setup):**
  - Floor plans → auto-extract unit list, types, areas, common areas.
  - Trades list / contacts → populate trade tags + notify recipients.
  - Schedule → seeds phases/milestones AND becomes the slippage layer (below).
  - Always "app proposes → user confirms," never silent auto-import.

## The checklist / progress tracker

- Columns = **stages** in build sequence. Rows = units + common areas.
- 4 states per cell: **Complete / In progress / Not started / Deficiency**
  (matches the colour system the foreman already uses).
- **Deficiency detail (note + photo) attaches to the CELL** — this is the key
  fix over the Excel, which forced a separate Notes tab nobody kept up.
- The **checklist is phased across the whole project life** (foundation →
  structure → envelope → rough-ins → finishing). **Completed phases collapse**
  to a single summary row so the user never scrolls past 100 done items to reach
  today's work.
- The default stage template is editable — add/delete rows that don't apply.
  (The finishing template below is real, battle-tested from 401.)

## The flag mechanism (system-wide)

One action, many uses. Anything in the app can be flagged, with a target:
**Next meeting / Follow up / Waiting on architect / Back-charge.** Flags collect
into one place (and "next meeting" assembles a meeting agenda). Nothing gets
buried.

## Delays & the schedule/slippage layer

- Logging a delay asks **severity**, which decides what the app does:
  - **Absorbed** (extra hours, no schedule hit) → logs to a cost/back-charge
    trail, no notifications. (Protects against buried invoice hours.)
  - **Contained** (one unit, worked around) → a flag with a follow-up trigger.
  - **Propagating** (downstream trades need to know) → surfaces affected trades
    to notify.
- **The schedule is a persistent layer**, seeded by upload, re-uploadable as it's
  revised, with version-to-version drift visible.
- Delays log against schedule items, accumulating a **cause-tagged slippage
  history** — the "why it slipped," which is the foreman's real leverage in
  disputes. The human supplies the *why*; the app supplies memory + date math.
  Do NOT attempt automatic critical-path recalculation (that's Primavera; it's
  wrong often enough to lose trust).

## Email drafts (the "process later" output)

- Any captured event → **draft an email** (don't send).
- Subject format: `PROJECT · Unité XXX · Trade` (e.g. `401DS · Unité 614 · Électricien`).
- Body = the note text + timestamp + location. Photos attached.
- Recipient left to the user (usually the trade foreman involved).
- On a real device this hands off to the phone's mail composer, pre-filled.

## Other captured features to keep in scope

- **Attendance / daily report:** capture headcount + activity per trade on the
  walkthrough, transmit to the office/Stack later.
- **Delivery board:** lighter priority, but in — replaces the physical whiteboard.

## Build order (recommended)

1. The event model + capture-first home + Quick Capture. (The spine.)
2. Progress grid (phased, collapsible) with 4-state cells + cell-level deficiency.
3. Flags + email drafts.
4. Attendance, delays w/ severity.
5. Schedule layer + slippage history.
6. Persistence (data survives, accounts/login), real photo storage.
7. Office read-only snapshot view.
8. (Later) Multiplayer.

## What "winning" actually requires (the real test)

Not feature-completeness. The milestone that matters: **one foreman who is NOT
you uses an early version unprompted and doesn't want to give it back.** Build
toward that. It tests the two unproven beliefs the whole business rests on:
(a) it's genuinely easier to use, and (b) a foreman will push his company to pay.

## Tech notes for the build

- The existing prototype (`401-dashboard.html`) is a single self-contained HTML
  file — good for feeling the loop, but it does NOT persist data, has no accounts,
  and can't store real photos. The real build needs a proper stack with a database
  and real file/photo storage. Ask Claude Code to recommend the simplest stack
  that a non-developer can maintain, and to explain choices in plain language.
- Real 401 data (floors, units, types, and the 28-stage finishing template) is
  embedded in the prototype — reuse it as seed/example data.

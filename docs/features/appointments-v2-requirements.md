# Appointments V2: The Specialist's Daily Companion

> **Vision:** Transform the appointments page from a schedule viewer into a daily companion that anticipates the specialist's needs throughout their working day.

**Target User:** Solo beauty specialist (barber, nail technician, hairstylist) working independently in Ukraine.

**Analysis Date:** January 2026
**Status:** Requirements Definition

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [User Journey Map](#user-journey-map)
4. [Phase 1: Quick Day Setup](#phase-1-quick-day-setup)
5. [Phase 2: Visual Timeline](#phase-2-visual-timeline)
6. [Phase 3: Quick Actions](#phase-3-quick-actions)
7. [Phase 4: Client Intelligence](#phase-4-client-intelligence)
8. [Technical Considerations](#technical-considerations)
9. [Success Metrics](#success-metrics)

---

## Executive Summary

### The Problem

Solo specialists in Ukraine face daily friction when managing their appointments:

1. **Morning Setup Pain** - Every unconfigured day requires multiple form interactions
2. **"Can you fit me in?" Problem** - Cannot quickly identify free slots for walk-ins
3. **Break Management** - Too many taps to take a spontaneous break
4. **Missing Context** - No visibility into client history when they arrive

### The Solution

A four-phase improvement plan that transforms appointments into the specialist's daily companion:

| Phase | Feature | Impact | Effort |
|-------|---------|--------|--------|
| 1 | Quick Day Setup | High | Medium |
| 2 | Visual Timeline | High | High |
| 3 | Quick Actions | Medium | Low |
| 4 | Client Intelligence | Medium | Medium |

### Priority Rationale

```
Daily Friction × Frequency = Priority Score

Quick Day Setup:      High friction × 1/day = CRITICAL (daily blocker)
Visual Timeline:      High friction × 10-20/day = CRITICAL (revenue impact)
Quick Actions:        Med friction × 2-5/day = IMPORTANT
Client Intelligence:  Low friction × per-apt = NICE-TO-HAVE
```

---

## Current State Analysis

### What Works Well

| Feature | Assessment |
|---------|------------|
| Status Banner with countdown | Excellent - "27 min left" is exactly what specialists need |
| Pending as "wants to book" | Good UX - clear Confirm/Decline actions |
| Create Schedule Wizard | Solid - 3-step process covers bulk setup |
| Per-weekday hours | Correct - specialists work different hours on different days |
| Day Actions Menu | Good - Edit hours, Add break, Remove day in one place |
| Breaks inline in list | Right approach - breaks are part of the day |
| End break early | Smart feature for spontaneous schedule changes |

### What Needs Improvement

| Issue | Current State | Impact |
|-------|--------------|--------|
| Day setup friction | Form with multiple dropdowns | Users may abandon |
| No visual timeline | List view only | Cannot spot free slots |
| Hidden earnings | `hideStats={true}` in code | Missing motivation |
| No client context | Just name shown | Poor service quality |
| Walk-in is TODO | `onAddWalkIn={() => {/* TODO */}}` | Lost revenue |
| Break requires menu | Menu → Dialog → Form | Too slow |

### Code References

Key files in current implementation:
- `app/[nickname]/appointments/page.tsx` - Main page with stats calculation
- `app/[nickname]/appointments/_components/schedule-view.tsx` - 815-line orchestrator
- `app/[nickname]/appointments/_components/configure-working-day.tsx` - Day setup form
- `app/[nickname]/appointments/_components/create-schedule/` - Bulk wizard
- `app/[nickname]/appointments/_components/status-banner.tsx` - Current state display
- `app/[nickname]/appointments/_components/day-stats-header.tsx` - Date navigation

---

## User Journey Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SOLO SPECIALIST'S DAILY JOURNEY                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  07:30  WAKE UP                                                         │
│         └─> Check phone: "Do I have appointments today?"                │
│             └─> NEED: Quick glance at today's schedule                  │
│                                                                         │
│  08:45  ARRIVE AT WORK                                                  │
│         └─> "Let me set up my day"                                      │
│             └─> FRICTION: Current flow requires multiple dropdowns      │
│             └─> WANT: One tap "My usual schedule"                       │
│                                                                         │
│  09:00  FIRST CLIENT                                                    │
│         └─> "Is this Михайло a new client?"                             │
│             └─> FRICTION: No context visible                            │
│             └─> WANT: Badge showing "First visit" or "VIP"              │
│                                                                         │
│  10:30  PHONE RINGS                                                     │
│         └─> "Ти можеш мене взяти сьогодні?"                             │
│             └─> FRICTION: Must scroll list, calculate mentally          │
│             └─> WANT: Visual timeline with FREE slots highlighted       │
│                                                                         │
│  12:15  HUNGRY                                                          │
│         └─> "I need 30 min for lunch"                                   │
│             └─> FRICTION: Menu → Add Break → Select times → Submit      │
│             └─> WANT: One tap "Take break" button                       │
│                                                                         │
│  14:00  WALK-IN CLIENT                                                  │
│         └─> "Can you fit me in?"                                        │
│             └─> FRICTION: No way to add walk-in                         │
│             └─> WANT: Tap free slot → Quick add form                    │
│                                                                         │
│  18:30  END OF DAY                                                      │
│         └─> "How much did I earn today?"                                │
│             └─> FRICTION: Stats hidden                                  │
│             └─> WANT: Always visible "Today: ₴3,500"                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Quick Day Setup

### Goal

Reduce morning setup from 30+ seconds with multiple taps to **one tap** for common scenarios.

### User Stories

```gherkin
AS A solo specialist
I WANT to start my working day with one tap
SO THAT I can focus on clients, not app configuration

AS A solo specialist
I WANT the app to remember my usual schedule
SO THAT I don't configure the same hours every day

AS A solo specialist
I WANT quick presets for common scenarios
SO THAT I can handle "short day" or "long day" without manual input
```

### Design Specification

#### State: Day Not Configured

When specialist opens a day that has no working hours configured:

```
┌─────────────────────────────────────────────────────────────────┐
│  Today                                              < >  [...]  │
│  Wednesday                                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  🌅  Start Your Working Day                               │  │
│  │                                                           │  │
│  │  Choose your schedule for today:                          │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  ⭐ My usual schedule                               │  │  │
│  │  │     09:00 – 18:00 with lunch break                  │  │  │
│  │  │                                         [Start] ←───┼──┼──── PRIMARY ACTION
│  │  └─────────────────────────────────────────────────────┘  │  │
│  │                                                           │  │
│  │  Quick options:                                           │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │  │
│  │  │ Short day    │ │ Long day     │ │ Half day     │       │  │
│  │  │ 09:00-14:00  │ │ 09:00-21:00  │ │ 14:00-18:00  │       │  │
│  │  └──────────────┘ └──────────────┘ └──────────────┘       │  │
│  │                                                           │  │
│  │  ─────────────────────────────────────────────────────    │  │
│  │                                                           │  │
│  │  [Custom hours...]                                        │  │
│  │  [Create weekly schedule...]                              │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### "My Usual Schedule" Logic

The system learns the specialist's pattern:

```typescript
interface SchedulePreset {
  id: string;
  name: string;
  startTime: string;      // "09:00"
  endTime: string;        // "18:00"
  breaks: Array<{
    startTime: string;
    endTime: string;
  }>;
  usageCount: number;     // Track how often used
  lastUsed: Date;
}

// Algorithm to determine "My usual schedule":
// 1. Look at last 30 days of working days
// 2. Find most common (startTime, endTime) combination
// 3. If no history, default to 09:00-18:00 with 12:00-13:00 break
```

#### Quick Presets

Pre-defined options that specialists can customize:

| Preset | Default Hours | Default Break | Customizable |
|--------|--------------|---------------|--------------|
| Short day | 09:00-14:00 | None | Yes |
| Long day | 09:00-21:00 | 13:00-14:00 | Yes |
| Half day AM | 09:00-13:00 | None | Yes |
| Half day PM | 14:00-20:00 | None | Yes |

#### Interaction Flow

```
User taps "My usual schedule" [Start]
    │
    ├─> Optimistic UI: Immediately show schedule view
    │
    ├─> Background: createWorkingDay() with preset values
    │
    └─> If error: Show toast, revert to setup screen
```

### Acceptance Criteria

- [ ] One-tap setup for "usual schedule" completes in < 500ms perceived time
- [ ] System remembers last 3 unique schedule patterns
- [ ] Quick presets are tappable without scrolling on mobile
- [ ] Custom hours expands to current `ConfigureWorkingDay` form
- [ ] "Create weekly schedule" opens existing wizard
- [ ] Works offline (queues action for sync)

### Technical Notes

**New Components:**
- `QuickDaySetup` - Replaces `ConfigureWorkingDay` as default
- `SchedulePresetCard` - Reusable preset display

**Database Changes:**
- New table: `specialist_schedule_presets` or store in `beauty_page` JSON column
- Track usage patterns for "My usual schedule" inference

**State Management:**
- Use optimistic updates for instant feedback
- Queue actions for offline support

---

## Phase 2: Visual Timeline

### Goal

Transform the list view into a visual timeline where free slots are **instantly visible**.

### User Stories

```gherkin
AS A solo specialist
I WANT to see my day as a visual timeline
SO THAT I can instantly identify free slots

AS A solo specialist
I WANT free slots to be visually prominent
SO THAT I can quickly answer "can you fit me in?"

AS A solo specialist
I WANT to tap a free slot to add a walk-in
SO THAT I can book clients without navigating away
```

### Design Specification

#### Timeline View (Primary)

```
┌─────────────────────────────────────────────────────────────────┐
│  Today                                              < >  [...]  │
│  Wednesday · 09:00–18:00 · ₴2,450 expected                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ NOW ────────────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  [M] Михайло Ткаченко              27 min left     →     │   │
│  │      Haircut · 18:00-19:00 · ₴350                        │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─ TIMELINE ───────────────────────────────────────────────┐   │
│  │                                                          │   │
│  │  09:00  ████████████████████████  Олександр (Haircut)    │   │
│  │         └─ Completed · ₴350                              │   │
│  │                                                          │   │
│  │  10:00  ░░░░░░░░░░░░░░░░░░░░░░░░  FREE (1h)        [+]   │   │
│  │                                                          │   │
│  │  11:00  ████████████████████████  Максим (Beard Trim)    │   │
│  │         └─ Completed · ₴200                              │   │
│  │                                                          │   │
│  │  12:00  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  Break                  │   │
│  │                                                          │   │
│  │  13:00  ░░░░░░░░░░░░░░░░░░░░░░░░  FREE (2h)        [+]   │   │
│  │  14:00  ░░░░░░░░░░░░░░░░░░░░░░░░  ↑                      │   │
│  │                                                          │   │
│  │  15:00  ████████████████████████  Андрій (Haircut+Beard) │   │
│  │         └─ Confirmed · ₴450                              │   │
│  │                                                          │   │
│  │  16:00  ████████████████████████  Дмитро (Haircut)       │   │
│  │         └─ Confirmed · ₴350                              │   │
│  │                                                          │   │
│  │  17:00  ░░░░░░░░░░░░░░░░░░░░░░░░  FREE (1h)        [+]   │   │
│  │                                                          │   │
│  │  18:00  ████████████████████████  Михайло ← CURRENT      │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Today's earnings: ₴900 completed · ₴1,550 upcoming             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Visual Language

| State | Visual | Color |
|-------|--------|-------|
| Appointment (confirmed) | `████` Solid block | Default foreground |
| Appointment (pending) | `░▒░▒` Dashed border | Muted |
| Break | `▓▓▓▓` Hatched pattern | Amber |
| Free slot | `░░░░` Light/dotted | Green accent |
| Current | Highlighted border | Accent color |
| Completed | Reduced opacity | Muted |

#### Free Slot Interaction

Tapping `[+]` on a free slot opens quick add:

```
┌─────────────────────────────────────────────────────────────────┐
│  Quick Add · 13:00                                        ✕     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Client name                                                    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Service                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Haircut                                             ▼  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
│  Duration: 1h · Price: ₴350                                     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Add appointment                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Toggle: List vs Timeline

Some users may prefer the current list view. Provide toggle:

```
┌────────────────────┐
│  [Timeline] [List] │  ← Segmented control in header
└────────────────────┘
```

### Slot Calculation Algorithm

```typescript
interface TimeSlot {
  startTime: string;      // "13:00"
  endTime: string;        // "15:00"
  type: 'appointment' | 'break' | 'free';
  data?: Appointment | Break;
  durationMinutes: number;
}

function calculateTimeSlots(
  workingDay: WorkingDay,
  appointments: Appointment[],
  breaks: Break[]
): TimeSlot[] {
  // 1. Create timeline from workingDay.startTime to workingDay.endTime
  // 2. Mark all appointments and breaks
  // 3. Remaining gaps = free slots
  // 4. Merge consecutive free slots
  // 5. Return ordered array
}
```

### Acceptance Criteria

- [ ] Timeline renders within 100ms for a day with 10 appointments
- [ ] Free slots are visually distinct and tappable
- [ ] Tapping free slot opens quick add dialog
- [ ] Current appointment/break highlighted
- [ ] Earnings summary visible at bottom
- [ ] Toggle between Timeline and List views
- [ ] Works on mobile (vertical scroll, no horizontal timeline)

### Technical Notes

**New Components:**
- `TimelineView` - Main timeline container
- `TimeSlot` - Individual slot (appointment/break/free)
- `QuickAddDialog` - Walk-in booking form
- `ViewToggle` - List/Timeline switch

**Performance:**
- Virtualize timeline for days with many appointments
- Memoize slot calculations (React Compiler handles this)

---

## Phase 3: Quick Actions

### Goal

Reduce friction for frequent in-day actions to **one tap**.

### Quick Break

#### Current Flow (Too Slow)
```
Menu → "Add break" → Dialog → Select start → Select end → Submit
```

#### New Flow (One Tap)
```
[☕ Take 15 min] → Done
```

#### Design

Floating action button or always-visible button:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ... timeline content ...                                       │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ☕  Take break                               [15m] [30m] │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Behavior

```typescript
function takeQuickBreak(minutes: number) {
  const now = getCurrentTime();
  const endTime = addMinutes(now, minutes);

  // Create break starting NOW
  await createBreak({
    startTime: formatTime(now),
    endTime: formatTime(endTime),
    // ...
  });

  // UI immediately shows "On Break" banner
}
```

### Earnings Visibility

**Change:** Remove `hideStats={true}` and show earnings prominently.

```typescript
// In DayStatsHeader
<p className="text-sm text-muted">
  {completedEarnings > 0 && `₴${completedEarnings} earned · `}
  {upcomingEarnings > 0 && `₴${upcomingEarnings} expected`}
</p>
```

### Acceptance Criteria

- [ ] Quick break button always visible (not in menu)
- [ ] One tap starts break immediately
- [ ] Choice of 15min or 30min (most common)
- [ ] Custom duration available via long-press or menu
- [ ] Earnings visible in header at all times
- [ ] Separate "earned" vs "expected" amounts

---

## Phase 4: Client Intelligence

### Goal

Give specialists context about their clients before they arrive.

### Client Badges

Visual indicators on appointment cards:

| Badge | Criteria | Icon | Color |
|-------|----------|------|-------|
| First visit | `totalVisits === 0` | 🆕 | Blue |
| Regular | `totalVisits >= 5` | ✓ | Default |
| VIP | `totalVisits >= 20` | ⭐ | Gold |
| Cancelled before | `cancellationCount > 0` | ⚠️ | Yellow |
| No-show history | `noShowCount > 0` | 🚫 | Red |

#### Design on Appointment Card

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  15:00  [A] Андрій Шевченко                    [🆕 First]  →    │
│             Haircut + Beard · ₴450                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  16:00  [М] Максим Коваленко                   [⭐ VIP]    →    │
│             Beard Trim · ₴200                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Data Requirements

Need to track per client:

```typescript
interface ClientStats {
  clientId: string;
  beautyPageId: string;
  totalVisits: number;
  completedVisits: number;
  cancelledVisits: number;
  noShowVisits: number;
  totalSpentCents: number;
  lastVisitDate: string | null;
  firstVisitDate: string;
  // Computed
  isFirstVisit: boolean;
  isVIP: boolean;
  hasIssueHistory: boolean;
}
```

### Database Changes

Option A: Compute on-the-fly from appointments table
```sql
SELECT
  client_id,
  COUNT(*) as total_visits,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_visits,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_visits,
  COUNT(*) FILTER (WHERE status = 'no_show') as no_show_visits,
  SUM(service_price_cents) FILTER (WHERE status = 'completed') as total_spent
FROM appointments
WHERE beauty_page_id = $1
GROUP BY client_id
```

Option B: Materialized view or separate stats table (better for performance)

### Acceptance Criteria

- [ ] First-visit badge visible without expanding card
- [ ] VIP badge for clients with 20+ visits
- [ ] Warning badge for clients with cancellation history
- [ ] Badges don't clutter the UI (max 1-2 visible)
- [ ] Full client history accessible in appointment detail

---

## Technical Considerations

### Component Architecture

```
app/[nickname]/appointments/
├── page.tsx                          # Server component, data fetching
├── _components/
│   ├── schedule-view.tsx             # Main orchestrator (refactor)
│   ├── quick-day-setup/              # Phase 1
│   │   ├── quick-day-setup.tsx
│   │   ├── preset-card.tsx
│   │   └── use-schedule-presets.ts
│   ├── timeline/                     # Phase 2
│   │   ├── timeline-view.tsx
│   │   ├── time-slot.tsx
│   │   ├── free-slot.tsx
│   │   └── quick-add-dialog.tsx
│   ├── quick-actions/                # Phase 3
│   │   ├── quick-break-bar.tsx
│   │   └── earnings-display.tsx
│   ├── client-badges/                # Phase 4
│   │   └── client-badge.tsx
│   └── ... existing components
```

### State Management

Current approach uses:
- URL params for filter state (`?status=live`)
- `useOptimistic` for instant chip switching
- Server actions for mutations

Recommendations:
- Continue URL-based state for shareable/bookmarkable views
- Add optimistic updates for quick break
- Consider React Query for client stats caching (Phase 4)

### Performance

- **Timeline rendering:** Use CSS Grid for slot layout, not JavaScript calculations
- **Free slot calculation:** Memoize in server component, pass as prop
- **Client stats:** Prefetch with appointment data, not separate request

### Accessibility

- Timeline must be keyboard navigable
- Free slots need proper ARIA labels: "Free slot from 13:00 to 15:00, tap to add appointment"
- Quick break button needs proper focus states

### Internationalization

Current: Using `next-intl` with `useTranslations("schedule")`

New keys needed:
```json
{
  "schedule": {
    "quick_setup": {
      "title": "Start Your Working Day",
      "usual_schedule": "My usual schedule",
      "short_day": "Short day",
      "long_day": "Long day",
      "half_day": "Half day"
    },
    "timeline": {
      "free_slot": "Free",
      "add_walkin": "Add appointment"
    },
    "quick_break": {
      "take_break": "Take break",
      "minutes": "{count} min"
    },
    "client_badges": {
      "first_visit": "First visit",
      "vip": "VIP",
      "cancelled_before": "Cancelled before"
    }
  }
}
```

---

## Success Metrics

### Phase 1: Quick Day Setup

| Metric | Current | Target |
|--------|---------|--------|
| Time to start day | ~30s | < 3s |
| Taps to start day | 5+ | 1 |
| Setup abandonment | Unknown | < 5% |

### Phase 2: Visual Timeline

| Metric | Current | Target |
|--------|---------|--------|
| Time to identify free slot | ~10s (scroll + calculate) | < 2s (visual scan) |
| Walk-in booking capability | None | Supported |
| "Can you fit me in?" answer time | ~15s | < 3s |

### Phase 3: Quick Actions

| Metric | Current | Target |
|--------|---------|--------|
| Taps to take break | 4+ | 1 |
| Earnings visibility | Hidden | Always visible |

### Phase 4: Client Intelligence

| Metric | Current | Target |
|--------|---------|--------|
| Client context visible | None | Badge on card |
| Time to check client history | Navigate to detail | Instant badge |

---

## Implementation Roadmap

```
Week 1-2: Phase 1 - Quick Day Setup
├── Day 1-2: Design review and component structure
├── Day 3-5: QuickDaySetup component implementation
├── Day 6-7: Preset storage and "usual schedule" logic
├── Day 8-9: Testing and polish
└── Day 10: Release

Week 3-4: Phase 2 - Visual Timeline
├── Day 1-3: TimelineView component
├── Day 4-5: Free slot calculation and display
├── Day 6-7: QuickAddDialog for walk-ins
├── Day 8-9: List/Timeline toggle
└── Day 10: Release

Week 5: Phase 3 - Quick Actions
├── Day 1-2: Quick break bar
├── Day 3: Earnings visibility
├── Day 4-5: Testing and polish
└── Release

Week 6-7: Phase 4 - Client Intelligence
├── Day 1-3: Database queries / views
├── Day 4-5: ClientBadge component
├── Day 6-7: Integration and testing
└── Release
```

---

## Open Questions

1. **Preset storage:** Store in `beauty_page` JSON column or separate table?
2. **Timeline granularity:** 30-min slots or dynamic based on service durations?
3. **Walk-in client:** Create new client record or allow anonymous?
4. **Offline support:** Priority for Phase 1? (queue actions for sync)
5. **Client stats:** Compute on-the-fly or materialized view?

---

## Appendix: Competitor Analysis

### What others do well

- **Booksy:** Visual timeline, easy walk-in booking
- **Fresha:** Smart schedule suggestions based on history
- **Square Appointments:** One-tap quick actions

### What we can do better

- **Ukrainian-first:** Understand local work patterns (irregular hours, cash payments)
- **Solo-specialist focus:** No team complexity, just one person's day
- **Mobile-first:** Most Ukrainian specialists use phone, not desktop

---

*Document created: January 2026*
*Author: Claude (20-year barber consultant perspective)*
*Status: Awaiting review and approval*

# Icelook Refactoring Guide

**PROACTIVELY consult this guide** before making any code changes during refactoring work.

This document outlines a systematic refactoring effort to make the codebase more elegant, cleaner, and maintainable. Work through items **top to bottom**, completing each group before moving to the next.

---

## Key Principles

- **Do NOT create shared abstractions** for similar-looking flows (client vs specialist will diverge)
- **Only share true UI primitives** (buttons, inputs, dialogs)
- **Remove all useMemo/useCallback/React.memo** - React Compiler handles optimization
- **Use Zod for all validation**, react-hook-form for all forms
- **Prefer server components** where possible
- **Remove unused code** aggressively
- **Keep files under 100 lines**

---

## Convention Violations to Fix

These violations should be fixed when refactoring their respective flows:

| File | Violation | Fix |
|------|-----------|-----|
| `app/[nickname]/_components/booking-layout/booking-layout-context.tsx` | useMemo (lines 154, 161, 176, 327) | Remove, let React Compiler handle |
| `app/[nickname]/settings/clients/_components/clients-list.tsx` | useCallback (line 47) | Remove, let React Compiler handle |

---

## Group 1: Booking Flow (FULL REDESIGN)

The booking contexts are overly complex. Redesign with cleaner architecture.

### 1.1 Booking Context Redesign
**Files:**
- `app/[nickname]/_components/booking/booking-context.tsx` (528 lines, 8 useState)
- `app/[nickname]/_components/booking-layout/booking-layout-context.tsx` (419 lines)

**Issues:**
- Duplicate `formatDateToYYYYMMDD` helper in both files
- Excessive useState (8+ calls)
- Mixed concerns (data fetching, UI state, form state)

**Refactoring Tasks:**
1. Extract date utilities to `app/[nickname]/_lib/date-utils.ts`
2. Split booking context into smaller, focused contexts:
   - `BookingStepContext` - step navigation only
   - `BookingDataContext` - working days, time slots cache
   - `BookingFormContext` - form state (use react-hook-form)
3. Remove useMemo violations
4. Each context file should be under 100 lines

### 1.2 Booking Step Components
**Files:**
- `app/[nickname]/_components/booking/step-date.tsx`
- `app/[nickname]/_components/booking/step-time.tsx`
- `app/[nickname]/_components/booking/step-confirmation.tsx` (~400 lines)
- `app/[nickname]/_components/booking/step-success.tsx`

**Refactoring Tasks:**
1. Split `step-confirmation.tsx` into smaller components (>100 lines)
2. Ensure all forms use react-hook-form + Zod
3. Convert any manual validation to Zod schemas

### 1.3 Booking Layout (Alternative UI)
**Files:**
- `app/[nickname]/_components/booking-layout/booking-layout-context.tsx`
- `app/[nickname]/_components/booking-layout/*.tsx`

**Note:** Keep booking-layout separate from booking dialog - they serve different UI patterns. Clean up independently but do NOT merge.

---

## Group 2: Creator Appointments Flow

### 2.1 Configure Schedule Context
**File:** `app/[nickname]/appointments/_components/configure-schedule/configure-schedule-context.tsx` (602 lines, 8 useState)

**Refactoring Tasks:**
1. Split into smaller contexts (under 100 lines each)
2. Extract schedule-related utilities
3. Use react-hook-form for any form state

### 2.2 Appointment Components
**Files:**
- `app/[nickname]/appointments/_components/appointment-card.tsx` (175 lines)
- `app/[nickname]/appointments/_components/week-calendar.tsx`
- `app/[nickname]/appointments/_components/slots-calendar.tsx`

**Refactoring Tasks:**
1. Split appointment-card.tsx (>100 lines)
2. Review for unnecessary state
3. Ensure consistent patterns

### 2.3 Quick Booking Dialog
**Files:**
- `app/[nickname]/appointments/_components/quick-booking/quick-booking-dialog.tsx`
- `app/[nickname]/appointments/_components/quick-booking/quick-booking-context.tsx`

**Refactoring Tasks:**
1. Ensure uses react-hook-form + Zod
2. Remove any manual validation
3. Check for unnecessary useState

### 2.4 Day-Off Appointments Context
**File:** `app/[nickname]/appointments/_components/day-off-appointments/day-off-appointments-context.tsx`

**Refactoring Tasks:**
1. Review state management complexity
2. Simplify if possible

---

## Group 3: Client Appointments Flow

### 3.1 Appointments List
**Files:**
- `app/(main)/appointments/_components/appointments-list.tsx`
- `app/(main)/appointments/_components/appointment-card.tsx` (195 lines)

**Note:** This appointment-card is SEPARATE from creator's - do NOT merge them.

**Refactoring Tasks:**
1. Split appointment-card.tsx (>100 lines)
2. Review state management

### 3.2 Quick Actions
**Files:**
- `app/(main)/appointments/_components/quick-booking-dialog.tsx`
- `app/(main)/appointments/_components/quick-reschedule-dialog.tsx`

**Note:** Keep separate from creator dialogs - flows will diverge.

**Refactoring Tasks:**
1. Ensure react-hook-form + Zod usage
2. Review useRef tracking in reschedule dialog (lines 82-128) for simplification
3. Remove unnecessary complexity

### 3.3 Status Badge
**File:** `app/(main)/appointments/_components/status-badge.tsx` (43 lines)

**Note:** Keep separate from `app/[nickname]/appointments/[id]/_components/appointment-status-badge.tsx` (85 lines) - different contexts.

---

## Group 4: Creator Settings Flow

### 4.1 Services Settings
**Files:**
- `app/[nickname]/settings/services/_components/create-service-dialog.tsx`
- `app/[nickname]/settings/services/_components/change-price-dialog.tsx` (132 lines)
- `app/[nickname]/settings/services/_components/change-duration-dialog.tsx` (143 lines)
- `app/[nickname]/settings/services/_components/rename-service-dialog.tsx` (119 lines)
- `app/[nickname]/settings/services/_components/service-menu.tsx` (84 lines)

**Refactoring Tasks:**
1. All dialogs follow identical boilerplate pattern - consider if a thin wrapper makes sense
2. Ensure all use react-hook-form + Zod
3. Check for unnecessary useEffect patterns

### 4.2 Service Groups
**Files in:** `app/[nickname]/settings/service-groups/_components/`

**Refactoring Tasks:**
1. Review for consistency with services pattern
2. Ensure Zod validation throughout

### 4.3 Contact Settings
**File:** `app/[nickname]/settings/contact/_components/contact-form.tsx`

**Refactoring Tasks:**
1. Review form patterns
2. Ensure proper Zod usage

### 4.4 Cancellation Policy
**File:** `app/[nickname]/settings/cancellation-policy/_components/cancellation-policy-form.tsx`

**Refactoring Tasks:**
1. Uses Controller pattern - verify it's optimal
2. Review for simplification

### 4.5 Clients Management
**Files:**
- `app/[nickname]/settings/clients/_components/clients-list.tsx` (190 lines) - **HAS useCallback VIOLATION**
- `app/[nickname]/settings/clients/[clientId]/_components/`

**Refactoring Tasks:**
1. Remove useCallback violation
2. Split clients-list.tsx (>100 lines)
3. Review state management

### 4.6 Time Settings & Schedule
**Files in:** `app/[nickname]/settings/time-settings/` and `app/[nickname]/settings/schedule/`

**Refactoring Tasks:**
1. Review for unnecessary complexity
2. Ensure consistent patterns

---

## Group 5: Authentication Flow

### 5.1 Auth Components
**Files:**
- `app/auth/_components/auth-form.tsx`
- `app/auth/_components/email-step.tsx`
- `app/auth/_components/otp-step.tsx`

**Refactoring Tasks:**
1. OTP cooldown timer (lines 53-63) - consider custom hook extraction
2. Review overall flow for simplification

### 5.2 Onboarding
**File:** `app/onboarding/_components/onboarding-form.tsx`

**Refactoring Tasks:**
1. Ensure follows latest patterns

---

## Group 6: Search Flow

### 6.1 Search Container
**File:** `app/(main)/search/_components/search-container.tsx`

**Refactoring Tasks:**
1. Has good debounce pattern - verify no issues
2. Multiple useState + useTransition - review if can simplify
3. Consider extracting debounce logic to shared hook

---

## Group 7: User Settings Flow

### 7.1 Settings Components
**Files in:** `app/(main)/settings/_components/`

**Refactoring Tasks:**
1. Review each form for react-hook-form + Zod compliance
2. Check for unnecessary state

---

## Group 8: Shared Utilities Cleanup

### 8.1 Date Utilities
**Task:** Consolidate date formatting into `lib/utils/` or feature-specific `_lib/` folders

### 8.2 Validation Schemas
**Task:** Audit schema organization - some inline, some in `_lib/`, some in separate files

### 8.3 Dead Code Audit
**Files to audit:**
- All `index.ts` barrel files - verify all exports are used
- Look for commented code
- Look for unused functions/components

---

## Group 9: Page-Level Cleanup

### 9.1 Beauty Page
**File:** `app/[nickname]/page.tsx` (~310 lines)

**Refactoring Tasks:**
1. Split into smaller sections (>100 lines)
2. Review data fetching patterns

### 9.2 Other Large Pages
Audit all `page.tsx` files for:
- Files over 100 lines
- Components that should be extracted
- Opportunities for server components

---

## Verification Checklist

After completing all groups, verify:

### No Convention Violations
- [ ] No useMemo anywhere
- [ ] No useCallback anywhere
- [ ] No React.memo anywhere
- [ ] No z-index anywhere
- [ ] All files under 100 lines

### Forms & Validation
- [ ] All forms use react-hook-form
- [ ] All validation uses Zod
- [ ] No manual if/else validation

### State Management
- [ ] No unnecessary useState
- [ ] Complex state extracted to contexts
- [ ] Contexts are focused and small

### Code Quality
- [ ] No unused exports
- [ ] No commented/dead code
- [ ] Consistent patterns across similar features

### Testing
- [ ] Run `pnpm lint` - no errors
- [ ] Run `pnpm build` - builds successfully
- [ ] Run `pnpm test` - all tests pass
- [ ] Manually test critical flows (booking, auth, settings)

---

## Notes for Refactoring Agent

1. **PROACTIVELY use skills** - check coding-conventions, base-ui, motion skills before making changes
2. **Keep flows separate** - client and specialist flows should not share logic components
3. **Extract utilities, not components** - share date formatters, validators; not UI components
4. **Test after each group** - don't batch all testing to the end
5. **Ask when uncertain** - if a pattern seems wrong, ask before changing

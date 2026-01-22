---
description: Date and time handling with date-fns
---

# Date Handling

**PROACTIVELY use date-fns** for ALL date and time operations. Never use custom date formatting functions or manual Date manipulation.

## Core Rule

```tsx
// BAD - Custom date formatting
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// GOOD - Use date-fns
import { format } from "date-fns";
const dateStr = format(date, "yyyy-MM-dd");
```

## Installed Libraries

- **date-fns** (v4.1.0) - Main date manipulation library

## Common Patterns

### Formatting Dates

```tsx
import { format, formatRelative, formatDistance } from "date-fns";

// ISO date string (YYYY-MM-DD)
format(date, "yyyy-MM-dd")

// Display formats
format(date, "MMMM d, yyyy")     // "January 21, 2026"
format(date, "MMM d")            // "Jan 21"
format(date, "EEE")              // "Tue" (day name)
format(date, "HH:mm")            // "14:30" (24-hour)
format(date, "h:mm a")           // "2:30 PM" (12-hour)

// Relative
formatRelative(date, new Date()) // "today at 2:30 PM"
formatDistance(date, new Date()) // "in 2 hours"
```

### Date Comparisons

```tsx
import {
  isToday,
  isTomorrow,
  isPast,
  isFuture,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay
} from "date-fns";

// Check if dates are same day
isSameDay(date1, date2)

// Check relative to today
isToday(date)
isTomorrow(date)
isPast(date)
isFuture(date)

// Compare dates
isBefore(date1, date2)
isAfter(date1, date2)

// Get day boundaries
startOfDay(date)
endOfDay(date)
```

### Date Arithmetic

```tsx
import {
  addDays,
  subDays,
  addMonths,
  subMonths,
  addHours,
  addMinutes,
  differenceInDays,
  differenceInMinutes
} from "date-fns";

// Add/subtract
addDays(date, 7)
subDays(date, 1)
addMonths(date, 6)

// Differences
differenceInDays(date1, date2)
differenceInMinutes(date1, date2)
```

### Parsing Dates

```tsx
import { parseISO, parse } from "date-fns";

// From ISO string (YYYY-MM-DD or full ISO)
parseISO("2026-01-21")
parseISO("2026-01-21T14:30:00Z")

// From custom format
parse("21/01/2026", "dd/MM/yyyy", new Date())
```

### Week Operations

```tsx
import {
  startOfWeek,
  endOfWeek,
  getDay,
  eachDayOfInterval
} from "date-fns";

// Week starts on Monday (weekStartsOn: 1)
startOfWeek(date, { weekStartsOn: 1 })

// Get day of week (0 = Sunday, 1 = Monday, etc.)
getDay(date)

// Get all days in a range
eachDayOfInterval({ start: startDate, end: endDate })
```

### Month Operations

```tsx
import {
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  eachDayOfInterval
} from "date-fns";

// Month boundaries
const firstDay = startOfMonth(date)
const lastDay = endOfMonth(date)

// All days in month
eachDayOfInterval({ start: firstDay, end: lastDay })
```

## Existing Utilities

The codebase has date utilities at `app/[nickname]/appointments/_lib/date-utils.ts`:
- `toDateString(date)` - Converts to "yyyy-MM-dd" format
- `parseDate(dateStr)` - Parses "yyyy-MM-dd" to Date
- `formatMonthYear(date)` - "MMMM yyyy" format
- `formatDateRange(dates)` - Range like "Dec 23 - 29, 2025"

**Check if these utilities cover your needs before creating new ones.**

## When NOT to Use date-fns

Use the built-in `Date` only for:
- Creating a new Date: `new Date()`
- Getting current timestamp: `Date.now()`

For everything else (formatting, parsing, arithmetic, comparisons), use date-fns.

## Timezone Handling

For timezone-aware operations, use the `TZDate` from date-fns:

```tsx
import { TZDate } from "date-fns/tz";

// Create date in specific timezone
const tzDate = new TZDate(2026, 0, 21, 14, 30, "America/New_York");

// Format with timezone
format(tzDate, "yyyy-MM-dd HH:mm zzz")
```

Note: Most operations in this app use the creator's timezone stored in the database.

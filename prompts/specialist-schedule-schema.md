# Specialist Schedule Database Schema

This prompt is for setting up the specialist schedule tables in the **icelook-supabase** backend repository to support schedule management in the Next.js frontend.

## Overview

The frontend implements:
- Month calendar view for schedule management
- Day detail editor with visual timeline (Outlook-style)
- Multiple pattern generators: rotation (5 on/2 off), weekly templates, bulk date selection
- Configurable time slot durations (5/10/15/30/60 minutes)
- Specialist timezone support
- Multiple breaks per working day
- On-demand/lazy generation as user navigates calendar

## Database Schema

### 1. Specialist Schedule Config Table

Stores schedule configuration for each specialist.

```sql
CREATE TABLE specialist_schedule_config (
  specialist_id UUID PRIMARY KEY REFERENCES specialists(id) ON DELETE CASCADE,
  timezone TEXT NOT NULL DEFAULT 'Europe/Kyiv',
  default_slot_duration INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT schedule_config_slot_duration_valid CHECK (
    default_slot_duration IN (5, 10, 15, 30, 60)
  )
);
```

**Column Notes:**
- `specialist_id` - Primary key, one config per specialist (1:1 relationship)
- `timezone` - IANA timezone string (e.g., 'Europe/Kyiv', 'America/New_York')
- `default_slot_duration` - Booking slot duration in minutes (5/10/15/30/60)

### 2. Working Days Table

Individual working day records (generated from patterns or manually created).

```sql
CREATE TABLE working_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES specialists(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT working_days_specialist_date_unique UNIQUE (specialist_id, date),
  CONSTRAINT working_days_time_order CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX idx_working_days_specialist_id ON working_days(specialist_id);
CREATE INDEX idx_working_days_specialist_date ON working_days(specialist_id, date);
CREATE INDEX idx_working_days_date_range ON working_days(date);
```

**Column Notes:**
- `date` - Working day date in YYYY-MM-DD format (stored in specialist's timezone context)
- `start_time` - Day start time as TIME (e.g., '09:00:00')
- `end_time` - Day end time as TIME (e.g., '18:00:00')
- Unique constraint ensures one working day per date per specialist

### 3. Working Day Breaks Table

Breaks within a working day. Multiple breaks per day supported.

```sql
CREATE TABLE working_day_breaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  working_day_id UUID NOT NULL REFERENCES working_days(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT breaks_time_order CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX idx_working_day_breaks_working_day_id ON working_day_breaks(working_day_id);
```

**Column Notes:**
- `working_day_id` - References parent working day (cascades on delete)
- `start_time`, `end_time` - Break period times
- Multiple breaks per working day allowed (e.g., lunch break, coffee break)

## Row Level Security (RLS)

### Enable RLS on all tables

```sql
ALTER TABLE specialist_schedule_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_day_breaks ENABLE ROW LEVEL SECURITY;
```

### Specialist Schedule Config Policies

```sql
-- Users can view their own schedule config
CREATE POLICY "Users can view own schedule config"
  ON specialist_schedule_config FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = specialist_schedule_config.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can create their own schedule config
CREATE POLICY "Users can create own schedule config"
  ON specialist_schedule_config FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = specialist_schedule_config.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can update their own schedule config
CREATE POLICY "Users can update own schedule config"
  ON specialist_schedule_config FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = specialist_schedule_config.specialist_id
      AND s.user_id = auth.uid()
    )
  );
```

### Working Days Policies

```sql
-- Public can view working days of active specialists (for booking)
CREATE POLICY "Public can view working days of active specialists"
  ON working_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = working_days.specialist_id
      AND s.is_active = true
    )
  );

-- Users can view their own working days
CREATE POLICY "Users can view own working days"
  ON working_days FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = working_days.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can create their own working days
CREATE POLICY "Users can create own working days"
  ON working_days FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = working_days.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can update their own working days
CREATE POLICY "Users can update own working days"
  ON working_days FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = working_days.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- Users can delete their own working days
CREATE POLICY "Users can delete own working days"
  ON working_days FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = working_days.specialist_id
      AND s.user_id = auth.uid()
    )
  );
```

### Working Day Breaks Policies

```sql
-- Public can view breaks of active specialists (for accurate availability)
CREATE POLICY "Public can view breaks of active specialists"
  ON working_day_breaks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM working_days wd
      JOIN specialists s ON s.id = wd.specialist_id
      WHERE wd.id = working_day_breaks.working_day_id
      AND s.is_active = true
    )
  );

-- Users can manage their own breaks
CREATE POLICY "Users can manage own breaks"
  ON working_day_breaks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM working_days wd
      JOIN specialists s ON s.id = wd.specialist_id
      WHERE wd.id = working_day_breaks.working_day_id
      AND s.user_id = auth.uid()
    )
  );
```

## Helper Functions

### Auto-create schedule config on specialist creation

```sql
CREATE OR REPLACE FUNCTION create_default_schedule_config()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO specialist_schedule_config (specialist_id, timezone, default_slot_duration)
  VALUES (NEW.id, 'Europe/Kyiv', 30);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_specialist_created_schedule_config
  AFTER INSERT ON specialists
  FOR EACH ROW
  EXECUTE FUNCTION create_default_schedule_config();
```

### Update timestamps

```sql
CREATE TRIGGER update_specialist_schedule_config_updated_at
  BEFORE UPDATE ON specialist_schedule_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_working_days_updated_at
  BEFORE UPDATE ON working_days
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Note:** Uses existing `update_updated_at_column()` function from specialist-profile-schema.

### Validate breaks are within working hours

```sql
CREATE OR REPLACE FUNCTION validate_break_within_working_hours()
RETURNS TRIGGER AS $$
DECLARE
  wd_start TIME;
  wd_end TIME;
BEGIN
  -- Get parent working day times
  SELECT start_time, end_time INTO wd_start, wd_end
  FROM working_days
  WHERE id = NEW.working_day_id;

  -- Validate break is within working hours
  IF NEW.start_time < wd_start OR NEW.end_time > wd_end THEN
    RAISE EXCEPTION 'Break must be within working hours (% - %)', wd_start, wd_end;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_break_hours
  BEFORE INSERT OR UPDATE ON working_day_breaks
  FOR EACH ROW
  EXECUTE FUNCTION validate_break_within_working_hours();
```

## TypeScript Types (for Frontend Reference)

```typescript
type SlotDuration = 5 | 10 | 15 | 30 | 60;

interface SpecialistScheduleConfig {
  specialist_id: string;
  timezone: string;
  default_slot_duration: SlotDuration;
  created_at: string;
  updated_at: string;
}

interface WorkingDay {
  id: string;
  specialist_id: string;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  created_at: string;
  updated_at: string;
}

interface WorkingDayBreak {
  id: string;
  working_day_id: string;
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  created_at: string;
}

// Extended type with breaks included
interface WorkingDayWithBreaks extends WorkingDay {
  working_day_breaks: WorkingDayBreak[];
}
```

## Frontend API Usage Reference

### Get Schedule Config

```typescript
const { data: config } = await supabase
  .from('specialist_schedule_config')
  .select('*')
  .eq('specialist_id', specialistId)
  .single();
```

### Update Schedule Config

```typescript
await supabase
  .from('specialist_schedule_config')
  .update({
    timezone: 'Europe/Kyiv',
    default_slot_duration: 30,
  })
  .eq('specialist_id', specialistId);
```

### Get Working Days for Month

```typescript
const { data: workingDays } = await supabase
  .from('working_days')
  .select(`
    *,
    working_day_breaks (*)
  `)
  .eq('specialist_id', specialistId)
  .gte('date', '2024-01-01')
  .lte('date', '2024-01-31')
  .order('date', { ascending: true });
```

### Create Working Day

```typescript
// 1. Create working day
const { data: workingDay, error } = await supabase
  .from('working_days')
  .insert({
    specialist_id: specialistId,
    date: '2024-01-15',
    start_time: '09:00:00',
    end_time: '18:00:00',
  })
  .select()
  .single();

// 2. Add breaks if any
if (breaks.length > 0) {
  await supabase
    .from('working_day_breaks')
    .insert(breaks.map(b => ({
      working_day_id: workingDay.id,
      start_time: b.start,
      end_time: b.end,
    })));
}
```

### Upsert Working Day (Create or Update)

```typescript
// Uses ON CONFLICT on (specialist_id, date)
const { data: workingDay } = await supabase
  .from('working_days')
  .upsert({
    specialist_id: specialistId,
    date: '2024-01-15',
    start_time: '09:00:00',
    end_time: '18:00:00',
  }, {
    onConflict: 'specialist_id,date',
  })
  .select()
  .single();
```

### Delete Working Day (Day Off)

```typescript
// Breaks are automatically deleted via CASCADE
await supabase
  .from('working_days')
  .delete()
  .eq('specialist_id', specialistId)
  .eq('date', '2024-01-15');
```

### Bulk Insert Working Days (Pattern Generation)

```typescript
// Generate dates from pattern (done in frontend)
const workingDaysToInsert = generatedDates.map(d => ({
  specialist_id: specialistId,
  date: d.date,
  start_time: d.startTime,
  end_time: d.endTime,
}));

// Bulk insert (ignores conflicts for existing dates)
const { data, error } = await supabase
  .from('working_days')
  .upsert(workingDaysToInsert, {
    onConflict: 'specialist_id,date',
    ignoreDuplicates: false, // Update existing
  })
  .select();
```

### Get Working Day by Date

```typescript
const { data: workingDay } = await supabase
  .from('working_days')
  .select(`
    *,
    working_day_breaks (*)
  `)
  .eq('specialist_id', specialistId)
  .eq('date', '2024-01-15')
  .single();
```

### Update Working Day Hours

```typescript
await supabase
  .from('working_days')
  .update({
    start_time: '10:00:00',
    end_time: '19:00:00',
  })
  .eq('id', workingDayId);
```

### Add Break to Working Day

```typescript
await supabase
  .from('working_day_breaks')
  .insert({
    working_day_id: workingDayId,
    start_time: '12:00:00',
    end_time: '13:00:00',
  });
```

### Delete Break

```typescript
await supabase
  .from('working_day_breaks')
  .delete()
  .eq('id', breakId);
```

### Replace All Breaks for a Day

```typescript
// Delete existing breaks
await supabase
  .from('working_day_breaks')
  .delete()
  .eq('working_day_id', workingDayId);

// Insert new breaks
if (newBreaks.length > 0) {
  await supabase
    .from('working_day_breaks')
    .insert(newBreaks.map(b => ({
      working_day_id: workingDayId,
      start_time: b.start,
      end_time: b.end,
    })));
}
```

## Entity Relationships

```
specialists (existing)
    │
    ├── 1:1 ──► specialist_schedule_config
    │
    └── 1:many ──► working_days
                       │
                       └── 1:many ──► working_day_breaks
```

## Testing Checklist

After migration, verify:

1. **Schedule Config**
   - Auto-created when specialist is created
   - Only owner can view/update
   - Slot duration constraint enforced

2. **Working Days**
   - CRUD operations work
   - Unique constraint on (specialist_id, date)
   - Time order constraint enforced
   - Public can view active specialists' working days
   - Only owner can modify

3. **Breaks**
   - Multiple breaks per day allowed
   - Break validation (within working hours)
   - Cascade delete when working day deleted
   - Public can view for availability checking

4. **Triggers**
   - Schedule config auto-created on specialist insert
   - updated_at timestamps work
   - Break validation trigger works

## IANA Timezone Reference

Common timezones for Ukraine and surrounding regions:
- `Europe/Kyiv` (Ukraine)
- `Europe/Warsaw` (Poland)
- `Europe/Bucharest` (Romania)
- `Europe/Moscow` (Russia)
- `UTC` (Universal)

For full list, see: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## Future Extensions

This schema supports future features:

- **Appointments**: Reference `working_days.id` for booked slots
- **Recurring appointments**: Query working days by day_of_week
- **Holiday calendar**: Mark specific dates as blocked system-wide
- **Multi-salon schedules**: Add `salon_id` to working_days for per-location availability
- **Schedule templates storage**: Add `schedule_templates` table if reusable patterns needed

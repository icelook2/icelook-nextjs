# Appointments Database Schema

This prompt is for setting up the appointments tables in the **icelook-supabase** backend repository to support appointment booking in the Next.js frontend.

## Overview

The frontend will implement:
- Appointment booking from specialist public profile (`/@username`)
- Client selects service → date → available time slot
- Specialist can view/manage appointments in their dashboard
- Time slot availability calculated from working days minus booked appointments

## Prerequisites

This schema depends on existing tables:
- `profiles` - User profiles (clients and specialists)
- `specialists` - Specialist profiles
- `services` - Services offered by specialists
- `working_days` - Specialist working hours per date
- `working_day_breaks` - Breaks within working days
- `specialist_schedule_config` - Slot duration and timezone settings

## Database Schema

### 1. Appointments Table

Main table storing booked appointments with **denormalized snapshot data**.

The appointment stores a copy of all relevant data at booking time, so specialists can freely modify or delete services, working days, etc. without affecting appointment history.

```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References (nullable - original records can be deleted)
  specialist_id UUID REFERENCES specialists(id) ON DELETE SET NULL,
  service_id UUID REFERENCES services(id) ON DELETE SET NULL,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- ========================================
  -- SNAPSHOT: Specialist data at booking time
  -- ========================================
  specialist_username TEXT NOT NULL,
  specialist_display_name TEXT NOT NULL,

  -- ========================================
  -- SNAPSHOT: Service data at booking time
  -- ========================================
  service_name TEXT NOT NULL,
  service_price NUMERIC(10, 2) NOT NULL,
  service_currency TEXT NOT NULL,
  service_duration_minutes INTEGER NOT NULL,

  -- ========================================
  -- SNAPSHOT: Client data at booking time
  -- ========================================
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL, -- Required for contact
  client_email TEXT, -- Optional, from profile if logged in

  -- ========================================
  -- Booking details
  -- ========================================
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  timezone TEXT NOT NULL, -- Specialist's timezone at booking time

  -- Status
  status TEXT NOT NULL DEFAULT 'pending',

  -- Optional notes
  client_notes TEXT,
  specialist_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT appointments_status_valid CHECK (
    status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')
  ),
  CONSTRAINT appointments_time_order CHECK (end_time > start_time),
  CONSTRAINT appointments_cancelled_at_valid CHECK (
    (status = 'cancelled' AND cancelled_at IS NOT NULL) OR
    (status != 'cancelled' AND cancelled_at IS NULL)
  ),
  CONSTRAINT appointments_currency_valid CHECK (
    service_currency IN ('UAH', 'USD', 'EUR')
  )
);

-- Indexes for common queries
CREATE INDEX idx_appointments_specialist_id ON appointments(specialist_id);
CREATE INDEX idx_appointments_client_id ON appointments(client_id);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_specialist_date ON appointments(specialist_id, date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Composite index for availability checking (only non-cancelled, with valid specialist)
CREATE INDEX idx_appointments_availability ON appointments(specialist_id, date, status)
  WHERE status NOT IN ('cancelled') AND specialist_id IS NOT NULL;
```

**Column Notes:**

**References (nullable):**
- `specialist_id` - Reference to specialist (SET NULL on delete, history preserved via snapshot)
- `service_id` - Reference to service (SET NULL on delete, history preserved via snapshot)
- `client_id` - Reference to client profile (SET NULL on delete, history preserved via snapshot)

**Snapshot - Specialist:**
- `specialist_username` - Username at booking time (for display/linking)
- `specialist_display_name` - Display name at booking time

**Snapshot - Service:**
- `service_name` - Service name at booking time
- `service_price` - Price at booking time (what client agreed to pay)
- `service_currency` - Currency at booking time
- `service_duration_minutes` - Duration at booking time

**Snapshot - Client:**
- `client_name` - Client's name at booking time
- `client_email` - Client's email at booking time (for notifications)

**Booking Details:**
- `date` - Appointment date
- `start_time`, `end_time` - Booked time slot
- `timezone` - Specialist's timezone (for correct time display)

**Status:**
- `pending` - Awaiting specialist confirmation
- `confirmed` - Specialist confirmed
- `completed` - Service was provided
- `cancelled` - Cancelled by either party
- `no_show` - Client didn't show up

**Notes:**
- `client_notes` - Optional notes from client when booking
- `specialist_notes` - Private notes from specialist

### 2. Specialist Booking Settings Table

Stores booking preferences for each specialist (separate from schedule config).

```sql
CREATE TABLE specialist_booking_settings (
  specialist_id UUID PRIMARY KEY REFERENCES specialists(id) ON DELETE CASCADE,

  -- Confirmation behavior
  auto_confirm BOOLEAN NOT NULL DEFAULT false,

  -- Booking window
  min_booking_notice_hours INTEGER NOT NULL DEFAULT 2, -- Minimum hours before appointment
  max_booking_days_ahead INTEGER NOT NULL DEFAULT 30, -- How far in advance clients can book

  -- Cancellation policy
  allow_client_cancellation BOOLEAN NOT NULL DEFAULT true,
  cancellation_notice_hours INTEGER NOT NULL DEFAULT 24, -- Minimum hours before to cancel

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Column Notes:**
- `auto_confirm` - If true, bookings are immediately confirmed. If false, starts as 'pending' for specialist approval.
- `min_booking_notice_hours` - Clients can't book slots less than X hours from now
- `max_booking_days_ahead` - Clients can only book up to X days in the future
- `allow_client_cancellation` - Whether clients can cancel their own bookings
- `cancellation_notice_hours` - Minimum hours before appointment that cancellation is allowed

### 3. Appointment Status History Table (Optional but Recommended)

Tracks status changes for audit trail.

```sql
CREATE TABLE appointment_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_appointment_status_history_appointment_id
  ON appointment_status_history(appointment_id);
```

## Row Level Security (RLS)

### Enable RLS

```sql
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE specialist_booking_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_status_history ENABLE ROW LEVEL SECURITY;
```

### Specialist Booking Settings Policies

```sql
-- Public can view booking settings (for booking UI)
CREATE POLICY "Public can view booking settings"
  ON specialist_booking_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = specialist_booking_settings.specialist_id
      AND s.is_active = true
    )
  );

-- Specialists can manage their own settings
CREATE POLICY "Specialists can manage own booking settings"
  ON specialist_booking_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = specialist_booking_settings.specialist_id
      AND s.user_id = auth.uid()
    )
  );
```

### Appointments Policies

```sql
-- Logged-in clients can view their own appointments
CREATE POLICY "Clients can view own appointments"
  ON appointments FOR SELECT
  USING (
    client_id IS NOT NULL AND auth.uid() = client_id
  );

-- Specialists can view appointments for their specialist profile
CREATE POLICY "Specialists can view their appointments"
  ON appointments FOR SELECT
  USING (
    specialist_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = appointments.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- GUEST BOOKING: Anyone can create appointments (no auth required)
-- client_id is NULL for guest bookings, populated for logged-in users
-- Validation is done via server action, not RLS
CREATE POLICY "Anyone can book appointments"
  ON appointments FOR INSERT
  WITH CHECK (
    specialist_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = appointments.specialist_id
      AND s.is_active = true
    )
  );

-- Logged-in clients can cancel their own pending/confirmed appointments
CREATE POLICY "Clients can cancel own pending appointments"
  ON appointments FOR UPDATE
  USING (
    client_id IS NOT NULL
    AND auth.uid() = client_id
    AND status IN ('pending', 'confirmed')
  )
  WITH CHECK (
    -- Can only update to cancelled status
    status = 'cancelled'
  );

-- Specialists can update appointments on their profile
CREATE POLICY "Specialists can manage their appointments"
  ON appointments FOR UPDATE
  USING (
    specialist_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM specialists s
      WHERE s.id = appointments.specialist_id
      AND s.user_id = auth.uid()
    )
  );

-- Neither party can delete appointments (use status instead)
-- No DELETE policies - appointments should never be deleted
```

**Note on Guest Bookings:**
- Guest bookings have `client_id = NULL`
- Guest info is stored in snapshot fields: `client_name`, `client_phone`, `client_email`
- Guests cannot view or cancel their appointments (no account = no access)
- If guest creates an account later, a background job could link orphan appointments by matching phone number

### Appointment Status History Policies

```sql
-- Users can view history for their appointments (as client or specialist)
CREATE POLICY "Users can view appointment history"
  ON appointment_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.id = appointment_status_history.appointment_id
      AND (
        a.client_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM specialists s
          WHERE s.id = a.specialist_id
          AND s.user_id = auth.uid()
        )
      )
    )
  );

-- System inserts history (via trigger, not direct)
-- No INSERT policy for users - history is created by triggers
```

## Triggers and Functions

### 1. Prevent Double Booking

Critical function to prevent overlapping appointments.

```sql
CREATE OR REPLACE FUNCTION prevent_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for overlapping appointments on the same specialist and date
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.specialist_id = NEW.specialist_id
    AND a.date = NEW.date
    AND a.status NOT IN ('cancelled')
    AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
    AND (
      (NEW.start_time >= a.start_time AND NEW.start_time < a.end_time)
      OR (NEW.end_time > a.start_time AND NEW.end_time <= a.end_time)
      OR (NEW.start_time <= a.start_time AND NEW.end_time >= a.end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Time slot is already booked';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_appointment_overlap
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_appointment_overlap();
```

### 2. Validate Appointment Within Working Hours

Ensure appointments are within specialist's working hours and don't overlap with breaks.

```sql
CREATE OR REPLACE FUNCTION validate_appointment_within_working_hours()
RETURNS TRIGGER AS $$
DECLARE
  wd_record RECORD;
BEGIN
  -- Only validate on INSERT (booking time)
  -- We don't validate on UPDATE because working hours might change after booking
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;

  -- Get the working day for this specialist and date
  SELECT * INTO wd_record
  FROM working_days
  WHERE specialist_id = NEW.specialist_id
  AND date = NEW.date;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Specialist is not working on this date';
  END IF;

  -- Verify time is within working hours
  IF NEW.start_time < wd_record.start_time OR NEW.end_time > wd_record.end_time THEN
    RAISE EXCEPTION 'Appointment must be within working hours (% - %)',
      wd_record.start_time, wd_record.end_time;
  END IF;

  -- Verify appointment doesn't overlap with breaks
  IF EXISTS (
    SELECT 1 FROM working_day_breaks b
    WHERE b.working_day_id = wd_record.id
    AND (
      (NEW.start_time >= b.start_time AND NEW.start_time < b.end_time)
      OR (NEW.end_time > b.start_time AND NEW.end_time <= b.end_time)
      OR (NEW.start_time <= b.start_time AND NEW.end_time >= b.end_time)
    )
  ) THEN
    RAISE EXCEPTION 'Appointment overlaps with a break period';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_appointment_working_hours
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_within_working_hours();
```

### 3. Validate Service Belongs to Specialist

```sql
CREATE OR REPLACE FUNCTION validate_appointment_service()
RETURNS TRIGGER AS $$
BEGIN
  -- Verify service belongs to the specialist
  IF NOT EXISTS (
    SELECT 1 FROM services s
    JOIN service_groups sg ON sg.id = s.service_group_id
    WHERE s.id = NEW.service_id
    AND sg.specialist_id = NEW.specialist_id
    AND s.is_active = true
  ) THEN
    RAISE EXCEPTION 'Service does not belong to this specialist or is inactive';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_appointment_service
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_service();
```

### 4. Record Status Changes

```sql
CREATE OR REPLACE FUNCTION record_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO appointment_status_history (
      appointment_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER record_status_change
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION record_appointment_status_change();
```

### 5. Set Cancelled Timestamp

```sql
CREATE OR REPLACE FUNCTION set_cancelled_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cancelled_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION set_cancelled_timestamp();
```

### 6. Auto-create Booking Settings on Specialist Creation

```sql
CREATE OR REPLACE FUNCTION create_default_booking_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO specialist_booking_settings (specialist_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_specialist_created_booking_settings
  AFTER INSERT ON specialists
  FOR EACH ROW
  EXECUTE FUNCTION create_default_booking_settings();
```

### 7. Update Timestamps

```sql
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_booking_settings_updated_at
  BEFORE UPDATE ON specialist_booking_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Note:** Uses existing `update_updated_at_column()` function from specialist-profile-schema.

## Helper Functions

### Get Available Time Slots for Booking

This function returns available slots for a specialist on a specific date.

```sql
CREATE OR REPLACE FUNCTION get_available_slots(
  p_specialist_id UUID,
  p_date DATE,
  p_service_duration_minutes INTEGER DEFAULT NULL
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME,
  available BOOLEAN,
  blocked_reason TEXT
) AS $$
DECLARE
  v_slot_duration INTEGER;
  v_working_day RECORD;
  v_slot_start TIME;
  v_slot_end TIME;
BEGIN
  -- Get slot duration from config or use service duration
  SELECT COALESCE(p_service_duration_minutes, ssc.default_slot_duration)
  INTO v_slot_duration
  FROM specialist_schedule_config ssc
  WHERE ssc.specialist_id = p_specialist_id;

  IF v_slot_duration IS NULL THEN
    v_slot_duration := COALESCE(p_service_duration_minutes, 30);
  END IF;

  -- Get working day
  SELECT * INTO v_working_day
  FROM working_days wd
  WHERE wd.specialist_id = p_specialist_id
  AND wd.date = p_date;

  IF NOT FOUND THEN
    -- No working day = no slots
    RETURN;
  END IF;

  -- Generate slots
  v_slot_start := v_working_day.start_time;

  WHILE v_slot_start + (v_slot_duration || ' minutes')::INTERVAL <= v_working_day.end_time LOOP
    v_slot_end := v_slot_start + (v_slot_duration || ' minutes')::INTERVAL;

    -- Check if slot overlaps with break
    IF EXISTS (
      SELECT 1 FROM working_day_breaks b
      WHERE b.working_day_id = v_working_day.id
      AND (
        (v_slot_start >= b.start_time AND v_slot_start < b.end_time)
        OR (v_slot_end > b.start_time AND v_slot_end <= b.end_time)
        OR (v_slot_start <= b.start_time AND v_slot_end >= b.end_time)
      )
    ) THEN
      start_time := v_slot_start;
      end_time := v_slot_end;
      available := FALSE;
      blocked_reason := 'break';
      RETURN NEXT;
    -- Check if slot overlaps with existing appointment
    ELSIF EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.specialist_id = p_specialist_id
      AND a.date = p_date
      AND a.status NOT IN ('cancelled')
      AND (
        (v_slot_start >= a.start_time AND v_slot_start < a.end_time)
        OR (v_slot_end > a.start_time AND v_slot_end <= a.end_time)
        OR (v_slot_start <= a.start_time AND v_slot_end >= a.end_time)
      )
    ) THEN
      start_time := v_slot_start;
      end_time := v_slot_end;
      available := FALSE;
      blocked_reason := 'booked';
      RETURN NEXT;
    ELSE
      start_time := v_slot_start;
      end_time := v_slot_end;
      available := TRUE;
      blocked_reason := NULL;
      RETURN NEXT;
    END IF;

    v_slot_start := v_slot_end;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Check Slot Availability (Simple Boolean Check)

```sql
CREATE OR REPLACE FUNCTION is_slot_available(
  p_specialist_id UUID,
  p_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_working_day_id UUID;
BEGIN
  -- Get working day
  SELECT id INTO v_working_day_id
  FROM working_days
  WHERE specialist_id = p_specialist_id
  AND date = p_date;

  IF v_working_day_id IS NULL THEN
    RETURN FALSE; -- No working day
  END IF;

  -- Check if within working hours
  IF NOT EXISTS (
    SELECT 1 FROM working_days
    WHERE id = v_working_day_id
    AND p_start_time >= start_time
    AND p_end_time <= end_time
  ) THEN
    RETURN FALSE; -- Outside working hours
  END IF;

  -- Check for break overlap
  IF EXISTS (
    SELECT 1 FROM working_day_breaks b
    WHERE b.working_day_id = v_working_day_id
    AND (
      (p_start_time >= b.start_time AND p_start_time < b.end_time)
      OR (p_end_time > b.start_time AND p_end_time <= b.end_time)
      OR (p_start_time <= b.start_time AND p_end_time >= b.end_time)
    )
  ) THEN
    RETURN FALSE; -- Overlaps break
  END IF;

  -- Check for existing appointment
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.specialist_id = p_specialist_id
    AND a.date = p_date
    AND a.status NOT IN ('cancelled')
    AND (
      (p_start_time >= a.start_time AND p_start_time < a.end_time)
      OR (p_end_time > a.start_time AND p_end_time <= a.end_time)
      OR (p_start_time <= a.start_time AND p_end_time >= a.end_time)
    )
  ) THEN
    RETURN FALSE; -- Slot already booked
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## TypeScript Types (for Frontend Reference)

```typescript
type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

type Currency = 'UAH' | 'USD' | 'EUR';

/**
 * Appointment record with denormalized snapshot data.
 * All snapshot fields are guaranteed to be present (captured at booking time).
 * Reference IDs may be null if the original record was deleted.
 */
interface Appointment {
  id: string;

  // References (nullable - original records can be deleted)
  specialist_id: string | null;
  service_id: string | null;
  client_id: string | null;

  // Snapshot: Specialist data at booking time
  specialist_username: string;
  specialist_display_name: string;

  // Snapshot: Service data at booking time
  service_name: string;
  service_price: number;
  service_currency: Currency;
  service_duration_minutes: number;

  // Snapshot: Client data at booking time
  client_name: string;
  client_phone: string;
  client_email: string | null;

  // Booking details
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  timezone: string; // IANA timezone

  // Status
  status: AppointmentStatus;

  // Notes
  client_notes: string | null;
  specialist_notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
}

interface AppointmentStatusHistory {
  id: string;
  appointment_id: string;
  old_status: AppointmentStatus | null;
  new_status: AppointmentStatus;
  changed_by: string | null;
  reason: string | null;
  created_at: string;
}

interface SpecialistBookingSettings {
  specialist_id: string;
  auto_confirm: boolean;
  min_booking_notice_hours: number;
  max_booking_days_ahead: number;
  allow_client_cancellation: boolean;
  cancellation_notice_hours: number;
  created_at: string;
  updated_at: string;
}

/**
 * Input for creating an appointment.
 * The server action will fetch and populate snapshot fields.
 */
interface CreateAppointmentInput {
  specialist_id: string;
  service_id: string;
  date: string; // "YYYY-MM-DD"
  start_time: string; // "HH:MM"
  client_notes?: string;

  // Guest booking fields (required if not logged in)
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
}

interface TimeSlot {
  start_time: string; // "HH:MM:SS"
  end_time: string; // "HH:MM:SS"
  available: boolean;
  blocked_reason: 'break' | 'booked' | null;
}
```

## Frontend API Usage Reference

### Get Available Slots for a Date

```typescript
// Using the database function
const { data: slots } = await supabase
  .rpc('get_available_slots', {
    p_specialist_id: specialistId,
    p_date: '2024-01-15',
    p_service_duration_minutes: 60 // Optional, uses service duration
  });

// Or query manually and calculate in frontend
const { data: workingDay } = await supabase
  .from('working_days')
  .select(`
    *,
    working_day_breaks (*)
  `)
  .eq('specialist_id', specialistId)
  .eq('date', '2024-01-15')
  .single();

const { data: bookedAppointments } = await supabase
  .from('appointments')
  .select('start_time, end_time')
  .eq('specialist_id', specialistId)
  .eq('date', '2024-01-15')
  .not('status', 'eq', 'cancelled');

// Then use frontend time-utils to calculate slots
```

### Check Slot Availability

```typescript
const { data: isAvailable } = await supabase
  .rpc('is_slot_available', {
    p_specialist_id: specialistId,
    p_date: '2024-01-15',
    p_start_time: '10:00:00',
    p_end_time: '11:00:00'
  });
```

### Create Appointment (Book)

When booking, you must fetch all data to populate the snapshot fields.
This is typically done in a server action.

```typescript
// Server action: createAppointment(input: CreateAppointmentInput)

// 1. Get specialist with schedule config
const { data: specialist } = await supabase
  .from('specialists')
  .select(`
    id,
    username,
    display_name,
    specialist_schedule_config (timezone)
  `)
  .eq('id', specialistId)
  .eq('is_active', true)
  .single();

// 2. Get service details
const { data: service } = await supabase
  .from('services')
  .select(`
    id,
    name,
    price,
    currency,
    duration_minutes,
    service_group:service_groups!inner (specialist_id)
  `)
  .eq('id', serviceId)
  .eq('service_group.specialist_id', specialistId)
  .eq('is_active', true)
  .single();

// 3. Get current user's profile (the client)
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase
  .from('profiles')
  .select('id, full_name, email')
  .eq('id', user.id)
  .single();

// 4. Calculate end time from start time + duration
const startTime = '10:00:00';
const endTime = addMinutesToTime(startTime, service.duration_minutes); // e.g., '11:00:00'

// 5. Create appointment with all snapshot data
const { data: appointment, error } = await supabase
  .from('appointments')
  .insert({
    // References
    specialist_id: specialist.id,
    service_id: service.id,
    client_id: profile.id,

    // Snapshot: Specialist
    specialist_username: specialist.username,
    specialist_display_name: specialist.display_name,

    // Snapshot: Service
    service_name: service.name,
    service_price: service.price,
    service_currency: service.currency,
    service_duration_minutes: service.duration_minutes,

    // Snapshot: Client
    client_name: profile.full_name,
    client_email: profile.email,

    // Booking details
    date: '2024-01-15',
    start_time: startTime,
    end_time: endTime,
    timezone: specialist.specialist_schedule_config.timezone,

    // Notes
    client_notes: 'First time visit',
  })
  .select()
  .single();

// Error if slot is taken (trigger will reject)
if (error?.message.includes('already booked')) {
  // Handle slot conflict - refresh available slots
}
```

### Get Client's Appointments

No joins needed - all display data is in the snapshot fields.

```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select('*')
  .eq('client_id', userId)
  .order('date', { ascending: false });

// Display directly from snapshot:
// appointment.specialist_display_name
// appointment.service_name
// appointment.service_price
// appointment.service_currency
```

### Get Specialist's Appointments

No joins needed - all display data is in the snapshot fields.

```typescript
const { data: appointments } = await supabase
  .from('appointments')
  .select('*')
  .eq('specialist_id', specialistId)
  .gte('date', '2024-01-01')
  .order('date', { ascending: true })
  .order('start_time', { ascending: true });

// Display directly from snapshot:
// appointment.client_name
// appointment.client_email
// appointment.service_name
// appointment.service_duration_minutes
```

### Cancel Appointment (Client)

```typescript
const { error } = await supabase
  .from('appointments')
  .update({ status: 'cancelled' })
  .eq('id', appointmentId)
  .eq('client_id', userId); // RLS ensures ownership
```

### Update Appointment Status (Specialist)

```typescript
// Confirm appointment
await supabase
  .from('appointments')
  .update({ status: 'confirmed' })
  .eq('id', appointmentId);

// Mark as completed
await supabase
  .from('appointments')
  .update({
    status: 'completed',
    specialist_notes: 'Client was happy with the haircut'
  })
  .eq('id', appointmentId);

// Mark as no-show
await supabase
  .from('appointments')
  .update({ status: 'no_show' })
  .eq('id', appointmentId);
```

### Get Appointment Status History

```typescript
const { data: history } = await supabase
  .from('appointment_status_history')
  .select('*')
  .eq('appointment_id', appointmentId)
  .order('created_at', { ascending: true });
```

## Entity Relationships

```
profiles (existing)
    │
    ├── as client ──► appointments (many, SET NULL on delete)
    │
    └── 1:1 ──► specialists (existing)
                    │
                    ├── 1:many ──► appointments (SET NULL on delete)
                    │                   │
                    │                   └── snapshot data (denormalized, preserved forever)
                    │
                    ├── 1:many ──► service_groups (existing)
                    │                   │
                    │                   └── 1:many ──► services (existing, SET NULL in appointments)
                    │
                    └── 1:many ──► working_days (existing, used for validation only)
                                        │
                                        └── 1:many ──► working_day_breaks (existing)
```

## Migration Order

Run migrations in this order:

1. Create `appointments` table
2. Create `appointment_status_history` table
3. Enable RLS on both tables
4. Create RLS policies for `appointments`
5. Create RLS policies for `appointment_status_history`
6. Create trigger functions:
   - `prevent_appointment_overlap()`
   - `validate_appointment_within_working_hours()`
   - `validate_appointment_service()`
   - `record_appointment_status_change()`
   - `set_cancelled_timestamp()`
7. Create triggers on `appointments` table
8. Create helper functions:
   - `get_available_slots()`
   - `is_slot_available()`

## Testing Checklist

After migration, verify:

1. **Booking Flow**
   - Client can book available slot
   - Double booking prevented (trigger rejects)
   - Booking outside working hours rejected
   - Booking during break rejected
   - Service must belong to specialist
   - All snapshot fields populated correctly

2. **Permissions**
   - Client can view own appointments
   - Client cannot view others' appointments
   - Specialist can view appointments on their profile
   - Client can cancel own pending/confirmed appointments
   - Specialist can update any status on their appointments

3. **Status Transitions**
   - pending → confirmed (specialist)
   - pending → cancelled (client or specialist)
   - confirmed → completed (specialist)
   - confirmed → cancelled (client or specialist)
   - confirmed → no_show (specialist)

4. **History Tracking**
   - Status changes recorded in history table
   - `cancelled_at` timestamp set automatically

5. **Slot Availability**
   - `get_available_slots()` returns correct slots
   - Cancelled appointments don't block slots
   - Breaks shown as unavailable
   - Booked slots shown as unavailable

6. **Snapshot Data Integrity**
   - Deleting specialist sets `specialist_id` to NULL, snapshot preserved
   - Deleting service sets `service_id` to NULL, snapshot preserved
   - Deleting client sets `client_id` to NULL, snapshot preserved
   - Deleting working_day has no effect on appointments
   - Appointment history displays correctly after source deletion
   - Price/service/specialist info remains accurate for historical records

## Future Extensions

This schema supports future features:

- **Recurring appointments**: Add `recurrence_rule` column (iCal format)
- **Reminders**: Add `reminder_sent_at` timestamp, trigger notifications
- **Reviews**: Add `reviews` table referencing completed appointments
- **Payments**: Add `payment_status`, `payment_id` for payment integration
- **Waitlist**: Add `waitlist` table for fully booked dates
- **Multi-specialist bookings**: Add junction table for appointments with multiple specialists
- **Buffer time**: Add `buffer_before`, `buffer_after` to prevent back-to-back bookings

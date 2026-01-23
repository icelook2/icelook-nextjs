"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type AuthorizationResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: string };

/**
 * Verify user can manage schedule for a beauty page
 * User must be the owner of the beauty page
 */
async function verifyCanManageSchedule(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("schedule");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: t("errors.not_authenticated") };
  }

  // Check if user is owner
  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (beautyPage?.owner_id === user.id) {
    return { authorized: true, userId: user.id };
  }

  return { authorized: false, error: t("errors.not_authorized") };
}

// Validation schemas
const createWorkingDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

const updateWorkingDaySchema = z.object({
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

/**
 * Create a working day for the beauty page
 */
export async function createWorkingDay(input: {
  beautyPageId: string;
  nickname: string;
  date: string;
  startTime: string;
  endTime: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = createWorkingDaySchema.safeParse({
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Validate time order
  if (validation.data.startTime >= validation.data.endTime) {
    return { success: false, error: t("errors.invalid_time_range") };
  }

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Check if working day already exists for this date
  const { data: existing } = await supabase
    .from("working_days")
    .select("id")
    .eq("beauty_page_id", input.beautyPageId)
    .eq("date", validation.data.date)
    .maybeSingle();

  if (existing) {
    return { success: false, error: t("errors.working_day_exists") };
  }

  // Fetch beauty page's slot interval to snapshot
  const { data: beautyPageSettings } = await supabase
    .from("beauty_pages")
    .select("slot_interval_minutes")
    .eq("id", input.beautyPageId)
    .single();

  const slotInterval = beautyPageSettings?.slot_interval_minutes ?? 30;

  // Create working day
  const { data, error } = await supabase
    .from("working_days")
    .insert({
      beauty_page_id: input.beautyPageId,
      date: validation.data.date,
      start_time: `${validation.data.startTime}:00`,
      end_time: `${validation.data.endTime}:00`,
      slot_interval_minutes: slotInterval,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating working day:", error);
    return { success: false, error: t("errors.create_failed") };
  }

  revalidatePath(`/${input.nickname}/schedule`);

  return { success: true, data: { id: data.id } };
}

/**
 * Update a working day
 */
export async function updateWorkingDay(input: {
  id: string;
  beautyPageId: string;
  nickname: string;
  startTime?: string;
  endTime?: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = updateWorkingDaySchema.safeParse({
    startTime: input.startTime,
    endTime: input.endTime,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get current working day to validate time range
  const { data: current } = await supabase
    .from("working_days")
    .select("date, start_time, end_time")
    .eq("id", input.id)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!current) {
    return { success: false, error: t("errors.not_found") };
  }

  const newStartTime = input.startTime
    ? `${input.startTime}:00`
    : current.start_time;
  const newEndTime = input.endTime ? `${input.endTime}:00` : current.end_time;

  if (newStartTime >= newEndTime) {
    return { success: false, error: t("errors.invalid_time_range") };
  }

  // Build update object
  const updateData: Record<string, string> = {};
  if (input.startTime) {
    updateData.start_time = `${input.startTime}:00`;
  }
  if (input.endTime) {
    updateData.end_time = `${input.endTime}:00`;
  }

  if (Object.keys(updateData).length === 0) {
    return { success: true }; // Nothing to update
  }

  const { error } = await supabase
    .from("working_days")
    .update(updateData)
    .eq("id", input.id)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error updating working day:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/schedule`);

  return { success: true };
}

/**
 * Delete a working day (cascades breaks)
 *
 * @param force - Skip appointment check (used when appointments are intentionally
 *                left on day being marked as day off)
 */
export async function deleteWorkingDay(input: {
  id: string;
  beautyPageId: string;
  nickname: string;
  force?: boolean;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Check for appointments on this day (skip if force is true)
  const { data: workingDay } = await supabase
    .from("working_days")
    .select("date")
    .eq("id", input.id)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!workingDay) {
    return { success: false, error: t("errors.not_found") };
  }

  if (!input.force) {
    const { count: appointmentCount } = await supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("beauty_page_id", input.beautyPageId)
      .eq("date", workingDay.date)
      .neq("status", "cancelled");

    if (appointmentCount && appointmentCount > 0) {
      return { success: false, error: t("errors.has_appointments") };
    }
  }

  // Delete working day (breaks cascade)
  const { error } = await supabase
    .from("working_days")
    .delete()
    .eq("id", input.id)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error deleting working day:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/schedule`);
  revalidatePath(`/${input.nickname}/appointments`);

  return { success: true };
}

// ============================================================================
// Day Off Appointments
// ============================================================================

/** Appointment data needed for the day-off dialog */
export interface DayOffAppointment {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed";
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  serviceDurationMinutes: number;
}

/**
 * Get active appointments for a specific date
 * Used by the day-off dialog to show appointments that need handling
 */
export async function getAppointmentsForWorkingDay(input: {
  beautyPageId: string;
  date: string;
}): Promise<ActionResult<DayOffAppointment[]>> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("appointments")
    .select(
      "id, date, start_time, end_time, status, client_name, client_phone, service_name, service_duration_minutes",
    )
    .eq("beauty_page_id", input.beautyPageId)
    .eq("date", input.date)
    .in("status", ["pending", "confirmed"])
    .order("start_time");

  if (error) {
    console.error("Error fetching appointments for working day:", error);
    return { success: false, error: "Failed to fetch appointments" };
  }

  const appointments: DayOffAppointment[] = (data ?? []).map((apt) => ({
    id: apt.id,
    date: apt.date,
    startTime: apt.start_time,
    endTime: apt.end_time,
    status: apt.status as "pending" | "confirmed",
    clientName: apt.client_name,
    clientPhone: apt.client_phone,
    serviceName: apt.service_name,
    serviceDurationMinutes: apt.service_duration_minutes,
  }));

  return { success: true, data: appointments };
}

/**
 * Get working days with times for rescheduling
 * Returns working days from tomorrow onwards (excludes past dates)
 */
export async function getWorkingDaysForReschedule(input: {
  beautyPageId: string;
  excludeDate?: string;
}): Promise<
  ActionResult<Array<{ date: string; startTime: string; endTime: string }>>
> {
  const supabase = await createClient();

  // Get tomorrow's date as minimum
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  let query = supabase
    .from("working_days")
    .select("date, start_time, end_time")
    .eq("beauty_page_id", input.beautyPageId)
    .gte("date", minDate)
    .order("date")
    .limit(60); // Limit to ~2 months of working days

  if (input.excludeDate) {
    query = query.neq("date", input.excludeDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching working days for reschedule:", error);
    return { success: false, error: "Failed to fetch working days" };
  }

  const workingDays = (data ?? []).map((wd) => ({
    date: wd.date,
    startTime: wd.start_time.slice(0, 5), // Remove seconds
    endTime: wd.end_time.slice(0, 5),
  }));

  return { success: true, data: workingDays };
}

// ============================================================================
// Bulk Operations
// ============================================================================

const breakSchema = z.object({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

const bulkScheduleSchema = z.object({
  toCreate: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      breaks: z.array(breakSchema).optional(),
    }),
  ),
  toUpdate: z.array(
    z.object({
      id: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    }),
  ),
  toDelete: z.array(z.string().uuid()),
});

export interface BulkScheduleResult {
  created: number;
  updated: number;
  deleted: number;
  errors: Array<{ date: string; error: string }>;
}

/**
 * Bulk update schedule - create, update, and delete working days in one operation
 * Used by the schedule configuration wizard
 */
export async function bulkUpdateSchedule(input: {
  beautyPageId: string;
  nickname: string;
  toCreate: Array<{
    date: string;
    startTime: string;
    endTime: string;
    breaks?: Array<{ startTime: string; endTime: string }>;
  }>;
  toUpdate: Array<{
    id: string;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  toDelete: string[];
}): Promise<ActionResult<BulkScheduleResult>> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = bulkScheduleSchema.safeParse({
    toCreate: input.toCreate,
    toUpdate: input.toUpdate,
    toDelete: input.toDelete,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Validate time ranges
  for (const item of [
    ...validation.data.toCreate,
    ...validation.data.toUpdate,
  ]) {
    if (item.startTime >= item.endTime) {
      return {
        success: false,
        error: t("errors.invalid_time_range_for_date", { date: item.date }),
      };
    }
  }

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();
  const result: BulkScheduleResult = {
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };

  // Fetch beauty page's slot interval to snapshot for new working days
  const { data: beautyPageSettings } = await supabase
    .from("beauty_pages")
    .select("slot_interval_minutes")
    .eq("id", input.beautyPageId)
    .single();

  const slotInterval = beautyPageSettings?.slot_interval_minutes ?? 30;

  // ============================================================================
  // Handle Deletions First
  // ============================================================================

  if (validation.data.toDelete.length > 0) {
    // Check for appointments on days to be deleted
    const { data: workingDaysToDelete } = await supabase
      .from("working_days")
      .select("id, date")
      .eq("beauty_page_id", input.beautyPageId)
      .in("id", validation.data.toDelete);

    if (workingDaysToDelete && workingDaysToDelete.length > 0) {
      const datesToDelete = workingDaysToDelete.map((wd) => wd.date);

      // Check for active appointments on these dates
      const { data: appointmentsOnDates } = await supabase
        .from("appointments")
        .select("date")
        .eq("beauty_page_id", input.beautyPageId)
        .in("date", datesToDelete)
        .neq("status", "cancelled");

      const datesWithAppointments = new Set(
        appointmentsOnDates?.map((a) => a.date) ?? [],
      );

      // Filter out days with appointments and track errors
      const safeToDeleteIds: string[] = [];
      for (const wd of workingDaysToDelete) {
        if (datesWithAppointments.has(wd.date)) {
          result.errors.push({
            date: wd.date,
            error: t("errors.has_appointments"),
          });
        } else {
          safeToDeleteIds.push(wd.id);
        }
      }

      // Delete safe working days
      if (safeToDeleteIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("working_days")
          .delete()
          .eq("beauty_page_id", input.beautyPageId)
          .in("id", safeToDeleteIds);

        if (deleteError) {
          console.error("Error deleting working days:", deleteError);
        } else {
          result.deleted = safeToDeleteIds.length;
        }
      }
    }
  }

  // ============================================================================
  // Handle Updates
  // ============================================================================

  for (const item of validation.data.toUpdate) {
    const { error: updateError } = await supabase
      .from("working_days")
      .update({
        start_time: `${item.startTime}:00`,
        end_time: `${item.endTime}:00`,
      })
      .eq("id", item.id)
      .eq("beauty_page_id", input.beautyPageId);

    if (updateError) {
      console.error("Error updating working day:", updateError);
      result.errors.push({
        date: item.date,
        error: t("errors.update_failed"),
      });
    } else {
      result.updated++;
    }
  }

  // ============================================================================
  // Handle Creates
  // ============================================================================

  if (validation.data.toCreate.length > 0) {
    // Pre-check: Filter out dates that already have working days
    // This handles race conditions where working days were created after dialog opened
    const datesToCreate = validation.data.toCreate.map((item) => item.date);
    const { data: existingDays } = await supabase
      .from("working_days")
      .select("date")
      .eq("beauty_page_id", input.beautyPageId)
      .in("date", datesToCreate);

    const existingDatesSet = new Set(existingDays?.map((d) => d.date) ?? []);

    // Filter out already existing dates and track them as skipped
    const itemsToInsert = validation.data.toCreate.filter((item) => {
      if (existingDatesSet.has(item.date)) {
        result.errors.push({
          date: item.date,
          error: t("errors.working_day_exists"),
        });
        return false;
      }
      return true;
    });

    if (itemsToInsert.length === 0) {
      // All dates already exist, nothing to create
      revalidatePath(`/${input.nickname}/schedule`);
      revalidatePath(`/${input.nickname}/appointments`);
      return { success: true, data: result };
    }

    const insertData = itemsToInsert.map((item) => ({
      beauty_page_id: input.beautyPageId,
      date: item.date,
      start_time: `${item.startTime}:00`,
      end_time: `${item.endTime}:00`,
      slot_interval_minutes: slotInterval,
    }));

    const { error: insertError, data: insertedData } = await supabase
      .from("working_days")
      .insert(insertData)
      .select("id, date");

    if (insertError) {
      console.error("Error creating working days:", insertError);
      // If bulk insert fails, try individual inserts to identify specific failures
      for (const item of itemsToInsert) {
        const { error: singleError, data: singleData } = await supabase
          .from("working_days")
          .insert({
            beauty_page_id: input.beautyPageId,
            date: item.date,
            start_time: `${item.startTime}:00`,
            end_time: `${item.endTime}:00`,
            slot_interval_minutes: slotInterval,
          })
          .select("id")
          .single();

        if (singleError) {
          result.errors.push({
            date: item.date,
            error: t("errors.create_failed"),
          });
        } else {
          result.created++;
          // Insert breaks for this working day
          if (item.breaks && item.breaks.length > 0 && singleData) {
            const breaksToInsert = item.breaks.map((brk) => ({
              working_day_id: singleData.id,
              start_time: `${brk.startTime}:00`,
              end_time: `${brk.endTime}:00`,
            }));

            const { error: breakError } = await supabase
              .from("working_day_breaks")
              .insert(breaksToInsert);

            if (breakError) {
              console.error("Error inserting breaks:", breakError);
            }
          }
        }
      }
    } else {
      result.created = insertedData?.length ?? itemsToInsert.length;

      // Insert breaks for all created working days
      if (insertedData) {
        // Create a map of date -> working_day_id
        const dateToIdMap = new Map<string, string>();
        for (const wd of insertedData) {
          dateToIdMap.set(wd.date, wd.id);
        }

        // Collect all breaks to insert
        const allBreaksToInsert: Array<{
          working_day_id: string;
          start_time: string;
          end_time: string;
        }> = [];

        for (const item of itemsToInsert) {
          const workingDayId = dateToIdMap.get(item.date);
          if (workingDayId && item.breaks && item.breaks.length > 0) {
            for (const brk of item.breaks) {
              allBreaksToInsert.push({
                working_day_id: workingDayId,
                start_time: `${brk.startTime}:00`,
                end_time: `${brk.endTime}:00`,
              });
            }
          }
        }

        // Bulk insert all breaks
        if (allBreaksToInsert.length > 0) {
          const { error: breaksError } = await supabase
            .from("working_day_breaks")
            .insert(allBreaksToInsert);

          if (breaksError) {
            console.error("Error inserting breaks:", breaksError);
            // Note: working days are already created, we just failed on breaks
          }
        }
      }
    }
  }

  // Revalidate both schedule and appointments pages
  revalidatePath(`/${input.nickname}/schedule`);
  revalidatePath(`/${input.nickname}/appointments`);

  return { success: true, data: result };
}

// ============================================================================
// Day Off with Appointment Changes (Atomic Operation)
// ============================================================================

/** Change to apply to an appointment when marking day off */
export interface AppointmentChange {
  appointmentId: string;
  action: "reschedule" | "cancel";
  newDate?: string;
  newStartTime?: string;
  newEndTime?: string;
  cancelReason?: string;
}

/**
 * Mark a day as day off with batched appointment changes (atomic via RPC)
 *
 * This function handles everything in a single database transaction:
 * 1. Validates all reschedule targets for conflicts
 * 2. Reschedules specified appointments to new dates/times
 * 3. Cancels specified appointments
 * 4. Deletes the working day
 *
 * If any operation fails, the entire transaction rolls back.
 */
export async function markDayOffWithChanges(input: {
  workingDayId: string;
  beautyPageId: string;
  nickname: string;
  changes: AppointmentChange[];
}): Promise<ActionResult<{ rescheduled: number; cancelled: number }>> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Call RPC - everything happens in single transaction
  const { data, error } = await supabase.rpc("mark_day_as_off", {
    p_working_day_id: input.workingDayId,
    p_beauty_page_id: input.beautyPageId,
    p_user_id: authorization.userId,
    p_changes: input.changes,
  });

  if (error) {
    console.error("Error calling mark_day_as_off RPC:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  // RPC returns JSONB with success/error fields
  if (!data.success) {
    console.error("mark_day_as_off RPC returned error:", data.error);
    return { success: false, error: data.error || t("errors.update_failed") };
  }

  // Revalidate paths
  revalidatePath(`/${input.nickname}/appointments`);
  revalidatePath(`/${input.nickname}/schedule`);

  return {
    success: true,
    data: {
      rescheduled: data.rescheduled ?? 0,
      cancelled: data.cancelled ?? 0,
    },
  };
}

// ============================================================================
// Break Management
// ============================================================================

/**
 * End a break early by setting completed_at to the current timestamp
 *
 * This allows specialists to skip the remainder of their break and
 * become available for the next appointment immediately.
 *
 * The original end_time is preserved for analytics (scheduled vs actual duration).
 */
export async function endBreakEarly(input: {
  breakId: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Check authorization
  const authorization = await verifyCanManageSchedule(input.beautyPageId);
  if (!authorization.authorized) {
    return { success: false, error: authorization.error };
  }

  const supabase = await createClient();

  // Get the break to verify it exists and belongs to this beauty page
  const { data: breakData } = await supabase
    .from("working_day_breaks")
    .select(
      "id, working_day_id, start_time, end_time, completed_at, working_days!inner(beauty_page_id)",
    )
    .eq("id", input.breakId)
    .single();

  if (!breakData) {
    return { success: false, error: t("errors.not_found") };
  }

  // Verify the break belongs to this beauty page
  // The !inner join returns an object (not array) when using .single()
  const workingDay = breakData.working_days as unknown as {
    beauty_page_id: string;
  };
  if (workingDay.beauty_page_id !== input.beautyPageId) {
    return { success: false, error: t("errors.not_authorized") };
  }

  // Check if break was already ended early
  if (breakData.completed_at) {
    return { success: false, error: t("errors.break_already_completed") };
  }

  // Get current time in HH:MM:SS format for comparison
  const now = new Date();
  const currentTimeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:00`;

  // Verify we're currently within this break
  if (
    currentTimeStr < breakData.start_time ||
    currentTimeStr >= breakData.end_time
  ) {
    return { success: false, error: t("errors.break_not_active") };
  }

  // Set completed_at to mark break as ended early
  const { error } = await supabase
    .from("working_day_breaks")
    .update({ completed_at: now.toISOString() })
    .eq("id", input.breakId);

  if (error) {
    console.error("Error ending break early:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/appointments`);

  return { success: true };
}

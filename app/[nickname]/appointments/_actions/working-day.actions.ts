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

  // Create working day
  const { data, error } = await supabase
    .from("working_days")
    .insert({
      beauty_page_id: input.beautyPageId,
      date: validation.data.date,
      start_time: `${validation.data.startTime}:00`,
      end_time: `${validation.data.endTime}:00`,
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
 */
export async function deleteWorkingDay(input: {
  id: string;
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

  // Check for appointments on this day
  const { data: workingDay } = await supabase
    .from("working_days")
    .select("date")
    .eq("id", input.id)
    .eq("beauty_page_id", input.beautyPageId)
    .single();

  if (!workingDay) {
    return { success: false, error: t("errors.not_found") };
  }

  const { count: appointmentCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("beauty_page_id", input.beautyPageId)
    .eq("date", workingDay.date)
    .neq("status", "cancelled");

  if (appointmentCount && appointmentCount > 0) {
    return { success: false, error: t("errors.has_appointments") };
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

  return { success: true };
}

// ============================================================================
// Bulk Operations
// ============================================================================

const bulkScheduleSchema = z.object({
  toCreate: z.array(
    z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
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
  toCreate: Array<{ date: string; startTime: string; endTime: string }>;
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
    const insertData = validation.data.toCreate.map((item) => ({
      beauty_page_id: input.beautyPageId,
      date: item.date,
      start_time: `${item.startTime}:00`,
      end_time: `${item.endTime}:00`,
    }));

    const { error: insertError, data: insertedData } = await supabase
      .from("working_days")
      .insert(insertData)
      .select("id");

    if (insertError) {
      console.error("Error creating working days:", insertError);
      // If bulk insert fails, try individual inserts to identify specific failures
      for (const item of validation.data.toCreate) {
        const { error: singleError } = await supabase
          .from("working_days")
          .insert({
            beauty_page_id: input.beautyPageId,
            date: item.date,
            start_time: `${item.startTime}:00`,
            end_time: `${item.endTime}:00`,
          });

        if (singleError) {
          result.errors.push({
            date: item.date,
            error: t("errors.create_failed"),
          });
        } else {
          result.created++;
        }
      }
    } else {
      result.created = insertedData?.length ?? validation.data.toCreate.length;
    }
  }

  // Revalidate both schedule and appointments pages
  revalidatePath(`/${input.nickname}/schedule`);
  revalidatePath(`/${input.nickname}/appointments`);

  return { success: true, data: result };
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
    .select("id, working_day_id, start_time, end_time, completed_at, working_days!inner(beauty_page_id)")
    .eq("id", input.breakId)
    .single();

  if (!breakData) {
    return { success: false, error: t("errors.not_found") };
  }

  // Verify the break belongs to this beauty page
  // The !inner join returns an object (not array) when using .single()
  const workingDay = breakData.working_days as unknown as { beauty_page_id: string };
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
  if (currentTimeStr < breakData.start_time || currentTimeStr >= breakData.end_time) {
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

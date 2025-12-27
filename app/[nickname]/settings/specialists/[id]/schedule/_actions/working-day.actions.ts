"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  getEffectiveHoursForDate,
  normalizeTime,
} from "@/lib/queries/business-hours";
import { createClient } from "@/lib/supabase/server";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

type AuthorizationResult =
  | { authorized: true; userId: string }
  | { authorized: false; error: string };

/**
 * Verify user can manage schedule for a specialist
 * User must be owner or admin of the beauty page
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

  // Check if user is admin
  const { data: member } = await supabase
    .from("beauty_page_members")
    .select("roles")
    .eq("beauty_page_id", beautyPageId)
    .eq("user_id", user.id)
    .single();

  if (member?.roles?.includes("admin")) {
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
 * Create a working day for a specialist
 */
export async function createWorkingDay(input: {
  specialistId: string;
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

  // Validate against business hours
  const effectiveHours = await getEffectiveHoursForDate(
    input.beautyPageId,
    validation.data.date,
  );

  if (!effectiveHours.isOpen) {
    return { success: false, error: t("errors.salon_closed_this_day") };
  }

  const businessOpen = normalizeTime(effectiveHours.openTime);
  const businessClose = normalizeTime(effectiveHours.closeTime);

  if (businessOpen && validation.data.startTime < businessOpen) {
    return {
      success: false,
      error: t("errors.hours_outside_business_hours", {
        open: businessOpen ?? "",
        close: businessClose ?? "",
      }),
    };
  }

  if (businessClose && validation.data.endTime > businessClose) {
    return {
      success: false,
      error: t("errors.hours_outside_business_hours", {
        open: businessOpen ?? "",
        close: businessClose ?? "",
      }),
    };
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
    .eq("specialist_id", input.specialistId)
    .eq("date", validation.data.date)
    .maybeSingle();

  if (existing) {
    return { success: false, error: t("errors.working_day_exists") };
  }

  // Create working day
  const { data, error } = await supabase
    .from("working_days")
    .insert({
      specialist_id: input.specialistId,
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

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true, data: { id: data.id } };
}

/**
 * Update a working day
 */
export async function updateWorkingDay(input: {
  id: string;
  specialistId: string;
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
    .eq("specialist_id", input.specialistId)
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

  // Validate against business hours
  const effectiveHours = await getEffectiveHoursForDate(
    input.beautyPageId,
    current.date,
  );

  if (!effectiveHours.isOpen) {
    return { success: false, error: t("errors.salon_closed_this_day") };
  }

  const businessOpen = normalizeTime(effectiveHours.openTime);
  const businessClose = normalizeTime(effectiveHours.closeTime);
  const normalizedStartTime = normalizeTime(newStartTime);
  const normalizedEndTime = normalizeTime(newEndTime);

  if (
    businessOpen &&
    normalizedStartTime &&
    normalizedStartTime < businessOpen
  ) {
    return {
      success: false,
      error: t("errors.hours_outside_business_hours", {
        open: businessOpen ?? "",
        close: businessClose ?? "",
      }),
    };
  }

  if (businessClose && normalizedEndTime && normalizedEndTime > businessClose) {
    return {
      success: false,
      error: t("errors.hours_outside_business_hours", {
        open: businessOpen ?? "",
        close: businessClose ?? "",
      }),
    };
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
    .eq("specialist_id", input.specialistId);

  if (error) {
    console.error("Error updating working day:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}

/**
 * Delete a working day (cascades breaks)
 */
export async function deleteWorkingDay(input: {
  id: string;
  specialistId: string;
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
    .eq("specialist_id", input.specialistId)
    .single();

  if (!workingDay) {
    return { success: false, error: t("errors.not_found") };
  }

  const { count: appointmentCount } = await supabase
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("specialist_id", input.specialistId)
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
    .eq("specialist_id", input.specialistId);

  if (error) {
    console.error("Error deleting working day:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}

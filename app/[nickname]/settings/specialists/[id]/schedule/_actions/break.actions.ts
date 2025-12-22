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
 * Verify user can manage schedule for a specialist
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

  const { data: beautyPage } = await supabase
    .from("beauty_pages")
    .select("owner_id")
    .eq("id", beautyPageId)
    .single();

  if (beautyPage?.owner_id === user.id) {
    return { authorized: true, userId: user.id };
  }

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
const createBreakSchema = z.object({
  workingDayId: z.string().uuid(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
});

const updateBreakSchema = z.object({
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
 * Create a break within a working day
 */
export async function createBreak(input: {
  workingDayId: string;
  beautyPageId: string;
  nickname: string;
  startTime: string;
  endTime: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = createBreakSchema.safeParse({
    workingDayId: input.workingDayId,
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

  // Get working day to validate break is within working hours
  const { data: workingDay } = await supabase
    .from("working_days")
    .select("start_time, end_time")
    .eq("id", input.workingDayId)
    .single();

  if (!workingDay) {
    return { success: false, error: t("errors.working_day_not_found") };
  }

  const breakStart = `${validation.data.startTime}:00`;
  const breakEnd = `${validation.data.endTime}:00`;

  // Validate break is within working hours
  if (breakStart < workingDay.start_time || breakEnd > workingDay.end_time) {
    return { success: false, error: t("errors.break_outside_hours") };
  }

  // Check for overlapping breaks
  const { data: existingBreaks } = await supabase
    .from("working_day_breaks")
    .select("start_time, end_time")
    .eq("working_day_id", input.workingDayId);

  const hasOverlap = existingBreaks?.some((brk) => {
    return breakStart < brk.end_time && breakEnd > brk.start_time;
  });

  if (hasOverlap) {
    return { success: false, error: t("errors.break_overlap") };
  }

  // Create break
  const { data, error } = await supabase
    .from("working_day_breaks")
    .insert({
      working_day_id: input.workingDayId,
      start_time: breakStart,
      end_time: breakEnd,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating break:", error);
    return { success: false, error: t("errors.create_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true, data: { id: data.id } };
}

/**
 * Update a break
 */
export async function updateBreak(input: {
  id: string;
  workingDayId: string;
  beautyPageId: string;
  nickname: string;
  startTime?: string;
  endTime?: string;
}): Promise<ActionResult> {
  const t = await getTranslations("schedule");

  // Validate input
  const validation = updateBreakSchema.safeParse({
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

  // Get current break and working day
  const { data: currentBreak } = await supabase
    .from("working_day_breaks")
    .select("start_time, end_time")
    .eq("id", input.id)
    .eq("working_day_id", input.workingDayId)
    .single();

  if (!currentBreak) {
    return { success: false, error: t("errors.not_found") };
  }

  const { data: workingDay } = await supabase
    .from("working_days")
    .select("start_time, end_time")
    .eq("id", input.workingDayId)
    .single();

  if (!workingDay) {
    return { success: false, error: t("errors.working_day_not_found") };
  }

  const newStartTime = input.startTime
    ? `${input.startTime}:00`
    : currentBreak.start_time;
  const newEndTime = input.endTime
    ? `${input.endTime}:00`
    : currentBreak.end_time;

  // Validate time order
  if (newStartTime >= newEndTime) {
    return { success: false, error: t("errors.invalid_time_range") };
  }

  // Validate within working hours
  if (
    newStartTime < workingDay.start_time ||
    newEndTime > workingDay.end_time
  ) {
    return { success: false, error: t("errors.break_outside_hours") };
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
    return { success: true };
  }

  const { error } = await supabase
    .from("working_day_breaks")
    .update(updateData)
    .eq("id", input.id)
    .eq("working_day_id", input.workingDayId);

  if (error) {
    console.error("Error updating break:", error);
    return { success: false, error: t("errors.update_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}

/**
 * Delete a break
 */
export async function deleteBreak(input: {
  id: string;
  workingDayId: string;
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

  const { error } = await supabase
    .from("working_day_breaks")
    .delete()
    .eq("id", input.id)
    .eq("working_day_id", input.workingDayId);

  if (error) {
    console.error("Error deleting break:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/specialists`);

  return { success: true };
}

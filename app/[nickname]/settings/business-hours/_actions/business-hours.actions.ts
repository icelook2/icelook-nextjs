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
 * Verify user can manage business hours for a beauty page
 * User must be owner or admin
 */
async function verifyCanManageBusinessHours(
  beautyPageId: string,
): Promise<AuthorizationResult> {
  const supabase = await createClient();
  const t = await getTranslations("business_hours");

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
const dayHoursSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  isOpen: z.boolean(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
});

const updateBusinessHoursSchema = z.array(dayHoursSchema).length(7);

const specialHoursSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  name: z.string().max(100).optional(),
  isOpen: z.boolean(),
  openTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  closeTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

/**
 * Update all 7 days of regular business hours (upsert pattern)
 */
export async function updateBusinessHours(input: {
  beautyPageId: string;
  nickname: string;
  hours: Array<{
    dayOfWeek: number;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }>;
}): Promise<ActionResult> {
  const t = await getTranslations("business_hours");

  // Validate input
  const validation = updateBusinessHoursSchema.safeParse(input.hours);

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Authorize
  const auth = await verifyCanManageBusinessHours(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  // Validate time ranges for open days
  for (const day of validation.data) {
    if (day.isOpen && day.openTime >= day.closeTime) {
      return { success: false, error: t("errors.invalid_time_range") };
    }
  }

  const supabase = await createClient();

  // Upsert all 7 days
  const records = validation.data.map((day) => ({
    beauty_page_id: input.beautyPageId,
    day_of_week: day.dayOfWeek,
    is_open: day.isOpen,
    open_time: `${day.openTime}:00`,
    close_time: `${day.closeTime}:00`,
  }));

  const { error } = await supabase
    .from("beauty_page_business_hours")
    .upsert(records, {
      onConflict: "beauty_page_id,day_of_week",
    });

  if (error) {
    console.error("Error updating business hours:", error);
    return { success: false, error: t("errors.save_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/business-hours`);

  return { success: true };
}

/**
 * Create special hours for a specific date (holiday/exception)
 */
export async function createSpecialHours(input: {
  beautyPageId: string;
  nickname: string;
  date: string;
  name?: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("business_hours");

  // Validate input
  const validation = specialHoursSchema.safeParse({
    date: input.date,
    name: input.name,
    isOpen: input.isOpen,
    openTime: input.openTime,
    closeTime: input.closeTime,
  });

  if (!validation.success) {
    return { success: false, error: t("errors.validation_failed") };
  }

  // Authorize
  const auth = await verifyCanManageBusinessHours(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  // If open, times are required and must be valid
  if (validation.data.isOpen) {
    if (!validation.data.openTime || !validation.data.closeTime) {
      return { success: false, error: t("errors.times_required_when_open") };
    }
    if (validation.data.openTime >= validation.data.closeTime) {
      return { success: false, error: t("errors.invalid_time_range") };
    }
  }

  const supabase = await createClient();

  // Check if date already exists
  const { data: existing } = await supabase
    .from("beauty_page_special_hours")
    .select("id")
    .eq("beauty_page_id", input.beautyPageId)
    .eq("date", validation.data.date)
    .single();

  if (existing) {
    return { success: false, error: t("errors.date_already_exists") };
  }

  // Create record
  const { data, error } = await supabase
    .from("beauty_page_special_hours")
    .insert({
      beauty_page_id: input.beautyPageId,
      date: validation.data.date,
      name: validation.data.name || null,
      is_open: validation.data.isOpen,
      open_time: validation.data.openTime
        ? `${validation.data.openTime}:00`
        : null,
      close_time: validation.data.closeTime
        ? `${validation.data.closeTime}:00`
        : null,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating special hours:", error);
    return { success: false, error: t("errors.save_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/business-hours`);

  return { success: true, data: { id: data.id } };
}

/**
 * Update special hours for a specific date
 */
export async function updateSpecialHours(input: {
  id: string;
  beautyPageId: string;
  nickname: string;
  name?: string;
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
}): Promise<ActionResult> {
  const t = await getTranslations("business_hours");

  // Authorize
  const auth = await verifyCanManageBusinessHours(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  // If open, times are required and must be valid
  if (input.isOpen) {
    if (!input.openTime || !input.closeTime) {
      return { success: false, error: t("errors.times_required_when_open") };
    }
    if (input.openTime >= input.closeTime) {
      return { success: false, error: t("errors.invalid_time_range") };
    }
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("beauty_page_special_hours")
    .update({
      name: input.name || null,
      is_open: input.isOpen,
      open_time: input.openTime ? `${input.openTime}:00` : null,
      close_time: input.closeTime ? `${input.closeTime}:00` : null,
    })
    .eq("id", input.id)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error updating special hours:", error);
    return { success: false, error: t("errors.save_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/business-hours`);

  return { success: true };
}

/**
 * Delete special hours
 */
export async function deleteSpecialHours(input: {
  id: string;
  beautyPageId: string;
  nickname: string;
}): Promise<ActionResult> {
  const t = await getTranslations("business_hours");

  // Authorize
  const auth = await verifyCanManageBusinessHours(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("beauty_page_special_hours")
    .delete()
    .eq("id", input.id)
    .eq("beauty_page_id", input.beautyPageId);

  if (error) {
    console.error("Error deleting special hours:", error);
    return { success: false, error: t("errors.delete_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/business-hours`);

  return { success: true };
}

/**
 * Update beauty page timezone
 */
export async function updateTimezone(input: {
  beautyPageId: string;
  nickname: string;
  timezone: string;
}): Promise<ActionResult> {
  const t = await getTranslations("business_hours");

  // Authorize
  const auth = await verifyCanManageBusinessHours(input.beautyPageId);
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("beauty_pages")
    .update({ timezone: input.timezone })
    .eq("id", input.beautyPageId);

  if (error) {
    console.error("Error updating timezone:", error);
    return { success: false, error: t("errors.save_failed") };
  }

  revalidatePath(`/${input.nickname}/settings/business-hours`);

  return { success: true };
}
